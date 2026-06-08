// doc-generator.js
//
// Leihvertrag + Schadenmeldung: pdf-lib fills named form fields in a PDF template
// and downloads as .pdf.
//
// Verlustmeldung, Übergabeprotokoll, Rückgabeprotokoll: generated in-browser with jsPDF.

// ── Shared helpers ────────────────────────────────────────────────

function _d(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function _dt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return _d(iso) + ' · ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}


// ── Leihvertrag ───────────────────────────────────────────────────
// Template: document_templates/Leihvertrag_2.1_fillable.pdf (pdf-lib)
// Form field names:
//   last_name, first_name, address, school_name (hardcoded),
//   erz_last_name, erz_first_name, erz_address,
//   seriual_number (typo in PDF), accepted_at, text_12ihoi (Marl, den date)

async function generateLeihvertrag(data) {
  const { PDFDocument } = window.PDFLib;

  let buffer;
  try {
    const response = await fetch('document_templates/Leihvertrag_2.1_fillable.pdf');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    buffer = await response.arrayBuffer();
  } catch (e) {
    console.error('[doc-generator] fetch failed:', e);
    throw e;
  }

  const pdfDoc = await PDFDocument.load(buffer);
  const form   = pdfDoc.getForm();

  form.getTextField('last_name').setText(data.last_name       || '');
  form.getTextField('first_name').setText(data.first_name     || '');
  form.getTextField('address').setText(data.address           || '');
  form.getTextField('school_name').setText('Martin Luther King Schule');
  form.getTextField('erz_last_name').setText(data.erz_last_name  || '');
  form.getTextField('erz_first_name').setText(data.erz_first_name || '');
  form.getTextField('erz_address').setText(data.erz_address    || '');
  form.getTextField('seriual_number').setText(data.serial_number || '');
  form.getTextField('accepted_at').setText(_d(data.accepted_at));
  // text_12ihoi = "Dieses Dokument wurde digital erstellt..." — keep pre-filled text, do not overwrite

  form.flatten();

  if (data.signature_url) {
    try {
      const base64   = data.signature_url.split(',')[1];
      const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const sigImage = await pdfDoc.embedPng(pngBytes);
      const lastPage = pdfDoc.getPages().at(-1);
      lastPage.drawImage(sigImage, { x: 30, y: 50, width: 140, height: 45 });
    } catch (e) {
      console.warn('[doc-generator] signature embed failed:', e);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `Leihvertrag_${data.serial_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}


// ── Schadenmeldung ────────────────────────────────────────────────
// Template: document_templates/Schadensmeldung_fillable.pdf (pdf-lib)
// Form field names:
//   serial_number, text_1agbk (Geräteart), date, description,
//   datum_eingetreten, datum_entdeckt,
//   "last_name, first_name", perpetrator,
//   "first_name_erz, last_name_erz; address_erz"

async function generateSchadenmeldung(data) {
  const { PDFDocument } = window.PDFLib;

  let buffer;
  try {
    const response = await fetch('document_templates/Schadensmeldung_fillable.pdf');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    buffer = await response.arrayBuffer();
  } catch (e) {
    console.error('[doc-generator] fetch failed:', e);
    throw e;
  }

  const pdfDoc = await PDFDocument.load(buffer);
  const form   = pdfDoc.getForm();

  const guardian = [
    [data.erz_first_name, data.erz_last_name].filter(Boolean).join(' '),
    data.erz_address || '',
  ].filter(Boolean).join('\n');

  form.getTextField('serial_number').setText(data.serial_number || '');
  form.getTextField('text_1agbk').setText('iPad');
  form.getTextField('date').setText(_d(data.filed_at));
  form.getTextField('description').setText(data.description || '');
  form.getTextField('datum_eingetreten').setText(_d(data.datum_eingetreten));
  form.getTextField('datum_entdeckt').setText(_d(data.datum_entdeckt));
  form.getTextField('last_name, first_name').setText(
    [data.last_name, data.first_name].filter(Boolean).join(', ')
  );
  form.getTextField('perpetrator').setText(data.perpetrator || '');
  form.getTextField('first_name_erz, last_name_erz; address_erz').setText(guardian);

  form.flatten();
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `Schadenmeldung_${data.serial_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}


// ── Verlustmeldung (jsPDF — in-site generated) ────────────────────

function generateVerlustmeldung(data) {
  const doc = _createPdf();
  let y = _drawHeader(doc, 'Verlustmeldung');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Marl, ${_d(data.filed_at)}`, 190, 20, { align: 'right' });

  y = _section(doc, 'Gerät', y);
  y = _field(doc, 'Geräteart', 'iPad', 20, y);
  y = _field(doc, 'Seriennummer', data.serial_number, 20, y);

  y += 2;
  y = _section(doc, 'Nutzer / Nutzerin', y);
  y = _field(doc, 'Name, Vorname', `${data.last_name || '—'}, ${data.first_name || '—'}`, 20, y);

  y += 2;
  y = _section(doc, 'Verlust', y);
  y = _field(doc, 'Datum des Verlusts',                _d(data.date_of_loss),   20, y);
  y = _field(doc, 'Ort des letzten bekannten Verbleibs', data.ort_verlust || '—', 20, y);
  y = _field(doc, 'Verlust bemerkt am',                _d(data.datum_bemerkt),  20, y);
  y = _field(doc, 'Aktenzeichen',                      data.police_report_number || '—', 20, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('BESCHREIBUNG DER UMSTÄNDE', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const circLines = doc.splitTextToSize(data.circumstances || '—', 170);
  doc.text(circLines, 20, y);
  y += circLines.length * 4.5 + 6;

  if (data.notitzen) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('NOTIZEN', 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const notLines = doc.splitTextToSize(data.notitzen, 170);
    doc.text(notLines, 20, y);
    y += notLines.length * 4.5 + 6;
  }

  y += 2;
  y = _section(doc, 'Erziehungsberechtigte/r', y);
  const erzName = (data.erz_last_name || data.erz_first_name)
    ? `${data.erz_last_name || ''}, ${data.erz_first_name || ''}`.replace(/^,\s*/, '')
    : '—';
  y = _field(doc, 'Name, Vorname', erzName, 20, y);
  y = _field(doc, 'Anschrift', data.erz_address || '—', 20, y);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Bitte diese Verlustmeldung unverzüglich an die Schule weiterleiten.', 20, y + 2);
  doc.text('Falls das Gerät wieder aufgefunden wird, ist die Schule umgehend zu informieren.', 20, y + 6.5);

  _footer(doc, data.filed_at);
  doc.save(`Verlustmeldung_${data.serial_number}.pdf`);
}


// ── Übergabeprotokoll (jsPDF stopgap — Priority 2) ───────────────
// TODO: restructure Übergabeprotokoll.docx to use {condition_neuwertig} etc.
// placeholders for the checkbox states, then switch to _fillTemplate like above.

function _createPdf() {
  const { jsPDF } = window.jspdf;
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

function _drawHeader(doc, title) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('MARTIN-LUTHER-KING-SCHULE MARL', 20, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Bochumer Str. 190 · 45772 Marl', 20, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 20, 38);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(20, 42, 190, 42);
  return 52;
}

function _section(doc, title, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(title.toUpperCase(), 20, y);
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(20, y + 2, 190, y + 2);
  return y + 9;
}

function _field(doc, label, value, x, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(String(value || '—'), 170);
  doc.text(lines, x, y + 5);
  return y + 5 + lines.length * 4.5 + 4;
}

function _check(doc, x, y, checked, label) {
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.rect(x, y - 3.5, 4, 4);
  if (checked) {
    doc.setFillColor(30, 120, 30);
    doc.rect(x + 0.8, y - 2.7, 2.4, 2.4, 'F');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(label, 155);
  doc.text(lines, x + 7, y);
  return y + lines.length * 5 + 2;
}

function _footer(doc, acceptedAt) {
  const y = 275;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('Dieses Dokument wurde digital erstellt und elektronisch akzeptiert.', 20, y);
  if (acceptedAt) doc.text('Datum: ' + _dt(acceptedAt), 20, y + 4.5);
}

function generateUebergabeprotokoll(data) {
  const doc = _createPdf();
  let y = _drawHeader(doc, 'Übergabeprotokoll');

  y = _section(doc, 'Ausgabe', y);
  y = _field(doc, 'Ausgabe durch (Kürzel)', data.kurzel, 20, y);
  y += 2;
  y = _section(doc, 'Schüler / Schülerin', y);
  y = _field(doc, 'Name, Vorname', data.pupil_name, 20, y);
  y = _field(doc, 'Seriennummer', data.serial_number, 20, y);
  y += 2;
  y = _section(doc, 'Ausstattung', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const equipLines = doc.splitTextToSize(
    'Hiermit bestätige ich den Erhalt: Apple iPad einschließlich Schutzhülle, Tastatur, Netzgerät, Netzkabel', 170
  );
  doc.text(equipLines, 20, y);
  y += equipLines.length * 4.5 + 6;
  y = _check(doc, 20, y, !!data.notes, 'Weiteres Zubehör: ' + (data.notes || '—'));
  y += 3;
  y = _section(doc, 'Zustand', y);
  y = _check(doc, 20, y, data.condition === 'neuwertig',    'Neuwertig');
  y = _check(doc, 20, y, data.condition === 'ohne_maengel', 'Ohne Mängel');
  y = _check(doc, 20, y, data.condition === 'mit_maengeln', 'Mit folgenden Mängeln:');
  if (data.condition === 'mit_maengeln' && data.maengel) {
    const ml = doc.splitTextToSize(data.maengel, 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(ml, 27, y);
    y += ml.length * 4.5 + 3;
  }
  y += 4;
  y = _section(doc, 'Unterschrift', y);
  if (data.signature_url) {
    try { doc.addImage(data.signature_url, 'PNG', 20, y, 100, 33); }
    catch (e) { console.warn('[doc-generator] signature embed failed:', e); }
  }
  _footer(doc, data.accepted_at || data.created_at);
  doc.save(`Übergabeprotokoll_${data.serial_number}.pdf`);
}

function generateRueckgabeprotokoll(data) {
  const doc = _createPdf();
  let y = _drawHeader(doc, 'Rückgabeprotokoll');

  y = _section(doc, 'Annahme', y);
  y = _field(doc, 'Annahme durch (Kürzel)', data.kurzel, 20, y);
  y += 2;
  y = _section(doc, 'Schüler / Schülerin', y);
  y = _field(doc, 'Name, Vorname', data.pupil_name, 20, y);
  y = _field(doc, 'Seriennummer', data.serial_number, 20, y);
  y += 2;
  y = _section(doc, 'Ausstattung', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const retLines = doc.splitTextToSize(
    'Hiermit bestätige ich die Rückgabe: Apple iPad einschließlich Schutzhülle, Tastatur, Netzgerät, Netzkabel', 170
  );
  doc.text(retLines, 20, y);
  y += retLines.length * 4.5 + 6;
  y = _check(doc, 20, y, !!data.notes, 'Weiteres Zubehör: ' + (data.notes || '—'));
  y += 3;
  y = _section(doc, 'Zustand', y);
  y = _check(doc, 20, y, data.condition === 'ohne_maengel', 'Ohne Mängel');
  y = _check(doc, 20, y, data.condition === 'mit_maengeln', 'Funktionstüchtig, aber mit folgenden Mängeln:');
  y = _check(doc, 20, y, data.condition === 'defekt',       'Defekt (umgehende Meldung an das Amt für Schule und Sport)');
  if (data.condition !== 'ohne_maengel' && data.maengel) {
    const ml = doc.splitTextToSize(data.maengel, 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(ml, 27, y);
    y += ml.length * 4.5 + 3;
  }
  if (data.condition === 'defekt' && data.defekt_beschreibung) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('BESCHREIBUNG DES DEFEKTS', 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const dl = doc.splitTextToSize(data.defekt_beschreibung, 170);
    doc.text(dl, 20, y);
    y += dl.length * 4.5 + 3;
  }
  y += 4;
  y = _section(doc, 'Unterschrift', y);
  if (data.signature_url) {
    try { doc.addImage(data.signature_url, 'PNG', 20, y, 100, 33); }
    catch (e) { console.warn('[doc-generator] signature embed failed:', e); }
  }
  _footer(doc, data.accepted_at || data.created_at);
  doc.save(`Rückgabeprotokoll_${data.serial_number}.pdf`);
}
