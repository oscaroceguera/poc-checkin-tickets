# poc-checkin-tickets

Ticket admin and check-in system for a two-day event (2026-10-29 and 2026-10-30): ticket generation, ticket transfer, and QR check-in with anti-duplication alerts.

This is an internal proof-of-concept — see `specs/mission.md` for scope and non-goals, and `AGENTS.md` for the full data model and business rules.

## Prerequisites

- Node.js and [pnpm](https://pnpm.io)
- A PostgreSQL database (a free hosted instance works: `npx create-db`)

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set `DATABASE_URL` in a `.env` file at the project root, pointing at your PostgreSQL database.

3. Apply migrations:

   ```bash
   pnpm prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
pnpm test          # or: pnpm vitest run
```

Unit tests cover the pure business logic in `lib/tickets/*` (generate, transfer, check-in, list).

## Lint & format

```bash
pnpm lint          # Biome check
pnpm format        # Biome auto-format
```

## Build

```bash
pnpm build         # runs `prisma generate` then `next build`
pnpm start
```
