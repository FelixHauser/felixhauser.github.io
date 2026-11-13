// Person picker — choose a pupil or staff member by searching instead of from a long drop-down.
//
// Usage:  createPersonPicker('container-id', { items, onSelect })
//   items    = [{ id, label: 'Müller, Anna', sub: 'Hauptstr. 1' }]   (sub is optional)
//   onSelect = function(item|null)  — called when a person is selected / the selection is cleared
// The selected id is also kept in <input type="hidden" id="md-person"> so the surrounding
// dialog can read it like it read the old <select>.
//
// Part 1 = pure search functions (testable in Node), Part 2 = the DOM component.

// ─── Part 1: search ───

const PICKER_MAX_RESULTS = 20;

// Lower case, umlauts/accents removed (ü→u, é→e), ß→ss — so "muller" finds "Müller".
function normalizeSearch(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim();
}

// Returns the items that match the query. Every word of the query must appear somewhere in
// "label + sub", in any order ("anna müller" = "Müller, Anna"). Empty query = no results.
function filterPeople(items, query) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return items.filter(item => {
    const haystack = normalizeSearch(`${item.label} ${item.sub || ''}`);
    return words.every(w => haystack.includes(w));
  });
}

if (typeof module !== 'undefined') module.exports = { normalizeSearch, filterPeople };

// ─── Part 2: the component (browser only) ───

function createPersonPicker(rootId, { items, onSelect }) {
  const root = document.getElementById(rootId);
  if (!root) return;

  root.innerHTML = `
    <input type="hidden" id="md-person" value="">
    <div class="picker-search">
      <input type="text" class="picker-query" placeholder="Name eintippen…"
             autocomplete="off" spellcheck="false">
      <div class="picker-results" role="listbox"></div>
    </div>
    <div class="picker-chip" hidden>
      <span class="picker-chip-text"></span>
      <button type="button" class="btn-link picker-change">Ändern</button>
    </div>
  `;

  const hidden  = root.querySelector('#md-person');
  const search  = root.querySelector('.picker-search');
  const query   = root.querySelector('.picker-query');
  const results = root.querySelector('.picker-results');
  const chip    = root.querySelector('.picker-chip');
  const chipTxt = root.querySelector('.picker-chip-text');
  let current = [];                       // items currently listed

  // Shows the matches for the current query.
  function renderResults() {
    if (!query.value.trim()) {
      current = [];
      results.innerHTML = `<p class="picker-hint">Namen eintippen, um zu suchen…</p>`;
      return;
    }
    const matches = filterPeople(items, query.value);
    current = matches.slice(0, PICKER_MAX_RESULTS);
    if (matches.length === 0) {
      results.innerHTML = `<p class="picker-hint">Keine Treffer.</p>`;
      return;
    }
    results.innerHTML = current.map(item => `
      <button type="button" class="picker-item" role="option" data-id="${_htmlEsc(item.id)}">
        <span>${_htmlEsc(item.label)}</span>
        ${item.sub ? `<span class="picker-sub">${_htmlEsc(item.sub)}</span>` : ''}
      </button>`).join('') +
      (matches.length > current.length
        ? `<p class="picker-hint">… ${matches.length - current.length} weitere — Suche eingrenzen</p>` : '');
  }

  function select(item) {
    hidden.value = item.id;
    chipTxt.textContent = item.sub ? `${item.label} · ${item.sub}` : item.label;
    search.hidden = true;
    chip.hidden = false;
    if (onSelect) onSelect(item);
  }

  function clearSelection() {
    hidden.value = '';
    chip.hidden = true;
    search.hidden = false;
    query.value = '';
    renderResults();
    query.focus();
    if (onSelect) onSelect(null);
  }

  query.addEventListener('input', renderResults);
  query.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); if (current[0]) select(current[0]); }
    if (e.key === 'Escape') { query.value = ''; renderResults(); }
  });
  results.addEventListener('click', e => {
    const btn = e.target.closest('.picker-item');
    if (!btn) return;
    const item = items.find(i => String(i.id) === btn.dataset.id);
    if (item) select(item);
  });
  root.querySelector('.picker-change').addEventListener('click', clearSelection);

  renderResults();
  query.focus();
}
