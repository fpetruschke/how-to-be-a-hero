window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function normalisierePresetFaehigkeiten(roh) {
  if (!roh || typeof roh !== 'object') return null;
  const kategorien = ['handeln', 'wissen', 'soziales'];
  const out = { name: typeof roh.name === 'string' ? roh.name.trim() : '' };
  for (const k of kategorien) {
    if (!Array.isArray(roh[k])) return null;
    const arr = [];
    for (const eintrag of roh[k]) {
      if (!eintrag || typeof eintrag !== 'object') continue;
      const name = typeof eintrag.name === 'string' ? eintrag.name.trim() : '';
      if (!name) continue;
      const rohWert = eintrag.value;
      if (rohWert === null || rohWert === undefined || rohWert === '') {
        arr.push({ name, value: null });
        continue;
      }
      const value = Number(rohWert);
      if (Number.isNaN(value) || value < 1 || value > 100) continue;
      arr.push({ name, value });
    }
    out[k] = arr;
  }
  return out;
}

window.HTBAH_SEITEN.PresetVerwaltung = {
  data() {
    return {
      presets: window.HTBAH.ladePresets(),
    };
  },
  methods: {
    async presetEntfernen(preset) {
      if (window.HTBAH.istSystemFaehigkeitenPreset(preset)) {
        await window.HTBAH.ui.alert({
          titel: 'Löschen nicht möglich',
          beschreibung: 'Vorgegebene Fähigkeiten-Presets können nicht gelöscht werden.',
        });
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Fähigkeiten-Preset löschen?',
        beschreibung: `Fähigkeiten-Preset „${preset.name}“ löschen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) return;
      this.presets = this.presets.filter((eintrag) => eintrag !== preset);
      window.HTBAH.speicherePresets(this.presets);
    },
    presetExportieren(preset) {
      const exportPreset = normalisierePresetFaehigkeiten(preset);
      if (!exportPreset) {
        window.HTBAH.ui.notify({
          text: 'Preset ist ungültig und konnte nicht exportiert werden.',
          typ: 'danger',
        });
        return;
      }
      const blob = new Blob([JSON.stringify(exportPreset, null, 2)], {
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
      reader.onload = async () => {
        try {
          const json = JSON.parse(reader.result);
          const preset = normalisierePresetFaehigkeiten(json);
          if (!preset) {
            await window.HTBAH.ui.alert({
              titel: 'Import fehlgeschlagen',
              beschreibung:
                'Ungültige Datei. Erlaubt sind nur Fähigkeiten-Presets mit handeln, wissen und soziales.',
            });
            return;
          }
          this.presets.push(preset);
          window.HTBAH.speicherePresets(this.presets);
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Import fehlgeschlagen',
            beschreibung: 'Ungültige Datei.',
          });
        }
      };
      reader.readAsText(datei);
    },
  },
  template: `
    <div class="container content py-3">
      <h4 class="text-center mb-1 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">📦</span>
        <span>Fähigkeiten-Presets</span>
      </h4>
      <p class="small text-body-secondary text-center mb-3">
        Eigene Presets erstellen, importieren und verwalten.
      </p>

      <div class="card p-3 mb-3">
        <icon-text-button tag="router-link" to="/faehigkeiten-preset-bearbeiten" class="btn btn-success w-100 mb-2" icon="add">
          Neues Fähigkeiten-Preset
        </icon-text-button>

        <h5 class="mb-2">Preset Import</h5>
        <div class="form-floating">
          <input
            id="pv-preset-import"
            type="file"
            class="form-control"
            @change="presetImportieren" />
          <label for="pv-preset-import">Fähigkeiten-Preset-Datei importieren</label>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12 col-sm-6 col-lg-3" v-for="(preset, index) in presets" :key="preset.htbahPresetId || preset.name || index">
          <div class="card p-3 h-100">
            <div class="d-flex flex-column gap-2 mb-2" :class="preset.htbahPresetId ? 'flex-md-row align-items-md-start justify-content-md-between' : ''">
              <span
                v-if="preset.htbahPresetId"
                class="badge text-bg-secondary align-self-start order-md-2">
                Vorgegeben
              </span>
              <h5 class="fw-bold mb-0 order-md-1">{{preset.name}}</h5>
            </div>

            <div class="d-grid gap-2 mt-auto">
              <icon-text-button class="btn btn-sm btn-secondary" icon="edit" @click="$router.push('/faehigkeiten-preset-bearbeiten/' + index)">
                Bearbeiten
              </icon-text-button>

              <icon-text-button class="btn btn-sm btn-primary" icon="download" @click="presetExportieren(preset)">
                Export
              </icon-text-button>

              <icon-text-button
                v-if="!preset.htbahPresetId"
                class="btn btn-sm btn-danger"
                icon="delete"
                @click="presetEntfernen(preset)">
                Löschen
              </icon-text-button>
            </div>
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>
    </div>
  `,
};
