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

function renderPupilTable(pupils) {
  document.getElementById('pupil-count').textContent =
    `${pupils.length} Schüler${pupils.length !== 1 ? '' : ''}`;

  if (pupils.length === 0) {
    document.getElementById('pupil-table-wrap').innerHTML =
      '<p class="empty-msg">Keine Schüler gefunden.</p>';
    return;
  }

  const rows = pupils.map(p => `
    <tr>
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
