## Why

`CLAUDE.md` requires the login page to be fully localised (DE/EN/TR). Today only the main login form goes through `translations.js`; the auto-login message, the forgot-password and new-password sections, the "Passwort vergessen?" link and several messages in `auth.js` are hardcoded German, so they show German whatever language is selected.

## What Changes

- Add translation keys (DE/EN/TR) for every remaining hardcoded German string on `login.html`: "Passwort vergessen?", "Wird angemeldet…" (auto-login), the forgot-password section, the new-password section and the e-mail placeholder.
- Mark those elements in `login.html` with `data-i18n` / `data-i18n-placeholder`.
- Replace the hardcoded messages in `auth.js` (`handleForgotPassword`, `handleNewPassword`) with `t('login.…')` calls.
- Technical error text returned by Supabase (appended after the localised "Fehler:" prefix) stays as delivered by Supabase.
- No change to the admin interface (German only by decision).

## Capabilities

### New Capabilities
- `login-localisation`: every user-visible string on the login page, including the password-reset flow, follows the selected language (DE default, EN, TR).

### Modified Capabilities

## Impact

- `login.html`, `auth.js`, `translations.js` (three `login` blocks).
- No database, Supabase or Edge Function changes.
- Turkish and English wording should be reviewed by a native speaker (already tracked under "Evaluate localization" in `TODO.md`).
