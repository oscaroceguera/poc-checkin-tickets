# Plan — Ticket Generation

One task group per bullet in `specs/roadmap.md` Phase 1.

## 1. Business logic — `lib/tickets/generate.ts`

- Define plain-data input type (`email`, `fullName?`, `buyer?`, `event`) and a discriminated result type (`ok` with the created records + QR data URL, or a typed error: `invalid-input`, `duplicate-order`, `unknown-error`). `checkoutSessionId`, `ticketTypeSale`, `ticketType`, `paymenIntent`, and `paymentId` are no longer part of the input type — they are computed inside the function.
- Add `pnpm add zod`; define a Zod schema for `GenerateTicketInput` covering only the remaining admin-supplied fields (required fields present, `email` a valid email format, `event` an integer) and replace the hand-rolled `validate()`/`EMAIL_PATTERN` regex check with `schema.safeParse(input)`, mapping `result.error.flatten().fieldErrors` into the existing `invalid-input` `fieldErrors` shape so the adapter/UI contract is unchanged; return `invalid-input` before any DB call.
- Before the transaction, compute `checkoutSessionId = crypto.randomUUID()`, `paymenIntent = crypto.randomUUID()`, `paymentId = crypto.randomUUID()`, and the constants `ticketTypeSale = "NORMAL"` / `ticketType = "EARLY-BIRD"`.
- Inside a single `prisma.$transaction`: create `Order` (using the generated `checkoutSessionId`/`ticketTypeSale` and input `buyer`), create `User` (linked to the order), create `Ticket` (using the generated `ticketType`/`paymenIntent`/`paymentId`, linked to user + order), create `RegistrationSheet` (linked to ticket, `event` from input, other flags left at schema defaults).
- Catch Prisma unique-constraint violation (`P2002` on `checkoutSessionId`) and map to the `duplicate-order` result instead of throwing — now guarding against a UUID collision rather than an admin-supplied duplicate.
- Add `pnpm add qrcode` + `pnpm add -D @types/qrcode`; encode `RegistrationSheet.id` to a PNG data URL (e.g. `QRCode.toDataURL`) and include it in the `ok` result.
- Accept an injected Prisma client (default to the shared `lib/prisma.ts` instance) so tests can pass a mock — no `Request`/`Response`/JSX in this file.

## 2. Adapter — Server Action or route

- Add a thin Server Action (or `app/api/tickets/generate/route.ts`) that parses form input, calls `generate.ts`, and maps its result to a response shape the UI can render (success payload with QR data URL, or one of the typed error messages).
- No validation or business rules in the adapter — it only translates.

## 3. Admin UI

- Add a minimal admin route (e.g. `app/admin/generate/page.tsx`) with a Tailwind form for the admin-supplied fields in `requirements.md` only (`email`, `fullName`, `buyer`, `event`) — no inputs for `checkoutSessionId`, `ticketTypeSale`, `ticketType`, `paymenIntent`, or `paymentId`, since those are generated inside `generate.ts`.
- On submit, call the adapter and render either the QR image + created record summary, or the specific error message (invalid input / duplicate order / unexpected error).
- Layout must be responsive (per `specs/mission.md`): use Tailwind responsive utilities (e.g. stacked single-column form on mobile, constrained-width centered form on tablet/desktop) so the form and QR result are usable at mobile, tablet, and desktop widths.
- Keep styling functional only — no visual design pass (Phase 4).

## 4. Tests — `lib/tickets/generate.test.ts`

- Valid input → creates all four records and returns a QR data URL, using an injected mock/in-memory Prisma client (per `AGENTS.md` → Testing Instructions: no real DB or HTTP).
- Missing required field / malformed email → `invalid-input` result, no DB calls attempted.
- Duplicate `checkoutSessionId` (simulate `P2002`) → `duplicate-order` result, not a thrown exception.
- Confirm the QR payload encodes the created `RegistrationSheet.id` (not the `Ticket.id` or `User.id`).
- Confirm the created `Order.ticketTypeSale` is `"NORMAL"` and `Ticket.ticketType` is `"EARLY-BIRD"` even though the input never supplies them.
- Confirm `checkoutSessionId`, `paymenIntent`, and `paymentId` are generated (non-empty, distinct across two calls) rather than echoed from input.
