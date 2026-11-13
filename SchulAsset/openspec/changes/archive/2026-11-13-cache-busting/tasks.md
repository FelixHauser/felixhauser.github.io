## 1. Version script

- [x] 1.1 Create `bump-version.sh` (bash + sed, macOS compatible): optional version argument, default `YYYYMMDD-N`; rewrites local script/stylesheet references only; prints the new version and files changed
- [x] 1.2 Make it executable and test it on a copy of the pages (no http URLs touched, idempotent, same-day counter)

## 2. Apply to pages

- [x] 2.1 Run the script so all five HTML pages get `?v=` suffixes
- [x] 2.2 Verify with grep that every local script/stylesheet has the suffix and CDN URLs are unchanged

## 3. Verification and docs

- [x] 3.1 Load login, portal and admin pages on the local server and confirm they still work (Network tab shows `?v=` requests)
- [x] 3.2 Document the "run `./bump-version.sh` before every push that changes a script or stylesheet" routine in `statusquo.md`
- [x] 3.3 Tick the item in `TODO.md` and move it to Done
