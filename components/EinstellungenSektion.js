window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const EINSTELLUNGEN_SEKTION_LS_PREFIX = 'htbah_einstellungen_sektion_';

function einstellungenSektionLeseOffen(storageKey, fallback) {
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

function einstellungenSektionSchreibeOffen(storageKey, offen) {
  try {
    localStorage.setItem(storageKey, offen ? '1' : '0');
  } catch {
    /* ignorieren */
  }
}

/**
 * Einklappbare Einstellungs-Karte: Überschrift als Kopf, Inhalt im Slot.
 * Offen-Zustand optional in localStorage (pro sectionId).
 */
window.HTBAH_KOMPONENTEN.EinstellungenSektion = {
  name: 'EinstellungenSektion',
  props: {
    titel: {
      type: String,
      required: true,
    },
    sectionId: {
      type: String,
      required: true,
    },
    emoji: {
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
    /** Kleinere Überschrift (h6) für Unterbereiche, z. B. unter „Daten löschen“. */
    klein: {
      type: Boolean,
      default: false,
    },
    /** Innerhalb einer anderen Sektion (ohne volle Card-Optik). */
    eingebettet: {
      type: Boolean,
      default: false,
    },
    /** Destruktive Aktionen: roter Rand und Akzentfarbe in der Überschrift. */
    gefahr: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const storageKey = EINSTELLUNGEN_SEKTION_LS_PREFIX + this.sectionId;
    const offen = this.persist
      ? einstellungenSektionLeseOffen(storageKey, this.defaultOffen)
      : this.defaultOffen;
    return {
      offen,
      storageKey,
    };
  },
  computed: {
    kopfAriaLabel() {
      const aktion = this.offen ? 'einklappen' : 'ausklappen';
      return `${this.titel}: Bereich ${aktion}`;
    },
    inhaltId() {
      return 'einstellungen-sektion-' + this.sectionId;
    },
  },
  methods: {
    toggle() {
      this.offen = !this.offen;
      if (this.persist) {
        einstellungenSektionSchreibeOffen(this.storageKey, this.offen);
      }
    },
  },
  template: `
    <div
      class="text-start htbah-einstellungen-sektion"
      :class="{
        'card p-3 mb-3': !eingebettet,
        'htbah-einstellungen-sektion--eingebettet': eingebettet,
        'htbah-einstellungen-sektion--offen': offen,
        'htbah-einstellungen-sektion--klein': klein,
        'htbah-einstellungen-sektion--gefahr': gefahr,
      }">
      <button
        type="button"
        class="htbah-einstellungen-sektion-kopf w-100 d-flex align-items-center justify-content-between gap-2 p-0 border-0 bg-transparent text-start lh-1"
        :class="gefahr ? 'text-danger' : 'text-body'"
        :aria-expanded="offen ? 'true' : 'false'"
        :aria-controls="inhaltId"
        :aria-label="kopfAriaLabel"
        @click="toggle">
        <component
          :is="klein ? 'h6' : 'h5'"
          class="mb-0 d-flex align-items-center gap-2 lh-1 flex-grow-1 min-w-0"
          :class="gefahr ? 'text-danger' : ''">
          <span
            v-if="emoji"
            class="htbah-page-title-emoji flex-shrink-0"
            aria-hidden="true">{{ emoji }}</span>
          <span>{{ titel }}</span>
        </component>
        <span
          class="material-symbols-outlined htbah-einstellungen-sektion-ico flex-shrink-0"
          aria-hidden="true">
          {{ offen ? 'expand_less' : 'expand_more' }}
        </span>
      </button>
      <div
        v-show="offen"
        :id="inhaltId"
        class="htbah-einstellungen-sektion-inhalt">
        <slot />
      </div>
    </div>
  `,
};
