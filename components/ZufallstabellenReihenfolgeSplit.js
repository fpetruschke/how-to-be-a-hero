window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

/**
 * Pfeil hoch / runter + Info-Hinweis (Reihenfolge für PDF-Export).
 * In Aktions-Dropdowns der Zufallstabellen-Listen.
 */
window.HTBAH_KOMPONENTEN.ZufallstabellenReihenfolgeSplit = {
  name: 'ZufallstabellenReihenfolgeSplit',
  props: {
    kannNachOben: { type: Boolean, default: false },
    kannNachUnten: { type: Boolean, default: false },
  },
  emits: ['nach-oben', 'nach-unten'],
  data() {
    return {
      infoOffen: false,
    };
  },
  template: `
    <div class="htbah-reihenfolge-split" @click.stop>
      <div class="btn-group btn-group-sm w-100" role="group" aria-label="Reihenfolge ändern">
        <button
          type="button"
          class="btn btn-outline-secondary htbah-input-icon-btn"
          :disabled="!kannNachOben"
          aria-label="Einen nach oben verschieben"
          @click="$emit('nach-oben')">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary htbah-input-icon-btn"
          :disabled="!kannNachUnten"
          aria-label="Einen nach unten verschieben"
          @click="$emit('nach-unten')">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span>
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary htbah-input-icon-btn"
          :aria-expanded="infoOffen ? 'true' : 'false'"
          aria-label="Hinweis zur Reihenfolge ein- oder ausblenden"
          @click="infoOffen = !infoOffen">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
        </button>
      </div>
      <p
        v-if="infoOffen"
        class="small text-body-secondary mb-0 mt-1"
        role="note">
        Reihenfolge wird beim PDF-Export berücksichtigt.
      </p>
    </div>
  `,
};
