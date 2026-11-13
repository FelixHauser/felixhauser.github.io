# Translation findings — first pass

Date: 2026-11-14 · Scope: all 118 keys of `translations.js` (login page + student portal), English and Turkish checked against German · Sheet: `translation-review.csv` (generated with `node export-translations.js`).

**This is a first pass by a coding agent, not by a native speaker.** English is checked with reasonable confidence; Turkish is checked for consistency and obvious problems only. Findings are graded:

- **certain** — an inconsistency or clearly unnatural wording; already corrected in `translations.js`.
- **suggestion** — a matter of taste, convention or legal vocabulary; **not** changed, for the native speaker / Marçal to decide.

## Summary

- Completeness and placeholders: fine (`check-translations.js`, 0 errors).
- No German left in the English or Turkish texts (checked by script: no ä/ö/ü/ß, no identical texts). One exception to think about: the example "AZ 2024/12345" (F10).
- Length: only four texts are more than 1.4× the German length (see F13); none is a narrow button.
- Turkish uses the polite "siz" form everywhere — consistent.
- English has no du/Sie distinction, so it is automatically consistent.
- **Biggest issue is in the German reference, not in EN/TR:** the German itself mixes "Sie" and "du" (F1) and uses two names for one document (F2). Translations follow whatever German does, so these are worth settling first.
- 2 certain fixes applied; F1 and F2 **decided by Marçal on 2026-11-14** (see below); 10 suggestions open (F3–F12) plus 1 layout note (F13).

## Applied (certain)

| # | Key | Lang | Problem | Was | Now |
|---|---|---|---|---|---|
| C1 | `login.usernameHint` | EN | "Students" while the rest of the English texts say "pupil" (`portal.typeStudent`, `guardianHint`) | `Staff: email address · Students / Parents: serial number` | `Staff: email address · Pupils / Parents: serial number` |
| C2 | `portal.steps.uebergabe.title` | EN | Imperative "Receive iPad" reads like a button; the neighbouring steps are status labels ("iPad in use", "iPad returned"), as is the German "iPad erhalten" | `Receive iPad` | `iPad received` |

## Open questions (suggestions)

### Reference language (German) — decided 2026-11-14

**F1 → "Sie" everywhere. F2 → "Leihvertrag" is the one name for the contract.** Applied to the German texts, their HTML fallbacks, and the matching EN/TR texts (`Loan agreement` / `Ödünç sözleşmesi`); the admin labels in `views/ipad-detail.js` and the history note for new acceptances now say "Leihvertrag" too. Old `ipad_history` rows keep their original text ("Nutzungsbedingungen v1.0 akzeptiert"). The original findings are kept below for the record.

| # | Key(s) | Problem | Suggested action |
|---|---|---|---|
| F1 | `portal.sig.*Desc`, `portal.steps.*` (Sie) vs `portal.schaden.descPlaceholder`, `perpetratorPlaceholder`, `portal.verlust.circPlaceholder` and all `login.forgot*` / `newPassword*` / `resetLinkSent` / `passwordSaved` (du) | German mixes formal "Sie" and informal "du" in the same portal: the step cards address parents with Sie, the damage/loss forms address the pupil with du. Decide who the portal speaks to. | Either keep (parents = Sie, pupil forms = du, on purpose) or unify. EN/TR follow whatever is decided. |
| F2 | `portal.termsModalTitle`, `portal.termsAcceptBtn` ("Nutzungsbedingungen") vs `portal.steps.leihvertrag.*` ("Leihvertrag") | One document, two names: the step says "Leihvertrag öffnen", the pop-up that opens is titled "Nutzungsbedingungen" and the button says "Ich akzeptiere die Nutzungsbedingungen". Same split in EN ("Terms of Use" / "loan agreement") and TR ("Kullanım Koşulları" / "Ödünç sözleşmesi"). The terms text in the pop-up is still a placeholder. | When the real contract text is put in, use one name everywhere. |

### English

