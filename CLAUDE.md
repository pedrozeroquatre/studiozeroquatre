# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Studio Zeroquatre — a Brussels-based custom packaging studio website targeting HoReCa clients (restaurants, hotels). Built with Next.js 14 (App Router), React 18, Tailwind CSS v3, and Motion (Framer Motion v12). No TypeScript — plain JS with path aliases via `jsconfig.json`.

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build
npm run lint     # ESLint via next lint
```

No test suite configured.

## Architecture

### Route groups

- `app/(site)/` — public marketing site; wrapped in `Nav + Footer` via `(site)/layout.js`
- `app/espace/` — **the real client area**, backed by Supabase Auth and the `portail_*` views. Single route, no API layer: the browser talks to Supabase directly with the publishable key and RLS does the filtering.
- `app/portal/` — **legacy** order portal running on the hardcoded codes of `lib/clients.js`. Still live because the Stripe flow lives there. See `NOTES-ESPACE-CLIENT.md` §5.
- `app/api/` — `/api/contact`, `/api/orders` (quote form), `/api/portal/login`, `/api/portal/checkout`, `/api/portal/orders`, `/api/stripe/webhook`. **None of these serve `/espace`.**

### Key files

- `lib/supabase-browser.js` — browser Supabase client for `/espace`, publishable (anon) key only. Also captures the invitation link's URL fragment **before** `createClient()` consumes it — the two run in that order in the same module, which is what makes the invite flow reliable. Never put the service role key here.
- `lib/espace-data.js` — every read and write of `/espace`: the `portail_*` views (explicit column lists), the `mon_client_id()` / `mon_etablissement_id()` RPCs, and `passer_commande()`. Plus the French formatting helpers.
- `lib/clients.js` — **source of truth for the legacy `/portal` only**. Hardcoded registry of all clients, their access codes, product SKUs, formats, and per-unit prices. Adding/removing a client or changing prices happens here. `findClientByCode()` is the login lookup — no database involved.
- `lib/supabase.js` — server-only Supabase client (service role key, bypasses RLS). Never import it from a client component. `getSupabase()` returns `null` when the env vars are absent, so callers degrade instead of throwing.
- `lib/orders-store.js` — the only module that writes paid orders. Reads/writes the `orders` table; no-ops when Supabase is unconfigured.
- `lib/lang.js` — client-side FR/EN i18n via DOM mutation. `applyLang(lang)` swaps text content on elements with `data-fr` / `data-en` attributes and dispatches a `langchange` event. Next.js i18n routing is not used.
- `lib/cn.js` — `clsx` + `tailwind-merge` utility.
- `lib/generateRef.js` — generates `SZQ-XXXXXXXX` order references.
- `lib/lastOrder.js` — localStorage fallback for "Refaire ma dernière commande". Superseded by the server history; delete once Supabase is live and the legacy history is imported.
- `supabase/schema.sql` — the `orders` table. **Shared contract**: the admin dashboard (a separate site) reads this table, so renaming a column breaks it.

### Espace client (`/espace`) — the real one

Supabase Auth (email + password) against the project shared with the studio's OS
(`studio-zero-quatre-os.vercel.app`). Accounts are created by the studio from the
OS; **public sign-ups are closed — do not reopen them.**

The hard rule, set by `PORTAIL-CLIENT.md` and enforced database-side: **a client
has no rights on any table.** They read only the `portail_*` views and write only
through `passer_commande()`. Never add a client RLS policy on a base table, never
modify a view. If data is missing, ask for a view — `clients.notes`,
`clients.prix`, `clients.plaques` and `livraisons.tva_transferee` are internal and
a `select *` would leak them.

The views already filter on the connected account's client *and* establishment, so
**never write a `where` clause on them** — doing so implies the portal is what
secures the data, which it is not.

`mon_client_id()` returning `NULL` means the account is not a client account (a
studio login, say). Every view is then empty; `/espace` shows the `sans-acces`
screen rather than a blank page.

Invitation flow: the OS sends a Resend email whose link lands on `/espace` with a
token in the URL fragment. The page detects it, has the client choose a password
via `auth.updateUser()`, then loads their space. Expired links (24 h) arrive as
`#error=access_denied&error_code=otp_expired` and get their own screen. "Mot de
passe oublié" never reveals whether an address exists.

Page order is deliberate and driven by what a pizzeria owner needs at a glance:
remaining stock, next delivery, reorder button — then the order form, then history
lower down.

**Payment is not wired to orders**: no view exposes a tariff and
`portail_mes_commandes` has no payment-status column, so `/espace` takes orders
without charging. Open questions and required DB changes are in
`NOTES-ESPACE-CLIENT.md` — read it before touching this flow.

### Legacy portal auth model (`/portal`)

The portal has no real session. Login POSTs the code to `/api/portal/login`, which calls `findClientByCode()`. On success, the client object (name + products + prices) and the access code are stored in React state only. Logout clears state. Closing the tab logs the user out.

Reads of client data must authenticate **by access code, not by `clientId`** — ids like `volta` or `bros` are guessable, and order history exposes a restaurant's volumes. `/api/portal/orders` follows this rule.

