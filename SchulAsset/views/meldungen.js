// Pending view — admin action inbox.
// Four tabs:
//   1. Schadenmeldungen  — unresolved damage reports
//   2. Verlustmeldungen  — unresolved loss reports
//   3. Übergabe          — terms accepted but no Übergabeprotokoll created yet
//   4. Rückgabe          — Rückgabeprotokoll signed but iPad still assigned

const DAMAGE_LABELS = { screen: 'Display', water: 'Wasserschaden', other: 'Sonstiges' };

let _schadenRows   = [];
let _verlustRows   = [];
let _uebergabeRows = [];
let _rueckgabeRows = [];

async function renderMeldungen() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="view-header">
      <h2>Pending</h2>
    </div>
    <div id="meldungen-body"><p class="loading-msg">Wird geladen…</p></div>
  `;

  const [
    { data: schaden,  error: se },
    { data: verlust,  error: ve },
    uebergabe,
    { data: rueckgabe, error: re },
  ] = await Promise.all([
    supabase
      .from('schadenmeldung')
      .select(`*, ipad:ipad_id (serial_number, pupils:assigned_pupil_id (first_name, last_name, address))`)
      .is('resolved_at', null)
      .order('filed_at', { ascending: false }),
    supabase
      .from('verlustmeldung')
      .select(`*, ipad:ipad_id (serial_number, pupils:assigned_pupil_id (first_name, last_name, address))`)
      .is('resolved_at', null)
      .order('filed_at', { ascending: false }),
    _fetchUebergabePending(),
    supabase
      .from('rueckgabeprotokoll')
      .select(`id, accepted_at, ipad_id, ipad:ipad_id (id, serial_number, assigned_pupil_id, pupils:assigned_pupil_id (first_name, last_name))`)
      .not('accepted_at', 'is', null)
      .order('accepted_at', { ascending: false }),
  ]);

  if (se || ve || re) {
    document.getElementById('meldungen-body').innerHTML =
      `<p class="error-inline">Daten konnten nicht geladen werden.</p>`;
    return;
  }

  _schadenRows   = schaden  || [];
  _verlustRows   = verlust  || [];
  _uebergabeRows = uebergabe || [];
  // Only show Rückgabe rows where the iPad is still assigned (admin hasn't cleared it yet).
  _rueckgabeRows = (rueckgabe || []).filter(r => r.ipad?.assigned_pupil_id);

  _renderPendingTab('schaden');
}

// Returns iPads that have accepted terms but no Übergabeprotokoll created since the current assignment.
async function _fetchUebergabePending() {
  const { data: ipads, error } = await supabase
    .from('ipads')
    .select('id, serial_number, assigned_date, assigned_pupil_id, pupils:assigned_pupil_id (first_name, last_name)')
    .not('assigned_pupil_id', 'is', null);

  if (error || !ipads || ipads.length === 0) return [];

  const ipadIds = ipads.map(i => i.id);

  const [{ data: terms }, { data: ueberg }] = await Promise.all([
    supabase
      .from('terms_acceptance')
      .select('ipad_id, accepted_at')
      .in('ipad_id', ipadIds)
      .is('invalidated_at', null),
    supabase
      .from('uebergabeprotokoll')
      .select('ipad_id, created_at')
      .in('ipad_id', ipadIds),
  ]);

  const termsSet = new Set((terms || []).map(t => t.ipad_id));

  const uebergMap = {};
  for (const u of (ueberg || [])) {
    if (!uebergMap[u.ipad_id]) uebergMap[u.ipad_id] = [];
    uebergMap[u.ipad_id].push(u.created_at);
  }

  return ipads.filter(ipad => {
    if (!termsSet.has(ipad.id)) return false;
    const dates = uebergMap[ipad.id] || [];
    return !dates.some(d => !ipad.assigned_date || new Date(d) >= new Date(ipad.assigned_date));
  });
}

function _renderPendingTab(tab) {
  const tabs = [
    { key: 'schaden',   label: 'Schadenmeldungen', count: _schadenRows.length },
    { key: 'verlust',   label: 'Verlustmeldungen',  count: _verlustRows.length },
    { key: 'uebergabe', label: 'Übergabe',           count: _uebergabeRows.length },
    { key: 'rueckgabe', label: 'Rückgabe',           count: _rueckgabeRows.length },
  ];

  const tabsHtml = `
    <div class="meldungen-tabs">
      ${tabs.map(t => `
        <button class="tab-btn ${tab === t.key ? 'active' : ''}"
          onclick="_renderPendingTab('${t.key}')">
          ${t.label}
          <span class="tab-count">${t.count}</span>
        </button>
      `).join('')}
    </div>
  `;

  const body = document.getElementById('meldungen-body');

  if (tab === 'schaden') {
    if (_schadenRows.length === 0) {
      body.innerHTML = tabsHtml + '<p class="empty-msg">Keine offenen Schadenmeldungen.</p>';
      return;
    }
    const rows = _schadenRows.map((r, i) => `
      <tr>
        <td><button class="btn-link" onclick="showIpadDetail('${r.ipad_id}')">${r.ipad?.serial_number || '—'}</button></td>
        <td>${r.filed_by || '—'}</td>
        <td>${DAMAGE_LABELS[r.damage_type] || r.damage_type}</td>
        <td>${_fmtDate(r.filed_at)}</td>
        <td><button class="btn-history-download" onclick="downloadMeldung('schaden', ${i})">↓ Herunterladen</button></td>
        <td><button class="btn-resolve" onclick="resolveMeldung('schaden', '${r.id}', ${i})">Erledigt</button></td>
      </tr>
    `).join('');
    body.innerHTML = tabsHtml + `
      <div class="table-wrap">
        <table class="data-table" style="cursor:default">
          <thead><tr>
            <th>Seriennummer</th><th>Gemeldet von</th><th>Art des Schadens</th><th>Datum</th><th></th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

  } else if (tab === 'verlust') {
    if (_verlustRows.length === 0) {
      body.innerHTML = tabsHtml + '<p class="empty-msg">Keine offenen Verlustmeldungen.</p>';
      return;
    }
    const rows = _verlustRows.map((r, i) => `
      <tr>
        <td><button class="btn-link" onclick="showIpadDetail('${r.ipad_id}')">${r.ipad?.serial_number || '—'}</button></td>
        <td>${r.filed_by || '—'}</td>
        <td>${_fmtDate(r.date_of_loss)}</td>
        <td>${_fmtDate(r.filed_at)}</td>
        <td><button class="btn-history-download" onclick="downloadMeldung('verlust', ${i})">↓ Herunterladen</button></td>
        <td><button class="btn-resolve" onclick="resolveMeldung('verlust', '${r.id}', ${i})">Erledigt</button></td>
      </tr>
    `).join('');
    body.innerHTML = tabsHtml + `
      <div class="table-wrap">
        <table class="data-table" style="cursor:default">
          <thead><tr>
            <th>Seriennummer</th><th>Gemeldet von</th><th>Datum des Verlusts</th><th>Gemeldet am</th><th></th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

  } else if (tab === 'uebergabe') {
    if (_uebergabeRows.length === 0) {
      body.innerHTML = tabsHtml + '<p class="empty-msg">Keine ausstehenden Übergabeprotokolle.</p>';
      return;
    }
    const rows = _uebergabeRows.map(r => `
      <tr>
        <td><button class="btn-link" onclick="showIpadDetail('${r.id}')">${r.serial_number || '—'}</button></td>
        <td>${r.pupils ? r.pupils.first_name + ' ' + r.pupils.last_name : '—'}</td>
        <td>Übergabeprotokoll erstellen</td>
        <td><button class="btn-goto" onclick="showIpadDetail('${r.id}')">→ Zum iPad</button></td>
      </tr>
    `).join('');
    body.innerHTML = tabsHtml + `
      <div class="table-wrap">
        <table class="data-table" style="cursor:default">
          <thead><tr>
            <th>Seriennummer</th><th>Schüler/in</th><th>Aktion</th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

  } else if (tab === 'rueckgabe') {
    if (_rueckgabeRows.length === 0) {
      body.innerHTML = tabsHtml + '<p class="empty-msg">Keine ausstehenden Rückgaben.</p>';
      return;
    }
    const rows = _rueckgabeRows.map(r => `
      <tr>
        <td><button class="btn-link" onclick="showIpadDetail('${r.ipad?.id}')">${r.ipad?.serial_number || '—'}</button></td>
        <td>${r.ipad?.pupils ? r.ipad.pupils.first_name + ' ' + r.ipad.pupils.last_name : '—'}</td>
        <td>${_fmtDate(r.accepted_at)}</td>
        <td>Zuweisung aufheben</td>
        <td><button class="btn-goto" onclick="showIpadDetail('${r.ipad?.id}')">→ Zum iPad</button></td>
      </tr>
    `).join('');
    body.innerHTML = tabsHtml + `
      <div class="table-wrap">
        <table class="data-table" style="cursor:default">
          <thead><tr>
            <th>Seriennummer</th><th>Schüler/in</th><th>Unterschrieben am</th><th>Aktion</th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
}

async function resolveMeldung(type, id, index) {
  const table = type === 'schaden' ? 'schadenmeldung' : 'verlustmeldung';
  const { error } = await supabase
    .from(table)
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert('Fehler: ' + error.message);
    return;
  }

  if (type === 'schaden') {
    _schadenRows.splice(index, 1);
    _renderPendingTab('schaden');
  } else {
    _verlustRows.splice(index, 1);
    _renderPendingTab('verlust');
  }
}

async function downloadMeldung(type, index) {
  const r = type === 'schaden' ? _schadenRows[index] : _verlustRows[index];
  if (!r) return;

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
