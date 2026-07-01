window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.VorNachteilZeileModal = {
  name: 'VorNachteilZeileModal',
  data() {
    return {
      modalInstanz: null,
      typ: 'vorteil',
      entwurf: { beschreibung: '', punkte: '' },
      referenz: null,
    };
  },
  computed: {
    titel() {
      return this.typ === 'nachteil' ? 'Nachteil bearbeiten' : 'Vorteil bearbeiten';
    },
    punkteLabel() {
      return this.typ === 'nachteil'
        ? 'Punkte (positiv eingeben, wirken als Malus / geben Budget frei)'
        : 'Punkte (kosten Fähigkeitspunkte vom Budget)';
    },
  },
  methods: {
    oeffnen(typ, eintrag) {
      const CM = window.HTBAH_CHARAKTER_MODEL;
      this.typ = typ === 'nachteil' ? 'nachteil' : 'vorteil';
      this.referenz = eintrag || null;
      const beschreibung =
        eintrag && CM && typeof CM.vorNachteilBeschreibungVorschau === 'function'
          ? CM.vorNachteilBeschreibungVorschau(eintrag.beschreibungHtml)
          : '';
      this.entwurf = {
        beschreibung,
        punkte: eintrag && eintrag.punkte != null ? String(eintrag.punkte) : '',
      };
      this.$nextTick(() => {
        const el = this.$refs.modalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
      });
    },
    modalGeschlossen() {
      this.referenz = null;
      this.entwurf = { beschreibung: '', punkte: '' };
    },
    async speichern() {
      const CM = window.HTBAH_CHARAKTER_MODEL;
      const beschreibung = String(this.entwurf.beschreibung || '').trim();
      if (!beschreibung) {
        await window.HTBAH.ui.alert({
          titel: 'Eingabe unvollständig',
          beschreibung: 'Bitte eine Beschreibung angeben.',
        });
        return;
      }
      const beschreibungHtml = CM.vorNachteilBeschreibungAlsHtml(beschreibung);
      const punkte = CM.normalisiereVorNachteilPunkte(this.entwurf.punkte);
      if (this.referenz) {
        this.referenz.beschreibungHtml = beschreibungHtml;
        this.referenz.punkte = punkte;
        this.$emit('gespeichert', { typ: this.typ, eintrag: this.referenz });
      } else {
        this.$emit('gespeichert', { typ: this.typ, daten: { beschreibungHtml, punkte } });
      }
      const el = this.$refs.modalElement;
      if (el && window.bootstrap) {
        const instanz = window.bootstrap.Modal.getInstance(el);
        if (instanz) {
          instanz.hide();
        }
      }
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el) {
      el.addEventListener('hidden.bs.modal', this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el) {
      el.removeEventListener('hidden.bs.modal', this.modalGeschlossen);
    }
  },
  template: `
    <div
      class="modal fade"
      ref="modalElement"
      tabindex="-1"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow-lg">
          <div class="modal-header">
            <h5 class="modal-title">{{ titel }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <label class="form-label small text-body-secondary" for="vn-zeile-beschreibung">Beschreibung</label>
            <textarea
              id="vn-zeile-beschreibung"
              class="form-control mb-3"
              rows="4"
              v-model="entwurf.beschreibung"
              :placeholder="typ === 'nachteil' ? 'Nachteil beschreiben…' : 'Vorteil beschreiben…'"></textarea>
            <div class="form-floating">
              <input
                id="vn-zeile-punkte"
                type="number"
                class="form-control"
                min="1"
                step="1"
                inputmode="numeric"
                v-model="entwurf.punkte"
                placeholder=" " />
              <label for="vn-zeile-punkte">{{ punkteLabel }}</label>
            </div>
            <p class="small text-body-secondary mb-0 mt-2">
              Punkte sind optional. Ohne Wert hat der Eintrag keinen Effekt auf die 400-Punkte-Verteilung.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Abbrechen</button>
            <button type="button" class="btn btn-primary btn-sm" @click="speichern">Speichern</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
