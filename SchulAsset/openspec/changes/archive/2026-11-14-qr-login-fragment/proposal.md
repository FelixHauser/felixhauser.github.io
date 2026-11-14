## Why

The QR code and the printed card contain `login.html?sn=<serial>&pw=<password>`. Everything after `?` is sent to the web server with every request and is normally written to its access log. On GitHub Pages that was GitHub's concern; on the school's own hosting (planned, see `TODO.md` Priority 6) the people running the web server could read serial numbers and starting passwords in the log files. Everything after `#` is never sent to a server, so putting the login values there removes the problem. Best done before real cards are printed.

## What Changes

- New QR codes and the printed card use `login.html#sn=<serial>&pw=<password>` instead of `?sn=…&pw=…`.
- The login page reads the values from the `#` part, logs in, and **removes them from the address bar immediately** (so they do not stay in the browser history or get copied by accident).
- The login page still accepts the old `?sn=…&pw=…` form, so cards that are already printed keep working. It removes the values from the address bar the same way. (For these old cards the server log has already seen the request; only new cards avoid that.)
- Building and reading the link move into one small shared file, `qr-login-url.js`, used by both the admin pages (creating the card) and the login page (reading it), so the format lives in one place.
- The password-reset link (`#…type=recovery`) keeps working unchanged.

Not in this change: what the printed card shows in its "Webseite" line (see design, open question), the Edge Function, the database, or the passwords themselves.

## Capabilities

### New Capabilities
- `qr-login`: the format of the QR / card login link, how the login page reads it, that credentials are removed from the address afterwards, and that old `?` links still work.

### Modified Capabilities
<!-- None. login-localisation only covers texts of this flow, which do not change. -->

## Impact

- `views/ipad-detail.js` (`_showPasswordCard`: build the link with the shared function), `auth.js` (read and clear the values), new `qr-login-url.js` loaded by `admin.html` and `login.html`.
- No database, Edge Function or Supabase setting change. `./bump-version.sh` before the next push or upload.
- Cards printed before this change keep working as long as the address they contain is still online.
