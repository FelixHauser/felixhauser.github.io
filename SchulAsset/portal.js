// Student portal — auth guard, iPad view, terms acceptance, damage/loss reports.

// ─────────────────────────────────────────────────────────────────
// REQUIRED SUPABASE SQL
// Run all of these in the Supabase dashboard → SQL editor before
// testing the student portal.
//
// 1. Student can read only their own iPad:
//    CREATE POLICY "student_read_own_ipad" ON public.ipads
//      FOR SELECT TO authenticated
//      USING (serial_number = split_part(auth.email(), '@', 1));
//
// 2. Enable RLS + grant on the three write tables:
//    ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;
//    ALTER TABLE public.schadenmeldung    ENABLE ROW LEVEL SECURITY;
//    ALTER TABLE public.verlustmeldung    ENABLE ROW LEVEL SECURITY;
//    GRANT SELECT, INSERT ON public.terms_acceptance TO authenticated;
//    GRANT SELECT, INSERT ON public.schadenmeldung    TO authenticated;
//    GRANT SELECT, INSERT ON public.verlustmeldung    TO authenticated;
//    GRANT INSERT          ON public.ipad_history     TO authenticated;
//
// 3. Student can read/insert terms for their own iPad:
//    CREATE POLICY "student_terms" ON public.terms_acceptance
//      FOR ALL TO authenticated
//      USING   (ipad_id IN (SELECT id FROM public.ipads WHERE serial_number = split_part(auth.email(), '@', 1)))
//      WITH CHECK (ipad_id IN (SELECT id FROM public.ipads WHERE serial_number = split_part(auth.email(), '@', 1)));
//
// 4. Student can insert damage/loss reports for their own iPad:
//    CREATE POLICY "student_schaden" ON public.schadenmeldung
//      FOR INSERT TO authenticated
//      WITH CHECK (ipad_id IN (SELECT id FROM public.ipads WHERE serial_number = split_part(auth.email(), '@', 1)));
//
//    CREATE POLICY "student_verlust" ON public.verlustmeldung
//      FOR INSERT TO authenticated
//      WITH CHECK (ipad_id IN (SELECT id FROM public.ipads WHERE serial_number = split_part(auth.email(), '@', 1)));
//
// 5. Student can insert history rows for their own iPad:
//    CREATE POLICY "student_history_insert" ON public.ipad_history
//      FOR INSERT TO authenticated
//      WITH CHECK (ipad_id IN (SELECT id FROM public.ipads WHERE serial_number = split_part(auth.email(), '@', 1)));
// ─────────────────────────────────────────────────────────────────

let _ipad       = null; // the student's iPad (fetched on load)
let _pupilName  = '';   // full name for history / report fields

const STATUS_COLORS = {
  available:           '#34c759',
  in_use:              '#007aff',
  prepared_for_repair: '#ff9500',
  shipped_for_repair:  '#ff9500',
  back_from_repair:    '#ff9500',
  to_be_erased:        '#ffcc00',
  lost:                '#ff3b30',
  stolen:              '#ff3b30',
  decommissioned:      '#8e8e93',
};

// ── Init ──────────────────────────────────────────────────────────

