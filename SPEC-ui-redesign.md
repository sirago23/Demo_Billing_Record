# Spec: UI redesign (Billing record)

Parent spec: `SPEC.md`. Everything there still applies; this file covers only the visual redesign.

## Objective

Give the app a modern, premium look that is still easy to use, without changing what it does.

- **User:** the owner, alone, on a laptop (1280 px) and a phone (390 px). Used in a live demo, so the first impression matters.
- **"Premium"** here means: a consistent design system (colour, type, spacing, radius, shadow tokens), generous whitespace, refined typography, clear number formatting, calm colour use, and small purposeful motion. Not decoration for its own sake.
- **"Easy to use"** here means: one obvious main action per screen, readable text (body ≥ 16 px on phone), touch targets ≥ 44 px, visible focus states, WCAG AA contrast, and no hidden controls.

### Scope

Visual only. All four screens get the new design:

1. `/login`: password form
2. `/`: dashboard (month picker, 3 summary cards, 2 pie charts, empty state)
3. `/records`: month picker, records table (on phone, a layout that needs no sideways scroll), edit, delete confirmation
4. `/records/new` and the edit form: upload box (idle, loading, error, low-confidence warning) and `RecordForm`

Shared: app header and navigation, Log out button, favicon kept as is or restyled to match.

### Not changing

Routes, API, data model, validation rules, categories, auth, Claude extraction, and every user-visible message text that tests rely on ("Wrong password", "No data for this month", "Could not read this image, please fill in manually", "Please check these values"). UI text stays in English; data can be Thai.

### Process: 3 options before build

