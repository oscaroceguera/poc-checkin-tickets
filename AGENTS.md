# AGENTS.md

## Project Overview

This is a ticket admin and check-in system for a two-day event (2026-10-29 and 2026-10-30). It has three core capabilities:

1. **Ticket generation** — turn a purchase into an Order, a Ticket, a User record, and a RegistrationSheet, then produce a scannable QR ticket.
2. **Ticket transfer** — reassign a ticket from one attendee to another.
3. **Check-in** — scan a ticket's QR at the door on either event day and register attendance, enforcing anti-fraud/anti-duplication rules.

Full field-level details for both the data model and the business rules live in `requirements.md` — treat it as the source of truth and keep it and this file in sync as the schema evolves.

**Stack**: Next.js (App Router) + React + TypeScript + Tailwind CSS v4 + Biome (lint/format) + pnpm. **Prisma and Vitest are specified in `requirements.md` but not yet installed** — there is no `prisma/schema.prisma` and no test runner configured. Set these up before starting on persistence or tests (see Setup Commands below).

## Data Model

Five Prisma models, related as: an `Order` groups `User`s and `Ticket`s from one checkout; each `Ticket` belongs to one `User` and has exactly one `RegistrationSheet` (the entity actually encoded in the QR, via its `id`); a `TicketTransfer` records the original and transferred `Ticket` ids when ownership moves; `RegistrationSheet.registeredDay1`/`registeredDay2` track attendance per event day.

- **User** — email, fullName, linked Order.
- **Order** — checkoutSessionId, ticketTypeSale, buyer, has many Users and Tickets.
- **Ticket** — ticketType, payment info, belongs to a User and optionally an Order, has one RegistrationSheet.
- **RegistrationSheet** — the QR target; `registeredDay1`/`registeredDay2` booleans, `event` id, `onboarding` flag.
- **TicketTransfer** — `originalTicketId` / `transferredTicketId` pair; presence of a row for a ticket means it has been transferred.

Until `prisma/schema.prisma` exists, create it directly from the schema blocks in `requirements.md` rather than redesigning the model.

## Core Features

### 1. Ticket Generation

Flow: create `Order` → create `Ticket` → save `User` info → create `RegistrationSheet` → generate a QR code whose payload is the `RegistrationSheet.id`. The QR is the only artifact handed to the attendee — it must resolve back to a `RegistrationSheet`, not the `Ticket` or `User` directly.

### 2. Ticket Transfer

A dedicated flow/section creates a `TicketTransfer` row linking `originalTicketId` to `transferredTicketId` when an attendee gives their ticket to someone else. A ticket with an associated `TicketTransfer` is considered transferred for the lifetime of that ticket — check-in must detect this and warn, it does not block entry by itself.

### 3. Check-in (QR Scan)

Each event day, staff scan a ticket's QR (the `RegistrationSheet.id`). On a valid, first-time-today scan, set `registeredDay1` or `registeredDay2` (based on which day it is) to `true`. The scan endpoint must surface these outcomes distinctly:

- **Already registered today** — the matching day flag is already `true`.
- **Ticket transferred** — a `TicketTransfer` row exists for this ticket; show that it was transferred to another user.
- **Ticket not recognized** — the scanned id doesn't match any `RegistrationSheet`.
- **User not found** — the ticket has no resolvable user.

These are distinct alerts, not a single generic error — the UI and the underlying check-in function should return which case occurred.

## Suggested Architecture (for maintainability)

Keep the three features isolated and unit-testable by separating business logic from route/UI code:

- `lib/prisma.ts` — single shared Prisma client instance; import this everywhere instead of `new PrismaClient()`.
- `lib/tickets/generate.ts`, `lib/tickets/transfer.ts`, `lib/tickets/checkin.ts` — pure business logic for each capability (inputs/outputs as plain data, no `Request`/`Response`, no JSX). This is what should be unit tested.
- `app/api/**/route.ts` (or Server Actions) — thin adapters: parse input, call the matching `lib/tickets/*` function, map its result to a response/alert. No business rules here.
- Group UI routes under `app/` to mirror the three pillars (e.g. an admin area for generating/managing tickets, a transfer section, a scan/check-in page).

Rationale: as more admin features get added, keeping validation and state transitions in `lib/tickets/*` (rather than inline in routes or components) is what keeps each feature independently readable, testable, and changeable without touching the others.

## Setup Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build for production: `pnpm build` / start it with `pnpm start`
- Add Prisma (not yet installed): `pnpm add prisma @prisma/client`, then `pnpm prisma init` and populate `prisma/schema.prisma` from `requirements.md`, then `pnpm prisma migrate dev`
- Add Vitest (not yet installed): `pnpm add -D vitest`

## Testing Instructions

- Run tests: `pnpm vitest run` (add a `test` script to `package.json` once Vitest is installed)
- Unit test `lib/tickets/checkin.ts` directly, covering each outcome: valid first scan, already-registered-today, transferred ticket, ticket not recognized, user not found. Prefer testing this logic over the route, since it doesn't need HTTP or a real database if the Prisma client is injected/mocked.

## Code Style

- Lint: `pnpm lint` (Biome, not ESLint) — fix issues with `pnpm format`
- TypeScript strict mode is on; use the `@/*` path alias for root-relative imports
- Follow Next.js App Router conventions (`app/` directory, Server Components by default, Server Actions/route handlers for mutations)

## PR Guidelines

- Run `pnpm lint` before committing
- Any change to `lib/tickets/*` business logic should come with or update a corresponding test

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
