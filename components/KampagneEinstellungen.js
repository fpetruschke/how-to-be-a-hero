window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  function normalisierterKampagnenName(name) {
    return String(name || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('de');
  }

  window.HTBAH_KOMPONENTEN.KampagneEinstellungen = {
    components: {
      SpielleitungPdfExportModal: window.HTBAH_KOMPONENTEN.SpielleitungPdfExportModal,
    },
    props: {
      kampagneId: { type: String, default: '' },
    },
    data() {
      return {
        zustand: window.HTBAH.ladeSpielleitungZustand(),
        nameEntwurf: '',
        nameSpeichernAktiv: false,
        loeschenAktiv: false,
      };
    },
    computed: {
      kampagne() {
        const kid = typeof this.kampagneId === 'string' ? this.kampagneId.trim() : '';
        if (!kid) {
          return null;
        }
        const liste = Array.isArray(this.zustand && this.zustand.kampagnen)
          ? this.zustand.kampagnen
          : [];
        return liste.find((k) => k && k.id === kid) || null;
      },
      nameGeaendert() {
        if (!this.kampagne) {
          return false;
        }
        return normalisierterKampagnenName(this.nameEntwurf) !== normalisierterKampagnenName(this.kampagne.name);
      },
      kannNameSpeichern() {
        return this.nameGeaendert && !!this.nameEntwurf.trim() && !this.nameSpeichernAktiv;
      },
    },
    watch: {
      kampagne: {
        immediate: true,
        handler(k) {
          this.nameEntwurf = k && typeof k.name === 'string' ? k.name : '';
        },
      },
      kampagneId() {
        this.zustand = window.HTBAH.ladeSpielleitungZustand();
      },
    },
    methods: {
      kampagnenNameExistiert(name, ausgenommeneId = '') {
        const ziel = normalisierterKampagnenName(name);
        if (!ziel) {
          return false;
        }
        const kampagnen = Array.isArray(this.zustand && this.zustand.kampagnen)
          ? this.zustand.kampagnen
          : [];
        return kampagnen.some((k) => {
          if (!k || (ausgenommeneId && k.id === ausgenommeneId)) {
            return false;
          }
          return normalisierterKampagnenName(k.name) === ziel;
        });
      },
      persist() {
        window.HTBAH.speichereSpielleitungZustand(this.zustand);
      },
      zeigeStatus(text, typ = 'success') {
        window.HTBAH.ui.notify({ text, typ });
      },
      labelsGeaendert() {
        this.zustand = window.HTBAH.ladeSpielleitungZustand();
        this.$emit('geaendert');
      },
      async nameSpeichern() {
        const k = this.kampagne;
        if (!k || !this.kannNameSpeichern) {
          return;
        }
        const t = this.nameEntwurf.trim();
        if (!t) {
          this.zeigeStatus('Bitte einen Kampagnennamen eingeben.', 'danger');
          return;
        }
        if (this.kampagnenNameExistiert(t, k.id)) {
          this.zeigeStatus('Eine Kampagne mit diesem Namen existiert bereits.', 'danger');
          return;
        }
        this.nameSpeichernAktiv = true;
        try {
          k.name = t;
          this.persist();
          this.zeigeStatus('Kampagnenname gespeichert.');
          if (
            this.$router &&
            typeof this.$router.replace === 'function' &&
            window.HTBAH &&
            typeof window.HTBAH.kampagnenPfad === 'function'
          ) {
            const tab =
              this.$route && this.$route.params && this.$route.params.tab
                ? this.$route.params.tab
                : 'einstellungen';
            const ziel = window.HTBAH.kampagnenPfad(tab, k.id);
            if (ziel !== this.$route.path) {
              this.$router.replace(ziel);
            }
          }
          this.$emit('geaendert');
        } finally {
          this.nameSpeichernAktiv = false;
        }
      },
      nameZuruecksetzen() {
        if (this.kampagne) {
          this.nameEntwurf = this.kampagne.name || '';
        }
      },
      pdfExportModalOeffnen() {
        if (!this.kampagneId || !this.$refs.spielleitungPdfExportModal) {
          return;
        }
        this.$refs.spielleitungPdfExportModal.oeffnen();
      },
      async kampagneLoeschen() {
        const k = this.kampagne;
        if (!k || this.loeschenAktiv) {
          return;
        }
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Kampagne unwiderruflich löschen?',
          beschreibung:
            `Alle Inhalte der Kampagne „${k.name}“ werden unwiderruflich gelöscht — einschließlich Zufallstabellen, Weltenbau, Gruppendaten und verknüpfter lokaler Charaktere, sofern vorhanden.`,
          bestaetigenText: 'Endgültig löschen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (!bestaetigt) {
          return;
        }
        const gid = k.id;
        const name = k.name || 'Kampagne';
        this.loeschenAktiv = true;
        let ergebnis = null;
        try {
          ergebnis = await window.HTBAH.ui.mitFortschritt({
            titel: `Kampagne „${name}“ wird gelöscht …`,
            aufgabe: (report) =>
              window.HTBAH.loescheSpielleitungKampagneKomplettAsync(gid, report),
          });
        } finally {
          this.loeschenAktiv = false;
        }
        if (!ergebnis || !ergebnis.ok) {
          this.zeigeStatus('Die Kampagne konnte nicht gelöscht werden.', 'danger');
          return;
        }
        if (window.HTBAH?.ui?.bereinigeModalBackdrop) {
          window.HTBAH.ui.bereinigeModalBackdrop();
        }
        if (this.$router && typeof this.$router.push === 'function') {
          await this.$router.push('/kampagnen');
        }
      },
    },
    template: `
      <div class="htbah-kampagne-einstellungen text-start">
        <div class="card p-3 mb-3">
          <h6 class="mb-2">Kampagnenname</h6>
          <p class="small text-body-secondary mb-2">
            Der Name erscheint in der Übersicht und in der URL dieser Kampagne.
          </p>
          <div class="row g-2 align-items-stretch">
            <div class="col-12 col-md">
              <div class="form-floating">
                <input
                  id="htbah-kampagne-name"
                  type="text"
                  class="form-control"
                  v-model="nameEntwurf"
                  placeholder=" "
                  autocomplete="off"
                  :disabled="!kampagne"
                  @keydown.enter.prevent="nameSpeichern" />
                <label for="htbah-kampagne-name">Name der Kampagne</label>
              </div>
            </div>
            <div class="col-12 col-md-auto d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-primary flex-grow-1"
                :disabled="!kannNameSpeichern"
                @click="nameSpeichern">
                {{ nameSpeichernAktiv ? 'Speichert …' : 'Speichern' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary flex-grow-1"
                :disabled="!nameGeaendert || nameSpeichernAktiv"
                @click="nameZuruecksetzen">
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>

        <div class="card p-3 mb-3">
          <h6 class="mb-2">Labels</h6>
          <p class="small text-body-secondary mb-2">
            Setting, Format und Inhaltshinweise für diese Kampagne — z. B. Epoche, One-Shot oder Warnhinweise.
          </p>
          <kampagnen-labels-editor
            v-if="kampagneId"
            :kampagne-id="kampagneId"
            @geaendert="labelsGeaendert" />
          <p v-else class="small text-body-secondary mb-0">Keine Kampagne ausgewählt.</p>
        </div>

        <div class="card p-3 mb-3">
          <h6 class="mb-2">Kampagnen-PDF</h6>
          <p class="small text-body-secondary mb-2">
            Gruppe, Weltenbau-Inhalte, Abenteuerbuch und interaktive Welt als PDF — Inhalte, Theme und Vorschau vor dem Download wählbar.
          </p>
          <button
            type="button"
            class="btn btn-outline-primary"
            :disabled="!kampagneId"
            @click="pdfExportModalOeffnen">
            PDF erstellen …
          </button>
        </div>

        <div class="card p-3 mb-0 border border-danger">
          <h6 class="mb-2 text-danger">Kampagne löschen</h6>
          <p class="small text-body-secondary mb-2">
            Entfernt diese Kampagne unwiderruflich — inklusive aller Inhalte und verknüpfter lokaler Charaktere in der Bibliothek.
          </p>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="!kampagne || loeschenAktiv"
            @click="kampagneLoeschen">
            {{ loeschenAktiv ? 'Wird gelöscht …' : 'Kampagne löschen …' }}
          </button>
        </div>

        <spielleitung-pdf-export-modal
          ref="spielleitungPdfExportModal"
          :kampagne-id="kampagneId"
          :kampagne-name="kampagne ? kampagne.name : ''" />
      </div>
    `,
  };
})();
