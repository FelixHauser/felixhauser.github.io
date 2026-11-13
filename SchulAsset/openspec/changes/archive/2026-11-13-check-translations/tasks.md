## 1. Check script

- [x] 1.1 Create `check-translations.js`: load `translations.js` in a `vm` sandbox with stubs, flatten de/en/tr
- [x] 1.2 Report missing/extra keys, empty values and placeholder mismatches (errors, exit code 1)
- [x] 1.3 Scan `*.html` and `*.js` for used keys (`data-i18n`, `data-i18n-placeholder`, `t('…')`); report undefined keys (error), unused keys and dynamic `t(` calls (warnings)

## 2. Run and fix

- [x] 2.1 Run the script on the current files and review the findings
- [x] 2.2 Fix gaps in `translations.js` (missing/empty keys, undefined used keys), marking any Turkish/English text that needs native review
- [x] 2.3 Re-run until the script ends with exit code 0

## 3. Docs

- [x] 3.1 Document `node check-translations.js` in `statusquo.md` (run after every change to texts)
- [x] 3.2 Update `TODO.md`: tick the automated check, keep "native-speaker review" as an open item
