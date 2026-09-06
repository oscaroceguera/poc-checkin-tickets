# Requirements — Tickets List & Navigation

## Context

This is **Phase 4 — Tickets List & Navigation** from `specs/roadmap.md`. Phase 1 (`lib/tickets/generate.ts`) creates a `Ticket` + `User` + `RegistrationSheet` + QR per purchase, but the QR is only ever shown once, in the success panel of `app/admin/generate`, right after generation — there is no way to look it up again afterward. Separately, the app now has three working routes (`app/admin/generate`, `app/admin/transfer`, `app/checkin`) plus the untouched `app/page.tsx` landing page, with no shared navigation between them — each route is only reachable by typing its URL directly.

## Scope

1. `lib/tickets/list.ts` — `listTickets()`, a pure read (no input): queries `prisma.ticket.findMany` including `user` and `registrationSheet`, and computes `transferred: boolean` per ticket via the same `TicketTransfer.findFirst({ where: { originalTicketId: ticket.id } })` lookup `checkin.ts` uses. Regenerates each ticket's QR image with the `qrcode` package encoding `registrationSheet.id` — the same payload rule `generate.ts` uses, nothing new is persisted.
2. `app/admin/tickets/page.tsx` — a Server Component that calls `listTickets()` directly (read-only, no form/Server Action needed) and renders one row per ticket: user `fullName`/`email`, `ticket.ticketType`, a "Transferred" badge when `transferred` is `true`, and the QR `<img>`.
3. `app/components/NavBar.tsx` — a client component (needs `usePathname` for active-link styling), rendered once in `app/layout.tsx` above `{children}` so it appears on every route. Links: Home (`/`), Generate (`/admin/generate`), Transfer (`/admin/transfer`), Tickets (`/admin/tickets`), Check-in (`/checkin`).

## Decisions

- `listTickets()` takes no filters/pagination — YAGNI for a single-event POC; can be added later if the ticket count grows unwieldy.
- QR images are regenerated on every render rather than cached or stored, matching the existing rule that the QR payload is always just `registrationSheet.id` — there is nothing render-specific about it.
- The nav bar is a flat, always-visible row of links that wraps on narrow viewports — no collapsible/hamburger menu. Five destinations don't justify one, and it keeps with `specs/mission.md`'s "responsive," not "mobile-app-like," requirement.
- The tickets list is read-only — no per-row actions (transfer, check-in) live here; those stay on their existing dedicated pages/forms.

## Out of scope

- Search/filter/sort/pagination on the tickets list.
- Editing or deleting a ticket from the list view.
- Any change to `app/page.tsx`'s content beyond it being a nav-bar destination.
- Authentication/authorization for who can view the tickets list (matches `specs/mission.md` non-goals).
