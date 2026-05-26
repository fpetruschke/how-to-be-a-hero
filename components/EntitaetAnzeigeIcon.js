window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

function kartenIconApi() {
  return window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon
    ? window.HTBAH_SHARED.EntityKartenIcon
    : null;
}

window.HTBAH_KOMPONENTEN.EntitaetAnzeigeIcon = {
  props: {
    entityTyp: { type: String, default: '' },
    zeile: { type: Object, default: null },
    charakterBild: { type: String, default: '' },
    /** sm (32px), md (40px), lg (50px) */
    groesse: { type: String, default: 'md' },
    titel: { type: String, default: '' },
  },
  computed: {
    anzeige() {
      const api = kartenIconApi();
      if (!api || typeof api.entitaetAnzeigeIcon !== 'function') {
        return { art: 'emoji', emoji: '📌', form: 'eckig' };
      }
      return api.entitaetAnzeigeIcon(this.zeile, this.entityTyp, {
        charakterBild: this.charakterBild,
      });
    },
    istBild() {
      return this.anzeige && this.anzeige.art === 'bild' && !!this.anzeige.bildDataUrl;
    },
    istRund() {
      return this.anzeige && this.anzeige.form === 'rund';
    },
    groessenKlasse() {
      const g = String(this.groesse || 'md').trim();
      if (g === 'sm' || g === 'lg') {
        return `htbah-entitaet-anzeige-icon--${g}`;
      }
      return 'htbah-entitaet-anzeige-icon--md';
    },
  },
  template: `
    <span
      class="htbah-entitaet-anzeige-icon"
      :class="[groessenKlasse, { 'htbah-entitaet-anzeige-icon--rund': istRund, 'htbah-entitaet-anzeige-icon--eckig': !istRund }]"
      :title="titel"
      aria-hidden="true">
      <img v-if="istBild" :src="anzeige.bildDataUrl" alt="" draggable="false" />
      <span v-else class="htbah-entitaet-anzeige-icon-emoji">{{ anzeige.emoji }}</span>
    </span>
  `,
};
