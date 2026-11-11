## Why

The Edge Function `create-ipad-account` finds an existing portal account with `listUsers({ perPage: 1000 })` and searches only that first page. With more than 1000 portal accounts, an existing account that is not on the first page is not found, `createUser` fails with "already registered", and assigning, reassigning or resetting the password of that iPad fails. The school manages 1000+ iPads and the fleet can grow, so the limit will be hit in normal operation.

You asked for a limit of 2500. Simply raising `perPage` to 2500 is not a reliable fix: the Auth admin API may cap page size (commonly 1000), so the number could be silently ignored, and 2500 would only move the cliff. This change removes the limit instead, so it works for any number of accounts.

## What Changes

- In `supabase/functions/create-ipad-account/index.ts`, stop relying on a single `listUsers({ perPage: 1000 })` call.
- Try `createUser` first (the common case: first assignment of an iPad). Only when it reports that the email already exists, look the account up by paging through `listUsers` until the email is found, then reset the password.
- Any other `createUser` error is still returned as an error, as today.
- Redeploy the Edge Function in Supabase Studio (manual step; the function source in the repo is not deployed automatically).
- Update `statusquo.md` (remove the "Known issue") and tick the item in `TODO.md`.

## Capabilities

### New Capabilities
- `ipad-portal-accounts`: Creating or resetting the portal login account for an iPad works regardless of how many portal accounts exist.

### Modified Capabilities
<!-- None: no existing spec covers the Edge Function. -->

## Impact

- `SchulAsset/supabase/functions/create-ipad-account/index.ts` (one lookup block).
- Needs a manual redeploy in Supabase Studio and a test against the live project.
- Callers in `views/ipad-detail.js` are unchanged (same request and response).
- No database, RLS or client changes.
