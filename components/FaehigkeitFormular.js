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
      const n = Number(event.target.value);
      this.aktualisiere({ value: Number.isFinite(n) ? n : 0 });
    },
    typInput(event) {
      this.aktualisiere({ type: event.target.value });
    },
  },
  template: `
    <div class="faehigkeit-formular">
      <div class="form-floating mb-2">
        <input
          :id="idPrefix + '-name'"
          class="form-control"
          :value="modelValue.name"
          @input="nameInput"
          placeholder=" " />
        <label :for="idPrefix + '-name'">Name</label>
      </div>
      <div class="form-floating mb-2">
        <input
          :id="idPrefix + '-wert'"
          type="number"
          class="form-control"
          :value="modelValue.value"
          min="0"
          max="100"
          @input="wertInput"
          placeholder=" " />
        <label :for="idPrefix + '-wert'">Wert</label>
      </div>
      <div class="form-floating mb-0">
        <select
          :id="idPrefix + '-kategorie'"
          class="form-select"
          :value="modelValue.type"
          @change="typInput">
          <option value="handeln">Handeln</option>
          <option value="wissen">Wissen</option>
          <option value="soziales">Soziales</option>
        </select>
        <label :for="idPrefix + '-kategorie'">Kategorie</label>
      </div>
    </div>
  `,
};
