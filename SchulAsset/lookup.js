// Lookup page (teachers and repair people) — read-only, one iPad at a time.
//
// Step 1: serial number → owner's name only          (database function lookup_ipad)
// Step 2: "Details anzeigen" → everything else        (database function lookup_ipad_details)
//
// The role `teacher` can read NO table directly; these two functions are its only access.
// Nothing on this page changes data. Every database value goes through escapeHtml()
// (escape-html.js) before it is put into HTML.

// ---- Labels (same wording as the admin area; keep in sync with admin.js / ipad-detail.js) ----

const STATUS_CONFIG = {
  available:            { label: 'Verfügbar',              color: '#34c759' },
  terms_pending:        { label: 'Leihvertrag ausstehend', color: '#ff9f0a' },
  handover_pending:     { label: 'Übergabe ausstehend',    color: '#ff9f0a' },
  in_use:               { label: 'In Verwendung',          color: '#007aff' },
  eigenreparatur:       { label: 'Eigenreparatur',         color: '#5856d6' },
  prepared_for_repair:  { label: 'Reparatur vorbereitet',  color: '#ff9500' },
  shipped_for_repair:   { label: 'Eingeschickt',           color: '#ff9500' },
  back_from_repair:     { label: 'Zurück aus Reparatur',   color: '#ff9500' },
  to_be_erased:         { label: 'Zu löschen',             color: '#ffcc00' },
  lost:                 { label: 'Verloren',               color: '#ff3b30' },
  stolen:               { label: 'Gestohlen',              color: '#ff3b30' },
  decommissioned:       { label: 'Ausgemustert',           color: '#8e8e93' },
};

const TYPE_LABEL = { student: 'Schüler', staff: 'Lehrkraft' };

const EVENT_LABELS = {
  assignment:      'Zuweisung',
  status_change:   'Statusänderung',
  terms_accepted:  'Leihvertrag akzeptiert',
  schadenmeldung:  'Schadenmeldung',
  verlustmeldung:  'Verlustmeldung',
  returned:        'Zurückgegeben',
  reassigned:      'Neu zugewiesen',
};

const DAMAGE_LABELS    = { screen: 'Display', water: 'Wasserschaden', other: 'Sonstiges' };
const CONDITION_LABELS = { neuwertig: 'Neuwertig', ohne_maengel: 'Ohne Mängel', mit_maengeln: 'Mit Mängeln' };

// The blank contract (the current template — not necessarily the version the family signed).
const LEIHVERTRAG_TEMPLATE = 'document_templates/Leihvertrag_2.1_fillable.pdf';

// ---- State ----

let _current  = null;   // { ipad_id, serial_number, owner_name } of the result on screen
let _searchId = 0;      // counts searches so a slow, older answer can never overwrite a newer one
let _scanner  = null;

// ---- Small helpers ----

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#8e8e93' };
  return `<span class="badge" style="background:${cfg.color}">${escapeHtml(cfg.label)}</span>`;
}

// A label/value row; the value is plain text and gets escaped here.
function row(key, text) {
  return `<div class="detail-field"><span class="detail-key">${escapeHtml(key)}</span>` +
         `<span class="detail-value">${escapeHtml(text)}</span></div>`;
}

// A label/value row whose value is HTML that was already built safely (badge, link).
function rowHtml(key, html) {
  return `<div class="detail-field"><span class="detail-key">${escapeHtml(key)}</span>` +
         `<span class="detail-value">${html}</span></div>`;
}

function fullName(person) {
  return [person?.first_name, person?.last_name].filter(Boolean).join(' ');
}

// Friendly text for an error coming from the database functions.
function errorText(error) {
  if (/not allowed|permission denied/i.test(error.message || '')) {
    return 'Keine Berechtigung für diese Abfrage.';
  }
  return 'Fehler: ' + (error.message || error);
}

// ---- Page start, logout ----

async function initLookup() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', session.user.id).single();

  // Only teachers (and admins, for testing) belong here; everybody else goes back to the login.
  if (!roleRow || !['teacher', 'admin'].includes(roleRow.role)) {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('lookup-user').textContent = session.user.email;

  const input = document.getElementById('lookup-input');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') lookupSearch(); });
  input.focus();
}

async function lookupLogout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// ---- Step 1: serial number → owner's name ----

function clearDetails() {
  _current = null;
  const details = document.getElementById('lookup-details');
  details.hidden = true;
  details.innerHTML = '';
}

