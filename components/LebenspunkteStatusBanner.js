window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.LebenspunkteStatusBanner = {
  computed: {
    status() {
      return window.HTBAH.lebenspunkteStatus;
    },
    bannerSichtbar() {
      return Boolean(this.status.tot || this.status.bewusstlos);
    },
  },
  watch: {
    bannerSichtbar(sichtbar) {
      document.body.classList.toggle('htbah-mit-lp-banner', sichtbar);
    },
  },
  mounted() {
    if (this.bannerSichtbar) {
      document.body.classList.add('htbah-mit-lp-banner');
    }
  },
  unmounted() {
    document.body.classList.remove('htbah-mit-lp-banner');
  },
  methods: {
    bewusstseinModalOeffnen() {
      this.$refs.bewusstseinModal.oeffnen({
        titel: 'Wieder bei Bewusstsein?',
        beschreibung:
          'Nur bestätigen, wenn der Charakter im Spiel wieder bei Bewusstsein ist und die Bewusstlosigkeit endet.',
        bestaetigenText: 'Ja, wieder bei Bewusstsein',
        bestaetigenButtonClass: 'btn-primary',
        warnhinweisAnzeigen: false,
        onBestaetigen: () => this.bewusstseinBestaetigen(),
      });
    },
    bewusstseinBestaetigen() {
      const kontext = window.HTBAH._aktiverCharakterKontext;
      if (kontext && typeof kontext.getCharakter === 'function') {
        const ref = kontext.getCharakter();
        if (ref && typeof ref === 'object') {
          ref.lpBewusstlosAusgeblendet = true;
          ref.lpMassenschadenBewusstlos = false;
          if (typeof kontext.speichern === 'function') {
            kontext.speichern();
          }
          window.HTBAH.syncLebenspunkteStatusFromCharakter(ref);
          return;
        }
      }
      const c = window.HTBAH.ladeCharakter();
      if (!c || typeof c !== 'object') {
        return;
      }
      c.lpBewusstlosAusgeblendet = true;
      c.lpMassenschadenBewusstlos = false;
      window.HTBAH.speichereCharakter(c);
      window.HTBAH.syncLebenspunkteStatusFromCharakter(c);
    },
  },
  template: `
    <teleport to="body">
      <div
        v-if="bannerSichtbar"
        class="htbah-lp-status-banner"
        :class="status.tot ? 'htbah-lp-status-tot' : 'htbah-lp-status-bewusstlos'"
        role="status"
        aria-live="polite">
        <div class="htbah-lp-status-banner-inner">
          <template v-if="status.tot">
            <span class="htbah-lp-status-banner-text">
              <strong>Tot</strong>
              — 0 Lebenspunkte. Dieser Zustand kann nicht rückgängig gemacht werden.
            </span>
          </template>
          <template v-else>
            <span class="htbah-lp-status-banner-text">
              <strong>Bewusstlos</strong>
              — Lebenspunkte 1–10, oder über 10 LP, falls auf einen Schlag mindestens 60 LP verloren gingen.
            </span>
            <button
              type="button"
              class="btn btn-sm btn-outline-dark htbah-lp-status-banner-btn"
              @click="bewusstseinModalOeffnen">
              Wieder bei Bewusstsein?
            </button>
          </template>
        </div>
      </div>
    </teleport>
    <bestaetigen-modal ref="bewusstseinModal" modal-id="htbahLpBewusstseinModal" />
  `,
};
