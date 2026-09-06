# Plan — Camera QR Scanning (Check-in)

One task group per bullet in `specs/roadmap.md` Phase 5.

## 1. Dependency

- `pnpm add jsqr` (pure-JS QR decoder, used only as the fallback when `BarcodeDetector` is unavailable).

## 2. `app/checkin/QrScanner.tsx`

- Client component (`"use client"`) with props: `{ onScan: (value: string) => void; active: boolean }`.
- On mount (and whenever `active` becomes `true`):
  - `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`, attach the stream to a `<video>` ref, `play()` it.
  - If it throws (denied/unavailable), set a local `error` state and render a small inline message — `CheckinForm` still works via manual entry regardless.
- Decode loop, driven by `requestAnimationFrame`:
  - Feature-detect `"BarcodeDetector" in window` once; if present, construct `new BarcodeDetector({ formats: ["qr_code"] })` and call `.detect(video)` per frame.
  - Otherwise draw the current video frame to an offscreen `<canvas>`, read `ImageData`, and run `jsQR(data, width, height)`.
  - Track the last value passed to `onScan`; only call `onScan` again when the newly-decoded string differs from it (per `requirements.md` Decisions).
- Cleanup: on unmount or when `active` becomes `false`, cancel the animation frame loop and stop all tracks on the stream (`track.stop()`).
- Render: a `<video>` element (`playsInline`, `muted`) sized responsively (`w-full`, capped `max-w` + fixed aspect ratio via Tailwind), plus the error message slot when camera access fails.

## 3. `CheckinForm` integration

- Add local state: `mode: "camera" | "manual"`, defaulting to `"camera"` (per `requirements.md` Decisions).
- Make the `registrationSheetId` input reflect a controlled value the scanner can set (introduce a `useState` for it, `defaultValue` behavior otherwise unchanged — still a plain form field submitted via `FormData`).
- Render `<QrScanner active={mode === "camera"} onScan={(value) => setRegistrationSheetId(value)} />` above the `registrationSheetId` field when `mode === "camera"`.
- Add a toggle button ("Switch to manual entry" / "Switch to camera") that flips `mode` — swapping between the camera view and today's plain typed field, both driving the same underlying input value.
- No changes to `outcomeCopy`, the transfer banner, or any success/error rendering — those are untouched from Phase 3.

## 4. Manual verification only

- No new `lib/tickets/*` pure logic is introduced by this phase (see `requirements.md` Decisions on testing scope), so no new Vitest file is added. Confirm `pnpm test` still passes unchanged.
- Manual walkthrough steps are enumerated in `validation.md`.
