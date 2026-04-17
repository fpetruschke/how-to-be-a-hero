window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.Startseite = {
  data() {
    return {
      hatCharakter: false,
      charakterName: '',
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
      this.charakterName = '';

      if (!charakter) {
        this.hatCharakter = false;
        return;
      }

      const nameTrim =
        typeof charakter.name === 'string' ? charakter.name.trim() : '';
      if (nameTrim) {
        this.charakterName = nameTrim;
      }

      const hatName = nameTrim.length > 0;
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

      <div class="card text-start mb-3">
        <p class="mb-2">
          Diese Anwendung ist als Begleiter für das Pen-&amp;-Paper-Regelwerk
          <strong>How to be a hero</strong> von Hauke Gerdes und dem <strong>How to be a Hero e.V.</strong>
          gedacht.
        </p>
        <p class="mb-0">
          Ich hoffe, dass die Anwendung Dich dabei unterstützen kann, Spiele nach diesem Regelwerk zu spielen oder sogar zu leiten.
        </p>
      </div>

      <router-link
        class="card action-card text-decoration-none text-start mb-3"
        to="/charakter">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div class="min-w-0 flex-grow-1">
            <template v-if="charakterName">
              <p class="mb-0 small text-body-secondary text-uppercase htbah-start-card-kicker">
                Charakter
              </p>
              <h5 class="mb-1 text-truncate htbah-start-card-charaktername">{{ charakterName }}</h5>
              <p class="mb-0 small text-body-secondary">{{ charakterUntertitel }}</p>
            </template>
            <template v-else>
              <h5 class="mb-1">{{ charakterTitel }}</h5>
              <p class="mb-0">{{ charakterUntertitel }}</p>
            </template>
          </div>
          <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </router-link>
    </div>
  `,
};
