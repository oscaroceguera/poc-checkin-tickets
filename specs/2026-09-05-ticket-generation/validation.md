# Validation — Ticket Generation

## Automated

- [x] `pnpm test` passes, including new `lib/tickets/generate.test.ts` covering: valid first generation, missing required field, malformed email, duplicate `checkoutSessionId`
- [x] Tests use an injected/mocked Prisma client — no real database or HTTP call required to run them
- [x] `pnpm build` succeeds
- [x] `pnpm lint` is clean (Biome; one expected `noImgElement` performance warning for the QR `<img>`, no errors)
- [x] The QR payload asserted in tests is the `RegistrationSheet.id`, never `Ticket.id` or `User.id`
- [x] Validation is driven by a Zod schema (per `specs/tech-stack.md`), not the hand-rolled `EMAIL_PATTERN`/`validate()` regex check — existing invalid-input/malformed-email tests still pass against the Zod-based implementation with the same `fieldErrors` shape
- [x] `Order.checkoutSessionId`, `Ticket.paymenIntent`, and `Ticket.paymentId` are generated inside `generate.ts` (e.g. `crypto.randomUUID()`), not accepted as input — `GenerateTicketInput` no longer has these keys, and a test confirms two calls produce distinct values for each
- [x] `Order.ticketTypeSale` is always `"NORMAL"` and `Ticket.ticketType` is always `"EARLY-BIRD"`, asserted by a test, with no way to pass a different value through `generateTicket`'s input

## Manual

- [x] Submitting the admin form with valid data creates one `Order`, one `User`, one `Ticket`, and one `RegistrationSheet` row (verified via a direct query against the provisioned database) and displays a scannable QR image
- [x] The admin generate form has no inputs for `checkoutSessionId`, `ticketTypeSale`, `ticketType`, `paymenIntent`, or `paymentId` — only `email`, `fullName`, `buyer`, and `event` are collected
- [x] Two tickets generated back-to-back from the admin form get distinct `checkoutSessionId`/`paymenIntent`/`paymentId` values (checked against the DB rows) and both have `ticketTypeSale = "NORMAL"` / `ticketType = "EARLY-BIRD"`
- [x] The QR payload is confirmed to be the `RegistrationSheet.id` via the unit test asserting the exact string passed to the QR encoder, plus the real created id was matched against the DB row — a literal phone-camera scan was not performed in this environment
- [x] Submitting with a missing/malformed field shows a specific "invalid input" message per-field, not a generic/crash error
- [x] The `duplicate-order` path (simulated `P2002` on `checkoutSessionId`) still shows a specific "order already exists" message rather than a raw database error, even though the admin can no longer trigger it by retyping the same value (it's generated, not typed)
- [x] `RegistrationSheet.registeredDay1`, `registeredDay2`, and `onboarding` are `false` immediately after generation (confirmed against the real DB row)
- [x] Admin generate form and QR result are checked at mobile (~375px), tablet (~768px), and desktop (~1440px) widths — no horizontal overflow, form fields and QR image remain usable/legible at each size (per `specs/mission.md` responsive requirement)

## Definition of done

- [x] All automated checks above pass
- [x] Manual walkthrough completed once against the real provisioned database
- [x] `specs/roadmap.md` Phase 1 checkboxes updated to `[x]`
- [x] Zod migration and responsive-layout items above completed and checked off (added after initial phase completion, per updated `specs/tech-stack.md` and `specs/mission.md`)

## Explicitly not required for this phase

- No transfer flow or UI (Phase 2)
- No check-in/scan flow or UI (Phase 3)
- No multi-ticket/multi-user order support
- No visual design polish (Phase 4)
