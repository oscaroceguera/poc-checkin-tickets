# Validation — Phase 4: Tickets List & Navigation

## Automated

- [x] `pnpm vitest run` passes, including new `lib/tickets/list.test.ts`. (34/34 tests pass)
- [x] `pnpm lint` (Biome) reports no issues on new/changed files. `app/admin/tickets/page.tsx` triggers `lint/performance/noImgElement` (same pre-existing tradeoff as `GenerateTicketForm.tsx` — a QR data URL isn't a fit for `next/image`'s optimizer). Non-blocking warning, not a regression.
- [x] TypeScript strict mode compiles with no errors (`tsc` via `pnpm build` or editor diagnostics).

Specific assertions required in `list.test.ts` (per plan.md § 4):

- [x] All tickets returned with `user`, `registrationSheetId`, `qrDataUrl`, and `isTransferred` populated.
- [x] A ticket with a `TicketTransfer` row is marked `isTransferred: true` and carries `originalTicketId`/`transferredTicketId`.
- [x] A ticket with no transfer is `isTransferred: false` with no linkage fields.
- [x] Empty ticket table returns `[]` without throwing.
- [x] `listTickets` uses the injected `deps.prisma`, not the real shared client (no real DB hit in unit tests).

## Manual

- [x] Visit `/admin/tickets` after generating a few tickets via `/admin/generate` — confirm each appears with a correct, scannable QR.
- [x] Transfer one ticket via `/admin/transfer`, revisit `/admin/tickets`, confirm that ticket now shows a transferred indicator.
- [x] Confirm the empty state renders correctly on a fresh/empty database. (Verified by backing up the dev DB's ticket data, truncating the tables, screenshotting the empty state, then restoring the backup.)
- [x] Confirm the nav bar appears on every route (`/`, `/admin/generate`, `/admin/transfer`, `/admin/tickets`, `/checkin`) and each link navigates correctly.
- [x] Resize the browser (or use device emulation) to check the tickets list and nav bar at mobile (~375px), tablet (~768px), and desktop (~1280px) widths — no horizontal overflow, nav stays usable, cards reflow sensibly.

## Tone check

No new user-facing copy beyond labels ("Home", "Generate", "Transfer", "Tickets", "Check-in", "Transferred") and an empty-state message — keep it short and consistent with existing admin copy (e.g. "Ticket generated" style: plain, factual, no exclamation marks).

## Definition of done

- [x] `list.ts`, its tests, the tickets page, and the nav bar are implemented per plan.md.
- [x] All automated checks above pass.
- [x] Manual walkthrough completed on at least one narrow (mobile) and one wide (desktop) viewport.
- [x] `specs/roadmap.md` Phase 4 checkboxes marked `[x]`.
