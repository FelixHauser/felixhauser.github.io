## 1. Shared link functions

- [x] 1.1 Create `qr-login-url.js` with `buildQrLoginUrl(base, serial, password)` and `parseQrLogin(search, hash)` (fragment first, then legacy query; returns `null` if either value is missing)
- [x] 1.2 Node test of both functions: round trip with `&`, `#`, `+`, space, umlauts; legacy query; recovery fragment returns `null`; missing password returns `null`

## 2. Creating the link

- [x] 2.1 Load `qr-login-url.js` in `admin.html`; use `buildQrLoginUrl` in `_showPasswordCard()` (`views/ipad-detail.js`) for both QR codes and the print card line
- [x] 2.2 Print card "Webseite" line shows only the login page address (decided 2026-11-14)

## 3. Reading the link

- [x] 3.1 Load `qr-login-url.js` in `login.html` (before `auth.js`); in `auth.js` replace the query-string read with `parseQrLogin(location.search, location.hash)`
- [x] 3.2 Remove the values from the address right after reading (`history.replaceState`), only when a QR login was found; keep the `type=recovery` check working

## 4. Verify and document

- [ ] 4.1 Manual test: new card scan (QR from the dialog and from a printed card), wrong password, old `?sn=…&pw=…` link, password-reset link, network tab shows no `sn`/`pw` in the request address, address bar is clean afterwards
- [ ] 4.2 Test with the iPad camera app and one third-party scanner that the `#` part survives
- [x] 4.3 Run `./bump-version.sh`; update `statusquo.md` and the deployment item in `TODO.md`
