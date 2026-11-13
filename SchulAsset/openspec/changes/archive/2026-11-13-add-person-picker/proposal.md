## Why

In the "iPad zuweisen" dialog the person is chosen from a `<select>` that lists every pupil. With about 1000 pupils that is unusable: no search, endless scrolling, and on an iPad the native picker wheel is painful. Namesakes cannot be told apart, and a teacher without a Kürzel shows up as "(null)". The pupils are now imported in bulk, so this is the next thing that hurts.

## What Changes

- Replace the person `<select>` in the assign dialog by a **search field with a result list**: typing filters pupils (or staff) by name, Kürzel and address; tapping a result selects it; the selection is shown as a chip with a button to change it.
- Search is forgiving: case-insensitive, several words in any order ("anna müller" = "Müller, Anna"), umlauts and accents ignored.
- Each result shows what tells people apart: pupils with their address, staff with their Kürzel.
- At most 20 results are shown at a time, with "… N weitere — Suche eingrenzen" below.
- Enter selects the first result; the existing flow (type switch Schüler/Lehrkraft, "+ Neu anlegen", submit) keeps working unchanged.
- The picker is a small reusable component, so other dialogs can use it later.

## Capabilities

### New Capabilities
- `admin-person-picker`: choosing a pupil or staff member by searching, instead of from a long drop-down.

### Modified Capabilities

## Impact

- New `views/person-picker.js` (component + pure filter function), loaded from `admin.html`.
- `views/ipad-detail.js`: assign dialog markup, `_loadPersonList()`, reading the selected id in `submitAssign()`.
- `admin.css`: a few styles for the result list and the selection chip.
- No database, Supabase or portal changes.
