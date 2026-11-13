## Context

The portal and login page are translated into German (reference), English and Turkish; texts live in `translations.js` as a nested `TRANSLATIONS` object. `check-translations.js` already loads that file in a sandbox, flattens it to keys like `portal.greeting` and scans the code for key usage. It verifies completeness only.

Quality review needs a native speaker (Marçal is a teacher; colleagues or parents who speak Turkish and English are the realistic reviewers). They should not have to read JavaScript. The review result has to come back in a form that can be applied to `translations.js` without guesswork.

Constraints: vanilla JS, no new dependencies; Node is already used for `check-translations.js`; translations and PDFs of legal documents are out of scope.

## Goals / Non-Goals

**Goals:**
- A reviewer-friendly sheet of all texts that can be regenerated at any time (after every text change).
- A documented first-pass evaluation so the native speaker starts from concrete questions, not from nothing.
- Fix only what is unambiguously wrong; keep a list of taste questions.

**Non-Goals:**
- Translating the Leihvertrag, PDFs, admin interface or `ipad_history` notes.
- Importing reviewer comments back automatically (a reviewed sheet is small enough to apply by hand; revisit if reviews become frequent).
- Machine translation or any external translation service — texts are never sent anywhere.
- Changing how translations are loaded or stored in the app.

## Decisions

**1. Output format: CSV (`;`-separated, UTF-8 with BOM), not HTML or Markdown.**
Excel and Numbers open it and the reviewer can type into the comment columns and send the file back. The import CSVs of this project already use `;`. The BOM makes Excel read ä, ö, ğ, ş, İ correctly. *Alternative:* an HTML page with editable fields — nicer, but the reviewer then has to save and send HTML; rejected as more work for no gain.

**2. Columns:** `key; screen; de; en; tr; comment_en; comment_tr`. Rows are sorted by key, which groups them by screen (`login.*`, `portal.*`, `legal.*` …). `screen` is derived from the first key segment plus the files that use the key (found by the same scan `check-translations.js` does), so the reviewer sees the context ("button in the damage pop-up"). Placeholders like `{name}` stay untouched and the sheet header row says so.

**3. Share code with `check-translations.js` instead of copying it.**
`loadTranslations()`, `flatten()` and `scanUsedKeys()` move into a small module `translation-tools.js` that both scripts `require`. *Alternative:* copy ~60 lines into the new script — rejected because two copies would drift apart. The risk of the refactor is small and is covered by comparing the output of `check-translations.js` before and after.

**4. The sheet is generated, not committed.**
Output goes to `translation-review.csv` (git-ignored) in the SchulAsset folder. It would be outdated after the next text change, and the source of truth stays `translations.js`.

**5. First-pass evaluation by the coding agent, recorded as `translation-findings.md` in this change folder.**
Checks, per language, over the generated sheet: (a) wording errors / unnatural phrasing, (b) one term per concept (iPad, Leihvertrag, Schadenmeldung, Verlustmeldung, Übergabe/Rückgabe, Seriennummer), (c) form of address (DE Sie; TR siz; EN neutral-formal) consistent everywhere, (d) text length versus German for buttons and step titles, (e) German left in EN/TR texts, (f) correct legal/administrative vocabulary in Turkish for contract-related terms. The agent is not a native speaker, so findings are graded **certain** (apply now) or **suggestion** (ask the reviewer). Only *certain* findings change `translations.js`.

**6. Timing: after `wire-portal-translations`.**
That change adds, renames and removes portal keys. Reviewing first would mean reviewing text that is about to change. If this change is applied first anyway, the sheet must be regenerated afterwards and the findings re-checked for the new keys.

## Risks / Trade-offs

- [The agent's Turkish/English judgement is not native] → Findings are graded; taste questions go to the native speaker; the findings file says plainly that it is a first pass.
- [Refactoring `check-translations.js` could change its results] → Run it before and after; output and exit code must be identical.
- [Reviewer edits the German or the keys in the sheet] → Header note: only the comment columns are to be filled; when applying, the key column is the anchor and German is never changed from the sheet.

## Open Questions

- Who reviews Turkish and English? (A person to be named by Marçal — colleague, parent representative, or a pupil's family.) The change delivers the sheet; the review itself stays an open TODO item until someone does it.
- Should the Leihvertrag text eventually get a courtesy translation next to the binding German text? Separate decision, already noted in `wire-portal-translations`.
