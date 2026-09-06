# Validation — Ticket Transfer

## Automated

- [x] `pnpm test` passes, including new `lib/tickets/transfer.test.ts` covering: valid transfer (new email), valid transfer (reused ticketless `User`), ticket-not-found, already-transferred, invalid input (missing/malformed fields)
- [x] Tests use an injected/mocked Prisma client — no real database or HTTP call required to run them
- [x] `pnpm build` succeeds
- [x] `pnpm lint` is clean (Biome; one expected `noImgElement` warning carried over from Phase 1's generate form, no errors)
- [x] A test confirms the new `Ticket` copies `ticketType`/`orderId`/`paymenIntent`/`paymentId` from the original rather than generating new values
- [x] A test confirms the new `RegistrationSheet` copies `event` from the original's `RegistrationSheet` and has `registeredDay1`/`registeredDay2`/`onboarding` all `false`, regardless of the original's check-in state
- [x] A test confirms the created `TicketTransfer.originalTicketId`/`transferredTicketId` point at the correct ticket ids
- [x] A test confirms a second transfer of the same `originalTicketId` is rejected (`already-transferred`) without creating a second `TicketTransfer` row

## Manual

- [x] Submitting the transfer form with a valid original ticket id and a brand-new email creates one new `User`, one new `Ticket`, one new `RegistrationSheet`, and one `TicketTransfer` row (verified via a direct query against the provisioned database); the original `Ticket`/`RegistrationSheet`/`User` rows are unchanged
- [x] The ticketless-`User`-reuse path is verified by the unit test's mocked scenario, not a manual UI/DB walkthrough — there is no way to produce a genuinely ticketless `User` row through the current UI (`generate.ts` and `transfer.ts` both always create a `Ticket` in the same transaction as any `User` they create), so this branch is only reachable in practice via a future flow or direct DB edit
- [x] Submitting with an original ticket id that doesn't exist shows a specific "ticket not found" message, not a generic/crash error (verified in-browser against the real DB)
- [x] Attempting to transfer the same original ticket a second time shows a specific "already transferred" message (verified in-browser against the real DB)
- [x] Submitting with a malformed email is blocked client-side by the `type="email"` input (same mechanism as Phase 1's generate form) before it can reach the server action; the per-field `invalid-input` message it would otherwise show is proven by the `transfer.test.ts` unit tests
- [x] Transfer admin form is checked at mobile (375px), tablet (768px), and desktop (1440px) widths — no horizontal overflow, fields and result remain usable/legible at each size (per `specs/mission.md` responsive requirement)

## Definition of done

- [x] All automated checks above pass
- [x] Manual walkthrough completed once against the real provisioned database
- [x] `specs/roadmap.md` Phase 2 checkboxes updated to `[x]`

## Explicitly not required for this phase

- No check-in/scan flow, and no "ticket transferred" alert surfaced at the door (Phase 3)
- No invalidation/blocking of the original ticket at check-in
- No camera/QR-scan input for looking up the original ticket
- No transfer history/audit UI beyond the single `TicketTransfer` row
- No staff authentication
- No visual design polish (Phase 4)
