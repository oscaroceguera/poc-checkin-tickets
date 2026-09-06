# Changelog

All notable changes to this project are documented in this file.

This is an internal proof-of-concept, so entries track engineering progress toward the three core capabilities (ticket generation, transfer, and check-in) rather than shipped end-user features.

## [Unreleased]

### Added

- **Database schema for the ticketing model.** Defined the `User`, `Order`, `Ticket`, `RegistrationSheet`, and `TicketTransfer` tables in Prisma and ran the first migration, giving the app a real database to build the generate/transfer/check-in flows on top of.
- **Shared database connection.** Added a single Prisma client (`lib/prisma.ts`) so every future feature talks to the database the same way instead of creating its own connection.
- **Project planning docs.** Added `requirements.md` and a `specs/` folder (mission, roadmap, tech stack) laying out the event's two check-in days, the data model, and the phased build order (Foundation → Generate → Transfer → Check-in).
- **Test runner.** Added Vitest and a `pnpm test` script, so upcoming business-logic changes (especially check-in's five alert cases) can ship with automated tests.
- Initial project scaffold generated with `create-next-app` (Next.js, React, TypeScript, Tailwind CSS, Biome).

### Notes

- No user-facing features are functional yet — ticket generation, transfer, and check-in are still unimplemented (see `specs/roadmap.md`).
