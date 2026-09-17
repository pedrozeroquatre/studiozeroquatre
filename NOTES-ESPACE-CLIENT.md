# Espace client — état et ce qu'il te reste à faire

Retour de branchement, en réponse à `PORTAIL-CLIENT.md`. L'espace vit sur
`/espace`. **Aucune politique RLS n'a été modifiée, aucune vue n'a été touchée,
aucune clé de service n'entre dans le site.**

Le code du parcours payant est écrit et compile. Il est **dormant** : il
s'allume dès que la base a les quatre pièces ci-dessous.

---

## À faire, dans l'ordre

### 1. Deux fichiers SQL, dans le SQL Editor

```
supabase/vue-tarif.sql              → portail_mon_tarif
supabase/paiement-et-capacite.sql   → paiement, jours complets, écriture
```

Le second suppose le premier exécuté. Ils sont commentés ligne à ligne ; lis-les
avant de les lancer, ils touchent à `commandes_clients` et créent une fonction
qui écrit dans `livraisons`.

Ce qu'ils ajoutent, et rien d'autre :

| | Quoi | Pourquoi |
|---|---|---|
| `portail_mon_tarif` | vue, une colonne | afficher le prix et calculer le montant |
| `commandes_clients` | `paiement_recu`, `paye_le`, `montant_htva`, `stripe_session_id`, `livraison_id` | il n'existait aucun champ de paiement |
| `portail_mes_commandes` | étendue de 2 colonnes | le client voit sa commande payée. `stripe_session_id` reste invisible |
| `portail_jours_complets` | vue, des dates | griser les jours pleins (4 livraisons) |
| `livraisons` | `heure_livraison` | l'heure demandée par le client. NULL = dans la journée |
| `portail_creneaux_pris` | vue, date + heure | barrer les créneaux déjà réservés |
| `portail_mes_livraisons` | étendue d'1 colonne | le client relit l'heure qu'il a réservée |
| `enregistrer_commande_payee()` | fonction `security definer` | écrit commande + livraison en une transaction |

⚠ Si tu as déjà passé `paiement-et-capacite.sql` avant les créneaux horaires,
**repasse-le en entier** : il est réexécutable, et il remplace
`enregistrer_commande_payee()` par une version qui prend l'heure (l'ancienne est
retirée d'abord, sinon Postgres garderait les deux et l'appel deviendrait
ambigu).

⚠ Le droit d'exécution de `enregistrer_commande_payee()` est **retiré à
`authenticated`**. Si un client pouvait l'appeler, il se marquerait payé sans
payer. Ne le redonne à personne.

### 2. Déployer l'Edge Function

Le fichier est prêt : `supabase/functions/enregistrer-commande-payee/index.ts`.
Copie-le dans le dépôt de l'OS (à côté de `creer-acces-client`) et déploie :

```bash
supabase functions deploy enregistrer-commande-payee --no-verify-jwt
```

`--no-verify-jwt` est nécessaire : l'appelant est Stripe, pas un utilisateur.
L'authentification se fait par la **signature Stripe**, vérifiée dans la
fonction.

Secrets à poser (Edge Functions → Secrets) :

```
STRIPE_SECRET_KEY        sk_test_… puis sk_live_…
STRIPE_WEBHOOK_SECRET    whsec_… du endpoint créé à l'étape 3
```

C'est là que vit la clé de service — fournie automatiquement par Supabase,
jamais dans le site.

### 3. Un endpoint Stripe vers cette fonction

Dashboard Stripe → Webhooks → Add endpoint :

```
URL     https://wnwjdyrnfkskunzafiah.supabase.co/functions/v1/enregistrer-commande-payee
Event   checkout.session.completed
```

Récupère son `whsec_…` et pose-le dans les secrets de l'étape 2.

L'endpoint existant qui pointe vers le site reste en place pour l'ancien
`/portal` : il ignore désormais les paiements de l'espace (`metadata.source`).

### 4. Réglages

