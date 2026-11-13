// CSV import — iPads, pupils and staff in one dialog.
// The admin chooses what to import, picks a CSV file, sees a preview, then confirms.
// Nothing is written until the preview has been confirmed.
//
// File formats (UTF-8, first line is the header, separator ';' or ',' is detected):
//   iPads:   serial_number;ipad_type;storage_capacity;status      (status optional, default 'available')
//   pupils:  first_name;last_name;address                         (address optional)
//   staff:   first_name;last_name;kuerzel                         (all required; the Kürzel is unique)
//
// Structure: Part 1 = pure functions (parser + validators, testable in Node),
//            Part 2 = one table of "kinds" describing each import,
//            Part 3 = the generic dialog / preview / import that works for every kind.

// ─── Part 1: pure functions (parser + validation, no DOM, no Supabase) ───

const IMPORT_TYPES    = ['student', 'staff'];
const IMPORT_STORAGES = ['64gb', '128gb', '256gb'];
// Only statuses that need no pupil/staff assignment — the import assigns nobody.
const IMPORT_STATUSES = [
  'available', 'prepared_for_repair', 'shipped_for_repair', 'back_from_repair',
  'to_be_erased', 'lost', 'stolen', 'decommissioned',
];

// Splits CSV text into an array of rows (arrays of strings).
// Handles a BOM, CRLF/LF line ends, quoted fields ("a;b", "" for a quote) and
// detects the separator from the first line.
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);          // strip BOM

  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiter = (firstLine.split(',').length > firstLine.split(';').length) ? ',' : ';';

  const rows = [];
  let row = [], field = '', inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }   // escaped quote
      else if (c === '"')                   { inQuotes = false; }
      else                                  { field += c; }
    } else if (c === '"')       { inQuotes = true; }
    else if (c === delimiter)   { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;                   // CRLF counts once
      row.push(field); field = '';
      rows.push(row); row = [];
    } else                      { field += c; }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }  // last line without line end

  // Drop completely empty lines (e.g. trailing blank lines from Excel).
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

// Turns parsed rows into validated iPad records.
// existingSerials: Set of upper-case serial numbers already in the database.
// Returns { fatal, valid, existing, duplicates, invalid } — fatal is a message when the
// header is unusable; the other lists hold { line, serial, reason? } (valid: + record).
function validateIpadRows(rows, existingSerials) {
  const result = { fatal: null, valid: [], existing: [], duplicates: [], invalid: [] };
  if (rows.length === 0) { result.fatal = 'Die Datei ist leer.'; return result; }

  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = name => header.indexOf(name);
  const missing = ['serial_number', 'ipad_type', 'storage_capacity'].filter(n => col(n) === -1);
  if (missing.length) {
    result.fatal = `Spalte(n) fehlen in der Kopfzeile: ${missing.join(', ')}`;
    return result;
  }
  const cell = (r, name) => (col(name) === -1 ? '' : (r[col(name)] ?? '')).trim();

  const seenInFile = new Set();
  rows.slice(1).forEach((r, idx) => {
    const line   = idx + 2;                               // file line number (header = line 1)
    const serial = cell(r, 'serial_number').toUpperCase();
    const type   = cell(r, 'ipad_type').toLowerCase();
    const storage = cell(r, 'storage_capacity').toLowerCase().replace(/\s+/g, '');
    const status = cell(r, 'status').toLowerCase() || 'available';

    if (!serial)                          return result.invalid.push({ line, serial, reason: 'Seriennummer fehlt' });
    if (!IMPORT_TYPES.includes(type))     return result.invalid.push({ line, serial, reason: `Unbekannter Typ „${cell(r, 'ipad_type')}“ (erlaubt: student, staff)` });
    if (!IMPORT_STORAGES.includes(storage)) return result.invalid.push({ line, serial, reason: `Unbekannter Speicher „${cell(r, 'storage_capacity')}“ (erlaubt: 64gb, 128gb, 256gb)` });
    if (!IMPORT_STATUSES.includes(status)) return result.invalid.push({ line, serial, reason: `Status „${cell(r, 'status')}“ nicht erlaubt` });

    if (seenInFile.has(serial))           return result.duplicates.push({ line, serial, reason: 'kommt in der Datei mehrfach vor' });
    seenInFile.add(serial);
    if (existingSerials.has(serial))      return result.existing.push({ line, serial, reason: 'existiert bereits' });

    result.valid.push({ line, serial, record: {
      serial_number: serial, ipad_type: type, storage_capacity: storage, status,
    }});
  });
  return result;
}

