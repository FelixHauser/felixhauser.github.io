## 1. Footer translations

- [x] 1.1 Add a `legal` namespace to `translations.js` for DE, EN and TR with exactly two keys: `footerDatenschutz`, `footerImpressum`
- [x] 1.2 Check that both keys exist in all three languages

## 2. Shared styling

- [x] 2.1 Create `SchulAsset/legal.css` with a readable long-text layout (max-width ~720px, 16px side gutter on mobile), a header with logo + back link, and a prominent `#placeholder-notice` banner
- [x] 2.2 Add a `.legal-footer` link style to `login.css` and `portal.css`

## 3. Legal pages (German only)

- [x] 3.1 Create `SchulAsset/datenschutz.html`: `<html lang="de">`, header with back link, German placeholder banner, one `<main id="legal-content">` with placeholder headings/paragraphs and a `<!-- PLACEHOLDER -->` comment; loads no `translations.js`, no Supabase and no other script except the back-link handler
- [x] 3.2 Create `SchulAsset/impressum.html` with the same structure
- [x] 3.3 Add the inline back-link handler to both pages: `history.back()` if there is history, otherwise go to `login.html`

## 4. Links

- [x] 4.1 Add a footer with links to both pages below the login card in `login.html`, using `data-i18n` for the labels
- [x] 4.2 Add the same footer to `portal.html` as static HTML outside the container `portal.js` renders into

## 5. Verification

- [x] 5.1 Open both pages logged out and confirm the German content shows regardless of `localStorage.lang`, and that no Supabase or third-party requests are made
- [x] 5.2 Switch the language on login and portal and confirm the footer link labels change (DE/EN/TR)
- [x] 5.3 From the portal, follow a footer link and go back, and confirm the pupil is still logged in
- [x] 5.4 Open a legal page directly and confirm the back link goes to `login.html`
- [x] 5.5 Check the layout at phone width (no horizontal scroll)

## 6. Docs

- [x] 6.1 In `SchulAsset/TODO.md`, mark the Datenschutzerklärung/Impressum item as "pages ready (German only), waiting for text from the school"
- [x] 6.2 Add a short "How to insert the real legal text" note to `SchulAsset/statusquo.md` (replace the content of `#legal-content`, remove `#placeholder-notice`)
