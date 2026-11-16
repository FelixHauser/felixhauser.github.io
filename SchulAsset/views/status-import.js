// Batch update of the active status (pupils / staff) from a CSV file.
//
// The admin prepares a file with the people who left (or came back); the update matches
// them to EXISTING people, shows a preview and only writes after confirmation.
// It never creates people.
//
// File formats (UTF-8, first line is the header, separator ';' or ',' is detected):
//   pupils:  first_name;last_name;address;is_active;inactive_since   (address + inactive_since optional)
//   staff:   kuerzel;is_active;inactive_since                        (inactive_since optional)
//   is_active: ja/nein, true/false, 1/0, aktiv/nicht aktiv
//   inactive_since: yyyy-mm-dd or dd.mm.yyyy; empty = the day of the import (only used for "nein")
//
// Structure: Part 1 = pure functions (parse, match, plan — testable in Node),
//            Part 2 = dialog, preview and writing (browser only).

// The CSV parser and helpers live in csv-import.js (a browser global there, a module in Node).
const _statusLib = (typeof module !== 'undefined') ? require('./csv-import.js') : window;

// ─── Part 1: pure functions ───

// Reads the is_active cell. Returns true, false, or null when the value is not understood.
function parseActiveValue(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (['ja', 'true', '1', 'aktiv'].includes(v)) return true;
  if (['nein', 'false', '0', 'nicht aktiv', 'inaktiv'].includes(v)) return false;
  return null;
}

// Reads the inactive_since cell (yyyy-mm-dd or dd.mm.yyyy) against `today` (yyyy-mm-dd).
// Returns { date } (empty cell: date null), or { error } with a readable reason.
function parseInactiveDate(value, today) {
  const v = String(value ?? '').trim();
  if (v === '') return { date: null };

  let y, m, d, match;
  if ((match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))       [, y, m, d] = match;
  else if ((match = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) [, d, m, y] = match;
  else return { error: `Datum „${v}“ nicht lesbar (erlaubt: tt.mm.jjjj oder jjjj-mm-tt)` };

  y = Number(y); m = Number(m); d = Number(d);
  const probe = new Date(Date.UTC(y, m - 1, d));     // rejects 31.02. etc.
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d)
    return { error: `Datum „${v}“ gibt es nicht` };

  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (iso > today) return { error: `Datum ${iso} liegt in der Zukunft` };
  return { date: iso };
}

// Builds the plan for a status file. `matchRow(cell)` decides which person a row means;
// everything else (value, date, duplicates, unchanged, blocked) is the same for both kinds.
//   people:      all existing people { id, is_active, inactive_since, … }
//   assigned:    Map personId -> serial number of an assigned iPad (for the "blocked" rule)
// Returns { fatal, update, unchanged, notFound, ambiguous, duplicates, invalid, blocked };
// every list holds { line, label, reason? }; `update` rows also carry
// { id, is_active, inactive_since, change: 'deactivate' | 'reactivate' | 'date' }.
function _buildStatusPlan(rows, required, matchRow, labelOf, assigned, today) {
  const plan = { fatal: null, update: [], unchanged: [], notFound: [], ambiguous: [], duplicates: [], invalid: [], blocked: [] };
  const h = _statusLib._csvHeader(rows, required);
  if (h.fatal) { plan.fatal = h.fatal; return plan; }
  const cell = (r, name) => (h.col(name) === -1 ? '' : (r[h.col(name)] ?? '')).trim();

  const seen = new Set();                            // person ids already used by an earlier row
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2;                            // header = line 1
    const found = matchRow(cell, r);
    if (found.invalid)   return plan.invalid.push({ line, label: found.label, reason: found.invalid });
    if (found.notFound)  return plan.notFound.push({ line, label: found.label, reason: 'nicht gefunden' });
    if (found.ambiguous) return plan.ambiguous.push({ line, label: found.label, reason: found.ambiguous });

    const person = found.person;
    const label = labelOf(person);
    if (seen.has(person.id)) return plan.duplicates.push({ line, label, reason: 'kommt in der Datei mehrfach vor (nur die erste Zeile zählt)' });
    seen.add(person.id);

    const wantActive = parseActiveValue(cell(r, 'is_active'));
    if (wantActive === null)
      return plan.invalid.push({ line, label, reason: `is_active „${cell(r, 'is_active')}“ nicht verständlich (erlaubt: ja / nein)` });

    // Reactivate: always allowed; clears the date.
    if (wantActive) {
      if (person.is_active) return plan.unchanged.push({ line, label, reason: 'ist bereits aktiv' });
      return plan.update.push({ line, label, id: person.id, is_active: true, inactive_since: null, change: 'reactivate' });
    }

    // Deactivate (or correct the date of an already inactive person).
    const parsed = parseInactiveDate(cell(r, 'inactive_since'), today);
    if (parsed.error) return plan.invalid.push({ line, label, reason: parsed.error });

    if (!person.is_active) {
      // Already inactive: only an explicitly different date counts as a correction.
      if (parsed.date && parsed.date !== person.inactive_since)
        return plan.update.push({ line, label, id: person.id, is_active: false, inactive_since: parsed.date, change: 'date' });
      return plan.unchanged.push({ line, label, reason: 'ist bereits nicht aktiv' });
    }
    if (assigned.has(person.id))
      return plan.blocked.push({ line, label, reason: `hat noch das iPad ${assigned.get(person.id)} — erst die Rückgabe durchführen` });
    plan.update.push({ line, label, id: person.id, is_active: false, inactive_since: parsed.date || today, change: 'deactivate' });
  });
  return plan;
}

