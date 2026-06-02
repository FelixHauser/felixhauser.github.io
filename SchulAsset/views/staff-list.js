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
      <button class="btn-action-detail" onclick="openNewStaffModal()">+ Neue Lehrkraft</button>
    </div>
    <div id="staff-count" class="result-count"></div>
    <div id="staff-table-wrap"><p class="loading-msg">Wird geladen…</p></div>
  `;

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, first_name, last_name, kuerzel, created_at')
    .order('last_name')
    .order('first_name');

  if (error) {
    document.getElementById('staff-table-wrap').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${error.message}</p>`;
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
    return full.includes(search) || (s.kuerzel ?? '').toLowerCase().includes(search);
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
  `, 'Anlegen', submitNewStaff);
}

async function submitNewStaff() {
  const firstName = document.getElementById('ns-first')?.value.trim();
  const lastName  = document.getElementById('ns-last')?.value.trim();
  if (!firstName || !lastName) { _modalError('Vor- und Nachname sind Pflichtfelder.'); return; }

  _setBusy(true, 'Anlegen');

  const { data, error } = await supabase
    .from('staff')
    .insert({ first_name: firstName, last_name: lastName,
              kuerzel: document.getElementById('ns-kuerzel')?.value.trim() || null })
    .select('id')
    .single();

  if (error) { _setBusy(false, 'Anlegen'); _modalError('Fehler: ' + error.message); return; }

  closeAdminModal();
  showStaffDetail(data.id);
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
      <td>${s.last_name}</td>
      <td>${s.first_name}</td>
      <td class="mono">${s.kuerzel ?? '—'}</td>
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
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
