window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.Startseite = {
  data() {
    return {
      hatCharakter: false,
    };
  },
  computed: {
    charakterTitel() {
      return this.hatCharakter ? '🧙 Charakter' : '🧙 Neuer Charakter';
    },
    charakterUntertitel() {
      return this.hatCharakter
        ? 'Schau dir dein Charakterblatt an.'
        : 'Erstelle deinen Helden Schritt für Schritt.';
    },
  },
  methods: {
    aktualisiereCharakterStatus() {
      const charakter = window.HTBAH.ladeCharakter();

      if (!charakter) {
        this.hatCharakter = false;
        return;
      }

      const hatName = typeof charakter.name === 'string' && charakter.name.trim().length > 0;
      const hatFaehigkeiten = ['handeln', 'wissen', 'soziales'].some(
        (kategorie) => Array.isArray(charakter[kategorie]) && charakter[kategorie].length > 0,
      );

      this.hatCharakter = hatName || hatFaehigkeiten;
    },
  },
  mounted() {
    this.aktualisiereCharakterStatus();
  },
  template: `
    <div class="container content py-3 text-center">
      <h2 class="d-flex align-items-center justify-content-center gap-2">
        <img
          src="assets/img/htbah-begleit-app-logo.png"
          alt="HTBAH Logo"
          width="42"
          height="42" />
        <span>How to be a Hero - Begleit-App</span>
      </h2>
      <p class="text-secondary">Simple. Schnell. Dein Abenteuer.</p>

      <router-link
        class="card action-card text-decoration-none text-start mb-3"
        to="/charakter-erstellung">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-1">{{ charakterTitel }}</h5>
            <p class="mb-0">{{ charakterUntertitel }}</p>
          </div>
          <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </router-link>

      <router-link
        class="card action-card text-decoration-none text-start mb-2"
        to="/abenteuer">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-1">⚔️ Abenteuer starten</h5>
            <p class="mb-0">Steige direkt in dein aktuelles Abenteuer ein.</p>
          </div>
          <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </router-link>
    </div>
  `,
};
