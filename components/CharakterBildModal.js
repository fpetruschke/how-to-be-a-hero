window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.CharakterBildModal = {
  props: {
    charakterBild: { type: String, default: '' },
  },
  emits: ['update:charakterBild'],
  data() {
    return {
      tempBildQuelle: '',
      cropper: null,
      cropperScaleX: 1,
      cropperScaleY: 1,
      bildVerwaltungModal: null,
    };
  },
  methods: {
    oeffnen() {
      const modalElement = this.$refs.bildVerwaltungModalElement;
      if (!modalElement) {
        return;
      }

      this.bildVerwaltungModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.bildVerwaltungModal.show();
    },
    async bildDateiAusgewaehlt(event) {
      const datei = event.target.files && event.target.files[0];
      if (!datei) {
        return;
      }

      if (!datei.type.startsWith('image/')) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültige Datei',
          beschreibung: 'Bitte wähle eine Bilddatei aus.',
        });
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.tempBildQuelle = String(reader.result || '');
        this.$nextTick(() => this.cropperInitialisieren());
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
      this.cropperScaleX = 1;
      this.cropperScaleY = 1;
    },
    bildDrehen(winkel) {
      if (!this.cropper) {
        return;
      }

      this.cropper.rotate(winkel);
    },
    bildHorizontalSpiegeln() {
      if (!this.cropper) {
        return;
      }

      this.cropperScaleX = this.cropperScaleX * -1;
      this.cropper.scaleX(this.cropperScaleX);
    },
    bildVertikalSpiegeln() {
      if (!this.cropper) {
        return;
      }

      this.cropperScaleY = this.cropperScaleY * -1;
      this.cropper.scaleY(this.cropperScaleY);
    },
    bildBearbeitungZuruecksetzen() {
      if (!this.cropper) {
        return;
      }

      this.cropper.reset();
      this.cropperScaleX = 1;
      this.cropperScaleY = 1;
    },
    async zugeschnittenesBildSpeichern() {
      if (!this.cropper) {
        return;
      }

      const canvas = this.cropper.getCroppedCanvas({
        width: 360,
        height: 480,
        imageSmoothingQuality: 'high',
      });

      if (!canvas) {
        await window.HTBAH.ui.alert({
          titel: 'Zuschnitt fehlgeschlagen',
          beschreibung: 'Das Bild konnte nicht zugeschnitten werden.',
        });
        return;
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.$emit('update:charakterBild', dataUrl);
      this.cropperAufraeumen();
    },
    zuschnittMitAktuellemBildStarten() {
      if (!this.charakterBild) {
        return;
      }

      this.tempBildQuelle = this.charakterBild;
      this.$nextTick(() => this.cropperInitialisieren());
    },
    zuschnittAbbrechen() {
      this.cropperAufraeumen();
    },
    async charakterBildEntfernen() {
      if (!this.charakterBild) {
        return;
      }

      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Charakterbild entfernen?',
        beschreibung: 'Charakterbild wirklich entfernen?',
        bestaetigenText: 'Entfernen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }

      this.$emit('update:charakterBild', '');
    },
    cropperAufraeumen() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
      this.cropperScaleX = 1;
      this.cropperScaleY = 1;

      this.tempBildQuelle = '';

      if (this.$refs.bildInputElement) {
        this.$refs.bildInputElement.value = '';
      }
    },
    bildVerwaltungModalGeschlossen() {
      this.cropperAufraeumen();
    },
  },
  mounted() {
    const modalElement = this.$refs.bildVerwaltungModalElement;
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', this.bildVerwaltungModalGeschlossen);
    }
  },
  beforeUnmount() {
    const modalElement = this.$refs.bildVerwaltungModalElement;
    if (modalElement) {
      modalElement.removeEventListener(
        'hidden.bs.modal',
        this.bildVerwaltungModalGeschlossen,
      );
    }
    this.cropperAufraeumen();
  },
  template: `
    <div
      class="modal fade"
      id="charakterBildVerwaltungModal"
      ref="bildVerwaltungModalElement"
      tabindex="-1"
      aria-labelledby="charakterBildVerwaltungLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow">
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
            <div class="text-center mb-3 charakterbild-modal-bildbereich">
              <img
                v-if="tempBildQuelle"
                ref="cropperBildElement"
                :src="tempBildQuelle"
                alt="Bild zuschneiden"
                class="cropper-image" />
              <img
                v-else-if="charakterBild"
                :src="charakterBild"
                alt="Charakterbild Vorschau"
                class="charakterbild-vorschau" />
              <div v-else class="charakterbild-platzhalter">
                <span class="material-symbols-outlined" aria-hidden="true">person</span>
              </div>
            </div>

            <div v-if="tempBildQuelle" class="d-flex flex-wrap gap-2 justify-content-center mb-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="bildDrehen(-90)">
                90° links
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="bildDrehen(90)">
                90° rechts
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="bildHorizontalSpiegeln">
                Horizontal spiegeln
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="bildVertikalSpiegeln">
                Vertikal spiegeln
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click="bildBearbeitungZuruecksetzen">
                Zuruecksetzen
              </button>
            </div>

            <div class="form-floating mb-2">
              <input
                id="ce-charakterbild-datei"
                ref="bildInputElement"
                class="form-control"
                type="file"
                accept="image/*"
                @change="bildDateiAusgewaehlt" />
              <label for="ce-charakterbild-datei">Bilddatei wählen</label>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-primary"
              v-if="!tempBildQuelle"
              :disabled="!charakterBild"
              @click="zuschnittMitAktuellemBildStarten">
              Aktuelles Bild zuschneiden
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              v-if="tempBildQuelle"
              @click="zuschnittAbbrechen">
              Zuschnitt abbrechen
            </button>
            <button
              type="button"
              class="btn btn-primary"
              v-if="tempBildQuelle"
              @click="zugeschnittenesBildSpeichern">
              Zuschnitt speichern
            </button>
            <button
              type="button"
              class="btn btn-outline-danger"
              v-if="!tempBildQuelle"
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
  `,
};
