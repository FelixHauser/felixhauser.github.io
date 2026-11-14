// Admin panel ("Verwaltung") — one place for setup and data-management jobs.
//
// The panel is a list of sections. To add a feature later (manage logins, settings,
// purge old data …), add one entry to ADMIN_PANEL_SECTIONS; nothing else changes.
//
// The dialogs opened from here (openNewIpadModal, openCsvImportModal, …) still live in
// their own view files (ipad-list.js, pupil-list.js, staff-list.js, csv-import.js).
// The panel only calls them.

// One row of the iOS-style grouped list (same look as the iPad detail actions).
function _panelRow(label, onclick) {
  return `<button class="action-row" onclick="${onclick}">
            <span class="action-row-label">${label}</span>
            <span class="action-row-chevron">›</span>
          </button>`;
}

// Each section: { title, render() → HTML string, after() → optional, runs once the HTML is in the page }.
const ADMIN_PANEL_SECTIONS = [
  {
    title: 'Daten hinzufügen',
    render: () => `
      <div class="action-group-rows">
        ${_panelRow('Neues iPad',         'openNewIpadModal()')}
        ${_panelRow('Neuer Schüler',      'openNewPupilModal()')}
        ${_panelRow('Neue Lehrkraft',     'openNewStaffModal()')}
        ${_panelRow('iPads aus CSV importieren',       "openCsvImportModal('ipads')")}
        ${_panelRow('Schüler aus CSV importieren',     "openCsvImportModal('pupils')")}
        ${_panelRow('Lehrkräfte aus CSV importieren',  "openCsvImportModal('staff')")}
      </div>`,
  },
  {
    title: 'Zugänge',
    render: () => `
      <div class="action-group-rows">
        ${_panelRow('Neuer Admin', 'openNewAdminModal()')}
      </div>
      <p class="panel-hint">Zugänge für Lehrkräfte werden auf der Seite „Lehrkräfte“ eingerichtet.</p>`,
  },
  {
    title: 'Schule',
    render: () => {
      const s = window.SCHOOL || {};
      return `
        <div class="detail-card">
          <div class="detail-field"><span>Name</span><strong>${escapeHtml(s.name || '–')}</strong></div>
          <div class="detail-field"><span>Name (lang)</span><strong>${escapeHtml(s.fullName || '–')}</strong></div>
          <div class="detail-field"><span>Schulträger</span><strong>${escapeHtml(s.authority || '–')}</strong></div>
          <div class="detail-field"><span>Logo</span>
            <img src="${escapeHtml(s.logo || '')}" alt="" class="panel-logo-preview">
          </div>
        </div>
        <p class="panel-hint">Diese Werte stehen in der Datei <code>school-config.js</code>.
          Zum Ändern die Datei bearbeiten bzw. die Logo-Datei ersetzen, dann
          <code>./bump-version.sh</code> ausführen und hochladen.</p>`;
    },
  },
  {
    title: 'Systemprüfung',
    render: () => `
      <button class="btn-action-detail" id="syscheck-btn" onclick="runSystemCheck()">Prüfung starten</button>
      <div id="syscheck-results" class="syscheck-results"></div>`,
  },
];

