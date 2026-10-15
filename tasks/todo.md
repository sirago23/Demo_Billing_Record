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
- [ ] Every SPEC success criterion (1-6) checked and reported
- [ ] Checks, build and E2E pass
- [ ] Nothing sensitive staged
- [ ] Ready for demo
