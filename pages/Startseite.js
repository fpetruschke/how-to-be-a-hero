window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.Startseite = {
  data() {
    return {
      hatCharakter: false,
      charakterName: '',
      charakterBildUrl: '',
    };
  },
  computed: {
    projektTitel() {
      return 'How to be a Hero';
    },
    projektUntertitel() {
      return 'Diese Anwendung dient als Begleit-App zum Pen-&-Paper-Regelwerk von Hauke Gerdes und dem How to be a Hero e.V.';
    },
    charakterModusTitel() {
      if (this.hatCharakter && this.charakterName) {
        return `Ich bin ${this.charakterName}`;
      }
      return 'Ich bin ein Charakter';
    },
    charakterModusAriaLabel() {
      if (this.hatCharakter && this.charakterName) {
        return `Modus Spielende: ${this.charakterName}`;
      }
      return 'Modus Spielende: Charakter';
    },
  },
  methods: {
    aktualisiereCharakterStatus() {
      const charakter = window.HTBAH.ladeCharakter();
      this.charakterName = '';
      this.charakterBildUrl = window.HTBAH.ladeCharakterBild() || '';

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
    regelwerkOeffnen() {
      this.$root.uiZustand.regelwerkOffen = true;
    },
    rolleCharakterWaehlen() {
      window.HTBAH.speichereAppRolle('charakter');
      this.$router.push('/charakter');
    },
    rolleSpielleitungWaehlen() {
      window.HTBAH.speichereAppRolle('spielleitung');
      this.$router.push('/spielleiter');
    },
  },
  mounted() {
    this.aktualisiereCharakterStatus();
  },
  template: `
    <div class="container content py-3 text-center">
      <div class="htbah-start-hero mb-3">
        <span class="htbah-start-hero-logo-wrap">
          <img
            src="assets/img/htbah-begleit-app-logo.png"
            alt="How to be a Hero - Begleit-App Logo"
            class="htbah-start-hero-logo" />
        </span>
        <div class="htbah-start-hero-text text-center">
          <h2 class="htbah-start-hero-title mb-0">How to be a Hero - Begleit-App</h2>
          <p class="htbah-start-hero-subtitle text-secondary mb-0">Simple. Schnell. Dein Abenteuer.</p>
        </div>
      </div>

      <div
        class="card action-card text-start mb-3 cursor-pointer"
        role="button"
        tabindex="0"
        aria-label="Regelwerk öffnen"
        @click="regelwerkOeffnen"
        @keydown.enter.prevent="regelwerkOeffnen"
        @keydown.space.prevent="regelwerkOeffnen">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div class="htbah-start-card-avatar flex-shrink-0">
            <span class="htbah-start-card-avatar-emoji" aria-hidden="true">📜</span>
          </div>
          <div class="min-w-0 flex-grow-1">
            <p class="mb-0 small text-body-secondary text-uppercase htbah-start-card-kicker">
              Regelwerk
            </p>
            <h5 class="mb-1 text-truncate htbah-start-card-charaktername">{{ projektTitel }}</h5>
            <p class="mb-0 small text-body-secondary">{{ projektUntertitel }}</p>
          </div>
          <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <div
            class="card action-card text-start h-100 cursor-pointer"
            role="button"
            tabindex="0"
            :aria-label="charakterModusAriaLabel"
            @click="rolleCharakterWaehlen"
            @keydown.enter.prevent="rolleCharakterWaehlen"
            @keydown.space.prevent="rolleCharakterWaehlen">
            <div class="d-flex align-items-center justify-content-between gap-2">
              <div class="htbah-start-card-avatar flex-shrink-0">
                <img
                  v-if="hatCharakter && charakterBildUrl"
                  :src="charakterBildUrl"
                  alt=""
                  class="htbah-start-card-avatar-img" />
                <span
                  v-else
                  class="htbah-start-card-avatar-emoji"
                  aria-hidden="true">🧙</span>
              </div>
              <div class="min-w-0 flex-grow-1 text-start">
                <h5 class="mb-0 text-truncate htbah-start-card-charaktername htbah-start-card-modus-titel">
                  {{ charakterModusTitel }}
                </h5>
              </div>
              <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
                chevron_right
              </span>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div
            class="card action-card text-start h-100 cursor-pointer"
            role="button"
            tabindex="0"
            aria-label="Modus Spielleitung"
            @click="rolleSpielleitungWaehlen"
            @keydown.enter.prevent="rolleSpielleitungWaehlen"
            @keydown.space.prevent="rolleSpielleitungWaehlen">
            <div class="d-flex align-items-center justify-content-between gap-2">
              <div class="htbah-start-card-avatar flex-shrink-0">
                <span class="htbah-start-card-avatar-emoji" aria-hidden="true">🎭</span>
              </div>
              <div class="min-w-0 flex-grow-1 text-start">
                <h5 class="mb-0 text-truncate htbah-start-card-charaktername htbah-start-card-modus-titel">
                  Ich bin die Spielleitung
                </h5>
              </div>
              <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
                chevron_right
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>
    </div>
  `,
};
