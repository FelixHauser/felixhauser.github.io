## 1. Component

- [x] 1.1 `views/person-picker.js`: pure `normalizeSearch()` / `filterPeople(items, query)` (lower case, NFD without marks, ß→ss, all words must match, in label + sub)
- [x] 1.2 `createPersonPicker(rootId, { items, onSelect })`: query field, result list (max 20, "… N weitere", hint when empty), chip with "Ändern", hidden input `md-person`, Enter = first result, Escape clears
- [x] 1.3 Styles in `admin.css` (`.picker-results`, `.picker-item` 44px tap height, `.picker-chip`); load `person-picker.js` from `admin.html`

## 2. Assign dialog

- [x] 2.1 `views/ipad-detail.js`: replace the `<select id="md-person">` by the picker container; `_loadPersonList()` loads pupils (`address` too) or staff and builds the picker (label / sub as designed, no "(null)")
- [x] 2.2 Check `submitAssign()` and `_showNewPersonFields()` still work (hidden input keeps the contract); grep for other users of `md-person`

## 3. Verification

- [x] 3.1 Node tests for `filterPeople`: word order, umlauts/ß, case, Kürzel, address, empty query, limit input, no match
- [x] 3.2 Manual test: search pupils and staff, namesakes with different addresses, select/change/assign, no selection error, switch type, "+ Neu anlegen" flow, on iPad (touch) if possible
- [x] 3.3 Move the TODO item to Done, update `statusquo.md`