// Pupil file. A row with an address is matched on first + last name + address (like the
// pupil import); without an address on first + last name, but only if exactly one pupil has it.
function validatePupilStatusRows(rows, pupils, assigned, today) {
  const byFull = new Map(), byName = new Map();
  const push = (map, key, p) => map.set(key, [...(map.get(key) || []), p]);
  pupils.forEach(p => {
    push(byFull, _statusLib.pupilKey(p.first_name, p.last_name, p.address), p);
    push(byName, _statusLib.pupilKey(p.first_name, p.last_name, ''), p);
  });

  const fileHeader = rows[0] ? rows[0].map(c => c.trim().toLowerCase()) : [];
  if (fileHeader.includes('kuerzel')) {
    return { fatal: 'Diese Datei enthält die Spalte kuerzel und gehört zu den Lehrkräften.',
             update: [], unchanged: [], notFound: [], ambiguous: [], duplicates: [], invalid: [], blocked: [] };
  }

  return _buildStatusPlan(rows, ['first_name', 'last_name', 'is_active'],
    (cell, r) => {
      const first = cell(r, 'first_name'), last = cell(r, 'last_name'), address = cell(r, 'address');
      const label = `${last}, ${first}`;
      if (!first || !last) return { label, invalid: 'Vor- oder Nachname fehlt' };
      const hits = address
        ? (byFull.get(_statusLib.pupilKey(first, last, address)) || [])
        : (byName.get(_statusLib.pupilKey(first, last, '')) || []);
      if (hits.length === 0) return { label, notFound: true };
      if (hits.length > 1)
        return { label, ambiguous: address ? 'mehrere Schüler mit gleichem Namen und gleicher Adresse'
                                           : 'mehrere Schüler mit diesem Namen — bitte die Adresse angeben' };
      return { person: hits[0] };
    },
    p => `${p.last_name}, ${p.first_name}`,
    assigned, today);
}

// Staff file: matched on the Kürzel (ignoring case). Name columns are not needed.
function validateStaffStatusRows(rows, staff, assigned, today) {
  const byKuerzel = new Map();
  staff.filter(s => s.kuerzel).forEach(s => byKuerzel.set(s.kuerzel.trim().toUpperCase(), s));

  return _buildStatusPlan(rows, ['kuerzel', 'is_active'],
    (cell, r) => {
      const kuerzel = cell(r, 'kuerzel');
      if (!kuerzel) return { label: '(ohne Kürzel)', invalid: 'Kürzel fehlt' };
      const person = byKuerzel.get(kuerzel.toUpperCase());
      return person ? { person } : { label: kuerzel, notFound: true };
    },
    s => `${s.last_name}, ${s.first_name} (${s.kuerzel})`,
    assigned, today);
}

// Make the pure functions testable from Node (no effect in the browser).
if (typeof module !== 'undefined') module.exports = {
  parseActiveValue, parseInactiveDate, validatePupilStatusRows, validateStaffStatusRows,
};

