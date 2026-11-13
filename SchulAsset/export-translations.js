// export-translations.js — writes a review sheet of all DE / EN / TR texts.
//
// Usage (from the SchulAsset folder):   node export-translations.js
//
// Output: translation-review.csv (not committed, see .gitignore)
//   Columns: key; screen; de; en; tr; comment_en; comment_tr
//   - key        the translation key, e.g. portal.steps.uebergabe.confirm (the anchor for applying answers)
//   - screen     where the text appears: the key's group plus the file(s) that use it
//   - de/en/tr   the texts; {name}-style placeholders must stay exactly as they are
//   - comment_*  empty, for the native speaker to fill in
//
// The file is UTF-8 with a BOM and uses ";" as separator, so Excel and Numbers open it correctly
// (umlauts, Turkish letters). Run it again after every change to the texts.

const fs   = require('fs');
const path = require('path');
const { ROOT, LANGS, loadTranslations, flatten, scanUsedKeys } = require('./translation-tools');

const OUTPUT_FILE = path.join(ROOT, 'translation-review.csv');
const SEPARATOR   = ';';
const BOM         = '﻿';

// Wraps a cell in quotes when it contains the separator, a quote or a line break.
function csvCell(value) {
  const text = String(value ?? '');
  return /[;"\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

const translations = loadTranslations();
const flat = {};
for (const lang of LANGS) flat[lang] = flatten(translations[lang] || {});

const { used } = scanUsedKeys();

// One row per German key, sorted by key (this also groups the rows by screen: login.*, portal.* …).
const keys = Object.keys(flat.de).sort();

const rows = [['key', 'screen', 'de', 'en', 'tr', 'comment_en', 'comment_tr']];
for (const key of keys) {
  const group = key.split('.')[0];
  const files = used.has(key) ? [...used.get(key)].sort().join(', ') : 'not used by the code';
  rows.push([key, `${group} (${files})`, flat.de[key], flat.en[key] ?? '', flat.tr[key] ?? '', '', '']);
}

const csv = BOM + rows.map(row => row.map(csvCell).join(SEPARATOR)).join('\r\n') + '\r\n';
fs.writeFileSync(OUTPUT_FILE, csv, 'utf8');

console.log(`Wrote ${rows.length - 1} rows to ${path.basename(OUTPUT_FILE)}`);
console.log('Reviewer: fill only comment_en / comment_tr; keep {placeholders} unchanged.');
