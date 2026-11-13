## Context

`translations.js` holds a nested object `TRANSLATIONS = { de, en, tr }` and the browser helpers `t()`, `applyTranslations()`, `setLang()`; it reads `localStorage` at load, so it cannot simply be `require`d in Node.

## Goals / Non-Goals

**Goals:**
- One command (`node check-translations.js`) that lists every problem and exits non-zero if there are errors.
- No dependencies, vanilla Node.

**Non-Goals:**
- Judging translation quality (needs a native speaker).
- Checking the admin interface (German only by decision) or the legal pages (German only).
- Running automatically on push (no CI for now).

## Decisions

- **Loading the file in Node:** evaluate `translations.js` in a `vm` sandbox with a stub `localStorage` and `document`, and read `TRANSLATIONS` from it. Alternative (adding `module.exports` and stubbing `localStorage` there) would touch production code; the sandbox needs no change to `translations.js` at all. Chosen: sandbox, so the proposal's `module.exports` guard is dropped.
- **Flattening** each language tree to `dot.path → string`, then set-comparing de/en/tr. German is the reference.
- **Used keys** are found with regexes: `data-i18n="…"`, `data-i18n-placeholder="…"`, and `t('…')` / `t("…")` with a literal key. Dynamic keys (string concatenation) cannot be detected; the script warns when it finds `t(` calls with a non-literal argument.
- **Severity:** errors (exit code 1) = missing key in en/tr, empty value, key used but undefined in de, mismatched placeholders. Warnings = defined but unused keys.

## Risks / Trade-offs

- Regex scanning can miss unusual call forms → the non-literal warning covers the most likely one.
- Unused-key warnings may include keys only used dynamically → warnings only, never fail.
