// escape-html.js — the one function that makes database text safe for HTML.
//
// RULE: text that comes from the database (or a CSV file) goes into an HTML string
// only through escapeHtml(). Parents type some of that text (damage descriptions,
// police reference, …); without escaping, "<img src=x onerror=…>" would run as
// script in the browser of whoever views it.
//
// Not needed when a value is assigned with .textContent or .value — only when it is
// placed inside a template string that ends up in .innerHTML.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Lets Node load the file for a quick test; the browser ignores this line.
if (typeof module !== 'undefined') module.exports = { escapeHtml };
