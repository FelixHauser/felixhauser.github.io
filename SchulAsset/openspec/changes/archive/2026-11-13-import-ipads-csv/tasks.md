## 1. Parser

- [x] 1.1 `views/ipad-import.js`: CSV parser (BOM, CRLF, quoted fields, `;`/`,` auto-detect from the header line)
- [x] 1.2 Row validation and normalisation (serial trim + upper case; type and storage values; optional `status` column with default `available` and the allowed no-assignment statuses; header columns present)
- [x] 1.3 Duplicate detection: within the file and against all existing serials (paged fetch, 1000 per page)

## 2. Dialog and import

- [x] 2.1 Button "CSV importieren" on the iPad list; dialog with file picker, format hint and template download (Blob)
- [x] 2.2 Preview: totals and table of problem rows (first 50), confirm button with the number to import (disabled when 0)
- [x] 2.3 Chunked insert (200 rows) of `ipads` with `.select('id, serial_number')` plus bulk `ipad_history` insert per chunk; progress text; stop on error and report saved count
- [x] 2.4 Result summary and re-render of the iPad list; `admin.html` loads `views/ipad-import.js`

- [x] 2.5 Found during the large-file test: the iPad list showed only 1000 rows. Add `fetchAllRows()` (paged loading) to `admin.js` and use it in `renderIpadList()`

## 3. Verification

- [x] 3.1 Script check of parser/validation with edge cases (BOM, CRLF, quotes, `;` and `,`, `128 GB`, empty serial, bad type, duplicate in file, status empty / `decommissioned` / `in_use`)
- [x] 3.2 Manual test: import a small valid file; re-import (all skipped); file with bad rows; lower-case serials; template download; history entries present
- [x] 3.3 Test with a large file (~1500 rows, generated) incl. a serial beyond the first 1000 existing iPads; delete the test iPads afterwards
- [x] 3.4 Tick the item in `TODO.md` (CSV import for iPads; pupils/staff remain open), update `statusquo.md`
