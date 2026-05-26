window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

function kartenIconApi() {
  return window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon
    ? window.HTBAH_SHARED.EntityKartenIcon
    : null;
}

window.HTBAH_KOMPONENTEN.EntityKartenIconFeld = {
  components: {
    EntityKartenIconModal: window.HTBAH_KOMPONENTEN.EntityKartenIconModal,
  },
  props: {
    entityTyp: { type: String, required: true },
    modelValue: { type: Object, default: null },
    medien: { type: Array, default: () => [] },
    modalIdSuffix: { type: String, default: 'default' },
  },
  emits: ['update:modelValue'],
  computed: {
    modalId() {
      return `entityKartenIconModal-${this.entityTyp}-${this.modalIdSuffix}`;
    },
    anzeige() {
      const api = kartenIconApi();
      if (!api) {
        return { art: 'emoji', emoji: '📌', form: 'eckig', istBenutzerdefiniert: false };
      }
      return api.kartenIconAnzeige(
        { kartenIcon: this.modelValue, medien: this.medien },
        this.entityTyp,
      );
    },
    vorschauIstBild() {
      return this.anzeige && this.anzeige.art === 'bild' && !!this.anzeige.bildDataUrl;
    },
    vorschauFormRund() {
      return this.anzeige && this.anzeige.form === 'rund';
    },
    hatBenutzerdefiniertesIcon() {
      return !!(this.modelValue && this.modelValue.quelle);
    },
    formLabel() {
      return this.vorschauFormRund ? 'Rund' : 'Eckig';
    },
  },
  methods: {
    iconModalOeffnen() {
      const modal = this.$refs.iconModal;
      if (modal && typeof modal.oeffnen === 'function') {
        modal.oeffnen();
      }
    },
    aufIconAktualisiert(wert) {
      this.$emit('update:modelValue', wert);
    },
  },
  template: `
    <section class="htbah-entitaet-bereich htbah-entity-karten-icon-feld">
      <h6 class="htbah-entitaet-bereich-titel">🎴 Karten-Icon</h6>
      <p class="small text-secondary mb-2">
        Symbol links auf dem Karten-Element in der interaktiven Welt. Ohne Auswahl gilt das Standard-Emoticon des Typs.
      </p>
      <div class="d-flex flex-wrap align-items-center gap-3">
        <div
          class="htbah-entity-karten-icon-vorschau"
          :key="'karten-icon-vorschau-' + (modelValue && modelValue.quelle ? modelValue.quelle : '') + '-' + (modelValue && modelValue.emoji ? modelValue.emoji : '') + '-' + (modelValue && modelValue.mediumId ? modelValue.mediumId : '') + '-' + (modelValue && modelValue.form ? modelValue.form : '')"
          :class="{
            'htbah-entity-karten-icon-vorschau--rund': vorschauFormRund,
            'htbah-entity-karten-icon-vorschau--eckig': !vorschauFormRund,
          }"
          aria-hidden="true">
          <img
            v-if="vorschauIstBild"
            :src="anzeige.bildDataUrl"
            alt=""
            draggable="false" />
          <span v-else class="htbah-entity-karten-icon-vorschau-emoji">{{ anzeige.emoji }}</span>
        </div>
        <div class="d-flex flex-column gap-1">
          <span class="small text-secondary">
            {{ hatBenutzerdefiniertesIcon ? 'Eigenes Icon' : 'Standard-Icon' }} · {{ formLabel }}
          </span>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="iconModalOeffnen">
            Icon festlegen …
          </button>
        </div>
      </div>
      <entity-karten-icon-modal
        ref="iconModal"
        :modal-id="modalId"
        :entity-typ="entityTyp"
        :model-value="modelValue"
        :medien="medien"
        @update:model-value="aufIconAktualisiert" />
    </section>
  `,
};
