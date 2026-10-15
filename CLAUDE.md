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

## For Agent skill
Applies when running agent-skills commands (/spec, /plan, /build, /review, /ship) or delegating to subagents.

### Skills the commands do not load by themselves
- `/agent-skills:build` and `/agent-skills:build auto` load only the implementation and TDD skills. They do not load `frontend-ui-engineering` or `browser-testing-with-devtools`.
- Before starting a task that creates or changes a page or component, load `frontend-ui-engineering`.
- Before ticking that task, check it in a real browser with `browser-testing-with-devtools`. Use the Playwright MCP tools, because the Chrome DevTools MCP is not installed here. Follow the skill's steps and checklist, and say in the report that Playwright was used.

### Plans and tasks
- When `/plan` writes or updates `tasks/todo.md`, every task that touches the UI gets a "Visual check" line: screenshot at 1280 px and 390 px, each control used for real, empty/error/loading states.
- `/build auto` follows the task list. If a task has no Visual check line, add one before building it and tell the user.

### Reviews and checkpoints
- `/review` and `/ship` check code, security and performance. They do not look at the pages. For a checkpoint or final review, also run the UI checks above, even if the command does not ask for them.
- Do not replace `/ship` with a hand-made checklist without telling the user that the skill's checks were skipped and why.

### Subagents
- A subagent starts with no context. Its prompt must repeat the rules it needs: the project CLAUDE.md sections that apply (UI verification, large output, no real Claude calls) and the exact checks to run.
- A review prompt for a UI project must name the pages and states to look at. "Verify the success criteria" is not enough.
- Read the subagent's report as a claim, not a result. Before telling the user it is done, check anything it said it did not verify (for example "did not look at the form in the browser") and either do it or report it as open.

### When a skill or tool is missing
- If a skill needs a tool that is not installed (for example the DevTools MCP), say so once, name the substitute, and use it. Do not silently skip the step.
- Edit nothing inside the plugin folders under `~/.claude/plugins/`. Updates overwrite those files. Put project rules in this file.

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
