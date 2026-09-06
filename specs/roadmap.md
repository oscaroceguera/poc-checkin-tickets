# Roadmap

High-level implementation order, in small phases. Sequenced **Foundation → Generate → Transfer → Check-in**, since transfer and check-in both depend on tickets and registration sheets already existing.

## Phase 0 — Foundation

- [x] `pnpm add prisma @prisma/client`, `pnpm prisma init` targeting the `postgresql` provider
- [x] Populate `prisma/schema.prisma` from the model blocks in `requirements.md`
- [x] Run first migration (`pnpm prisma migrate dev`)
- [x] Add `lib/prisma.ts` shared client singleton
- [x] `pnpm add -D vitest`, add a `test` script to `package.json`

## Phase 1 — Ticket Generation

- [x] `lib/tickets/generate.ts`: Order → Ticket → User → RegistrationSheet → QR payload, pure logic
- [x] Thin route/Server Action adapter calling into it
- [x] Minimal admin UI/form to trigger generation and display the QR
- [x] Unit tests for `generate.ts`
- [x] Migrate `generate.ts` input validation to a Zod schema (per `specs/tech-stack.md`)
- [x] Make admin generate UI responsive for desktop, tablet, and mobile (per `specs/mission.md`)

## Phase 2 — Ticket Transfer

- [x] `lib/tickets/transfer.ts`: create a `TicketTransfer` row linking original → transferred ticket
- [x] Thin route/Server Action adapter
- [x] Minimal UI section for staff to perform a transfer
- [x] Unit tests for `transfer.ts`

## Phase 3 — Check-in (QR Scan)

- [x] `lib/tickets/checkin.ts` covering all five distinct outcomes: valid first scan, already-registered-today, transferred ticket, ticket not recognized, user not found
- [x] Thin route/Server Action adapter mapping each outcome to a distinct response
- [x] Minimal scan/check-in UI page
- [x] Unit tests for every outcome (required per `AGENTS.md` → Testing Instructions)

## Phase 4 — Tickets List & Navigation

- [ ] `lib/tickets/list.ts`: `listTickets()` pure read — all tickets with user, transfer status, and regenerated QR
- [ ] `app/admin/tickets/page.tsx`: list every ticket with its QR
- [ ] `app/components/NavBar.tsx`: shared nav linking Home, Generate, Transfer, Tickets, Check-in — rendered from `app/layout.tsx`
- [ ] Unit tests for `list.ts`

## Phase 5 — Camera QR Scanning (Check-in)

- [ ] `app/checkin/QrScanner.tsx`: camera capture + `BarcodeDetector` decode with `jsQR` fallback
- [ ] Wire `QrScanner` into `CheckinForm`, filling (not auto-submitting) the existing `registrationSheetId` field
- [ ] Typed/pasted field remains as fallback alongside the camera view

## Phase 6 — Polish (optional)

- [ ] UI error/alert states for each check-in outcome
- [ ] `pnpm lint` clean pass
- [ ] Update `README.md` with setup/run instructions
