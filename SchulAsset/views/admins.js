// Admins page — all admin logins by e-mail, with lock / unlock / delete / new password.
// (OpenSpec change `manage-logins`.) Admins are identified by e-mail only; they are not
// linked to a person. The server enforces the rules (not your own login, never the last
// active admin); this page just shows its reasons when an action is refused.

let _adminLogins = [];       // admin logins as listStaffLogins() returns them
let _ownUserId   = null;     // the signed-in admin (their own row has no lock / delete)

async function renderAdmins() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header detail-header">
      <button class="btn-back" onclick="routeToHash('admin')">← Verwaltung</button>
      <h2>Admins</h2>
    </div>
    <div id="admins-body"><p class="loading-msg">Wird geladen…</p></div>
  `;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    _ownUserId = session?.user?.id ?? null;
    _adminLogins = (await listStaffLogins())
      .filter(l => l.role === 'admin')
      .sort((a, b) => a.email.localeCompare(b.email, 'de', { sensitivity: 'base' }));
  } catch (e) {
    document.getElementById('admins-body').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${escapeHtml(e.message)}</p>`;
    return;
  }

  const rows = _adminLogins.map(l => {
    const own = l.user_id === _ownUserId;
    const lockButton = l.locked
      ? `<button class="btn-action-detail" onclick="adminLoginAction('unlock','${l.user_id}')">Entsperren</button>`
      : `<button class="btn-action-detail" onclick="adminLoginAction('lock','${l.user_id}')">Sperren</button>`;
    return `
      <tr>
        <td>${escapeHtml(l.email)}${own ? ' <span class="field-hint">(Sie)</span>' : ''}</td>
        <td>${loginStateBadge(l)}</td>
        <td>${l.last_sign_in_at ? escapeHtml(new Date(l.last_sign_in_at).toLocaleString('de-DE')) : '—'}</td>
        <td style="white-space:nowrap">
          ${own ? '' : lockButton}
          <button class="btn-action-detail" onclick="adminLoginAction('reset_password','${l.user_id}')">Neues Passwort</button>
          ${own ? '' : `<button class="btn-action-detail" onclick="adminLoginAction('delete','${l.user_id}')">Löschen</button>`}
        </td>
      </tr>`;
  }).join('');

  document.getElementById('admins-body').innerHTML = `
    <div class="result-count">${_adminLogins.length} Admin${_adminLogins.length !== 1 ? 's' : ''}</div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>E-Mail</th><th>Zugang</th><th>Letzte Anmeldung</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">Keine Admins gefunden.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="panel-hint">Den eigenen Zugang können Sie nicht sperren oder löschen, und der letzte aktive Admin
      bleibt immer erhalten. Neue Admins legen Sie unter Verwaltung → Zugänge an.</p>
  `;
}

// Opens the confirmation dialog for one admin login (ids come from the server's list, so they are safe in onclick).
function adminLoginAction(action, userId) {
  const l = _adminLogins.find(x => x.user_id === userId);
  if (!l) return;
  openLoginActionDialog(action, [{ user_id: l.user_id, email: l.email, name: l.email }], () => renderAdmins());
}
