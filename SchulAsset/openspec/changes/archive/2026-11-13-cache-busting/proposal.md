## Why

After a deploy, browsers may keep serving an old cached copy of a script such as `translations.js` next to a new HTML page. This already happened: the login page showed raw keys like `login.forgotLink` until a hard reload. Real users (parents, teachers) will not know to hard-reload, so every update risks a broken page for them.

## What Changes

- Every local script and stylesheet reference in `login.html`, `portal.html`, `admin.html`, `datenschutz.html` and `impressum.html` gets a version suffix (`translations.js?v=20261113-1`).
- A small script `bump-version.sh` rewrites all version suffixes to a new value in one step, so it is one command before each deploy instead of editing ~30 tags by hand.
- A short note in `statusquo.md` / `CLAUDE.md`-independent docs: run the script before every push that changes a script or stylesheet.
- External CDN libraries are untouched (their URLs already carry pinned versions).

## Capabilities

### New Capabilities
- `cache-busting`: local scripts and stylesheets are requested with a version suffix that changes with each release, so browsers fetch fresh files after a deploy.

### Modified Capabilities

## Impact

- `login.html`, `portal.html`, `admin.html`, `datenschutz.html`, `impressum.html` (tag attributes only).
- New file `bump-version.sh` in the SchulAsset folder (belongs in the distribution package later).
- No database, RLS or JavaScript logic changes.