1. **Design options (after this spec is approved, before `/plan`):** I build 3 distinct static mockups as local HTML files in `.tmp/design-options/` and open them in your browser. Each one shows the dashboard and the add-record screen with sample data like the seed, at desktop and phone width. The 3 options differ clearly in style. At least one is light and at least one is dark, so you can choose the colour mode by seeing it.
2. **You pick** one option (or ask for changes, or a mix). The chosen option's tokens (colours, fonts, radius, light/dark decision) are written into the "Chosen design" section below.
3. **`/plan`** then breaks the build into tasks, each with a Visual check line (per `CLAUDE.md`).
4. **`/build`**: load `agent-skills:frontend-ui-engineering` before each UI task, and check each task in a real browser with Playwright (the substitute for the Chrome DevTools MCP, which isn't installed) before ticking it.
5. **Review stage:** `/agent-skills:review` at the end, with the pages and states listed under Success Criteria named in the prompt.

## Tech Stack

Unchanged from `SPEC.md`, plus:

- **Fonts via `next/font/google`** (part of Next, no new package). Fonts are downloaded at build time and self-hosted, so the running app makes no request to Google. Candidates: a Latin UI font (e.g. Inter, Plus Jakarta Sans or Manrope) paired with a Thai font (e.g. IBM Plex Sans Thai or Noto Sans Thai) for Thai merchant names. The final pair comes from the chosen option.
- **`lucide-react`** (new dependency, recommended by me at your request): tree-shaken SVG icons for navigation, upload, edit, delete and the summary cards. Veto it and I'll use inline SVGs instead.
- **Design tokens** as CSS variables in `src/app/globals.css` via Tailwind 4 `@theme`, so colours and radius live in one place.
- Recharts stays; the pie charts are restyled (palette from tokens, donut style allowed, legend and percentages kept).

## Commands

Unchanged from `SPEC.md`. Additionally:

```
Open mockups:  start .tmp/design-options/index.html     # PowerShell, opens the default browser
All checks:    npm run lint && npm run typecheck && npm test
E2E:           npm run test:e2e
```

## Project Structure

```
.tmp/design-options/          → 3 static mockups + index.html to compare them (not committed)
src/app/globals.css           → design tokens (@theme), base styles, light/dark if chosen
src/app/layout.tsx            → fonts, app shell
src/components/ui/            → new small primitives: Button, Card, Input, Select, Badge (only those actually needed)
src/components/*.tsx          → existing components restyled; logic untouched
```

## Code Style

Same as `SPEC.md`, plus:

- Colours, radius and shadows come from tokens, not one-off hex values in components.
- Primitives in `src/components/ui/` are small and typed; no component library is added.
- Keep accessible names (labels, button text, roles) the same where the E2E test or unit tests use them. If one must change, update the test in the same commit and say so.
- No Prettier run on whole files (it reformats the codebase; the project has no Prettier config).

```tsx
// src/components/ui/Button.tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-accent text-accent-fg hover:bg-accent/90",
    secondary: "bg-surface text-fg border border-border hover:bg-surface-2",
    danger: "bg-danger text-white hover:bg-danger/90",
  }[variant];
  return (
    <button
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}
```

## Testing Strategy

- **Unit and E2E:** all existing tests (98 unit, 1 E2E) keep passing unchanged. No new logic means no new unit tests, unless a primitive gets behaviour (e.g. a confirm dialog), which then gets a test.
- **Visual check per UI task (Playwright, real browser):**
  - Screenshots at 1280 px and 390 px.
  - Every control used for real: login, month picker, nav links, upload (file picker opens), save, edit, delete with confirmation, log out.
  - States: empty month, loading (upload in progress), error (wrong file type, unreadable image message), low-confidence warning, wrong password.
  - No page-level sideways scroll at 390 px and 320 px.
  - If both colour modes are chosen: each screen in light and dark.
- **Accessibility spot check:** keyboard-only pass on login and the add-record form (tab order, visible focus); contrast of text and amount colours checked against AA.
- **No real Claude calls** in any automated test or visual check. Upload states are checked with a wrong file type and with a mocked or intercepted `/api/extract` response.

## Boundaries

- **Always:** keep behaviour and message texts unchanged; run checks before each commit; do the Visual check before ticking a UI task; load `frontend-ui-engineering` before UI work.
- **Ask first:** any dependency beyond `lucide-react` and `next/font`; changing a route, API or message text; changing the E2E test's selectors beyond a like-for-like rename; spending Claude credits (e.g. a real slip upload to check the loading state).
- **Never:** add a UI component library (MUI, Chakra, shadcn CLI install) without approval; load fonts or scripts from a CDN at runtime; commit `.tmp/` mockups; edit files under `~/.claude/plugins/`.

## Success Criteria

1. You chose one of the 3 mockups (or a stated mix), and its tokens are recorded under "Chosen design".
2. All four screens and the header use the chosen design: same tokens, fonts, radius and button styles throughout. No leftover default-looking controls (e.g. an unstyled file input or select).
3. At 1280 px and 390 px, every screen fits without page-level sideways scroll; the records list is readable on a phone without scrolling the page sideways.
4. Each main action is visibly primary: Log in, Add record, Save. Delete is styled as dangerous and still asks for confirmation.
5. States look designed, not bare: empty month, upload loading, upload error, low-confidence warning, wrong password.
6. Text and amounts meet WCAG AA contrast; every control has a visible keyboard focus; touch targets ≥ 44 px on phone.
7. `npm run lint && npm run typecheck && npm test`, `npm run build` and `npm run test:e2e` pass.
8. Playwright screenshots of every screen at both widths (and both modes if chosen) were looked at before reporting done.

## Chosen design

**Option A · Passbook**, chosen 2026-10-16. Reference mockup: `.tmp/design-options/option-a-passbook.html` (local only, not committed; the tokens below are the source of truth if it is regenerated).

- **Idea:** a Thai bank passbook. Ruled ledger rows, dotted leaders between a category and its amount, chart colours from Thai banknotes. Calm, left-aligned, one bold element per screen.
- **Colour mode:** light only. No dark mode.
- **Font:** Anuphan (Thai + Latin, one family) via `next/font/google`, weights 400/500/600. Tabular figures for all amounts.
- **Colour tokens:**

  | Token | Hex | Use |
  |---|---|---|
  | `paper` | `#EEF2F5` | page background |
  | `sheet` | `#FBFCFD` | header, panels, cards |
  | `ink` | `#172033` | main text |
  | `muted` | `#566275` | secondary text |
  | `rule` | `#D3DBE3` | borders, ledger lines, dotted leaders |
  | `accent` | `#5A3D8A` | primary buttons, active nav, focus ring (hover `#4A3075`) |
  | `accent-soft` | `#ECE6F5` | balance cell, upload icon background |
  | `in` | `#1D7356` | income amounts |
  | `out` | `#A2384C` | expense amounts, error icon |
  | `warn-bg` / `warn` | `#FFF6E0` / `#7A5300` | "Please check these values" |
  | `err-bg` | `#FBEAEC` | error backgrounds |

- **Chart colours (in order):** `#5A3D8A`, `#2E6FA8`, `#1D7356`, `#A2384C`, `#8A6A3B`, `#6E7C8F`, `#B9A6DB`. Donut style (ring), total in the centre, legend rows with dotted leaders, amount and one-decimal percentage.
- **Shape:** radius 10 px for panels, 8 px for buttons and inputs, 6 px inside the segmented control. 1 px `rule` borders instead of shadows.
- **Sizes:** inputs 48 px tall (amount 60 px, 28 px text); buttons ≥ 44 px; body 16 px.
- **Layout:**
  - Header: wordmark left, text nav (Overview, Records) with an accent underline for the current page, "Add record" primary button and "Log out" on the right. On phone (≤ 760 px), nav moves to a bottom tab bar (Overview, Records, Add record) and Log out becomes an icon button.
  - Dashboard: month picker, then the balance as a large statement ("฿36,624.25 left after spending this month. You kept 65% of what came in."), then a 3-cell ledger strip (Money in, Money out, Balance on `accent-soft`), then two chart panels side by side (stacked on phone).
  - Add record: upload box (dashed border) left, form right; stacked on phone. Type is a segmented control; amount field is large with a ฿ prefix.
  - Records list: not in the mockup. Build it in the same ledger style (ruled rows, tabular amounts in `in`/`out` colours); on phone, rows become stacked cards with no sideways scroll.
- **Motion:** only the donut segments fade in on load; off under `prefers-reduced-motion`.

## Open Questions

None. Resolved on 2026-10-16:

1. `lucide-react`: approved.
2. Colour mode: light only (option A).
3. Motion: only the donut fade-in from the mockup, off under `prefers-reduced-motion`.
