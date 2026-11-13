## Why

The portal and login page are shown in German, English and Turkish, but nothing checks that all three languages are complete. A missing key silently falls back to German (or shows the raw key), and nobody notices until a Turkish-speaking parent does. TODO.md asks for an automated check of missing or empty texts before go-live.

## What Changes

- New Node script `check-translations.js` that compares the `de`, `en` and `tr` trees in `translations.js` and reports: keys missing in a language, keys present only in one language, empty strings, and placeholders (`{name}`-style) that differ between languages.
- The script also scans `*.html` and `*.js` for keys used (`data-i18n`, `data-i18n-placeholder`, `t('…')`) and reports keys that are used but not defined in German, plus defined keys that are never used (as a hint only).
- The script loads `translations.js` in a Node sandbox, so `translations.js` itself does not change.
- Any gaps the check finds are listed; filling the translation gaps is done in this change, quality review by a native speaker stays a manual TODO.

## Capabilities

### New Capabilities
- `translation-check`: an automated check that DE/EN/TR translations are complete, consistent and cover every key the code uses.

### Modified Capabilities

## Impact

- New file `check-translations.js`; possibly new or filled entries in `translations.js` where the check finds gaps.
- No database or RLS changes; no change to runtime behaviour.
