# Checkpoint C review (2026-10-15)

No Critical or Important findings. Lower-ranked items, not fixed:

- `npm audit`: 11 vulnerabilities (2 runtime via PostCSS inside Next, rest dev-only). Not fixed: fixing needs a dependency upgrade that is outside the prototype scope; re-check before any online deploy.
- `tsx` devDependency (used by `db:seed`) is not in the SPEC stack list. Not changed: needs the owner's yes/no (SPEC "ask first").
- `docs/exec-summary/*.html` are tracked in the public repo. Not changed: removal is the owner's call.
- `/favicon.ico` returns 404 (one console error on /login). Cosmetic; no favicon added.
- Session cookie is `secure` only when NODE_ENV=production. Correct for local http; revisit when deploying.
- `SESSION_SECRET` could be derived from `APP_PASSWORD`; owner has not decided, SPEC still lists both.
