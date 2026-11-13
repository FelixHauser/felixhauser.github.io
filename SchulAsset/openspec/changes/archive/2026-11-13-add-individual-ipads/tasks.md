## 1. Database

- [x] 1.1 Check in Supabase whether `ipads.serial_number` is unique and whether CHECK constraints exist on `ipad_type` / `storage_capacity` (values `student|staff`, `64gb|128gb|256gb`)
- [x] 1.2 Run `GRANT INSERT ON public.ipads TO authenticated;` and create the admin-only INSERT policy (plus a unique constraint on `serial_number` if missing) — SQL provided by Claude, run by the user in the SQL Editor
- [x] 1.3 Log all SQL in `supabase/db-changes.md`

## 2. Admin interface

- [x] 2.1 `views/ipad-list.js`: add "+ Neues iPad" button to the toolbar and `openNewIpadModal()` with serial, type and storage fields
- [x] 2.2 `submitNewIpad()`: validate, normalise (trim, upper case), duplicate check against `window._allIpads`, insert with status `available`, handle `23505`
- [x] 2.3 Write the "iPad angelegt" `ipad_history` row (`status_change`, `available`, `_adminName()`), then open the detail page via `showIpadDetail(id)`

## 3. Verification

- [x] 3.1 Manual test: create an iPad; empty serial; duplicate (same and different letter case); lower-case input becomes upper case; new iPad shows history entry and can be assigned
- [x] 3.2 Confirm a student session cannot insert (RLS) — optional, via Studio or browser console (skipped: optional)
- [x] 3.3 Tick the item in `TODO.md`, update `statusquo.md`
