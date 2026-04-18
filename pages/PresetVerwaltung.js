window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.PresetVerwaltung = {
  data() {
    return {
      presets: window.HTBAH.ladePresets(),
    };
  },
  methods: {
    presetEntfernen(preset) {
      if (window.HTBAH.istSystemFaehigkeitenPreset(preset)) {
        alert('Vorgegebene Fähigkeiten-Presets können nicht gelöscht werden.');
        return;
      }
      if (!confirm(`Fähigkeiten-Preset „${preset.name}“ löschen?`)) return;
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

      downloadLink.download = 'faehigkeiten-preset-' + dateiNameSicher + '.json';
      downloadLink.click();
    },
    presetImportieren(event) {
      const datei = event.target.files[0];
      if (!datei) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          if (json && typeof json === 'object' && json.htbahPresetId) {
            delete json.htbahPresetId;
          }
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
      <h4>Fähigkeiten-Presets</h4>

      <div class="card p-3 mb-3">
        <icon-text-button tag="router-link" to="/faehigkeiten-preset-bearbeiten" class="btn btn-success w-100 mb-2" icon="add">
          Neues Fähigkeiten-Preset
        </icon-text-button>

        <div class="form-floating">
          <input
            id="pv-preset-import"
            type="file"
            class="form-control"
            @change="presetImportieren" />
          <label for="pv-preset-import">Fähigkeiten-Preset-Datei importieren</label>
        </div>
      </div>

      <div class="card p-3 mb-3" v-for="(preset, index) in presets">
        <h5 class="fw-bold d-flex flex-wrap align-items-center gap-2">
          <span>{{preset.name}}</span>
          <span v-if="preset.htbahPresetId" class="badge text-bg-secondary">Vorgegeben</span>
        </h5>

        <icon-text-button class="btn btn-sm btn-secondary me-1 mb-2" icon="edit" @click="$router.push('/faehigkeiten-preset-bearbeiten/' + index)">
          Bearbeiten
        </icon-text-button>

        <icon-text-button class="btn btn-sm btn-primary me-1 mb-2" icon="download" @click="presetExportieren(preset)">
          Export
        </icon-text-button>

        <icon-text-button
          v-if="!preset.htbahPresetId"
          class="btn btn-sm btn-danger mb-2"
          icon="delete"
          @click="presetEntfernen(preset)">
          Löschen
        </icon-text-button>
      </div>

      <div style="height:80px;"></div>
    </div>
  `,
};
