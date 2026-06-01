// Dashboard view — iPad status overview.

async function renderDashboard() {
  const container = document.getElementById('view-container');

  container.innerHTML = `
    <div class="view-header">
      <h2>Dashboard</h2>
    </div>
    <div id="overview-area">
      <p class="loading-msg">Wird geladen…</p>
    </div>
  `;

  await loadOverview();
}

async function loadOverview() {
  const { data: ipads, error } = await supabase
    .from('ipads')
    .select('status');

  if (error) {
    document.getElementById('overview-area').innerHTML =
      `<p class="error-inline">Fehler beim Laden: ${error.message}</p>`;
    return;
  }

  const counts = {};
  for (const ipad of ipads) {
    counts[ipad.status] = (counts[ipad.status] || 0) + 1;
  }

  const cards = Object.entries(STATUS_CONFIG).map(([key, cfg]) => `
    <div class="stat-card">
      <div class="stat-bar" style="background:${cfg.color}"></div>
      <div class="stat-count">${counts[key] ?? 0}</div>
      <div class="stat-label">${cfg.label}</div>
    </div>
  `).join('');

  document.getElementById('overview-area').innerHTML = `
    <div class="total-banner">
      <span class="total-number">${ipads.length}</span>
      <span class="total-text">iPads gesamt</span>
    </div>
    <div class="stat-grid">${cards}</div>
  `;
}
