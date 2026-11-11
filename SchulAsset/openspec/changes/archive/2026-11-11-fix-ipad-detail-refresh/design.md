## Context

The admin app is one page (`admin.html`). `admin.js` has a small router: `routeToHash(hash)` looks the hash up in `VIEW_RENDERERS` and calls the renderer. The router runs on load (`initAdmin`) and on every `hashchange`. Detail pages are opened with `showIpadDetail(id)` etc., which store the id in a global (`window._currentIpadId`) and set the hash to `ipad-detail`. A reload wipes the global, so the hash alone cannot say which iPad to show. Grep shows nothing outside `admin.js` and `views/ipad-detail.js`, `pupil-detail.js`, `staff-detail.js` reads these globals or the hash.

`renderIpadDetail()` (in `views/ipad-detail.js`) rebuilds the whole page: it writes a "loading" shell, fetches the iPad, then fetches history, protocols and terms in parallel, then writes the final HTML. Every write action ends by calling it. The shared modal (`#admin-modal`) is a separate element appended to `document.body`, so it is not touched by a re-render.

In `submitAssign` the flow for pupils is: save assignment, call the Edge Function, then `_showPasswordCard(..., onClose)`. The re-render only lives inside `onClose`, which is wired to the "Verstanden" button. `_showPasswordCard` builds that button as `onclick="(${onClose.toString()})()"`, i.e. it turns the function into source text. The ✕ button in the modal header, and the footer restored by `closeAdminModal()`, never call it.

**Outcome of the earlier diagnosis (2026-11-11):** "↻ Aktualisieren" showing nothing after a parent's change was not reproduced in a retest with separate sessions: it works. The captured Supabase response was transferred over the network (not cached), with no caching headers and `cf-cache-status: DYNAMIC`. The probable causes of the demo symptom are the reload trap (reload instead of the ↻ button) and a shared browser login between admin and parent tabs. So no cache change is made.

## Goals / Non-Goals

**Goals:**
- Reloading the browser (F5), opening a bookmark or following a pasted link on a detail page shows the same item.
- The address in the browser always matches what is on screen, so clicks never silently do nothing.
- After any action on the iPad detail page, the page shows the saved state however the dialog is closed.
- A slow, older render can never overwrite a newer one.

**Non-Goals:**
- Real-time updates from other users/sessions.
- Changing list views, the student portal, the Supabase client, or database/Edge Function code.
- Reworking the modal system.

## Decisions

**1. The id lives in the address: `#<view>/<id>`.** Detail pages become `#ipad-detail/<id>`, `#pupil-detail/<id>`, `#staff-detail/<id>`. `showIpadDetail(id)`, `showPupilDetail(id)` and `showStaffDetail(id)` only set `window.location.hash = 'ipad-detail/' + id`; the `hashchange` event then does the rest. The address is the single source of truth. Alternatives: keep the id in `sessionStorage` (rejected: the address would still not identify the page, so bookmarks and pasted links would not work), or only reset to the list after a reload (rejected: a reload in the middle of a task should keep the admin where they were).

**2. The router parses the address and sets the existing globals.** `routeToHash` splits the hash at the first `/` into `view` and `param`. It highlights the sidebar item for `view` and looks up the renderer for `view`. Before calling a detail renderer it sets `window._currentIpadId` (or pupil/staff) to `param`, so the three detail files keep reading the globals they read today and need no change for the reload feature. Ids are UUIDs (hex digits and dashes), so no escaping is needed.

**3. The address always matches the screen.** At the top of `routeToHash`, if the requested hash differs from the current `window.location.hash`, the router calls `history.replaceState(null, '', '#' + hash)` before rendering. `replaceState` changes the address without adding a history entry, so the Back button does not return to the broken address, and it fires no `hashchange` event, so there is no second render. This covers every fallback: an empty hash becomes `#schnellsuche`; an unknown hash becomes `#ipads`; and a detail page without an id (the existing `routeToHash('ipads')` in the detail renderers) lands on the list with `#ipads` in the address. Clicking an iPad then changes the hash for real and works.

**4. A detail address with an id that does not exist keeps the page's existing load-error behaviour.** Only a *missing* id falls back to the list. Changing the error handling for unknown ids is not needed for this bug.

**5. Re-render right after the save, then show the password card.** In `submitAssign`, call `renderIpadDetail()` once the assignment and history are written (before `_showPasswordCard`). The modal sits above the page, so the user sees the password card while the page refreshes behind it. Then "Verstanden" and ✕ both just close the modal. Alternative: make ✕ call a refresh hook — rejected, more moving parts and easy to miss for a new close path.

**6. Replace `onClose.toString()` with a stored callback.** `_showPasswordCard` keeps the callback in a module variable and the button calls a named function (`_finishPasswordCard()`), instead of serialising source text into HTML. Serialised functions lose their closure (they only worked because the arrow functions used global names), so one innocent edit would break the button silently. After decision 5, the assignment callback only needs `closeAdminModal()`, but the mechanism should still be safe for future use.

**7. Latest-render-wins guard in `renderIpadDetail()`.** A module counter `_detailRenderId` is incremented at the start of each render; each render remembers its own id and, after each `await`, returns without writing if the counter has moved on. Alternative: disable the button / queue renders — rejected, more UI state for the same result.

**8. Surface silent query errors in `renderIpadDetail()`.** The queries for `uebergabeprotokoll`, `rueckgabeprotokoll` and `terms_acceptance` discard their `error`. Log them with `console.error`. This changes no behaviour but makes a failure visible in the console.

**9. Keep the re-render call at the end of every other action as it is.** They already render after `closeAdminModal()`; with decision 7 overlapping calls are now safe.

## Risks / Trade-offs

- [The Back button after a reload] → The browser keeps its history across a reload, so "← Zurück" (`history.back()`) works. If a detail page is opened from a bookmark or a pasted link in a fresh tab there is no previous page and Back leaves the app. Accepted for now; a "back to list" fallback can be a follow-up.
- [Old bookmarks of the form `#ipad-detail` (no id)] → They land on the list with a corrected address (decision 3). No harm.
- [Two fetches per assignment, one right after the save and none extra after "Verstanden"] → No extra: the re-render moves, it is not duplicated.
- [Unchecked follow-up writes] → Several actions ignore the result of secondary writes (for example the status update in `submitUebergabe`, or `ipad_history` inserts). If one fails (e.g. blocked by RLS) the page re-renders the old state silently. Not changed here; see Open Questions.
- [Shared login between tabs] → Admin and parent logged in in the same browser overwrite each other's session. This is how Supabase's `localStorage` session works and is not changed here; tests must use separate browsers or a private window.

## Open Questions

- Should secondary write failures be surfaced to the admin (an error in the modal)? Likely yes, but it touches many functions, so it would be its own change.
- Should the admin app warn or refuse when the session in another tab changes to a non-admin user? Not needed for the school workflow, but it caused confusion during testing.