// ─── Part 2: dialog, preview and writing (browser only) ───

// One entry per kind: texts, template, loading of existing people, validation.
const STATUS_KINDS = {
  pupils: {
    label: 'Schüler', view: 'pupils', table: 'pupils', ipadColumn: 'assigned_pupil_id',
    hint: `Kopfzeile <code>first_name;last_name;address;is_active;inactive_since</code>.
           <code>address</code> und <code>inactive_since</code> sind optional. Ohne Adresse wird nur
           dann zugeordnet, wenn genau ein Schüler diesen Namen hat.`,
    templateFile: 'schueler-status-vorlage.csv',
    template: 'first_name;last_name;address;is_active;inactive_since\n'
            + 'Max;Mustermann;Musterstraße 1, 45768 Marl;nein;31.07.2026\n'
            + 'Erika;Beispiel;;nein;\n',
    select: 'id, first_name, last_name, address, is_active, inactive_since',
    validate: validatePupilStatusRows,
  },
  staff: {
    label: 'Lehrkräfte', view: 'staff', table: 'staff', ipadColumn: 'assigned_staff_id',
    hint: `Kopfzeile <code>kuerzel;is_active;inactive_since</code>. <code>inactive_since</code> ist optional.
           Zugeordnet wird über das Kürzel. Der Zugang einer Lehrkraft wird gesperrt, wenn sie „nicht aktiv“
           wird, und entsperrt, wenn sie wieder aktiv wird.`,
    templateFile: 'lehrkraefte-status-vorlage.csv',
    template: 'kuerzel;is_active;inactive_since\nMUS;nein;31.07.2026\nBEI;nein;\n',
    select: 'id, first_name, last_name, kuerzel, user_id, is_active, inactive_since',
    validate: validateStaffStatusRows,
  },
};

const STATUS_CHUNK_SIZE = 50;       // ids per update call (the ids go into the request address)
let _statusKind = 'pupils';
let _statusPlan = null;
let _statusPeople = new Map();      // id -> person of the previewed file (staff: carries user_id for the login lock)

// Opens the dialog for one kind (chosen in the admin panel; fixed while it is open).
function openStatusImportModal(kind = 'pupils') {
  _statusKind = STATUS_KINDS[kind] ? kind : 'pupils';
  _statusPlan = null;
  const k = STATUS_KINDS[_statusKind];
  _openModal(`Status ${k.label} aus CSV aktualisieren`, `
    <p class="field-hint">CSV-Datei (UTF-8) mit der ${k.hint}<br>
       <code>is_active</code>: ja / nein (auch true / false, 1 / 0). Personen mit iPad können nicht auf
       „nein“ gesetzt werden.<br>
       Tipp: Die Datei aus Verwaltung → „Daten exportieren“ kann in Excel bearbeitet und hier direkt verwendet werden.</p>
    <p><a href="#" onclick="downloadStatusTemplate(); return false;">Vorlage herunterladen</a></p>
    <div class="admin-form-group">
      <label>CSV-Datei</label>
      <input type="file" id="status-file" accept=".csv,text/csv,text/plain"
             onchange="previewStatusImport(this.files[0])">
    </div>
    <div id="status-preview"></div>
  `, 'Aktualisieren', runStatusImport);
  document.getElementById('admin-modal-submit').disabled = true;
}

