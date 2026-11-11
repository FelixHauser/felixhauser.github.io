## 1. Reload keeps the current page (router, `admin.js`)

- [x] 1.1 `routeToHash`: split the hash at the first `/` into `view` and `param`; highlight the sidebar item and look up the renderer by `view`
- [x] 1.2 `routeToHash`: for `ipad-detail`, `pupil-detail` and `staff-detail`, set `window._currentIpadId` / `_currentPupilId` / `_currentStaffId` to `param` before calling the renderer (and clear it when there is no `param`)
- [x] 1.3 `routeToHash`: if the requested hash differs from `window.location.hash`, call `history.replaceState(null, '', '#' + hash)` before rendering (no new history entry, no second render)
- [x] 1.4 `showIpadDetail`, `showPupilDetail`, `showStaffDetail`: only set `window.location.hash = '<view>/' + id` (the router sets the global)
- [x] 1.5 Confirm nothing else reads or writes the hash or the `_current…Id` globals (grep on 2026-11-11: only `admin.js` and the three detail files)

## 2. Latest render wins (`views/ipad-detail.js`)

- [x] 2.1 Add a module counter `_detailRenderId`; `renderIpadDetail()` takes its own id at the start and returns without writing if a newer render has started (check after each `await`, before every write to the page)
- [x] 2.2 `renderIpadDetail()`: log the errors of the `uebergabeprotokoll`, `rueckgabeprotokoll` and `terms_acceptance` queries with `console.error`

## 3. Assignment flow (`views/ipad-detail.js`)

- [x] 3.1 `submitAssign`: call `renderIpadDetail()` after the assignment, terms invalidation and history are written, before `_showPasswordCard`
- [x] 3.2 `_showPasswordCard`: replace `onclick="(${onClose.toString()})()"` with a stored callback and a named handler; "Verstanden" just closes the modal
- [x] 3.3 Update the callers of `_showPasswordCard` (assignment, password reset) to the new callback style

## 4. Verify (manual, local server, Firefox)

Use separate sessions for admin and parent (second browser or a private window): tabs of one browser share the login.

- [x] 4.1 Reload (F5) on an iPad detail page, a pupil detail page and a staff detail page: the same item is shown
- [x] 4.2 Copy the address of an iPad detail page into a new tab: the same iPad is shown
- [x] 4.3 Type `#ipad-detail` (no id) into the address: the list is shown, the address becomes `#ipads`, clicking an iPad opens it
- [x] 4.4 After a reload, "← Zurück" and the browser's Back button behave sensibly
- [x] 4.5 Assign an iPad to a pupil, close the password card with ✕: page shows the new assignment and status
- [x] 4.6 Same assignment, close with "Verstanden": same result
- [x] 4.7 Zuweisung aufheben, Status ändern, Übergabe-/Rückgabeprotokoll, Schaden- and Verlustmeldung: page is current after each, no manual refresh
- [x] 4.8 Click "↻ Aktualisieren" repeatedly and during an action: the page never shows older data after newer
- [x] 4.9 If any action still shows old data, note which one and add it to this change

## 5. Documentation

- [x] 5.1 `TODO.md`: tick "Fix refresh bug"; `statusquo.md`: note the `#view/id` addresses, the router's address correction, the render guard and the password card behaviour
- [x] 5.2 Ask the user for an explicit OK before any commit or push
