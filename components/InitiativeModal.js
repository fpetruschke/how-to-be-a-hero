window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/** Initiative laut Regelwerk (Kampf): 1W10 + Begabungswert Handeln */
window.HTBAH_KOMPONENTEN.InitiativeModal = {
  props: {
    charakter: { type: Object, required: true },
  },
  data() {
    return {
      modalInstanz: null,
      letzterW10: null,
    };
  },
  computed: {
    summeHandeln() {
      const h = this.charakter.handeln;
      if (!Array.isArray(h)) {
        return 0;
      }
      return h.reduce((s, e) => s + (Number(e.value) || 0), 0);
    },
    begabungHandeln() {
      return Math.round(this.summeHandeln / 10);
    },
    initiativeErgebnis() {
      if (this.letzterW10 === null) {
        return null;
      }
      return this.letzterW10 + this.begabungHandeln;
    },
  },
  methods: {
    oeffnen() {
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      this.letzterW10 = null;
      this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
      this.modalInstanz.show();
    },
    wuerfeln() {
      this.letzterW10 = window.HTBAH.wuerfelW10();
      window.HTBAH.spieleWuerfelSounds(1);
    },
  },
  template: `
    <div
      class="modal fade"
      id="initiativeModal"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="initiativeModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="initiativeModalLabel">
              <span class="material-symbols-outlined" aria-hidden="true">swords</span>
              Initiative würfeln
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <p class="small text-body-secondary mb-3">
              Im Regelwerk: Jede Figur würfelt <strong>1W10</strong> und addiert den
              <strong>Begabungswert für Handeln</strong> (Summe aller Handeln-Fähigkeiten geteilt durch 10,
              kaufmännisch gerundet).
            </p>
            <div class="card p-3 mb-3 initiative-modal-begabung-card">
              <div class="d-flex justify-content-between align-items-center">
                <span>Begabung Handeln</span>
                <span class="fs-5 fw-bold">{{ begabungHandeln }}</span>
              </div>
            </div>
            <icon-text-button
              type="button"
              class="btn btn-primary w-100"
              icon="casino"
              @click="wuerfeln">
              1W10 würfeln
            </icon-text-button>
            <div
              v-if="letzterW10 !== null"
              class="mt-3 p-3 rounded border border-secondary border-opacity-25 initiative-modal-ergebnis">
              <div class="text-center">
                <div class="small text-body-secondary mb-1">Initiative</div>
                <div class="d-flex flex-wrap align-items-center justify-content-center gap-2 fs-5">
                  <span class="badge rounded-pill text-bg-primary px-3 py-2">W10: {{ letzterW10 }}</span>
                  <span class="text-body-secondary">+</span>
                  <span class="fw-semibold">{{ begabungHandeln }}</span>
                  <span class="text-body-secondary">=</span>
                  <span class="fs-3 fw-bold">{{ initiativeErgebnis }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
