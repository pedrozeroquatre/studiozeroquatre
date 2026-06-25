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
- `app/portal/` — client order portal; separate layout, dark-themed, no Nav/Footer
- `app/api/` — three API routes: `/api/contact`, `/api/orders`, `/api/portal/login`

### Key files

- `lib/clients.js` — **source of truth for the portal**. Hardcoded registry of all clients, their access codes, product SKUs, formats, and per-unit prices. Adding/removing a client or changing prices happens here. `findClientByCode()` is the login lookup — no database involved.
- `lib/lang.js` — client-side FR/EN i18n via DOM mutation. `applyLang(lang)` swaps text content on elements with `data-fr` / `data-en` attributes and dispatches a `langchange` event. Next.js i18n routing is not used.
- `lib/cn.js` — `clsx` + `tailwind-merge` utility.
- `lib/generateRef.js` — generates `SZQ-XXXXXXXX` order references (random, not persisted).

### Portal auth model

The portal has no real session or persistence. Login POSTs the code to `/api/portal/login`, which calls `findClientByCode()`. On success, the client object (name + products + prices) is stored in React state only. Logout clears state. Closing the tab logs the user out.

**Order submission** (`Dashboard.js`) currently only sets local state and shows a success screen — no API call is made on confirm. The `/api/orders` route is a logging stub with instructions for wiring up Google Sheets.

### API stubs

Both `/api/contact` and `/api/orders` only `console.log` submissions. Each file contains inline comments with the exact steps to wire up Resend (email) and Google Sheets respectively. Do not remove these comments — they are the integration plan.

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

The portal (`/portal` route and its components) uses **inline styles exclusively** with a dark theme (`#000` background, `#f0f0f0` text). Do not mix Tailwind classes into portal components — keep inline styles consistent with the existing pattern.

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
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GOOGLE_SERVICE_ACCOUNT_KEY   # JSON string of service account
SPREADSHEET_ID               # Google Sheets target
```

None of these are wired up in the codebase yet — they are reserved for future integrations (Supabase for data persistence, Stripe for payment, Google Sheets for order logging).
