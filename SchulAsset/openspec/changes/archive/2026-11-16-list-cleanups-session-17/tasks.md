## 1. Hidden former people are counted

- [x] 1.1 `applyPupilFilter` / `applyStaffFilter` count hidden inactive matches; `renderPupilTable` / `renderStaffTable` show "· N ehemalige ausgeblendet"
- [x] 1.2 Manual check in the browser: count shown, follows the search, disappears when "Ehemalige anzeigen" is ticked (confirmed by the user, 2026-11-16)

## 2. One CSV cell function

- [x] 2.1 Remove `_credCell` from `views/csv-import.js`; `downloadImportCredentials` uses `csvCell` from `views/csv-export.js`
- [x] 2.2 Manual test by the user (2026-11-16, test file with umlaut, a `=` name and a row without e-mail): download works and opens correctly

## 3. Unused translation key

- [x] 3.1 Remove `login.errorGeneric` from DE, EN and TR in `translations.js`
- [x] 3.2 `node check-translations.js`: 117 keys per language, no errors; `node export-translations.js` refreshed the review sheet

## 4. Housekeeping

- [x] 4.1 `./bump-version.sh` (asset version `20261116-4`) and Session 17 note in `statusquo.md`
