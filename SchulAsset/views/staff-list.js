// Staff list view — searchable table of all staff members.

async function renderStaffList() {
  const container = document.getElementById('view-container');

  container.innerHTML = `
    <div class="view-header">
      <h2>Lehrkräfte</h2>
    </div>
    <div class="toolbar">
      <input type="search" id="staff-search" class="search-input"
             placeholder="Name oder Kürzel suchen…">
    </div>
    <div id="staff-count" class="result-count"></div>
    <div id="staff-table-wrap"><p class="loading-msg">Wird geladen…</p></div>
  `;

  // All staff, paged (a single query would stop at 1000 rows).
  const { data: staff, error } = await fetchAllRows(() => supabase
    .from('staff')
    .select('id, first_name, last_name, kuerzel, created_at, user_id, login_email')
    .order('last_name')
    .order('first_name')
    .order('id'));

  if (error) {
    document.getElementById('staff-table-wrap').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${escapeHtml(error.message)}</p>`;
    return;
  }

  window._allStaff = staff;

  document.getElementById('staff-search').addEventListener('input', applyStaffFilter);
  applyStaffFilter();
}

function applyStaffFilter() {
  const search = document.getElementById('staff-search').value.trim().toLowerCase();

  const filtered = (window._allStaff || []).filter(s => {
    if (!search) return true;
    const full = `${s.last_name} ${s.first_name}`.toLowerCase();
    return full.includes(search) || (s.kuerzel ?? '').toLowerCase().includes(search)
        || (s.login_email ?? '').toLowerCase().includes(search);
  });

  renderStaffTable(filtered);
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

function renderStaffTable(staff) {
  document.getElementById('staff-count').textContent =
    `${staff.length} Lehrkraft${staff.length !== 1 ? 'kräfte' : ''}`;

  if (staff.length === 0) {
    document.getElementById('staff-table-wrap').innerHTML =
      '<p class="empty-msg">Keine Lehrkräfte gefunden.</p>';
    return;
  }

  const rows = staff.map(s => `
    <tr onclick="showStaffDetail('${s.id}')">
      <td>${escapeHtml(s.last_name)}</td>
      <td>${escapeHtml(s.first_name)}</td>
      <td class="mono">${escapeHtml(s.kuerzel ?? '—')}</td>
      <td>${s.user_id ? '<span class="badge" style="background:#34c759">Zugang</span>' : '—'}</td>
    </tr>
  `).join('');

  document.getElementById('staff-table-wrap').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nachname</th>
            <th>Vorname</th>
            <th>Kürzel</th>
            <th>Zugang</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
