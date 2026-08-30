# IMPLEMENTATION PROMPT — "Entrego cuando cae el dinero"

Derived from `docs/PACKET.md`. Hand this to the coding agent as the build specification.

---

## Context for the agent

You are building one slice of a product that protects Mexican market-stall merchants from forged bank-transfer receipts. A merchant hands over goods against a *comprobante* that turns out to be an image edit; the money never arrives.

**The product does not examine the receipt.** It never reads it, never uploads it, never scores it. Do not add receipt analysis, fraud detection, or any classifier at any point. If a feature you are considering involves judging whether something is fake, it is out of scope by design.

What the product does instead: a supplier visits a stand, confirms that the merchant's bank deposit notification actually works, and leaves behind a printed card stating the stand's standing rule — goods leave when the money lands, for every buyer, every time.

**Two roles, and they are not the same person.**
- The **supplier** operates the app. He signs in. He is the only authenticated user.
- The **merchant** (Jesús) is who the product protects. He installs nothing, signs into nothing, and memorizes nothing. There must be no merchant login anywhere in the product.

Interface language is **Spanish**. Code, comments, and commit messages in English.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js, App Router, TypeScript |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth, Google provider |
| Vision + LLM | Gemini API (free tier), server-side route handlers only |
| QR | client-side library |
| Styling | Tailwind |

Free tier only. No paid services.

---

## Non-negotiable constraints

1. **No secret ever reaches the browser.** All Gemini and Supabase service calls happen in server route handlers. `.env.local` is gitignored in the first commit, before any key exists.
2. **The camera photo is never persisted.** It goes to the vision model, returns a boolean, and is discarded. Never written to disk, to Supabase Storage, or to a log.
3. **The simulation label is always visible on screen 3**, above the fold, before the user scrolls. Text: `Transferencia simulada. No se mueve dinero real.`
4. **The interface never says "verificado", "seguro", or "confirmado" about a person, a document, or a transaction.** The only success message is about the channel: `Sí llegó la notificación.` This wording is a product requirement, not a copy preference.
5. **RLS is enabled at table creation**, not retrofitted.
6. **All seed and demo data is invented and labeled.** No real person's name, phone, or account appears anywhere.

---

## Data model

```sql
create table stands (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id),
  merchant_name text not null check (char_length(merchant_name) between 2 and 80),
  stand_type text not null check (char_length(stand_type) between 2 and 60),
  clabe text not null check (clabe ~ '^[0-9]{18}$'),
  status text not null default 'pending' check (status in ('confirmed','pending')),
  created_at timestamptz not null default now()
);

create table card_texts (
  id uuid primary key default gen_random_uuid(),
  stand_id uuid not null references stands(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table stands enable row level security;
alter table card_texts enable row level security;
```

RLS policies: a supplier may select, insert, and update only rows where `supplier_id = auth.uid()`. For `card_texts`, access is granted through the parent stand's `supplier_id`.

---

## Features, in build order

Each feature is independently testable and ends in a commit.

### F1 — Project skeleton and auth gate

Next.js app, Tailwind, Supabase client. Sign in with Google. Routes `/setup` and `/stands` redirect to sign-in when signed out.

**Acceptance:** signed out, `/setup` redirects and shows no stand data. Signed in, it renders. `.env.local` is gitignored and no key appears in any committed file.

### F2 — Merchant details form with validation

Screen 2. Fields: merchant name, stand type, CLABE.

Validation runs on both client and server. Merchant name 2–80 characters. Stand type 2–60. CLABE exactly 18 digits, numeric only. Errors render inline in Spanish, next to the offending field. The form cannot advance while invalid.

**Acceptance:** 17 digits rejected. 19 digits rejected. Letters rejected. Empty rejected. A 500-character paste into merchant name is refused, not truncated silently. Nothing over-length reaches the database.

### F3 — Notification test screen with vision check

Screen 3. Renders the simulation warning band first. Shows destination summary with the CLABE masked to its last four digits. A button sends the simulated 1 MXN transfer — this is a stub, no financial API, and the screen says so.

Then a photo upload or camera capture. The image is posted to a server route that calls the vision model with a single question: does this phone screen show a bank deposit notification, yes or no. Do not ask the model to read the amount, evaluate legitimacy, or interpret contents. It returns a boolean and a short reason string.

On true: stand status set to `confirmed`, success message `Sí llegó la notificación`.
On false: show a retry with guidance for the supplier to help switch notifications on. After two failures, set status to `pending` and continue to card generation anyway.

The image is discarded after the call. It is never written anywhere.

**Acceptance:** the warning band is visible without scrolling. A photo of a screen with a deposit notification returns confirmed. A photo of a blank screen returns not found and offers retry. Two failures produce `pending` and still reach screen 4. After a successful check, no image exists in storage or in the database.

### F4 — Card generation and QR

Screen 4. A server route calls the text model with the merchant name and stand type.

**The headline is hardcoded in the application, not generated:** `Aquí entregamos cuando cae el dinero`. The model produces only the two middle lines, naming the actual goods, at a low reading level, in Spanish, maximum 20 words total. The universality line is also hardcoded: `Es la regla de este puesto. Es para todos, siempre.`

The generated body is saved to `card_texts` on first generation. Subsequent views and reprints read the saved row — they never regenerate. A card must be identical every time it is printed.

Render the card print-ready with a QR pointing at `/regla/[stand_id]`. Buttons: print, and send.

**Acceptance:** generating for "leche y maíz" and for "flores" produces identical headlines and correctly different middle lines. Navigating away and returning reprints byte-identical text. The model output is length-capped; an over-long generation is regenerated or truncated at a word boundary, never mid-word.

### F5 — Stand list

Screen 5. The supplier's visited stands, each showing merchant name, stand type, status badge, and date. Ordered newest first.

**Acceptance:** signed in as supplier B, supplier A's stands do not appear. Verify by querying directly with supplier B's token, not only through the UI.

### F6 — Public rule page

`/regla/[stand_id]`, unauthenticated. Renders the card's rule text and the stand name. Nothing else.

**Acceptance:** the page exposes no CLABE, no phone number, no supplier identity, and no timestamps. Confirm by reading the page source, not just the rendered output.

---

## Commit plan

Minimum five commits, minimum two deploys.

| # | Commit | Deploy |
|---|---|---|
| 1 | `chore: scaffold next app, tailwind, supabase client, gitignore env` | — |
| 2 | `feat: google auth and route protection` | **Deploy 1** — verify the auth gate on the live URL |
| 3 | `feat: merchant form with client and server validation` | — |
| 4 | `feat: notification test with vision check and simulation label` | — |
| 5 | `feat: card generation, persistence, and qr` | **Deploy 2** — verify card generation live |
| 6 | `feat: stand list and public rule page` | — |
| 7 | `fix: <the bug found in the mechanical pass>` | **Deploy 3** — required by the test-fix-redeploy cycle |

Deploy 1 exists to catch auth and environment-variable problems early, while the app is small enough to debug.

---

## Session close, every session

1. Update `DECISIONS.md` — what was decided and why, not what was typed.
2. Write tomorrow's first move as a concrete action, not a topic.
3. Commit and push.

---

## Out of scope — do not build

- Receipt reading, uploading, scoring, or detection of any kind
- Real banking API integration
- Merchant accounts or merchant login
- The WhatsApp thread and Banxico CEP lookup (a teammate's slice)
- Pricing, subscriptions, payment processing
- Analytics or scan tracking on the public rule page
- Any UI state that says a person, document, or transaction is verified
