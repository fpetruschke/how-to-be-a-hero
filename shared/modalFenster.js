window.HTBAH_MODAL_FENSTER = window.HTBAH_MODAL_FENSTER || {
  minBreite: 320,
  minHoehe: 280,
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
  },
  erstelleBasisDaten() {
    return {
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
      if (this.istVollbild || this.breite === null || this.hoehe === null) {
        return;
      }
      const { viewportBreite, viewportHoehe } = this.ermittleViewportGroesse();
      this.positionX = Math.max(0, Math.round((viewportBreite - this.breite) / 2));
      this.positionY = Math.max(0, Math.round((viewportHoehe - this.hoehe) / 2));
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
    },
    vollbildUmschalten() {
      this.istVollbild = !this.istVollbild;
      if (!this.istVollbild) {
        this.$nextTick(() => {
          this.stelleSichtbaresFensterSicher();
          this.zentriereFenster();
        });
      }
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
    },
  },
};
