# Validation — Check-in (QR Scan)

## Automated

- [x] `pnpm test` passes, including new `lib/tickets/checkin.test.ts` covering: valid first scan (day 1), valid first scan (day 2), already-registered-today, ticket-not-found, user-not-found, invalid input (missing/malformed fields)
- [x] Tests use an injected/mocked Prisma client — no real database or HTTP call required to run them
- [x] `pnpm build` succeeds
- [x] `pnpm lint` is clean (Biome; one expected `noImgElement` warning carried over from Phase 1's generate form, no errors)
- [x] A test confirms a day-1 scan only sets `registeredDay1` and never touches `registeredDay2` (and vice versa for day 2)
- [x] A test confirms a second scan for an already-registered day makes no `update` call
- [x] A test confirms `transferred: true` is returned for a ticket with a matching `TicketTransfer` row, both on a first-time `checked-in` result and on an `already-registered-today` result — proving the flag never changes or blocks the base outcome
- [x] A test confirms `transferred: false` is returned for a ticket with no matching `TicketTransfer` row
- [x] A test confirms `ticket-not-found` and `user-not-found` never carry a `transferred` field and never write to the database

## Manual

- [x] Scanning (typing) a valid `RegistrationSheet.id` for Day 1 shows a "checked in" success alert and sets `registeredDay1` to `true` (verified via a direct query against the provisioned database)
- [x] Scanning the same id again for Day 1 shows a distinct "already registered today" alert, not a generic error, and the flag is unchanged
- [x] Scanning the same id for Day 2 succeeds independently of the Day 1 result, setting `registeredDay2` to `true`
- [x] Scanning an id that doesn't exist shows a specific "ticket not recognized" message, not a generic/crash error
- [x] Scanning the *original* ticket of a completed transfer (from the Phase 2 flow) shows the transfer warning banner alongside the "already registered today" outcome, while the *new* (transferred-to) ticket's `RegistrationSheet` checks in cleanly with no transfer warning
- [x] The `user-not-found` branch is verified by the unit test's mocked scenario only, not a manual UI/DB walkthrough — there is no way to produce a `Ticket` without a resolvable `User` through the current UI (`generate.ts` and `transfer.ts` both always create a `User` in the same transaction as any `Ticket` they create), so this branch is only reachable in practice via a future flow or direct DB edit (same caveat as the ticketless-`User` branch in `specs/2026-09-05-ticket-transfer/validation.md`)
- [x] Submitting with an empty `registrationSheetId` is blocked client-side by the `required` input (same mechanism as Phase 1/2's forms) before it can reach the server action; a day is always selected since one radio is `defaultChecked`, so the `invalid-input` message for malformed input is proven by the `checkin.test.ts` unit tests rather than a reachable manual UI case
- [x] Check-in page is checked at mobile (390px), tablet (768px), and desktop (1920px) widths — no horizontal overflow, day selector and result alerts remain usable/legible at each size (per `specs/mission.md` responsive requirement)

## Definition of done

- [x] All automated checks above pass
- [x] Manual walkthrough completed once against the real provisioned database
- [x] `specs/roadmap.md` Phase 3 checkboxes updated to `[x]`

## Explicitly not required for this phase

- No camera/QR-scan input for reading the physical QR — id is typed/pasted
- No derivation or cross-check of the day against the server's real date — day is staff-selected
- No invalidation/blocking of a transferred original ticket at check-in
- No staff authentication
- No "undo a check-in" / manual reset of a day flag
- No visual design polish (Phase 4)
