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

  // Fetch iPad with assigned names (address needed for document generation)
  const { data: ipad, error: ipadError } = await supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date, created_at,
      assigned_pupil_id, assigned_staff_id,
      pupils:assigned_pupil_id (first_name, last_name, address),
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
  window._detailIpad = ipad; // stored for document downloads

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

    <!-- Action buttons -->
    ${buildDetailActions(ipad)}

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

  const DOWNLOADABLE = {
    terms_accepted: 'Leihvertrag herunterladen',
    schadenmeldung: 'Schadenmeldung herunterladen',
    verlustmeldung: 'Verlustmeldung herunterladen',
  };

  const entries = history.map(entry => {
    const dlLabel = DOWNLOADABLE[entry.event_type];
    const dlBtn   = dlLabel
      ? `<button class="btn-history-download"
           onclick="downloadHistoryDoc('${entry.event_type}', '${entry.changed_at}')">
           ↓ ${dlLabel}
         </button>`
      : '';

    return `
      <div class="timeline-entry">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-top">
            <span class="timeline-event">${EVENT_LABELS[entry.event_type] ?? entry.event_type}</span>
            <span class="timeline-date">${formatDateTime(entry.changed_at)}</span>
          </div>
          ${entry.status      ? `<div class="timeline-detail">Status: ${statusBadge(entry.status)}</div>` : ''}
          ${entry.assigned_to ? `<div class="timeline-detail">Zugewiesen an: <strong>${entry.assigned_to}</strong></div>` : ''}
          ${entry.changed_by  ? `<div class="timeline-detail">Geändert von: ${entry.changed_by}</div>` : ''}
          ${entry.notes       ? `<div class="timeline-notes">${entry.notes}</div>` : ''}
          ${dlBtn}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="timeline">${entries}</div>`;
}

// ---- Document downloads from history ----

async function downloadHistoryDoc(type, changedAt) {
  const ipad = window._detailIpad;
  if (!ipad) return;

  // Guardian data is stored in the most recent terms_acceptance row.
  const { data: terms } = await supabase
    .from('terms_acceptance')
    .select('accepted_at, terms_version, erz_first_name, erz_last_name, erz_address')
    .eq('ipad_id', ipad.id)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    if (type === 'terms_accepted') {
      // Use the specific terms row that matches this history entry.
      const { data: row } = await supabase
        .from('terms_acceptance')
        .select('accepted_at, terms_version, erz_first_name, erz_last_name, erz_address')
        .eq('ipad_id', ipad.id)
        .eq('accepted_at', changedAt)
        .maybeSingle();

      const t = row || terms;
      await generateLeihvertrag({
        first_name:     ipad.pupils?.first_name,
        last_name:      ipad.pupils?.last_name,
        address:        ipad.pupils?.address,
        serial_number:  ipad.serial_number,
        erz_first_name: t?.erz_first_name,
        erz_last_name:  t?.erz_last_name,
        erz_address:    t?.erz_address,
        accepted_at:    t?.accepted_at,
        terms_version:  t?.terms_version,
      });

    } else if (type === 'schadenmeldung') {
      const { data: row } = await supabase
        .from('schadenmeldung')
        .select('*')
        .eq('ipad_id', ipad.id)
        .eq('filed_at', changedAt)
        .maybeSingle();

      if (!row) { alert('Datensatz nicht gefunden.'); return; }

      await generateSchadenmeldung({
        serial_number:     ipad.serial_number,
        last_name:         ipad.pupils?.last_name,
        first_name:        ipad.pupils?.first_name,
        damage_type:       row.damage_type,
        description:       row.description,
        datum_eingetreten: row.datum_eingetreten,
        datum_entdeckt:    row.datum_entdeckt,
        perpetrator:       row.perpetrator,
        erz_first_name:    terms?.erz_first_name,
        erz_last_name:     terms?.erz_last_name,
        erz_address:       terms?.erz_address,
        filed_at:          row.filed_at,
      });

    } else if (type === 'verlustmeldung') {
      const { data: row } = await supabase
        .from('verlustmeldung')
        .select('*')
        .eq('ipad_id', ipad.id)
        .eq('filed_at', changedAt)
        .maybeSingle();

      if (!row) { alert('Datensatz nicht gefunden.'); return; }

      generateVerlustmeldung({
        serial_number:        ipad.serial_number,
        last_name:            ipad.pupils?.last_name,
        first_name:           ipad.pupils?.first_name,
        date_of_loss:         row.date_of_loss,
        circumstances:        row.circumstances,
        ort_verlust:          row.ort_verlust,
        datum_bemerkt:        row.datum_bemerkt,
        police_report_number: row.police_report_number,
        notitzen:             row.notitzen,
        erz_first_name:       terms?.erz_first_name,
        erz_last_name:        terms?.erz_last_name,
        erz_address:          terms?.erz_address,
        filed_at:             row.filed_at,
      });
    }
  } catch (e) {
    console.error('Download error:', e);
    alert('Download fehlgeschlagen: ' + (e.message || e));
  }
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

// ════════════════════════════════════════════════════════════
// ADMIN WRITE ACTIONS
// ════════════════════════════════════════════════════════════

// ─── Modal infrastructure ────────────────────────────────────

// Inject the shared modal container once when the script loads.
(function () {
  const el = document.createElement('div');
  el.id        = 'admin-modal';
  el.className = 'admin-modal-backdrop';
  el.hidden    = true;
  el.innerHTML = `
    <div class="admin-modal-card">
      <div class="admin-modal-header">
        <span id="admin-modal-title" class="admin-modal-title"></span>
        <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
      </div>
      <div id="admin-modal-body" class="admin-modal-body"></div>
      <div id="admin-modal-error" class="admin-modal-error" hidden></div>
      <div class="admin-modal-footer">
        <button class="btn-secondary" onclick="closeAdminModal()">Abbrechen</button>
        <button class="btn-primary" id="admin-modal-submit">Bestätigen</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
}());

function _openModal(title, bodyHtml, submitLabel, submitFn) {
  document.getElementById('admin-modal-title').textContent = title;
  document.getElementById('admin-modal-body').innerHTML    = bodyHtml;
  const btn = document.getElementById('admin-modal-submit');
  btn.textContent = submitLabel;
  btn.disabled    = false;
  btn.onclick     = submitFn;
  const err = document.getElementById('admin-modal-error');
  err.hidden      = true;
  err.textContent = '';
  document.getElementById('admin-modal').hidden = false;
}

function closeAdminModal() {
  document.getElementById('admin-modal').hidden = true;
}

function _modalError(msg) {
  const el = document.getElementById('admin-modal-error');
  el.textContent = msg;
  el.hidden = false;
}

function _setBusy(busy, idleLabel) {
  const btn = document.getElementById('admin-modal-submit');
  btn.disabled    = busy;
  btn.textContent = busy ? 'Wird gespeichert…' : idleLabel;
}

function _adminName() {
  return document.getElementById('user-email')?.textContent || 'Admin';
}

// ─── Action buttons ──────────────────────────────────────────

function buildDetailActions(ipad) {
  const isAssigned      = ipad.assigned_pupil_id || ipad.assigned_staff_id;
  const isAssignedPupil = !!ipad.assigned_pupil_id;
  return `
    <div class="detail-actions">
      <button class="btn-action-detail" onclick="openAssignModal()">Zuweisen</button>
      ${isAssigned
        ? `<button class="btn-action-detail btn-action-return" onclick="openRemoveOwnerModal()">Zuweisung aufheben</button>`
        : ''}
      ${isAssignedPupil
        ? `<button class="btn-action-detail" onclick="openUebergabeModal()">Übergabeprotokoll</button>`
        : ''}
      ${isAssignedPupil
        ? `<button class="btn-action-detail" onclick="openRueckgabeModal()">Rückgabeprotokoll</button>`
        : ''}
      <button class="btn-action-detail" onclick="openStatusModal()">Status ändern</button>
      <button class="btn-action-detail btn-action-damage" onclick="openAdminSchadenModal()">Schadenmeldung</button>
      <button class="btn-action-detail btn-action-loss" onclick="openAdminVerlustModal()">Verlustmeldung</button>
    </div>
  `;
}

// ─── 1. Assign ───────────────────────────────────────────────

async function openAssignModal() {
  _openModal('iPad zuweisen', `
    <div class="admin-form-group">
      <label>Zuweisen an</label>
      <select id="md-type" onchange="_loadPersonList()">
        <option value="pupil">Schüler/in</option>
        <option value="staff">Lehrkraft</option>
      </select>
    </div>
    <div class="admin-form-group">
      <label>Person</label>
      <select id="md-person"><option value="">Wird geladen…</option></select>
    </div>
  `, 'Zuweisen', submitAssign);
  await _loadPersonList();
}

async function _loadPersonList() {
  const type      = document.getElementById('md-type')?.value;
  const personSel = document.getElementById('md-person');
  const section   = document.getElementById('md-uebergabe-section');
  if (!personSel) return;
  if (section) section.hidden = (type !== 'pupil');
  personSel.innerHTML = '<option value="">Wird geladen…</option>';

  if (type === 'pupil') {
    const { data } = await supabase.from('pupils').select('id,first_name,last_name').order('last_name');
    personSel.innerHTML = '<option value="">— Bitte wählen —</option>' +
      (data || []).map(p => `<option value="${p.id}">${p.last_name}, ${p.first_name}</option>`).join('');
  } else {
    const { data } = await supabase.from('staff').select('id,first_name,last_name,kuerzel').order('last_name');
    personSel.innerHTML = '<option value="">— Bitte wählen —</option>' +
      (data || []).map(s => `<option value="${s.id}">${s.last_name}, ${s.first_name} (${s.kuerzel})</option>`).join('');
  }
}

// Invalidates all active terms_acceptance rows for an iPad.
// Called whenever an iPad is freed (return, status change, or reassignment).
async function _invalidateTerms(ipadId, now) {
  await supabase.from('terms_acceptance')
    .update({ invalidated_at: now })
    .eq('ipad_id', ipadId)
    .is('invalidated_at', null);
}

function _toggleRow(selectId, showValue, rowId, showValue2) {
  const val = document.getElementById(selectId)?.value;
  const row = document.getElementById(rowId);
  if (row) row.hidden = (val !== showValue && val !== showValue2);
}

async function submitAssign() {
  const type     = document.getElementById('md-type')?.value;
  const personId = document.getElementById('md-person')?.value;
  if (!personId) { _modalError('Bitte eine Person auswählen.'); return; }

  _setBusy(true, 'Zuweisen');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();

  const { data: person } = type === 'pupil'
    ? await supabase.from('pupils').select('first_name,last_name,address').eq('id', personId).single()
    : await supabase.from('staff').select('first_name,last_name,kuerzel').eq('id', personId).single();

  const personName = person ? `${person.first_name} ${person.last_name}` : personId;

  const update = type === 'pupil'
    ? { assigned_pupil_id: personId, assigned_staff_id: null, assigned_date: now, status: 'in_use' }
    : { assigned_staff_id: personId, assigned_pupil_id: null, assigned_date: now, status: 'in_use' };

  const { error } = await supabase.from('ipads').update(update).eq('id', ipad.id);
  if (error) { _setBusy(false, 'Zuweisen'); _modalError('Fehler: ' + error.message); return; }

  await _invalidateTerms(ipad.id, now);

  await supabase.from('ipad_history').insert({
    ipad_id: ipad.id, event_type: 'assignment', status: 'in_use',
    assigned_to: personName, changed_by: adminName, changed_at: now,
    notes: `Zugewiesen an: ${personName}`,
  });

  // ── Create / reset the iPad portal account ──────────────────
  // Only needed for pupil assignments — staff don't use the portal.
  if (type === 'pupil') {
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'create-ipad-account',
      { body: { serial_number: ipad.serial_number } }
    )

    if (fnError || !fnData?.password) {
      // Assignment was saved — just warn, don't block.
      console.error('Account function error:', fnError || fnData)
      closeAdminModal();
      renderIpadDetail();
      alert('Zuweisung gespeichert, aber Passwort konnte nicht generiert werden.\nBitte manuell in Supabase Auth nachsehen.');
      return;
    }

    // Show the password prominently — admin must note it down for the family.
    document.getElementById('admin-modal-title').textContent = 'Zugang für Schülerportal';
    document.getElementById('admin-modal-body').innerHTML = `
      <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1.25rem">
        Das iPad wurde <strong>${personName}</strong> zugewiesen.
        Gib dem/der Schüler/in folgende Zugangsdaten für das Schülerportal:
      </p>
      <div style="background:#F6F9FC;border:1.5px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:0.75rem">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.4rem">Benutzername (Seriennummer)</div>
        <div style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--text-primary)">${ipad.serial_number}</div>
      </div>
      <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:8px;padding:1rem">
        <div style="font-size:0.72rem;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.4rem">Passwort (einmalig anzeigen)</div>
        <div style="font-family:monospace;font-size:1.4rem;font-weight:700;color:#15803d;letter-spacing:1px">${fnData.password}</div>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.85rem">
        Das Passwort wird nicht gespeichert. Notiere es jetzt und gib es an die Familie weiter.
      </p>
    `;
    document.getElementById('admin-modal-error').hidden = true;
    const footer = document.querySelector('.admin-modal-footer');
    footer.innerHTML = `<button class="btn-primary" onclick="closeAdminModal(); renderIpadDetail()">Verstanden — Fenster schließen</button>`;
    return;
  }

  closeAdminModal();
  renderIpadDetail();
}

// ─── 2. Remove owner ─────────────────────────────────────────
// Clears the assignment, resets the portal password, invalidates terms.
// Does NOT create a Rückgabeprotokoll — that is a separate explicit action.

async function openRemoveOwnerModal() {
  const ipad     = window._detailIpad;
  const prevName = assignedName(ipad);

  // Check the state of the Rückgabeprotokoll before showing the confirmation.
  const { data: rg } = await supabase
    .from('rueckgabeprotokoll')
    .select('accepted_at')
    .eq('ipad_id', ipad.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let warningHtml = '';

  if (!rg) {
    warningHtml = `
      <div class="admin-modal-warn">
        ⚠️ Kein Rückgabeprotokoll vorhanden.<br>
        Bitte erstelle zuerst ein Rückgabeprotokoll und warte auf die Unterschrift
        des Schülers / der Schülerin, bevor du die Zuweisung aufhebst.
      </div>`;
  } else if (!rg.accepted_at) {
    warningHtml = `
      <div class="admin-modal-warn">
        ⚠️ Das Rückgabeprotokoll wurde noch nicht unterschrieben.<br>
        Warte auf die digitale Bestätigung durch den Schüler / die Schülerin,
        bevor du die Zuweisung aufhebst.
      </div>`;
  } else {
    warningHtml = `
      <div class="admin-modal-ok">
        ✓ Rückgabeprotokoll wurde unterschrieben.
      </div>`;
  }

  _openModal('Zuweisung aufheben', `
    ${warningHtml}
    <p style="font-size:0.9rem;margin-top:0.9rem">
      Zuweisung von <strong>${prevName}</strong> aufheben?<br>
      <span style="color:var(--text-muted);font-size:0.82rem">
        Der Portalzugang wird gesperrt und die Nutzungsbedingungen werden zurückgesetzt.
      </span>
    </p>
  `, 'Trotzdem aufheben', submitRemoveOwner);
}

async function submitRemoveOwner() {
  _setBusy(true, 'Zuweisung aufheben');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();
  const prevName  = assignedName(ipad);

  const { error } = await supabase.from('ipads')
    .update({ assigned_pupil_id: null, assigned_staff_id: null })
    .eq('id', ipad.id);
  if (error) { _setBusy(false, 'Zuweisung aufheben'); _modalError('Fehler: ' + error.message); return; }

  await _invalidateTerms(ipad.id, now);

  supabase.functions.invoke('create-ipad-account', { body: { serial_number: ipad.serial_number } })
    .catch(e => console.warn('Password reset failed:', e));

  await supabase.from('ipad_history').insert({
    ipad_id: ipad.id, event_type: 'returned', status: ipad.status,
    changed_by: adminName, changed_at: now,
    notes: `Zuweisung aufgehoben: ${prevName}`,
  });

  closeAdminModal();
  renderIpadDetail();
}

// ─── 3. Übergabeprotokoll ─────────────────────────────────────
// Admin creates this explicitly when physically handing over the iPad.
// The pupil then signs it on the portal.

function openUebergabeModal() {
  const adminName = _adminName();
  _openModal('Übergabeprotokoll erstellen', `
    <div class="admin-form-group">
      <label>Zustand</label>
      <select id="md-ue-condition" onchange="_toggleRow('md-ue-condition','mit_maengeln','md-ue-maengel-row')">
        <option value="neuwertig">Neuwertig</option>
        <option value="ohne_maengel">Ohne Mängel</option>
        <option value="mit_maengeln">Mit folgenden Mängeln</option>
      </select>
    </div>
    <div class="admin-form-group" id="md-ue-maengel-row" hidden>
      <label>Mängelbeschreibung</label>
      <textarea id="md-ue-maengel" rows="3"></textarea>
    </div>
    <div class="admin-form-group">
      <label>Weiteres Zubehör (optional)</label>
      <input type="text" id="md-ue-notes" placeholder="z. B. Apple Pencil, Hülle">
    </div>
    <div class="admin-form-group">
      <label>Ausgehändigt von (Kürzel)</label>
      <input type="text" id="md-ue-kurzel" value="${adminName.split('@')[0]}">
    </div>
  `, 'Protokoll erstellen', submitUebergabe);
}

async function submitUebergabe() {
  _setBusy(true, 'Protokoll erstellen');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();
  const pupilName = assignedName(ipad);
  const condition = document.getElementById('md-ue-condition')?.value || 'neuwertig';

  const { error } = await supabase.from('uebergabeprotokoll').insert({
    ipad_id:       ipad.id,
    serial_number: ipad.serial_number,
    pupil_name:    pupilName,
    kurzel:        document.getElementById('md-ue-kurzel')?.value.trim() || adminName.split('@')[0],
    condition,
    maengel:       condition === 'mit_maengeln' ? (document.getElementById('md-ue-maengel')?.value.trim() || null) : null,
    notes:         document.getElementById('md-ue-notes')?.value.trim() || null,
  });

  if (error) { _setBusy(false, 'Protokoll erstellen'); _modalError('Fehler: ' + error.message); return; }

  await supabase.from('ipad_history').insert({
    ipad_id: ipad.id, event_type: 'assignment', status: ipad.status,
    assigned_to: pupilName, changed_by: adminName, changed_at: now,
    notes: `Übergabeprotokoll erstellt — wartet auf Bestätigung durch Schüler/in`,
  });

  closeAdminModal();
  renderIpadDetail();
}

// ─── 4. Rückgabeprotokoll ─────────────────────────────────────
// Admin creates this explicitly when the pupil returns the iPad.
// The pupil signs it on the portal before the admin clears the assignment.

function openRueckgabeModal() {
  const adminName = _adminName();
  _openModal('Rückgabeprotokoll erstellen', `
    <div class="admin-form-group">
      <label>Zustand</label>
      <select id="md-rg-condition" onchange="_toggleRgRows()">
        <option value="ohne_maengel">Ohne Mängel</option>
        <option value="mit_maengeln">Funktionstüchtig, mit Mängeln</option>
        <option value="defekt">Defekt</option>
      </select>
    </div>
    <div class="admin-form-group" id="md-rg-maengel-row" hidden>
      <label>Mängelbeschreibung</label>
      <textarea id="md-rg-maengel" rows="3"></textarea>
    </div>
    <div class="admin-form-group" id="md-rg-defekt-row" hidden>
      <label>Beschreibung des Defekts</label>
      <textarea id="md-rg-defekt" rows="3"></textarea>
    </div>
    <div class="admin-form-group">
      <label>Weiteres Zubehör (optional)</label>
      <input type="text" id="md-rg-notes">
    </div>
    <div class="admin-form-group">
      <label>Abgenommen von (Kürzel)</label>
      <input type="text" id="md-rg-kurzel" value="${adminName.split('@')[0]}">
    </div>
  `, 'Protokoll erstellen', submitRueckgabe);
}

function _toggleRgRows() {
  const val = document.getElementById('md-rg-condition')?.value;
  const mr  = document.getElementById('md-rg-maengel-row');
  const dr  = document.getElementById('md-rg-defekt-row');
  if (mr) mr.hidden = (val === 'ohne_maengel');
  if (dr) dr.hidden = (val !== 'defekt');
}

async function submitRueckgabe() {
  _setBusy(true, 'Protokoll erstellen');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();
  const pupilName = assignedName(ipad);
  const condition = document.getElementById('md-rg-condition')?.value || 'ohne_maengel';

  const { error } = await supabase.from('rueckgabeprotokoll').insert({
    ipad_id:             ipad.id,
    serial_number:       ipad.serial_number,
    pupil_name:          pupilName,
    kurzel:              document.getElementById('md-rg-kurzel')?.value.trim() || adminName.split('@')[0],
    condition,
    maengel:             condition !== 'ohne_maengel' ? (document.getElementById('md-rg-maengel')?.value.trim() || null) : null,
    defekt_beschreibung: condition === 'defekt'       ? (document.getElementById('md-rg-defekt')?.value.trim()  || null) : null,
    notes:               document.getElementById('md-rg-notes')?.value.trim() || null,
  });

  if (error) { _setBusy(false, 'Protokoll erstellen'); _modalError('Fehler: ' + error.message); return; }

  await supabase.from('ipad_history').insert({
    ipad_id: ipad.id, event_type: 'returned', status: ipad.status,
    assigned_to: pupilName, changed_by: adminName, changed_at: now,
    notes: `Rückgabeprotokoll erstellt — wartet auf Bestätigung durch Schüler/in`,
  });

  closeAdminModal();
  renderIpadDetail();
}

// ─── 6. Status change ────────────────────────────────────────

function openStatusModal() {
  const ipad    = window._detailIpad;
  const options = Object.entries(STATUS_CONFIG)
    .map(([v, c]) => `<option value="${v}" ${v === ipad.status ? 'selected' : ''}>${c.label}</option>`)
    .join('');

  _openModal('Status ändern', `
    <div class="admin-form-group">
      <label>Neuer Status</label>
      <select id="md-status">${options}</select>
    </div>
  `, 'Speichern', submitStatusChange);
}

// Statuses that sever the pupil/staff assignment.
// Repairs keep the assignment (per business rules); these do not.
const SEVERS_ASSIGNMENT = new Set(['available', 'to_be_erased', 'decommissioned']);

async function submitStatusChange() {
  const newStatus = document.getElementById('md-status')?.value;
  if (!newStatus) return;
  _setBusy(true, 'Speichern');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();
  const prevName  = assignedName(ipad);
  const isAssigned = ipad.assigned_pupil_id || ipad.assigned_staff_id;
  const shouldSever = SEVERS_ASSIGNMENT.has(newStatus) && isAssigned;

  const update = shouldSever
    ? { status: newStatus, assigned_pupil_id: null, assigned_staff_id: null }
    : { status: newStatus };

  const { error } = await supabase.from('ipads').update(update).eq('id', ipad.id);
  if (error) { _setBusy(false, 'Speichern'); _modalError('Fehler: ' + error.message); return; }

  await supabase.from('ipad_history').insert({
    ipad_id: ipad.id, event_type: 'status_change', status: newStatus,
    changed_by: adminName, changed_at: now,
    notes: `Status: "${STATUS_CONFIG[ipad.status]?.label}" → "${STATUS_CONFIG[newStatus]?.label}"`,
  });

  if (shouldSever) {
    await _invalidateTerms(ipad.id, now);
    // Reset portal account so the previous pupil can no longer log in.
    supabase.functions.invoke('create-ipad-account', { body: { serial_number: ipad.serial_number } })
      .catch(e => console.warn('Password reset on status change failed:', e));
    await supabase.from('ipad_history').insert({
      ipad_id: ipad.id, event_type: 'returned', status: newStatus,
      changed_by: adminName, changed_at: now,
      notes: `Zuweisung aufgehoben (Statusänderung): ${prevName}`,
    });
  }

  closeAdminModal();
  renderIpadDetail();
}

// ─── 7. Admin Schadenmeldung ─────────────────────────────────

function openAdminSchadenModal() {
  _openModal('Schadenmeldung', `
    <div class="admin-form-group">
      <label>Art des Schadens</label>
      <div class="admin-radio-group">
        <label><input type="radio" name="md-dmg" value="screen"> Display</label>
        <label><input type="radio" name="md-dmg" value="water">  Wasserschaden</label>
        <label><input type="radio" name="md-dmg" value="other">  Sonstiges</label>
      </div>
    </div>
    <div class="admin-form-group">
      <label>Beschreibung des Schadens</label>
      <textarea id="md-s-desc" rows="4"></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
      <div class="admin-form-group">
        <label>Eingetreten am</label>
        <input type="date" id="md-s-ein">
      </div>
      <div class="admin-form-group">
        <label>Entdeckt am (falls abw.)</label>
        <input type="date" id="md-s-ent">
      </div>
    </div>
    <div class="admin-form-group">
      <label>Schadensverursacher/in (falls abweichend)</label>
      <input type="text" id="md-s-perp">
    </div>
  `, 'Meldung speichern', submitAdminSchaden);
}

async function submitAdminSchaden() {
  const typeEl = document.querySelector('input[name="md-dmg"]:checked');
  const desc   = document.getElementById('md-s-desc')?.value.trim();
  if (!typeEl || !desc) { _modalError('Bitte Art des Schadens und Beschreibung ausfüllen.'); return; }
  _setBusy(true, 'Meldung speichern');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();
  const filedBy   = assignedName(ipad) !== '—' ? assignedName(ipad) : adminName;

  const { error } = await supabase.from('schadenmeldung').insert({
    ipad_id:           ipad.id,
    damage_type:       typeEl.value,
    description:       desc,
    filed_by:          filedBy,
    filed_at:          now,
    datum_eingetreten: document.getElementById('md-s-ein')?.value  || null,
    datum_entdeckt:    document.getElementById('md-s-ent')?.value  || null,
    perpetrator:       document.getElementById('md-s-perp')?.value.trim() || null,
    pdf_url:           null,
  });
  if (error) { _setBusy(false, 'Meldung speichern'); _modalError('Fehler: ' + error.message); return; }

  await supabase.from('ipad_history').insert({
    ipad_id: ipad.id, event_type: 'schadenmeldung', status: ipad.status,
    assigned_to: assignedName(ipad), changed_by: adminName, changed_at: now,
    notes: `Schaden gemeldet (Admin): ${typeEl.value} — ${desc}`,
  });

  closeAdminModal();
  renderIpadDetail();
}

// ─── 8. Admin Verlustmeldung ──────────────────────────────────

function openAdminVerlustModal() {
  _openModal('Verlustmeldung', `
    <div class="admin-form-group">
      <label>Datum des Verlusts</label>
      <input type="date" id="md-v-date">
    </div>
    <div class="admin-form-group">
      <label>Wie ist es passiert?</label>
      <textarea id="md-v-circ" rows="4"></textarea>
    </div>
    <div class="admin-form-group">
      <label>Letzter bekannter Verbleib</label>
      <input type="text" id="md-v-ort">
    </div>
    <div class="admin-form-group">
      <label>Verlust bemerkt am</label>
      <input type="date" id="md-v-bemerkt">
    </div>
    <div class="admin-form-group">
      <label>Aktenzeichen (optional)</label>
      <input type="text" id="md-v-police">
    </div>
    <div class="admin-form-group">
      <label>Notizen (optional)</label>
      <textarea id="md-v-notitzen" rows="2"></textarea>
    </div>
  `, 'Meldung speichern', submitAdminVerlust);
}

async function submitAdminVerlust() {
  const date = document.getElementById('md-v-date')?.value;
  const circ = document.getElementById('md-v-circ')?.value.trim();
  if (!date || !circ) { _modalError('Bitte Datum und Umstände ausfüllen.'); return; }
  _setBusy(true, 'Meldung speichern');

  const ipad      = window._detailIpad;
  const now       = new Date().toISOString();
  const adminName = _adminName();

  const { error } = await supabase.from('verlustmeldung').insert({
    ipad_id:              ipad.id,
    date_of_loss:         date,
    circumstances:        circ,
    ort_verlust:          document.getElementById('md-v-ort')?.value.trim()     || null,
    datum_bemerkt:        document.getElementById('md-v-bemerkt')?.value        || null,
    police_report_number: document.getElementById('md-v-police')?.value.trim() || null,
    notitzen:             document.getElementById('md-v-notitzen')?.value.trim()|| null,
    filed_by:             adminName,
    filed_at:             now,
    pdf_url:              null,
  });
  if (error) { _setBusy(false, 'Meldung speichern'); _modalError('Fehler: ' + error.message); return; }

  await supabase.from('ipads').update({ status: 'lost' }).eq('id', ipad.id);

  await Promise.all([
    supabase.from('ipad_history').insert({
      ipad_id: ipad.id, event_type: 'verlustmeldung', status: 'lost',
      assigned_to: assignedName(ipad), changed_by: adminName, changed_at: now,
      notes: `Verlust gemeldet (Admin): ${date}`,
    }),
    supabase.from('ipad_history').insert({
      ipad_id: ipad.id, event_type: 'status_change', status: 'lost',
      changed_by: adminName, changed_at: now,
      notes: 'Status automatisch auf "Verloren" gesetzt durch Verlustmeldung',
    }),
  ]);

  closeAdminModal();
  renderIpadDetail();
}
