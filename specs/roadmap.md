# Roadmap

High-level implementation order, in small phases. Sequenced **Foundation → Generate → Transfer → Check-in**, since transfer and check-in both depend on tickets and registration sheets already existing.

## Phase 0 — Foundation

- [x] `pnpm add prisma @prisma/client`, `pnpm prisma init` targeting the `postgresql` provider
- [x] Populate `prisma/schema.prisma` from the model blocks in `requirements.md`
- [x] Run first migration (`pnpm prisma migrate dev`)
- [x] Add `lib/prisma.ts` shared client singleton
- [x] `pnpm add -D vitest`, add a `test` script to `package.json`

## Phase 1 — Ticket Generation

- [ ] `lib/tickets/generate.ts`: Order → Ticket → User → RegistrationSheet → QR payload, pure logic
- [ ] Thin route/Server Action adapter calling into it
- [ ] Minimal admin UI/form to trigger generation and display the QR
- [ ] Unit tests for `generate.ts`

## Phase 2 — Ticket Transfer

- [ ] `lib/tickets/transfer.ts`: create a `TicketTransfer` row linking original → transferred ticket
- [ ] Thin route/Server Action adapter
- [ ] Minimal UI section for staff to perform a transfer
- [ ] Unit tests for `transfer.ts`

## Phase 3 — Check-in (QR Scan)

- [ ] `lib/tickets/checkin.ts` covering all five distinct outcomes: valid first scan, already-registered-today, transferred ticket, ticket not recognized, user not found
- [ ] Thin route/Server Action adapter mapping each outcome to a distinct response
- [ ] Minimal scan/check-in UI page
- [ ] Unit tests for every outcome (required per `AGENTS.md` → Testing Instructions)

## Phase 4 — Polish (optional)

- [ ] UI error/alert states for each check-in outcome
- [ ] `pnpm lint` clean pass
- [ ] Update `README.md` with setup/run instructions
