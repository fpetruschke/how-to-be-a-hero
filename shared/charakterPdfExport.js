/**
 * Charakterbogen als PDF (eine DIN-A4-Seite).
 * Nutzung: await window.HTBAH.erzeugeCharakterPdfBlob(charakter, charakterBild)
 * Benötigt globale libs: window.jspdf, window.html2canvas
 */
(function () {
  const PDF_BREITE_PX = 794;
  const PDF_PADDING = '6px 8px';
  /** Zusätzliche leere Zeilen zum handschriftlichen Ergänzen (pro Bereich unterschiedlich) */
  const LEERZEILEN_VOR_NACHTEILE = 3;
  const LEERZEILEN_FAEHIGKEITEN = 5;
  const LEERZEILEN_INVENTAR = 10;

  function leereTabellenZeilenHtml(spalten, anzahl, ersteSpalteZusatzCss) {
    let html = '';
    const erste = ersteSpalteZusatzCss || '';
    for (let r = 0; r < anzahl; r++) {
      html += '<tr>';
      for (let c = 0; c < spalten; c++) {
        const extra = c === 0 ? erste : '';
        html += `<td style="border:1px solid #ccc;padding:3px 4px;min-height:12px;vertical-align:top;${extra}">&#160;</td>`;
      }
      html += '</tr>';
    }
    return html;
  }

  function escapeHtml(s) {
    if (s == null || s === '') {
      return '';
    }
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sortierteFaehigkeiten(kategorie, charakter) {
    const arr = Array.isArray(charakter[kategorie]) ? charakter[kategorie] : [];
    return [...arr].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'de'),
    );
  }

  function begabungAusSumme(summe) {
    return Math.round(Number(summe) / 10);
  }

  function geistesblitzMaxAusBegabung(b) {
    return Math.round(Number(b) / 10);
  }

  function effektivwert(kategorie, faehigkeit, begabungen) {
    const b = begabungen[kategorie] || 0;
    const v = Number(faehigkeit.value);
    if (Number.isNaN(v)) {
      return 0;
    }
    return Math.min(100, v + b);
  }

  function inventarWerteText(eintrag) {
    const t = eintrag.typ || 'gegenstand';
    if (t === 'gegenstand') {
      return '—';
    }
    if (t === 'rustung') {
      const rw = String(eintrag.rustwert != null ? eintrag.rustwert : '').trim();
      return rw ? `Rüstwert ${escapeHtml(rw)}` : '—';
    }
    if (t === 'waffe') {
      const sd = String(eintrag.schadenswert != null ? eintrag.schadenswert : '').trim();
      const fern = eintrag.kampfart === 'fernkampf';
      const teile = [];
      if (sd) {
        teile.push(`Schaden ${escapeHtml(sd)}`);
      }
      teile.push(fern ? 'Fernkampf' : 'Nahkampf');
      return teile.join(' · ');
    }
    return '—';
  }

  function inventarTypLabel(typ) {
    if (typ === 'rustung') {
      return 'Rüstung';
    }
    if (typ === 'waffe') {
      return 'Waffe';
    }
    return 'Gegenstand';
  }

  function summenBerechnen(charakter) {
    const sum = (kat) =>
      (Array.isArray(charakter[kat]) ? charakter[kat] : []).reduce(
        (s, e) => s + (Number(e.value) || 0),
        0,
      );
    return {
      handeln: sum('handeln'),
      wissen: sum('wissen'),
      soziales: sum('soziales'),
    };
  }

  function begabungenAusSummen(summen) {
    return {
      handeln: begabungAusSumme(summen.handeln),
      wissen: begabungAusSumme(summen.wissen),
      soziales: begabungAusSumme(summen.soziales),
    };
  }

  function geistesblitzMaxAusCharakter(charakter, begabungen) {
    return {
      handeln: geistesblitzMaxAusBegabung(begabungen.handeln),
      wissen: geistesblitzMaxAusBegabung(begabungen.wissen),
      soziales: geistesblitzMaxAusBegabung(begabungen.soziales),
    };
  }

  function lpStatusKurz(charakter) {
    const teile = [];
    if (charakter.lpStatusTot) {
      teile.push('tot');
    }
    if (charakter.lpBewusstlosAusgeblendet === false && !charakter.lpStatusTot) {
      const lp = Number(charakter.lebenspunkte);
      if (!Number.isNaN(lp) && lp >= 1 && lp <= 10) {
        teile.push('bewusstlos möglich');
      }
    }
    if (charakter.lpMassenschadenBewusstlos) {
      teile.push('Massenschaden');
    }
    return teile.length ? teile.join(', ') : '—';
  }

  function faehigkeitenBlockHtml(kategorie, titel, charakter, begabungen, gbVerbleibend, gbMax, summen) {
    const zeilen = sortierteFaehigkeiten(kategorie, charakter);
    const kbeg = begabungen[kategorie];
    const gv = gbVerbleibend[kategorie];
    const gm = gbMax[kategorie];
    const summeKat = summen[kategorie];
    let rows = '';
    if (!zeilen.length) {
      rows = leereTabellenZeilenHtml(3, LEERZEILEN_FAEHIGKEITEN, '');
    } else {
      for (const f of zeilen) {
        const eff = effektivwert(kategorie, f, begabungen);
        rows += `<tr>
          <td style="padding:2px 3px;border:1px solid #ccc;vertical-align:top;">${escapeHtml(f.name)}</td>
          <td style="padding:2px 3px;border:1px solid #ccc;text-align:right;white-space:nowrap;">${escapeHtml(String(f.value))}</td>
          <td style="padding:2px 3px;border:1px solid #ccc;text-align:right;white-space:nowrap;">${escapeHtml(String(eff))}</td>
        </tr>`;
      }
      rows += leereTabellenZeilenHtml(3, LEERZEILEN_FAEHIGKEITEN, '');
    }
    return `
      <div style="flex:1;min-width:0;border:1px solid #999;padding:3px;background:#fafafa;">
        <div style="font-weight:800;font-size:8px;text-transform:uppercase;margin-bottom:2px;color:#222;letter-spacing:0.03em;">${escapeHtml(titel)}</div>
        <div style="font-size:6.5px;margin-bottom:3px;line-height:1.3;color:#333;">
          Summe ${escapeHtml(String(summeKat))} · Begabung ${escapeHtml(String(kbeg))} · Geistesblitz ${escapeHtml(String(gv))} / ${escapeHtml(String(gm))}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:7px;border:1px solid #999;">
          <thead>
            <tr style="background:#e8e8e8;">
              <th style="text-align:left;font-weight:700;border:1px solid #999;padding:2px 3px;border-bottom:1px solid #666;">Name</th>
              <th style="text-align:right;font-weight:700;border:1px solid #999;padding:2px 3px;border-bottom:1px solid #666;width:22%;">Wert</th>
              <th style="text-align:right;font-weight:700;border:1px solid #999;padding:2px 3px;border-bottom:1px solid #666;width:22%;">Eff.</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function baueHtml(charakter, charakterBild) {
    const summen = summenBerechnen(charakter);
    const begabungen = begabungenAusSummen(summen);
    const gbMax = geistesblitzMaxAusCharakter(charakter, begabungen);
    const gbRaw = charakter.geistesblitzVerbleibend;
    const gbVerbleibend = gbRaw &&
      typeof gbRaw === 'object' &&
      ['handeln', 'wissen', 'soziales'].every((k) => typeof gbRaw[k] === 'number')
      ? gbRaw
      : { handeln: gbMax.handeln, wissen: gbMax.wissen, soziales: gbMax.soziales };

    const punkte = summen.handeln + summen.wissen + summen.soziales;
    const name = typeof charakter.name === 'string' ? charakter.name.trim() : '';
    const bild =
      typeof charakterBild === 'string' && charakterBild.startsWith('data:')
        ? charakterBild
        : '';

    const paare = Array.isArray(charakter.vorNachteilePaare) ? charakter.vorNachteilePaare : [];
    const vnErsteSpalteLeer =
      'width:20px;text-align:right;color:#ccc;';
    let vnRows = '';
    if (!paare.length) {
      vnRows = leereTabellenZeilenHtml(3, LEERZEILEN_VOR_NACHTEILE, vnErsteSpalteLeer);
    } else {
      paare.forEach((paar, i) => {
        vnRows += `<tr>
          <td style="vertical-align:top;text-align:right;color:#666;width:20px;padding:2px 4px;border:1px solid #ccc;">${i + 1}</td>
          <td style="vertical-align:top;padding:2px 4px;border:1px solid #ccc;font-size:7px;" class="htbah-pdf-html">${paar.vorteilHtml || ''}</td>
          <td style="vertical-align:top;padding:2px 4px;border:1px solid #ccc;font-size:7px;" class="htbah-pdf-html">${paar.nachteilHtml || ''}</td>
        </tr>`;
      });
      vnRows += leereTabellenZeilenHtml(3, LEERZEILEN_VOR_NACHTEILE, vnErsteSpalteLeer);
    }

    const inventar = Array.isArray(charakter.inventar) ? charakter.inventar : [];
    let invRows = '';
    if (!inventar.length) {
      invRows = leereTabellenZeilenHtml(4, LEERZEILEN_INVENTAR, '');
    } else {
      inventar.forEach((e) => {
        const n = escapeHtml(e.name || '—');
        const typ = inventarTypLabel(e.typ || 'gegenstand');
        const wt = inventarWerteText(e);
        const beschr = String(e.beschreibungHtml || '').trim()
          ? e.beschreibungHtml
          : '<span style="color:#999;">—</span>';
        invRows += `<tr>
          <td style="vertical-align:top;padding:2px 4px;font-size:7px;border:1px solid #ccc;">${n}</td>
          <td style="vertical-align:top;padding:2px 4px;font-size:7px;white-space:nowrap;border:1px solid #ccc;">${escapeHtml(typ)}</td>
          <td style="vertical-align:top;padding:2px 4px;font-size:7px;white-space:nowrap;border:1px solid #ccc;">${wt}</td>
          <td style="vertical-align:top;padding:2px 4px;font-size:7px;border:1px solid #ccc;" class="htbah-pdf-html htbah-pdf-inv-beschr">${beschr}</td>
        </tr>`;
      });
      invRows += leereTabellenZeilenHtml(4, LEERZEILEN_INVENTAR, '');
    }

    const journalHtml =
      typeof charakter.journalHtml === 'string' && charakter.journalHtml.trim()
        ? charakter.journalHtml
        : '<p style="margin:0;color:#666;font-style:italic;">Keine Notizen</p>';

    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const stammdatenZeilen = [
      ['Geschlecht', charakter.geschlecht],
      ['Alter', charakter.alter != null && charakter.alter !== '' ? String(charakter.alter) : ''],
      ['Statur', charakter.statur],
      ['Religion', charakter.religion],
      ['Beruf', charakter.beruf],
      ['Familienstand', charakter.familienstand],
    ];

    let stamTabelle = '';
    for (const [label, wert] of stammdatenZeilen) {
      if (!wert && wert !== 0) {
        continue;
      }
      stamTabelle += `<tr>
        <td style="color:#555;padding:0 6px 1px 0;white-space:nowrap;font-size:7.5px;">${escapeHtml(label)}</td>
        <td style="padding-bottom:1px;font-size:7.5px;">${escapeHtml(String(wert))}</td>
      </tr>`;
    }

    const bildBlock = bild
      ? `<img src="${bild}" alt="" crossorigin="anonymous" style="width:92px;height:110px;object-fit:cover;border:1px solid #ccc;border-radius:4px;display:block;background:#f0f0f0;"/>`
      : `<div style="width:92px;height:110px;border:1px dashed #bbb;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:7px;color:#888;text-align:center;line-height:1.2;">Kein Bild</div>`;

    return `<div class="htbah-pdf-wurzel" style="box-sizing:border-box;width:${PDF_BREITE_PX}px;padding:${PDF_PADDING};background:#fff;color:#111;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.2;">
      <style>
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 600; }
        .htbah-pdf-notizen p { margin: 0 0 2px 0; font-size: 7px; }
        .htbah-pdf-notizen ul, .htbah-pdf-notizen ol { margin: 0; padding-left: 12px; font-size: 7px; }
        .htbah-pdf-inv-beschr p { margin: 0 0 2px 0; }
        .htbah-pdf-inv-beschr ul, .htbah-pdf-inv-beschr ol { margin: 0; padding-left: 11px; }
      </style>
      <div style="border:1px solid #bbb;border-radius:2px;padding:5px 6px;margin-bottom:6px;background:linear-gradient(to bottom,#fafafa 0%,#fff 12px);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #336a2b;padding-bottom:4px;margin-bottom:5px;">
          <div style="min-width:0;">
            <div style="font-size:8px;color:#444;margin-bottom:1px;letter-spacing:0.02em;">CHARAKTERBOGEN · HOW TO BE A HERO</div>
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">${escapeHtml(name || 'Unbenannt')}</div>
          </div>
          <div style="font-size:7.5px;color:#666;text-align:right;white-space:nowrap;">Stand: ${escapeHtml(heute)}</div>
        </div>

      <div style="display:flex;gap:8px;margin-bottom:5px;align-items:flex-start;">
        <div style="flex-shrink:0;">${bildBlock}</div>
        <div style="flex:1;min-width:0;">
          <table style="border-collapse:collapse;">${stamTabelle}</table>
        </div>
        <div style="flex-shrink:0;width:150px;font-size:7.5px;border:1px solid #ddd;border-radius:4px;padding:5px;background:#f8faf8;">
          <div style="font-weight:700;margin-bottom:3px;color:#336a2b;">Werte</div>
          <div>Lebenspunkte: <strong>${escapeHtml(String(charakter.lebenspunkte != null ? charakter.lebenspunkte : '—'))}</strong></div>
          <div style="margin-top:2px;">LP-Status: ${escapeHtml(lpStatusKurz(charakter))}</div>
          <div style="margin-top:3px;">Fähigkeitspunkte: <strong>${escapeHtml(String(punkte))}</strong> / 400</div>
          <div style="margin-top:2px;">Begabungen: H ${escapeHtml(String(begabungen.handeln))} · W ${escapeHtml(String(begabungen.wissen))} · S ${escapeHtml(String(begabungen.soziales))}</div>
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:800;font-size:8px;margin-bottom:2px;color:#222;letter-spacing:0.04em;text-transform:uppercase;">Vorteile und Nachteile</div>
        <table style="width:100%;border-collapse:collapse;font-size:7px;border:1px solid #999;">
          <thead>
            <tr style="background:#e8e8e8;">
              <th style="text-align:right;width:20px;padding:3px 4px;border:1px solid #999;border-bottom:1px solid #666;">#</th>
              <th style="text-align:left;padding:3px 4px;border:1px solid #999;border-bottom:1px solid #666;width:38%;">Vorteil</th>
              <th style="text-align:left;padding:3px 4px;border:1px solid #999;border-bottom:1px solid #666;">Nachteil</th>
            </tr>
          </thead>
          <tbody>${vnRows}</tbody>
        </table>
      </div>

      <div style="font-weight:800;font-size:8px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;">Begabungen und Fähigkeiten</div>
      <div style="display:flex;gap:4px;margin-bottom:5px;align-items:stretch;">
        ${faehigkeitenBlockHtml('handeln', 'Handeln', charakter, begabungen, gbVerbleibend, gbMax, summen)}
        ${faehigkeitenBlockHtml('wissen', 'Wissen', charakter, begabungen, gbVerbleibend, gbMax, summen)}
        ${faehigkeitenBlockHtml('soziales', 'Soziales', charakter, begabungen, gbVerbleibend, gbMax, summen)}
      </div>

      <table style="width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;margin:0;padding:0;">
        <colgroup>
          <col style="width:58%;" />
          <col style="width:42%;" />
        </colgroup>
        <tbody>
          <tr>
            <td style="vertical-align:top;padding:0 5px 0 0;border:none;">
              <div style="border:1px solid #999;padding:4px;background:#fafafa;box-sizing:border-box;">
                <div style="font-weight:800;font-size:8px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;">Inventar</div>
                <table style="width:100%;border-collapse:collapse;font-size:7px;border:1px solid #999;">
                  <thead>
                    <tr style="background:#e8e8e8;">
                      <th style="text-align:left;border:1px solid #999;padding:2px 4px;border-bottom:1px solid #666;width:18%;">Gegenstand</th>
                      <th style="text-align:left;border:1px solid #999;padding:2px 4px;border-bottom:1px solid #666;white-space:nowrap;width:12%;">Typ</th>
                      <th style="text-align:left;border:1px solid #999;padding:2px 4px;border-bottom:1px solid #666;white-space:nowrap;width:16%;">Werte</th>
                      <th style="text-align:left;border:1px solid #999;padding:2px 4px;border-bottom:1px solid #666;">Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>${invRows}</tbody>
                </table>
              </div>
            </td>
            <td style="vertical-align:top;padding:0 0 0 5px;border:none;">
              <div style="border:1px solid #999;padding:4px;background:#fafafa;display:flex;flex-direction:column;box-sizing:border-box;height:100%;min-height:100%;">
                <div style="font-weight:800;font-size:8px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;flex-shrink:0;">Notizen</div>
                <div class="htbah-pdf-notizen htbah-pdf-html" style="flex:1 1 auto;width:100%;box-sizing:border-box;border:1px solid #ddd;background:#fff;padding:4px;font-size:7px;line-height:1.25;color:#222;">${journalHtml}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      </div>
    </div>`;
  }

  function dateinameAusCharaktername(name) {
    const roh = typeof name === 'string' ? name : '';
    const sicher = roh.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 64) || 'charakter';
    return `htbah-charakter-${sicher}.pdf`;
  }

  async function erzeugeCharakterPdfBlob(charakter, charakterBild) {
    if (!charakter || typeof charakter !== 'object') {
      throw new Error('Kein Charakter übergeben.');
    }

    const jspdfNs = window.jspdf;
    const jsPDF = jspdfNs && (jspdfNs.jsPDF || jspdfNs.default);
    if (!jsPDF || typeof window.html2canvas !== 'function') {
      throw new Error('PDF-Bibliotheken fehlen (jspdf, html2canvas).');
    }

    const html = baueHtml(charakter, charakterBild);
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:fixed;left:-9999px;top:0;width:' +
      PDF_BREITE_PX +
      'px;z-index:-1;pointer-events:none;overflow:visible;';
    host.innerHTML = html;
    document.body.appendChild(host);

    const el = host.querySelector('.htbah-pdf-wurzel');
    if (!el) {
      document.body.removeChild(host);
      throw new Error('PDF-Markup fehlerhaft.');
    }

    let canvas;
    try {
      canvas = await window.html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: PDF_BREITE_PX,
        windowWidth: PDF_BREITE_PX,
      });
    } finally {
      document.body.removeChild(host);
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const cw = canvas.width;
    const ch = canvas.height;

    let finalW = pageW;
    let finalH = (ch * pageW) / cw;
    if (finalH > pageH) {
      finalH = pageH;
      finalW = (cw * pageH) / ch;
    }
    const x = 0;
    const y = 0;

    pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
    const ab = pdf.output('arraybuffer');
    const blob = new Blob([ab], { type: 'application/pdf' });
    const dateiname = dateinameAusCharaktername(charakter.name);
    return { blob, dateiname };
  }

  window.HTBAH = window.HTBAH || {};
  window.HTBAH.erzeugeCharakterPdfBlob = erzeugeCharakterPdfBlob;
})();
