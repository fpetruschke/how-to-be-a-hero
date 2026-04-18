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
    charakterTitel() {
      return this.hatCharakter ? '🧙 Charakter' : '🧙 Neuer Charakter';
    },
    charakterUntertitel() {
      return this.hatCharakter
        ? 'Schau dir dein Charakterblatt an.'
        : 'Erstelle deinen Helden Schritt für Schritt.';
    },
    projektTitel() {
      return 'How to be a Hero';
    },
    projektUntertitel() {
      return 'Diese Anwendung dient als Begleit-App zum Pen-&-Paper-Regelwerk von Hauke Gerdes und dem How to be a Hero e.V.';
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
  },
  mounted() {
    this.aktualisiereCharakterStatus();
  },
  template: `
    <div class="container content py-3 text-center">
      <h2 class="d-flex align-items-center justify-content-center gap-2">
        <img
          src="assets/img/htbah-begleit-app-logo.png"
          alt="How to be a Hero - Begleit-App Logo"
          width="42"
          height="42" />
        <span>How to be a Hero - Begleit-App</span>
      </h2>
      <p class="text-secondary">Simple. Schnell. Dein Abenteuer.</p>

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

      <router-link
        class="card action-card text-decoration-none text-start mb-3"
        to="/charakter">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div class="htbah-start-card-avatar flex-shrink-0">
            <img
              v-if="hatCharakter && charakterBildUrl"
              :src="charakterBildUrl"
              alt="Charakterbild"
              class="htbah-start-card-avatar-img" />
            <span
              v-else
              class="htbah-start-card-avatar-emoji"
              role="img"
              aria-label="Magier">
              🧙
            </span>
          </div>
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
