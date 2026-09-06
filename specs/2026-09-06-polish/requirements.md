# Requirements — Phase 6: Polish

## Scope

Three independent cleanup items, all already scoped by `specs/roadmap.md` → Phase 6:

1. **Distinct UI alert states for every check-in outcome.** `lib/tickets/checkin.ts` already returns five distinguishable outcomes (`checked-in`, `already-registered-today`, `ticket-not-found`, `user-not-found`, plus the `transferred` flag layered on top of the first two), and `app/checkin/actions.ts` already maps each to a state. What's missing is visual distinction in `app/checkin/CheckinForm.tsx`: today, `ticket-not-found`, `user-not-found`, `invalid-input`, and `unknown-error` all render as the same red text block, and `transferred` is a secondary amber line rather than its own alert. After this phase each of the 5 outcomes below gets its own color + icon combination so door staff can recognize the state at a glance:

   | Outcome | Color | Icon |
   |---|---|---|
   | Checked in (first scan today) | Green | Check circle |
   | Already registered today | Amber | Clock/repeat |
   | Ticket transferred (shown alongside checked-in/already-registered) | Amber, distinct sub-alert | Arrow/exchange |
   | Ticket not recognized | Red | X circle |
   | User not found | Red, distinct copy from "not recognized" | Alert triangle |

   Field-level validation errors (`invalid-input`) and the generic fallback (`unknown-error`) keep today's plain red inline treatment — they aren't check-in "outcomes" per the business rules in `AGENTS.md`, just form/system errors.

2. **`pnpm lint` clean pass.** Currently 2 warnings, both `lint/performance/noImgElement` on QR `<img>` tags fed by `data:` URIs (`app/admin/generate/GenerateTicketForm.tsx:84`, `app/admin/tickets/page.tsx:45`). `next/image` doesn't optimize `data:` URIs, so the fix is a targeted `biome-ignore` comment on each, not a swap to `<Image>`.

3. **README.md setup/run instructions.** Replace the default `create-next-app` boilerplate with real instructions for this project: install, env/database setup, Prisma migrate, dev server, tests, lint. Developer-facing only — no event-day staff usage guide.

## Out of scope

- No new npm dependencies (no icon library — icons are inline SVG, matching the "no new dependencies without approval" rule in `specs/tech-stack.md`).
- No behavior/business-logic changes to `lib/tickets/checkin.ts` — this phase is presentation and docs only.
- No staff-facing usage docs in the README (developers only, per interview).

## Decisions

- **Icons are inline SVG components**, not a library, to avoid a new dependency. Small, local, colocated in `app/checkin/CheckinForm.tsx` (or a nearby local module if that keeps the file readable).
- **Color/icon pairing reuses the existing green/amber/red Tailwind palette** already used elsewhere in the check-in and admin UI (see current `text-green-700`/`text-amber-700`/`text-red-600` dark-mode-paired classes) — just extended to cover all 5 states distinctly instead of collapsing 3 of them into one red block.
- **Lint fix uses `pnpm format` first**, then a manual `biome-ignore` comment for the two `data:`-URI `<img>` warnings (explaining why `next/image` doesn't apply), rather than converting to `next/image`.
- **README targets developers only** — install, env, Prisma, dev/test/lint commands. No staff/event-day operational guide.

## Context

- Business logic and the outcome taxonomy are already correct and tested (`lib/tickets/checkin.ts`, its test suite, and `app/checkin/actions.ts`); this phase only touches presentation in `CheckinForm.tsx`, the two lint call sites, and `README.md`.
- Follow the existing dark-mode class pairing convention (`text-X-700 dark:text-X-400`, etc.) used throughout `app/checkin` and `app/admin`.
- Tone: keep alert copy terse and factual, consistent with existing copy ("Checked in", "Already registered today", "This ticket was transferred to another user.").
- This is the final scoped phase in `specs/roadmap.md`; no further phases are implied by `specs/mission.md`.
