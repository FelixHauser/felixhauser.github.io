## Context

The portal main screen was redesigned into a four-step timeline (`_buildSteps` builds step objects with German literals; `_renderStep` renders them). Older keys such as `portal.greeting`, `portal.statuses.*`, `portal.uebergabe.*` belong to the previous layout. `renderPortal()` already calls `applyTranslations()` at the end, but that only fills `data-i18n` elements, not strings built in JS. The language buttons call `setLang()`, which does not re-run `renderPortal()`.

## Goals / Non-Goals

**Goals:**
- Every visible text of the main screen goes through `t()`; German output stays exactly as today.
- No unused portal keys remain (check script clean).

**Non-Goals:**
- Translating the Leihvertrag text or PDFs.
- Translating `ipad_history` notes.
- Reviewing EN/TR quality (native speaker, separate TODO item).

## Decisions

- **New key group `portal.steps.*`** for the timeline (title/subtitle/button per step state), plus `portal.main.*` for greeting, details button and emergency block. Reusing the old `portal.uebergabe.*` keys would force the new design to fit old wording; the old unused keys are deleted instead. Alternative (keep old keys "just in case") was rejected: the check script would keep warning.
- **Parameters:** texts with a date or name use a placeholder, e.g. `'Bestätigt am {date}'`, replaced with a tiny helper `tf(key, {date})` next to `t()` in `translations.js`. `check-translations.js` already verifies that placeholders match across languages.
- **Date format by language:** `formatDate` maps `currentLang` to a locale (`de` → `de-DE`, `en` → `en-GB`, `tr` → `tr-TR`).
- **Re-render on language switch:** `setLang()` calls a global `onLangChange` hook if defined; `portal.js` defines it to re-run `renderPortal(_termsRow)` once the iPad is loaded. Alternative (reloading the page) would lose an open modal's input.
- **Status labels** for the info pop-up come from the existing `portal.statuses.*` keys if the screen shows them; if not shown, those keys are deleted.
- **iPad type** ("Schüler/in" / "Lehrkraft") uses the existing `portal.typeStudent` / `portal.typeStaff` keys.

## Risks / Trade-offs

- Machine-quality EN/TR wording for new strings → flagged for native review (TODO item stays open).
- Longer Turkish/English texts may break the layout of buttons → check each language visually on a phone width.
- Removing old keys could hide a use I missed → run `check-translations.js` and grep before deleting.
