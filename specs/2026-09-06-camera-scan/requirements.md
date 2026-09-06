# Requirements — Camera QR Scanning for Check-in

## Context

This is **Phase 5 — Camera QR Scanning** from `specs/roadmap.md`. `specs/2026-09-06-checkin/requirements.md` (Phase 3) explicitly put camera/QR-scan input out of scope ("scanning hardware/camera input is out of scope (POC, admin-typed id is enough)"), matching the same call made earlier in `ticket-transfer/requirements.md`. This phase reverses that decision for the check-in page specifically: door staff scanning tickets from a phone or tablet (per `specs/mission.md`) benefit from pointing a camera at the QR instead of typing a `RegistrationSheet.id` by hand. `lib/tickets/checkin.ts`'s business logic and its outcomes (`checked-in` / `already-registered-today` / `transferred` flag / `ticket-not-found` / `user-not-found`) are unaffected — this phase only changes how `registrationSheetId` gets into the existing form.

## Scope

1. `app/checkin/QrScanner.tsx` — new client component. Opens the device camera via `getUserMedia({ video: { facingMode: "environment" } })` and decodes frames using the browser-native `BarcodeDetector` API where `window.BarcodeDetector` exists; falls back to a `jsQR` decode loop against a canvas snapshot of the video frame when it doesn't (Safari/Firefox today).
2. On a successful decode, the scanner calls an `onScan(value: string)` callback that fills `CheckinForm`'s existing `registrationSheetId` text input — it does **not** auto-submit the form. Staff still pick the day and press submit, so a misread or stale scan can be corrected before it's committed.
3. `CheckinForm` renders `QrScanner` above the existing typed/pasted `registrationSheetId` field; the typed field remains fully functional and visible as a fallback (denied camera permission, no camera hardware, damaged QR, non-secure context).
4. New dependency: `jsqr` (small, pure JS, no native/build step) for the fallback decode path.

## Decisions

- Camera access is requested only on the check-in page, not globally — no camera permission prompt anywhere else in the app.
- A decode never auto-submits the check-in form; it only populates the text field. This keeps `lib/tickets/checkin.ts` and its Server Action adapter completely unchanged — the scanner is purely a new way to fill an existing input.
- `BarcodeDetector` is tried first (no extra dependency, hardware-accelerated on supporting browsers), with `jsQR` as a fallback, rather than using `jsQR` unconditionally — keeps the common-case path dependency-light.
- If `getUserMedia`/`BarcodeDetector`/`jsQR` fail to initialize (no camera, permission denied, insecure context), the component shows an inline message and the page remains usable via the typed field — this is not a blocking error state.
- The camera stream is stopped when the component unmounts (navigating away from `/checkin`) and no further lifecycle management is needed — no "scan queue" or multi-ticket batch flow.
- Back camera (`facingMode: "environment"`) is the default and only camera choice — no manual front/back camera picker.

## Out of scope

- Any change to `lib/tickets/checkin.ts`, its Server Action, or its outcomes.
- Scanning from an uploaded image/file instead of a live camera.
- Support for browsers/contexts without camera or without a secure (HTTPS/localhost) origin — `getUserMedia` requires a secure context; there is no fallback for insecure HTTP.
- Auto-submit on scan.
- Torch/flash control, zoom, or a camera-selection UI beyond the browser/OS default.