async function lookupSearch() {
  const serial   = document.getElementById('lookup-input').value.trim();
  const resultEl = document.getElementById('lookup-result');
  const myId     = ++_searchId;

  clearDetails();                       // a new search never keeps the previous iPad's data
  if (!serial) { resultEl.innerHTML = ''; return; }

  resultEl.innerHTML = '<p class="loading-msg">Suche…</p>';

  const { data, error } = await supabase.rpc('lookup_ipad', { p_serial: serial });
  if (myId !== _searchId) return;       // a newer search has started

  if (error) {
    resultEl.innerHTML = `<p class="error-inline">${escapeHtml(errorText(error))}</p>`;
    return;
  }
  if (!data) {
    resultEl.innerHTML = '<p class="empty-msg">Kein iPad mit dieser Seriennummer gefunden.</p>';
    return;
  }

  _current = data;
  const owner = data.owner_name;
  resultEl.innerHTML = `
    <div class="result-card">
      <div class="lookup-serial">${escapeHtml(data.serial_number)}</div>
      <p class="lookup-owner ${owner ? '' : 'unassigned'}">${escapeHtml(owner || 'nicht zugewiesen')}</p>
      <div class="lookup-actions">
        <button class="lookup-btn" id="details-btn" onclick="showLookupDetails()">Details anzeigen</button>
        <button class="lookup-btn secondary" onclick="newLookupSearch()">Neue Suche</button>
      </div>
    </div>
  `;
}

// Back to an empty search (clears the result and every detail from the page).
function newLookupSearch() {
  ++_searchId;
  clearDetails();
  document.getElementById('lookup-result').innerHTML = '';
  const input = document.getElementById('lookup-input');
  input.value = '';
  window.scrollTo({ top: 0 });
  input.focus();
}

// ---- Step 2: details (requested only now) ----

async function showLookupDetails() {
  if (!_current) return;
  const ipadId    = _current.ipad_id;
  const detailsEl = document.getElementById('lookup-details');
  const btn       = document.getElementById('details-btn');
  if (btn) btn.disabled = true;

  detailsEl.hidden = false;
  detailsEl.innerHTML = '<p class="loading-msg">Wird geladen…</p>';

  const { data, error } = await supabase.rpc('lookup_ipad_details', { p_ipad_id: ipadId });
  if (!_current || _current.ipad_id !== ipadId) return;   // the user searched for something else meanwhile

  if (error || !data) {
    detailsEl.innerHTML = `<p class="error-inline">${escapeHtml(error ? errorText(error) : 'Keine Daten gefunden.')}</p>`;
    if (btn) btn.disabled = false;
    return;
  }

  detailsEl.innerHTML = buildDetailsHtml(data);
}

function buildDetailsHtml(d) {
  const ipad = d.ipad;

  // iPad
  const ipadCard = `
    <div class="detail-card">
      ${row('Seriennummer', ipad.serial_number)}
      ${row('Typ', TYPE_LABEL[ipad.ipad_type] ?? ipad.ipad_type)}
      ${row('Speicher', ipad.storage_capacity ?? '—')}
      ${rowHtml('Status', statusBadge(ipad.status))}
      ${row('Zugewiesen seit', ipad.assigned_date ? formatDate(ipad.assigned_date) : '—')}
    </div>`;

  // Owner (address only exists for pupils) and guardian
  let ownerRows;
  if (!d.owner) {
    ownerRows = row('Besitzer/in', 'nicht zugewiesen');
  } else {
    ownerRows = row(d.owner.kind === 'staff' ? 'Lehrkraft' : 'Schüler/in', fullName(d.owner));
    if (d.owner.kind === 'pupil') ownerRows += row('Adresse', d.owner.address || '—');
  }
  if (d.guardian) {
    ownerRows += row('Erziehungsberechtigte/r', fullName(d.guardian) || '—');
    ownerRows += row('Adresse (Erz.-ber.)', d.guardian.address || '—');
  }
  const ownerCard = `<div class="detail-card">${ownerRows}</div>`;

  // Leihvertrag: acceptance and the blank template
  const termsRows = d.terms
    ? row('Akzeptiert am', formatDate(d.terms.accepted_at)) + row('Version', d.terms.terms_version ?? '—')
    : row('Leihvertrag', 'noch nicht akzeptiert');
  const termsCard = `
    <div class="detail-card">
      ${termsRows}
      ${rowHtml('Vorlage', `<a class="lookup-link" href="${LEIHVERTRAG_TEMPLATE}" target="_blank" rel="noopener">Aktuelle Vorlage ansehen (PDF)</a>`)}
    </div>`;

  // Übergabeprotokoll, as text
  let uebergabeCard;
  if (d.uebergabe) {
    const u = d.uebergabe;
    uebergabeCard = `<div class="detail-card">
      ${row('Zustand', CONDITION_LABELS[u.condition] ?? u.condition ?? '—')}
      ${u.maengel ? row('Mängel', u.maengel) : ''}
      ${u.notes   ? row('Weiteres Zubehör', u.notes) : ''}
      ${row('Ausgestellt von', u.kurzel || '—')}
      ${row('Erstellt am', formatDate(u.created_at))}
      ${row('Bestätigt', u.accepted_at ? formatDate(u.accepted_at) : 'noch nicht bestätigt')}
    </div>`;
  } else {
    uebergabeCard = '<p class="lookup-note">Kein Übergabeprotokoll vorhanden.</p>';
  }

  // Verlauf (history + Schadenmeldungen) behind its own button
  const schaden = d.schaden || [];
  const history = d.history || [];

  return `
    <div class="lookup-actions" style="margin:0 0 0.8rem">
      <button class="lookup-btn secondary" onclick="newLookupSearch()">← Neue Suche</button>
    </div>

    <h2 class="lookup-section-title">iPad</h2>
    ${ipadCard}

    <h2 class="lookup-section-title">Besitzer/in</h2>
    ${ownerCard}

    <h2 class="lookup-section-title">Leihvertrag</h2>
    ${termsCard}

    <h2 class="lookup-section-title">Übergabeprotokoll</h2>
    ${uebergabeCard}

    <div class="lookup-actions">
      <button class="lookup-btn" id="verlauf-btn" onclick="toggleVerlauf()">Verlauf anzeigen</button>
    </div>
    <div id="lookup-verlauf" hidden>
      <h2 class="lookup-section-title">Schadenmeldungen</h2>
      ${buildSchadenHtml(schaden)}
      <h2 class="lookup-section-title">Verlauf</h2>
      ${buildHistoryHtml(history)}
    </div>
  `;
}

