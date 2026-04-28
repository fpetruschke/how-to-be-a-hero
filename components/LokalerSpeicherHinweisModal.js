window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const SPEICHER_KEY_VERSTANDEN_AM = 'verstanden_am';

window.HTBAH_KOMPONENTEN.LokalerSpeicherHinweisModal = {
  data() {
    return {
      modalInstanz: null,
      oeffnenRetryTimeoutId: null,
      wirdEntfernt: false,
    };
  },
  mounted() {
    if (!this.sollHeuteAnzeigen()) {
      return;
    }
    this.$nextTick(() => this.oeffnenWennBootstrapBereit());
  },
  methods: {
    heutigesDatum() {
      const jetzt = new Date();
      const jahr = String(jetzt.getFullYear());
      const monat = String(jetzt.getMonth() + 1).padStart(2, '0');
      const tag = String(jetzt.getDate()).padStart(2, '0');
      return `${jahr}-${monat}-${tag}`;
    },
    sollHeuteAnzeigen() {
      const gespeichert = window.HTBAH?.speicher?.leseText(SPEICHER_KEY_VERSTANDEN_AM, null);
      return gespeichert !== this.heutigesDatum();
    },
    verstandenSpeichern() {
      window.HTBAH?.speicher?.schreibeText(SPEICHER_KEY_VERSTANDEN_AM, this.heutigesDatum());
    },
    oeffnenWennBootstrapBereit(versuch = 0) {
      if (this.wirdEntfernt) {
        return;
      }
      const maxVersuche = 80;
      const el = this.$refs.modalElement;
      if (window.bootstrap && el) {
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el, {
          backdrop: 'static',
          keyboard: false,
        });
        this.modalInstanz.show();
        return;
      }
      if (versuch < maxVersuche) {
        if (this.oeffnenRetryTimeoutId) {
          window.clearTimeout(this.oeffnenRetryTimeoutId);
        }
        this.oeffnenRetryTimeoutId = window.setTimeout(() => {
          this.oeffnenRetryTimeoutId = null;
          this.oeffnenWennBootstrapBereit(versuch + 1);
        }, 0);
      }
    },
  },
  beforeUnmount() {
    this.wirdEntfernt = true;
    if (this.oeffnenRetryTimeoutId) {
      window.clearTimeout(this.oeffnenRetryTimeoutId);
      this.oeffnenRetryTimeoutId = null;
    }
    if (this.modalInstanz && typeof this.modalInstanz.dispose === 'function') {
      this.modalInstanz.dispose();
    }
    this.modalInstanz = null;
  },
  template: `
    <div
      ref="modalElement"
      class="modal fade"
      id="htbahLokalerSpeicherHinweisModal"
      tabindex="-1"
      aria-labelledby="htbahLokalerSpeicherHinweisModalLabel"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="htbahLokalerSpeicherHinweisModalLabel">
              Kurz zu Deinen Daten
            </h5>
          </div>
          <div class="modal-body text-start">
            <p class="mb-3">
              Bitte beachte: Alle Daten werden
              <strong>nur</strong>
              in dem Browser auf
              <strong>diesem Gerät</strong>
              gespeichert – mit dem Du genau diese Anwendung gerade aufrufst.
              Es gibt keinen Server, auf dem wir Deine Charaktere oder sonstige
              Einträge sichern; <strong>alles bleibt lokal in diesem Browser</strong>.
            </p>
            <p class="mb-3">
              Damit Du nichts verlierst (z.&nbsp;B. bei Browser-Wechsel, neuem
              Gerät oder wenn Speicher geleert wird), lohnt es sich,
              regelmäßig zu exportieren, was Dir wichtig ist.
            </p>
            <p class="mb-0 text-body-secondary small">
              Die Verantwortung für Backups und den Schutz Deiner Daten liegt
              bei Dir – eine Wiederherstellung verlorener lokaler Daten ist
              nicht möglich.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-primary"
              @click="verstandenSpeichern"
              data-bs-dismiss="modal">
              Verstanden
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
