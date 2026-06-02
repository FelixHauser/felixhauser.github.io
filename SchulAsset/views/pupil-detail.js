// Pupil detail view — info card (editable), current iPad, assignment history.

let _currentPupil = null;

async function renderPupilDetail() {
  const id = window._currentPupilId;
  if (!id) { routeToHash('pupils'); return; }

  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header detail-header">
      <button class="btn-back" onclick="routeToHash('pupils')">← Schüler</button>
      <h2 id="pupil-detail-title">Schüler</h2>
    </div>
    <div id="pupil-detail-body"><p class="loading-msg">Wird geladen…</p></div>
  `;

  const { data: pupil, error } = await supabase
    .from('pupils')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !pupil) {
    document.getElementById('pupil-detail-body').innerHTML =
      '<p class="error-inline">Schüler konnte nicht geladen werden.</p>';
    return;
  }

  _currentPupil = pupil;
  document.getElementById('pupil-detail-title').textContent =
    `${pupil.first_name} ${pupil.last_name}`;

  const fullName = `${pupil.first_name} ${pupil.last_name}`;

  const [{ data: ipad }, { data: history }] = await Promise.all([
    supabase
      .from('ipads')
      .select('id, serial_number, ipad_type, storage_capacity, status')
      .eq('assigned_pupil_id', id)
      .maybeSingle(),
    supabase
      .from('ipad_history')
      .select('id, event_type, changed_at, assigned_to, changed_by, notes, ipad:ipad_id (id, serial_number)')
      .eq('assigned_to', fullName)
      .order('changed_at', { ascending: false }),
  ]);

  _renderPupilBody(pupil, ipad, history || []);
}

function _renderPupilBody(pupil, ipad, history) {
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

  const historyRows = history.map(h => `
    <tr onclick="showIpadDetail('${h.ipad?.id}')">
      <td class="mono">${h.ipad?.serial_number || '—'}</td>
      <td>${EVENT_LABELS[h.event_type] ?? h.event_type}</td>
      <td>${h.changed_by || '—'}</td>
      <td>${formatDate(h.changed_at)}</td>
    </tr>
  `).join('');

  const historyHtml = history.length === 0
    ? '<p class="empty-msg">Kein Verlauf vorhanden.</p>'
    : `<div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Seriennummer</th><th>Ereignis</th><th>Geändert von</th><th>Datum</th>
          </tr></thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>`;

  document.getElementById('pupil-detail-body').innerHTML = `
    ${_pupilInfoCard(pupil)}
    <h3 class="section-title" style="margin:1.25rem 0 0.75rem">Aktuelles iPad</h3>
    ${ipadHtml}
    <h3 class="section-title" style="margin:1.25rem 0 0.75rem">iPad-Verlauf</h3>
    ${historyHtml}
  `;
}

function _pupilInfoCard(pupil, editMode = false) {
  if (editMode) {
    return `
      <div class="detail-card" id="pupil-info-card">
        <div class="detail-field">
          <span class="detail-key">Vorname</span>
          <input class="edit-input" id="edit-first-name" value="${_htmlEsc(pupil.first_name)}">
        </div>
        <div class="detail-field">
          <span class="detail-key">Nachname</span>
          <input class="edit-input" id="edit-last-name" value="${_htmlEsc(pupil.last_name)}">
        </div>
        <div class="detail-field">
          <span class="detail-key">Adresse</span>
          <input class="edit-input" id="edit-address" value="${_htmlEsc(pupil.address ?? '')}">
        </div>
        <div class="detail-field" style="justify-content:flex-end;gap:0.5rem">
          <button class="btn-action-detail" onclick="_cancelPupilEdit()">Abbrechen</button>
          <button class="btn-action-return" onclick="_savePupilEdit('${pupil.id}')">Speichern</button>
        </div>
      </div>`;
  }
  return `
    <div class="detail-card" id="pupil-info-card">
      <div class="detail-field">
        <span class="detail-key">Vorname</span>
        <span>${_htmlEsc(pupil.first_name)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Nachname</span>
        <span>${_htmlEsc(pupil.last_name)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Adresse</span>
        <span>${_htmlEsc(pupil.address ?? '—')}</span>
      </div>
      <div class="detail-field" style="justify-content:flex-end">
        <button class="btn-action-detail" onclick="_editPupilInfo()">Bearbeiten</button>
      </div>
    </div>`;
}

function _editPupilInfo() {
  document.getElementById('pupil-info-card').outerHTML = _pupilInfoCard(_currentPupil, true);
}

function _cancelPupilEdit() {
  document.getElementById('pupil-info-card').outerHTML = _pupilInfoCard(_currentPupil, false);
}

async function _savePupilEdit(id) {
  const firstName = document.getElementById('edit-first-name').value.trim();
  const lastName  = document.getElementById('edit-last-name').value.trim();
  const address   = document.getElementById('edit-address').value.trim();

  if (!firstName || !lastName) {
    alert('Vor- und Nachname sind Pflichtfelder.');
    return;
  }

  const { error } = await supabase
    .from('pupils')
    .update({ first_name: firstName, last_name: lastName, address: address || null })
    .eq('id', id);

  if (error) { alert('Fehler beim Speichern: ' + error.message); return; }

  _currentPupil = { ..._currentPupil, first_name: firstName, last_name: lastName, address };
  document.getElementById('pupil-detail-title').textContent = `${firstName} ${lastName}`;
  document.getElementById('pupil-info-card').outerHTML = _pupilInfoCard(_currentPupil, false);
}
