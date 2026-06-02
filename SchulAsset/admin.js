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

function routeToHash(hash) {
  // Highlight active sidebar link.
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === hash);
  });

  const render = VIEW_RENDERERS[hash];
  if (render) {
    render();
  } else {
    routeToHash('ipads');
  }
}

// Re-route whenever the user clicks a sidebar link.
window.addEventListener('hashchange', () => {
  if (typeof closeQrScanner === 'function') closeQrScanner();
  routeToHash(window.location.hash.slice(1));
});

window.addEventListener('beforeunload', () => {
  if (typeof closeQrScanner === 'function') closeQrScanner();
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

// Navigates to the iPad detail view for the given iPad id.
function showIpadDetail(id) {
  window._currentIpadId = id;
  window.location.hash = 'ipad-detail';
}

function showPupilDetail(id) {
  window._currentPupilId = id;
  window.location.hash = 'pupil-detail';
}

function showStaffDetail(id) {
  window._currentStaffId = id;
  window.location.hash = 'staff-detail';
}

// Escapes a string for safe insertion into HTML attributes and text.
function _htmlEsc(str) {
  return (str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Shared rendering helpers (used across views) ----

// Returns an HTML badge for a given status value.
function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#8e8e93' };
  return `<span class="badge" style="background:${cfg.color}">${cfg.label}</span>`;
}

// Returns the full name of whoever an iPad is assigned to, or '—'.
function assignedName(ipad) {
  if (ipad.pupils) return `${ipad.pupils.first_name} ${ipad.pupils.last_name}`;
  if (ipad.staff)  return `${ipad.staff.first_name} ${ipad.staff.last_name}`;
  return '—';
}

// initAdmin() is called from admin.html after all view scripts have loaded.
