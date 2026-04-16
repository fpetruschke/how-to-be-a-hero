window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

const KATEGORIE_INFOS = {
  handeln: {
    erklaerung:
      'Handeln umfasst körperliche, praktische und unmittelbare Aktionen in der Spielwelt.',
    beispiele: ['Klettern', 'Schleichen', 'Kampf', 'Schlösser knacken', 'Fahren'],
  },
  wissen: {
    erklaerung:
      'Wissen umfasst gelerntes, logisches und analytisches Können rund um Fakten und Zusammenhänge.',
    beispiele: ['Heilkunde', 'Geschichte', 'Magiekunde', 'Sprachen', 'Technik'],
  },
  soziales: {
    erklaerung:
      'Soziales umfasst alle Fähigkeiten im Umgang mit anderen Personen, Gruppen und Beziehungen.',
    beispiele: ['Überreden', 'Lügen', 'Menschenkenntnis', 'Verhandeln', 'Auftreten'],
  },
};

function leererCharakter() {
  return {
    name: '',
    geschlecht: '',
    alter: null,
    lebenspunkte: null,
    statur: '',
    religion: '',
    beruf: '',
    familienstand: '',
    inventarHtml: '',
    journalHtml: '',
    handeln: [],
    wissen: [],
    soziales: [],
  };
}

function charakterMitDefaults(gespeicherterCharakter) {
  const basis = leererCharakter();
  const quelle =
    gespeicherterCharakter && typeof gespeicherterCharakter === 'object'
      ? gespeicherterCharakter
      : {};

  return {
    ...basis,
    ...quelle,
    handeln: Array.isArray(quelle.handeln) ? quelle.handeln : [],
    wissen: Array.isArray(quelle.wissen) ? quelle.wissen : [],
    soziales: Array.isArray(quelle.soziales) ? quelle.soziales : [],
  };
}

