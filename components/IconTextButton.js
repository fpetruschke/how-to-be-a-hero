window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/**
 * Bootstrap-„labeled“-Button: Icon links in einem abgesetzten Streifen, Text im Slot.
 * Vgl. https://codehim.com/bootstrap/bootstrap-5-buttons-with-icon-and-text/
 * Icons: Material Symbols (wie im Rest der App).
 */
window.HTBAH_KOMPONENTEN.IconTextButton = {
  name: 'IconTextButton',
  inheritAttrs: false,
  props: {
    tag: {
      type: String,
      default: 'button',
    },
    to: {
      type: [String, Object],
      default: null,
    },
    type: {
      type: String,
      default: 'button',
    },
    icon: {
      type: String,
      default: '',
    },
    symbol: {
      type: String,
      default: '',
    },
  },
  computed: {
    rootBindings() {
      const { class: userClass, ...rest } = this.$attrs;
      const bindings = {
        ...rest,
        class: ['btn', 'btn-labeled', userClass],
      };
      if (this.tag === 'router-link') {
        bindings.to = this.to;
      } else if (this.tag === 'button') {
        bindings.type = this.type;
      }
      return bindings;
    },
    zeigtLabelBereich() {
      return Boolean(this.icon || this.symbol);
    },
  },
  template: `
    <component :is="tag" v-bind="rootBindings">
      <span v-if="zeigtLabelBereich" class="btn-label">
        <span v-if="icon" class="material-symbols-outlined" aria-hidden="true">{{ icon }}</span>
        <span v-else class="btn-labeled-emoji" aria-hidden="true">{{ symbol }}</span>
      </span><span class="btn-labeled-text"><slot /></span>
    </component>
  `,
};
