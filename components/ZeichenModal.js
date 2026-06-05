window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  const SPEICHER_KEY_FALLBACK = 'htbah_zeichen_brett';
  const STANDARD_BREITE = 840;
  const STANDARD_HOEHE = 620;
  const MIN_DICKE = 1;
  const MAX_DICKE = 60;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 12;
  const SPEICHER_DEBOUNCE_MS = 350;
  const EXPORT_PADDING = 24;
  const MAX_HISTORY = 30;
  const PASTE_VERSATZ = 16;
  /** CSS-Referenz: 1in = 96px, 1in = 2,54cm — entspricht der Browser-Einheit „cm“ im Layout. */
  const CSS_PX_PRO_CM = 96 / 2.54;
  const KARO_KANTE_CM = 0.5;
  const STANDARD_GITTER_FARBE = '#94a3b8';
  const GITTER_ALPHA = 0.22;
  const MAX_EBENEN = 50;
  const ZEICHEN_WERKZEUGE = [
    'freihand',
    'linie',
    'polygon',
    'rechteck',
    'kreis',
    'dreieck',
    'radiergummi',
    'fuell',
    'pipette',
  ];
  const ALLE_WERKZEUGE = [...ZEICHEN_WERKZEUGE, 'hand', 'auswahl'];
  /** Klick auf den ersten Polygonpunkt (CSS-Pixel), skaliert mit Zoom. */
  const POLYGON_SNAP_CSS_PX = 14;
  /** Dreh-Handle an der Auswahl (CSS-Pixel, skaliert mit Zoom). */
  const DREH_HANDLE_OFFSET_CSS = 28;
  const DREH_HANDLE_RADIUS_CSS = 9;
  /** Max. Kantenlänge eingefügter Bilder (nach Zuschnitt, vor Speicherung). */
  const BILD_EINFUEGE_MAX_KANTE = 2048;
  const BILD_JPEG_QUALITAET = 0.84;
  const BILD_WEBP_QUALITAET = 0.82;

  const WERKZEUG_META = {
    freihand: { label: 'Freihand', kurz: 'Freihand', icon: 'gesture' },
    linie: { label: 'Strich', kurz: 'Strich', icon: 'diagonal_line' },
    polygon: { label: 'Polygon', kurz: 'Polygon', icon: 'pentagon' },
    rechteck: { label: 'Rechteck', kurz: 'Rechteck', icon: 'crop_square' },
    kreis: { label: 'Kreis / Ellipse', kurz: 'Kreis', icon: 'radio_button_unchecked' },
    dreieck: { label: 'Dreieck', kurz: 'Dreieck', icon: 'change_history' },
    radiergummi: { label: 'Radiergummi', kurz: 'Radierer', icon: 'ink_eraser' },
    fuell: { label: 'Füllen', kurz: 'Füllen', icon: 'format_color_fill' },
    pipette: { label: 'Pipette', kurz: 'Pipette', icon: 'colorize' },
    hand: { label: 'Hand — Ansicht verschieben', kurz: 'Hand', icon: 'pan_tool' },
    auswahl: { label: 'Auswahl-Werkzeug', kurz: 'Auswahl', icon: 'highlight_alt' },
  };

  const FUELL_FARBTOLERANZ = 44;
  /** Obergrenze gefüllter Pixel (Viewport-Bitmap); Karo zählt nicht mehr mit. */
  const MAX_FUELL_PIXEL = 2_500_000;

  function hexZuRgb(hex) {
    const h = normalisiereFarbe(hex);
    const n = parseInt(h.slice(1), 16);
    if (!Number.isFinite(n)) return [17, 24, 39, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }

  function rgbZuHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${[clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  /** @returns {boolean} ob Pixel di zum Start (zr,zg,zb,za) innerhalb der Toleranz passt */
  function fuellPixelPasstZumStart(d, di, zr, zg, zb, za, tol) {
    return (
      Math.abs(d[di] - zr) + Math.abs(d[di + 1] - zg) + Math.abs(d[di + 2] - zb) + Math.abs(d[di + 3] - za) * 0.35 <=
      tol
    );
  }

  /**
   * Flood-Fill auf ImageData (RGBA). Gibt BBox in Pixelkoordinaten zurück oder null.
   * @param {ImageData} imageData
   */
  function floodFuellAufImageData(imageData, startX, startY, fillRgb, tol, maxPx) {
    const w = imageData.width;
    const h = imageData.height;
    const d = imageData.data;
    if (startX < 0 || startY < 0 || startX >= w || startY >= h) return null;
    const si = (startY * w + startX) * 4;
    const zr = d[si];
    const zg = d[si + 1];
    const zb = d[si + 2];
    const za = d[si + 3];
    const fr = fillRgb[0];
    const fg = fillRgb[1];
    const fb = fillRgb[2];
    const fa = fillRgb[3];
    if (Math.abs(zr - fr) + Math.abs(zg - fg) + Math.abs(zb - fb) + Math.abs(za - fa) * 0.35 <= 4) {
      return null;
    }
    const stack = [[startX, startY]];
    const seen = new Uint8Array(w * h);
    let minx = startX;
    let maxx = startX;
    let miny = startY;
    let maxy = startY;
    let cnt = 0;
    while (stack.length && cnt < maxPx) {
      const p = stack.pop();
      const x = p[0];
      const y = p[1];
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const vi = y * w + x;
      if (seen[vi]) continue;
      const di = vi * 4;
      if (!fuellPixelPasstZumStart(d, di, zr, zg, zb, za, tol)) continue;
      seen[vi] = 1;
      cnt += 1;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
      d[di] = fr;
      d[di + 1] = fg;
      d[di + 2] = fb;
      d[di + 3] = fa;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    if (!cnt) return null;
    if (stack.length > 0) {
      return { zuGross: true, minx, miny, maxx, maxy, count: cnt };
    }
    return { zuGross: false, minx, miny, maxx, maxy, count: cnt };
  }

  function neueId() {
    if (window.HTBAH && typeof window.HTBAH.neueEntropieId === 'function') {
      return window.HTBAH.neueEntropieId();
    }
    return `el-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function leseSpeicherKey() {
    return window.HTBAH?.speicherKeys?.zeichenModal || SPEICHER_KEY_FALLBACK;
  }

  function ladeRoh() {
    try {
      return window.HTBAH?.speicher?.leseJson(leseSpeicherKey(), null);
    } catch {
      return null;
    }
  }

  function speichereRoh(daten) {
    try {
      return !!window.HTBAH?.speicher?.schreibeJson(leseSpeicherKey(), daten);
    } catch {
      return false;
    }
  }

  function normalisiereFarbe(farbe) {
    if (typeof farbe !== 'string') return '#111827';
    const f = farbe.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(f)) return f.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(f)) {
      const r = f[1];
      const g = f[2];
      const b = f[3];
      return ('#' + r + r + g + g + b + b).toLowerCase();
    }
    return '#111827';
  }

  function hexZuRgbaString(hex, alpha) {
    const [r, g, b] = hexZuRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function normalisiereHintergrund(roh) {
    if (roh && typeof roh === 'object' && roh.typ === 'farbe') {
      return { typ: 'farbe', farbe: normalisiereFarbe(roh.farbe) };
    }
    return { typ: 'transparent' };
  }

  function erstelleStandardEbene(name, hintergrund) {
    return {
      id: neueId(),
      name: typeof name === 'string' && name.trim() ? name.trim() : 'Ebene',
      sichtbar: true,
      hintergrund: normalisiereHintergrund(hintergrund),
      elemente: [],
    };
  }

  function normalisiereEbene(roh) {
    if (!roh || typeof roh !== 'object') return null;
    const id =
      typeof roh.id === 'string' && roh.id
        ? roh.id
        : typeof roh.i === 'string' && roh.i
          ? roh.i
          : neueId();
    const name = typeof roh.name === 'string' && roh.name.trim() ? roh.name.trim() : 'Ebene';
    return {
      id,
      name,
      sichtbar: roh.sichtbar !== false,
      hintergrund: normalisiereHintergrund(roh.hintergrund || roh.bg),
      elemente: normalisiereElementListe(roh.elemente || roh.e),
    };
  }

  function normalisiereEbenenListe(roh) {
    if (!Array.isArray(roh)) return [];
    return roh.map(normalisiereEbene).filter(Boolean);
  }

  function rundeEbenenFuerSpeicher(ebenen) {
    return ebenen.map((eb) => ({
      id: eb.id,
      name: eb.name,
      sichtbar: !!eb.sichtbar,
      hintergrund:
        eb.hintergrund && eb.hintergrund.typ === 'farbe'
          ? { typ: 'farbe', farbe: eb.hintergrund.farbe }
          : { typ: 'transparent' },
      elemente: rundeElementeFuerSpeicher(eb.elemente),
    }));
  }

  function normalisiereVerlaufSnapshot(roh) {
    if (Array.isArray(roh)) {
      const ebene = erstelleStandardEbene('Ebene 1');
      ebene.elemente = normalisiereElementListe(roh);
      return { ebenen: [ebene], aktiveEbeneId: ebene.id };
    }
    if (!roh || typeof roh !== 'object' || !Array.isArray(roh.ebenen)) return null;
    const ebenen = normalisiereEbenenListe(roh.ebenen);
    if (!ebenen.length) return null;
    const aktiveEbeneId =
      typeof roh.aktiveEbeneId === 'string' && ebenen.some((eb) => eb.id === roh.aktiveEbeneId)
        ? roh.aktiveEbeneId
        : ebenen[ebenen.length - 1].id;
    return { ebenen, aktiveEbeneId };
  }

  function rundeVerlaufSnapshotFuerSpeicher(snap) {
    if (!snap || !Array.isArray(snap.ebenen)) return null;
    return {
      ebenen: rundeEbenenFuerSpeicher(snap.ebenen),
      aktiveEbeneId: snap.aktiveEbeneId,
    };
  }

  function holeSichtbareElemente(ebenen) {
    const alle = [];
    for (const eb of ebenen) {
      if (eb.sichtbar) alle.push(...eb.elemente);
    }
    return alle;
  }

  function dupliziereEbene(quelle) {
    const nameBasis = String(quelle.name || 'Ebene').trim() || 'Ebene';
    let name = `${nameBasis} Kopie`;
    if (name.length > 40) name = name.slice(0, 40);
    const elemente = normalisiereElementListe(klone(quelle.elemente)).map((el) => ({
      ...el,
      i: neueId(),
    }));
    return {
      id: neueId(),
      name,
      sichtbar: quelle.sichtbar !== false,
      hintergrund: normalisiereHintergrund(klone(quelle.hintergrund)),
      elemente,
    };
  }

  function clampDicke(d) {
    const n = Number(d);
    if (!Number.isFinite(n)) return 3;
    return Math.max(MIN_DICKE, Math.min(MAX_DICKE, n));
  }

  function normalisiereStrichPunkte(roh) {
    const punkteRoh = Array.isArray(roh) ? roh : [];
    const p = [];
    if (punkteRoh.length && typeof punkteRoh[0] === 'object' && punkteRoh[0] !== null) {
      for (let i = 0; i < punkteRoh.length; i += 1) {
        const x = Number(punkteRoh[i].x);
        const y = Number(punkteRoh[i].y);
        if (Number.isFinite(x) && Number.isFinite(y)) p.push(x, y);
      }
    } else {
      for (let i = 0; i + 1 < punkteRoh.length; i += 2) {
        const x = Number(punkteRoh[i]);
        const y = Number(punkteRoh[i + 1]);
        if (Number.isFinite(x) && Number.isFinite(y)) p.push(x, y);
      }
    }
    return p;
  }

  function normalisiereElement(roh) {
    if (!roh || typeof roh !== 'object') return null;
    const typ = roh.t || roh.typ || (Array.isArray(roh.p) || Array.isArray(roh.punkte) ? 's' : null);
    const c = normalisiereFarbe(roh.c || roh.farbe);
    const d = clampDicke(roh.d != null ? roh.d : roh.dicke);
    const id = typeof roh.i === 'string' && roh.i ? roh.i : typeof roh.id === 'string' && roh.id ? roh.id : neueId();
    if (typ === 's') {
      const p = normalisiereStrichPunkte(roh.p != null ? roh.p : roh.punkte);
      if (!p.length) return null;
      return { i: id, t: 's', c, d, p };
    }
    if (typ === 'poly' || typ === 'polygon') {
      const p = normalisiereStrichPunkte(roh.p != null ? roh.p : roh.punkte);
      if (p.length < 6) return null;
      return { i: id, t: 'poly', c, d, p };
    }
    if (typ === 'r' || typ === 'e' || typ === 'tri') {
      const x = Number(roh.x);
      const y = Number(roh.y);
      const w = Number(roh.w);
      const h = Number(roh.h);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return null;
      }
      const rot = Number(roh.rot);
      const basis = { i: id, t: typ, c, d, x, y, w, h };
      if (Number.isFinite(rot) && rot !== 0) {
        basis.rot = rot;
      }
      return basis;
    }
    if (typ === 'm') {
      const x = Number(roh.x);
      const y = Number(roh.y);
      const w = Number(roh.w);
      const h = Number(roh.h);
      const src = typeof roh.src === 'string' ? roh.src.trim() : '';
      if (!src || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return null;
      }
      const rot = Number(roh.rot);
      const basis = { i: id, t: 'm', c: normalisiereFarbe(roh.c || '#111827'), d: 1, x, y, w, h, src };
      if (Number.isFinite(rot) && rot !== 0) {
        basis.rot = rot;
      }
      return basis;
    }
    return null;
  }

  function normalisiereElementListe(roh) {
    if (!Array.isArray(roh)) return [];
    return roh.map(normalisiereElement).filter(Boolean);
  }

  function klone(arr) {
    return JSON.parse(JSON.stringify(arr || []));
  }

  function rundeElementeFuerSpeicher(elemente) {
    return elemente.map((el) => {
      const basis = {
        i: el.i,
        t: el.t,
        c: el.c,
        d: Math.round(el.d * 100) / 100,
      };
      if (el.t === 's' || el.t === 'poly') {
        basis.p = el.p.map((v) => Math.round(v * 10) / 10);
      } else if (el.t === 'm') {
        basis.x = Math.round(el.x * 10) / 10;
        basis.y = Math.round(el.y * 10) / 10;
        basis.w = Math.round(el.w * 10) / 10;
        basis.h = Math.round(el.h * 10) / 10;
        basis.src = el.src;
        if (Number(el.rot)) {
          basis.rot = Math.round(el.rot * 10) / 10;
        }
      } else {
        basis.x = Math.round(el.x * 10) / 10;
        basis.y = Math.round(el.y * 10) / 10;
        basis.w = Math.round(el.w * 10) / 10;
        basis.h = Math.round(el.h * 10) / 10;
        if (Number(el.rot)) {
          basis.rot = Math.round(el.rot * 10) / 10;
        }
      }
      return basis;
    });
  }

  function normalisiereBox(x, y, w, h) {
    let nx = x;
    let ny = y;
    let nw = w;
    let nh = h;
    if (nw < 0) {
      nx += nw;
      nw = -nw;
    }
    if (nh < 0) {
      ny += nh;
      nh = -nh;
    }
    return { x: nx, y: ny, w: nw, h: nh };
  }

  function aabbAusPunkten(punkte, pad) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const punkt of punkte) {
      const x = punkt[0];
      const y = punkt[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX)) {
      return null;
    }
    const p = Math.max(0, pad || 0);
    return { x: minX - p, y: minY - p, w: maxX - minX + 2 * p, h: maxY - minY + 2 * p };
  }

  function formElementEcken(el) {
    const norm = normalisiereBox(el.x, el.y, el.w, el.h);
    if (el.t === 'tri') {
      const p = dreieckPunkte(el);
      return [
        [p[0], p[1]],
        [p[2], p[3]],
        [p[4], p[5]],
      ];
    }
    return [
      [norm.x, norm.y],
      [norm.x + norm.w, norm.y],
      [norm.x + norm.w, norm.y + norm.h],
      [norm.x, norm.y + norm.h],
    ];
  }

  function formElementMittelpunkt(el) {
    const norm = normalisiereBox(el.x, el.y, el.w, el.h);
    return { x: norm.x + norm.w / 2, y: norm.y + norm.h / 2 };
  }

  function boundingBox(el) {
    if (!el) return null;
    if (el.t === 's' || el.t === 'poly') {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i + 1 < el.p.length; i += 2) {
        const x = el.p[i];
        const y = el.p[i + 1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      if (!Number.isFinite(minX)) return null;
      const halb = el.d / 2;
      return {
        x: minX - halb,
        y: minY - halb,
        w: maxX - minX + el.d,
        h: maxY - minY + el.d,
      };
    }
    if (el.t === 'm' || el.t === 'r' || el.t === 'e' || el.t === 'tri') {
      const halb = el.d / 2;
      const rot = Number(el.rot) || 0;
      const ecken = formElementEcken(el);
      if (!rot) {
        return aabbAusPunkten(ecken, halb);
      }
      const mitte = formElementMittelpunkt(el);
      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotiert = ecken.map(([x, y]) => drehePunktUm(x, y, mitte.x, mitte.y, cos, sin));
      return aabbAusPunkten(rotiert, halb);
    }
    const norm = normalisiereBox(el.x, el.y, el.w, el.h);
    const halb = el.d / 2;
    return { x: norm.x - halb, y: norm.y - halb, w: norm.w + el.d, h: norm.h + el.d };
  }

  function gesamtBoundingBox(elemente) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let vorhanden = false;
    for (const el of elemente) {
      const box = boundingBox(el);
      if (!box) continue;
      vorhanden = true;
      if (box.x < minX) minX = box.x;
      if (box.y < minY) minY = box.y;
      if (box.x + box.w > maxX) maxX = box.x + box.w;
      if (box.y + box.h > maxY) maxY = box.y + box.h;
    }
    if (!vorhanden) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function distanzPunktZuStrecke(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-6) {
      const fx = px - x1;
      const fy = py - y1;
      return Math.sqrt(fx * fx + fy * fy);
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const fx = px - cx;
    const fy = py - cy;
    return Math.sqrt(fx * fx + fy * fy);
  }

  function dreieckPunkte(el) {
    const norm = normalisiereBox(el.x, el.y, el.w, el.h);
    const x1 = norm.x + norm.w / 2;
    const y1 = norm.y;
    const x2 = norm.x + norm.w;
    const y2 = norm.y + norm.h;
    const x3 = norm.x;
    const y3 = norm.y + norm.h;
    return [x1, y1, x2, y2, x3, y3];
  }

  function punktInDreieck(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
    const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
    const hatNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hatPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hatNeg && hatPos);
  }

  function punktInPolygon(px, py, p) {
    const n = p.length / 2;
    if (n < 3) return false;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
      const xi = p[i * 2];
      const yi = p[i * 2 + 1];
      const xj = p[j * 2];
      const yj = p[j * 2 + 1];
      const schneidet = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
      if (schneidet) inside = !inside;
    }
    return inside;
  }

  function hitTest(el, wx, wy, tol) {
    if (!el) return false;
    if (el.t === 's') {
      const grenze = tol + el.d / 2;
      if (el.p.length === 2) {
        const dx = wx - el.p[0];
        const dy = wy - el.p[1];
        return Math.sqrt(dx * dx + dy * dy) <= grenze;
      }
      for (let i = 0; i + 3 < el.p.length; i += 2) {
        if (distanzPunktZuStrecke(wx, wy, el.p[i], el.p[i + 1], el.p[i + 2], el.p[i + 3]) <= grenze) {
          return true;
        }
      }
      return false;
    }
    if (el.t === 'poly') {
      const p = el.p;
      const n = p.length / 2;
      if (n < 2) return false;
      const grenze = tol + el.d / 2;
      for (let i = 0; i < n; i += 1) {
        const j = (i + 1) % n;
        if (
          distanzPunktZuStrecke(wx, wy, p[i * 2], p[i * 2 + 1], p[j * 2], p[j * 2 + 1]) <= grenze
        ) {
          return true;
        }
      }
      if (n >= 3 && punktInPolygon(wx, wy, p)) return true;
      return false;
    }
    if (el.t === 'r') {
      const norm = normalisiereBox(el.x, el.y, el.w, el.h);
      return wx >= norm.x - tol && wx <= norm.x + norm.w + tol && wy >= norm.y - tol && wy <= norm.y + norm.h + tol;
    }
    if (el.t === 'e') {
      const norm = normalisiereBox(el.x, el.y, el.w, el.h);
      const rx = norm.w / 2;
      const ry = norm.h / 2;
      if (rx <= 0 || ry <= 0) return false;
      const cx = norm.x + rx;
      const cy = norm.y + ry;
      const nx = (wx - cx) / (rx + tol);
      const ny = (wy - cy) / (ry + tol);
      return nx * nx + ny * ny <= 1;
    }
    if (el.t === 'tri') {
      const pkt = dreieckPunkte(el);
      if (punktInDreieck(wx, wy, pkt[0], pkt[1], pkt[2], pkt[3], pkt[4], pkt[5])) return true;
      const grenze = tol + el.d / 2;
      if (distanzPunktZuStrecke(wx, wy, pkt[0], pkt[1], pkt[2], pkt[3]) <= grenze) return true;
      if (distanzPunktZuStrecke(wx, wy, pkt[2], pkt[3], pkt[4], pkt[5]) <= grenze) return true;
      if (distanzPunktZuStrecke(wx, wy, pkt[4], pkt[5], pkt[0], pkt[1]) <= grenze) return true;
      return false;
    }
    if (el.t === 'm') {
      const norm = normalisiereBox(el.x, el.y, el.w, el.h);
      return wx >= norm.x - tol && wx <= norm.x + norm.w + tol && wy >= norm.y - tol && wy <= norm.y + norm.h + tol;
    }
    return false;
  }

  const RADIER_EPS = 1e-4;

  function distanzPunktZuPunkt(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Teilsegmente der Strecke AB, die außerhalb der Kreisscheibe (cx,cy,R) liegen (R > 0). */
  function segmenteAusserhalbKreis(x1, y1, x2, y2, cx, cy, R) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;
    const a = dx * dx + dy * dy;
    if (a < RADIER_EPS) {
      if (distanzPunktZuPunkt(x1, y1, cx, cy) >= R - RADIER_EPS) {
        return [[x1, y1, x2, y2]];
      }
      return [];
    }
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - R * R;
    const grenzen = [0, 1];
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const w = Math.sqrt(disc);
      const t1 = (-b - w) / (2 * a);
      const t2 = (-b + w) / (2 * a);
      if (t1 > RADIER_EPS && t1 < 1 - RADIER_EPS) grenzen.push(t1);
      if (t2 > RADIER_EPS && t2 < 1 - RADIER_EPS) grenzen.push(t2);
    }
    grenzen.sort((u, v) => u - v);
    const einzig = [];
    for (const t of grenzen) {
      if (!einzig.length || Math.abs(t - einzig[einzig.length - 1]) > RADIER_EPS) einzig.push(t);
    }
    const aus = [];
    for (let i = 0; i + 1 < einzig.length; i += 1) {
      const ta = einzig[i];
      const tb = einzig[i + 1];
      if (tb - ta < RADIER_EPS) continue;
      const tm = (ta + tb) / 2;
      const mx = x1 + tm * dx;
      const my = y1 + tm * dy;
      if (distanzPunktZuPunkt(mx, my, cx, cy) >= R - RADIER_EPS) {
        const sx = x1 + ta * dx;
        const sy = y1 + ta * dy;
        const ex = x1 + tb * dx;
        const ey = y1 + tb * dy;
        aus.push([sx, sy, ex, ey]);
      }
    }
    return aus;
  }

  /** Zerlegt einen Strich in 0..n Teilstücke, die nach Entfernen der Scheibe (cx,cy,R) übrig bleiben. */
  function strichNachRadierscheibe(el, cx, cy, R, neueIdFn) {
    if (!el || el.t !== 's' || el.p.length < 2) return [];
    const rEffekt = Math.max(RADIER_EPS, R);
    const ketten = [];
    let aktuell = null;
    const epsVerbind = Math.max(0.35, rEffekt * 0.02);

    function verbinden(sx, sy, ex, ey) {
      if (!aktuell) {
        aktuell = [sx, sy, ex, ey];
        return;
      }
      const lx = aktuell[aktuell.length - 2];
      const ly = aktuell[aktuell.length - 1];
      if (distanzPunktZuPunkt(lx, ly, sx, sy) <= epsVerbind) {
        aktuell.push(ex, ey);
      } else {
        if (aktuell.length >= 4) ketten.push(aktuell);
        aktuell = [sx, sy, ex, ey];
      }
    }

    for (let i = 0; i + 3 < el.p.length; i += 2) {
      const x1 = el.p[i];
      const y1 = el.p[i + 1];
      const x2 = el.p[i + 2];
      const y2 = el.p[i + 3];
      const teile = segmenteAusserhalbKreis(x1, y1, x2, y2, cx, cy, rEffekt);
      for (const t of teile) {
        verbinden(t[0], t[1], t[2], t[3]);
      }
    }
    if (aktuell && aktuell.length >= 4) ketten.push(aktuell);

    return ketten.map((p) => ({
      i: neueIdFn(),
      t: 's',
      c: el.c,
      d: el.d,
      p,
    }));
  }

  function boxenSchneidenSich(a, b) {
    if (!a || !b) return false;
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  }

  function bewegeElement(el, dx, dy) {
    if (el.t === 's' || el.t === 'poly') {
      for (let i = 0; i + 1 < el.p.length; i += 2) {
        el.p[i] += dx;
        el.p[i + 1] += dy;
      }
    } else {
      el.x += dx;
      el.y += dy;
    }
  }

  function drehePunktUm(px, py, cx, cy, cos, sin) {
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  }

  function wendeAuswahlDrehungAufElement(el, zentrum, cos, sin, deltaGrad, orig) {
    const basis = orig || el;
    if (basis.t === 's' || basis.t === 'poly') {
      el.p = [];
      for (let i = 0; i + 1 < basis.p.length; i += 2) {
        const [nx, ny] = drehePunktUm(basis.p[i], basis.p[i + 1], zentrum.x, zentrum.y, cos, sin);
        el.p.push(nx, ny);
      }
      return;
    }
    if (orig) {
      const kopie = klone([orig])[0];
      Object.assign(el, kopie);
      el.rot = (Number(orig.rot) || 0) + deltaGrad;
      return;
    }
    el.rot = (Number(el.rot) || 0) + deltaGrad;
  }

  /** Interaktive Drehung: Snapshot-Original + Winkel-Delta gegenüber Startpointer. */
  function wendeAuswahlDrehungAusSnapshot(elemente, originals, zentrum, deltaRad) {
    const cos = Math.cos(deltaRad);
    const sin = Math.sin(deltaRad);
    const deltaGrad = (deltaRad * 180) / Math.PI;
    for (const el of elemente) {
      const orig = originals.get(el.i);
      if (!orig) {
        continue;
      }
      wendeAuswahlDrehungAufElement(el, zentrum, cos, sin, deltaGrad, orig);
    }
  }

  function skalierePunktUm(px, py, cx, cy, faktor) {
    return [cx + (px - cx) * faktor, cy + (py - cy) * faktor];
  }

  /** Nicht-Strich-Elemente per Pixelmaske radieren (destination-out), Ergebnis als Bitmap-Element. */
  function radiereNichtStrichAufPixelEbene(el, cx, cy, R, neueIdFn, zeichneElementFn) {
    const box = boundingBox(el);
    if (!box || box.w < RADIER_EPS || box.h < RADIER_EPS) {
      return [el];
    }
    const pad = Math.ceil(Math.max(RADIER_EPS, R)) + 6;
    const ox = box.x - pad;
    const oy = box.y - pad;
    const bw = Math.max(1, Math.ceil(box.w + pad * 2));
    const bh = Math.max(1, Math.ceil(box.h + pad * 2));
    const off = document.createElement('canvas');
    off.width = bw;
    off.height = bh;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return [el];
    }
    ctx.save();
    ctx.translate(-ox, -oy);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    zeichneElementFn(ctx, el);
    ctx.restore();
    const lx = cx - ox;
    const ly = cy - oy;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(RADIER_EPS, R), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const data = ctx.getImageData(0, 0, bw, bh).data;
    let sichtbar = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 12) {
        sichtbar = true;
        break;
      }
    }
    if (!sichtbar) {
      return [];
    }
    return [
      {
        i: neueIdFn(),
        t: 'm',
        c: el.c || '#111827',
        d: 1,
        x: ox,
        y: oy,
        w: bw,
        h: bh,
        src: off.toDataURL('image/png'),
        rot: Number(el.rot) || 0,
      },
    ];
  }

  function zeichenCanvasSkalierenMaxKante(inputCanvas, maxKante) {
    if (!inputCanvas || !Number.isFinite(maxKante) || maxKante <= 0) {
      return inputCanvas;
    }
    const breite = Number(inputCanvas.width) || 0;
    const hoehe = Number(inputCanvas.height) || 0;
    if (breite <= 0 || hoehe <= 0) {
      return inputCanvas;
    }
    const groessteKante = Math.max(breite, hoehe);
    if (groessteKante <= maxKante) {
      return inputCanvas;
    }
    const faktor = maxKante / groessteKante;
    const zielBreite = Math.max(1, Math.round(breite * faktor));
    const zielHoehe = Math.max(1, Math.round(hoehe * faktor));
    const canvas = document.createElement('canvas');
    canvas.width = zielBreite;
    canvas.height = zielHoehe;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return inputCanvas;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(inputCanvas, 0, 0, zielBreite, zielHoehe);
    return canvas;
  }

  function zeichenCanvasZuDataUrl(canvas) {
    if (!canvas) {
      return '';
    }
    const webpProbe = canvas.toDataURL('image/webp', BILD_WEBP_QUALITAET);
    if (webpProbe.indexOf('data:image/webp') === 0) {
      return webpProbe;
    }
    return canvas.toDataURL('image/jpeg', BILD_JPEG_QUALITAET);
  }

  function berechneBildEinfuegeBox(bildBreite, bildHoehe, ansicht, canvasBreite, canvasHoehe) {
    const s = ansicht?.scale || 1;
    const sichtbareW = canvasBreite / s;
    const sichtbareH = canvasHoehe / s;
    const ox = -((ansicht?.offsetX || 0) / s);
    const oy = -((ansicht?.offsetY || 0) / s);
    let w = Math.max(1, bildBreite);
    let h = Math.max(1, bildHoehe);
    const maxW = Math.max(32, sichtbareW * 0.75);
    const maxH = Math.max(32, sichtbareH * 0.75);
    const faktor = Math.min(1, maxW / w, maxH / h);
    w *= faktor;
    h *= faktor;
    return {
      x: ox + (sichtbareW - w) / 2,
      y: oy + (sichtbareH - h) / 2,
      w,
      h,
    };
  }

  function zeichneMitRotation(ctx, el, zeichneInner) {
    const rot = Number(el.rot) || 0;
    if (!rot) {
      zeichneInner();
      return;
    }
    const mitte = formElementMittelpunkt(el);
    if (!mitte) {
      zeichneInner();
      return;
    }
    const rcx = mitte.x;
    const rcy = mitte.y;
    ctx.save();
    ctx.translate(rcx, rcy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-rcx, -rcy);
    zeichneInner();
    ctx.restore();
  }

  window.HTBAH_KOMPONENTEN.ZeichenModal = {
    props: ['uiZustand'],
    components: {
      BildCropperModal: window.HTBAH_KOMPONENTEN.BildCropperModal,
    },
    data() {
      const initEbenen = (() => {
        const erste = erstelleStandardEbene('Ebene 1');
        return { ebenen: [erste], aktiveEbeneId: erste.id };
      })();
      return {
        ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
        farbe: '#111827',
        dicke: 4,
        werkzeug: 'freihand',
        werkzeugMenuOffen: false,
        ebenen: initEbenen.ebenen,
        aktiveEbeneId: initEbenen.aktiveEbeneId,
        gitterFarbe: STANDARD_GITTER_FARBE,
        neueEbeneFormOffen: false,
        neueEbeneName: '',
        neueEbeneHintergrundTyp: 'transparent',
        neueEbeneHintergrundFarbe: '#ffffff',
        ebeneDragIndex: null,
        ebeneDropIndex: null,
        ebeneMenuOffenId: null,
        ebenenSidebarOffen: true,
        auswahl: [],
        undoStack: [],
        redoStack: [],
        zwischenablage: [],
        ansicht: { offsetX: 0, offsetY: 0, scale: 1 },
        speichernTimer: null,
        zustandGeladen: false,
        canvasBreite: 0,
        canvasHoehe: 0,
        fokusVorModal: null,
        farbenVoreingestellt: Object.freeze([
          '#111827',
          '#737373',
          '#ffffff',
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
        ]),
        /** Karoraster in Weltkoordinaten: bei 100 % Zoom entspricht eine Kante 0,5 cm auf dem Bildschirm; läuft mit Pan und Zoom mit. */
        karopapierGitter: false,
        /** CSS-Pixel auf dem Canvas; Vorschau-Rahmen bei Freihand und Radiergummi. */
        stiftVorschauPos: null,
        drehHandleHover: false,
        WERKZEUG_META,
        ZEICHEN_WERKZEUGE,
      };
    },
    created() {
      if (!this.aktiveEbeneId && this.ebenen.length) {
        this.aktiveEbeneId = this.ebenen[0].id;
      }
      this._ctx = null;
      this._dpr = 1;
      this._resizeObserver = null;
      this._aktivePointers = null;
      this._dragModus = null;
      this._dragElement = null;
      this._dragStartWelt = null;
      this._dragLetzteWelt = null;
      this._moveOriginal = null;
      this._rotateOriginal = null;
      this._rotateZentrum = null;
      this._rotateStartWinkel = null;
      this._lassoBox = null;
      this._pinchStart = null;
      this._panMaus = null;
      this._rasterBildCache = new Map();
      /** { typ: 'linie'|'polygon', p: number[], cursor?: {x,y} } */
      this._formEntwurf = null;
    },
    computed: {
      fensterStil() {
        return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this);
      },
      vollbildIcon() {
        return this.istVollbild ? 'close_fullscreen' : 'open_in_full';
      },
      vollbildLabel() {
        return this.istVollbild ? 'Vollbild beenden' : 'Vollbild';
      },
      aktivesZeichenWerkzeug() {
        return ZEICHEN_WERKZEUGE.includes(this.werkzeug) ? this.werkzeug : 'freihand';
      },
      istFreihandModus() {
        return this.werkzeug === 'freihand';
      },
      istLinieModus() {
        return this.werkzeug === 'linie';
      },
      istPolygonModus() {
        return this.werkzeug === 'polygon';
      },
      aktivesZeichenWerkzeugMeta() {
        return WERKZEUG_META[this.aktivesZeichenWerkzeug];
      },
      istAuswahlModus() {
        return this.werkzeug === 'auswahl';
      },
      istDrehZiehen() {
        return this._dragModus === 'drehen';
      },
      istHandModus() {
        return this.werkzeug === 'hand';
      },
      istRadierModus() {
        return this.werkzeug === 'radiergummi';
      },
      hatWerkzeugVorschauRahmen() {
        return this.werkzeug === 'freihand' || this.werkzeug === 'radiergummi';
      },
      istPipetteModus() {
        return this.werkzeug === 'pipette';
      },
      istFuellModus() {
        return this.werkzeug === 'fuell';
      },
      kannUndo() {
        return this.undoStack.length > 0;
      },
      kannRedo() {
        return this.redoStack.length > 0;
      },
      kannExportieren() {
        return this.hatZeichenInhalt;
      },
      kannPasten() {
        return this.zwischenablage.length > 0;
      },
      hatAuswahl() {
        return this.auswahl.length > 0;
      },
      zoomProzent() {
        return Math.round(this.ansicht.scale * 100);
      },
      karopapierGitterIcon() {
        return this.karopapierGitter ? 'grid_on' : 'grid_off';
      },
      karopapierGitterLabel() {
        return this.karopapierGitter ? 'Karopapier ausblenden' : 'Karopapier einblenden';
      },
      auswahlSet() {
        return new Set(this.auswahl);
      },
      aktiveEbene() {
        const id = this.aktiveEbeneId;
        if (id) {
          const gefunden = this.ebenen.find((eb) => eb.id === id);
          if (gefunden) return gefunden;
        }
        return this.ebenen.length ? this.ebenen[this.ebenen.length - 1] : null;
      },
      elemente() {
        return this.aktiveEbene ? this.aktiveEbene.elemente : [];
      },
      ebenenUiListe() {
        return this.ebenen
          .map((eb, index) => ({ eb, index }))
          .slice()
          .reverse();
      },
      hatZeichenInhalt() {
        return this.ebenen.some(
          (eb) => eb.elemente.length > 0 || (eb.hintergrund && eb.hintergrund.typ === 'farbe'),
        );
      },
    },
    watch: {
      'uiZustand.zeichenModalOffen'(istOffen) {
        if (istOffen) {
          this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          this.$nextTick(() => this.wiederherstelleZeichenAusSpeicher());
          window.addEventListener('keydown', this.onTastatur);
          return;
        }
        window.removeEventListener('keydown', this.onTastatur);
        this.werkzeugMenuOffen = false;
        this.ebeneMenuOffenId = null;
        this.beendeZiehen();
        this.beendeResize();
        const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
        if (S) {
          S.beimModalSchliessen(this, 'zeichen');
        } else {
          this.bereinigeMinimiertZustand('zeichen');
        }
        this.stiftVorschauPos = null;
        this._formEntwurf = null;
        this.unbindCanvas();
        this.flushSpeichern();
        this.stelleFokusWiederHer();
      },
      farbe() {
        if (this.zustandGeladen) this.persistDebounce();
      },
      dicke() {
        if (this.zustandGeladen) this.persistDebounce();
        if (this.hatWerkzeugVorschauRahmen && this.stiftVorschauPos) this.zeichneAlles();
      },
      werkzeug(neu) {
        if (this.zustandGeladen) this.persistDebounce();
        let neuZeichnen = false;
        if (this._formEntwurf) {
          this.brichFormEntwurf(true);
          neuZeichnen = true;
        }
        if (neu !== 'freihand' && neu !== 'radiergummi') {
          if (this.stiftVorschauPos) neuZeichnen = true;
          this.stiftVorschauPos = null;
        }
        if (neu !== 'auswahl' && this.hatAuswahl) {
          this.auswahl = [];
          neuZeichnen = true;
        }
        if (neuZeichnen) this.zeichneAlles();
      },
      karopapierGitter() {
        if (this.zustandGeladen) this.persistDebounce();
        this.zeichneAlles();
      },
      gitterFarbe() {
        if (this.zustandGeladen) this.persistDebounce();
        this.zeichneAlles();
      },
      ebenenSidebarOffen() {
        if (this.zustandGeladen) this.persistDebounce();
        if (!this.ebenenSidebarOffen) {
          this.ebeneMenuOffenId = null;
          this.neueEbeneFormOffen = false;
        }
        this.$nextTick(() => this.beiCanvasGroesseGeaendert());
      },
      aktiveEbeneId() {
        if (this.zustandGeladen) this.persistDebounce();
        this.auswahl = [];
        this.zeichneAlles();
      },
      istVollbild() {
        if (this.zustandGeladen) this.persistDebounce();
        this.$nextTick(() => this.beiCanvasGroesseGeaendert());
      },
      positionX() {
        if (this.zustandGeladen) this.persistDebounce();
      },
      positionY() {
        if (this.zustandGeladen) this.persistDebounce();
      },
      breite() {
        if (this.zustandGeladen) this.persistDebounce();
        this.$nextTick(() => this.beiCanvasGroesseGeaendert());
      },
      hoehe() {
        if (this.zustandGeladen) this.persistDebounce();
        this.$nextTick(() => this.beiCanvasGroesseGeaendert());
      },
    },
    mounted() {
      window.addEventListener('resize', this.beiFensterGroesseGeaendert);
      window.addEventListener('pagehide', this.flushSpeichern);
      window.addEventListener('pointerdown', this.beiGlobalemPointerdown, true);
      this._zeichenSpeicherGeaendert = () => {
        if (!this.uiZustand?.zeichenModalOffen) return;
        this.ladeAusSpeicher();
        this.rasterBildCacheLeeren();
        this.zeichneAlles();
      };
      window.addEventListener('htbah:zeichen-speicher-geaendert', this._zeichenSpeicherGeaendert);
      window.addEventListener('htbah:app-daten-vollstaendig-geleert', this._zeichenSpeicherGeaendert);
      if (this.uiZustand.zeichenModalOffen) {
        this.$nextTick(() => this.wiederherstelleZeichenAusSpeicher());
      }
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
      window.removeEventListener('pagehide', this.flushSpeichern);
      window.removeEventListener('keydown', this.onTastatur);
      window.removeEventListener('pointerdown', this.beiGlobalemPointerdown, true);
      if (this._zeichenSpeicherGeaendert) {
        window.removeEventListener('htbah:zeichen-speicher-geaendert', this._zeichenSpeicherGeaendert);
        window.removeEventListener('htbah:app-daten-vollstaendig-geleert', this._zeichenSpeicherGeaendert);
        this._zeichenSpeicherGeaendert = null;
      }
      this.beendeZiehen();
      this.beendeResize();
      this.unbindCanvas();
      this.flushSpeichern();
    },
    methods: {
      ...window.HTBAH_MODAL_FENSTER.methoden,
      wiederherstelleZeichenAusSpeicher() {
        this.ladeAusSpeicher();
        const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
        if (S) {
          S.beimModalOeffnen('zeichen', this, {
            onSchliessen: () => this.schliessen(),
            onWiederherstellen: () => {
              this.$nextTick(() => {
                if (!this.istVollbild) {
                  this.stelleSichtbaresFensterSicher();
                }
                this.fokussiereFenster();
              });
            },
          });
          S.nachGeoeffnetAusSpeicher(this, this, {
            initialisierePosition: this.initialisierePosition,
            fokussiere: this.fokussiereFenster,
          });
        } else {
          this.bindModalSpeicher('zeichen');
          if (!this.istVollbild) {
            this.initialisierePosition();
          }
        }
        this.bindCanvas();
        if (!this.minimiert) {
          this.fokussiereFenster();
        }
      },
      schliessen() {
        this.werkzeugMenuOffen = false;
        this.flushSpeichern();
        this.beendeZiehen();
        this.beendeResize();
        const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
        if (S) {
          S.beimModalSchliessen(this, 'zeichen');
        } else {
          this.bereinigeMinimiertZustand('zeichen');
        }
        this.uiZustand.zeichenModalOffen = false;
      },
      modalMinimieren() {
        this.minimieren({
          id: 'zeichen',
          titel: 'Zeichnen',
          emoji: '✏️',
          onSchliessen: () => this.schliessen(),
          onWiederherstellen: () => {
            this.$nextTick(() => {
              this.stelleSichtbaresFensterSicher();
              this.fokussiereFenster();
            });
          },
        });
      },
      onFensterEscape() {
        if (this.werkzeugMenuOffen) {
          this.werkzeugMenuOffen = false;
          return;
        }
        if (this._formEntwurf) {
          this.brichFormEntwurf(true);
          return;
        }
        if (this.hatAuswahl) {
          this.auswahl = [];
          this.zeichneAlles();
          return;
        }
        this.schliessen();
      },
      fokussiereFenster() {
        const fenster = this.$refs.fensterElement;
        if (fenster && typeof fenster.focus === 'function') {
          fenster.focus();
        }
      },
      stelleFokusWiederHer() {
        if (this.fokusVorModal && this.fokusVorModal.isConnected) {
          this.fokusVorModal.focus();
        }
        this.fokusVorModal = null;
      },
      beiGlobalemPointerdown(event) {
        if (this.werkzeugMenuOffen) {
          const menu = this.$refs.werkzeugMenu;
          const toggle = this.$refs.werkzeugToggle;
          if (!menu || !toggle || (!menu.contains(event.target) && !toggle.contains(event.target))) {
            this.werkzeugMenuOffen = false;
          }
        }
        if (this.ebeneMenuOffenId && !(event.target instanceof Element && event.target.closest('.htbah-zeichen-ebene-menu-wrap'))) {
          this.ebeneMenuOffenId = null;
        }
        if (!this.uiZustand?.zeichenModalOffen || !this._formEntwurf) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (this.istZoomSteuerungZiel(event.target)) return;
        if (this.zeichenflaecheEnthaeltZiel(event.target)) return;
        if (this._formEntwurf.typ === 'linie') {
          this.brichFormEntwurf();
          return;
        }
        if (this._formEntwurf.typ === 'polygon') {
          if (this._formEntwurf.p.length >= 6) {
            this.polygonEntwurfAbschliessen();
          } else {
            this.brichFormEntwurf();
          }
        }
      },
      zeichenflaecheEnthaeltZiel(ziel) {
        const canvas = this.$refs.canvas;
        return !!(canvas && ziel instanceof Node && canvas.contains(ziel));
      },
      istZoomSteuerungZiel(ziel) {
        if (!(ziel instanceof Element)) return false;
        return !!ziel.closest(
          '[aria-label="Verkleinern"], [aria-label="Vergrößern"], [aria-label="Ansicht zurücksetzen"]',
        );
      },
      polygonSnapRadiusWelt() {
        const s = this.ansicht.scale || 1;
        return Math.max(6, POLYGON_SNAP_CSS_PX / s);
      },
      nahePolygonStart(wx, wy) {
        const ent = this._formEntwurf;
        if (!ent || ent.typ !== 'polygon' || ent.p.length < 6) return false;
        const dx = wx - ent.p[0];
        const dy = wy - ent.p[1];
        return Math.sqrt(dx * dx + dy * dy) <= this.polygonSnapRadiusWelt();
      },
      brichFormEntwurf() {
        if (!this._formEntwurf) return;
        this._formEntwurf = null;
        this.zeichneAlles();
      },
      polygonEntwurfAbschliessen() {
        const ent = this._formEntwurf;
        if (!ent || ent.typ !== 'polygon' || ent.p.length < 6) {
          this.brichFormEntwurf();
          return;
        }
        this.verlaufSchnappschuss();
        this.elemente.push({
          i: neueId(),
          t: 'poly',
          c: this.farbe,
          d: this.dicke,
          p: ent.p.slice(),
        });
        this._formEntwurf = null;
        this.zeichneAlles();
        this.persistDebounce();
      },
      linieEntwurfSetzen(welt) {
        if (!this._formEntwurf || this._formEntwurf.typ !== 'linie') return;
        const p = this._formEntwurf.p;
        const x1 = p[0];
        const y1 = p[1];
        const x2 = welt.x;
        const y2 = welt.y;
        if (Math.abs(x2 - x1) < 0.5 / (this.ansicht.scale || 1) && Math.abs(y2 - y1) < 0.5 / (this.ansicht.scale || 1)) {
          this.brichFormEntwurf();
          return;
        }
        this.verlaufSchnappschuss();
        this.elemente.push({
          i: neueId(),
          t: 's',
          c: this.farbe,
          d: this.dicke,
          p: [x1, y1, x2, y2],
        });
        this._formEntwurf = null;
        this.zeichneAlles();
        this.persistDebounce();
      },
      onLiniePointerDown(welt) {
        if (!this._formEntwurf) {
          this._formEntwurf = { typ: 'linie', p: [welt.x, welt.y], cursor: { x: welt.x, y: welt.y } };
          this.zeichneAlles();
          return;
        }
        this.linieEntwurfSetzen(welt);
      },
      onPolygonPointerDown(welt) {
        if (!this._formEntwurf) {
          this._formEntwurf = { typ: 'polygon', p: [welt.x, welt.y], cursor: { x: welt.x, y: welt.y } };
          this.zeichneAlles();
          return;
        }
        if (this.nahePolygonStart(welt.x, welt.y)) {
          this.polygonEntwurfAbschliessen();
          return;
        }
        this._formEntwurf.p.push(welt.x, welt.y);
        this._formEntwurf.cursor = { x: welt.x, y: welt.y };
        this.zeichneAlles();
      },
      werkzeugSetzen(werkzeug) {
        if (!ALLE_WERKZEUGE.includes(werkzeug)) return;
        this.werkzeug = werkzeug;
        this.werkzeugMenuOffen = false;
      },
      werkzeugAusMenu(werkzeug) {
        this.werkzeugSetzen(werkzeug);
      },
      werkzeugMenuToggle() {
        this.werkzeugMenuOffen = !this.werkzeugMenuOffen;
      },
      ladeAusSpeicher() {
        const z = ladeRoh();
        if (!z || typeof z !== 'object') {
          const ebene = erstelleStandardEbene('Ebene 1');
          this.ebenen = [ebene];
          this.aktiveEbeneId = ebene.id;
          this.auswahl = [];
          this.undoStack = [];
          this.redoStack = [];
          this.zwischenablage = [];
          if (this.breite == null) this.breite = STANDARD_BREITE;
          if (this.hoehe == null) this.hoehe = STANDARD_HOEHE;
          this.zustandGeladen = true;
          return;
        }
        if (z && typeof z === 'object') {
          if (z.fenster && typeof z.fenster === 'object') {
            const f = z.fenster;
            const br = Number(f.breite);
            const ho = Number(f.hoehe);
            if (Number.isFinite(br) && Number.isFinite(ho) && br > 0 && ho > 0) {
              const g = window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(br, ho, 360, 320);
              this.breite = g.breite;
              this.hoehe = g.hoehe;
            }
            const px = Number(f.positionX);
            const py = Number(f.positionY);
            if (Number.isFinite(px) && Number.isFinite(py) && this.breite != null && this.hoehe != null) {
              const p = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(px, py, this.breite, this.hoehe);
              this.positionX = p.x;
              this.positionY = p.y;
            }
            this.istVollbild = !!f.istVollbild;
          }
          if (z.einstellungen && typeof z.einstellungen === 'object') {
            this.farbe = normalisiereFarbe(z.einstellungen.farbe);
            const d = Number(z.einstellungen.dicke);
            if (Number.isFinite(d)) this.dicke = clampDicke(d);
            let gespeichertesWerkzeug = z.einstellungen.werkzeug;
            if (gespeichertesWerkzeug === 'strich') gespeichertesWerkzeug = 'freihand';
            if (ALLE_WERKZEUGE.includes(gespeichertesWerkzeug)) {
              this.werkzeug = gespeichertesWerkzeug;
            }
            if (typeof z.einstellungen.karopapierGitter === 'boolean') {
              this.karopapierGitter = z.einstellungen.karopapierGitter;
            }
            if (typeof z.einstellungen.gitterFarbe === 'string') {
              this.gitterFarbe = normalisiereFarbe(z.einstellungen.gitterFarbe);
            }
            if (typeof z.einstellungen.ebenenSidebarOffen === 'boolean') {
              this.ebenenSidebarOffen = z.einstellungen.ebenenSidebarOffen;
            }
          }
          if (z.ansicht && typeof z.ansicht === 'object') {
            const sc = Number(z.ansicht.scale);
            const ox = Number(z.ansicht.offsetX);
            const oy = Number(z.ansicht.offsetY);
            this.ansicht.scale = Number.isFinite(sc) ? Math.max(MIN_SCALE, Math.min(MAX_SCALE, sc)) : 1;
            this.ansicht.offsetX = Number.isFinite(ox) ? ox : 0;
            this.ansicht.offsetY = Number.isFinite(oy) ? oy : 0;
          }
          if (Array.isArray(z.ebenen) && z.ebenen.length) {
            this.ebenen = normalisiereEbenenListe(z.ebenen);
            const gespeicherteAktive =
              typeof z.aktiveEbeneId === 'string' ? z.aktiveEbeneId : null;
            this.aktiveEbeneId =
              gespeicherteAktive && this.ebenen.some((eb) => eb.id === gespeicherteAktive)
                ? gespeicherteAktive
                : this.ebenen[this.ebenen.length - 1].id;
          } else if (Array.isArray(z.elemente)) {
            const ebene = erstelleStandardEbene('Ebene 1');
            ebene.elemente = normalisiereElementListe(z.elemente);
            this.ebenen = [ebene];
            this.aktiveEbeneId = ebene.id;
          } else if (Array.isArray(z.strokes)) {
            const ebene = erstelleStandardEbene('Ebene 1');
            ebene.elemente = normalisiereElementListe(
              z.strokes.map((s) => ({ ...s, t: 's' })),
            );
            this.ebenen = [ebene];
            this.aktiveEbeneId = ebene.id;
          } else {
            const ebene = erstelleStandardEbene('Ebene 1');
            this.ebenen = [ebene];
            this.aktiveEbeneId = ebene.id;
          }
          this.undoStack = Array.isArray(z.undoStack)
            ? z.undoStack.map(normalisiereVerlaufSnapshot).filter(Boolean)
            : [];
          this.redoStack = Array.isArray(z.redoStack)
            ? z.redoStack.map(normalisiereVerlaufSnapshot).filter(Boolean)
            : [];
          this.zwischenablage = Array.isArray(z.zwischenablage) ? normalisiereElementListe(z.zwischenablage) : [];
        }
        if (this.breite == null) this.breite = STANDARD_BREITE;
        if (this.hoehe == null) this.hoehe = STANDARD_HOEHE;
        if (!this.aktiveEbeneId && this.ebenen.length) {
          this.aktiveEbeneId = this.ebenen[this.ebenen.length - 1].id;
        }
        this.auswahl = [];
        this.zustandGeladen = true;
      },
      persistDebounce() {
        if (this.speichernTimer) {
          window.clearTimeout(this.speichernTimer);
        }
        this.speichernTimer = window.setTimeout(() => {
          this.flushSpeichern();
        }, SPEICHER_DEBOUNCE_MS);
      },
      flushSpeichern() {
        if (this.speichernTimer) {
          window.clearTimeout(this.speichernTimer);
          this.speichernTimer = null;
        }
        if (!this.zustandGeladen) return;
        const daten = {
          fenster: {
            positionX: this.positionX,
            positionY: this.positionY,
            breite: this.breite,
            hoehe: this.hoehe,
            istVollbild: !!this.istVollbild,
          },
          einstellungen: {
            farbe: this.farbe,
            dicke: this.dicke,
            werkzeug: this.werkzeug,
            karopapierGitter: !!this.karopapierGitter,
            gitterFarbe: this.gitterFarbe,
            ebenenSidebarOffen: !!this.ebenenSidebarOffen,
          },
          ansicht: { ...this.ansicht },
          ebenen: rundeEbenenFuerSpeicher(this.ebenen),
          aktiveEbeneId: this.aktiveEbeneId,
          undoStack: this.undoStack.map(rundeVerlaufSnapshotFuerSpeicher).filter(Boolean),
          redoStack: this.redoStack.map(rundeVerlaufSnapshotFuerSpeicher).filter(Boolean),
          zwischenablage: rundeElementeFuerSpeicher(this.zwischenablage),
        };
        if (!speichereRoh(daten)) {
          const ohneHistory = { ...daten, undoStack: [], redoStack: [] };
          speichereRoh(ohneHistory);
        }
      },
      erstelleZustandSnapshot() {
        return {
          ebenen: klone(this.ebenen),
          aktiveEbeneId: this.aktiveEbeneId,
        };
      },
      wendeZustandSnapshot(snap) {
        if (!snap || !Array.isArray(snap.ebenen)) return;
        this.ebenen = klone(snap.ebenen);
        this.aktiveEbeneId =
          typeof snap.aktiveEbeneId === 'string' && this.ebenen.some((eb) => eb.id === snap.aktiveEbeneId)
            ? snap.aktiveEbeneId
            : this.ebenen[this.ebenen.length - 1]?.id || null;
        this.auswahl = this.auswahl.filter((id) =>
          this.elemente.some((el) => el.i === id),
        );
      },
      verlaufSchnappschuss() {
        this.undoStack.push(this.erstelleZustandSnapshot());
        while (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
        this.redoStack = [];
      },
      undo() {
        this.rasterBildCacheLeeren();
        if (!this.kannUndo) return;
        this.redoStack.push(this.erstelleZustandSnapshot());
        while (this.redoStack.length > MAX_HISTORY) this.redoStack.shift();
        const snap = this.undoStack.pop();
        this.wendeZustandSnapshot(snap);
        this.zeichneAlles();
        this.persistDebounce();
      },
      redo() {
        this.rasterBildCacheLeeren();
        if (!this.kannRedo) return;
        this.undoStack.push(this.erstelleZustandSnapshot());
        while (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
        const snap = this.redoStack.pop();
        this.wendeZustandSnapshot(snap);
        this.zeichneAlles();
        this.persistDebounce();
      },
      bindCanvas() {
        const canvas = this.$refs.canvas;
        if (!canvas) return;
        this._ctx = canvas.getContext('2d', { willReadFrequently: true });
        this._aktivePointers = new Map();
        canvas.addEventListener('pointerdown', this.onPointerDown);
        canvas.addEventListener('pointermove', this.onPointerMove);
        canvas.addEventListener('pointerup', this.onPointerUp);
        canvas.addEventListener('pointercancel', this.onPointerUp);
        canvas.addEventListener('pointerleave', this.onPointerLeave);
        canvas.addEventListener('wheel', this.onWheel, { passive: false });
        canvas.addEventListener('contextmenu', this.onContextMenu);
        const host = this.$refs.canvasHost;
        if (host && typeof ResizeObserver !== 'undefined') {
          this._resizeObserver = new ResizeObserver(() => this.beiCanvasGroesseGeaendert());
          this._resizeObserver.observe(host);
        }
        this.beiCanvasGroesseGeaendert();
      },
      unbindCanvas() {
        const canvas = this.$refs.canvas;
        if (canvas) {
          canvas.removeEventListener('pointerdown', this.onPointerDown);
          canvas.removeEventListener('pointermove', this.onPointerMove);
          canvas.removeEventListener('pointerup', this.onPointerUp);
          canvas.removeEventListener('pointercancel', this.onPointerUp);
          canvas.removeEventListener('pointerleave', this.onPointerLeave);
          canvas.removeEventListener('wheel', this.onWheel);
          canvas.removeEventListener('contextmenu', this.onContextMenu);
        }
        if (this._resizeObserver) {
          this._resizeObserver.disconnect();
          this._resizeObserver = null;
        }
        this._aktivePointers = null;
        this._dragModus = null;
        this._dragElement = null;
        this._dragStartWelt = null;
        this._dragLetzteWelt = null;
        this._moveOriginal = null;
        this._rotateOriginal = null;
        this._rotateZentrum = null;
        this._rotateStartWinkel = null;
        this._lassoBox = null;
        this._pinchStart = null;
        this._panMaus = null;
        this._ctx = null;
        this.stiftVorschauPos = null;
        this.drehHandleHover = false;
        this._formEntwurf = null;
        this.rasterBildCacheLeeren();
      },
      beiCanvasGroesseGeaendert() {
        const canvas = this.$refs.canvas;
        const host = this.$refs.canvasHost;
        if (!canvas || !host) return;
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        const breite = Math.max(1, Math.floor(host.clientWidth));
        const hoehe = Math.max(1, Math.floor(host.clientHeight));
        this.canvasBreite = breite;
        this.canvasHoehe = hoehe;
        canvas.style.width = breite + 'px';
        canvas.style.height = hoehe + 'px';
        canvas.width = Math.round(breite * dpr);
        canvas.height = Math.round(hoehe * dpr);
        this._dpr = dpr;
        this.zeichneAlles();
      },
      onContextMenu(event) {
        event.preventDefault();
      },
      onTastatur(event) {
        if (!this.uiZustand.zeichenModalOffen) return;
        const fenster = this.$refs.fensterElement;
        const aktiv = document.activeElement;
        const istImFenster = !!fenster && (aktiv === fenster || (aktiv instanceof Node && fenster.contains(aktiv)));
        if (!istImFenster) return;
        const ziel = event.target;
        const istEingabe = ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.tagName === 'SELECT');
        if (event.key === 'Escape' && !istEingabe) {
          event.preventDefault();
          this.onFensterEscape();
          return;
        }
        if (istEingabe) return;
        const mod = event.ctrlKey || event.metaKey;
        if (mod) {
          const taste = event.key.toLowerCase();
          if (taste === 'z' && !event.shiftKey) {
            event.preventDefault();
            this.undo();
            return;
          }
          if ((taste === 'z' && event.shiftKey) || taste === 'y') {
            event.preventDefault();
            this.redo();
            return;
          }
          if (taste === 'a') {
            event.preventDefault();
            this.alleAuswaehlen();
            return;
          }
          if (taste === 'c') {
            event.preventDefault();
            this.kopiereAuswahl();
            return;
          }
          if (taste === 'x') {
            event.preventDefault();
            this.schneideAuswahl();
            return;
          }
          if (taste === 'v') {
            event.preventDefault();
            this.fuegeEin();
            return;
          }
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (!this.hatAuswahl) return;
          event.preventDefault();
          this.loescheAuswahl();
        }
      },
      canvasZuWelt(cx, cy) {
        return {
          x: (cx - this.ansicht.offsetX) / this.ansicht.scale,
          y: (cy - this.ansicht.offsetY) / this.ansicht.scale,
        };
      },
      pointerKoordinate(event) {
        const canvas = this.$refs.canvas;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      },
      onPointerDown(event) {
        const canvas = this.$refs.canvas;
        if (!canvas) return;
        if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) {
          return;
        }
        canvas.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        this.werkzeugMenuOffen = false;
        const pos = this.pointerKoordinate(event);
        this._aktivePointers.set(event.pointerId, { x: pos.x, y: pos.y });

        if (this._aktivePointers.size >= 2) {
          this.brichDragAb();
          this.startePinch();
          return;
        }

        const istPanMaus = event.pointerType === 'mouse' && (event.button === 1 || event.altKey || event.metaKey || (event.ctrlKey && this.werkzeug !== 'auswahl'));
        if (istPanMaus) {
          this._dragModus = 'pan';
          this._panMaus = { start: pos, ansichtStart: { ...this.ansicht } };
          return;
        }

        if (this.werkzeug === 'hand') {
          if (event.button === 0 || event.pointerType === 'touch' || event.pointerType === 'pen') {
            this._dragModus = 'pan';
            this._panMaus = { start: pos, ansichtStart: { ...this.ansicht } };
            return;
          }
        }

        const welt = this.canvasZuWelt(pos.x, pos.y);
        this._dragStartWelt = welt;
        this._dragLetzteWelt = welt;

        if (this.werkzeug === 'pipette') {
          this.pipetteFarbeAnCss(pos.x, pos.y);
          return;
        }
        if (this.werkzeug === 'fuell') {
          void this.fuellAnWelpunkt(welt.x, welt.y).catch(() => {});
          return;
        }

        if (this.werkzeug === 'auswahl') {
          if (this.hatAuswahl && this.trifftDrehHandle(welt.x, welt.y)) {
            this.starteDrehen(welt);
            this.zeichneAlles();
            return;
          }
          const trefferId = this.findeElementUnterPunkt(welt.x, welt.y);
          if (trefferId) {
            if (event.shiftKey) {
              this.toggleAuswahl(trefferId);
            } else if (!this.auswahlSet.has(trefferId)) {
              this.auswahl = [trefferId];
            }
            if (this.auswahl.length) {
              this.starteVerschieben();
            }
            this.zeichneAlles();
          } else {
            if (!event.shiftKey) {
              this.auswahl = [];
            }
            this._dragModus = 'lasso';
            this._lassoBox = { x: welt.x, y: welt.y, w: 0, h: 0 };
            this.zeichneAlles();
          }
          return;
        }

        if (this.werkzeug === 'radiergummi') {
          this.verlaufSchnappschuss();
          this._dragModus = 'radier';
          this.radiereAmPunkt(welt.x, welt.y);
          this.zeichneAlles();
          return;
        }

        if (this.werkzeug === 'linie') {
          this.onLiniePointerDown(welt);
          return;
        }
        if (this.werkzeug === 'polygon') {
          this.onPolygonPointerDown(welt);
          return;
        }

        this.verlaufSchnappschuss();
        const neu = this.erzeugeElementFuerWerkzeug(welt);
        if (!neu) return;
        this.elemente.push(neu);
        this._dragElement = neu;
        this._dragModus = 'zeichnen';
        this.zeichneAlles();
      },
      onPointerMove(event) {
        const canvas = this.$refs.canvas;
        if (!canvas) return;
        const pos = this.pointerKoordinate(event);
        if (this.werkzeug === 'auswahl' && this.hatAuswahl && this._dragModus !== 'drehen') {
          const weltHover = this.canvasZuWelt(pos.x, pos.y);
          this.drehHandleHover = this.trifftDrehHandle(weltHover.x, weltHover.y);
        } else if (this.drehHandleHover) {
          this.drehHandleHover = false;
        }
        if (this.hatWerkzeugVorschauRahmen) {
          this.stiftVorschauPos = { x: pos.x, y: pos.y };
        } else {
          this.stiftVorschauPos = null;
        }
        if (this._formEntwurf) {
          const weltVorschau = this.canvasZuWelt(pos.x, pos.y);
          this._formEntwurf.cursor = { x: weltVorschau.x, y: weltVorschau.y };
          this.zeichneAlles();
        }

        if (!this._aktivePointers) return;
        if (!this._aktivePointers.has(event.pointerId)) {
          if (this.hatWerkzeugVorschauRahmen) this.zeichneAlles();
          return;
        }
        const eintrag = this._aktivePointers.get(event.pointerId);
        eintrag.x = pos.x;
        eintrag.y = pos.y;

        if (this._aktivePointers.size >= 2) {
          this.aktualisierePinch();
          return;
        }
        if (this._dragModus === 'pan') {
          const dx = pos.x - this._panMaus.start.x;
          const dy = pos.y - this._panMaus.start.y;
          this.ansicht.offsetX = this._panMaus.ansichtStart.offsetX + dx;
          this.ansicht.offsetY = this._panMaus.ansichtStart.offsetY + dy;
          this.zeichneAlles();
          return;
        }
        const welt = this.canvasZuWelt(pos.x, pos.y);
        this._dragLetzteWelt = welt;
        if (this._dragModus === 'radier') {
          this.radiereStrecke(this._dragStartWelt, welt);
          this._dragStartWelt = welt;
          this.zeichneAlles();
          return;
        }
        if (this._dragModus === 'drehen') {
          this.aktualisiereDrehen(welt);
          return;
        }
        if (this._dragModus === 'zeichnen') {
          this.aktualisiereZeichnung(welt);
          return;
        }
        if (this._dragModus === 'verschieben') {
          this.aktualisiereVerschieben(welt);
          return;
        }
        if (this._dragModus === 'lasso') {
          const sx = this._dragStartWelt.x;
          const sy = this._dragStartWelt.y;
          this._lassoBox = normalisiereBox(sx, sy, welt.x - sx, welt.y - sy);
          this.zeichneAlles();
        }
      },
      onPointerUp(event) {
        if (!this._aktivePointers) return;
        this._aktivePointers.delete(event.pointerId);
        const canvas = this.$refs.canvas;
        canvas?.releasePointerCapture?.(event.pointerId);
        if (this._aktivePointers.size < 2 && this._pinchStart) {
          this._pinchStart = null;
        }
        if (this._aktivePointers.size !== 0) return;

        if (this._dragModus === 'pan') {
          this._panMaus = null;
          this._dragModus = null;
          this.persistDebounce();
          return;
        }
        if (this._dragModus === 'zeichnen') {
          this.finalisiereZeichnung();
          this._dragElement = null;
          this._dragModus = null;
          this.persistDebounce();
          return;
        }
        if (this._dragModus === 'radier') {
          this._dragModus = null;
          this.persistDebounce();
          return;
        }
        if (this._dragModus === 'drehen') {
          this._rotateOriginal = null;
          this._rotateZentrum = null;
          this._rotateStartWinkel = null;
          this._dragModus = null;
          this.rasterBildCacheLeeren();
          this.persistDebounce();
          return;
        }
        if (this._dragModus === 'verschieben') {
          this._moveOriginal = null;
          this._dragModus = null;
          this.persistDebounce();
          return;
        }
        if (this._dragModus === 'lasso') {
          this.finalisiereLasso(event.shiftKey);
          this._lassoBox = null;
          this._dragModus = null;
          this.zeichneAlles();
          this.persistDebounce();
        }
      },
      onPointerLeave(event) {
        if (this._aktivePointers && this._aktivePointers.has(event.pointerId)) {
          this.onPointerUp(event);
          return;
        }
        if (this.hatWerkzeugVorschauRahmen && this.stiftVorschauPos) {
          this.stiftVorschauPos = null;
          this.zeichneAlles();
        }
        if (this.drehHandleHover) {
          this.drehHandleHover = false;
        }
      },
      onWheel(event) {
        const handZoom = this.werkzeug === 'hand' && !event.shiftKey;
        if (event.ctrlKey || event.metaKey || handZoom) {
          event.preventDefault();
          const pos = this.pointerKoordinate(event);
          const richtung = event.deltaY < 0 ? 1 : -1;
          const faktor = Math.pow(1.15, richtung);
          this.zoomeAnPunkt(pos.x, pos.y, faktor);
          this.persistDebounce();
          return;
        }
        if (event.shiftKey) {
          event.preventDefault();
          const nutzeX = Math.abs(event.deltaX) > Math.abs(event.deltaY);
          let d = nutzeX ? event.deltaX : event.deltaY;
          if (event.deltaMode === 1) d *= 16;
          else if (event.deltaMode === 2) d *= this.canvasBreite || 800;
          this.ansicht.offsetX -= d;
          this.zeichneAlles();
          this.persistDebounce();
        }
      },
      brichDragAb() {
        if (this._dragModus === 'zeichnen') {
          if (this._dragElement) {
            const idx = this.elemente.indexOf(this._dragElement);
            if (idx >= 0) this.elemente.splice(idx, 1);
            this.undoStack.pop();
          }
        } else if (this._dragModus === 'radier') {
          if (this.undoStack.length) {
            this.wendeZustandSnapshot(this.undoStack.pop());
            this.zeichneAlles();
          }
        } else if (this._dragModus === 'verschieben') {
          if (this._moveOriginal && this.undoStack.length) {
            this.wendeZustandSnapshot(this.undoStack.pop());
            this.zeichneAlles();
          }
        } else if (this._dragModus === 'drehen') {
          if (this._rotateOriginal && this.undoStack.length) {
            this.wendeZustandSnapshot(this.undoStack.pop());
            this.zeichneAlles();
          }
        }
        this._dragElement = null;
        this._moveOriginal = null;
        this._rotateOriginal = null;
        this._rotateZentrum = null;
        this._rotateStartWinkel = null;
        this._lassoBox = null;
        this._dragModus = null;
      },
      erzeugeElementFuerWerkzeug(welt) {
        if (this.werkzeug === 'pipette' || this.werkzeug === 'fuell') return null;
        const basis = { i: neueId(), c: this.farbe, d: this.dicke };
        if (this.werkzeug === 'freihand') {
          return { ...basis, t: 's', p: [welt.x, welt.y] };
        }
        if (this.werkzeug === 'linie' || this.werkzeug === 'polygon') {
          return null;
        }
        if (this.werkzeug === 'rechteck') {
          return { ...basis, t: 'r', x: welt.x, y: welt.y, w: 0, h: 0 };
        }
        if (this.werkzeug === 'kreis') {
          return { ...basis, t: 'e', x: welt.x, y: welt.y, w: 0, h: 0 };
        }
        if (this.werkzeug === 'dreieck') {
          return { ...basis, t: 'tri', x: welt.x, y: welt.y, w: 0, h: 0 };
        }
        return null;
      },
      radiereAmPunkt(wx, wy) {
        const halbRadier = this.dicke / 2;
        const neu = [];
        for (const el of this.elemente) {
          if (el.t === 's') {
            const rEffekt = halbRadier + el.d / 2;
            const teile = strichNachRadierscheibe(el, wx, wy, rEffekt, neueId);
            for (const t of teile) {
              if (t.p && t.p.length >= 2) neu.push(t);
            }
          } else if (hitTest(el, wx, wy, halbRadier)) {
            const teile = radiereNichtStrichAufPixelEbene(el, wx, wy, halbRadier, neueId, (ctx, e) =>
              this.zeichneElement(ctx, e),
            );
            neu.push(...teile);
          } else {
            neu.push(el);
          }
        }
        this.elemente = neu;
        this.rasterBildCacheLeeren();
      },
      auswahlZentrum() {
        const ausw = this.auswahlSet;
        const box = gesamtBoundingBox(this.elemente.filter((el) => ausw.has(el.i)));
        if (!box) {
          return null;
        }
        return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
      },
      drehHandleMetrik() {
        const skala = this.ansicht.scale || 1;
        return {
          offset: DREH_HANDLE_OFFSET_CSS / skala,
          radius: DREH_HANDLE_RADIUS_CSS / skala,
          pad: 4 / skala,
        };
      },
      drehHandleWeltPosition() {
        const box = gesamtBoundingBox(this.elemente.filter((el) => this.auswahlSet.has(el.i)));
        if (!box) {
          return null;
        }
        const m = this.drehHandleMetrik();
        const mitteX = box.x + box.w / 2;
        return {
          x: mitteX,
          y: box.y - m.pad - m.offset,
          ankrepx: mitteX,
          ankrepy: box.y - m.pad,
        };
      },
      trifftDrehHandle(wx, wy) {
        if (!this.hatAuswahl || this.werkzeug !== 'auswahl') {
          return false;
        }
        const pos = this.drehHandleWeltPosition();
        if (!pos) {
          return false;
        }
        const m = this.drehHandleMetrik();
        const dx = wx - pos.x;
        const dy = wy - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= m.radius * 1.4;
      },
      dreheAuswahl(grad) {
        if (!this.hatAuswahl || !grad) {
          return;
        }
        const z = this.auswahlZentrum();
        if (!z) {
          return;
        }
        this.verlaufSchnappschuss();
        const rad = (grad * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const ausw = this.auswahlSet;
        for (const el of this.elemente) {
          if (!ausw.has(el.i)) {
            continue;
          }
          wendeAuswahlDrehungAufElement(el, z, cos, sin, grad, klone([el])[0]);
        }
        this.zeichneAlles();
        this.rasterBildCacheLeeren();
        this.persistDebounce();
      },
      skaliereAuswahl(faktor) {
        if (!this.hatAuswahl || !Number.isFinite(faktor) || faktor <= 0) {
          return;
        }
        const z = this.auswahlZentrum();
        if (!z) {
          return;
        }
        this.verlaufSchnappschuss();
        const ausw = this.auswahlSet;
        for (const el of this.elemente) {
          if (!ausw.has(el.i)) {
            continue;
          }
          if (el.t === 's' || el.t === 'poly') {
            for (let i = 0; i + 1 < el.p.length; i += 2) {
              const [nx, ny] = skalierePunktUm(el.p[i], el.p[i + 1], z.x, z.y, faktor);
              el.p[i] = nx;
              el.p[i + 1] = ny;
            }
          } else {
            const norm = normalisiereBox(el.x, el.y, el.w, el.h);
            const ncx = norm.x + norm.w / 2;
            const ncy = norm.y + norm.h / 2;
            const nw = Math.max(0.5, norm.w * faktor);
            const nh = Math.max(0.5, norm.h * faktor);
            el.x = ncx - nw / 2;
            el.y = ncy - nh / 2;
            el.w = nw;
            el.h = nh;
          }
        }
        this.zeichneAlles();
        this.rasterBildCacheLeeren();
        this.persistDebounce();
      },
      radiereStrecke(von, nach) {
        const dx = nach.x - von.x;
        const dy = nach.y - von.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const schritt = Math.max(0.5, this.dicke * 0.4);
        const n = Math.max(1, Math.ceil(dist / schritt));
        for (let i = 0; i <= n; i += 1) {
          const t = i / n;
          this.radiereAmPunkt(von.x + t * dx, von.y + t * dy);
        }
      },
      aktualisiereZeichnung(welt) {
        const el = this._dragElement;
        if (!el) return;
        if (el.t === 's') {
          const letzteX = el.p[el.p.length - 2];
          const letzteY = el.p[el.p.length - 1];
          const dx = welt.x - letzteX;
          const dy = welt.y - letzteY;
          if (Math.sqrt(dx * dx + dy * dy) < 0.5 / this.ansicht.scale) return;
          el.p.push(welt.x, welt.y);
          this.zeichneAlles();
          return;
        }
        el.w = welt.x - el.x;
        el.h = welt.y - el.y;
        this.zeichneAlles();
      },
      finalisiereZeichnung() {
        const el = this._dragElement;
        if (!el) return;
        if (el.t === 's') {
          if (el.p.length < 2) {
            const idx = this.elemente.indexOf(el);
            if (idx >= 0) this.elemente.splice(idx, 1);
            this.undoStack.pop();
            this.zeichneAlles();
          }
          return;
        }
        if (Math.abs(el.w) < 1 && Math.abs(el.h) < 1) {
          const idx = this.elemente.indexOf(el);
          if (idx >= 0) this.elemente.splice(idx, 1);
          this.undoStack.pop();
          this.zeichneAlles();
          return;
        }
        const norm = normalisiereBox(el.x, el.y, el.w, el.h);
        el.x = norm.x;
        el.y = norm.y;
        el.w = norm.w;
        el.h = norm.h;
        this.zeichneAlles();
      },
      starteVerschieben() {
        this.verlaufSchnappschuss();
        this._moveOriginal = new Map();
        for (const el of this.elemente) {
          if (this.auswahlSet.has(el.i)) {
            this._moveOriginal.set(el.i, klone([el])[0]);
          }
        }
        this._dragModus = 'verschieben';
      },
      starteDrehen(welt) {
        const z = this.auswahlZentrum();
        if (!z) {
          return;
        }
        this.verlaufSchnappschuss();
        this._rotateOriginal = new Map();
        for (const el of this.elemente) {
          if (this.auswahlSet.has(el.i)) {
            this._rotateOriginal.set(el.i, klone([el])[0]);
          }
        }
        this._rotateZentrum = z;
        this._rotateStartWinkel = Math.atan2(welt.y - z.y, welt.x - z.x);
        this._dragModus = 'drehen';
      },
      aktualisiereDrehen(welt) {
        if (!this._rotateOriginal || !this._rotateZentrum || this._rotateStartWinkel == null) {
          return;
        }
        const z = this._rotateZentrum;
        const aktuell = Math.atan2(welt.y - z.y, welt.x - z.x);
        const deltaRad = aktuell - this._rotateStartWinkel;
        wendeAuswahlDrehungAusSnapshot(this.elemente, this._rotateOriginal, z, deltaRad);
        this.zeichneAlles();
      },
      aktualisiereVerschieben(welt) {
        if (!this._moveOriginal) return;
        const dx = welt.x - this._dragStartWelt.x;
        const dy = welt.y - this._dragStartWelt.y;
        for (const el of this.elemente) {
          const orig = this._moveOriginal.get(el.i);
          if (!orig) continue;
          if (orig.t === 's' || orig.t === 'poly') {
            el.p = orig.p.map((v, idx) => (idx % 2 === 0 ? v + dx : v + dy));
          } else {
            el.x = orig.x + dx;
            el.y = orig.y + dy;
          }
        }
        this.zeichneAlles();
      },
      finalisiereLasso(shift) {
        const box = this._lassoBox;
        if (!box) return;
        if (box.w < 1 && box.h < 1) {
          if (!shift) this.auswahl = [];
          return;
        }
        const treffer = [];
        for (const el of this.elemente) {
          if (boxenSchneidenSich(box, boundingBox(el))) {
            treffer.push(el.i);
          }
        }
        if (shift) {
          const set = new Set(this.auswahl);
          treffer.forEach((id) => set.add(id));
          this.auswahl = Array.from(set);
        } else {
          this.auswahl = treffer;
        }
      },
      findeElementUnterPunkt(wx, wy) {
        const tol = Math.max(6, 8 / this.ansicht.scale);
        for (let i = this.elemente.length - 1; i >= 0; i -= 1) {
          if (hitTest(this.elemente[i], wx, wy, tol)) {
            return this.elemente[i].i;
          }
        }
        return null;
      },
      toggleAuswahl(id) {
        const set = new Set(this.auswahl);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        this.auswahl = Array.from(set);
      },
      alleAuswaehlen() {
        if (!this.elemente.length) return;
        this.auswahl = this.elemente.map((el) => el.i);
        if (this.werkzeug !== 'auswahl') {
          this.werkzeug = 'auswahl';
        }
        this.zeichneAlles();
      },
      auswahlAufheben() {
        if (!this.hatAuswahl) return;
        this.auswahl = [];
        this.zeichneAlles();
      },
      kopiereAuswahl() {
        if (!this.hatAuswahl) return;
        const ausw = this.auswahlSet;
        this.zwischenablage = this.elemente.filter((el) => ausw.has(el.i)).map((el) => klone([el])[0]);
        this.persistDebounce();
      },
      schneideAuswahl() {
        if (!this.hatAuswahl) return;
        this.kopiereAuswahl();
        this.loescheAuswahl();
      },
      fuegeEin() {
        if (!this.zwischenablage.length) return;
        this.verlaufSchnappschuss();
        const neueElemente = this.zwischenablage.map((el) => {
          const kopie = klone([el])[0];
          kopie.i = neueId();
          if (kopie.t === 's' || kopie.t === 'poly') {
            kopie.p = kopie.p.map((v, idx) => (idx % 2 === 0 ? v + PASTE_VERSATZ : v + PASTE_VERSATZ));
          } else {
            kopie.x += PASTE_VERSATZ;
            kopie.y += PASTE_VERSATZ;
          }
          return kopie;
        });
        for (const el of neueElemente) this.elemente.push(el);
        this.auswahl = neueElemente.map((el) => el.i);
        if (this.werkzeug !== 'auswahl') this.werkzeug = 'auswahl';
        this.zeichneAlles();
        this.persistDebounce();
      },
      loescheAuswahl() {
        if (!this.hatAuswahl) return;
        this.verlaufSchnappschuss();
        const ausw = this.auswahlSet;
        this.elemente = this.elemente.filter((el) => !ausw.has(el.i));
        this.auswahl = [];
        this.zeichneAlles();
        this.rasterBildCacheLeeren();
        this.persistDebounce();
      },
      zoomeAnPunkt(cx, cy, faktor) {
        const aktuell = this.ansicht.scale;
        const neu = Math.max(MIN_SCALE, Math.min(MAX_SCALE, aktuell * faktor));
        if (neu === aktuell) return;
        const weltX = (cx - this.ansicht.offsetX) / aktuell;
        const weltY = (cy - this.ansicht.offsetY) / aktuell;
        this.ansicht.scale = neu;
        this.ansicht.offsetX = cx - weltX * neu;
        this.ansicht.offsetY = cy - weltY * neu;
        this.zeichneAlles();
      },
      startePinch() {
        const punkte = Array.from(this._aktivePointers.values());
        if (punkte.length < 2) return;
        const a = punkte[0];
        const b = punkte[1];
        const mitte = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        this._pinchStart = { dist, mitte, ansichtStart: { ...this.ansicht } };
      },
      aktualisierePinch() {
        if (!this._pinchStart) {
          this.startePinch();
          return;
        }
        const punkte = Array.from(this._aktivePointers.values());
        if (punkte.length < 2) return;
        const a = punkte[0];
        const b = punkte[1];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const mitteJetzt = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const start = this._pinchStart;
        let neueSkala = start.ansichtStart.scale * (dist / start.dist);
        neueSkala = Math.max(MIN_SCALE, Math.min(MAX_SCALE, neueSkala));
        const weltX = (start.mitte.x - start.ansichtStart.offsetX) / start.ansichtStart.scale;
        const weltY = (start.mitte.y - start.ansichtStart.offsetY) / start.ansichtStart.scale;
        this.ansicht.scale = neueSkala;
        this.ansicht.offsetX = mitteJetzt.x - weltX * neueSkala;
        this.ansicht.offsetY = mitteJetzt.y - weltY * neueSkala;
        this.zeichneAlles();
      },
      holeSichtbareWeltFlaeche() {
        const s = this.ansicht.scale || 1;
        const ox = this.ansicht.offsetX;
        const oy = this.ansicht.offsetY;
        const bw = this.canvasBreite;
        const bh = this.canvasHoehe;
        if (!Number.isFinite(s) || s <= 0 || bw <= 0 || bh <= 0) {
          return { x: 0, y: 0, w: STANDARD_BREITE, h: STANDARD_HOEHE };
        }
        return {
          x: -ox / s,
          y: -oy / s,
          w: bw / s,
          h: bh / s,
        };
      },
      zeichneEbeneHintergrund(ctx, eb, flaeche) {
        if (!eb || eb.hintergrund?.typ !== 'farbe') return;
        const f = flaeche || this.holeSichtbareWeltFlaeche();
        ctx.save();
        ctx.fillStyle = eb.hintergrund.farbe;
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.restore();
      },
      zeichneEbenenInhalt(ctx, opts) {
        const nurSichtbar = !(opts && opts.alleEbenen);
        const flaeche = opts && opts.flaeche ? opts.flaeche : null;
        for (const eb of this.ebenen) {
          if (nurSichtbar && !eb.sichtbar) continue;
          this.zeichneEbeneHintergrund(ctx, eb, flaeche);
          for (const el of eb.elemente) {
            this.zeichneElement(ctx, el);
          }
        }
      },
      zeichneAlles() {
        const ctx = this._ctx;
        const canvas = this.$refs.canvas;
        if (!ctx || !canvas) return;
        const dpr = this._dpr || 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(
          this.ansicht.scale * dpr,
          0,
          0,
          this.ansicht.scale * dpr,
          this.ansicht.offsetX * dpr,
          this.ansicht.offsetY * dpr,
        );
        this.zeichneEbenenInhalt(ctx);
        if (this.karopapierGitter) {
          this.zeichneKaropapierRasterWelt(ctx);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        this.zeichneFormEntwurf(ctx);
        this.zeichneStiftspitzenRahmen(ctx, canvas, dpr);
        this.zeichneAuswahlOverlay(ctx);
        this.zeichneLasso(ctx);
      },
      zeichneFormEntwurf(ctx) {
        const ent = this._formEntwurf;
        if (!ent || !ent.cursor) return;
        const p = ent.p;
        const cur = ent.cursor;
        ctx.save();
        ctx.strokeStyle = this.farbe;
        ctx.lineWidth = this.dicke;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const skala = this.ansicht.scale || 1;
        if (ent.typ === 'linie' && p.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
        } else if (ent.typ === 'polygon' && p.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          for (let i = 2; i < p.length; i += 2) {
            ctx.lineTo(p[i], p[i + 1]);
          }
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
          if (p.length >= 6) {
            const snap = this.nahePolygonStart(cur.x, cur.y);
            const r = Math.max(3, this.dicke * 0.65);
            ctx.beginPath();
            ctx.fillStyle = snap ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.18)';
            ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1.5 / skala;
            ctx.stroke();
          }
        }
        ctx.restore();
      },
      zeichneStiftspitzenRahmen(ctx, canvas, dpr) {
        if (!this.hatWerkzeugVorschauRahmen || !this.stiftVorschauPos) return;
        const cx = this.stiftVorschauPos.x;
        const cy = this.stiftVorschauPos.y;
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
        const ix = Math.min(canvas.width - 1, Math.max(0, Math.floor(cx * dpr)));
        const iy = Math.min(canvas.height - 1, Math.max(0, Math.floor(cy * dpr)));

        let ringFarbe = 'rgba(15,23,42,0.92)';
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        try {
          const probe = ctx.getImageData(ix, iy, 1, 1).data;
          const lum = 0.2126 * probe[0] + 0.7152 * probe[1] + 0.0722 * probe[2];
          ringFarbe = lum > 158 ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.94)';
        } catch {
          /* getImageData kann u.a. bei tainted canvas fehlschlagen */
        }
        ctx.restore();

        const s = this.ansicht.scale || 1;
        const wx = (cx - this.ansicht.offsetX) / s;
        const wy = (cy - this.ansicht.offsetY) / s;
        const r = Math.max(0.5, this.dicke / 2);
        const randW = Math.max(1.5 / (s * dpr), 0.4 / s);

        ctx.save();
        ctx.strokeStyle = ringFarbe;
        ctx.lineWidth = randW;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(wx, wy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      },
      zeichneKaropapierRasterWelt(ctx) {
        const s = this.ansicht.scale || 1;
        const ox = this.ansicht.offsetX;
        const oy = this.ansicht.offsetY;
        const bw = this.canvasBreite;
        const bh = this.canvasHoehe;
        if (!Number.isFinite(s) || s <= 0 || bw <= 0 || bh <= 0) return;
        const schritt = KARO_KANTE_CM * CSS_PX_PRO_CM;
        if (!Number.isFinite(schritt) || schritt <= 0) return;

        let minX = -ox / s;
        let minY = -oy / s;
        let maxX = (bw - ox) / s;
        let maxY = (bh - oy) / s;
        minX -= schritt;
        minY -= schritt;
        maxX += schritt;
        maxY += schritt;

        const iMin = Math.floor(minX / schritt) - 1;
        const iMax = Math.ceil(maxX / schritt) + 1;
        const jMin = Math.floor(minY / schritt) - 1;
        const jMax = Math.ceil(maxY / schritt) + 1;

        ctx.save();
        ctx.strokeStyle = hexZuRgbaString(normalisiereFarbe(this.gitterFarbe), GITTER_ALPHA);
        ctx.lineWidth = 1 / s;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        for (let i = iMin; i <= iMax; i += 1) {
          const x = i * schritt;
          ctx.moveTo(x, minY);
          ctx.lineTo(x, maxY);
        }
        for (let j = jMin; j <= jMax; j += 1) {
          const y = j * schritt;
          ctx.moveTo(minX, y);
          ctx.lineTo(maxX, y);
        }
        ctx.stroke();
        ctx.restore();
      },
      karopapierGitterUmschalten() {
        this.karopapierGitter = !this.karopapierGitter;
      },
      rasterBildCacheLeeren() {
        if (this._rasterBildCache) this._rasterBildCache.clear();
      },
      holeRasterBild(el) {
        if (!this._rasterBildCache) this._rasterBildCache = new Map();
        let img = this._rasterBildCache.get(el.i);
        if (!img) {
          img = new Image();
          img.onload = () => {
            this.zeichneAlles();
          };
          img.onerror = () => {};
          img.src = el.src;
          this._rasterBildCache.set(el.i, img);
        }
        return img;
      },
      async warteRasterBilderFuerFuell() {
        const ps = [];
        for (const eb of this.ebenen) {
          if (!eb.sichtbar) continue;
          for (const el of eb.elemente) {
            if (el.t !== 'm') continue;
            const img = this.holeRasterBild(el);
            if (img && !img.complete) {
              ps.push(
                new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                }),
              );
            }
          }
        }
        await Promise.all(ps);
      },
      zeichneKompositAufCtx(ctx, dpr, opts) {
        const ohneKaro = !!(opts && opts.ohneKaro);
        const flaeche = opts && opts.flaeche ? opts.flaeche : null;
        const canvas = ctx.canvas;
        if (!canvas) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(
          this.ansicht.scale * dpr,
          0,
          0,
          this.ansicht.scale * dpr,
          this.ansicht.offsetX * dpr,
          this.ansicht.offsetY * dpr,
        );
        this.zeichneEbenenInhalt(ctx, { flaeche });
        if (this.karopapierGitter && !ohneKaro) {
          this.zeichneKaropapierRasterWelt(ctx);
        }
      },
      pipetteFarbeAnCss(cssX, cssY) {
        this.zeichneAlles();
        const canvas = this.$refs.canvas;
        const ctx = this._ctx;
        if (!canvas || !ctx) return;
        const dpr = this._dpr || 1;
        const ix = Math.min(canvas.width - 1, Math.max(0, Math.floor(cssX * dpr)));
        const iy = Math.min(canvas.height - 1, Math.max(0, Math.floor(cssY * dpr)));
        const px = ctx.getImageData(ix, iy, 1, 1).data;
        this.farbe = rgbZuHex(px[0], px[1], px[2]);
        if (this.zustandGeladen) this.persistDebounce();
      },
      async fuellAnWelpunkt(wx, wy) {
        const canvas = this.$refs.canvas;
        if (!canvas || !this._ctx) return;
        const dpr = this._dpr || 1;
        try {
          await this.warteRasterBilderFuerFuell();
          const off = document.createElement('canvas');
          off.width = canvas.width;
          off.height = canvas.height;
          const octx = off.getContext('2d', { willReadFrequently: true });
          if (!octx) return;
          this.zeichneKompositAufCtx(octx, dpr, { ohneKaro: true });
          const cssx = wx * this.ansicht.scale + this.ansicht.offsetX;
          const cssy = wy * this.ansicht.scale + this.ansicht.offsetY;
          const ix = Math.min(off.width - 1, Math.max(0, Math.floor(cssx * dpr)));
          const iy = Math.min(off.height - 1, Math.max(0, Math.floor(cssy * dpr)));
          const idat = octx.getImageData(0, 0, off.width, off.height);
          const fillRgb = hexZuRgb(this.farbe);
          const erg = floodFuellAufImageData(idat, ix, iy, fillRgb, FUELL_FARBTOLERANZ, MAX_FUELL_PIXEL);
          if (!erg) return;
          if (erg.zuGross) {
            await window.HTBAH.ui.alert({
              titel: 'Füllen',
              beschreibung:
                'Der zu füllende Bereich ist sehr groß. Zoome näher heran, teile die Fläche mit Linien oder fülle in Abschnitten.',
            });
            return;
          }
          octx.putImageData(idat, 0, 0);
          const bw = erg.maxx - erg.minx + 1;
          const bh = erg.maxy - erg.miny + 1;
          const patch = document.createElement('canvas');
          patch.width = bw;
          patch.height = bh;
          const pctx = patch.getContext('2d');
          if (!pctx) return;
          pctx.drawImage(off, erg.minx, erg.miny, bw, bh, 0, 0, bw, bh);
          const src = patch.toDataURL('image/png');
          const s = this.ansicht.scale || 1;
          const ox = this.ansicht.offsetX;
          const oy = this.ansicht.offsetY;
          const worldX0 = erg.minx / dpr / s - ox / s;
          const worldY0 = erg.miny / dpr / s - oy / s;
          const worldW = bw / dpr / s;
          const worldH = bh / dpr / s;
          this.verlaufSchnappschuss();
          this.elemente.push({
            i: neueId(),
            t: 'm',
            c: normalisiereFarbe(this.farbe),
            d: 1,
            x: worldX0,
            y: worldY0,
            w: worldW,
            h: worldH,
            src,
          });
          this.rasterBildCacheLeeren();
          this.zeichneAlles();
          this.persistDebounce();
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Füllen',
            beschreibung: 'Die Fläche konnte nicht gefüllt werden.',
          });
        }
      },
      zeichneElement(ctx, el) {
        if (el.t === 'm') {
          const img = this.holeRasterBild(el);
          if (!img || !img.complete || !img.naturalWidth) return;
          zeichneMitRotation(ctx, el, () => {
            ctx.drawImage(img, el.x, el.y, el.w, el.h);
          });
          return;
        }
        ctx.strokeStyle = el.c;
        ctx.lineWidth = el.d;
        if (el.t === 's') {
          ctx.beginPath();
          if (el.p.length < 2) return;
          if (el.p.length === 2) {
            ctx.fillStyle = el.c;
            ctx.arc(el.p[0], el.p[1], Math.max(0.5, el.d / 2), 0, Math.PI * 2);
            ctx.fill();
            return;
          }
          ctx.moveTo(el.p[0], el.p[1]);
          for (let i = 2; i + 1 < el.p.length; i += 2) {
            ctx.lineTo(el.p[i], el.p[i + 1]);
          }
          ctx.stroke();
          return;
        }
        if (el.t === 'r') {
          zeichneMitRotation(ctx, el, () => {
            const norm = normalisiereBox(el.x, el.y, el.w, el.h);
            ctx.beginPath();
            ctx.rect(norm.x, norm.y, norm.w, norm.h);
            ctx.stroke();
          });
          return;
        }
        if (el.t === 'e') {
          zeichneMitRotation(ctx, el, () => {
            const norm = normalisiereBox(el.x, el.y, el.w, el.h);
            const rx = norm.w / 2;
            const ry = norm.h / 2;
            if (rx <= 0 || ry <= 0) return;
            ctx.beginPath();
            ctx.ellipse(norm.x + rx, norm.y + ry, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
          });
          return;
        }
        if (el.t === 'tri') {
          zeichneMitRotation(ctx, el, () => {
            const p = dreieckPunkte(el);
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(p[2], p[3]);
            ctx.lineTo(p[4], p[5]);
            ctx.closePath();
            ctx.stroke();
          });
          return;
        }
        if (el.t === 'poly') {
          if (el.p.length < 4) return;
          ctx.beginPath();
          ctx.moveTo(el.p[0], el.p[1]);
          for (let i = 2; i + 1 < el.p.length; i += 2) {
            ctx.lineTo(el.p[i], el.p[i + 1]);
          }
          ctx.closePath();
          ctx.stroke();
        }
      },
      zeichneAuswahlOverlay(ctx) {
        if (!this.auswahl.length) return;
        const auswSet = this.auswahlSet;
        const ausgewaehlt = this.elemente.filter((el) => auswSet.has(el.i));
        const gesamt = gesamtBoundingBox(ausgewaehlt);
        ctx.save();
        const skala = this.ansicht.scale || 1;
        ctx.lineWidth = 1.5 / skala;
        ctx.setLineDash([6 / skala, 4 / skala]);
        ctx.strokeStyle = '#2563eb';
        if (gesamt) {
          const pad = 4 / skala;
          ctx.strokeRect(gesamt.x - pad, gesamt.y - pad, gesamt.w + 2 * pad, gesamt.h + 2 * pad);
        }
        if (this.werkzeug === 'auswahl') {
          const handle = this.drehHandleWeltPosition();
          if (handle) {
            const m = this.drehHandleMetrik();
            const r = m.radius;
            ctx.setLineDash([]);
            ctx.lineWidth = 1.75 / skala;
            ctx.strokeStyle = '#2563eb';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(handle.ankrepx, handle.ankrepy);
            ctx.lineTo(handle.x, handle.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const bogenR = Math.max(r * 0.42, 2.5 / skala);
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, bogenR, -Math.PI * 0.85, Math.PI * 0.35);
            ctx.stroke();
          }
        }
        ctx.restore();
      },
      zeichneLasso(ctx) {
        if (!this._lassoBox) return;
        const box = this._lassoBox;
        ctx.save();
        const skala = this.ansicht.scale || 1;
        ctx.lineWidth = 1.5 / skala;
        ctx.setLineDash([5 / skala, 3 / skala]);
        ctx.strokeStyle = '#2563eb';
        ctx.fillStyle = 'rgba(37, 99, 235, 0.10)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.restore();
      },
      ansichtZuruecksetzen() {
        this.ansicht.scale = 1;
        const box = gesamtBoundingBox(holeSichtbareElemente(this.ebenen));
        if (box && this.canvasBreite > 0 && this.canvasHoehe > 0) {
          const breiteWelt = box.w || 1;
          const hoeheWelt = box.h || 1;
          const skala = Math.min(
            this.canvasBreite / (breiteWelt + 80),
            this.canvasHoehe / (hoeheWelt + 80),
          );
          const eff = Math.max(MIN_SCALE, Math.min(MAX_SCALE, skala));
          this.ansicht.scale = eff;
          this.ansicht.offsetX = (this.canvasBreite - breiteWelt * eff) / 2 - box.x * eff;
          this.ansicht.offsetY = (this.canvasHoehe - hoeheWelt * eff) / 2 - box.y * eff;
        } else {
          this.ansicht.offsetX = 0;
          this.ansicht.offsetY = 0;
        }
        this.zeichneAlles();
        this.persistDebounce();
      },
      zoomEin() {
        const cx = this.canvasBreite / 2;
        const cy = this.canvasHoehe / 2;
        this.zoomeAnPunkt(cx, cy, 1.2);
        this.persistDebounce();
      },
      zoomAus() {
        const cx = this.canvasBreite / 2;
        const cy = this.canvasHoehe / 2;
        this.zoomeAnPunkt(cx, cy, 1 / 1.2);
        this.persistDebounce();
      },
      farbePreset(farbe) {
        this.farbe = normalisiereFarbe(farbe);
      },
      ebeneAuswaehlen(id) {
        if (!this.ebenen.some((eb) => eb.id === id)) return;
        this.ebeneMenuOffenId = null;
        this.aktiveEbeneId = id;
      },
      ebeneSichtbarkeitUmschalten(id) {
        const eb = this.ebenen.find((e) => e.id === id);
        if (!eb) return;
        this.verlaufSchnappschuss();
        eb.sichtbar = !eb.sichtbar;
        this.zeichneAlles();
        this.persistDebounce();
      },
      neueEbeneFormToggle() {
        this.neueEbeneFormOffen = !this.neueEbeneFormOffen;
        if (this.neueEbeneFormOffen) {
          this.neueEbeneName = `Ebene ${this.ebenen.length + 1}`;
          this.neueEbeneHintergrundTyp = 'transparent';
          this.neueEbeneHintergrundFarbe = '#ffffff';
        }
      },
      ebeneNeuErstellen() {
        if (this.ebenen.length >= MAX_EBENEN) return;
        const name = String(this.neueEbeneName || '').trim() || `Ebene ${this.ebenen.length + 1}`;
        const hintergrund =
          this.neueEbeneHintergrundTyp === 'farbe'
            ? { typ: 'farbe', farbe: normalisiereFarbe(this.neueEbeneHintergrundFarbe) }
            : { typ: 'transparent' };
        this.verlaufSchnappschuss();
        const ebene = erstelleStandardEbene(name, hintergrund);
        this.ebenen.push(ebene);
        this.aktiveEbeneId = ebene.id;
        this.neueEbeneFormOffen = false;
        this.auswahl = [];
        this.zeichneAlles();
        this.persistDebounce();
      },
      async ebeneLoeschen(id) {
        if (this.ebenen.length <= 1) return;
        const eb = this.ebenen.find((e) => e.id === id);
        if (!eb) return;
        const hatInhalt = eb.elemente.length > 0 || eb.hintergrund?.typ === 'farbe';
        if (hatInhalt) {
          const bestaetigt = await window.HTBAH.ui.confirm({
            titel: 'Ebene löschen?',
            beschreibung: `„${eb.name}“ und alle Inhalte dieser Ebene werden entfernt.`,
            bestaetigenText: 'Löschen',
            bestaetigenButtonClass: 'btn-danger',
            warnhinweisAnzeigen: true,
          });
          if (!bestaetigt) return;
        }
        this.verlaufSchnappschuss();
        const index = this.ebenen.findIndex((e) => e.id === id);
        if (index < 0) return;
        this.ebenen.splice(index, 1);
        if (this.aktiveEbeneId === id) {
          const neuIndex = Math.min(index, this.ebenen.length - 1);
          this.aktiveEbeneId = this.ebenen[neuIndex]?.id || null;
        }
        this.auswahl = [];
        this.rasterBildCacheLeeren();
        this.zeichneAlles();
        this.persistDebounce();
      },
      ebeneVerschieben(vonIndex, nachIndex) {
        if (
          vonIndex === nachIndex ||
          vonIndex < 0 ||
          nachIndex < 0 ||
          vonIndex >= this.ebenen.length ||
          nachIndex >= this.ebenen.length
        ) {
          return;
        }
        this.verlaufSchnappschuss();
        const [eb] = this.ebenen.splice(vonIndex, 1);
        this.ebenen.splice(nachIndex, 0, eb);
        this.zeichneAlles();
        this.persistDebounce();
      },
      ebeneNachOben(index) {
        if (index < this.ebenen.length - 1) {
          this.ebeneVerschieben(index, index + 1);
        }
      },
      ebeneNachUnten(index) {
        if (index > 0) {
          this.ebeneVerschieben(index, index - 1);
        }
      },
      ebeneDragStart(index) {
        this.ebeneDragIndex = index;
        this.ebeneDropIndex = null;
      },
      ebeneDragOver(index, event) {
        if (this.ebeneDragIndex == null || this.ebeneDragIndex === index) return;
        event.preventDefault();
        this.ebeneDropIndex = index;
      },
      ebeneDrop(index) {
        if (this.ebeneDragIndex == null || this.ebeneDragIndex === index) {
          this.ebeneDragIndex = null;
          this.ebeneDropIndex = null;
          return;
        }
        this.ebeneVerschieben(this.ebeneDragIndex, index);
        this.ebeneDragIndex = null;
        this.ebeneDropIndex = null;
      },
      ebeneDragEnde() {
        this.ebeneDragIndex = null;
        this.ebeneDropIndex = null;
      },
      ebeneMenuToggle(id) {
        this.ebeneMenuOffenId = this.ebeneMenuOffenId === id ? null : id;
      },
      async ebeneMenuAktion(aktion) {
        this.ebeneMenuOffenId = null;
        await aktion();
      },
      ebenenSidebarUmschalten() {
        this.ebenenSidebarOffen = !this.ebenenSidebarOffen;
      },
      async ebeneUmbenennen(id) {
        const eb = this.ebenen.find((e) => e.id === id);
        if (!eb) return;
        const eingabe = await window.HTBAH.ui.prompt({
          titel: 'Ebene umbenennen',
          beschreibung: 'Gib einen neuen Namen für die Ebene ein.',
          label: 'Name',
          startwert: eb.name,
          bestaetigenText: 'Speichern',
          bestaetigenButtonClass: 'btn-primary',
          trim: true,
        });
        if (eingabe === null) return;
        const name = String(eingabe).trim();
        if (!name || name === eb.name) return;
        this.verlaufSchnappschuss();
        eb.name = name.slice(0, 40);
        this.persistDebounce();
      },
      ebeneDuplizieren(id) {
        if (this.ebenen.length >= MAX_EBENEN) return;
        const index = this.ebenen.findIndex((e) => e.id === id);
        if (index < 0) return;
        const quelle = this.ebenen[index];
        this.verlaufSchnappschuss();
        const kopie = dupliziereEbene(quelle);
        this.ebenen.splice(index + 1, 0, kopie);
        this.aktiveEbeneId = kopie.id;
        this.auswahl = [];
        this.rasterBildCacheLeeren();
        this.zeichneAlles();
        this.persistDebounce();
      },
      ebeneHintergrundVorschauStil(eb) {
        if (eb.hintergrund?.typ === 'farbe') {
          return { background: eb.hintergrund.farbe };
        }
        return {};
      },
      async leeren() {
        if (!this.hatZeichenInhalt && !this.undoStack.length && !this.redoStack.length) return;
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Zeichnung löschen?',
          beschreibung:
            'Alle Ebenen, Zeicheninhalte und Einstellungen (Gitterfarbe, Historie) werden vollständig entfernt.',
          bestaetigenText: 'Löschen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (!bestaetigt) return;
        const ebene = erstelleStandardEbene('Ebene 1');
        this.ebenen = [ebene];
        this.aktiveEbeneId = ebene.id;
        this.gitterFarbe = STANDARD_GITTER_FARBE;
        this.karopapierGitter = false;
        this.auswahl = [];
        this.undoStack = [];
        this.redoStack = [];
        this.zwischenablage = [];
        this.neueEbeneFormOffen = false;
        this.rasterBildCacheLeeren();
        this.zeichneAlles();
        this.flushSpeichern();
      },
      bereinigeDateiname(roh) {
        const text = String(roh || '').trim();
        if (!text) return '';
        return text
          .replace(/\.png$/i, '')
          .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);
      },
      async exportierePng() {
        if (!this.hatZeichenInhalt) {
          await window.HTBAH.ui.alert({
            titel: 'Nichts zu exportieren',
            beschreibung: 'Es sind noch keine sichtbaren Ebenen mit Inhalt vorhanden.',
          });
          return;
        }
        await this.warteRasterBilderFuerFuell();
        const sichtbareElemente = holeSichtbareElemente(this.ebenen);
        let box = gesamtBoundingBox(sichtbareElemente);
        if (!box) {
          box = this.holeSichtbareWeltFlaeche();
        }
        if (!box) return;
        const zeitstempel = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+$/, '');
        const standardName = `htbah-zeichnung-${zeitstempel}`;
        const eingabe = await window.HTBAH.ui.prompt({
          titel: 'Zeichnung als PNG speichern',
          beschreibung: 'Wähle einen Dateinamen für den PNG-Export. Die Endung „.png" wird automatisch ergänzt.',
          label: 'Dateiname',
          startwert: '',
          placeholder: `${standardName}.png (Default)`,
          bestaetigenText: 'Speichern',
          bestaetigenButtonClass: 'btn-primary',
          trim: true,
        });
        if (eingabe === null) return;
        const basisName = this.bereinigeDateiname(eingabe) || standardName;
        const dateiname = `${basisName}.png`;
        const breite = Math.max(1, Math.ceil(box.w + EXPORT_PADDING * 2));
        const hoehe = Math.max(1, Math.ceil(box.h + EXPORT_PADDING * 2));
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = breite;
        exportCanvas.height = hoehe;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, breite, hoehe);
        ctx.translate(EXPORT_PADDING - box.x, EXPORT_PADDING - box.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const exportFlaeche = { x: box.x, y: box.y, w: box.w, h: box.h };
        for (const eb of this.ebenen) {
          if (!eb.sichtbar) continue;
          this.zeichneEbeneHintergrund(ctx, eb, exportFlaeche);
          for (const el of eb.elemente) {
            this.zeichneElement(ctx, el);
          }
        }
        exportCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = dateiname;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        }, 'image/png');
      },
      bildEinfuegenOeffnen() {
        const input = this.$refs.bildDateiInput;
        if (!input) return;
        input.value = '';
        input.click();
      },
      async bildDateiAusgewaehlt(event) {
        const datei = event?.target?.files?.[0];
        if (event?.target) {
          event.target.value = '';
        }
        if (!datei) return;
        if (!String(datei.type || '').startsWith('image/')) {
          await window.HTBAH.ui.alert({
            titel: 'Ungültige Datei',
            beschreibung: 'Bitte wähle eine Bilddatei aus.',
          });
          return;
        }
        const cropper = this.$refs.bildCropperModal;
        if (!cropper || typeof cropper.oeffnenMitDatei !== 'function') return;
        cropper.oeffnenMitDatei(datei);
      },
      async onBildCropSpeichern(canvas) {
        const exportCanvas = zeichenCanvasSkalierenMaxKante(canvas, BILD_EINFUEGE_MAX_KANTE);
        if (!exportCanvas) {
          await window.HTBAH.ui.alert({
            titel: 'Zuschnitt fehlgeschlagen',
            beschreibung:
              'Der Zuschnitt konnte nicht erstellt werden (Bild möglicherweise zu groß für den Browser).',
          });
          return false;
        }
        let src;
        try {
          src = zeichenCanvasZuDataUrl(exportCanvas);
        } catch {
          src = '';
        }
        if (!src || !src.startsWith('data:image/')) {
          await window.HTBAH.ui.alert({
            titel: 'Komprimierung fehlgeschlagen',
            beschreibung: 'Das Bild konnte nicht für die Speicherung vorbereitet werden.',
          });
          return false;
        }
        const platz = berechneBildEinfuegeBox(
          exportCanvas.width,
          exportCanvas.height,
          this.ansicht,
          this.canvasBreite,
          this.canvasHoehe,
        );
        this.verlaufSchnappschuss();
        const neu = {
          i: neueId(),
          t: 'm',
          c: '#111827',
          d: 1,
          x: platz.x,
          y: platz.y,
          w: platz.w,
          h: platz.h,
          src,
        };
        this.elemente.push(neu);
        this.auswahl = [neu.i];
        this.werkzeug = 'auswahl';
        this.rasterBildCacheLeeren();
        this.zeichneAlles();
        this.persistDebounce();
        return true;
      },
    },
    template: `
      <div v-if="uiZustand.zeichenModalOffen" class="regelwerk-modal-layer htbah-zeichen-modal-layer">
        <div
          v-show="!minimiert"
          ref="fensterElement"
          class="regelwerk-modal-window card shadow-lg htbah-zeichen-modal-window"
          :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
          :style="fensterStil"
          role="dialog"
          aria-modal="true"
          aria-label="Zeichnen"
          tabindex="-1"
          @keydown.esc.stop.prevent="onFensterEscape">
          <div
            class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom flex-shrink-0"
            @pointerdown="starteZiehen">
            <h5 class="mb-0 d-flex align-items-center gap-2">
              <span aria-hidden="true">✏️</span>
              <span>Zeichnen</span>
            </h5>
            <div class="d-flex gap-2 align-items-center">
              <button
                type="button"
                class="regelwerk-icon-button"
                :title="vollbildLabel"
                :aria-label="vollbildLabel"
                @click="vollbildUmschalten">
                <span class="material-symbols-outlined">{{ vollbildIcon }}</span>
              </button>
              <button
                type="button"
                class="regelwerk-icon-button"
                title="Minimieren"
                aria-label="Minimieren"
                @click="modalMinimieren">
                <span class="material-symbols-outlined">minimize</span>
              </button>
              <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
            </div>
          </div>

          <div class="htbah-zeichen-modal-toolbar d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom flex-shrink-0">
            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-1">
              <div class="btn-group htbah-zeichen-werkzeug-split">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="aktivesZeichenWerkzeug === werkzeug ? 'btn-primary' : 'btn-outline-primary'"
                  :title="aktivesZeichenWerkzeugMeta.label + ' verwenden'"
                  :aria-pressed="ZEICHEN_WERKZEUGE.includes(werkzeug) ? 'true' : 'false'"
                  @click="werkzeugSetzen(aktivesZeichenWerkzeug)">
                  <span class="material-symbols-outlined">{{ aktivesZeichenWerkzeugMeta.icon }}</span>
                  <span class="d-none d-md-inline ms-1">{{ aktivesZeichenWerkzeugMeta.kurz }}</span>
                </button>
                <button
                  type="button"
                  ref="werkzeugToggle"
                  class="btn btn-sm dropdown-toggle dropdown-toggle-split"
                  :class="aktivesZeichenWerkzeug === werkzeug ? 'btn-primary' : 'btn-outline-primary'"
                  :aria-expanded="werkzeugMenuOffen ? 'true' : 'false'"
                  title="Anderes Zeichenwerkzeug wählen"
                  @click.stop="werkzeugMenuToggle">
                  <span class="visually-hidden">Werkzeug wählen</span>
                </button>
                <div
                  ref="werkzeugMenu"
                  class="htbah-zeichen-werkzeug-menu"
                  v-show="werkzeugMenuOffen"
                  role="menu">
                  <button
                    v-for="(wz, idx) in ZEICHEN_WERKZEUGE"
                    :key="wz"
                    type="button"
                    class="htbah-zeichen-werkzeug-menu-item"
                    :class="{ aktiv: aktivesZeichenWerkzeug === wz }"
                    role="menuitemradio"
                    :aria-checked="aktivesZeichenWerkzeug === wz ? 'true' : 'false'"
                    @click.stop="werkzeugAusMenu(wz)">
                    <span class="material-symbols-outlined">{{ WERKZEUG_META[wz].icon }}</span>
                    <span>{{ WERKZEUG_META[wz].label }}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-sm"
                :class="istHandModus ? 'btn-primary' : 'btn-outline-primary'"
                :title="WERKZEUG_META.hand.label"
                :aria-label="WERKZEUG_META.hand.label"
                :aria-pressed="istHandModus ? 'true' : 'false'"
                @click="werkzeugSetzen('hand')">
                <span class="material-symbols-outlined">{{ WERKZEUG_META.hand.icon }}</span>
              </button>
              <button
                type="button"
                class="btn btn-sm"
                :class="istAuswahlModus ? 'btn-primary' : 'btn-outline-primary'"
                :title="WERKZEUG_META.auswahl.label"
                :aria-pressed="istAuswahlModus ? 'true' : 'false'"
                @click="werkzeugSetzen('auswahl')">
                <span class="material-symbols-outlined">{{ WERKZEUG_META.auswahl.icon }}</span>
                <span class="d-none d-md-inline ms-1">Auswahl</span>
              </button>
            </div>

            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-2">
              <label class="d-flex align-items-center gap-1 mb-0" :title="'Pinselfarbe'">
                <span class="material-symbols-outlined" aria-hidden="true">palette</span>
                <input type="color" class="form-control form-control-color htbah-zeichen-color" v-model="farbe" aria-label="Pinselfarbe" />
              </label>
              <div class="htbah-zeichen-presets d-flex gap-1" role="group" aria-label="Farb-Voreinstellungen">
                <button
                  v-for="preset in farbenVoreingestellt"
                  :key="preset"
                  type="button"
                  class="htbah-zeichen-preset"
                  :style="{ background: preset }"
                  :title="preset"
                  :aria-label="'Farbe ' + preset"
                  @click="farbePreset(preset)"></button>
              </div>
            </div>

            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-2 flex-grow-1" style="min-width:160px;">
              <span class="material-symbols-outlined" aria-hidden="true" title="Pinseldicke">line_weight</span>
              <input
                type="range"
                class="form-range htbah-zeichen-range"
                :min="1"
                :max="60"
                step="1"
                v-model.number="dicke"
                aria-label="Pinseldicke" />
              <span class="htbah-zeichen-pinsel-vorschau" aria-hidden="true">
                <span class="htbah-zeichen-pinsel-punkt" :style="{ width: Math.min(28, dicke) + 'px', height: Math.min(28, dicke) + 'px', background: farbe }"></span>
              </span>
              <span class="small text-muted" style="min-width:2.5em;">{{ dicke }} px</span>
            </div>

            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-1">
              <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!kannUndo" @click="undo" title="Rückgängig (Strg+Z)" aria-label="Rückgängig">
                <span class="material-symbols-outlined">undo</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="!kannRedo" @click="redo" title="Wiederherstellen (Strg+Y)" aria-label="Wiederherstellen">
                <span class="material-symbols-outlined">redo</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="zoomAus" title="Verkleinern" aria-label="Verkleinern">
                <span class="material-symbols-outlined">zoom_out</span>
              </button>
              <span class="small text-muted px-1" style="min-width:3em; text-align:center;" :title="'Zoom ' + zoomProzent + '%'">{{ zoomProzent }}%</span>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="zoomEin" title="Vergrößern" aria-label="Vergrößern">
                <span class="material-symbols-outlined">zoom_in</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="ansichtZuruecksetzen" title="Ansicht zurücksetzen / einpassen" aria-label="Ansicht zurücksetzen">
                <span class="material-symbols-outlined">center_focus_strong</span>
              </button>
              <button
                type="button"
                class="btn btn-sm"
                :class="karopapierGitter ? 'btn-secondary' : 'btn-outline-secondary'"
                :title="karopapierGitterLabel"
                :aria-label="karopapierGitterLabel"
                :aria-pressed="karopapierGitter ? 'true' : 'false'"
                @click="karopapierGitterUmschalten">
                <span class="material-symbols-outlined">{{ karopapierGitterIcon }}</span>
              </button>
              <label class="d-flex align-items-center gap-1 mb-0" title="Gitterfarbe">
                <span class="small text-muted d-none d-lg-inline">Gitter</span>
                <input
                  type="color"
                  class="form-control form-control-color htbah-zeichen-color htbah-zeichen-gitter-color"
                  v-model="gitterFarbe"
                  aria-label="Gitterfarbe" />
              </label>
            </div>

            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-1">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!hatAuswahl"
                @click="schneideAuswahl"
                title="Ausschneiden (Strg+X)"
                aria-label="Ausschneiden">
                <span class="material-symbols-outlined">content_cut</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!hatAuswahl"
                @click="kopiereAuswahl"
                title="Kopieren (Strg+C)"
                aria-label="Kopieren">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!kannPasten"
                @click="fuegeEin"
                title="Einfügen (Strg+V)"
                aria-label="Einfügen">
                <span class="material-symbols-outlined">content_paste</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="!hatAuswahl"
                @click="loescheAuswahl"
                title="Auswahl löschen (Entf)"
                aria-label="Auswahl löschen">
                <span class="material-symbols-outlined">delete</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!hatAuswahl"
                @click="dreheAuswahl(-15)"
                title="Auswahl 15° gegen den Uhrzeigersinn drehen"
                aria-label="Gegen den Uhrzeigersinn drehen">
                <span class="material-symbols-outlined">rotate_left</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!hatAuswahl"
                @click="dreheAuswahl(15)"
                title="Auswahl 15° im Uhrzeigersinn drehen"
                aria-label="Im Uhrzeigersinn drehen">
                <span class="material-symbols-outlined">rotate_right</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!hatAuswahl"
                @click="skaliereAuswahl(1 / 1.15)"
                title="Auswahl verkleinern"
                aria-label="Auswahl verkleinern">
                <span class="material-symbols-outlined">zoom_out</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="!hatAuswahl"
                @click="skaliereAuswahl(1.15)"
                title="Auswahl vergrößern"
                aria-label="Auswahl vergrößern">
                <span class="material-symbols-outlined">zoom_in</span>
              </button>
            </div>

            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-1 ms-auto">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="bildEinfuegenOeffnen"
                title="Bild einfügen (Zuschnitt)"
                aria-label="Bild einfügen">
                <span class="material-symbols-outlined">add_photo_alternate</span>
                <span class="d-none d-lg-inline ms-1">Bild</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-primary" :disabled="!kannExportieren" @click="exportierePng" title="Als PNG exportieren" aria-label="PNG exportieren">
                <span class="material-symbols-outlined">download</span>
                <span class="d-none d-md-inline ms-1">PNG</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" @click="leeren" title="Zeichnung löschen" aria-label="Alles löschen">
                <span class="material-symbols-outlined">delete_sweep</span>
              </button>
            </div>
          </div>

          <div class="htbah-zeichen-modal-body d-flex flex-grow-1 min-h-0">
            <div ref="canvasHost" class="htbah-zeichen-modal-canvas-host flex-grow-1 min-w-0">
            <canvas
              ref="canvas"
              class="htbah-zeichen-modal-canvas"
              :class="{
                'htbah-zeichen-modal-canvas--auswahl': istAuswahlModus,
                'htbah-zeichen-modal-canvas--dreh-handle': istAuswahlModus && drehHandleHover && !istDrehZiehen,
                'htbah-zeichen-modal-canvas--dreh-zieht': istDrehZiehen,
                'htbah-zeichen-modal-canvas--hand': istHandModus,
                'htbah-zeichen-modal-canvas--pipette': istPipetteModus,
                'htbah-zeichen-modal-canvas--fuell': istFuellModus,
              }"
              :style="{ touchAction: 'none' }"></canvas>
            <div class="htbah-zeichen-modal-tipp small text-muted">
              <template v-if="istAuswahlModus">
                Klicken oder Rahmen ziehen zum Auswählen · Shift = Auswahl erweitern · Ziehen verschiebt · Dreh-Handle oben ziehen zum Drehen · Vergrößern/Verkleinern über Toolbar · Strg+C/X/V · Entf löscht
              </template>
              <template v-else-if="istHandModus">
                Mit Maus oder Finger ziehen, um die Ansicht zu verschieben · Mausrad: zoomen · Shift + Mausrad: horizontal · Zwei Finger: zoomen
              </template>
              <template v-else-if="istPipetteModus">
                Klicken, um die Farbe unter dem Cursor zu übernehmen
              </template>
              <template v-else-if="istFuellModus">
                Klicken, um eine zusammenhängende Fläche mit der aktuellen Farbe zu füllen (von Linien begrenzt; Karomuster zählt nicht)
              </template>
              <template v-else-if="istRadierModus">
                Radiergummi auf Pixelebene: über Zeichnungen ziehen · Größe = Pinseldicke · Strg+Z rückgängig
              </template>
              <template v-else-if="istLinieModus">
                Erster Klick: Startpunkt · Zweiter Klick: Linie setzen · Klick außerhalb des Canvas bricht ab (Zoom ausgenommen)
              </template>
              <template v-else-if="istPolygonModus">
                Pro Klick eine Ecke · Startpunkt erneut anklicken oder außerhalb des Canvas: Polygon schließen (mind. 3 Ecken) · Zoom ausgenommen
              </template>
              <template v-else-if="istFreihandModus">
                Freihand zeichnen · Strg+Z rückgängig
              </template>
              <template v-else>
                Strg + Mausrad zum Zoomen · Shift + Mausrad horizontal verschieben · Hand-Werkzeug: ziehen und Mausrad zoomen · Pipette / Füllen im Werkzeugmenü · Mit zwei Fingern zoomen &amp; verschieben · Mittlere Maustaste oder Alt+Ziehen zum Verschieben
              </template>
            </div>
            </div>

            <button
              v-if="!ebenenSidebarOffen"
              type="button"
              class="htbah-zeichen-ebenen-toggle-tab flex-shrink-0"
              title="Ebenenleiste einblenden"
              aria-label="Ebenenleiste einblenden"
              @click="ebenenSidebarUmschalten">
              <span class="material-symbols-outlined">chevron_left</span>
              <span class="htbah-zeichen-ebenen-toggle-tab-label small">Ebenen</span>
            </button>

            <aside
              v-if="ebenenSidebarOffen"
              ref="ebenenPanel"
              class="htbah-zeichen-ebenen-panel d-flex flex-column flex-shrink-0 border-start"
              aria-label="Ebenen">
              <div class="htbah-zeichen-ebenen-kopf d-flex align-items-center justify-content-between px-2 py-2 border-bottom">
                <span class="small fw-semibold">Ebenen</span>
                <div class="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary htbah-zeichen-ebenen-hinzufuegen"
                    title="Neue Ebene"
                    aria-label="Neue Ebene"
                    :disabled="ebenen.length >= 50"
                    @click="neueEbeneFormToggle">
                    <span class="material-symbols-outlined">add</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary htbah-zeichen-ebenen-hinzufuegen"
                    title="Ebenenleiste ausblenden"
                    aria-label="Ebenenleiste ausblenden"
                    @click="ebenenSidebarUmschalten">
                    <span class="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
              <div v-if="neueEbeneFormOffen" class="htbah-zeichen-ebene-neu-form px-2 py-2 border-bottom">
                <label class="form-label small mb-1">Name</label>
                <input v-model="neueEbeneName" type="text" class="form-control form-control-sm mb-2" maxlength="40" />
                <div class="small mb-1">Hintergrund</div>
                <div class="btn-group btn-group-sm w-100 mb-2" role="group" aria-label="Hintergrundtyp">
                  <button
                    type="button"
                    class="btn"
                    :class="neueEbeneHintergrundTyp === 'transparent' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="neueEbeneHintergrundTyp = 'transparent'">
                    Transparent
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="neueEbeneHintergrundTyp === 'farbe' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="neueEbeneHintergrundTyp = 'farbe'">
                    Farbe
                  </button>
                </div>
                <div v-if="neueEbeneHintergrundTyp === 'farbe'" class="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="color"
                    class="form-control form-control-color htbah-zeichen-color"
                    v-model="neueEbeneHintergrundFarbe"
                    aria-label="Hintergrundfarbe der neuen Ebene" />
                  <span class="small text-muted">Fläche einfärben</span>
                </div>
                <div class="d-flex gap-1">
                  <button type="button" class="btn btn-sm btn-outline-secondary flex-grow-1" @click="neueEbeneFormOffen = false">Abbrechen</button>
                  <button type="button" class="btn btn-sm btn-outline-success flex-grow-1" @click="ebeneNeuErstellen">Erstellen</button>
                </div>
              </div>
              <ul class="htbah-zeichen-ebenen-liste list-unstyled mb-0 flex-grow-1 overflow-auto">
                <li
                  v-for="eintrag in ebenenUiListe"
                  :key="eintrag.eb.id"
                  class="htbah-zeichen-ebene-eintrag"
                  :class="{
                    aktiv: aktiveEbeneId === eintrag.eb.id,
                    'htbah-zeichen-ebene-eintrag--ausgeblendet': !eintrag.eb.sichtbar,
                    'drag-over': ebeneDropIndex === eintrag.index,
                    dragging: ebeneDragIndex === eintrag.index,
                  }"
                  draggable="true"
                  @dragstart="ebeneDragStart(eintrag.index)"
                  @dragover="ebeneDragOver(eintrag.index, $event)"
                  @drop.prevent="ebeneDrop(eintrag.index)"
                  @dragend="ebeneDragEnde">
                  <button
                    type="button"
                    class="htbah-zeichen-ebene-haupt flex-grow-1 d-flex align-items-center gap-1 border-0 bg-transparent text-start"
                    @click="ebeneAuswaehlen(eintrag.eb.id)">
                    <span
                      class="htbah-zeichen-ebene-vorschau flex-shrink-0"
                      :class="{ 'htbah-zeichen-ebene-vorschau--transparent': eintrag.eb.hintergrund?.typ !== 'farbe' }"
                      :style="ebeneHintergrundVorschauStil(eintrag.eb)"
                      aria-hidden="true"></span>
                    <span class="htbah-zeichen-ebene-name text-truncate small">{{ eintrag.eb.name }}</span>
                  </button>
                  <div class="htbah-zeichen-ebene-aktionen d-flex flex-column align-items-center justify-content-center">
                    <button
                      type="button"
                      class="btn btn-sm btn-link p-0"
                      title="Nach oben"
                      aria-label="Ebene nach oben"
                      :disabled="eintrag.index >= ebenen.length - 1"
                      @click.stop="ebeneNachOben(eintrag.index)">
                      <span class="material-symbols-outlined">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-link p-0"
                      title="Nach unten"
                      aria-label="Ebene nach unten"
                      :disabled="eintrag.index <= 0"
                      @click.stop="ebeneNachUnten(eintrag.index)">
                      <span class="material-symbols-outlined">arrow_downward</span>
                    </button>
                  </div>
                  <div class="htbah-zeichen-ebene-menu-wrap">
                    <button
                      type="button"
                      class="htbah-zeichen-ebene-falafel btn btn-sm btn-link p-0"
                      title="Ebenenaktionen"
                      aria-label="Ebenenaktionen"
                      :aria-expanded="ebeneMenuOffenId === eintrag.eb.id ? 'true' : 'false'"
                      @click.stop="ebeneMenuToggle(eintrag.eb.id)">
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                    <div
                      v-show="ebeneMenuOffenId === eintrag.eb.id"
                      class="htbah-zeichen-ebene-menu"
                      role="menu"
                      @click.stop>
                      <button
                        type="button"
                        class="htbah-zeichen-ebene-menu-item"
                        role="menuitem"
                        @click="ebeneMenuAktion(() => ebeneSichtbarkeitUmschalten(eintrag.eb.id))">
                        <span class="material-symbols-outlined">{{ eintrag.eb.sichtbar ? 'visibility_off' : 'visibility' }}</span>
                        <span>{{ eintrag.eb.sichtbar ? 'Ausblenden' : 'Einblenden' }}</span>
                      </button>
                      <button
                        type="button"
                        class="htbah-zeichen-ebene-menu-item"
                        role="menuitem"
                        @click="ebeneMenuAktion(() => ebeneUmbenennen(eintrag.eb.id))">
                        <span class="material-symbols-outlined">edit</span>
                        <span>Umbenennen</span>
                      </button>
                      <button
                        type="button"
                        class="htbah-zeichen-ebene-menu-item"
                        role="menuitem"
                        :disabled="ebenen.length >= 50"
                        @click="ebeneMenuAktion(() => ebeneDuplizieren(eintrag.eb.id))">
                        <span class="material-symbols-outlined">content_copy</span>
                        <span>Duplizieren</span>
                      </button>
                      <button
                        type="button"
                        class="htbah-zeichen-ebene-menu-item htbah-zeichen-ebene-menu-item--danger"
                        role="menuitem"
                        :disabled="ebenen.length <= 1"
                        @click="ebeneMenuAktion(() => ebeneLoeschen(eintrag.eb.id))">
                        <span class="material-symbols-outlined">delete</span>
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </aside>
          </div>

          <div
            v-if="!istVollbild"
            class="regelwerk-modal-resize-handle"
            role="presentation"
            aria-hidden="true"
            @pointerdown="starteResize"></div>
        </div>
        <input
          ref="bildDateiInput"
          type="file"
          accept="image/*"
          class="visually-hidden"
          tabindex="-1"
          aria-hidden="true"
          @change="bildDateiAusgewaehlt" />
        <bild-cropper-modal
          ref="bildCropperModal"
          modal-id="htbahZeichenBildCropperModal"
          modal-class="htbah-zeichen-bild-cropper-modal"
          titel="Bild zuschneiden"
          beschreibung="Wähle den sichtbaren Bildausschnitt. Das Bild wird komprimiert gespeichert (max. 2048 px Kantenlänge)."
          speichern-text="Einfügen"
          bild-alt-text="Bild zuschneiden"
          dialog-class="modal-lg"
          :on-speichern="onBildCropSpeichern" />
      </div>
    `,
  };
})();
