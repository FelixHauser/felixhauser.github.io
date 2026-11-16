## 1. CSV builder

- [x] 1.1 `views/csv-export.js` part 1: pure `csvCell(value)` and `buildCsv(columns, rows)` (header + rows, `;`, `\r\n`, quoting, formula protection); export for Node
- [x] 1.2 Node tests: umlauts, `;` / quote / line break in a field, leading `= + - @`, empty and null values, empty row list (header only)

## 2. Downloads

- [x] 2.1 `_downloadCsv(filename, text)` (Blob with BOM) and a helper that loads all rows with `fetchAllRows` (unique ordering ending in `id`)
- [x] 2.2 `exportPupils()`, `exportStaff()`, `exportIpads()` (columns, `ja`/`nein`, `yyyy-mm-dd`, `assigned_to`; no secrets); file names with date
- [x] 2.3 Feedback in the panel: loading text, number of lines, error message

## 3. Panel and hints

- [x] 3.1 `views/admin-panel.js`: section "Daten exportieren" with three entries and the privacy note; script tag in `admin.html`
- [x] 3.2 `views/status-import.js`: hint mentions the export file

## 4. Test and document

- [x] 4.1 Manual test: all three downloads open in Excel with correct umlauts; counts match the lists (incl. inactive people); round trip: edit the pupil export, import it with the status update
- [x] 4.2 (bump-version done)  update `statusquo.md` and `TODO.md` (tick "Exports" partly: lists for pupils/staff/iPads)
