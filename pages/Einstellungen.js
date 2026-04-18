window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

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
    titel: 'Presets löschen?',
    beschreibung:
      'Alle gespeicherten Presets für schnelle Charakter-Erstellung werden entfernt.',
    erfolg: 'Presets wurden gelöscht.',
    buttonSymbol: '📦',
    buttonLabel: 'Presets löschen',
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
      'Alle gespeicherten Einträge in den Zufallstabellen (NPCs, Orte, Gegenstände) werden entfernt.',
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
  alles: {
    keys: [
      'htbah_character',
      'htbah_character_image',
      'htbah_presets',
      'htbah_theme',
      'htbah_spielleiter_gruppen',
      'htbah_zufallstabellen',
      'htbah_spielleitung_abenteuerbuch',
    ],
    titel: 'Alle lokalen Daten löschen?',
    beschreibung:
      'Es werden Charakterdaten, Charakterbild, gespeicherte Presets, Spielleiter-Gruppen, Zufallstabellen, das Abenteuerbuch der Spielleitung und deine Theme-Auswahl entfernt. Die App entspricht danach einem frischen Start.',
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
    };
  },
  computed: {
    themeTitel() {
      return this.istHellesTheme ? 'Helles Theme' : 'Dunkles Theme';
    },
    themeSymbol() {
      return this.istHellesTheme ? 'light_mode' : 'dark_mode';
    },
  },
  methods: {
    themeUmschalten() {
      const neuesTheme = this.istHellesTheme ? 'light' : 'dark';
      window.HTBAH.setzeTheme(neuesTheme);
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
    },
  },
  template: `
    <div class="container content py-3 text-center">
      <h4>Einstellungen</h4>

      <h5 class="text-start mb-2">Presets</h5>
      <div class="card p-3 mb-3">
        <icon-text-button tag="router-link" to="/preset-verwaltung" class="btn btn-primary w-100" icon="inventory_2">
          Preset-Management
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

      <h5 class="text-start mb-2">Daten löschen</h5>
      <div class="card p-3" style="margin-bottom: 4rem;">
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
          :symbol="speicherBereiche.presets.buttonSymbol"
          @click="oeffneLoeschDialog('presets')">
          {{ speicherBereiche.presets.buttonLabel }}
        </icon-text-button>
        <icon-text-button
          class="btn btn-outline-danger w-100 mb-2"
          type="button"
          :symbol="speicherBereiche.theme.buttonSymbol"
          @click="oeffneLoeschDialog('theme')">
          {{ speicherBereiche.theme.buttonLabel }}
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
          class="btn btn-danger w-100"
          type="button"
          :symbol="speicherBereiche.alles.buttonSymbol"
          @click="oeffneLoeschDialog('alles')">
          {{ speicherBereiche.alles.buttonLabel }}
        </icon-text-button>
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
