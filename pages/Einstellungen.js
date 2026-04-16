window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

const SPEICHER_BEREICHE = {
  charakter: {
    key: 'htbah_character',
    titel: 'Charakterdaten löschen?',
    beschreibung:
      'Dein erstellter Charakter mit allen Werten sowie Inventar und Abenteuerjournal wird entfernt. Das Charakterbild bleibt erhalten.',
    erfolg: 'Charakterdaten wurden gelöscht.',
    buttonText: '🧙 Charakterdaten löschen',
  },
  charakterbild: {
    key: 'htbah_character_image',
    titel: 'Charakterbild löschen?',
    beschreibung:
      'Dein ausgewähltes Charakterbild wird entfernt. Deine übrigen Charakterdaten bleiben erhalten.',
    erfolg: 'Charakterbild wurde gelöscht.',
    buttonText: '🖼️ Charakterbild löschen',
  },
  presets: {
    key: 'htbah_presets',
    titel: 'Presets löschen?',
    beschreibung:
      'Alle gespeicherten Presets für schnelle Charakter-Erstellung werden entfernt.',
    erfolg: 'Presets wurden gelöscht.',
    buttonText: '📦 Presets löschen',
  },
  theme: {
    key: 'htbah_theme',
    titel: 'Darstellung zurücksetzen?',
    beschreibung:
      'Deine gespeicherte Theme-Auswahl wird entfernt und die App nutzt wieder das dunkle Standard-Theme.',
    erfolg: 'Darstellung wurde auf das Standard-Theme zurückgesetzt.',
    buttonText: '🎨 Theme-Einstellung löschen',
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
    aktiverSpeicherBereich() {
      return SPEICHER_BEREICHE[this.zuLoeschenderBereich] || SPEICHER_BEREICHE.charakter;
    },
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
      if (!SPEICHER_BEREICHE[bereich]) {
        return;
      }

      this.zuLoeschenderBereich = bereich;
      this.statusMeldung = '';
    },
    speicherBereichLoeschen() {
      const bereich = SPEICHER_BEREICHE[this.zuLoeschenderBereich];

      if (!bereich) {
        return;
      }

      localStorage.removeItem(bereich.key);

      if (this.zuLoeschenderBereich === 'theme') {
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
        <router-link class="btn btn-primary w-100" to="/preset-verwaltung">
          📦 Preset-Management
        </router-link>
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
      <div class="card p-3 mb-3">
        <button
          class="btn btn-outline-danger w-100 mb-2"
          data-bs-toggle="modal"
          data-bs-target="#resetDataConfirmModal"
          @click="oeffneLoeschDialog('charakter')">
          {{ speicherBereiche.charakter.buttonText }}
        </button>
        <button
          class="btn btn-outline-danger w-100 mb-2"
          data-bs-toggle="modal"
          data-bs-target="#resetDataConfirmModal"
          @click="oeffneLoeschDialog('charakterbild')">
          {{ speicherBereiche.charakterbild.buttonText }}
        </button>
        <button
          class="btn btn-outline-danger w-100 mb-2"
          data-bs-toggle="modal"
          data-bs-target="#resetDataConfirmModal"
          @click="oeffneLoeschDialog('presets')">
          {{ speicherBereiche.presets.buttonText }}
        </button>
        <button
          class="btn btn-outline-danger w-100"
          data-bs-toggle="modal"
          data-bs-target="#resetDataConfirmModal"
          @click="oeffneLoeschDialog('theme')">
          {{ speicherBereiche.theme.buttonText }}
        </button>
      </div>

      <div v-if="statusMeldung" class="alert alert-success py-2 mb-3 text-start">
        {{ statusMeldung }}
      </div>

      <div
        class="modal fade"
        id="resetDataConfirmModal"
        tabindex="-1"
        aria-labelledby="resetDataConfirmLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="resetDataConfirmLabel">
                {{ aktiverSpeicherBereich.titel }}
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              {{ aktiverSpeicherBereich.beschreibung }}
              <br />
              <br />
              Dieser Schritt kann nicht rückgängig gemacht werden.
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button
                type="button"
                class="btn btn-danger"
                data-bs-dismiss="modal"
                @click="speicherBereichLoeschen">
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
