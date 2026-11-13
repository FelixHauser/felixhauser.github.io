## Context

`fetchAllRows(buildQuery)` in `admin.js` runs a freshly built query page by page with `.range()` until a page is shorter than 1000. Paging only gives correct results with a deterministic order; otherwise rows can appear twice or be skipped between pages.

## Goals / Non-Goals

**Goals:** no silent truncation in admin lists; the Pending view works with 1000+ pupils/iPads; no request URL that grows with the number of rows.

**Non-Goals:** search-as-you-type or server-side filtering/pagination in the UI (the lists still load fully and filter in the browser, which is fine for a few thousand rows); a searchable dropdown for 1000+ pupils in the assign dialog (usability follow-up); performance tuning.

## Decisions

- **Reuse `fetchAllRows()`** for pupil list, staff list and dropdowns. Orders: pupils/staff `last_name, first_name` are not unique → add `.order('id')` as last key.
- **Pending: Rückgabe and damage/loss lists** also go through `fetchAllRows()` (the Rückgabe list contains every accepted protocol ever, so it grows over the years). Orders get `.order('id')` as a tie-breaker.
- **Pending Übergabe: no `.in(ids)`.** Instead load (a) assigned-to-pupil iPads, (b) all `terms_acceptance` rows with `invalidated_at IS NULL` (select `ipad_id` only), (c) all `uebergabeprotokoll` rows (select `ipad_id, created_at`), each paged, and combine in JS exactly as today (Set/Map by `ipad_id`). Same result, fixed-size URLs. More rows are transferred than before for (b)/(c), but only two narrow columns; acceptable for a few thousand rows. Alternative considered: chunking the `.in()` list in groups of ~100 ids — rejected as more requests and more code.
- **Error handling:** `fetchAllRows` returns `{ data, error }` like Supabase, so call sites keep their existing error branches.
- **Import:** replace the private loop in `_fetchAllSerials()` by `fetchAllRows()` (behaviour unchanged).
- **Testing the paging:** with fewer than 1000 pupils the paging path is not exercised. Verify the helper with the 1701 test iPads still in the database if not yet deleted, or by temporarily calling it with a small page size; for the pupil lists a generated pupil CSV is not available yet, so the helper's behaviour is covered by the iPad list test already done plus a unit check with a fake query builder.

## Risks / Trade-offs

- A browser-side join in the Übergabe tab loads more data than a server-side one. If it becomes slow, move it into a database view (needs a DB change, out of scope).
- Dropdowns with 1000+ options are hard to use; flagged as follow-up in `TODO.md`.
