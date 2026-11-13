## 1. Preparation

- [x] 1.1 List every German literal on the main screen (`portal.js`: `renderPortal`, `_buildSteps`, download alert; `portal.html`: iPad-info pop-up) and decide per text: reuse an existing key or add a new one
- [x] 1.2 Add `tf(key, params)` (placeholder replacement) next to `t()` in `translations.js`

## 2. Translations

- [x] 2.1 Add the new keys (`portal.main.*`, `portal.steps.*`, close button, download-failed) in DE, EN and TR; German text identical to today's
- [x] 2.2 Remove old portal keys that the redesigned screen no longer uses (check with grep and the check script first)

## 3. Wire into the code

- [x] 3.1 `renderPortal` / `_buildSteps`: replace all German literals with `t()` / `tf()`
- [x] 3.2 `portal.html`: `data-i18n` on the iPad-info pop-up title and close button
- [x] 3.3 `formatDate`: locale by `currentLang`
- [x] 3.4 Re-render the main screen when the language is switched (`setLang` hook, defined in `portal.js`)

## 4. Verification

- [x] 4.1 `node check-translations.js` ends with exit code 0 and no unused `portal.*` warnings
- [x] 4.2 Manual test in DE, EN and TR on the portal (all four steps, details pop-up, damage/loss buttons, language switch while logged in, phone width)
- [x] 4.3 Run `./bump-version.sh`; update `statusquo.md` and `TODO.md` (tick the wiring item; add a note that the Leihvertrag text and PDFs stay German pending a decision)