- Supabase → Authentication → URL Configuration → ajouter `http://localhost:3000/**`
  aux *Redirect URLs* (la liste a `5173`, l'OS, mais pas `3000`, Next). Sans ça
  aucun lien de mail ne revient sur ton poste.
- Vercel → poser `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (déjà en local, reprises du `.env` de l'OS — même projet).
- **Laisser `SUPABASE_SERVICE_ROLE_KEY` vide** dans ce projet.

### 5. Vérifier

```bash
npm run verifier      # depuis le dépôt de l'OS
```

---

## Comment marche le parcours payant

```
client saisit ses quantités + choisit sa date
        │
        ▼
/api/espace/checkout        ← lit le tarif AVEC LE JETON DU CLIENT (RLS s'applique),
        │                     recalcule le montant, vérifie que le jour n'est pas plein
        ▼
Stripe Checkout             ← le client paie
        │
        ▼
Edge Function               ← vérifie la signature, appelle enregistrer_commande_payee()
        │
        ▼
commandes_clients + livraisons + livraison_lignes   → visible dans l'OS ce jour-là
```

Trois choix que j'ai faits et que tu peux contester :

**Rien n'est écrit avant le paiement.** Tu l'as demandé. `passer_commande()`
n'est donc plus utilisée dans le parcours payant — elle reste le repli quand
aucun tarif n'existe. Conséquence : tu ne vois pas les paniers abandonnés.

**La commande ET la livraison sont créées.** La commande garde la trace de la
demande (le client la voit dans « Vos commandes »), la livraison la place dans
ta tournée. Les deux dans la même transaction : jamais l'une sans l'autre.

**Le montant qui fait foi est celui de Stripe**, pas celui annoncé par le
navigateur. La fonction enregistre `session.amount_subtotal` — le HTVA, parce
que c'est ce qu'attendent `livraisons.prix_htva` et
`commandes_clients.montant_htva` (voir « La TVA » plus bas).

**Écrire dans `livraisons` était dans ta liste « à ne jamais faire ».** Tu as
tranché l'inverse, et la règle protégeait surtout contre une écriture *par le
client* : ici c'est une fonction réservée au service, déclenchée par une
signature Stripe vérifiée. Le client, lui, n'a toujours aucun droit d'écriture.

---

## Ce que j'ai corrigé en lisant ton schéma

J'avais dû prendre trois hypothèses en aveugle. J'ai trouvé
`supabase-portail-clients.sql` et `supabase-complet.sql` dans le dépôt de l'OS,
et **l'une des trois était fausse** :

- ⚠️ **`conso_mensuelle` est en BOÎTES par mois**, pas en paquets — alors que
  `paquets` compte des paquets de 50. Je divisais l'un par l'autre :
  l'autonomie affichée était fausse d'un facteur 50. Corrigé, et aligné sur le
  calcul de l'OS (`stockEtat()` : `paquets × 50 < conso` → « bas »), pour que
  toi et le restaurateur voyiez le même stock au même moment.
- **`etablissement` est le NOM** dans les vues (`e.nom as etablissement`), pas
  l'id. Seul `passer_commande()` reçoit l'uuid, comme sa signature l'exige.
- **Les statuts sont traduits** : « En production », plus `en_production`.

Et un défaut de timing corrigé après ton test : juste après le choix du mot de
passe, PostgREST refusait la première lecture (« JWT issued at future ») parce
que les horloges de l'authentification et de l'API Supabase ne sont pas
alignées à la seconde. Les lectures réessaient maintenant toutes seules. **Les
écritures, non** — rejouer une commande en créerait une deuxième.

---

## Points ouverts, qui te reviennent

### Relire les prix avant d'ouvrir le paiement

`clients.prix` devient le montant réellement débité. Je l'ai lu dans la base
live et il est cohérent (Arte 0,27 · Da Toto 0,27 · Pizza N' Shake 0,26 ·
Bottega, Bros, Volta 0,30 · Vera, Gigi 0,33 · Biga, La Toscana 0,285 ·
Late Night 0,255).

Deux remarques :

- Une ligne « Nouveau client » traîne à **0,20 €**. Si c'est un brouillon, il
  vaut mieux le supprimer avant d'ouvrir le paiement.
- Le fichier `supabase-complet.sql` du dépôt OS contient des prix d'amorçage
  **périmés** (Pizza N' Shake y est à 0,28 alors que la base dit 0,26). Ne
  t'en sers pas comme référence — la base fait foi.

Un seul prix par client, tous formats et tous restaurants confondus : c'est le
modèle, et il correspond à ce que tu factures.

### L'heure de livraison

Choisir une heure est **facultatif**, et doit le rester : sans choix, la
livraison passe dans la journée et `heure_livraison` reste à NULL. C'est le cas
normal, pas une donnée manquante.

Quand le client veut une heure, il choisit dans une liste fermée : créneaux
d'une heure, de 8 h à 18 h (`lib/creneaux.js`). Pas de champ horaire libre —
10h15 et 10h20 passeraient tous les deux le contrôle « créneau libre » alors
que tu ne peux pas faire les deux.

Un créneau réservé est fermé **pour tout le monde**, tous clients confondus. Le
client voit le créneau barré sans jamais savoir à qui il est : la vue
`portail_creneaux_pris` ne rend qu'une date et une heure.

Trois contrôles, du plus lâche au plus sûr :

1. l'espace grise les créneaux pris — confort, rien de plus ;
2. la route de paiement revérifie avant d'ouvrir Stripe, et refuse en 409 ;
3. la fonction SQL regarde une dernière fois, à l'écriture.

Le troisième ne refuse pas : le client a payé, et lever une exception ferait
rejouer Stripe en boucle. Si deux paiements tombent sur le même créneau à
quelques secondes d'écart, la livraison est créée avec l'heure demandée **et une
note interne** « ⚠ Créneau déjà pris — à arbitrer ». Tu la vois dans l'OS, tu
rappelles l'un des deux.

Côté OS, l'heure se lit dans la liste des livraisons et dans le calendrier (les
journées y sont triées par heure), et se règle dans le détail d'une livraison —
même grille de créneaux, pour qu'une heure posée à la main ferme vraiment le
créneau côté espace.

⚠ L'Edge Function passe désormais `p_heure` : **redéploie-la** après le SQL.
`p_heure` a une valeur par défaut, donc l'ancienne version continue d'enregistrer
les commandes entre les deux — simplement sans jamais retenir d'heure.

### La TVA

Le tarif en base (`clients.prix`, `etablissements.prix`) est HTVA, et il le
reste : c'est l'assiette de la facture, et tout l'OS calcule dessus.

Mais le restaurateur ne raisonne pas en HTVA. L'espace **affiche donc du TTC**
partout — prix à la boîte, sous-totaux, total, bouton de paiement, montant des
livraisons passées — avec le HTVA écrit à côté, en petit. Le taux vit dans un
seul endroit, `lib/tva.js`, et vaut 21 % (le défaut de `livraisons.tva_taux`).

Stripe ne reçoit pas des lignes TTC : il reçoit les lignes HTVA et un objet
**TaxRate** à 21 %, qui ajoute la TVA par-dessus. Le client voit ainsi le détail
« sous-total · TVA 21 % · total » sur la page de paiement et sur son reçu, et
la base continue de recevoir du HTVA (`amount_subtotal`).

Le TaxRate est cherché dans ton compte Stripe au premier paiement, et créé s'il
n'existe pas. Si tu préfères en imposer un précis (par exemple un que tu as déjà
créé à la main), pose la variable d'environnement `STRIPE_TAX_RATE_TVA` avec son
id `txr_…`.

⚠ Si l'Edge Function est **déjà déployée**, il faut la redéployer : elle lisait
`amount_total`, qui contient désormais la TVA. Sans ça, 21 % de TVA entreraient
dans `prix_htva` et fausseraient ton chiffre d'affaires.

⚠ Un client soumis à un autre taux (autofacturation, intracommunautaire) n'est
pas prévu : le taux est le même pour tout le monde. Dis-le-moi si un cas se
présente.

### Les brouillons sont visibles par le client

`portail_mes_documents` ne filtre pas sur `statut`, et le vocabulaire est
`brouillon / envoyé / à relancer / signé / refusé / expiré`. Un devis en cours
d'écriture apparaît chez le client, marqué « brouillon ».

Je ne l'ai **pas masqué côté portail** : la donnée partirait quand même dans le
navigateur, ce serait une fausse confidentialité. C'est un
`and d.statut <> 'brouillon'` dans la vue, de ton côté.

### Les messages d'erreur tutoient

`passer_commande()` répond « Précise le restaurant concerné », « ne t'appartient
pas », « Contacte le studio » — écrits pour toi, lus par le restaurateur. Je les
affiche tels quels plutôt que de les réécrire au vol.

### La capacité est écrite dans la vue

`portail_jours_complets` code le 4 en dur (`having count(*) >= 4`). Pour
changer la capacité, change le chiffre et réexécute le bloc. Si tu veux une
capacité variable (par jour de semaine, par période), dis-le, ça change la
forme.

### L'ancien portail `/portal`

Toujours en place, avec ses codes en dur et des prix factices (Pizza N' Shake y
est à 0,0883 € au lieu de 0,28 €). Je ne l'ai pas retiré : c'est là que vivait
l'intégration Stripe que tu voulais garder. Maintenant que `/espace` a la
sienne, dis-moi quand je le fais rediriger.

À supprimer ce jour-là : `lib/clients.js`, `lib/lastOrder.js`,
`/api/portal/*`, `components/portal/Dashboard.js`, `components/portal/LoginForm.js`.
