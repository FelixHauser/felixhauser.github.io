## 1. Pin versions

- [x] 1.1 Find the versions currently served: resolve `lucide@latest` (unpkg) and `@supabase/supabase-js@2` (jsDelivr) to exact version numbers
- [x] 1.2 `admin.html`: replace `lucide@latest` with the exact Lucide version
- [x] 1.3 `login.html`, `portal.html`, `admin.html`: replace `supabase-js@2` with the same exact supabase-js version

## 2. Make Lucide failure harmless

- [x] 2.1 `admin.html`: change `lucide.createIcons(); initAdmin();` to `window.lucide?.createIcons(); initAdmin();`
- [x] 2.2 Check `admin.js` and `views/*.js` for other bare `lucide.` calls that would throw without Lucide and guard them the same way

## 3. Verify

- [x] 3.1 Start the local server (`python3 -m http.server 8080`) and smoke-test: admin login, icons visible, iPad list and detail, QR scanner; portal login and viewing the iPad
- [x] 3.2 Block the unpkg Lucide URL in browser dev tools and confirm the admin app still loads and works (no icons)
- [x] 3.3 `grep` the three HTML files to confirm no `@latest` or `@2` CDN tags remain

## 4. Documentation

- [x] 4.1 `statusquo.md`: note that all CDN libraries are pinned and how to upgrade one deliberately (bump version, smoke-test, commit)
- [x] 4.2 `TODO.md`: tick off "Pin all CDN library versions" and correct the `lucide?.` hint to `window.lucide?.`
- [x] 4.3 Ask the user for an explicit OK before any commit or push