function toggleVerlauf() {
  const box = document.getElementById('lookup-verlauf');
  const btn = document.getElementById('verlauf-btn');
  box.hidden = !box.hidden;
  btn.textContent = box.hidden ? 'Verlauf anzeigen' : 'Verlauf ausblenden';
}

function buildSchadenHtml(list) {
  if (list.length === 0) return '<p class="lookup-note">Keine Schadenmeldungen vorhanden.</p>';

  const items = list.map(s => {
    const state = s.resolved_at ? `erledigt am ${formatDate(s.resolved_at)}` : 'offen';
    const meta = [
      `Gemeldet von ${s.filed_by || '—'} am ${formatDate(s.filed_at)}`,
      s.datum_eingetreten ? `Eingetreten: ${formatDate(s.datum_eingetreten)}` : '',
      s.datum_entdeckt    ? `Entdeckt: ${formatDate(s.datum_entdeckt)}` : '',
      s.perpetrator       ? `Verursacher/in: ${s.perpetrator}` : '',
    ].filter(Boolean).join(' · ');
    return `
      <div class="lookup-damage">
        <div class="lookup-damage-title">
          <span>${escapeHtml(DAMAGE_LABELS[s.damage_type] ?? s.damage_type)}</span>
          <span>${escapeHtml(state)}</span>
        </div>
        <div class="lookup-damage-desc">${escapeHtml(s.description || '—')}</div>
        <div class="lookup-damage-meta">${escapeHtml(meta)}</div>
      </div>`;
  }).join('');

  return `<div class="detail-card">${items}</div>`;
}

function buildHistoryHtml(history) {
  if (history.length === 0) return '<p class="lookup-note">Kein Verlauf vorhanden.</p>';

  const entries = history.map(e => `
    <div class="timeline-entry">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-top">
          <span class="timeline-event">${escapeHtml(EVENT_LABELS[e.event_type] ?? e.event_type)}</span>
          <span class="timeline-date">${escapeHtml(formatDateTime(e.changed_at))}</span>
        </div>
        ${e.status      ? `<div class="timeline-detail">Status: ${statusBadge(e.status)}</div>` : ''}
        ${e.assigned_to ? `<div class="timeline-detail">Zugewiesen an: <strong>${escapeHtml(e.assigned_to)}</strong></div>` : ''}
        ${e.changed_by  ? `<div class="timeline-detail">Geändert von: ${escapeHtml(e.changed_by)}</div>` : ''}
        ${e.notes       ? `<div class="timeline-notes">${escapeHtml(e.notes)}</div>` : ''}
      </div>
    </div>`).join('');

  return `<div class="timeline">${entries}</div>`;
}

// ---- QR scanner (the code contains the serial number, as in the admin Schnellsuche) ----

function openQrScanner() {
  document.getElementById('qr-modal').hidden = false;
  _scanner = new Html5Qrcode('qr-reader');
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  _scanner.start({ facingMode: 'environment' }, config, onQrSuccess, () => {})
    .catch(() => {
      _scanner.start({ facingMode: 'user' }, config, onQrSuccess, () => {});
    });
}

function onQrSuccess(decodedText) {
  document.getElementById('lookup-input').value = decodedText;
  closeQrScanner();
  lookupSearch();
}

function closeQrScanner() {
  document.getElementById('qr-modal').hidden = true;
  if (_scanner) {
    _scanner.stop()
      .then(() => { _scanner.clear(); _scanner = null; })
      .catch(() => { _scanner = null; });
  }
}
