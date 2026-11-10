## Context

SchulAsset is a static site on GitHub Pages: plain HTML/CSS/JS with no build step. Supabase serves as the backend. UI strings live in `translations.js` (`TRANSLATIONS.de/en/tr`) and are applied through `data-i18n` attributes by `applyTranslations()`. The chosen language is saved in `localStorage.lang`, and both `login.html` and `portal.html` have a DE/EN/TR switcher.

The final legal text will be written by the school, not by the developer, and the developer can't predict how long it will be or how it will be structured. Whoever pastes it in later may not know the codebase well.

**The legal pages are German only** (decision 2026-11-10). German is the only official language in Germany and the legally binding one; EN and TR elsewhere in the app are a courtesy. Legal text is therefore never translated, and the pages need no i18n machinery.

## Goals / Non-Goals

**Goals:**
- Two public pages, `datenschutz.html` and `impressum.html`, that work without a login.
- German placeholder content with a visible notice that it is placeholder text.
- Footer links on the login page and the portal, labelled in the active UI language.
- Replacing the placeholder with the real text means editing one clearly marked block per file.

**Non-Goals:**
- Writing any actual legal content.
- Translating legal content into EN or TR, or offering a language switcher on the legal pages.
- Links from `admin.html`. Admins reach the pages via the login page.
- A cookie banner or consent mechanism. The app sets no tracking cookies; Supabase auth uses localStorage.
- Versioning the legal text. That's for the Leihvertrag, a separate TODO item.

## Decisions

**1. One static German HTML file per document, with a single marked content block.**
Each page has one `<main id="legal-content">` containing the placeholder text and an HTML comment `<!-- PLACEHOLDER: replace with text supplied by the school -->`.
- *Why:* Legal text is long and made of paragraphs, headings and lists. Plain HTML can be pasted in by someone who isn't a developer, and there is no script in the way.
- *Alternative considered:* Per-language blocks (DE/EN/TR) with a switcher script. Dropped once the pages became German only.
- *Alternative considered:* Markdown rendered with a JS library. That adds a CDN dependency and a fetch for little benefit. Rejected.

**2. The legal pages do not load `translations.js` at all.**
The page text, banner and back link are hardcoded German, and `<html lang="de">` is fixed. The only new translation keys are the two footer link labels used on `login.html` and `portal.html`, under a `legal` namespace (`footerDatenschutz`, `footerImpressum`) in all three languages. Those two pages already load `translations.js` and call `applyTranslations()`, so the labels need no extra code.

**3. A new small `legal.css`, built on the look of `login.css`.**
The pages need a readable long-text layout (max-width ~720px, comfortable line height), which neither `login.css` (a centered card) nor `portal.css` (app chrome) provides. Copying the few colour variables keeps the look consistent without coupling the pages to either stylesheet.

**4. The pages load no scripts except one tiny inline back-link handler, and no Supabase client or `auth.js`.**
They must stay reachable when Supabase is paused or down, must not trigger auth redirects, and must not contact any third-party host.

**5. Links open in the same tab, and "Zurück" uses `history.back()` with `login.html` as the fallback.**
The portal session survives a navigation because Supabase keeps it in localStorage, so the same tab is fine. If the page was opened directly (no history), the back link goes to `login.html`.

**6. The footer lives in static HTML, outside the container that `portal.js` renders into.**
`portal.js` writes the timeline with `innerHTML`; a footer inside that container would be wiped on every re-render. A static footer is also relabelled for free by `applyTranslations()`.

**7. The placeholder marker is a visible banner plus an HTML comment.**
The banner is a separate element (`#placeholder-notice`), so removing it is a one-line deletion once the real text is in.

## Risks / Trade-offs

- [The site goes live with the placeholder text still in place] → The banner is very visible, and the TODO.md item stays open until the real text arrives.
- [Families who read only Turkish or English cannot read the legal pages] → Accepted: German is the binding version. A short "only available in German" hint was considered and left out to keep the pages purely German.

## Migration Plan

Static files only. Deploy by pushing to `main`, and roll back by reverting the commit. Nothing changes in the database.

## Open Questions

- What is the correct Impressum entity: the school, or the Schulträger (Stadt Marl)? That's for the school to decide, and it doesn't affect the placeholder.
- The app is served from a personal GitHub Pages domain. Is a school or Stadt domain planned? It doesn't change this change, but whoever writes the Impressum will want to know.
- Out of scope but related: the app loads scripts from public CDNs (jsDelivr, unpkg, cdnjs), which the Datenschutzerklärung must disclose. Self-hosting them would be a separate change.
