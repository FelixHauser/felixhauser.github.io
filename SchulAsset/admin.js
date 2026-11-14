// Admin interface — auth guard, view routing, and shared utilities.

// ---- Shared data constants ----

// Display config for each iPad status value.
const STATUS_CONFIG = {
  available:            { label: 'Verfügbar',              color: '#34c759' },
  terms_pending:        { label: 'Leihvertrag ausstehend', color: '#ff9f0a', auto: true },
  handover_pending:     { label: 'Übergabe ausstehend',    color: '#ff9f0a', auto: true },
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

const TYPE_LABEL = {
  student: 'Schüler',
  staff:   'Lehrkraft',
};

// ---- Auth guard ----
// Called immediately on page load — bounces non-admins back to login.
async function initAdmin() {
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

  if (!roleRow || roleRow.role !== 'admin') {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('user-email').textContent = session.user.email;

  // Route to the view matching the URL hash, or default to iPads.
  routeToHash(window.location.hash.slice(1) || 'schnellsuche');
}

// ---- View router ----

// Arrow functions are used so the renderer names are looked up at call time,
// not at parse time — views/ipad-list.js and future view files load after admin.js.
const VIEW_RENDERERS = {
  schnellsuche:   () => renderSchnellsuche(),
  ipads:          () => renderIpadList(),
  pupils:         () => renderPupilList(),
  staff:          () => renderStaffList(),
  meldungen:      () => renderMeldungen(),
  activity:       () => renderActivity(),
  'ipad-detail':  () => renderIpadDetail(),
  'pupil-detail': () => renderPupilDetail(),
  'staff-detail': () => renderStaffDetail(),
};

// Detail views and the global that holds the id of the item they show.
// The id lives in the URL (#ipad-detail/<id>) so a reload, a bookmark or a pasted
// link shows the same item; the router copies it into this global for the view file.
const DETAIL_ID_GLOBALS = {
  'ipad-detail':  '_currentIpadId',
  'pupil-detail': '_currentPupilId',
  'staff-detail': '_currentStaffId',
};

// Shows the view for a URL hash such as "ipads" or "ipad-detail/<id>".
function routeToHash(hash) {
  // Keep the address bar in sync with what is shown: if we were asked for a page the
  // URL does not say (empty hash, unknown page, detail page without id), replace the
  // URL. replaceState adds no history entry and fires no hashchange, so there is no
  // double render and Back does not return to the broken address.
  if (window.location.hash.slice(1) !== hash) {
    history.replaceState(null, '', '#' + hash);
  }

  // "ipad-detail/<id>" -> view "ipad-detail", param "<id>".
  const slash = hash.indexOf('/');
  const view  = slash === -1 ? hash : hash.slice(0, slash);
  const param = slash === -1 ? ''   : hash.slice(slash + 1);

  // Highlight active sidebar link (detail views have no sidebar item).
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  // Hand the id to the detail view (cleared when the URL has none).
  const idGlobal = DETAIL_ID_GLOBALS[view];
  if (idGlobal) {
    window[idGlobal] = param || null;
  }

  if (Object.hasOwn(VIEW_RENDERERS, view)) {
    VIEW_RENDERERS[view]();
  } else {
    routeToHash('ipads');
  }
}

// Re-route whenever the user clicks a sidebar link.
window.addEventListener('hashchange', () => {
  routeToHash(window.location.hash.slice(1));
});

// ---- Sidebar (mobile) ----

function openSidebar() {
  document.getElementById('sidebar').classList.add('visible');
  document.getElementById('sidebar-overlay').classList.add('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('visible');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ---- Logout ----

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// Navigates to a detail view by putting the item's id into the URL.
// The hashchange listener above then calls routeToHash(), which sets the id global.
function _showDetail(view, id) {
  const target = view + '/' + id;
  if (window.location.hash.slice(1) === target) {
    // Same address: the browser fires no hashchange, so route directly.
    routeToHash(target);
  } else {
    window.location.hash = target;
  }
}

// Text for a failed write of a staff member: a unique violation (23505) means the Kürzel is taken.
function kuerzelErrorText(error, kuerzel) {
  return error.code === '23505'
    ? `Das Kürzel ${kuerzel || ''} ist bereits vergeben.`.replace('  ', ' ')
    : error.message;
}

// Loads ALL rows of a query. Supabase returns at most 1000 rows per request, so a plain
// query silently cuts off larger tables. Pass a function that builds a fresh query
// and a UNIQUE ordering — end with .order('id') if the other sort columns can repeat,
// otherwise rows may appear twice or be skipped between pages); it is run page by page.
// Returns { data, error } like a normal Supabase call.
async function fetchAllRows(buildQuery) {
  const pageSize = 1000;
  const all = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    all.push(...data);
    if (data.length < pageSize) break;
  }
  return { data: all, error: null };
}

// Navigates to the iPad detail view for the given iPad id.
function showIpadDetail(id)  { _showDetail('ipad-detail', id); }
function showPupilDetail(id) { _showDetail('pupil-detail', id); }
function showStaffDetail(id) { _showDetail('staff-detail', id); }

// ---- Shared rendering helpers (used across views) ----

// Returns an HTML badge for a given status value.
function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#8e8e93' };
  return `<span class="badge" style="background:${cfg.color}">${escapeHtml(cfg.label)}</span>`;
}

// Returns the full name of whoever an iPad is assigned to, or '—'.
function assignedName(ipad) {
  if (ipad.pupils) return `${ipad.pupils.first_name} ${ipad.pupils.last_name}`;
  if (ipad.staff)  return `${ipad.staff.first_name} ${ipad.staff.last_name}`;
  return '—';
}

// ---- Logins for teachers and admins (Edge Function create-staff-account) ----

// Simple e-mail check, same pattern as in the Edge Function (which checks again).
function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Creates 1–50 logins in one call. `accounts` = [{ email, role: 'teacher' | 'admin', staff_id? }].
// Returns one result per entry, in the same order: { email, password } or { email, error }.
// Throws an Error with a readable text if the whole call fails (function not deployed, not an admin, …).
async function createStaffAccounts(accounts) {
  const { data, error } = await supabase.functions.invoke('create-staff-account', { body: { accounts } });

  if (error || !Array.isArray(data?.results)) {
    // For non-2xx answers the real message is in the response body (read as text first: it may not be JSON).
    const rawBody = await error?.context?.text?.().catch(() => null);
    let detail = null;
    try { detail = JSON.parse(rawBody); } catch { detail = rawBody ? { error: rawBody } : null; }
    console.error('create-staff-account failed:', error?.context?.status, rawBody);   // error answers contain no passwords
    throw new Error(detail?.error || error?.message || 'Die Funktion hat nicht geantwortet');
  }
  return data.results;
}

// Shows e-mail and password ONCE in the admin dialog. The password is not stored anywhere;
// closing the dialog empties it (closeAdminModal), so it cannot be shown again.
function showCredentialsDialog({ title, email, password, note = '' }) {
  _openModal(title, `
    <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1rem">
      Zugangsdaten für <strong>${escapeHtml(email)}</strong>:
    </p>
    <div style="background:#F6F9FC;border:1.5px solid var(--border);border-radius:8px;padding:0.9rem;margin-bottom:0.6rem">
      <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.3rem">Benutzername (E-Mail)</div>
      <div style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--text-primary);overflow-wrap:anywhere">${escapeHtml(email)}</div>
    </div>
    <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:8px;padding:0.9rem;margin-bottom:0.75rem">
      <div style="font-size:0.7rem;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.3rem">Passwort</div>
      <div id="cred-password" style="font-family:monospace;font-size:1.4rem;font-weight:700;color:#15803d;letter-spacing:1px">${escapeHtml(password)}</div>
    </div>
    <button class="btn-action-detail" type="button"
            onclick="navigator.clipboard?.writeText(document.getElementById('cred-password').textContent); this.textContent='Kopiert ✓'">Passwort kopieren</button>
    <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.8rem">
      Das Passwort wird nicht gespeichert und kann später nicht mehr angezeigt werden.
      Anmeldung auf der Login-Seite; ein neues Passwort gibt es über „Passwort vergessen?“.
      ${escapeHtml(note)}
    </p>
  `, 'Verstanden', closeAdminModal);
  document.querySelector('.admin-modal-footer').innerHTML =
    '<button class="btn-primary" onclick="closeAdminModal()">Verstanden</button>';
}

// initAdmin() is called from admin.html after all view scripts have loaded.
