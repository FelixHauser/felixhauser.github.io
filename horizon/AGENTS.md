# AGENTS.md — Klassenarbeit planen

## Project

Single-file browser app (`index.html`) for German teachers to plan exam ("Klassenarbeit") point distributions. Pure client-side HTML/CSS/JS — no build step, no dependencies, no server.

## Quick start

Open `index.html` in any modern browser. No installation, no `npm install`, no dev server.

## Testing

Internal functions are exposed via `window.__plannerTest` (line 673). To test in a browser console or headless runner:

```js
// Exports: largestRemainder, calculateDistribution, solveTotal,
//          gradeRows, getMaxAllowed, normalizeCourse,
//          isSpecialSchema, mainWeights
const t = window.__plannerTest;
t.calculateDistribution(7, 'GK', 50);
t.solveTotal(7, 'GK', 'total', 50);
t.gradeRows(50);
```

No test framework, no test file. All logic lives in one IIFE.

## Key facts

- German-language UI — use German terms when searching or referencing features.
- Two schema modes: **Standardschema** (default) and **Sonderschema** for Jahrgang 9/10 EK.
- Course selection (`GK`/`EK`) is disabled for Jahrgang ≤ 6.
- Print/PDF via built-in "Drucken / PDF sichern" button (calls `window.print()`).
- The `specSelect` dropdown lets users constrain by total points or by a specific competency (K1/K2/K3); the solver finds the best matching total.
- Point range: 0–150.
- Grade boundaries are hardcoded in `GRADE_LIMITS` using fixed percentage thresholds (sehr gut ≥ 87%, …).
- Distribution uses largest-remainder method (Hare quota) to split points proportionally.
- Only `index.html` exists — no config, no CI, no other files.
