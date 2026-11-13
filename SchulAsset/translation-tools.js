// translation-tools.js — shared helpers for the translation scripts
// (check-translations.js and export-translations.js).
//
// Node only; not loaded by the website.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT  = __dirname;
const LANGS = ['de', 'en', 'tr'];

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

// ---- Keys used by the code ----
// Returns { used: Map(key -> Set(files)), dynamic: [{file, line, text}] }.
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
    // The scripts themselves and the translations file only mention keys as examples.
    if (['check-translations.js', 'export-translations.js', 'translation-tools.js', 'translations.js'].includes(file)) continue;
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');

    for (const m of text.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) add(m[1], file);
    // t('key') and tf('key', { ... }) — tf() is t() with {placeholder} values.
    for (const m of text.matchAll(/\btf?\(\s*(['"`])([^'"`$]+)\1\s*[,)]/g)) add(m[2], file);

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

module.exports = { ROOT, LANGS, loadTranslations, flatten, scanUsedKeys };
