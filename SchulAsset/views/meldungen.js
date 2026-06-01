// Meldungen view — lists all Schadenmeldungen and Verlustmeldungen with download buttons.

const DAMAGE_LABELS = { screen: 'Display', water: 'Wasserschaden', other: 'Sonstiges' };

let _schadenRows = [];
let _verlustRows = [];

async function renderMeldungen() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header">
      <h2>Meldungen</h2>
    </div>
    <div id="meldungen-body"><p class="loading-msg">Wird geladen…</p></div>
  `;

  const [{ data: schaden, error: se }, { data: verlust, error: ve }] = await Promise.all([
    supabase
      .from('schadenmeldung')
      .select(`*, ipad:ipad_id (serial_number, pupils:assigned_pupil_id (first_name, last_name, address))`)
      .order('filed_at', { ascending: false }),
    supabase
      .from('verlustmeldung')
      .select(`*, ipad:ipad_id (serial_number, pupils:assigned_pupil_id (first_name, last_name, address))`)
      .order('filed_at', { ascending: false }),
  ]);

  if (se || ve) {
    document.getElementById('meldungen-body').innerHTML =
      `<p class="error-inline">Daten konnten nicht geladen werden.</p>`;
    return;
  }

  _schadenRows = schaden || [];
  _verlustRows = verlust || [];

  _renderMeldungenTab('schaden');
}

function _renderMeldungenTab(tab) {
  const schadenActive = tab === 'schaden';

  const tabsHtml = `
    <div class="meldungen-tabs">
      <button class="tab-btn ${schadenActive ? 'active' : ''}"
        onclick="_renderMeldungenTab('schaden')">
        Schadenmeldungen
        <span class="tab-count">${_schadenRows.length}</span>
      </button>
      <button class="tab-btn ${!schadenActive ? 'active' : ''}"
        onclick="_renderMeldungenTab('verlust')">
        Verlustmeldungen
        <span class="tab-count">${_verlustRows.length}</span>
      </button>
    </div>
  `;

  const body = document.getElementById('meldungen-body');

  if (schadenActive) {
    if (_schadenRows.length === 0) {
      body.innerHTML = tabsHtml + '<p class="empty-msg">Keine Schadenmeldungen vorhanden.</p>';
      return;
    }

    const rows = _schadenRows.map((r, i) => `
      <tr>
        <td>
          <button class="btn-link" onclick="showIpadDetail('${r.ipad_id}')">
            ${r.ipad?.serial_number || '—'}
          </button>
        </td>
        <td>${r.filed_by || '—'}</td>
        <td>${DAMAGE_LABELS[r.damage_type] || r.damage_type}</td>
        <td>${_fmtDate(r.filed_at)}</td>
        <td>
          <button class="btn-history-download" onclick="downloadMeldung('schaden', ${i})">
            ↓ Herunterladen
          </button>
        </td>
      </tr>
    `).join('');

    body.innerHTML = tabsHtml + `
      <div class="table-wrap">
        <table class="data-table" style="cursor:default">
          <thead>
            <tr>
              <th>Seriennummer</th>
              <th>Gemeldet von</th>
              <th>Art des Schadens</th>
              <th>Datum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

  } else {
    if (_verlustRows.length === 0) {
      body.innerHTML = tabsHtml + '<p class="empty-msg">Keine Verlustmeldungen vorhanden.</p>';
      return;
    }

    const rows = _verlustRows.map((r, i) => `
      <tr>
        <td>
          <button class="btn-link" onclick="showIpadDetail('${r.ipad_id}')">
            ${r.ipad?.serial_number || '—'}
          </button>
        </td>
        <td>${r.filed_by || '—'}</td>
        <td>${_fmtDate(r.date_of_loss)}</td>
        <td>${_fmtDate(r.filed_at)}</td>
        <td>
          <button class="btn-history-download" onclick="downloadMeldung('verlust', ${i})">
            ↓ Herunterladen
          </button>
        </td>
      </tr>
    `).join('');

    body.innerHTML = tabsHtml + `
      <div class="table-wrap">
        <table class="data-table" style="cursor:default">
          <thead>
            <tr>
              <th>Seriennummer</th>
              <th>Gemeldet von</th>
              <th>Datum des Verlusts</th>
              <th>Gemeldet am</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
}

async function downloadMeldung(type, index) {
  const r = type === 'schaden' ? _schadenRows[index] : _verlustRows[index];
  if (!r) return;

  // Fetch guardian data from most recent Leihvertrag acceptance for this iPad.
  const { data: terms } = await supabase
    .from('terms_acceptance')
    .select('erz_first_name, erz_last_name, erz_address')
    .eq('ipad_id', r.ipad_id)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    if (type === 'schaden') {
      await generateSchadenmeldung({
        serial_number:     r.ipad?.serial_number,
        last_name:         r.ipad?.pupils?.last_name,
        first_name:        r.ipad?.pupils?.first_name,
        damage_type:       r.damage_type,
        description:       r.description,
        datum_eingetreten: r.datum_eingetreten,
        datum_entdeckt:    r.datum_entdeckt,
        perpetrator:       r.perpetrator,
        erz_first_name:    terms?.erz_first_name,
        erz_last_name:     terms?.erz_last_name,
        erz_address:       terms?.erz_address,
        filed_at:          r.filed_at,
      });
    } else {
      generateVerlustmeldung({
        serial_number:        r.ipad?.serial_number,
        last_name:            r.ipad?.pupils?.last_name,
        first_name:           r.ipad?.pupils?.first_name,
        date_of_loss:         r.date_of_loss,
        circumstances:        r.circumstances,
        ort_verlust:          r.ort_verlust,
        datum_bemerkt:        r.datum_bemerkt,
        police_report_number: r.police_report_number,
        notitzen:             r.notitzen,
        erz_first_name:       terms?.erz_first_name,
        erz_last_name:        terms?.erz_last_name,
        erz_address:          terms?.erz_address,
        filed_at:             r.filed_at,
      });
    }
  } catch (e) {
    console.error('Download error:', e);
    alert('Download fehlgeschlagen: ' + (e.message || e));
  }
}

function _fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
