# Validation — Phase 6: Polish

## Automated

- `pnpm lint` exits clean — 0 warnings, 0 errors (currently 2 `noImgElement` warnings must be resolved via targeted `biome-ignore`, not silently suppressed repo-wide).
- `pnpm vitest run` — full suite passes, including existing `lib/tickets/checkin.ts` tests. No new business logic is introduced, so no new test files are required, but if `app/checkin/actions.ts`'s error state shape changes (adding a `code` field), confirm no other file destructures/relies on the old shape.
- `pnpm build` succeeds (confirms the README/lint changes don't break the production build).

## Manual

Run through `/checkin` for each of the 5 outcomes and confirm each renders with its own color + icon, per `requirements.md`'s table:

1. **Checked in** — scan/enter a fresh ticket's registration sheet id for the selected day → green alert, check-circle icon, "Checked in".
2. **Already registered today** — submit the same id again for the same day → amber alert, clock icon, "Already registered today".
3. **Transferred** — check in a ticket that has a `TicketTransfer` row → outcome alert (green or amber per above) plus a separate amber "transferred" sub-alert with the arrow-exchange icon.
4. **Ticket not recognized** — submit a random/nonexistent registration sheet id → red alert, X-circle icon, "This ticket was not recognized."
5. **User not found** — check in a ticket whose user relation is missing (may require seeding this case directly, since normal generation always creates a user) → red alert, alert-triangle icon, "No user could be found for this ticket."

Also confirm:
- Field-level validation (empty id, missing day) still shows the existing plain red inline text — no icon, unchanged from today.
- Dark mode: all 5 alert states remain legible (correct dark-mode color pairing) when the OS/browser is in dark mode.
- Responsive: alerts render correctly on mobile width (checked at `~375px`) since door staff use phones/tablets per `specs/mission.md`.

## Tone check

- Alert copy stays terse and factual, matching existing strings ("Checked in", "This ticket was transferred to another user.") — no new copy should read as apologetic, verbose, or inconsistent with the rest of the app.

## Definition of done

- [ ] All 5 check-in outcomes have visually distinct color + icon treatment in `app/checkin/CheckinForm.tsx`.
- [ ] `pnpm lint` reports zero issues.
- [ ] `pnpm vitest run` passes.
- [ ] `README.md` has real, accurate setup/run instructions for a developer cloning the repo cold.
- [ ] `specs/roadmap.md` Phase 6 checkboxes updated to `[x]`.
