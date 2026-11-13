## Why

Before go-live 1000+ iPads must get into the system. Adding them one by one with "+ Neues iPad" is not realistic. The admin prepares a simple CSV list and imports it in one step.

## What Changes

- New button "CSV importieren" on the iPad list (temporary placement, same as "+ Neues iPad"; moves into the admin panel later, see `TODO.md`).
- A dialog where the admin picks a CSV file in a fixed, documented format and downloads an empty template.
- A **preview before anything is written**: counts of new iPads, duplicates (already in the database or repeated in the file) and invalid rows, with the reason per problem row.
- New iPads are commissioned as `available` by default; an optional `status` column in the CSV can set another status that needs no assignment (e.g. `decommissioned`, `lost`).
- On confirmation the valid, new rows are inserted in chunks, each with an "iPad angelegt (CSV-Import)" history row; a result summary is shown.
- No database change: the INSERT policy and unique index from `add-individual-ipads` are reused.

## Capabilities

### New Capabilities
- `admin-ipad-import`: an admin can import many iPads from a CSV file with a preview and a result summary.

### Modified Capabilities

## Impact

- `views/ipad-list.js` (button) and a new `views/ipad-import.js` (parser, dialog, import); `admin.html` loads the new file.
- Reuses the serial normalisation rules of `admin-ipad-creation`.
- No Supabase, Edge Function or portal changes. Pupils and staff are out of scope (separate change).
