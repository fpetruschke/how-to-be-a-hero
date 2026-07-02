window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function registerEffektRahmenVerwaltung() {
  const ERM = window.HTBAH_SHARED && window.HTBAH_SHARED.EffektRahmenModel;

  window.HTBAH_KOMPONENTEN.EffektRahmenVerwaltung = {
    name: 'EffektRahmenVerwaltung',
    props: {
      kompakt: { type: Boolean, default: false },
    },
    emits: ['geaendert'],
    data() {
      return {
        rahmen: [],
        neuerLabel: '',
        neuerFarbe: '#6366f1',
        neuerBreite: 4,
      };
    },
    mounted() {
      this.neuLaden();
      this._effektRahmenHandler = () => this.neuLaden();
      window.addEventListener('htbah:effekt-rahmen-geaendert', this._effektRahmenHandler);
    },
    beforeUnmount() {
      if (this._effektRahmenHandler) {
        window.removeEventListener('htbah:effekt-rahmen-geaendert', this._effektRahmenHandler);
      }
    },
    methods: {
      neuLaden() {
        const konfig =
          window.HTBAH && typeof window.HTBAH.ladeEffektRahmenEinstellungen === 'function'
            ? window.HTBAH.ladeEffektRahmenEinstellungen()
            : ERM
              ? ERM.normalisiereEffektRahmenKonfiguration(null)
              : { rahmen: [] };
        this.rahmen = Array.isArray(konfig.rahmen) ? konfig.rahmen.map((r) => ({ ...r })) : [];
      },
      persistiere() {
        const norm =
          window.HTBAH && typeof window.HTBAH.setzeEffektRahmenEinstellungen === 'function'
            ? window.HTBAH.setzeEffektRahmenEinstellungen({ rahmen: this.rahmen })
            : null;
        if (norm && Array.isArray(norm.rahmen)) {
          this.rahmen = norm.rahmen.map((r) => ({ ...r }));
        }
        this.$emit('geaendert', this.rahmen);
      },
      rahmenAktualisieren(index, patch) {
        if (!this.rahmen[index]) {
          return;
        }
        this.rahmen[index] = { ...this.rahmen[index], ...patch };
        this.persistiere();
      },
      rahmenEntfernen(index) {
        const eintrag = this.rahmen[index];
        if (!eintrag || eintrag.builtIn) {
          return;
        }
        this.rahmen = this.rahmen.filter((_, i) => i !== index);
        this.persistiere();
      },
      neuenRahmenHinzufuegen() {
        const label = String(this.neuerLabel || '').trim();
        if (!label) {
          return;
        }
        const id = ERM && typeof ERM.neueRahmenId === 'function' ? ERM.neueRahmenId() : `effekt-${Date.now()}`;
        const farbe =
          ERM && typeof ERM.normalisiereHexFarbe === 'function'
            ? ERM.normalisiereHexFarbe(this.neuerFarbe, '#6366f1')
            : this.neuerFarbe;
        const widthPx = Math.min(24, Math.max(1, Math.round(Number(this.neuerBreite) || 4)));
        this.rahmen = [
          ...this.rahmen,
          {
            id,
            label,
            color: farbe,
            widthPx,
            builtIn: false,
            enabledByDefault: true,
            showLabel: true,
          },
        ];
        this.neuerLabel = '';
        this.persistiere();
      },
      vorschauStil(rahmenEintrag) {
        const w = Math.max(1, Number(rahmenEintrag.widthPx) || 4);
        return {
          width: '2.25rem',
          height: '2.25rem',
          borderStyle: 'solid',
          borderWidth: `${Math.min(w, 6)}px`,
          borderColor: rahmenEintrag.color || '#000',
          borderRadius: '50%',
          background: 'transparent',
          flexShrink: 0,
        };
      },
    },
    template: `
      <div class="htbah-effekt-rahmen-verwaltung" :class="{ 'htbah-effekt-rahmen-verwaltung--kompakt': kompakt }">
        <p v-if="!kompakt" class="small text-body-secondary mb-3">
          Status- und Effekt-Rahmen für ausdruckbare Token-Overlays. Standard: tot (rot), bewusstlos (gelb),
          schlafend (hellblau). Größe und Form orientieren sich beim Export an den gewählten Token-Maßen.
        </p>
        <div class="d-flex flex-column gap-2 mb-3">
          <div
            v-for="(rahmenEintrag, index) in rahmen"
            :key="rahmenEintrag.id"
            class="htbah-effekt-rahmen-zeile d-flex flex-wrap align-items-center gap-2 p-2 rounded border border-secondary border-opacity-25">
            <span :style="vorschauStil(rahmenEintrag)" aria-hidden="true"></span>
            <input
              class="form-control form-control-sm"
              :class="kompakt ? 'flex-grow-1' : ''"
              style="min-width: 7rem; max-width: 12rem"
              type="text"
              :value="rahmenEintrag.label"
              :readonly="rahmenEintrag.builtIn"
              @change="rahmenAktualisieren(index, { label: $event.target.value })" />
            <input
              class="form-control form-control-color form-control-sm"
              type="color"
              :value="rahmenEintrag.color"
              :title="'Farbe: ' + rahmenEintrag.label"
              @input="rahmenAktualisieren(index, { color: $event.target.value })" />
            <div class="input-group input-group-sm" style="width: 6.5rem">
              <input
                class="form-control"
                type="number"
                min="1"
                max="24"
                step="1"
                :value="rahmenEintrag.widthPx"
                @change="rahmenAktualisieren(index, { widthPx: Number($event.target.value) })" />
              <span class="input-group-text">px</span>
            </div>
            <div class="form-check form-switch mb-0 flex-shrink-0">
              <input
                :id="'effekt-show-label-' + rahmenEintrag.id"
                class="form-check-input"
                type="checkbox"
                role="switch"
                :checked="rahmenEintrag.showLabel !== false"
                @change="rahmenAktualisieren(index, { showLabel: $event.target.checked })" />
              <label class="form-check-label small text-nowrap" :for="'effekt-show-label-' + rahmenEintrag.id">
                Name
              </label>
            </div>
            <span v-if="rahmenEintrag.builtIn" class="badge text-bg-secondary">Standard</span>
            <button
              v-else
              type="button"
              class="btn btn-outline-danger btn-sm"
              title="Rahmen entfernen"
              @click="rahmenEntfernen(index)">
              Entfernen
            </button>
          </div>
        </div>
        <div class="htbah-effekt-rahmen-neu d-flex flex-wrap align-items-end gap-2 pt-2 border-top border-secondary border-opacity-25">
          <div>
            <label class="form-label small mb-1">Neuer Effekt-Rahmen</label>
            <input
              v-model="neuerLabel"
              class="form-control form-control-sm"
              type="text"
              placeholder="z. B. Vergiftet"
              style="min-width: 10rem" />
          </div>
          <div>
            <label class="form-label small mb-1">Farbe</label>
            <input v-model="neuerFarbe" class="form-control form-control-color form-control-sm" type="color" />
          </div>
          <div>
            <label class="form-label small mb-1">Breite</label>
            <div class="input-group input-group-sm" style="width: 6.5rem">
              <input v-model.number="neuerBreite" class="form-control" type="number" min="1" max="24" step="1" />
              <span class="input-group-text">px</span>
            </div>
          </div>
          <button type="button" class="btn btn-outline-primary btn-sm" :disabled="!neuerLabel.trim()" @click="neuenRahmenHinzufuegen">
            Rahmen hinzufügen
          </button>
        </div>
      </div>
    `,
  };
})();
