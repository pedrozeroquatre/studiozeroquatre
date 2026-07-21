# À faire — Studio Zeroquatre

État au 21/07/2026. Le site est complet et poussé sur `main` (vitrine, portail, paiement Stripe, emails). **Les emails des formulaires fonctionnent en prod.** Il reste surtout la **config Stripe**, le **déploiement** et la **persistance des commandes**.

---

## 1. Stripe — configuration 🔑
Le code est prêt ([checkout](app/api/portal/checkout/route.js), [webhook](app/api/stripe/webhook/route.js), [lib/stripe.js](lib/stripe.js)). Il manque les clés.

- [ ] Créer le compte Stripe (commencer en mode **test**)
- [ ] Récupérer `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `.env.local`
- [ ] Enregistrer le webhook `/api/stripe/webhook` dans le dashboard Stripe
- [ ] Récupérer `STRIPE_WEBHOOK_SECRET` → `.env.local`
- [ ] Tester un paiement de bout en bout (checkout → paiement → email reçu)

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
