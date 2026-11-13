## Context

`openAssignModal` builds a `<select id="md-person">`; `_loadPersonList()` fills it for pupils or staff after the type select changes; `submitAssign()` reads `md-person`'s value as the person id (and `md-new-*` fields when "+ Neu anlegen" is active). All pupils/staff are loaded with `fetchAllRows()` (fine for a few thousand rows). Lists elsewhere already filter client-side.

## Goals / Non-Goals

**Goals:** find a person fast on a phone/iPad and with a keyboard; tell namesakes apart; keep `submitAssign()` and the "+ Neu anlegen" flow unchanged.

**Non-Goals:** server-side search; a picker for the Pending view or other dialogs (reusable but not applied there); hiding pupils who already have an iPad; recently used / favourites.

## Decisions

- **Hidden input keeps the contract.** The picker renders a text input for the query, a result list, and an `<input type="hidden" id="md-person">` holding the selected id. `submitAssign()` stays untouched (`document.getElementById('md-person')?.value`), and an empty value still produces "Bitte eine Person auswählen."
- **Component API.** `createPersonPicker(rootId, { items, onSelect })` in `views/person-picker.js`; `items` = `[{ id, label, sub }]` (label "Müller, Anna", sub = address or Kürzel). Pure function `filterPeople(items, query)` is exported for Node tests (`module.exports` guard as in `csv-import.js`).
- **Matching.** Normalise both sides: lower case, Unicode NFD with combining marks removed (ü→u, é→e), ß→ss. The query is split into words; an item matches when every word is contained in `label + ' ' + sub` (so "anna müller", "müller anna", "mus" for a Kürzel all work). Results keep the list order (last name, first name); with an empty query nothing is listed except a hint "Namen eintippen…", so 1000 rows are never rendered at once.
- **Limit.** At most 20 rows rendered; a line "… N weitere — Suche eingrenzen" otherwise.
- **Selection.** Tapping a row (or Enter on the query field, picking the first result) sets the hidden input and replaces the field by a chip "Müller, Anna · Adresse" with a "Ändern" button that clears the selection and refocuses the field. Changing the type (Schüler/Lehrkraft) rebuilds the picker with the other list and no selection.
- **Items.** Pupils: label `last, first`, sub = address (omitted if empty). Staff: label `last, first`, sub = Kürzel (omitted if empty — fixes "(null)"). Loaded once per dialog open and per type change via `fetchAllRows()`.
- **Escaping.** All names/addresses go through `_htmlEsc`; ids are placed into `data-id` attributes, not inline JS.
- **Accessibility / touch.** Result rows are `<button type="button">` elements with a minimum tap height of 44px; the result list scrolls inside the dialog (max-height); keyboard: Enter selects the first result, Escape clears the query.
- **Styling.** A few classes in `admin.css` (`.picker-results`, `.picker-item`, `.picker-chip`) using the existing colour variables.

## Risks / Trade-offs

- The dialog is rebuilt in places; any code that relied on the `<select>` (e.g. `md-person` options) must be found — grep before changing.
- Loading all pupils on every dialog open costs one to two requests (1000 rows each); acceptable, and cached per dialog.
- Without a query nothing is listed, so a user who wants to browse cannot; accepted for 1000+ pupils (a hint explains it).
