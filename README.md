# Amazing Grace Ministries MN — Website

The website for Amazing Grace Ministries, a Christ-centered church in Saint Paul, Minnesota.
Production domain: **amazinggracemn.org**

- **Framework:** Next.js 16 (App Router) + React 19, TypeScript strict
- **Styling:** Tailwind CSS v4 (CSS-first config — all tokens live in `app/globals.css`, there is no `tailwind.config.js`)
- **Icons:** lucide-react
- **Backend (planned phases):** Firebase (Auth, Firestore, Storage) + Stripe, running as Next.js route handlers on Vercel

> **Note for contributors:** this Next.js version has breaking changes versus older
> training data. Read the relevant guide in `node_modules/next/dist/docs/` before
> writing route handlers, server actions, middleware, metadata, or caching code.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run lint       # eslint
node scripts/screenshot.mjs <url> <out.png> [light|dark] [w] [h] [fullpage]  # design review helper
```

## Design system

Everything is built from the tokens in `app/globals.css` — **read it before writing any CSS**.

- **Semantic colors only.** Components use `bg-surface`, `bg-surface-raised`, `text-text-primary`, `text-accent`, `border-border-subtle`, etc. Both themes (crisp white light / showroom near-black dark) are defined once in `:root` / `.dark`. Do **not** write `dark:` variants for color, and do not reference raw brand colors in components. The accent (BMW-inspired blue `#1c69d4`) is for **interactive elements only** — never decoration or large surfaces.
- **Angular geometry.** Zero border-radius on UI chrome (buttons, cards, inputs, badges); no shadows — depth comes from dark/light section contrast. Functional shapes (avatars, radios) stay round.
- **Type scale only.** `text-display-xl` → `text-caption` plus the `eyebrow` utility. Arbitrary `text-[Npx]` classes are banned — CI should grep clean for `text-\[[0-9]+px\]`.
- **Primitives** in `components/ui/` (Button, Input, Dialog, Drawer, Tabs, Toast, Reveal, …) and **section archetypes** in `components/layout/` (Section, SectionHeading, SplitSection, FullBleed, PullQuote, ScrollRail). Vary section archetypes; no two adjacent sections may share one.
- **Motion** is defined globally: `.reveal` / `.is-visible` (fade + 14px rise, expo-out, trigger-once) via `components/ui/Reveal.tsx`; `prefers-reduced-motion` is honored in the base layer.
- **Review artifact:** `/styleguide` (noindex) renders every token and primitive in both themes. Keep it current.

## Theming

Three states — light / dark / system — persisted to `localStorage['agm-theme']`, defaulting to
system. An inline script in `app/layout.tsx` applies the resolved theme before first paint;
`components/ThemeProvider.tsx` owns it after hydration.

## Environment variables

Copy `.env.example` to `.env.local`. Server-side secrets (Firebase Admin, Stripe secret/webhook
keys, Resend) must never be exposed to the client or committed. All env vars are validated at
startup by a Zod schema (`lib/env.ts`) that fails loudly by name.

## Architecture (target, phased)

- **Vercel** hosts the Next.js app; **Firebase** provides Auth (Google + email magic link),
  Firestore (native mode, us-central1, deny-by-default rules), and Storage.
- **Stripe** handles donations (embedded Payment Element) and merch (hosted Checkout).
  Donations/orders/inventory are written **only** by the Stripe webhook
  (`/api/stripe/webhook`), idempotently keyed on the Stripe event ID. Amounts are integer cents.
- Data model, security rules, and quality bars are specified in `AGM_BUILD_PROMPT.md`
  (repo root of the project workspace).

### Stripe local development

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env.local
```

Use Stripe test-mode keys throughout development; test card `4242 4242 4242 4242`.

## Deployment

Deployed on Vercel from the `main` branch of
`amazinggracechurch/amazing-grace-ministries-site`. Set all env vars from `.env.example`
in the Vercel project settings. The production domain is `amazinggracemn.org`.
