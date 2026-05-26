window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const KARTEN_ICON_EXPORT_MAX_KANTE = 512;

function kartenIconApi() {
  return window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon
    ? window.HTBAH_SHARED.EntityKartenIcon
    : null;
}

function quillEmoticonsApi() {
  return window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEmoticons
    ? window.HTBAH_SHARED.QuillEmoticons
    : null;
}

function kartenIconCanvasZuDataUrl(canvas) {
  if (!canvas) {
    return '';
  }
  const breite = Number(canvas.width) || 0;
  const hoehe = Number(canvas.height) || 0;
  if (breite <= 0 || hoehe <= 0) {
    return '';
  }
  const groessteKante = Math.max(breite, hoehe);
  if (groessteKante <= KARTEN_ICON_EXPORT_MAX_KANTE) {
    return canvas.toDataURL('image/png');
  }
  const faktor = KARTEN_ICON_EXPORT_MAX_KANTE / groessteKante;
  const zielBreite = Math.max(1, Math.round(breite * faktor));
  const zielHoehe = Math.max(1, Math.round(hoehe * faktor));
  const skaliert = document.createElement('canvas');
  skaliert.width = zielBreite;
  skaliert.height = zielHoehe;
  const ctx = skaliert.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL('image/png');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, zielBreite, zielHoehe);
  return skaliert.toDataURL('image/png');
}

