# Implementation Plan: Billing record

## Overview

Build the prototype described in `SPEC.md`: a single-user Next.js app that records income and expenses in THB, reads bank slips and receipts with Claude vision into a review form, lists records by month, and shows pie charts by category. Password login protects it so it can go online later. Target: 2-3 hours of build time.

## Architecture Decisions

- **One Next.js app** (App Router) holds UI and API routes. No separate back end.
- **SQLite file via better-sqlite3 + Drizzle.** Synchronous, no server to run, fits a single-user demo.
- **Money as integer satang** everywhere below the UI. Convert only for display and form input.
- **Extraction never writes to the DB.** `/api/extract` returns JSON; the shared `RecordForm` is the only path that saves. This makes "review then save" structural, not a convention.
- **One shared `RecordForm`** for manual entry, slip review and edit.
- **Claude client injected into `extract.ts`** so unit tests use a fake and never spend credits.
- **Auth built last.** It adds friction during development and is low risk. The middleware runs on the Edge runtime, so cookie signing uses Web Crypto HMAC, not Node `crypto`.
- **Prompt asks Claude for JSON only; the parser strips any text around the JSON before Zod validation.** Any failure maps to the "fill in manually" result.

## Dependency Graph

```
Scaffold (Next.js, Tailwind, Vitest, lint, typecheck)
    │
    └── Data layer (schema, migration, categories, Zod, money helpers)
            │
            ├── Manual entry slice (POST API + RecordForm + /records/new)
            │       │
            │       ├── Slip extraction slice (extract.ts + /api/extract + UploadBox → RecordForm)
            │       │
            │       └── Records list slice (GET by month, PATCH, DELETE + list page)
            │               │
            │               └── Dashboard slice (summary.ts + cards + pies + month picker)
            │
            └── Seed script
Auth (middleware + login/logout) wraps everything, added after the slices work
E2E smoke test needs auth + manual entry + dashboard
```

## Task List

Details, acceptance criteria and verification for each task are in `tasks/todo.md`.

### Phase 1: Foundation (~45 min)
- [x] Task 1: Scaffold the project and tooling
- [x] Task 2: Data layer (schema, migration, categories, validation, money helpers)
- [x] Task 3: Manual entry slice

### Checkpoint A: Foundation
- [ ] Checks pass, a manual record saves to SQLite, human review

### Phase 2: Core features (~75 min)
- [x] Task 4: Slip extraction slice (highest risk, done first in this phase)
- [x] Task 5: Records list slice (view, edit, delete by month)
- [x] Task 6: Dashboard slice (cards + two pie charts + month picker)

### Checkpoint B: Core flow
- [ ] Upload → review → save → list → pie chart works end to end, human review

### Phase 3: Protect and finish (~40 min)
- [x] Task 7: Password login
- [x] Task 8: Seed data, E2E smoke test, demo check

### Checkpoint C: Complete
- [ ] All SPEC success criteria met, ready for demo

## Parallelization

Not worth it at this size; one session builds in order. Tasks 5 and 4 are independent after Task 3 and could run in parallel if needed.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude misreads Thai slips (amount, BE year, income vs expense) | High | Review-before-save is mandatory; low-confidence warning; BE→CE conversion in the parser with unit tests; test early in Task 4 on one real slip |
| better-sqlite3 native build fails on Windows / Node version | Med | Use Node 20 or 22 LTS with prebuilt binaries; check in Task 1 before building on it |
| Edge middleware cannot use Node `crypto` | Med | Use Web Crypto HMAC in `auth.ts` (works in Edge and Node) |
| Claude call slower than 15 s or fails | Med | Resize to ≤1568 px with sharp; 30 s timeout; fallback to empty form |
| Overrunning the 2-3 h budget | Med | Polish stays minimal; cut order if late: low-confidence warning → edit (keep delete) → E2E test |
| Secrets pushed to the public repo | High | `.gitignore` written in Task 1 before the first commit; check staged files before every push |

## Open Questions

1. Keep original slip images for later viewing? (from SPEC; currently out of scope)
2. `claude-sonnet-5-5` or `claude-opus-5-5` for reading slips? (from SPEC; plan assumes sonnet, switchable via `CLAUDE_MODEL`)
3. Git: should I run `git init` in Task 1, and is there a GitHub remote to push to? CLAUDE.md says the repo is public but gives no URL. Pushing will be asked first either way.
4. Task 4's manual check calls the real Claude API on 1 slip, and Task 8's demo check on 3 images. OK to spend those credits?

---

# Phase 4: UI redesign

Spec: `SPEC-ui-redesign.md` (option A, Passbook; light only; `lucide-react` approved; motion = donut fade-in only). Details, acceptance criteria and verification for each task are in `tasks/todo.md`.

## Overview

