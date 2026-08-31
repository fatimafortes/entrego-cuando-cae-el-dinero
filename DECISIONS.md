# Decisions

What was decided and why — not a changelog of what was typed. See git log
and `docs/PACKET.md` §11 for the full mechanical-pass record and commit
history.

## 2026-08-30

**Model choice for both Gemini calls: `gemini-3.5-flash-lite`, not a
`-preview` model, not `gemini-2.5-flash`.** Tested five candidate models
against a real image before writing any F3 code. `gemini-2.5-flash` is dead
(404, "no longer available to new users"). `gemini-flash-latest` (an alias)
hit a 27-second 503 under normal load — too unstable to depend on for an
alias whose underlying model can change without notice. `gemini-3.6-flash`
works but can't disable its internal reasoning step (`thinkingBudget: 0`
errors), spending ~120 tokens "thinking" before answering a trivial yes/no.
`gemini-3.5-flash-lite` answers cleanly with no forced reasoning overhead,
is not a preview model, and supports structured JSON output
(`responseSchema`) directly — used for both the vision boolean+reason and
the card-text generation, forcing `{field: type}` shapes instead of parsing
free text.

**The vision model's free-text `reason` is never rendered to the user, only
logged server-side on failure.** The interface's only permitted success
copy is the literal string "Sí llegó la notificación." (constraint #4). The
model's own explanation of what it saw is uncontrolled text; showing it
risked a stray "verificado" or "confirmado" reaching the screen from a
source no one reviewed.

**RLS gives `anon` zero grants on `stands`/`card_texts`.** The public
`/regla/[stand_id]` page (F6) reads through a new service-role,
server-only client instead (`app/lib/supabase/service.ts`) that selects
only the two columns ever safe to render publicly (`merchant_name`, card
`body`) — no CLABE, no `supplier_id`, no timestamps enter the query at all.
Chosen over an anon-readable RLS policy so the "nothing sensitive can leak"
guarantee holds by construction (nothing sensitive is ever selected),
rather than depending on a policy being written correctly forever.

**`card_texts.stand_id` got a `UNIQUE` constraint (migration 0003), added
after F4 was already built.** "A card is generated once, never
regenerated" was an application-level assumption (`select`, then `insert`
if missing) that a race — two tabs, a retried request — could break,
producing two cards for one stand and an undefined "which one prints."
`insert ... on conflict (stand_id) do nothing` makes this safe at the
database level regardless of application timing.

**Migrations run through the Supabase SQL Editor need explicit `GRANT`
statements — this is not automatic the way the Table Editor UI's "create
table" wizard is.** Cost a full debugging cycle: F2 was completely broken
(every insert failed) because `0001_init_schema.sql` created tables and
RLS policies but no grants, and even `service_role` — which bypasses RLS
— was refused with "permission denied for table." Fixed in `0002`, and
`0001` now includes the grants inline for any fresh setup. Recorded as
[[project-supabase-grants-gotcha]] so a future migration doesn't repeat it.

**Supabase's OAuth "Redirect URLs" allow-list needs an explicit entry per
environment, kept simultaneously — not swapped when moving between
local and production.** "Site URL" is only the fallback for a
`redirect_to` that doesn't match the allow-list; it never needs to change
per environment. This broke login twice in one day: once because only the
production callback was in the allow-list (local fell back to the
production Site URL), and once because a wildcard was needed for the
`?next=...` query string on the callback URL — Supabase's match does
consider it, contradicting an unverified assumption stated earlier the
same day and corrected by the person who actually tested it.

**Card-text length handling went through two fixes in one day, in order of
severity.** First: a blind word-boundary truncation could cut a sentence
in half ("...en el") — fixed by retrying once with corrective feedback,
then falling back to a complete-sentence boundary if the model still ran
long. Second, found later the same day by deliberately stress-testing past
the official test plan: that sentence-boundary fallback could keep only
the refusal sentence and silently drop the affirmative rule sentence — the
half of the card that actually says when goods get delivered. Fixed by
letting the fallback keep both sentences within a bounded overage (8
words) rather than dropping the second one for being a few words long.
Both are documented as the same category of mistake: optimizing for a
word-count number over what the printed card actually needs to say.

**"Enviar al teléfono" (F4) uses the Web Share API, with a clipboard-copy
fallback — no real messaging integration exists.** The packet doesn't
specify a delivery mechanism, and building one (SMS, WhatsApp, email) is
explicitly out of scope (WhatsApp is a teammate's slice). This is an
honest, zero-backend interpretation: it opens the device's native share
sheet or copies the card text, and does not pretend to send anything on
the product's behalf.

**Test fixtures for the notification check (`test-assets/notification-check/`)
are synthetic, not real bank screenshots.** Generated as styled HTML
rendered to PNG (device frame, slight rotation, glare, grain — approximating
a camera photo of a screen, not a flat screenshot) so the vision check could
be exercised end-to-end without a real financial institution's UI or a real
account balance appearing anywhere in the repo, per the security floor's
"no real personal data" requirement.

**The T1–T12 mechanical pass (2026-08-30) found zero failures in the
checklist itself** — every prior bug this build hit was already fixed
earlier the same session, before the formal pass ran. One real defect
(the affirmative-sentence-dropping fallback, above) was found by exceeding
the checklist's own coverage, not by the checklist — recorded as a gap in
the checklist itself in `docs/PACKET.md` §11.2, not just a gap in the code.

## Next concrete step

Run the Layer 1 persona test described in `docs/PACKET.md` §11.3: fresh
chat, the Jesús persona loaded, the actual screenshots from this build
pasted in order, narrating hesitation and the point where he'd go quiet
and stop asking. Log every confusion; fix the worst one before treating
this slice as done. Deliverable: `PERSONA_fatima.pdf`.
