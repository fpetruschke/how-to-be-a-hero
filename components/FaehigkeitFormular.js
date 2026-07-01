window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.FaehigkeitFormular = {
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    idPrefix: {
      type: String,
      default: 'faeh-form',
    },
    /** Preset-Editor: leeres Feld = kein fester Wert (null) */
    nullableWert: {
      type: Boolean,
      default: false,
    },
    /** Begabung fest vorgegeben — Auswahl ausblenden */
    fixedType: {
      type: String,
      default: '',
    },
    /** Name und Wert in einer Zeile */
    inline: {
      type: Boolean,
      default: false,
    },
    /** Nur Wert bearbeiten (Name/Kategorie fest) */
    nurWertBearbeiten: {
      type: Boolean,
      default: false,
    },
    /** Maximaler Fähigkeitswert */
    maxWert: {
      type: Number,
      default: 100,
    },
    /** Vorschläge für den Namen (datalist) */
    namenVorschlaege: {
      type: Array,
      default: () => [],
    },
    datalistId: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'submit'],
  methods: {
    aktualisiere(partial) {
      const next = { ...this.modelValue, ...partial };
      if (this.fixedType) {
        next.type = this.fixedType;
      }
      this.$emit('update:modelValue', next);
    },
    nameInput(event) {
      this.aktualisiere({ name: event.target.value });
    },
    wertInput(event) {
      const raw = event.target.value;
      if (this.nullableWert) {
        if (raw === '' || raw === null) {
          this.aktualisiere({ value: null });
          return;
        }
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0 && n <= this.maxWert) {
          this.aktualisiere({ value: n });
        }
        return;
      }
      const n = Number(raw);
      const max = Number.isFinite(this.maxWert) ? this.maxWert : 100;
      const wert = Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
      this.aktualisiere({ value: wert });
    },
    wertAnzeige() {
      const v = this.modelValue.value;
      if (this.nullableWert && (v === null || v === undefined || v === '')) {
        return '';
      }
      return v;
    },
    typInput(event) {
      this.aktualisiere({ type: event.target.value });
    },
    eingabeAbschicken(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.$emit('submit');
      }
    },
  },
  template: `
    <div class="faehigkeit-formular" :class="{ 'faehigkeit-formular--inline': inline }">
      <template v-if="nurWertBearbeiten">
        <p class="mb-2 mb-md-3">
          <span class="text-secondary small d-block">Fähigkeit</span>
          <strong>{{ modelValue.name }}</strong>
        </p>
        <div class="form-floating mb-0">
          <input
            :id="idPrefix + '-wert'"
            type="number"
            class="form-control"
            :value="wertAnzeige()"
            :min="nullableWert ? undefined : 0"
            :max="maxWert"
            @input="wertInput"
            @keydown="eingabeAbschicken"
            placeholder=" "
            inputmode="numeric"
            autofocus />
          <label :for="idPrefix + '-wert'">Wert</label>
        </div>
      </template>
      <template v-else-if="inline">
        <div class="input-group input-group-sm faehigkeit-hinzufuegen-gruppe">
          <input
            :id="idPrefix + '-name'"
            class="form-control faehigkeit-hinzufuegen-name"
            :value="modelValue.name"
            :list="datalistId || undefined"
            @input="nameInput"
            @keydown="eingabeAbschicken"
            placeholder="Name"
            autocomplete="off"
            aria-label="Name der Fähigkeit" />
          <datalist v-if="datalistId && namenVorschlaege.length" :id="datalistId">
            <option v-for="name in namenVorschlaege" :key="idPrefix + '-dl-' + name" :value="name"></option>
          </datalist>
          <input
            :id="idPrefix + '-wert'"
            type="number"
            class="form-control faehigkeit-hinzufuegen-wert"
            :value="wertAnzeige()"
            :min="nullableWert ? undefined : 0"
            :max="maxWert"
            @input="wertInput"
            @keydown="eingabeAbschicken"
            :placeholder="nullableWert ? 'Wert (opt.)' : 'Wert'"
            inputmode="numeric"
            aria-label="Wert der Fähigkeit" />
          <button
            type="button"
            class="btn btn-primary htbah-input-icon-btn"
            aria-label="Fähigkeit hinzufügen"
            @click="$emit('submit')">
            <span class="material-symbols-outlined" aria-hidden="true">add</span>
          </button>
        </div>
      </template>
      <template v-else>
        <div v-if="!fixedType" class="form-floating mb-2">
          <select
            :id="idPrefix + '-begabung'"
            class="form-select"
            :value="modelValue.type"
            @change="typInput">
            <option value="handeln">Handeln</option>
            <option value="wissen">Wissen</option>
            <option value="soziales">Soziales</option>
          </select>
          <label :for="idPrefix + '-begabung'">Begabung</label>
        </div>
        <div class="form-floating mb-2">
          <input
            :id="idPrefix + '-name'"
            class="form-control"
            :value="modelValue.name"
            @input="nameInput"
            placeholder=" "
            autocomplete="off" />
          <label :for="idPrefix + '-name'">Name / Bezeichnung</label>
        </div>
        <div class="form-floating mb-0">
          <input
            :id="idPrefix + '-wert'"
            type="number"
            class="form-control"
            :value="wertAnzeige()"
            :min="nullableWert ? undefined : 0"
            :max="maxWert"
            @input="wertInput"
            placeholder=" " />
          <label :for="idPrefix + '-wert'">{{ nullableWert ? 'Wert (optional)' : 'Wert' }}</label>
        </div>
      </template>
    </div>
  `,
};
