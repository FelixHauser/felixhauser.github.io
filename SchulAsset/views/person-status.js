// Active / not active status of pupils and staff — shared by the detail pages.
//
// A person is "active" (still at the school) or "not active" (left). Not active people
// carry the date since when (`inactive_since`) — the start of the idle period for the later
// "export + delete old data" feature. The database keeps both columns consistent
// (inactive <=> date set); this file always writes them together.
//
// Rule: a person with an assigned iPad cannot be set inactive (Rückgabe + "Zuweisung aufheben" first).

// Per kind: table, the iPad column that points to the person, and German texts.
const PERSON_KINDS = {
  pupil: { table: 'pupils', ipadColumn: 'assigned_pupil_id', noun: 'Schüler',   detailView: () => renderPupilDetail() },
  staff: { table: 'staff',  ipadColumn: 'assigned_staff_id', noun: 'Lehrkraft', detailView: () => renderStaffDetail() },
};

// Today as yyyy-mm-dd in local time (<input type="date"> and the database use this format).
function todayIso() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "yyyy-mm-dd" -> "dd.mm.yyyy" (a plain date has no time zone, so no Date object here).
function formatIsoDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Serial numbers of the iPads currently assigned to this person ([] if none).
async function findAssignedIpads(kind, personId) {
  const { data, error } = await supabase
    .from('ipads')
    .select('serial_number')
    .eq(PERSON_KINDS[kind].ipadColumn, personId);
  if (error) throw error;
  return data.map(r => r.serial_number);
}

// The message shown when an iPad is still assigned.
function assignedIpadMessage(serials) {
  return `Es ist noch ein iPad zugewiesen (${serials.join(', ')}). `
       + 'Bitte zuerst die Rückgabe durchführen und „Zuweisung aufheben“.';
}

// HTML for the "Status" row on a detail card.
function personStatusRow(kind, person) {
  const label = person.is_active === false
    ? `<span class="badge badge-inactive">nicht mehr an der Schule seit ${escapeHtml(formatIsoDate(person.inactive_since))}</span>`
    : '<span class="badge" style="background:#34c759">aktiv</span>';
  const button = person.is_active === false
    ? `<button class="btn-action-detail" onclick="reactivatePerson('${kind}')">Wieder aktivieren</button>`
    : `<button class="btn-action-detail" onclick="openInactiveDialog('${kind}')">Als ausgeschieden markieren</button>`;
  return `
      <div class="detail-field">
        <span class="detail-key">Status</span>
        <span>${label} ${button}</span>
      </div>`;
}

// The person shown on the current detail page.
function _currentPerson(kind) { return kind === 'pupil' ? _currentPupil : _currentStaff; }

// Step 1: check for assigned iPads, then ask for the date.
async function openInactiveDialog(kind) {
  const person = _currentPerson(kind);
  let serials;
  try { serials = await findAssignedIpads(kind, person.id); }
  catch (e) { alert('Fehler: ' + e.message); return; }

  if (serials.length) { alert(assignedIpadMessage(serials)); return; }

  const name = `${person.first_name} ${person.last_name}`;
  const loginNote = (kind === 'staff' && person.user_id)
    ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.6rem">
         Hinweis: Der Zugang dieser Lehrkraft wird gesperrt. Beim Wiederaktivieren wird er entsperrt.</p>`
    : '';
  _openModal(`${PERSON_KINDS[kind].noun} als ausgeschieden markieren`, `
    <p style="font-size:0.875rem;margin-bottom:0.9rem">
      <strong>${escapeHtml(name)}</strong> ist nicht mehr an der Schule. Die Person verschwindet aus den
      Standardlisten und der iPad-Zuweisung; der Verlauf bleibt erhalten.
    </p>
    <div class="admin-form-group">
      <label>Seit wann? (z. B. letzter Schultag)</label>
      <input type="date" id="pi-date" value="${todayIso()}" max="${todayIso()}">
    </div>
    ${loginNote}
  `, 'Speichern', () => submitInactive(kind));
}

// Step 2: write is_active = false + the date.
async function submitInactive(kind) {
  const person = _currentPerson(kind);
  const date = document.getElementById('pi-date')?.value;
  if (!date)               { _modalError('Bitte ein Datum angeben.'); return; }
  if (date > todayIso())   { _modalError('Das Datum darf nicht in der Zukunft liegen.'); return; }

  _setBusy(true, 'Speichern');
  // Check again right before writing: an iPad may have been assigned while the dialog was open.
  let serials;
  try { serials = await findAssignedIpads(kind, person.id); }
  catch (e) { _setBusy(false, 'Speichern'); _modalError('Fehler: ' + e.message); return; }
  if (serials.length) { _setBusy(false, 'Speichern'); _modalError(assignedIpadMessage(serials)); return; }

  // A person who is not active must not keep access: lock the login FIRST, then save the status.
  // If the lock fails nothing changes; if the save fails afterwards the person is only locked (harmless).
  if (kind === 'staff' && person.user_id) {
    const [lock] = await manageStaffAccounts('lock', [person.user_id]);
    if (!lock.ok) {
      _setBusy(false, 'Speichern');
      _modalError('Der Zugang konnte nicht gesperrt werden, die Lehrkraft wurde nicht geändert: ' + lock.error);
      return;
    }
  }

  const { error } = await supabase
    .from(PERSON_KINDS[kind].table)
    .update({ is_active: false, inactive_since: date })
    .eq('id', person.id);
  if (error) { _setBusy(false, 'Speichern'); _modalError('Fehler: ' + error.message); return; }

  closeAdminModal();
  PERSON_KINDS[kind].detailView();
}

// Reactivating is always allowed; it clears the date.
async function reactivatePerson(kind) {
  const person = _currentPerson(kind);
  const { error } = await supabase
    .from(PERSON_KINDS[kind].table)
    .update({ is_active: true, inactive_since: null })
    .eq('id', person.id);
  if (error) { alert('Fehler: ' + error.message); return; }

  // Back at the school: unlock the login AFTER the status is saved (a failure leaves the person
  // active but locked, which is harmless; the admin can unlock it on the Lehrkraft page).
  if (kind === 'staff' && person.user_id) {
    const [unlock] = await manageStaffAccounts('unlock', [person.user_id]);
    if (!unlock.ok) {
      alert('Die Lehrkraft ist wieder aktiv, aber der Zugang konnte nicht entsperrt werden: ' + unlock.error
          + '\nBitte auf der Seite der Lehrkraft „Zugang entsperren“ wählen.');
    }
  }
  PERSON_KINDS[kind].detailView();
}
