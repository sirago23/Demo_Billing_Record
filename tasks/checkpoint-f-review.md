# Checkpoint F review: Phase 4 UI redesign (`36958fc..c25f3f3`)

Scope: Tasks 9-14, five-axis code review plus a Playwright check of `/`, `/records`, `/records/new` at 1280, 390 and 320 px. No server code, auth or schema changed in this range.

## Fixed
- **Required:** `ConfirmDialog` closed when the click landed on the dialog's own padding (the target was the `<dialog>`, read as a backdrop click). Padding moved to an inner div. Browser check: padding click keeps it open, backdrop click closes it.
- **Required:** `/records` had no guard against out-of-order month responses (the dashboard has one). Added a latest-request counter in `src/app/records/page.tsx`. Browser check with a delayed previous-month response: final view is the current month. The failure was not reproduced before the fix.

## Not fixed (Optional / Nit)
- Optional: `PieCard` falls back to colour 0 for a category not in `allCategories` (`Math.max(0, indexOf)`), which hides a mismatch. Reason: cannot happen with validated categories.
- Optional: Recharts `Tooltip` keeps its default styling, not Passbook tokens. Reason: not in any acceptance criterion.
- Optional: the dashboard keeps an old error banner visible while the next month loads. Reason: cosmetic.
- Nit: `ACTION` class constant inside `RecordsPage` could move to module scope. Reason: style only.
- Not in this range: `npm audit` shows 11 vulnerabilities; `SESSION_SECRET` is not derived from `APP_PASSWORD`.
