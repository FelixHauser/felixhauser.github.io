// Last activity view — recent ipad_history entries across all iPads.

const ACTIVITY_LABELS = {
  assignment:     'Assigned',
  status_change:  'Status changed',
  terms_accepted: 'Terms accepted',
  schadenmeldung: 'Damage reported',
  verlustmeldung: 'Loss reported',
  returned:       'Returned',
  reassigned:     'Reassigned',
};

const ACTIVITY_COLORS = {
  assignment:     '#00B0B9',
  status_change:  '#8e8e93',
  terms_accepted: '#007aff',
  schadenmeldung: '#ff9500',
  verlustmeldung: '#ff3b30',
  returned:       '#34c759',
  reassigned:     '#00B0B9',
};

async function renderActivity() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header">
      <h2>Last activity</h2>
    </div>
    <div id="activity-body"><p class="loading-msg">Loading…</p></div>
  `;

  const { data, error } = await supabase
    .from('ipad_history')
    .select(`
      id, event_type, status, assigned_to, changed_by, changed_at, notes,
      ipad:ipad_id (id, serial_number)
    `)
    .order('changed_at', { ascending: false })
    .limit(50);

  if (error) {
    document.getElementById('activity-body').innerHTML =
      `<p class="error-inline">Failed to load: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    document.getElementById('activity-body').innerHTML =
      `<p class="empty-msg">No activity yet.</p>`;
    return;
  }

  const rows = data.map(entry => {
    const color  = ACTIVITY_COLORS[entry.event_type] || '#8e8e93';
    const label  = ACTIVITY_LABELS[entry.event_type] || entry.event_type;
    const serial = entry.ipad?.serial_number || '—';
    const ipadId = entry.ipad?.id || '';
    const when   = _activityFmtDate(entry.changed_at);
    const by     = entry.changed_by || '—';
    const detail = entry.assigned_to || entry.status
      ? (entry.assigned_to ? `→ ${entry.assigned_to}` : (entry.status ? STATUS_CONFIG[entry.status]?.label || entry.status : ''))
      : '';

    return `
      <tr onclick="showIpadDetail('${ipadId}')">
        <td>
          <span class="activity-badge" style="background:${color}20;color:${color}">${label}</span>
        </td>
        <td class="mono">${serial}</td>
        <td>${detail}</td>
        <td>${by}</td>
        <td style="white-space:nowrap">${when}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('activity-body').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Serial number</th>
            <th>Detail</th>
            <th>By</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function _activityFmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