window.HTBAH_KOMPONENTEN.EntityKartenIconModal = {
  components: {
    BildCropperModal: window.HTBAH_KOMPONENTEN.BildCropperModal,
  },
  props: {
    modalId: { type: String, required: true },
    entityTyp: { type: String, required: true },
    modelValue: { type: Object, default: null },
    medien: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      bootstrapModal: null,
      arbeitskopie: kartenIconApi() ? kartenIconApi().leeresKartenIcon() : { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' },
      emojiSuche: '',
      aktiverInhaltsTab: 'emoji',
      _onModalHidden: null,
      _kartenIconSnapshot: null,
      _uebernommen: false,
    };
  },
  mounted() {
    const el = this.$refs.modalElement;
    if (!el) {
      return;
    }
    this._onModalHidden = () => {
      this.beimModalVersteckt();
    };
    el.addEventListener('hidden.bs.modal', this._onModalHidden);
  },
  beforeUnmount() {
    const el = this.$refs.modalElement;
    if (el && this._onModalHidden) {
      el.removeEventListener('hidden.bs.modal', this._onModalHidden);
    }
    this.entferneBodyKlasse();
    if (this.bootstrapModal) {
      try {
        this.bootstrapModal.dispose();
      } catch {
        /* bereits disposed */
      }
      this.bootstrapModal = null;
    }
  },
  computed: {
    bildMedien() {
      const liste = Array.isArray(this.medien) ? this.medien : [];
      if (!kartenIconApi()) {
        return [];
      }
      return liste.filter((m) => kartenIconApi().mediumIstBild(m));
    },
    emojiEintraege() {
      const quill = quillEmoticonsApi();
      if (!quill || typeof quill.gefilterteEintraege !== 'function') {
        return [];
      }
      return quill.gefilterteEintraege(this.emojiSuche).filter((e) => e && e.emoji);
    },
    vorschauAnzeige() {
      if (!kartenIconApi()) {
        return { art: 'emoji', emoji: '📌', form: 'eckig', istBenutzerdefiniert: false };
      }
      return kartenIconApi().kartenIconAnzeige(
        { kartenIcon: this.arbeitskopie, medien: this.medien },
        this.entityTyp,
      );
    },
    vorschauIstBild() {
      return this.vorschauAnzeige && this.vorschauAnzeige.art === 'bild' && !!this.vorschauAnzeige.bildDataUrl;
    },
    vorschauFormRund() {
      return this.vorschauAnzeige && this.vorschauAnzeige.form === 'rund';
    },
    hatBenutzerdefiniertesIcon() {
      return !!(this.arbeitskopie && this.arbeitskopie.quelle);
    },
  },
  methods: {
    setzeBodyKlasse() {
      document.body.classList.add('htbah-entity-karten-icon-offen');
    },
    entferneBodyKlasse() {
      document.body.classList.remove('htbah-entity-karten-icon-offen');
    },
    normalisierteArbeitskopie() {
      return kartenIconApi()
        ? kartenIconApi().normalisiereKartenIcon(this.arbeitskopie, this.entityTyp)
        : { ...this.arbeitskopie };
    },
    syncZumParent() {
      this.$emit('update:modelValue', this.normalisierteArbeitskopie());
    },
    beimModalVersteckt() {
      if (!this._uebernommen && this._kartenIconSnapshot) {
        this.$emit('update:modelValue', JSON.parse(this._kartenIconSnapshot));
      }
      this._uebernommen = false;
      this._kartenIconSnapshot = null;
      this.entferneBodyKlasse();
    },
    oeffnen() {
      const initial = kartenIconApi()
        ? kartenIconApi().normalisiereKartenIcon(this.modelValue, this.entityTyp)
        : { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' };
      this._kartenIconSnapshot = JSON.stringify(initial);
      this._uebernommen = false;
      this.arbeitskopie = { ...initial };
      this.emojiSuche = '';
      this.aktiverInhaltsTab =
        this.arbeitskopie.quelle === 'medium' || this.arbeitskopie.quelle === 'eigen' ? 'bild' : 'emoji';
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      if (!this.bootstrapModal) {
        this.bootstrapModal = window.bootstrap.Modal.getOrCreateInstance(el);
      }
      this.setzeBodyKlasse();
      this.bootstrapModal.show();
    },
    schliessen() {
      if (this.bootstrapModal) {
        this.bootstrapModal.hide();
      } else {
        this.entferneBodyKlasse();
      }
    },
    uebernehmen() {
      this._uebernommen = true;
      this.syncZumParent();
      this.schliessen();
    },
    zuruecksetzen() {
      this.arbeitskopie = kartenIconApi() ? kartenIconApi().leeresKartenIcon() : { quelle: '', emoji: '', mediumId: '', eigenDataUrl: '', form: 'eckig' };
      this.syncZumParent();
    },
    emojiWaehlen(emoji) {
      if (!emoji) {
        return;
      }
      this.arbeitskopie = {
        ...this.arbeitskopie,
        quelle: 'emoji',
        emoji,
        mediumId: '',
        eigenDataUrl: '',
      };
      this.aktiverInhaltsTab = 'emoji';
      this.syncZumParent();
    },
    mediumWaehlen(mediumId) {
      if (!mediumId) {
        return;
      }
      this.arbeitskopie = {
        ...this.arbeitskopie,
        quelle: 'medium',
        mediumId,
        emoji: '',
        eigenDataUrl: '',
      };
      this.aktiverInhaltsTab = 'bild';
      this.syncZumParent();
    },
    formSetzen(form) {
      this.arbeitskopie = { ...this.arbeitskopie, form: form === 'rund' ? 'rund' : 'eckig' };
      this.syncZumParent();
    },
    wechselInhaltsTab(tab) {
      this.aktiverInhaltsTab = tab === 'bild' ? 'bild' : 'emoji';
    },
    async bildDateiAusgewaehlt(event) {
      const datei = event.target.files && event.target.files[0];
      if (event.target) {
        event.target.value = '';
      }
      if (!datei) {
        return;
      }
      if (!String(datei.type || '').startsWith('image/')) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültige Datei',
          beschreibung: 'Bitte wähle eine Bilddatei aus.',
        });
        return;
      }
      const cropper = this.$refs.cropperModal;
      if (!cropper || typeof cropper.oeffnenMitDatei !== 'function') {
        return;
      }
      cropper.oeffnenMitDatei(datei);
    },
    eigenesBildZuschneiden() {
      const dataUrl =
        this.arbeitskopie.quelle === 'eigen'
          ? this.arbeitskopie.eigenDataUrl
          : this.arbeitskopie.quelle === 'medium'
            ? kartenIconApi() && kartenIconApi().bildDataUrlAusMedium(
                { medien: this.medien },
                this.arbeitskopie.mediumId,
              )
            : '';
      if (!dataUrl) {
        return;
      }
      const cropper = this.$refs.cropperModal;
      if (!cropper || typeof cropper.oeffnenMitQuelle !== 'function') {
        return;
      }
      cropper.oeffnenMitQuelle({ src: dataUrl });
    },
    async zugeschnittenesBildSpeichern(canvas) {
      const dataUrl = kartenIconCanvasZuDataUrl(canvas);
      if (!dataUrl) {
        await window.HTBAH.ui.alert({
          titel: 'Zuschnitt fehlgeschlagen',
          beschreibung: 'Das Bild konnte nicht zugeschnitten werden.',
        });
        return false;
      }
      this.arbeitskopie = {
        ...this.arbeitskopie,
        quelle: 'eigen',
        eigenDataUrl: dataUrl,
        mediumId: '',
        emoji: '',
      };
      this.aktiverInhaltsTab = 'bild';
      this.syncZumParent();
      return true;
    },
    istEmojiAktiv(emoji) {
      return (
        this.arbeitskopie.quelle === 'emoji' &&
        String(this.arbeitskopie.emoji || '').trim() === String(emoji || '').trim()
      );
    },
    istMediumAktiv(mediumId) {
      return (
        this.arbeitskopie.quelle === 'medium' &&
        String(this.arbeitskopie.mediumId || '').trim() === String(mediumId || '').trim()
      );
    },
  },
  template: `
    <Teleport to="body">
      <div
        class="modal fade htbah-entity-karten-icon-modal"
        :id="modalId"
        ref="modalElement"
        tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered htbah-entity-karten-icon-modal-dialog">
          <div class="modal-content shadow htbah-entity-karten-icon-modal-content">
            <div class="modal-header py-2">
              <h5 class="modal-title mb-0">Karten-Icon festlegen</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body htbah-entity-karten-icon-modal-body">
              <div class="htbah-entity-karten-icon-vorschau-zeile">
                <div
                  class="htbah-entity-karten-icon-vorschau"
                  :class="{
                    'htbah-entity-karten-icon-vorschau--rund': vorschauFormRund,
                    'htbah-entity-karten-icon-vorschau--eckig': !vorschauFormRund,
                  }"
                  aria-hidden="true">
                  <img
                    v-if="vorschauIstBild"
                    :src="vorschauAnzeige.bildDataUrl"
                    alt=""
                    draggable="false" />
                  <span
                    v-else
                    :key="'modal-vorschau-emoji-' + (arbeitskopie.emoji || '') + '-' + (arbeitskopie.quelle || '')"
                    class="htbah-entity-karten-icon-vorschau-emoji">{{ vorschauAnzeige.emoji }}</span>
                </div>
                <div class="flex-grow-1">
                  <div class="small text-secondary mb-2">Darstellung auf der Karte</div>
                  <div class="btn-group btn-group-sm" role="group" aria-label="Icon-Form">
                    <button
                      type="button"
                      class="btn"
                      :class="arbeitskopie.form === 'eckig' ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="formSetzen('eckig')">
                      Eckig
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="arbeitskopie.form === 'rund' ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="formSetzen('rund')">
                      Rund
                    </button>
                  </div>
                </div>
              </div>

              <ul class="nav nav-pills nav-fill htbah-weltenbau-pill-tabs mb-3" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link htbah-weltenbau-pill-tab"
                    :class="{ active: aktiverInhaltsTab === 'emoji' }"
                    role="tab"
                    :aria-selected="aktiverInhaltsTab === 'emoji' ? 'true' : 'false'"
                    @click="wechselInhaltsTab('emoji')">
                    😀 Emoticon
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link htbah-weltenbau-pill-tab"
                    :class="{ active: aktiverInhaltsTab === 'bild' }"
                    role="tab"
                    :aria-selected="aktiverInhaltsTab === 'bild' ? 'true' : 'false'"
                    @click="wechselInhaltsTab('bild')">
                    📤 Datei hochladen
                  </button>
                </li>
              </ul>

              <div
                v-show="aktiverInhaltsTab === 'emoji'"
                class="htbah-entity-karten-icon-tab-inhalt"
                role="tabpanel"
                aria-label="Emoticon auswählen">
                <div
                  class="htbah-quill-emoticon-picker htbah-quill-emoticon-picker--embedded htbah-quill-emoticon-picker--inline"
                  role="region">
                  <div class="htbah-quill-emoticon-picker__header">
                    <input
                      v-model="emojiSuche"
                      type="search"
                      class="form-control form-control-sm htbah-quill-emoticon-picker__search"
                      placeholder="Emoticon suchen …"
                      autocomplete="off"
                      spellcheck="false" />
                  </div>
                  <div
                    v-if="emojiEintraege.length"
                    class="htbah-quill-emoticon-picker__grid"
                    role="listbox"
                    aria-label="Emoticons">
                    <button
                      v-for="(eintrag, index) in emojiEintraege"
                      :key="'eki-emoji-' + index + '-' + eintrag.emoji"
                      type="button"
                      class="htbah-quill-emoticon-picker__item"
                      :class="{ 'is-selected': istEmojiAktiv(eintrag.emoji) }"
                      :title="eintrag.label"
                      :aria-label="eintrag.label"
                      role="option"
                      :aria-selected="istEmojiAktiv(eintrag.emoji) ? 'true' : 'false'"
                      @click.stop="emojiWaehlen(eintrag.emoji)">
                      {{ eintrag.emoji }}
                    </button>
                  </div>
                  <div v-else class="htbah-quill-emoticon-picker__empty small text-secondary">Keine Treffer.</div>
                </div>
              </div>

              <div
                v-show="aktiverInhaltsTab === 'bild'"
                class="htbah-entity-karten-icon-tab-inhalt htbah-entity-karten-icon-bildbereich"
                role="tabpanel"
                aria-label="Bild hochladen">
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <label class="btn btn-sm btn-outline-primary mb-0">
                    Bild hochladen …
                    <input
                      type="file"
                      class="d-none"
                      accept="image/*"
                      @change="bildDateiAusgewaehlt" />
                  </label>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="!vorschauIstBild"
                    @click="eigenesBildZuschneiden">
                    Zuschneiden
                  </button>
                </div>
                <p v-if="!bildMedien.length" class="small text-secondary mb-2">
                  Noch keine Bilder in der Galerie dieser Entität. Du kannst ein Bild hochladen oder zuerst im Reiter „Medien“ Dateien hinzufügen.
                </p>
                <div v-else class="htbah-entity-karten-icon-galerie">
                  <button
                    v-for="medium in bildMedien"
                    :key="'eki-gal-' + medium.id"
                    type="button"
                    class="htbah-entity-karten-icon-galerie-item"
                    :class="{ 'is-active': istMediumAktiv(medium.id) }"
                    :title="medium.name || 'Bild'"
                    @click="mediumWaehlen(medium.id)">
                    <img :src="medium.dataUrl" :alt="medium.name || 'Galeriebild'" draggable="false" />
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer py-2">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                :disabled="!hatBenutzerdefiniertesIcon"
                @click="zuruecksetzen">
                Standard-Icon
              </button>
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Abbrechen</button>
              <button type="button" class="btn btn-primary btn-sm" @click="uebernehmen">Übernehmen</button>
            </div>
          </div>
        </div>
      </div>

      <bild-cropper-modal
        ref="cropperModal"
        :modal-id="modalId + '-cropper'"
        modal-class="htbah-entity-karten-icon-cropper-modal"
        titel="Icon zuschneiden"
        speichern-text="Zuschnitt übernehmen"
        bild-alt-text="Icon zuschneiden"
        dialog-class="modal-lg"
        :on-speichern="zugeschnittenesBildSpeichern" />
    </Teleport>
  `,
};
