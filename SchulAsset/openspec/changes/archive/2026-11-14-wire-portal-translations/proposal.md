## Why

The portal is meant to be fully available in German, English and Turkish (CLAUDE.md), but the main screen after login is still hardcoded German: the greeting, the iPad details, the four steps (Leihvertrag, iPad erhalten, in Verwendung, Rückgabe), the damage/loss buttons and the dates. A Turkish- or English-speaking parent can open the pop-ups in their language but cannot read the main page. `check-translations.js` found 46 translation keys that exist but are never used, because the page was redesigned and the code never switched to them.

## What Changes

- `portal.js` (`renderPortal`, `_buildSteps`, `_renderStep` callers) reads all visible texts through `t()` instead of German literals: greeting, iPad detail rows and type, the step titles/subtitles/buttons, the "Problem mit dem iPad?" block, the download-failed message.
- `portal.html`: the iPad-info pop-up title and close button use `data-i18n`.
- Dates follow the chosen language (`de-DE` / `en-GB` / `tr-TR`) instead of always German.
- `translations.js`: the keys the new screen needs are added in all three languages; old keys that no longer fit the redesigned screen are removed or renamed so `check-translations.js` has no unused portal keys left.
- Switching the language on the portal re-renders the main screen immediately.
- **Not changed:** the Leihvertrag text in the terms pop-up and the generated PDFs stay German (legal documents; whether to translate them is a separate decision). Notes written to `ipad_history` stay German on purpose (audit trail read by the school).

## Capabilities

### New Capabilities
- `portal-localisation`: all visible texts of the student portal main screen, and its date format, follow the selected language.

### Modified Capabilities

## Impact

- `portal.js`, `portal.html`, `translations.js`; `check-translations.js` is used for verification.
- No database or RLS changes. No change for German users (texts stay identical).