// ── Pupils / staff validators ──

// Checks the header line; returns { fatal } or { col } (col(name) = column index or -1).
function _csvHeader(rows, required) {
  if (rows.length === 0) return { fatal: 'Die Datei ist leer.' };
  const header = rows[0].map(h => h.trim().toLowerCase());
  const missing = required.filter(n => header.indexOf(n) === -1);
  if (missing.length) return { fatal: `Spalte(n) fehlen in der Kopfzeile: ${missing.join(', ')}` };
  return { col: name => header.indexOf(name) };
}

// Key that decides whether a pupil already exists: first name + last name + address,
// trimmed and lower case. An empty address is a value of its own.
function pupilKey(first, last, address) {
  return [first, last, address || ''].map(v => v.trim().toLowerCase()).join('\u0001');
}

// Pupil rows -> { fatal, valid, existing, duplicates, invalid }.
// existingKeys: Set of pupilKey() values of the pupils already in the database.
function validatePupilRows(rows, existingKeys) {
  const result = { fatal: null, valid: [], existing: [], duplicates: [], invalid: [] };
  const h = _csvHeader(rows, ['first_name', 'last_name']);
  if (h.fatal) { result.fatal = h.fatal; return result; }
  // The address column is optional, so a staff or iPad file would otherwise pass as a pupil file.
  const foreign = ['kuerzel', 'serial_number', 'ipad_type'].filter(n => h.col(n) !== -1);
  if (foreign.length) {
    result.fatal = `Diese Datei enthält die Spalte ${foreign.join(', ')} und gehört nicht zu den Schülern — bitte oben bei „Was importieren?“ die passende Auswahl treffen.`;
    return result;
  }
  const cell = (r, name) => (h.col(name) === -1 ? '' : (r[h.col(name)] ?? '')).trim();

  const seenInFile = new Set();
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2;                                  // header = line 1
    const first = cell(r, 'first_name'), last = cell(r, 'last_name'), address = cell(r, 'address');
    const label = `${last}, ${first}`;
    if (!first || !last) return result.invalid.push({ line, label, reason: 'Vor- oder Nachname fehlt' });

    const key = pupilKey(first, last, address);
    if (seenInFile.has(key))     return result.duplicates.push({ line, label, reason: 'kommt in der Datei mehrfach vor (gleicher Name und Adresse)' });
    seenInFile.add(key);
    if (existingKeys.has(key))   return result.existing.push({ line, label, reason: 'existiert bereits (gleicher Name und Adresse)' });

    result.valid.push({ line, label, record: { first_name: first, last_name: last, address: address || null } });
  });
  return result;
}

// Staff rows -> same result shape. The Kürzel identifies a teacher and must be unique
// (compared case-insensitively). existingKuerzel: Set of upper-case Kürzel in the database.
function validateStaffRows(rows, existingKuerzel) {
  const result = { fatal: null, valid: [], existing: [], duplicates: [], invalid: [] };
  const h = _csvHeader(rows, ['first_name', 'last_name', 'kuerzel']);
  if (h.fatal) { result.fatal = h.fatal; return result; }
  const cell = (r, name) => (r[h.col(name)] ?? '').trim();

  const seenInFile = new Set();
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2;
    const first = cell(r, 'first_name'), last = cell(r, 'last_name'), kuerzel = cell(r, 'kuerzel');
    const label = `${last}, ${first} (${kuerzel})`;
    if (!first || !last) return result.invalid.push({ line, label, reason: 'Vor- oder Nachname fehlt' });
    if (!kuerzel)        return result.invalid.push({ line, label, reason: 'Kürzel fehlt' });

    const key = kuerzel.toUpperCase();
    if (seenInFile.has(key))   return result.duplicates.push({ line, label, reason: `Kürzel ${kuerzel} kommt in der Datei mehrfach vor` });
    seenInFile.add(key);
    if (existingKuerzel.has(key)) return result.existing.push({ line, label, reason: `Kürzel ${kuerzel} ist bereits vergeben` });

    result.valid.push({ line, label, record: { first_name: first, last_name: last, kuerzel } });
  });
  return result;
}

