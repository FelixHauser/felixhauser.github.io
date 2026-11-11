## Why

Two CDN libraries are loaded with floating versions: `lucide@latest` (admin) and `@supabase/supabase-js@2` (login, portal, admin). Their maintainers can publish a release overnight and the app changes behaviour or breaks without any commit on our side. On top of that, a Lucide failure currently kills the whole admin app: `lucide.createIcons(); initAdmin();` throws before `initAdmin()` runs. This is a Priority 1 item in `TODO.md` and must be fixed before the app handles real data.

## What Changes

- Pin `lucide` in `admin.html` to an exact, currently working version (replacing `@latest`).
- Pin `@supabase/supabase-js` to an exact, currently working version in `login.html`, `portal.html` and `admin.html` (replacing `@2`), using the same version in all three.
- Make a Lucide failure harmless: in `admin.html` change `lucide.createIcons(); initAdmin();` to `window.lucide?.createIcons(); initAdmin();` (the `window.` prefix is needed: a bare `lucide?.` still throws a ReferenceError when the global does not exist, as `TODO.md` currently suggests), so the admin app still starts if Lucide fails to load (icons missing, app working).
- Record in `statusquo.md` that all CDN libraries are pinned, and how to upgrade one deliberately.
- Not in scope: self-hosting the libraries, SRI hashes (`integrity=`), and other already-pinned libraries (html5-qrcode, jsPDF, pdf-lib, signature_pad, qrcodejs).

## Capabilities

### New Capabilities
- `cdn-dependencies`: Third-party libraries loaded from a CDN must use exact versions, and a failure of a non-essential library (icons) must not prevent the app from starting.

### Modified Capabilities
<!-- None: no existing specs cover this. -->

## Impact

- `SchulAsset/login.html`, `SchulAsset/portal.html`, `SchulAsset/admin.html` (script tags; one inline init line in `admin.html`).
- `SchulAsset/statusquo.md` and `SchulAsset/TODO.md` (documentation, tick off the item).
- No database, Edge Function or RLS changes. Low risk, but needs a manual smoke test of login, admin (icons, QR scanner) and portal after the version bump.