Restyle all four screens to the chosen Passbook design without changing behaviour. A token and font foundation goes first, so every later task uses the same colours, type and primitives. Then the shared header, then one screen per task. Each UI task loads `agent-skills:frontend-ui-engineering` before starting and gets a Playwright visual check before it is ticked (per `CLAUDE.md`).

## Architecture Decisions

- **Tokens in `globals.css` via Tailwind 4 `@theme`** (`--color-paper`, `--color-accent`, …, `--color-chart-1..7`), so classes read `bg-paper`, `text-accent`. No hex values in components.
- **Anuphan via `next/font/google`**, subsets `thai` and `latin`, weights 400/500/600, exposed as a CSS variable on `<html>`. Tabular figures set globally.
- **Small primitives in `src/components/ui/`**: `Button` (primary, secondary, danger), `Field` (label + input/select/textarea with one style), `ConfirmDialog` (native `<dialog>`). Only what the screens use.
- **One `AppHeader` component** rendered by the dashboard, records and add-record pages (login has none). On desktop: text nav plus an "Add record" button; on phone (≤ 760 px): bottom tab bar. Only one "Add record" link is visible at a time, so `getByRole("link", { name: "Add record" })` stays unique.
- **Pie charts stay in Recharts**, restyled as donuts (inner radius, token colours, no stroke gaps). The legend is our own HTML list (dotted leaders, amount, one-decimal percent), not the Recharts legend.
- **Accessible names stay the same** wherever the E2E test uses them: "Password", "Log in", "Wrong password", "Log out", "Add record", "Amount (THB)", "Category", "Merchant / counterparty", "Save", "Record saved", plus the table rows and the category text on the dashboard. The mockup's shorter labels ("Amount", "Merchant or counterparty") are not adopted.
- **Type stays a native control** (radio group styled as a segmented control), so the category filter by type keeps working without new logic.
- **Delete confirmation** moves from `window.confirm` to a styled `ConfirmDialog`. It is covered by a new E2E test (no component-test library is added).
- **Upload states are checked without Claude** by intercepting `/api/extract` in Playwright (loading = delayed response, error = failed read, low confidence = fake JSON with confidence 0.5).

## Dependency Graph

```
Task 9  tokens + font + primitives + login
   │
   └── Task 10  AppHeader (nav, Add record, Log out, phone tab bar)
          │
          ├── Task 11  Dashboard (month picker, statement, ledger strip, donuts)
          ├── Task 12  Add record (upload box states, form)
          └── Task 13  Records list (ledger table, phone rows, edit, ConfirmDialog)
                 │
                 └── Task 14  Consistency + accessibility pass, final checks
```

Tasks 11, 12 and 13 only depend on 9 and 10. They are built in order in one session; they could run in parallel but share `MonthPicker` (11 and 13), so 11 goes first.

## Task List

### Phase 4a: Foundation (~40 min)
- [x] Task 9: Design tokens, Anuphan font, UI primitives, login screen
- [x] Task 10: App header and navigation (desktop nav, phone tab bar)

### Checkpoint D: Foundation
- [x] Login and header match option A at 1280 and 390 px; checks, build and E2E pass; human review

### Phase 4b: Screens (~90 min)
- [x] Task 11: Dashboard in Passbook style
- [x] Task 12: Add-record screen (upload box and form)
- [x] Task 13: Records list, edit and styled delete confirmation

### Checkpoint E: Screens
- [x] Every screen and state matches option A at 1280 and 390 px; checks, build and E2E pass; human review

### Phase 4c: Finish (~30 min)
- [x] Task 14: Consistency and accessibility pass

### Checkpoint F: Redesign complete
- [x] All 8 success criteria in `SPEC-ui-redesign.md` checked and reported
- [x] `/agent-skills:review` run with the pages and states named in the prompt; Critical and Important findings fixed
- [x] Ready for demo

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| A renamed label or duplicate link breaks the E2E test | High | Accessible names listed above stay the same; run `npm run test:e2e` in every task, not only at checkpoints |
| `next/font/google` needs internet at build time | Med | Font files are cached after the first build; if offline, fall back to the system font stack so the build does not fail |
| Recharts donut and our own legend drift apart (colours or order) | Med | One `chartColor(index)` helper used by both; dashboard compared with the records list in Task 11 |
| Native `<dialog>` focus handling differs between browsers | Low | Use `showModal()` (built-in focus trap and Esc); E2E covers confirm and cancel |
| Phone tab bar covers page content | Med | Bottom padding on `<main>` equal to the bar height; checked at 390 and 320 px |
| Styling drift between screens built in separate tasks | Med | Only tokens and `ui/` primitives; Task 14 compares all screens side by side |

## Open Questions

None. Spec questions were resolved on 2026-10-16.
