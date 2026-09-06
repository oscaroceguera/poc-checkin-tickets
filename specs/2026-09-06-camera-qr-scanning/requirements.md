# Requirements — Camera QR Scanning (Check-in)

## Context

This is **Phase 5 — Camera QR Scanning (Check-in)** from `specs/roadmap.md`. Phase 3 (`lib/tickets/checkin.ts`) built the check-in flow around a typed/pasted `registrationSheetId`, explicitly leaving camera/QR-scan input out of scope ("scanning hardware/camera input is out of scope (POC, admin-typed id is enough)"). Phase 4 added a tickets list showing every ticket's QR image.

This phase closes that gap on the door-staff side: `app/checkin/page.tsx` gains a live camera view that decodes a QR code and fills the existing `registrationSheetId` field, so staff scanning with a phone or tablet don't have to type the id by hand. `checkin.ts` itself does not change — this is purely a client-side input affordance in front of the same Server Action.

## Scope

Given the existing `CheckinForm` (`app/checkin/CheckinForm.tsx`), add:

1. **`app/checkin/QrScanner.tsx`** — a client component that:
   - Requests camera access (`getUserMedia`) and renders a live `<video>` preview.
   - Decodes QR codes from video frames using the browser's native `BarcodeDetector` API when available, falling back to the `jsQR` library when it isn't (e.g. Safari/iOS).
   - On a successful decode, calls an `onScan(value: string)` callback with the decoded string — it does not submit the form itself.
   - Stops the camera stream on unmount and when scanning is toggled off, so the camera light doesn't stay on unnecessarily.
2. **`CheckinForm` integration** — the camera view is visible by default:
   - A decoded value fills the `registrationSheetId` field (does not auto-submit); staff review the value and press "Check in" as today.
   - A toggle/button lets staff switch to manual entry (camera off, typed field only) and back to camera mode.
   - If camera permission is denied or unavailable, the form still works via the typed field — this is a UX affordance, not a hard requirement.

| Field/Prop | Notes |
|---|---|
| `onScan` | `QrScanner` prop, called once per newly-decoded value (not on every frame) |
| `registrationSheetId` | unchanged — still the field `checkinTicketAction` reads from `FormData` |

## Decisions

- **Fill-only, no auto-submit.** Matches the roadmap wording exactly ("filling (not auto-submitting) the existing `registrationSheetId` field"). Staff keep a manual confirmation step before the check-in mutation runs — consistent with `checkin.ts` having no notion of "who is scanning" or replay protection; a human glance at the filled value is the safety net for a misread frame.
- **`BarcodeDetector` first, `jsQR` fallback.** `BarcodeDetector` needs no new dependency and is faster/more accurate where supported (Chrome/Android, recent desktop Chrome). `jsQR` (new dependency, pure JS, no native API needed) covers Safari/iOS and any browser without `BarcodeDetector`. `QrScanner` feature-detects `"BarcodeDetector" in window` once on mount and picks the decode path accordingly — both paths feed the same `onScan` callback so `CheckinForm` doesn't need to know which one ran.
- **Camera on by default.** The check-in page's primary use case is door staff on a phone/tablet scanning many tickets in a row; defaulting to camera-on saves a tap per session. A visible toggle covers camera-denied, noisy-environment, or staff-preference cases by switching to the same typed field Phase 3 already ships.
- **No new business logic or Server Action changes.** `checkin.ts` and `actions.ts` are untouched — this phase is additive UI only, feeding the same `registrationSheetId` input `CheckinForm` already posts.
- **No decode-rate throttling requirement beyond "once per newly-decoded value."** `QrScanner` tracks the last decoded value and only fires `onScan` again when the decoded string changes, so holding a QR steady in frame doesn't spam the field/callback.
- **Testing**: `QrScanner`'s camera/decode logic is a browser API integration (`getUserMedia`, `BarcodeDetector`, `<video>`/`<canvas>` frame capture) with no meaningful pure-function surface to unit test the way `lib/tickets/*` is tested — per `AGENTS.md`, unit tests are scoped to `lib/tickets/*` business logic, and this phase adds none there. Validation for this phase is manual (see `validation.md`), consistent with Phase 4's UI-only pieces (`NavBar`, list page) which also had no new `lib/tickets/*` logic to test.

## Out of scope

- Any change to `lib/tickets/checkin.ts`, `app/checkin/actions.ts`, or the check-in outcomes/business rules — those are Phase 3, unchanged here.
- Decoding barcode formats other than QR.
- Scanning from an uploaded image instead of a live camera.
- Remembering the staff's camera/manual preference across sessions (e.g. `localStorage`) — each page load defaults to camera-on per the Decisions above.
- Visual design polish beyond making the camera view responsive and legible (full polish is Phase 6).
- Staff authentication or any anti-abuse measure around who can open the camera.
