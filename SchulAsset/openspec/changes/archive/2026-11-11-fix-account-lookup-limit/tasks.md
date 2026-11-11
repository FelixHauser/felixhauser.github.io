## 1. Edge Function

- [x] 1.1 In `supabase/functions/create-ipad-account/index.ts`, replace the `listUsers({ perPage: 1000 })` block: call `createUser` first
- [x] 1.2 On an "email already exists" error (code `email_exists` / status 422, message fallback), page through `listUsers({ page, perPage: 1000 })` until the email matches or a page comes back empty, then `updateUserById` with the new password
- [x] 1.3 Return any other `createUser` error as a 500, unchanged from today; keep the `user_roles` upsert for both paths
- [x] 1.4 Add clear comments explaining why the lookup is paged and only runs on conflict

## 2. Deploy and verify (manual, needs Supabase Studio)

- [x] 2.1 Redeploy `create-ipad-account` in Supabase Studio → Edge Functions
- [x] 2.2 Test in the app: assign a new iPad (create path), shows a password
- [x] 2.3 Test in the app: reset the password of an already-assigned iPad (existing path), shows a new password and the old one stops working
- [ ] 2.4 (skipped, optional) If feasible, test the beyond-1000 case (e.g. temporarily set `perPage` to 2 in a test copy) to confirm the paging finds an account on page 2

## 3. Found during testing

- [x] 3.0a Error responses had no CORS headers, so the browser hid the real error: every response now goes through a `json()` helper with CORS headers
- [x] 3.0b `views/ipad-detail.js` now shows the function's error text in the alert and console
- [x] 3.0c `service_role` lacked rights on `public.user_roles` (`permission denied`): fixed in the database with `GRANT SELECT, INSERT, UPDATE ON public.user_roles TO service_role;`

## 4. Documentation

- [x] 4.1 `statusquo.md`: remove the "Known issue" about the 1000-account limit and describe the new lookup in the Edge Function section
- [x] 4.2 `TODO.md`: tick "Fix the Edge Function 1000-account limit"
- [x] 4.3 Ask the user for an explicit OK before any commit or push
