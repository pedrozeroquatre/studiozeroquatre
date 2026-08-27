# Espace client — ce qu'il faut savoir pour le construire

Document de passation. L'OS (outil interne du studio) est déjà en place et
partage sa base Supabase avec l'espace client. Tout le cloisonnement est fait
côté base : le portail n'a qu'à consommer ce qui suit.

---

## Les deux applications

| | Adresse | Public |
|---|---|---|
| **OS** | `studio-zero-quatre-os.vercel.app` | le studio (Pedro, Adam) |
| **Espace client** | `studiozeroquatre.com` | les restaurateurs |

Même projet Supabase, mêmes comptes d'authentification, deux publics
strictement séparés.

```
URL       https://wnwjdyrnfkskunzafiah.supabase.co
Clé       sb_publishable_…   (« publishable » / anon — publique par conception)
```

La clé publishable n'est pas un secret : la sécurité repose entièrement sur les
politiques RLS. **La clé « secret » / service_role ne doit jamais figurer dans
le code du site.**

---

## La règle absolue

> **Le client n'a AUCUN droit sur les tables. Il ne lit que des vues
> `portail_*`, et n'écrit que par la fonction `passer_commande()`.**

N'ajoute jamais de politique RLS « client » sur une table de base. Si une
donnée manque au portail, on crée ou on étend une vue — jamais un accès direct.

La raison est concrète : `clients.notes` contient des notes commerciales sur le
client lui-même (« cible reconquête », « perdu qualité de boîte »), `clients.prix`
et `clients.plaques` sont les marges du studio, `livraisons.tva_transferee` est
de la comptabilité interne. Un `select *` sur la table, même filtré sur la bonne
ligne, livrerait tout ça.

---

## Qui est connecté

Deux fonctions SQL, appelables en RPC :

- `mon_client_id()` — l'identifiant du client, ou `NULL` si le compte n'est pas
  un compte client (par exemple un compte du studio).
- `mon_etablissement_id()` — le restaurant précis, ou `NULL` pour un compte
  « groupe » qui voit tous les restaurants de son client.

Un client peut exploiter plusieurs restaurants, souvent sous des sociétés
distinctes : Bottega tient Sablon (IPP SRL) et St Gilles (RC LG) ; Pizza N' Shake
tient Ixelles (ASR COMPANY) et Molenbeek (CREE TA CREPE). **Un login par
restaurant** est le cas normal.

Si `mon_client_id()` renvoie `NULL`, toutes les vues sont vides. Le portail doit
afficher un message clair plutôt qu'un écran blanc.

---

## Les vues disponibles

Toutes filtrent automatiquement sur le client **et** le restaurant du compte
connecté. Aucun `where` à écrire côté portail.

| Vue | Colonnes |
|---|---|
| `portail_mon_profil` | `id, nom, etablissement, societe, contacts` |
| `portail_mes_etablissements` | `id, nom, societe` |
| `portail_mes_livraisons` | `id, date_livraison, etablissement, produits, prix_htva, tva_taux, livre, paiement_recu` |
| `portail_mes_lignes_livraison` | `id, livraison_id, taille, quantite` |
| `portail_mes_stocks` | `id, reference, etablissement, paquets, conso_mensuelle` |
| `portail_mes_documents` | `id, type, numero, objet, date_doc, montant, statut, echeance` |
| `portail_mes_commandes` | `id, numero, etablissement, statut, demande_le, souhaitee_le, notes_client` |
| `portail_mes_lignes_commande` | `id, commande_id, reference, quantite` |

`paquets` se compte en paquets de 50 boîtes.

---

## Passer commande

Seule écriture autorisée au client :

```js
const { data, error } = await supabase.rpc("passer_commande", {
  souhaitee: "2026-09-15",              // date souhaitée, ou null
  note: "Réassort mensuel",             // texte libre, ou null
  lignes: [{ reference: "33×33×4", quantite: 4000 }],
  etablissement: null,                  // requis seulement pour un compte groupe
});
```

La fonction impose elle-même le client et le statut : impossible de commander
au nom d'un autre ou de s'auto-confirmer. Un compte rattaché à un restaurant
commande toujours pour celui-là — le paramètre `etablissement` est ignoré.

Elle refuse : une commande sans ligne, plus de 50 lignes, une quantité hors
`[1, 1 000 000]`, plus de 20 commandes en 24 h pour un même restaurant.

Les quatre formats du studio : `26×26×4`, `30×30×4`, `33×33×4`, `36×36×4`.
Les références réellement suivies pour ce restaurant sont dans
`portail_mes_stocks.reference`.

---

## La première chose à construire

**La page d'atterrissage de l'invitation.**

Pedro ouvre un accès depuis l'OS. Le client reçoit un mail expédié par Studio
Zeroquatre (Resend, domaine authentifié) contenant un lien. Ce lien pointe vers
l'espace client — actuellement `https://studiozeroquatre.com/espace`, modifiable
par le secret `URL_ESPACE_CLIENT` de la fonction `creer-acces-client`.

Cette page doit :

1. Récupérer la session depuis les paramètres de l'URL (Supabase place un jeton
   dans le fragment `#access_token=…`). Avec `supabase-js` v2 et
   `detectSessionInUrl: true`, c'est automatique.
2. Demander au client de **choisir son mot de passe** —
   `supabase.auth.updateUser({ password })`.
3. Le rediriger vers son espace.

Aucun mot de passe n'est jamais généré ni transmis : le client choisit le sien.

Prévoir aussi le cas du **lien expiré** (24 h). L'URL contient alors
`#error=access_denied&error_code=otp_expired`. Affiche un message clair invitant
à demander un nouveau lien au studio, plutôt qu'une page cassée.

Et un **« mot de passe oublié »** — `supabase.auth.resetPasswordForEmail(email,
{ redirectTo })`. Ne jamais révéler si l'adresse existe : ce formulaire
permettrait sinon de deviner qui est client.

---

## Réglages Supabase à connaître

`Authentication → URL Configuration` :

```
Site URL        https://studiozeroquatre.com
Redirect URLs   https://studiozeroquatre.com/**
                https://studio-zero-quatre-os.vercel.app/**
                http://localhost:5173/**
```

Les *Redirect URLs* sont une liste blanche : toute adresse absente est ignorée
et Supabase renvoie vers le Site URL. C'est la cause n°1 des atterrissages au
mauvais endroit.

Les inscriptions publiques sont **fermées**. Un compte n'existe que si Pedro
l'a créé depuis l'OS. Ne les rouvre pas.

---

## À ne jamais faire

- Mettre la clé `service_role` dans le code du site.
- Ajouter une politique RLS donnant à un client un accès direct à une table.
- Exposer `clients.notes`, `clients.prix`, `clients.plaques`,
  `livraisons.tva_transferee`, `commandes_clients.notes_internes`.
- Ouvrir les inscriptions publiques.
- Écrire dans `livraisons` depuis le portail : une commande client est une
  `commandes_clients`, que le studio transforme en livraison.

---

## Vérifier le cloisonnement

Le dépôt de l'OS contient `scripts/verifier-securite.mjs`, qui teste qu'un
visiteur anonyme ne lit rien et qu'un compte client ne voit que ses données.
À relancer après toute modification des politiques.
