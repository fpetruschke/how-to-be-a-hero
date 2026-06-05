window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.UiToastHost = {
  data() {
    return {
      eintraege: [],
    };
  },
  methods: {
    notify({ text, typ = 'success', dauerMs = 3200 } = {}) {
      const inhalt = typeof text === 'string' ? text.trim() : '';
      if (!inhalt) {
        return null;
      }
      const id = window.HTBAH && typeof window.HTBAH.neueEntropieId === 'function'
        ? window.HTBAH.neueEntropieId()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const eintrag = {
        id,
        text: inhalt,
        typ: typ === 'danger' || typ === 'warning' ? typ : 'success',
        timer: null,
        mehrzeilig: false,
      };
      this.eintraege.push(eintrag);
      if (dauerMs > 0) {
        eintrag.timer = window.setTimeout(() => this.dismiss(id), dauerMs);
      }
      this.$nextTick(() => this.toastLayoutEinmalMessung(id));
      return id;
    },
    toastLayoutEinmalMessung(id) {
      const eintrag = this.eintraege.find((e) => e && e.id === id);
      if (!eintrag || eintrag._layoutGemessen) {
        return;
      }
      const sicherId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id;
      const el = document.querySelector(`[data-toast-id="${sicherId}"]`);
      if (!el) {
        return;
      }
      const textEl = el.querySelector('.htbah-erfolgs-toast-text');
      if (!textEl) {
        return;
      }
      const zeilenHoehe = parseFloat(window.getComputedStyle(textEl).lineHeight);
      if (!Number.isFinite(zeilenHoehe) || zeilenHoehe <= 0) {
        eintrag._layoutGemessen = true;
        return;
      }
      eintrag.mehrzeilig = textEl.scrollHeight > zeilenHoehe + 1;
      eintrag._layoutGemessen = true;
      const DIAG = window.HTBAH_DIAG;
      if (DIAG && typeof DIAG.log === 'function') {
        DIAG.log('UiToastHost', 'layout-gemessen', { id, mehrzeilig: eintrag.mehrzeilig });
      }
    },
    dismiss(id) {
      const idx = this.eintraege.findIndex((e) => e.id === id);
      if (idx === -1) {
        return;
      }
      const eintrag = this.eintraege[idx];
      if (eintrag && eintrag.timer) {
        window.clearTimeout(eintrag.timer);
      }
      this.eintraege.splice(idx, 1);
    },
    alertClass(typ) {
      if (typ === 'danger') {
        return 'alert-danger';
      }
      if (typ === 'warning') {
        return 'alert-warning';
      }
      return 'alert-success';
    },
  },
  beforeUnmount() {
    this.eintraege.forEach((eintrag) => {
      if (eintrag && eintrag.timer) {
        window.clearTimeout(eintrag.timer);
      }
    });
    this.eintraege = [];
  },
  template: `
    <teleport to="body">
      <div
        v-for="eintrag in eintraege"
        :key="eintrag.id"
        :data-toast-id="eintrag.id"
        class="htbah-erfolgs-toast alert alert-dismissible py-2 mb-0 text-center shadow-lg"
        :class="[alertClass(eintrag.typ), { 'htbah-erfolgs-toast--mehrzeilig': eintrag.mehrzeilig }]"
        role="status">
        <span class="htbah-erfolgs-toast-text">{{ eintrag.text }}</span>
        <button
          type="button"
          class="btn-close"
          aria-label="Meldung schließen"
          @click="dismiss(eintrag.id)"></button>
      </div>
    </teleport>
  `,
};
