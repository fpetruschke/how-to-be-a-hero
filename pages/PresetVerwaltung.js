window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.PresetVerwaltung = {
  data() {
    return {
      presets: window.HTBAH.ladePresets(),
    };
  },
  methods: {
    presetEntfernen(preset) {
      if (!confirm(`Preset "${preset.name}" löschen?`)) return;
      this.presets = this.presets.filter((eintrag) => eintrag !== preset);
      window.HTBAH.speicherePresets(this.presets);
    },
    presetExportieren(preset) {
      const blob = new Blob([JSON.stringify(preset, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      const dateiNameSicher = preset.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');

      downloadLink.download = 'charakter-preset-' + dateiNameSicher + '.json';
      downloadLink.click();
    },
    presetImportieren(event) {
      const datei = event.target.files[0];
      if (!datei) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          this.presets.push(json);
          window.HTBAH.speicherePresets(this.presets);
        } catch {
          alert('Ungültige Datei');
        }
      };
      reader.readAsText(datei);
    },
  },
  template: `
    <div class="container content py-3">
      <h4>Presets</h4>

      <div class="card p-3 mb-3">
        <router-link class="btn btn-success w-100 mb-2" to="/preset-bearbeiten">
          ➕ Neues Preset
        </router-link>

        <input type="file" class="form-control" @change="presetImportieren">
      </div>

      <div class="card p-3 mb-3" v-for="(preset, index) in presets">
        <h5 class="fw-bold">{{preset.name}}</h5>

        <button class="btn btn-sm btn-secondary me-1 mb-2" @click="$router.push('/preset-bearbeiten/' + index)">
          ✏️ Bearbeiten
        </button>

        <button class="btn btn-sm btn-primary me-1 mb-2" @click="presetExportieren(preset)">
          ⬇️ Export
        </button>

        <button class="btn btn-sm btn-danger mb-2" @click="presetEntfernen(preset)">
          🗑️ Löschen
        </button>
      </div>

      <div style="height:80px;"></div>
    </div>
  `,
};
