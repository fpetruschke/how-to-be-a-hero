window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const ZUFALLSTABELLEN_SEKTION_LS_PREFIX = 'htbah_zufallstabellen_sektion_';

function zufallstabellenSektionLeseOffen(storageKey, fallback) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === '0') {
      return false;
    }
    if (raw === '1') {
      return true;
    }
  } catch {
    /* ignorieren */
  }
  return fallback;
}

function zufallstabellenSektionSchreibeOffen(storageKey, offen) {
  try {
    localStorage.setItem(storageKey, offen ? '1' : '0');
  } catch {
    /* ignorieren */
  }
}

/**
 * Einklappbare Zufallstabellen-Karte: Kopf mit Titel + Aktionen, Inhalt optional sichtbar.
 */
window.HTBAH_KOMPONENTEN.ZufallstabellenSektion = {
  name: 'ZufallstabellenSektion',
  props: {
    sectionId: {
      type: String,
      required: true,
    },
    ariaTitel: {
      type: String,
      default: '',
    },
    defaultOffen: {
      type: Boolean,
      default: false,
    },
    persist: {
      type: Boolean,
      default: true,
    },
    sucheSteuerungAktiv: {
      type: Boolean,
      default: false,
    },
    sucheHatTreffer: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const storageKey = ZUFALLSTABELLEN_SEKTION_LS_PREFIX + this.sectionId;
    const offen = this.persist
      ? zufallstabellenSektionLeseOffen(storageKey, this.defaultOffen)
      : this.defaultOffen;
    return {
      offen,
      storageKey,
    };
  },
  computed: {
    inhaltId() {
      return 'zufallstabellen-sektion-' + this.sectionId;
    },
    offenEffektiv() {
      if (this.sucheSteuerungAktiv) {
        return this.sucheHatTreffer;
      }
      return this.offen;
    },
    kopfAriaLabel() {
      const name = String(this.ariaTitel || this.sectionId).trim() || 'Bereich';
      const aktion = this.offenEffektiv ? 'einklappen' : 'ausklappen';
      return `${name}: ${aktion}`;
    },
  },
  methods: {
    toggle() {
      if (this.sucheSteuerungAktiv) {
        return;
      }
      this.offen = !this.offen;
      if (this.persist) {
        zufallstabellenSektionSchreibeOffen(this.storageKey, this.offen);
      }
    },
  },
  template: `
    <div
      class="card mb-3 text-start htbah-zufallstabellen-sektion"
      :class="{ 'htbah-zufallstabellen-sektion--offen': offenEffektiv }">
      <div class="card-header htbah-zufallstabellen-sektion-kopfzeile d-flex flex-wrap align-items-center gap-2">
        <div class="htbah-zufallstabellen-sektion-titel min-w-0 flex-grow-1">
          <slot name="titel" />
        </div>
        <div class="d-flex flex-wrap gap-2 flex-shrink-0 align-items-center" @click.stop>
          <slot name="aktionen" />
        </div>
        <button
          type="button"
          class="htbah-zufallstabellen-sektion-toggle btn btn-link text-decoration-none p-0 flex-shrink-0 ms-auto"
          :class="{ 'pe-none opacity-50': sucheSteuerungAktiv }"
          :aria-expanded="offenEffektiv ? 'true' : 'false'"
          :aria-controls="inhaltId"
          :aria-label="kopfAriaLabel"
          :disabled="sucheSteuerungAktiv"
          @click="toggle">
          <span
            class="material-symbols-outlined htbah-zufallstabellen-sektion-ico"
            aria-hidden="true">{{ offenEffektiv ? 'expand_less' : 'expand_more' }}</span>
        </button>
      </div>
      <div v-show="offenEffektiv" :id="inhaltId" class="card-body p-0">
        <slot />
      </div>
    </div>
  `,
};