function renderAdminPanel() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header"><h2>Verwaltung</h2></div>
    ${ADMIN_PANEL_SECTIONS.map(s => `
      <div class="action-group panel-section">
        <div class="action-group-label">${escapeHtml(s.title)}</div>
        ${s.render()}
      </div>`).join('')}
  `;
  ADMIN_PANEL_SECTIONS.forEach(s => s.after?.());
}

// ---- Systemprüfung (read-only; runs only when the button is pressed) ----

// Shows one result row. status: 'pending' | 'ok' | 'warn' | 'error'.
function _checkRow(id, label, status, text) {
  const icon = { pending: '…', ok: '✓', warn: '!', error: '✗' }[status];
  const el = document.getElementById('check-' + id);
  const html = `<span class="check-icon">${icon}</span>
                <span class="check-label">${escapeHtml(label)}</span>
                <span class="check-text">${escapeHtml(text || '')}</span>`;
  if (el) {
    el.className = 'check-row check-' + status;
    el.innerHTML = html;
  }
}

// Counts the rows of a table without transferring them (also correct above 1000 rows).
async function _countRows(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count;
}

// Asks a function whether it is deployed, without running it. A bare POST without
// login data is refused by Supabase with 401 before any function code runs, so
// nothing can be created; a function that does not exist answers 404. No headers and
// no body, so the browser sends no preflight request. (An OPTIONS request does not
// work here: the browser blocks it because the functions do not allow that method.)
async function _probeFunction(name) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, { method: 'POST' });
    if (res.status === 404) return { ok: false, text: 'nicht erreichbar (nicht bereitgestellt, 404)' };
    if (res.status >= 500)  return { ok: false, text: `Fehler auf dem Server (Status ${res.status})` };
    return { ok: true, text: 'bereitgestellt und erreichbar' };
  } catch (e) {
    return { ok: false, text: 'nicht erreichbar (' + e.message + ')' };
  }
}

async function runSystemCheck() {
  const btn = document.getElementById('syscheck-btn');
  const out = document.getElementById('syscheck-results');
  btn.disabled = true;

  // Same version the page was loaded with: the ?v= of admin.js.
  const version = (document.querySelector('script[src*="admin.js"]')?.src.match(/[?&]v=([\w-]+)/) || [])[1] || 'unbekannt';

  const tables = ['ipads', 'pupils', 'staff', 'user_roles'];
  const functions = ['create-ipad-account', 'create-staff-account'];

  // Result rows first, all "pending", so the admin sees what is being checked.
  const rows = [
    ...tables.map(t => ({ id: 'db-' + t, label: 'Datenbank: ' + t })),
    ...functions.map(f => ({ id: 'fn-' + f, label: 'Funktion: ' + f })),
    { id: 'testdata', label: 'Testdaten (Seriennummer ZZ…)' },
    { id: 'logo',     label: 'Logo-Datei' },
    { id: 'version',  label: 'Dateiversion' },
  ];
  out.innerHTML = rows.map(r => `<div class="check-row check-pending" id="check-${escapeHtml(r.id)}"></div>`).join('');
  rows.forEach(r => _checkRow(r.id, r.label, 'pending'));

  // Each check catches its own error, so one failure never stops the others.
  const jobs = [];

  tables.forEach(t => jobs.push((async () => {
    try {
      const n = await _countRows(t);
      _checkRow('db-' + t, 'Datenbank: ' + t, 'ok', n + ' Einträge');
    } catch (e) {
      _checkRow('db-' + t, 'Datenbank: ' + t, 'error', 'Tabelle „' + t + '“ nicht lesbar: ' + e.message);
    }
  })()));

  functions.forEach(f => jobs.push((async () => {
    const r = await _probeFunction(f);
    _checkRow('fn-' + f, 'Funktion: ' + f, r.ok ? 'ok' : 'error',
      r.ok ? r.text : r.text + ' — Funktionen werden von Hand in Supabase bereitgestellt.');
  })()));

  jobs.push((async () => {
    try {
      const n = await _countRows('ipads', q => q.ilike('serial_number', 'ZZ%'));
      if (n > 0) _checkRow('testdata', 'Testdaten (Seriennummer ZZ…)', 'warn',
        `${n} iPad(s) mit Seriennummer ZZ… vorhanden — vor dem Produktivbetrieb löschen.`);
      else       _checkRow('testdata', 'Testdaten (Seriennummer ZZ…)', 'ok', 'keine gefunden');
    } catch (e) {
      _checkRow('testdata', 'Testdaten (Seriennummer ZZ…)', 'error', e.message);
    }
  })());

  jobs.push((async () => {
    const path = window.SCHOOL?.logo;
    if (!path) return _checkRow('logo', 'Logo-Datei', 'error', 'kein Logo in school-config.js eingetragen');
    try {
      const res = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
      if (res.ok) _checkRow('logo', 'Logo-Datei', 'ok', path);
      else        _checkRow('logo', 'Logo-Datei', 'error', `„${path}“ nicht gefunden (Status ${res.status})`);
    } catch (e) {
      _checkRow('logo', 'Logo-Datei', 'error', `„${path}“ nicht ladbar (${e.message})`);
    }
  })());

  _checkRow('version', 'Dateiversion', 'ok', version);

  await Promise.all(jobs);
  btn.disabled = false;
  btn.textContent = 'Prüfung erneut starten';
}