// Make the pure functions testable from Node (no effect in the browser).
if (typeof module !== 'undefined') module.exports = { parseCsv, validateIpadRows, validatePupilRows, validateStaffRows, pupilKey };

// ─── Part 2: the kinds of import (browser only) ───
//
// Each kind describes one import: texts, template, how to load what exists, how to
// validate, how to write a chunk, and which list to refresh. Part 3 works for all of them.

// Loads every serial number from the database (paged: Supabase returns max 1000 rows per request).
async function _fetchAllSerials() {
  const { data, error } = await fetchAllRows(() =>
    supabase.from('ipads').select('serial_number').order('serial_number'));
  if (error) throw error;
  return new Set(data.map(r => r.serial_number.toUpperCase()));
}

const CSV_KINDS = {
  ipads: {
    label: 'iPads',
    view: 'ipads',
    columnLabel: 'Seriennummer',
    hint: `Kopfzeile <code>serial_number;ipad_type;storage_capacity;status</code>.
           Typ: student / staff · Speicher: 64gb / 128gb / 256gb ·
           Status ist optional (Standard: available).`,
    templateFile: 'ipad-import-vorlage.csv',
    template: 'serial_number;ipad_type;storage_capacity;status\n'
            + 'DMPEXAMPLE0001;student;128gb;\n'
            + 'DMPEXAMPLE0002;staff;64gb;decommissioned\n',
    fetchExisting: _fetchAllSerials,
    validate: validateIpadRows,
    // Inserts one chunk of records; also writes the first history row of every new iPad.
    async insertChunk(records) {
      const { data, error } = await supabase.from('ipads').insert(records).select('id, status');
      if (error) return { error };
      const { error: histError } = await supabase.from('ipad_history').insert(
        data.map(ipad => ({
          ipad_id: ipad.id, event_type: 'status_change', status: ipad.status,
          changed_by: _adminName(), changed_at: new Date().toISOString(),
          notes: 'iPad angelegt (CSV-Import)',
        })));
      if (histError) console.error('ipad_history insert failed:', histError);
      return { saved: data.length, historyFailed: histError ? data.length : 0 };
    },
  },

  pupils: {
    label: 'Schüler',
    view: 'pupils',
    columnLabel: 'Schüler',
    hint: `Kopfzeile <code>first_name;last_name;address</code>. Die Adresse ist optional.
           Als „bereits vorhanden“ gilt, wer mit Vorname, Nachname und Adresse übereinstimmt.`,
    templateFile: 'schueler-import-vorlage.csv',
    template: 'first_name;last_name;address\n'
            + 'Max;Mustermann;Musterstraße 1, 45768 Marl\n'
            + 'Erika;Beispiel;\n',
    async fetchExisting() {
      const { data, error } = await fetchAllRows(() => supabase
        .from('pupils').select('first_name, last_name, address').order('id'));
      if (error) throw error;
      return new Set(data.map(p => pupilKey(p.first_name, p.last_name, p.address)));
    },
    validate: validatePupilRows,
    async insertChunk(records) {
      const { data, error } = await supabase.from('pupils').insert(records).select('id');
      return error ? { error } : { saved: data.length, historyFailed: 0 };
    },
  },

  staff: {
    label: 'Lehrkräfte',
    view: 'staff',
    columnLabel: 'Lehrkraft',
    hint: `Kopfzeile <code>first_name;last_name;kuerzel</code>. Alle drei Spalten sind Pflicht.
           Das Kürzel ist eindeutig: ein bereits vergebenes Kürzel wird übersprungen.`,
    templateFile: 'lehrkraefte-import-vorlage.csv',
    template: 'first_name;last_name;kuerzel\n'
            + 'Anna;Beispiel;BEI\n'
            + 'Peter;Muster;MUS\n',
    async fetchExisting() {
      const { data, error } = await fetchAllRows(() => supabase
        .from('staff').select('kuerzel').order('id'));
      if (error) throw error;
      return new Set(data.filter(s => s.kuerzel).map(s => s.kuerzel.trim().toUpperCase()));
    },
    validate: validateStaffRows,
    async insertChunk(records) {
      const { data, error } = await supabase.from('staff').insert(records).select('id');
      return error ? { error } : { saved: data.length, historyFailed: 0 };
    },
  },
};

