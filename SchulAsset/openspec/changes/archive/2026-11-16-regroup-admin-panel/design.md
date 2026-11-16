## Context

`ADMIN_PANEL_SECTIONS` in `views/admin-panel.js` is a list of `{ title, render, after }`; `_panelRow(label, onclick)` draws one row (iOS-style grouped list, `.action-group-rows`, `.action-row`). Today "Daten hinzufügen" has 8 rows and "Daten exportieren" 3, mixing three subjects. `csv-export.js` writes progress into one element `#export-status`.

## Goals / Non-Goals

**Goals:**
- Scan by subject: one section each for Schüler, Lehrkräfte, iPads, same order of actions in each.
- Keep the existing look (grouped rows) and the "add a feature = add an entry" pattern.

**Non-Goals:**
- No new features, dialogs or database changes.
- No tabs, no sub-pages, no collapsible sections (about 4 rows per section is short enough).
- No change to Zugänge, Schule, Systemprüfung.

## Decisions

**1. Sections by subject, actions in a fixed order.** Schüler: Neuer Schüler · Aus CSV importieren · Status aus CSV aktualisieren · Als CSV exportieren. Lehrkräfte: the same four. iPads: Neues iPad · Aus CSV importieren · Als CSV exportieren (iPads have no active status). Alternative (keep sections by action, add sub-headings per subject) rejected: it keeps the same long lists and the same scanning problem.

**2. Row = label + description.** `_panelRow(label, onclick, description)` renders the description as a second, smaller line. Texts are short and say what happens: e.g. "Status aus CSV aktualisieren — ehemalige Schüler als „nicht aktiv“ markieren"; "Als CSV exportieren — alle Schüler als Datei, auch ehemalige". Alternative (tooltips) rejected: not available on iPad/touch.

**3. Section title with icon.** Lucide icons (the same as in the sidebar: `users` Schüler, `user-check` Lehrkräfte, `tablet` iPads). Icons are created after render with `window.lucide?.createIcons()` (guarded, the app starts without Lucide). Alternative: emoji — rejected, inconsistent with the rest of the UI.

**4. Export result line per section.** `#export-status` becomes `#export-status-<kind>` (pupils / staff / ipads) inside the section; `_exportStatus(kind, text, isError)` writes there. The privacy note ("enthalten personenbezogene Daten") is repeated as one short sentence under the export row of each section, because each section should be readable on its own.

**5. Order of the sections:** Schüler, Lehrkräfte, iPads, Zugänge, Schule, Systemprüfung (daily work first, setup and checks last).

## Risks / Trade-offs

- [The same words repeat in three sections ("Aus CSV importieren")] → intended, the section title gives the context; the dialog titles keep the subject.
- [Longer page because of descriptions] → about 10 more lines of text; acceptable, and the rows stay one tap each.
- [Specs name old sections] → the delta specs update the section names.
