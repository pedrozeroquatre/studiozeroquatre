# À faire — Studio Zeroquatre

État au 15/07/2026. Le site est quasi complet (vitrine, portail, paiement Stripe, emails). Il reste surtout de la **configuration** et de la **persistance des commandes**.

---

## 1. Stripe — configuration 🔑
Le code est prêt ([checkout](app/api/portal/checkout/route.js), [webhook](app/api/stripe/webhook/route.js), [lib/stripe.js](lib/stripe.js)). Il manque les clés.

- [ ] Créer le compte Stripe (commencer en mode **test**)
- [ ] Récupérer `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `.env.local`
- [ ] Enregistrer le webhook `/api/stripe/webhook` dans le dashboard Stripe
- [ ] Récupérer `STRIPE_WEBHOOK_SECRET` → `.env.local`
- [ ] Tester un paiement de bout en bout (checkout → paiement → email reçu)

## 2. Emails des formulaires 📧
**Approche : SMTP Private Email, zéro Resend, zéro DNS.** Le serveur envoie via le SMTP de la boîte `contact@studiozeroquatre.com` (Namecheap Private Email) et s'envoie les notifs à lui-même. Private Email gère déjà SPF/DKIM. Le `replyTo` porte l'email du visiteur → réponse en un clic. Tout passe par [lib/mailer.js](lib/mailer.js) (`sendMail`), utilisé par les 3 routes (contact, devis, webhook Stripe).

- [x] (code) Supprimer Resend, créer `lib/mailer.js` (nodemailer + Private Email SMTP)
- [x] (code) Basculer les 3 routes sur `sendMail`
- [ ] **Ajouter les identifiants SMTP dans `.env.local`** : `SMTP_USER=contact@studiozeroquatre.com` + `SMTP_PASSWORD=<mot de passe de la boîte>` (host/port par défaut = `mail.privateemail.com` / `465`)
- [ ] Lancer `npm run dev`, remplir le formulaire contact → **confirmer la réception** dans la boîte `contact@`
- [ ] Idem avec le formulaire devis

## 3. Persistance des commandes 📦
Aujourd'hui une commande payée déclenche seulement un **email**. Objectif : email + Google Sheets + Supabase. Tout doit se brancher dans le **webhook Stripe** (seul point où le paiement est confirmé), pas dans `orders/route.js`.

- [x] Email de confirmation (déjà fait dans le webhook)
- [ ] **Google Sheets** : `npm install googleapis`, créer `lib/sheets.js` (`appendRow`), appel dans le webhook. Env : `GOOGLE_SERVICE_ACCOUNT_KEY`, `SPREADSHEET_ID`. Stub de référence dans [orders/route.js:41](app/api/orders/route.js#L41)
- [ ] **Supabase** : créer `lib/supabase.js`, table `orders`, insertion dans le webhook. Env déjà réservées (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)

## 4. Git & déploiement 🚀
Tout le travail Stripe est en local **non commité**.

- [ ] Commiter l'intégration Stripe (`app/api/stripe/`, `app/api/portal/checkout/`, `lib/stripe.js`, modifs Dashboard/portal/clients) + les 4 nouveaux produits
- [ ] Déployer (Vercel recommandé)
- [ ] Configurer **toutes** les variables d'env sur l'hébergeur
- [ ] Repointer l'URL du webhook Stripe vers le domaine de prod

---

### Notes
- `orders/route.js` (formulaire devis) envoie un email mais **n'a rien à voir** avec les commandes payées du portail — ne pas confondre les deux flux.
- Les prix ne transitent jamais depuis le navigateur : ils sont recalculés côté serveur depuis [lib/clients.js](lib/clients.js). Garder cette règle.
