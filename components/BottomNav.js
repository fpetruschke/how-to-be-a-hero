window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/** Aufgelöste URL für dynamisches import() (Bare Specifier wie "assets/…" sind im Browser ungültig). */
function htbahAssetUrl(relMitPunktSlash) {
  try {
    return new URL(relMitPunktSlash, document.baseURI || window.location.href).href;
  } catch {
    return relMitPunktSlash;
  }
}

const HTBAH_DICE_BOX_MODULE_URL = htbahAssetUrl('./assets/js/dice-box.es.min.js');
const HTBAH_DICE_INIT_TIMEOUT_MS = 7000;
const HTBAH_APP_ORIGIN = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;

function htbahBegegnungStripHtmlText(html) {
  const div = document.createElement('div');
  div.innerHTML = typeof html === 'string' ? html : '';
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

window.HTBAH_KOMPONENTEN.BottomNav = {
  props: ['uiZustand'],
  data() {
    return {
      wuerfelModus: 'w10',
      anzahlW10: 1,
      anzahlW100: 1,
      ergebnisse: [],
      wuerfelModalTab: 'wuerfel',
      atmosphaereFormularOffen: false,
      atmosphaere: {},
      badgePos: null,
      _badgeDrag: null,
      begegnungZiehung: null,
      diceBox: null,
      diceReady: false,
      dice3dAktiv: true,
      diceInitPromise: null,
      diceModulLadenPromise: null,
      diceFehler: '',
      diceThemeColor: '#509b4a',
      ...(() => {
        const p = window.HTBAH.ladeWuerfelAudioProfil();
        return {
          wuerfelAudioStumm: p.stumm,
          wuerfelAudioLautstaerke: p.lautstaerke,
        };
      })(),
      wuerfelBeutelOffen: false,
      wuerfelBeutelFenster: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten() },
      sicherheitsmechanismenModalOffen: false,
    };
  },
  created() {
    this.atmosphaere = window.HTBAH.ladeAtmosphaereZustand();
    this.badgePos = window.HTBAH.ladeAtmosphaereBadgePosition();
    this.ladeWuerfelBeutelFenster();
  },
  computed: {
    ergebnisSumme() {
      return this.ergebnisse.reduce((summe, wert) => summe + wert, 0);
    },
    ergebnisTitel() {
      return this.wuerfelModus === 'w10' ? 'W10 Ergebnisse' : 'W100 Ergebnisse';
    },
    rolle() {
      void this.$route.fullPath;
      return window.HTBAH.ladeAppRolle();
    },
    istSpielleitung() {
      return this.rolle === 'spielleitung';
    },
    zeigeNav() {
      const p = this.$route.path || '/';
      return p !== '/';
    },
    atmosphaereBadgeCombinedStyle() {
      const o = {
        '--atmosphaere-akzent': this.atmosphaereAkzent,
      };
      if (this.badgePos && this.badgePos.mode === 'fixed') {
        o.left = `${this.badgePos.left}px`;
        o.top = `${this.badgePos.top}px`;
        o.right = 'auto';
        o.bottom = 'auto';
      }
      return o;
    },
    atmosphaereHatWerte() {
      const a = this.atmosphaere;
      return !!(a && (a.jahreszeitId || a.tageszeitId || a.temperatur));
    },
    atmosphaereAkzent() {
      const a = this.atmosphaere;
      if (a && a.wetterAkzentFarbe) {
        return a.wetterAkzentFarbe;
      }
      if (a && a.jahreszeitFarbe) {
        return a.jahreszeitFarbe;
      }
      return 'var(--primary-color)';
    },
    jahreszeitenOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && Array.isArray(AZ.JAHRESZEITEN) ? AZ.JAHRESZEITEN : [];
    },
    tageszeitenOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && Array.isArray(AZ.TAGESZEITEN) ? AZ.TAGESZEITEN : [];
    },
    temperaturOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.temperaturOptionen === 'function' ? AZ.temperaturOptionen() : [];
    },
    bewoelkungOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.bewoelkungOptionen === 'function' ? AZ.bewoelkungOptionen() : [];
    },
    niederschlagOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.niederschlagOptionen === 'function' ? AZ.niederschlagOptionen() : [];
    },
    windstaerkeOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.windstaerkeOptionen === 'function' ? AZ.windstaerkeOptionen() : [];
    },
    windrichtungOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.windrichtungOptionen === 'function' ? AZ.windrichtungOptionen() : [];
    },
    aktuelleWindstaerkeBft() {
      const wb = String(this.atmosphaere.windBeaufort || '');
      const m = wb.match(/([\d]+(?:[\-–][\d]+)?)/);
      if (m && m[1]) {
        return m[1].replace(/-/g, '–');
      }
      return this.windstaerkeOptionen[0] ? this.windstaerkeOptionen[0].bft : '';
    },
    aktuelleWindrichtung() {
      const wr = String(this.atmosphaere.windRichtung || '').trim();
      if (wr && this.windrichtungOptionen.includes(wr)) {
        return wr;
      }
      const m = String(this.atmosphaere.wind || '').match(/aus\s+([A-Z]{1,2})$/);
      const parsed = m && m[1] ? m[1] : '';
      if (parsed && this.windrichtungOptionen.includes(parsed)) {
        return parsed;
      }
      return this.windrichtungOptionen[0] || 'N';
    },
    startseiteLandingAktiv() {
      const p = this.$route.path || '';
      return p === '/';
    },
    spielleiterGruppenAktiv() {
      const p = this.$route.path || '';
      return p === '/spielleiter' || p.startsWith('/spielleiter/gruppe/');
    },
    presetVerwaltungAktiv() {
      const p = this.$route.path || '';
      return (
        p === '/faehigkeiten-presets' ||
        p === '/faehigkeiten-preset-bearbeiten' ||
        /^\/faehigkeiten-preset-bearbeiten\//.test(p)
      );
    },
    charakterAktiv() {
      const p = this.$route.path || '';
      return p === '/charakter' || p.startsWith('/charakter/');
    },
    charakterLink() {
      const id = window.HTBAH.ladeAktivenCharakterId();
      return id ? `/charakter/${id}/session-zero` : '/charakter/neu/session-zero';
    },
    weltenbauAktiv() {
      const p = this.$route.path || '';
      return p === '/weltenbau' || p.startsWith('/weltenbau/');
    },
    einstellungenAktiv() {
      const p = this.$route.path || '';
      return p === '/einstellungen' || p.startsWith('/einstellungen/');
    },
    wuerfelNavAktiv() {
      return this.wuerfelBeutelOffen;
    },
    /** Frische Listen aus dem Speicher (Reaktivität über Tab/Route). */
    begegnungListenAusSpeicher() {
      void this.$route.fullPath;
      void this.wuerfelModalTab;
      const z = window.HTBAH.ladeZufallstabellenZustand() || {};
      return {
        npcs: Array.isArray(z.npcs) ? z.npcs : [],
        bestien: Array.isArray(z.bestien) ? z.bestien : [],
        pantheon: Array.isArray(z.pantheon) ? z.pantheon : [],
      };
    },
    begegnungHatBegegnungsEintrag() {
      const { npcs, bestien, pantheon } = this.begegnungListenAusSpeicher;
      return npcs.length > 0 || bestien.length > 0 || pantheon.length > 0;
    },
    wuerfelBeutelFensterStil() {
      return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.wuerfelBeutelFenster);
    },
    wuerfelAudioLautProzent() {
      return Math.round(Math.min(1, Math.max(0, Number(this.wuerfelAudioLautstaerke) || 0)) * 100);
    },
    aktiverCharakterKontext() {
      return window.HTBAH && window.HTBAH._aktiverCharakterKontext
        ? window.HTBAH._aktiverCharakterKontext
        : null;
    },
    aktiveSicherheitsmechanismen() {
      const fallback = {
        tabuHtml: '',
        schleierHtml: '',
        buttonEmoji: '🚩',
      };
      const kontext = this.aktiverCharakterKontext;
      if (!kontext || typeof kontext.getCharakter !== 'function') {
        return fallback;
      }
      const charakter = kontext.getCharakter();
      if (!charakter || typeof charakter !== 'object') {
        return fallback;
      }
      if (!charakter.sicherheitsmechanismen || typeof charakter.sicherheitsmechanismen !== 'object') {
        charakter.sicherheitsmechanismen = { ...fallback };
        return charakter.sicherheitsmechanismen;
      }
      if (typeof charakter.sicherheitsmechanismen.buttonEmoji !== 'string' || !charakter.sicherheitsmechanismen.buttonEmoji.trim()) {
        charakter.sicherheitsmechanismen.buttonEmoji = '🚩';
      }
      if (typeof charakter.sicherheitsmechanismen.tabuHtml !== 'string') {
        charakter.sicherheitsmechanismen.tabuHtml = '';
      }
      if (typeof charakter.sicherheitsmechanismen.schleierHtml !== 'string') {
        charakter.sicherheitsmechanismen.schleierHtml = '';
      }
      return charakter.sicherheitsmechanismen;
    },
    sicherheitsButtonEmoji() {
      return '🚩';
    },
    sicherheitsButtonAnzeigen() {
      return this.zeigeNav && (this.rolle === 'spielleitung' || this.rolle === 'charakter');
    },
    sicherheitsmodalNurLesen() {
      return this.rolle !== 'spielleitung';
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.sicherheitsmechanismenModalOffen) {
        this.sicherheitsmechanismenModalOffen = false;
      }
    },
    zeigeNav() {
      this.$nextTick(() => this.bindNavReserveObserver());
    },
    rolle(neu) {
      if (
        neu !== 'spielleitung' &&
        (this.wuerfelModalTab === 'atmosphaere' || this.wuerfelModalTab === 'begegnung')
      ) {
        this.wuerfelModalTab = 'wuerfel';
      }
    },
    wuerfelModalTab(neu) {
      if (neu === 'wuerfel' && this.dice3dAktiv) {
        this.$nextTick(() => {
          this.stelleDiceBoxBereit();
        });
      }
    },
    dice3dAktiv(neu) {
      this.speichereDiceFarbwahl();
      if (neu) {
        this.$nextTick(() => {
          this.stelleDiceBoxBereit();
        });
      } else {
        this.diceFehler = '';
        if (this.diceBox && typeof this.diceBox.clear === 'function') {
          this.diceBox.clear();
        }
      }
    },
    diceThemeColor() {
      this.speichereDiceFarbwahl();
      this.aktualisiereDiceTheme();
    },
    wuerfelBeutelOffen(neu) {
      if (neu) {
        window.addEventListener('resize', this.wuerfelBeutelBeiViewportResize);
      } else {
        window.removeEventListener('resize', this.wuerfelBeutelBeiViewportResize);
        this.wuerfelBeutelBeendeZiehen();
        this.wuerfelBeutelBeendeResize();
      }
    },
  },
  mounted() {
    this._navReserveObserver = null;
    this.$nextTick(() => this.bindNavReserveObserver());
    this.ladeDiceFarbwahl();
  },
  beforeUnmount() {
    this.sicherheitsmechanismenModalOffen = false;
    this.unbindNavReserveObserver();
    document.documentElement.style.removeProperty('--htbah-bottom-nav-reserve');
    document.documentElement.style.removeProperty('--htbah-top-nav-reserve');
    this.diceBox = null;
    this.diceReady = false;
    this.diceInitPromise = null;
    this.diceModulLadenPromise = null;
    window.removeEventListener('resize', this.wuerfelBeutelBeiViewportResize);
    this.speichereWuerfelBeutelFenster();
    this.wuerfelBeutelBeendeZiehen();
    this.wuerfelBeutelBeendeResize();
  },
  methods: {
    warte(ms) {
      return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    },
    ladeDiceFarbwahl() {
      try {
        const key = window.HTBAH?.speicherKeys?.diceColors || 'htbah_dice_colors';
        const raw = window.HTBAH?.speicher?.leseText(key, null);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.enabled === 'boolean') {
            this.dice3dAktiv = parsed.enabled;
          }
          const theme = typeof parsed.theme === 'string' ? parsed.theme.trim() : '';
          if (/^#[0-9a-fA-F]{6}$/.test(theme)) {
            this.diceThemeColor = theme;
          }
        }
      } catch {
        // Optional: Farbwahl aus LocalStorage ist defekt.
      }
    },
    speichereDiceFarbwahl() {
      try {
        const key = window.HTBAH?.speicherKeys?.diceColors || 'htbah_dice_colors';
        window.HTBAH?.speicher?.schreibeText(
          key,
          JSON.stringify({
            enabled: this.dice3dAktiv,
            theme: this.diceThemeColor,
          }),
        );
      } catch {
        // Optional: Speicher evtl. gesperrt.
      }
    },
    async ladeDiceBoxKlasse() {
      if (window.HTBAH_DICE_BOX_KLASSE) {
        return window.HTBAH_DICE_BOX_KLASSE;
      }
      if (!this.diceModulLadenPromise) {
        this.diceModulLadenPromise = import(HTBAH_DICE_BOX_MODULE_URL)
          .then((mod) => {
            const DiceBox = mod && mod.default ? mod.default : null;
            if (!DiceBox) {
              throw new Error('DiceBox-Klasse konnte nicht geladen werden.');
            }
            window.HTBAH_DICE_BOX_KLASSE = DiceBox;
            return DiceBox;
          })
          .catch((err) => {
            this.diceModulLadenPromise = null;
            throw err;
          });
      }
      return this.diceModulLadenPromise;
    },
    async stelleDiceBoxBereit() {
      if (!this.dice3dAktiv) {
        return null;
      }
      if (this.diceReady && this.diceBox) {
        return this.diceBox;
      }
      if (this.diceInitPromise) {
        return this.diceInitPromise;
      }
      const zielElement = this.$refs.diceBoxElement;
      if (!zielElement) {
        return null;
      }
      this.diceInitPromise = this.ladeDiceBoxKlasse()
        .then(async (DiceBox) => {
          this.diceFehler = '';
          // DiceBox erwartet einen Selector-String; Element-Refs koennen fehlschlagen.
          const box = new DiceBox('#htbah-dice-box', {
            // Relativ zu origin (DiceBox: fetch = origin + assetPath)
            assetPath: 'assets/dice-box/assets/',
            origin: HTBAH_APP_ORIGIN,
            theme: 'default',
            themeColor: this.diceThemeColor,
            offscreen: true,
            scale: 16,
          });
          await box.init();
          // Wichtig: Klassen mit JS-Privatfeldern duerfen nicht durch Vue-Proxies laufen.
          this.diceBox = Vue.markRaw(box);
          this.diceReady = true;
          this.aktualisiereDiceTheme();
          return this.diceBox;
        })
        .catch((err) => {
          this.diceReady = false;
          this.diceBox = null;
          const meldung =
            err && typeof err.message === 'string' && err.message.trim()
              ? err.message.trim()
              : 'Unbekannter Initialisierungsfehler';
          this.diceFehler = `3D-Würfel konnten nicht geladen werden (${meldung}). Standard-Wurf bleibt aktiv.`;
          console.error('[HTBAH] Dice init fehlgeschlagen:', err);
          return null;
        })
        .finally(() => {
          this.diceInitPromise = null;
        });
      return this.diceInitPromise;
    },
    aktualisiereDiceTheme() {
      if (!this.diceReady || !this.diceBox || typeof this.diceBox.updateConfig !== 'function') {
        return;
      }
      this.diceBox.updateConfig({
        themeColor: this.diceThemeColor,
      });
    },
    baueDiceNotation() {
      if (this.wuerfelModus === 'w100') {
        const anzahl100 = Math.max(1, Math.min(50, Number(this.anzahlW100) || 1));
        this.anzahlW100 = anzahl100;
        return `${anzahl100}d100`;
      }
      const anzahl10 = Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
      this.anzahlW10 = anzahl10;
      return `${anzahl10}d10`;
    },
    ergebnisseAusDiceRoll(rollWert) {
      if (!Array.isArray(rollWert)) {
        return [];
      }
      const out = [];
      rollWert.forEach((eintrag) => {
        if (eintrag == null) {
          return;
        }
        if (typeof eintrag === 'number') {
          out.push(eintrag);
          return;
        }
        if (typeof eintrag.value === 'number') {
          out.push(eintrag.value);
          return;
        }
        if (typeof eintrag.result === 'number') {
          out.push(eintrag.result);
        }
      });
      return out;
    },
    bindNavReserveObserver() {
      this.unbindNavReserveObserver();
      const el = this.$refs.navbarFixedEl;
      if (!el) {
        this.syncBottomNavReserve();
        return;
      }
      this._navReserveObserver = new ResizeObserver(() => {
        this.syncBottomNavReserve();
      });
      this._navReserveObserver.observe(el);
      this.syncBottomNavReserve();
    },
    unbindNavReserveObserver() {
      if (this._navReserveObserver) {
        this._navReserveObserver.disconnect();
        this._navReserveObserver = null;
      }
    },
    syncBottomNavReserve() {
      const el = this.$refs.navbarFixedEl;
      const root = document.documentElement;
      const istDesktop = window.matchMedia('(min-width: 992px)').matches;
      if (!el) {
        root.style.setProperty('--htbah-bottom-nav-reserve', '0px');
        root.style.setProperty('--htbah-top-nav-reserve', '0px');
        return;
      }
      const h = el.getBoundingClientRect().height;
      const px = Math.max(1, Math.ceil(h));
      if (istDesktop) {
        root.style.setProperty('--htbah-bottom-nav-reserve', '0px');
        root.style.setProperty('--htbah-top-nav-reserve', `${px}px`);
        return;
      }
      root.style.setProperty('--htbah-bottom-nav-reserve', `${px}px`);
      root.style.setProperty('--htbah-top-nav-reserve', '0px');
    },
    regelwerkOeffnen() {
      this.uiZustand.regelwerkOffen = true;
    },
    abenteuerbuchOeffnen() {
      this.uiZustand.abenteuerbuchOffen = true;
    },
    speichereAtmosphaere() {
      window.HTBAH.speichereAtmosphaereZustand(this.atmosphaere);
    },
    atmosphaereAllesWuerfeln() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      Object.assign(this.atmosphaere, AZ.generiereAlles());
      this.speichereAtmosphaere();
    },
    atmosphaereNurJahreszeit() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      Object.assign(this.atmosphaere, AZ.generiereJahreszeit());
      this.speichereAtmosphaere();
    },
    atmosphaereNurWetter() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      const jz = this.atmosphaere.jahreszeitId || 'fruehling';
      if (!this.atmosphaere.jahreszeitId) {
        const m = AZ.jahreszeitMeta('fruehling');
        Object.assign(this.atmosphaere, {
          jahreszeitId: 'fruehling',
          jahreszeitLabel: m.label,
          jahreszeitEmoji: m.emoji,
          jahreszeitFarbe: m.farbe,
        });
      }
      Object.assign(this.atmosphaere, AZ.generiereWetter(jz));
      this.speichereAtmosphaere();
    },
    atmosphaereNurTageszeit() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      Object.assign(this.atmosphaere, AZ.generiereTageszeit());
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeJahreszeit(jahreszeitId) {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ || !jahreszeitId) {
        return;
      }
      const j = AZ.jahreszeitMeta(jahreszeitId);
      Object.assign(this.atmosphaere, {
        jahreszeitId: j.id,
        jahreszeitLabel: j.label,
        jahreszeitEmoji: j.emoji,
        jahreszeitFarbe: j.farbe,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeTageszeit(tageszeitId) {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ || !tageszeitId) {
        return;
      }
      const t = AZ.tageszeitMeta(tageszeitId);
      Object.assign(this.atmosphaere, {
        tageszeitId: t.id,
        tageszeitLabel: t.label,
        tageszeitEmoji: t.emoji,
        tageszeitFarbe: t.farbe,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeTemperatur(temperatur) {
      if (!temperatur) {
        return;
      }
      this.atmosphaere.temperatur = temperatur;
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeBewoelkung(bewoelkung) {
      if (!bewoelkung) {
        return;
      }
      this.atmosphaere.bewoelkung = bewoelkung;
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeNiederschlag(niederschlagKey) {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ || !niederschlagKey) {
        return;
      }
      const meta = AZ.niederschlagMeta(niederschlagKey);
      Object.assign(this.atmosphaere, {
        niederschlagKey,
        niederschlagLabel: meta.label,
        niederschlagEmoji: meta.emoji,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereWindText(staerke, richtung) {
      return `${staerke.label}, aus ${richtung}`;
    },
    atmosphaereSetzeWindstaerke(bftBand) {
      if (!bftBand) {
        return;
      }
      const staerke = this.windstaerkeOptionen.find((s) => s.bft === bftBand);
      if (!staerke) {
        return;
      }
      const richtung = this.aktuelleWindrichtung;
      Object.assign(this.atmosphaere, {
        wind: this.atmosphaereWindText(staerke, richtung),
        windStaerke: staerke.kmh,
        windBeaufort: `Beaufort ${staerke.bft}`,
        windRichtung: richtung,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeWindrichtung(richtung) {
      if (!richtung) {
        return;
      }
      const staerke =
        this.windstaerkeOptionen.find((s) => s.bft === this.aktuelleWindstaerkeBft) || this.windstaerkeOptionen[0];
      if (!staerke) {
        return;
      }
      Object.assign(this.atmosphaere, {
        wind: this.atmosphaereWindText(staerke, richtung),
        windRichtung: richtung,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereToggleFormular() {
      this.atmosphaereFormularOffen = !this.atmosphaereFormularOffen;
    },
    ladeWuerfelBeutelFenster() {
      try {
        const key = window.HTBAH?.speicherKeys?.wuerfelBeutelFenster || 'htbah_wuerfel_beutel_fenster';
        const o = window.HTBAH?.speicher?.leseJson(key, null);
        if (!o || typeof o !== 'object') {
          return;
        }
        const f = this.wuerfelBeutelFenster;
        const br = Number(o.breite);
        const ho = Number(o.hoehe);
        if (Number.isFinite(br) && Number.isFinite(ho) && br > 0 && ho > 0) {
          const g = window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(br, ho, 300, 260);
          f.breite = g.breite;
          f.hoehe = g.hoehe;
        }
        const px = Number(o.positionX);
        const py = Number(o.positionY);
        if (Number.isFinite(px) && Number.isFinite(py) && f.breite != null && f.hoehe != null) {
          const p = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(px, py, f.breite, f.hoehe);
          f.positionX = p.x;
          f.positionY = p.y;
        }
      } catch {
        /* Optional: defekter LocalStorage-Eintrag */
      }
    },
    speichereWuerfelBeutelFenster() {
      try {
        const f = this.wuerfelBeutelFenster;
        if (
          f.breite == null ||
          f.hoehe == null ||
          f.positionX == null ||
          f.positionY == null
        ) {
          return;
        }
        const key = window.HTBAH?.speicherKeys?.wuerfelBeutelFenster || 'htbah_wuerfel_beutel_fenster';
        window.HTBAH?.speicher?.schreibeJson(key, {
          breite: Math.round(f.breite),
          hoehe: Math.round(f.hoehe),
          positionX: Math.round(f.positionX),
          positionY: Math.round(f.positionY),
        });
      } catch {
        /* Optional: Speicher gesperrt */
      }
    },
    wuerfelModalOeffnen(tab) {
      const zielTab =
        tab === 'atmosphaere' || tab === 'begegnung' || tab === 'wuerfel' ? tab : 'wuerfel';
      const gmTab = zielTab === 'atmosphaere' || zielTab === 'begegnung';
      this.wuerfelModalTab = !this.istSpielleitung && gmTab ? 'wuerfel' : zielTab;
      this.wuerfelBeutelOffen = true;
      this.$nextTick(() => {
        this.wuerfelBeutelInitialisierePosition();
        if (this.wuerfelModalTab === 'wuerfel') {
          this.stelleDiceBoxBereit();
        }
      });
    },
    wuerfelBeutelSchliessen() {
      this.speichereWuerfelBeutelFenster();
      this.wuerfelBeutelOffen = false;
    },
    wuerfelBeutelErmittleViewport() {
      return window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
    },
    wuerfelBeutelBegrenzeGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 300, 260);
    },
    wuerfelBeutelInitialisierePosition() {
      const fenster = this.$refs.wuerfelBeutelFensterRef;
      if (!fenster) {
        return;
      }
      if (this.wuerfelBeutelFenster.breite == null || this.wuerfelBeutelFenster.hoehe == null) {
        const groesse = this.wuerfelBeutelBegrenzeGroesse(fenster.offsetWidth, fenster.offsetHeight);
        this.wuerfelBeutelFenster.breite = groesse.breite;
        this.wuerfelBeutelFenster.hoehe = groesse.hoehe;
      } else {
        const groesse = this.wuerfelBeutelBegrenzeGroesse(
          this.wuerfelBeutelFenster.breite,
          this.wuerfelBeutelFenster.hoehe,
        );
        this.wuerfelBeutelFenster.breite = groesse.breite;
        this.wuerfelBeutelFenster.hoehe = groesse.hoehe;
      }
      if (this.wuerfelBeutelFenster.positionX == null || this.wuerfelBeutelFenster.positionY == null) {
        const v = this.wuerfelBeutelErmittleViewport();
        this.wuerfelBeutelFenster.positionX = Math.max(
          0,
          Math.round((v.viewportBreite - this.wuerfelBeutelFenster.breite) / 2),
        );
        this.wuerfelBeutelFenster.positionY = Math.max(
          0,
          Math.round((v.viewportHoehe - this.wuerfelBeutelFenster.hoehe) / 2),
        );
      }
      this.wuerfelBeutelStelleSichtbar();
    },
    wuerfelBeutelStelleSichtbar() {
      if (this.wuerfelBeutelFenster.istVollbild) {
        return;
      }
      if (this.wuerfelBeutelFenster.breite == null || this.wuerfelBeutelFenster.hoehe == null) {
        return;
      }
      const groesse = this.wuerfelBeutelBegrenzeGroesse(
        this.wuerfelBeutelFenster.breite,
        this.wuerfelBeutelFenster.hoehe,
      );
      this.wuerfelBeutelFenster.breite = groesse.breite;
      this.wuerfelBeutelFenster.hoehe = groesse.hoehe;
      const v = this.wuerfelBeutelErmittleViewport();
      const maxX = Math.max(0, v.viewportBreite - this.wuerfelBeutelFenster.breite);
      const maxY = Math.max(0, v.viewportHoehe - this.wuerfelBeutelFenster.hoehe);
      this.wuerfelBeutelFenster.positionX = Math.min(
        Math.max(0, this.wuerfelBeutelFenster.positionX || 0),
        maxX,
      );
      this.wuerfelBeutelFenster.positionY = Math.min(
        Math.max(0, this.wuerfelBeutelFenster.positionY || 0),
        maxY,
      );
    },
    wuerfelBeutelBeiViewportResize() {
      this.wuerfelBeutelStelleSichtbar();
      if (this.wuerfelBeutelOffen) {
        this.speichereWuerfelBeutelFenster();
      }
    },
    wuerfelBeutelStarteZiehen(event) {
      if (this.wuerfelBeutelFenster.istVollbild || event.target.closest('button, a, input, textarea, select')) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.wuerfelBeutelFensterRef;
      if (!fenster) {
        return;
      }
      const rect = fenster.getBoundingClientRect();
      this.wuerfelBeutelFenster.ziehenAktiv = true;
      this.wuerfelBeutelFenster.ziehOffsetX = event.clientX - rect.left;
      this.wuerfelBeutelFenster.ziehOffsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', this.wuerfelBeutelBeimZiehen);
      window.addEventListener('pointerup', this.wuerfelBeutelBeendeZiehen);
      window.addEventListener('pointercancel', this.wuerfelBeutelBeendeZiehen);
      event.preventDefault();
    },
    wuerfelBeutelBeimZiehen(event) {
      if (!this.wuerfelBeutelFenster.ziehenAktiv || this.wuerfelBeutelFenster.istVollbild) {
        return;
      }
      const fenster = this.$refs.wuerfelBeutelFensterRef;
      if (!fenster) {
        return;
      }
      const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
      this.wuerfelBeutelFenster.positionX = Math.min(
        Math.max(0, event.clientX - this.wuerfelBeutelFenster.ziehOffsetX),
        maxX,
      );
      this.wuerfelBeutelFenster.positionY = Math.min(
        Math.max(0, event.clientY - this.wuerfelBeutelFenster.ziehOffsetY),
        maxY,
      );
    },
    wuerfelBeutelBeendeZiehen() {
      this.wuerfelBeutelFenster.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.wuerfelBeutelBeimZiehen);
      window.removeEventListener('pointerup', this.wuerfelBeutelBeendeZiehen);
      window.removeEventListener('pointercancel', this.wuerfelBeutelBeendeZiehen);
      if (this.wuerfelBeutelOffen) {
        this.speichereWuerfelBeutelFenster();
      }
    },
    wuerfelBeutelStarteResize(event) {
      if (this.wuerfelBeutelFenster.istVollbild) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.wuerfelBeutelFensterRef;
      if (!fenster) {
        return;
      }
      this.wuerfelBeutelFenster.resizeAktiv = true;
      this.wuerfelBeutelFenster.resizeStartX = event.clientX;
      this.wuerfelBeutelFenster.resizeStartY = event.clientY;
      this.wuerfelBeutelFenster.resizeStartBreite =
        this.wuerfelBeutelFenster.breite != null ? this.wuerfelBeutelFenster.breite : fenster.offsetWidth;
      this.wuerfelBeutelFenster.resizeStartHoehe =
        this.wuerfelBeutelFenster.hoehe != null ? this.wuerfelBeutelFenster.hoehe : fenster.offsetHeight;
      window.addEventListener('pointermove', this.wuerfelBeutelBeimResize);
      window.addEventListener('pointerup', this.wuerfelBeutelBeendeResize);
      window.addEventListener('pointercancel', this.wuerfelBeutelBeendeResize);
      event.preventDefault();
    },
    wuerfelBeutelBeimResize(event) {
      if (!this.wuerfelBeutelFenster.resizeAktiv || this.wuerfelBeutelFenster.istVollbild) {
        return;
      }
      const groesse = this.wuerfelBeutelBegrenzeGroesse(
        this.wuerfelBeutelFenster.resizeStartBreite + (event.clientX - this.wuerfelBeutelFenster.resizeStartX),
        this.wuerfelBeutelFenster.resizeStartHoehe + (event.clientY - this.wuerfelBeutelFenster.resizeStartY),
      );
      this.wuerfelBeutelFenster.breite = groesse.breite;
      this.wuerfelBeutelFenster.hoehe = groesse.hoehe;
      this.wuerfelBeutelStelleSichtbar();
    },
    wuerfelBeutelBeendeResize() {
      this.wuerfelBeutelFenster.resizeAktiv = false;
      window.removeEventListener('pointermove', this.wuerfelBeutelBeimResize);
      window.removeEventListener('pointerup', this.wuerfelBeutelBeendeResize);
      window.removeEventListener('pointercancel', this.wuerfelBeutelBeendeResize);
      if (this.wuerfelBeutelOffen) {
        this.speichereWuerfelBeutelFenster();
      }
    },
    atmosphaereBadgeOeffnen() {
      this.wuerfelModalOeffnen('atmosphaere');
    },
    sicherheitsmechanismenOeffnen() {
      this.sicherheitsmechanismenModalOffen = true;
    },
    sichereSicherheitsmechanismen(neueWerte) {
      const kontext = this.aktiverCharakterKontext;
      if (!kontext || typeof kontext.getCharakter !== 'function') {
        return;
      }
      const charakter = kontext.getCharakter();
      if (!charakter || typeof charakter !== 'object') {
        return;
      }
      charakter.sicherheitsmechanismen = {
        tabuHtml: typeof neueWerte?.tabuHtml === 'string' ? neueWerte.tabuHtml : '',
        schleierHtml: typeof neueWerte?.schleierHtml === 'string' ? neueWerte.schleierHtml : '',
        buttonEmoji:
          typeof neueWerte?.buttonEmoji === 'string' && neueWerte.buttonEmoji.trim()
            ? neueWerte.buttonEmoji.trim()
            : '🚩',
      };
      if (typeof kontext.speichern === 'function') {
        kontext.speichern();
      }
    },
    badgeZiehenStart(e) {
      if (e.button != null && e.button !== 0) {
        return;
      }
      const el = this.$refs.atmosphaereBadgeEl;
      if (!el) {
        return;
      }
      e.preventDefault();
      const r = el.getBoundingClientRect();
      this._badgeDrag = {
        captureEl: e.target,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseLeft: r.left,
        baseTop: r.top,
      };
      const move = (ev) => this.badgeZiehenMove(ev);
      const up = (ev) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        this.badgeZiehenEnd();
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        /* optional */
      }
    },
    badgeZiehenMove(e) {
      const d = this._badgeDrag;
      if (!d) {
        return;
      }
      e.preventDefault();
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const el = this.$refs.atmosphaereBadgeEl;
      const w = el ? el.offsetWidth : 120;
      const h = el ? el.offsetHeight : 80;
      let left = d.baseLeft + dx;
      let top = d.baseTop + dy;
      const pad = 6;
      const maxL = Math.max(pad, window.innerWidth - w - pad);
      const maxT = Math.max(pad, window.innerHeight - h - pad);
      left = Math.min(maxL, Math.max(pad, left));
      top = Math.min(maxT, Math.max(pad, top));
      this.badgePos = { mode: 'fixed', left, top };
    },
    badgeZiehenEnd() {
      const d = this._badgeDrag;
      if (d && d.captureEl && d.pointerId != null) {
        try {
          d.captureEl.releasePointerCapture(d.pointerId);
        } catch {
          /* optional */
        }
      }
      this._badgeDrag = null;
      window.HTBAH.speichereAtmosphaereBadgePosition(this.badgePos);
    },
    setzeWuerfelModus(modus) {
      this.wuerfelModus = modus === 'w100' ? 'w100' : 'w10';
      this.ergebnisse = [];
    },
    wuerfelAudioPersistiere() {
      window.HTBAH.setzeWuerfelAudioProfil({
        stumm: this.wuerfelAudioStumm,
        lautstaerke: this.wuerfelAudioLautstaerke,
      });
    },
    wuerfelAudioStummToggle() {
      this.wuerfelAudioStumm = !this.wuerfelAudioStumm;
      this.wuerfelAudioPersistiere();
    },
    wuerfelAudioSetzeLautstaerkeProzent(istRoh) {
      const n = Math.max(0, Math.min(100, Math.round(Number(istRoh) || 0)));
      this.wuerfelAudioLautstaerke = n / 100;
      this.wuerfelAudioPersistiere();
    },
    async wuerfeln() {
      const notation = this.baueDiceNotation();
      const wuerfelAnzahl =
        this.wuerfelModus === 'w100'
          ? Math.max(1, Math.min(50, Number(this.anzahlW100) || 1))
          : Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
      if (!this.dice3dAktiv) {
        this.diceFehler = '';
        if (this.wuerfelModus === 'w100') {
          const anzahl100 = Math.max(1, Math.min(50, Number(this.anzahlW100) || 1));
          this.anzahlW100 = anzahl100;
          this.ergebnisse = Array.from({ length: anzahl100 }, () => window.HTBAH.wuerfelW100());
        } else {
          const anzahl10 = Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
          this.anzahlW10 = anzahl10;
          this.ergebnisse = Array.from({ length: anzahl10 }, () => window.HTBAH.wuerfelW10());
        }
        window.HTBAH.spieleWuerfelSounds(this.ergebnisse.length);
        return;
      }
      window.HTBAH.spieleWuerfelSounds(wuerfelAnzahl);
      const box = await Promise.race([
        this.stelleDiceBoxBereit(),
        this.warte(HTBAH_DICE_INIT_TIMEOUT_MS).then(() => '__timeout__'),
      ]);
      if (box === '__timeout__') {
        this.diceFehler = '3D-Würfel initialisieren zu langsam. Standard-Wurf bleibt aktiv.';
      }
      if (box && this.diceReady && typeof box.roll === 'function') {
        try {
          const rolled = await box.roll(notation, {
            themeColor: this.diceThemeColor,
          });
          const extrahiert = this.ergebnisseAusDiceRoll(rolled);
          if (extrahiert.length > 0) {
            this.ergebnisse = extrahiert;
            return;
          }
        } catch {
          // Fallback unten bleibt aktiv.
        }
      }
      if (this.wuerfelModus === 'w100') {
        const anzahl100 = Math.max(1, Math.min(50, Number(this.anzahlW100) || 1));
        this.anzahlW100 = anzahl100;
        this.ergebnisse = Array.from({ length: anzahl100 }, () => window.HTBAH.wuerfelW100());
      } else {
        const anzahl10 = Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
        this.anzahlW10 = anzahl10;
        this.ergebnisse = Array.from({ length: anzahl10 }, () => window.HTBAH.wuerfelW10());
      }
    },
    begegnungMediumIstBild(medium) {
      if (!medium || typeof medium !== 'object') {
        return false;
      }
      if (medium.typ === 'bild') {
        return true;
      }
      if (typeof medium.mimeType === 'string' && medium.mimeType.startsWith('image/')) {
        return true;
      }
      return typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/');
    },
    begegnungMedienAusZeile(row) {
      return row && Array.isArray(row.medien) ? row.medien : [];
    },
    begegnungMedienBilder(row) {
      return this.begegnungMedienAusZeile(row).filter((m) => this.begegnungMediumIstBild(m));
    },
    begegnungMedienDateien(row) {
      return this.begegnungMedienAusZeile(row).filter((m) => !this.begegnungMediumIstBild(m));
    },
    begegnungMediumDateiname(medium) {
      if (!medium) {
        return 'Datei';
      }
      const text = String(medium.name || '').trim();
      if (text) {
        return text;
      }
      return this.begegnungMediumIstBild(medium) ? 'Bild' : 'Datei';
    },
    begegnungZeileWert(wert) {
      const raw = wert == null ? '' : String(wert).trim();
      if (!raw) {
        return '—';
      }
      if (raw.includes('<') && raw.includes('>')) {
        const t = htbahBegegnungStripHtmlText(raw);
        return t || '—';
      }
      return raw;
    },
    begegnungRichTextHtml(html) {
      const inhalt = typeof html === 'string' ? html : '';
      return htbahBegegnungStripHtmlText(inhalt) ? inhalt : '';
    },
    begegnungNpcWaffenWerteText(row) {
      const schadenswert = String(row && row.schadenswert ? row.schadenswert : '').trim();
      const kampfart = row && row.kampfart === 'fernkampf' ? 'Fernkampf' : 'Nahkampf';
      if (!schadenswert) {
        return '—';
      }
      return `Schaden ${schadenswert} · ${kampfart}`;
    },
    begegnungBestieEpocheLabel(epoche) {
      if (epoche === 'gegenwart') {
        return 'Gegenwart';
      }
      if (epoche === 'zukunft') {
        return 'Zukunft';
      }
      return 'Mittelalter';
    },
    begegnungBestieKategorieLabel(kategorie) {
      if (kategorie === 'fantasy_tier') {
        return 'Magisch / Fantasy';
      }
      if (kategorie === 'mutiert') {
        return 'Mutiert';
      }
      if (kategorie === 'monster') {
        return 'Monster';
      }
      return 'Normales Tier';
    },
    begegnungBestieAggressivitaetText(row) {
      const n = row && Number(row.aggressivitaetSkala);
      if (!Number.isFinite(n)) {
        return '—';
      }
      const k = Math.min(10, Math.max(1, Math.round(n)));
      return `${k} / 10`;
    },
    begegnungZiehen() {
      const { npcs, bestien, pantheon } = this.begegnungListenAusSpeicher;
      const canNpc = npcs.length > 0;
      const canBestie = bestien.length > 0;
      const canPantheon = pantheon.length > 0;
      if (!canNpc && !canBestie && !canPantheon) {
        this.begegnungZiehung = null;
        return;
      }
      const rar = Math.floor(Math.random() * 10000) + 1;
      if (canPantheon && rar <= 50 && (canNpc || canBestie)) {
        this.begegnungZiehung = {
          typ: 'pantheon',
          zeile: pantheon[Math.floor(Math.random() * pantheon.length)],
        };
        return;
      }
      if (canNpc && canBestie) {
        if (Math.random() < 0.5) {
          this.begegnungZiehung = {
            typ: 'npc',
            zeile: npcs[Math.floor(Math.random() * npcs.length)],
          };
        } else {
          this.begegnungZiehung = {
            typ: 'bestie',
            zeile: bestien[Math.floor(Math.random() * bestien.length)],
          };
        }
        return;
      }
      if (canNpc) {
        this.begegnungZiehung = {
          typ: 'npc',
          zeile: npcs[Math.floor(Math.random() * npcs.length)],
        };
        return;
      }
      if (canBestie) {
        this.begegnungZiehung = {
          typ: 'bestie',
          zeile: bestien[Math.floor(Math.random() * bestien.length)],
        };
        return;
      }
      this.begegnungZiehung = {
        typ: 'pantheon',
        zeile: pantheon[Math.floor(Math.random() * pantheon.length)],
      };
    },
  },
  template: `
    <teleport to="body">
      <div
        v-if="zeigeNav"
        ref="navbarFixedEl"
        class="navbar-fixed">
        <div class="htbah-top-nav-desktop d-none d-lg-flex align-items-center">
          <router-link to="/" title="Startseite" class="htbah-top-nav-logo">
            <img src="assets/img/htbah-begleit-app-logo.png" alt="How To Be A Hero Begleit-App" />
          </router-link>
          <div class="htbah-top-nav-menu d-flex align-items-center gap-1">
            <router-link
              to="/"
              title="App-Startseite (Rollenwahl)"
              class="htbah-nav-item"
              :class="{ 'router-link-active': startseiteLandingAktiv }">
              <span class="htbah-nav-item-emoji" aria-hidden="true">🏠</span>
              <span class="htbah-nav-item-label">Start</span>
            </router-link>
            <template v-if="rolle === 'charakter'">
              <router-link
                :to="charakterLink"
                title="Charakter (Session Zero, aktives Spiel, Nachbereitung)"
                class="htbah-nav-item"
                :class="{ 'router-link-active': charakterAktiv }">
                <span class="htbah-nav-item-emoji" aria-hidden="true">🧙</span>
                <span class="htbah-nav-item-label">Charakter</span>
              </router-link>
            </template>
            <template v-else-if="rolle === 'spielleitung'">
              <router-link
                to="/spielleiter"
                title="Gruppen"
                class="htbah-nav-item"
                :class="{ 'router-link-active': spielleiterGruppenAktiv }">
                <span class="htbah-nav-item-emoji" aria-hidden="true">👥</span>
                <span class="htbah-nav-item-label">Gruppen</span>
              </router-link>
              <router-link
                to="/faehigkeiten-presets"
                title="Fähigkeiten-Presets"
                class="htbah-nav-item"
                :class="{ 'router-link-active': presetVerwaltungAktiv }">
                <span class="htbah-nav-item-emoji" aria-hidden="true">📦</span>
                <span class="htbah-nav-item-label">Presets</span>
              </router-link>
              <router-link
                to="/weltenbau"
                title="Weltenbau"
                class="htbah-nav-item"
                :class="{ 'router-link-active': weltenbauAktiv }">
                <span class="htbah-nav-item-emoji" aria-hidden="true">🗺️</span>
                <span class="htbah-nav-item-label">Weltenbau</span>
              </router-link>
              <button type="button" title="Abenteuerbuch" class="htbah-nav-item" @click="abenteuerbuchOeffnen">
                <span class="htbah-nav-item-emoji" aria-hidden="true">📔</span>
                <span class="htbah-nav-item-label">Abenteuerbuch</span>
              </button>
            </template>
            <button type="button" title="Regelwerk" class="htbah-nav-item" @click="regelwerkOeffnen">
              <span class="htbah-nav-item-emoji" aria-hidden="true">📜</span>
              <span class="htbah-nav-item-label">Regelwerk</span>
            </button>
            <button
              type="button"
              title="Würfel"
              class="htbah-nav-item"
              :class="{ 'htbah-nav-button-active': wuerfelNavAktiv }"
              @click="wuerfelModalOeffnen('wuerfel')">
              <span class="htbah-nav-item-emoji" aria-hidden="true">🎲</span>
              <span class="htbah-nav-item-label">Würfel</span>
            </button>
            <router-link
              to="/einstellungen"
              title="Einstellungen"
              class="htbah-nav-item"
              :class="{ 'router-link-active': einstellungenAktiv }">
              <span class="htbah-nav-item-emoji" aria-hidden="true">⚙️</span>
              <span class="htbah-nav-item-label">Einstellungen</span>
            </router-link>
          </div>
        </div>

        <div class="htbah-bottom-nav-inner d-flex d-lg-none flex-nowrap align-items-stretch w-100 px-2 py-2">
          <template v-if="rolle === 'charakter'">
            <router-link
              to="/"
              title="App-Startseite (Rollenwahl)"
              :class="{ 'router-link-active': startseiteLandingAktiv }">
              🏠
            </router-link>
            <router-link
              :to="charakterLink"
              title="Charakter (Session Zero, aktives Spiel, Nachbereitung)"
              :class="{ 'router-link-active': charakterAktiv }">
              🧙
            </router-link>
          </template>
          <template v-else-if="rolle === 'spielleitung'">
            <router-link
              to="/"
              title="App-Startseite (Rollenwahl)"
              :class="{ 'router-link-active': startseiteLandingAktiv }">
              🏠
            </router-link>
            <router-link
              to="/spielleiter"
              title="Gruppen"
              :class="{ 'router-link-active': spielleiterGruppenAktiv }">
              👥
            </router-link>
            <router-link
              to="/faehigkeiten-presets"
              title="Fähigkeiten-Presets"
              :class="{ 'router-link-active': presetVerwaltungAktiv }">
              📦
            </router-link>
            <router-link
              to="/weltenbau"
              title="Weltenbau"
              :class="{ 'router-link-active': weltenbauAktiv }">
              🗺️
            </router-link>
            <button type="button" title="Abenteuerbuch" @click="abenteuerbuchOeffnen">
              📔
            </button>
          </template>
          <button type="button" title="Regelwerk" @click="regelwerkOeffnen">📜</button>
          <button
            type="button"
            title="Würfel"
            :class="{ 'htbah-nav-button-active': wuerfelNavAktiv }"
            @click="wuerfelModalOeffnen('wuerfel')">
            🎲
          </button>
          <router-link
            to="/einstellungen"
            title="Einstellungen"
            :class="{ 'router-link-active': einstellungenAktiv }">
            ⚙️
          </router-link>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="sicherheitsButtonAnzeigen" class="htbah-sicherheits-fab-stack">
        <button
          type="button"
          class="htbah-sicherheits-fab"
          title="Sicherheitsmechanismen (Session Zero)"
          aria-label="Sicherheitsmechanismen öffnen"
          @click="sicherheitsmechanismenOeffnen">
          {{ sicherheitsButtonEmoji }}
        </button>
      </div>
    </teleport>

    <teleport to="body">
      <div
        v-if="zeigeNav && istSpielleitung"
        ref="atmosphaereBadgeEl"
        class="htbah-atmosphaere-badge"
        :class="{ 'htbah-atmosphaere-badge--custom-pos': badgePos && badgePos.mode === 'fixed' }"
        :style="atmosphaereBadgeCombinedStyle">
        <div
          class="htbah-atmosphaere-badge__drag"
          title="Ziehen zum Verschieben"
          aria-label="Wetter-Badge verschieben"
          @pointerdown="badgeZiehenStart">
          ⠿
        </div>
        <button
          type="button"
          class="htbah-atmosphaere-badge__tap"
          title="Wetter &amp; Tageszeit (Würfelbeutel)"
          @click="atmosphaereBadgeOeffnen">
          <template v-if="atmosphaereHatWerte">
            <span class="htbah-atmosphaere-badge__line">
              <span class="htbah-atmosphaere-badge__emoji">{{ atmosphaere.jahreszeitEmoji || '📅' }}</span>
              <span class="htbah-atmosphaere-badge__txt">{{ atmosphaere.jahreszeitLabel || '—' }}</span>
            </span>
            <span class="htbah-atmosphaere-badge__line">
              <span class="htbah-atmosphaere-badge__emoji">{{ atmosphaere.niederschlagEmoji || '🌤️' }}</span>
              <span class="htbah-atmosphaere-badge__txt">{{ atmosphaere.temperatur || '—' }}, {{ atmosphaere.niederschlagLabel || '—' }}</span>
            </span>
            <span class="htbah-atmosphaere-badge__line">
              <span class="htbah-atmosphaere-badge__emoji">{{ atmosphaere.tageszeitEmoji || '🕐' }}</span>
              <span class="htbah-atmosphaere-badge__txt">{{ atmosphaere.tageszeitLabel || '—' }}</span>
            </span>
          </template>
          <template v-else>
            <span class="htbah-atmosphaere-badge__line htbah-atmosphaere-badge__hint">🌤️ Wetter würfeln</span>
          </template>
        </button>
      </div>
    </teleport>

    <sicherheitsmechanismen-modal
      :offen="sicherheitsmechanismenModalOffen"
      :wert="aktiveSicherheitsmechanismen"
      :nur-lesen="sicherheitsmodalNurLesen"
      @update:offen="sicherheitsmechanismenModalOffen = $event"
      @update:wert="sichereSicherheitsmechanismen" />

    <teleport to="body">
      <div
        v-if="wuerfelBeutelOffen"
        class="regelwerk-modal-layer htbah-wuerfel-beutel-layer"
        role="presentation">
        <div
          ref="wuerfelBeutelFensterRef"
          class="regelwerk-modal-window card shadow htbah-wuerfel-beutel-window"
          :style="wuerfelBeutelFensterStil"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wuerfelModalLabel"
          tabindex="-1">
          <div
            class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
            @pointerdown="wuerfelBeutelStarteZiehen($event)">
            <h5 class="modal-title d-flex align-items-center gap-2 mb-0" id="wuerfelModalLabel">
              <span aria-hidden="true">🎲</span>
              Würfelbeutel
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Schließen"
              @click="wuerfelBeutelSchliessen"></button>
          </div>
          <div class="flex-grow-1 min-h-0 overflow-auto px-3 py-2">
              <ul v-if="istSpielleitung" class="nav nav-tabs mb-3" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: wuerfelModalTab === 'wuerfel' }"
                    @click="wuerfelModalTab = 'wuerfel'">
                    Würfel
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: wuerfelModalTab === 'atmosphaere' }"
                    @click="wuerfelModalTab = 'atmosphaere'">
                    Wetter &amp; Tageszeit
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: wuerfelModalTab === 'begegnung' }"
                    @click="wuerfelModalTab = 'begegnung'">
                    Begegnung
                  </button>
                </li>
              </ul>

              <div v-show="wuerfelModalTab === 'wuerfel'">
                <div class="btn-group w-100 mb-3" role="group" aria-label="Würfelmodus">
                  <button
                    type="button"
                    class="btn"
                    :class="wuerfelModus === 'w10' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setzeWuerfelModus('w10')">
                    x W10
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="wuerfelModus === 'w100' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setzeWuerfelModus('w100')">
                    1x W100
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-1"
                    data-bs-toggle="collapse"
                    data-bs-target="#htbah-wuerfel-einstellungen"
                    aria-expanded="false"
                    aria-controls="htbah-wuerfel-einstellungen">
                    <span class="material-symbols-outlined" aria-hidden="true">tune</span>
                    Einstellungen
                  </button>
                </div>
                <div class="collapse mb-3" id="htbah-wuerfel-einstellungen">
                  <div class="card border-0 bg-body-tertiary">
                    <div class="card-body py-2">
                      <div class="form-check form-switch mb-3">
                        <input
                          id="htbah-dice-3d-toggle"
                          class="form-check-input"
                          type="checkbox"
                          role="switch"
                          v-model="dice3dAktiv" />
                        <label class="form-check-label" for="htbah-dice-3d-toggle">
                          3D Würfel anzeigen
                        </label>
                      </div>
                      <div class="d-flex align-items-center gap-2 flex-wrap pt-2 border-top border-secondary border-opacity-25">
                        <span class="small text-secondary text-nowrap">Klang</span>
                        <input
                          type="range"
                          class="form-range flex-grow-1 m-0 htbah-wuerfel-audio-range"
                          min="0"
                          max="100"
                          step="1"
                          :disabled="wuerfelAudioStumm"
                          :value="wuerfelAudioLautProzent"
                          @input="wuerfelAudioSetzeLautstaerkeProzent($event.target.value)"
                          :aria-valuenow="wuerfelAudioLautProzent"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-label="Würfelklang Lautstärke" />
                        <span class="small text-secondary tabular-nums text-nowrap" style="min-width: 2.5rem">
                          {{ wuerfelAudioLautProzent }}%
                        </span>
                        <button
                          type="button"
                          class="btn btn-outline-secondary btn-sm px-2 py-0 flex-shrink-0"
                          :title="wuerfelAudioStumm ? 'Ton an' : 'Stumm'"
                          :aria-pressed="wuerfelAudioStumm ? 'true' : 'false'"
                          :aria-label="wuerfelAudioStumm ? 'Ton einschalten' : 'Stumm schalten'"
                          @click="wuerfelAudioStummToggle">
                          <span
                            class="material-symbols-outlined htbah-wuerfel-audio-mute-ico"
                            aria-hidden="true">
                            {{ wuerfelAudioStumm ? 'volume_off' : 'volume_up' }}
                          </span>
                        </button>
                      </div>
                      <div class="row g-2" v-if="dice3dAktiv">
                        <div class="col-12">
                          <label class="form-label small mb-1" for="htbah-dice-color">Würfelfarbe</label>
                          <input
                            id="htbah-dice-color"
                            type="color"
                            class="form-control form-control-color w-100 htbah-dice-color-input"
                            v-model="diceThemeColor" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mb-3" v-if="wuerfelModus === 'w10'">
                  <div class="form-floating">
                    <input
                      id="nav-anzahl-w10"
                      type="number"
                      class="form-control"
                      min="1"
                      max="50"
                      v-model.number="anzahlW10"
                      placeholder=" " />
                    <label for="nav-anzahl-w10">Anzahl W10</label>
                  </div>
                </div>
                <div class="mb-3" v-else>
                  <div class="form-floating">
                    <input
                      id="nav-anzahl-w100"
                      type="number"
                      class="form-control"
                      min="1"
                      max="50"
                      v-model.number="anzahlW100"
                      placeholder=" " />
                    <label for="nav-anzahl-w100">Anzahl W100</label>
                  </div>
                </div>
                <div class="mb-3">
                  <icon-text-button
                    type="button"
                    class="btn btn-primary w-100 htbah-wuerfeln-btn"
                    icon="casino"
                    @click="wuerfeln">
                    Würfeln
                  </icon-text-button>
                </div>

                <div class="card p-3 shadow-sm mb-2">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <h6 class="mb-0">{{ ergebnisTitel }}</h6>
                    <span
                      class="badge"
                      :class="wuerfelModus === 'w10' ? 'text-bg-primary' : 'text-bg-success'"
                      v-if="wuerfelModus === 'w10' && ergebnisse.length">
                      Summe: {{ ergebnisSumme }}
                    </span>
                  </div>
                  <div class="htbah-dice-box-wrap mb-2" v-show="dice3dAktiv">
                    <div id="htbah-dice-box" ref="diceBoxElement" class="htbah-dice-box"></div>
                  </div>
                  <small v-if="diceFehler" class="text-warning d-block mb-2">{{ diceFehler }}</small>
                  <div class="d-flex flex-wrap gap-2" v-if="ergebnisse.length">
                    <span
                      class="wuerfel-ergebnis-chip"
                      :class="wuerfelModus === 'w10' ? 'wuerfel-ergebnis-chip-w10' : 'wuerfel-ergebnis-chip-w100'"
                      v-for="(wert, index) in ergebnisse"
                      :key="wuerfelModus + '-' + index">
                      <template v-if="wuerfelModus === 'w10'">
                        #{{ index + 1 }}: {{ wert }}
                      </template>
                      <template v-else>
                        {{ wert }}
                      </template>
                    </span>
                  </div>
                  <small v-else>Noch kein Wurf.</small>
                </div>
              </div>

              <div v-if="istSpielleitung" v-show="wuerfelModalTab === 'atmosphaere'" class="htbah-atmosphaere-modal">
                <div class="d-flex align-items-stretch gap-2 mb-3">
                  <div class="btn-group">
                    <button type="button" class="btn btn-primary" @click="atmosphaereAllesWuerfeln">
                      Alles würfeln
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary dropdown-toggle dropdown-toggle-split"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label="Würfeloption wählen">
                      <span class="visually-hidden">Weitere Optionen</span>
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereAllesWuerfeln">
                          Alles würfeln
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereNurJahreszeit">
                          Nur Jahreszeit
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereNurWetter">
                          Nur Wetter
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereNurTageszeit">
                          Nur Tageszeit
                        </button>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-secondary ms-auto"
                    @click="atmosphaereToggleFormular">
                    {{ atmosphaereFormularOffen ? 'Ausblenden' : 'Selbst bestimmen' }}
                  </button>
                </div>
                <div class="card border-0 shadow-sm mb-3" v-if="atmosphaereHatWerte" v-show="atmosphaereFormularOffen">
                  <div class="card-body">
                    <h6 class="mb-3 fw-bold">Werte bearbeiten</h6>
                    <div class="row g-2">
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-jahreszeit">Jahreszeit</label>
                        <select
                          id="atmo-jahreszeit"
                          class="form-select"
                          :value="atmosphaere.jahreszeitId || ''"
                          @change="atmosphaereSetzeJahreszeit($event.target.value)">
                          <option v-for="o in jahreszeitenOptionen" :key="'jz-' + o.id" :value="o.id">
                            {{ o.emoji }} {{ o.label }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-tageszeit">Tageszeit</label>
                        <select
                          id="atmo-tageszeit"
                          class="form-select"
                          :value="atmosphaere.tageszeitId || ''"
                          @change="atmosphaereSetzeTageszeit($event.target.value)">
                          <option v-for="o in tageszeitenOptionen" :key="'tz-' + o.id" :value="o.id">
                            {{ o.emoji }} {{ o.label }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-temperatur">Temperatur</label>
                        <select
                          id="atmo-temperatur"
                          class="form-select"
                          :value="atmosphaere.temperatur || ''"
                          @change="atmosphaereSetzeTemperatur($event.target.value)">
                          <option v-for="o in temperaturOptionen" :key="'temp-' + o" :value="o">
                            {{ o }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-bewoelkung">Bewölkung</label>
                        <select
                          id="atmo-bewoelkung"
                          class="form-select"
                          :value="atmosphaere.bewoelkung || ''"
                          @change="atmosphaereSetzeBewoelkung($event.target.value)">
                          <option v-for="o in bewoelkungOptionen" :key="'bew-' + o" :value="o">
                            {{ o }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-niederschlag">Niederschlag</label>
                        <select
                          id="atmo-niederschlag"
                          class="form-select"
                          :value="atmosphaere.niederschlagKey || ''"
                          @change="atmosphaereSetzeNiederschlag($event.target.value)">
                          <option v-for="o in niederschlagOptionen" :key="'nied-' + o.key" :value="o.key">
                            {{ o.emoji }} {{ o.label }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-windrichtung">Windrichtung</label>
                        <select
                          id="atmo-windrichtung"
                          class="form-select"
                          :value="aktuelleWindrichtung"
                          @change="atmosphaereSetzeWindrichtung($event.target.value)">
                          <option v-for="o in windrichtungOptionen" :key="'wdir-' + o" :value="o">
                            {{ o }}
                          </option>
                        </select>
                      </div>
                      <div class="col-12">
                        <label class="form-label mb-1 small text-secondary" for="atmo-windstaerke">Windstärke</label>
                        <select
                          id="atmo-windstaerke"
                          class="form-select"
                          :value="aktuelleWindstaerkeBft"
                          @change="atmosphaereSetzeWindstaerke($event.target.value)">
                          <option v-for="o in windstaerkeOptionen" :key="'wst-' + o.bft" :value="o.bft">
                            Beaufort {{ o.bft }} ({{ o.kmh }}) - {{ o.label }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!atmosphaereHatWerte" class="text-secondary small">
                  Noch keine Werte — tippe auf „Alles würfeln“.
                </div>
                <div v-else class="row g-2">
                  <div class="col-md-6">
                    <div class="htbah-atmosphaere-pill shadow-sm" :style="{ background: atmosphaere.jahreszeitFarbe + '33' }">
                      <span class="fs-4 me-2">{{ atmosphaere.jahreszeitEmoji }}</span>
                      <div>
                        <div class="small text-secondary">Jahreszeit</div>
                        <div class="fw-semibold">{{ atmosphaere.jahreszeitLabel }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="htbah-atmosphaere-pill shadow-sm" :style="{ background: (atmosphaere.tageszeitFarbe || '#888') + '33' }">
                      <span class="fs-4 me-2">{{ atmosphaere.tageszeitEmoji }}</span>
                      <div>
                        <div class="small text-secondary">Tageszeit</div>
                        <div class="fw-semibold">{{ atmosphaere.tageszeitLabel }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div
                      class="htbah-atmosphaere-pill htbah-atmosphaere-pill--wetter shadow-sm"
                      :style="{ background: (atmosphaere.wetterAkzentFarbe || atmosphaere.jahreszeitFarbe || '#38bdf8') + '33' }">
                      <span class="fs-4 me-2 flex-shrink-0">{{ atmosphaere.niederschlagEmoji }}</span>
                      <div class="flex-grow-1 min-w-0">
                        <div class="small text-secondary">Wetter</div>
                        <div class="fw-semibold">{{ atmosphaere.temperatur }}</div>
                        <div class="small">{{ atmosphaere.bewoelkung }}</div>
                        <div class="small">{{ atmosphaere.niederschlagLabel }}</div>
                        <div class="small mt-2">
                          <span class="text-secondary">Wind:</span>
                          {{ atmosphaere.wind }}
                        </div>
                        <div class="small">
                          <span class="text-secondary">Windstärke:</span>
                          <span class="fw-medium">{{ atmosphaere.windStaerke }}</span>
                          <span v-if="atmosphaere.windBeaufort" class="text-muted ms-1">
                            (<span class="fst-italic">{{ atmosphaere.windBeaufort }}</span>)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="istSpielleitung"
                v-show="wuerfelModalTab === 'begegnung'"
                class="htbah-begegnung-modal text-start">
                <p class="small text-body-secondary mb-3">
                  Es wird ein zufälliger Eintrag aus den Zufallstabellen gezogen: meist
                  <strong>NPC</strong> oder <strong>Bestie</strong>, in etwa 0,5&nbsp;% der Fälle eine
                  <strong>Gottheit</strong> aus dem Pantheon (nur wenn dort Einträge existieren).
                </p>
                <div v-if="!begegnungHatBegegnungsEintrag" class="alert alert-info mb-0" role="status">
                  Noch keine passenden Einträge. Lege zuerst unter
                  <router-link to="/weltenbau/zufallstabellen" class="alert-link">Zufallstabellen</router-link>
                  mindestens einen NPC, eine Bestie oder eine Gottheit im Pantheon an — sonst kann hier
                  nichts gezogen werden.
                </div>
                <template v-else>
                  <icon-text-button
                    type="button"
                    class="btn btn-primary w-100 mb-3"
                    icon="casino"
                    @click="begegnungZiehen">
                    Begegnung ziehen
                  </icon-text-button>
                  <div
                    v-if="begegnungZiehung"
                    class="card border-0 shadow-sm overflow-hidden">
                    <div
                      class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
                      <span class="fw-semibold text-truncate me-2">{{ begegnungZiehung.zeile.name || 'Ohne Namen' }}</span>
                      <span
                        v-if="begegnungZiehung.typ === 'npc'"
                        class="badge rounded-pill text-bg-primary flex-shrink-0">
                        NPC
                      </span>
                      <span
                        v-else-if="begegnungZiehung.typ === 'bestie'"
                        class="badge rounded-pill text-bg-warning text-dark flex-shrink-0">
                        Bestie
                      </span>
                      <span v-else class="badge rounded-pill text-bg-secondary flex-shrink-0">Pantheon</span>
                    </div>
                    <div class="card-body p-3 htbah-begegnung-ergebnis-body small">
                      <div
                        v-if="begegnungMedienBilder(begegnungZiehung.zeile).length"
                        class="zufallstabellen-mobile-slides mb-3">
                        <div
                          v-for="(bild, bildIndex) in begegnungMedienBilder(begegnungZiehung.zeile)"
                          :key="'bg-bild-' + bild.id + '-' + bildIndex"
                          class="zufallstabellen-mobile-slide">
                          <img :src="bild.dataUrl" :alt="begegnungMediumDateiname(bild)" loading="lazy" />
                        </div>
                      </div>
                      <div v-if="begegnungMedienDateien(begegnungZiehung.zeile).length" class="mb-3">
                        <div class="text-secondary mb-1">Weitere Medien</div>
                        <ul class="mb-0 ps-3">
                          <li v-for="d in begegnungMedienDateien(begegnungZiehung.zeile)" :key="'bg-d-' + d.id">
                            {{ begegnungMediumDateiname(d) }}
                          </li>
                        </ul>
                      </div>

                      <template v-if="begegnungZiehung.typ === 'npc'">
                        <dl class="row mb-0">
                          <dt class="col-sm-4 col-lg-3 text-secondary">Spitzname</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.spitzname) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Geschlecht</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.geschlecht) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Alter</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.alter) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Familienstand</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.familienstand) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Statur</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.statur) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Lebenspunkte</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.lebenspunkte) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Gesinnung</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.gesinnung) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Glaube</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.glaube) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Beruf</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.beruf) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Fraktion</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.fraktion) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Aufenthaltsort</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.aufenthaltsort) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Ziel</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.ziel) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Stimme</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.stimme) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Waffe</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.waffe) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Schaden / Kampfart</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungNpcWaffenWerteText(begegnungZiehung.zeile) }}</dd>
                        </dl>
                        <div v-if="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)" class="mt-2">
                          <div class="text-secondary mb-1">Notizen</div>
                          <div
                            class="zufallstabellen-richtext-vorschau"
                            v-html="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)"></div>
                        </div>
                      </template>

                      <template v-else-if="begegnungZiehung.typ === 'bestie'">
                        <dl class="row mb-0">
                          <dt class="col-sm-4 col-lg-3 text-secondary">Epoche</dt>
                          <dd class="col-sm-8 col-lg-9">
                            {{ begegnungBestieEpocheLabel(begegnungZiehung.zeile.epoche) }}
                          </dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Art</dt>
                          <dd class="col-sm-8 col-lg-9">
                            {{ begegnungBestieKategorieLabel(begegnungZiehung.zeile.kategorie) }}
                          </dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Angriff</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.angriff) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Verteidigung</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.verteidigung) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Lebenspunkte</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.lebenspunkte) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Aggressivität</dt>
                          <dd class="col-sm-8 col-lg-9">
                            {{ begegnungBestieAggressivitaetText(begegnungZiehung.zeile) }}
                          </dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Stärken</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.staerke) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Schwächen</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.schwaeche) }}</dd>
                        </dl>
                        <div v-if="begegnungRichTextHtml(begegnungZiehung.zeile.beschreibungHtml)" class="mt-2">
                          <div class="text-secondary mb-1">Beschreibung</div>
                          <div
                            class="zufallstabellen-richtext-vorschau"
                            v-html="begegnungRichTextHtml(begegnungZiehung.zeile.beschreibungHtml)"></div>
                        </div>
                      </template>

                      <template v-else>
                        <dl class="row mb-0">
                          <dt class="col-sm-4 col-lg-3 text-secondary">Geschlecht</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.geschlecht) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Domäne</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.domaene) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Charakter</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.charakter) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Stärke</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.staerke) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Schwäche</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.schwaeche) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Schutzpatronat</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.schutzpatronat) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Verlangen</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.verlangen) }}</dd>
                          <dt class="col-sm-4 col-lg-3 text-secondary">Mythos-Gaben</dt>
                          <dd class="col-sm-8 col-lg-9">{{ begegnungZeileWert(begegnungZiehung.zeile.mythosGaben) }}</dd>
                        </dl>
                        <div v-if="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)" class="mt-2">
                          <div class="text-secondary mb-1">Notizen</div>
                          <div
                            class="zufallstabellen-richtext-vorschau"
                            v-html="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)"></div>
                        </div>
                      </template>
                    </div>
                  </div>
                  <p v-else class="text-secondary small mb-0">Noch keine Ziehung — tippe auf „Begegnung ziehen“.</p>
                </template>
              </div>
            </div>
            <div class="border-top px-3 py-2 d-flex justify-content-end flex-shrink-0 bg-body-tertiary">
              <button type="button" class="btn btn-secondary" @click="wuerfelBeutelSchliessen">
                Schließen
              </button>
            </div>
            <div class="regelwerk-modal-resize-handle" @pointerdown="wuerfelBeutelStarteResize($event)"></div>
        </div>
      </div>
    </teleport>
  `,
};
