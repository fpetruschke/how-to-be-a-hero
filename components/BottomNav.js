window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
const HTBAH_BEGEGNUNG_UTILS = window.HTBAH_SHARED && window.HTBAH_SHARED.BegegnungUtils;

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

window.HTBAH_KOMPONENTEN.BottomNav = {
  components: {
    WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
  },
  props: ['uiZustand'],
  data() {
    return {
      wuerfelModus: 'w10',
      anzahlW10: 1,
      ergebnisse: [],
      wuerfelModalTab: 'wuerfel',
      atmosphaereFormularOffen: false,
      atmosphaere: {},
      badgePos: null,
      _badgeDrag: null,
      begegnungZiehung: null,
      diceBox: null,
      diceBoxZehner: null,
      diceBoxEiner: null,
      diceReady: false,
      diceReadyZehner: false,
      diceReadyEiner: false,
      dice3dAktiv: window.HTBAH.ladeWuerfelAnzeigeProfil().enabled,
      diceInitPromise: null,
      diceInitPromiseZehner: null,
      diceInitPromiseEiner: null,
      diceModulLadenPromise: null,
      diceFehler: '',
      diceThemeColor: window.HTBAH.ladeWuerfelAnzeigeProfil().theme,
      diceThemeColorOnes: window.HTBAH.ladeWuerfelAnzeigeProfil().themeOnes || window.HTBAH.ladeWuerfelAnzeigeProfil().theme,
      diceThemeColorTens: window.HTBAH.ladeWuerfelAnzeigeProfil().themeTens || '#3b7a36',
      prozentwurfDetails: null,
      letzterWurfAnzahl: 1,
      wuerfelnLaeuft: false,
      wuerfelBeutelOffen: false,
      wuerfelBeutelFenster: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten() },
      wuerfelBeutelAusloeserElement: null,
      musikboardOffen: false,
      musikboardFenster: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten() },
      musikboardAusloeserElement: null,
      sicherheitsmechanismenModalOffen: false,
      _badgeDragMoveHandler: null,
      _badgeDragUpHandler: null,
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
    spielleiterKampagnenAktiv() {
      const p = this.$route.path || '';
      return p === '/spielleiter' || p.startsWith('/spielleiter/kampagne/');
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
    charakterErstellenAktiv() {
      const p = this.$route.path || '';
      return p.startsWith('/charakter/neu');
    },
    charakterLink() {
      const id = window.HTBAH.ladeAktivenCharakterId();
      return id ? `/charakter/${id}/session-zero` : '/charakter/neu/session-zero';
    },
    einstellungenAktiv() {
      const p = this.$route.path || '';
      return p === '/einstellungen' || p.startsWith('/einstellungen/');
    },
    wuerfelNavAktiv() {
      return this.wuerfelBeutelOffen;
    },
    musikNavAktiv() {
      return this.musikboardOffen;
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
    musikboardFensterStil() {
      return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.musikboardFenster);
    },
    wuerfelErgebnisChipStil() {
      return {
        background: `color-mix(in srgb, ${this.diceThemeColor} 20%, transparent)`,
        borderColor: `color-mix(in srgb, ${this.diceThemeColor} 60%, transparent)`,
      };
    },
    prozentwurfBadgeZehnerStil() {
      return {
        background: `color-mix(in srgb, ${this.diceThemeColorTens} 24%, transparent)`,
        borderColor: `color-mix(in srgb, ${this.diceThemeColorTens} 62%, transparent)`,
      };
    },
    prozentwurfBadgeEinerStil() {
      return {
        background: `color-mix(in srgb, ${this.diceThemeColorOnes} 24%, transparent)`,
        borderColor: `color-mix(in srgb, ${this.diceThemeColorOnes} 62%, transparent)`,
      };
    },
    prozentwurfBadgeSummeStil() {
      return {
        background: `color-mix(in srgb, ${this.diceThemeColorOnes} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${this.diceThemeColorTens} 55%, transparent)`,
      };
    },
    wuerfelRolltText() {
      if (this.wuerfelModus === 'w100') {
        return 'Würfel rollen …';
      }
      return Number(this.letzterWurfAnzahl) > 1 ? 'Würfel rollen …' : 'Würfel rollt …';
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
      if (typeof charakter.sicherheitsmechanismen.tabuHtml !== 'string') {
        charakter.sicherheitsmechanismen.tabuHtml = '';
      }
      if (typeof charakter.sicherheitsmechanismen.schleierHtml !== 'string') {
        charakter.sicherheitsmechanismen.schleierHtml = '';
      }
      delete charakter.sicherheitsmechanismen.buttonEmoji;
      return charakter.sicherheitsmechanismen;
    },
    sicherheitsButtonAnzeigen() {
      return (
        this.zeigeNav &&
        !this.charakterErstellenAktiv &&
        (this.rolle === 'spielleitung' || this.rolle === 'charakter')
      );
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
          if (this.wuerfelModus === 'w100') {
            this.stelleProzentwurfDiceBoxesBereit();
          } else {
            this.stelleDiceBoxBereit();
          }
        });
      }
    },
    dice3dAktiv(neu) {
      this.speichereDiceFarbwahl();
      if (neu) {
        this.$nextTick(() => {
          if (this.wuerfelModus === 'w100') {
            this.stelleProzentwurfDiceBoxesBereit();
          } else {
            this.stelleDiceBoxBereit();
          }
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
        window.addEventListener('keydown', this.onWuerfelBeutelKeydown);
        this.$nextTick(() => {
          const fenster = this.$refs.wuerfelBeutelFensterRef;
          if (fenster && typeof fenster.focus === 'function') {
            fenster.focus();
          }
        });
      } else {
        window.removeEventListener('resize', this.wuerfelBeutelBeiViewportResize);
        window.removeEventListener('keydown', this.onWuerfelBeutelKeydown);
        this.wuerfelBeutelBeendeZiehen();
        this.wuerfelBeutelBeendeResize();
        if (this.wuerfelBeutelAusloeserElement && this.wuerfelBeutelAusloeserElement.isConnected) {
          this.wuerfelBeutelAusloeserElement.focus();
        }
        this.wuerfelBeutelAusloeserElement = null;
      }
    },
    musikboardOffen(neu) {
      if (neu) {
        window.addEventListener('resize', this.musikboardBeiViewportResize);
        window.addEventListener('keydown', this.onMusikboardKeydown);
        this.$nextTick(() => {
          const fenster = this.$refs.musikboardFensterRef;
          if (fenster && typeof fenster.focus === 'function') {
            fenster.focus();
          }
        });
      } else {
        window.removeEventListener('resize', this.musikboardBeiViewportResize);
        window.removeEventListener('keydown', this.onMusikboardKeydown);
        this.musikboardBeendeZiehen();
        this.musikboardBeendeResize();
        if (this.musikboardAusloeserElement && this.musikboardAusloeserElement.isConnected) {
          this.musikboardAusloeserElement.focus();
        }
        this.musikboardAusloeserElement = null;
      }
    },
  },
  mounted() {
    this._navReserveObserver = null;
    this.$nextTick(() => this.bindNavReserveObserver());
    this.ladeDiceFarbwahl();
    window.addEventListener('htbah:wuerfel-einstellungen-geaendert', this.onWuerfelEinstellungenGlobalGeaendert);
  },
  beforeUnmount() {
    this.sicherheitsmechanismenModalOffen = false;
    this.unbindNavReserveObserver();
    document.documentElement.style.removeProperty('--htbah-bottom-nav-reserve');
    document.documentElement.style.removeProperty('--htbah-top-nav-reserve');
    this.diceBox = null;
    this.diceBoxZehner = null;
    this.diceBoxEiner = null;
    this.diceReady = false;
    this.diceReadyZehner = false;
    this.diceReadyEiner = false;
    this.diceInitPromise = null;
    this.diceInitPromiseZehner = null;
    this.diceInitPromiseEiner = null;
    this.diceModulLadenPromise = null;
    window.removeEventListener('resize', this.wuerfelBeutelBeiViewportResize);
    window.removeEventListener('keydown', this.onWuerfelBeutelKeydown);
    window.removeEventListener(
      'htbah:wuerfel-einstellungen-geaendert',
      this.onWuerfelEinstellungenGlobalGeaendert,
    );
    window.removeEventListener('resize', this.musikboardBeiViewportResize);
    window.removeEventListener('keydown', this.onMusikboardKeydown);
    this.speichereWuerfelBeutelFenster();
    this.wuerfelBeutelBeendeZiehen();
    this.wuerfelBeutelBeendeResize();
    this.musikboardBeendeZiehen();
    this.musikboardBeendeResize();
    this.badgeZiehenCleanup();
  },
  methods: {
    warte(ms) {
      return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    },
    ladeDiceFarbwahl() {
      const profil = window.HTBAH.ladeWuerfelAnzeigeProfil();
      this.dice3dAktiv = profil.enabled;
      this.diceThemeColorOnes = profil.themeOnes || profil.theme;
      this.diceThemeColorTens = profil.themeTens || '#3b7a36';
      this.diceThemeColor = this.wuerfelModus === 'w100' ? this.diceThemeColorOnes : (profil.themeOnes || profil.theme);
    },
    onWuerfelEinstellungenGlobalGeaendert() {
      this.ladeDiceFarbwahl();
    },
    speichereDiceFarbwahl() {
      window.HTBAH.setzeWuerfelAnzeigeProfil({
        enabled: this.dice3dAktiv,
        theme: this.diceThemeColor,
      });
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
    async stelleProzentwurfDiceBoxesBereit() {
      if (!this.dice3dAktiv) {
        return null;
      }
      if (
        this.diceReadyZehner &&
        this.diceReadyEiner &&
        this.diceBoxZehner &&
        this.diceBoxEiner
      ) {
        return { zehner: this.diceBoxZehner, einer: this.diceBoxEiner };
      }
      const zielZ = this.$refs.diceBoxZehnerElement;
      const zielE = this.$refs.diceBoxEinerElement;
      if (!zielZ || !zielE) {
        return null;
      }
      const DiceBox = await this.ladeDiceBoxKlasse();
      if (!this.diceInitPromiseZehner) {
        this.diceInitPromiseZehner = (async () => {
          const boxZ = new DiceBox('#htbah-dice-box-zehner', {
            assetPath: 'assets/dice-box/assets/',
            origin: HTBAH_APP_ORIGIN,
            theme: 'default',
            themeColor: this.diceThemeColorTens,
            offscreen: true,
            scale: 16,
          });
          await boxZ.init();
          this.diceBoxZehner = Vue.markRaw(boxZ);
          this.diceReadyZehner = true;
          return boxZ;
        })()
          .catch(() => {
            this.diceReadyZehner = false;
            this.diceBoxZehner = null;
            return null;
          })
          .finally(() => {
            this.diceInitPromiseZehner = null;
          });
      }
      if (!this.diceInitPromiseEiner) {
        this.diceInitPromiseEiner = (async () => {
          const boxE = new DiceBox('#htbah-dice-box-einer', {
            assetPath: 'assets/dice-box/assets/',
            origin: HTBAH_APP_ORIGIN,
            theme: 'default',
            themeColor: this.diceThemeColorOnes,
            offscreen: true,
            scale: 16,
          });
          await boxE.init();
          this.diceBoxEiner = Vue.markRaw(boxE);
          this.diceReadyEiner = true;
          return boxE;
        })()
          .catch(() => {
            this.diceReadyEiner = false;
            this.diceBoxEiner = null;
            return null;
          })
          .finally(() => {
            this.diceInitPromiseEiner = null;
          });
      }
      const [z, e] = await Promise.all([this.diceInitPromiseZehner, this.diceInitPromiseEiner]);
      if (!z || !e) {
        return null;
      }
      return { zehner: z, einer: e };
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
        return '1W100+1W10';
      }
      const anzahl10 = Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
      this.anzahlW10 = anzahl10;
      return `${anzahl10}W10`;
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
    normalisiereNotationFuerDiceEngine(notation) {
      return String(notation || '').replace(/[wW]/g, 'd');
    },
    normalisiereD10Digit(roh) {
      const n = Math.round(Number(roh));
      if (!Number.isFinite(n)) return 0;
      if (n >= 1 && n <= 10) return n % 10;
      if (n >= 0 && n <= 9) return n;
      return ((n % 10) + 10) % 10;
    },
    normalisiereZehnerWert(roh) {
      const n = Math.round(Number(roh));
      if (!Number.isFinite(n)) return 0;
      if (n >= 0 && n <= 90 && n % 10 === 0) return n;
      if (n === 100) return 0;
      if (n >= 1 && n <= 10) return (n % 10) * 10;
      const digit = ((n % 10) + 10) % 10;
      return digit * 10;
    },
    baueProzentwurfAusZweiW10(werte) {
      const arr = Array.isArray(werte) ? werte : [];
      const zehnerWert = this.normalisiereZehnerWert(arr[0]);
      const einerDigit = this.normalisiereD10Digit(arr[1]);
      const rohGesamt = zehnerWert + einerDigit;
      return {
        zehnerWert,
        einerDigit,
        summe: rohGesamt === 0 ? 100 : rohGesamt,
      };
    },
    async rolleProzentwurf3d() {
      const rollMitTimeout = async (boxInstanz, notation, themeColor, timeoutMs = 6000) =>
        Promise.race([
          boxInstanz.roll(this.normalisiereNotationFuerDiceEngine(notation), { themeColor }),
          this.warte(timeoutMs).then(() => '__timeout__'),
        ]);
      const prozentBoxes = await this.stelleProzentwurfDiceBoxesBereit();
      if (!prozentBoxes || !prozentBoxes.zehner || !prozentBoxes.einer) {
        this.diceFehler = '3D-Prozentwurf konnte nicht initialisiert werden. Fallback aktiv.';
        return [];
      }
      try {
        const [zRoll, eRoll] = await Promise.all([
          rollMitTimeout(prozentBoxes.zehner, '1W100', this.diceThemeColorTens),
          rollMitTimeout(prozentBoxes.einer, '1W10', this.diceThemeColorOnes),
        ]);
        if (zRoll === '__timeout__' || eRoll === '__timeout__') {
          this.diceFehler = '3D-Prozentwurf dauerte zu lange. Fallback aktiv.';
          return [];
        }
        const zArr = this.ergebnisseAusDiceRoll(zRoll);
        const eArr = this.ergebnisseAusDiceRoll(eRoll);
        if (zArr.length && eArr.length) {
          return [zArr[0], eArr[0]];
        }
      } catch {
        this.diceFehler = '3D-Prozentwurf fehlgeschlagen. Fallback aktiv.';
      }
      return [];
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
      this.wuerfelBeutelAusloeserElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.ladeDiceFarbwahl();
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
    onWuerfelBeutelKeydown(event) {
      if (!this.wuerfelBeutelOffen || !event || event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      this.wuerfelBeutelSchliessen();
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
      const v = this.wuerfelBeutelErmittleViewport();
      const istDesktop = v.viewportBreite >= 992;
      if (this.wuerfelBeutelFenster.breite == null || this.wuerfelBeutelFenster.hoehe == null) {
        const initialBreite = istDesktop ? fenster.offsetWidth : Math.max(300, v.viewportBreite - 16);
        const initialHoehe = istDesktop ? 650 : fenster.offsetHeight;
        const groesse = this.wuerfelBeutelBegrenzeGroesse(initialBreite, initialHoehe);
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
    musikboardOeffnen() {
      this.musikboardAusloeserElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.musikboardOffen = true;
      this.$nextTick(() => this.musikboardInitialisierePosition());
    },
    musikboardSchliessen() {
      this.musikboardOffen = false;
    },
    onMusikboardKeydown(event) {
      if (!this.musikboardOffen || !event || event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      this.musikboardSchliessen();
    },
    musikboardErmittleViewport() {
      return window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
    },
    musikboardBegrenzeGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 360, 280);
    },
    musikboardInitialisierePosition() {
      const fenster = this.$refs.musikboardFensterRef;
      if (!fenster) {
        return;
      }
      const v = this.musikboardErmittleViewport();
      const istDesktop = v.viewportBreite >= 992;
      if (this.musikboardFenster.breite == null || this.musikboardFenster.hoehe == null) {
        const initialBreite = istDesktop ? fenster.offsetWidth : Math.max(320, v.viewportBreite - 16);
        const initialHoehe = istDesktop ? 620 : fenster.offsetHeight;
        const groesse = this.musikboardBegrenzeGroesse(initialBreite, initialHoehe);
        this.musikboardFenster.breite = groesse.breite;
        this.musikboardFenster.hoehe = groesse.hoehe;
      } else {
        const groesse = this.musikboardBegrenzeGroesse(
          this.musikboardFenster.breite,
          this.musikboardFenster.hoehe,
        );
        this.musikboardFenster.breite = groesse.breite;
        this.musikboardFenster.hoehe = groesse.hoehe;
      }
      if (this.musikboardFenster.positionX == null || this.musikboardFenster.positionY == null) {
        this.musikboardFenster.positionX = Math.max(
          0,
          Math.round((v.viewportBreite - this.musikboardFenster.breite) / 2),
        );
        this.musikboardFenster.positionY = Math.max(
          0,
          Math.round((v.viewportHoehe - this.musikboardFenster.hoehe) / 2),
        );
      }
      this.musikboardStelleSichtbar();
    },
    musikboardStelleSichtbar() {
      if (this.musikboardFenster.istVollbild) {
        return;
      }
      if (this.musikboardFenster.breite == null || this.musikboardFenster.hoehe == null) {
        return;
      }
      const groesse = this.musikboardBegrenzeGroesse(
        this.musikboardFenster.breite,
        this.musikboardFenster.hoehe,
      );
      this.musikboardFenster.breite = groesse.breite;
      this.musikboardFenster.hoehe = groesse.hoehe;
      const v = this.musikboardErmittleViewport();
      const maxX = Math.max(0, v.viewportBreite - this.musikboardFenster.breite);
      const maxY = Math.max(0, v.viewportHoehe - this.musikboardFenster.hoehe);
      this.musikboardFenster.positionX = Math.min(
        Math.max(0, this.musikboardFenster.positionX || 0),
        maxX,
      );
      this.musikboardFenster.positionY = Math.min(
        Math.max(0, this.musikboardFenster.positionY || 0),
        maxY,
      );
    },
    musikboardBeiViewportResize() {
      this.musikboardStelleSichtbar();
    },
    musikboardStarteZiehen(event) {
      if (this.musikboardFenster.istVollbild || event.target.closest('button, a, input, textarea, select')) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.musikboardFensterRef;
      if (!fenster) {
        return;
      }
      const rect = fenster.getBoundingClientRect();
      this.musikboardFenster.ziehenAktiv = true;
      this.musikboardFenster.ziehOffsetX = event.clientX - rect.left;
      this.musikboardFenster.ziehOffsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', this.musikboardBeimZiehen);
      window.addEventListener('pointerup', this.musikboardBeendeZiehen);
      window.addEventListener('pointercancel', this.musikboardBeendeZiehen);
      event.preventDefault();
    },
    musikboardBeimZiehen(event) {
      if (!this.musikboardFenster.ziehenAktiv || this.musikboardFenster.istVollbild) {
        return;
      }
      const fenster = this.$refs.musikboardFensterRef;
      if (!fenster) {
        return;
      }
      const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
      this.musikboardFenster.positionX = Math.min(
        Math.max(0, event.clientX - this.musikboardFenster.ziehOffsetX),
        maxX,
      );
      this.musikboardFenster.positionY = Math.min(
        Math.max(0, event.clientY - this.musikboardFenster.ziehOffsetY),
        maxY,
      );
    },
    musikboardBeendeZiehen() {
      this.musikboardFenster.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.musikboardBeimZiehen);
      window.removeEventListener('pointerup', this.musikboardBeendeZiehen);
      window.removeEventListener('pointercancel', this.musikboardBeendeZiehen);
    },
    musikboardStarteResize(event) {
      if (this.musikboardFenster.istVollbild) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.musikboardFensterRef;
      if (!fenster) {
        return;
      }
      this.musikboardFenster.resizeAktiv = true;
      this.musikboardFenster.resizeStartX = event.clientX;
      this.musikboardFenster.resizeStartY = event.clientY;
      this.musikboardFenster.resizeStartBreite =
        this.musikboardFenster.breite != null ? this.musikboardFenster.breite : fenster.offsetWidth;
      this.musikboardFenster.resizeStartHoehe =
        this.musikboardFenster.hoehe != null ? this.musikboardFenster.hoehe : fenster.offsetHeight;
      window.addEventListener('pointermove', this.musikboardBeimResize);
      window.addEventListener('pointerup', this.musikboardBeendeResize);
      window.addEventListener('pointercancel', this.musikboardBeendeResize);
      event.preventDefault();
    },
    musikboardBeimResize(event) {
      if (!this.musikboardFenster.resizeAktiv || this.musikboardFenster.istVollbild) {
        return;
      }
      const groesse = this.musikboardBegrenzeGroesse(
        this.musikboardFenster.resizeStartBreite + (event.clientX - this.musikboardFenster.resizeStartX),
        this.musikboardFenster.resizeStartHoehe + (event.clientY - this.musikboardFenster.resizeStartY),
      );
      this.musikboardFenster.breite = groesse.breite;
      this.musikboardFenster.hoehe = groesse.hoehe;
      this.musikboardStelleSichtbar();
    },
    musikboardBeendeResize() {
      this.musikboardFenster.resizeAktiv = false;
      window.removeEventListener('pointermove', this.musikboardBeimResize);
      window.removeEventListener('pointerup', this.musikboardBeendeResize);
      window.removeEventListener('pointercancel', this.musikboardBeendeResize);
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
      };
      if (typeof kontext.speichern === 'function') {
        kontext.speichern();
      }
    },
    badgeZiehenCleanup() {
      if (this._badgeDragMoveHandler) {
        document.removeEventListener('pointermove', this._badgeDragMoveHandler);
        this._badgeDragMoveHandler = null;
      }
      if (this._badgeDragUpHandler) {
        document.removeEventListener('pointerup', this._badgeDragUpHandler);
        document.removeEventListener('pointercancel', this._badgeDragUpHandler);
        this._badgeDragUpHandler = null;
      }
      this.badgeZiehenEnd();
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
      this.badgeZiehenCleanup();
      this._badgeDragMoveHandler = (ev) => this.badgeZiehenMove(ev);
      this._badgeDragUpHandler = () => this.badgeZiehenCleanup();
      document.addEventListener('pointermove', this._badgeDragMoveHandler, { passive: false });
      document.addEventListener('pointerup', this._badgeDragUpHandler);
      document.addEventListener('pointercancel', this._badgeDragUpHandler);
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
      this.prozentwurfDetails = null;
      if (this.dice3dAktiv) {
        this.$nextTick(() => {
          if (this.wuerfelModus === 'w100') {
            this.stelleProzentwurfDiceBoxesBereit();
          } else {
            this.stelleDiceBoxBereit();
          }
        });
      }
    },
    async wuerfeln() {
      if (this.wuerfelnLaeuft) {
        return;
      }
      this.wuerfelnLaeuft = true;
      this.ladeDiceFarbwahl();
      const notation = this.baueDiceNotation();
      const wuerfelAnzahl =
        this.wuerfelModus === 'w100' ? 2 : Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
      this.letzterWurfAnzahl = wuerfelAnzahl;
      try {
        if (!this.dice3dAktiv) {
          this.diceFehler = '';
          if (this.wuerfelModus === 'w100') {
            this.prozentwurfDetails = this.baueProzentwurfAusZweiW10([
              window.HTBAH.wuerfelW10(),
              window.HTBAH.wuerfelW10(),
            ]);
            this.ergebnisse = [this.prozentwurfDetails.summe];
          } else {
            this.prozentwurfDetails = null;
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
            const extrahiert = this.wuerfelModus === 'w100'
              ? await this.rolleProzentwurf3d()
              : this.ergebnisseAusDiceRoll(
                  await box.roll(this.normalisiereNotationFuerDiceEngine(notation), {
                    themeColor: this.diceThemeColor,
                  }),
                );
            if (extrahiert.length > 0) {
              if (this.wuerfelModus === 'w100') {
                this.prozentwurfDetails = this.baueProzentwurfAusZweiW10(extrahiert);
                this.ergebnisse = [this.prozentwurfDetails.summe];
              } else {
                this.prozentwurfDetails = null;
                this.ergebnisse = extrahiert;
              }
              return;
            }
          } catch {
            // Fallback unten bleibt aktiv.
          }
        }
        if (this.wuerfelModus === 'w100') {
          this.prozentwurfDetails = this.baueProzentwurfAusZweiW10([
            window.HTBAH.wuerfelW10(),
            window.HTBAH.wuerfelW10(),
          ]);
          this.ergebnisse = [this.prozentwurfDetails.summe];
        } else {
          this.prozentwurfDetails = null;
          const anzahl10 = Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
          this.anzahlW10 = anzahl10;
          this.ergebnisse = Array.from({ length: anzahl10 }, () => window.HTBAH.wuerfelW10());
        }
      } finally {
        this.wuerfelnLaeuft = false;
      }
    },
    async wuerfelnMitBecherKomponente() {
      const becher = this.$refs.bottomNavWuerfelbecher;
      if (!becher || typeof becher.wuerfeln !== 'function' || this.wuerfelnLaeuft) {
        return;
      }
      this.wuerfelnLaeuft = true;
      const notation =
        this.wuerfelModus === 'w100'
          ? '1W100'
          : `${Math.max(1, Math.min(50, Number(this.anzahlW10) || 1))}W10`;
      this.letzterWurfAnzahl = this.wuerfelModus === 'w100' ? 2 : Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
      try {
        const werte = await becher.wuerfeln(notation);
        this.ergebnisse = Array.isArray(werte) ? werte : [];
      } finally {
        this.wuerfelnLaeuft = false;
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
        const t = HTBAH_BEGEGNUNG_UTILS ? HTBAH_BEGEGNUNG_UTILS.stripHtmlText(raw) : raw;
        return t || '—';
      }
      return raw;
    },
    begegnungRichTextHtml(html) {
      const inhalt = typeof html === 'string' ? html : '';
      return HTBAH_BEGEGNUNG_UTILS && HTBAH_BEGEGNUNG_UTILS.stripHtmlText(inhalt) ? inhalt : '';
    },
    begegnungNpcWaffenWerteText(row) {
      const nah = String(row && row.schadenswertNahkampf ? row.schadenswertNahkampf : '').trim();
      const fern = String(row && row.schadenswertFernkampf ? row.schadenswertFernkampf : '').trim();
      const teile = [];
      if (nah) {
        teile.push(`Nahkampf ${nah}`);
      }
      if (fern) {
        teile.push(`Fernkampf ${fern}`);
      }
      return teile.length ? teile.join(' · ') : '—';
    },
    begegnungBestieEpocheLabel(epoche) {
      return HTBAH_BEGEGNUNG_UTILS
        ? HTBAH_BEGEGNUNG_UTILS.bestieEpocheLabel(epoche)
        : 'Mittelalter';
    },
    begegnungBestieKategorieLabel(kategorie) {
      return HTBAH_BEGEGNUNG_UTILS
        ? HTBAH_BEGEGNUNG_UTILS.bestieKategorieLabel(kategorie)
        : 'Normales Tier';
    },
    begegnungBestieAggressivitaetText(row) {
      const n = row && Number(row.aggressivitaetSkala);
      if (!Number.isFinite(n)) {
        return '—';
      }
      const k = Math.min(10, Math.max(1, Math.round(n)));
      return `${k} / 10`;
    },
    begegnungOpenPayload() {
      if (!this.begegnungZiehung || !this.begegnungZiehung.zeile) {
        return null;
      }
      const entityType = String(this.begegnungZiehung.typ || '').trim();
      const entityId = String(this.begegnungZiehung.zeile.id || '').trim();
      if (!entityType || !entityId) {
        return null;
      }
      return { entityType, entityId, ts: Date.now() };
    },
    sendeBegegnungOpenRequest(payload) {
      if (!payload || !payload.entityType || !payload.entityId) {
        return;
      }
      const requestEvent = new CustomEvent('htbah:open-entity-request', {
        detail: { ...payload, ts: Date.now() },
        cancelable: true,
      });
      window.dispatchEvent(requestEvent);
    },
    begegnungBearbeitenOeffnen() {
      const payload = this.begegnungOpenPayload();
      if (!payload) {
        return;
      }
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      if (mentionApi && typeof mentionApi.oeffneEntitaetGlobal === 'function') {
        mentionApi.oeffneEntitaetGlobal(payload);
      } else {
        this.sendeBegegnungOpenRequest(payload);
      }
      const zielPfad = '/weltenbau/zufallstabellen';
      const istSchonDort = this.$route && this.$route.path === zielPfad;
      if (!istSchonDort) {
        this.$router.push(zielPfad).finally(() => {
          window.setTimeout(() => this.sendeBegegnungOpenRequest(payload), 120);
        });
      }
      this.wuerfelBeutelSchliessen();
    },
    begegnungZiehen(zielTyp = 'auto') {
      const { npcs, bestien, pantheon } = this.begegnungListenAusSpeicher;
      const canNpc = npcs.length > 0;
      const canBestie = bestien.length > 0;
      const canPantheon = pantheon.length > 0;
      const pick = (typ, liste) => ({
        typ,
        zeile: liste[Math.floor(Math.random() * liste.length)],
      });
      if (!canNpc && !canBestie && !canPantheon) {
        this.begegnungZiehung = null;
        return;
      }
      if (zielTyp === 'npc') {
        if (!canNpc) return;
        this.begegnungZiehung = pick('npc', npcs);
        return;
      }
      if (zielTyp === 'bestie') {
        if (!canBestie) return;
        this.begegnungZiehung = pick('bestie', bestien);
        return;
      }
      if (zielTyp === 'pantheon') {
        if (!canPantheon) return;
        this.begegnungZiehung = pick('pantheon', pantheon);
        return;
      }
      const rar = Math.floor(Math.random() * 10000) + 1;
      if (canPantheon && rar <= 50 && (canNpc || canBestie)) {
        this.begegnungZiehung = pick('pantheon', pantheon);
        return;
      }
      if (canNpc && canBestie) {
        this.begegnungZiehung = Math.random() < 0.5 ? pick('npc', npcs) : pick('bestie', bestien);
        return;
      }
      if (canNpc) {
        this.begegnungZiehung = pick('npc', npcs);
        return;
      }
      if (canBestie) {
        this.begegnungZiehung = pick('bestie', bestien);
        return;
      }
      this.begegnungZiehung = pick('pantheon', pantheon);
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
                title="Kampagnen"
                class="htbah-nav-item"
                :class="{ 'router-link-active': spielleiterKampagnenAktiv }">
                <span class="htbah-nav-item-emoji" aria-hidden="true">🗂️</span>
                <span class="htbah-nav-item-label">Kampagnen</span>
              </router-link>
              <router-link
                to="/faehigkeiten-presets"
                title="Fähigkeiten-Presets"
                class="htbah-nav-item"
                :class="{ 'router-link-active': presetVerwaltungAktiv }">
                <span class="htbah-nav-item-emoji" aria-hidden="true">📦</span>
                <span class="htbah-nav-item-label">Presets</span>
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
            <button
              type="button"
              title="Soundboard"
              class="htbah-nav-item"
              :class="{ 'htbah-nav-button-active': musikNavAktiv }"
              @click="musikboardOeffnen">
              <span class="htbah-nav-item-emoji" aria-hidden="true">🎵</span>
              <span class="htbah-nav-item-label">Musik</span>
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
              title="Kampagnen"
              :class="{ 'router-link-active': spielleiterKampagnenAktiv }">
              🗂️
            </router-link>
            <router-link
              to="/faehigkeiten-presets"
              title="Fähigkeiten-Presets"
              :class="{ 'router-link-active': presetVerwaltungAktiv }">
              📦
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
          <button
            type="button"
            title="Soundboard"
            :class="{ 'htbah-nav-button-active': musikNavAktiv }"
            @click="musikboardOeffnen">
            🎵
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
          🚩
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
        v-if="musikboardOffen"
        class="regelwerk-modal-layer htbah-wuerfel-beutel-layer"
        role="presentation">
        <div
          ref="musikboardFensterRef"
          class="regelwerk-modal-window card shadow htbah-musik-modal-window"
          :style="musikboardFensterStil"
          role="dialog"
          aria-modal="true"
          aria-labelledby="musikModalLabel"
          tabindex="-1">
          <div
            class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
            @pointerdown="musikboardStarteZiehen($event)">
            <h5 class="modal-title d-flex align-items-center gap-2 mb-0" id="musikModalLabel">
              <span aria-hidden="true">🎵</span>
              Musik
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Schließen"
              @click="musikboardSchliessen"></button>
          </div>
          <div class="px-3 pt-2 pb-0">
            <div class="alert alert-info mb-2 py-2" role="note">
              Das eingebettete Tool ist ein experimentelles Soundboard und nur zu Demonstrationszwecken eingebunden.
            </div>
          </div>
          <div class="htbah-musik-iframe-wrap">
            <iframe
              class="htbah-musik-iframe"
              src="https://fpetruschke.github.io/simple-soundboard/"
              title="Simple Soundboard"
              loading="lazy"
              scrolling="auto"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
          <div class="border-top px-3 py-2 d-flex justify-content-end flex-shrink-0 bg-body-tertiary">
            <button type="button" class="btn btn-secondary" @click="musikboardSchliessen">
              Schließen
            </button>
          </div>
          <div class="regelwerk-modal-resize-handle" @pointerdown="musikboardStarteResize($event)"></div>
        </div>
      </div>
    </teleport>

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
                <div class="mb-3">
                  <icon-text-button
                    type="button"
                    class="btn btn-primary w-100 htbah-wuerfeln-btn"
                    icon="casino"
                    :disabled="wuerfelnLaeuft"
                    @click="wuerfelnMitBecherKomponente">
                    {{ wuerfelnLaeuft ? 'Würfelt …' : 'Würfeln' }}
                  </icon-text-button>
                </div>

                <wuerfelbecher-wurf
                  ref="bottomNavWuerfelbecher"
                  class="mb-2"
                  :auto-init="false"
                  :modus="wuerfelModus"
                  :notation="wuerfelModus === 'w100' ? '1W100' : (Math.max(1, Math.min(50, Number(anzahlW10) || 1)) + 'W10')"
                  chip-praefix="#"
                />
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
                <div v-if="!begegnungHatBegegnungsEintrag" class="alert alert-info mb-0" role="status">
                  Noch keine passenden Einträge. Lege zuerst unter
                  <router-link to="/weltenbau/zufallstabellen" class="alert-link">Zufallstabellen</router-link>
                  mindestens einen NPC, eine Bestie oder eine Gottheit im Pantheon an — sonst kann hier
                  nichts gezogen werden.
                </div>
                <template v-else>
                  <div class="btn-group w-100 mb-3">
                    <button
                      type="button"
                      class="btn btn-primary"
                      @click="begegnungZiehen('auto')">
                      Begegnung ziehen
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary dropdown-toggle dropdown-toggle-split"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label="Begegnungstyp auswählen">
                      <span class="visually-hidden">Menü öffnen</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end w-100">
                      <li>
                        <button type="button" class="dropdown-item" @click="begegnungZiehen('auto')">
                          Zufällig (Standard)
                        </button>
                      </li>
                      <li><hr class="dropdown-divider"></li>
                      <li>
                        <button
                          type="button"
                          class="dropdown-item"
                          :disabled="!begegnungListenAusSpeicher.npcs.length"
                          @click="begegnungZiehen('npc')">
                          NPC ziehen
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          class="dropdown-item"
                          :disabled="!begegnungListenAusSpeicher.bestien.length"
                          @click="begegnungZiehen('bestie')">
                          Bestie ziehen
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          class="dropdown-item"
                          :disabled="!begegnungListenAusSpeicher.pantheon.length"
                          @click="begegnungZiehen('pantheon')">
                          Gottheit ziehen
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div
                    v-if="begegnungZiehung"
                    class="card border-0 shadow-sm overflow-hidden">
                    <div
                      class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
                      <span class="fw-semibold text-truncate me-2">{{ begegnungZiehung.zeile.name || 'Ohne Namen' }}</span>
                      <div class="d-flex align-items-center gap-2">
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
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          @click="begegnungBearbeitenOeffnen">
                          Bearbeiten
                        </button>
                      </div>
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
                        <div class="row g-2">
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Stammdaten</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>Spitzname</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.spitzname) }}</dd>
                                <dt>Geschlecht</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.geschlecht) }}</dd>
                                <dt>Alter</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.alter) }}</dd>
                                <dt>Familienstand</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.familienstand) }}</dd>
                                <dt>Beruf</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.beruf) }}</dd>
                                <dt>Statur</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.statur) }}</dd>
                                <dt>Stimme</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.stimme) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Kampf</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>LP</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.lebenspunkte) }}</dd>
                                <dt>Waffe</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.waffe) }}</dd>
                                <dt>Schaden</dt><dd>{{ begegnungNpcWaffenWerteText(begegnungZiehung.zeile) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Kontext</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>Gesinnung</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.gesinnung) }}</dd>
                                <dt>Glaube</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.glaube) }}</dd>
                                <dt>Fraktion</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.fraktion) }}</dd>
                                <dt>Ort</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.aufenthaltsort) }}</dd>
                                <dt>Ziel</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.ziel) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12" v-if="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Notizen</h6>
                              <div
                                class="zufallstabellen-richtext-vorschau"
                                v-html="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)"></div>
                            </section>
                          </div>
                        </div>
                      </template>

                      <template v-else-if="begegnungZiehung.typ === 'bestie'">
                        <div class="row g-2">
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Stammdaten</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>Epoche</dt><dd>{{ begegnungBestieEpocheLabel(begegnungZiehung.zeile.epoche) }}</dd>
                                <dt>Art</dt><dd>{{ begegnungBestieKategorieLabel(begegnungZiehung.zeile.kategorie) }}</dd>
                                <dt>Ort</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.aufenthaltsort) }}</dd>
                                <dt>Stärken</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.staerke) }}</dd>
                                <dt>Schwächen</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.schwaeche) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Kampf</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>Angriff</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.angriff) }}</dd>
                                <dt>Verteidigung</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.verteidigung) }}</dd>
                                <dt>LP</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.lebenspunkte) }}</dd>
                                <dt>Aggro</dt><dd>{{ begegnungBestieAggressivitaetText(begegnungZiehung.zeile) }}</dd>
                                <dt>Waffe</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.waffe) }}</dd>
                                <dt>Schaden</dt><dd>{{ begegnungNpcWaffenWerteText(begegnungZiehung.zeile) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12" v-if="begegnungRichTextHtml(begegnungZiehung.zeile.beschreibungHtml)">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Notizen</h6>
                              <div
                                class="zufallstabellen-richtext-vorschau"
                                v-html="begegnungRichTextHtml(begegnungZiehung.zeile.beschreibungHtml)"></div>
                            </section>
                          </div>
                        </div>
                      </template>

                      <template v-else>
                        <div class="row g-2">
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Stammdaten</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>Geschlecht</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.geschlecht) }}</dd>
                                <dt>Domäne</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.domaene) }}</dd>
                                <dt>Charakter</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.charakter) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12 col-md-6">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Aspekte</h6>
                              <dl class="htbah-begegnung-kompaktliste mb-0">
                                <dt>Stärke</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.staerke) }}</dd>
                                <dt>Schwäche</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.schwaeche) }}</dd>
                                <dt>Schutzpatronat</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.schutzpatronat) }}</dd>
                                <dt>Verlangen</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.verlangen) }}</dd>
                                <dt>Mythos-Gaben</dt><dd>{{ begegnungZeileWert(begegnungZiehung.zeile.mythosGaben) }}</dd>
                              </dl>
                            </section>
                          </div>
                          <div class="col-12" v-if="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)">
                            <section class="htbah-begegnung-kompaktkarte">
                              <h6 class="htbah-begegnung-kompaktkarte-titel">Notizen</h6>
                              <div
                                class="zufallstabellen-richtext-vorschau"
                                v-html="begegnungRichTextHtml(begegnungZiehung.zeile.notizenHtml)"></div>
                            </section>
                          </div>
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
