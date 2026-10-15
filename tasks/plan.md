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
- [ ] Task 5: Records list slice (view, edit, delete by month)
- [ ] Task 6: Dashboard slice (cards + two pie charts + month picker)

### Checkpoint B: Core flow
- [ ] Upload → review → save → list → pie chart works end to end, human review

### Phase 3: Protect and finish (~40 min)
- [ ] Task 7: Password login
- [ ] Task 8: Seed data, E2E smoke test, demo check

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
