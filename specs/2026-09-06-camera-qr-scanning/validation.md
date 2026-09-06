# Validation — Camera QR Scanning (Check-in)

## Automated

- [x] `pnpm test` passes unchanged (no new `lib/tickets/*` logic — see `requirements.md` Decisions on testing scope)
- [x] `pnpm build` succeeds
- [x] `pnpm lint` is clean (Biome)

## Manual

- [x] Opening `/checkin` on a device with camera permission grants a live video preview by default (camera-on default, per `requirements.md`)
- [x] Holding a real ticket QR (from the tickets list, Phase 4) in frame fills the `registrationSheetId` field with the decoded value and does **not** auto-submit the form
- [x] Pressing "Check in" after a scan produces the same outcomes Phase 3 already covers (checked-in, already-registered-today, transferred banner, etc.) — proving the camera is purely a fill affordance
- [x] Holding the same QR steady in frame does not repeatedly refill/flicker the field (decoded value only re-fires `onScan` on change, per `requirements.md`)
- [x] "Switch to manual entry" hides the camera view and stops the camera (verify the camera indicator light/tab icon turns off) and shows the plain typed field pre-filled with whatever value was last set
- [x] "Switch to camera" from manual mode re-opens the camera view
- [x] Denying camera permission (or testing on a browser without camera access) shows an inline error/message and the manual field remains fully usable — check-in is not blocked
- [x] Verify on a browser with native `BarcodeDetector` (e.g. desktop Chrome or Android Chrome) that scanning works
- [x] Verify on a browser without `BarcodeDetector` (e.g. Safari/iOS, or by feature-detection override in devtools) that the `jsQR` fallback path decodes successfully
- [x] Navigating away from `/checkin` (or unmounting the component) stops the camera stream — no lingering camera indicator
- [x] Camera view and toggle are checked at mobile (390px), tablet (768px), and desktop (1920px) widths — no horizontal overflow, video preview stays legible and correctly sized at each (per `specs/mission.md` responsive requirement)

## Definition of done

- [ ] All automated checks above pass
- [ ] Manual walkthrough completed once on a real device with camera access (phone or tablet recommended, matching door-staff usage)
- [ ] `specs/roadmap.md` Phase 5 checkboxes updated to `[x]`

## Explicitly not required for this phase

- No new `lib/tickets/*` unit tests (no new pure business logic — camera/decode is a browser-API integration)
- No support for barcode formats other than QR
- No image-upload-based scanning
- No persisted camera/manual preference across page loads
- No staff authentication around camera access
- No visual design polish beyond basic responsiveness (Phase 6)
