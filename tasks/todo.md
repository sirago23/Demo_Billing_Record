# Todo: Billing record

Spec: `SPEC.md`. Plan: `tasks/plan.md`.
Checks command used below: `npm run lint && npm run typecheck && npm test` (called "checks").

## Phase 1: Foundation

## Task 1: Scaffold the project and tooling

**Description:** Create the Next.js app (App Router, TypeScript strict, Tailwind) in the project root with the scripts from SPEC "Commands", Vitest, `.gitignore` and `.env.example`. Confirm better-sqlite3 and sharp install on this Windows machine.

**Acceptance criteria:**
- [x] `npm run dev` serves a placeholder page at http://localhost:3000
- [x] Scripts `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:seed` exist
- [x] `.gitignore` covers `.env`, `data/`, `.tmp/`, `session-handoff/`, `node_modules/`, `credentials.json`, `token.json`; `.env.example` lists the SPEC variables with empty values

**Verification:**
- [x] Checks pass (one trivial Vitest test)
- [x] `npm run build` succeeds
- [x] Manual: open localhost:3000 and see the placeholder

**Dependencies:** None

**Files likely touched:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/app/page.tsx`

**Estimated scope:** Medium (scaffold generates most files)

## Task 2: Data layer

**Description:** Drizzle schema for `records` (SPEC "Data model"), DB client reading `DATABASE_PATH`, first migration, preset categories, Zod schemas for record input and Claude output, and baht↔satang helpers.

**Acceptance criteria:**
- [x] `npm run db:migrate` creates `data/billing.db` with the `records` table
- [x] Record input schema rejects amount ≤ 0, more than 2 decimals, impossible dates (`2026-02-30`), and a category that does not match the type
- [x] Claude output schema accepts valid JSON, JSON wrapped in extra text, and converts BE years (2569 → 2026); rejects unknown categories

**Verification:**
- [x] Checks pass, with `tests/validation.test.ts` and `tests/money.test.ts` covering the cases above
- [x] Manual: open the DB file and see the table

**Dependencies:** Task 1

**Files likely touched:** `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `src/lib/categories.ts`, `src/lib/validation.ts`, `tests/validation.test.ts`

**Estimated scope:** Medium

## Task 3: Manual entry slice

**Description:** `POST /api/records` validates with Zod and inserts. The shared `RecordForm` (type, amount, date default today, category filtered by type, merchant, note) is used on `/records/new`.

**Acceptance criteria:**
- [x] Saving a valid manual record inserts one row with `source = manual` and amount in satang
- [x] Invalid input shows a visible error in the form and the API returns 400 `{ error }`
- [x] Changing the type changes the category options

**Verification:**
- [x] Checks pass
- [x] Manual: add ฿125.50 Food & Drink in the browser, then confirm the row in SQLite (12550 satang)

**Dependencies:** Task 2

**Files likely touched:** `src/app/api/records/route.ts`, `src/components/RecordForm.tsx`, `src/app/records/new/page.tsx`

**Estimated scope:** Small-Medium

## Checkpoint A: Foundation
- [ ] Checks pass and `npm run build` succeeds
- [ ] A manual record saves and is correct in the DB
- [ ] Review with human before Phase 2

## Phase 2: Core features

## Task 4: Slip extraction slice

**Description:** `extract.ts` resizes the image with sharp (long edge ≤ 1568 px), calls Claude with an injected client and a JSON-only prompt (Thai slips, BE years, preset categories), and parses with the Task 2 schema. `POST /api/extract` checks file type (JPEG/PNG/WebP) and size (≤ 10 MB) and returns the result without writing to the DB. `UploadBox` on `/records/new` shows a loading state, then pre-fills `RecordForm`; saving sets `source = slip`.

**Acceptance criteria:**
- [x] A readable slip pre-fills type, amount, date, category and merchant; nothing is saved until Save is pressed
- [x] Wrong file type or > 10 MB is rejected with a clear message; a failed read opens an empty form with "Could not read this image, please fill in manually"
- [x] Confidence < 0.7 shows "Please check these values"

**Verification:**
- [x] Checks pass, with `tests/extract.test.ts` using a fake Claude client (valid answer, garbage answer, thrown error); no real API calls
- [x] Manual (spends credits, ask first): upload one real Thai bank slip and confirm the values and that the read takes under 15 s

**Dependencies:** Task 3

