## 1. Panel structure

- [x] 1.1 `views/admin-panel.js`: `_panelRow(label, onclick, description)` with a description line
- [x] 1.2 Replace "Daten hinzufügen" and "Daten exportieren" by the sections Schüler, Lehrkräfte, iPads (fixed order of actions, descriptions, privacy note under the export row); keep Zugänge, Schule, Systemprüfung
- [x] 1.3 Section titles with Lucide icons (created after render, guarded with `window.lucide?.`)

## 2. Export status per section

- [x] 2.1 `views/csv-export.js`: `_exportStatus(kind, text, isError)` writes to `#export-status-<kind>`; the three export functions pass their kind
- [x] 2.2 Check that nothing else refers to `#export-status`

## 3. Style

- [x] 3.1 `admin.css`: description line under a row label, section header with icon; check phone width (no horizontal scrolling)

## 4. Test and document

- [x] 4.1 (tested by the user 2026-11-16, everything worked) Manual test: every row opens the right dialog or download (all 3 + 3 + 2 + 3 entries), result line appears in the right section, phone width / iPad
- [x] 4.2 `./bump-version.sh`; update `statusquo.md` (panel layout) and `TODO.md` if needed
