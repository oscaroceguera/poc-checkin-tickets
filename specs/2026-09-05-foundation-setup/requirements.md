# Requirements — Foundation Setup

## Context

This is **Phase 0 — Foundation** from `specs/roadmap.md`. It exists because every later phase (ticket generation, transfer, check-in — see `specs/mission.md`) needs a real Prisma schema, a database, and a test runner in place first. No business logic (`lib/tickets/*`) or UI is built in this phase.

Stack decisions this phase implements are already fixed in `specs/tech-stack.md`: Prisma as the ORM, PostgreSQL as the database, Vitest as the test runner.

## Scope

- Install Prisma and generate `prisma/schema.prisma` from the five model blocks already specified in `requirements.md` (User, Order, Ticket, RegistrationSheet, TicketTransfer) — reuse those models as-is, do not redesign them.
- Provision a real Postgres database and run the first migration against it.
- Add `lib/prisma.ts` as the single shared Prisma client instance (per `AGENTS.md` → Suggested Architecture).
- Install Vitest and add a `test` script to `package.json`, so Phase 1+ can unit-test `lib/tickets/*` per `AGENTS.md` → Testing Instructions.

## Decisions

- **Database provisioning: Neon via Vercel Marketplace** (`vercel integration add neon`) — auto-provisions the database and injects `DATABASE_URL`, rather than a local Docker Postgres or a manually-supplied connection string. This matches the "fits an eventual Vercel deployment" rationale already recorded in `specs/tech-stack.md`.
- `pnpm prisma init` uses the `postgresql` provider.

## Out of scope

- No seed/sample data script.
- No `lib/tickets/*` business logic (that's Phases 1–3).
- No admin UI or routes.
- No production deployment/CI wiring beyond what's needed to run migrations and tests locally.