// ─── Part 3: dialog, preview and import (works for every kind) ───

const IMPORT_CHUNK_SIZE = 200;
let _importKind = 'ipads';    // key of CSV_KINDS currently selected in the dialog
let _importPlan = null;       // validation result of the file currently previewed

// Opens the import dialog with the given kind preselected.
function openCsvImportModal(kind = 'ipads') {
  _importKind = CSV_KINDS[kind] ? kind : 'ipads';
  _importPlan = null;
  _openModal('Aus CSV importieren', `
    <div class="admin-form-group">
      <label>Was importieren?</label>
      <select id="import-kind" onchange="setCsvImportKind(this.value)">
        ${Object.entries(CSV_KINDS).map(([key, k]) =>
          `<option value="${key}" ${key === _importKind ? 'selected' : ''}>${k.label}</option>`).join('')}
      </select>
    </div>
    <div id="import-hint"></div>
    <div class="admin-form-group">
      <label>CSV-Datei</label>
      <input type="file" id="import-file" accept=".csv,text/csv,text/plain"
             onchange="previewCsvImport(this.files[0])">
    </div>
    <div id="import-preview"></div>
  `, 'Importieren', runCsvImport);
  _renderImportHint();
  document.getElementById('admin-modal-submit').disabled = true;   // nothing to import yet
}

// Shows the format hint and the template link of the selected kind.
function _renderImportHint() {
  document.getElementById('import-hint').innerHTML = `
    <p class="field-hint">CSV-Datei (UTF-8) mit der ${CSV_KINDS[_importKind].hint}</p>
    <p><a href="#" onclick="downloadCsvTemplate(); return false;">Vorlage herunterladen</a></p>`;
}

// The admin changed the kind: forget the file and the preview, show the new hint.
function setCsvImportKind(kind) {
  _importKind = kind;
  _importPlan = null;
  document.getElementById('import-file').value = '';
  document.getElementById('import-preview').innerHTML = '';
  const btn = document.getElementById('admin-modal-submit');
  btn.disabled = true;
  btn.textContent = 'Importieren';
  _renderImportHint();
}

