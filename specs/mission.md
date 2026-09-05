# Mission

This is an **internal proof-of-concept** ticket admin and check-in tool for a single two-day event (2026-10-29 and 2026-10-30). It is built for the event's organizers and door staff, not as a public-facing or multi-tenant product.

## Scope

The tool covers exactly three capabilities, detailed in `AGENTS.md`:

1. **Ticket generation** — turn a purchase into an Order, Ticket, User, and RegistrationSheet, and produce the scannable QR ticket.
2. **Ticket transfer** — reassign a ticket from one attendee to another.
3. **Check-in** — scan a ticket's QR at the door and register attendance per day, surfacing anti-fraud/anti-duplication alerts.

## Non-goals

- Not a general-purpose or multi-event ticketing platform — the event dates and structure are fixed for this single event.
- Not a payment processor — payment fields (`paymenIntent`, `paymentId`) are recorded for reference only; no checkout/payment flow is implemented here.
- No public attendee-facing accounts or self-service portal — this is an admin/staff tool.
- Authentication/authorization for staff users is out of scope unless a future phase calls for it — treat as an open question, not an assumed requirement.
