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
