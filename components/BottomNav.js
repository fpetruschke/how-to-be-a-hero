window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.BottomNav = {
  props: ['uiZustand'],
  data() {
    return {
      wuerfelModus: 'w10',
      anzahlW10: 1,
      ergebnisse: [],
      wuerfelModalTab: 'wuerfel',
      atmosphaere: {},
      badgePos: null,
      _badgeDrag: null,
    };
  },
  created() {
    this.atmosphaere = window.HTBAH.ladeAtmosphaereZustand();
    this.badgePos = window.HTBAH.ladeAtmosphaereBadgePosition();
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
    atmosphaereBadgeCombinedStyle() {
      const o = {
        '--atmosphaere-akzent': this.atmosphaereAkzent,
      };
      if (this.badgePos && this.badgePos.mode === 'fixed') {
        o.left = `${this.badgePos.left}px`;
        o.top = `${this.badgePos.top}px`;
        o.right = 'auto';
        o.bottom = 'auto';
      }
      return o;
    },
    atmosphaereHatWerte() {
      const a = this.atmosphaere;
      return !!(a && (a.jahreszeitId || a.tageszeitId || a.temperatur));
    },
    atmosphaereAkzent() {
      const a = this.atmosphaere;
      if (a && a.wetterAkzentFarbe) {
        return a.wetterAkzentFarbe;
      }
      if (a && a.jahreszeitFarbe) {
        return a.jahreszeitFarbe;
      }
      return 'var(--primary-color)';
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
    charakterAktiv() {
      const p = this.$route.path || '';
      return p === '/charakter' || p.startsWith('/charakter/');
    },
    zufallstabellenAktiv() {
      const p = this.$route.path || '';
      return p === '/zufallstabellen' || p.startsWith('/zufallstabellen/');
    },
    weltenbauAktiv() {
      const p = this.$route.path || '';
      return p === '/weltenbau';
    },
    einstellungenAktiv() {
      const p = this.$route.path || '';
      return p === '/einstellungen' || p.startsWith('/einstellungen/');
    },
  },
  methods: {
    regelwerkOeffnen() {
      this.uiZustand.regelwerkOffen = true;
    },
    abenteuerbuchOeffnen() {
      this.uiZustand.abenteuerbuchOffen = true;
    },
    speichereAtmosphaere() {
      window.HTBAH.speichereAtmosphaereZustand(this.atmosphaere);
    },
    atmosphaereAllesWuerfeln() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      Object.assign(this.atmosphaere, AZ.generiereAlles());
      this.speichereAtmosphaere();
    },
    atmosphaereNurJahreszeit() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      Object.assign(this.atmosphaere, AZ.generiereJahreszeit());
      this.speichereAtmosphaere();
    },
    atmosphaereNurWetter() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      const jz = this.atmosphaere.jahreszeitId || 'fruehling';
      if (!this.atmosphaere.jahreszeitId) {
        const m = AZ.jahreszeitMeta('fruehling');
        Object.assign(this.atmosphaere, {
          jahreszeitId: 'fruehling',
          jahreszeitLabel: m.label,
          jahreszeitEmoji: m.emoji,
          jahreszeitFarbe: m.farbe,
        });
      }
      Object.assign(this.atmosphaere, AZ.generiereWetter(jz));
      this.speichereAtmosphaere();
    },
    atmosphaereNurTageszeit() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ) {
        return;
      }
      Object.assign(this.atmosphaere, AZ.generiereTageszeit());
      this.speichereAtmosphaere();
    },
    wuerfelModalOeffnen(tab) {
      if (tab === 'atmosphaere' || tab === 'wuerfel') {
        this.wuerfelModalTab = tab;
      } else {
        this.wuerfelModalTab = 'wuerfel';
      }
      const modalElement = this.$refs.wuerfelModalElement;
      if (!modalElement) {
        return;
      }
      const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();
    },
    atmosphaereBadgeOeffnen() {
      this.wuerfelModalOeffnen('atmosphaere');
    },
    badgeZiehenStart(e) {
      if (e.button != null && e.button !== 0) {
        return;
      }
      const el = this.$refs.atmosphaereBadgeEl;
      if (!el) {
        return;
      }
      e.preventDefault();
      const r = el.getBoundingClientRect();
      this._badgeDrag = {
        captureEl: e.target,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseLeft: r.left,
        baseTop: r.top,
      };
      const move = (ev) => this.badgeZiehenMove(ev);
      const up = (ev) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        this.badgeZiehenEnd();
      };
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        /* optional */
      }
    },
    badgeZiehenMove(e) {
      const d = this._badgeDrag;
      if (!d) {
        return;
      }
      e.preventDefault();
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const el = this.$refs.atmosphaereBadgeEl;
      const w = el ? el.offsetWidth : 120;
      const h = el ? el.offsetHeight : 80;
      let left = d.baseLeft + dx;
      let top = d.baseTop + dy;
      const pad = 6;
      const maxL = Math.max(pad, window.innerWidth - w - pad);
      const maxT = Math.max(pad, window.innerHeight - h - pad);
      left = Math.min(maxL, Math.max(pad, left));
      top = Math.min(maxT, Math.max(pad, top));
      this.badgePos = { mode: 'fixed', left, top };
    },
    badgeZiehenEnd() {
      const d = this._badgeDrag;
      if (d && d.captureEl && d.pointerId != null) {
        try {
          d.captureEl.releasePointerCapture(d.pointerId);
        } catch {
          /* optional */
        }
      }
      this._badgeDrag = null;
      window.HTBAH.speichereAtmosphaereBadgePosition(this.badgePos);
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
          <router-link
            to="/charakter"
            title="Charakter"
            :class="{ 'router-link-active': charakterAktiv }">
            🧙
          </router-link>
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
          <router-link
            to="/zufallstabellen"
            title="Zufallstabellen"
            :class="{ 'router-link-active': zufallstabellenAktiv }">
            📚
          </router-link>
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
        <button type="button" title="Würfel" @click="wuerfelModalOeffnen('wuerfel')">🎲</button>
        <router-link
          to="/einstellungen"
          title="Einstellungen"
          :class="{ 'router-link-active': einstellungenAktiv }">
          ⚙️
        </router-link>
      </div>
    </teleport>

    <teleport to="body">
      <div
        v-if="zeigeNav"
        ref="atmosphaereBadgeEl"
        class="htbah-atmosphaere-badge"
        :class="{ 'htbah-atmosphaere-badge--custom-pos': badgePos && badgePos.mode === 'fixed' }"
        :style="atmosphaereBadgeCombinedStyle">
        <div
          class="htbah-atmosphaere-badge__drag"
          title="Ziehen zum Verschieben"
          aria-label="Wetter-Badge verschieben"
          @pointerdown="badgeZiehenStart">
          ⠿
        </div>
        <button
          type="button"
          class="htbah-atmosphaere-badge__tap"
          title="Wetter &amp; Tageszeit (Würfelbeutel)"
          @click="atmosphaereBadgeOeffnen">
          <template v-if="atmosphaereHatWerte">
            <span class="htbah-atmosphaere-badge__line">
              <span class="htbah-atmosphaere-badge__emoji">{{ atmosphaere.jahreszeitEmoji || '📅' }}</span>
              <span class="htbah-atmosphaere-badge__txt">{{ atmosphaere.jahreszeitLabel || '—' }}</span>
            </span>
            <span class="htbah-atmosphaere-badge__line">
              <span class="htbah-atmosphaere-badge__emoji">{{ atmosphaere.niederschlagEmoji || '🌤️' }}</span>
              <span class="htbah-atmosphaere-badge__txt">{{ atmosphaere.temperatur || '—' }}, {{ atmosphaere.niederschlagLabel || '—' }}</span>
            </span>
            <span class="htbah-atmosphaere-badge__line">
              <span class="htbah-atmosphaere-badge__emoji">{{ atmosphaere.tageszeitEmoji || '🕐' }}</span>
              <span class="htbah-atmosphaere-badge__txt">{{ atmosphaere.tageszeitLabel || '—' }}</span>
            </span>
          </template>
          <template v-else>
            <span class="htbah-atmosphaere-badge__line htbah-atmosphaere-badge__hint">🌤️ Wetter würfeln</span>
          </template>
        </button>
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
        <div class="modal-dialog modal-dialog-centered modal-lg">
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
              <ul class="nav nav-tabs mb-3" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: wuerfelModalTab === 'wuerfel' }"
                    @click="wuerfelModalTab = 'wuerfel'">
                    Würfel
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: wuerfelModalTab === 'atmosphaere' }"
                    @click="wuerfelModalTab = 'atmosphaere'">
                    Wetter &amp; Tageszeit
                  </button>
                </li>
              </ul>

              <div v-show="wuerfelModalTab === 'wuerfel'">
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

              <div v-show="wuerfelModalTab === 'atmosphaere'" class="htbah-atmosphaere-modal">
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <button type="button" class="btn btn-primary" @click="atmosphaereAllesWuerfeln">
                    Alles würfeln
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="atmosphaereNurJahreszeit">
                    Nur Jahreszeit
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="atmosphaereNurWetter">
                    Nur Wetter
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="atmosphaereNurTageszeit">
                    Nur Tageszeit
                  </button>
                </div>
                <p class="small text-secondary mb-3">
                  „Nur Wetter“ nutzt die aktuelle Jahreszeit (oder Frühling, falls noch keine gewählt).
                  Jahreszeit und Wetter sind stimmig gewichtet (kein Schneesturm im Hochsommer).
                </p>
                <div
                  class="card htbah-atmosphaere-karte border-0 shadow-sm mb-0"
                  :style="{ borderLeft: '4px solid ' + atmosphaereAkzent }">
                  <div class="card-body">
                    <div v-if="!atmosphaereHatWerte" class="text-secondary small">
                      Noch keine Werte — tippe auf „Alles würfeln“.
                    </div>
                    <template v-else>
                      <div class="row g-2">
                        <div class="col-md-6">
                          <div class="htbah-atmosphaere-pill" :style="{ background: atmosphaere.jahreszeitFarbe + '33' }">
                            <span class="fs-4 me-2">{{ atmosphaere.jahreszeitEmoji }}</span>
                            <div>
                              <div class="small text-secondary">Jahreszeit</div>
                              <div class="fw-semibold">{{ atmosphaere.jahreszeitLabel }}</div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="htbah-atmosphaere-pill" :style="{ background: (atmosphaere.tageszeitFarbe || '#888') + '33' }">
                            <span class="fs-4 me-2">{{ atmosphaere.tageszeitEmoji }}</span>
                            <div>
                              <div class="small text-secondary">Tageszeit</div>
                              <div class="fw-semibold">{{ atmosphaere.tageszeitLabel }}</div>
                            </div>
                          </div>
                        </div>
                        <div class="col-12">
                          <div
                            class="htbah-atmosphaere-pill htbah-atmosphaere-pill--wetter"
                            :style="{ background: (atmosphaere.wetterAkzentFarbe || atmosphaere.jahreszeitFarbe || '#38bdf8') + '33' }">
                            <span class="fs-4 me-2 flex-shrink-0">{{ atmosphaere.niederschlagEmoji }}</span>
                            <div class="flex-grow-1 min-w-0">
                              <div class="small text-secondary">Wetter</div>
                              <div class="fw-semibold">{{ atmosphaere.temperatur }}</div>
                              <div class="small">{{ atmosphaere.bewoelkung }}</div>
                              <div class="small">{{ atmosphaere.niederschlagLabel }}</div>
                              <div class="small mt-2">
                                <span class="text-secondary">Wind:</span>
                                {{ atmosphaere.wind }}
                              </div>
                              <div class="small">
                                <span class="text-secondary">Windstärke:</span>
                                <span class="fw-medium">{{ atmosphaere.windStaerke }}</span>
                                <span v-if="atmosphaere.windBeaufort" class="text-muted ms-1">
                                  (<span class="fst-italic">{{ atmosphaere.windBeaufort }}</span>)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
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
