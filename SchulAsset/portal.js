// Student portal — auth guard, iPad view, terms, damage/loss reports, protocols.

let _ipad            = null;
let _pupilName       = '';
let _termsRow        = null;
let _uebergabe       = null;
let _rueckgabe       = null;
let _lastSchadenData = null;
let _lastVerlustData = null;
let _sigPads         = {};
let _pendingAccept   = null;

const STATUS_COLORS = {
  available:           '#34c759',
  terms_pending:       '#ff9f0a',
  handover_pending:    '#ff9f0a',
  in_use:              '#007aff',
  prepared_for_repair: '#ff9500',
  shipped_for_repair:  '#ff9500',
  back_from_repair:    '#ff9500',
  to_be_erased:        '#ffcc00',
  lost:                '#ff3b30',
  stolen:              '#ff3b30',
  decommissioned:      '#8e8e93',
};

// ── Signature pad ─────────────────────────────────────────────────

function _openSigPad(canvasId, padKey) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_sigPads[padKey]) { _sigPads[padKey].off(); _sigPads[padKey] = null; }
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width  = canvas.offsetWidth  * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);
  _sigPads[padKey] = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255,255,255)',
    penColor: '#1a202c',
    minWidth: 0.8,
    maxWidth: 2.5,
  });
}

function clearSig(padKey) {
  _sigPads[padKey]?.clear();
}

function _getSigDataUrl(padKey) {
  const pad = _sigPads[padKey];
  if (!pad || pad.isEmpty()) return null;
  return pad.toDataURL('image/png');
}

// ── Init ──────────────────────────────────────────────────────────

