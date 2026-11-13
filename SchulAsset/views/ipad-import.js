// iPad CSV import — read a CSV file, show a preview, then create the new iPads.
//
// File format (UTF-8, first line is the header):
//   serial_number;ipad_type;storage_capacity;status
//   DMPXYZ123456;student;128gb;
//   DMPABC654321;staff;64gb;decommissioned
// - separator: ';' or ',' (detected from the header line)
// - ipad_type: student | staff
// - storage_capacity: 64gb | 128gb | 256gb  ("128 GB" also works)
// - status (optional column / optional cell): default 'available'
//
// Nothing is written until the admin has seen the preview and confirmed.

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

// Make the pure functions testable from Node (no effect in the browser).
if (typeof module !== 'undefined') module.exports = { parseCsv, validateIpadRows };

// ─── Part 2: dialog, preview and import (browser only) ───

const IMPORT_CHUNK_SIZE = 200;
let _importPlan = null;       // result of validateIpadRows for the file currently previewed

// Opens the import dialog (step 1: choose a file).
function openIpadImportModal() {
  _importPlan = null;
  _openModal('iPads aus CSV importieren', `
    <p class="field-hint">
      CSV-Datei (UTF-8) mit der Kopfzeile
      <code>serial_number;ipad_type;storage_capacity;status</code>.
      Typ: student / staff · Speicher: 64gb / 128gb / 256gb ·
      Status ist optional (Standard: available).
    </p>
    <p><a href="#" onclick="downloadIpadCsvTemplate(); return false;">Vorlage herunterladen</a></p>
    <div class="admin-form-group">
      <label>CSV-Datei</label>
      <input type="file" id="import-file" accept=".csv,text/csv,text/plain"
             onchange="previewIpadImport(this.files[0])">
    </div>
    <div id="import-preview"></div>
  `, 'Importieren', runIpadImport);
  document.getElementById('admin-modal-submit').disabled = true;   // nothing to import yet
}

// Creates a small template file in the browser (no extra file in the repo).
function downloadIpadCsvTemplate() {
  const csv = '﻿serial_number;ipad_type;storage_capacity;status\n'
            + 'DMPEXAMPLE0001;student;128gb;\n'
            + 'DMPEXAMPLE0002;staff;64gb;decommissioned\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'ipad-import-vorlage.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Loads every serial number from the database, 1000 per request (Supabase returns at most
// 1000 rows per request), as an upper-case Set.
async function _fetchAllSerials() {
  const serials = new Set();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('ipads').select('serial_number')
      .order('serial_number').range(from, from + pageSize - 1);
    if (error) throw error;
    data.forEach(r => serials.add(r.serial_number.toUpperCase()));
    if (data.length < pageSize) break;
  }
  return serials;
}

// Step 2: read the file, validate it and show the preview. Writes nothing.
async function previewIpadImport(file) {
  const box = document.getElementById('import-preview');
  const btn = document.getElementById('admin-modal-submit');
  _importPlan = null;
  btn.disabled = true;
  btn.textContent = 'Importieren';
  if (!file) { box.innerHTML = ''; return; }

  box.innerHTML = '<p class="loading-msg">Datei wird geprüft…</p>';
  try {
    const text = await file.text();
    const existing = await _fetchAllSerials();
    const plan = validateIpadRows(parseCsv(text), existing);

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
          <tr><th>Zeile</th><th>Seriennummer</th><th>Problem</th></tr></thead><tbody>
          ${shown.map(p => `<tr><td>${p.line}</td><td>${_htmlEsc(p.serial)}</td>
                            <td>${_htmlEsc(p.kind)}: ${_htmlEsc(p.reason)}</td></tr>`).join('')}
        </tbody></table></div>
        ${problems.length > shown.length ? `<p class="field-hint">… und ${problems.length - shown.length} weitere</p>` : ''}
      ` : ''}
    `;
    btn.textContent = `${plan.valid.length} iPads importieren`;
    btn.disabled = plan.valid.length === 0;
  } catch (e) {
    box.innerHTML = `<p class="error-inline">Fehler beim Prüfen: ${_htmlEsc(e.message || String(e))}</p>`;
  }
}

// Step 3: write the valid rows in chunks (iPads first, then their history rows).
async function runIpadImport() {
  if (!_importPlan || _importPlan.valid.length === 0) return;
  const plan = _importPlan;
  const btn  = document.getElementById('admin-modal-submit');
  const box  = document.getElementById('import-preview');
  document.getElementById('import-file').disabled = true;
  btn.disabled = true;

  const admin = _adminName();
  let saved = 0, historyFailed = 0;

  for (let i = 0; i < plan.valid.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = plan.valid.slice(i, i + IMPORT_CHUNK_SIZE);
    btn.textContent = `Importiere… ${saved} / ${plan.valid.length}`;

    const { data, error } = await supabase
      .from('ipads').insert(chunk.map(r => r.record)).select('id, status');

    if (error) {
      // Stop here. A re-run skips what is already saved.
      box.innerHTML = `<p class="error-inline">Fehler nach ${saved} gespeicherten iPads: ${_htmlEsc(error.message)}<br>
        Die Datei kann erneut importiert werden — bereits vorhandene iPads werden übersprungen.</p>`;
      btn.textContent = 'Schließen';
      btn.disabled = false;
      btn.onclick = closeAdminModal;
      renderIpadList();
      return;
    }
    saved += data.length;

    // History is append-only; one "created" row per new iPad.
    const now = new Date().toISOString();
    const { error: histError } = await supabase.from('ipad_history').insert(
      data.map(ipad => ({
        ipad_id: ipad.id, event_type: 'status_change', status: ipad.status,
        changed_by: admin, changed_at: now, notes: 'iPad angelegt (CSV-Import)',
      })));
    if (histError) { console.error('ipad_history insert failed:', histError); historyFailed += data.length; }
  }

  box.innerHTML = `
    <p><strong>${saved} iPads importiert.</strong></p>
    <p>${plan.existing.length} bereits vorhanden und übersprungen · ${plan.duplicates.length} doppelt in der Datei · ${plan.invalid.length} ungültig</p>
    ${historyFailed ? `<p class="error-inline">Für ${historyFailed} iPads konnte der Verlaufseintrag nicht geschrieben werden (siehe Konsole).</p>` : ''}
  `;
  btn.textContent = 'Schließen';
  btn.disabled = false;
  btn.onclick = closeAdminModal;
  _importPlan = null;
  renderIpadList();      // refresh the list behind the dialog
}
