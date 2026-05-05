(() => {
window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

function htbahDiceAssetUrl(relMitPunktSlash) {
  try {
    return new URL(relMitPunktSlash, document.baseURI || window.location.href).href;
  } catch {
    return relMitPunktSlash;
  }
}

const HTBAH_WB_DICE_BOX_MODULE_URL = htbahDiceAssetUrl('./assets/js/dice-box.es.min.js');
const HTBAH_WB_DICE_INIT_TIMEOUT_MS = 7000;
const HTBAH_WB_APP_ORIGIN = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;

window.HTBAH_KOMPONENTEN.WuerfelbecherWurf = {
  props: {
    notation: { type: String, default: '1W100' },
    modus: { type: String, default: 'w100' },
    chipPraefix: { type: String, default: '' },
    autoInit: { type: Boolean, default: true },
    prozentwurfModifikator: { type: Number, default: 0 },
  },
  data() {
    return {
      instanzId: 'htbah-wuerfelbecher-' + (window.HTBAH.neueEntropieId ? window.HTBAH.neueEntropieId() : Date.now()),
      ergebnisse: [],
      wuerfelnLaeuft: false,
      diceBox: null,
      diceBoxZehner: null,
      diceBoxEiner: null,
      diceReady: false,
      diceReadyZehner: false,
      diceReadyEiner: false,
      diceInitPromise: null,
      diceInitPromiseZehner: null,
      diceInitPromiseEiner: null,
      diceModulLadenPromise: null,
      diceFehler: '',
      dice3dAktiv: window.HTBAH.ladeWuerfelAnzeigeProfil().enabled,
      diceThemeColor: window.HTBAH.ladeWuerfelAnzeigeProfil().theme,
      diceThemeColorOnes: window.HTBAH.ladeWuerfelAnzeigeProfil().themeOnes || window.HTBAH.ladeWuerfelAnzeigeProfil().theme,
      diceThemeColorTens: window.HTBAH.ladeWuerfelAnzeigeProfil().themeTens || '#3b7a36',
      prozentwurfDetails: null,
      letzterWurfAnzahl: 1,
    };
  },
  computed: {
    ergebnisSumme() {
      return this.ergebnisse.reduce((summe, wert) => summe + wert, 0);
    },
    istProzentwurf() {
      return this.modus === 'w100';
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
    prozentwurfBadgeErgebnisStil() {
      return {
        background: `color-mix(in srgb, ${this.diceThemeColorOnes} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${this.diceThemeColorTens} 55%, transparent)`,
      };
    },
    prozentwurfModHatWert() {
      return Number(this.prozentwurfModifikator) !== 0;
    },
    prozentwurfModWertGerundet() {
      return Math.round(Number(this.prozentwurfModifikator) || 0);
    },
    prozentwurfModBadgeStil() {
      const positiv = this.prozentwurfModWertGerundet > 0;
      const farbe = positiv ? '#2f9e44' : '#dc3545';
      return {
        background: `color-mix(in srgb, ${farbe} 22%, transparent)`,
        borderColor: `color-mix(in srgb, ${farbe} 62%, transparent)`,
      };
    },
    prozentwurfSummeMitModifikator() {
      if (!this.prozentwurfDetails) {
        return null;
      }
      return this.prozentwurfDetails.gesamt + this.prozentwurfModWertGerundet;
    },
    wuerfelRolltText() {
      if (this.istProzentwurf) {
        return 'Würfel rollen …';
      }
      return Number(this.letzterWurfAnzahl) > 1 ? 'Würfel rollen …' : 'Würfel rollt …';
    },
    diceContainerId() {
      return `${this.instanzId}-box`;
    },
    diceContainerIdZehner() {
      return `${this.instanzId}-box-zehner`;
    },
    diceContainerIdEiner() {
      return `${this.instanzId}-box-einer`;
    },
  },
  mounted() {
    window.addEventListener('htbah:wuerfel-einstellungen-geaendert', this.onWuerfelEinstellungenGlobalGeaendert);
    if (this.autoInit && this.dice3dAktiv) {
        this.$nextTick(() => {
          if (this.istProzentwurf) {
            this.stelleProzentwurfDiceBoxesBereit();
          } else {
            this.stelleDiceBoxBereit();
          }
        });
    }
  },
  beforeUnmount() {
    window.removeEventListener(
      'htbah:wuerfel-einstellungen-geaendert',
      this.onWuerfelEinstellungenGlobalGeaendert,
    );
  },
  methods: {
    warte(ms) {
      return new Promise((resolve) => window.setTimeout(resolve, ms));
    },
    onWuerfelEinstellungenGlobalGeaendert() {
      const profil = window.HTBAH.ladeWuerfelAnzeigeProfil();
      this.dice3dAktiv = profil.enabled;
      this.diceThemeColorOnes = profil.themeOnes || profil.theme;
      this.diceThemeColorTens = profil.themeTens || '#3b7a36';
      this.diceThemeColor = this.istProzentwurf ? this.diceThemeColorOnes : (profil.themeOnes || profil.theme);
      if (this.dice3dAktiv) {
        this.$nextTick(() => {
          if (this.istProzentwurf) {
            this.stelleProzentwurfDiceBoxesBereit();
          } else {
            this.stelleDiceBoxBereit();
          }
        });
      } else {
        this.diceFehler = '';
      }
    },
    async ladeDiceBoxKlasse() {
      if (window.HTBAH_DICE_BOX_KLASSE) {
        return window.HTBAH_DICE_BOX_KLASSE;
      }
      if (!this.diceModulLadenPromise) {
        this.diceModulLadenPromise = import(HTBAH_WB_DICE_BOX_MODULE_URL)
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
          const box = new DiceBox(`#${this.diceContainerId}`, {
            assetPath: 'assets/dice-box/assets/',
            origin: HTBAH_WB_APP_ORIGIN,
            theme: 'default',
            themeColor: this.diceThemeColor,
            offscreen: true,
            scale: 16,
          });
          await box.init();
          this.diceBox = Vue.markRaw(box);
          this.diceReady = true;
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
          const boxZ = new DiceBox(`#${this.diceContainerIdZehner}`, {
            assetPath: 'assets/dice-box/assets/',
            origin: HTBAH_WB_APP_ORIGIN,
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
          const boxE = new DiceBox(`#${this.diceContainerIdEiner}`, {
            assetPath: 'assets/dice-box/assets/',
            origin: HTBAH_WB_APP_ORIGIN,
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
    ergebnisseAusDiceRoll(rollWert) {
      if (!Array.isArray(rollWert)) {
        return [];
      }
      const out = [];
      rollWert.forEach((eintrag) => {
        if (eintrag == null) return;
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
      if (!Number.isFinite(n)) {
        return 0;
      }
      if (n >= 1 && n <= 10) {
        return n % 10;
      }
      if (n >= 0 && n <= 9) {
        return n;
      }
      return ((n % 10) + 10) % 10;
    },
    normalisiereZehnerWert(roh) {
      const n = Math.round(Number(roh));
      if (!Number.isFinite(n)) {
        return 0;
      }
      if (n >= 0 && n <= 90 && n % 10 === 0) {
        return n;
      }
      if (n === 100) {
        return 0;
      }
      if (n >= 1 && n <= 10) {
        return (n % 10) * 10;
      }
      const digit = ((n % 10) + 10) % 10;
      return digit * 10;
    },
    baueProzentwurfAusZweiW10(werte) {
      const arr = Array.isArray(werte) ? werte : [];
      const zehnerWert = this.normalisiereZehnerWert(arr[0]);
      const einerDigit = this.normalisiereD10Digit(arr[1]);
      const rohGesamt = zehnerWert + einerDigit;
      const gesamt = rohGesamt === 0 ? 100 : rohGesamt;
      return {
        einerDigit,
        zehnerWert,
        gesamt,
      };
    },
    async rolleProzentwurf3d(box) {
      const rollMitTimeout = async (boxInstanz, notation, themeColor, timeoutMs = 6000) =>
        Promise.race([
          boxInstanz.roll(notation, { themeColor }),
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
    fallbackWurf(notation) {
      if (this.istProzentwurf) {
        const details = this.baueProzentwurfAusZweiW10([
          window.HTBAH.wuerfelW10(),
          window.HTBAH.wuerfelW10(),
        ]);
        this.prozentwurfDetails = details;
        return [details.gesamt];
      }
      const m = String(notation || '').match(/^(\d+)[dw](10|100)$/i);
      const anzahl = Math.max(1, Math.min(50, Number(m && m[1]) || 1));
      const seiten = Number(m && m[2]) || 100;
      this.prozentwurfDetails = null;
      return Array.from({ length: anzahl }, () =>
        seiten === 10 ? window.HTBAH.wuerfelW10() : window.HTBAH.wuerfelW100(),
      );
    },
    async wuerfeln(notationOverride = null) {
      if (this.wuerfelnLaeuft) {
        return [];
      }
      this.wuerfelnLaeuft = true;
      const profil = window.HTBAH.ladeWuerfelAnzeigeProfil();
      this.dice3dAktiv = profil.enabled;
      this.diceThemeColorOnes = profil.themeOnes || profil.theme;
      this.diceThemeColorTens = profil.themeTens || '#3b7a36';
      this.diceThemeColor = this.istProzentwurf ? this.diceThemeColorOnes : (profil.themeOnes || profil.theme);
      const notation = notationOverride || this.notation || '1W100';
      const effektiveNotation = this.istProzentwurf ? '1W100+1W10' : notation;
      const anzahl = Math.max(
        1,
        Math.min(50, Number((String(effektiveNotation).match(/^(\d+)[dw]/i) || [])[1]) || 1),
      );
      this.letzterWurfAnzahl = anzahl;
      try {
        window.HTBAH.spieleWuerfelSounds(anzahl);
        if (!this.dice3dAktiv) {
          this.diceFehler = '';
          this.ergebnisse = this.fallbackWurf(notation);
          this.$emit('gewuerfelt', this.ergebnisse);
          return this.ergebnisse;
        }
        if (this.istProzentwurf) {
          try {
            const extrahiert = await this.rolleProzentwurf3d(null);
            if (extrahiert.length > 0) {
              const details = this.baueProzentwurfAusZweiW10(extrahiert);
              this.prozentwurfDetails = details;
              this.ergebnisse = [details.gesamt];
              this.$emit('gewuerfelt', this.ergebnisse);
              return this.ergebnisse;
            }
          } catch {
            /* fallback unten */
          }
        } else {
          const box = await Promise.race([
            this.stelleDiceBoxBereit(),
            this.warte(HTBAH_WB_DICE_INIT_TIMEOUT_MS).then(() => '__timeout__'),
          ]);
          if (box === '__timeout__') {
            this.diceFehler = '3D-Würfel initialisieren zu langsam. Standard-Wurf bleibt aktiv.';
          }
          if (box && this.diceReady && typeof box.roll === 'function') {
            try {
              const extrahiert = this.ergebnisseAusDiceRoll(
                await box.roll(this.normalisiereNotationFuerDiceEngine(effektiveNotation), { themeColor: this.diceThemeColor }),
              );
              if (extrahiert.length > 0) {
                this.prozentwurfDetails = null;
                this.ergebnisse = extrahiert;
                this.$emit('gewuerfelt', this.ergebnisse);
                return this.ergebnisse;
              }
            } catch {
              /* fallback unten */
            }
          }
        }
        this.ergebnisse = this.fallbackWurf(effektiveNotation);
        this.$emit('gewuerfelt', this.ergebnisse);
        return this.ergebnisse;
      } finally {
        this.wuerfelnLaeuft = false;
      }
    },
  },
  template: `
    <div class="card p-3 shadow-sm mb-2">
      <div v-if="dice3dAktiv && !istProzentwurf" class="htbah-dice-box-wrap mb-2">
        <div :id="diceContainerId" ref="diceBoxElement" class="htbah-dice-box"></div>
      </div>
      <div v-if="dice3dAktiv && istProzentwurf" class="row g-2 mb-2">
        <div class="col-12 col-md-6">
          <div class="htbah-dice-box-wrap">
            <div :id="diceContainerIdZehner" ref="diceBoxZehnerElement" class="htbah-dice-box"></div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="htbah-dice-box-wrap">
            <div :id="diceContainerIdEiner" ref="diceBoxEinerElement" class="htbah-dice-box"></div>
          </div>
        </div>
      </div>
      <small v-if="diceFehler" class="text-warning d-block mb-2">{{ diceFehler }}</small>
      <div v-if="istProzentwurf && prozentwurfDetails" class="row g-2 mb-2">
        <div class="col-12 col-md-6">
          <div class="p-2 rounded border border-secondary border-opacity-25 h-100">
          <div class="small text-body-secondary mb-1">W100 (Rohwurf)</div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="wuerfel-ergebnis-chip wuerfel-ergebnis-chip-w100" :style="prozentwurfBadgeZehnerStil">
              Zehner: {{ prozentwurfDetails.zehnerWert === 0 ? '00' : prozentwurfDetails.zehnerWert }}
            </span>
            <span class="wuerfel-ergebnis-chip wuerfel-ergebnis-chip-w100" :style="prozentwurfBadgeEinerStil">
              Einer: {{ prozentwurfDetails.einerDigit }}
            </span>
          </div>
        </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="p-2 rounded border border-secondary border-opacity-25 h-100">
          <div class="small text-body-secondary mb-1">Ergebnis</div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span
              v-if="prozentwurfModHatWert"
              class="wuerfel-ergebnis-chip wuerfel-ergebnis-chip-w100 fw-semibold"
              :style="prozentwurfModBadgeStil">
              {{ prozentwurfModWertGerundet > 0 ? 'Bonus' : 'Malus' }}: {{ prozentwurfModWertGerundet > 0 ? '+' : '' }}{{ prozentwurfModWertGerundet }}
            </span>
            <span class="wuerfel-ergebnis-chip wuerfel-ergebnis-chip-w100 fw-semibold" :style="prozentwurfBadgeErgebnisStil">
              Summe: {{ prozentwurfSummeMitModifikator }}
            </span>
          </div>
        </div>
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2" v-if="ergebnisse.length && !prozentwurfDetails">
        <span
          class="wuerfel-ergebnis-chip"
          :class="modus === 'w10' ? 'wuerfel-ergebnis-chip-w10' : 'wuerfel-ergebnis-chip-w100'"
          :style="wuerfelErgebnisChipStil"
          v-for="(wert, index) in ergebnisse"
          :key="modus + '-' + index">
          <template v-if="modus === 'w10' && chipPraefix">
            {{ chipPraefix }} {{ index + 1 }}: {{ wert }}
          </template>
          <template v-else>
            {{ wert }}
          </template>
        </span>
      </div>
      <small v-else-if="wuerfelnLaeuft">{{ wuerfelRolltText }}</small>
      <small v-else-if="!prozentwurfDetails">Noch kein Wurf.</small>
      <div v-if="modus === 'w10' && ergebnisse.length" class="small text-body-secondary mt-2">
        Summe: <strong>{{ ergebnisSumme }}</strong>
      </div>
    </div>
  `,
};
})();