**Files likely touched:** `src/lib/extract.ts`, `src/app/api/extract/route.ts`, `src/components/UploadBox.tsx`, `src/app/records/new/page.tsx`, `tests/extract.test.ts`

**Estimated scope:** Medium

## Task 5: Records list slice

**Description:** `GET /api/records?month=YYYY-MM`, `PATCH` and `DELETE /api/records/[id]`, and `/records` page with a month picker and a table (newest first, `฿1,234.50` format). Edit opens `RecordForm`; delete asks for confirmation.

**Acceptance criteria:**
- [x] The table shows only the chosen month, newest first, with formatted amounts
- [x] Edit saves changes; delete removes the row after confirmation
- [x] Unknown id returns 404; invalid month returns 400

**Verification:**
- [x] Checks pass
- [x] Manual: add records in two months, switch months, edit one, delete one

**Dependencies:** Task 3

**Files likely touched:** `src/app/api/records/route.ts`, `src/app/api/records/[id]/route.ts`, `src/app/records/page.tsx`, `src/components/MonthPicker.tsx`

**Estimated scope:** Medium

## Task 6: Dashboard slice

**Description:** `summary.ts` computes income, expense, balance and per-category sums. The dashboard at `/` shows the month picker, three cards and two Recharts pie charts (legend, amounts, percentages), or "No data for this month".

**Acceptance criteria:**
- [x] Cards show correct income, expense and balance for the month
- [x] Pie slices match the per-category sums in the records list
- [x] An empty month shows "No data for this month" instead of an empty chart

**Verification:**
- [x] Checks pass, with `tests/summary.test.ts` (totals, balance, per-category, empty month)
- [x] Manual: look at the dashboard in the browser and compare with the list

**Dependencies:** Task 5 (month picker, month query)

**Files likely touched:** `src/lib/summary.ts`, `src/app/page.tsx`, `src/components/SummaryCards.tsx`, `src/components/PieCard.tsx`, `tests/summary.test.ts`

**Estimated scope:** Medium

## Checkpoint B: Core flow
- [ ] Checks pass and `npm run build` succeeds
- [ ] Upload a slip → review → save → see it in the list → see it in the pie chart
- [ ] Review with human before Phase 3

## Phase 3: Protect and finish

## Task 7: Password login

**Description:** `auth.ts` signs and verifies a session cookie with Web Crypto HMAC (`SESSION_SECRET`). `middleware.ts` redirects pages to `/login` and returns 401 for API routes without a valid cookie. `/login` page, `POST /api/login` (checks `APP_PASSWORD`, sets httpOnly cookie for 7 days), `POST /api/logout` and a Log out button.

**Acceptance criteria:**
- [x] Without a cookie, `/` redirects to `/login` and `GET /api/records` returns 401
- [x] Right password logs in; wrong password shows "Wrong password"
- [x] Log out clears the cookie; a tampered cookie is rejected

**Verification:**
- [x] Checks pass, with `tests/auth.test.ts` (sign/verify, tampered, expired)
- [x] Manual: `curl -i localhost:3000/api/records` returns 401; log in and out in the browser

**Dependencies:** Tasks 3-6

**Files likely touched:** `src/lib/auth.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/api/login/route.ts`, `src/app/api/logout/route.ts`

**Estimated scope:** Medium

## Task 8: Seed data, E2E smoke test, demo check

**Description:** `scripts/seed.ts` adds demo records for the last 2 months. One Playwright test: log in → add a manual expense → see it in the list → see its category on the dashboard. Final demo check with 3 real images.

**Acceptance criteria:**
- [x] `npm run db:seed` fills the current and previous month with income and expenses in several categories
- [x] `npm run test:e2e` passes without calling Claude
- [x] Demo check: Thai bank slip and receipt pre-fill correctly; an unreadable image shows the "fill in manually" message

**Verification:**
- [x] Checks and `npm run test:e2e` pass
- [x] Manual (spends credits, ask first): the 3-image demo check

**Dependencies:** Task 7

**Files likely touched:** `scripts/seed.ts`, `e2e/smoke.spec.ts`, `playwright.config.ts`

**Estimated scope:** Small-Medium

## Checkpoint C: Complete
- [x] Every SPEC success criterion (1-6) checked and reported
- [x] Checks, build and E2E pass
- [x] Nothing sensitive staged
- [ ] Ready for demo

