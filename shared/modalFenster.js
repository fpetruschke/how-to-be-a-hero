const HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE =
  typeof Vue !== 'undefined' && Vue.reactive ? Vue.reactive([]) : [];

window.HTBAH_MODAL_FENSTER = window.HTBAH_MODAL_FENSTER || {
  minBreite: 320,
  minHoehe: 280,
  minimiertIcon: 'minimize',
  minimiertLabel: 'Minimieren',
  wiederherstellenLabel: 'Fenster wiederherstellen',
  dock: {
    get eintraege() {
      return HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE;
    },
    registriere(eintrag) {
      if (!eintrag || !eintrag.id) {
        return;
      }
      const idx = HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE.findIndex((e) => e.id === eintrag.id);
      const payload = {
        id: eintrag.id,
        titel: eintrag.titel || 'Fenster',
        emoji: eintrag.emoji || '',
        wiederherstellen:
          typeof eintrag.wiederherstellen === 'function' ? eintrag.wiederherstellen : () => {},
        schliessen: typeof eintrag.schliessen === 'function' ? eintrag.schliessen : () => {},
      };
      if (idx >= 0) {
        HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE[idx] = payload;
        return;
      }
      HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE.push(payload);
    },
    entferne(id) {
      if (!id) {
        return;
      }
      const idx = HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE.findIndex((e) => e.id === id);
      if (idx >= 0) {
        HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE.splice(idx, 1);
      }
    },
    verschiebe(vonIndex, nachIndex) {
      const arr = HTBAH_MODAL_MINIMIZE_DOCK_EINTRAGE;
      if (
        vonIndex < 0 ||
        nachIndex < 0 ||
        vonIndex >= arr.length ||
        nachIndex >= arr.length ||
        vonIndex === nachIndex
      ) {
        return;
      }
      const [eintrag] = arr.splice(vonIndex, 1);
      arr.splice(nachIndex, 0, eintrag);
    },
  },
  utils: {
    ermittleViewportGroesse() {
      const viewportBreite =
        Math.max(document.documentElement ? document.documentElement.clientWidth : 0, window.innerWidth) ||
        0;
      const viewportHoehe =
        Math.max(
          document.documentElement ? document.documentElement.clientHeight : 0,
          window.innerHeight,
        ) || 0;
      return { viewportBreite, viewportHoehe };
    },
    begrenzeGroesse(breite, hoehe, minBreite = 320, minHoehe = 280) {
      const { viewportBreite, viewportHoehe } = window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
      const minW = Math.min(minBreite, viewportBreite);
      const minH = Math.min(minHoehe, viewportHoehe);
      return {
        breite: Math.min(Math.max(Math.round(breite), minW), viewportBreite),
        hoehe: Math.min(Math.max(Math.round(hoehe), minH), viewportHoehe),
      };
    },
    begrenzePosition(x, y, breite, hoehe) {
      const { viewportBreite, viewportHoehe } = window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
      const maxX = Math.max(0, viewportBreite - breite);
      const maxY = Math.max(0, viewportHoehe - hoehe);
      return {
        x: Math.min(Math.max(0, Math.round(x)), maxX),
        y: Math.min(Math.max(0, Math.round(y)), maxY),
      };
    },
    zentriereFensterObjekt(fenster) {
      if (!fenster || fenster.istVollbild || fenster.breite == null || fenster.hoehe == null) {
        return;
      }
      const { viewportBreite, viewportHoehe } = window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
      fenster.positionX = Math.max(0, Math.round((viewportBreite - fenster.breite) / 2));
      fenster.positionY = Math.max(0, Math.round((viewportHoehe - fenster.hoehe) / 2));
    },
  },
  erstelleBasisDaten() {
    return {
      minimiert: false,
      _dockId: null,
      istVollbild: false,
      positionX: null,
      positionY: null,
      breite: null,
      hoehe: null,
      ziehenAktiv: false,
      ziehOffsetX: 0,
      ziehOffsetY: 0,
      resizeAktiv: false,
      resizeStartX: 0,
      resizeStartY: 0,
      resizeStartBreite: 0,
      resizeStartHoehe: 0,
    };
  },
  berechneFensterStil() {
    if (this.istVollbild || this.positionX === null || this.positionY === null) {
      return {};
    }
    const stil = {
      left: `${this.positionX}px`,
      top: `${this.positionY}px`,
    };
    if (this.breite !== null) {
      stil.width = `${this.breite}px`;
    }
    if (this.hoehe !== null) {
      stil.height = `${this.hoehe}px`;
    }
    return stil;
  },
  methoden: {
    ermittleViewportGroesse() {
      return window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
    },
    begrenzeFensterGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(
        breite,
        hoehe,
        window.HTBAH_MODAL_FENSTER.minBreite,
        window.HTBAH_MODAL_FENSTER.minHoehe,
      );
    },
    zentriereFenster() {
      window.HTBAH_MODAL_FENSTER.utils.zentriereFensterObjekt(this);
    },
    initialisierePosition() {
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      if (this.breite === null || this.hoehe === null) {
        const groesse = this.begrenzeFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
        this.breite = groesse.breite;
        this.hoehe = groesse.hoehe;
      }
      if (this.positionX !== null || this.positionY !== null) {
        this.stelleSichtbaresFensterSicher();
        return;
      }
      this.zentriereFenster();
    },
    starteZiehen(event) {
      if (this.istVollbild || event.target.closest('button, a')) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      const rechteck = fenster.getBoundingClientRect();
      this.ziehenAktiv = true;
      this.ziehOffsetX = event.clientX - rechteck.left;
      this.ziehOffsetY = event.clientY - rechteck.top;
      window.addEventListener('pointermove', this.beimZiehen);
      window.addEventListener('pointerup', this.beendeZiehen);
      window.addEventListener('pointercancel', this.beendeZiehen);
      event.preventDefault();
    },
    beimZiehen(event) {
      if (!this.ziehenAktiv || this.istVollbild) {
        return;
      }
      if (this.breite === null || this.hoehe === null) {
        return;
      }
      const { viewportBreite, viewportHoehe } = this.ermittleViewportGroesse();
      const maxX = Math.max(0, viewportBreite - this.breite);
      const maxY = Math.max(0, viewportHoehe - this.hoehe);
      const neueXPosition = event.clientX - this.ziehOffsetX;
      const neueYPosition = event.clientY - this.ziehOffsetY;
      this.positionX = Math.min(Math.max(0, neueXPosition), maxX);
      this.positionY = Math.min(Math.max(0, neueYPosition), maxY);
    },
    beendeZiehen() {
      this.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.beimZiehen);
      window.removeEventListener('pointerup', this.beendeZiehen);
      window.removeEventListener('pointercancel', this.beendeZiehen);
      window.HTBAH_MODAL_FENSTER.methoden.persistiereModalWennGebundenDebounced.call(this);
    },
    starteResize(event) {
      if (this.istVollbild) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      this.resizeAktiv = true;
      this.resizeStartX = event.clientX;
      this.resizeStartY = event.clientY;
      this.resizeStartBreite = this.breite !== null ? this.breite : fenster.offsetWidth;
      this.resizeStartHoehe = this.hoehe !== null ? this.hoehe : fenster.offsetHeight;
      window.addEventListener('pointermove', this.beimResize);
      window.addEventListener('pointerup', this.beendeResize);
      window.addEventListener('pointercancel', this.beendeResize);
      event.preventDefault();
    },
    beimResize(event) {
      if (!this.resizeAktiv || this.istVollbild) {
        return;
      }
      const neueBreite = this.resizeStartBreite + (event.clientX - this.resizeStartX);
      const neueHoehe = this.resizeStartHoehe + (event.clientY - this.resizeStartY);
      const groesse = this.begrenzeFensterGroesse(neueBreite, neueHoehe);
      this.breite = groesse.breite;
      this.hoehe = groesse.hoehe;
      this.stelleSichtbaresFensterSicher();
    },
    beendeResize() {
      this.resizeAktiv = false;
      window.removeEventListener('pointermove', this.beimResize);
      window.removeEventListener('pointerup', this.beendeResize);
      window.removeEventListener('pointercancel', this.beendeResize);
      window.HTBAH_MODAL_FENSTER.methoden.persistiereModalWennGebundenDebounced.call(this);
    },
    vollbildUmschalten() {
      const M = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.methoden;
      const warVollbild = this.istVollbild;
      this.istVollbild = !this.istVollbild;
      if (!this.istVollbild && warVollbild) {
        this.$nextTick(() => {
          if (M) {
            M.bereiteNachVollbildBeenden.call(this);
          }
        });
      } else if (M) {
        M.persistiereModalWennGebunden.call(this);
      }
    },
    bereiteNachVollbildBeenden() {
      if (this.istVollbild) {
        return;
      }
      if (this.breite == null || this.hoehe == null) {
        const fenster = this.$refs && this.$refs.fensterElement;
        if (fenster) {
          const groesse = this.begrenzeFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
          this.breite = groesse.breite;
          this.hoehe = groesse.hoehe;
        }
      }
      if (this.breite != null && this.hoehe != null) {
        const groesse = this.begrenzeFensterGroesse(this.breite, this.hoehe);
        this.breite = groesse.breite;
        this.hoehe = groesse.hoehe;
        this.zentriereFenster();
        const pos = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(
          this.positionX || 0,
          this.positionY || 0,
          this.breite,
          this.hoehe,
        );
        this.positionX = pos.x;
        this.positionY = pos.y;
      }
      this.persistiereModalWennGebunden();
    },
    bereiteFensterNachVollbildBeenden(fenster, vueKontext, refKey, begrenzeGroesseFn) {
      const MF = window.HTBAH_MODAL_FENSTER;
      if (!fenster || fenster.istVollbild || !MF) {
        return;
      }
      const begrenze =
        typeof begrenzeGroesseFn === 'function'
          ? begrenzeGroesseFn
          : (breite, hoehe) => MF.utils.begrenzeGroesse(breite, hoehe);
      const el =
        vueKontext && vueKontext.$refs
          ? vueKontext.$refs[refKey || 'fensterElement']
          : null;
      if (fenster.breite == null || fenster.hoehe == null) {
        if (el) {
          const groesse = begrenze(el.offsetWidth, el.offsetHeight);
          fenster.breite = groesse.breite;
          fenster.hoehe = groesse.hoehe;
        }
      }
      if (fenster.breite == null || fenster.hoehe == null) {
        return;
      }
      const groesse = begrenze(fenster.breite, fenster.hoehe);
      fenster.breite = groesse.breite;
      fenster.hoehe = groesse.hoehe;
      MF.utils.zentriereFensterObjekt(fenster);
      const pos = MF.utils.begrenzePosition(
        fenster.positionX || 0,
        fenster.positionY || 0,
        fenster.breite,
        fenster.hoehe,
      );
      fenster.positionX = pos.x;
      fenster.positionY = pos.y;
    },
    stelleSichtbaresFensterSicher() {
      if (this.istVollbild) {
        return;
      }
      if (this.breite === null || this.hoehe === null) {
        return;
      }
      const groesse = this.begrenzeFensterGroesse(this.breite, this.hoehe);
      this.breite = groesse.breite;
      this.hoehe = groesse.hoehe;
      if (this.positionX === null || this.positionY === null) {
        this.zentriereFenster();
        return;
      }
      const { viewportBreite, viewportHoehe } = this.ermittleViewportGroesse();
      const maxX = Math.max(0, viewportBreite - this.breite);
      const maxY = Math.max(0, viewportHoehe - this.hoehe);
      this.positionX = Math.min(Math.max(0, this.positionX), maxX);
      this.positionY = Math.min(Math.max(0, this.positionY), maxY);
    },
    beiFensterGroesseGeaendert() {
      this.$nextTick(this.stelleSichtbaresFensterSicher);
      window.HTBAH_MODAL_FENSTER.methoden.persistiereModalWennGebundenDebounced.call(this);
    },
    bindModalSpeicher(modalId, extrasLieferant) {
      this._htbahModalSpeicherId = modalId || null;
      this._htbahModalSpeicherExtras =
        typeof extrasLieferant === 'function' ? extrasLieferant : extrasLieferant || null;
    },
    entferneModalSpeicher() {
      const id = this._htbahModalSpeicherId;
      this._htbahModalSpeicherId = null;
      this._htbahModalSpeicherExtras = null;
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (id && S) {
        S.entferne(id);
      }
    },
    modalSpeicherExtras() {
      return window.HTBAH_MODAL_FENSTER.methoden.leseModalSpeicherExtras.call(this);
    },
    leseModalSpeicherExtras() {
      if (typeof this._htbahModalSpeicherExtras === 'function') {
        return this._htbahModalSpeicherExtras() || {};
      }
      return this._htbahModalSpeicherExtras || {};
    },
    persistiereModalWennGebunden() {
      const id = this._htbahModalSpeicherId;
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (id && S) {
        S.persistiere(id, this, window.HTBAH_MODAL_FENSTER.methoden.leseModalSpeicherExtras.call(this));
      }
    },
    persistiereModalWennGebundenDebounced() {
      const id = this._htbahModalSpeicherId;
      const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
      if (id && S) {
        S.persistiereDebounced(
          id,
          this,
          window.HTBAH_MODAL_FENSTER.methoden.leseModalSpeicherExtras.call(this),
        );
      }
    },
    minimieren(meta) {
      const MF = window.HTBAH_MODAL_FENSTER;
      if (!meta || !meta.id) {
        return;
      }
      if (typeof this.beendeZiehen === 'function') {
        this.beendeZiehen();
      }
      if (typeof this.beendeResize === 'function') {
        this.beendeResize();
      }
      if (this.istVollbild) {
        this.istVollbild = false;
      }
      this.minimiert = true;
      this._dockId = meta.id;
      const fenster = this;
      const schliessen =
        typeof meta.onSchliessen === 'function'
          ? meta.onSchliessen
          : () => {
              MF.methoden.bereinigeMinimiertZustand.call(fenster, meta.id);
              MF.methoden.entferneModalSpeicher.call(fenster);
            };
      MF.dock.registriere({
        id: meta.id,
        titel: meta.titel || 'Fenster',
        emoji: meta.emoji || '',
        wiederherstellen() {
          MF.methoden.wiederherstellen.call(fenster);
          MF.methoden.persistiereModalWennGebunden.call(fenster);
          if (typeof meta.onWiederherstellen === 'function') {
            meta.onWiederherstellen();
          }
        },
        schliessen,
      });
      MF.methoden.persistiereModalWennGebunden.call(this);
    },
    wiederherstellen() {
      if (!this.minimiert) {
        return;
      }
      this.minimiert = false;
      const id = this._dockId;
      this._dockId = null;
      if (id) {
        window.HTBAH_MODAL_FENSTER.dock.entferne(id);
      }
      window.HTBAH_MODAL_FENSTER.methoden.persistiereModalWennGebunden.call(this);
    },
    bereinigeMinimiertZustand(dockId) {
      const id = dockId || this._dockId;
      if (id) {
        window.HTBAH_MODAL_FENSTER.dock.entferne(id);
      }
      this.minimiert = false;
      this._dockId = null;
    },
  },
};
