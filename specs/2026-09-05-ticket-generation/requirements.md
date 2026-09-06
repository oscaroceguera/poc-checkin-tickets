# Requirements — Ticket Generation

## Context

This is **Phase 1 — Ticket Generation** from `specs/roadmap.md`. Phase 0 delivered the Prisma schema, migrated Postgres database, the shared `lib/prisma.ts` client, and Vitest. This phase adds the first real business capability from `specs/mission.md`: turning a purchase into an `Order`, `Ticket`, `User`, and `RegistrationSheet`, and producing the scannable QR ticket.

Transfer (Phase 2) and check-in (Phase 3) both depend on the records this phase creates — they are out of scope here.

## Scope

**Single-buyer, single-ticket purchase only.** One submission creates exactly one `Order` with one `User` and one `Ticket` (matches the 1:1 `Ticket.userId` relation already in `prisma/schema.prisma`). Multi-ticket orders are not supported in this phase.

Flow (per `AGENTS.md` → Core Features → Ticket Generation): create `Order` → create `Ticket` → save `User` → create `RegistrationSheet` → generate a QR whose payload is the `RegistrationSheet.id`.

Fields collected by the admin form / accepted by `generate.ts`:

| Field | Model | Required | Notes |
|---|---|---|---|
| `email` | User | yes | validated for basic email format |
| `fullName` | User | no | |
| `buyer` | Order | no | |
| `event` | RegistrationSheet | yes | integer event id; the two fixed event days live in the check-in phase, not here |

Fields `generate.ts` fills in itself — never collected from the admin form or accepted as input:

| Field | Model | Value | Notes |
|---|---|---|---|
| `checkoutSessionId` | Order | random UUID | still enforced unique by the schema; a UUID collision is a handled error, not a crash, same as before |
| `ticketTypeSale` | Order | `"NORMAL"` | fixed constant for this phase; no admin-typed value, no enum yet |
| `ticketType` | Ticket | `"EARLY-BIRD"` | fixed constant for this phase; no admin-typed value |
| `paymenIntent` | Ticket | random UUID | recorded as-is (existing schema typo, not fixed here) |
| `paymentId` | Ticket | random UUID | |

`RegistrationSheet.registeredDay1`/`registeredDay2`/`onboarding` all use their schema defaults (`false`) at creation — this phase never sets them.

The QR payload is the created `RegistrationSheet.id`. It is rendered server-side as a PNG data URL and returned to the admin UI, which displays it as the result of a successful generation — that data URL is the only ticket artifact shown to the operator (per `AGENTS.md`: "The QR is the only artifact handed to the attendee").

## Decisions

- **One new dependency**: a QR encoding library (e.g. `qrcode`) to render the `RegistrationSheet.id` server-side into a PNG data URL inside `lib/tickets/generate.ts` (or a small helper it calls). Rendering stays server-side so the admin UI only ever receives a ready-to-display image, keeping `generate.ts` the single place that decides what a "ticket" is.
- **`checkoutSessionId`, `paymenIntent`, and `paymentId` are generated inside `generate.ts`** with `crypto.randomUUID()` (or equivalent) — the admin never types them and the input type no longer includes them. This is a POC simplification standing in for the checkout/payment integration `specs/mission.md` already excludes.
- **`ticketTypeSale` and `ticketType` are fixed constants** (`"NORMAL"` and `"EARLY-BIRD"` respectively) set inside `generate.ts`, not admin-typed fields — no enum yet, just literal string constants until a future phase needs more sale/ticket types.
- **Validation lives in `generate.ts`**, not the route/UI, and is expressed as a **Zod schema** (per `specs/tech-stack.md`) rather than hand-rolled checks: the schema now only covers the admin-supplied fields (`email`, `fullName`, `buyer`, `event`) — reject missing required fields and malformed `email` before touching the database, mapping `ZodError.flatten().fieldErrors` into the existing `invalid-input` result shape rather than throwing.
- **Admin UI is responsive** (per `specs/mission.md`): the generation form and result/QR display must be usable at mobile, tablet, and desktop widths using Tailwind responsive utilities — no fixed-width layout assuming desktop only.
- **Duplicate `checkoutSessionId` remains a handled outcome**, not a raw Prisma `P2002` error, even though it's now auto-generated: `generate.ts` catches the unique-constraint failure (a theoretical UUID collision) and returns a distinct "order already exists" result the adapter can map to a clear message.
- **No multi-ticket orders, no payment processing, no auth** — consistent with `specs/mission.md` non-goals; `paymenIntent`/`paymentId` are generated opaque reference strings only, never real payment data.
- UI styling stays functional/minimal (Tailwind utility classes, no design polish) — visual polish is explicitly deferred to Phase 4 per `specs/roadmap.md`.

## Out of scope

- Ticket transfer (`lib/tickets/transfer.ts`) — Phase 2.
- Check-in / QR scanning (`lib/tickets/checkin.ts`) — Phase 3.
- Multi-ticket / multi-user orders.
- Any payment gateway integration.
- Staff authentication for the admin form.
- UI visual design polish (Phase 4).
