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

  function rasterTeilerDaten(formatRaw, randRaw, ausrichtungRaw) {
    const abmessungen = formatAbmessungenMm(formatRaw, ausrichtungRaw);
    const randMm = normalisiereRandMm(randRaw);
    const widthZehntel = Math.round(abmessungen.widthMm / MM_SCHRITT);
    const heightZehntel = Math.round(abmessungen.heightMm / MM_SCHRITT);
    const randZehntel = Math.round(randMm / MM_SCHRITT);
    const innenW = widthZehntel - randZehntel * 2;
    const innenH = heightZehntel - randZehntel * 2;
    return {
      format: abmessungen.format,
      widthMm: abmessungen.widthMm,
      heightMm: abmessungen.heightMm,
      randMm,
      innenW,
      innenH,
    };
  }

  function listValidSquareSizesMm(formatRaw, optionen) {
    const basis = rasterTeilerDaten(formatRaw, optionen && optionen.randMm, optionen && optionen.ausrichtung);
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
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

  function canvasMitHintergrundFuellen(ctx, canvas, einstellungen) {
    const bgColor = typeof einstellungen.hintergrundFarbe === 'string' ? einstellungen.hintergrundFarbe.trim() : '';
    if (bgColor && bgColor !== 'transparent') {
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    const bgBild = typeof einstellungen.hintergrundBildDataUrl === 'string' ? einstellungen.hintergrundBildDataUrl : '';
    if (!bgBild) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height - drawH) / 2;
        ctx.drawImage(img, x, y, drawW, drawH);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = bgBild;
    });
  }

  function berechneLinienbreitePx(einstellungen, dpi) {
    const linienbreiteMm = Number.isFinite(Number(einstellungen.gridLinienbreiteMm))
      ? Math.max(0.1, Number(einstellungen.gridLinienbreiteMm))
      : 0.5;
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
    const randMm = normalisiereRandMm(einstellungen.seitenRandMm);
    const widthZehntel = Math.round(widthMm / MM_SCHRITT);
    const heightZehntel = Math.round(heightMm / MM_SCHRITT);
    const randZehntel = Math.round(randMm / MM_SCHRITT);
    const innenW = widthZehntel - randZehntel * 2;
    const innenH = heightZehntel - randZehntel * 2;
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
    await canvasMitHintergrundFuellen(ctx, canvas, einstellungen);
    const randPx = mmZuPx(randMm, dpi);
    const rasterCanvas = document.createElement('canvas');
    rasterCanvas.width = Math.max(1, canvas.width - randPx * 2);
    rasterCanvas.height = Math.max(1, canvas.height - randPx * 2);
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
    ctx.drawImage(rasterCanvas, randPx, randPx);
    return { canvas, format, widthMm, heightMm, cols, rows, rasterkanteMm, randMm, ausrichtung: orient.ausrichtung };
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
    listValidSquareSizesMm,
    renderSpielmatteCanvas,
    erzeugeSpielmattenPng,
    erzeugeSpielmattenPdf,
  };
})();
