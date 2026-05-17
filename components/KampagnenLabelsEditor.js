window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;

  window.HTBAH_KOMPONENTEN.KampagnenLabelsEditor = {
    props: {
      kampagneId: { type: String, default: '' },
      /** Nur Badges anzeigen (Übersicht). */
      nurAnzeige: { type: Boolean, default: false },
    },
    emits: ['geaendert'],
    data() {
      return {
        katalog: null,
        labelEntwurf: '',
        refreshTick: 0,
      };
    },
    computed: {
      kampagne() {
        void this.refreshTick;
        const kid = typeof this.kampagneId === 'string' ? this.kampagneId.trim() : '';
        if (!kid || !window.HTBAH || typeof window.HTBAH.ladeSpielleiterZustand !== 'function') {
          return null;
        }
        const z = window.HTBAH.ladeSpielleiterZustand();
        const liste = Array.isArray(z && z.kampagnen) ? z.kampagnen : [];
        return liste.find((k) => k && k.id === kid) || null;
      },
      kampagneLabels() {
        if (!this.kampagne || !KL) {
          return [];
        }
        return KL.normalisiereKampagneLabels(this.kampagne.labels);
      },
      datalistId() {
        return `htbah-kampagnen-labels-dl-${this.kampagneId || 'x'}`;
      },
      zugewieseneLabelIds() {
        return this.kampagneLabels.map((l) => l.id);
      },
      autocompleteListe() {
        if (!KL || !this.katalog) {
          return [];
        }
        return KL.autocompleteVorschlaege(this.katalog, {
          query: this.labelEntwurf,
          limit: 32,
          excludeIds: this.zugewieseneLabelIds,
        });
      },
    },
    mounted() {
      this.katalogNeuLaden();
    },
    methods: {
      katalogNeuLaden() {
        if (!window.HTBAH || typeof window.HTBAH.ladeKampagnenLabelsKatalog !== 'function') {
          this.katalog = KL ? KL.normalisiereKatalog(null) : { version: 2, eintraege: [] };
          return;
        }
        this.katalog = window.HTBAH.ladeKampagnenLabelsKatalog();
      },
      nachSpeichern() {
        this.refreshTick += 1;
        this.katalogNeuLaden();
        this.$emit('geaendert');
      },
      badgeKlasse(label) {
        return window.HTBAH && typeof window.HTBAH.kampagnenLabelBadgeKlasse === 'function'
          ? window.HTBAH.kampagnenLabelBadgeKlasse(label)
          : 'text-bg-secondary';
      },
      btnCloseWeiss(label) {
        return KL ? KL.btnCloseWeiss(label) : false;
      },
      labelEntfernen(snapshot) {
        if (!snapshot || !this.kampagneId || !window.HTBAH) {
          return;
        }
        const ok =
          typeof window.HTBAH.setzeKampagneLabelAktiv === 'function' &&
          window.HTBAH.setzeKampagneLabelAktiv(this.kampagneId, snapshot.id, false);
        if (ok) {
          this.nachSpeichern();
        }
      },
      labelAusAutocompleteZuweisen() {
        const name = KL ? KL.normalisiereLabelName(this.labelEntwurf) : this.labelEntwurf.trim();
        if (!name || !this.kampagneId || !window.HTBAH || !KL) {
          return;
        }
        const eintrag = KL.findeKatalogEintrag(this.katalog, { name });
        if (!eintrag) {
          window.HTBAH.ui.notify({
            text: 'Kein passendes Label im Katalog. Labels legst du unter Einstellungen → Labels an.',
            typ: 'warning',
          });
          return;
        }
        if (this.zugewieseneLabelIds.includes(eintrag.id)) {
          this.labelEntwurf = '';
          return;
        }
        const ok =
          typeof window.HTBAH.setzeKampagneLabelAktiv === 'function' &&
          window.HTBAH.setzeKampagneLabelAktiv(this.kampagneId, eintrag.id, true);
        if (ok) {
          this.labelEntwurf = '';
          this.nachSpeichern();
        }
      },
      labelEntwurfKeydown(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.labelAusAutocompleteZuweisen();
        }
      },
      labelEntwurfInput() {
        const name = KL ? KL.normalisiereLabelName(this.labelEntwurf) : this.labelEntwurf.trim();
        if (!name || !this.katalog || !KL) {
          return;
        }
        const treffer = KL.findeKatalogEintrag(this.katalog, { name });
        if (
          treffer &&
          labelNameGleich(name, treffer.name) &&
          !this.zugewieseneLabelIds.includes(treffer.id)
        ) {
          this.labelEntwurf = treffer.name;
          this.labelAusAutocompleteZuweisen();
        }
      },
    },
    template: `
      <div class="htbah-kampagnen-labels-editor">
        <template v-if="kampagneId">
          <div v-if="kampagneLabels.length" class="d-flex flex-wrap gap-1" :class="{ 'mb-2': !nurAnzeige }" role="list" :aria-label="'Labels für ' + (kampagne && kampagne.name ? kampagne.name : 'Kampagne')">
            <span
              v-for="lab in kampagneLabels"
              :key="'kl-snap-' + kampagneId + '-' + lab.id"
              class="badge d-inline-flex align-items-center gap-1"
              :class="badgeKlasse(lab)"
              role="listitem">
              <span>{{ lab.name }}</span>
              <button
                v-if="!nurAnzeige"
                type="button"
                class="btn-close"
                :class="btnCloseWeiss(lab) ? 'btn-close-white' : ''"
                style="font-size: 0.55rem;"
                :aria-label="'Label „' + lab.name + '“ entfernen'"
                @click.stop="labelEntfernen(lab)"></button>
            </span>
          </div>
          <div v-if="!nurAnzeige" class="row g-1 align-items-end">
            <div class="col">
              <label :for="'kl-inp-' + datalistId" class="visually-hidden">Label aus Katalog zuweisen</label>
              <input
                :id="'kl-inp-' + datalistId"
                type="text"
                class="form-control form-control-sm"
                v-model="labelEntwurf"
                :list="datalistId"
                placeholder="Label aus Katalog wählen …"
                autocomplete="off"
                @keydown="labelEntwurfKeydown"
                @change="labelEntwurfInput" />
              <datalist :id="datalistId">
                <option v-for="v in autocompleteListe" :key="'dl-' + v.id" :value="v.name"></option>
              </datalist>
            </div>
          </div>
          <p v-if="!nurAnzeige && !kampagneLabels.length && !labelEntwurf" class="small text-body-secondary mb-0">
            Noch keine Labels. Wähle ein Label aus dem Katalog (Einstellungen → Labels).
          </p>
        </template>
      </div>
    `,
  };

  function labelNameGleich(a, b) {
    if (!KL) {
      return String(a || '').trim() === String(b || '').trim();
    }
    return KL.labelNameSchluessel(a) === KL.labelNameSchluessel(b);
  }
})();
