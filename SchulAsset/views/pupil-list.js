// Pupil list view — searchable table of all pupils.

async function renderPupilList() {
  const container = document.getElementById('view-container');

  container.innerHTML = `
    <div class="view-header">
      <h2>Schüler</h2>
    </div>
    <div class="toolbar">
      <input type="search" id="pupil-search" class="search-input"
             placeholder="Name suchen…">
      <button class="btn-action-detail" onclick="openNewPupilModal()">+ Neuer Schüler</button>
    </div>
    <div id="pupil-count" class="result-count"></div>
    <div id="pupil-table-wrap"><p class="loading-msg">Wird geladen…</p></div>
  `;

  const { data: pupils, error } = await supabase
    .from('pupils')
    .select('id, first_name, last_name, address, created_at')
    .order('last_name')
    .order('first_name');

  if (error) {
    document.getElementById('pupil-table-wrap').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${error.message}</p>`;
    return;
  }

  window._allPupils = pupils;

  document.getElementById('pupil-search').addEventListener('input', applyPupilFilter);
  applyPupilFilter();
}

function applyPupilFilter() {
  const search = document.getElementById('pupil-search').value.trim().toLowerCase();

  const filtered = (window._allPupils || []).filter(p => {
    if (!search) return true;
    const full = `${p.last_name} ${p.first_name}`.toLowerCase();
    return full.includes(search);
  });

  renderPupilTable(filtered);
}

function openNewPupilModal() {
  _openModal('Neuen Schüler anlegen', `
    <div class="admin-form-group">
      <label>Vorname</label>
      <input type="text" id="np-first" placeholder="Vorname">
    </div>
    <div class="admin-form-group">
      <label>Nachname</label>
      <input type="text" id="np-last" placeholder="Nachname">
    </div>
    <div class="admin-form-group">
      <label>Adresse (optional)</label>
      <input type="text" id="np-address" placeholder="Straße, PLZ Ort">
    </div>
  `, 'Anlegen', submitNewPupil);
}

async function submitNewPupil() {
  const firstName = document.getElementById('np-first')?.value.trim();
  const lastName  = document.getElementById('np-last')?.value.trim();
  if (!firstName || !lastName) { _modalError('Vor- und Nachname sind Pflichtfelder.'); return; }

  _setBusy(true, 'Anlegen');

  const { data, error } = await supabase
    .from('pupils')
    .insert({ first_name: firstName, last_name: lastName,
              address: document.getElementById('np-address')?.value.trim() || null })
    .select('id')
    .single();

  if (error) { _setBusy(false, 'Anlegen'); _modalError('Fehler: ' + error.message); return; }

  closeAdminModal();
  showPupilDetail(data.id);
}

function renderPupilTable(pupils) {
  document.getElementById('pupil-count').textContent =
    `${pupils.length} Schüler${pupils.length !== 1 ? '' : ''}`;

  if (pupils.length === 0) {
    document.getElementById('pupil-table-wrap').innerHTML =
      '<p class="empty-msg">Keine Schüler gefunden.</p>';
    return;
  }

  const rows = pupils.map(p => `
    <tr onclick="showPupilDetail('${p.id}')">
      <td>${p.last_name}</td>
      <td>${p.first_name}</td>
      <td>${p.address ?? '—'}</td>
    </tr>
  `).join('');

  document.getElementById('pupil-table-wrap').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nachname</th>
            <th>Vorname</th>
            <th>Adresse</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
