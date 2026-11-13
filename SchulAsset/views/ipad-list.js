// iPad view — dashboard overview + searchable/filterable list.
// Single data fetch; dashboard cards filter the list when clicked.

async function renderIpadList() {
  const container = document.getElementById('view-container');

  const statusOptions = Object.entries(STATUS_CONFIG)
    .map(([key, cfg]) => `<option value="${key}">${cfg.label}</option>`)
    .join('');

  container.innerHTML = `
    <div class="view-header">
      <h2>iPads</h2>
    </div>

    <h3 class="section-title">Dashboard</h3>
    <div id="overview-area"><p class="loading-msg">Wird geladen…</p></div>

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
      <button class="btn-action-detail" onclick="openNewIpadModal()">+ Neues iPad</button>
      <button class="btn-action-detail" onclick="openIpadImportModal()">CSV importieren</button>
    </div>

    <div id="ipad-count" class="result-count"></div>
    <div id="ipad-table-wrap"><p class="loading-msg">Wird geladen…</p></div>
  `;

  // All iPads, paged (a single query would stop at 1000 rows).
  const { data: ipads, error } = await fetchAllRows(() => supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date,
      pupils:assigned_pupil_id (first_name, last_name),
      staff:assigned_staff_id  (first_name, last_name)
    `)
    .order('serial_number'));

  if (error) {
    document.getElementById('overview-area').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${error.message}</p>`;
    document.getElementById('ipad-table-wrap').innerHTML = '';
    return;
  }

  window._allIpads = ipads;

  _renderIpadOverview();

  document.getElementById('ipad-search').addEventListener('input',   applyIpadFilters);
  document.getElementById('filter-status').addEventListener('change', applyIpadFilters);
  document.getElementById('filter-type').addEventListener('change',   applyIpadFilters);

  applyIpadFilters();
}

function _renderIpadOverview() {
  const ipads = window._allIpads || [];
  const counts = {};
  for (const ipad of ipads) {
    counts[ipad.status] = (counts[ipad.status] || 0) + 1;
  }

  const cards = Object.entries(STATUS_CONFIG).map(([key, cfg]) => `
    <div class="stat-card" data-status="${key}" onclick="filterByStatus('${key}')">
      <div class="stat-bar" style="background:${cfg.color}"></div>
      <div class="stat-count">${counts[key] ?? 0}</div>
      <div class="stat-label">${cfg.label}</div>
    </div>
  `).join('');

  document.getElementById('overview-area').innerHTML = `
    <div class="total-banner" style="cursor:pointer" title="Alle anzeigen"
         onclick="filterByStatus('')">
      <span class="total-number">${ipads.length}</span>
      <span class="total-text">iPads gesamt</span>
    </div>
    <div class="stat-grid">${cards}</div>
  `;
}

// Sets the status dropdown and re-filters the list; updates card active state.
function filterByStatus(status) {
  const sel = document.getElementById('filter-status');
  if (!sel) return;
  sel.value = status;
  _syncCardActiveState(status);
  applyIpadFilters(true); // skip syncing cards again
}

function _syncCardActiveState(status) {
  document.querySelectorAll('.stat-card[data-status]').forEach(card => {
    card.classList.toggle('active', card.dataset.status === status && status !== '');
  });
}

// Reads current filter values, re-renders table, keeps card active state in sync.
function applyIpadFilters(skipCardSync) {
  const search = document.getElementById('ipad-search').value.trim().toLowerCase();
  const status = document.getElementById('filter-status').value;
  const type   = document.getElementById('filter-type').value;

  if (!skipCardSync) _syncCardActiveState(status);

  const filtered = (window._allIpads || []).filter(ipad => {
    if (status && ipad.status !== status)  return false;
    if (type   && ipad.ipad_type !== type) return false;
    if (search) {
      const serial = ipad.serial_number.toLowerCase();
      const name   = assignedName(ipad).toLowerCase();
      if (!serial.includes(search) && !name.includes(search)) return false;
    }
    return true;
  });

  renderIpadTable(filtered);
}

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


// ─── Add a single iPad ───────────────────────────────────────

// Opens the "new iPad" dialog (same pattern as new pupil / new staff).
function openNewIpadModal() {
  _openModal('Neues iPad anlegen', `
    <div class="admin-form-group">
      <label>Seriennummer</label>
      <input type="text" id="ni-serial" placeholder="z. B. DMPXYZ123456"
             autocapitalize="characters" spellcheck="false">
    </div>
    <div class="admin-form-group">
      <label>Typ</label>
      <select id="ni-type">
        <option value="student">Schüler</option>
        <option value="staff">Lehrkraft</option>
      </select>
    </div>
    <div class="admin-form-group">
      <label>Speicher</label>
      <select id="ni-storage">
        <option value="64gb">64 GB</option>
        <option value="128gb" selected>128 GB</option>
        <option value="256gb">256 GB</option>
      </select>
    </div>
  `, 'Anlegen', submitNewIpad);
}

// Validates, saves the iPad (status 'available', no assignment), writes the first
// history row and opens the new iPad's detail page.
async function submitNewIpad() {
  // Serial numbers are stored upper case: the portal login and the student RLS
  // policies compare against the upper-case serial number.
  const serial = document.getElementById('ni-serial')?.value.trim().toUpperCase();
  if (!serial) { _modalError('Bitte eine Seriennummer eingeben.'); return; }

  // Friendly duplicate check against the loaded list; the database has the final say (23505).
  const exists = (window._allIpads || []).some(i => i.serial_number.toUpperCase() === serial);
  if (exists) { _modalError(`Die Seriennummer ${serial} existiert bereits.`); return; }

  _setBusy(true, 'Anlegen');

  const { data, error } = await supabase
    .from('ipads')
    .insert({
      serial_number:    serial,
      ipad_type:        document.getElementById('ni-type').value,
      storage_capacity: document.getElementById('ni-storage').value,
      status:           'available',
    })
    .select('id')
    .single();

  if (error) {
    _setBusy(false, 'Anlegen');
    _modalError(error.code === '23505'
      ? `Die Seriennummer ${serial} existiert bereits.`
      : 'Fehler: ' + error.message);
    return;
  }

  // First entry in the append-only history.
  const { error: histError } = await supabase.from('ipad_history').insert({
    ipad_id: data.id, event_type: 'status_change', status: 'available',
    changed_by: _adminName(), changed_at: new Date().toISOString(),
    notes: 'iPad angelegt',
  });
  if (histError) console.error('ipad_history insert failed:', histError);

  closeAdminModal();
  showIpadDetail(data.id);
}
