# Spec: Billing record

## Objective

A personal web app that records income and expenses in Thai baht (THB). The user uploads a bank slip or a receipt photo; Claude vision reads it and pre-fills a form; the user checks it and saves. Records can also be entered by hand. A dashboard shows pie charts of expenses and income by category for a chosen month.

- **User:** one person (the owner), using it alone. Used for a live demo.
- **Grade:** prototype. Target build time: 2-3 hours. Clean enough to demo, not hardened for production.
- **Hosting:** runs locally for the demo. It may be deployed online later (host not chosen yet, out of scope for this spec); password login is kept for that.

### User stories and acceptance criteria

1. **Log in.** As the owner I enter one password to use the app.
   - Every page and API route except `/login` redirects (pages) or returns 401 (API) without a valid session cookie.
   - The correct password (`APP_PASSWORD` from `.env`) sets an httpOnly signed cookie valid for 7 days. A wrong password shows "Wrong password".
   - A "Log out" button clears the cookie.

2. **Upload a slip or receipt.** As the owner I upload an image and get a pre-filled form.
   - Accepts JPEG, PNG and WebP (HEIC not supported). Max 10 MB. Other files are rejected with a clear message.
   - The server resizes the image with sharp (long edge ≤ 1568 px) and sends it to Claude.
   - Claude returns JSON validated by Zod: `type` (income | expense), `amount` (THB, > 0), `date` (YYYY-MM-DD), `category` (one of the preset list), `merchant_or_counterparty` (string, optional), `note` (string, optional), `confidence` (0-1).
   - Works on Thai bank slips (K PLUS, SCB, Krungthai, Bangkok Bank, PromptPay) and Thai or English receipts. Buddhist-era years (e.g. 2569) are converted to CE (2026).
   - If reading fails or the JSON is invalid, the form opens empty with the message "Could not read this image, please fill in manually". No crash.
   - Reading takes under 15 s for a normal slip; a loading state is shown meanwhile.

3. **Review then save.** As the owner I check and fix the values before saving.
   - Extracted values appear in the same form used for manual entry, with all fields editable.
   - Nothing is written to the database until I press Save.
   - Low confidence (< 0.7) shows a "Please check these values" warning.

4. **Manual entry.** As the owner I add a record without an image.
   - Fields: type, amount, date (default today), category (filtered by type), merchant/counterparty, note.
   - Zod validation on client and server: amount > 0 with at most 2 decimals, valid date, category valid for the type.

5. **Categories (fixed preset).**
   - Expense: Food & Drink, Transport, Shopping, Bills & Utilities, Health, Entertainment, Other.
   - Income: Salary, Transfer In, Sales, Other.
   - Stored as constants in code, not editable in the UI.

6. **Record list.** As the owner I see, edit and delete records.
   - Table for the selected month, newest first: date, type, category, merchant, amount (formatted `฿1,234.50`).
   - Edit opens the same form; delete asks for confirmation.

7. **Dashboard with pie charts.** As the owner I see where money goes.
   - Month picker (default: current month).
   - Three cards: total income, total expense, balance (income − expense).
   - Two pie charts (Recharts): expenses by category and income by category, with legend, amounts and percentages. An empty month shows "No data for this month" instead of an empty chart.

### Out of scope

Multiple users, editable categories, CSV or other export, online deployment, budgets, multi-currency, storing the original images, duplicate-slip detection, OCR without Claude, mobile app, bank API integration.

## Tech Stack

- Next.js 15 (App Router), TypeScript strict, React 19
- Tailwind CSS 4
- SQLite via better-sqlite3 + Drizzle ORM (drizzle-kit for migrations)
- Zod (validation and Claude output parsing)
- Recharts (pie charts)
- sharp (image resizing)
- `@anthropic-ai/sdk`, model from env `CLAUDE_MODEL` (default `claude-sonnet-5-5`, vision-capable and fast enough for a demo)
- Vitest (unit), Playwright (one end-to-end smoke test)
- Node 20+

### Environment (`.env`, never committed; `.env.example` is committed)

```
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-5-5
APP_PASSWORD=
SESSION_SECRET=        # 32+ random chars, signs the session cookie
DATABASE_PATH=./data/billing.db
```

## Commands

```
Install:    npm install
Dev:        npm run dev                 # http://localhost:3000
Build:      npm run build
Start:      npm start
Lint:       npm run lint
Typecheck:  npm run typecheck           # tsc --noEmit
Test:       npm test                    # vitest run
E2E:        npm run test:e2e            # playwright test
DB migrate: npm run db:migrate          # drizzle-kit migrate
DB seed:    npm run db:seed             # demo records for the last 2 months
All checks: npm run lint && npm run typecheck && npm test
```

