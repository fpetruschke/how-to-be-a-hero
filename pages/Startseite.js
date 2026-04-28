window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.Startseite = {
  data() {
    return {
      charakterEintraege: [],
      penPaperModalInstanz: null,
      penPaperModalOffen: false,
    };
  },
  computed: {
    projektTitel() {
      return 'How to be a Hero';
    },
    projektUntertitel() {
      return 'Diese Anwendung dient als Begleit-App zum Pen-&-Paper-Regelwerk von Hauke Gerdes und dem How to be a Hero e.V.';
    },
    sortierteCharaktere() {
      return [...this.charakterEintraege].sort((a, b) => {
        const aName = this.charakterName(a).toLocaleLowerCase('de');
        const bName = this.charakterName(b).toLocaleLowerCase('de');
        return aName.localeCompare(bName, 'de');
      });
    },
    hatGespeicherteCharaktere() {
      return this.sortierteCharaktere.length > 0;
    },
  },
  methods: {
    aktualisiereCharakterListe() {
      const liste = window.HTBAH.listeCharaktere();
      this.charakterEintraege = Array.isArray(liste) ? liste : [];
    },
    charakterName(eintrag) {
      const name =
        eintrag && eintrag.charakter && typeof eintrag.charakter.name === 'string'
          ? eintrag.charakter.name.trim()
          : '';
      return name || 'Unbenannter Charakter';
    },
    charakterUntertitel(eintrag) {
      const charakter = eintrag && eintrag.charakter ? eintrag.charakter : null;
      if (!charakter) {
        return 'Noch keine Angaben';
      }
      const beruf = typeof charakter.beruf === 'string' ? charakter.beruf.trim() : '';
      const glaube = typeof charakter.glaube === 'string' ? charakter.glaube.trim() : '';
      if (beruf && glaube) {
        return `${beruf} · ${glaube}`;
      }
      return beruf || glaube || 'Zum Bearbeiten öffnen';
    },
    charakterZustandStatus(eintrag) {
      const berechne =
        window.HTBAH && typeof window.HTBAH.berechneLebenspunkteStatus === 'function'
          ? window.HTBAH.berechneLebenspunkteStatus
          : null;
      if (!berechne) {
        return { tot: false, bewusstlos: false };
      }
      return berechne(eintrag && eintrag.charakter ? eintrag.charakter : null);
    },
    charakterZustandEmoji(eintrag) {
      const status = this.charakterZustandStatus(eintrag);
      if (status.tot) {
        return '💀';
      }
      if (status.bewusstlos) {
        return '😵';
      }
      return '';
    },
    charakterZustandLabel(eintrag) {
      const status = this.charakterZustandStatus(eintrag);
      if (status.tot) {
        return 'Charakter ist tot';
      }
      if (status.bewusstlos) {
        return 'Charakter ist bewusstlos';
      }
      return '';
    },
    charakterKartenStatusKlasse(eintrag) {
      const status = this.charakterZustandStatus(eintrag);
      if (status.tot) {
        return 'htbah-start-charakterkarte--tot';
      }
      if (status.bewusstlos) {
        return 'htbah-start-charakterkarte--bewusstlos';
      }
      return '';
    },
    regelwerkOeffnen() {
      this.$root.uiZustand.regelwerkOffen = true;
    },
    rolleCharakterNeuWaehlen() {
      window.HTBAH.speichereAppRolle('charakter');
      this.$router.push('/charakter/neu');
    },
    rolleCharakterMitIdWaehlen(id) {
      window.HTBAH.speichereAppRolle('charakter');
      window.HTBAH.setzeAktivenCharakterId(id);
      this.$router.push(`/charakter/${id}`);
    },
    rolleSpielleitungWaehlen() {
      window.HTBAH.speichereAppRolle('spielleitung');
      this.$router.push('/spielleiter');
    },
    penPaperInfoOeffnen() {
      this.penPaperModalOffen = true;
      this.$nextTick(() => {
        const el = this.$refs.penPaperModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.penPaperModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.penPaperModalInstanz.show();
      });
    },
    onPenPaperModalHidden() {
      this.penPaperModalInstanz = null;
      this.penPaperModalOffen = false;
    },
  },
  mounted() {
    this.aktualisiereCharakterListe();
  },
  beforeUnmount() {
    if (this.penPaperModalInstanz) {
      this.penPaperModalInstanz.hide();
      this.penPaperModalInstanz = null;
    }
  },
  template: `
    <div class="container content py-3 text-center">
      <div class="htbah-start-hero mb-3">
        <span class="htbah-start-hero-logo-wrap">
          <img
            src="assets/img/htbah-begleit-app-logo.png"
            alt="How to be a Hero - Begleit-App Logo"
            class="htbah-start-hero-logo" />
        </span>
        <div class="htbah-start-hero-text text-center">
          <h2 class="htbah-start-hero-title mb-0">How to be a Hero - Begleit-App</h2>
          <p class="htbah-start-hero-subtitle text-secondary mb-0">Simple. Schnell. Dein Abenteuer.</p>
        </div>
      </div>

      <div
        class="card action-card text-start mb-3 cursor-pointer"
        role="button"
        tabindex="0"
        aria-label="Regelwerk öffnen"
        @click="regelwerkOeffnen"
        @keydown.enter.prevent="regelwerkOeffnen"
        @keydown.space.prevent="regelwerkOeffnen">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div class="htbah-start-card-avatar flex-shrink-0">
            <span class="htbah-start-card-avatar-emoji" aria-hidden="true">📜</span>
          </div>
          <div class="min-w-0 flex-grow-1">
            <p class="mb-0 small text-body-secondary text-uppercase htbah-start-card-kicker">
              Regelwerk
            </p>
            <h5 class="mb-1 text-truncate htbah-start-card-charaktername">{{ projektTitel }}</h5>
            <p class="mb-0 small text-body-secondary">{{ projektUntertitel }}</p>
          </div>
          <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </div>

      <div
        class="card action-card text-start mb-3 cursor-pointer"
        role="button"
        tabindex="0"
        aria-label="Pen und Paper Hilfe öffnen"
        @click="penPaperInfoOeffnen"
        @keydown.enter.prevent="penPaperInfoOeffnen"
        @keydown.space.prevent="penPaperInfoOeffnen">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div class="htbah-start-card-avatar flex-shrink-0">
            <span class="htbah-start-card-avatar-emoji" aria-hidden="true">📝</span>
          </div>
          <div class="min-w-0 flex-grow-1">
            <p class="mb-0 small text-body-secondary text-uppercase htbah-start-card-kicker">
              Pen &amp; Paper
            </p>
            <h5 class="mb-1 text-truncate htbah-start-card-charaktername">Wie funktioniert eigentlich Pen &amp; Paper?</h5>
            <p class="mb-0 small text-body-secondary">Ein schneller Einstieg für Neulinge.</p>
          </div>
          <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-12 col-md-6">
          <div
            class="card action-card text-start h-100 cursor-pointer"
            role="button"
            tabindex="0"
            aria-label="Neuen Charakter erstellen"
            @click="rolleCharakterNeuWaehlen"
            @keydown.enter.prevent="rolleCharakterNeuWaehlen"
            @keydown.space.prevent="rolleCharakterNeuWaehlen">
            <div class="d-flex align-items-center justify-content-between gap-2">
              <div class="htbah-start-card-avatar flex-shrink-0">
                <span class="htbah-start-card-avatar-emoji" aria-hidden="true">➕</span>
              </div>
              <div class="min-w-0 flex-grow-1 text-start">
                <h5 class="mb-0 text-truncate htbah-start-card-charaktername htbah-start-card-modus-titel">
                  Neuen Charakter erstellen
                </h5>
              </div>
              <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
                chevron_right
              </span>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div
            class="card action-card text-start h-100 cursor-pointer"
            role="button"
            tabindex="0"
            aria-label="Modus Spielleitung"
            @click="rolleSpielleitungWaehlen"
            @keydown.enter.prevent="rolleSpielleitungWaehlen"
            @keydown.space.prevent="rolleSpielleitungWaehlen">
            <div class="d-flex align-items-center justify-content-between gap-2">
              <div class="htbah-start-card-avatar flex-shrink-0">
                <span class="htbah-start-card-avatar-emoji" aria-hidden="true">🎭</span>
              </div>
              <div class="min-w-0 flex-grow-1 text-start">
                <h5 class="mb-0 text-truncate htbah-start-card-charaktername htbah-start-card-modus-titel">
                  Ich bin die Spielleitung
                </h5>
              </div>
              <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
                chevron_right
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hatGespeicherteCharaktere" class="mb-3">
        <h5 class="text-start mb-2">Gespeicherte Charaktere</h5>
        <div class="row g-3">
          <div
            v-for="eintrag in sortierteCharaktere"
            :key="eintrag.id"
            class="col-12 col-md-6">
            <div
              class="card action-card text-start h-100 cursor-pointer"
              :class="charakterKartenStatusKlasse(eintrag)"
              role="button"
              tabindex="0"
              :aria-label="'Charakter öffnen: ' + charakterName(eintrag)"
              @click="rolleCharakterMitIdWaehlen(eintrag.id)"
              @keydown.enter.prevent="rolleCharakterMitIdWaehlen(eintrag.id)"
              @keydown.space.prevent="rolleCharakterMitIdWaehlen(eintrag.id)">
              <div class="d-flex align-items-center justify-content-between gap-2">
                <div class="htbah-start-card-avatar flex-shrink-0">
                  <img
                    v-if="eintrag.charakterBild"
                    :src="eintrag.charakterBild"
                    :alt="'Profilbild von ' + charakterName(eintrag)"
                    class="htbah-start-card-avatar-img" />
                  <span
                    v-else
                    class="htbah-start-card-avatar-emoji"
                    aria-hidden="true">🧙</span>
                  <span
                    v-if="charakterZustandEmoji(eintrag)"
                    class="htbah-charakter-zustand-overlay"
                    :aria-label="charakterZustandLabel(eintrag)"
                    role="img">
                    {{ charakterZustandEmoji(eintrag) }}
                  </span>
                </div>
                <div class="min-w-0 flex-grow-1">
                  <p class="mb-0 small text-body-secondary text-uppercase htbah-start-card-kicker">
                    Charakter
                  </p>
                  <h5 class="mb-1 text-truncate htbah-start-card-charaktername">{{ charakterName(eintrag) }}</h5>
                  <p class="mb-0 small text-body-secondary text-truncate">{{ charakterUntertitel(eintrag) }}</p>
                </div>
                <span class="material-symbols-outlined action-card-arrow" aria-hidden="true">
                  chevron_right
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>

      <div
        ref="penPaperModalElement"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="htbahPenPaperModalTitel"
        aria-hidden="true"
        @hidden.bs.modal="onPenPaperModalHidden">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="htbahPenPaperModalTitel">Pen &amp; Paper - Einstieg</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start">
              <div class="card p-3 mb-3">
                <h6 class="mb-2">Wie wird gespielt?</h6>
                <p class="mb-0 small text-body-secondary">
                  Entweder analog vor Ort (Tisch, Würfel, Notizen) oder digital über Voice-/Video-Chat und
                  gemeinsame Tools. Wichtig ist nur: Ihr einigt euch vorab auf Hilfsmittel und Ablauf.
                </p>
              </div>
              <div class="card p-3 mb-3">
                <h6 class="mb-2">Die Spielenden</h6>
                <p class="mb-0 small text-body-secondary">
                  Jede Person steuert einen eigenen Charakter und beschreibt aus der Ich-Perspektive, was sie tun will.
                  Die Umgebung, Sinneseindrücke und Szenerie beschreibt die Spielleitung. Spielende können also nicht
                  einfach etwas in die Szene "hineinerzählen" und damit festlegen, dass es existiert.
                </p>
              </div>
              <div class="card p-3 mb-3">
                <h6 class="mb-2">Die Spielleitung</h6>
                <p class="mb-0 small text-body-secondary">
                  Die Spielleitung beschreibt Welt, NSCs und Situationen, moderiert Regeln und sorgt dafür,
                  dass alle eingebunden sind. Sie führt die Runde, spielt aber nicht <em>gegen</em> die Gruppe,
                  sondern gemeinsam <em>mit</em> ihr.
                </p>
              </div>
              <div class="card p-3 mb-3">
                <h6 class="mb-2">Session Zero</h6>
                <p class="mb-0 small text-body-secondary">
                  Vor dem ersten Abenteuer besprecht ihr Regelwerk, Setting, Spielstil, Grenzen und Schleier.
                  Oft entstehen dabei schon erste Charakterideen und gemeinsame Verbindungen zwischen den Figuren.
                  Vielleicht erarbeitet ihr schon gemeinsam eure Charaktere. Das kann aber auch später noch passieren.
                </p>
              </div>
              <div class="card p-3">
                <h6 class="mb-2">Weitere Hinweise für eine gute Zeit</h6>
                <p class="mb-0 small text-body-secondary">
                  Sprecht offen über Erwartungen, gebt einander Raum und respektiert Stoppsignale.
                  Macht bei längeren Sessions Pausen und gebt nach der Runde kurzes Feedback:
                  Was war gut, was soll beim nächsten Mal anders laufen?
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
