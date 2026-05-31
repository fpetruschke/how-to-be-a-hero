/**
 * Gemeinsame Hilfen für html2canvas → jsPDF (Charakter- und Spielleitung-PDF).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerPdfRenderUtils() {
  const PDF_BREITE_PX = 794;
  const PDF_SEITEN_RAND_MM = 5;
  const PDF_JPEG_QUALITAET_DESKTOP = 0.92;
  const PDF_JPEG_QUALITAET_MOBIL = 0.85;

  function yieldToMain() {
    return new Promise((resolve) => {
      window.setTimeout(resolve, 0);
    });
  }

  /** Geringerer html2canvas-Scale auf mobilen / speicherarmen Geräten. */
  function ermittlePdfRenderScale() {
    try {
      const mem = navigator.deviceMemory;
      if (typeof mem === 'number' && mem <= 4) {
        return 1;
      }
    } catch {
      /* deviceMemory optional */
    }
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
      return 1;
    }
    if (navigator.maxTouchPoints > 1 && window.innerWidth < 900) {
      return 1;
    }
    return 2;
  }

  function pdfJpegQualitaetFuerScale(scale) {
    return scale <= 1 ? PDF_JPEG_QUALITAET_MOBIL : PDF_JPEG_QUALITAET_DESKTOP;
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

  function quillHtmlBasisStyles() {
    return `
        .htbah-pdf-wurzel .htbah-pdf-html p { margin: 0 0 2px 0; }
        .htbah-pdf-wurzel .htbah-pdf-html ul, .htbah-pdf-wurzel .htbah-pdf-html ol { margin: 0; padding-left: 12px; }
        .htbah-pdf-wurzel .htbah-pdf-html strong { font-weight: 600; }
        .htbah-pdf-wurzel .htbah-pdf-html em { font-style: italic; }
        .htbah-pdf-wurzel .htbah-pdf-html u { text-decoration: underline; }
        .htbah-pdf-wurzel .htbah-pdf-html s { text-decoration: line-through; }
        .htbah-pdf-wurzel .htbah-pdf-html h1 { font-size: 14px; margin: 0 0 4px; }
        .htbah-pdf-wurzel .htbah-pdf-html h2 { font-size: 12px; margin: 0 0 3px; }
        .htbah-pdf-wurzel .htbah-pdf-html h3 { font-size: 11px; margin: 0 0 2px; }
      `;
  }

  function addBoundsZuSlicePunkten(el, rootRect, scale, points) {
    const r = el.getBoundingClientRect();
    if (r.height < 0.5) {
      return;
    }
    const top = Math.round((r.top - rootRect.top) * scale);
    const bottom = Math.round((r.bottom - rootRect.top) * scale);
    if (top > 0) {
      points.add(top);
    }
    if (bottom > 0) {
      points.add(bottom);
    }
  }

  function addZeilenEndenZuSlicePunkten(el, rootRect, scale, points) {
    const rects = el.getClientRects();
    for (let i = 0; i < rects.length; i += 1) {
      const r = rects[i];
      if (r.height < 0.5) {
        continue;
      }
      const top = Math.round((r.top - rootRect.top) * scale);
      const bottom = Math.round((r.bottom - rootRect.top) * scale);
      if (top > 0) {
        points.add(top);
      }
      if (bottom > 0) {
        points.add(bottom);
      }
    }
  }

  /** Sammelt Y-Positionen (Canvas-Px), an denen geschnitten werden darf (Zeilen-/Blockgrenzen). */
  function findeSichereSlicePunktePx(wurzelEl, scale) {
    const sc = typeof scale === 'number' && scale > 0 ? scale : 2;
    if (!wurzelEl) {
      return [0];
    }
    const rootRect = wurzelEl.getBoundingClientRect();
    const points = new Set([0]);
    const blockSelektoren = [
      'h2',
      'h3',
      '.htbah-pdf-html h1',
      '.htbah-pdf-html h2',
      '.htbah-pdf-html h3',
      '.htbah-sl-pdf-karte',
      '.htbah-sl-pdf-karten-zeile',
      '.htbah-sl-pdf-ab-reiter',
      '.htbah-sl-pdf-bereich',
      '.htbah-sl-pdf-sektion',
    ];
    blockSelektoren.forEach((sel) => {
      wurzelEl.querySelectorAll(sel).forEach((el) => {
        addBoundsZuSlicePunkten(el, rootRect, sc, points);
      });
    });
    const zeilenSelektoren = ['.htbah-pdf-html p', '.htbah-pdf-html li', '.htbah-pdf-html blockquote'];
    zeilenSelektoren.forEach((sel) => {
      wurzelEl.querySelectorAll(sel).forEach((el) => {
        addZeilenEndenZuSlicePunkten(el, rootRect, sc, points);
      });
    });
    const total = Math.ceil(Math.max(wurzelEl.scrollHeight, wurzelEl.offsetHeight, 1) * sc);
    points.add(total);
    return [...points].sort((a, b) => a - b);
  }

  function sliceSnapYsVonCanvas(canvas) {
    if (!canvas || !Array.isArray(canvas._htbahSliceSnapYs)) {
      return null;
    }
    return canvas._htbahSliceSnapYs;
  }

  function berechneSliceHoeheMitSnaps(yOffset, maxSliceH, totalH, snapYs) {
    const rest = totalH - yOffset;
    if (rest <= maxSliceH) {
      return rest;
    }
    const idealEnd = yOffset + maxSliceH;
    let bestEnd = yOffset;
    if (Array.isArray(snapYs) && snapYs.length) {
      for (let i = 0; i < snapYs.length; i += 1) {
        const y = snapYs[i];
        if (y > yOffset && y <= idealEnd) {
          bestEnd = y;
        }
      }
      if (bestEnd > yOffset) {
        return bestEnd - yOffset;
      }
      for (let j = 0; j < snapYs.length; j += 1) {
        const y = snapYs[j];
        if (y > yOffset) {
          const sliceH = y - yOffset;
          if (sliceH <= maxSliceH) {
            return sliceH;
          }
          break;
        }
      }
    }
    return maxSliceH;
  }

  function maxSlicePxAusVerfuegbarMm(verfuegbarMm, maxH, maxSlicePxFull) {
    if (verfuegbarMm >= maxH) {
      return maxSlicePxFull;
    }
    return Math.max(1, Math.floor((verfuegbarMm / maxH) * maxSlicePxFull));
  }

  /** Layout-Höhe in Canvas-Pixeln (ohne html2canvas — nur DOM-Messung). */
  function messeHtmlBlockHoeheCanvasPx(html, optionen) {
    const opts =
      typeof optionen === 'number'
        ? { breitePx: optionen }
        : optionen && typeof optionen === 'object'
          ? optionen
          : {};
    const breite =
      typeof opts.breitePx === 'number' && opts.breitePx > 0 ? opts.breitePx : PDF_BREITE_PX;
    const scale =
      typeof opts.scale === 'number' && opts.scale > 0 ? opts.scale : ermittlePdfRenderScale();
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:fixed;left:-9999px;top:0;width:' +
      breite +
      'px;max-width:' +
      breite +
      'px;z-index:-1;pointer-events:none;overflow:visible;visibility:hidden;';
    host.innerHTML = html;
    document.body.appendChild(host);
    const el = host.querySelector('.htbah-pdf-wurzel') || host.firstElementChild;
    if (!el) {
      document.body.removeChild(host);
      return 0;
    }
    const h = Math.max(el.scrollHeight, el.offsetHeight, 1);
    document.body.removeChild(host);
    return Math.ceil(h * scale);
  }

  async function renderHtmlZuCanvas(html, optionen) {
    const opts =
      typeof optionen === 'number'
        ? { breitePx: optionen }
        : optionen && typeof optionen === 'object'
          ? optionen
          : {};
    const breite =
      typeof opts.breitePx === 'number' && opts.breitePx > 0 ? opts.breitePx : PDF_BREITE_PX;
    const hoehe = typeof opts.hoehePx === 'number' && opts.hoehePx > 0 ? opts.hoehePx : 0;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    let hostCss =
      'position:fixed;left:-9999px;top:0;width:' +
      breite +
      'px;max-width:' +
      breite +
      'px;z-index:-1;pointer-events:none;overflow:visible;';
    if (hoehe) {
      hostCss += 'height:' + hoehe + 'px;';
    }
    host.style.cssText = hostCss;
    host.innerHTML = html;
    document.body.appendChild(host);
    const el = host.querySelector('.htbah-pdf-wurzel') || host.firstElementChild;
    if (!el) {
      document.body.removeChild(host);
      throw new Error('PDF-Markup fehlerhaft.');
    }
    const canvasHoehe = hoehe || Math.max(el.scrollHeight, el.offsetHeight, 1);
    const iwExport =
      opts.interaktiveWeltExport === true || !!el.querySelector('.htbah-iw-export-host');
    const scale =
      typeof opts.scale === 'number' && opts.scale > 0 ? opts.scale : ermittlePdfRenderScale();
    let h2cOpts = {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor:
        typeof opts.backgroundColor === 'string' ? opts.backgroundColor : '#ffffff',
      width: breite,
      height: canvasHoehe,
      windowWidth: breite,
      windowHeight: canvasHoehe,
    };
    const IW = window.HTBAH_SHARED && window.HTBAH_SHARED.InteraktiveWeltExport;
    if (iwExport && IW && typeof IW.html2canvasOptionenIwExport === 'function') {
      h2cOpts = IW.html2canvasOptionenIwExport(h2cOpts);
    }
    try {
      const scale = h2cOpts.scale;
      const snapYs = findeSichereSlicePunktePx(el, scale);
      const canvas = await window.html2canvas(el, h2cOpts);
      canvas._htbahSliceSnapYs = snapYs;
      return canvas;
    } finally {
      document.body.removeChild(host);
    }
  }

  function fuegeCanvasAlsA4SeiteHinzu(pdf, canvas, seite1BreitePrioritaet) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const rand = PDF_SEITEN_RAND_MM;
    const maxW = pageW - 2 * rand;
    const maxH = pageH - 2 * rand;
    const jpegQ = pdfJpegQualitaetFuerScale(canvas.width / PDF_BREITE_PX);
    const imgData = canvas.toDataURL('image/jpeg', jpegQ);
    const cw = canvas.width;
    const ch = canvas.height;
    let finalW = maxW;
    let finalH = (ch * maxW) / cw;
    if (finalH > maxH) {
      finalH = maxH;
      finalW = (cw * maxH) / ch;
    }
    let x = rand + (maxW - finalW) / 2;
    let y = rand;
    if (seite1BreitePrioritaet && finalW < maxW - 0.2) {
      finalW = maxW;
      finalH = (ch * maxW) / cw;
      x = rand;
      y = rand;
      if (finalH > maxH) {
        finalH = maxH;
      }
    }
    pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
  }

  function pdfSeitenAbmessungen(pdf) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const rand = PDF_SEITEN_RAND_MM;
    return {
      pageW,
      pageH,
      rand,
      maxW: pageW - 2 * rand,
      maxH: pageH - 2 * rand,
    };
  }

  function erstellePdfFlowState() {
    return {
      currentY: null,
      hatInhaltAufSeite: false,
    };
  }

  function pdfFlowNachSeitenReset(flow) {
    if (!flow) {
      return;
    }
    flow.currentY = null;
    flow.hatInhaltAufSeite = false;
  }

  function platzierungFuerCanvasSlice(cw, ch, maxW, maxH, volleBreite) {
    let finalW = maxW;
    let finalH = (ch * maxW) / cw;
    if (finalH > maxH) {
      finalH = maxH;
      finalW = (cw * maxH) / ch;
    }
    let xRel = (maxW - finalW) / 2;
    if (volleBreite && finalW < maxW - 0.2) {
      finalW = maxW;
      finalH = (ch * maxW) / cw;
      xRel = 0;
      if (finalH > maxH) {
        finalH = maxH;
      }
    }
    return { finalW, finalH, xRel };
  }

  function flowVerfuegbareHoeheCanvasPx(pdf, flow, scale) {
    const sc = typeof scale === 'number' && scale > 0 ? scale : 2;
    const maxSlicePx = berechneA4SliceHoeheCanvasPx(sc);
    if (!flow || !flow.hatInhaltAufSeite) {
      return maxSlicePx;
    }
    const { pageH, rand, maxH } = pdfSeitenAbmessungen(pdf);
    const y = flow.currentY != null ? flow.currentY : rand;
    const restMm = pageH - rand - y;
    if (restMm <= 2) {
      return maxSlicePx;
    }
    return Math.max(1, Math.floor((restMm / maxH) * maxSlicePx));
  }

  function sicherePdfNeueSeiteWennZuKlein(pdf, flow, benoetigteCanvasHoehePx) {
    if (!flow || !flow.hatInhaltAufSeite) {
      return;
    }
    const noetig =
      typeof benoetigteCanvasHoehePx === 'number' && benoetigteCanvasHoehePx > 0
        ? benoetigteCanvasHoehePx
        : 0;
    if (!noetig) {
      return;
    }
    const verfuegbar = flowVerfuegbareHoeheCanvasPx(pdf, flow);
    if (noetig <= verfuegbar) {
      return;
    }
    pdf.addPage();
    flow.currentY = null;
    flow.hatInhaltAufSeite = false;
  }

  function zeichneCanvasSlice(canvas, yOffset, sliceH) {
    const cw = canvas.width;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = cw;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(canvas, 0, yOffset, cw, sliceH, 0, 0, cw, sliceH);
    return sliceCanvas;
  }

  /**
   * Fügt Canvas-Inhalt fortlaufend ein (Restplatz der aktuellen Seite nutzen).
   */
  function fuegeCanvasInPdfFlow(pdf, canvas, flow, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    if (!flow) {
      return fuegeCanvasAlsA4SeitenGestapelt(pdf, canvas, opts);
    }
    const { pageH, rand, maxW, maxH } = pdfSeitenAbmessungen(pdf);
    const cw = canvas.width;
    const ch = canvas.height;
    const maxSlicePxFull = Math.max(1, Math.floor((maxH / maxW) * cw));
    const snapYs = sliceSnapYsVonCanvas(canvas);
    const volleBreite = opts.seite1BreitePrioritaet !== false;
    let yOffset = 0;
    let sliceIdx = 0;
    while (yOffset < ch) {
      let startY = flow.currentY != null ? flow.currentY : rand;
      let verfuegbarMm = pageH - rand - startY;
      if (verfuegbarMm < 8 && flow.hatInhaltAufSeite) {
        pdf.addPage();
        flow.currentY = null;
        flow.hatInhaltAufSeite = false;
        continue;
      }
      const maxSlicePx = maxSlicePxAusVerfuegbarMm(verfuegbarMm, maxH, maxSlicePxFull);
      const sliceH = berechneSliceHoeheMitSnaps(yOffset, maxSlicePx, ch, snapYs);
      const sliceCanvas = zeichneCanvasSlice(canvas, yOffset, sliceH);
      if (!sliceCanvas) {
        break;
      }
      const platz = platzierungFuerCanvasSlice(
        cw,
        sliceH,
        maxW,
        maxH,
        volleBreite && sliceIdx === 0,
      );
      if (platz.finalH > verfuegbarMm + 0.3) {
        if (flow.hatInhaltAufSeite) {
          pdf.addPage();
          flow.currentY = null;
          flow.hatInhaltAufSeite = false;
          continue;
        }
        startY = rand;
        verfuegbarMm = pageH - 2 * rand;
      }
      const jpegQ = pdfJpegQualitaetFuerScale(cw / PDF_BREITE_PX);
      const imgData = sliceCanvas.toDataURL('image/jpeg', jpegQ);
      pdf.addImage(imgData, 'JPEG', rand + platz.xRel, startY, platz.finalW, platz.finalH);
      flow.currentY = startY + platz.finalH;
      flow.hatInhaltAufSeite = true;
      yOffset += sliceH;
      sliceIdx += 1;
    }
  }

  /**
   * Schneidet ein hohes Canvas in mehrere A4-Seiten (von oben nach unten).
   * @returns {number} Anzahl eingefügter Seiten
   */
  function fuegeCanvasAlsA4SeitenGestapelt(pdf, canvas, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const ersteSeite = opts.ersteSeite !== false;
    const seite1BreitePrioritaet = !!opts.seite1BreitePrioritaet;
    const { maxW, maxH } = pdfSeitenAbmessungen(pdf);
    const cw = canvas.width;
    const ch = canvas.height;
    const maxSlicePxFull = Math.max(1, Math.floor((maxH / maxW) * cw));
    const snapYs = sliceSnapYsVonCanvas(canvas);
    let yOffset = 0;
    let seiten = 0;
    while (yOffset < ch) {
      const sliceH = berechneSliceHoeheMitSnaps(yOffset, maxSlicePxFull, ch, snapYs);
      const sliceCanvas = zeichneCanvasSlice(canvas, yOffset, sliceH);
      if (!sliceCanvas) {
        break;
      }
      if (seiten > 0 || !ersteSeite) {
        pdf.addPage();
      }
      fuegeCanvasAlsA4SeiteHinzu(
        pdf,
        sliceCanvas,
        seiten === 0 && ersteSeite ? seite1BreitePrioritaet : false,
      );
      seiten += 1;
      yOffset += sliceH;
    }
    return seiten;
  }

  function fuegeRohCanvasAlsA4SeiteHinzu(pdf, canvas, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    if (opts.neueSeite) {
      if (opts.orientation === 'landscape') {
        pdf.addPage('a4', 'landscape');
      } else if (opts.orientation === 'portrait') {
        pdf.addPage('a4', 'portrait');
      } else {
        pdf.addPage();
      }
    }
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const rand = PDF_SEITEN_RAND_MM;
    const maxW = pageW - 2 * rand;
    const maxH = pageH - 2 * rand;
    const jpegQ = pdfJpegQualitaetFuerScale(canvas.width / PDF_BREITE_PX);
    const imgData = canvas.toDataURL('image/jpeg', jpegQ);
    const cw = canvas.width;
    const ch = canvas.height;
    let finalW = maxW;
    let finalH = (ch * maxW) / cw;
    if (finalH > maxH) {
      finalH = maxH;
      finalW = (cw * maxH) / ch;
    }
    const x = rand + (maxW - finalW) / 2;
    const y = rand;
    const titel = typeof opts.titel === 'string' ? opts.titel.trim() : '';
    if (titel) {
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(titel, rand, rand - 1);
      pdf.setTextColor(0, 0, 0);
    }
    pdf.addImage(imgData, 'JPEG', x, y + (titel ? 4 : 0), finalW, Math.max(1, finalH - (titel ? 4 : 0)));
  }

  /** Maximale Canvas-Höhe (px) pro A4-Seite bei Standard-Scale (html2canvas). */
  function berechneA4SliceHoeheCanvasPx(scale) {
    const sc = typeof scale === 'number' && scale > 0 ? scale : 2;
    const pageWmm = 210;
    const pageHmm = 297;
    const rand = PDF_SEITEN_RAND_MM;
    const maxWmm = pageWmm - 2 * rand;
    const maxHmm = pageHmm - 2 * rand;
    const cw = PDF_BREITE_PX * sc;
    return Math.floor((maxHmm / maxWmm) * cw);
  }

  function neuesA4Pdf() {
    const jspdfNs = window.jspdf;
    const jsPDF = jspdfNs && (jspdfNs.jsPDF || jspdfNs.default);
    if (!jsPDF) {
      throw new Error('jsPDF fehlt.');
    }
    return new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
  }

  async function pdfBlobAusInstanz(pdf) {
    await yieldToMain();
    const ab = pdf.output('arraybuffer');
    await yieldToMain();
    return new Blob([ab], { type: 'application/pdf' });
  }

  function dateinameZeitstempel() {
    const jetzt = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${jetzt.getFullYear()}-${pad(jetzt.getMonth() + 1)}-${pad(jetzt.getDate())}_${pad(jetzt.getHours())}-${pad(jetzt.getMinutes())}`;
  }

  function sichererDateinameTeil(name, fallback) {
    const roh = typeof name === 'string' ? name : '';
    return roh.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 64) || fallback || 'kampagne';
  }

  window.HTBAH_SHARED.PdfRenderUtils = {
    PDF_BREITE_PX,
    PDF_SEITEN_RAND_MM,
    escapeHtml,
    quillHtmlBasisStyles,
    yieldToMain,
    ermittlePdfRenderScale,
    messeHtmlBlockHoeheCanvasPx,
    renderHtmlZuCanvas,
    fuegeCanvasAlsA4SeiteHinzu,
    fuegeCanvasAlsA4SeitenGestapelt,
    berechneA4SliceHoeheCanvasPx,
    pdfSeitenAbmessungen,
    erstellePdfFlowState,
    pdfFlowNachSeitenReset,
    flowVerfuegbareHoeheCanvasPx,
    sicherePdfNeueSeiteWennZuKlein,
    fuegeCanvasInPdfFlow,
    fuegeRohCanvasAlsA4SeiteHinzu,
    neuesA4Pdf,
    pdfBlobAusInstanz,
    dateinameZeitstempel,
    sichererDateinameTeil,
  };
})();
