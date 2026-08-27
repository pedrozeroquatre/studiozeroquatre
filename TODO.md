# À faire — Studio Zeroquatre

État au 06/08/2026. Le site est **en ligne sur Vercel** (`studiozeroquatre.com` → `www`, auto-deploy depuis `main`). Vitrine, portail, emails : opérationnels. **Le flux Stripe est validé de bout en bout en mode test uniquement.** Il reste le **passage de Stripe en live**, la **persistance des commandes** et les **pages légales**.

---

## 1. Stripe — configuration 🔑
Le code est prêt ([checkout](app/api/portal/checkout/route.js), [webhook](app/api/stripe/webhook/route.js), [lib/stripe.js](lib/stripe.js)). **Note : seules 2 clés sont utilisées — `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`. La publishable key n'est PAS utilisée** (checkout hébergé, redirection via `session.url`).

**Mode test — ✅ FAIT et validé en local**
- [x] Compte Stripe créé, mode **test**, clé `sk_test` dans `.env.local`
- [x] Webhook local via Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) → `STRIPE_WEBHOOK_SECRET` du CLI dans `.env.local`
- [x] **Paiement de bout en bout testé** : checkout → carte `4242` → écran de confirmation + référence → webhook **200** → **email reçu** dans `contact@`

**Passage en LIVE (sur le site déployé) — à faire**
- [ ] Stripe en **Live mode** → récupérer la clé `sk_live_…`
- [ ] Créer un **webhook live** dans le dashboard : URL `https://www.studiozeroquatre.com/api/stripe/webhook`, event `checkout.session.completed` → récupérer son `whsec_…` live
- [ ] Poser `STRIPE_SECRET_KEY` (live) + `STRIPE_WEBHOOK_SECRET` (live) **sur Vercel**, puis redéployer
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
**Google Sheets abandonné** (06/08) : une seule base, Supabase, partagée entre ce site (qui écrit) et le futur dashboard admin (qui lit).

**Code — ✅ FAIT, dormant tant que les clés ne sont pas posées**
- [x] Email de confirmation (webhook)
- [x] Schéma de la table `orders` → [supabase/schema.sql](supabase/schema.sql)
- [x] [lib/supabase.js](lib/supabase.js) (client service-role) + [lib/orders-store.js](lib/orders-store.js) (écriture/lecture)
- [x] Écriture dans le **webhook Stripe**, idempotente (index unique sur `stripe_session_id` — Stripe rejoue ses events)
- [x] Quantités structurées passées en metadata du checkout (`qty`), pour reconstruire les lignes et figer les prix
- [x] [/api/portal/orders](app/api/portal/orders/route.js) — historique authentifié **par le code d'accès**, pas par `clientId` (devinable)
- [x] Portail : section « Vos commandes » + « Refaire ma dernière commande » alimentés par le serveur, repli localStorage si Supabase absent

**À faire — nécessite tes accès**
- [ ] Créer le projet Supabase, exécuter [supabase/schema.sql](supabase/schema.sql)
- [ ] Poser `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` **et** sur Vercel
- [ ] Importer l'historique du **fichier Numbers** (`source = 'import'`) — format à voir quand le fichier arrive
- [ ] Une fois l'historique en base et vérifié : supprimer [lib/lastOrder.js](lib/lastOrder.js) et son repli dans le Dashboard

**Dashboard admin (autre site)**
- [ ] Lui donner sa **propre auth** Supabase — ne pas partager la service role key de ce projet ; policy RLS de lecture prête (commentée) en fin de `schema.sql`
- [ ] Garder un seul écrivain (le webhook) pour éviter deux sources divergentes

## 3bis. Espace client — commande rapide ✅ FAIT
Ergonomie pour recommander vite (formats déjà visibles, quantités en quelques clics).

- [x] Navbar du portail refaite pleine largeur, alignée sur le site, palette sombre conservée ([PortalNav.js](components/portal/PortalNav.js))
- [x] **« Même quantité partout »** : puces 500/1000/2000 + champ libre → remplit tous les formats
- [x] **Puces rapides par ligne** (500/1000/2000) sur chaque format
- [x] **« Recommander »** : bandeau qui recharge la dernière commande en un clic (localStorage pour l'instant, cf. §3)

## 4. Déploiement ✅ FAIT
Déployé sur **Vercel**, domaine `studiozeroquatre.com` (redirige vers `www`). Chaque push sur `main` redéploie automatiquement — vérifié le 06/08 : un push est en ligne en quelques minutes.

- [x] Commiter + pousser l'intégration Stripe, les emails et les 4 produits sur `main`
- [x] Déployer (Vercel)
- [x] Variables SMTP sur l'hébergeur (`SMTP_USER`, `SMTP_PASSWORD`)
- [ ] Ajouter le reste des variables d'env sur Vercel : clés Stripe live (§1), puis Google/Supabase (§3)
- [ ] Repointer l'URL du webhook Stripe vers `https://www.studiozeroquatre.com/api/stripe/webhook`
- [ ] (optionnel) Brancher les assets non utilisés si besoin : `LOGOGO.svg`, `product_53→56`

## 5. Légal (à faire à la fin) ⚖️
Obligatoire en Belgique dès qu'il y a formulaires + paiement en ligne. Pages à créer dans `app/(site)/` + liens dans le [Footer](components/layout/Footer.js). **Nécessite les vraies infos de l'entreprise** (dénomination, forme juridique, adresse/siège, **n° d'entreprise BCE**, **n° TVA**).

- [ ] **Mentions légales** — obligatoire (Code de droit économique, livre XII) : identité entreprise, n° BCE, n° TVA, contact, hébergeur
- [ ] **Politique de confidentialité (RGPD)** — données collectées (contact, devis, portail), finalités, base légale, sous-traitants (Stripe, SMTP Private Email), durées, droits, recours à l'APD (rue de la Presse 35, 1000 Bruxelles)
- [ ] **Cookies** — léger : pas d'analytics, juste `localStorage` fonctionnel (dernière commande) → simple mention, pas de bandeau de consentement nécessaire
- [ ] (optionnel) **CGV** — recommandées vu le paiement : délais, livraison, retours, garanties. Spécifiques à l'activité → à rédiger avec les vraies conditions
- [ ] Décider FR seul ou FR/EN pour ces pages (le site a un toggle FR/EN)

---

### Notes
- `orders/route.js` (formulaire devis) envoie un email mais **n'a rien à voir** avec les commandes payées du portail — ne pas confondre les deux flux.
- Les prix ne transitent jamais depuis le navigateur : ils sont recalculés côté serveur depuis [lib/clients.js](lib/clients.js). Garder cette règle.
