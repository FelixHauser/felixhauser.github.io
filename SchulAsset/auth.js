// Auth logic — login, logout, role detection, and page routing.

// Called when the login form is submitted.
async function handleLogin(event) {
  event.preventDefault();

  const usernameRaw = document.getElementById('username').value.trim();
  const password    = document.getElementById('password').value;
  const errorDiv    = document.getElementById('error-msg');
  const loginBtn    = document.getElementById('login-btn');

  // Hide any previous error and show loading state.
  hideError();
  setLoading(true);

  // Build the email Supabase Auth expects.
  // Admins type their real email; students type their serial number.
  // The @ check lets us distinguish the two without a separate toggle.
  const email = usernameRaw.includes('@')
    ? usernameRaw
    : `${usernameRaw.toUpperCase()}@schulasset.local`;

  // Attempt sign-in.
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    showError(t('login.errorInvalidCredentials'));
    setLoading(false);
    return;
  }

  // Look up the user's role so we know which interface to show.
  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authData.user.id)
    .single();

  if (roleError || !roleRow) {
    showError(t('login.errorNoRole'));
    await supabase.auth.signOut();
    setLoading(false);
    return;
  }

  // Route to the correct interface.
  window.location.href = pageForRole(roleRow.role);
}

// --- Forgot / reset password ---

// On page load: if the URL contains a recovery token (user clicked the reset email link),
// skip the login form and show the new-password form instead.
window.addEventListener('load', () => {
  // QR code auto-login: login.html#sn=SERIAL&pw=PASSWORD (new cards) or
  // login.html?sn=SERIAL&pw=PASSWORD (cards printed earlier). See qr-login-url.js.
  const qr = parseQrLogin(window.location.search, window.location.hash);
  if (qr) {
    // Remove the credentials from the address bar right away, so they do not stay
    // visible or in the browser history. replaceState: no reload, no history entry.
    history.replaceState(null, '', window.location.pathname);
    document.getElementById('login-form').hidden     = true;
    document.getElementById('autologin-msg').hidden  = false;
    _autoLogin(qr.sn, qr.pw);
    return;
  }

  if (window.location.hash.includes('type=recovery')) {
    showNewPasswordForm();
  }
});

async function _autoLogin(sn, pw) {
  const email = `${sn.toUpperCase()}@schulasset.local`;
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: pw });

  if (error || !authData?.user) {
    document.getElementById('login-form').hidden = false;
    showError(t('login.errorInvalidCredentials'));
    return;
  }

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', authData.user.id).single();

  if (!roleRow) {
    await supabase.auth.signOut();
    document.getElementById('login-form').hidden = false;
    showError(t('login.errorNoRole'));
    return;
  }

  window.location.href = pageForRole(roleRow.role);
}

function showForgotForm() {
  document.getElementById('login-form').hidden    = true;
  document.getElementById('forgot-section').hidden = false;
  document.getElementById('new-password-section').hidden = true;
  document.getElementById('reset-msg').hidden = true;
}

function showLoginForm() {
  document.getElementById('login-form').hidden    = false;
  document.getElementById('forgot-section').hidden = true;
  document.getElementById('new-password-section').hidden = true;
}

function showNewPasswordForm() {
  document.getElementById('login-form').hidden    = true;
  document.getElementById('forgot-section').hidden = true;
  document.getElementById('new-password-section').hidden = false;
}

async function handleForgotPassword() {
  const email   = document.getElementById('reset-email').value.trim();
  const msgEl   = document.getElementById('reset-msg');
  msgEl.hidden  = true;

  if (!email) {
    msgEl.textContent = t('login.errorEmailRequired');
    msgEl.hidden = false;
    return;
  }

  const redirectTo = window.location.href.split('#')[0];
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    msgEl.textContent = t('login.errorPrefix') + ' ' + error.message;
    msgEl.className   = 'error-msg';
    msgEl.hidden      = false;
    return;
  }

  msgEl.textContent = t('login.resetLinkSent');
  msgEl.className   = 'success-msg';
  msgEl.hidden      = false;
}

async function handleNewPassword() {
  const password = document.getElementById('new-password').value;
  const msgEl    = document.getElementById('new-pw-msg');
  msgEl.hidden   = true;

  if (password.length < 6) {
    msgEl.textContent = t('login.errorPasswordTooShort');
    msgEl.hidden = false;
    return;
  }

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    msgEl.textContent = t('login.errorPrefix') + ' ' + error.message;
    msgEl.hidden = false;
    return;
  }

  msgEl.textContent = t('login.passwordSaved');
  msgEl.hidden = false;

  // Admins go back to the admin area, teachers to the lookup page.
  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', data.user.id).single();
  const target = pageForRole(roleRow?.role);
  setTimeout(() => { window.location.href = target; }, 1500);
}

// --- Helper functions ---

// The page each role belongs on after login.
function pageForRole(role) {
  if (role === 'admin')   return 'admin.html';
  if (role === 'teacher') return 'lookup.html';
  return 'portal.html';
}

function showError(message) {
  const el = document.getElementById('error-msg');
  el.textContent = message;
  el.hidden = false;
}

function hideError() {
  const el = document.getElementById('error-msg');
  el.hidden = true;
}

function setLoading(isLoading) {
  const btn  = document.getElementById('login-btn');
  const span = btn.querySelector('span');
  btn.disabled = isLoading;
  span.textContent = isLoading ? t('login.loggingIn') : t('login.loginButton');
}
