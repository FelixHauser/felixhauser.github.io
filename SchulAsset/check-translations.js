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

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT      = __dirname;
const LANGS     = ['de', 'en', 'tr'];
const REFERENCE = 'de';

// ---- Load TRANSLATIONS without touching translations.js ----
// The file uses localStorage/document at load time, so it runs in a small sandbox with stubs.
function loadTranslations() {
  const code = fs.readFileSync(path.join(ROOT, 'translations.js'), 'utf8')
    // `const` declarations are not visible on the sandbox object; expose the one we need.
    + '\n;this.__T = TRANSLATIONS;';
  const sandbox = {
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { querySelectorAll: () => [], documentElement: {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.__T;
}

// Turns a nested object into { 'portal.greeting': 'Hallo,', ... }.
function flatten(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? prefix + '.' + key : key;
    if (value !== null && typeof value === 'object') flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

// {name}-style placeholders of a text, sorted, as a comparable string.
function placeholders(text) {
  return (String(text).match(/\{[^}]+\}/g) || []).sort().join(' ');
}

// ---- Keys used by the code ----
// Returns { used: Map(key -> [files]), dynamic: [{file, line}] }.
function scanUsedKeys() {
  const used = new Map();
  const dynamic = [];
  const add = (key, file) => {
    if (!used.has(key)) used.set(key, new Set());
    used.get(key).add(file);
  };

  const files = fs.readdirSync(ROOT).filter(f => /\.(html|js)$/.test(f))
    .concat(fs.existsSync(path.join(ROOT, 'views'))
      ? fs.readdirSync(path.join(ROOT, 'views')).filter(f => f.endsWith('.js')).map(f => 'views/' + f)
      : []);

  for (const file of files) {
    // The checker itself and the translations file only mention keys as examples.
    if (file === 'check-translations.js' || file === 'translations.js') continue;
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');

    for (const m of text.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) add(m[1], file);
    for (const m of text.matchAll(/\bt\(\s*(['"`])([^'"`$]+)\1\s*\)/g))      add(m[2], file);

    // t( with something other than a plain string literal (e.g. 'a.' + x or a template with ${}).
    text.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/(?<![\w.$])t\(\s*([^)]*)/g)) {
        const arg = m[1].trim();
        if (arg === '') continue;
        const literal = /^(['"`])[^'"`$]*\1\s*$/.test(arg) || /^(['"`])[^'"`$]*\1\s*\)/.test(m[0] + ')');
        if (!literal && /^[A-Za-z_'"`]/.test(arg) && !/^(['"`])[^'"`$]*\1$/.test(arg)) {
          dynamic.push({ file, line: i + 1, text: line.trim().slice(0, 80) });
        }
      }
    });
  }
  return { used, dynamic };
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
