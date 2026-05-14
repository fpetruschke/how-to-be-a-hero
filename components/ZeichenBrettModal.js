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
  const ZEICHEN_WERKZEUGE = ['strich', 'rechteck', 'kreis', 'dreieck', 'radiergummi'];
  const ALLE_WERKZEUGE = ['strich', 'rechteck', 'kreis', 'dreieck', 'radiergummi', 'auswahl'];

  const WERKZEUG_META = {
    strich: { label: 'Freihand-Strich', kurz: 'Strich', icon: 'gesture' },
    rechteck: { label: 'Rechteck', kurz: 'Rechteck', icon: 'crop_square' },
    kreis: { label: 'Kreis / Ellipse', kurz: 'Kreis', icon: 'radio_button_unchecked' },
    dreieck: { label: 'Dreieck', kurz: 'Dreieck', icon: 'change_history' },
    radiergummi: { label: 'Radiergummi', kurz: 'Radierer', icon: 'ink_eraser' },
    auswahl: { label: 'Auswahl-Werkzeug', kurz: 'Auswahl', icon: 'highlight_alt' },
  };

  function neueId() {
    if (window.HTBAH && typeof window.HTBAH.neueEntropieId === 'function') {
      return window.HTBAH.neueEntropieId();
    }
    return `el-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function leseSpeicherKey() {
    return window.HTBAH?.speicherKeys?.zeichenBrett || SPEICHER_KEY_FALLBACK;
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
    if (typ === 'r' || typ === 'e' || typ === 'tri') {
      const x = Number(roh.x);
      const y = Number(roh.y);
      const w = Number(roh.w);
      const h = Number(roh.h);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return null;
      }
      return { i: id, t: typ, c, d, x, y, w, h };
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
      if (el.t === 's') {
        basis.p = el.p.map((v) => Math.round(v * 10) / 10);
      } else {
        basis.x = Math.round(el.x * 10) / 10;
        basis.y = Math.round(el.y * 10) / 10;
        basis.w = Math.round(el.w * 10) / 10;
        basis.h = Math.round(el.h * 10) / 10;
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

  function boundingBox(el) {
    if (!el) return null;
    if (el.t === 's') {
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
    if (el.t === 's') {
      for (let i = 0; i + 1 < el.p.length; i += 2) {
        el.p[i] += dx;
        el.p[i + 1] += dy;
      }
    } else {
      el.x += dx;
      el.y += dy;
    }
  }

  window.HTBAH_KOMPONENTEN.ZeichenBrettModal = {
    props: ['uiZustand'],
    data() {
      return {
        ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
        farbe: '#111827',
        dicke: 4,
        werkzeug: 'strich',
        werkzeugMenuOffen: false,
        elemente: [],
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
        WERKZEUG_META,
        ZEICHEN_WERKZEUGE,
      };
    },
    created() {
      this._ctx = null;
      this._dpr = 1;
      this._resizeObserver = null;
      this._aktivePointers = null;
      this._dragModus = null;
      this._dragElement = null;
      this._dragStartWelt = null;
      this._dragLetzteWelt = null;
      this._moveOriginal = null;
      this._lassoBox = null;
      this._pinchStart = null;
      this._panMaus = null;
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
        return ZEICHEN_WERKZEUGE.includes(this.werkzeug) ? this.werkzeug : 'strich';
      },
      aktivesZeichenWerkzeugMeta() {
        return WERKZEUG_META[this.aktivesZeichenWerkzeug];
      },
      istAuswahlModus() {
        return this.werkzeug === 'auswahl';
      },
      istRadierModus() {
        return this.werkzeug === 'radiergummi';
      },
      kannUndo() {
        return this.undoStack.length > 0;
      },
      kannRedo() {
        return this.redoStack.length > 0;
      },
      kannExportieren() {
        return this.elemente.length > 0;
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
    },
    watch: {
      'uiZustand.zeichenBrettOffen'(istOffen) {
        if (istOffen) {
          this.fokusVorModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          this.ladeAusSpeicher();
          this.$nextTick(() => {
            this.initialisierePosition();
            this.bindCanvas();
            this.fokussiereFenster();
          });
          window.addEventListener('keydown', this.onTastatur);
          return;
        }
        window.removeEventListener('keydown', this.onTastatur);
        this.werkzeugMenuOffen = false;
        this.beendeZiehen();
        this.beendeResize();
        this.unbindCanvas();
        this.flushSpeichern();
        this.stelleFokusWiederHer();
      },
      farbe() {
        if (this.zustandGeladen) this.persistDebounce();
      },
      dicke() {
        if (this.zustandGeladen) this.persistDebounce();
      },
      werkzeug(neu) {
        if (this.zustandGeladen) this.persistDebounce();
        if (neu !== 'auswahl' && this.hatAuswahl) {
          this.auswahl = [];
          this.zeichneAlles();
        }
      },
      karopapierGitter() {
        if (this.zustandGeladen) this.persistDebounce();
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
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
      window.removeEventListener('pagehide', this.flushSpeichern);
      window.removeEventListener('keydown', this.onTastatur);
      window.removeEventListener('pointerdown', this.beiGlobalemPointerdown, true);
      this.beendeZiehen();
      this.beendeResize();
      this.unbindCanvas();
      this.flushSpeichern();
    },
    methods: {
      ...window.HTBAH_MODAL_FENSTER.methoden,
      schliessen() {
        this.werkzeugMenuOffen = false;
        this.flushSpeichern();
        this.beendeZiehen();
        this.beendeResize();
        this.uiZustand.zeichenBrettOffen = false;
      },
      onFensterEscape() {
        if (this.werkzeugMenuOffen) {
          this.werkzeugMenuOffen = false;
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
        if (!this.werkzeugMenuOffen) return;
        const menu = this.$refs.werkzeugMenu;
        const toggle = this.$refs.werkzeugToggle;
        if (menu && menu.contains(event.target)) return;
        if (toggle && toggle.contains(event.target)) return;
        this.werkzeugMenuOffen = false;
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
            if (ALLE_WERKZEUGE.includes(z.einstellungen.werkzeug)) {
              this.werkzeug = z.einstellungen.werkzeug;
            }
            if (typeof z.einstellungen.karopapierGitter === 'boolean') {
              this.karopapierGitter = z.einstellungen.karopapierGitter;
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
          if (Array.isArray(z.elemente)) {
            this.elemente = normalisiereElementListe(z.elemente);
          } else if (Array.isArray(z.strokes)) {
            this.elemente = normalisiereElementListe(
              z.strokes.map((s) => ({ ...s, t: 's' })),
            );
          } else {
            this.elemente = [];
          }
          this.undoStack = Array.isArray(z.undoStack)
            ? z.undoStack.map(normalisiereElementListe).filter((l) => Array.isArray(l))
            : [];
          this.redoStack = Array.isArray(z.redoStack)
            ? z.redoStack.map(normalisiereElementListe).filter((l) => Array.isArray(l))
            : [];
          this.zwischenablage = Array.isArray(z.zwischenablage) ? normalisiereElementListe(z.zwischenablage) : [];
        }
        if (this.breite == null) this.breite = STANDARD_BREITE;
        if (this.hoehe == null) this.hoehe = STANDARD_HOEHE;
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
          },
          ansicht: { ...this.ansicht },
          elemente: rundeElementeFuerSpeicher(this.elemente),
          undoStack: this.undoStack.map(rundeElementeFuerSpeicher),
          redoStack: this.redoStack.map(rundeElementeFuerSpeicher),
          zwischenablage: rundeElementeFuerSpeicher(this.zwischenablage),
        };
        if (!speichereRoh(daten)) {
          const ohneHistory = { ...daten, undoStack: [], redoStack: [] };
          speichereRoh(ohneHistory);
        }
      },
      verlaufSchnappschuss() {
        this.undoStack.push(klone(this.elemente));
        while (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
        this.redoStack = [];
      },
      undo() {
        if (!this.kannUndo) return;
        this.redoStack.push(klone(this.elemente));
        while (this.redoStack.length > MAX_HISTORY) this.redoStack.shift();
        this.elemente = this.undoStack.pop();
        this.auswahl = this.auswahl.filter((id) => this.elemente.some((el) => el.i === id));
        this.zeichneAlles();
        this.persistDebounce();
      },
      redo() {
        if (!this.kannRedo) return;
        this.undoStack.push(klone(this.elemente));
        while (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
        this.elemente = this.redoStack.pop();
        this.auswahl = this.auswahl.filter((id) => this.elemente.some((el) => el.i === id));
        this.zeichneAlles();
        this.persistDebounce();
      },
      bindCanvas() {
        const canvas = this.$refs.canvas;
        if (!canvas) return;
        this._ctx = canvas.getContext('2d');
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
        this._lassoBox = null;
        this._pinchStart = null;
        this._panMaus = null;
        this._ctx = null;
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
        if (!this.uiZustand.zeichenBrettOffen) return;
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

        const welt = this.canvasZuWelt(pos.x, pos.y);
        this._dragStartWelt = welt;
        this._dragLetzteWelt = welt;

        if (this.werkzeug === 'auswahl') {
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

        this.verlaufSchnappschuss();
        const neu = this.erzeugeElementFuerWerkzeug(welt);
        if (!neu) return;
        this.elemente.push(neu);
        this._dragElement = neu;
        this._dragModus = 'zeichnen';
        this.zeichneAlles();
      },
      onPointerMove(event) {
        if (!this._aktivePointers) return;
        if (!this._aktivePointers.has(event.pointerId)) return;
        const pos = this.pointerKoordinate(event);
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
        }
      },
      onWheel(event) {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const pos = this.pointerKoordinate(event);
        const richtung = event.deltaY < 0 ? 1 : -1;
        const faktor = Math.pow(1.15, richtung);
        this.zoomeAnPunkt(pos.x, pos.y, faktor);
        this.persistDebounce();
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
            this.elemente = this.undoStack.pop();
            this.zeichneAlles();
          }
        } else if (this._dragModus === 'verschieben') {
          if (this._moveOriginal && this.undoStack.length) {
            this.elemente = this.undoStack.pop();
          }
        }
        this._dragElement = null;
        this._moveOriginal = null;
        this._lassoBox = null;
        this._dragModus = null;
      },
      erzeugeElementFuerWerkzeug(welt) {
        const basis = { i: neueId(), c: this.farbe, d: this.dicke };
        if (this.werkzeug === 'strich') {
          return { ...basis, t: 's', p: [welt.x, welt.y] };
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
          } else if (!hitTest(el, wx, wy, halbRadier)) {
            neu.push(el);
          }
        }
        this.elemente = neu;
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
      aktualisiereVerschieben(welt) {
        if (!this._moveOriginal) return;
        const dx = welt.x - this._dragStartWelt.x;
        const dy = welt.y - this._dragStartWelt.y;
        for (const el of this.elemente) {
          const orig = this._moveOriginal.get(el.i);
          if (!orig) continue;
          if (orig.t === 's') {
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
          if (kopie.t === 's') {
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
        if (this.karopapierGitter) {
          this.zeichneKaropapierRasterWelt(ctx);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const el of this.elemente) {
          this.zeichneElement(ctx, el);
        }
        this.zeichneAuswahlOverlay(ctx);
        this.zeichneLasso(ctx);
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
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
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
      zeichneElement(ctx, el) {
        ctx.beginPath();
        ctx.strokeStyle = el.c;
        ctx.lineWidth = el.d;
        if (el.t === 's') {
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
          const norm = normalisiereBox(el.x, el.y, el.w, el.h);
          ctx.rect(norm.x, norm.y, norm.w, norm.h);
          ctx.stroke();
          return;
        }
        if (el.t === 'e') {
          const norm = normalisiereBox(el.x, el.y, el.w, el.h);
          const rx = norm.w / 2;
          const ry = norm.h / 2;
          if (rx <= 0 || ry <= 0) return;
          ctx.ellipse(norm.x + rx, norm.y + ry, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          return;
        }
        if (el.t === 'tri') {
          const p = dreieckPunkte(el);
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(p[2], p[3]);
          ctx.lineTo(p[4], p[5]);
          ctx.closePath();
          ctx.stroke();
        }
      },
      zeichneAuswahlOverlay(ctx) {
        if (!this.auswahl.length) return;
        const auswSet = this.auswahlSet;
        ctx.save();
        const skala = this.ansicht.scale || 1;
        ctx.lineWidth = 1.5 / skala;
        ctx.setLineDash([6 / skala, 4 / skala]);
        ctx.strokeStyle = '#2563eb';
        for (const el of this.elemente) {
          if (!auswSet.has(el.i)) continue;
          const box = boundingBox(el);
          if (!box) continue;
          const pad = 4 / skala;
          ctx.strokeRect(box.x - pad, box.y - pad, box.w + 2 * pad, box.h + 2 * pad);
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
        const box = gesamtBoundingBox(this.elemente);
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
      async leeren() {
        if (!this.elemente.length && !this.undoStack.length && !this.redoStack.length) return;
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Zeichnung löschen?',
          beschreibung:
            'Die aktuelle Zeichnung wird vollständig entfernt. Auch die Rückgängig-Historie wird verworfen.',
          bestaetigenText: 'Löschen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (!bestaetigt) return;
        this.elemente = [];
        this.auswahl = [];
        this.undoStack = [];
        this.redoStack = [];
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
        if (!this.elemente.length) {
          await window.HTBAH.ui.alert({
            titel: 'Nichts zu exportieren',
            beschreibung: 'Auf dem Zeichenbrett befinden sich noch keine Elemente.',
          });
          return;
        }
        const box = gesamtBoundingBox(this.elemente);
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
        for (const el of this.elemente) {
          this.zeichneElement(ctx, el);
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
    },
    template: `
      <div v-if="uiZustand.zeichenBrettOffen" class="regelwerk-modal-layer htbah-zeichen-brett-layer">
        <div
          ref="fensterElement"
          class="regelwerk-modal-window card shadow htbah-zeichen-brett-window"
          :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
          :style="fensterStil"
          role="dialog"
          aria-modal="true"
          aria-label="Zeichen-Brett"
          tabindex="-1"
          @keydown.esc.stop.prevent="onFensterEscape">
          <div
            class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom flex-shrink-0"
            @pointerdown="starteZiehen">
            <h5 class="mb-0 d-flex align-items-center gap-2">
              <span aria-hidden="true">✏️</span>
              <span>Zeichen-Brett</span>
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
              <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
            </div>
          </div>

          <div class="htbah-zeichen-brett-toolbar d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom flex-shrink-0">
            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-1">
              <div class="btn-group htbah-zeichen-werkzeug-split">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="aktivesZeichenWerkzeug === werkzeug ? 'btn-primary' : 'btn-outline-primary'"
                  :title="aktivesZeichenWerkzeugMeta.label + ' verwenden'"
                  :aria-pressed="werkzeug !== 'auswahl'"
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
            </div>

            <div class="htbah-zeichen-werkzeuggruppe d-flex align-items-center gap-1 ms-auto">
              <button type="button" class="btn btn-sm btn-outline-primary" :disabled="!kannExportieren" @click="exportierePng" title="Als PNG exportieren" aria-label="PNG exportieren">
                <span class="material-symbols-outlined">download</span>
                <span class="d-none d-md-inline ms-1">PNG</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" @click="leeren" title="Zeichnung löschen" aria-label="Alles löschen">
                <span class="material-symbols-outlined">delete_sweep</span>
              </button>
            </div>
          </div>

          <div ref="canvasHost" class="htbah-zeichen-brett-canvas-host">
            <canvas
              ref="canvas"
              class="htbah-zeichen-brett-canvas"
              :class="{
                'htbah-zeichen-brett-canvas--auswahl': istAuswahlModus,
              }"
              :style="{ touchAction: 'none' }"></canvas>
            <div class="htbah-zeichen-brett-tipp small text-muted">
              <template v-if="istAuswahlModus">
                Klicken oder Rahmen ziehen zum Auswählen · Shift = Auswahl erweitern · Ziehen verschiebt · Strg+C/X/V · Entf löscht
              </template>
              <template v-else-if="istRadierModus">
                Radiergummi: über Linien ziehen · Größe = Pinseldicke · Strg+Z rückgängig
              </template>
              <template v-else>
                Strg + Mausrad zum Zoomen · Mit zwei Fingern zoomen &amp; verschieben · Mittlere Maustaste oder Alt+Ziehen zum Verschieben
              </template>
            </div>
          </div>

          <div
            v-if="!istVollbild"
            class="regelwerk-modal-resize-handle"
            role="presentation"
            aria-hidden="true"
            @pointerdown="starteResize"></div>
        </div>
      </div>
    `,
  };
})();
