# Plan — Check-in (QR Scan)

One task group per bullet in `specs/roadmap.md` Phase 3.

## 1. Business logic — `lib/tickets/checkin.ts`

- Define `CheckinTicketInput` (`registrationSheetId: string`, `day: 1 | 2`) and a discriminated `CheckinTicketResult`:
  - `{ ok: true; outcome: "checked-in"; transferred: boolean; registrationSheet: {...} }`
  - `{ ok: true; outcome: "already-registered-today"; transferred: boolean; registrationSheet: {...} }`
  - `{ ok: false; error: "invalid-input"; fieldErrors: Record<string, string> }`
  - `{ ok: false; error: "ticket-not-found" }`
  - `{ ok: false; error: "user-not-found" }`
  - `{ ok: false; error: "unknown-error" }`
- Define a Zod schema (`registrationSheetId` non-empty, `day` a `z.union([z.literal(1), z.literal(2)])`) mirroring `transfer.ts`'s `validate()` pattern.
- Inside a single `prisma.$transaction` (keeps the not-found/already-registered read and the day-flag write atomic, avoiding a double-scan race):
  - Look up the `RegistrationSheet` by `id`, including `ticket` and `ticket.user` — if not found, return `ticket-not-found`.
  - If `ticket.user` is missing, return `user-not-found` (defensive branch — see `requirements.md` caveat on schema reachability).
  - Look up `TicketTransfer.findFirst({ where: { originalTicketId: ticket.id } })` to compute `transferred`.
  - Check the day flag for the selected `day` (`registeredDay1` for `day === 1`, `registeredDay2` for `day === 2`) — if already `true`, return `already-registered-today` with `transferred` attached, no write.
  - Otherwise, `update` the `RegistrationSheet` setting that day's flag `true`, return `checked-in` with `transferred` attached.
- Accept an injected Prisma client (default `lib/prisma.ts`), same `Deps` pattern as `transfer.ts`/`generate.ts`, so tests can mock it — no `Request`/`Response`/JSX in this file.

## 2. Adapter — Server Action

- Add `app/checkin/actions.ts`: a `"use server"` action parsing `FormData` (`registrationSheetId`, `day`), calling `checkinTicket`, and mapping the result to an action-state shape (`idle` / `success` with `outcome` + `transferred` + registration summary / `error` with the specific error + optional `fieldErrors`) — same shape convention as `app/admin/transfer/actions.ts`.
- No validation or business rules in the adapter.

## 3. Check-in UI

- Add `app/checkin/page.tsx` (mirrors the `app/admin/transfer/page.tsx` layout) rendering a `CheckinForm`. This route is a sibling of `app/admin`, not nested under it — AGENTS.md groups it as its own "scan/check-in page" distinct from the admin area.
- Add `app/checkin/CheckinForm.tsx`: a day selector (Day 1 / Day 2) and a `registrationSheetId` text field. On submit, render one alert per outcome:
  - `checked-in` → success alert.
  - `already-registered-today` → distinct warning alert (not a generic error).
  - `ticket-not-found` / `user-not-found` → distinct error alerts.
  - invalid input → per-field messages.
  - Additionally, whenever `transferred` is `true`, render a separate "this ticket was transferred to another user" banner alongside whichever outcome alert above applies.
- Responsive per `specs/mission.md`, same Tailwind utility approach as the generate/transfer forms; no visual design polish (Phase 4).

## 4. Tests — `lib/tickets/checkin.test.ts`

- Valid first scan, day 1 → `checked-in`, `registeredDay1` becomes `true`, `registeredDay2` untouched.
- Valid first scan, day 2 → `checked-in`, `registeredDay2` becomes `true`, `registeredDay1` untouched.
- Second scan same day → `already-registered-today`, no `update` call made.
- `registrationSheetId` that doesn't match any `RegistrationSheet` → `ticket-not-found`, no writes attempted.
- Mocked `RegistrationSheet` whose `ticket.user` is absent → `user-not-found`, no writes attempted.
- A ticket with a matching `TicketTransfer` row → `transferred: true` on a `checked-in` result (first scan) AND on an `already-registered-today` result (second scan) — proves the flag is independent of the base outcome.
- A ticket with no matching `TicketTransfer` row → `transferred: false`.
- Missing/malformed `registrationSheetId` or invalid `day` → `invalid-input` with field errors, no DB calls attempted.
- Confirm a scan for one day never mutates the other day's flag.
