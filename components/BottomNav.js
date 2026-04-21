window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.BottomNav = {
  props: ['uiZustand'],
  data() {
    return {
      wuerfelModus: 'w10',
      anzahlW10: 1,
      ergebnisse: [],
      wuerfelModalTab: 'wuerfel',
      atmosphaereFormularOffen: false,
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
    istSpielleitung() {
      return this.rolle === 'spielleitung';
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
    jahreszeitenOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && Array.isArray(AZ.JAHRESZEITEN) ? AZ.JAHRESZEITEN : [];
    },
    tageszeitenOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && Array.isArray(AZ.TAGESZEITEN) ? AZ.TAGESZEITEN : [];
    },
    temperaturOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.temperaturOptionen === 'function' ? AZ.temperaturOptionen() : [];
    },
    bewoelkungOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.bewoelkungOptionen === 'function' ? AZ.bewoelkungOptionen() : [];
    },
    niederschlagOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.niederschlagOptionen === 'function' ? AZ.niederschlagOptionen() : [];
    },
    windstaerkeOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.windstaerkeOptionen === 'function' ? AZ.windstaerkeOptionen() : [];
    },
    windrichtungOptionen() {
      const AZ = window.HTBAH.AtmosphaereZufall;
      return AZ && typeof AZ.windrichtungOptionen === 'function' ? AZ.windrichtungOptionen() : [];
    },
    aktuelleWindstaerkeBft() {
      const wb = String(this.atmosphaere.windBeaufort || '');
      const m = wb.match(/([\d]+(?:[\-–][\d]+)?)/);
      if (m && m[1]) {
        return m[1].replace(/-/g, '–');
      }
      return this.windstaerkeOptionen[0] ? this.windstaerkeOptionen[0].bft : '';
    },
    aktuelleWindrichtung() {
      const wr = String(this.atmosphaere.windRichtung || '').trim();
      if (wr && this.windrichtungOptionen.includes(wr)) {
        return wr;
      }
      const m = String(this.atmosphaere.wind || '').match(/aus\s+([A-Z]{1,2})$/);
      const parsed = m && m[1] ? m[1] : '';
      if (parsed && this.windrichtungOptionen.includes(parsed)) {
        return parsed;
      }
      return this.windrichtungOptionen[0] || 'N';
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
  watch: {
    zeigeNav() {
      this.$nextTick(() => this.bindNavReserveObserver());
    },
  },
  mounted() {
    this._navReserveObserver = null;
    this.$nextTick(() => this.bindNavReserveObserver());
  },
  beforeUnmount() {
    this.unbindNavReserveObserver();
    document.documentElement.style.removeProperty('--htbah-bottom-nav-reserve');
  },
  methods: {
    bindNavReserveObserver() {
      this.unbindNavReserveObserver();
      const el = this.$refs.navbarFixedEl;
      if (!el) {
        this.syncBottomNavReserve();
        return;
      }
      this._navReserveObserver = new ResizeObserver(() => {
        this.syncBottomNavReserve();
      });
      this._navReserveObserver.observe(el);
      this.syncBottomNavReserve();
    },
    unbindNavReserveObserver() {
      if (this._navReserveObserver) {
        this._navReserveObserver.disconnect();
        this._navReserveObserver = null;
      }
    },
    syncBottomNavReserve() {
      const el = this.$refs.navbarFixedEl;
      const root = document.documentElement;
      if (!el) {
        root.style.setProperty('--htbah-bottom-nav-reserve', '0px');
        return;
      }
      const h = el.getBoundingClientRect().height;
      const px = Math.max(1, Math.ceil(h));
      root.style.setProperty('--htbah-bottom-nav-reserve', `${px}px`);
    },
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
    atmosphaereSetzeJahreszeit(jahreszeitId) {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ || !jahreszeitId) {
        return;
      }
      const j = AZ.jahreszeitMeta(jahreszeitId);
      Object.assign(this.atmosphaere, {
        jahreszeitId: j.id,
        jahreszeitLabel: j.label,
        jahreszeitEmoji: j.emoji,
        jahreszeitFarbe: j.farbe,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeTageszeit(tageszeitId) {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ || !tageszeitId) {
        return;
      }
      const t = AZ.tageszeitMeta(tageszeitId);
      Object.assign(this.atmosphaere, {
        tageszeitId: t.id,
        tageszeitLabel: t.label,
        tageszeitEmoji: t.emoji,
        tageszeitFarbe: t.farbe,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeTemperatur(temperatur) {
      if (!temperatur) {
        return;
      }
      this.atmosphaere.temperatur = temperatur;
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeBewoelkung(bewoelkung) {
      if (!bewoelkung) {
        return;
      }
      this.atmosphaere.bewoelkung = bewoelkung;
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeNiederschlag(niederschlagKey) {
      const AZ = window.HTBAH.AtmosphaereZufall;
      if (!AZ || !niederschlagKey) {
        return;
      }
      const meta = AZ.niederschlagMeta(niederschlagKey);
      Object.assign(this.atmosphaere, {
        niederschlagKey,
        niederschlagLabel: meta.label,
        niederschlagEmoji: meta.emoji,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereWindText(staerke, richtung) {
      return `${staerke.label}, aus ${richtung}`;
    },
    atmosphaereSetzeWindstaerke(bftBand) {
      if (!bftBand) {
        return;
      }
      const staerke = this.windstaerkeOptionen.find((s) => s.bft === bftBand);
      if (!staerke) {
        return;
      }
      const richtung = this.aktuelleWindrichtung;
      Object.assign(this.atmosphaere, {
        wind: this.atmosphaereWindText(staerke, richtung),
        windStaerke: staerke.kmh,
        windBeaufort: `Beaufort ${staerke.bft}`,
        windRichtung: richtung,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereSetzeWindrichtung(richtung) {
      if (!richtung) {
        return;
      }
      const staerke =
        this.windstaerkeOptionen.find((s) => s.bft === this.aktuelleWindstaerkeBft) || this.windstaerkeOptionen[0];
      if (!staerke) {
        return;
      }
      Object.assign(this.atmosphaere, {
        wind: this.atmosphaereWindText(staerke, richtung),
        windRichtung: richtung,
      });
      this.speichereAtmosphaere();
    },
    atmosphaereToggleFormular() {
      this.atmosphaereFormularOffen = !this.atmosphaereFormularOffen;
    },
    wuerfelModalOeffnen(tab) {
      const zielTab = tab === 'atmosphaere' || tab === 'wuerfel' ? tab : 'wuerfel';
      this.wuerfelModalTab = !this.istSpielleitung && zielTab === 'atmosphaere' ? 'wuerfel' : zielTab;
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
        ref="navbarFixedEl"
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
        v-if="zeigeNav && istSpielleitung"
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
              <ul v-if="istSpielleitung" class="nav nav-tabs mb-3" role="tablist">
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

                <div class="mb-3" v-if="wuerfelModus === 'w10'">
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
                <div class="mb-3" v-else>
                  <small>W100 wird immer genau einmal gewürfelt.</small>
                </div>
                <div class="mb-3">
                  <icon-text-button
                    type="button"
                    class="btn btn-primary w-100 htbah-wuerfeln-btn"
                    icon="casino"
                    @click="wuerfeln">
                    Würfeln
                  </icon-text-button>
                </div>

                <div class="card p-3 shadow-sm mb-2">
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

              <div v-if="istSpielleitung" v-show="wuerfelModalTab === 'atmosphaere'" class="htbah-atmosphaere-modal">
                <div class="d-flex align-items-stretch gap-2 mb-3">
                  <div class="btn-group">
                    <button type="button" class="btn btn-primary" @click="atmosphaereAllesWuerfeln">
                      Alles würfeln
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary dropdown-toggle dropdown-toggle-split"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label="Würfeloption wählen">
                      <span class="visually-hidden">Weitere Optionen</span>
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereAllesWuerfeln">
                          Alles würfeln
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereNurJahreszeit">
                          Nur Jahreszeit
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereNurWetter">
                          Nur Wetter
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item" @click="atmosphaereNurTageszeit">
                          Nur Tageszeit
                        </button>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-secondary ms-auto"
                    @click="atmosphaereToggleFormular">
                    {{ atmosphaereFormularOffen ? 'Ausblenden' : 'Selbst bestimmen' }}
                  </button>
                </div>
                <div class="card border-0 shadow-sm mb-3" v-if="atmosphaereHatWerte" v-show="atmosphaereFormularOffen">
                  <div class="card-body">
                    <h6 class="mb-3 fw-bold">Werte bearbeiten</h6>
                    <div class="row g-2">
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-jahreszeit">Jahreszeit</label>
                        <select
                          id="atmo-jahreszeit"
                          class="form-select"
                          :value="atmosphaere.jahreszeitId || ''"
                          @change="atmosphaereSetzeJahreszeit($event.target.value)">
                          <option v-for="o in jahreszeitenOptionen" :key="'jz-' + o.id" :value="o.id">
                            {{ o.emoji }} {{ o.label }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-tageszeit">Tageszeit</label>
                        <select
                          id="atmo-tageszeit"
                          class="form-select"
                          :value="atmosphaere.tageszeitId || ''"
                          @change="atmosphaereSetzeTageszeit($event.target.value)">
                          <option v-for="o in tageszeitenOptionen" :key="'tz-' + o.id" :value="o.id">
                            {{ o.emoji }} {{ o.label }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-temperatur">Temperatur</label>
                        <select
                          id="atmo-temperatur"
                          class="form-select"
                          :value="atmosphaere.temperatur || ''"
                          @change="atmosphaereSetzeTemperatur($event.target.value)">
                          <option v-for="o in temperaturOptionen" :key="'temp-' + o" :value="o">
                            {{ o }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-bewoelkung">Bewölkung</label>
                        <select
                          id="atmo-bewoelkung"
                          class="form-select"
                          :value="atmosphaere.bewoelkung || ''"
                          @change="atmosphaereSetzeBewoelkung($event.target.value)">
                          <option v-for="o in bewoelkungOptionen" :key="'bew-' + o" :value="o">
                            {{ o }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-niederschlag">Niederschlag</label>
                        <select
                          id="atmo-niederschlag"
                          class="form-select"
                          :value="atmosphaere.niederschlagKey || ''"
                          @change="atmosphaereSetzeNiederschlag($event.target.value)">
                          <option v-for="o in niederschlagOptionen" :key="'nied-' + o.key" :value="o.key">
                            {{ o.emoji }} {{ o.label }}
                          </option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label mb-1 small text-secondary" for="atmo-windrichtung">Windrichtung</label>
                        <select
                          id="atmo-windrichtung"
                          class="form-select"
                          :value="aktuelleWindrichtung"
                          @change="atmosphaereSetzeWindrichtung($event.target.value)">
                          <option v-for="o in windrichtungOptionen" :key="'wdir-' + o" :value="o">
                            {{ o }}
                          </option>
                        </select>
                      </div>
                      <div class="col-12">
                        <label class="form-label mb-1 small text-secondary" for="atmo-windstaerke">Windstärke</label>
                        <select
                          id="atmo-windstaerke"
                          class="form-select"
                          :value="aktuelleWindstaerkeBft"
                          @change="atmosphaereSetzeWindstaerke($event.target.value)">
                          <option v-for="o in windstaerkeOptionen" :key="'wst-' + o.bft" :value="o.bft">
                            Beaufort {{ o.bft }} ({{ o.kmh }}) - {{ o.label }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!atmosphaereHatWerte" class="text-secondary small">
                  Noch keine Werte — tippe auf „Alles würfeln“.
                </div>
                <div v-else class="row g-2">
                  <div class="col-md-6">
                    <div class="htbah-atmosphaere-pill shadow-sm" :style="{ background: atmosphaere.jahreszeitFarbe + '33' }">
                      <span class="fs-4 me-2">{{ atmosphaere.jahreszeitEmoji }}</span>
                      <div>
                        <div class="small text-secondary">Jahreszeit</div>
                        <div class="fw-semibold">{{ atmosphaere.jahreszeitLabel }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="htbah-atmosphaere-pill shadow-sm" :style="{ background: (atmosphaere.tageszeitFarbe || '#888') + '33' }">
                      <span class="fs-4 me-2">{{ atmosphaere.tageszeitEmoji }}</span>
                      <div>
                        <div class="small text-secondary">Tageszeit</div>
                        <div class="fw-semibold">{{ atmosphaere.tageszeitLabel }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div
                      class="htbah-atmosphaere-pill htbah-atmosphaere-pill--wetter shadow-sm"
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
