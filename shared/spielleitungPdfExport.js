/**
 * Spielleitung-Kampagnen-PDF (alle Inhalte, wählbar).
 * await window.HTBAH.erzeugeSpielleitungPdfBlob(kampagneId, optionen)
 */
(function () {
  const U = () => window.HTBAH_SHARED.PdfRenderUtils;
  const E = () => window.HTBAH_SHARED.EntitaetDetailFelder;
  const IW = () => window.HTBAH_SHARED.InteraktiveWeltExport;
  const CS = () => window.HTBAH_SHARED.SpielleitungPdfCheatSheet;

  const STANDARD_AUSWAHL = {
    gruppe: true,
    orte: true,
    fraktionen: true,
    npcs: true,
    bestien: true,
    gegenstaende: true,
    raetsel: true,
    abenteuerbuch: true,
    entitaetsBilder: true,
    galerie: true,
    interaktiveWelt: true,
  };

  const ZUSTAND_LISTEN = {
    orte: 'orte',
    fraktionen: 'fraktionen',
    npcs: 'npcs',
    bestien: 'bestien',
    gegenstaende: 'gegenstaende',
    raetsel: 'raetsel',
  };

  function normalisiereAuswahl(roh, verfuegbar) {
    const basis = { ...STANDARD_AUSWAHL };
    if (!roh || typeof roh !== 'object') {
      return filterAuswahlNachVerfuegbarkeit(basis, verfuegbar);
    }
    Object.keys(basis).forEach((key) => {
      if (typeof roh[key] === 'boolean') {
        basis[key] = roh[key];
      }
    });
    return filterAuswahlNachVerfuegbarkeit(basis, verfuegbar);
  }

  function filterAuswahlNachVerfuegbarkeit(auswahl, verfuegbar) {
    const result = { ...auswahl };
    if (!verfuegbar || typeof verfuegbar !== 'object') {
      return result;
    }
    Object.keys(result).forEach((key) => {
      if (verfuegbar[key] === false) {
        result[key] = false;
      }
    });
    return result;
  }

  function htmlIstLeer(html) {
    const text = String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return !text;
  }

  function hatNichtLeereListe(liste) {
    return Array.isArray(liste) && liste.length > 0;
  }

  function hatGalerieInhalt(wb) {
    const eintraege = wb && Array.isArray(wb.eintraege) ? wb.eintraege : [];
    return eintraege.some(
      (e) => e && typeof e.dataUrl === 'string' && e.dataUrl.startsWith('data:'),
    );
  }

  function hatAbenteuerbuchInhalt(abenteuerbuch) {
    const AB = window.HTBAH_SHARED && window.HTBAH_SHARED.normalisiereAbenteuerbuch;
    const norm = AB
      ? AB(abenteuerbuch)
      : abenteuerbuch && abenteuerbuch.reiter
        ? abenteuerbuch
        : { reiter: [] };
    const reiter = Array.isArray(norm.reiter) ? norm.reiter : [];
    return reiter.some((r) => r && !htmlIstLeer(r.html));
  }

  function hatInteraktiveWeltInhalt(kampagneId) {
    const IWmod = IW();
    if (!IWmod || typeof IWmod.ladeKampagnenKontext !== 'function') {
      return false;
    }
    try {
      const ctx = IWmod.ladeKampagnenKontext(kampagneId);
      const nodes = Array.isArray(ctx.graph && ctx.graph.nodes) ? ctx.graph.nodes.length : 0;
      const bilder = Array.isArray(ctx.bildElemente) ? ctx.bildElemente.length : 0;
      const bg =
        typeof ctx.hintergrundDataUrl === 'string' && ctx.hintergrundDataUrl.startsWith('data:');
      return nodes > 0 || bilder > 0 || bg;
    } catch {
      return false;
    }
  }

  function ermittleSpielleitungPdfVerfuegbarkeit(kampagneId) {
    const kid = typeof kampagneId === 'string' ? kampagneId.trim() : '';
    const leer = {
      gruppe: false,
      orte: false,
      fraktionen: false,
      npcs: false,
      bestien: false,
      gegenstaende: false,
      raetsel: false,
      abenteuerbuch: false,
      entitaetsBilder: false,
      galerie: false,
      interaktiveWelt: false,
    };
    if (!kid) {
      return leer;
    }
    const sl = window.HTBAH.ladeSpielleitungZustand();
    const kampagne = (sl.kampagnen || []).find((k) => k && k.id === kid);
    if (!kampagne) {
      return leer;
    }
    const zustand = window.HTBAH.ladeZufallstabellenZustand(kid);
    const wb = window.HTBAH.ladeWeltenbauZustand(kid);
    const abenteuerbuch = window.HTBAH.ladeKampagnenAbenteuerbuch(kid);
    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];

    leer.gruppe = mitglieder.length > 0;
    leer.orte = hatNichtLeereListe(zustand.orte);
    leer.fraktionen = hatNichtLeereListe(zustand.fraktionen);
    leer.npcs = hatNichtLeereListe(zustand.npcs);
    leer.bestien = hatNichtLeereListe(zustand.bestien);
    leer.gegenstaende = hatNichtLeereListe(zustand.gegenstaende);
    leer.raetsel = hatNichtLeereListe(zustand.raetsel);
    leer.abenteuerbuch = hatAbenteuerbuchInhalt(abenteuerbuch);
    leer.galerie = hatGalerieInhalt(wb);
    leer.interaktiveWelt = hatInteraktiveWeltInhalt(kid);
    leer.entitaetsBilder =
      leer.gruppe ||
      leer.orte ||
      leer.fraktionen ||
      leer.npcs ||
      leer.bestien ||
      leer.gegenstaende ||
      leer.raetsel;
    return leer;
  }

  function quillStyles() {
    return U().quillHtmlBasisStyles();
  }

  function lesePdfStil(optionen) {
    if (window.HTBAH && typeof window.HTBAH.leseCharakterPdfStilKonfiguration === 'function') {
      return window.HTBAH.leseCharakterPdfStilKonfiguration(optionen);
    }
    return {
      schrift: "'Palatino Linotype',Palatino,Georgia,'Times New Roman',serif",
      kopfMuster: 'linear-gradient(to bottom, #f6ecd9 0%, #fff9ed 100%)',
      rahmenAussen: '#7c8692',
      akzent: '#2f6a29',
      kopfTitel: '#5b3b17',
      kopfUntertitel: '#6b4f2b',
      panelBg: '#fcf8ef',
      kartenRahmen: '#8b6f47',
      tabellenRahmen: '#7a5d35',
    };
  }

  const PDF_ZEILEN_ABSTAND_PX = 6;
  const PDF_KARTEN_ZEILEN_ABSTAND_PX = 12;
  const PDF_BEREICH_ABSTAND_PX = 6;
  const PDF_UEBERSCHRIFT_ABSTAND_PX = 32;
  const PDF_ABENTEUERBUCH_SPACER_PX = 48;
  const PDF_DECKBLATT_INHALT_HOEHE_PX = Math.round((U().PDF_BREITE_PX * 297) / 210);
  const PDF_KOMPAKT_TYPEN = new Set(['npc', 'bestie']);

  function slPdfLayoutStyles() {
    const z = PDF_ZEILEN_ABSTAND_PX;
    const u = PDF_UEBERSCHRIFT_ABSTAND_PX;
    return `
        .htbah-sl-pdf-karte { break-inside: avoid; page-break-inside: avoid; }
        .htbah-sl-pdf-karten-block { display: flex; flex-direction: column; gap: ${PDF_KARTEN_ZEILEN_ABSTAND_PX}px; }
        .htbah-sl-pdf-karten-zeile { display: flex; flex-wrap: nowrap; gap: 8px; align-items: flex-start; margin: 0; break-inside: avoid; page-break-inside: avoid; }
        .htbah-sl-pdf-block-spacer { height: ${PDF_KARTEN_ZEILEN_ABSTAND_PX}px; flex-shrink: 0; line-height: 0; font-size: 0; }
        .htbah-sl-pdf-sektion-spacer { height: ${PDF_UEBERSCHRIFT_ABSTAND_PX}px; line-height: 0; font-size: 0; flex-shrink: 0; }
        .htbah-sl-pdf-sektion-spacer--abenteuerbuch { height: ${PDF_ABENTEUERBUCH_SPACER_PX}px; }
        .htbah-sl-pdf-karte-bereiche { display: flex; flex-direction: column; gap: ${PDF_BEREICH_ABSTAND_PX}px; }
        .htbah-sl-pdf-bereich-stammdaten-inhalt { display: flex; flex-wrap: nowrap; align-items: flex-start; gap: 6px; }
        .htbah-sl-pdf-bereich-stammdaten-felder { flex: 1 1 0; min-width: 0; }
        .htbah-sl-pdf-bereich-avatar { flex: 0 0 auto; border-radius: 4px; padding: 2px; background: #fff; align-self: flex-start; box-sizing: border-box; }
        .htbah-sl-pdf-bereich-avatar img { display: block; width: auto; height: auto; max-width: 64px; max-height: 72px; object-fit: contain; border-radius: 3px; }
        .htbah-sl-pdf-karte--kompakt .htbah-sl-pdf-bereich-avatar img { max-width: 48px; max-height: 56px; }
        .htbah-sl-pdf-karten-spalte { flex: 1 1 0; min-width: 0; width: calc(50% - 4px); box-sizing: border-box; }
        .htbah-sl-pdf-karten-spalte--drittel { width: calc(33.333% - 6px); }
        .htbah-sl-pdf-karten-spalte--voll { width: 100%; flex: 1 1 100%; max-width: 100%; }
        .htbah-sl-pdf-karte--kompakt { padding: 4px 5px !important; }
        .htbah-sl-pdf-karte--kompakt > div:first-of-type { font-size: 8px !important; margin-bottom: 2px !important; }
        .htbah-sl-pdf-bereich--gerahmt { border: 1px solid #d4c4a8; border-radius: 4px; padding: 3px 4px; margin: 0; background: #fff; }
        .htbah-sl-pdf-bereich--gerahmt .htbah-sl-pdf-bereich-titel { font-size: 7px; margin-bottom: 3px; }
        .htbah-sl-pdf-bereich--gerahmt .htbah-sl-pdf-feld-zeile { margin-bottom: 3px; padding: 1px 0; border-bottom-color: #e8e0d0; }
        .htbah-sl-pdf-bereich--gerahmt .htbah-sl-pdf-feld-spalte--drittel { flex: 1 1 calc(33.333% - 6px); max-width: calc(33.333% - 6px); }
        .htbah-sl-pdf-feld-spalte--drittel { flex: 1 1 calc(33.333% - 6px); min-width: 0; max-width: calc(33.333% - 6px); box-sizing: border-box; }
        .htbah-sl-pdf-karte--kompakt .htbah-sl-pdf-faehigkeiten { margin: 0; gap: 4px; }
        .htbah-sl-pdf-karte--kompakt .htbah-sl-pdf-faehigkeiten-spalte { padding: 3px 4px; }
        .htbah-sl-pdf-deckblatt { display: flex; flex-direction: column; justify-content: center; min-height: ${PDF_DECKBLATT_INHALT_HOEHE_PX}px; padding: 12px 10px; box-sizing: border-box; }
        .htbah-sl-pdf-sektion--nach-inhalt { margin-top: 0; }
        .htbah-sl-pdf-sektion--erste { margin-top: 0; }
        .htbah-sl-pdf-bereich { margin: 0; }
        .htbah-sl-pdf-bereich-titel { font-size: 8px; font-weight: 800; color: #5b3b17; margin: 0 0 ${z}px; line-height: 1.2; }
        .htbah-sl-pdf-feld-raster { display: flex; flex-wrap: wrap; gap: 0 8px; }
        .htbah-sl-pdf-feld-spalte { flex: 1 1 calc(50% - 4px); min-width: 0; max-width: calc(50% - 4px); box-sizing: border-box; }
        .htbah-sl-pdf-feld-spalte--voll { flex: 1 1 100%; max-width: 100%; }
        .htbah-sl-pdf-feld-zeile { margin: 0 0 ${z}px; padding: 2px 0; border-bottom: 1px solid #d8d8d8; }
        .htbah-sl-pdf-faehigkeiten { display: flex; flex-wrap: nowrap; gap: 6px; margin: 0; }
        .htbah-sl-pdf-faehigkeiten-spalte { flex: 1 1 0; min-width: 0; border: 1px solid #d4c4a8; border-radius: 4px; padding: 4px 5px; background: #fff; }
        .htbah-sl-pdf-faehigkeit-zeile { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 4px; font-size: 7px; line-height: 1.35; margin: 0 0 ${z}px; align-items: baseline; }
        .htbah-sl-pdf-faehigkeit-name { flex: 1 1 48px; min-width: 0; overflow: visible; white-space: normal; word-break: break-word; }
        .htbah-sl-pdf-faehigkeit-wert-wrap { flex: 0 0 auto; white-space: nowrap; text-align: right; margin-left: auto; }
        .htbah-sl-pdf-faehigkeit-wert { font-weight: 800; }
        .htbah-sl-pdf-faehigkeit-basis { font-size: 6px; font-weight: 400; color: #666; margin-left: 2px; }
        .htbah-sl-pdf-ab-reiter:not(:first-child) { margin-top: ${u}px; }
        .htbah-sl-pdf-ab-reiter h3 { margin: 0 0 ${z}px; }
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 ${z}px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html li { margin: 0 0 ${z}px 0; }
      `;
  }

  function pdfWurzelStart(stil) {
    const s = stil || lesePdfStil({});
    return `<div class="htbah-pdf-wurzel" style="width:${U().PDF_BREITE_PX}px;font-family:${s.schrift};color:#222;box-sizing:border-box;"><style>${quillStyles()}${slPdfLayoutStyles()}</style>`;
  }

  function pdfWurzelEnde() {
    return '</div>';
  }

  function baueEntitaetFeldZeileHtml(feld, esc, kompakt) {
    if (!feld || !feld.label) {
      return '';
    }
    const labelPx = kompakt ? 7 : 8;
    const textPx = kompakt ? 8 : 9;
    const labelStil = `font-size:${labelPx}px;font-weight:700;color:#555;line-height:1.3;margin:0 0 1px;`;
    if (feld.html) {
      return `<div class="htbah-sl-pdf-feld-zeile"><div style="${labelStil}">${esc(feld.label)}</div><div class="htbah-pdf-html" style="font-size:${textPx}px;line-height:1.3;color:#222;margin:0;">${feld.html}</div></div>`;
    }
    const text = String(feld.text || '').trim();
    if (!text) {
      return '';
    }
    return `<div class="htbah-sl-pdf-feld-zeile"><div style="${labelStil}">${esc(feld.label)}</div><div style="font-size:${textPx}px;line-height:1.3;color:#222;margin:0;word-break:break-word;">${esc(text)}</div></div>`;
  }

  function effektivwertFaehigkeit(faehigkeit, begabung) {
    const basis = faehigkeit && Number.isFinite(Number(faehigkeit.value)) ? Math.round(Number(faehigkeit.value)) : 0;
    const b = Number.isFinite(Number(begabung)) ? Math.round(Number(begabung)) : 0;
    return Math.min(100, basis + b);
  }

  function baueFaehigkeitWertHtml(faehigkeit, begabung) {
    const basis = faehigkeit && Number.isFinite(Number(faehigkeit.value)) ? Math.round(Number(faehigkeit.value)) : 0;
    const eff = effektivwertFaehigkeit(faehigkeit, begabung);
    if (basis > 0 && basis !== eff) {
      return `<span class="htbah-sl-pdf-faehigkeit-wert">${eff}</span><span class="htbah-sl-pdf-faehigkeit-basis">(${basis})</span>`;
    }
    return `<span class="htbah-sl-pdf-faehigkeit-wert">${eff}</span>`;
  }

  function baueFaehigkeitenPdfHtml(faehigkeiten, esc, kompakt) {
    if (!faehigkeiten || !Array.isArray(faehigkeiten.kategorien)) {
      return '';
    }
    const metaPx = kompakt ? 6 : 7;
    let html =
      '<div class="htbah-sl-pdf-faehigkeiten" role="presentation" aria-hidden="true">';
    faehigkeiten.kategorien.forEach((kat) => {
      const skills = Array.isArray(kat.faehigkeiten) ? kat.faehigkeiten : [];
      const begabung = kat.begabung;
      let liste = '';
      if (skills.length) {
        skills.forEach((f) => {
          const name = esc(f && f.name ? f.name : '');
          const wert = baueFaehigkeitWertHtml(f, begabung);
          liste += `<div class="htbah-sl-pdf-faehigkeit-zeile"><span class="htbah-sl-pdf-faehigkeit-name">${name}</span><span class="htbah-sl-pdf-faehigkeit-wert-wrap">${wert}</span></div>`;
        });
      } else {
        liste = `<div style="font-size:${metaPx}px;color:#666;margin:0;">—</div>`;
      }
      html += `<div class="htbah-sl-pdf-faehigkeiten-spalte">
        <div style="font-size:${metaPx}px;font-weight:800;text-transform:uppercase;margin:0 0 2px;">${esc(kat.label || '')}</div>
        <div style="font-size:${metaPx}px;margin:0 0 3px;color:#444;">Begabung ${esc(kat.begabung)} · Summe ${esc(kat.summe)}</div>
        ${liste}
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function istStammdatenBereich(bereich) {
    const titel = bereich && bereich.titel ? String(bereich.titel) : '';
    return /Stammdaten/i.test(titel);
  }

  function baueBereichAvatarHtml(bildDataUrl, stil) {
    const s = stil || lesePdfStil({});
    return `<div class="htbah-sl-pdf-bereich-avatar" style="border:1px solid ${s.kartenRahmen};">
      <img src="${bildDataUrl}" alt="" />
    </div>`;
  }

  function baueEinzelnenBereichHtml(bereich, paket, esc, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const kompakt = !!opts.kompakt;
    if (!bereich) {
      return '';
    }
    const titel = bereich.titel ? String(bereich.titel) : '';
    const raster = baueBereichFeldRasterHtml(bereich.felder, bereich.spalten, esc, { kompakt });
    if (!raster) {
      return '';
    }
    const mitBild =
      opts.mitBildInBereich &&
      opts.bildDataUrl &&
      String(opts.bildDataUrl).startsWith('data:') &&
      istStammdatenBereich(bereich);
    const inhaltInner = mitBild
      ? `<div class="htbah-sl-pdf-bereich-stammdaten-inhalt">
          ${baueBereichAvatarHtml(opts.bildDataUrl, opts.stil)}
          <div class="htbah-sl-pdf-bereich-stammdaten-felder">${raster}</div>
        </div>`
      : raster;
    let html = `<div class="htbah-sl-pdf-bereich${kompakt ? ' htbah-sl-pdf-bereich--gerahmt' : ''}">
      <div class="htbah-sl-pdf-bereich-titel">${esc(titel)}</div>
      ${inhaltInner}
    </div>`;
    if (paket.faehigkeiten && /Kampf/i.test(titel)) {
      html += baueFaehigkeitenPdfHtml(paket.faehigkeiten, esc, kompakt);
    }
    return html;
  }

  function wrapKartenZeilenBlock(zeilenHtml) {
    const inner = String(zeilenHtml || '').trim();
    if (!inner) {
      return '';
    }
    return `<div class="htbah-sl-pdf-karten-block">${inner}</div>`;
  }

  function kartenBlockTrennerHtml() {
    return `<div class="htbah-sl-pdf-block-spacer" aria-hidden="true"></div>`;
  }

  function baueBereichFeldRasterHtml(felder, spalten, esc, optionen) {
    const liste = Array.isArray(felder) ? felder : [];
    if (!liste.length) {
      return '';
    }
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const kompakt = !!opts.kompakt;
    const cols = spalten === 1 ? 1 : spalten === 3 || kompakt ? 3 : 2;
    let html = '<div class="htbah-sl-pdf-feld-raster">';
    liste.forEach((feld) => {
      const zeile = baueEntitaetFeldZeileHtml(feld, esc, kompakt);
      if (!zeile) {
        return;
      }
      const klasse =
        cols === 1
          ? 'htbah-sl-pdf-feld-spalte htbah-sl-pdf-feld-spalte--voll'
          : cols === 3
            ? 'htbah-sl-pdf-feld-spalte htbah-sl-pdf-feld-spalte--drittel'
            : 'htbah-sl-pdf-feld-spalte';
      html += `<div class="${klasse}">${zeile}</div>`;
    });
    html += '</div>';
    return html;
  }

  function baueBereicheInhaltHtml(paket, esc, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const bereiche = Array.isArray(paket.bereiche) ? paket.bereiche : [];
    if (!bereiche.length) {
      return '';
    }
    const kompakt = PDF_KOMPAKT_TYPEN.has(paket.typ);
    const hatBild =
      !!opts.mitBild && paket.bildDataUrl && String(paket.bildDataUrl).startsWith('data:');
    let html = '';
    let bildInStammdaten = false;
    bereiche.forEach((bereich) => {
      if (!bereich) {
        return;
      }
      const stammMitBild = hatBild && !bildInStammdaten && istStammdatenBereich(bereich);
      html += baueEinzelnenBereichHtml(bereich, paket, esc, {
        kompakt,
        mitBildInBereich: stammMitBild,
        bildDataUrl: paket.bildDataUrl,
        stil: opts.stil,
      });
      if (stammMitBild) {
        bildInStammdaten = true;
      }
    });
    if (!html) {
      return '';
    }
    return `<div class="htbah-sl-pdf-karte-bereiche">${html}</div>`;
  }

  function baueEntitaetKarteHtml(paket, mitBild, stil) {
    const s = stil || lesePdfStil({});
    const esc = U().escapeHtml;
    const kompakt = PDF_KOMPAKT_TYPEN.has(paket.typ);
    const hatBild = mitBild && paket.bildDataUrl && String(paket.bildDataUrl).startsWith('data:');
    let inhaltHtml = '';
    if (paket.layout === 'bereiche' && Array.isArray(paket.bereiche) && paket.bereiche.length) {
      inhaltHtml = baueBereicheInhaltHtml(paket, esc, { mitBild, stil: s });
    } else {
      const felder = Array.isArray(paket.felder) ? paket.felder : [];
      const felderHtml = felder
        .map((feld) => baueEntitaetFeldZeileHtml(feld, esc, kompakt))
        .join('');
      if (hatBild && felderHtml) {
        inhaltHtml = `<div class="htbah-sl-pdf-bereich-stammdaten-inhalt">
          ${baueBereichAvatarHtml(paket.bildDataUrl, s)}
          <div class="htbah-sl-pdf-bereich-stammdaten-felder">${felderHtml}</div>
        </div>`;
      } else {
        inhaltHtml = felderHtml;
      }
    }
    return `<div class="htbah-sl-pdf-karte${kompakt ? ' htbah-sl-pdf-karte--kompakt' : ''}" style="border:1px solid ${s.kartenRahmen};border-radius:6px;padding:6px 8px;background:${s.panelBg};overflow:hidden;break-inside:avoid;page-break-inside:avoid;">
      <div style="font-size:${kompakt ? 8 : 10}px;font-weight:800;color:${s.kopfTitel};margin:0 0 3px;line-height:1.2;">${esc(paket.emoji || '')} ${esc(paket.titel || 'Eintrag')}</div>
      ${inhaltHtml}
    </div>`;
  }

  function baueKartenZeileHtml(karteLinks, karteMitte, karteRechts) {
    if (!karteMitte && !karteRechts) {
      return `<div class="htbah-sl-pdf-karten-zeile"><div class="htbah-sl-pdf-karten-spalte htbah-sl-pdf-karten-spalte--voll">${karteLinks}</div></div>`;
    }
    if (!karteRechts) {
      return `<div class="htbah-sl-pdf-karten-zeile"><div class="htbah-sl-pdf-karten-spalte">${karteLinks}</div><div class="htbah-sl-pdf-karten-spalte">${karteMitte}</div></div>`;
    }
    return `<div class="htbah-sl-pdf-karten-zeile"><div class="htbah-sl-pdf-karten-spalte htbah-sl-pdf-karten-spalte--drittel">${karteLinks}</div><div class="htbah-sl-pdf-karten-spalte htbah-sl-pdf-karten-spalte--drittel">${karteMitte}</div><div class="htbah-sl-pdf-karten-spalte htbah-sl-pdf-karten-spalte--drittel">${karteRechts}</div></div>`;
  }

  const VOLLE_BREITE_TYPEN = new Set(['charakter']);

  function karteBevorzugtVolleBreite(paket, mitBild) {
    if (paket && PDF_KOMPAKT_TYPEN.has(paket.typ)) {
      return false;
    }
    if (paket && VOLLE_BREITE_TYPEN.has(paket.typ)) {
      return true;
    }
    if (paket && paket.layout === 'bereiche' && !PDF_KOMPAKT_TYPEN.has(paket.typ)) {
      return true;
    }
    const felder = Array.isArray(paket.felder) ? paket.felder : [];
    if (felder.length > 7) {
      return true;
    }
    return felder.some((feld) => {
      if (!feld || !feld.html) {
        return false;
      }
      const roh = String(feld.html).replace(/<[^>]+>/g, ' ').trim();
      return roh.length > 320;
    });
  }

  function baueKartenEintragHtml(paket, mitBild, stil) {
    return {
      html: baueEntitaetKarteHtml(paket, mitBild, stil),
      volleBreite: karteBevorzugtVolleBreite(paket, mitBild),
      kompakt: paket && PDF_KOMPAKT_TYPEN.has(paket.typ),
    };
  }

  function baueKartenZeilenHtml(kartenEintraege) {
    const liste = Array.isArray(kartenEintraege) ? kartenEintraege : [];
    const zeilen = [];
    const alleKompakt = liste.length > 0 && liste.every((e) => e && e.kompakt);
    let i = 0;
    if (alleKompakt) {
      while (i < liste.length) {
        const a = liste[i];
        const b = liste[i + 1];
        const c = liste[i + 2];
        if (!a) {
          i += 1;
          continue;
        }
        zeilen.push(baueKartenZeileHtml(a.html, b ? b.html : null, c ? c.html : null));
        i += 3;
      }
      return zeilen;
    }
    while (i < liste.length) {
      const links = liste[i];
      const rechts = liste[i + 1];
      if (!links) {
        i += 1;
        continue;
      }
      if (links.volleBreite || !rechts || rechts.volleBreite) {
        zeilen.push(baueKartenZeileHtml(links.html, null, null));
        i += 1;
      } else {
        zeilen.push(baueKartenZeileHtml(links.html, rechts.html, null));
        i += 2;
      }
    }
    return zeilen;
  }

  function sammleEntitaetKartenHtml(typ, liste, mitBild, stil) {
    const Edf = E();
    if (!Edf) {
      return [];
    }
    const inReihenfolge = [...(liste || [])];
    return inReihenfolge.map((zeile) => {
      const paket = Edf.detailFelderFuerZeile(typ, zeile);
      if (!mitBild) {
        paket.bildDataUrl = '';
      }
      return baueKartenEintragHtml(paket, mitBild, stil);
    });
  }

  function sammleGruppeKartenHtml(kampagne, auswahl, stil) {
    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
    if (!mitglieder.length) {
      return [];
    }
    const Edf = E();
    return mitglieder.map((m) => {
      const paket = Edf.detailFelderFuerZeile('charakter', m.charakter || {}, {
        charakterBild: m.charakterBild,
      });
      if (!auswahl.entitaetsBilder) {
        paket.bildDataUrl = '';
      }
      return baueKartenEintragHtml(paket, auswahl.entitaetsBilder, stil);
    });
  }

  function baueSektionTitelHtml(titel, stil, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const s = stil || lesePdfStil({});
    const sektionKlasse = opts.ersteSektion
      ? 'htbah-sl-pdf-sektion htbah-sl-pdf-sektion--erste'
      : 'htbah-sl-pdf-sektion htbah-sl-pdf-sektion--nach-inhalt';
    const spacer = opts.ersteSektion ? '' : '<div class="htbah-sl-pdf-sektion-spacer" aria-hidden="true"></div>';
    return `${spacer}<div class="${sektionKlasse}" style="padding:0 4px 4px;">
      <h2 style="font-size:14px;font-weight:800;margin:0 0 ${PDF_ZEILEN_ABSTAND_PX}px;color:${s.kopfTitel};border-bottom:2px solid ${s.akzent};padding-bottom:3px;">${U().escapeHtml(titel)}</h2>
    </div>`;
  }

  function maxPdfBlockHoehePx(scale) {
    const sc = typeof scale === 'number' && scale > 0 ? scale : U().ermittlePdfRenderScale();
    return U().berechneA4SliceHoeheCanvasPx(sc) - 16;
  }

  function messPdfBlockHoehePx(innerHtml, stil, htmlOpts) {
    const html = `${pdfWurzelStart(stil)}${innerHtml}${pdfWurzelEnde()}`;
    return U().messeHtmlBlockHoeheCanvasPx(html, htmlOpts);
  }

  async function renderHtmlInFlow(pdf, innerHtml, stil, flow, htmlOpts) {
    const html = `${pdfWurzelStart(stil)}${innerHtml}${pdfWurzelEnde()}`;
    const canvas = await U().renderHtmlZuCanvas(html, htmlOpts);
    U().sicherePdfNeueSeiteWennZuKlein(pdf, flow, canvas.height);
    U().fuegeCanvasInPdfFlow(pdf, canvas, flow, { seite1BreitePrioritaet: true });
    await U().yieldToMain();
  }

  async function ermittleSektionsStartBlock(titelHtml, zeilen, stil, htmlOpts) {
    const titelH = messPdfBlockHoehePx(titelHtml, stil, htmlOpts);
    let kartenHtml = '';
    let idx = 0;
    let kartenH = 0;
    const maxH = maxPdfBlockHoehePx(htmlOpts && htmlOpts.scale);
    while (idx < zeilen.length) {
      const probe = wrapKartenZeilenBlock(kartenHtml + zeilen[idx]);
      const probeH = messPdfBlockHoehePx(probe, stil, htmlOpts);
      if (!kartenHtml || titelH + kartenH + probeH <= maxH) {
        kartenHtml += zeilen[idx];
        kartenH = probeH;
        idx += 1;
      } else {
        break;
      }
    }
    const html = titelHtml + wrapKartenZeilenBlock(kartenHtml);
    return { html, idx, noetigPx: titelH + kartenH };
  }

  function erzwingeKapitelSeitenumbruch(pdf, flow, aktiv) {
    if (!aktiv || !flow || !flow.hatInhaltAufSeite) {
      return;
    }
    pdf.addPage();
    flow.currentY = null;
    flow.hatInhaltAufSeite = false;
  }

  async function renderKartenSektion(pdf, titel, kartenEintraege, stil, sektionOpts, flow, htmlOpts) {
    const karten = Array.isArray(kartenEintraege) ? kartenEintraege : [];
    const zeilen = baueKartenZeilenHtml(karten);
    if (!zeilen.length) {
      return;
    }
    erzwingeKapitelSeitenumbruch(pdf, flow, sektionOpts && sektionOpts.kapitelSeitenumbruch);
    const titelHtml = baueSektionTitelHtml(titel, stil, sektionOpts);
    const start = await ermittleSektionsStartBlock(titelHtml, zeilen, stil, htmlOpts);
    U().sicherePdfNeueSeiteWennZuKlein(pdf, flow, start.noetigPx);
    await renderHtmlInFlow(pdf, start.html, stil, flow, htmlOpts);
    let i = start.idx;
    const maxH = maxPdfBlockHoehePx(htmlOpts && htmlOpts.scale);
    while (i < zeilen.length) {
      let blockHtml = '';
      let blockH = 0;
      const budget = Math.min(U().flowVerfuegbareHoeheCanvasPx(pdf, flow), maxH);
      while (i < zeilen.length) {
        const probe = wrapKartenZeilenBlock(blockHtml + zeilen[i]);
        const probeMitTrenner = kartenBlockTrennerHtml() + probe;
        const probeH = messPdfBlockHoehePx(probeMitTrenner, stil, htmlOpts);
        if (blockHtml && blockH + probeH > budget) {
          break;
        }
        blockHtml += zeilen[i];
        blockH = probeH;
        i += 1;
      }
      if (!blockHtml && i < zeilen.length) {
        blockHtml = zeilen[i];
        blockH = messPdfBlockHoehePx(
          kartenBlockTrennerHtml() + wrapKartenZeilenBlock(blockHtml),
          stil,
          htmlOpts,
        );
        i += 1;
      }
      if (blockHtml) {
        await renderHtmlInFlow(
          pdf,
          kartenBlockTrennerHtml() + wrapKartenZeilenBlock(blockHtml),
          stil,
          flow,
          htmlOpts,
        );
      }
    }
  }

  function baueSektionBlockHtml(titel, inhaltHtml, stil, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const s = stil || lesePdfStil({});
    const sektionKlasse = opts.ersteSektion
      ? 'htbah-sl-pdf-sektion htbah-sl-pdf-sektion--erste'
      : 'htbah-sl-pdf-sektion htbah-sl-pdf-sektion--nach-inhalt';
    const spacer = opts.ersteSektion ? '' : '<div class="htbah-sl-pdf-sektion-spacer" aria-hidden="true"></div>';
    return `${spacer}<div class="${sektionKlasse}" style="padding:0 4px 4px;">
      <h2 style="font-size:14px;font-weight:800;margin:0 0 ${PDF_ZEILEN_ABSTAND_PX}px;color:${s.kopfTitel};border-bottom:2px solid ${s.akzent};padding-bottom:4px;">${U().escapeHtml(titel)}</h2>
      ${inhaltHtml}
    </div>`;
  }

  function baueTitelseiteHtml(kampagne, labels, stil) {
    const esc = U().escapeHtml;
    const jetzt = new Date();
    const datum = jetzt.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const uhr = jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
    const labelHtml =
      Array.isArray(labels) && labels.length
        ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;justify-content:center;gap:4px;">${labels
            .map(
              (l) =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:0 10px;border:1px solid #bbb;border-radius:999px;background:#f0f0f0;font-size:10px;line-height:1;color:#222;box-sizing:border-box;">${esc(l.name || l.text || l.id)}</span>`,
            )
            .join('')}</div>`
        : '';
    const s = stil || lesePdfStil({});
    return `${pdfWurzelStart(s)}
      <div class="htbah-sl-pdf-deckblatt">
      <div style="text-align:center;padding:24px 12px 16px;border:2px solid ${s.rahmenAussen};border-radius:8px;background:${s.kopfMuster};">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${s.kopfUntertitel};margin-bottom:8px;">How to be a Hero · Kampagne</div>
        <h1 style="font-size:22px;font-weight:800;margin:0 0 6px;color:${s.kopfTitel};">${esc(kampagne.name || 'Kampagne')}</h1>
        <p style="font-size:11px;color:${s.kopfUntertitel};margin:0;">Stand: ${esc(datum)} · ${esc(uhr)}</p>
        ${labelHtml}
      </div>
      </div>
      ${pdfWurzelEnde()}`;
  }

  function baueAbenteuerbuchBlockHtml(abenteuerbuch, stil, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const AB = window.HTBAH_SHARED && window.HTBAH_SHARED.normalisiereAbenteuerbuch;
    const norm = AB
      ? AB(abenteuerbuch)
      : abenteuerbuch && abenteuerbuch.reiter
        ? abenteuerbuch
        : { reiter: [] };
    const reiter = Array.isArray(norm.reiter) ? norm.reiter : [];
    const s = stil || lesePdfStil({});
    if (!reiter.length) {
      return '';
    }
    let reiterHtml = '';
    reiter.forEach((r) => {
      if (!r || htmlIstLeer(r.html)) {
        return;
      }
      reiterHtml += `<div class="htbah-sl-pdf-ab-reiter"><h3 style="font-size:12px;font-weight:800;margin:0 0 ${PDF_ZEILEN_ABSTAND_PX}px;color:${s.kopfTitel};">${U().escapeHtml(r.name || 'Reiter')}</h3><div class="htbah-pdf-html" style="font-size:9px;line-height:1.4;">${r.html || '<p>—</p>'}</div></div>`;
    });
    if (!reiterHtml) {
      return '';
    }
    const sektionKlasse = opts.ersteSektion
      ? 'htbah-sl-pdf-sektion htbah-sl-pdf-abenteuerbuch htbah-sl-pdf-sektion--erste'
      : 'htbah-sl-pdf-sektion htbah-sl-pdf-abenteuerbuch htbah-sl-pdf-sektion--nach-inhalt';
    const spacer = opts.ersteSektion
      ? ''
      : '<div class="htbah-sl-pdf-sektion-spacer htbah-sl-pdf-sektion-spacer--abenteuerbuch" aria-hidden="true"></div>';
    return `${spacer}<div class="${sektionKlasse}" style="padding:0 4px 4px;">
      <h2 style="font-size:14px;font-weight:800;margin:0 0 ${PDF_ZEILEN_ABSTAND_PX}px;color:${s.kopfTitel};border-bottom:2px solid ${s.akzent};padding-bottom:4px;">Abenteuerbuch</h2>
      <div style="border:2px solid ${s.kartenRahmen};border-radius:8px;padding:12px 14px;background:${s.panelBg};">
        ${reiterHtml}
      </div>
    </div>`;
  }

  function baueGalerieInhaltHtml(eintraege, mitBild) {
    const liste = Array.isArray(eintraege) ? eintraege : [];
    if (!liste.length || !mitBild) {
      return '';
    }
    let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    liste.forEach((e) => {
      if (!e || typeof e.dataUrl !== 'string' || !e.dataUrl.startsWith('data:')) {
        return;
      }
      html += `<div style="width:calc(50% - 4px);box-sizing:border-box;border:1px solid #ccc;border-radius:6px;padding:6px;background:#fff;">
        <img src="${e.dataUrl}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:4px;" />
        <div style="font-size:9px;font-weight:600;margin-top:4px;word-break:break-word;">${U().escapeHtml(e.name || 'Bild')}</div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  async function renderDeckblattSeite(pdf, innerHtml, stil, htmlOpts) {
    const html = `${pdfWurzelStart(stil)}${innerHtml}${pdfWurzelEnde()}`;
    const canvas = await U().renderHtmlZuCanvas(html, htmlOpts);
    U().fuegeCanvasAlsA4SeiteHinzu(pdf, canvas, true);
    pdf.addPage();
    await U().yieldToMain();
  }

  async function htmlZuPdfSeiten(pdf, html, flow, htmlOpts) {
    const canvas = await U().renderHtmlZuCanvas(html, htmlOpts);
    U().fuegeCanvasInPdfFlow(pdf, canvas, flow, { seite1BreitePrioritaet: true });
    await U().yieldToMain();
  }

  function meldeExportProgress(opts, text, aktuell, gesamt, extra) {
    if (typeof opts.onProgress !== 'function') {
      return;
    }
    const total = Math.max(1, gesamt);
    const current = Math.max(0, Math.min(aktuell, total));
    let percent = Math.min(100, Math.round((current / total) * 100));
    const meta = extra && typeof extra === 'object' ? extra : {};
    if (typeof meta.percent === 'number') {
      percent = Math.min(100, Math.max(0, Math.round(meta.percent)));
    }
    opts.onProgress({ text: text || '', current, total, percent });
  }

  function hatKombiniertenInhaltExport(auswahl, kampagne, charakterModus, zustand, abenteuerbuch, wb) {
    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
    if (auswahl.gruppe && mitglieder.length && charakterModus !== 'voller_bogen') {
      return true;
    }
    const listenKeys = ['orte', 'fraktionen', 'npcs', 'bestien', 'gegenstaende', 'raetsel'];
    const auswahlKeys = [
      'orte',
      'fraktionen',
      'npcs',
      'bestien',
      'gegenstaende',
      'raetsel',
    ];
    for (let i = 0; i < listenKeys.length; i += 1) {
      if (auswahl[auswahlKeys[i]] && hatNichtLeereListe(zustand[listenKeys[i]])) {
        return true;
      }
    }
    if (auswahl.abenteuerbuch && hatAbenteuerbuchInhalt(abenteuerbuch)) {
      return true;
    }
    if (auswahl.galerie && hatGalerieInhalt(wb)) {
      return true;
    }
    return false;
  }

  function zaehleExportSchritte(auswahl, kampagne, charakterModus, zustand, abenteuerbuch, wb, kid, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    let n = 1;
    if (opts.cheatSheet && CS() && typeof CS().baueCheatSheetHtml === 'function') {
      n += 1;
    }
    if (opts.sicherheitsmechanismen) {
      n += 1;
    }
    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
    if (auswahl.gruppe && mitglieder.length && charakterModus === 'voller_bogen') {
      n += mitglieder.length;
    }
    if (hatKombiniertenInhaltExport(auswahl, kampagne, charakterModus, zustand, abenteuerbuch, wb)) {
      n += 1;
    }
    if (auswahl.interaktiveWelt && hatInteraktiveWeltInhalt(kid)) {
      n += 1;
    }
    return n;
  }

  async function fuegeCharakterBoegenEin(pdf, kampagne, optionen, tick) {
    const fn =
      typeof window.HTBAH.erzeugeCharakterPdfSeitenCanvases === 'function'
        ? window.HTBAH.erzeugeCharakterPdfSeitenCanvases
        : null;
    if (!fn) {
      return;
    }
    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
    for (let i = 0; i < mitglieder.length; i += 1) {
      const m = mitglieder[i];
      if (typeof tick === 'function') {
        await tick(`Charakterbogen ${i + 1}/${mitglieder.length} …`);
      }
      const canvases = await fn(m.charakter, m.charakterBild, {
        stil: optionen.pdfStil || 'fantasy-mittelalter',
      });
      pdf.addPage();
      U().fuegeCanvasAlsA4SeiteHinzu(pdf, canvases.seite1, true);
      pdf.addPage();
      U().fuegeCanvasAlsA4SeiteHinzu(pdf, canvases.notizen, true);
      pdf.addPage();
      U().fuegeCanvasAlsA4SeiteHinzu(pdf, canvases.sicherheit, false);
    }
  }

  const SEKTION_AUSWAHL_KEYS = [
    'gruppe',
    'orte',
    'fraktionen',
    'npcs',
    'bestien',
    'gegenstaende',
    'raetsel',
    'abenteuerbuch',
    'galerie',
    'interaktiveWelt',
  ];

  function hatExportSektionAuswahl(auswahl) {
    return SEKTION_AUSWAHL_KEYS.some((key) => auswahl && auswahl[key]);
  }

  async function erzeugeSpielleitungPdfBlob(kampagneId, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const charakterModus =
      opts.charakterDarstellung === 'voller_bogen' ? 'voller_bogen' : 'kompakt';
    const weltSeitenNorm =
      IW() && typeof IW().normalisiereWeltPdfSeitenAnzahl === 'function'
        ? IW().normalisiereWeltPdfSeitenAnzahl(opts.weltSeiten == null ? 1 : opts.weltSeiten)
        : (() => {
            const n = Number(opts.weltSeiten == null ? 1 : opts.weltSeiten);
            return n === 1 || n === 2 || n === 4 || n === 8 ? n : 1;
          })();
    const weltSeiten = weltSeitenNorm;
    const weltQuerformat = opts.weltQuerformat !== false;
    const pdfStil =
      typeof opts.pdfStil === 'string' && opts.pdfStil.trim() ? opts.pdfStil.trim() : 'fantasy-mittelalter';
    opts.pdfStil = pdfStil;
    const stil = lesePdfStil({ stil: pdfStil });

    if (typeof window.html2canvas !== 'function') {
      throw new Error('PDF-Bibliotheken fehlen (jspdf, html2canvas).');
    }

    const kid = typeof kampagneId === 'string' ? kampagneId.trim() : '';
    if (!kid) {
      throw new Error('Keine Kampagne angegeben.');
    }

    const verfuegbar = ermittleSpielleitungPdfVerfuegbarkeit(kid);
    const auswahl = normalisiereAuswahl(opts.auswahl, verfuegbar);
    const cheatSheet = opts.cheatSheet === true;
    const sicherheitsmechanismen =
      opts.sicherheitsmechanismen === true || opts.redFlags === true;
    const kapitelSeitenumbruch = opts.kapitelSeitenumbruch === true;
    if (!hatExportSektionAuswahl(auswahl) && !cheatSheet && !sicherheitsmechanismen) {
      throw new Error('Keine exportierbaren Inhalte ausgewählt.');
    }

    const sl = window.HTBAH.ladeSpielleitungZustand();
    const kampagne = (sl.kampagnen || []).find((k) => k && k.id === kid);
    if (!kampagne) {
      throw new Error('Kampagne nicht gefunden.');
    }

    const zustand = window.HTBAH.ladeZufallstabellenZustand(kid);
    const wb = window.HTBAH.ladeWeltenbauZustand(kid);
    const abenteuerbuch = window.HTBAH.ladeKampagnenAbenteuerbuch(kid);
    const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
    const labels =
      KL && typeof KL.normalisiereKampagneLabels === 'function'
        ? KL.normalisiereKampagneLabels(kampagne.labels)
        : Array.isArray(kampagne.labels)
          ? kampagne.labels
          : [];

    const pdf = U().neuesA4Pdf();
    const pdfFlow = U().erstellePdfFlowState();
    const pdfScale = U().ermittlePdfRenderScale();
    const htmlOpts = { scale: pdfScale, breitePx: U().PDF_BREITE_PX };
    const schritteGesamt = zaehleExportSchritte(
      auswahl,
      kampagne,
      charakterModus,
      zustand,
      abenteuerbuch,
      wb,
      kid,
      { cheatSheet, sicherheitsmechanismen },
    );
    let schritt = 0;
    const exportLog = (msg) => {
      const text = typeof msg === 'string' ? msg : String(msg);
      console.log('[PDF-Export]', text);
    };
    const tick = async (text) => {
      schritt += 1;
      exportLog(text);
      meldeExportProgress(opts, text, schritt, schritteGesamt);
      await U().yieldToMain();
    };

    const renderHtmlBlock = async (html) => {
      await htmlZuPdfSeiten(pdf, html, pdfFlow, htmlOpts);
    };

    exportLog(`Start — Render-Scale ${pdfScale}×`);
    await tick('Titelseite …');
    await renderDeckblattSeite(pdf, baueTitelseiteHtml(kampagne, labels, stil), stil, htmlOpts);

    if (cheatSheet && CS() && typeof CS().baueCheatSheetHtml === 'function') {
      await tick('Cheat-Sheet …');
      await renderHtmlInFlow(pdf, CS().baueCheatSheetHtml(stil), stil, pdfFlow, htmlOpts);
    }

    if (sicherheitsmechanismen && CS() && typeof CS().baueSicherheitsmechanismenPdfHtml === 'function') {
      await tick('Sicherheitsmechanismen …');
      await renderHtmlInFlow(
        pdf,
        CS().baueSicherheitsmechanismenPdfHtml(kampagne, stil),
        stil,
        pdfFlow,
        htmlOpts,
      );
    }

    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];

    if (auswahl.gruppe && mitglieder.length && charakterModus === 'voller_bogen') {
      await fuegeCharakterBoegenEin(pdf, kampagne, opts, tick);
      U().pdfFlowNachSeitenReset(pdfFlow);
    }

    let ersteInhaltsSektion = true;
    let hatInhaltsRender = false;

    if (auswahl.gruppe && mitglieder.length && charakterModus !== 'voller_bogen') {
      const karten = sammleGruppeKartenHtml(kampagne, auswahl, stil);
      if (karten.length) {
        if (!hatInhaltsRender) {
          await tick('Inhalte …');
          hatInhaltsRender = true;
        }
        await renderKartenSektion(
          pdf,
          'Gruppe / Charaktere',
          karten,
          stil,
          { ersteSektion: ersteInhaltsSektion, kapitelSeitenumbruch },
          pdfFlow,
          htmlOpts,
        );
        ersteInhaltsSektion = false;
      }
    }

    const sektionen = [
      { auswahlKey: 'orte', typ: 'ort', titel: 'Orte', listeKey: 'orte' },
      { auswahlKey: 'fraktionen', typ: 'fraktion', titel: 'Fraktionen', listeKey: 'fraktionen' },
      { auswahlKey: 'npcs', typ: 'npc', titel: 'NPCs', listeKey: 'npcs' },
      { auswahlKey: 'bestien', typ: 'bestie', titel: 'Bestien', listeKey: 'bestien' },
      { auswahlKey: 'gegenstaende', typ: 'gegenstand', titel: 'Gegenstände', listeKey: 'gegenstaende' },
      { auswahlKey: 'raetsel', typ: 'raetsel', titel: 'Rätsel', listeKey: 'raetsel' },
    ];

    for (const sec of sektionen) {
      if (!auswahl[sec.auswahlKey]) {
        continue;
      }
      const liste = zustand[sec.listeKey] || [];
      if (!hatNichtLeereListe(liste)) {
        continue;
      }
      const karten = sammleEntitaetKartenHtml(sec.typ, liste, auswahl.entitaetsBilder, stil);
      if (!karten.length) {
        continue;
      }
      if (!hatInhaltsRender) {
        await tick('Inhalte …');
        hatInhaltsRender = true;
      }
      await renderKartenSektion(
        pdf,
        sec.titel,
        karten,
        stil,
        { ersteSektion: ersteInhaltsSektion, kapitelSeitenumbruch },
        pdfFlow,
        htmlOpts,
      );
      ersteInhaltsSektion = false;
    }

    let restInhalt = '';
    if (auswahl.abenteuerbuch && hatAbenteuerbuchInhalt(abenteuerbuch)) {
      const abHtml = baueAbenteuerbuchBlockHtml(abenteuerbuch, stil, { ersteSektion: ersteInhaltsSektion });
      if (abHtml) {
        restInhalt += abHtml;
        ersteInhaltsSektion = false;
      }
    }

    if (auswahl.galerie && hatGalerieInhalt(wb)) {
      const galerieHtml = baueGalerieInhaltHtml(wb.eintraege, auswahl.entitaetsBilder);
      if (galerieHtml) {
        restInhalt += baueSektionBlockHtml('Importierte Bilder (Galerie)', galerieHtml, stil, {
          ersteSektion: ersteInhaltsSektion,
        });
        ersteInhaltsSektion = false;
      }
    }

    if (restInhalt) {
      if (!hatInhaltsRender) {
        await tick('Inhalte …');
        hatInhaltsRender = true;
      }
      erzwingeKapitelSeitenumbruch(pdf, pdfFlow, kapitelSeitenumbruch);
      await renderHtmlBlock(`${pdfWurzelStart(stil)}${restInhalt}${pdfWurzelEnde()}`);
    }

    if (auswahl.interaktiveWelt && IW() && hatInteraktiveWeltInhalt(kid)) {
      await tick('Interaktive Welt …');
      U().pdfFlowNachSeitenReset(pdfFlow);
      const mapStage =
        opts.mapStageElement instanceof HTMLElement
          ? opts.mapStageElement
          : IW().findeSichtbareMapStage && typeof IW().findeSichtbareMapStage === 'function'
            ? IW().findeSichtbareMapStage()
            : null;
      const tiles = await IW().erzeugeInteraktiveWeltPdfTiles(kid, weltSeiten, {
        mapStageElement: mapStage || undefined,
      });
      const weltOrientation = weltQuerformat ? 'landscape' : 'portrait';
      tiles.forEach((tile, idx) => {
        U().fuegeRohCanvasAlsA4SeiteHinzu(pdf, tile.canvas, {
          neueSeite: true,
          orientation: weltOrientation,
        });
      });
      await U().yieldToMain();
    }

    exportLog('PDF-Datei wird serialisiert …');
    meldeExportProgress(opts, 'PDF wird fertiggestellt …', schritteGesamt, schritteGesamt, {
      percent: 95,
    });
    await U().yieldToMain();

    const blob = await U().pdfBlobAusInstanz(pdf);
    exportLog(`Fertig — ${Math.round(blob.size / 1024)} KB`);
    const name = U().sichererDateinameTeil(kampagne.name, 'kampagne');
    const zeit = U().dateinameZeitstempel();
    return {
      blob,
      dateiname: `htbah-spielleitung-${name}-${zeit}.pdf`,
    };
  }

  window.HTBAH = window.HTBAH || {};
  window.HTBAH.erzeugeSpielleitungPdfBlob = erzeugeSpielleitungPdfBlob;
  window.HTBAH.ermittleSpielleitungPdfVerfuegbarkeit = ermittleSpielleitungPdfVerfuegbarkeit;
  window.HTBAH.SPIELLEITER_PDF_STANDARD_AUSWAHL = STANDARD_AUSWAHL;
})();
