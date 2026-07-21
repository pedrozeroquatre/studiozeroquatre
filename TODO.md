# À faire — Studio Zeroquatre

État au 21/07/2026. Le site est complet et poussé sur `main` (vitrine, portail, paiement Stripe, emails). **Les emails des formulaires fonctionnent en prod. Le flux Stripe est validé de bout en bout en mode test.** Il reste surtout le **passage de Stripe en live**, le **déploiement** et la **persistance des commandes**.

---

## 1. Stripe — configuration 🔑
Le code est prêt ([checkout](app/api/portal/checkout/route.js), [webhook](app/api/stripe/webhook/route.js), [lib/stripe.js](lib/stripe.js)). **Note : seules 2 clés sont utilisées — `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`. La publishable key n'est PAS utilisée** (checkout hébergé, redirection via `session.url`).

**Mode test — ✅ FAIT et validé en local**
- [x] Compte Stripe créé, mode **test**, clé `sk_test` dans `.env.local`
- [x] Webhook local via Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) → `STRIPE_WEBHOOK_SECRET` du CLI dans `.env.local`
- [x] **Paiement de bout en bout testé** : checkout → carte `4242` → écran de confirmation + référence → webhook **200** → **email reçu** dans `contact@`

**Passage en LIVE (sur le site déployé) — à faire**
- [ ] Stripe en **Live mode** → récupérer la clé `sk_live_…`
- [ ] Créer un **webhook live** dans le dashboard : URL `https://DOMAINE/api/stripe/webhook`, event `checkout.session.completed` → récupérer son `whsec_…` live
- [ ] Poser `STRIPE_SECRET_KEY` (live) + `STRIPE_WEBHOOK_SECRET` (live) **sur l'hébergeur**, puis redéployer
- [ ] Faire un vrai petit paiement de validation, puis le rembourser depuis Stripe
- [ ] Laisser `.env.local` inchangé (clés test + secret CLI = OK pour le dev local)

## 2. Emails des formulaires ✅ FAIT
**Approche : SMTP Private Email, zéro Resend, zéro DNS.** Le serveur envoie via le SMTP de la boîte `contact@studiozeroquatre.com` (Namecheap Private Email) et s'envoie les notifs à lui-même. Private Email gère déjà SPF/DKIM. Le `replyTo` porte l'email du visiteur → réponse en un clic. Nom d'expéditeur = le visiteur, corps en HTML formaté. Tout passe par [lib/mailer.js](lib/mailer.js) (`sendMail`), utilisé par les 3 routes (contact, devis, webhook Stripe).

- [x] (code) Supprimer Resend, créer `lib/mailer.js` (nodemailer + Private Email SMTP)
- [x] (code) Basculer les 3 routes sur `sendMail` + gabarit HTML + nom d'expéditeur = visiteur
- [x] Ajouter `SMTP_USER` + `SMTP_PASSWORD` dans `.env.local` (host/port par défaut = `mail.privateemail.com` / `465`)
- [x] **Réception confirmée** en local (contact + devis multi-articles) dans la boîte `contact@`
- [x] Reporter `SMTP_USER` + `SMTP_PASSWORD` dans les variables d'env de l'hébergeur

## 3. Persistance des commandes 📦
Aujourd'hui une commande payée déclenche seulement un **email**. Objectif : email + Google Sheets + Supabase. Tout doit se brancher dans le **webhook Stripe** (seul point où le paiement est confirmé), pas dans `orders/route.js`.

- [x] Email de confirmation (déjà fait dans le webhook)
- [ ] **Google Sheets** : `npm install googleapis`, créer `lib/sheets.js` (`appendRow`), appel dans le webhook. Env : `GOOGLE_SERVICE_ACCOUNT_KEY`, `SPREADSHEET_ID`. Stub de référence dans [orders/route.js:41](app/api/orders/route.js#L41)
- [ ] **Supabase** : créer `lib/supabase.js`, table `orders`, insertion dans le webhook. Env déjà réservées (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] **Migrer « Refaire ma dernière commande » vers Supabase** : aujourd'hui l'historique est en **localStorage** ([lib/lastOrder.js](lib/lastOrder.js)), donc par appareil. Quand le client fournira l'historique réel, remplacer `getLastOrder`/`saveLastOrder` par des lectures/écritures serveur (alimentées par le webhook). L'UI du Dashboard ne dépend que de ces 2 fonctions.

## 3bis. Espace client — commande rapide ✅ FAIT
Ergonomie pour recommander vite (formats déjà visibles, quantités en quelques clics).

- [x] Navbar du portail refaite pleine largeur, alignée sur le site, palette sombre conservée ([PortalNav.js](components/portal/PortalNav.js))
- [x] **« Même quantité partout »** : puces 500/1000/2000 + champ libre → remplit tous les formats
- [x] **Puces rapides par ligne** (500/1000/2000) sur chaque format
- [x] **« Recommander »** : bandeau qui recharge la dernière commande en un clic (localStorage pour l'instant, cf. §3)

## 4. Déploiement 🚀
Tout est commité et poussé sur `main` (emails, devis 4 produits, Stripe, produits best-sellers, menu). Le build de prod passe.

- [x] Commiter + pousser l'intégration Stripe, les emails et les 4 produits sur `main`
- [ ] Déployer (Vercel recommandé)
- [x] Variables SMTP sur l'hébergeur (`SMTP_USER`, `SMTP_PASSWORD`)
- [ ] Ajouter le reste des variables d'env sur l'hébergeur : clés Stripe (§1), puis Google/Supabase (§3)
- [ ] Repointer l'URL du webhook Stripe vers le domaine de prod
- [ ] (optionnel) Brancher les assets non utilisés si besoin : `LOGOGO.svg`, `product_53→56`

---

### Notes
- `orders/route.js` (formulaire devis) envoie un email mais **n'a rien à voir** avec les commandes payées du portail — ne pas confondre les deux flux.
- Les prix ne transitent jamais depuis le navigateur : ils sont recalculés côté serveur depuis [lib/clients.js](lib/clients.js). Garder cette règle.