### Order flow and persistence

Confirming an order in `Dashboard.js` POSTs to `/api/portal/checkout`, which recomputes prices server-side from `lib/clients.js` and returns a Stripe hosted-checkout URL. **Prices never travel from the browser — keep it that way.**

The `/api/stripe/webhook` route is the only place a payment is confirmed, so it is where persistence happens: it writes the order to Supabase, then emails `contact@`. Both steps are wrapped in their own `try/catch` and never 500 back to Stripe — the payment already succeeded and a retry would not change that.

Writes are idempotent via a unique index on `stripe_session_id` (Stripe redelivers events). Order lines are frozen into the `items` jsonb column at purchase time rather than recomputed from `lib/clients.js`, so a later price change does not rewrite past orders. The checkout passes structured quantities in the session metadata (`qty`) for this.

`/api/orders` handles the public quote form and has nothing to do with paid portal orders — do not conflate the two flows.

Google Sheets was considered as a second store and **dropped** (06/08/2026): Supabase is the single source, shared with the admin dashboard.

### Email

All outbound email goes through `lib/mailer.js` (`sendMail`), a nodemailer transport over Namecheap Private Email SMTP (`mail.privateemail.com:465`). It sends from and to the `contact@` mailbox (`SMTP_USER`), with `replyTo` set to the visitor's address. Three routes use it: `/api/contact` and `/api/orders` (form notifications) and `/api/stripe/webhook` (paid-order notification). No Resend, no domain verification — Private Email already handles SPF/DKIM.

## Design system

### CSS custom properties (light theme only, defined in `globals.css`)

| Token | Tailwind class | Value |
|---|---|---|
| `--bg` | `bg-bg` | `#ffffff` |
| `--surface` | `bg-surface` | `#f7f7f7` |
| `--border` | `border-border-line` | `#e8e8e8` |
| `--border2` | `border-border-line2` | `#d0d0d0` |
| `--text` | `text-text` | `#0a0a0a` |
| `--text2` | `text-text2` | `#666666` |
| `--text3` | `text-text3` | `#aaaaaa` |

- Default border-radius: `3px` (Tailwind `rounded` = 3px, not 4px)
- Body font: DM Mono (`font-mono` class, `var(--font-mono)`)
- Heading font: Syne (`font-syne` class, `var(--font-syne)`)
- z-index scale: `nav = 50`, `drawer = 60`

### Portal styling

Both client areas (`/espace` and the legacy `/portal`, and their components) use **inline styles exclusively** with a dark theme (`#000` background, `#f0f0f0` text). Do not mix Tailwind classes into them — keep inline styles consistent with the existing pattern.

`components/espace/ui.js` holds that palette as named tokens (`C`, `S`, `MONO`, `SYNE`) plus the shared primitives (`Ecran`, `CarteAuth`, `Tableau`, `Statut`, `Pastille`…). New `/espace` UI composes those rather than re-typing hex values. `PortalNav` is shared chrome between the two areas.

### Images

- `public/images/` — referenced by URL path (logo, hero images, product photos used in Next.js `<Image>`)
- `assets/` — imported directly in JS files via static import (used on the products page)

## Conventions

- `'use client'` is added only to components that use hooks or browser APIs; pages that are purely compositional remain server components.
- The `cn()` utility from `lib/cn.js` is used for conditional Tailwind class merging throughout the site (not in portal components which use inline styles).
- Form state in pages uses a single `useState` object with an `updateField(key, value)` helper pattern (see `devis/page.js`).
- Language in Nav is toggled via `applyLang()` and a `lang` React state that tracks current language for the toggle button label only.

## Environment variables

```
SMTP_USER                    # contact@studiozeroquatre.com — Private Email mailbox
SMTP_PASSWORD                # mailbox password
SMTP_HOST                    # optional, defaults to mail.privateemail.com
SMTP_PORT                    # optional, defaults to 465 (SSL)
STRIPE_SECRET_KEY            # sk_test_… in dev, sk_live_… in prod
STRIPE_WEBHOOK_SECRET        # whsec_… — from the Stripe CLI locally, from the dashboard in prod
NEXT_PUBLIC_SUPABASE_URL      # https://wnwjdyrnfkskunzafiah.supabase.co — project shared with the studio's OS
NEXT_PUBLIC_SUPABASE_ANON_KEY # sb_publishable_… — public by design; RLS is what secures the data
SUPABASE_SERVICE_ROLE_KEY     # legacy Stripe persistence only. Leave EMPTY — see below
```

`SMTP_USER` / `SMTP_PASSWORD` power `lib/mailer.js`. The Stripe pair powers checkout and the webhook; **the publishable key is not used** (hosted checkout redirects via `session.url`).

`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only two `/espace` needs; without them it shows an "espace indisponible" screen instead of failing. `SUPABASE_SERVICE_ROLE_KEY` must stay empty: it bypasses RLS, and the legacy `orders` table it feeds does not exist in the OS project — setting it would point the Stripe webhook at a missing table.

Deployed on Vercel (`studiozeroquatre.com` → `www`), auto-deploy on push to `main`. Env vars must be set there too, not only in `.env.local`.
