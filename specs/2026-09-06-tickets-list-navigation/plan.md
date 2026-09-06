# Plan — Phase 4: Tickets List & Navigation

## 1. Data — `lib/tickets/list.ts`

1.1. Define `ListedTicket` type: `id`, `ticketType`, `user: { email, fullName }`, `registrationSheetId`, `qrDataUrl`, `isTransferred`, `originalTicketId?`, `transferredTicketId?`.

1.2. Define an injectable Prisma-shaped dependency interface (`ListTicketsDeps`) scoped to only the queries needed — `ticket.findMany` with `include: { user: true, registrationSheet: true }`, and `ticketTransfer.findMany` (or per-ticket lookup) — following the narrow-interface pattern in `checkin.ts`'s `CheckinTicketPrismaClient`.

1.3. Implement `listTickets(deps: ListTicketsDeps = { prisma })`:
   - Fetch all tickets with their `user` and `registrationSheet`.
   - Fetch all `TicketTransfer` rows once, build a lookup by `originalTicketId`.
   - For each ticket, regenerate `qrDataUrl` via `QRCode.toDataURL(registrationSheet.id)` (skip/omit for tickets with no registration sheet — shouldn't happen per data model, but guard defensively).
   - Return `ListedTicket[]`.

1.4. No Zod schema needed — this is a read with no external input to validate.

## 2. Page — `app/admin/tickets/page.tsx`

2.1. Server Component that calls `listTickets()` directly (no client fetch needed).

2.2. Render each ticket as a card: ticket type, user name/email, transfer badge (only when `isTransferred`), and the QR `<img>` — same `<img>` pattern as `GenerateTicketForm.tsx`.

2.3. Empty state: simple message when there are zero tickets.

2.4. Responsive layout: stack cards in a single column on mobile, grid (2–3 cols) on tablet/desktop — Tailwind `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` or similar.

## 3. Navigation — `app/components/NavBar.tsx`

3.1. Server Component with links: Home (`/`), Generate (`/admin/generate`), Transfer (`/admin/transfer`), Tickets (`/admin/tickets`), Check-in (`/checkin`).

3.2. Use Next.js `Link` for client-side navigation.

3.3. Responsive: horizontal row on desktop/tablet; confirm it wraps or stays usable on narrow mobile widths (simple flex-wrap is enough for this POC — no hamburger menu needed).

3.4. Wire into `app/layout.tsx` so it renders above `{children}` on every route.

## 4. Tests — `lib/tickets/list.test.ts`

4.1. Returns all tickets with correct shape when no transfers exist (`isTransferred: false`).

4.2. Marks a ticket `isTransferred: true` with correct `originalTicketId`/`transferredTicketId` when a matching `TicketTransfer` row exists.

4.3. Returns an empty array when there are no tickets.

4.4. `qrDataUrl` is generated per ticket from its `registrationSheet.id` (mock/spy `QRCode.toDataURL` or assert it's a data URL string, consistent with how `generate.test.ts` handles this).

## Task groups are independently implementable

- Group 1 (data) has no dependency on 2/3 and should be built and tested first.
- Group 2 (page) depends on Group 1's exported types/function.
- Group 3 (nav) is fully independent of 1/2 and can be done in parallel.
- Group 4 (tests) follows Group 1.
