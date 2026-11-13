## Context

`login.html` already uses `data-i18n` and `applyTranslations()` from `translations.js`. The remaining German text was added later (QR auto-login, admin password reset) without keys. `t()` falls back to German for missing keys, so incomplete translations would go unnoticed.

## Goals / Non-Goals

**Goals:**
- Every visible string on `login.html` and every message produced by `auth.js` comes from `translations.js`.
- Messages set from JS follow the language that is active when they are shown.

**Non-Goals:**
- Translating Supabase's own error messages.
- Localising the admin interface or the legal pages.
- An automated missing-key checker (separate TODO item "Evaluate localization").

## Decisions

- **Reuse the existing `login` namespace** with new keys: `forgotLink`, `autoLoggingIn`, `forgotIntro`, `emailLabel`, `emailPlaceholder` (kept `admin@schule.de`, not translated), `sendResetLink`, `backToLogin`, `newPasswordIntro`, `newPasswordLabel`, `savePassword`, `errorEmailRequired`, `errorPrefix`, `resetLinkSent`, `errorPasswordTooShort`, `passwordSaved`. Simplest, consistent with the existing pattern.
- **Static text via `data-i18n`**, replacing inline text; German text stays in the HTML as no-JS fallback like the existing elements.
- **JS messages via `t()` at the moment of display.** A message already on screen is not re-translated if the user then switches language; acceptable for transient messages.
- **Error format** `t('login.errorPrefix') + ' ' + error.message` ("Fehler:" / "Error:" / "Hata:").

## Risks / Trade-offs

- Machine-quality Turkish/English wording → flagged for native-speaker review.
- Elements that `applyTranslations()` fills via `textContent` must not contain child markup; the affected buttons only contain text.
