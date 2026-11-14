// Last activity view — recent ipad_history entries across all iPads.

// The event labels are shared with the iPad detail history (EVENT_LABELS in ipad-detail.js).

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
      <h2>Letzte Aktivität</h2>
    </div>
    <div id="activity-body"><p class="loading-msg">Wird geladen…</p></div>
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
      `<p class="error-inline">Fehler beim Laden: ${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    document.getElementById('activity-body').innerHTML =
      `<p class="empty-msg">Noch keine Aktivität.</p>`;
    return;
  }

  const rows = data.map(entry => {
    const color  = ACTIVITY_COLORS[entry.event_type] || '#8e8e93';
    const label  = EVENT_LABELS[entry.event_type] || entry.event_type;
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
          <span class="activity-badge" style="background:${color}20;color:${color}">${escapeHtml(label)}</span>
        </td>
        <td class="mono">${escapeHtml(serial)}</td>
        <td>${escapeHtml(detail)}</td>
        <td>${escapeHtml(by)}</td>
        <td style="white-space:nowrap">${when}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('activity-body').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ereignis</th>
            <th>Seriennummer</th>
            <th>Detail</th>
            <th>Von</th>
            <th>Wann</th>
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