## Project Structure

```
src/
  app/
    login/page.tsx            → password form
    page.tsx                  → dashboard (cards + pie charts + month picker)
    records/page.tsx          → record list, edit, delete
    records/new/page.tsx      → upload slip or manual entry, shared form
    api/
      login/route.ts          → POST password, set cookie
      logout/route.ts
      extract/route.ts        → POST image → extracted JSON (no DB write)
      records/route.ts        → GET (by month), POST
      records/[id]/route.ts   → PATCH, DELETE
  components/                 → RecordForm, UploadBox, PieCard, SummaryCards, MonthPicker
  lib/
    db/schema.ts              → Drizzle schema
    db/client.ts              → better-sqlite3 connection
    categories.ts             → preset category constants
    validation.ts             → Zod schemas (record input, Claude output)
    extract.ts                → sharp resize + Claude call + parse
    summary.ts                → totals and per-category sums
    auth.ts                   → cookie sign/verify
  middleware.ts               → auth guard
scripts/seed.ts
tests/                        → Vitest unit tests (*.test.ts)
e2e/                          → Playwright tests
data/                         → SQLite file (gitignored)
drizzle/                      → migrations
```

### Data model

```ts
// src/lib/db/schema.ts
export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amountSatang: integer("amount_satang").notNull(), // THB × 100, avoids float errors
  date: text("date").notNull(),                     // YYYY-MM-DD
  category: text("category").notNull(),
  merchant: text("merchant"),
  note: text("note"),
  source: text("source", { enum: ["manual", "slip"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

Money is stored as integer satang. Convert to baht only for display.

## Code Style

- TypeScript strict, no `any`. Named exports. Files kebab-case or as the Next.js convention requires; components PascalCase.
- Server-only logic (DB, Claude, sharp) lives in `src/lib` and is never imported by client components.
- Validate every API input with Zod; return `{ error: string }` with a 4xx status on failure.
- UI text in English, data content can be Thai.

```ts
// src/lib/summary.ts
export function sumByCategory(rows: RecordRow[], type: RecordType): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== type) continue;
    totals.set(r.category, (totals.get(r.category) ?? 0) + r.amountSatang);
  }
  return [...totals].map(([category, amountSatang]) => ({ category, amountSatang }));
}
```

## Testing Strategy

Prototype level: test the logic that touches money and the Claude boundary; skip exhaustive UI tests.

- **Unit (Vitest, `tests/`):**
  - `validation`: valid and invalid record inputs; Claude output parsing (valid JSON, extra text around JSON, wrong category, Buddhist-era year).
  - `summary`: totals, balance, per-category sums, empty month.
  - `auth`: sign/verify cookie, tampered cookie rejected.
  - `extract`: Claude client mocked; failure returns the "fill in manually" result. No real API calls in tests.
- **E2E (Playwright, `e2e/`):** one smoke test: log in → add a manual expense → see it in the list → dashboard pie shows its category. Claude extraction is not called in E2E.
- **Manual demo check:** upload 3 real slips (one Thai bank slip, one receipt, one unreadable image) and confirm behaviour matches story 2.
- No coverage target.

## Boundaries

- **Always:** run `npm run lint && npm run typecheck && npm test` before each commit; validate inputs with Zod; store money as integer satang; keep secrets in `.env` only; check staged files for secrets before every push (public repo).
- **Ask first:** adding dependencies not listed in Tech Stack; changing the data model after the first migration; any call that spends Claude credits beyond the manual demo check; deploying anywhere; changing the category list.
- **Never:** commit `.env`, `data/`, `.tmp/`, `session-handoff/`, `node_modules/`; call the real Claude API in automated tests; log full images or the API key; save a record without the user pressing Save.

## Success Criteria

1. Without logging in, `/` redirects to `/login` and `GET /api/records` returns 401.
2. Uploading a real Thai bank slip pre-fills amount, date and type correctly, and the record appears in the list only after Save.
3. Uploading a non-slip image shows the "fill in manually" message and an empty form.
4. A manual record with amount `0` or an invalid date (e.g. `2026-02-30`) is rejected with a visible error.
5. After seeding, the dashboard for the current month shows correct income, expense and balance totals, and both pie charts match the per-category sums in the list.
6. `npm run lint && npm run typecheck && npm test` and `npm run test:e2e` pass.

## Open Questions

1. Should the original slip images be kept (for example in `data/uploads/`) so you can view them later? Currently out of scope to save time.
2. Is `claude-sonnet-5-5` OK for reading slips, or do you want `claude-opus-5-5` for higher accuracy at higher cost?
