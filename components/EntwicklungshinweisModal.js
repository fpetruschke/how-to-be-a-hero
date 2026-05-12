window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const SPEICHER_KEY_ENTWICKLUNGSHINWEIS_VERSTANDEN_AM = 'entwicklungshinweis_verstanden_am';

window.HTBAH_KOMPONENTEN.EntwicklungshinweisModal = {
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
      const gespeichert = window.HTBAH?.speicher?.leseText(
        SPEICHER_KEY_ENTWICKLUNGSHINWEIS_VERSTANDEN_AM,
        null,
      );
      return gespeichert !== this.heutigesDatum();
    },
    verstandenSpeichern() {
      window.HTBAH?.speicher?.schreibeText(
        SPEICHER_KEY_ENTWICKLUNGSHINWEIS_VERSTANDEN_AM,
        this.heutigesDatum(),
      );
    },
    oeffnenWennBootstrapBereit(versuch = 0) {
      if (this.wirdEntfernt) {
        return;
      }
      const maxVersuche = 80;
      const el = this.$refs.modalElement;
      if (window.bootstrap && el) {
        // Bewusst minimal verzögert öffnen, damit ein ggf. zeitgleich
        // angezeigtes Speicherhinweis-Modal bereits initialisiert ist
        // und Bootstrap dieses Modal im Stack darüber positioniert.
        this.oeffnenRetryTimeoutId = window.setTimeout(() => {
          this.oeffnenRetryTimeoutId = null;
          if (this.wirdEntfernt) {
            return;
          }
          this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el, {
            backdrop: 'static',
            keyboard: false,
          });
          this.modalInstanz.show();
        }, 50);
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
      id="htbahEntwicklungshinweisModal"
      tabindex="-1"
      aria-labelledby="htbahEntwicklungshinweisModalLabel"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content shadow border-warning">
          <div class="modal-header text-bg-warning">
            <h5 class="modal-title d-flex align-items-center gap-2" id="htbahEntwicklungshinweisModalLabel">
              <span class="material-symbols-outlined" aria-hidden="true">construction</span>
              Anwendung in aktiver Entwicklung
            </h5>
          </div>
          <div class="modal-body text-start">
            <p class="mb-3 d-flex align-items-start gap-2">
              <span class="material-symbols-outlined text-warning flex-shrink-0" aria-hidden="true">warning</span>
              <span>
                Diese Anwendung befindet sich in
                <strong>aktiver Entwicklung</strong>.
                Es werden laufend Änderungen vorgenommen, die jederzeit dazu
                führen können, dass Deine bisherigen
                <strong>Speicherstände nicht mehr mit der Anwendung funktionieren</strong>.
              </span>
            </p>
            <p class="mb-0">
              Konkret kann es passieren, dass nach einem Update einzelne
              Charaktere, Zufallstabellen oder Weltenbau-Einträge nicht mehr
              korrekt geladen werden oder unerwartet aussehen.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-warning"
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
