# À faire avant d'ouvrir le paiement

État au 17/09/2026. Le site est en ligne, l'espace client fonctionne, Stripe
tourne en **mode test**. Cette liste est ce qui sépare « ça marche » de « on
peut encaisser sans se faire prendre en défaut ».

Elle remplace la section 5 de [TODO.md](TODO.md), qui sous-estimait le légal et
ignorait le point 1.

---

## 1. Fermer l'ancien portail `/portal` ✅ fait le 17/09/2026

Le trou le plus sérieux, et il n'était dans aucune liste.

[app/api/portal/login/route.js](app/api/portal/login/route.js) authentifie sur
un code en dur de [lib/clients.js](lib/clients.js), et ces codes sont le nom du
restaurant en majuscules. N'importe qui les devine. Une fois entré,
[app/api/portal/orders/route.js](app/api/portal/orders/route.js) rend
l'historique de commandes et les volumes du restaurant, et le checkout laisse
payer en son nom. Aucune limite de tentatives.

La page n'est plus liée dans la navigation — mais l'URL répond toujours.
Non listé n'est pas fermé.

Enjeu : des données commerciales de clients professionnels accessibles avec un
mot devinable, c'est une violation de données au sens du RGPD, notifiable à
l'APD sous 72 h.

Vérifié en production le 17/09 : `/portal` rend `307 → /espace`, et les quatre
routes d'API supprimées rendent `404`. `/espace` et les pages publiques sont
intactes.

- [x] `/portal` redirige vers `/espace`
- [x] Supprimer `app/portal/`, `app/api/portal/`, `components/portal/Dashboard.js`,
      `components/portal/LoginForm.js`, `lib/clients.js`, `lib/lastOrder.js`
- [x] Supprimer `app/api/stripe/webhook/` (l'ancien webhook du site : il ne
      servait qu'à `/portal`, les paiements de l'espace passent par l'Edge
      Function), et avec lui `lib/orders-store.js` + `lib/supabase.js`
- [x] Garder `components/portal/PortalNav.js` — l'espace s'en sert
- [x] ~~Supprimer l'endpoint webhook correspondant dans le dashboard Stripe~~ —
      sans objet, vérifié le 17/09 : la liste du mode test ne contient que
      l'Edge Function de l'espace. L'ancien webhook du site n'a jamais été
      testé qu'en local via `stripe listen`, et un listener CLI n'est pas un
      endpoint enregistré
- [ ] Vercel → variables d'environnement : retirer `STRIPE_WEBHOOK_SECRET`,
      `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY`,
      `SPREADSHEET_ID`. Garder `STRIPE_SECRET_KEY`, les deux `NEXT_PUBLIC_SUPABASE_*`
      et les `SMTP_*`

## 2. Prouver le cloisonnement client ✅ fait le 17/09/2026

