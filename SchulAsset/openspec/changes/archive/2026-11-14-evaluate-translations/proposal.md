## Why

`check-translations.js` proves that the German, English and Turkish texts are *complete* (same keys, no empty texts, same placeholders), but not that they are *good*. Nobody has yet checked whether the English and Turkish wording is correct, natural and consistent — and the parents who use the portal in Turkish depend on it for a legal contract (Leihvertrag) and damage/loss reports. The `TODO.md` item "Evaluate localization" is still open for exactly this reason. Now is the right time because `wire-portal-translations` is about to put almost all portal texts on screen for the first time, so the review should cover the texts as users will really see them.

## What Changes

- New script `export-translations.js`: writes a review sheet (CSV, opens in Excel/Numbers) with one row per translation key — the key, where it appears (file and screen), the German, English and Turkish text, and empty "comment EN" / "comment TR" columns — so a native speaker can review without reading code.
- A first quality pass by the coding agent over all texts, recorded as `translation-findings.md` in this change. It looks for: wrong or unnatural wording, inconsistent terms for the same thing (e.g. "iPad" / "device" / "tablet"), inconsistent form of address (Sie/du, siz/sen, formal/informal English), text that is much longer than the German and may break buttons or layout, and German or English left in the Turkish text. Each finding says key, language, problem and suggested wording.
- Corrections that are unambiguous (typos, clear mistranslations, inconsistent terms) are applied to `translations.js` right away; anything that is a matter of taste is left in the findings list for the native speaker.
- `TODO.md` and `statusquo.md` are updated: the review sheet is ready to hand out; the native-speaker review itself stays an open item for a person.
- **Not changed:** the Leihvertrag text and the generated PDFs (German only, separate decision); the admin interface (German only by decision); the `ipad_history` notes. No behaviour of the app changes except corrected wording.

## Capabilities

### New Capabilities
- `translation-review`: the project can produce a reviewer-friendly sheet of all DE/EN/TR texts, and each EN/TR text has been checked for correctness and consistency, with open questions recorded.

### Modified Capabilities

## Impact

- New file `export-translations.js` (Node, no dependencies, reuses the loading code approach of `check-translations.js`).
- `translations.js` — small wording corrections only; `node check-translations.js` must still pass.
- `openspec/changes/evaluate-translations/translation-findings.md` — evaluation report.
- `TODO.md`, `statusquo.md`.
- No database, RLS or Edge Function changes.
- **Order:** best applied after `wire-portal-translations`, because that change adds and renames portal keys; reviewing before would mean reviewing texts that are about to change.
