/**
 * Charakterbogen als PDF (drei DIN-A4-Seiten: Bogen, Notizen, Sicherheit).
 * Nutzung: await window.HTBAH.erzeugeCharakterPdfBlob(charakter, charakterBild)
 * Benötigt globale libs: window.jspdf, window.html2canvas
 */
(function () {
  const U = window.HTBAH_SHARED && window.HTBAH_SHARED.PdfRenderUtils;
  const PDF_BREITE_PX = U ? U.PDF_BREITE_PX : 794;
  /** Einheitlicher Seitenrand im PDF (0,5 cm), Seite 1 und 2 */
  const PDF_SEITEN_RAND_MM = U ? U.PDF_SEITEN_RAND_MM : 5;
  const PDF_PADDING = '6px 8px';
  const PDF_SEITEN_RAHMEN_PADDING = '0';
  const PDF_SEITEN_RAHMEN_RADIUS = '4px';
  const PDF_SEITEN_INHALT_PADDING = '5px 4px';
  /**
   * Gesamthöhe des Seite-1-Renderings in px, sodass bei 0,5 cm Rand die Breite
   * die druckbare A4-Breite füllt (kein doppelter Seitenrand links/rechts).
   */
  const PDF_SEITE1_CANVAS_HOEHE_PX = Math.round(
    PDF_BREITE_PX * ((297 - 2 * PDF_SEITEN_RAND_MM) / (210 - 2 * PDF_SEITEN_RAND_MM)),
  );
  /** Zusätzliche leere Zeilen zum handschriftlichen Ergänzen (pro Bereich unterschiedlich) */
  const LEERZEILEN_VOR_NACHTEILE = 3;
  const LEERZEILEN_FAEHIGKEITEN = 5;
  const LEERZEILEN_INVENTAR = 10;
  const PDF_ABSCHNITT_UEBERSCHRIFT_PX = 12;
  const PDF_STAMMDATEN_LABEL_PX = 11;
  const PDF_LP_BREITE_STANDARD_PX = 232;
  const PDF_LP_BREITE_SCIFI_PX = 270;
  const PDF_CHARAKTERBILD_BREITE_PX = 138;
  const PDF_INV_ZEILE_HOEHE_PX = 22;
  const PDF_NOTIZ_LINIE_HOEHE_PX = 14;
  const PDF_STILE = {
    'fantasy-mittelalter': {
      rahmenAussen: '#7c8692',
      rahmenInnen: '#b2bac4',
      akzent: '#2f6a29',
      kopfTitel: '#5b3b17',
      kopfUntertitel: '#6b4f2b',
      schrift: "'Palatino Linotype',Palatino,Georgia,'Times New Roman',serif",
      hintergrundAussen: '#f7f1e3',
      panelBg: '#fcf8ef',
      panelInset: '#fcf8ef',
      tabellenKopf: '#eee6d8',
      zebra: '#fdfaf3',
      schattenInnen: '#ece1cc',
      dekoAbschnitt: '❧',
      tabellenRahmen: '#7a5d35',
      tabellenZellenRahmen: '#ddd0b8',
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
      panelBg: '#f8fafc',
      panelInset: '#f8fafc',
      tabellenKopf: '#e7edf3',
      zebra: '#fbfdff',
      schattenInnen: '#e8edf3',
      dekoAbschnitt: '•',
      tabellenRahmen: '#66758a',
      tabellenZellenRahmen: '#d5dce5',
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
      panelBg: '#f3f6ff',
      panelInset: '#f3f6ff',
      tabellenKopf: '#e5eafc',
      zebra: '#f8faff',
      schattenInnen: '#e0e7ff',
      dekoAbschnitt: '▸',
      tabellenRahmen: '#4f46e5',
      tabellenZellenRahmen: '#d4daf7',
      kartenRahmen: '#6366f1',
      kopfMuster: 'linear-gradient(135deg, #eaf0ff 0%, #f7f9ff 100%)',
    },
    einfach: {
      rahmenAussen: '#bcbcbc',
      rahmenInnen: '#a6a5a5',
      akzent: '#000000',
      kopfTitel: '#000000',
      kopfUntertitel: '#222222',
      schrift: "system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
      hintergrundAussen: '#ffffff',
      panelBg: '#ffffff',
      panelInset: '#f4f4f4',
      tabellenKopf: '#e8e8e8',
      zebra: '#ffffff',
      schattenInnen: '#ffffff',
      dekoAbschnitt: '',
      tabellenRahmen: '#000000',
      tabellenZellenRahmen: '#cccccc',
      kartenRahmen: '#000000',
      kopfMuster: '#ffffff',
    },
  };

  function lesePdfStilKonfiguration(optionen) {
    const stil = optionen && typeof optionen.stil === 'string'
      ? optionen.stil.trim()
      : '';
    const basis = PDF_STILE[stil] || PDF_STILE['fantasy-mittelalter'];
    return { ...basis };
  }

  function istBlankoExport(optionen) {
    return !!(optionen && optionen.blanko);
  }

  /** Dekoration nur wenn nicht Blanko und Theme liefert Symbole */
  function dekoUm(text, stil, blanko) {
    if (blanko || !stil.dekoAbschnitt) {
      return text;
    }
    return `${stil.dekoAbschnitt} ${text} ${stil.dekoAbschnitt}`;
  }

  function abschnittsUeberschriftHtml(text, stil, blanko, zusaetzlicheStyles) {
    const extra = zusaetzlicheStyles ? ` ${zusaetzlicheStyles}` : '';
    return `<div style="font-weight:800;font-size:${PDF_ABSCHNITT_UEBERSCHRIFT_PX}px;margin-bottom:3px;color:#222;letter-spacing:0.04em;text-transform:uppercase;${extra}">${dekoUm(escapeHtml(text), stil, blanko)}</div>`;
  }

  function abschnittsUeberschriftHtmlKompakt(text, stil, blanko) {
    return abschnittsUeberschriftHtml(text, stil, blanko, 'flex-shrink:0;margin-bottom:2px;letter-spacing:0.03em;');
  }

  function pdfSeitenRahmenStartHtml(stil, flexFuellung) {
    const flex = flexFuellung
      ? 'display:flex;flex-direction:column;flex:1 1 auto;min-height:0;height:100%;'
      : '';
    return `<div class="htbah-pdf-seitenrahmen" style="border:1.5px solid ${stil.rahmenAussen};border-radius:${PDF_SEITEN_RAHMEN_RADIUS};padding:${PDF_SEITEN_RAHMEN_PADDING};background:${stil.hintergrundAussen};box-sizing:border-box;width:100%;${flex}">`;
  }

  /** Einheitlicher Innenbereich (Seite 1 + 2): gleiche nutzbare Breite für alle Blöcke */
  function pdfSeitenInhaltStartHtml(stil, flexFuellung) {
    const flex = flexFuellung
      ? 'display:flex;flex-direction:column;flex:1 1 auto;min-height:0;'
      : '';
    return `<div class="htbah-pdf-seiteninhalt" style="border:1px solid ${stil.rahmenInnen};border-radius:2px;padding:${PDF_SEITEN_INHALT_PADDING};background:${stil.kopfMuster};box-shadow:inset 0 0 0 1px ${stil.schattenInnen};box-sizing:border-box;width:100%;${flex}">`;
  }

  function leereTabellenZeilenHtml(spalten, anzahl, ersteSpalteZusatzCss, zellenRahmen) {
    let html = '';
    const erste = ersteSpalteZusatzCss || '';
    const rahmen = zellenRahmen || '#ccc';
    for (let r = 0; r < anzahl; r++) {
      html += '<tr>';
      for (let c = 0; c < spalten; c++) {
        const extra = c === 0 ? erste : '';
        html += `<td style="border:1px solid ${rahmen};padding:4px 5px;min-height:14px;vertical-align:top;${extra}">&#160;</td>`;
      }
      html += '</tr>';
    }
    return html;
  }

  function escapeHtml(s) {
    if (U && typeof U.escapeHtml === 'function') {
      return U.escapeHtml(s);
    }
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
      return `<span style="display:block;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid #d7d7d7;padding-bottom:1px;box-sizing:border-box;">${escapeHtml(gekuerzt)}</span>`;
    }
    return '<span style="display:block;flex:1;min-width:0;border-bottom:1px solid #d7d7d7;height:0.85em;box-sizing:border-box;"></span>';
  }

  function kaestchenReiheHtml(anzahl) {
    const n = Math.max(1, Number(anzahl) || 1);
    let html = '<span style="display:inline-flex;gap:2px;vertical-align:middle;">';
    for (let i = 0; i < n; i++) {
      html += '<span style="display:inline-block;width:9px;height:9px;border:1px solid #555;background:#fff;"></span>';
    }
    html += '</span>';
    return html;
  }

  function linienBlockHtml(anzahl, zeilenHoehePx) {
    const h = Math.max(12, Number(zeilenHoehePx) || PDF_NOTIZ_LINIE_HOEHE_PX);
    let html = '';
    for (let i = 0; i < anzahl; i++) {
      html += `<div style="height:${h}px;border-bottom:1px solid #d0d0d0;box-sizing:border-box;"></div>`;
    }
    return html;
  }

  async function messeNotizenSeiteLayout(html) {
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:fixed;left:-9999px;top:0;width:' +
      PDF_BREITE_PX +
      'px;max-width:' +
      PDF_BREITE_PX +
      'px;z-index:-1;pointer-events:none;overflow:visible;';
    host.innerHTML = html;
    document.body.appendChild(host);
    const notizenFuell = host.querySelector('.htbah-pdf-notizen-fuell');
    const ergebnis = { notizenLinien: 40 };
    try {
      if (notizenFuell) {
        const hoehe = notizenFuell.clientHeight;
        const padding = 8;
        ergebnis.notizenLinien = Math.max(
          1,
          Math.floor((hoehe - padding) / PDF_NOTIZ_LINIE_HOEHE_PX),
        );
      }
    } finally {
      document.body.removeChild(host);
    }
    return ergebnis;
  }

  function baueNotizenSeiteHtml(charakter, optionen, layout) {
    const stil = lesePdfStilKonfiguration(optionen);
    const blanko = istBlankoExport(optionen);
    const layoutOpts = layout && typeof layout === 'object' ? layout : {};
    const name = blanko ? '' : (typeof charakter.name === 'string' ? charakter.name.trim() : '');
    const notizenLinienAnzahl = layoutOpts.notizenLinien != null
      ? layoutOpts.notizenLinien
      : 40;
    const journalHtml = linienBlockHtml(notizenLinienAnzahl);
    const nameZeileHtml = name
      ? `<div style="font-size:15px;font-weight:700;color:${stil.kopfTitel};">${escapeHtml(name)}</div>`
      : '';

    return `<div class="htbah-pdf-wurzel htbah-pdf-wurzel-notizen" style="box-sizing:border-box;width:${PDF_BREITE_PX}px;max-width:${PDF_BREITE_PX}px;height:${PDF_SEITE1_CANVAS_HOEHE_PX}px;overflow:hidden;padding:${PDF_PADDING};margin:0;background:#fff;color:#111;font-family:${stil.schrift};line-height:1.2;display:flex;flex-direction:column;">
      <style>
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 600; }
      </style>
      ${pdfSeitenRahmenStartHtml(stil, true)}
      ${pdfSeitenInhaltStartHtml(stil, true)}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid ${stil.akzent};padding-bottom:4px;margin-bottom:5px;flex-shrink:0;">
          <div style="min-width:0;">
            <div style="font-size:10px;color:${stil.kopfUntertitel};margin-bottom:1px;letter-spacing:0.02em;">CHARAKTERBOGEN · HOW TO BE A HERO</div>
            ${nameZeileHtml}
          </div>
        </div>
        <div class="htbah-pdf-kachel" style="display:flex;flex-direction:column;flex:1 1 auto;min-height:0;height:100%;width:100%;box-sizing:border-box;">
          ${abschnittsUeberschriftHtml('Notizen', stil, blanko, 'flex-shrink:0;')}
          <div class="htbah-pdf-notizen htbah-pdf-notizen-fuell" data-linien-modus="1" style="flex:1 1 auto;min-height:0;width:100%;box-sizing:border-box;border:1px solid ${stil.panelInset};background:${stil.panelBg};padding:4px;font-size:8.5px;line-height:1.25;color:#222;display:flex;flex-direction:column;">${journalHtml}</div>
        </div>
      </div>
      </div>
    </div>`;
  }

  async function messeSeite1Layout(html, optionen) {
    const blanko = istBlankoExport(optionen);
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:fixed;left:-9999px;top:0;width:' +
      PDF_BREITE_PX +
      'px;max-width:' +
      PDF_BREITE_PX +
      'px;z-index:-1;pointer-events:none;overflow:visible;';
    host.innerHTML = html;
    document.body.appendChild(host);
    const wurzel = host.querySelector('.htbah-pdf-wurzel');
    const ergebnis = {
      inventarLeerzeilen: blanko ? 15 : LEERZEILEN_INVENTAR,
      notizenLinien: blanko ? 18 : 0,
    };
    try {
      if (!wurzel) {
        return ergebnis;
      }
      const invFuell = wurzel.querySelector('.htbah-pdf-inventar-fuell');
      if (invFuell) {
        const thead = invFuell.querySelector('thead');
        const tbody = invFuell.querySelector('tbody');
        const kopfH = thead ? thead.offsetHeight : 28;
        const verfuegbar = invFuell.clientHeight;
        const bestandZeilen = tbody ? tbody.querySelectorAll('tr').length : 0;
        const datenZeilen = Number(tbody && tbody.getAttribute('data-daten-zeilen')) || 0;
        const nutzbar = Math.max(0, verfuegbar - kopfH);
        const zielZeilen = Math.max(
          datenZeilen,
          Math.floor(nutzbar / PDF_INV_ZEILE_HOEHE_PX),
        );
        ergebnis.inventarLeerzeilen = Math.max(0, zielZeilen - datenZeilen);
      }
      const notizenFuell = wurzel.querySelector('.htbah-pdf-notizen-fuell');
      if (notizenFuell && notizenFuell.getAttribute('data-linien-modus') === '1') {
        const hoehe = notizenFuell.clientHeight;
        const padding = 8;
        ergebnis.notizenLinien = Math.max(
          1,
          Math.floor((hoehe - padding) / PDF_NOTIZ_LINIE_HOEHE_PX),
        );
      }
    } finally {
      document.body.removeChild(host);
    }
    return ergebnis;
  }

  function faehigkeitenBlockHtml(kategorie, titel, charakter, begabungen, gbVerbleibend, gbMax, summen, optionen, stil, blanko) {
    const zeilen = blanko ? [] : sortierteFaehigkeiten(kategorie, charakter);
    const kbeg = begabungen[kategorie];
    const gv = gbVerbleibend[kategorie];
    const gm = gbMax[kategorie];
    const summeKat = summen[kategorie];
    const zellenRahmen = stil.tabellenZellenRahmen;
    let rows = '';
    const anzahlLeerzeilen = blanko ? 10 : LEERZEILEN_FAEHIGKEITEN;
    if (!zeilen.length) {
      rows = leereTabellenZeilenHtml(3, anzahlLeerzeilen, '', zellenRahmen);
    } else {
      for (const f of zeilen) {
        const eff = effektivwert(kategorie, f, begabungen);
        rows += `<tr>
          <td style="padding:3px 4px;border:1px solid ${zellenRahmen};vertical-align:top;">${escapeHtml(f.name)}</td>
          <td style="padding:3px 4px;border:1px solid ${zellenRahmen};text-align:right;white-space:nowrap;">${escapeHtml(f.value == null ? '—' : String(f.value))}</td>
          <td style="padding:3px 4px;border:1px solid ${zellenRahmen};text-align:right;white-space:nowrap;">${escapeHtml(String(eff))}</td>
        </tr>`;
      }
      rows += leereTabellenZeilenHtml(3, anzahlLeerzeilen, '', zellenRahmen);
    }
    const metaZeile = blanko
      ? `<div style="font-size:8px;margin-bottom:3px;line-height:1.3;color:#333;display:flex;flex-wrap:wrap;gap:7px;">
          <span>Summe ${kaestchenReiheHtml(3)}</span>
          <span>Begabung ${kaestchenReiheHtml(2)}</span>
          <span>Geistesblitzpunkte ${kaestchenReiheHtml(2)} / ${kaestchenReiheHtml(2)}</span>
        </div>`
      : `<div style="font-size:8px;margin-bottom:3px;line-height:1.3;color:#333;">
          Summe ${escapeHtml(String(summeKat))} · Begabung ${escapeHtml(String(kbeg))} · Geistesblitz ${escapeHtml(String(gv))} / ${escapeHtml(String(gm))}
        </div>`;
    return `
      <div class="htbah-pdf-kachel" style="flex:1;min-width:0;height:100%;display:flex;flex-direction:column;">
        ${abschnittsUeberschriftHtmlKompakt(titel, stil, blanko)}
        <div style="flex-shrink:0;">${metaZeile}</div>
        <div style="flex:1 1 auto;min-height:0;overflow:hidden;">
        <table class="htbah-pdf-tabelle" style="width:100%;border-collapse:collapse;font-size:8.5px;border:1px solid ${stil.tabellenRahmen};">
          <thead>
            <tr style="background:${stil.tabellenKopf};">
              <th style="text-align:left;font-weight:700;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:1px solid ${stil.tabellenRahmen};">Name</th>
              <th style="text-align:right;font-weight:700;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:1px solid ${stil.tabellenRahmen};width:22%;">Wert</th>
              <th style="text-align:right;font-weight:700;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:1px solid ${stil.tabellenRahmen};width:22%;">Eff.</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
      </div>`;
  }

  function baueHtml(charakter, charakterBild, optionen, layout) {
    const stil = lesePdfStilKonfiguration(optionen);
    const blanko = istBlankoExport(optionen);
    const layoutOpts = layout && typeof layout === 'object' ? layout : {};
    const summen = summenBerechnen(charakter);
    const begabungen = begabungenAusSummen(summen);
    const gbMax = geistesblitzMaxAusCharakter(charakter, begabungen);
    const gbRaw = charakter.geistesblitzVerbleibend;
    const gbVerbleibend = gbRaw &&
      typeof gbRaw === 'object' &&
      ['handeln', 'wissen', 'soziales'].every((k) => typeof gbRaw[k] === 'number')
      ? gbRaw
      : { handeln: gbMax.handeln, wissen: gbMax.wissen, soziales: gbMax.soziales };

    const name = blanko ? '' : (typeof charakter.name === 'string' ? charakter.name.trim() : '');
    const bild = !blanko && typeof charakterBild === 'string' && charakterBild.startsWith('data:')
      ? charakterBild
      : '';

    const zellenRahmen = stil.tabellenZellenRahmen;
    const lpBlockBreitePx = optionen && optionen.stil === 'modern-futuristisch'
      ? PDF_LP_BREITE_SCIFI_PX
      : PDF_LP_BREITE_STANDARD_PX;
    const CM = window.HTBAH_CHARAKTER_MODEL;
    let vorteile = blanko ? [] : (CM && typeof CM.normalisiereVorteileListe === 'function'
      ? CM.normalisiereVorteileListe(charakter.vorteile)
      : []);
    let nachteile = blanko ? [] : (CM && typeof CM.normalisiereNachteileListe === 'function'
      ? CM.normalisiereNachteileListe(charakter.nachteile)
      : []);
    if (!vorteile.length && !nachteile.length && !blanko) {
      const migriert = CM && typeof CM.vorNachteileAusQuelle === 'function'
        ? CM.vorNachteileAusQuelle(charakter)
        : { vorteile: [], nachteile: [] };
      vorteile.push(...migriert.vorteile);
      nachteile.push(...migriert.nachteile);
    }
    const zeilenAnzahl = Math.max(vorteile.length, nachteile.length, blanko ? 0 : 0);
    let vnRows = '';
    if (!zeilenAnzahl) {
      vnRows = leereTabellenZeilenHtml(2, LEERZEILEN_VOR_NACHTEILE, '', zellenRahmen);
    } else {
      const max = Math.max(vorteile.length, nachteile.length);
      for (let i = 0; i < max; i += 1) {
        const v = vorteile[i];
        const n = nachteile[i];
        const vHtml = v ? (v.beschreibungHtml || '') : '';
        const nHtml = n ? (n.beschreibungHtml || '') : '';
        const vPunkte = v && v.punkte ? ` <span style="font-weight:bold;color:#856404;">(+${v.punkte})</span>` : '';
        const nPunkte = n && n.punkte ? ` <span style="font-weight:bold;color:#155724;">(−${n.punkte})</span>` : '';
        vnRows += `<tr>
          <td style="vertical-align:top;padding:3px 4px;border:1px solid ${zellenRahmen};font-size:8.5px;" class="htbah-pdf-html">${vHtml}${vPunkte}</td>
          <td style="vertical-align:top;padding:3px 4px;border:1px solid ${zellenRahmen};font-size:8.5px;" class="htbah-pdf-html">${nHtml}${nPunkte}</td>
        </tr>`;
      }
      vnRows += leereTabellenZeilenHtml(2, LEERZEILEN_VOR_NACHTEILE, '', zellenRahmen);
    }

    const inventar = blanko ? [] : (Array.isArray(charakter.inventar) ? charakter.inventar : []);
    const inventarDatenZeilen = inventar.length;
    const inventarLeerzeilen = layoutOpts.inventarLeerzeilen != null
      ? layoutOpts.inventarLeerzeilen
      : (blanko ? 15 : LEERZEILEN_INVENTAR);
    let invRows = '';
    if (!inventar.length) {
      invRows = leereTabellenZeilenHtml(4, inventarLeerzeilen, '', zellenRahmen);
    } else {
      inventar.forEach((e) => {
        const n = escapeHtml(e.name || '—');
        const typ = inventarTypLabel(e.typ || 'gegenstand');
        const wt = inventarWerteText(e);
        const beschr = String(e.beschreibungHtml || '').trim()
          ? e.beschreibungHtml
          : '<span style="color:#999;">—</span>';
        invRows += `<tr>
          <td style="vertical-align:top;padding:3px 4px;font-size:8.5px;border:1px solid ${zellenRahmen};">${n}</td>
          <td style="vertical-align:top;padding:3px 4px;font-size:8.5px;white-space:nowrap;border:1px solid ${zellenRahmen};">${escapeHtml(typ)}</td>
          <td style="vertical-align:top;padding:3px 4px;font-size:8.5px;white-space:nowrap;border:1px solid ${zellenRahmen};">${wt}</td>
          <td style="vertical-align:top;padding:3px 4px;font-size:8.5px;border:1px solid ${zellenRahmen};" class="htbah-pdf-html htbah-pdf-inv-beschr">${beschr}</td>
        </tr>`;
      });
      invRows += leereTabellenZeilenHtml(4, inventarLeerzeilen, '', zellenRahmen);
    }

    const journalRoh =
      typeof charakter.journalHtml === 'string' && charakter.journalHtml.trim()
        ? charakter.journalHtml
        : '';
    const notizenLinienModus = blanko || !journalRoh;
    const notizenLinienAnzahl = layoutOpts.notizenLinien != null
      ? layoutOpts.notizenLinien
      : (notizenLinienModus ? (blanko ? 18 : 12) : 0);
    const journalHtml = notizenLinienModus
      ? linienBlockHtml(notizenLinienAnzahl)
      : journalRoh;

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
      ['Geschlecht', blanko ? '' : charakter.geschlecht, 24],
      ['Alter', blanko ? '' : (charakter.alter != null && charakter.alter !== '' ? String(charakter.alter) : ''), 12],
      ['Fraktion(en)', blanko ? '' : fraktionenText(charakter), 30],
      ['Statur', blanko ? '' : charakter.statur, 24],
      ['Beruf', blanko ? '' : charakter.beruf, 24],
      ['Familienstand', blanko ? '' : charakter.familienstand, 24],
      ['Glaube', blanko ? '' : (charakter.glaube != null && charakter.glaube !== '' ? charakter.glaube : charakter.religion), 24],
    ];

    let stamZeilen = '';
    for (const [label, wert, maxLaenge] of stammdatenZeilen) {
      stamZeilen += `<div style="display:flex;align-items:flex-end;gap:6px;width:100%;min-width:0;">
        <span style="color:#555;white-space:nowrap;font-size:${PDF_STAMMDATEN_LABEL_PX}px;flex-shrink:0;line-height:1.25;">${escapeHtml(label)}</span>
        <span style="font-size:${PDF_STAMMDATEN_LABEL_PX}px;min-width:0;flex:1;display:flex;align-items:flex-end;">${wertMitSchreiblinieHtml(wert, maxLaenge || 20)}</span>
      </div>`;
    }
    const stamBlock = `<div class="htbah-pdf-stammdaten" style="flex:1;min-width:0;align-self:stretch;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">${stamZeilen}</div>`;
    const lpStartwert = blanko
      ? ''
      : Number.isFinite(Number(charakter.lebenspunkte))
      ? String(Math.max(0, Math.round(Number(charakter.lebenspunkte))))
      : '—';

    const bildBlock = bild
      ? `<div class="htbah-pdf-charakterbild" style="width:${PDF_CHARAKTERBILD_BREITE_PX}px;align-self:stretch;flex-shrink:0;display:flex;box-sizing:border-box;"><img src="${bild}" alt="Charakterbild von ${escapeHtml(name || 'Unbenannt')}" crossorigin="anonymous" style="width:100%;height:100%;min-height:100%;object-fit:cover;border:1px solid #ccc;border-radius:4px;display:block;background:#f0f0f0;box-sizing:border-box;"/></div>`
      : `<div class="htbah-pdf-charakterbild" style="width:${PDF_CHARAKTERBILD_BREITE_PX}px;align-self:stretch;flex-shrink:0;border:1px solid #ccc;border-radius:4px;background:#fff;box-sizing:border-box;" aria-hidden="true"></div>`;

    return `<div class="htbah-pdf-wurzel htbah-pdf-wurzel-seite1" style="box-sizing:border-box;width:${PDF_BREITE_PX}px;max-width:${PDF_BREITE_PX}px;height:${PDF_SEITE1_CANVAS_HOEHE_PX}px;overflow:hidden;padding:${PDF_PADDING};margin:0;background:#fff;color:#111;font-family:${stil.schrift};line-height:1.2;display:flex;flex-direction:column;">
      <style>
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 600; }
        .htbah-pdf-notizen p { margin: 0 0 2px 0; font-size: 8.5px; }
        .htbah-pdf-notizen ul, .htbah-pdf-notizen ol { margin: 0; padding-left: 12px; font-size: 8.5px; }
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
      ${pdfSeitenRahmenStartHtml(stil, true)}
      ${pdfSeitenInhaltStartHtml(stil, true)}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid ${stil.akzent};padding-bottom:4px;margin-bottom:5px;flex-shrink:0;">
          <div style="min-width:0;">
            <div style="font-size:10px;color:${stil.kopfUntertitel};margin-bottom:1px;letter-spacing:0.02em;">CHARAKTERBOGEN · HOW TO BE A HERO</div>
            <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em;color:${stil.kopfTitel};">${blanko ? '' : stil.dekoAbschnitt}<span style="display:inline-block;margin:0 6px;min-width:4em;">${escapeHtml(blanko ? '' : (name || 'Unbenannt'))}</span>${blanko ? '' : stil.dekoAbschnitt}</div>
          </div>
          <div style="font-size:9px;color:#666;text-align:right;white-space:nowrap;">Stand: ${escapeHtml(heute)} ${escapeHtml(uhrzeit)}</div>
        </div>

      <div style="display:flex;gap:8px;margin-bottom:5px;align-items:stretch;flex-shrink:0;">
        ${bildBlock}
        ${stamBlock}
        <div class="htbah-pdf-lp-block" style="flex-shrink:0;width:${lpBlockBreitePx}px;font-size:8.5px;border:2px solid ${stil.kartenRahmen};border-radius:4px;padding:5px;background:${stil.panelBg};box-shadow:inset 0 0 0 1px ${stil.panelInset};box-sizing:border-box;">
          <div style="font-weight:700;margin-bottom:3px;color:${stil.akzent};text-transform:uppercase;letter-spacing:0.04em;font-size:${PDF_ABSCHNITT_UEBERSCHRIFT_PX}px;">${dekoUm('Lebenspunkte', stil, blanko)}</div>
          <div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span>Start-LP: <strong>${escapeHtml(lpStartwert || '___')}</strong></span>
            <span>Aktuell: <span style="display:inline-block;min-width:28px;border-bottom:1px solid #b6bec8;text-align:center;">&#160;</span></span>
          </div>
          <div style="font-size:7px;color:#555;margin-bottom:3px;white-space:nowrap;">Bewusstlos bei LP 1-10 oder Einzelschaden >= 60 · Tot: LP = 0.</div>
          <div style="border:1px solid ${stil.panelInset};background:#fff;min-height:78px;padding:3px;">
            <div style="font-size:7.5px;font-weight:600;letter-spacing:0.02em;color:${stil.akzent};margin-bottom:2px;text-transform:uppercase;">Änderungsprotokoll</div>
          </div>
        </div>
      </div>

      <div class="htbah-pdf-seite1-haupt" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;">
      <div class="htbah-pdf-kachel" style="margin-bottom:5px;flex-shrink:0;">
        ${abschnittsUeberschriftHtml('Vorteile und Nachteile', stil, blanko)}
        <table class="htbah-pdf-tabelle" style="width:100%;border-collapse:collapse;font-size:8.5px;border:2px solid ${stil.tabellenRahmen};">
          <thead>
            <tr style="background:${stil.tabellenKopf};">
              <th style="text-align:left;padding:3px 4px;border:1px solid ${stil.tabellenRahmen};border-bottom:2px solid ${stil.tabellenRahmen};width:42%;">Vorteil</th>
              <th style="text-align:left;padding:3px 4px;border:1px solid ${stil.tabellenRahmen};border-bottom:2px solid ${stil.tabellenRahmen};">Nachteil</th>
            </tr>
          </thead>
          <tbody>${vnRows}</tbody>
        </table>
      </div>

      <div class="htbah-pdf-kachel" style="margin-bottom:5px;flex-shrink:0;">
        ${abschnittsUeberschriftHtml('Begabungen und Fähigkeiten', stil, blanko)}
      <div style="font-size:8px;color:#444;margin-bottom:3px;line-height:1.3;">
        Rechenhilfe: Begabung = Summe / 10 (kaufmännisch gerundet) · Eff. = Wert + Begabung (max. 100)
      </div>
      <div style="display:flex;gap:4px;margin-bottom:0;align-items:stretch;">
        ${faehigkeitenBlockHtml('handeln', 'Handeln', charakter, begabungen, gbVerbleibend, gbMax, summen, optionen, stil, blanko)}
        ${faehigkeitenBlockHtml('wissen', 'Wissen', charakter, begabungen, gbVerbleibend, gbMax, summen, optionen, stil, blanko)}
        ${faehigkeitenBlockHtml('soziales', 'Soziales', charakter, begabungen, gbVerbleibend, gbMax, summen, optionen, stil, blanko)}
      </div>
      </div>

      <div style="flex:1 1 auto;display:flex;gap:10px;min-height:0;align-items:stretch;width:100%;margin:0;padding:0;">
        <div style="flex:58 1 0;min-width:0;display:flex;">
          <div class="htbah-pdf-kachel" style="height:100%;width:100%;display:flex;flex-direction:column;">
                ${abschnittsUeberschriftHtml('Inventar', stil, blanko, 'flex-shrink:0;')}
                <div class="htbah-pdf-inventar-fuell" style="flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;">
                <table class="htbah-pdf-tabelle" style="width:100%;border-collapse:collapse;font-size:8.5px;border:2px solid ${stil.tabellenRahmen};height:100%;">
                  <thead>
                    <tr style="background:${stil.tabellenKopf};">
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:2px solid ${stil.tabellenRahmen};width:18%;">Gegenstand</th>
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:2px solid ${stil.tabellenRahmen};white-space:nowrap;width:12%;">Typ</th>
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:2px solid ${stil.tabellenRahmen};white-space:nowrap;width:16%;">Werte</th>
                      <th style="text-align:left;border:1px solid ${stil.tabellenRahmen};padding:3px 4px;border-bottom:2px solid ${stil.tabellenRahmen};">Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody data-daten-zeilen="${inventarDatenZeilen}">${invRows}</tbody>
                </table>
                </div>
          </div>
        </div>
        <div style="flex:42 1 0;min-width:0;display:flex;">
          <div class="htbah-pdf-kachel" style="display:flex;flex-direction:column;flex:1 1 auto;height:100%;width:100%;">
            ${abschnittsUeberschriftHtml('Notizen', stil, blanko, 'flex-shrink:0;')}
            <div class="htbah-pdf-notizen htbah-pdf-html htbah-pdf-notizen-fuell" data-linien-modus="${notizenLinienModus ? '1' : '0'}" style="flex:1 1 auto;min-height:0;width:100%;box-sizing:border-box;border:1px solid ${stil.panelInset};background:${stil.panelBg};padding:4px;font-size:8.5px;line-height:1.25;color:#222;display:flex;flex-direction:column;">${journalHtml}</div>
          </div>
        </div>
      </div>

      </div>
      </div>
      </div>
    </div>`;
  }

  function baueSicherheitsseiteHtml(charakter, optionen) {
    const stil = lesePdfStilKonfiguration(optionen);
    const blanko = istBlankoExport(optionen);
    const sicher = charakter && charakter.sicherheitsmechanismen && typeof charakter.sicherheitsmechanismen === 'object'
      ? charakter.sicherheitsmechanismen
      : {};
    const tabuHtml = blanko
      ? linienBlockHtml(8)
      : (
        typeof sicher.tabuHtml === 'string' && sicher.tabuHtml.trim()
          ? sicher.tabuHtml
          : '<p style="color:#666;">Keine Einträge.</p>'
      );
    const schleierHtml = blanko
      ? linienBlockHtml(8)
      : (
        typeof sicher.schleierHtml === 'string' && sicher.schleierHtml.trim()
          ? sicher.schleierHtml
          : '<p style="color:#666;">Keine Einträge.</p>'
      );
    return `<div class="htbah-pdf-wurzel" style="box-sizing:border-box;width:${PDF_BREITE_PX}px;max-width:${PDF_BREITE_PX}px;padding:${PDF_PADDING};margin:0;background:#fff;color:#111;font-family:${stil.schrift};line-height:1.25;min-height:1110px;display:flex;flex-direction:column;">
      <style>
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 700; }
      </style>
      ${pdfSeitenRahmenStartHtml(stil)}
      ${pdfSeitenInhaltStartHtml(stil)}
          <div style="font-size:18px;font-weight:800;color:${stil.kopfTitel};margin-bottom:3px;">Session Zero und Sicherheitsmechanismen</div>
          <div style="font-size:10px;color:${stil.kopfUntertitel};margin-bottom:8px;">
            In der Session Zero legen alle gemeinsam Grenzen, Schleier und die X-Karte fest.
            Die Vereinbarung gilt für die gesamte Runde.
          </div>

        <div style="border:2px solid #b91c1c;border-radius:3px;padding:8px;background:#fee2e2;margin-bottom:8px;">
          <div style="font-size:${PDF_ABSCHNITT_UEBERSCHRIFT_PX}px;font-weight:800;color:#7f1d1d;margin-bottom:3px;">X-Karte-Regel</div>
          <div style="font-size:9px;color:#7f1d1d;line-height:1.35;">
            Wird eine X-Karte gelegt, wird die Szene sofort beendet oder umgeschnitten.
            Es gibt keine Diskussion, keine Nachfrage und keine Rechtfertigungspflicht.
          </div>
        </div>

        <div style="border:1px solid ${stil.kartenRahmen};border-radius:3px;padding:7px;background:#fff;margin-bottom:8px;">
          <div style="font-size:${PDF_ABSCHNITT_UEBERSCHRIFT_PX}px;font-weight:700;margin-bottom:4px;color:${stil.akzent};">Diese Inhalte wollen wir nicht:</div>
          <div class="htbah-pdf-html" style="font-size:9px;line-height:1.35;min-height:120px;">${tabuHtml}</div>
        </div>

        <div style="border:1px solid ${stil.kartenRahmen};border-radius:3px;padding:7px;background:#fff;margin-bottom:0;">
          <div style="font-size:${PDF_ABSCHNITT_UEBERSCHRIFT_PX}px;font-weight:700;margin-bottom:4px;color:${stil.akzent};">Diese Inhalte sollen verschleiert werden:</div>
          <div class="htbah-pdf-html" style="font-size:9px;line-height:1.35;min-height:120px;">${schleierHtml}</div>
        </div>
      </div>
      </div>

      <div class="htbah-pdf-xkarte-ausschnitt" style="display:flex;justify-content:center;align-items:center;margin-top:auto;padding-top:12px;flex-shrink:0;">
        <div style="width:189px;height:302px;border:8px solid #dc2626;border-radius:12px;background:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:14px;box-sizing:border-box;">
          <div style="font-size:18px;font-weight:800;color:#b91c1c;text-align:center;">X-Karte</div>
          <div style="font-size:140px;line-height:1;text-align:center;color:#dc2626;font-weight:900;">X</div>
          <div style="font-size:10px;line-height:1.35;color:#7f1d1d;text-align:center;">
            Diese Karte wird <strong><em>kommentarlos</em></strong> gelegt oder gezeigt, wenn eine Szene sofort beendet oder umgeschnitten werden soll.
            <strong><em>Niemand darf eine Begründung einfordern.</em></strong>
          </div>
        </div>
      </div>
    </div>`;
  }

  function dateinameAusCharaktername(name, optionen) {
    if (istBlankoExport(optionen)) {
      return 'htbah-charakter-blanko.pdf';
    }
    const roh = typeof name === 'string' ? name : '';
    const sicher = roh.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 64) || 'charakter';
    return `htbah-charakter-${sicher}.pdf`;
  }

  async function renderHtmlZuCanvas(html) {
    if (U && typeof U.renderHtmlZuCanvas === 'function') {
      return U.renderHtmlZuCanvas(html, PDF_BREITE_PX);
    }
    throw new Error('PdfRenderUtils fehlt.');
  }

  function fuegeCanvasAlsA4SeiteHinzu(pdf, canvas, seite1BreitePrioritaet) {
    if (U && typeof U.fuegeCanvasAlsA4SeiteHinzu === 'function') {
      U.fuegeCanvasAlsA4SeiteHinzu(pdf, canvas, seite1BreitePrioritaet);
      return;
    }
    throw new Error('PdfRenderUtils fehlt.');
  }

  async function erzeugeCharakterPdfSeitenCanvases(charakter, charakterBild, optionen) {
    if (!charakter || typeof charakter !== 'object') {
      throw new Error('Kein Charakter übergeben.');
    }
    if (typeof window.html2canvas !== 'function') {
      throw new Error('html2canvas fehlt.');
    }
    const htmlSeite1Probe = baueHtml(charakter, charakterBild, optionen, {
      inventarLeerzeilen: 0,
      notizenLinien: 1,
    });
    const layoutSeite1 = await messeSeite1Layout(htmlSeite1Probe, optionen);
    const htmlSeite1 = baueHtml(charakter, charakterBild, optionen, layoutSeite1);
    const htmlNotizenProbe = baueNotizenSeiteHtml(charakter, optionen, { notizenLinien: 1 });
    const layoutNotizen = await messeNotizenSeiteLayout(htmlNotizenProbe);
    const htmlNotizen = baueNotizenSeiteHtml(charakter, optionen, layoutNotizen);
    const htmlSeiteSicherheit = baueSicherheitsseiteHtml(charakter, optionen);
    return {
      seite1: await renderHtmlZuCanvas(htmlSeite1),
      notizen: await renderHtmlZuCanvas(htmlNotizen),
      sicherheit: await renderHtmlZuCanvas(htmlSeiteSicherheit),
    };
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

    const canvases = await erzeugeCharakterPdfSeitenCanvases(charakter, charakterBild, optionen);
    const canvasSeite1 = canvases.seite1;
    const canvasNotizen = canvases.notizen;
    const canvasSeiteSicherheit = canvases.sicherheit;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    fuegeCanvasAlsA4SeiteHinzu(pdf, canvasSeite1, true);
    pdf.addPage();
    fuegeCanvasAlsA4SeiteHinzu(pdf, canvasNotizen, true);
    pdf.addPage();
    fuegeCanvasAlsA4SeiteHinzu(pdf, canvasSeiteSicherheit, false);
    const ab = pdf.output('arraybuffer');
    const blob = new Blob([ab], { type: 'application/pdf' });
    const dateiname = dateinameAusCharaktername(charakter.name, optionen);
    return { blob, dateiname };
  }

  window.HTBAH = window.HTBAH || {};
  window.HTBAH.erzeugeCharakterPdfBlob = erzeugeCharakterPdfBlob;
  window.HTBAH.erzeugeCharakterPdfSeitenCanvases = erzeugeCharakterPdfSeitenCanvases;
  window.HTBAH.leseCharakterPdfStilKonfiguration = lesePdfStilKonfiguration;
  window.HTBAH.CHARAKTER_PDF_STIL_OPTIONEN = [
    { value: 'fantasy-mittelalter', label: 'Fantasy / Mittelalter' },
    { value: 'gegenwart', label: 'Gegenwart' },
    { value: 'modern-futuristisch', label: 'Modern / Futuristisch' },
    { value: 'einfach', label: 'Einfach' },
  ];
})();
