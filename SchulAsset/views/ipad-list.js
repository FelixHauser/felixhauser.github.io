// iPad list view — searchable and filterable table of all iPads.
// Fetches once, then filters in-memory so the UI stays fast.

async function renderIpadList() {
  const container = document.getElementById('view-container');

  // Build status filter options from the shared STATUS_CONFIG.
  const statusOptions = Object.entries(STATUS_CONFIG)
    .map(([key, cfg]) => `<option value="${key}">${cfg.label}</option>`)
    .join('');

  container.innerHTML = `
    <div class="view-header">
      <h2>iPads</h2>
    </div>

    <div class="toolbar">
      <input type="search" id="ipad-search" class="search-input"
             placeholder="Seriennummer oder Name suchen…">
      <select id="filter-status" class="filter-select">
        <option value="">Alle Status</option>
        ${statusOptions}
      </select>
      <select id="filter-type" class="filter-select">
        <option value="">Alle Typen</option>
        <option value="student">Schüler</option>
        <option value="staff">Lehrkraft</option>
      </select>
    </div>

    <div id="ipad-count" class="result-count"></div>
    <div id="ipad-table-wrap"><p class="loading-msg">Wird geladen…</p></div>
  `;

  // Fetch all iPads, joining pupil and staff tables to get the assigned name.
  const { data: ipads, error } = await supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date,
      pupils:assigned_pupil_id (first_name, last_name),
      staff:assigned_staff_id  (first_name, last_name)
    `)
    .order('serial_number');

  if (error) {
    document.getElementById('ipad-table-wrap').innerHTML =
      `<p class="error-inline">Fehler beim Laden der iPads: ${error.message}</p>`;
    return;
  }

  // Store the full list so the filter function can always access it.
  window._allIpads = ipads;

  document.getElementById('ipad-search').addEventListener('input',  applyIpadFilters);
  document.getElementById('filter-status').addEventListener('change', applyIpadFilters);
  document.getElementById('filter-type').addEventListener('change',  applyIpadFilters);

  applyIpadFilters();
}

// Reads the current filter values and re-renders the table.
function applyIpadFilters() {
  const search = document.getElementById('ipad-search').value.trim().toLowerCase();
  const status = document.getElementById('filter-status').value;
  const type   = document.getElementById('filter-type').value;

  const filtered = (window._allIpads || []).filter(ipad => {
    if (status && ipad.status !== status)       return false;
    if (type   && ipad.ipad_type !== type)      return false;
    if (search) {
      const serial = ipad.serial_number.toLowerCase();
      const name   = assignedName(ipad).toLowerCase();
      if (!serial.includes(search) && !name.includes(search)) return false;
    }
    return true;
  });

  renderIpadTable(filtered);
}

// Renders the table (or an empty state) from a filtered array of iPads.
function renderIpadTable(ipads) {
  const countEl = document.getElementById('ipad-count');
  const wrapEl  = document.getElementById('ipad-table-wrap');

  countEl.textContent = `${ipads.length} iPad${ipads.length !== 1 ? 's' : ''}`;

  if (ipads.length === 0) {
    wrapEl.innerHTML = '<p class="empty-msg">Keine iPads gefunden.</p>';
    return;
  }

  const rows = ipads.map(ipad => `
    <tr onclick="showIpadDetail('${ipad.id}')">
      <td class="mono">${ipad.serial_number}</td>
      <td>${TYPE_LABEL[ipad.ipad_type] ?? ipad.ipad_type}</td>
      <td>${ipad.storage_capacity ?? '—'}</td>
      <td>${statusBadge(ipad.status)}</td>
      <td>${assignedName(ipad)}</td>
    </tr>
  `).join('');

  wrapEl.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Seriennummer</th>
            <th>Typ</th>
            <th>Speicher</th>
            <th>Status</th>
            <th>Zugewiesen an</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
