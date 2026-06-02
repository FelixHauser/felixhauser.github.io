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

  console.log('user id:', authData.user.id);
  console.log('role row:', roleRow);
  console.log('role error:', roleError);

  if (roleError || !roleRow) {
    showError(t('login.errorNoRole'));
    await supabase.auth.signOut();
    setLoading(false);
    return;
  }

  // Route to the correct interface.
  if (roleRow.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'portal.html';
  }
}

// --- Forgot / reset password ---

// On page load: if the URL contains a recovery token (user clicked the reset email link),
// skip the login form and show the new-password form instead.
window.addEventListener('load', () => {
  // QR code auto-login: ?sn=SERIAL&pw=PASSWORD
  const params = new URLSearchParams(window.location.search);
  const sn = params.get('sn');
  const pw = params.get('pw');
  if (sn && pw) {
    document.getElementById('login-form').hidden     = true;
    document.getElementById('autologin-msg').hidden  = false;
    _autoLogin(sn, pw);
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

  window.location.href = roleRow.role === 'admin' ? 'admin.html' : 'portal.html';
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
    msgEl.textContent = 'Bitte eine E-Mail-Adresse eingeben.';
    msgEl.hidden = false;
    return;
  }

  const redirectTo = window.location.href.split('#')[0];
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    msgEl.textContent = 'Fehler: ' + error.message;
    msgEl.className   = 'error-msg';
    msgEl.hidden      = false;
    return;
  }

  msgEl.textContent = 'Reset-Link gesendet. Bitte prüfe dein E-Mail-Postfach.';
  msgEl.className   = 'success-msg';
  msgEl.hidden      = false;
}

async function handleNewPassword() {
  const password = document.getElementById('new-password').value;
  const msgEl    = document.getElementById('new-pw-msg');
  msgEl.hidden   = true;

  if (password.length < 6) {
    msgEl.textContent = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
    msgEl.hidden = false;
    return;
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    msgEl.textContent = 'Fehler: ' + error.message;
    msgEl.hidden = false;
    return;
  }

  msgEl.textContent = 'Passwort gespeichert. Du wirst weitergeleitet…';
  msgEl.hidden = false;
  setTimeout(() => { window.location.href = 'admin.html'; }, 1500);
}

// --- Helper functions ---

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
