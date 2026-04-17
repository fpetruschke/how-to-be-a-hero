window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.PresetEditor = {
  data() {
    return {
      preset: {
        name: '',
        handeln: [],
        wissen: [],
        soziales: [],
      },
      neueFaehigkeit: { name: '', value: '', type: 'handeln' },
      istBearbeitung: false,
      presetIndex: null,
    };
  },
  created() {
    const id = this.$route.params.id;

    if (id !== undefined) {
      const presets = window.HTBAH.ladePresets();
      const preset = presets[id];

      if (preset) {
        this.preset = JSON.parse(JSON.stringify(preset));
        this.istBearbeitung = true;
        this.presetIndex = id;
      }
    }
  },
  methods: {
    faehigkeitHinzufuegen() {
      if (!this.neueFaehigkeit.name) return;

      const wert =
        this.neueFaehigkeit.value === '' || this.neueFaehigkeit.value === null
          ? null
          : Number(this.neueFaehigkeit.value);

      if (wert !== null && (wert < 1 || wert > 100)) {
        alert('Wert muss zwischen 1 und 100 liegen');
        return;
      }

      this.preset[this.neueFaehigkeit.type].push({
        name: this.neueFaehigkeit.name,
        value: wert,
      });

      this.neueFaehigkeit.name = '';
      this.neueFaehigkeit.value = '';
    },
    faehigkeitEntfernen(kategorie, faehigkeit) {
      if (!confirm(`"${faehigkeit.name}" löschen?`)) return;
      const index = this.preset[kategorie].indexOf(faehigkeit);
      this.preset[kategorie].splice(index, 1);
    },
    presetSpeichern() {
      if (!this.preset.name) {
        alert('Name fehlt');
        return;
      }

      const presets = window.HTBAH.ladePresets();

      if (this.istBearbeitung) {
        presets[this.presetIndex] = this.preset;
      } else {
        presets.push(this.preset);
      }

      window.HTBAH.speicherePresets(presets);
      this.$router.push('/preset-verwaltung');
    },
  },
  computed: {
    sliderWert: {
      get() {
        return this.neueFaehigkeit.value ?? 0;
      },
      set(wert) {
        this.neueFaehigkeit.value = wert === 0 ? null : wert;
      },
    },
    sortierteFaehigkeiten() {
      return (kategorie) =>
        [...this.preset[kategorie]].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    },
  },
  template: `
    <div class="container content py-3">
      <h4>{{ istBearbeitung ? 'Preset bearbeiten' : 'Preset erstellen' }}</h4>

      <div class="form-floating mb-3">
        <input id="pe-preset-name" class="form-control" v-model="preset.name" placeholder=" ">
        <label for="pe-preset-name">Preset-Name</label>
      </div>

      <div v-for="kategorie in ['handeln','wissen','soziales']" class="card p-3 mb-3">
        <h5 class="text-uppercase fw-bold">{{kategorie}}</h5>

        <ul>
          <li v-for="faehigkeit in sortierteFaehigkeiten(kategorie)" class="mb-2">
            <strong>{{faehigkeit.name}}</strong><br>
            <small v-if="faehigkeit.value !== null">{{faehigkeit.value}}</small>
            <small v-else class="text-secondary">kein Wert</small>

            <div>
              <button class="btn btn-sm btn-danger mt-1" @click="faehigkeitEntfernen(kategorie, faehigkeit)">
                🗑️
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div class="card p-3 mb-3">
        <h5>Fähigkeit hinzufügen</h5>

        <div class="form-floating mb-2">
          <input id="pe-neue-faeh-name" class="form-control" v-model="neueFaehigkeit.name" placeholder=" ">
          <label for="pe-neue-faeh-name">Fähigkeit</label>
        </div>

        <div class="mb-2 d-flex align-items-center gap-2">
          <input type="range"
                 class="form-range flex-grow-1"
                 v-model.number="sliderWert"
                 min="0"
                 max="100"
                 step="1">

          <div class="form-floating" style="width: 5.5rem; flex-shrink: 0">
            <input
              type="number"
              id="pe-neue-faeh-wert"
              class="form-control"
              v-model.number="neueFaehigkeit.value"
              min="0"
              max="100"
              placeholder=" ">
            <label for="pe-neue-faeh-wert">Wert (optional)</label>
          </div>
        </div>

        <div class="form-floating mb-2">
          <select id="pe-neue-faeh-kat" class="form-select" v-model="neueFaehigkeit.type">
            <option value="handeln">Handeln</option>
            <option value="wissen">Wissen</option>
            <option value="soziales">Soziales</option>
          </select>
          <label for="pe-neue-faeh-kat">Kategorie</label>
        </div>

        <button class="btn btn-primary w-100" @click="faehigkeitHinzufuegen">
          Hinzufügen
        </button>
      </div>

      <button class="btn btn-success w-100" @click="presetSpeichern">
        Preset speichern
      </button>

      <div style="height:80px;"></div>
    </div>
  `,
};
