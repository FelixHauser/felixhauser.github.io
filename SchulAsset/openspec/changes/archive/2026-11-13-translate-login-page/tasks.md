## 1. Translations

- [x] 1.1 Add the new `login.*` keys to the `de` block of `translations.js`
- [x] 1.2 Add the same keys in English to the `en` block
- [x] 1.3 Add the same keys in Turkish to the `tr` block

## 2. Login page

- [x] 2.1 `login.html`: add `data-i18n` to the forgot link, auto-login message, forgot section (intro, label, button, back link) and new-password section (intro, label, button)
- [x] 2.2 `auth.js`: use `t()` in `handleForgotPassword` and `handleNewPassword` messages

## 3. Verification

- [x] 3.1 Script check: `login` key sets of de/en/tr are identical
- [x] 3.2 Manual test in DE/EN/TR: login form, forgot section, auto-login (`?sn=…&pw=…`), recovery view (`#type=recovery`), reset-form error messages
- [x] 3.3 Tick the item in `TODO.md`, update `statusquo.md`
