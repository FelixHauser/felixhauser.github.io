## Context

SchulAsset is a static site with no build step; libraries come from public CDNs via `<script>` tags. Most are already pinned (html5-qrcode 2.3.8, jsPDF 2.5.1, pdf-lib 1.17.1, signature_pad 4.1.7, qrcodejs 1.0.0). Two are not:

| Library | Tag today | Where |
|---|---|---|
| lucide | `unpkg.com/lucide@latest` | `admin.html` |
| supabase-js | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `login.html`, `portal.html`, `admin.html` |

`@2` still floats across every 2.x minor/patch release, so it is effectively unpinned. In `admin.html` the last line is `lucide.createIcons(); initAdmin();` as one statement list: if `lucide` is undefined (CDN down, bad release), the first call throws and `initAdmin()` never runs.

## Goals / Non-Goals

**Goals:**
- A page served today behaves identically next month unless we change the repo.
- A missing or broken Lucide never prevents the admin app from starting.

**Non-Goals:**
- Self-hosting libraries (would remove the CDN dependency and the DSGVO disclosure, but is a separate, larger change).
- Subresource Integrity hashes.
- Changing already-pinned libraries or upgrading any library's major version.

## Decisions

**1. Pin to the exact version currently served, not the newest.** At apply time, resolve what `@latest` / `@2` return today, pin that, and smoke-test. Rationale: that is the version the app has actually been running against; the goal is stability, not an upgrade. Alternative: pin to the newest release — rejected, it adds untested change to a stability fix.

**2. One supabase-js version, identical in all three HTML files.** Avoids login and admin/portal behaving differently (session storage format, auth API). Alternative: a shared constant — rejected, no build step and not worth a loader script for one string.

**3. Guard Lucide only: `window.lucide?.createIcons(); initAdmin();`.** When the script fails to load, `lucide` is an undeclared global, so both `lucide.createIcons()` and `lucide?.createIcons()` throw a `ReferenceError` (optional chaining does not protect an undeclared identifier; the suggestion in `TODO.md` is therefore insufficient). Reading it as a property of `window` is safe when absent. Alternative: try/catch around the call — equivalent, but longer. Supabase-js is essential, so it is deliberately *not* guarded: without it the app cannot work.

**4. Keep the existing CDNs (unpkg / jsDelivr).** Changing providers is out of scope.

## Risks / Trade-offs

- [Pinned version lacks future security fixes] → Upgrades become deliberate: bump the version string, run the smoke test, commit. Documented in `statusquo.md`.
- [Pinned version later removed from the CDN] → Very unlikely for npm-backed CDNs; self-hosting (future change) is the real remedy.
- [Icons silently missing if Lucide fails] → Accepted: a working app without icons is better than a dead app. Labels remain text.
- [Chosen version behaves differently from what was cached in browsers] → Smoke test covers login, admin views, QR scanner, portal.

## Migration Plan

1. Edit the three HTML files.
2. Run the local server (`python3 -m http.server 8080`) and smoke-test: admin login, icons visible, iPad list/detail, QR scanner; portal login and one action.
3. Simulate Lucide failure (block the unpkg URL in dev tools) and confirm the admin app still loads.
4. Commit only after the user's explicit OK (per `CLAUDE.md`). Rollback = revert the commit.
