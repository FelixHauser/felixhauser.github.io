## Context

`_showPasswordCard()` in `views/ipad-detail.js` builds the link from the page's own address plus `login.html?sn=…&pw=…` and renders it as QR code (dialog and A5 print card). `auth.js` reads `sn` and `pw` from `window.location.search` on load and signs in (`_autoLogin`). The password-reset flow already uses the fragment (`#…type=recovery`), and the Supabase client has `detectSessionInUrl: false`, so it does not touch the fragment.

## Goals / Non-Goals

**Goals:**
- Credentials of new cards never travel to the server in the request address.
- They do not stay visible in the address bar or the browser history after use.
- Old printed cards keep working.
- One place defines the link format.

**Non-Goals:**
- Hiding the password on the printed card itself (it is printed on purpose).
- Changing how passwords are generated or stored.
- Protecting against someone who photographs the card.

## Decisions

1. **Use the fragment (`#sn=…&pw=…`), same key=value style as before.** Browsers never send the fragment to the server, so it cannot appear in server logs or in the `Referer` header. Alternative: a one-time token or a POST; rejected, it needs server code or new database logic, which a static site does not have.
2. **Shared file `qr-login-url.js`** with two pure functions, loaded by `admin.html` and `login.html`:
   - `buildQrLoginUrl(base, serial, password)` → `<base>login.html#sn=<encoded>&pw=<encoded>` (values encoded with `encodeURIComponent`);
   - `parseQrLogin(search, hash)` → `{ sn, pw, legacy }` or `null`. It looks in the fragment first, then in the old query string (`legacy: true`).
   Pure functions can be tested in Node, like the CSV and picker functions.
3. **Clear the address as soon as the values are read.** In `auth.js`, right after parsing, `history.replaceState(null, '', location.pathname)` removes both the query and the fragment (no new history entry, no reload). This also covers a failed login: the form is shown with no password left in the address. The recovery fragment is not touched by this (it is only cleared if a QR login was found).
4. **Keep the legacy `?` form.** Cards already handed out must still work. The query string was already sent to the server for those; clearing the address bar still helps with browser history.
5. **Failure behaviour unchanged:** wrong or reset password shows the existing "invalid credentials" message and the normal login form.
6. **No change to the Supabase setting.** The fragment is part of the same page, so the allowed redirect list is not affected.

## Risks / Trade-offs

- [Someone prints or shares the link before it is cleared] → it only exists in the address for the moment between load and `replaceState`; the QR code and the card are the intended carriers.
- [Old `?` cards leave a trace in server logs] → documented; those passwords can be replaced with "Passwort zurücksetzen" if it matters, which also yields a new-style card.
- [Some very old scanner apps drop the `#…` part when opening a link] → test with the iPad camera app and one third-party scanner; if one drops it, the pupil can still type serial and password. Mentioned in tasks.
- [Link length is unchanged, so the QR code stays equally easy to scan.]

## Migration Plan

1. Deploy the new files. Old cards keep working through the legacy path; new and reset cards use the fragment.
2. Rollback: revert the commit; links with `#` would then not log in, so do not print cards with the new format before the new `auth.js` is online.

## Decided

- The print card's "Webseite" line shows only the login page address (`…/login.html`); username and password are already printed below it, and the QR code carries the full link (decision 2026-11-14).
