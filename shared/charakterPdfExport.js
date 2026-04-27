/**
 * Charakterbogen als PDF (zwei DIN-A4-Seiten).
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
  const PDF_STILE = {
    'fantasy-mittelalter': {
      rahmenAussen: '#7c8692',
      rahmenInnen: '#b2bac4',
      akzent: '#2f6a29',
      kopfTitel: '#5b3b17',
      kopfUntertitel: '#6b4f2b',
      schrift: "'Palatino Linotype',Palatino,Georgia,'Times New Roman',serif",
      hintergrundAussen: '#f7f1e3',
      kachelVerlaufStart: '#fcf8ef',
      kachelVerlaufEnde: '#ffffff',
      panelBg: '#fcf8ef',
      panelInset: '#fcf8ef',
      tabellenKopf: '#eee6d8',
      zebra: '#fdfaf3',
      werteVerlaufStart: '#f6f1e4',
      werteVerlaufEnde: '#ffffff',
      schattenInnen: '#ece1cc',
      dekoTitel: '✦ ❦ ✦',
      dekoAbschnitt: '❧',
      tabellenRahmen: '#7a5d35',
      kartenRahmen: '#8b6f47',
      kopfMuster: 'linear-gradient(to bottom, #f6ecd9 0%, #fff9ed 100%)',
    },
    gegenwart: {
      rahmenAussen: '#6b7280',
      rahmenInnen: '#bcc2ca',
      akzent: '#1f6aa5',
      kopfTitel: '#1f2937',
      kopfUntertitel: '#334155',
      schrift: "system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
      hintergrundAussen: '#f5f7fa',
      kachelVerlaufStart: '#f8fafc',
      kachelVerlaufEnde: '#ffffff',
      panelBg: '#f8fafc',
      panelInset: '#f8fafc',
      tabellenKopf: '#e7edf3',
      zebra: '#fbfdff',
      werteVerlaufStart: '#f2f8ff',
      werteVerlaufEnde: '#ffffff',
      schattenInnen: '#e8edf3',
      dekoTitel: '• • •',
      dekoAbschnitt: '•',
      tabellenRahmen: '#66758a',
      kartenRahmen: '#8a95a5',
      kopfMuster: 'linear-gradient(to bottom, #f2f6fb 0%, #ffffff 100%)',
    },
    'modern-futuristisch': {
      rahmenAussen: '#475569',
      rahmenInnen: '#94a3b8',
      akzent: '#4f46e5',
      kopfTitel: '#0f172a',
      kopfUntertitel: '#3730a3',
      schrift: "'JetBrains Mono','Fira Code','Consolas','Courier New',monospace",
      hintergrundAussen: '#eef2ff',
      kachelVerlaufStart: '#f3f6ff',
      kachelVerlaufEnde: '#ffffff',
      panelBg: '#f3f6ff',
      panelInset: '#f3f6ff',
      tabellenKopf: '#e5eafc',
      zebra: '#f8faff',
      werteVerlaufStart: '#eef2ff',
      werteVerlaufEnde: '#ffffff',
      schattenInnen: '#e0e7ff',
      dekoTitel: '▮ ▯ ▮',
      dekoAbschnitt: '▸',
      tabellenRahmen: '#4f46e5',
      kartenRahmen: '#6366f1',
      kopfMuster: 'linear-gradient(135deg, #eaf0ff 0%, #f7f9ff 100%)',
    },
  };

  function lesePdfStilKonfiguration(optionen) {
    const stil = optionen && typeof optionen.stil === 'string'
      ? optionen.stil.trim()
      : '';
    return PDF_STILE[stil] || PDF_STILE['fantasy-mittelalter'];
  }

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
      const sdNah = String(
        eintrag.schadenswertNahkampf != null ? eintrag.schadenswertNahkampf : '',
      ).trim();
      const sdFern = String(
        eintrag.schadenswertFernkampf != null ? eintrag.schadenswertFernkampf : '',
      ).trim();
      const teile = [];
      if (sdNah) {
        teile.push(`Nahkampf ${escapeHtml(sdNah)}`);
      }
      if (sdFern) {
        teile.push(`Fernkampf ${escapeHtml(sdFern)}`);
      }
      return teile.length ? teile.join(' · ') : '—';
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

  function fraktionenText(charakter) {
    const ausListe = Array.isArray(charakter.fraktionen)
      ? charakter.fraktionen.map((f) => String(f || '').trim()).filter(Boolean)
      : [];
    const ausEinzelfeld = String(charakter.fraktion || '').trim();
    const gesamt = ausEinzelfeld ? [ausEinzelfeld, ...ausListe] : ausListe;
    const eindeutig = [...new Set(gesamt)];
    return eindeutig.length ? eindeutig.join(', ') : '';
  }

  function kuerzeMitEllipse(text, maxLaenge) {
    const roh = String(text == null ? '' : text).trim();
    if (!roh) {
      return '';
    }
    if (roh.length <= maxLaenge) {
      return roh;
    }
    return `${roh.slice(0, Math.max(0, maxLaenge - 1)).trim()}…`;
  }

  function wertMitSchreiblinieHtml(text, maxLaenge) {
    const gekuerzt = kuerzeMitEllipse(text, maxLaenge);
    if (gekuerzt) {
      return `<div style="display:flex;align-items:flex-end;gap:4px;min-width:0;">
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;">${escapeHtml(gekuerzt)}</span>
    </div>`;
    }
    return `<div style="display:flex;align-items:flex-end;gap:4px;min-width:0;">
      <span style="flex:1;border-bottom:1px solid #d7d7d7;height:0.8em;"></span>
    </div>`;
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
          <td style="padding:2px 3px;border:1px solid #ccc;text-align:right;white-space:nowrap;">${escapeHtml(f.value == null ? '—' : String(f.value))}</td>
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

  function baueHtml(charakter, charakterBild, optionen) {
    const stil = lesePdfStilKonfiguration(optionen);
    const summen = summenBerechnen(charakter);
    const begabungen = begabungenAusSummen(summen);
    const gbMax = geistesblitzMaxAusCharakter(charakter, begabungen);
    const gbRaw = charakter.geistesblitzVerbleibend;
    const gbVerbleibend = gbRaw &&
      typeof gbRaw === 'object' &&
      ['handeln', 'wissen', 'soziales'].every((k) => typeof gbRaw[k] === 'number')
      ? gbRaw
      : { handeln: gbMax.handeln, wissen: gbMax.wissen, soziales: gbMax.soziales };

    const name = typeof charakter.name === 'string' ? charakter.name.trim() : '';
    const bild =
      typeof charakterBild === 'string' && charakterBild.startsWith('data:')
        ? charakterBild
        : '';

    const paare = Array.isArray(charakter.vorNachteilePaare) ? charakter.vorNachteilePaare : [];
    let vnRows = '';
    if (!paare.length) {
      vnRows = leereTabellenZeilenHtml(2, LEERZEILEN_VOR_NACHTEILE, '');
    } else {
      paare.forEach((paar) => {
        vnRows += `<tr>
          <td style="vertical-align:top;padding:2px 4px;border:1px solid #ccc;font-size:7px;" class="htbah-pdf-html">${paar.vorteilHtml || ''}</td>
          <td style="vertical-align:top;padding:2px 4px;border:1px solid #ccc;font-size:7px;" class="htbah-pdf-html">${paar.nachteilHtml || ''}</td>
        </tr>`;
      });
      vnRows += leereTabellenZeilenHtml(2, LEERZEILEN_VOR_NACHTEILE, '');
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
        : '';

    const jetzt = new Date();
    const heute = jetzt.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const uhrzeit = jetzt.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const stammdatenZeilen = [
      ['Geschlecht', charakter.geschlecht, 18],
      ['Alter', charakter.alter != null && charakter.alter !== '' ? String(charakter.alter) : '', 6],
      ['Fraktion(en)', fraktionenText(charakter), 24],
      ['Statur', charakter.statur, 16],
      ['Beruf', charakter.beruf, 18],
      ['Familienstand', charakter.familienstand, 16],
      ['Glaube', charakter.glaube != null && charakter.glaube !== '' ? charakter.glaube : charakter.religion, 18],
    ];

    let stamTabelle = '';
    for (const [label, wert, maxLaenge] of stammdatenZeilen) {
      stamTabelle += `<tr>
        <td style="color:#555;padding:0 6px 1px 0;white-space:nowrap;font-size:7.5px;">${escapeHtml(label)}</td>
        <td style="padding-bottom:1px;font-size:7.5px;min-width:0;">${wertMitSchreiblinieHtml(wert, maxLaenge || 20)}</td>
      </tr>`;
    }
    const lpStartwert = Number.isFinite(Number(charakter.lebenspunkte))
      ? String(Math.max(0, Math.round(Number(charakter.lebenspunkte))))
      : '—';

    const bildBlock = bild
      ? `<img src="${bild}" alt="" crossorigin="anonymous" style="width:92px;height:110px;object-fit:cover;border:1px solid #ccc;border-radius:4px;display:block;background:#f0f0f0;"/>`
      : `<div style="width:92px;height:110px;border:1px dashed #bbb;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:7px;color:#888;text-align:center;line-height:1.2;">Kein Bild</div>`;

    return `<div class="htbah-pdf-wurzel" style="box-sizing:border-box;width:${PDF_BREITE_PX}px;padding:${PDF_PADDING};background:#fff;color:#111;font-family:${stil.schrift};line-height:1.2;">
      <style>
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 600; }
        .htbah-pdf-notizen p { margin: 0 0 2px 0; font-size: 7px; }
        .htbah-pdf-notizen ul, .htbah-pdf-notizen ol { margin: 0; padding-left: 12px; font-size: 7px; }
        .htbah-pdf-inv-beschr p { margin: 0 0 2px 0; }
        .htbah-pdf-inv-beschr ul, .htbah-pdf-inv-beschr ol { margin: 0; padding-left: 11px; }
        .htbah-pdf-wurzel .htbah-pdf-tabelle tbody tr:nth-child(even) td { background: ${stil.zebra}; }
        .htbah-pdf-wurzel .htbah-pdf-kachel {
          border: 2px solid ${stil.kartenRahmen};
          border-radius: 3px;
          padding: 4px;
          background: ${stil.panelBg};
          box-shadow: inset 0 0 0 1px ${stil.panelInset};
          box-sizing: border-box;
        }
      </style>
      <div style="border:3px double ${stil.rahmenAussen};border-radius:3px;padding:2px;background:${stil.hintergrundAussen};">
      <div style="border:1px solid ${stil.rahmenInnen};border-radius:2px;padding:5px 6px;margin-bottom:6px;background:${stil.kopfMuster};box-shadow:inset 0 0 0 1px ${stil.schattenInnen};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid ${stil.akzent};padding-bottom:4px;margin-bottom:5px;">
          <div style="min-width:0;">
            <div style="font-size:8px;color:${stil.kopfUntertitel};margin-bottom:1px;letter-spacing:0.02em;">CHARAKTERBOGEN · HOW TO BE A HERO</div>
            <div style="font-size:15px;font-weight:800;letter-spacing:-0.02em;color:${stil.kopfTitel};">${stil.dekoAbschnitt}<span style="display:inline-block;margin:0 6px;">${escapeHtml(name || 'Unbenannt')}</span>${stil.dekoAbschnitt}</div>
          </div>
          <div style="font-size:7.5px;color:#666;text-align:right;white-space:nowrap;">Stand: ${escapeHtml(heute)} ${escapeHtml(uhrzeit)}</div>
        </div>

      <div style="display:flex;gap:8px;margin-bottom:5px;align-items:flex-start;">
        <div style="flex-shrink:0;">${bildBlock}</div>
        <div style="flex:1;min-width:0;">
          <table style="border-collapse:collapse;">${stamTabelle}</table>
        </div>
        <div style="flex-shrink:0;width:188px;font-size:7px;border:2px solid ${stil.kartenRahmen};border-radius:4px;padding:5px;background:${stil.panelBg};box-shadow:inset 0 0 0 1px ${stil.panelInset};">
          <div style="font-weight:700;margin-bottom:3px;color:${stil.akzent};text-transform:uppercase;letter-spacing:0.04em;">${stil.dekoAbschnitt} Lebenspunkte ${stil.dekoAbschnitt}</div>
          <div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span>Start-LP: <strong>${escapeHtml(lpStartwert)}</strong></span>
            <span>Aktuell: <span style="display:inline-block;min-width:28px;border-bottom:1px solid #b6bec8;text-align:center;">&#160;</span></span>
          </div>
          <div style="font-size:5.5px;color:#555;margin-bottom:3px;white-space:nowrap;">Bewusstlos bei LP 1-10 oder Einzelschaden >= 60 · Tot: LP = 0.</div>
          <div style="border:1px solid #ddd;background:#fff;min-height:78px;padding:3px;">
            <div style="font-size:6px;font-weight:600;letter-spacing:0.02em;color:${stil.akzent};margin-bottom:2px;text-transform:uppercase;">Änderungsprotokoll</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom:5px;">
        <div style="font-weight:800;font-size:8px;margin-bottom:2px;color:#222;letter-spacing:0.04em;text-transform:uppercase;">${stil.dekoAbschnitt} Vorteile und Nachteile ${stil.dekoAbschnitt}</div>
        <table class="htbah-pdf-tabelle" style="width:100%;border-collapse:collapse;font-size:7px;border:2px solid ${stil.tabellenRahmen};">
          <thead>
            <tr style="background:${stil.tabellenKopf};">
              <th style="text-align:left;padding:3px 4px;border:1px solid ${stil.tabellenRahmen};border-bottom:2px solid ${stil.tabellenRahmen};width:42%;">Vorteil</th>
              <th style="text-align:left;padding:3px 4px;border:1px solid ${stil.tabellenRahmen};border-bottom:2px solid ${stil.tabellenRahmen};">Nachteil</th>
            </tr>
          </thead>
          <tbody>${vnRows}</tbody>
        </table>
      </div>

      <div style="font-weight:800;font-size:8px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;">${stil.dekoAbschnitt} Begabungen und Fähigkeiten ${stil.dekoAbschnitt}</div>
      <div style="display:flex;gap:4px;margin-bottom:5px;align-items:stretch;">
        ${faehigkeitenBlockHtml('handeln', 'Handeln', charakter, begabungen, gbVerbleibend, gbMax, summen)}
        ${faehigkeitenBlockHtml('wissen', 'Wissen', charakter, begabungen, gbVerbleibend, gbMax, summen)}
        ${faehigkeitenBlockHtml('soziales', 'Soziales', charakter, begabungen, gbVerbleibend, gbMax, summen)}
      </div>

      <div style="display:flex;gap:10px;align-items:stretch;width:100%;margin:0;padding:0;">
        <div style="flex:58 1 0;min-width:0;">
          <div class="htbah-pdf-kachel" style="height:100%;">
                <div style="font-weight:800;font-size:8px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;">${stil.dekoAbschnitt} Inventar ${stil.dekoAbschnitt}</div>
                <table class="htbah-pdf-tabelle" style="width:100%;border-collapse:collapse;font-size:7px;border:2px solid ${stil.tabellenRahmen};">
                  <thead>
                    <tr style="background:${stil.tabellenKopf};">
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:2px 4px;border-bottom:2px solid ${stil.tabellenRahmen};width:18%;">Gegenstand</th>
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:2px 4px;border-bottom:2px solid ${stil.tabellenRahmen};white-space:nowrap;width:12%;">Typ</th>
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:2px 4px;border-bottom:2px solid ${stil.tabellenRahmen};white-space:nowrap;width:16%;">Werte</th>
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:2px 4px;border-bottom:2px solid ${stil.tabellenRahmen};">Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>${invRows}</tbody>
                </table>
          </div>
        </div>
        <div style="flex:42 1 0;min-width:0;display:flex;">
          <div class="htbah-pdf-kachel" style="display:flex;flex-direction:column;flex:1 1 auto;">
            <div style="font-weight:800;font-size:8px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;flex-shrink:0;">${stil.dekoAbschnitt} Notizen ${stil.dekoAbschnitt}</div>
            <div class="htbah-pdf-notizen htbah-pdf-html" style="flex:1 1 auto;width:100%;box-sizing:border-box;border:1px solid #ddd;background:${stil.panelBg};padding:4px;font-size:7px;line-height:1.25;color:#222;">${journalHtml}</div>
          </div>
        </div>
      </div>

      </div>
      </div>
    </div>`;
  }

  function baueSicherheitsseiteHtml(charakter, optionen) {
    const stil = lesePdfStilKonfiguration(optionen);
    const sicher = charakter && charakter.sicherheitsmechanismen && typeof charakter.sicherheitsmechanismen === 'object'
      ? charakter.sicherheitsmechanismen
      : {};
    const tabuHtml =
      typeof sicher.tabuHtml === 'string' && sicher.tabuHtml.trim()
        ? sicher.tabuHtml
        : '<p style="color:#666;">Keine Einträge.</p>';
    const schleierHtml =
      typeof sicher.schleierHtml === 'string' && sicher.schleierHtml.trim()
        ? sicher.schleierHtml
        : '<p style="color:#666;">Keine Einträge.</p>';
    return `<div class="htbah-pdf-wurzel" style="box-sizing:border-box;width:${PDF_BREITE_PX}px;padding:${PDF_PADDING};background:#fff;color:#111;font-family:${stil.schrift};line-height:1.25;min-height:1110px;display:flex;flex-direction:column;">
      <style>
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 700; }
      </style>
      <div style="border:3px double ${stil.rahmenAussen};border-radius:4px;padding:8px;background:${stil.hintergrundAussen};box-sizing:border-box;">
        <div style="border:1px solid ${stil.rahmenInnen};border-radius:3px;padding:8px;background:${stil.kopfMuster};margin-bottom:8px;">
          <div style="font-size:16px;font-weight:800;color:${stil.kopfTitel};margin-bottom:3px;">Session Zero und Sicherheitsmechanismen</div>
          <div style="font-size:9px;color:${stil.kopfUntertitel};">
            In der Session Zero legen alle gemeinsam Grenzen, Schleier und die X-Karte fest.
            Die Vereinbarung gilt für die gesamte Runde.
          </div>
        </div>

        <div style="border:2px solid #b91c1c;border-radius:3px;padding:8px;background:#fee2e2;margin-bottom:8px;">
          <div style="font-size:10px;font-weight:800;color:#7f1d1d;margin-bottom:3px;">X-Karte-Regel</div>
          <div style="font-size:8px;color:#7f1d1d;line-height:1.35;">
            Wird eine X-Karte gelegt, wird die Szene sofort beendet oder umgeschnitten.
            Es gibt keine Diskussion, keine Nachfrage und keine Rechtfertigungspflicht.
          </div>
        </div>

        <div style="border:1px solid ${stil.kartenRahmen};border-radius:3px;padding:7px;background:#fff;margin-bottom:8px;">
          <div style="font-size:10px;font-weight:700;margin-bottom:4px;color:${stil.akzent};">Diese Inhalte wollen wir nicht:</div>
          <div class="htbah-pdf-html" style="font-size:8px;line-height:1.35;min-height:120px;">${tabuHtml}</div>
        </div>

        <div style="border:1px solid ${stil.kartenRahmen};border-radius:3px;padding:7px;background:#fff;margin-bottom:10px;">
          <div style="font-size:10px;font-weight:700;margin-bottom:4px;color:${stil.akzent};">Diese Inhalte sollen verschleiert werden:</div>
          <div class="htbah-pdf-html" style="font-size:8px;line-height:1.35;min-height:120px;">${schleierHtml}</div>
        </div>

      </div>
      <div style="display:flex;justify-content:center;align-items:center;margin-top:auto;padding-top:8px;">
        <div style="width:240px;height:336px;border:8px solid #dc2626;border-radius:12px;background:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:14px;box-sizing:border-box;">
          <div style="font-size:16px;font-weight:800;color:#b91c1c;text-align:center;">X-Karte</div>
          <div style="font-size:140px;line-height:1;text-align:center;color:#dc2626;font-weight:900;">X</div>
          <div style="font-size:8px;line-height:1.35;color:#7f1d1d;text-align:center;">
            Diese Karte wird kommentarlos gelegt oder gezeigt, wenn eine Szene sofort beendet oder umgeschnitten werden soll.
            Niemand darf eine Begründung einfordern.
          </div>
        </div>
      </div>
    </div>`;
  }

  function dateinameAusCharaktername(name) {
    const roh = typeof name === 'string' ? name : '';
    const sicher = roh.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 64) || 'charakter';
    return `htbah-charakter-${sicher}.pdf`;
  }

  async function renderHtmlZuCanvas(html) {
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
    try {
      return await window.html2canvas(el, {
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
  }

  function fuegeCanvasAlsA4SeiteHinzu(pdf, canvas) {
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
    pdf.addImage(imgData, 'JPEG', 0, 0, finalW, finalH);
  }

  async function erzeugeCharakterPdfBlob(charakter, charakterBild, optionen) {
    if (!charakter || typeof charakter !== 'object') {
      throw new Error('Kein Charakter übergeben.');
    }

    const jspdfNs = window.jspdf;
    const jsPDF = jspdfNs && (jspdfNs.jsPDF || jspdfNs.default);
    if (!jsPDF || typeof window.html2canvas !== 'function') {
      throw new Error('PDF-Bibliotheken fehlen (jspdf, html2canvas).');
    }

    const htmlSeite1 = baueHtml(charakter, charakterBild, optionen);
    const htmlSeite2 = baueSicherheitsseiteHtml(charakter, optionen);
    const canvasSeite1 = await renderHtmlZuCanvas(htmlSeite1);
    const canvasSeite2 = await renderHtmlZuCanvas(htmlSeite2);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    fuegeCanvasAlsA4SeiteHinzu(pdf, canvasSeite1);
    pdf.addPage();
    fuegeCanvasAlsA4SeiteHinzu(pdf, canvasSeite2);
    const ab = pdf.output('arraybuffer');
    const blob = new Blob([ab], { type: 'application/pdf' });
    const dateiname = dateinameAusCharaktername(charakter.name);
    return { blob, dateiname };
  }

  window.HTBAH = window.HTBAH || {};
  window.HTBAH.erzeugeCharakterPdfBlob = erzeugeCharakterPdfBlob;
})();
