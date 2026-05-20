window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.NichtGefunden = {
  computed: {
    grund() {
      const q = this.$route && this.$route.query ? this.$route.query : {};
      const g = typeof q.grund === 'string' ? q.grund.trim().toLowerCase() : '';
      return g === 'charakter' ? 'charakter' : 'route';
    },
    charakterId() {
      const q = this.$route && this.$route.query ? this.$route.query : {};
      return typeof q.id === 'string' ? q.id.trim() : '';
    },
    unbekannterPfad() {
      const q = this.$route && this.$route.query ? this.$route.query : {};
      const von = typeof q.von === 'string' ? q.von.trim() : '';
      return von || (this.$route && typeof this.$route.path === 'string' ? this.$route.path : '');
    },
    rolle() {
      return window.HTBAH.ladeAppRolle();
    },
    kicker() {
      if (this.grund === 'charakter') {
        return 'Charakter nicht gefunden';
      }
      return 'Seite nicht gefunden';
    },
    titel() {
      if (this.grund === 'charakter') {
        return 'Dieser Held ist spurlos verschwunden';
      }
      return 'Kritischer Fehlschlag auf dem Pfad';
    },
    beschreibung() {
      if (this.grund === 'charakter') {
        const idHinweis = this.charakterId
          ? ` Die gesuchte ID „${this.charakterId}" ist in deinen lokalen Charakterdaten nicht hinterlegt.`
          : ' Der angeforderte Charakter ist in deinen lokalen Daten nicht hinterlegt.';
        return (
          'Die Spielleitung kennt diesen Namen nicht – zumindest nicht in deiner Begleit-App.' +
          idHinweis +
          ' Vielleicht wurde der Charakter gelöscht, die ID stammt aus einem alten Link oder du bist im falschen Browser-Profil.'
        );
      }
      const pfad = this.unbekannterPfad;
      const pfadHinweis = pfad ? ` (${pfad})` : '';
      return (
        'Dein W100-Wurf auf „Existiert diese Route?" ist leider gescheitert' +
        pfadHinweis +
        '. In Pen & Paper darf man die Welt nicht einfach umdefinieren – in der App gilt das für URLs genauso.'
      );
    },
    wuerfelErgebnis() {
      return '404';
    },
    wuerfelLabel() {
      return 'W100 · Ergebnis';
    },
    primaerAktionLabel() {
      if (this.rolle === 'spielleitung') {
        return 'Zur Spielleitung';
      }
      if (this.rolle === 'charakter') {
        return 'Zu meinem Charakter';
      }
      return 'Zur Startseite';
    },
    primaerAktionPfad() {
      if (this.rolle === 'spielleitung') {
        return '/spielleiter';
      }
      if (this.rolle === 'charakter') {
        const id = window.HTBAH.ladeAktivenCharakterId();
        if (id && window.HTBAH.ladeCharakterEintrag(id)) {
          const eintrag = window.HTBAH.ladeCharakterEintrag(id);
          const suffix = window.HTBAH_CHARAKTER_MODEL.charakterStandardTabSuffix(eintrag.charakter);
          return `/charakter/${id}/${suffix}`;
        }
        return '/charakter/neu/session-zero';
      }
      return '/';
    },
    zeigeCharakterNeuAktion() {
      return this.grund === 'charakter' && this.rolle !== 'spielleitung';
    },
  },
  methods: {
    zurueck() {
      this.$router.push(this.primaerAktionPfad);
    },
    charakterNeu() {
      window.HTBAH.speichereAppRolle('charakter');
      this.$router.push('/charakter/neu/session-zero');
    },
    startseite() {
      this.$router.push('/');
    },
  },
  template: `
    <div class="container content py-3 htbah-404-page">
      <div class="htbah-404-hero text-center mb-4">
        <div class="htbah-404-wuerfel-wrap" aria-hidden="true">
          <span class="htbah-404-wuerfel htbah-404-wuerfel--links">🎲</span>
          <div class="htbah-404-wuerfel-ergebnis card shadow-sm">
            <p class="htbah-404-wuerfel-kicker mb-1">{{ wuerfelLabel }}</p>
            <p class="htbah-404-wuerfel-zahl mb-0">{{ wuerfelErgebnis }}</p>
          </div>
          <span class="htbah-404-wuerfel htbah-404-wuerfel--rechts">📜</span>
        </div>
        <p class="htbah-404-kicker text-uppercase mb-2">{{ kicker }}</p>
        <h1 class="htbah-404-titel mb-2">{{ titel }}</h1>
        <p class="htbah-404-beschreibung text-body-secondary mb-0">{{ beschreibung }}</p>
      </div>

      <div class="card htbah-404-flavor mb-3 text-start">
        <div class="d-flex gap-3 align-items-start">
          <span class="htbah-404-flavor-icon" aria-hidden="true">🎭</span>
          <div>
            <h6 class="mb-2">Aus der Spielleitungs-Perspektive</h6>
            <p class="mb-0 small text-body-secondary">
              <template v-if="grund === 'charakter'">
                In einer Runde würdest du jetzt nachfragen, ob der Charakter umbenannt wurde,
                ob ihr eine andere Kampagne spielt oder ob jemand den Helden aus dem Abenteuerbuch
                gestrichen hat. Hier hilft ein neuer Charakter oder die Rückkehr zu einem gespeicherten Helden.
              </template>
              <template v-else>
                Unbekannte Pfade sind wie Türen, die die Spielleitung nie beschrieben hat:
                Ihr könnt sie nicht einfach betreten. Prüft den Link oder kehrt zur bekannten Karte zurück.
              </template>
            </p>
          </div>
        </div>
      </div>

      <div class="d-grid gap-2 mb-3">
        <button type="button" class="btn btn-primary btn-lg" @click="zurueck">
          {{ primaerAktionLabel }}
        </button>
        <button
          v-if="zeigeCharakterNeuAktion"
          type="button"
          class="btn btn-outline-primary"
          @click="charakterNeu">
          Neuen Charakter erstellen
        </button>
        <button
          v-if="rolle"
          type="button"
          class="btn btn-outline-secondary"
          @click="startseite">
          Zur App-Startseite
        </button>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>
    </div>
  `,
};