async function initPortal() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (!roleRow || roleRow.role !== 'student') {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
    return;
  }

  // Supabase lowercases emails, so uppercase to match serial numbers in DB.
  const sn = session.user.email.split('@')[0].toUpperCase();

  const { data: ipad, error: ipadError } = await supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date,
      pupils:assigned_pupil_id (first_name, last_name, address)
    `)
    .eq('serial_number', sn)
    .single();

  if (ipadError || !ipad) {
    document.getElementById('portal-content').innerHTML =
      `<p class="empty-msg">${t('portal.errorNoIpad')}</p>`;
    return;
  }

  _ipad      = ipad;
  _pupilName = (ipad.pupils?.first_name && ipad.pupils?.last_name)
    ? `${ipad.pupils.first_name} ${ipad.pupils.last_name}`
    : sn;

  // Fetch terms acceptance (includes guardian fields and signature).
  const { data: termsRow } = await supabase
    .from('terms_acceptance')
    .select('accepted_at, terms_version, erz_first_name, erz_last_name, erz_address, signature_url')
    .eq('ipad_id', ipad.id)
    .is('invalidated_at', null)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  _termsRow = termsRow;

  // Fetch latest Übergabeprotokoll and Rückgabeprotokoll (may be null).
  // Only show protocols created during the current assignment.
  // This prevents old records from previous owners appearing on the portal.
  const assignedSince = ipad.assigned_date || new Date().toISOString();

  const [{ data: uebergabe }, { data: rueckgabe }] = await Promise.all([
    supabase
      .from('uebergabeprotokoll')
      .select('*')
      .eq('ipad_id', ipad.id)
      .gte('created_at', assignedSince)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('rueckgabeprotokoll')
      .select('*')
      .eq('ipad_id', ipad.id)
      .gte('created_at', assignedSince)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  _uebergabe = uebergabe;
  _rueckgabe = rueckgabe;

  renderPortal(termsRow);
}

// ── Render ────────────────────────────────────────────────────────

const CONDITION_LABELS = {
  neuwertig:    { de: 'Neuwertig',                         en: 'As new',                     tr: 'Sıfır gibi' },
  ohne_maengel: { de: 'Ohne Mängel',                       en: 'No defects',                  tr: 'Kusursuz' },
  mit_maengeln: { de: 'Mit folgenden Mängeln',             en: 'With the following defects',  tr: 'Kusurlarla' },
  defekt:       { de: 'Defekt',                            en: 'Defective',                   tr: 'Arızalı' },
};

function _conditionLabel(value) {
  return CONDITION_LABELS[value]?.[currentLang] || CONDITION_LABELS[value]?.de || value;
}

// Renders the key fields of a protocol so the pupil can review before signing.
function _protocolDetails(record, type) {
  const rows = [];

  rows.push(`
    <div class="info-row" style="font-size:0.82rem">
      <span class="info-key">${t('portal.protocol.issuedBy')}</span>
      <span class="info-value">${record.kurzel || '—'}</span>
    </div>
    <div class="info-row" style="font-size:0.82rem">
      <span class="info-key">${t('portal.protocol.condition')}</span>
      <span class="info-value">${_conditionLabel(record.condition)}</span>
    </div>
  `);

  if (record.maengel) {
    rows.push(`
      <div class="info-row" style="font-size:0.82rem">
        <span class="info-key">${t('portal.protocol.defects')}</span>
        <span class="info-value">${record.maengel}</span>
      </div>
    `);
  }

  if (record.defekt_beschreibung) {
    rows.push(`
      <div class="info-row" style="font-size:0.82rem">
        <span class="info-key">${t('portal.protocol.defectDesc')}</span>
        <span class="info-value">${record.defekt_beschreibung}</span>
      </div>
    `);
  }

  if (record.notes) {
    rows.push(`
      <div class="info-row" style="font-size:0.82rem">
        <span class="info-key">${t('portal.protocol.accessories')}</span>
        <span class="info-value">${record.notes}</span>
      </div>
    `);
  }

  return `<div class="info-card" style="margin:0.75rem 0">${rows.join('')}</div>`;
}

function renderPortal(termsRow) {
  const ipad = _ipad;

  const infoBody = document.getElementById('ipad-info-body');
  if (infoBody) {
    infoBody.innerHTML = `
      <div class="v2-info-row">
        <span class="v2-info-key">Seriennummer</span>
        <span class="v2-info-val">${ipad.serial_number}</span>
      </div>
      <div class="v2-info-row">
        <span class="v2-info-key">Speicher</span>
        <span class="v2-info-val normal">${ipad.storage_capacity ?? '—'}</span>
      </div>
      <div class="v2-info-row">
        <span class="v2-info-key">Typ</span>
        <span class="v2-info-val normal">${ipad.ipad_type === 'staff' ? 'Lehrkraft' : 'Schüler/in'}</span>
      </div>
      <div class="v2-info-row">
        <span class="v2-info-key">Zugewiesen seit</span>
        <span class="v2-info-val normal">${formatDate(ipad.assigned_date)}</span>
      </div>
    `;
  }

  const steps = _buildSteps(termsRow);
  const inUse = ipad.status === 'in_use';

  document.getElementById('portal-content').innerHTML = `
    <div class="v2-page">
      <div class="v2-topbar">
        <p class="v2-greeting">Hallo, ${_pupilName.split(' ')[0]}!</p>
        <button class="v2-info-btn" onclick="document.getElementById('ipad-info-modal').hidden=false">
          ℹ︎ iPad-Details
        </button>
      </div>
      <div class="v2-timeline">
        ${steps.map(_renderStep).join('')}
      </div>
      ${inUse ? `
        <div class="v2-emergency">
          <p class="v2-emergency-label">Problem mit dem iPad?</p>
          <div class="v2-emergency-buttons">
            <button class="v2-btn-damage" onclick="openModal('schaden-modal')">⚠️ Schaden<br>melden</button>
            <button class="v2-btn-loss"   onclick="openModal('verlust-modal')">❗ Verlust /<br>Diebstahl melden</button>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  applyTranslations();
}

function _buildSteps(termsRow) {
  const steps = [];

  // Step 1: Leihvertrag
  if (termsRow) {
    steps.push({ state: 'done', number: '✓', title: 'Leihvertrag', subtitle: `Akzeptiert am ${formatDate(termsRow.accepted_at)}`, download: { label: '↓ Leihvertrag herunterladen', onclick: 'downloadLeihvertrag()' } });
  } else {
    steps.push({ state: 'active', number: '1', title: 'Leihvertrag lesen & bestätigen', subtitle: 'Bitte lesen Sie den Leihvertrag und bestätigen Sie ihn.', action: { label: 'Leihvertrag öffnen', onclick: "openModal('terms-modal')" } });
  }

  // Step 2: Übergabeprotokoll
  if (!termsRow) {
    steps.push({ state: 'locked', number: '2', title: 'iPad erhalten' });
  } else if (!_uebergabe) {
    steps.push({ state: 'waiting', number: '⏳', title: 'iPad erhalten', subtitle: 'Die Schule bereitet die Übergabe vor. Sie müssen hier nichts tun.' });
  } else if (_uebergabe.accepted_at) {
    steps.push({ state: 'done', number: '✓', title: 'iPad erhalten', subtitle: `Bestätigt am ${formatDate(_uebergabe.accepted_at)}`, download: { label: '↓ Übergabeprotokoll herunterladen', onclick: 'downloadUebergabe()' } });
  } else {
    steps.push({ state: 'active', number: '2', title: 'iPad erhalten bestätigen', subtitle: 'Bitte prüfen Sie den Zustand des iPads und bestätigen Sie den Erhalt.', details: _protocolDetails(_uebergabe, 'uebergabe'), action: { label: 'Erhalt bestätigen', onclick: `openAcceptModal('uebergabe', '${_uebergabe.id}')` } });
  }

  // Step 3: In Verwendung
  const isActive = _ipad.status === 'in_use';
  steps.push({ state: isActive ? 'done' : 'locked', number: isActive ? '✓' : '3', title: 'iPad in Verwendung', subtitle: isActive ? 'Das iPad wird aktiv genutzt.' : '' });

  // Step 4: Rückgabeprotokoll
  if (!_rueckgabe) {
    steps.push({ state: 'locked', number: '4', title: 'iPad zurückgeben' });
  } else if (_rueckgabe.accepted_at) {
    steps.push({ state: 'done', number: '✓', title: 'iPad zurückgegeben', subtitle: `Bestätigt am ${formatDate(_rueckgabe.accepted_at)}`, download: { label: '↓ Rückgabeprotokoll herunterladen', onclick: 'downloadRueckgabe()' } });
  } else {
    steps.push({ state: 'active', number: '4', title: 'Rückgabe bestätigen', subtitle: 'Bitte prüfen Sie den Zustand des iPads und bestätigen Sie die Rückgabe.', details: _protocolDetails(_rueckgabe, 'rueckgabe'), action: { label: 'Rückgabe bestätigen', onclick: `openAcceptModal('rueckgabe', '${_rueckgabe.id}')` } });
  }

  return steps;
}

function _renderStep(step) {
  const actionHtml   = step.action   ? `<button class="v2-btn-primary" onclick="${step.action.onclick}">${step.action.label}</button>`         : '';
  const downloadHtml = step.download ? `<button class="v2-btn-secondary" onclick="${step.download.onclick}">${step.download.label}</button>`   : '';
  const subHtml      = step.subtitle ? `<p class="v2-step-sub">${step.subtitle}</p>`                                                           : '';
  const detailsHtml  = step.details  ? `<div class="v2-protocol-details">${step.details}</div>`                                               : '';
  return `
    <div class="v2-step ${step.state}">
      <div class="v2-step-left">
        <div class="v2-circle ${step.state}">${step.number}</div>
        <div class="v2-line"></div>
      </div>
      <div class="v2-step-body">
        <div class="v2-step-card">
          <p class="v2-step-title">${step.title}</p>
          ${subHtml}${detailsHtml}${actionHtml}${downloadHtml}
        </div>
      </div>
    </div>`;
}

// ── Terms / Leihvertrag ───────────────────────────────────────────

async function acceptTerms() {
  const sigDataUrl = _getSigDataUrl('terms');
  const sigErrorEl = document.getElementById('terms-sig-error');
  if (!sigDataUrl) {
    sigErrorEl.textContent = t('portal.sig.required');
    sigErrorEl.hidden = false;
    return;
  }
  sigErrorEl.hidden = true;

  const btn = document.getElementById('terms-accept-btn');
  btn.disabled    = true;
  btn.textContent = t('portal.sig.saving');

  const erzFirst = document.getElementById('erz-first-name').value.trim();
  const erzLast  = document.getElementById('erz-last-name').value.trim();
  const erzAddr  = document.getElementById('erz-address').value.trim();

  const now = new Date().toISOString();

  const { error: termsError } = await supabase
    .from('terms_acceptance')
    .insert({
      ipad_id:        _ipad.id,
      accepted_at:    now,
      terms_version:  '1.0',
      erz_first_name: erzFirst    || null,
      erz_last_name:  erzLast     || null,
      erz_address:    erzAddr     || null,
      signature_url:  sigDataUrl,
    });

  if (termsError) {
    btn.disabled    = false;
    btn.textContent = t('portal.termsAcceptBtn');
    sigErrorEl.textContent = t('portal.errorGeneric');
    sigErrorEl.hidden = false;
    return;
  }

  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'terms_accepted',
    status:      _ipad.status,
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       'Nutzungsbedingungen v1.0 akzeptiert (Schülerportal)',
  });

  _termsRow = {
    accepted_at:    now,
    terms_version:  '1.0',
    erz_first_name: erzFirst    || null,
    erz_last_name:  erzLast     || null,
    erz_address:    erzAddr     || null,
    signature_url:  sigDataUrl,
  };

  closeModal('terms-modal');
  renderPortal(_termsRow);
}

async function downloadLeihvertrag() {
  if (!_ipad) return;
  try {
    await generateLeihvertrag({
      first_name:     _ipad.pupils?.first_name,
      last_name:      _ipad.pupils?.last_name,
      address:        _ipad.pupils?.address,
      serial_number:  _ipad.serial_number,
      erz_first_name: _termsRow?.erz_first_name,
      erz_last_name:  _termsRow?.erz_last_name,
      erz_address:    _termsRow?.erz_address,
      accepted_at:    _termsRow?.accepted_at,
      terms_version:  _termsRow?.terms_version,
      signature_url:  _termsRow?.signature_url,
    });
  } catch (e) {
    console.error('Download error:', e);
    alert('Download fehlgeschlagen:\n' + (e.message || e));
  }
}

// ── Schadenmeldung ────────────────────────────────────────────────

async function submitSchaden(event) {
  event.preventDefault();

  const typeEl    = document.querySelector('input[name="damage-type"]:checked');
  const desc      = document.getElementById('schaden-desc').value.trim();
  const datumEin  = document.getElementById('schaden-datum-eingetreten').value;
  const datumEnt  = document.getElementById('schaden-datum-entdeckt').value;
  const perp      = document.getElementById('schaden-perpetrator').value.trim();
  const errorEl   = document.getElementById('schaden-error');
  const btn       = document.getElementById('schaden-submit-btn');

  errorEl.hidden = true;

  if (!typeEl) {
    errorEl.textContent = t('portal.errorGeneric');
    errorEl.hidden = false;
    return;
  }

  btn.disabled    = true;
  btn.textContent = t('portal.schaden.submitting');

  const now = new Date().toISOString();

  const { error } = await supabase.from('schadenmeldung').insert({
    ipad_id:          _ipad.id,
    damage_type:      typeEl.value,
    description:      desc,
    filed_by:         _pupilName,
    filed_at:         now,
    datum_eingetreten: datumEin || null,
    datum_entdeckt:    datumEnt || null,
    perpetrator:       perp    || null,
    pdf_url:          null,
  });

  if (error) {
    btn.disabled    = false;
    btn.textContent = t('portal.schaden.submit');
    errorEl.textContent = t('portal.errorGeneric');
    errorEl.hidden  = false;
    return;
  }

  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'schadenmeldung',
    status:      _ipad.status,
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       `Schaden gemeldet: ${typeEl.value} — ${desc}`,
  });

  _lastSchadenData = {
    serial_number:     _ipad.serial_number,
    last_name:         _ipad.pupils?.last_name,
    first_name:        _ipad.pupils?.first_name,
    damage_type:       typeEl.value,
    description:       desc,
    datum_eingetreten: datumEin || null,
    datum_entdeckt:    datumEnt || null,
    perpetrator:       perp    || null,
    erz_first_name:    _termsRow?.erz_first_name,
    erz_last_name:     _termsRow?.erz_last_name,
    erz_address:       _termsRow?.erz_address,
    filed_at:          now,
  };

  document.getElementById('schaden-form').hidden = true;
  const successEl = document.getElementById('schaden-success');
  successEl.innerHTML = `
    <div>${t('portal.schaden.success')}</div>
    <button class="btn-secondary" style="margin-top:0.6rem;width:100%" onclick="downloadLastSchaden()">
      ↓ ${t('portal.schaden.downloadBtn')}
    </button>
  `;
  successEl.hidden = false;
}

async function downloadLastSchaden() {
  if (!_lastSchadenData) return;
  try {
    await generateSchadenmeldung(_lastSchadenData);
  } catch (e) {
    console.error('Download error:', e);
    alert(t('portal.errorGeneric'));
  }
}

// ── Verlustmeldung ────────────────────────────────────────────────

async function submitVerlust(event) {
  event.preventDefault();

  const date        = document.getElementById('verlust-date').value;
  const circ        = document.getElementById('verlust-circ').value.trim();
  const police      = document.getElementById('verlust-police').value.trim();
  const ort         = document.getElementById('verlust-ort').value.trim();
  const datumBem    = document.getElementById('verlust-datum-bemerkt').value;
  const notitzen    = document.getElementById('verlust-notitzen').value.trim();
  const errorEl     = document.getElementById('verlust-error');
  const btn         = document.getElementById('verlust-submit-btn');

  errorEl.hidden = true;
  btn.disabled    = true;
  btn.textContent = t('portal.verlust.submitting');

  const now = new Date().toISOString();

  const { error } = await supabase.from('verlustmeldung').insert({
    ipad_id:              _ipad.id,
    date_of_loss:         date,
    circumstances:        circ,
    police_report_number: police   || null,
    ort_verlust:          ort      || null,
    datum_bemerkt:        datumBem || null,
    notitzen:             notitzen || null,
    filed_by:             _pupilName,
    filed_at:             now,
    pdf_url:              null,
  });

  if (error) {
    btn.disabled    = false;
    btn.textContent = t('portal.verlust.submit');
    errorEl.textContent = t('portal.errorGeneric');
    errorEl.hidden  = false;
    return;
  }

  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'verlustmeldung',
    status:      _ipad.status,
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       `Verlust gemeldet: ${date}${police ? ` · AZ: ${police}` : ''}`,
  });

  _lastVerlustData = {
    serial_number:        _ipad.serial_number,
    last_name:            _ipad.pupils?.last_name,
    first_name:           _ipad.pupils?.first_name,
    date_of_loss:         date,
    circumstances:        circ,
    police_report_number: police   || null,
    ort_verlust:          ort      || null,
    datum_bemerkt:        datumBem || null,
    notitzen:             notitzen || null,
    erz_first_name:       _termsRow?.erz_first_name,
    erz_last_name:        _termsRow?.erz_last_name,
    erz_address:          _termsRow?.erz_address,
    filed_at:             now,
  };

  // Update iPad status to 'lost' and write a history row for the status change.
  await supabase.from('ipads').update({ status: 'lost' }).eq('id', _ipad.id);
  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'status_change',
    status:      'lost',
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       'Status automatisch auf "Verloren" gesetzt durch Verlustmeldung',
  });
  _ipad.status = 'lost';
  renderPortal(_termsRow);

  document.getElementById('verlust-form').hidden = true;
  const successEl = document.getElementById('verlust-success');
  successEl.innerHTML = `
    <div>${t('portal.verlust.success')}</div>
    <button class="btn-secondary" style="margin-top:0.6rem;width:100%" onclick="downloadLastVerlust()">
      ↓ ${t('portal.verlust.downloadBtn')}
    </button>
  `;
  successEl.hidden = false;
}

function downloadLastVerlust() {
  if (_lastVerlustData) generateVerlustmeldung(_lastVerlustData);
}

// ── Übergabeprotokoll / Rückgabeprotokoll ────────────────────────

function openAcceptModal(type, id) {
  _pendingAccept = { type, id };
  document.getElementById('accept-sig-title').textContent = t(`portal.sig.${type}Title`);
  document.getElementById('accept-sig-desc').textContent  = t(`portal.sig.${type}Desc`);
  document.getElementById('accept-sig-error').hidden      = true;
  const btn = document.getElementById('accept-sig-btn');
  btn.disabled    = false;
  btn.textContent = t('portal.sig.confirm');
  document.getElementById('accept-sig-modal').hidden = false;
  setTimeout(() => _openSigPad('accept-sig-canvas', 'accept'), 50);
}

async function confirmAcceptProtocol() {
  const sigDataUrl = _getSigDataUrl('accept');
  const errorEl   = document.getElementById('accept-sig-error');
  if (!sigDataUrl) {
    errorEl.textContent = t('portal.sig.required');
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;

  const { type, id } = _pendingAccept;
  const btn = document.getElementById('accept-sig-btn');
  btn.disabled    = true;
  btn.textContent = t('portal.sig.saving');

  const table = type === 'uebergabe' ? 'uebergabeprotokoll' : 'rueckgabeprotokoll';
  const now   = new Date().toISOString();

  const { error } = await supabase
    .from(table)
    .update({ accepted_at: now, accepted_by: _pupilName, signature_url: sigDataUrl })
    .eq('id', id);

  if (error) {
    btn.disabled    = false;
    btn.textContent = t('portal.sig.confirm');
    errorEl.textContent = t('portal.errorGeneric');
    errorEl.hidden = false;
    return;
  }

  closeModal('accept-sig-modal');

  if (type === 'uebergabe') {
    _uebergabe = { ..._uebergabe, accepted_at: now, accepted_by: _pupilName, signature_url: sigDataUrl };
    // DB trigger updates iPad status to in_use; mirror it locally for display.
    _ipad = { ..._ipad, status: 'in_use' };
    await supabase.from('ipad_history').insert({
      ipad_id:     _ipad.id,
      event_type:  'status_change',
      status:      'in_use',
      assigned_to: _pupilName,
      changed_by:  _pupilName,
      changed_at:  now,
      notes:       'Übergabeprotokoll bestätigt',
    });
  } else {
    _rueckgabe = { ..._rueckgabe, accepted_at: now, accepted_by: _pupilName, signature_url: sigDataUrl };
    await supabase.from('ipad_history').insert({
      ipad_id:     _ipad.id,
      event_type:  'returned',
      status:      _ipad.status,
      assigned_to: _pupilName,
      changed_by:  _pupilName,
      changed_at:  now,
      notes:       'Rückgabeprotokoll bestätigt',
    });
  }

  renderPortal(_termsRow);
}

function downloadUebergabe() {
  if (_uebergabe) generateUebergabeprotokoll(_uebergabe);
}

function downloadRueckgabe() {
  if (_rueckgabe) generateRueckgabeprotokoll(_rueckgabe);
}

// ── Helpers ───────────────────────────────────────────────────────

function openModal(id) {
  const modal = document.getElementById(id);
  const form  = modal.querySelector('form');
  if (form) {
    form.reset();
    form.hidden = false;
  }
  // Also reset any lingering success state
  modal.querySelectorAll('.success-msg').forEach(el => {
    el.hidden   = true;
    el.innerHTML = '';
  });
  modal.querySelectorAll('.error-msg').forEach(el => { el.hidden = true; });
  const submitBtn = modal.querySelector('[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled    = false;
    submitBtn.textContent = t(submitBtn.dataset.i18n);
  }
  // Reset guardian fields if terms modal
  ['erz-first-name', 'erz-last-name', 'erz-address'].forEach(id => {
    const el = modal.querySelector(`#${id}`);
    if (el) el.value = '';
  });
  modal.hidden = false;
  applyTranslations();
  if (id === 'terms-modal') {
    setTimeout(() => _openSigPad('terms-sig-canvas', 'terms'), 50);
  }
}

function closeModal(id) {
  document.getElementById(id).hidden = true;
}

async function portalLogout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