`npm run verifier` (dépôt de l'OS) confirme que la base est verrouillée : 28
tables et vues refusées au visiteur anonyme, inscriptions publiques fermées.

Mais il a un second mode, jamais utilisé : `SZQ_CLIENT_EMAIL` /
`SZQ_CLIENT_PASSWORD` dans le `.env`. C'est la **seule preuve** que le client A
ne voit pas les livraisons du client B. À faire avant d'ouvrir un deuxième
accès.

Le contrôle a été complété ce jour-là : il comparait ce que le client **ne peut
pas** atteindre, jamais ce qu'il voit à travers les vues `portail_*` — qui sont
faites pour lui répondre et auraient répondu aussi bien avec les données d'un
autre. Il compte désormais les lignes lues et les compare à ce que la base
contient pour lui, et il refuse de conclure si la base ne contient les données
que d'un seul client.

- [x] Créer un compte client de test, poser les deux variables, relancer
- [x] Résultat du 17/09 : 0 livraison sur 44, **1 stock sur 10**, 0 document sur
      2, 0 commande sur 4. La ligne des stocks porte les deux moitiés de la
      preuve : il voit la sienne, et seulement la sienne
- [x] 13 tables internes muettes même connecté, écriture dans la liste blanche
      refusée (403), une seule fiche au profil, aucune colonne sensible
- [ ] Le refaire après chaque changement de vue `portail_*` — garder le compte
      de test pour ça

## 3. Filtrer les devis en brouillon 🟠

`portail_mes_documents` ne filtre pas sur `statut` : un devis en cours
d'écriture s'affiche chez le restaurateur, marqué « brouillon ».

- [ ] `and d.statut <> 'brouillon'` dans la vue

## 4. Durcissement 🟠

- [ ] **Limite de débit** sur [/api/contact](app/api/contact/route.js) et
      [/api/orders](app/api/orders/route.js). Aucune aujourd'hui : une boucle
      fait cracher du mail depuis la vraie boîte `contact@`, et un domaine
      blacklisté veut dire que Pedro ne reçoit plus rien. Limite par IP +
      honeypot + longueur maximale sur `message`
- [ ] **En-têtes de sécurité** dans [next.config.mjs](next.config.mjs), vide
      aujourd'hui : HSTS, `X-Content-Type-Options`, `frame-ancestors`,
      `Referrer-Policy`
- [ ] **`success_url`** dans
      [app/api/espace/checkout/route.js](app/api/espace/checkout/route.js) est
      construit depuis l'en-tête `Origin` envoyé par le navigateur : un appelant
      peut faire revenir la page d'après-paiement sur son propre domaine. À
      figer sur une constante
- [ ] Validation d'adresse email dans les deux formulaires

## 5. Stripe en live 🟠

Ce n'est pas qu'une clé à changer.

- [ ] **Redéployer l'Edge Function d'abord.** Une version antérieure lisait
      `amount_total` au lieu de `amount_subtotal` : sans ce redéploiement, 21 %
      de TVA entrent dans `prix_htva` et le chiffre d'affaires est faux dans
      l'OS. Erreur comptable, pas bug d'affichage. Voir les deux ⚠ de
      [NOTES-ESPACE-CLIENT.md](NOTES-ESPACE-CLIENT.md)
- [ ] Stripe en Live mode → clé `sk_live_…`
- [ ] Endpoint webhook live vers **l'Edge Function Supabase**, pas vers le site
      (event `checkout.session.completed`) → son `whsec_…`
- [ ] Les deux clés dans les **secrets Edge Functions** de Supabase
- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est **absente** des variables
      Vercel du site
- [ ] Relire les tarifs clients en base avant d'ouvrir — c'est ce montant qui
      est réellement débité
- [ ] Un vrai petit paiement de validation, remboursé derrière

## 6. Les pages légales 🟡

Aucun lien légal dans [components/layout/Footer.js](components/layout/Footer.js)
aujourd'hui. Il en faut trois.

Bonne nouvelle : les clients sont des restaurants, donc du B2B. Tout le droit de
la consommation (rétractation de 14 jours, garantie légale de 2 ans) ne
s'applique pas. Le risque réel n'est pas le procès d'un client, c'est l'amende
administrative pour mentions manquantes et l'incident RGPD du point 1.

- [ ] **Mentions légales** — obligatoire (Code de droit économique, livre XII) :
      dénomination, forme juridique, siège, n° BCE, n° TVA, email, téléphone,
      hébergeur
- [ ] **Politique de confidentialité** — obligatoire (RGPD art. 13) : données
      collectées (contact, devis, comptes de l'espace), finalités, base légale,
      sous-traitants (Stripe, Supabase, Vercel, Private Email), durées de
      conservation, droits, recours à l'APD
- [ ] **CGV** — pas optionnel dès qu'on encaisse en ligne : prix, délais,
      modalités de paiement, réclamations, loi applicable. Sans écrit, un litige
      de livraison devient parole contre parole
- [ ] **Cookies** — mention simple suffit : pas d'analytics, et le jeton de
      session de l'espace est strictement nécessaire. Pas de bandeau
- [ ] Les trois liens dans le footer
- [ ] Décider FR seul ou FR/EN (le site a un basculement FR/EN)

⚠ La rédaction demande les vraies informations de la société : forme juridique,
siège, n° BCE, n° TVA. Elles ne s'inventent pas.

---

## Ordre

1 → 2 → 3 → 4 → 5 → 6. Le légal en dernier parce qu'il attend les informations
de la société, pas parce qu'il est secondaire.
