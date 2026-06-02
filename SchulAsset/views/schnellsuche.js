// Schnellsuche view — serial number search and QR code scanner.

let _qrScanner = null;

async function renderSchnellsuche() {
  const container = document.getElementById('view-container');

  container.innerHTML = `
    <div class="view-header">
      <h2>Schnellsuche</h2>
    </div>

    <div class="dash-search-section">
      <h3 class="section-title">Seriennummer oder QR-Code</h3>
      <div class="dash-search-bar">
        <input
          type="text"
          id="sn-input"
          class="sn-input"
          placeholder="Seriennummer eingeben…"
          spellcheck="false"
          autocapitalize="characters"
        >
        <button class="btn-search" onclick="schnellsucheSearch()">Suchen</button>
        <button class="btn-qr" onclick="openQrScanner()" title="QR-Code scannen">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h7v7H3V3zm1.5 1.5v4h4v-4h-4zM14 3h7v7h-7V3zm1.5 1.5v4h4v-4h-4zM3 14h7v7H3v-7zm1.5 1.5v4h4v-4h-4zM14 14h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 0h2v2h-2v-2z"/>
          </svg>
        </button>
      </div>
      <div id="search-result" class="search-result-area"></div>
    </div>

    <!-- QR scanner modal -->
    <div id="qr-modal" class="qr-modal" hidden>
      <div class="qr-modal-inner">
        <p class="qr-hint">Kamera auf den QR-Code richten</p>
        <div id="qr-reader"></div>
        <button class="btn-qr-cancel" onclick="closeQrScanner()">Abbrechen</button>
      </div>
    </div>
  `;

  document.getElementById('sn-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') schnellsucheSearch();
  });
}

async function schnellsucheSearch() {
  const sn       = document.getElementById('sn-input').value.trim();
  const resultEl = document.getElementById('search-result');

  if (!sn) { resultEl.innerHTML = ''; return; }

  resultEl.innerHTML = '<p class="loading-msg">Suche…</p>';

  const { data: ipads, error } = await supabase
    .from('ipads')
    .select(`
      id, serial_number, ipad_type, storage_capacity, status, assigned_date,
      pupils:assigned_pupil_id (first_name, last_name),
      staff:assigned_staff_id  (first_name, last_name)
    `)
    .ilike('serial_number', `%${sn}%`)
    .limit(5);

  if (error) {
    resultEl.innerHTML = `<p class="error-inline">Fehler: ${error.message}</p>`;
    return;
  }

  if (ipads.length === 0) {
    resultEl.innerHTML = '<p class="empty-msg">Kein iPad mit dieser Seriennummer gefunden.</p>';
    return;
  }

  resultEl.innerHTML = ipads.map(ipad => `
    <div class="result-card">
      <div class="result-row"><span class="result-key">Seriennummer</span>
        <span class="mono">${ipad.serial_number}</span></div>
      <div class="result-row"><span class="result-key">Typ</span>
        <span>${TYPE_LABEL[ipad.ipad_type] ?? ipad.ipad_type}</span></div>
      <div class="result-row"><span class="result-key">Speicher</span>
        <span>${ipad.storage_capacity ?? '—'}</span></div>
      <div class="result-row"><span class="result-key">Status</span>
        <span>${statusBadge(ipad.status)}</span></div>
      <div class="result-row"><span class="result-key">Zugewiesen an</span>
        <span>${assignedName(ipad)}</span></div>
      <div class="result-actions">
        <button class="btn-details" onclick="showIpadDetail('${ipad.id}')">Details anzeigen →</button>
      </div>
    </div>
  `).join('');
}

function openQrScanner() {
  document.getElementById('qr-modal').hidden = false;

  if (window.Html5Qrcode) {
    _startScanner();
  } else {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    s.onload = _startScanner;
    document.head.appendChild(s);
  }
}

function _startScanner() {
  _qrScanner = new Html5Qrcode('qr-reader');
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  _qrScanner.start({ facingMode: 'environment' }, config, onQrSuccess, () => {})
    .catch(() => {
      _qrScanner.start({ facingMode: 'user' }, config, onQrSuccess, () => {});
    });
}

function onQrSuccess(decodedText) {
  document.getElementById('sn-input').value = decodedText;
  closeQrScanner();
  schnellsucheSearch();
}

function closeQrScanner() {
  document.getElementById('qr-modal').hidden = true;
  if (_qrScanner) {
    _qrScanner.stop()
      .then(() => { _qrScanner.clear(); _qrScanner = null; })
      .catch(() => { _qrScanner = null; });
  }
}
