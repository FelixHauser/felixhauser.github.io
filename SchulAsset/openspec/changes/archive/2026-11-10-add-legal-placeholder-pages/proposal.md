## Why

Before go-live, SchulAsset must have a Datenschutzerklärung and an Impressum, both reachable from the login page and the pupil portal. The legal text will come from the school (data protection officer / Schulträger), not from the developer. Adding the pages with clearly marked placeholder text now means the link structure is finished, and the real text only has to be dropped in when it arrives.

The legal pages are **German only**. German is the only official language in Germany, so it is the legally binding version. EN and TR in the rest of the app are a courtesy for families and do not extend to legal text.

## What Changes

- New public page `SchulAsset/datenschutz.html` (Datenschutzerklärung) with German placeholder content.
- New public page `SchulAsset/impressum.html` (Impressum) with German placeholder content.
- Both pages show a clearly visible "Platzhalter — rechtlich nicht gültig" notice until the real text replaces it.
- Footer links to both pages on `login.html` and `portal.html`. The link labels are localised (DE/EN/TR) like the rest of login and portal; the pages they open are German.
- Two new translation keys for the footer link labels in `translations.js`.

## Capabilities

### New Capabilities
- `legal-pages`: Publicly accessible, German-only Datenschutzerklärung and Impressum pages, linked from login and portal, with placeholder content that is marked as such and easy to replace.

### Modified Capabilities
<!-- None — no existing specs in openspec/specs/. -->

## Impact

- **New files:** `SchulAsset/datenschutz.html`, `SchulAsset/impressum.html`, `SchulAsset/legal.css`.
- **Modified files:** `SchulAsset/login.html`, `SchulAsset/portal.html`, `SchulAsset/translations.js` (two keys only), `SchulAsset/login.css`, `SchulAsset/portal.css`.
- **No** database, Supabase, auth or Edge Function changes. The legal pages need no login, load no Supabase client and do not load `translations.js`.
- **Follow-up (outside this change):** the school supplies the final legal text, which then replaces the placeholder content, and the placeholder notice is removed.
