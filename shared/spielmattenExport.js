window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerSpielmattenExport() {
  const DIN_FORMATE_MM = {
    A0: { widthMm: 841, heightMm: 1189 },
    A1: { widthMm: 594, heightMm: 841 },
    A2: { widthMm: 420, heightMm: 594 },
    A3: { widthMm: 297, heightMm: 420 },
    A4: { widthMm: 210, heightMm: 297 },
    A5: { widthMm: 148, heightMm: 210 },
    A6: { widthMm: 105, heightMm: 148 },
  };

  const DIN_OPTIONEN = Object.keys(DIN_FORMATE_MM);
  const DEFAULT_FORMAT = 'A4';
  const DEFAULT_DPI = 150;
  const MM_SCHRITT = 0.1;

  function normalisiereDinFormat(formatRaw) {
    const format = typeof formatRaw === 'string' ? formatRaw.trim().toUpperCase() : '';
    return DIN_FORMATE_MM[format] ? format : DEFAULT_FORMAT;
  }

  function normalisiereAusrichtung(ausrichtungRaw) {
    return ausrichtungRaw === 'landscape' ? 'landscape' : 'portrait';
  }

  function formatAbmessungenMm(formatRaw, ausrichtungRaw) {
    const format = normalisiereDinFormat(formatRaw);
    const ausrichtung = normalisiereAusrichtung(ausrichtungRaw);
    const basis = DIN_FORMATE_MM[format];
    if (ausrichtung === 'landscape') {
      return { widthMm: basis.heightMm, heightMm: basis.widthMm, format, ausrichtung };
    }
    return { widthMm: basis.widthMm, heightMm: basis.heightMm, format, ausrichtung };
  }

  function mmZuPx(mm, dpi) {
    return Math.max(1, Math.round((Number(mm) * Number(dpi)) / 25.4));
  }

  function gcdInt(a, b) {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y) {
      const rest = x % y;
      x = y;
      y = rest;
    }
    return x || 1;
  }

  function formatiereMm(mm) {
    if (!Number.isFinite(mm)) {
      return '';
    }
    const fix = Math.round(mm * 10) / 10;
    return Number.isInteger(fix) ? `${fix}` : fix.toFixed(1);
  }

  function normalisiereRandMm(randRaw) {
    const rand = Number(randRaw);
    if (!Number.isFinite(rand)) {
      return 0;
    }
    return Math.max(0, Math.round(rand / MM_SCHRITT) * MM_SCHRITT);
  }

  function normalisiereRandModus(modusRaw) {
    const modus = typeof modusRaw === 'string' ? modusRaw.trim().toLowerCase() : '';
    if (modus === 'kein' || modus === 'manuell') {
      return modus;
    }
    return 'auto';
  }

  function raenderAusEinstellungen(einstellungenRaw) {
    const einstellungen = einstellungenRaw && typeof einstellungenRaw === 'object' ? einstellungenRaw : {};
    if (
      einstellungen.randObenMm != null ||
      einstellungen.randUntenMm != null ||
      einstellungen.randLinksMm != null ||
      einstellungen.randRechtsMm != null
    ) {
      return {
        oben: normalisiereRandMm(einstellungen.randObenMm),
        unten: normalisiereRandMm(einstellungen.randUntenMm),
        links: normalisiereRandMm(einstellungen.randLinksMm),
        rechts: normalisiereRandMm(einstellungen.randRechtsMm),
      };
    }
    const einheitlich = normalisiereRandMm(einstellungen.seitenRandMm);
    return { oben: einheitlich, unten: einheitlich, links: einheitlich, rechts: einheitlich };
  }

  function verteileRestGleichmaessigMm(gesamtMm, inhaltMm) {
    const rest = Math.max(0, gesamtMm - inhaltMm);
    const start = normalisiereRandMm(rest / 2);
    const ende = normalisiereRandMm(rest - start);
    return { start, ende };
  }

  function berechneRasterInhaltMm(breiteMm, hoeheMm, rasterkanteMm, linieMm, keineAbgeschnittenen) {
    const rasterMm = Math.max(MM_SCHRITT, Number(rasterkanteMm) || MM_SCHRITT);
    const linie = Math.max(0.1, Number(linieMm) || 0.1);
    const nutzBreite = Math.max(0, Number(breiteMm) || 0);
    const nutzHoehe = Math.max(0, Number(hoeheMm) || 0);
    if (!Number.isFinite(nutzBreite) || !Number.isFinite(nutzHoehe) || nutzBreite <= 0 || nutzHoehe <= 0) {
      return { spalten: 0, zeilen: 0, breiteMm: 0, hoeheMm: 0 };
    }
    let spalten = 0;
    let zeilen = 0;
    if (keineAbgeschnittenen !== false) {
      spalten = Math.max(0, Math.floor((nutzBreite - linie) / rasterMm));
      zeilen = Math.max(0, Math.floor((nutzHoehe - linie) / rasterMm));
    } else {
      spalten = Math.max(1, Math.ceil(nutzBreite / rasterMm));
      zeilen = Math.max(1, Math.ceil(nutzHoehe / rasterMm));
    }
    const breite = keineAbgeschnittenen !== false
      ? Math.max(0, spalten * rasterMm + linie)
      : Math.min(nutzBreite, spalten * rasterMm);
    const hoehe = keineAbgeschnittenen !== false
      ? Math.max(0, zeilen * rasterMm + linie)
      : Math.min(nutzHoehe, zeilen * rasterMm);
    return { spalten, zeilen, breiteMm: breite, hoeheMm: hoehe };
  }

  function berechneRaenderMm(einstellungenRaw) {
    const einstellungen = einstellungenRaw && typeof einstellungenRaw === 'object' ? einstellungenRaw : {};
    const orient = formatAbmessungenMm(einstellungen.format, einstellungen.ausrichtung);
    const modus = normalisiereRandModus(einstellungen.randModus);
    const keineAbgeschnittenen = einstellungen.keineAbgeschnittenenQuadrate !== false;
    if (modus === 'kein') {
      return { oben: 0, unten: 0, links: 0, rechts: 0, modus };
    }
    if (modus === 'manuell') {
      return { ...raenderAusEinstellungen(einstellungen), modus };
    }
    if (!keineAbgeschnittenen) {
      return { oben: 0, unten: 0, links: 0, rechts: 0, modus };
    }
    const rasterkanteMm = Number.isFinite(Number(einstellungen.rasterkanteMm))
      ? Math.max(MM_SCHRITT, Number(einstellungen.rasterkanteMm))
      : 5;
    const linieMm = Number.isFinite(Number(einstellungen.gridLinienbreiteMm))
      ? Math.max(0.1, Number(einstellungen.gridLinienbreiteMm))
      : 0.3;
    const raster = berechneRasterInhaltMm(
      orient.widthMm,
      orient.heightMm,
      rasterkanteMm,
      linieMm,
      true,
    );
    const horizontal = verteileRestGleichmaessigMm(orient.widthMm, raster.breiteMm);
    const vertikal = verteileRestGleichmaessigMm(orient.heightMm, raster.hoeheMm);
    return {
      oben: normalisiereRandMm(vertikal.start),
      unten: normalisiereRandMm(vertikal.ende),
      links: normalisiereRandMm(horizontal.start),
      rechts: normalisiereRandMm(horizontal.ende),
      modus,
    };
  }

  function rasterTeilerDaten(formatRaw, randOptionen, ausrichtungRaw) {
    const abmessungen = formatAbmessungenMm(formatRaw, ausrichtungRaw);
    let raender;
    if (randOptionen && typeof randOptionen === 'object' && !Number.isFinite(Number(randOptionen))) {
      raender = raenderAusEinstellungen(randOptionen);
    } else {
      const randMm = normalisiereRandMm(randOptionen);
      raender = { oben: randMm, unten: randMm, links: randMm, rechts: randMm };
    }
    const widthZehntel = Math.round(abmessungen.widthMm / MM_SCHRITT);
    const heightZehntel = Math.round(abmessungen.heightMm / MM_SCHRITT);
    const randLinksZehntel = Math.round(raender.links / MM_SCHRITT);
    const randRechtsZehntel = Math.round(raender.rechts / MM_SCHRITT);
    const randObenZehntel = Math.round(raender.oben / MM_SCHRITT);
    const randUntenZehntel = Math.round(raender.unten / MM_SCHRITT);
    const innenW = widthZehntel - randLinksZehntel - randRechtsZehntel;
    const innenH = heightZehntel - randObenZehntel - randUntenZehntel;
    return {
      format: abmessungen.format,
      widthMm: abmessungen.widthMm,
      heightMm: abmessungen.heightMm,
      raender,
      innenW,
      innenH,
    };
  }

  function listValidSquareSizesMm(formatRaw, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const modus = normalisiereRandModus(opts.randModus);
    const randOptionen = modus === 'manuell'
      ? {
        randObenMm: opts.randObenMm,
        randUntenMm: opts.randUntenMm,
        randLinksMm: opts.randLinksMm,
        randRechtsMm: opts.randRechtsMm,
        seitenRandMm: opts.randMm,
      }
      : 0;
    const basis = rasterTeilerDaten(formatRaw, randOptionen, opts.ausrichtung);
    const minMm = Number.isFinite(Number(opts.minMm)) ? Math.max(MM_SCHRITT, Number(opts.minMm)) : 2;
    const maxMm = Number.isFinite(Number(opts.maxMm))
      ? Math.max(minMm, Number(opts.maxMm))
      : Math.min(basis.widthMm, basis.heightMm);
    if (basis.innenW <= 0 || basis.innenH <= 0) {
      return [];
    }
    const teiler = gcdInt(basis.innenW, basis.innenH);
    const result = [];
    for (let d = 1; d <= teiler; d += 1) {
      if (teiler % d !== 0) {
        continue;
      }
      const mm = d * MM_SCHRITT;
      if (mm < minMm || mm > maxMm) {
        continue;
      }
      result.push(Math.round(mm * 10) / 10);
    }
    return result.sort((a, b) => a - b);
  }

  function hexZuRgb(hexRaw) {
    const hex = typeof hexRaw === 'string' ? hexRaw.trim().replace(/^#/, '') : '';
    if (!hex) {
      return null;
    }
    if (hex.length === 3) {
      const r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      const g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      const b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
      if ([r, g, b].some((v) => Number.isNaN(v))) {
        return null;
      }
      return { r, g, b };
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].some((v) => Number.isNaN(v))) {
        return null;
      }
      return { r, g, b };
    }
    return null;
  }

  function normalisiereOverlayTransparenzProzent(wertRaw) {
    const wert = Number(wertRaw);
    if (!Number.isFinite(wert)) {
      return 10;
    }
    return Math.min(100, Math.max(0, Math.round(wert)));
  }

  function hintergrundHatRasterOverlay(einstellungenRaw) {
    const einstellungen = einstellungenRaw && typeof einstellungenRaw === 'object' ? einstellungenRaw : {};
    const modus = typeof einstellungen.hintergrundModus === 'string' ? einstellungen.hintergrundModus.trim() : '';
    if (modus === 'transparent') {
      return false;
    }
    if (modus === 'bild') {
      return Boolean(typeof einstellungen.hintergrundBildDataUrl === 'string' && einstellungen.hintergrundBildDataUrl.trim());
    }
    if (modus === 'farbe') {
      const farbe = typeof einstellungen.hintergrundFarbe === 'string' ? einstellungen.hintergrundFarbe.trim() : '';
      return Boolean(farbe && farbe !== 'transparent');
    }
    const bgColor = typeof einstellungen.hintergrundFarbe === 'string' ? einstellungen.hintergrundFarbe.trim() : '';
    const bgBild = typeof einstellungen.hintergrundBildDataUrl === 'string' ? einstellungen.hintergrundBildDataUrl.trim() : '';
    return Boolean((bgColor && bgColor !== 'transparent') || bgBild);
  }

  function hintergrundBildMitRasterAbschliessen(einstellungenRaw) {
    const einstellungen = einstellungenRaw && typeof einstellungenRaw === 'object' ? einstellungenRaw : {};
    return einstellungen.hintergrundBildMitRasterAbschliessen !== false;
  }

  function overlayBereichAusEinstellungen(einstellungen, rasterBereichPx) {
    const modus = typeof einstellungen.hintergrundModus === 'string' ? einstellungen.hintergrundModus.trim() : '';
    const bgBild = typeof einstellungen.hintergrundBildDataUrl === 'string' ? einstellungen.hintergrundBildDataUrl.trim() : '';
    if (modus === 'bild' && bgBild && hintergrundBildMitRasterAbschliessen(einstellungen) && rasterBereichPx) {
      return rasterBereichPx;
    }
    return null;
  }

  function zeichneRasterOverlay(ctx, canvas, einstellungen, rasterBereichPx) {
    if (!ctx || !canvas || !hintergrundHatRasterOverlay(einstellungen)) {
      return;
    }
    const farbe = typeof einstellungen.gridOverlayFarbe === 'string' ? einstellungen.gridOverlayFarbe.trim() || '#ffffff' : '#ffffff';
    const rgb = hexZuRgb(farbe);
    if (!rgb) {
      return;
    }
    const alpha = normalisiereOverlayTransparenzProzent(einstellungen.gridOverlayTransparenzProzent) / 100;
    const bereich = overlayBereichAusEinstellungen(einstellungen, rasterBereichPx);
    const x = bereich ? bereich.x : 0;
    const y = bereich ? bereich.y : 0;
    const breite = bereich ? bereich.width : canvas.width;
    const hoehe = bereich ? bereich.height : canvas.height;
    ctx.save();
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    ctx.fillRect(x, y, breite, hoehe);
    ctx.restore();
  }

  function canvasMitHintergrundFarbeFuellen(ctx, canvas, einstellungen) {
    const bgColor = typeof einstellungen.hintergrundFarbe === 'string' ? einstellungen.hintergrundFarbe.trim() : '';
    if (!bgColor || bgColor === 'transparent') {
      return;
    }
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function zeichneHintergrundBild(ctx, bgBild, zielBereich) {
    const dataUrl = typeof bgBild === 'string' ? bgBild.trim() : '';
    if (!ctx || !dataUrl || !zielBereich) {
      return Promise.resolve();
    }
    const bereich = zielBereich;
    if (!Number.isFinite(bereich.width) || !Number.isFinite(bereich.height) || bereich.width <= 0 || bereich.height <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(bereich.width / img.width, bereich.height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = bereich.x + (bereich.width - drawW) / 2;
        const y = bereich.y + (bereich.height - drawH) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(bereich.x, bereich.y, bereich.width, bereich.height);
        ctx.clip();
        ctx.drawImage(img, x, y, drawW, drawH);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  }

  function berechneLinienbreitePx(einstellungen, dpi) {
    const linienbreiteMm = Number.isFinite(Number(einstellungen.gridLinienbreiteMm))
      ? Math.max(0.1, Number(einstellungen.gridLinienbreiteMm))
      : 0.3;
    return Math.max(1, mmZuPx(linienbreiteMm, dpi || DEFAULT_DPI));
  }

  function zeichneRaster(ctx, canvas, einstellungen, cols, rows, rasterPx, dpi, keineAbgeschnittenen) {
    if (!ctx || !canvas || cols <= 0 || rows <= 0) {
      return;
    }
    const gridFarbe = typeof einstellungen.gridFarbe === 'string' ? einstellungen.gridFarbe.trim() || '#d9d9d9' : '#d9d9d9';
    const linienbreite = berechneLinienbreitePx(einstellungen, dpi);
    const kantePx = Math.max(1, Math.round(Number(rasterPx) || 1));
    const noCut = keineAbgeschnittenen !== false;
    const start = noCut ? linienbreite / 2 : 0;
    const maxX = noCut ? start + cols * kantePx : Math.min(canvas.width, cols * kantePx);
    const maxY = noCut ? start + rows * kantePx : Math.min(canvas.height, rows * kantePx);
    ctx.save();
    ctx.strokeStyle = gridFarbe;
    ctx.lineWidth = linienbreite;
    ctx.beginPath();
    for (let col = 0; col <= cols; col += 1) {
      const x = noCut ? start + col * kantePx : Math.min(canvas.width, Math.round(col * kantePx));
      ctx.moveTo(x, noCut ? start : 0);
      ctx.lineTo(x, noCut ? maxY : canvas.height);
    }
    for (let row = 0; row <= rows; row += 1) {
      const y = noCut ? start + row * kantePx : Math.min(canvas.height, Math.round(row * kantePx));
      ctx.moveTo(noCut ? start : 0, y);
      ctx.lineTo(noCut ? maxX : canvas.width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  async function renderSpielmatteCanvas(einstellungenRaw) {
    const einstellungen = einstellungenRaw && typeof einstellungenRaw === 'object' ? einstellungenRaw : {};
    const orient = formatAbmessungenMm(einstellungen.format, einstellungen.ausrichtung);
    const format = orient.format;
    const dpi = Number.isFinite(Number(einstellungen.dpi)) ? Math.max(72, Number(einstellungen.dpi)) : DEFAULT_DPI;
    const rasterkanteMm = Number.isFinite(Number(einstellungen.rasterkanteMm))
      ? Math.max(MM_SCHRITT, Number(einstellungen.rasterkanteMm))
      : 5;
    const widthMm = orient.widthMm;
    const heightMm = orient.heightMm;
    const raender = berechneRaenderMm(einstellungen);
    const teiler = rasterTeilerDaten(format, raender, orient.ausrichtung);
    const innenW = teiler.innenW;
    const innenH = teiler.innenH;
    const rasterZehntel = Math.round(rasterkanteMm / MM_SCHRITT);
    if (rasterZehntel <= 0 || innenW <= 0 || innenH <= 0) {
      throw new Error('Ungültige Rasterkante für dieses Format.');
    }
    const cols = Math.max(1, Math.floor(innenW / rasterZehntel));
    const rows = Math.max(1, Math.floor(innenH / rasterZehntel));
    const canvas = document.createElement('canvas');
    canvas.width = mmZuPx(widthMm, dpi);
    canvas.height = mmZuPx(heightMm, dpi);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas-Kontext konnte nicht erstellt werden.');
    }
    canvasMitHintergrundFarbeFuellen(ctx, canvas, einstellungen);
    const randLinksPx = mmZuPx(raender.links, dpi);
    const randRechtsPx = mmZuPx(raender.rechts, dpi);
    const randObenPx = mmZuPx(raender.oben, dpi);
    const randUntenPx = mmZuPx(raender.unten, dpi);
    const rasterCanvas = document.createElement('canvas');
    rasterCanvas.width = Math.max(1, canvas.width - randLinksPx - randRechtsPx);
    rasterCanvas.height = Math.max(1, canvas.height - randObenPx - randUntenPx);
    const rasterBereichPx = {
      x: randLinksPx,
      y: randObenPx,
      width: rasterCanvas.width,
      height: rasterCanvas.height,
    };
    const bgBild = typeof einstellungen.hintergrundBildDataUrl === 'string' ? einstellungen.hintergrundBildDataUrl.trim() : '';
    const modus = typeof einstellungen.hintergrundModus === 'string' ? einstellungen.hintergrundModus.trim() : '';
    if (modus === 'bild' && bgBild) {
      const bildBereich = hintergrundBildMitRasterAbschliessen(einstellungen)
        ? rasterBereichPx
        : { x: 0, y: 0, width: canvas.width, height: canvas.height };
      await zeichneHintergrundBild(ctx, bgBild, bildBereich);
    }
    zeichneRasterOverlay(ctx, canvas, einstellungen, rasterBereichPx);
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) {
      throw new Error('Canvas-Kontext konnte nicht erstellt werden.');
    }
    const rasterPx = mmZuPx(rasterkanteMm, dpi);
    const keineAbgeschnittenen = einstellungen.keineAbgeschnittenenQuadrate !== false;
    const linienbreitePx = berechneLinienbreitePx(einstellungen, dpi);
    const colsRender = keineAbgeschnittenen
      ? Math.max(0, Math.floor((rasterCanvas.width - linienbreitePx) / rasterPx))
      : Math.max(1, Math.ceil(rasterCanvas.width / rasterPx));
    const rowsRender = keineAbgeschnittenen
      ? Math.max(0, Math.floor((rasterCanvas.height - linienbreitePx) / rasterPx))
      : Math.max(1, Math.ceil(rasterCanvas.height / rasterPx));
    if (einstellungen.gridAktiv !== false) {
      zeichneRaster(
        rasterCtx,
        rasterCanvas,
        einstellungen,
        colsRender,
        rowsRender,
        rasterPx,
        dpi,
        keineAbgeschnittenen,
      );
    }
    ctx.drawImage(rasterCanvas, randLinksPx, randObenPx);
    return {
      canvas,
      format,
      widthMm,
      heightMm,
      cols,
      rows,
      rasterkanteMm,
      raender,
      ausrichtung: orient.ausrichtung,
    };
  }

  function canvasZuPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG konnte nicht erzeugt werden.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  }

  async function erzeugeSpielmattenPng(einstellungen) {
    const { canvas, format } = await renderSpielmatteCanvas(einstellungen);
    const blob = await canvasZuPngBlob(canvas);
    const zeit = (window.HTBAH_SHARED.PdfRenderUtils && window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel)
      ? window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel()
      : `${Date.now()}`;
    return { blob, dateiname: `htbah-spielmatte-${format.toLowerCase()}-${zeit}.png` };
  }

  async function erzeugeSpielmattenPdf(einstellungen) {
    const { canvas, format, widthMm, heightMm } = await renderSpielmatteCanvas(einstellungen);
    const jspdfNs = window.jspdf;
    const jsPDF = jspdfNs && (jspdfNs.jsPDF || jspdfNs.default);
    if (!jsPDF) {
      throw new Error('jsPDF fehlt.');
    }
    const pdf = new jsPDF({
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
      compress: true,
    });
    const pngData = canvas.toDataURL('image/png');
    pdf.addImage(pngData, 'PNG', 0, 0, widthMm, heightMm);
    const arrayBuffer = pdf.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const zeit = (window.HTBAH_SHARED.PdfRenderUtils && window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel)
      ? window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel()
      : `${Date.now()}`;
    return { blob, dateiname: `htbah-spielmatte-${format.toLowerCase()}-${zeit}.pdf` };
  }

  window.HTBAH_SHARED.SpielmattenExport = {
    DIN_FORMATE_MM,
    DIN_OPTIONEN,
    DEFAULT_FORMAT,
    DEFAULT_DPI,
    normalisiereDinFormat,
    formatiereMm,
    berechneRaenderMm,
    berechneRasterInhaltMm,
    listValidSquareSizesMm,
    renderSpielmatteCanvas,
    erzeugeSpielmattenPng,
    erzeugeSpielmattenPdf,
  };
})();
