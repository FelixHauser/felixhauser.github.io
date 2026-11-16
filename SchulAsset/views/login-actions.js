// Shared dialogs for actions on teacher and admin logins:
// lock, unlock, delete, set a new password. (OpenSpec change `manage-logins`.)
//
// Used by the Lehrkraft detail page, the Lehrkräfte list (batch) and the Admins page.
// The server (Edge Function manage-staff-account) does the work and enforces the rules;
// this file only asks for confirmation, calls manageStaffAccounts() from admin.js and shows the result.

const LOGIN_ACTIONS = {
  lock: {
    title:  'Zugang sperren',
    button: 'Sperren',
    done:   'gesperrt',
    text:   who => `Der Zugang von ${who} wird gesperrt. Anmelden ist dann nicht mehr möglich.
                    Das lässt sich jederzeit mit „Zugang entsperren“ rückgängig machen.`,
  },
  unlock: {
    title:  'Zugang entsperren',
    button: 'Entsperren',
    done:   'entsperrt',
    text:   who => `Der Zugang von ${who} wird entsperrt. Anmelden ist dann wieder möglich, mit dem bisherigen Passwort.`,
  },
  delete: {
    title:  'Zugang löschen',
    button: 'Endgültig löschen',
    done:   'gelöscht',
    text:   who => `Der Zugang von ${who} wird <strong>endgültig gelöscht</strong>. Das kann nicht rückgängig gemacht werden.
                    Eine Lehrkraft bleibt als Person erhalten und kann später einen neuen Zugang bekommen.`,
  },
  reset_password: {
    title:  'Neues Passwort setzen',
    button: 'Neues Passwort setzen',
    done:   'neues Passwort gesetzt',
    text:   who => `Für ${who} wird ein neues Passwort erzeugt. Das alte Passwort funktioniert danach nicht mehr.
                    Das neue Passwort wird einmal angezeigt und nicht gespeichert.`,
  },
};

// Badge for the state of a login. `login` = an entry of listStaffLogins(), or null for "no login".
function loginStateBadge(login) {
  if (!login)        return '<span class="badge" style="background:#8e8e93">kein Zugang</span>';
  if (login.locked)  return '<span class="badge" style="background:#ff3b30">gesperrt</span>';
  return '<span class="badge" style="background:#34c759">aktiv</span>';
}

// The dialog's state. Kept in a variable (not written into button HTML) like the other dialogs.
let _loginAction = null;   // { action, people: [{ user_id, email, name }], onDone }

// Opens the confirmation dialog.
// people = [{ user_id, email, name }] — the logins concerned; onDone() runs after the server answered
// (use it to refresh the page behind the dialog).
function openLoginActionDialog(action, people, onDone) {
  const cfg = LOGIN_ACTIONS[action];
  if (!cfg || people.length === 0) return;
  _loginAction = { action, people, onDone };

  const who = people.length === 1
    ? `<strong>${escapeHtml(people[0].name)}</strong> (${escapeHtml(people[0].email)})`
    : `<strong>${people.length} Zugängen</strong>`;
  // Several people: name the first few so the admin can see who is meant.
  const names = people.length > 1
    ? `<p class="field-hint">${people.slice(0, 5).map(p => escapeHtml(p.name)).join(', ')}${people.length > 5 ? ` … und ${people.length - 5} weitere` : ''}</p>`
    : '';

  _openModal(cfg.title, `
    <p style="font-size:0.875rem;color:var(--text-secondary)">${cfg.text(who)}</p>
    ${names}
  `, cfg.button, runLoginAction);
}

// Confirmed: send the action to the server and show the result.
async function runLoginAction() {
  const { action, people, onDone } = _loginAction;
  const cfg = LOGIN_ACTIONS[action];
  _setBusy(true, cfg.button);

  const results = await manageStaffAccounts(action, people.map(p => p.user_id));
  const ok     = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  // One person and it failed: keep the dialog open and say why.
  if (people.length === 1 && failed.length === 1) {
    _setBusy(false, cfg.button);
    _modalError(failed[0].error);
    return;
  }

  if (onDone) onDone();   // refresh the page behind the dialog

  if (people.length === 1) {
    if (action === 'reset_password') {
      showCredentialsDialog({ title: 'Neues Passwort', email: ok[0].email, password: ok[0].password });
    } else {
      closeAdminModal();
    }
    return;
  }
  _showLoginActionSummary(action, people, results);
}

// Result of an action on several logins: counts, problems per person, and for new passwords
// the one-time credentials file (same mechanism as the CSV import: in memory only).
function _showLoginActionSummary(action, people, results) {
  const cfg    = LOGIN_ACTIONS[action];
  const nameBy = new Map(people.map(p => [p.user_id, p.name]));
  const ok     = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const shown  = failed.slice(0, 20);

  if (action === 'reset_password' && ok.length) {
    _importCredentials = ok.map(r => ({ email: r.email, password: r.password, name: nameBy.get(r.user_id) || '' }));
  }

  document.getElementById('admin-modal-title').textContent = cfg.title;
  document.getElementById('admin-modal-body').innerHTML = `
    <p><strong>${ok.length} ${escapeHtml(cfg.done)}</strong> · ${failed.length} nicht ausgeführt</p>
    ${failed.length ? `
      <div class="table-wrap"><table class="data-table"><thead>
        <tr><th>Person</th><th>Problem</th></tr></thead><tbody>
        ${shown.map(f => `<tr><td>${escapeHtml(nameBy.get(f.user_id) || f.user_id)}</td><td>${escapeHtml(f.error)}</td></tr>`).join('')}
      </tbody></table></div>
      ${failed.length > shown.length ? `<p class="field-hint">… und ${failed.length - shown.length} weitere</p>` : ''}
    ` : ''}
    ${action === 'reset_password' && ok.length ? `
      <div class="admin-modal-warn" style="margin-top:0.8rem">
        Die Datei enthält Passwörter im Klartext. Sie werden nirgends gespeichert und können nach dem
        Schließen dieses Fensters nicht mehr angezeigt werden. Bitte nach dem Verteilen löschen.
      </div>
      <button class="btn-action-detail" style="margin-top:0.6rem" onclick="downloadImportCredentials()">Zugangsdaten herunterladen</button>
    ` : ''}
  `;
  document.getElementById('admin-modal-error').hidden = true;
  document.querySelector('.admin-modal-footer').innerHTML =
    '<button class="btn-primary" onclick="closeAdminModal()">Schließen</button>';
}
