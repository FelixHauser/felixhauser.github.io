## 1. Helper

- [x] 1.1 `admin.js`: extend the `fetchAllRows` comment (needs a unique ordering); unit check with a fake query builder (0, 999, 1000, 1001, 2500 rows; error on page 2)
- [x] 1.2 `views/ipad-import.js`: `_fetchAllSerials()` uses `fetchAllRows()`

## 2. Lists

- [x] 2.1 `views/pupil-list.js` and `views/staff-list.js`: load via `fetchAllRows()` with `.order('id')` tie-breaker
- [x] 2.2 `views/ipad-detail.js`: pupil and staff dropdowns in the assign dialog via `fetchAllRows()`

## 3. Pending view

- [x] 3.1 `views/meldungen.js`: Rückgabe, Schadenmeldung and Verlustmeldung queries via `fetchAllRows()` with `id` tie-breaker
- [x] 3.2 `_fetchUebergabePending()`: replace the two `.in(ipadIds)` queries by paged loads of `terms_acceptance` (valid) and `uebergabeprotokoll`, joined in JS; result unchanged

## 4. Verification

- [x] 4.1 Manual regression: pupil list, staff list, assign dialog dropdowns, Pending tabs show the same data as before (counts compare with the previous screen)
- [x] 4.2 Paging check with real data > 1000 rows where available (iPad-based test data), otherwise rely on the unit check
- [x] 4.3 Tick the `TODO.md` item "1000-row limit in other lists"; update `statusquo.md`; note the searchable-dropdown follow-up in `TODO.md`
