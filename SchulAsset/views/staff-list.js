// Staff list view — searchable, sortable table of all staff members, with batch actions on logins.

// State of the list. Selection and sorting survive a refresh after a batch action (keepState),
// but are reset when the admin opens the page again.
window._staffSort     = { key: 'name', dir: 1 };   // key: name | kuerzel | access | status
window._staffSelected = new Set();                 // ids of the selected Lehrkräfte (visible rows only)
window._staffLogins   = null;                      // Map(user_id → login) from listStaffLogins(), null if unreadable
window._staffLoginsError = '';

async function renderStaffList(keepState = false) {
  const container = document.getElementById('view-container');
  if (keepState !== true) {          // VIEW_RENDERERS calls this without arguments
    window._staffSort     = { key: 'name', dir: 1 };
    window._staffSelected = new Set();
  }

  container.innerHTML = `
    <div class="view-header">
      <h2>Lehrkräfte</h2>
    </div>
    <div class="toolbar">
      <input type="search" id="staff-search" class="search-input"
             placeholder="Name oder Kürzel suchen…">
      <label class="toolbar-check">
        <input type="checkbox" id="staff-show-former"> Ehemalige anzeigen
      </label>
    </div>
    <div id="staff-count" class="result-count"></div>
    <div id="staff-batch-bar"></div>
    <div id="staff-table-wrap"><p class="loading-msg">Wird geladen…</p></div>
  `;

  // All staff, paged (a single query would stop at 1000 rows).
  const { data: staff, error } = await fetchAllRows(() => supabase
    .from('staff')
    .select('id, first_name, last_name, kuerzel, created_at, user_id, login_email, is_active')
    .order('last_name')
    .order('first_name')
    .order('id'));

  if (error) {
    document.getElementById('staff-table-wrap').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${escapeHtml(error.message)}</p>`;
    return;
  }

  window._allStaff = staff;

  // Is a login active or locked? Only the server knows (Supabase Auth). If this fails the list
  // still works; the access column then just says "Zugang" and the batch actions are off.
  window._staffLogins = null;
  window._staffLoginsError = '';
  if (staff.some(s => s.user_id)) {
    try { window._staffLogins = new Map((await listStaffLogins()).map(l => [l.user_id, l])); }
    catch (e) { window._staffLoginsError = e.message; }
  }

  document.getElementById('staff-search').addEventListener('input', applyStaffFilter);
  document.getElementById('staff-show-former').addEventListener('change', applyStaffFilter);
  applyStaffFilter();
}

function applyStaffFilter() {
  const search = document.getElementById('staff-search').value.trim().toLowerCase();

  // Inactive staff (left the school) are hidden unless "Ehemalige anzeigen" is ticked.
  const showFormer = document.getElementById('staff-show-former').checked;

  // Inactive staff that match the search but are hidden, so the count can say so.
  let hiddenFormer = 0;

  const filtered = (window._allStaff || []).filter(s => {
    const full = `${s.last_name} ${s.first_name}`.toLowerCase();
    const matches = !search || full.includes(search) || (s.kuerzel ?? '').toLowerCase().includes(search)
                            || (s.login_email ?? '').toLowerCase().includes(search);
    if (!showFormer && s.is_active === false) {
      if (matches) hiddenFormer++;
      return false;
    }
    return matches;
  });

  const sorted = sortStaff(filtered, window._staffSort.key, window._staffSort.dir, window._staffLogins);

  // Only visible rows can stay selected (a batch action must never touch rows the admin cannot see).
  const visible = new Set(sorted.map(s => s.id));
  window._staffSelected = new Set([...window._staffSelected].filter(id => visible.has(id)));

  window._visibleStaff = sorted;
  renderStaffTable(sorted, hiddenFormer);
}

function openNewStaffModal() {
  _openModal('Neue Lehrkraft anlegen', `
    <div class="admin-form-group">
      <label>Vorname</label>
      <input type="text" id="ns-first" placeholder="Vorname">
    </div>
    <div class="admin-form-group">
      <label>Nachname</label>
      <input type="text" id="ns-last" placeholder="Nachname">
    </div>
    <div class="admin-form-group">
      <label>Kürzel</label>
      <input type="text" id="ns-kuerzel" placeholder="z. B. MUS">
    </div>
    <div class="admin-form-group">
      <label>E-Mail (Zugang, optional)</label>
      <input type="text" id="ns-email" placeholder="vorname.nachname@schule.de" autocapitalize="off" spellcheck="false">
      <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.35rem">
        Mit E-Mail erhält die Lehrkraft einen Zugang zum Nachschlagen von iPads
        (Rolle „Lehrkraft“, nur lesen). Das Passwort wird danach einmalig angezeigt.
      </p>
    </div>
  `, 'Anlegen', submitNewStaff);
}

async function submitNewStaff() {
  const firstName = document.getElementById('ns-first')?.value.trim();
  const lastName  = document.getElementById('ns-last')?.value.trim();
  if (!firstName || !lastName) { _modalError('Vor- und Nachname sind Pflichtfelder.'); return; }

  const email = (document.getElementById('ns-email')?.value || '').trim().toLowerCase();
  if (email && !isValidEmail(email)) { _modalError('Bitte eine gültige E-Mail-Adresse eingeben.'); return; }

  _setBusy(true, 'Anlegen');

  // 1. The Lehrkraft itself (the database checks that the Kürzel is free) …
  const kuerzel = document.getElementById('ns-kuerzel')?.value.trim() || null;
  const { data, error } = await supabase
    .from('staff')
    .insert({ first_name: firstName, last_name: lastName, kuerzel })
    .select('id')
    .single();

  if (error) { _setBusy(false, 'Anlegen'); _modalError('Fehler: ' + kuerzelErrorText(error, kuerzel)); return; }

  // Without an e-mail the Lehrkraft has no login, as before.
  if (!email) {
    closeAdminModal();
    showStaffDetail(data.id);
    return;
  }

  // 2. … then the login, linked to it. If this fails the Lehrkraft stays and can get access later.
  let result;
  try {
    [result] = await createStaffAccounts([{ email, role: 'teacher', staff_id: data.id }]);
  } catch (e) {
    result = { email, error: e.message };
  }

  closeAdminModal();
  showStaffDetail(data.id);   // the page behind the dialog is current however the dialog is closed

  if (result.password) {
    showCredentialsDialog({ title: 'Zugang für die Lehrkraft', email: result.email, password: result.password });
  } else {
    alert('Die Lehrkraft wurde angelegt, aber der Zugang konnte nicht erstellt werden:\n' + result.error +
          '\n\nAuf der Seite der Lehrkraft kann „Zugang einrichten“ erneut versucht werden.');
  }
}

// ---- New admin (opened from the admin panel, views/admin-panel.js) ----

function openNewAdminModal() {
  _openModal('Neuen Admin anlegen', `
    <div class="admin-modal-warn">
      Admins haben Vollzugriff auf alle Daten und Einstellungen. Bitte nur für Personen anlegen,
      die das brauchen. Lehrkräfte, die nur iPads nachschlagen, erhalten stattdessen
      über „Neue Lehrkraft“ einen Zugang.
    </div>
    <div class="admin-form-group" style="margin-top:0.9rem">
      <label>E-Mail</label>
      <input type="text" id="na-email" placeholder="name@schule.de" autocapitalize="off" spellcheck="false">
    </div>
  `, 'Admin anlegen', submitNewAdmin);
}

async function submitNewAdmin() {
  const email = (document.getElementById('na-email')?.value || '').trim().toLowerCase();
  if (!isValidEmail(email)) { _modalError('Bitte eine gültige E-Mail-Adresse eingeben.'); return; }

  _setBusy(true, 'Admin anlegen');
  try {
    const [result] = await createStaffAccounts([{ email, role: 'admin' }]);
    if (!result.password) { _setBusy(false, 'Admin anlegen'); _modalError(result.error); return; }
    closeAdminModal();
    showCredentialsDialog({ title: 'Zugang für den neuen Admin', email: result.email, password: result.password });
  } catch (e) {
    _setBusy(false, 'Admin anlegen');
    _modalError('Fehler: ' + e.message);
  }
}

function renderStaffTable(staff, hiddenFormer = 0) {
  document.getElementById('staff-count').textContent =
    `${staff.length} Lehrkraft${staff.length !== 1 ? 'kräfte' : ''}` +
    (hiddenFormer ? ` · ${hiddenFormer} ehemalige ausgeblendet` : '') +
    (window._staffLoginsError ? ' · Zustand der Zugänge nicht lesbar' : '');
  _renderStaffBatchBar();

  if (staff.length === 0) {
    document.getElementById('staff-table-wrap').innerHTML =
      '<p class="empty-msg">Keine Lehrkräfte gefunden.</p>';
    return;
  }

  const allSelected = staff.every(s => window._staffSelected.has(s.id));
  const rows = staff.map(s => `
    <tr onclick="showStaffDetail('${s.id}')">
      <td onclick="event.stopPropagation()">
        <input type="checkbox" aria-label="Auswählen" ${window._staffSelected.has(s.id) ? 'checked' : ''}
               onchange="toggleStaffSelected('${s.id}', this.checked)">
      </td>
      <td>${escapeHtml(s.last_name)}</td>
      <td>${escapeHtml(s.first_name)}</td>
      <td class="mono">${escapeHtml(s.kuerzel ?? '—')}</td>
      <td>${_staffAccessBadge(s)}</td>
      <td>${s.is_active === false
            ? '<span class="badge badge-inactive">nicht aktiv</span>'
            : '<span class="badge" style="background:#34c759">aktiv</span>'}</td>
    </tr>
  `).join('');

  document.getElementById('staff-table-wrap').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:2rem"><input type="checkbox" aria-label="Alle sichtbaren auswählen"
                title="Alle sichtbaren auswählen" ${allSelected ? 'checked' : ''}
                onchange="toggleAllVisibleStaff(this.checked)"></th>
            ${_sortHeader('name', 'Nachname')}
            <th>Vorname</th>
            ${_sortHeader('kuerzel', 'Kürzel')}
            ${_sortHeader('access', 'Zugang')}
            ${_sortHeader('status', 'Status')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// A column header that sorts when clicked; the arrow shows the current sort.
function _sortHeader(key, label) {
  const { key: current, dir } = window._staffSort;
  const arrow = key === current ? (dir === 1 ? ' ▲' : ' ▼') : '';
  return `<th class="sortable" onclick="sortStaffBy('${key}')">${label}${arrow}</th>`;
}

// First click on a column sorts ascending, a second click reverses.
function sortStaffBy(key) {
  const cur = window._staffSort;
  window._staffSort = { key, dir: cur.key === key ? -cur.dir : 1 };
  applyStaffFilter();
}

function _staffAccessBadge(s) {
  const state = staffAccessState(s, window._staffLogins);
  if (state === 'none')   return '—';
  if (state === 'active') return loginStateBadge({ locked: false });
  if (state === 'locked') return loginStateBadge({ locked: true });
  return '<span class="badge" style="background:#8e8e93">Zugang</span>';   // has a login, state unknown
}

// ---- Selection and batch actions on logins ----

function toggleStaffSelected(id, on) {
  if (on) window._staffSelected.add(id); else window._staffSelected.delete(id);
  applyStaffFilter();   // redraws the table, the headline and the batch bar
}

function toggleAllVisibleStaff(on) {
  window._staffSelected = on ? new Set((window._visibleStaff || []).map(s => s.id)) : new Set();
  applyStaffFilter();
}

// The bar above the table: how many are selected and what can be done with them.
function _renderStaffBatchBar() {
  const bar = document.getElementById('staff-batch-bar');
  const n = window._staffSelected.size;
  if (!n) { bar.innerHTML = ''; return; }

  const withLogin = _selectedStaffWithLogin().length;
  const off = window._staffLoginsError ? 'disabled title="Der Zustand der Zugänge konnte nicht gelesen werden"' : '';
  bar.innerHTML = `
    <div class="batch-bar">
      <strong>${n} ausgewählt</strong> <span class="field-hint">(${withLogin} mit Zugang)</span>
      <button class="btn-action-detail" ${off} onclick="batchLoginAction('lock')">Zugang sperren</button>
      <button class="btn-action-detail" ${off} onclick="batchLoginAction('unlock')">Zugang entsperren</button>
      <button class="btn-action-detail" ${off} onclick="batchLoginAction('reset_password')">Neue Passwörter setzen</button>
      <button class="btn-action-detail" ${off} onclick="batchLoginAction('delete')">Zugang löschen</button>
      <button class="btn-action-detail" onclick="toggleAllVisibleStaff(false)">Auswahl aufheben</button>
    </div>`;
}

// The selected Lehrkräfte that have a login, as the dialog wants them.
function _selectedStaffWithLogin() {
  return (window._allStaff || [])
    .filter(s => window._staffSelected.has(s.id) && s.user_id)
    .map(s => ({ user_id: s.user_id, email: s.login_email ?? '', name: `${s.first_name} ${s.last_name}` }));
}

function batchLoginAction(action) {
  const people = _selectedStaffWithLogin();
  if (!people.length) { alert('Keine der ausgewählten Personen hat einen Zugang.'); return; }
  // After the server answered, reload the list (keeping selection and sort) so every state is current.
  openLoginActionDialog(action, people, () => renderStaffList(true));
}
