window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function htbahFormatBytes(bytes) {
  const n = typeof bytes === 'number' && Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (n === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const stufen = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), stufen.length - 1);
  const wert = n / k ** i;
  return `${wert.toLocaleString('de-DE', { maximumFractionDigits: i === 0 ? 0 : 2 })} ${stufen[i]}`;
}

const SPEICHER_BEREICHE = {
  charakter: {
    key: 'htbah_character',
    titel: 'Charakterdaten löschen?',
    beschreibung:
      'Dein erstellter Charakter mit allen Werten sowie Inventar und Notizen wird entfernt. Das Charakterbild bleibt erhalten.',
    erfolg: 'Charakterdaten wurden gelöscht.',
    buttonSymbol: '🧙',
    buttonLabel: 'Charakterdaten löschen',
  },
  charakterbild: {
    key: 'htbah_character_image',
    titel: 'Charakterbild löschen?',
    beschreibung:
      'Dein ausgewähltes Charakterbild wird entfernt. Deine übrigen Charakterdaten bleiben erhalten.',
    erfolg: 'Charakterbild wurde gelöscht.',
    buttonSymbol: '🖼️',
    buttonLabel: 'Charakterbild löschen',
  },
  presets: {
    key: 'htbah_presets',
    titel: 'Fähigkeiten-Presets löschen?',
    beschreibung:
      'Alle gespeicherten Fähigkeiten-Presets für schnelle Charakter-Erstellung werden entfernt.',
    erfolg: 'Fähigkeiten-Presets wurden gelöscht.',
    buttonSymbol: '📦',
    buttonLabel: 'Fähigkeiten-Presets löschen',
  },
  theme: {
    key: 'htbah_theme',
    titel: 'Darstellung zurücksetzen?',
    beschreibung:
      'Deine gespeicherte Theme-Auswahl wird entfernt und die App nutzt wieder das dunkle Standard-Theme.',
    erfolg: 'Darstellung wurde auf das Standard-Theme zurückgesetzt.',
    buttonSymbol: '🎨',
    buttonLabel: 'Theme-Einstellung löschen',
  },
  zufallstabellen: {
    key: 'htbah_zufallstabellen',
    titel: 'Zufallstabellen löschen?',
    beschreibung:
      'Alle gespeicherten Einträge in den Zufallstabellen (NPCs, Orte, Fraktionen, Pantheon, Gegenstände) werden entfernt.',
    erfolg: 'Zufallstabellen wurden gelöscht.',
    buttonSymbol: '📚',
    buttonLabel: 'Zufallstabellen löschen',
  },
  abenteuerbuch: {
    key: 'htbah_spielleitung_abenteuerbuch',
    titel: 'Abenteuerbuch löschen?',
    beschreibung:
      'Alle formatierten Einträge im Spielleiter-Abenteuerbuch (Text und Formatierung) werden aus dem lokalen Speicher entfernt.',
    erfolg: 'Abenteuerbuch wurde gelöscht.',
    buttonSymbol: '📔',
    buttonLabel: 'Abenteuerbuch löschen',
  },
  weltenbau: {
    key: 'htbah_weltenbau',
    titel: 'Weltenbau-Bilder löschen?',
    beschreibung:
      'Alle unter „Weltenbau“ importierten Karten- und Generator-Bilder werden aus dem lokalen Speicher entfernt.',
    erfolg: 'Weltenbau-Bilder wurden gelöscht.',
    buttonSymbol: '🗺️',
    buttonLabel: 'Weltenbau-Bilder löschen',
  },
  spielleiter: {
    key: 'htbah_spielleiter_gruppen',
    titel: 'Spielleiter-Gruppen löschen?',
    beschreibung:
      'Alle gespeicherten Gruppen und Charaktere in der Spielleiter-Ansicht werden entfernt.',
    erfolg: 'Spielleiter-Gruppen wurden gelöscht.',
    buttonSymbol: '👥',
    buttonLabel: 'Spielleiter-Gruppen löschen',
  },
  alles: {
    keys: [
      'htbah_character',
      'htbah_character_image',
      'htbah_presets',
      'htbah_theme',
      'htbah_spielleiter_gruppen',
      'htbah_zufallstabellen',
      'htbah_spielleitung_abenteuerbuch',
      'htbah_weltenbau',
      'htbah_app_rolle',
    ],
    titel: 'Alle lokalen Daten löschen?',
    beschreibung:
      'Es werden Charakterdaten, Charakterbild, gespeicherte Fähigkeiten-Presets, Spielleiter-Gruppen, Zufallstabellen, das Abenteuerbuch der Spielleitung, unter „Weltenbau“ gespeicherte Bilder, die gewählte Rolle (Charakter/Spielleitung) und deine Theme-Auswahl entfernt. Die App entspricht danach einem frischen Start.',
    erfolg: 'Alle gespeicherten Daten wurden gelöscht.',
    buttonSymbol: '🗑️',
    buttonLabel: 'Alles löschen',
  },
};

