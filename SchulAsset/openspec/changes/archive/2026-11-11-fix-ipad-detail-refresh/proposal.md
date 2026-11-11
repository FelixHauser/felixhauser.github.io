## Why

The admin detail pages sometimes show old data or end up dead, and the admin cannot tell whether a change was saved. This is a Priority 1 item in `TODO.md` ("Fix refresh bug"). Testing on 2026-11-11 found three separate causes.

1. **Reloading the browser (F5) on a detail page breaks navigation.** The URL only says `#ipad-detail`; *which* iPad is kept in a JavaScript variable (`window._currentIpadId`) that a reload wipes. The page then falls back to the iPad list, but the URL still says `#ipad-detail`. Clicking an iPad sets the hash to the value it already has, the browser fires no `hashchange` event, and nothing happens until the admin clicks another sidebar item. Pupil and staff detail use the same pattern. A reload should keep the admin on the page they were on.
2. **Assignment with portal password:** after "Zuweisen", the data is saved but the page behind the modal is only re-rendered when the admin clicks "Verstanden" on the password card. Closing the card with the ✕ button only closes the modal, so the page keeps showing the old state (e.g. still "Verfügbar"). The "Verstanden" button is also wired through `onClose.toString()`, which is fragile.
3. **Overlapping renders:** `renderIpadDetail()` fetches in several steps and writes the page at the end. If it runs twice close together, a slower older response can overwrite a newer one.

**Ruled out:** a live demo had suggested that "↻ Aktualisieren" does not show changes made in another session (a parent accepting the Leihvertrag). A two-session retest on 2026-11-11 (separate sessions for admin and parent) showed that "↻ Aktualisieren" works. The Supabase responses are not cached (checked in the Network tab: transferred over the network, `cf-cache-status: DYNAMIC`, no caching headers). The likely explanations are the F5 trap above, or admin and parent sharing one browser login (the session is stored in `localStorage`, shared by all tabs). No caching fix is needed.

## What Changes

- **The address identifies the page:** detail pages use `#ipad-detail/<id>`, `#pupil-detail/<id>` and `#staff-detail/<id>`. The router reads the id from the address, so a reload, a bookmark or a pasted link lands on the same page.
- **The address always matches the screen:** when the router cannot show the requested page (for example a detail page without an id), it shows the list and corrects the address to `#ipads` without adding a history entry. This removes the dead-click trap.
- Re-render the iPad detail page as soon as an action has saved its data, before the password card is shown, so the page behind the modal is already current whichever way the card is closed.
- Replace the password card's `onClose.toString()` mechanism with a normal stored callback.
- Make `renderIpadDetail()` ignore results from a render that has been superseded by a newer one.
- Log errors from the currently silent secondary queries (terms, Übergabe, Rückgabe) in `renderIpadDetail()`.
- Not in scope: list views, the student portal, the Supabase client (`cache: 'no-store'` is not needed), and unchecked follow-up writes (recorded as an open question in the design).

## Capabilities

### New Capabilities
- `admin-ipad-detail`: The admin detail pages can be reloaded or opened by link and show the same item; the iPad detail view always shows the saved state after an action, however the action's dialog is closed; a stale response never overwrites a newer one.

### Modified Capabilities
<!-- None: no existing spec covers the detail views. -->

## Impact

- `SchulAsset/admin.js`: `routeToHash` (parse `view/id`, correct the address) and `showIpadDetail` / `showPupilDetail` / `showStaffDetail` (write the id into the address).
- `SchulAsset/views/ipad-detail.js`: `renderIpadDetail`, `submitAssign`, `_showPasswordCard`.
- `views/pupil-detail.js` and `views/staff-detail.js` need no change: they keep reading `window._currentPupilId` / `_currentStaffId`, which the router now sets from the address.
- No database, Edge Function or Supabase client changes.
- Needs a manual test of reload on each detail page and of each action that ends with a re-render.
