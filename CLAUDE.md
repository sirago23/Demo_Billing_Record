# Billing record - Project Rules

Local rules for this project only. The parent WAT `CLAUDE.md` in Downloads also applies; no known conflicts.

## Project
- **Name:** Billing record. Personal web app that records income and expenses in THB. Upload a bank slip or receipt, Claude vision pre-fills a form, the user reviews and saves. Dashboard shows pie charts by category per month. Prototype for a live demo, single user, runs locally.
- **Stack:** Next.js 15 (App Router) + TypeScript strict, Tailwind 4, SQLite (better-sqlite3 + Drizzle), Zod, Recharts, sharp, `@anthropic-ai/sdk` (model from `CLAUDE_MODEL`, default `claude-sonnet-5-5`), Vitest, Playwright. Node 20+.
- **Commands:** `npm run dev` (localhost:3000), `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run db:migrate`, `npm run db:seed`. Before each commit: `npm run lint && npm run typecheck && npm test`.
- **Key rules:** money is stored as integer satang; extraction never writes to the DB, only the form's Save does; never call the real Claude API in automated tests; ask before spending Claude credits beyond the manual demo check.
- **Docs:** `SPEC.md` (requirements), `tasks/plan.md` (plan), `tasks/todo.md` (task list with acceptance criteria). Env vars are listed in `SPEC.md`; `.env` is never committed.

## Boundaries
- The repo is public. Never commit `.env`, `credentials.json`, `token.json`, `.tmp/` or `node_modules/`.
- Check that nothing sensitive is staged before every push.
- Keep `session-handoff/` and `.tmp/` out of git.

## Review findings
- After a code review or security audit, fix without asking:
  - code review: Critical and Important
  - security audit: Critical, High and Medium
- Fix lower-ranked findings when cheap. Otherwise log them in `tasks/<checkpoint>-review.md` with a one-line reason.
- After fixing, re-run each reproduction from the report and the full test suite, and say which findings are confirmed fixed.
- Still ask first for anything the Boundaries section says to ask about, and for changes to the summary.json format after Checkpoint C.

## Verify before reporting
- After every fix or edit, check the actual result yourself and confirm it is done before telling the user. Tests passing is not enough for a visual change: open the output (for example the deck in the browser) and look at it.
- In the report, say what you checked and what you saw. If you could not check something, say so instead of claiming it is done.

## Token Efficiency

### 1. Milestone handoff
- The user triggers the handoff by running the session-handoff skill. Do not start one unprompted.
- Guideline for the user: hand off about every 20-25 turns or at 70-80k tokens (check with `/context`), at a completed task boundary, not mid-task.
- Before handing off, drop transient logs, exploratory steps and dead hypotheses. Keep one-line conclusions.
- The handoff is saved to `session-handoff/` and must list the spec, plan and key files.
- Resuming a new session: read the newest file in `session-handoff/` (names start with date and time), then the spec, `tasks/plan.md` if they exist, and run `git status`. Do not re-ingest old conversation history.
- Use handoff plus `/clear`, or `/compact`, not both.

### 2. Model routing
Applies only when subagents are used.
- `haiku`: file discovery, glob and regex search, data extraction, log grepping.
- `sonnet`: feature work, API and UI code, tests, standard bug fixes.
- `opus`: system architecture, critical financial or cryptographic logic, concurrency.

### 3. Large output
- A command that produces more than 50 lines of output must be redirected to a file in `.tmp/` (for example `.tmp/build.log`).
- In context, keep only the exit code, a one-line summary (for example `Tests: 48 passed, 0 failed`) and the last 10-20 lines of any failure.
- Read the log file instead of re-running the command.

### 4. Answers
- Chat replies: short and clear, with all necessary information.
- This does not apply to files such as `SPEC.md`, `tasks/plan.md` and review reports, which keep their normal structure.
