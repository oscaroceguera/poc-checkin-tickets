# Requirements — Phase 4: Tickets List & Navigation

## Scope

Give organizers a single page that lists every generated ticket, and give staff a shared nav bar so they can move between the Generate, Transfer, Tickets, and Check-in areas without knowing the URLs by heart.

**In scope:**

- `lib/tickets/list.ts` — a pure `listTickets()` read function returning every ticket with its user, transfer status, and a freshly regenerated QR code.
- `app/admin/tickets/page.tsx` — renders the full list, one row/card per ticket, each with its QR image.
- `app/components/NavBar.tsx` — a shared nav rendered from `app/layout.tsx`, linking Home, Generate, Transfer, Tickets, and Check-in.
- Unit tests for `list.ts`.

**Out of scope (explicitly deferred):**

- Pagination, search, or filtering on the list page (may be revisited if ticket volume grows — see Phase 6 note below).
- Any change to `generate.ts`, `transfer.ts`, or `checkin.ts` business logic.
- Auth/authorization for who can view the tickets list — still an open question per `specs/mission.md`.

### Data shape returned by `listTickets()`

Per ticket:

| Field | Source | Notes |
|---|---|---|
| `id` | `Ticket.id` | |
| `ticketType` | `Ticket.ticketType` | |
| `user` | `User.email`, `User.fullName` | via `Ticket.user` |
| `registrationSheetId` | `RegistrationSheet.id` | the QR payload |
| `qrDataUrl` | regenerated via `QRCode.toDataURL(registrationSheet.id)` | same helper `generate.ts` already uses (`qrcode` package) — not stored, always regenerated on read |
| `isTransferred` | `true` if a `TicketTransfer` row exists where `originalTicketId === ticket.id` | |
| `originalTicketId` / `transferredTicketId` | from the matching `TicketTransfer` row, when `isTransferred` is true | `null`/omitted otherwise |

## Decisions

- **Transfer status shape**: expose `isTransferred: boolean` plus the linked `originalTicketId`/`transferredTicketId` pair when present, mirroring the pattern `checkin.ts` already uses (`transferred: boolean` derived from `ticketTransfer.findFirst`). This keeps the two features' notion of "transferred" consistent and gives the UI enough detail to show *what it was transferred to*, not just that it happened.
- **QR handling**: regenerate the QR client-render-time from `registrationSheet.id` using the same `qrcode` library call as `generate.ts`, rather than persisting `qrDataUrl` anywhere. No schema change needed.
- **List scope**: render every ticket, no pagination/search — matches current POC scale (single two-day event, admin-only). Revisit only if this becomes a real pain point.
- **Nav bar**: a single shared `app/components/NavBar.tsx` Server Component rendered from `app/layout.tsx` so every route gets it for free, rather than duplicating nav markup per page.

## Context

- Follow the architecture split already established: `list.ts` is pure business logic (no `Request`/`Response`, no JSX), the page is a thin adapter that calls it and renders. See `AGENTS.md` → Suggested Architecture.
- `list.ts` takes an injectable Prisma-shaped dependency the same way `checkin.ts` does (`ListTicketsDeps` with a `prisma` default), so it stays unit-testable without a real database.
- Styling: Tailwind utility classes matching the existing look in `GenerateTicketForm.tsx` / `TransferTicketForm.tsx` (rounded borders, `text-sm`, gray-300 borders, black primary buttons). No new UI library.
- Responsive requirement from `specs/mission.md` still applies: the tickets list and nav bar must work on desktop, tablet, and mobile — door staff and organizers both need this to be usable on a phone.
- No new dependencies — `qrcode` is already installed and used by `generate.ts`.
