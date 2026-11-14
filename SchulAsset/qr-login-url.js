// qr-login-url.js — the link inside the QR code / on the printed access card.
//
// New format:  <address>login.html#sn=<serial>&pw=<password>
//
// The values sit after the "#" on purpose: browsers never send that part to the web
// server, so serial numbers and passwords cannot end up in the server's log files.
// (The old format used "?sn=…&pw=…"; cards printed with it still work, see parseQrLogin.)
//
// This file is loaded by admin.html (builds the link) and login.html (reads it), so the
// format is defined in exactly one place. The functions are pure (no page access), which
// makes them testable in Node.

// Builds the login link. `base` is the folder address ending in "/", e.g.
// "https://school.de/schulasset/". Both values are URL-encoded.
function buildQrLoginUrl(base, serial, password) {
  return `${base}login.html#sn=${encodeURIComponent(serial)}&pw=${encodeURIComponent(password)}`;
}

// Reads the login values from the address parts `search` (e.g. "?sn=…") and `hash`
// (e.g. "#sn=…"). Returns { sn, pw, legacy } or null if there is no complete QR login.
// The fragment is looked at first; the old query form is accepted too (legacy: true).
// A password-reset link (#access_token=…&type=recovery) has no sn/pw and gives null.
function parseQrLogin(search, hash) {
  const fromFragment = new URLSearchParams((hash || '').replace(/^#/, ''));
  if (fromFragment.get('sn') && fromFragment.get('pw')) {
    return { sn: fromFragment.get('sn'), pw: fromFragment.get('pw'), legacy: false };
  }
  const fromQuery = new URLSearchParams(search || '');
  if (fromQuery.get('sn') && fromQuery.get('pw')) {
    return { sn: fromQuery.get('sn'), pw: fromQuery.get('pw'), legacy: true };
  }
  return null;
}

// Lets Node load this file for tests; in the browser `module` does not exist.
if (typeof module !== 'undefined') module.exports = { buildQrLoginUrl, parseQrLogin };