function downloadStatusTemplate() {
  const k = STATUS_KINDS[_statusKind];
  const url = URL.createObjectURL(new Blob(['﻿' + k.template], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = k.templateFile;
  a.click();
  URL.revokeObjectURL(url);
}

// Loads everyone of the kind, and which of them still have an iPad (paged, no id lists in URLs).
async function _fetchStatusData(k) {
  const people = await fetchAllRows(() => supabase.from(k.table).select(k.select).order('id'));
  if (people.error) throw people.error;
  const ipads = await fetchAllRows(() => supabase.from('ipads')
    .select(`${k.ipadColumn}, serial_number`).not(k.ipadColumn, 'is', null).order('id'));
  if (ipads.error) throw ipads.error;
  const assigned = new Map();
  ipads.data.forEach(i => assigned.set(i[k.ipadColumn], i.serial_number));
  return { people: people.data, assigned };
}

// Step 2: read the file, build the plan, show the preview. Writes nothing.
async function previewStatusImport(file) {
  const k = STATUS_KINDS[_statusKind];
  const box = document.getElementById('status-preview');
  const btn = document.getElementById('admin-modal-submit');
  _statusPlan = null;
  btn.disabled = true;
  btn.textContent = 'Aktualisieren';
  if (!file) { box.innerHTML = ''; return; }

  box.innerHTML = '<p class="loading-msg">Datei wird geprüft…</p>';
  try {
    const text = await file.text();
    const { people, assigned } = await _fetchStatusData(k);
    if (STATUS_KINDS[_statusKind] !== k) return;      // another dialog was opened meanwhile
    const plan = k.validate(parseCsv(text), people, assigned, todayIso());
    _statusPeople = new Map(people.map(p => [p.id, p]));

    if (plan.fatal) { box.innerHTML = `<p class="error-inline">${escapeHtml(plan.fatal)}</p>`; return; }
    _statusPlan = plan;

    const n = c => plan.update.filter(u => u.change === c).length;
    const problems = [
      ...plan.invalid.map(p => ({ ...p, kind: 'ungültig' })),
      ...plan.blocked.map(p => ({ ...p, kind: 'gesperrt' })),
      ...plan.notFound.map(p => ({ ...p, kind: 'nicht gefunden' })),
      ...plan.ambiguous.map(p => ({ ...p, kind: 'mehrdeutig' })),
      ...plan.duplicates.map(p => ({ ...p, kind: 'doppelt' })),
    ].sort((a, b) => a.line - b.line);
    const shown = problems.slice(0, 50);

    box.innerHTML = `
      <p><strong>${n('deactivate')}</strong> werden auf „nicht aktiv“ gesetzt ·
         <strong>${n('reactivate')}</strong> wieder aktiviert ·
         ${n('date')} Datum korrigiert ·
         ${plan.unchanged.length} unverändert</p>
      <p>${plan.notFound.length} nicht gefunden · ${plan.ambiguous.length} mehrdeutig ·
         ${plan.duplicates.length} doppelt · ${plan.invalid.length} ungültig ·
         ${plan.blocked.length} gesperrt (iPad noch zugewiesen)</p>
      ${shown.length ? `
        <div class="table-wrap"><table class="data-table"><thead>
          <tr><th>Zeile</th><th>${escapeHtml(k.label)}</th><th>Problem</th></tr></thead><tbody>
          ${shown.map(p => `<tr><td>${p.line}</td><td>${escapeHtml(p.label)}</td>
                            <td>${escapeHtml(p.kind)}: ${escapeHtml(p.reason)}</td></tr>`).join('')}
        </tbody></table></div>
        ${problems.length > shown.length ? `<p class="field-hint">… und ${problems.length - shown.length} weitere</p>` : ''}
      ` : ''}`;
    btn.textContent = `${plan.update.length} ${k.label} aktualisieren`;
    btn.disabled = plan.update.length === 0;
  } catch (e) {
    box.innerHTML = `<p class="error-inline">Fehler beim Prüfen: ${escapeHtml(e.message || String(e))}</p>`;
  }
}

// Step 3: write. People with the same new values are updated together (is_active and
// inactive_since always in the same call), in small chunks of ids.
async function runStatusImport() {
  if (!_statusPlan || _statusPlan.update.length === 0) return;
  const k = STATUS_KINDS[_statusKind];
  const plan = _statusPlan;
  const btn = document.getElementById('admin-modal-submit');
  const box = document.getElementById('status-preview');
  document.getElementById('status-file').disabled = true;
  btn.disabled = true;

  const groups = new Map();                          // "active|date" -> { values, ids }
  plan.update.forEach(u => {
    const key = `${u.is_active}|${u.inactive_since}`;
    if (!groups.has(key)) groups.set(key, { values: { is_active: u.is_active, inactive_since: u.inactive_since }, ids: [] });
    groups.get(key).ids.push(u.id);
  });

  // Staff: a person who is not active must not keep access. Deactivated people get their login
  // locked FIRST (if that fails their status stays unchanged); reactivated people are unlocked
  // AFTER their status is saved (a failure leaves them active but locked, which is harmless).
  const isStaff = _statusKind === 'staff';
  const labelOf = new Map(plan.update.map(u => [u.id, u.label]));
  const loginOf = id => _statusPeople.get(id)?.user_id || null;
  let saved = 0, failure = null, locked = 0, unlocked = 0;
  const lockFailed = [], unlockFailed = [];          // [{ label, error }]

  outer:
  for (const { values, ids } of groups.values()) {
    for (let i = 0; i < ids.length; i += STATUS_CHUNK_SIZE) {
      let chunk = ids.slice(i, i + STATUS_CHUNK_SIZE);
      btn.textContent = `Aktualisiere… ${saved} / ${plan.update.length}`;

      if (isStaff && !values.is_active) {
        const withLogin = chunk.filter(loginOf);
        if (withLogin.length) {
          const results = await manageStaffAccounts('lock', withLogin.map(loginOf));
          const failedUsers = new Set();
          results.forEach(r => { if (r.ok) locked++; else failedUsers.add(r.user_id); });
          withLogin.filter(id => failedUsers.has(loginOf(id))).forEach(id => {
            const r = results.find(x => x.user_id === loginOf(id));
            lockFailed.push({ label: labelOf.get(id), error: r.error });
          });
          chunk = chunk.filter(id => !failedUsers.has(loginOf(id)));   // not locked => status stays unchanged
        }
      }

      if (chunk.length) {
        const { error } = await supabase.from(k.table).update(values).in('id', chunk);
        if (error) { failure = error; break outer; }
        saved += chunk.length;
      }

      if (isStaff && values.is_active) {
        const withLogin = chunk.filter(loginOf);
        if (withLogin.length) {
          const results = await manageStaffAccounts('unlock', withLogin.map(loginOf));
          results.forEach(r => {
            if (r.ok) { unlocked++; return; }
            const id = withLogin.find(x => loginOf(x) === r.user_id);
            unlockFailed.push({ label: labelOf.get(id), error: r.error });
          });
        }
      }
    }
  }

  const n = c => plan.update.filter(u => u.change === c).length;
  const problemRows = list => list.slice(0, 20)
    .map(f => `<tr><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.error)}</td></tr>`).join('');
  const loginLines = !isStaff ? '' : `
       <p>${locked} Zugänge gesperrt · ${unlocked} Zugänge entsperrt</p>
       ${lockFailed.length ? `<p class="error-inline">${lockFailed.length} nicht geändert, weil der Zugang nicht gesperrt werden konnte:</p>
         <div class="table-wrap"><table class="data-table"><thead><tr><th>Lehrkraft</th><th>Problem</th></tr></thead>
         <tbody>${problemRows(lockFailed)}</tbody></table></div>` : ''}
       ${unlockFailed.length ? `<p class="error-inline">${unlockFailed.length} wieder aktiv, aber der Zugang konnte nicht entsperrt werden
         (auf der Seite der Lehrkraft „Zugang entsperren“ wählen):</p>
         <div class="table-wrap"><table class="data-table"><thead><tr><th>Lehrkraft</th><th>Problem</th></tr></thead>
         <tbody>${problemRows(unlockFailed)}</tbody></table></div>` : ''}`;
  box.innerHTML = failure
    ? `<p class="error-inline">Fehler nach ${saved} gespeicherten Änderungen: ${escapeHtml(failure.message)}<br>
       Die Datei kann erneut verwendet werden — bereits geänderte Einträge gelten dann als unverändert.</p>${loginLines}`
    : `<p><strong>${saved} ${escapeHtml(k.label)} aktualisiert</strong>
         (${n('deactivate')} auf „nicht aktiv“, ${n('reactivate')} wieder aktiviert, ${n('date')} Datum korrigiert).</p>
       <p>${plan.unchanged.length} unverändert · ${plan.notFound.length + plan.ambiguous.length + plan.duplicates.length + plan.invalid.length + plan.blocked.length} übersprungen</p>
       ${loginLines}`;

  btn.textContent = 'Schließen';
  btn.disabled = false;
  btn.onclick = closeAdminModal;
  _statusPlan = null;

  // Refresh the list behind the dialog — only if it is the one currently shown.
  if (window.location.hash.slice(1) === k.view) VIEW_RENDERERS[k.view]();
}
