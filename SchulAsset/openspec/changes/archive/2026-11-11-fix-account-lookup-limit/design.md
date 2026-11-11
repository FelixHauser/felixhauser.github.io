## Context

`create-ipad-account` runs with the service-role key. For a given serial number it must either create the auth account `{SERIAL}@schulasset.local` or, if it exists, reset its password. Today it lists users (max 1000 per call) and searches that page. The supabase-js Auth admin API has no "get user by email" call, and the `auth` schema is not reachable through PostgREST.

## Goals / Non-Goals

**Goals:**
- Correct behaviour for any number of portal accounts (well beyond 2500).
- No database migration, no change to callers.

**Non-Goals:**
- Raising the number to 2500 (see decision 1).
- Storing the auth user id on `ipads` or adding a lookup SQL function (see alternatives).
- Changing password generation or the role upsert.

## Decisions

**1. Remove the limit instead of raising it to 2500.** `perPage` may be capped server-side, so 2500 is not guaranteed to work, and any fixed number is a future failure. Paging has no ceiling.

**2. Create first, look up only on conflict.** Call `createUser` directly. If it succeeds, done (no listing at all). If it fails because the email already exists, page through `listUsers({ page, perPage: 1000 })` until the email matches or a page comes back empty (so a server-side cap on page size cannot cut the search short), then `updateUserById` with the new password. Rationale: first assignments never list users; resets cost at most ceil(N/1000) requests (3 at 2500 accounts, each fast). Alternative: always list first — rejected, slower and the original bug.

**3. Detect "already exists" by error code/status, not by message text.** Use `createError.code === 'email_exists'` or `status === 422`, falling back to a case-insensitive match on "already" in the message. Any other error is returned as a 500 as before. Alternative: message match only — rejected as brittle.

**4. Alternatives rejected.**
- *SQL function `get_user_id_by_email` called via RPC:* a single exact lookup, the cleanest at very large scale, but needs a schema change, and the schema is not yet exported into the repo (`TODO.md` Priority 1). Can be revisited later.
- *Store `auth_user_id` on `ipads`:* migration plus backfill of existing accounts.

## Risks / Trade-offs

- [Paging is O(N/1000) per reset] → at the school's scale this is 1 to 3 quick requests, acceptable. Revisit with an RPC if accounts grow into the tens of thousands.
- [Auth error shape differs from expected, so the "exists" case is misdetected] → test against the live project with an existing serial number (reset) and a new one (create).
- [Edge Function is deployed by hand] → the change has no effect until it is pasted/deployed in Supabase Studio; this is an explicit task.

## Migration Plan

1. Edit the function in the repo.
2. Redeploy in Supabase Studio, Edge Functions, `create-ipad-account`.
3. Test in the app: assign a new iPad (create path), then reset the password of an assigned iPad (existing path).
4. Rollback: redeploy the previous source from git history.
