# Plan — Phase 6: Polish

## 1. Check-in outcome alerts

1.1. Add small inline SVG icon components (check-circle, clock, arrow-exchange, x-circle, alert-triangle) near the top of `app/checkin/CheckinForm.tsx`, each accepting a `className` for sizing/color via Tailwind (`currentColor` stroke/fill so color comes from the wrapping text color class).

1.2. Replace the single generic error block (`state.status === "error"`) with outcome-specific rendering:
   - `ticket-not-found` → red alert, X-circle icon, "This ticket was not recognized."
   - `user-not-found` → red alert, alert-triangle icon, "No user could be found for this ticket."
   - `invalid-input` / fallback (`unknown-error`) → keep existing plain red text treatment (no icon), since these aren't check-in outcomes.

   This requires `CheckinTicketActionState`'s error branch (in `app/checkin/actions.ts`) to carry which case occurred (e.g. a `code` field: `"ticket-not-found" | "user-not-found" | "generic"`) so the component can branch without re-deriving it from the message string.

1.3. Update the success block: `checked-in` → green alert with check-circle icon; `already-registered-today` → amber alert with clock icon. Keep using `outcomeCopy` for the text.

1.4. Give the `transferred` flag its own visually distinct sub-alert (amber, arrow-exchange icon) rendered under the outcome alert, replacing the current plain amber paragraph.

1.5. Verify all alert blocks keep `role="alert"` / `aria-live="polite"` and dark-mode class pairs consistent with the rest of the file.

## 2. Lint clean pass

2.1. Run `pnpm format` to apply Biome's auto-fixes across the repo.

2.2. Add a `// biome-ignore lint/performance/noImgElement: QR code is a data: URI, next/image can't optimize it` comment above the `<img>` in `app/admin/generate/GenerateTicketForm.tsx:84`.

2.3. Add the same suppression above the `<img>` in `app/admin/tickets/page.tsx:45`.

2.4. Run `pnpm lint` and confirm zero warnings/errors.

## 3. README

3.1. Replace `README.md` with: project one-liner (link to `AGENTS.md` for full context), prerequisites (Node, pnpm, PostgreSQL), install (`pnpm install`), env setup (`.env` / `DATABASE_URL`, pointing at `prisma/schema.prisma`), Prisma migrate (`pnpm prisma migrate dev`), dev server (`pnpm dev`), running tests (`pnpm vitest run`), lint/format (`pnpm lint`, `pnpm format`), and a link to `specs/mission.md` for scope/non-goals.

3.2. Keep it short — this is an internal PoC, not a public package README.

## 4. Verification

4.1. `pnpm lint` — zero warnings.

4.2. `pnpm vitest run` — full suite still passes (no business-logic changes expected to break anything, but confirms nothing in `actions.ts`'s state shape change broke other callers).

4.3. Manual walkthrough of check-in UI covering all 5 outcomes (see `validation.md`).