## Phase 4: UI redesign

Spec: `SPEC-ui-redesign.md` (option A, Passbook). Plan: `tasks/plan.md` > Phase 4.
Every UI task: load `agent-skills:frontend-ui-engineering` before starting; check it in a real browser with Playwright before ticking. E2E labels listed in the plan must not change.

## Task 9: Design tokens, Anuphan font, UI primitives, login screen

**Description:** Add the option A colour tokens and chart colours to `globals.css` with Tailwind 4 `@theme`, load Anuphan via `next/font/google` in the root layout, install `lucide-react`, and create `Button` and `Field` primitives. Restyle `/login` with them as the first screen that proves the tokens work end to end.

**Acceptance criteria:**
- [x] Tokens from `SPEC-ui-redesign.md` > Chosen design exist as Tailwind theme colours; the body uses `paper` background, `ink` text, Anuphan and tabular figures
- [x] `/login` shows the wordmark, a 48 px password field and a primary "Log in" button in the accent colour; "Wrong password" shows as a designed error
- [x] No hex colours in components; `lucide-react` is the only new dependency

**Verification:**
- [x] Checks pass; `npm run build` succeeds; `npm run test:e2e` passes
- [x] Visual check: screenshot `/login` at 1280 px and 390 px; type a wrong password and see the error; log in for real; Tab through the form and see the focus ring

**Dependencies:** None (Tasks 1-8 done)

