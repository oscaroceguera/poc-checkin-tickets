# Requirements — Check-in (QR Scan)

## Context

This is **Phase 3 — Check-in (QR Scan)** from `specs/roadmap.md`. Phase 1 (`lib/tickets/generate.ts`) produces a `RegistrationSheet` per ticket whose `id` is the QR payload handed to the attendee. Phase 2 (`lib/tickets/transfer.ts`) creates a `TicketTransfer` row (`originalTicketId` → `transferredTicketId`) whenever a ticket changes hands, and explicitly left "detect and warn on a transferred original ticket" for this phase.

Check-in is the door-side flow: staff scan/enter a `RegistrationSheet.id` and the system records attendance for one of the event's two fixed days (2026-10-29 / 2026-10-30), while surfacing anti-fraud/anti-duplication signals distinctly rather than as one generic error, per `AGENTS.md` → Core Features → Check-in.

## Scope

Given a `RegistrationSheet.id` (the scanned QR) and which day staff are checking in for, look up the `RegistrationSheet` together with its `Ticket` and that ticket's `User`, then:

1. **Not found** — no `RegistrationSheet` matches the id → `ticket-not-found`, no writes.
2. **User not found** — the matching `Ticket` has no resolvable `User` → `user-not-found`, no writes.
3. **Already registered today** — the day flag for the selected day (`registeredDay1` or `registeredDay2`) is already `true` → `already-registered-today`, no writes.
4. **Valid first scan** — otherwise, set the selected day's flag to `true` → `checked-in`.

Independently of outcomes 3–4 (never outcomes 1–2, since there's no ticket to check for a transfer): look up whether a `TicketTransfer` row exists with `originalTicketId` equal to this `RegistrationSheet`'s `ticketId`. If one exists, attach `transferred: true` to the result — this never changes or blocks the base outcome above, it only adds a warning, per `AGENTS.md` ("check-in must detect this and warn, it does not block entry by itself").

Fields accepted by `checkin.ts`:

| Field | Notes |
|---|---|
| `registrationSheetId` | required; the scanned QR payload, must resolve to an existing `RegistrationSheet` |
| `day` | required; `1` or `2`, selects `registeredDay1` vs `registeredDay2` |

## Decisions

- **Day is staff-selected, not derived from the server clock.** `checkin.ts` takes an explicit `day: 1 | 2` rather than computing it from the current date against the fixed event dates. This keeps the flow testable at any time (including now, well before the real event dates) and matches how door staff already know which day they're working — they don't need the system to infer it. A future phase could add a server-date cross-check as a soft warning, but that's out of scope here.
- **The transfer warning is a combinable flag, not a separate outcome.** `CheckinTicketResult` carries `transferred: boolean` alongside the base outcome (`checked-in` / `already-registered-today`), rather than a single discriminated union where "transferred" pre-empts everything else. This is the literal reading of AGENTS.md's "does not block entry by itself": a transferred ticket can still be a valid first-time check-in, just with a warning shown alongside it. `ticket-not-found` and `user-not-found` never carry `transferred` — there's no ticket to check a transfer against.
- **Transfer lookup key**: a `RegistrationSheet` belongs to one `Ticket` (`ticketId`); the transfer check is `TicketTransfer.findFirst({ where: { originalTicketId: ticket.id } })`. Only the *original* ticket's `RegistrationSheet` ever resolves `transferred: true` — the new ticket created by a transfer has its own fresh `RegistrationSheet` (per `ticket-transfer/requirements.md`) and no matching `TicketTransfer.originalTicketId`, so it checks in with `transferred: false` like any other ticket.
- **Scan input is typed/pasted**, same as Phase 1/2: a text field for `registrationSheetId`, no camera/QR-scanning library. Matches the precedent set in `ticket-transfer/requirements.md` ("scanning hardware/camera input is out of scope (POC, admin-typed id is enough)").
- **`user-not-found` may be unreachable through the current schema.** `Ticket.userId` is required and `User` is a non-nullable relation on `Ticket`, so every real `Ticket` row already has a resolvable `User` — same caveat already noted for the ticketless-`User`-reuse branch in `ticket-transfer/validation.md`. The branch is still implemented defensively (matching AGENTS.md's explicit outcome list) and covered by a unit test with a mocked/injected Prisma client, but may not be exercisable via the real provisioned database today.
- **No writes happen for `ticket-not-found`, `user-not-found`, or `already-registered-today`** — only a genuine first-time scan for the selected day mutates `RegistrationSheet`.
- **Validation lives in `checkin.ts`**, expressed as a Zod schema (per `specs/tech-stack.md`): `registrationSheetId` non-empty string, `day` a literal union of `1 | 2`. Returns the same `invalid-input` / `fieldErrors` shape used by `generate.ts`/`transfer.ts` for adapter/UI consistency.
- No staff authentication, no rate limiting/anti-abuse beyond the day-flag check, no email/notification on check-in — consistent with `specs/mission.md` non-goals.

## Out of scope

- Camera/QR-scan input for reading the physical QR — id is typed/pasted (same as Phase 1/2's ticket id fields).
- Deriving or cross-checking the day against the server's real date — day is entirely staff-selected this phase.
- Invalidating, expiring, or blocking a transferred original ticket — it still checks in normally, only with a warning.
- Staff authentication for the check-in page.
- Any "undo a check-in" / manual reset of a day flag.
- UI visual design polish (Phase 4).
