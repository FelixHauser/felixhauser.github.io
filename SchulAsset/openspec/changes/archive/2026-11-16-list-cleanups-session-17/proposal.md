## Why

Four small follow-ups were left over from session 16 (listed in `statusquo.md`). They were implemented directly on 2026-11-16, before this change existed; this change documents them afterwards, so they are recorded like every other piece of work. The most visible one: the pupil and staff lists hide inactive people without saying so, so an admin sees a shorter list and cannot tell why.

## What Changes

- **Count of hidden former people:** the headline of the pupil and staff list says how many inactive people are hidden, e.g. "1200 Schüler · 35 ehemalige ausgeblendet". Only people matching the current search are counted; nothing is shown if none are hidden or "Ehemalige anzeigen" is ticked.
- **One CSV cell function:** the credentials download of the Lehrkräfte import used its own copy (`_credCell`) of the cell rules already in `csvCell` (`views/csv-export.js`). The copy is removed; the download uses `csvCell`. The behaviour (quoting, protection against spreadsheet formulas) is identical.
- **Unused translation key removed:** `login.errorGeneric` (never used in code) is removed from German, English and Turkish. `node check-translations.js` now reports no warning except the one computed key in `portal.js`.
- **Notes:** `statusquo.md` records the work; the asset version goes to `20261116-4`.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `person-active-status`: the pupil and staff lists SHALL tell the admin how many inactive people are hidden.

## Impact

- `views/pupil-list.js`, `views/staff-list.js` (headline), `views/csv-import.js` (credentials download), `translations.js` (key removed), `statusquo.md`, version suffix in the HTML pages (`./bump-version.sh`).
- No database, Edge Function or dependency change.
- Process note: implemented before the proposal was written; a rule was added afterwards to work only via OpenSpec and only after asking.
