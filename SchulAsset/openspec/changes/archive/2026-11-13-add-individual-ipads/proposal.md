## Why

iPads can currently only be created in Supabase Studio. Before go-live the admin must be able to add single iPads (new purchases, found devices) in the app itself. Pupils and staff can already be added this way. This is also the foundation for the later CSV bulk import.

## What Changes

- New button "+ Neues iPad" on the iPad list view opens a dialog with: serial number (required), type (Schüler / Lehrkraft), storage capacity (64 GB / 128 GB / 256 GB).
- Saving creates the iPad with status `available` and no assignment, writes a first `ipad_history` row, and opens the new iPad's detail page.
- The serial number is stored trimmed and in upper case; duplicates are rejected with a clear message.
- Database: an INSERT grant and an admin-only INSERT RLS policy on `ipads` (logged in `supabase/db-changes.md`).

## Capabilities

### New Capabilities
- `admin-ipad-creation`: an admin can add a single iPad to the inventory from the admin interface.

### Modified Capabilities

## Impact

- `views/ipad-list.js` (button, dialog, save), possibly a small shared helper for the history row.
- Supabase: `GRANT INSERT ON public.ipads TO authenticated` and one RLS policy, run by hand once; log in `supabase/db-changes.md`.
- No change to portal, Edge Functions or other views. The portal account is created only on first assignment, as today.
