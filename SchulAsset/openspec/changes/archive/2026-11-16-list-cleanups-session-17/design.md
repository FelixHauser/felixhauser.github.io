## Context

The lists are filtered in the browser from `window._allPupils` / `window._allStaff` (`applyPupilFilter`, `applyStaffFilter`). The credentials download builds a CSV from one-time data in memory; `views/csv-export.js` (loaded in `admin.html`) already holds `csvCell`, the shared cell rules with a Node-tested implementation.

## Goals / Non-Goals

**Goals:** make hiding visible; remove duplicated logic; remove a dead translation key.
**Non-Goals:** changing what is hidden, adding another filter, changing the credentials file format.

## Decisions

1. **Count in the existing headline** (`#pupil-count`, `#staff-count`), not a new element: the place the admin already reads the number of rows. Text: `N Schüler · M ehemalige ausgeblendet`.
2. **Count only matches of the current search.** The number says what ticking "Ehemalige anzeigen" would add to what the admin currently sees. Alternative: all inactive people regardless of the search; rejected, it would claim hidden people the admin could not reveal in this view.
3. **`renderPupilTable(pupils, hiddenFormer = 0)`:** the count is computed in the filter function (one pass) and handed to the render function; the default keeps other callers working.
4. **Use `csvCell` in `downloadImportCredentials`.** It is only called when the admin clicks, long after all scripts have loaded, so the script order (`csv-import.js` before `csv-export.js`) does not matter. Alternative: move `csvCell` into a shared file; rejected, nothing else needs it.
5. **Remove, not keep, `login.errorGeneric`:** it is not used anywhere; the check script reported it as the only avoidable warning.

## Risks / Trade-offs

- [If `csv-export.js` were removed from `admin.html`, the credentials download would fail] → covered by the manual test of the download.
