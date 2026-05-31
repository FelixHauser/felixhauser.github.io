// iPad detail view — full info card and complete history timeline.

// Event type labels for the history timeline.
const EVENT_LABELS = {
  assignment:      'Zuweisung',
  status_change:   'Statusänderung',
  terms_accepted:  'Nutzungsbedingungen akzeptiert',
  schadenmeldung:  'Schadenmeldung',
  verlustmeldung:  'Verlustmeldung',
  returned:        'Zurückgegeben',
  reassigned:      'Neu zugewiesen',
};

async function renderIpadDetail() {
  const container = document.getElementById('view-container');
  const id = window._currentIpadId;

  if (!id) { routeToHash('ipads'); return; }

  container.innerHTML = `
    <div class="view-header detail-header">
      <button class="btn-back" onclick="history.back()">← Zurück</button>
      <h2 id="detail-title">iPad</h2>
    </div>
    <div id="detail-body"><p class="loading-msg">Wird geladen…</p></div>
  `;

  // Fetch iPad with assigned names
  const { data: ipad, error: ipadError } = await supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date, created_at,
      pupils:assigned_pupil_id (first_name, last_name),
      staff:assigned_staff_id  (first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (ipadError || !ipad) {
    document.getElementById('detail-body').innerHTML =
      '<p class="error-inline">iPad konnte nicht geladen werden.</p>';
    return;
  }

  document.getElementById('detail-title').textContent = ipad.serial_number;

  // Fetch history (newest first)
  const { data: history, error: histError } = await supabase
    .from('ipad_history')
    .select('id, event_type, status, assigned_to, changed_by, changed_at, notes')
    .eq('ipad_id', id)
    .order('changed_at', { ascending: false });

  const historyHtml = buildHistoryHtml(history, histError);

  document.getElementById('detail-body').innerHTML = `
    <!-- Info card -->
    <div class="detail-card">
      <div class="detail-field">
        <span class="detail-key">Seriennummer</span>
        <span class="mono">${ipad.serial_number}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Typ</span>
        <span>${TYPE_LABEL[ipad.ipad_type] ?? ipad.ipad_type}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Speicher</span>
        <span>${ipad.storage_capacity ?? '—'}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Status</span>
        <span>${statusBadge(ipad.status)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Zugewiesen an</span>
        <span>${assignedName(ipad)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Zugewiesen seit</span>
        <span>${ipad.assigned_date ? formatDate(ipad.assigned_date) : '—'}</span>
      </div>
      <div class="detail-field">
        <span class="detail-key">Erfasst am</span>
        <span>${formatDate(ipad.created_at)}</span>
      </div>
    </div>

    <!-- History -->
    <h3 class="section-title" style="margin: 1.5rem 0 0.75rem">Verlauf</h3>
    ${historyHtml}
  `;
}

// Builds the history timeline HTML.
function buildHistoryHtml(history, error) {
  if (error) {
    return `<p class="error-inline">Verlauf konnte nicht geladen werden: ${error.message}</p>`;
  }
  if (!history || history.length === 0) {
    return '<p class="empty-msg">Kein Verlauf vorhanden.</p>';
  }

  const entries = history.map(entry => `
    <div class="timeline-entry">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-top">
          <span class="timeline-event">${EVENT_LABELS[entry.event_type] ?? entry.event_type}</span>
          <span class="timeline-date">${formatDateTime(entry.changed_at)}</span>
        </div>
        ${entry.status     ? `<div class="timeline-detail">Status: ${statusBadge(entry.status)}</div>` : ''}
        ${entry.assigned_to ? `<div class="timeline-detail">Zugewiesen an: <strong>${entry.assigned_to}</strong></div>` : ''}
        ${entry.changed_by  ? `<div class="timeline-detail">Geändert von: ${entry.changed_by}</div>` : ''}
        ${entry.notes       ? `<div class="timeline-notes">${entry.notes}</div>` : ''}
      </div>
    </div>
  `).join('');

  return `<div class="timeline">${entries}</div>`;
}

// ---- Helpers ----

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
