// check-translations.js — checks that the DE / EN / TR translations are complete.
//
// Usage (from the SchulAsset folder):   node check-translations.js
//
// Errors (exit code 1):
//   - a key exists in German but is missing in English or Turkish (or the reverse)
//   - a translation is empty
//   - placeholders such as {name} differ between languages
//   - a key is used in an .html/.js file but not defined in German
// Warnings (exit code stays 0):
//   - a key is defined but never used
//   - t(...) is called with a computed key, which cannot be checked
//
// German is the reference language. Translation QUALITY needs a native speaker.

const { LANGS, loadTranslations, flatten, scanUsedKeys } = require('./translation-tools');

const REFERENCE = 'de';

// {name}-style placeholders of a text, sorted, as a comparable string.
function placeholders(text) {
  return (String(text).match(/\{[^}]+\}/g) || []).sort().join(' ');
}

// ---- Run the checks ----
const TR = loadTranslations();
const flat = {};
for (const lang of LANGS) flat[lang] = flatten(TR[lang] || {});

const errors   = [];
const warnings = [];

// 1) Same keys in every language, 2) no empty texts, 3) same placeholders.
for (const lang of LANGS) {
  if (lang === REFERENCE) continue;
  for (const key of Object.keys(flat[REFERENCE])) {
    if (!(key in flat[lang])) errors.push(`[${lang}] missing key: ${key}`);
  }
  for (const key of Object.keys(flat[lang])) {
    if (!(key in flat[REFERENCE])) errors.push(`[${lang}] key not in ${REFERENCE}: ${key}`);
  }
}
for (const lang of LANGS) {
  for (const [key, value] of Object.entries(flat[lang])) {
    if (String(value).trim() === '') errors.push(`[${lang}] empty text: ${key}`);
  }
}
for (const lang of LANGS) {
  if (lang === REFERENCE) continue;
  for (const [key, value] of Object.entries(flat[lang])) {
    if (key in flat[REFERENCE] && placeholders(value) !== placeholders(flat[REFERENCE][key])) {
      errors.push(`[${lang}] placeholders differ from ${REFERENCE}: ${key}`);
    }
  }
}

// 4) Keys used in the code must exist in German; unused definitions are only a hint.
const { used, dynamic } = scanUsedKeys();
for (const [key, files] of used) {
  if (!(key in flat[REFERENCE])) errors.push(`key used but not defined in ${REFERENCE}: ${key}  (${[...files].join(', ')})`);
}
// A key counts as used when it is used itself or when it is a parent path of a used key.
for (const key of Object.keys(flat[REFERENCE])) {
  if (!used.has(key)) warnings.push(`defined but never used: ${key}`);
}
for (const d of dynamic) {
  warnings.push(`computed key cannot be checked: ${d.file}:${d.line}  ${d.text}`);
}

// ---- Report ----
const counts = LANGS.map(l => `${l}: ${Object.keys(flat[l]).length}`).join(', ');
console.log(`Keys per language — ${counts}; keys used in code: ${used.size}`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach(w => console.log('  ! ' + w));
}
if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.log('  x ' + e));
  process.exit(1);
}
console.log('\nOK — all languages complete, every used key is defined.');
