// Staff detail view — info card (editable) + current iPad.

let _currentStaff = null;

async function renderStaffDetail() {
  const id = window._currentStaffId;
  if (!id) { routeToHash('staff'); return; }

  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header detail-header">
      <button class="btn-back" onclick="routeToHash('staff')">← Lehrkräfte</button>
      <h2 id="staff-detail-title">Lehrkraft</h2>
    </div>
    <div id="staff-detail-body"><p class="loading-msg">Wird geladen…</p></div>
  `;

  const [{ data: staff, error }, { data: ipad }] = await Promise.all([
    supabase.from('staff').select('*').eq('id', id).single(),
    supabase
      .from('ipads')
      .select('id, serial_number, ipad_type, storage_capacity, status')
      .eq('assigned_staff_id', id)
      .maybeSingle(),
  ]);

  if (error || !staff) {
    document.getElementById('staff-detail-body').innerHTML =
      '<p class="error-inline">Lehrkraft konnte nicht geladen werden.</p>';
    return;
  }

  _currentStaff = staff;
  document.getElementById('staff-detail-title').textContent =
    `${staff.first_name} ${staff.last_name}`;

  _renderStaffBody(staff, ipad);
}

function _renderStaffBody(staff, ipad) {
  const ipadHtml = ipad ? `
    <div class="detail-card">
      <div class="detail-field">
        <span class="detail-key">Seriennummer</span>
        <button class="btn-link mono" onclick="showIpadDetail('${ipad.id}')">${ipad.serial_number}</button>
      </div>
      <div class="detail-field">
        <span class="detail-key">Status</span>
        <span>${statusBadge(ipad.status)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Typ / Speicher</span>
        <span>${TYPE_LABEL[ipad.ipad_type] ?? ipad.ipad_type} · ${ipad.storage_capacity ?? '—'}</span>
      </div>
    </div>
  ` : '<p class="empty-msg">Kein iPad zugewiesen.</p>';

  document.getElementById('staff-detail-body').innerHTML = `
    ${_staffInfoCard(staff)}
    <h3 class="section-title" style="margin:1.25rem 0 0.75rem">Aktuelles iPad</h3>
    ${ipadHtml}
  `;
}

function _staffInfoCard(staff, editMode = false) {
  if (editMode) {
    return `
      <div class="detail-card" id="staff-info-card">
        <div class="detail-field">
          <span class="detail-key">Vorname</span>
          <input class="edit-input" id="edit-first-name" value="${_htmlEsc(staff.first_name)}">
        </div>
        <div class="detail-field">
          <span class="detail-key">Nachname</span>
          <input class="edit-input" id="edit-last-name" value="${_htmlEsc(staff.last_name)}">
        </div>
        <div class="detail-field">
          <span class="detail-key">Kürzel</span>
          <input class="edit-input" id="edit-kuerzel" value="${_htmlEsc(staff.kuerzel ?? '')}">
        </div>
        <div class="detail-field" style="justify-content:flex-end;gap:0.5rem">
          <button class="btn-action-detail" onclick="_cancelStaffEdit()">Abbrechen</button>
          <button class="btn-action-return" onclick="_saveStaffEdit('${staff.id}')">Speichern</button>
        </div>
      </div>`;
  }
  return `
    <div class="detail-card" id="staff-info-card">
      <div class="detail-field">
        <span class="detail-key">Vorname</span>
        <span>${_htmlEsc(staff.first_name)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Nachname</span>
        <span>${_htmlEsc(staff.last_name)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Kürzel</span>
        <span class="mono">${_htmlEsc(staff.kuerzel ?? '—')}</span>
      </div>
      <div class="detail-field" style="justify-content:flex-end">
        <button class="btn-action-detail" onclick="_editStaffInfo()">Bearbeiten</button>
      </div>
    </div>`;
}

function _editStaffInfo() {
  document.getElementById('staff-info-card').outerHTML = _staffInfoCard(_currentStaff, true);
}

function _cancelStaffEdit() {
  document.getElementById('staff-info-card').outerHTML = _staffInfoCard(_currentStaff, false);
}

async function _saveStaffEdit(id) {
  const firstName = document.getElementById('edit-first-name').value.trim();
  const lastName  = document.getElementById('edit-last-name').value.trim();
  const kuerzel   = document.getElementById('edit-kuerzel').value.trim();

  if (!firstName || !lastName) {
    alert('Vor- und Nachname sind Pflichtfelder.');
    return;
  }

  const { error } = await supabase
    .from('staff')
    .update({ first_name: firstName, last_name: lastName, kuerzel: kuerzel || null })
    .eq('id', id);

  if (error) { alert('Fehler beim Speichern: ' + error.message); return; }

  _currentStaff = { ..._currentStaff, first_name: firstName, last_name: lastName, kuerzel };
  document.getElementById('staff-detail-title').textContent = `${firstName} ${lastName}`;
  document.getElementById('staff-info-card').outerHTML = _staffInfoCard(_currentStaff, false);
}
