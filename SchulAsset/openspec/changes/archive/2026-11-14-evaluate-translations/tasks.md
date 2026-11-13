## 1. Preparation

- [x] 1.1 Check whether `wire-portal-translations` has been applied; if not, tell Marçal that the review is best done after it (design decision 6) and continue only on request
- [x] 1.2 Run `node check-translations.js` and save its output as the "before" reference

## 2. Shared module

- [x] 2.1 Create `translation-tools.js` exporting `loadTranslations()`, `flatten()` and `scanUsedKeys()` (moved from `check-translations.js`, comments kept)
- [x] 2.2 Change `check-translations.js` to `require('./translation-tools')`
- [x] 2.3 Run `node check-translations.js` again; output and exit code must equal the "before" reference

## 3. Export script

- [x] 3.1 Create `export-translations.js`: flatten DE/EN/TR, sort by key, add the `screen` column (first key segment + files using the key from `scanUsedKeys()`)
- [x] 3.2 Write `translation-review.csv` with `;` separator, UTF-8 BOM, quoting of cells containing `;`, `"` or line breaks, header `key;screen;de;en;tr;comment_en;comment_tr`
- [x] 3.3 Add `translation-review.csv` to `.gitignore`
- [x] 3.4 Run it; check the row count equals the key count reported by `check-translations.js`, and open the file once to confirm umlauts and Turkish letters (ğ ş ı İ ç ö ü) display correctly

## 4. Evaluation (first pass)

- [x] 4.1 Read the generated sheet and review EN and TR against DE for the six checks in design decision 5 (wording, one term per concept, form of address, length, leftover German, Turkish contract vocabulary)
- [x] 4.2 Write `openspec/changes/evaluate-translations/translation-findings.md`: short summary, then a table of findings (key, language, problem, suggested text, certain / suggestion); state clearly that this is a non-native first pass
- [x] 4.3 Apply the findings graded *certain* to `translations.js`; leave suggestions untouched
- [x] 4.4 Run `node check-translations.js` — still no errors; re-run `node export-translations.js` so the sheet shows the corrected texts

## 5. Documentation and hand-over

- [x] 5.1 Update `TODO.md`: tick "Evaluate localization" only for the preparation part; keep an open item "Native-speaker review of EN/TR: send `translation-review.csv` + findings, apply answers" with the open question of who reviews
- [x] 5.2 Update `statusquo.md`: how to run `export-translations.js`, where the findings are, what is still open
- [x] 5.3 If `translations.js` changed: run `./bump-version.sh` before the next push (do not commit or push without Marçal's explicit OK)
- [x] 5.4 Manual check in the browser: login page and portal in DE/EN/TR still display correctly after the wording corrections
