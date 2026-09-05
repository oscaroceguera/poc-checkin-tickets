# Plan — Foundation Setup

One task group per bullet in `specs/roadmap.md` Phase 0.

## 1. Provision database & install Prisma

- Provision Postgres via Vercel Marketplace: `vercel link` (if not already linked), `vercel integration add neon --yes`
- `pnpm add prisma @prisma/client`
- `pnpm prisma init --datasource-provider postgresql`
- `vercel env pull --yes` (or otherwise sync `DATABASE_URL` into `.env`/`.env.local`)

## 2. Define schema

- Populate `prisma/schema.prisma` with the five models from `requirements.md` (User, Order, Ticket, RegistrationSheet, TicketTransfer) — copy as specified, no redesign

## 3. Run first migration

- `pnpm prisma migrate dev --name init`
- Confirm tables exist against the provisioned Neon database

## 4. Add Prisma client singleton

- Add `lib/prisma.ts` exporting a single shared `PrismaClient` instance
- Confirm no other file constructs `new PrismaClient()` directly

## 5. Install Vitest

- `pnpm add -D vitest`
- Add a `test` script to `package.json` (`vitest run`)
- Confirm `pnpm test` runs (even with zero test files) before Phase 1 adds real tests
