# Changelog

All notable changes to this project are documented in this file.

This is an internal proof-of-concept, so entries track engineering progress toward the three core capabilities (ticket generation, transfer, and check-in) rather than shipped end-user features.

## [Unreleased]

### Added

- **Ticket generation (Phase 1 complete).** `lib/tickets/generate.ts` runs the full Order → User → Ticket → RegistrationSheet flow in a single transaction and renders the RegistrationSheet id as a scannable QR code (`qrcode`), so a purchase now produces a real, checkable ticket end to end.
- **Admin form to generate tickets.** Added `app/admin/generate` (a Server Action adapter plus a responsive form/page) so staff can trigger ticket generation and see the resulting QR without touching the database directly.
- **Input validation via Zod.** `generate.ts` validates its input with a `zod` schema and returns field-level errors, replacing ad hoc checks and matching the validation approach called for in `specs/tech-stack.md`.
- **Unit tests for ticket generation.** `lib/tickets/generate.test.ts` covers the success path and failure cases (invalid input, duplicate order) with the Prisma client injected, so the logic is tested without a real database.
- **Database schema for the ticketing model.** Defined the `User`, `Order`, `Ticket`, `RegistrationSheet`, and `TicketTransfer` tables in Prisma and ran the first migration, giving the app a real database to build the generate/transfer/check-in flows on top of.
- **Shared database connection.** Added a single Prisma client (`lib/prisma.ts`) so every future feature talks to the database the same way instead of creating its own connection.
- **Project planning docs.** Added `requirements.md` and a `specs/` folder (mission, roadmap, tech stack) laying out the event's two check-in days, the data model, and the phased build order (Foundation → Generate → Transfer → Check-in). Added a dated spec (`specs/2026-09-05-ticket-generation/`) covering the plan, requirements, and validation for the ticket generation phase.
- **Test runner.** Added Vitest (with `vitest.config.mts`) and a `pnpm test` script, so upcoming business-logic changes (especially check-in's five alert cases) can ship with automated tests.
- Initial project scaffold generated with `create-next-app` (Next.js, React, TypeScript, Tailwind CSS, Biome).

### Notes

- Ticket generation is functional end-to-end; transfer and check-in are still unimplemented (see `specs/roadmap.md`).