async function initPortal() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Verify the user has a student role (not admin).
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

  // Derive serial number from email (format: {sn}@schulasset.local).
  // Supabase lowercases all emails, so we uppercase to match the ipads table.
  const sn = session.user.email.split('@')[0].toUpperCase();

  const { data: ipad, error: ipadError } = await supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date,
      pupils:assigned_pupil_id (first_name, last_name)
    `)
    .eq('serial_number', sn)
    .single();

  if (ipadError || !ipad) {
    document.getElementById('portal-content').innerHTML =
      `<p class="empty-msg">${t('portal.errorNoIpad')}</p>`;
    return;
  }

  _ipad      = ipad;
  _pupilName = ipad.pupils
    ? `${ipad.pupils.first_name} ${ipad.pupils.last_name}`
    : sn;

  // Check if terms have been accepted.
  const { data: termsRow } = await supabase
    .from('terms_acceptance')
    .select('accepted_at, terms_version')
    .eq('ipad_id', ipad.id)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  renderPortal(termsRow);
}

// ── Render ────────────────────────────────────────────────────────

function renderPortal(termsRow) {
  const ipad    = _ipad;
  const typeKey = ipad.ipad_type === 'staff' ? 'portal.typeStaff' : 'portal.typeStudent';
  const statusLabel = t(`portal.statuses.${ipad.status}`) || ipad.status;
  const statusColor = STATUS_COLORS[ipad.status] || '#8e8e93';

  const termsSection = termsRow
    ? `<div class="terms-card">
         <p class="section-label">${t('portal.terms')}</p>
         <p class="terms-status accepted">✓ ${t('portal.termsAcceptedOn')} ${formatDate(termsRow.accepted_at)}</p>
       </div>`
    : `<div class="terms-card">
         <p class="section-label">${t('portal.terms')}</p>
         <p class="terms-status">${t('portal.termsNotAccepted')}</p>
         <button class="btn-primary" style="margin-top:0.75rem;width:100%"
           onclick="openModal('terms-modal')">
           ${t('portal.termsViewBtn')}
         </button>
       </div>`;

  document.getElementById('portal-content').innerHTML = `
    <p class="portal-greeting">${t('portal.greeting')} ${_pupilName.split(' ')[0]}</p>

    <p class="section-label">${t('portal.myIpad')}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-key">${t('portal.serialNumber')}</span>
        <span class="info-value mono">${ipad.serial_number}</span>
      </div>
      <div class="info-row">
        <span class="info-key">${t('portal.status')}</span>
        <span class="info-value">
          <span class="badge" style="background:${statusColor}">${statusLabel}</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-key">${t('portal.type')}</span>
        <span class="info-value">${t(typeKey)}</span>
      </div>
      <div class="info-row">
        <span class="info-key">${t('portal.storage')}</span>
        <span class="info-value">${ipad.storage_capacity ?? '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-key">${t('portal.assignedSince')}</span>
        <span class="info-value">${formatDate(ipad.assigned_date)}</span>
      </div>
    </div>

    ${termsSection}

    <p class="section-label" style="margin-top:0.25rem"></p>
    <div class="action-buttons">
      <button class="btn-action btn-action-damage" onclick="openModal('schaden-modal')">
        <span style="font-size:1.1rem">⚠️</span>
        ${t('portal.reportDamage')}
      </button>
      <button class="btn-action btn-action-loss" onclick="openModal('verlust-modal')">
        <span style="font-size:1.1rem">❗</span>
        ${t('portal.reportLoss')}
      </button>
    </div>
  `;

  // Re-apply translations so dynamically rendered data-i18n attributes are filled.
  applyTranslations();
}

// ── Terms ─────────────────────────────────────────────────────────

async function acceptTerms() {
  const btn = document.getElementById('terms-accept-btn');
  btn.disabled = true;
  btn.textContent = t('portal.schaden.submitting'); // "Wird gesendet…"

  const now = new Date().toISOString();

  const { error: termsError } = await supabase
    .from('terms_acceptance')
    .insert({
      ipad_id:       _ipad.id,
      accepted_at:   now,
      terms_version: '1.0',
    });

  if (termsError) {
    btn.disabled = false;
    btn.textContent = t('portal.termsAcceptBtn');
    alert(t('portal.errorGeneric'));
    return;
  }

  // Write audit row to ipad_history.
  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'terms_accepted',
    status:      _ipad.status,
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       'Nutzungsbedingungen v1.0 akzeptiert (Schülerportal)',
  });

  closeModal('terms-modal');
  renderPortal({ accepted_at: now, terms_version: '1.0' });
}

// ── Schadenmeldung ────────────────────────────────────────────────

async function submitSchaden(event) {
  event.preventDefault();

  const typeEl  = document.querySelector('input[name="damage-type"]:checked');
  const desc    = document.getElementById('schaden-desc').value.trim();
  const errorEl = document.getElementById('schaden-error');
  const btn     = document.getElementById('schaden-submit-btn');

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
    ipad_id:     _ipad.id,
    damage_type: typeEl.value,
    description: desc,
    filed_by:    _pupilName,
    filed_at:    now,
    pdf_url:     null,
  });

  if (error) {
    btn.disabled    = false;
    btn.textContent = t('portal.schaden.submit');
    errorEl.textContent = t('portal.errorGeneric');
    errorEl.hidden  = false;
    return;
  }

  // Audit trail.
  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'schadenmeldung',
    status:      _ipad.status,
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       `Schaden gemeldet: ${typeEl.value} — ${desc}`,
  });

  // Show success and hide the form.
  document.getElementById('schaden-form').hidden = true;
  const successEl = document.getElementById('schaden-success');
  successEl.textContent = t('portal.schaden.success');
  successEl.hidden = false;
}

// ── Verlustmeldung ────────────────────────────────────────────────

async function submitVerlust(event) {
  event.preventDefault();

  const date        = document.getElementById('verlust-date').value;
  const circ        = document.getElementById('verlust-circ').value.trim();
  const police      = document.getElementById('verlust-police').value.trim();
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
    police_report_number: police || null,
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

  // Audit trail.
  await supabase.from('ipad_history').insert({
    ipad_id:     _ipad.id,
    event_type:  'verlustmeldung',
    status:      _ipad.status,
    assigned_to: _pupilName,
    changed_by:  _pupilName,
    changed_at:  now,
    notes:       `Verlust gemeldet: ${date}${police ? ` · AZ: ${police}` : ''}`,
  });

  document.getElementById('verlust-form').hidden = true;
  const successEl = document.getElementById('verlust-success');
  successEl.textContent = t('portal.verlust.success');
  successEl.hidden = false;
}

// ── Helpers ───────────────────────────────────────────────────────

function openModal(id) {
  // Reset form state when opening.
  const modal = document.getElementById(id);
  const form  = modal.querySelector('form');
  if (form) {
    form.reset();
    form.hidden = false;
  }
  modal.querySelectorAll('.success-msg').forEach(el => { el.hidden = true; });
  modal.querySelectorAll('.error-msg').forEach(el => { el.hidden = true; });
  const submitBtn = modal.querySelector('[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = t(submitBtn.dataset.i18n);
  }
  modal.hidden = false;
  applyTranslations();
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
