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
      };
      this.eintraege.push(eintrag);
      if (dauerMs > 0) {
        eintrag.timer = window.setTimeout(() => this.dismiss(id), dauerMs);
      }
      return id;
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
  },
  template: `
    <teleport to="body">
      <div
        v-for="eintrag in eintraege"
        :key="eintrag.id"
        class="htbah-erfolgs-toast alert alert-dismissible py-2 mb-0 text-center shadow"
        :class="alertClass(eintrag.typ)"
        role="status">
        {{ eintrag.text }}
        <button
          type="button"
          class="btn-close"
          aria-label="Meldung schließen"
          @click="dismiss(eintrag.id)"></button>
      </div>
    </teleport>
  `,
};
