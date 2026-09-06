# Plan — Ticket Transfer

One task group per bullet in `specs/roadmap.md` Phase 2.

## 1. Business logic — `lib/tickets/transfer.ts`

- Define `TransferTicketInput` (`originalTicketId: string`, `newUserEmail: string`, `newUserFullName?: string`) and a discriminated `TransferTicketResult`: `ok` (with the new `user`/`ticket`/`registrationSheet` + the `originalTicketId`), or typed errors — `invalid-input` (with `fieldErrors`), `ticket-not-found` (no `Ticket` matches `originalTicketId`), `already-transferred` (a `TicketTransfer` row already exists for this `originalTicketId`), `unknown-error`.
- Define a Zod schema (`originalTicketId` non-empty, `newUserEmail` valid email, `newUserFullName` optional) mirroring `generate.ts`'s `validate()` pattern — map `fieldErrors` the same way.
- Inside a single `prisma.$transaction` (keeps the not-found/already-transferred checks atomic with the writes, avoiding a race on double-submit):
  - Look up the original `Ticket` by id, including its `registration` (`RegistrationSheet`) for the `event` value to copy — if not found, return `ticket-not-found`.
  - Check for an existing `TicketTransfer` where `originalTicketId` matches — if found, return `already-transferred`.
  - Find a `User` with `email === newUserEmail` and no linked `Ticket`; if none, create a new `User` with `email`/`fullName`.
  - Create a new `Ticket` copying `ticketType`, `orderId`, `paymenIntent`, `paymentId` from the original, linked to the resolved/created `User`.
  - Create a new `RegistrationSheet` linked to the new `Ticket`, copying `event` from the original's `RegistrationSheet`, other fields at schema defaults.
  - Create the `TicketTransfer` row (`originalTicketId`, `transferredTicketId: newTicket.id`).
- Accept an injected Prisma client (default `lib/prisma.ts`), same `Deps` pattern as `generate.ts`, so tests can mock it — no `Request`/`Response`/JSX in this file.

## 2. Adapter — Server Action

- Add `app/admin/transfer/actions.ts`: a `"use server"` action parsing `FormData` (`originalTicketId`, `newUserEmail`, `newUserFullName`), calling `transferTicket`, and mapping the result to an action-state shape (`idle` / `success` with the new ticket summary / `error` with message + optional `fieldErrors`) — same shape convention as `app/admin/generate/actions.ts`.
- No validation or business rules in the adapter.

## 3. Admin UI

- Add `app/admin/transfer/page.tsx` (mirrors `app/admin/generate/page.tsx` layout) rendering a `TransferTicketForm`.
- Add `app/admin/transfer/TransferTicketForm.tsx`: fields for `originalTicketId`, `newUserEmail`, `newUserFullName`; on submit, show either a success summary (new `Ticket.id` / `RegistrationSheet.id` + QR-equivalent id for the new attendee) or the specific error message (`ticket-not-found`, `already-transferred`, invalid input per-field, unexpected error).
- Responsive per `specs/mission.md`, same Tailwind utility approach as the generate form; no visual design polish (Phase 4).

## 4. Tests — `lib/tickets/transfer.test.ts`

- Valid transfer with a brand-new `newUserEmail` → creates a new `User`, `Ticket` (fields copied from original), `RegistrationSheet` (fresh `event` copied, day flags `false`), and one `TicketTransfer` row linking the two ticket ids.
- Valid transfer where `newUserEmail` matches an existing ticketless `User` → reuses that `User` row rather than creating a duplicate.
- `originalTicketId` that doesn't match any `Ticket` → `ticket-not-found`, no DB writes attempted.
- Second transfer attempt on an already-transferred `originalTicketId` → `already-transferred`, no new rows created.
- Missing/malformed `newUserEmail` or missing `originalTicketId` → `invalid-input` with field errors, no DB calls attempted.
- Confirm original `Ticket`/`RegistrationSheet`/`User` rows are never modified by a transfer (mock asserts no `update`/`delete` calls against them).