// Creates a small template file in the browser (no extra file in the repo).
function downloadCsvTemplate() {
  const kind = CSV_KINDS[_importKind];
  const url = URL.createObjectURL(new Blob(['\uFEFF' + kind.template], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = kind.templateFile;
  a.click();
  URL.revokeObjectURL(url);
}

// Step 2: read the file, validate it and show the preview. Writes nothing.
async function previewCsvImport(file) {
  const kind = CSV_KINDS[_importKind];
  const box  = document.getElementById('import-preview');
  const btn  = document.getElementById('admin-modal-submit');
  _importPlan = null;
  btn.disabled = true;
  btn.textContent = 'Importieren';
  if (!file) { box.innerHTML = ''; return; }

  box.innerHTML = '<p class="loading-msg">Datei wird geprüft…</p>';
  try {
    const text = await file.text();
    const existing = await kind.fetchExisting();
    // The admin may have switched the kind while we were loading: drop this result then.
    if (CSV_KINDS[_importKind] !== kind) return;
    const plan = kind.validate(parseCsv(text), existing);

    if (plan.fatal) { box.innerHTML = `<p class="error-inline">${_htmlEsc(plan.fatal)}</p>`; return; }

    _importPlan = plan;
    const problems = [
      ...plan.invalid.map(p => ({ ...p, kind: 'ungültig' })),
      ...plan.duplicates.map(p => ({ ...p, kind: 'doppelt' })),
      ...plan.existing.map(p => ({ ...p, kind: 'vorhanden' })),
    ].sort((a, b) => a.line - b.line);
    const shown = problems.slice(0, 50);

    box.innerHTML = `
      <p><strong>${plan.valid.length}</strong> neu ·
         ${plan.existing.length} bereits vorhanden ·
         ${plan.duplicates.length} doppelt in der Datei ·
         ${plan.invalid.length} ungültig</p>
      ${shown.length ? `
        <div class="table-wrap"><table class="data-table"><thead>
          <tr><th>Zeile</th><th>${_htmlEsc(kind.columnLabel)}</th><th>Problem</th></tr></thead><tbody>
          ${shown.map(p => `<tr><td>${p.line}</td><td>${_htmlEsc(p.label ?? p.serial)}</td>
                            <td>${_htmlEsc(p.kind)}: ${_htmlEsc(p.reason)}</td></tr>`).join('')}
        </tbody></table></div>
        ${problems.length > shown.length ? `<p class="field-hint">… und ${problems.length - shown.length} weitere</p>` : ''}
      ` : ''}
    `;
    btn.textContent = `${plan.valid.length} ${kind.label} importieren`;
    btn.disabled = plan.valid.length === 0;
  } catch (e) {
    box.innerHTML = `<p class="error-inline">Fehler beim Prüfen: ${_htmlEsc(e.message || String(e))}</p>`;
  }
}

// Step 3: write the valid rows in chunks.
async function runCsvImport() {
  if (!_importPlan || _importPlan.valid.length === 0) return;
  const kind = CSV_KINDS[_importKind];
  const plan = _importPlan;
  const btn  = document.getElementById('admin-modal-submit');
  const box  = document.getElementById('import-preview');
  document.getElementById('import-file').disabled = true;
  document.getElementById('import-kind').disabled = true;
  btn.disabled = true;

  let saved = 0, historyFailed = 0, failure = null;

  for (let i = 0; i < plan.valid.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = plan.valid.slice(i, i + IMPORT_CHUNK_SIZE);
    btn.textContent = `Importiere… ${saved} / ${plan.valid.length}`;

    const res = await kind.insertChunk(chunk.map(r => r.record));
    if (res.error) { failure = res.error; break; }   // stop here; a re-run skips what is saved
    saved += res.saved;
    historyFailed += res.historyFailed;
  }

  if (failure) {
    box.innerHTML = `<p class="error-inline">Fehler nach ${saved} gespeicherten Datensätzen: ${_htmlEsc(failure.message)}<br>
      Die Datei kann erneut importiert werden — bereits vorhandene Einträge werden übersprungen.</p>`;
  } else {
    box.innerHTML = `
      <p><strong>${saved} ${_htmlEsc(kind.label)} importiert.</strong></p>
      <p>${plan.existing.length} bereits vorhanden und übersprungen · ${plan.duplicates.length} doppelt in der Datei · ${plan.invalid.length} ungültig</p>
      ${historyFailed ? `<p class="error-inline">Für ${historyFailed} iPads konnte der Verlaufseintrag nicht geschrieben werden (siehe Konsole).</p>` : ''}
    `;
  }
  btn.textContent = 'Schließen';
  btn.disabled = false;
  btn.onclick = closeAdminModal;
  _importPlan = null;

  // Refresh the list behind the dialog — only if it is the one currently shown.
  if (window.location.hash.slice(1) === kind.view) VIEW_RENDERERS[kind.view]();
}