**Files likely touched:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Field.tsx`, `src/app/login/page.tsx`, `package.json`

**Estimated scope:** Medium

## Task 10: App header and navigation

**Description:** One `AppHeader` with the wordmark, Overview and Records links (current page underlined in accent), an "Add record" primary button and "Log out". On phone (≤ 760 px), Overview, Records and Add record move to a bottom tab bar and Log out becomes an icon button with the accessible name "Log out". Used on the dashboard, records and add-record pages; replaces the old per-page links.

**Acceptance criteria:**
- [x] The header looks the same on all three pages, and the current page is marked (`aria-current="page"`)
- [x] Exactly one visible "Add record" link and one visible "Log out" button at any width
- [x] On phone, the tab bar does not cover page content (bottom padding on `<main>`)

**Verification:**
- [x] Checks pass; `npm run test:e2e` passes
- [x] Visual check: screenshots of the header on all three pages at 1280 px and 390 px; click every nav link and Log out for real; no sideways scroll at 390 and 320 px

**Dependencies:** Task 9

**Files likely touched:** `src/components/AppHeader.tsx`, `src/components/LogoutButton.tsx`, `src/app/page.tsx`, `src/app/records/page.tsx`, `src/app/records/new/page.tsx`

**Estimated scope:** Medium

## Checkpoint D: Foundation
- [ ] Checks, build and E2E pass
- [ ] Login and header match option A at 1280 and 390 px (screenshots looked at)
- [ ] Review with human before Phase 4b

## Task 11: Dashboard in Passbook style

**Description:** Restyle the dashboard: month picker with 44 px arrow buttons, the balance as a large statement ("… left after spending this month. You kept N% of what came in."), the 3-cell ledger strip (Money in in `in` colour, Money out in `out` colour, Balance on `accent-soft`), and both pie charts as Recharts donuts with the total in the centre and our own legend (dotted leaders, amount, one-decimal percent). Segments fade in once on load; off under `prefers-reduced-motion`.

**Acceptance criteria:**
- [x] Totals, balance and per-category amounts are unchanged from before (same numbers as the records list)
- [x] Donut colours and legend colours come from one helper and match in order
- [x] An empty month shows "No data for this month" as a designed empty state, with an "Add record" hint

**Verification:**
- [x] Checks pass (add a unit test if a new pure helper is created, e.g. percent formatting); `npm run test:e2e` passes
- [x] Visual check: screenshots at 1280 px and 390 px for a seeded month and an empty month; use the month picker for real in both directions; compare chart amounts with `/records`; check with reduced motion that nothing animates

**Dependencies:** Task 10

**Files likely touched:** `src/app/page.tsx`, `src/components/MonthPicker.tsx`, `src/components/SummaryCards.tsx`, `src/components/PieCard.tsx`, `src/lib/chart-colors.ts`

**Estimated scope:** Medium

## Task 12: Add-record screen (upload box and form)

**Description:** Restyle `/records/new`: upload box with dashed border (idle with "Choose file", reading with spinner, error with the "Could not read this image, please fill in manually" text) beside the form on desktop and above it on phone. `RecordForm` gets the large amount field with a ฿ prefix, type as a segmented control (styled native radios), 48 px fields, the "Please check these values" warning in `warn` colours, and Save / Cancel buttons. Labels stay as listed in the plan. The same form is used when editing in Task 13.

**Acceptance criteria:**
- [ ] Clicking "Choose file" opens the file chooser; wrong type or > 10 MB shows a designed error
- [ ] Reading, read-failed and low-confidence states each look designed; nothing is saved before Save
- [ ] Changing the type still filters the categories; "Record saved" still appears after Save

**Verification:**
- [ ] Checks pass; `npm run test:e2e` passes
- [ ] Visual check: screenshots at 1280 px and 390 px of idle, reading (delayed `/api/extract` via Playwright route), read failed, low confidence (fake response with confidence 0.5), wrong file type, and saved; use the file chooser, type toggle, category select and Save for real. No real Claude calls

**Dependencies:** Task 10

**Files likely touched:** `src/components/UploadBox.tsx`, `src/components/RecordForm.tsx`, `src/app/records/new/page.tsx`, `src/components/ui/Field.tsx`

**Estimated scope:** Medium

## Task 13: Records list, edit and styled delete confirmation

**Description:** Restyle `/records` as a ledger: ruled rows, tabular amounts in `in` / `out` colours, newest first. On phone (≤ 760 px), rows become stacked cards (date and category on one line, merchant, amount right-aligned) with no sideways scroll. Edit opens the restyled `RecordForm` in a panel. Delete opens a `ConfirmDialog` (native `<dialog>`, danger button) instead of `window.confirm`. Add an E2E test for delete: cancel keeps the row, confirm removes it.

**Acceptance criteria:**
- [ ] Rows are still table rows on desktop (E2E `getByRole("row")` passes) and readable on phone without sideways scroll
- [ ] Delete shows a styled dialog with a danger button; Esc and Cancel close it without deleting
- [ ] Loading, error and "No records for this month" states look designed

**Verification:**
- [ ] Checks pass; `npm run test:e2e` passes, including the new delete test
- [ ] Visual check: screenshots at 1280 px and 390 px of a seeded month, an empty month, the edit panel and the delete dialog; switch months, edit and save a record, cancel and confirm a delete, all for real; keyboard: Tab into the dialog, Esc closes it

**Dependencies:** Task 11 (shares `MonthPicker`), Task 12 (edit uses `RecordForm`)

**Files likely touched:** `src/app/records/page.tsx`, `src/components/ui/ConfirmDialog.tsx`, `e2e/delete.spec.ts`

**Estimated scope:** Medium

## Checkpoint E: Screens
- [ ] Checks, build and E2E pass
- [ ] Every screen and state from Tasks 11-13 matches option A at 1280 and 390 px (screenshots looked at)
- [ ] Review with human before Phase 4c

## Task 14: Consistency and accessibility pass

**Description:** Compare all screens side by side and remove any drift (stray colours, radii or default-looking controls). Keyboard pass on login, add-record and the delete dialog. Check contrast of text and amounts against WCAG AA. Check 320 px width. Update the favicon to the accent colour if it no longer matches.

**Acceptance criteria:**
- [ ] No hex colours outside `globals.css`; no unstyled native control left (file input, select, date)
- [ ] Contrast of `muted`, `in`, `out` and `warn` text on their backgrounds is ≥ 4.5:1; focus ring visible on every control
- [ ] No page-level sideways scroll at 1280, 390 and 320 px on any screen

**Verification:**
- [ ] Checks pass; `npm run build` succeeds; `npm run test:e2e` passes
- [ ] Visual check: full set of screenshots (4 screens, all states) at 1280 px and 390 px, plus 320 px for each screen; contrast ratios computed and listed in the report

**Dependencies:** Tasks 9-13

**Files likely touched:** `src/app/globals.css`, `src/app/icon.svg`, any component with drift

**Estimated scope:** Small-Medium

## Checkpoint F: Redesign complete
- [ ] All 8 success criteria in `SPEC-ui-redesign.md` checked and reported
- [ ] `/agent-skills:review` run, prompt naming every page and state above; Critical and Important findings fixed
- [ ] Nothing sensitive staged
- [ ] Ready for demo