window.HTBAH_SEITEN.CharakterErstellung = {
  data() {
    return {
      presets: window.HTBAH.ladePresets(),
      ausgewaehltesPreset: '',
      charakter: charakterMitDefaults(window.HTBAH.ladeCharakter()),
      charakterBild: window.HTBAH.ladeCharakterBild(),
      tempBildQuelle: '',
      aktiveInfo: null,
      aktiveKategorieInfo: null,
      zeigePresetAktionen: false,
      neueFaehigkeit: { name: '', value: 0, type: 'handeln' },
      cropper: null,
      cropperModal: null,
      bildVerwaltungModal: null,
      bildGrossModal: null,
      inventarModal: null,
      journalModal: null,
      inventarQuill: null,
      journalQuill: null,
    };
  },
  computed: {
    summen() {
      return {
        handeln: this.charakter.handeln.reduce((summe, eintrag) => summe + eintrag.value, 0),
        wissen: this.charakter.wissen.reduce((summe, eintrag) => summe + eintrag.value, 0),
        soziales: this.charakter.soziales.reduce((summe, eintrag) => summe + eintrag.value, 0),
      };
    },
    begabungen() {
      return {
        handeln: Math.round(this.summen.handeln / 10),
        wissen: Math.round(this.summen.wissen / 10),
        soziales: Math.round(this.summen.soziales / 10),
      };
    },
    geistesblitzWerte() {
      return {
        handeln: Math.round(this.begabungen.handeln / 10),
        wissen: Math.round(this.begabungen.wissen / 10),
        soziales: Math.round(this.begabungen.soziales / 10),
      };
    },
    punkte() {
      return this.summen.handeln + this.summen.wissen + this.summen.soziales;
    },
    kategorieInfos() {
      return KATEGORIE_INFOS;
    },
  },
  watch: {
    charakter: {
      deep: true,
      handler() {
        window.HTBAH.speichereCharakter(this.charakter);
      },
    },
  },
  methods: {
    presetAnwenden() {
      const preset = this.presets.find((eintrag) => eintrag.name === this.ausgewaehltesPreset);
      if (!preset) return;

      if (!confirm('Aktuellen Charakter überschreiben?')) return;

      this.charakter.handeln = JSON.parse(JSON.stringify(preset.handeln));
      this.charakter.wissen = JSON.parse(JSON.stringify(preset.wissen));
      this.charakter.soziales = JSON.parse(JSON.stringify(preset.soziales));
    },
    infoUmschalten(kategorie) {
      this.aktiveInfo = this.aktiveInfo === kategorie ? null : kategorie;
    },
    kategorieInfoUmschalten(kategorie) {
      this.aktiveKategorieInfo = this.aktiveKategorieInfo === kategorie ? null : kategorie;
    },
    presetAktionenUmschalten() {
      this.zeigePresetAktionen = !this.zeigePresetAktionen;
    },
    sortierteFaehigkeiten(kategorie) {
      return [...this.charakter[kategorie]].sort((a, b) =>
        a.name.localeCompare(b.name, 'de'),
      );
    },
    faehigkeitBearbeiten(faehigkeit) {
      faehigkeit.editing = true;
      faehigkeit._backup = { ...faehigkeit };
    },
    faehigkeitSpeichern(faehigkeit) {
      if (faehigkeit.value > 100) {
        alert('Max 100');
        return;
      }
      faehigkeit.editing = false;
    },
    bearbeitungAbbrechen(faehigkeit) {
      Object.assign(faehigkeit, faehigkeit._backup);
      faehigkeit.editing = false;
    },
    faehigkeitEntfernen(kategorie, faehigkeit) {
      if (!confirm(`Fähigkeit "${faehigkeit.name}" wirklich löschen?`)) {
        return;
      }

      const index = this.charakter[kategorie].indexOf(faehigkeit);
      this.charakter[kategorie].splice(index, 1);
    },
    faehigkeitHinzufuegen() {
      if (!this.neueFaehigkeit.name) {
        alert('Gib einen Namen an.');
        return;
      }

      const wert = Number(this.neueFaehigkeit.value);

      if (wert <= 0) {
        alert('Wert muss größer als 0 sein');
        return;
      }

      if (wert > 100) {
        alert('Maximalwert ist 100');
        return;
      }

      if (this.punkte + wert > 400) {
        alert('Du hast nicht genug Punkte übrig');
        return;
      }

      this.charakter[this.neueFaehigkeit.type].push({
        name: this.neueFaehigkeit.name,
        value: wert,
      });

      this.neueFaehigkeit.name = '';
      this.neueFaehigkeit.value = 0;
    },
    bildDateiAusgewaehlt(event) {
      const datei = event.target.files && event.target.files[0];
      if (!datei) {
        return;
      }

      if (!datei.type.startsWith('image/')) {
        alert('Bitte wähle eine Bilddatei aus.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.tempBildQuelle = String(reader.result || '');
        this.$nextTick(() => {
          const modalElement = this.$refs.cropperModalElement;
          if (!modalElement) {
            return;
          }

          this.cropperModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
          this.cropperModal.show();
          this.$nextTick(() => this.cropperInitialisieren());
        });
      };

      reader.readAsDataURL(datei);
    },
    cropperInitialisieren() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }

      const bildElement = this.$refs.cropperBildElement;
      if (!bildElement || !this.tempBildQuelle || !window.Cropper) {
        return;
      }

      this.cropper = new window.Cropper(bildElement, {
        aspectRatio: 3 / 4,
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        responsive: true,
      });
    },
    zugeschnittenesBildSpeichern() {
      if (!this.cropper) {
        return;
      }

      const canvas = this.cropper.getCroppedCanvas({
        width: 360,
        height: 480,
        imageSmoothingQuality: 'high',
      });

      if (!canvas) {
        alert('Das Bild konnte nicht zugeschnitten werden.');
        return;
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.charakterBild = dataUrl;
      window.HTBAH.speichereCharakterBild(dataUrl);
      this.cropperAufraeumen();

      if (this.cropperModal) {
        this.cropperModal.hide();
      }
    },
    charakterBildEntfernen() {
      if (!this.charakterBild) {
        return;
      }

      if (!confirm('Charakterbild wirklich entfernen?')) {
        return;
      }

      this.charakterBild = '';
      window.HTBAH.loescheCharakterBild();
    },
    bildVerwaltungOeffnen() {
      const modalElement = this.$refs.bildVerwaltungModalElement;
      if (!modalElement) {
        return;
      }

      this.bildVerwaltungModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.bildVerwaltungModal.show();
    },
    charakterBildGrossAnzeigen() {
      if (!this.charakterBild) {
        return;
      }

      const modalElement = this.$refs.bildGrossModalElement;
      if (!modalElement) {
        return;
      }

      this.bildGrossModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.bildGrossModal.show();
    },
    cropperAufraeumen() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }

      this.tempBildQuelle = '';

      if (this.$refs.bildInputElement) {
        this.$refs.bildInputElement.value = '';
      }
    },
    cropperModalGeschlossen() {
      this.cropperAufraeumen();
    },
    inventarEditorInitialisieren() {
      if (!window.Quill || !this.$refs.inventarEditorElement) {
        return;
      }

      if (!this.inventarQuill) {
        this.inventarQuill = new window.Quill(this.$refs.inventarEditorElement, {
          theme: 'snow',
          placeholder: 'Notiere dein Inventar...',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              [{ header: [1, 2, false] }],
              ['clean'],
            ],
          },
        });
      }

      this.inventarQuill.root.innerHTML = this.charakter.inventarHtml || '';
    },
    journalEditorInitialisieren() {
      if (!window.Quill || !this.$refs.journalEditorElement) {
        return;
      }

      if (!this.journalQuill) {
        this.journalQuill = new window.Quill(this.$refs.journalEditorElement, {
          theme: 'snow',
          placeholder: 'Halte Ereignisse und Gedanken fest...',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              [{ header: [1, 2, false] }],
              ['clean'],
            ],
          },
        });
      }

      this.journalQuill.root.innerHTML = this.charakter.journalHtml || '';
    },
    inventarDialogOeffnen() {
      const modalElement = this.$refs.inventarModalElement;
      if (!modalElement) {
        return;
      }

      this.inventarModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.inventarModal.show();
      this.$nextTick(() => this.inventarEditorInitialisieren());
    },
    journalDialogOeffnen() {
      const modalElement = this.$refs.journalModalElement;
      if (!modalElement) {
        return;
      }

      this.journalModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.journalModal.show();
      this.$nextTick(() => this.journalEditorInitialisieren());
    },
    inventarSpeichern() {
      if (this.inventarQuill) {
        this.charakter.inventarHtml = this.inventarQuill.root.innerHTML;
      }
      if (this.inventarModal) {
        this.inventarModal.hide();
      }
    },
    journalSpeichern() {
      if (this.journalQuill) {
        this.charakter.journalHtml = this.journalQuill.root.innerHTML;
      }
      if (this.journalModal) {
        this.journalModal.hide();
      }
    },
  },
  mounted() {
    const modalElement = this.$refs.cropperModalElement;
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', this.cropperModalGeschlossen);
    }
  },
  beforeUnmount() {
    const modalElement = this.$refs.cropperModalElement;
    if (modalElement) {
      modalElement.removeEventListener('hidden.bs.modal', this.cropperModalGeschlossen);
    }
    this.cropperAufraeumen();

    if (this.inventarQuill) {
      this.inventarQuill = null;
    }

    if (this.journalQuill) {
      this.journalQuill = null;
    }
  },
  template: `
    <div class="container content py-3">
      <h4>Charakter</h4>

      <div class="card p-3 mb-2">
        <div class="row g-3">
          <div class="col-12 col-lg-8">
            <input class="form-control mb-2" v-model="charakter.name" placeholder="Name">

            <div class="row g-2 mb-2">
              <div class="col-12 col-md-4">
                <input class="form-control" v-model="charakter.geschlecht" placeholder="Geschlecht">
              </div>
              <div class="col-12 col-md-4">
                <input type="number" class="form-control" v-model.number="charakter.alter" min="0" placeholder="Alter">
              </div>
              <div class="col-12 col-md-4">
                <input type="number" class="form-control" v-model.number="charakter.lebenspunkte" min="0" placeholder="Lebenspunkte">
              </div>
            </div>

            <div class="row g-2 mb-2">
              <div class="col-12 col-md-6">
                <input class="form-control" v-model="charakter.statur" placeholder="Statur">
              </div>
              <div class="col-12 col-md-6">
                <input class="form-control" v-model="charakter.religion" placeholder="Religion">
              </div>
            </div>

            <div class="row g-2">
              <div class="col-12 col-md-6">
                <input class="form-control" v-model="charakter.beruf" placeholder="Beruf">
              </div>
              <div class="col-12 col-md-6">
                <input class="form-control" v-model="charakter.familienstand" placeholder="Familienstand">
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-4">
            <h6 class="mb-2">Charakterbild</h6>
            <div class="text-center mb-2">
              <img
                v-if="charakterBild"
                :src="charakterBild"
                alt="Charakterbild"
                class="charakterbild-vorschau-klein" />
              <div v-else class="charakterbild-platzhalter-klein">
                <span class="material-symbols-outlined" aria-hidden="true">person</span>
              </div>
            </div>

            <button
              class="btn btn-outline-primary w-100"
              @click="bildVerwaltungOeffnen">
              Bild verwalten
            </button>
          </div>
        </div>
      </div>

      <div class="card p-2 mb-2">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="mb-0">Fähigkeiten</h5>
          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
              @click="presetAktionenUmschalten"
              aria-label="Preset-Aktionen">
              <span class="material-symbols-outlined" aria-hidden="true">settings</span>
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
              data-bs-toggle="modal"
              data-bs-target="#faehigkeitenHilfeModal"
              aria-label="Hilfe zu Fähigkeiten">
              <span class="material-symbols-outlined" aria-hidden="true">help</span>
            </button>
          </div>
        </div>

        <div v-if="zeigePresetAktionen" class="card p-2 mb-2">
          <h6 class="mb-2">Presets</h6>
          <select class="form-select mb-2" v-model="ausgewaehltesPreset">
            <option value="">-- auswählen --</option>
            <option v-for="preset in presets" :value="preset.name">
              {{preset.name}}
            </option>
          </select>
          <button class="btn btn-primary w-100" @click="presetAnwenden">
            Preset anwenden
          </button>
        </div>

        <div class="mb-2">
          <p>
            Punkte: <strong>{{punkte}}</strong> / 400
            <span class="text-warning">({{400 - punkte}} übrig)</span>
          </p>

          <div class="progress" style="height:10px;">
            <div class="progress-bar" :style="{width: (punkte/400*100) + '%'}"></div>
          </div>
        </div>

        <div class="row g-2 mb-2">
          <div
            v-for="kategorie in ['handeln','wissen','soziales']"
            class="col-12 col-md-4">
            <div class="card p-2 h-100">
              <h5 class="text-uppercase fw-bold d-flex align-items-center gap-1">
                <span>{{kategorie}}</span>
                <span
                  class="material-symbols-outlined"
                  @click="kategorieInfoUmschalten(kategorie)"
                  style="cursor:pointer;"
                  aria-label="Kategorie-Info">
                  info
                </span>
              </h5>
              <div
                v-if="aktiveKategorieInfo === kategorie"
                class="mb-2 p-2 rounded"
                style="background:var(--input-bg);">
                <small>
                  {{ kategorieInfos[kategorie].erklaerung }}
                </small>
                <ul class="mt-2 mb-0">
                  <li v-for="beispiel in kategorieInfos[kategorie].beispiele">
                    <small>{{ beispiel }}</small>
                  </li>
                </ul>
              </div>
              <p>Summe: {{summen[kategorie]}}</p>
              <p>
                Begabung: <strong>{{begabungen[kategorie]}}</strong>
                <span class="material-symbols-outlined" @click="infoUmschalten(kategorie)" style="cursor:pointer;">
                  info
                </span>
                <div
                  v-if="aktiveInfo === kategorie"
                  class="mt-2 p-2 rounded"
                  style="background:var(--input-bg);">
                  <small>
                    Begabung = Summe der Fähigkeiten / 10.<br>
                    Verbessert alle Fähigkeiten dieser Kategorie.
                  </small>
                </div>
              </p>
              <p>Geistesblitz: {{geistesblitzWerte[kategorie]}}</p>

              <ul>
                <li
                  v-for="(faehigkeit, index) in sortierteFaehigkeiten(kategorie)"
                  class="mb-2 p-2 rounded"
                  style="background:var(--input-bg);">
                  <div v-if="!faehigkeit.editing">
                    <strong>{{faehigkeit.name}}</strong><br>
                    <small>{{faehigkeit.value}} + {{begabungen[kategorie]}} = {{faehigkeit.value + begabungen[kategorie]}}</small>

                    <div class="mt-1">
                      <button class="btn btn-sm btn-secondary me-1" @click="faehigkeitBearbeiten(faehigkeit)">
                        ✏️
                      </button>

                      <button class="btn btn-sm btn-danger" @click="faehigkeitEntfernen(kategorie, faehigkeit)">
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div v-else>
                    <input class="form-control mb-1" v-model="faehigkeit.name">
                    <div class="mb-2 d-flex align-items-center gap-2">
                      <input type="range"
                             class="form-range flex-grow-1"
                             v-model.number="neueFaehigkeit.value"
                             min="0"
                             max="100"
                             step="1">

                      <input type="number"
                             class="form-control"
                             style="width:70px"
                             v-model.number="neueFaehigkeit.value"
                             min="0"
                             max="100">
                    </div>
                    <button class="btn btn-sm btn-success me-1" @click="faehigkeitSpeichern(faehigkeit)">
                      ✔️
                    </button>

                    <button class="btn btn-sm btn-secondary" @click="bearbeitungAbbrechen(faehigkeit)">
                      ✖️
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card p-2">
          <h5>Neue Fähigkeit</h5>
          <input class="form-control mb-2" v-model="neueFaehigkeit.name">
          <input type="number" class="form-control mb-2" v-model="neueFaehigkeit.value" min="0" max="100">
          <select class="form-select mb-2" v-model="neueFaehigkeit.type">
            <option value="handeln">Handeln</option>
            <option value="wissen">Wissen</option>
            <option value="soziales">Soziales</option>
          </select>

          <button class="btn btn-primary w-100" @click="faehigkeitHinzufuegen">Hinzufügen</button>
        </div>
      </div>

      <div class="card p-3 mb-2">
        <div class="row g-2">
          <div class="col-12 col-md-6">
            <button class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2" @click="inventarDialogOeffnen">
              <span aria-hidden="true">🎒</span>
              Inventar
            </button>
          </div>
          <div class="col-12 col-md-6">
            <button class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2" @click="journalDialogOeffnen">
              <span aria-hidden="true">📖</span>
              Abenteuerjournal
            </button>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="faehigkeitenHilfeModal"
        tabindex="-1"
        aria-labelledby="faehigkeitenHilfeLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="faehigkeitenHilfeLabel">
                Hilfe zu Fähigkeiten
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <p><strong>Du hast 400 Punkte.</strong> Diese verteilst du auf Fähigkeiten.</p>
              <p><strong>Fähigkeiten</strong> sind konkrete Dinge (z.B. Klettern, Lügen).</p>
              <p><strong>Kategorien:</strong></p>
              <ul>
                <li><strong>Handeln</strong> → körperlich / aktiv</li>
                <li><strong>Wissen</strong> → logisch / gelernt</li>
                <li><strong>Soziales</strong> → Interaktion</li>
              </ul>
              <p><strong>Begabung</strong> entsteht automatisch aus deinen Punkten und verbessert alle Fähigkeiten.</p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="charakterBildCropperModal"
        ref="cropperModalElement"
        tabindex="-1"
        aria-labelledby="charakterBildCropperLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="charakterBildCropperLabel">
                Charakterbild zuschneiden
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-center">
              <img
                v-if="tempBildQuelle"
                ref="cropperBildElement"
                :src="tempBildQuelle"
                alt="Bild zuschneiden"
                class="cropper-image" />
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="zugeschnittenesBildSpeichern">
                Bild übernehmen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="charakterBildVerwaltungModal"
        ref="bildVerwaltungModalElement"
        tabindex="-1"
        aria-labelledby="charakterBildVerwaltungLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="charakterBildVerwaltungLabel">
                Charakterbild verwalten
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <div class="text-center mb-3">
                <img
                  v-if="charakterBild"
                  :src="charakterBild"
                  alt="Charakterbild Vorschau"
                  class="charakterbild-vorschau" />
                <div v-else class="charakterbild-platzhalter">
                  <span class="material-symbols-outlined" aria-hidden="true">person</span>
                </div>
              </div>

              <input
                ref="bildInputElement"
                class="form-control mb-2"
                type="file"
                accept="image/*"
                @change="bildDateiAusgewaehlt" />
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-primary"
                :disabled="!charakterBild"
                @click="charakterBildGrossAnzeigen">
                Groß anzeigen
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                :disabled="!charakterBild"
                @click="charakterBildEntfernen">
                Bild entfernen
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="charakterBildGrossModal"
        ref="bildGrossModalElement"
        tabindex="-1"
        aria-labelledby="charakterBildGrossLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="charakterBildGrossLabel">
                Charakterbild
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body d-flex align-items-center justify-content-center">
              <img
                v-if="charakterBild"
                :src="charakterBild"
                alt="Charakterbild groß"
                class="img-fluid rounded" />
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="inventarEditorModal"
        ref="inventarModalElement"
        tabindex="-1"
        aria-labelledby="inventarEditorLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="inventarEditorLabel">Inventar</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <div ref="inventarEditorElement" class="quill-editor-host"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button type="button" class="btn btn-primary" @click="inventarSpeichern">
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="journalEditorModal"
        ref="journalModalElement"
        tabindex="-1"
        aria-labelledby="journalEditorLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="journalEditorLabel">Abenteuerjournal</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <div ref="journalEditorElement" class="quill-editor-host"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                Abbrechen
              </button>
              <button type="button" class="btn btn-primary" @click="journalSpeichern">
                Speichern
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style="height: 80px;"></div>
    </div>
  `,
};
