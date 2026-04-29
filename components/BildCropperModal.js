window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const HTBAH_BILD_BOOTSTRAP_MODAL =
  window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper;

window.HTBAH_KOMPONENTEN.BildCropperModal = {
  props: {
    modalId: { type: String, required: true },
    titel: { type: String, default: 'Bild zuschneiden' },
    beschreibung: { type: String, default: '' },
    speichernText: { type: String, default: 'Übernehmen und speichern' },
    abbrechenText: { type: String, default: 'Abbrechen' },
    bildAltText: { type: String, default: 'Bild zuschneiden' },
    dialogClass: { type: String, default: 'modal-lg' },
    modalClass: { type: String, default: '' },
    zIndexToken: { type: String, default: '--htbah-z-modal-crop' },
    backdropZIndexToken: { type: String, default: '--htbah-z-modal-crop-backdrop' },
    onSpeichern: { type: Function, default: null },
    onBildFehler: { type: Function, default: null },
  },
  emits: ['abgebrochen', 'bild-fehler'],
  data() {
    return {
      tempObjectUrl: '',
      cropper: null,
      bootstrapModal: null,
      urspruenglicherElternKnoten: null,
      urspruenglichesNaechstesGeschwister: null,
      schliessenOhneAbgebrochenEvent: false,
      bildLaedt: false,
      drehungGrad: 0,
      spiegelX: 1,
      spiegelY: 1,
    };
  },
  methods: {
    fokusAusModalEntfernen() {
      const modalElement = this.$refs.modalElement;
      const aktivesElement = document.activeElement;
      if (!modalElement || !(aktivesElement instanceof HTMLElement) || !modalElement.contains(aktivesElement)) {
        return;
      }
      if (typeof aktivesElement.blur === 'function') {
        aktivesElement.blur();
      }
      if (document.activeElement === aktivesElement && document.body && typeof document.body.focus === 'function') {
        document.body.focus();
      }
    },
    oeffnenMitDatei(file) {
      if (!file) {
        return;
      }
      this.oeffnenMitQuelle({
        src: URL.createObjectURL(file),
      });
    },
    oeffnenMitQuelle(optionen) {
      const quelle = optionen && typeof optionen.src === 'string' ? optionen.src : '';
      if (!quelle) {
        return;
      }
      this.schliessenOhneAbgebrochenEvent = false;
      this.cropperAufraeumen();
      this.revokeTempUrl();
      this.bildLaedt = true;
      this.drehungGrad = 0;
      this.spiegelX = 1;
      this.spiegelY = 1;
      this.tempObjectUrl = quelle;
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      if (!this.bootstrapModal) {
        this.bootstrapModal = HTBAH_BILD_BOOTSTRAP_MODAL
          ? HTBAH_BILD_BOOTSTRAP_MODAL.ensureModalInstance(el)
          : null;
      }
      if (this.bootstrapModal) {
        this.bootstrapModal.show();
      }
      this.$nextTick(() => {
        this.setzeModalEbeneNachOben();
        window.setTimeout(() => this.setzeModalEbeneNachOben(), 80);
      });
    },
    schliessen() {
      if (!this.bootstrapModal) {
        return;
      }
      this.fokusAusModalEntfernen();
      this.bootstrapModal.hide();
    },
    beimModalVersteckt() {
      this.cropperAufraeumen();
      this.revokeTempUrl();
      this.bildLaedt = false;
      this.drehungGrad = 0;
      this.spiegelX = 1;
      this.spiegelY = 1;
      if (!this.schliessenOhneAbgebrochenEvent) {
        this.$emit('abgebrochen');
      }
      this.schliessenOhneAbgebrochenEvent = false;
    },
    onCropperBildGeladen() {
      this.bildLaedt = false;
      this.$nextTick(() => this.cropperInitialisieren());
    },
    async onCropperBildFehlerIntern() {
      this.bildLaedt = false;
      let handled = false;
      if (typeof this.onBildFehler === 'function') {
        try {
          const result = await this.onBildFehler();
          handled = result === true;
        } catch {
          handled = false;
        }
      }
      this.$emit('bild-fehler');
      if (!handled) {
        await window.HTBAH.ui.alert({
          titel: 'Bild konnte nicht geladen werden',
          beschreibung:
            'Das Bild konnte nicht geladen werden (Datei zu groß oder kein unterstütztes Format).',
        });
      }
      this.schliessenOhneAbgebrochenEvent = true;
      this.schliessen();
    },
    cropperInitialisieren() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
      const bildElement = this.$refs.cropperBildElement;
      if (!bildElement || !this.tempObjectUrl || !window.Cropper) {
        return;
      }
      this.cropper = new window.Cropper(bildElement, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        responsive: true,
      });
      this.cropper.rotateTo(this.drehungGrad);
      this.cropper.scaleX(this.spiegelX);
      this.cropper.scaleY(this.spiegelY);
    },
    setzeModalEbeneNachOben() {
      const modalElement = this.$refs.modalElement;
      const rootStyles = window.getComputedStyle(document.documentElement);
      const cropZ = parseInt(rootStyles.getPropertyValue(this.zIndexToken), 10);
      const backdropZ = parseInt(rootStyles.getPropertyValue(this.backdropZIndexToken), 10);
      if (modalElement) {
        modalElement.style.zIndex = String(Number.isFinite(cropZ) ? cropZ : 5000);
      }
      const backdrops = Array.from(document.querySelectorAll('.modal-backdrop'));
      const basisBackdropZ = Number.isFinite(backdropZ) ? backdropZ : 4990;
      backdrops.forEach((backdrop, index) => {
        const z = basisBackdropZ - (backdrops.length - 1 - index);
        backdrop.style.zIndex = String(Math.max(1000, z));
      });
    },
    drehen(delta) {
      if (!this.cropper) {
        return;
      }
      const neu = (this.drehungGrad + delta) % 360;
      this.drehungGrad = neu < 0 ? neu + 360 : neu;
      this.cropper.rotateTo(this.drehungGrad);
    },
    spiegelnHorizontal() {
      if (!this.cropper) {
        return;
      }
      this.spiegelX = this.spiegelX === 1 ? -1 : 1;
      this.cropper.scaleX(this.spiegelX);
    },
    spiegelnVertikal() {
      if (!this.cropper) {
        return;
      }
      this.spiegelY = this.spiegelY === 1 ? -1 : 1;
      this.cropper.scaleY(this.spiegelY);
    },
    async zuschnittSpeichern() {
      if (!this.cropper) {
        return;
      }
      let canvas;
      try {
        canvas = this.cropper.getCroppedCanvas({
          imageSmoothingQuality: 'high',
        });
      } catch {
        canvas = null;
      }
      if (!canvas) {
        await window.HTBAH.ui.alert({
          titel: 'Zuschnitt fehlgeschlagen',
          beschreibung: 'Das Bild konnte nicht zugeschnitten werden.',
        });
        return;
      }
      if (typeof this.onSpeichern !== 'function') {
        this.schliessenOhneAbgebrochenEvent = true;
        this.schliessen();
        return;
      }
      try {
        const erfolg = await this.onSpeichern(canvas);
        if (erfolg === false) {
          return;
        }
        this.schliessenOhneAbgebrochenEvent = true;
        this.schliessen();
      } catch {
        // Fehler werden im aufrufenden Kontext behandelt.
      }
    },
    abbrechenKlick() {
      this.schliessen();
    },
    cropperAufraeumen() {
      if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
    },
    revokeTempUrl() {
      if (this.tempObjectUrl && this.tempObjectUrl.indexOf('blob:') === 0) {
        URL.revokeObjectURL(this.tempObjectUrl);
      }
      this.tempObjectUrl = '';
    },
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (el) {
      if (el.parentNode && el.parentNode !== document.body) {
        this.urspruenglicherElternKnoten = el.parentNode;
        this.urspruenglichesNaechstesGeschwister = el.nextSibling || null;
        document.body.appendChild(el);
      }
      if (HTBAH_BILD_BOOTSTRAP_MODAL) {
        HTBAH_BILD_BOOTSTRAP_MODAL.bindHiddenEvent(el, this.beimModalVersteckt);
      }
    }
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el) {
      if (HTBAH_BILD_BOOTSTRAP_MODAL) {
        HTBAH_BILD_BOOTSTRAP_MODAL.unbindHiddenEvent(el, this.beimModalVersteckt);
      }
      if (this.urspruenglicherElternKnoten) {
        if (this.urspruenglichesNaechstesGeschwister && this.urspruenglichesNaechstesGeschwister.parentNode === this.urspruenglicherElternKnoten) {
          this.urspruenglicherElternKnoten.insertBefore(el, this.urspruenglichesNaechstesGeschwister);
        } else {
          this.urspruenglicherElternKnoten.appendChild(el);
        }
      }
    }
    this.cropperAufraeumen();
    this.revokeTempUrl();
  },
  template: `
    <div
      class="modal fade htbah-bild-cropper-modal"
      :id="modalId"
      ref="modalElement"
      tabindex="-1"
      :aria-labelledby="modalId + 'Label'"
      aria-hidden="true"
      :class="modalClass">
      <div :class="'modal-dialog modal-dialog-centered modal-dialog-scrollable ' + dialogClass">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" :id="modalId + 'Label'">{{ titel }}</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body htbah-bild-cropper-modal-body">
            <p v-if="beschreibung" class="small text-body-secondary mb-2">{{ beschreibung }}</p>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="drehen(-90)">
                90° links
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="drehen(90)">
                90° rechts
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="spiegelnHorizontal">
                Horizontal spiegeln
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="spiegelnVertikal">
                Vertikal spiegeln
              </button>
            </div>
            <div
              v-if="bildLaedt"
              class="text-center text-body-secondary small py-5">
              Bild wird geladen …
            </div>
            <div class="mb-2 htbah-bild-cropper-wrap">
              <img
                v-if="tempObjectUrl"
                ref="cropperBildElement"
                :src="tempObjectUrl"
                :alt="bildAltText"
                class="cropper-image"
                @load="onCropperBildGeladen"
                @error="onCropperBildFehlerIntern" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="abbrechenKlick">
              {{ abbrechenText }}
            </button>
            <button type="button" class="btn btn-primary" @click="zuschnittSpeichern">
              {{ speichernText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
