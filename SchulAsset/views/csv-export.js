// CSV export — download all pupils, all staff or all iPads as a CSV file.
//
// Pupil and staff files use the same columns as the status update ("Status … aus CSV
// aktualisieren"), so an exported file can be edited in Excel and imported again.
// Nothing secret is exported: no login e-mails, passwords, signatures, IP addresses, history.
//
// Structure: Part 1 = pure functions (cell + file building, testable in Node),
//            Part 2 = loading all rows and downloading (browser only).

// ─── Part 1: pure functions ───

// One cell: quoted when it contains ; " or a line break, and made harmless for
// spreadsheets (a text starting with = + - @ tab or CR would otherwise run as a formula).
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[;"\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

// Builds the file text. columns = ['a', 'b']; rows = [{ a: …, b: … }, …].
// Lines end with \r\n; the BOM is added when the file is saved.
function buildCsv(columns, rows) {
  const lines = [columns.join(';'),
    ...rows.map(r => columns.map(c => csvCell(r[c])).join(';'))];
  return lines.join('\r\n') + '\r\n';
}

// Make the pure functions testable from Node (no effect in the browser).
if (typeof module !== 'undefined') module.exports = { csvCell, buildCsv };

// ─── Part 2: loading and downloading (browser only) ───

const PUPIL_EXPORT_COLUMNS = ['first_name', 'last_name', 'address', 'is_active', 'inactive_since'];
const STAFF_EXPORT_COLUMNS = ['kuerzel', 'first_name', 'last_name', 'is_active', 'inactive_since'];
const IPAD_EXPORT_COLUMNS  = ['serial_number', 'ipad_type', 'storage_capacity', 'status', 'assigned_to'];

// Saves a text as a UTF-8 file with BOM (so Excel shows umlauts correctly).
function _downloadCsv(filename, text) {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Shows progress / result next to the export entries in the admin panel.
function _exportStatus(text, isError = false) {
  const el = document.getElementById('export-status');
  if (!el) return;
  el.textContent = text;
  el.className = isError ? 'panel-hint error-inline' : 'panel-hint';
}

// Loads all rows (paged), turns them into file rows and saves the file.
// `loadRows()` returns { data, error }; `toRow` maps a database row to a file row.
async function _runExport(kindLabel, filePrefix, columns, loadRows, toRow) {
  _exportStatus(`${kindLabel}: wird geladen…`);
  try {
    const { data, error } = await loadRows();
    if (error) throw error;
    _downloadCsv(`${filePrefix}-export-${todayIso()}.csv`, buildCsv(columns, data.map(toRow)));
    _exportStatus(`${kindLabel}: ${data.length} Zeilen exportiert.`);
  } catch (e) {
    _exportStatus(`${kindLabel}: Fehler beim Export — ${e.message || e}`, true);
  }
}

// "ja" / "nein" like the status import expects.
const _jaNein = flag => (flag === false ? 'nein' : 'ja');

function exportPupils() {
  return _runExport('Schüler', 'schueler', PUPIL_EXPORT_COLUMNS,
    () => fetchAllRows(() => supabase.from('pupils')
      .select('first_name, last_name, address, is_active, inactive_since')
      .order('last_name').order('first_name').order('id')),
    p => ({ ...p, address: p.address ?? '', is_active: _jaNein(p.is_active), inactive_since: p.inactive_since ?? '' }));
}

function exportStaff() {
  return _runExport('Lehrkräfte', 'lehrkraefte', STAFF_EXPORT_COLUMNS,
    () => fetchAllRows(() => supabase.from('staff')
      .select('kuerzel, first_name, last_name, is_active, inactive_since')
      .order('last_name').order('first_name').order('id')),
    s => ({ ...s, kuerzel: s.kuerzel ?? '', is_active: _jaNein(s.is_active), inactive_since: s.inactive_since ?? '' }));
}

function exportIpads() {
  return _runExport('iPads', 'ipads', IPAD_EXPORT_COLUMNS,
    () => fetchAllRows(() => supabase.from('ipads')
      .select(`serial_number, ipad_type, storage_capacity, status,
               pupils:assigned_pupil_id (first_name, last_name),
               staff:assigned_staff_id (first_name, last_name, kuerzel)`)
      .order('serial_number')),            // unique, so the paging is stable
    i => ({
      ...i,
      assigned_to: i.pupils ? `${i.pupils.last_name}, ${i.pupils.first_name}`
                 : i.staff  ? `${i.staff.last_name}, ${i.staff.first_name}${i.staff.kuerzel ? ` (${i.staff.kuerzel})` : ''}`
                 : '',
    }));
}