| # | Key(s) | Problem | Suggested wording |
|---|---|---|---|
| F3 | `portal.steps.uebergabe.download`, `portal.steps.rueckgabe.download` | "protocol" is the literal German "Protokoll"; for a hand-over/return document English usually says "record" or "form". Understandable, but unusual. | `Download handover record` / `Download return record` |
| F4 | `portal.steps.leihvertrag.*` | "loan agreement" alone suggests a money loan; Leihvertrag here is a loan of equipment. | `iPad loan agreement` (or keep as is) |
| F5 | `login.usernameHint`, `portal.typeStaff` | EN says "Staff", German and Turkish say "Lehrkräfte" / "Öğretmen" (teachers). "Staff" is broader. | `Teachers` / `Teacher` — only if the accounts really are teachers only. |
| F6 | many (`Report Damage`, `Type of Damage`, `Date of Incident`, `Police Report Number (if applicable)`, `Submit Report`, `Email or Serial Number` …) vs (`Last known location`, `Damage occurred on`, `Notes (optional)`, `New password`, `Send reset link` …) | Capitalisation is mixed: some labels in Title Case, others in sentence case. Same in Turkish (`Hasar Türü`, `Raporu Gönder` vs `Kaybın fark edildiği tarih`) and, for the same concept, `portal.sig.rueckgabeTitle` (`İadeyi Onayla`) vs `portal.steps.rueckgabe.activeTitle` (`İadeyi onayla`). | Pick one style (modern UI convention: sentence case) and apply to all keys of that language. |
| F7 | `portal.verlust.notitzenPlaceholder` | "Any additional information…" is a bit long for a placeholder. | `Additional notes…` |

### Turkish (non-native check — please verify)

| # | Key(s) | Problem | Suggested wording |
|---|---|---|---|
| F8 | `portal.steps.leihvertrag.*`, `portal.leihvertrag.*` ("Ödünç sözleşmesi") | In Turkish law "ödünç" covers both loan for use (*kullanım ödüncü*, the case here) and loan of consumables. The everyday word is understandable, but a legal reader may expect the precise term. | Keep `Ödünç sözleşmesi`, or `Kullanım ödüncü sözleşmesi`. Ask a native speaker / the school. |
| F9 | `portal.steps.uebergabe.waiting` | "teslimat" usually means delivery of goods (shipping), which sounds odd for a school handover. | `Okul teslim işlemini hazırlıyor. Burada yapmanız gereken bir şey yok.` |
| F10 | `portal.verlust.policePlaceholder` (EN and TR) | "AZ" is the German abbreviation for Aktenzeichen; English and Turkish readers will not know it. The parent has to enter the German police file number. | Example without the abbreviation, e.g. `e.g. 2024/12345`, or explain "(Aktenzeichen)" in the label. |
| F11 | `portal.schaden.datumEingetretenLabel`, `datumEntdecktLabel` | "Hasar oluşma tarihi" / "Fark edilme tarihi" are correct but nominal; the loss form uses the more natural "Kaybın fark edildiği tarih". | `Hasarın oluştuğu tarih` / `Hasarın fark edildiği tarih (farklıysa)` |
| F12 | `portal.steps.uebergabe.title` | "iPad'i teslim alma" (noun) next to "iPad kullanımda" and "iPad iade edildi" (statuses). | `iPad teslim alındı` for parallel wording with step 4. |

### Layout

| # | Key | Length | Comment |
|---|---|---|---|
| F13 | TR `portal.main.problem` (21 → 33), TR `portal.verlust.datumBemerktLabel` (18 → 26), TR `login.sendResetLink` (17 → 27), EN `portal.verlust.notitzenPlaceholder` (17 → 27) | > 1.4× German | All fit normal full-width labels/buttons; look at them once on a phone in the browser. |

## How to use this with the reviewer

1. Give the reviewer `translation-review.csv` (run `node export-translations.js` first so it is current) and, if useful, this file.
2. They fill only `comment_en` / `comment_tr`. Answers refer to the `key` column; `{placeholders}` must not change.
3. Apply the answers by hand in `translations.js` (and settle F1, F2 in German first). Then run `node check-translations.js` and `./bump-version.sh`.
