# Requirements — Ticket Transfer

## Context

This is **Phase 2 — Ticket Transfer** from `specs/roadmap.md`. Phase 1 delivered `lib/tickets/generate.ts`, which produces an `Order` + `User` + `Ticket` + `RegistrationSheet` per purchase, each `Ticket` 1:1 with its `User` (`Ticket.userId @unique`) and 1:1 with its `RegistrationSheet` (`RegistrationSheet.ticketId @unique`).

Because of that 1:1 constraint, a transfer cannot just repoint the existing `Ticket.userId` — the new attendee needs their own `User`/`Ticket`/`RegistrationSheet` row set. `TicketTransfer` (schema already in place from Phase 0) records the link: `originalTicketId` → `transferredTicketId`.

Check-in (Phase 3) depends on `TicketTransfer` existing so it can detect and warn on a transferred original ticket — that detection logic itself is out of scope here.

## Scope

Staff-facing transfer: given an existing ticket and a new attendee's `email`/`fullName`, reassign the ticket to the new attendee by creating a new ticket record set and a `TicketTransfer` link. Nothing about the original `Ticket`/`RegistrationSheet`/`User` rows is mutated or deleted.

Flow (per `AGENTS.md` → Core Features → Ticket Transfer):

1. Staff supply the **original ticket's id** (`Ticket.id`, looked up from the `RegistrationSheet.id`/QR payload printed on the physical/digital ticket) plus the new attendee's `email` and `fullName`.
2. Look up the original `Ticket`, including its `User` and `RegistrationSheet`.
3. Create a new `User` for the new attendee (or reuse an existing `User` row matching that `email`, since `User.email` has no unique constraint — reuse only when a `User` with that exact email already has no `Ticket` of their own, otherwise create a new one, since `Ticket.userId` is 1:1).
4. Create a new `Ticket` copying `ticketType`, `orderId`, `paymenIntent`, and `paymentId` from the original, linked to the new `User`.
5. Create a new `RegistrationSheet` for the new `Ticket`, copying `event` from the original, with `registeredDay1`/`registeredDay2`/`onboarding` all at schema defaults (`false`) — the new attendee has not checked in yet, regardless of the original's check-in state.
6. Create a `TicketTransfer` row: `{ originalTicketId: <original Ticket.id>, transferredTicketId: <new Ticket.id> }`.

Fields collected by the staff form / accepted by `transfer.ts`:

| Field | Notes |
|---|---|
| `originalTicketId` | required; must resolve to an existing `Ticket` |
| `newUserEmail` | required; validated for basic email format |
| `newUserFullName` | optional |

Fields `transfer.ts` copies from the original ticket record — never collected from the staff form or accepted as input: `ticketType`, `orderId`, `paymenIntent`, `paymentId` (on the new `Ticket`), `event` (on the new `RegistrationSheet`).

## Decisions

- **The original ticket is never mutated or invalidated.** Transfer only ever adds new rows (`User`?, `Ticket`, `RegistrationSheet`, `TicketTransfer`). Both the original and the new `RegistrationSheet.id` (QR payloads) keep existing independently; the original one scanning at check-in (Phase 3) is expected to look up its `TicketTransfer` row by `originalTicketId` and surface a "transferred" warning without blocking, per `AGENTS.md`. That check-in-side lookup is Phase 3's job, not built here.
- **A ticket can only be transferred once.** If a `TicketTransfer` row already exists with this `originalTicketId`, `transfer.ts` returns an `already-transferred` result rather than creating a second link (avoids two "live" tickets silently forking off one original with no way to tell which is current).
- **New-attendee `User` reuse**: `User.email` has no unique constraint in the schema, so "reuse" means: find a `User` row with that exact email AND no existing `Ticket` (`ticket` relation null); if found, attach the new `Ticket` to it; otherwise create a fresh `User`. This mirrors the 1:1 `Ticket`↔`User` constraint already enforced by the schema instead of fighting it.
- **Copied fields ride along unchanged**: `ticketType`, `orderId`, `paymenIntent`, `paymentId`, `event` all copy from the original so the new ticket represents the same purchase/admission tier, just a different holder. `paymenIntent`/`paymentId` are **not** regenerated — they still describe the original payment.
- **Validation lives in `transfer.ts`**, expressed as a Zod schema (per `specs/tech-stack.md`), covering `originalTicketId` (non-empty string) and `newUserEmail` (valid email); returns the same `invalid-input` / `fieldErrors` shape used by `generate.ts` for adapter/UI consistency.
- **Lookup is by `Ticket.id`, not the QR/`RegistrationSheet.id`**, since that's what `TicketTransfer.originalTicketId` stores. Staff paste/type the `Ticket.id`. Resolving a scanned QR (`RegistrationSheet.id`) back to its `Ticket.id` is a one-hop lookup the UI/adapter can do, but scanning hardware/camera input is out of scope (POC, admin-typed id is enough, matching how Phase 1's admin form is plain typed fields with no camera integration either).
- **UI mirrors the Phase 1 admin pattern**: a dedicated `/admin/transfer` page + form + Server Action, styled the same functional/minimal way, responsive per `specs/mission.md`.
- No staff authentication, no payment reprocessing, no notification/email to either attendee — consistent with `specs/mission.md` non-goals.

## Out of scope

- Check-in / QR scanning and the "ticket transferred" alert surfaced at the door (`lib/tickets/checkin.ts`) — Phase 3.
- Invalidating, expiring, or otherwise blocking the original ticket at check-in.
- Camera/QR-scan input for looking up the original ticket in the transfer UI — id is typed/pasted.
- Transfer history/audit UI beyond the single `TicketTransfer` row (e.g. no "transfer chain" or re-transfer support).
- Staff authentication for the transfer form.
- UI visual design polish (Phase 4).
