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
  },
  emits: ['update:modelValue'],
  methods: {
    aktualisiere(partial) {
      this.$emit('update:modelValue', { ...this.modelValue, ...partial });
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
        if (Number.isFinite(n) && n >= 1 && n <= 100) {
          this.aktualisiere({ value: n });
        }
        return;
      }
      const n = Number(raw);
      this.aktualisiere({ value: Number.isFinite(n) ? n : 0 });
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
  },
  template: `
    <div class="faehigkeit-formular">
      <div class="form-floating mb-2">
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
          max="100"
          @input="wertInput"
          placeholder=" " />
        <label :for="idPrefix + '-wert'">{{ nullableWert ? 'Wert (optional)' : 'Wert' }}</label>
      </div>
    </div>
  `,
};
