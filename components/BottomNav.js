window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.BottomNav = {
  props: ['uiZustand'],
  data() {
    return {
      wuerfelModus: 'w10',
      anzahlW10: 1,
      ergebnisse: [],
    };
  },
  computed: {
    ergebnisSumme() {
      return this.ergebnisse.reduce((summe, wert) => summe + wert, 0);
    },
    ergebnisTitel() {
      return this.wuerfelModus === 'w10' ? 'W10 Ergebnisse' : 'W100 Ergebnis';
    },
    rolle() {
      void this.$route.fullPath;
      return window.HTBAH.ladeAppRolle();
    },
    zeigeNav() {
      const p = this.$route.path || '/';
      return p !== '/';
    },
    startseiteLandingAktiv() {
      const p = this.$route.path || '';
      return p === '/';
    },
    spielleiterGruppenAktiv() {
      const p = this.$route.path || '';
      return p === '/spielleiter' || p.startsWith('/spielleiter/gruppe/');
    },
    presetVerwaltungAktiv() {
      const p = this.$route.path || '';
      return (
        p === '/faehigkeiten-presets' ||
        p === '/faehigkeiten-preset-bearbeiten' ||
        /^\/faehigkeiten-preset-bearbeiten\//.test(p)
      );
    },
    weltenbauAktiv() {
      const p = this.$route.path || '';
      return p === '/weltenbau';
    },
  },
  methods: {
    regelwerkOeffnen() {
      this.uiZustand.regelwerkOffen = true;
    },
    abenteuerbuchOeffnen() {
      this.uiZustand.abenteuerbuchOffen = true;
    },
    wuerfelModalOeffnen() {
      const modalElement = this.$refs.wuerfelModalElement;
      if (!modalElement) {
        return;
      }

      const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();
    },
    setzeWuerfelModus(modus) {
      this.wuerfelModus = modus === 'w100' ? 'w100' : 'w10';
      this.ergebnisse = [];
    },
    wuerfeln() {
      if (this.wuerfelModus === 'w100') {
        this.ergebnisse = [window.HTBAH.wuerfelW100()];
        return;
      }
      const anzahl10 = Math.max(1, Math.min(50, Number(this.anzahlW10) || 1));
      this.anzahlW10 = anzahl10;
      this.ergebnisse = Array.from({ length: anzahl10 }, () => window.HTBAH.wuerfelW10());
    },
  },
  template: `
    <teleport to="body">
      <div
        v-if="zeigeNav"
        class="navbar-fixed d-flex flex-nowrap align-items-stretch w-100 px-2 py-2 htbah-bottom-nav-inner">
        <template v-if="rolle === 'charakter'">
          <router-link
            to="/"
            title="App-Startseite (Rollenwahl)"
            :class="{ 'router-link-active': startseiteLandingAktiv }">
            🏠
          </router-link>
          <router-link to="/charakter" title="Charakter">🧙</router-link>
        </template>
        <template v-else-if="rolle === 'spielleitung'">
          <router-link
            to="/"
            title="App-Startseite (Rollenwahl)"
            :class="{ 'router-link-active': startseiteLandingAktiv }">
            🏠
          </router-link>
          <router-link
            to="/spielleiter"
            title="Gruppen"
            :class="{ 'router-link-active': spielleiterGruppenAktiv }">
            👥
          </router-link>
          <router-link
            to="/faehigkeiten-presets"
            title="Fähigkeiten-Presets"
            :class="{ 'router-link-active': presetVerwaltungAktiv }">
            📦
          </router-link>
          <router-link to="/zufallstabellen" title="Zufallstabellen">📚</router-link>
          <router-link
            to="/weltenbau"
            title="Weltenbau"
            :class="{ 'router-link-active': weltenbauAktiv }">
            🗺️
          </router-link>
          <button type="button" title="Spielleitungsnotizen (Abenteuerbuch)" @click="abenteuerbuchOeffnen">
            📝
          </button>
        </template>
        <button type="button" title="Regelwerk" @click="regelwerkOeffnen">📜</button>
        <button type="button" title="Würfel" @click="wuerfelModalOeffnen">🎲</button>
        <router-link to="/einstellungen" title="Einstellungen">⚙️</router-link>
      </div>
    </teleport>

    <teleport to="body">
      <div
        class="modal fade"
        id="wuerfelModal"
        ref="wuerfelModalElement"
        tabindex="-1"
        aria-labelledby="wuerfelModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title d-flex align-items-center gap-2" id="wuerfelModalLabel">
                <span aria-hidden="true">🎲</span>
                Würfelbeutel
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <div class="card p-3 mb-3">
                <div class="btn-group w-100 mb-3" role="group" aria-label="Würfelmodus">
                  <button
                    type="button"
                    class="btn"
                    :class="wuerfelModus === 'w10' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setzeWuerfelModus('w10')">
                    x W10
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="wuerfelModus === 'w100' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="setzeWuerfelModus('w100')">
                    1x W100
                  </button>
                </div>

                <div class="row g-2 align-items-end">
                  <div class="col-12" v-if="wuerfelModus === 'w10'">
                    <div class="form-floating">
                      <input
                        id="nav-anzahl-w10"
                        type="number"
                        class="form-control"
                        min="1"
                        max="50"
                        v-model.number="anzahlW10"
                        placeholder=" " />
                      <label for="nav-anzahl-w10">Anzahl W10</label>
                    </div>
                  </div>
                  <div class="col-12" v-else>
                    <small>W100 wird immer genau einmal gewürfelt.</small>
                  </div>
                  <div class="col-12">
                    <icon-text-button
                      type="button"
                      class="btn btn-primary w-100"
                      icon="casino"
                      @click="wuerfeln">
                      Würfeln
                    </icon-text-button>
                  </div>
                </div>
              </div>

              <div class="card p-3 mb-2">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <h6 class="mb-0">{{ ergebnisTitel }}</h6>
                  <span
                    class="badge"
                    :class="wuerfelModus === 'w10' ? 'text-bg-primary' : 'text-bg-success'"
                    v-if="wuerfelModus === 'w10' && ergebnisse.length">
                    Summe: {{ ergebnisSumme }}
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-2" v-if="ergebnisse.length">
                  <span
                    class="wuerfel-ergebnis-chip"
                    :class="wuerfelModus === 'w10' ? 'wuerfel-ergebnis-chip-w10' : 'wuerfel-ergebnis-chip-w100'"
                    v-for="(wert, index) in ergebnisse"
                    :key="wuerfelModus + '-' + index">
                    <template v-if="wuerfelModus === 'w10'">
                      #{{ index + 1 }}: {{ wert }}
                    </template>
                    <template v-else>
                      {{ wert }}
                    </template>
                  </span>
                </div>
                <small v-else>Noch kein Wurf.</small>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
