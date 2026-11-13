## Context

The app is a static site on GitHub Pages. GitHub Pages sends caching headers we cannot change, so browsers may reuse a cached `.js`/`.css` file. The HTML page itself is revalidated more often, so changing the URL of the referenced files (query string) forces a fresh download.

## Goals / Non-Goals

**Goals:**
- After a deploy, all users get matching HTML, scripts and styles.
- Low effort for the developer: one command.

**Non-Goals:**
- No build tool, bundler or content hashing (no frameworks, vanilla only).
- No service worker.
- Files loaded from other files (none today) are out of scope.

## Decisions

- **Query-string version (`?v=…`)** on every local `<script src>` and `<link rel="stylesheet">`. Simple, works on any static host. Alternative (renaming files with hashes) needs a build step — rejected.
- **One shared version value per release**, format `YYYYMMDD-N` (e.g. `20261113-1`). Alternative (per-file hashes) is more precise but needs more tooling; one shared value is enough for ~30 small files.
- **`bump-version.sh`** (bash + sed, works on macOS): takes an optional version argument, defaults to the current date plus a counter derived from the existing value (same day → N+1). It rewrites only references to local files (no `http`). Alternative (manual editing) is error-prone — rejected.

## Risks / Trade-offs

- Developer forgets to run the script → stale cache possible again. Mitigation: documented in `statusquo.md` and as a step in the deploy routine; the script prints what it changed.
- The HTML pages themselves can still be cached briefly by the browser; this is acceptable, as GitHub Pages revalidates HTML quickly.