window.HTBAH_SEITEN.Einstellungen = {
  data() {
    return {
      istHellesTheme: window.HTBAH.ladeTheme() === 'light',
      zuLoeschenderBereich: 'charakter',
      statusMeldung: '',
      speicherBereiche: SPEICHER_BEREICHE,
      browserSpeicher: null,
      browserSpeicherFehler: '',
      browserSpeicherLaden: true,
    };
  },
  computed: {
    themeTitel() {
      return this.istHellesTheme ? 'Helles Theme' : 'Dunkles Theme';
    },
    themeSymbol() {
      return this.istHellesTheme ? 'light_mode' : 'dark_mode';
    },
    appRolle() {
      void this.$route.fullPath;
      return window.HTBAH.ladeAppRolle();
    },
    browserSpeicherQuotaEndlich() {
      const b = this.browserSpeicher;
      if (!b || typeof b.quota !== 'number') {
        return false;
      }
      return Number.isFinite(b.quota) && b.quota > 0;
    },
    browserSpeicherProzent() {
      const b = this.browserSpeicher;
      if (!b || !this.browserSpeicherQuotaEndlich) {
        return 0;
      }
      const u = typeof b.usage === 'number' && Number.isFinite(b.usage) ? b.usage : 0;
      const q = b.quota;
      if (q <= 0) {
        return 0;
      }
      return Math.min(100, Math.round((100 * u) / q));
    },
    browserSpeicherNutzungText() {
      if (!this.browserSpeicher) {
        return '';
      }
      const u = this.browserSpeicher.usage;
      return htbahFormatBytes(typeof u === 'number' && Number.isFinite(u) ? u : 0);
    },
    browserSpeicherQuotaText() {
      const b = this.browserSpeicher;
      if (!b || !this.browserSpeicherQuotaEndlich) {
        return '';
      }
      return htbahFormatBytes(b.quota);
    },
    browserSpeicherProgressBarKlasse() {
      const p = this.browserSpeicherProzent;
      if (p >= 95) {
        return 'bg-danger';
      }
      if (p >= 80) {
        return 'bg-warning text-dark';
      }
      return 'bg-success';
    },
  },
  methods: {
    zurRollenauswahl() {
      window.HTBAH.speichereAppRolle(null);
      this.$router.push('/');
    },
    themeUmschalten() {
      const neuesTheme = this.istHellesTheme ? 'light' : 'dark';
      window.HTBAH.setzeTheme(neuesTheme);
    },
    async speicherSchaetzungLaden() {
      this.browserSpeicherFehler = '';
      this.browserSpeicherLaden = true;
      if (!navigator.storage || typeof navigator.storage.estimate !== 'function') {
        this.browserSpeicher = null;
        this.browserSpeicherFehler =
          'Speicher-Schätzung ist nicht verfügbar (z. B. unsichere Verbindung oder älterer Browser).';
        this.browserSpeicherLaden = false;
        return;
      }
      try {
        const est = await navigator.storage.estimate();
        const usage = typeof est.usage === 'number' && Number.isFinite(est.usage) ? est.usage : 0;
        const quotaRaw = typeof est.quota === 'number' ? est.quota : 0;
        const quota = Number.isFinite(quotaRaw) && quotaRaw > 0 ? quotaRaw : 0;
        this.browserSpeicher = { usage, quota };
      } catch {
        this.browserSpeicher = null;
        this.browserSpeicherFehler = 'Die Speicherwerte konnten nicht gelesen werden.';
      }
      this.browserSpeicherLaden = false;
    },
    oeffneLoeschDialog(bereich) {
      const eintrag = SPEICHER_BEREICHE[bereich];
      if (!eintrag) {
        return;
      }

      this.zuLoeschenderBereich = bereich;
      this.statusMeldung = '';

      this.$refs.bestaetigenModal.oeffnen({
        titel: eintrag.titel,
        beschreibung: eintrag.beschreibung,
        onBestaetigen: () => this.speicherBereichLoeschen(),
      });
    },
    speicherBereichLoeschen() {
      const bereich = SPEICHER_BEREICHE[this.zuLoeschenderBereich];

      if (!bereich) {
        return;
      }

      if (Array.isArray(bereich.keys)) {
        bereich.keys.forEach((k) => localStorage.removeItem(k));
      } else {
        localStorage.removeItem(bereich.key);
      }

      if (this.zuLoeschenderBereich === 'theme' || this.zuLoeschenderBereich === 'alles') {
        this.istHellesTheme = false;
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      this.statusMeldung = bereich.erfolg;

      if (this.zuLoeschenderBereich === 'alles') {
        this.$router.push('/');
      }

      this.speicherSchaetzungLaden();
    },
  },
  mounted() {
    this.speicherSchaetzungLaden();
  },
  template: `
    <div class="container content py-3 text-center">
      <h4>Einstellungen</h4>

      <h5 class="text-start mb-2">App</h5>
      <div class="card p-3 mb-3">
        <icon-text-button
          class="btn btn-outline-secondary w-100"
          type="button"
          icon="swap_horiz"
          @click="zurRollenauswahl">
          Zur Rollenauswahl (Startseite)
        </icon-text-button>
      </div>

      <h5 class="text-start mb-2">Theme</h5>
      <div class="card p-3 mb-3 text-start">
        <div class="d-flex align-items-center justify-content-between">
          <label class="form-check-label d-flex align-items-center gap-2 mb-0" for="themeToggle">
            <span class="material-symbols-outlined" aria-hidden="true">
              {{ themeSymbol }}
            </span>
            <span>{{ themeTitel }}</span>
          </label>
          <div class="form-check form-switch m-0">
            <input
              id="themeToggle"
              class="form-check-input theme-toggle-input"
              type="checkbox"
              role="switch"
              v-model="istHellesTheme"
              @change="themeUmschalten" />
          </div>
        </div>
      </div>

      <h5 class="text-start mb-2">Speicherstatus</h5>
      <div class="card p-3 mb-3 text-start">
        <p class="small text-body-secondary mb-2">
          Geschätztes Kontingent für diese Website (localStorage, IndexedDB, Service-Worker-Caches u. a.).
          Die Werte sind ungefähr; unter HTTPS ist die Anzeige meist am zuverlässigsten.
        </p>
        <div v-if="browserSpeicherLaden" class="small text-body-secondary">Wird geladen …</div>
        <div v-else-if="browserSpeicherFehler" class="alert alert-warning py-2 mb-0 small">
          {{ browserSpeicherFehler }}
        </div>
        <template v-else-if="browserSpeicher">
          <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
            <span class="small"><strong>{{ browserSpeicherNutzungText }}</strong> belegt</span>
            <span class="small text-body-secondary" v-if="browserSpeicherQuotaEndlich">
              von {{ browserSpeicherQuotaText }}
            </span>
            <span class="small text-body-secondary" v-else>ohne gemeldetes Obergrenzen-Limit</span>
          </div>
          <div
            v-if="browserSpeicherQuotaEndlich"
            class="progress"
            style="height: 1.1rem"
            role="progressbar"
            :aria-valuenow="browserSpeicherProzent"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="'Speicher: ' + browserSpeicherProzent + ' Prozent'">
            <div
              class="progress-bar"
              :class="browserSpeicherProgressBarKlasse"
              :style="{ width: browserSpeicherProzent + '%' }"></div>
          </div>
          <div v-if="browserSpeicherQuotaEndlich" class="small text-body-secondary mt-1 text-end">
            {{ browserSpeicherProzent }} %
          </div>
        </template>
        <icon-text-button
          type="button"
          class="btn btn-outline-secondary btn-sm mt-2"
          icon="refresh"
          :disabled="browserSpeicherLaden"
          @click="speicherSchaetzungLaden">
          Aktualisieren
        </icon-text-button>
      </div>

      <h5 class="text-start mb-2">Daten löschen</h5>
      <div class="card p-3" style="margin-bottom: 4rem;">
        <template v-if="appRolle === 'charakter'">
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.charakter.buttonSymbol"
            @click="oeffneLoeschDialog('charakter')">
            {{ speicherBereiche.charakter.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.charakterbild.buttonSymbol"
            @click="oeffneLoeschDialog('charakterbild')">
            {{ speicherBereiche.charakterbild.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.theme.buttonSymbol"
            @click="oeffneLoeschDialog('theme')">
            {{ speicherBereiche.theme.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-danger w-100"
            type="button"
            :symbol="speicherBereiche.alles.buttonSymbol"
            @click="oeffneLoeschDialog('alles')">
            {{ speicherBereiche.alles.buttonLabel }}
          </icon-text-button>
        </template>
        <template v-else-if="appRolle === 'spielleitung'">
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.presets.buttonSymbol"
            @click="oeffneLoeschDialog('presets')">
            {{ speicherBereiche.presets.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.spielleiter.buttonSymbol"
            @click="oeffneLoeschDialog('spielleiter')">
            {{ speicherBereiche.spielleiter.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.zufallstabellen.buttonSymbol"
            @click="oeffneLoeschDialog('zufallstabellen')">
            {{ speicherBereiche.zufallstabellen.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.abenteuerbuch.buttonSymbol"
            @click="oeffneLoeschDialog('abenteuerbuch')">
            {{ speicherBereiche.abenteuerbuch.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.weltenbau.buttonSymbol"
            @click="oeffneLoeschDialog('weltenbau')">
            {{ speicherBereiche.weltenbau.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-outline-danger w-100 mb-2"
            type="button"
            :symbol="speicherBereiche.theme.buttonSymbol"
            @click="oeffneLoeschDialog('theme')">
            {{ speicherBereiche.theme.buttonLabel }}
          </icon-text-button>
          <icon-text-button
            class="btn btn-danger w-100"
            type="button"
            :symbol="speicherBereiche.alles.buttonSymbol"
            @click="oeffneLoeschDialog('alles')">
            {{ speicherBereiche.alles.buttonLabel }}
          </icon-text-button>
        </template>
      </div>

      <teleport to="body">
        <div
          v-if="statusMeldung"
          class="htbah-erfolgs-toast alert alert-success alert-dismissible py-2 mb-0 text-center shadow"
          role="status">
          {{ statusMeldung }}
          <button
            type="button"
            class="btn-close"
            aria-label="Meldung schließen"
            @click="statusMeldung = ''"></button>
        </div>
      </teleport>

      <bestaetigen-modal ref="bestaetigenModal" />
    </div>
  `,
};
