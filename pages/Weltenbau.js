window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

const WELTENBAU_GENERATOREN = [
  {
    id: 'realm',
    titel: '🗺️ Regionenkarte',
    startUrl: 'https://watabou.github.io/perilous-shores',
    sourceUrl: 'https://watabou.github.io/perilous-shores',
  },
  {
    id: 'city',
    titel: '🏙️ Stadt',
    startUrl: 'https://watabou.github.io/city-generator',
    sourceUrl: 'https://watabou.github.io/city-generator',
  },
  {
    id: 'village',
    titel: '🏘️ Dorf',
    startUrl: 'https://watabou.github.io/village-generator',
    sourceUrl: 'https://watabou.github.io/village-generator',
  },
  {
    id: 'cave_glade',
    titel: '🪨 Höhle/Lichtung',
    startUrl: 'https://watabou.github.io/cave-generator',
    sourceUrl: 'https://watabou.github.io/cave-generator',
  },
  {
    id: 'dungeon',
    titel: '🧱 Dungeon',
    startUrl: 'https://watabou.github.io/one-page-dungeon',
    sourceUrl: 'https://watabou.github.io/one-page-dungeon',
  },
  {
    id: 'dwelling',
    titel: '🏠 Wohnhaus',
    startUrl: 'https://watabou.github.io/dwellings',
    sourceUrl: 'https://watabou.github.io/dwellings',
  },
  {
    id: 'pub',
    titel: '🍺 Kneipe',
    startUrl: 'https://html-classic.itch.zone/html/17194867/bin/index.html',
    sourceUrl: 'https://html-classic.itch.zone/html/17194867/bin/index.html',
    nurExternerTab: true,
  },
  {
    id: 'neighbourhood',
    titel: '🏡 Nachbarschaft',
    startUrl: 'https://html-classic.itch.zone/html/11441280/bin/index.html',
    sourceUrl: 'https://html-classic.itch.zone/html/11441280/bin/index.html',
    nurExternerTab: true,
  },
  {
    id: 'sailingboats',
    titel: '⛵ Segelboote',
    startUrl: 'https://html-classic.itch.zone/html/12857986/bin/index.html',
    sourceUrl: 'https://html-classic.itch.zone/html/12857986/bin/index.html',
  },
  {
    id: 'lighthouse',
    titel: '🌊 Leuchtturm',
    startUrl: 'https://html-classic.itch.zone/html/7028426/bin/index.html',
    sourceUrl: 'https://html-classic.itch.zone/html/7028426/bin/index.html',
  },
  {
    id: 'rune_alphabet',
    titel: 'ᚱ Runen-Alphabet',
    startUrl: 'https://html-classic.itch.zone/html/7102972/bin/index.html?v=1732313668',
    sourceUrl: 'https://html-classic.itch.zone/html/7102972/bin/index.html?v=1732313668',
    nurExternerTab: true,
  },
];

function istHttpUrl(text) {
  if (typeof text !== 'string') {
    return false;
  }
  return /^https?:\/\//i.test(text.trim());
}

function normalisiereGeneratorUrlMap(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([id, url]) => {
    if (typeof id !== 'string' || !id || typeof url !== 'string') {
      return;
    }
    const t = url.trim();
    if (istHttpUrl(t)) {
      map[id] = t;
    }
  });
  return map;
}

function normalisiereGeneratorZeitstempelMap(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([id, zeitstempel]) => {
    if (typeof id !== 'string' || !id || typeof zeitstempel !== 'string') {
      return;
    }
    const t = zeitstempel.trim();
    if (!t || Number.isNaN(Date.parse(t))) {
      return;
    }
    map[id] = t;
  });
  return map;
}

function formatDatumZeit(value) {
  if (!value) {
    return '';
  }
  const datum = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(datum.getTime())) {
    return '';
  }
  const pad2 = (n) => String(n).padStart(2, '0');
  const tag = pad2(datum.getDate());
  const monat = pad2(datum.getMonth() + 1);
  const jahr = datum.getFullYear();
  const stunde = pad2(datum.getHours());
  const minute = pad2(datum.getMinutes());
  const sekunde = pad2(datum.getSeconds());
  return `${tag}.${monat}.${jahr} - ${stunde}:${minute}:${sekunde}`;
}

/** Rohdatei-Limit vor dem Laden (Browser- & Speicher-Schutz). */
const WELTENBAU_MAX_ROH_DATEI_BYTES = 40 * 1024 * 1024;

function istBildDatei(file) {
  if (!file) {
    return false;
  }
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  const n = (file.name || '').toLowerCase();
  return /\.(png|apng|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(n);
}

function formatBytes(n) {
  if (n >= 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MiB`;
  }
  if (n >= 1024) {
    return `${Math.round(n / 1024)} KiB`;
  }
  return `${n} B`;
}

window.HTBAH_SEITEN.Weltenbau = {
  components: {
    WeltenbauBildImportModal: window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal,
    WeltenbauUebersichtModal: window.HTBAH_KOMPONENTEN.WeltenbauUebersichtModal,
  },
  data() {
    const zustandRoh = window.HTBAH.ladeWeltenbauZustand();
    const zustand = {
      version: 4,
      eintraege: Array.isArray(zustandRoh && zustandRoh.eintraege) ? zustandRoh.eintraege : [],
      generatorUrls: normalisiereGeneratorUrlMap(zustandRoh && zustandRoh.generatorUrls),
      generatorAufrufe: normalisiereGeneratorZeitstempelMap(zustandRoh && zustandRoh.generatorAufrufe),
      mapLayouts: zustandRoh && zustandRoh.mapLayouts && typeof zustandRoh.mapLayouts === 'object' ? zustandRoh.mapLayouts : {},
      mapHintergruende:
        zustandRoh && zustandRoh.mapHintergruende && typeof zustandRoh.mapHintergruende === 'object'
          ? zustandRoh.mapHintergruende
          : {},
      mapEinstellungen:
        zustandRoh && zustandRoh.mapEinstellungen && typeof zustandRoh.mapEinstellungen === 'object'
          ? zustandRoh.mapEinstellungen
          : {},
    };
    return {
      generatoren: WELTENBAU_GENERATOREN,
      zustand,
      weltenbauMapModalOffen: false,
      ausgewaehlteGruppeId:
        (window.HTBAH.ladeSpielleiterZustand().aktiveGruppeId ||
          ((window.HTBAH.ladeSpielleiterZustand().gruppen || [])[0] || {}).id ||
          ''),
      importWarteschlange: [],
      zeigeImportHinweis: false,
      generatorModal: {
        offen: false,
        generatorId: '',
        titel: '',
        sourceUrl: '',
        iframeUrl: '',
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
      },
    };
  },
  computed: {
    spielleiterGruppen() {
      const sl = window.HTBAH.ladeSpielleiterZustand();
      return Array.isArray(sl && sl.gruppen) ? sl.gruppen : [];
    },
    gruppenAuswahlDeaktiviert() {
      return this.spielleiterGruppen.length <= 1;
    },
    geschaetzteSpeicherGroesseKb() {
      try {
        let n = 0;
        for (const e of this.zustand.eintraege) {
          if (e && typeof e.dataUrl === 'string') {
            n += e.dataUrl.length;
          }
        }
        n += Math.max(0, (this.zustand.eintraege.length + 1) * 80);
        return Math.max(0, Math.round(n / 1024));
      } catch {
        return 0;
      }
    },
    maxRohDateiHuman() {
      return formatBytes(WELTENBAU_MAX_ROH_DATEI_BYTES);
    },
    generatorModalStil() {
      if (
        this.generatorModal.istVollbild ||
        this.generatorModal.positionX === null ||
        this.generatorModal.positionY === null
      ) {
        return {};
      }
      const stil = {
        left: `${this.generatorModal.positionX}px`,
        top: `${this.generatorModal.positionY}px`,
      };
      if (this.generatorModal.breite !== null) {
        stil.width = `${this.generatorModal.breite}px`;
      }
      if (this.generatorModal.hoehe !== null) {
        stil.height = `${this.generatorModal.hoehe}px`;
      }
      return stil;
    },
    generatorVollbildIcon() {
      return this.generatorModal.istVollbild ? 'close_fullscreen' : 'open_in_full';
    },
    generatorVollbildLabel() {
      return this.generatorModal.istVollbild ? 'Vollbild beenden' : 'Vollbild';
    },
  },
  methods: {
    onWeltenbauMapModalSchliessen() {
      this.weltenbauMapModalOffen = false;
    },
    persist() {
      const aktuell = window.HTBAH.ladeWeltenbauZustand();
      window.HTBAH.speichereWeltenbauZustand({
        ...aktuell,
        ...this.zustand,
        mapLayouts:
          this.zustand && this.zustand.mapLayouts && typeof this.zustand.mapLayouts === 'object'
            ? this.zustand.mapLayouts
            : aktuell.mapLayouts || {},
        mapHintergruende:
          this.zustand && this.zustand.mapHintergruende && typeof this.zustand.mapHintergruende === 'object'
            ? this.zustand.mapHintergruende
            : aktuell.mapHintergruende || {},
        mapEinstellungen:
          this.zustand && this.zustand.mapEinstellungen && typeof this.zustand.mapEinstellungen === 'object'
            ? this.zustand.mapEinstellungen
            : aktuell.mapEinstellungen || {},
      });
    },
    zeigeStatus(text, typ = 'success') {
      window.HTBAH.ui.notify({ text, typ, dauerMs: 7200 });
    },
    importHinweisUmschalten() {
      this.zeigeImportHinweis = !this.zeigeImportHinweis;
    },
    persistGeneratorUrl(generatorId, url) {
      if (typeof generatorId !== 'string' || !generatorId || !istHttpUrl(url)) {
        return;
      }
      const neu = normalisiereGeneratorUrlMap({
        ...this.zustand.generatorUrls,
        [generatorId]: url.trim(),
      });
      this.zustand = {
        ...this.zustand,
        version: 4,
        generatorUrls: neu,
      };
      this.persist();
    },
    persistGeneratorAufruf(generatorId, zeitpunkt) {
      if (typeof generatorId !== 'string' || !generatorId) {
        return;
      }
      const isoZeit = zeitpunkt instanceof Date ? zeitpunkt.toISOString() : new Date().toISOString();
      const neu = normalisiereGeneratorZeitstempelMap({
        ...this.zustand.generatorAufrufe,
        [generatorId]: isoZeit,
      });
      this.zustand = {
        ...this.zustand,
        version: 4,
        generatorAufrufe: neu,
      };
      this.persist();
    },
    formatGeneratorAufruf(zeitstempel) {
      return formatDatumZeit(zeitstempel);
    },
    gespeicherteGeneratorUrl(generator) {
      if (!generator || typeof generator.id !== 'string') {
        return '';
      }
      const gespeicherte = this.zustand.generatorUrls && this.zustand.generatorUrls[generator.id];
      if (istHttpUrl(gespeicherte)) {
        return gespeicherte.trim();
      }
      return generator.startUrl;
    },
    onWeltenbauGeneratorKarteKlick(generator) {
      if (!generator) {
        return;
      }
      if (generator.nurExternerTab) {
        this.persistGeneratorAufruf(generator.id, new Date());
        return;
      }
      this.oeffneGeneratorModal(generator);
    },
    oeffneGeneratorModal(generator) {
      if (!generator || !generator.id) {
        return;
      }
      if (generator.nurExternerTab) {
        return;
      }
      const startUrl = this.gespeicherteGeneratorUrl(generator);
      this.generatorModal.offen = true;
      this.generatorModal.generatorId = generator.id;
      this.generatorModal.titel = generator.titel;
      this.generatorModal.sourceUrl = generator.sourceUrl;
      this.generatorModal.iframeUrl = startUrl;
      this.generatorModal.istVollbild = false;
      this.beendeGeneratorZiehen();
      this.beendeGeneratorResize();
      this.$nextTick(() => this.initialisiereGeneratorFenster());
      this.persistGeneratorUrl(generator.id, startUrl);
      this.persistGeneratorAufruf(generator.id, new Date());
    },
    schliesseGeneratorModal() {
      this.beendeGeneratorZiehen();
      this.beendeGeneratorResize();
      this.generatorModal.offen = false;
      this.generatorModal.istVollbild = false;
    },
    generatorNeuLaden() {
      if (!this.generatorModal.offen || !istHttpUrl(this.generatorModal.iframeUrl)) {
        return;
      }
      const frame = this.$refs.generatorIframe;
      if (frame) {
        frame.src = this.generatorModal.iframeUrl;
      }
    },
    generatorInNeuemTab() {
      if (!istHttpUrl(this.generatorModal.iframeUrl)) {
        return;
      }
      window.open(this.generatorModal.iframeUrl, '_blank', 'noopener,noreferrer');
    },
    onGeneratorIframeLoad() {
      const frame = this.$refs.generatorIframe;
      if (!frame || !this.generatorModal.generatorId) {
        return;
      }
      let aktuelleUrl = typeof frame.src === 'string' ? frame.src : this.generatorModal.iframeUrl;
      try {
        const href = frame.contentWindow && frame.contentWindow.location && frame.contentWindow.location.href;
        if (istHttpUrl(href)) {
          aktuelleUrl = href;
        }
      } catch {
        // Cross-Origin: dann bleibt nur die (ggf. aufgelöste) iframe-src als best effort.
      }
      if (istHttpUrl(aktuelleUrl)) {
        this.generatorModal.iframeUrl = aktuelleUrl;
        this.persistGeneratorUrl(this.generatorModal.generatorId, aktuelleUrl);
      }
    },
    onGeneratorUrlEingabeBlur(ev) {
      const text = ev && ev.target ? ev.target.value : '';
      if (!istHttpUrl(text)) {
        return;
      }
      const url = text.trim();
      this.generatorModal.iframeUrl = url;
      this.persistGeneratorUrl(this.generatorModal.generatorId, url);
      this.$nextTick(() => this.generatorNeuLaden());
    },
    ermittleViewportGroesse() {
      const viewportBreite =
        Math.max(document.documentElement ? document.documentElement.clientWidth : 0, window.innerWidth) ||
        0;
      const viewportHoehe =
        Math.max(document.documentElement ? document.documentElement.clientHeight : 0, window.innerHeight) || 0;
      return { viewportBreite, viewportHoehe };
    },
    begrenzeGeneratorFensterGroesse(breite, hoehe) {
      const { viewportBreite, viewportHoehe } = this.ermittleViewportGroesse();
      const minBreite = Math.min(320, viewportBreite);
      const minHoehe = Math.min(260, viewportHoehe);
      return {
        breite: Math.min(Math.max(Math.round(breite), minBreite), viewportBreite),
        hoehe: Math.min(Math.max(Math.round(hoehe), minHoehe), viewportHoehe),
      };
    },
    zentriereGeneratorFenster() {
      if (
        this.generatorModal.istVollbild ||
        this.generatorModal.breite === null ||
        this.generatorModal.hoehe === null
      ) {
        return;
      }
      const { viewportBreite, viewportHoehe } = this.ermittleViewportGroesse();
      this.generatorModal.positionX = Math.max(0, Math.round((viewportBreite - this.generatorModal.breite) / 2));
      this.generatorModal.positionY = Math.max(0, Math.round((viewportHoehe - this.generatorModal.hoehe) / 2));
    },
    initialisiereGeneratorFenster() {
      if (!this.generatorModal.offen) {
        return;
      }
      const fenster = this.$refs.generatorFenster;
      if (!fenster) {
        return;
      }
      if (this.generatorModal.breite === null || this.generatorModal.hoehe === null) {
        const groesse = this.begrenzeGeneratorFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
        this.generatorModal.breite = groesse.breite;
        this.generatorModal.hoehe = groesse.hoehe;
      }
      if (this.generatorModal.positionX === null || this.generatorModal.positionY === null) {
        this.zentriereGeneratorFenster();
        return;
      }
      this.stelleSichtbaresGeneratorFensterSicher();
    },
    starteGeneratorZiehen(event) {
      if (this.generatorModal.istVollbild || event.target.closest('button, a, input')) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.generatorFenster;
      if (!fenster) {
        return;
      }
      const rechteck = fenster.getBoundingClientRect();
      this.generatorModal.ziehenAktiv = true;
      this.generatorModal.ziehOffsetX = event.clientX - rechteck.left;
      this.generatorModal.ziehOffsetY = event.clientY - rechteck.top;
      window.addEventListener('pointermove', this.beimGeneratorZiehen);
      window.addEventListener('pointerup', this.beendeGeneratorZiehen);
      window.addEventListener('pointercancel', this.beendeGeneratorZiehen);
      event.preventDefault();
    },
    beimGeneratorZiehen(event) {
      if (!this.generatorModal.ziehenAktiv || this.generatorModal.istVollbild) {
        return;
      }
      const fenster = this.$refs.generatorFenster;
      if (!fenster) {
        return;
      }
      const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
      const neueXPosition = event.clientX - this.generatorModal.ziehOffsetX;
      const neueYPosition = event.clientY - this.generatorModal.ziehOffsetY;
      this.generatorModal.positionX = Math.min(Math.max(0, neueXPosition), maxX);
      this.generatorModal.positionY = Math.min(Math.max(0, neueYPosition), maxY);
    },
    beendeGeneratorZiehen() {
      this.generatorModal.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.beimGeneratorZiehen);
      window.removeEventListener('pointerup', this.beendeGeneratorZiehen);
      window.removeEventListener('pointercancel', this.beendeGeneratorZiehen);
    },
    starteGeneratorResize(event) {
      if (this.generatorModal.istVollbild) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.generatorFenster;
      if (!fenster) {
        return;
      }
      this.generatorModal.resizeAktiv = true;
      this.generatorModal.resizeStartX = event.clientX;
      this.generatorModal.resizeStartY = event.clientY;
      this.generatorModal.resizeStartBreite =
        this.generatorModal.breite !== null ? this.generatorModal.breite : fenster.offsetWidth;
      this.generatorModal.resizeStartHoehe =
        this.generatorModal.hoehe !== null ? this.generatorModal.hoehe : fenster.offsetHeight;
      window.addEventListener('pointermove', this.beimGeneratorResize);
      window.addEventListener('pointerup', this.beendeGeneratorResize);
      window.addEventListener('pointercancel', this.beendeGeneratorResize);
      event.preventDefault();
    },
    beimGeneratorResize(event) {
      if (!this.generatorModal.resizeAktiv || this.generatorModal.istVollbild) {
        return;
      }
      const neueBreite = this.generatorModal.resizeStartBreite + (event.clientX - this.generatorModal.resizeStartX);
      const neueHoehe = this.generatorModal.resizeStartHoehe + (event.clientY - this.generatorModal.resizeStartY);
      const groesse = this.begrenzeGeneratorFensterGroesse(neueBreite, neueHoehe);
      this.generatorModal.breite = groesse.breite;
      this.generatorModal.hoehe = groesse.hoehe;
      this.stelleSichtbaresGeneratorFensterSicher();
    },
    beendeGeneratorResize() {
      this.generatorModal.resizeAktiv = false;
      window.removeEventListener('pointermove', this.beimGeneratorResize);
      window.removeEventListener('pointerup', this.beendeGeneratorResize);
      window.removeEventListener('pointercancel', this.beendeGeneratorResize);
    },
    generatorVollbildUmschalten() {
      this.generatorModal.istVollbild = !this.generatorModal.istVollbild;
      if (!this.generatorModal.istVollbild) {
        this.$nextTick(() => this.stelleSichtbaresGeneratorFensterSicher());
      }
    },
    stelleSichtbaresGeneratorFensterSicher() {
      if (
        this.generatorModal.istVollbild ||
        this.generatorModal.breite === null ||
        this.generatorModal.hoehe === null
      ) {
        return;
      }
      const groesse = this.begrenzeGeneratorFensterGroesse(this.generatorModal.breite, this.generatorModal.hoehe);
      this.generatorModal.breite = groesse.breite;
      this.generatorModal.hoehe = groesse.hoehe;
      if (this.generatorModal.positionX === null || this.generatorModal.positionY === null) {
        this.zentriereGeneratorFenster();
        return;
      }
      const { viewportBreite, viewportHoehe } = this.ermittleViewportGroesse();
      const maxX = Math.max(0, viewportBreite - this.generatorModal.breite);
      const maxY = Math.max(0, viewportHoehe - this.generatorModal.hoehe);
      this.generatorModal.positionX = Math.min(Math.max(0, this.generatorModal.positionX), maxX);
      this.generatorModal.positionY = Math.min(Math.max(0, this.generatorModal.positionY), maxY);
    },
    onFensterGroesseGeaendert() {
      if (!this.generatorModal.offen) {
        return;
      }
      this.$nextTick(() => this.stelleSichtbaresGeneratorFensterSicher());
    },
    onGlobaleTaste(ev) {
      if (ev && ev.key === 'Escape' && this.generatorModal.offen) {
        this.schliesseGeneratorModal();
      }
    },
    importNaechsteAusWarteschlange() {
      if (!this.importWarteschlange.length) {
        return;
      }
      const file = this.importWarteschlange.shift();
      window.setTimeout(() => {
        const m = this.$refs.weltenbauImportModal;
        if (m && typeof m.oeffnenMitDatei === 'function') {
          m.oeffnenMitDatei(file);
        }
      }, 450);
    },
    onWeltenbauBildImportFertig({ dataUrl, name, dateigroesseBytes }) {
      const vorher = {
        ...this.zustand,
        eintraege: this.zustand.eintraege.slice(),
      };
      const neu = {
        id: window.HTBAH.neueEntropieId(),
        name: typeof name === 'string' && name.trim() ? name.trim() : 'Bild',
        dataUrl,
        hinzugefuegtAm: new Date().toISOString(),
        dateigroesseBytes: Number.isFinite(dateigroesseBytes) && dateigroesseBytes > 0 ? Math.round(dateigroesseBytes) : null,
      };
      this.zustand = {
        ...this.zustand,
        version: 4,
        eintraege: [...this.zustand.eintraege, neu],
      };
      try {
        this.persist();
      } catch (err) {
        this.zustand = vorher;
        this.importWarteschlange = [];
        if (err && err.name === 'QuotaExceededError') {
          this.zeigeStatus(
            'Browser-Speicher voll. Ältere Weltenbau-Bilder löschen oder in den Einstellungen Platz schaffen.',
            'danger',
          );
          return;
        }
        this.zeigeStatus('Speichern fehlgeschlagen.', 'danger');
        return;
      }
      this.zeigeStatus('Bild gespeichert (komprimiert).', 'success');
      this.importNaechsteAusWarteschlange();
    },
    onWeltenbauBildImportAbgebrochen() {
      this.importWarteschlange = [];
    },
    onWeltenbauDateiImportFehler() {
      window.setTimeout(() => this.importNaechsteAusWarteschlange(), 450);
    },
    onDateienGewaehlt(ev) {
      const input = ev.target;
      // FileList ist oft live: Zuerst kopieren, dann value leeren — sonst ist die Liste leer.
      const dateiListe = input && input.files ? Array.from(input.files) : [];
      if (input) {
        input.value = '';
      }
      if (!dateiListe.length) {
        return;
      }
      const bildDateien = dateiListe.filter(istBildDatei);
      if (!bildDateien.length) {
        this.zeigeStatus(
          'Keine Bilddateien erkannt. Erlaubt sind gängige Rasterformate (PNG, JPEG, WebP, GIF usw.) oder passende Dateiendung.',
          'warning',
        );
        return;
      }
      const max = WELTENBAU_MAX_ROH_DATEI_BYTES;
      const zuGross = bildDateien.filter((f) => f.size > max);
      const ok = bildDateien.filter((f) => f.size <= max);
      if (zuGross.length) {
        const namen = zuGross.map((f) => `"${f.name}" (${formatBytes(f.size)})`).join(', ');
        this.zeigeStatus(
          `Übersprungen (zu groß, max. ${formatBytes(max)} pro Datei): ${namen}.`,
          'warning',
        );
      }
      if (!ok.length) {
        return;
      }
      this.importWarteschlange = ok.slice();
      this.importNaechsteAusWarteschlange();
    },
    async eintragUmbenennen(e) {
      if (!e) {
        return;
      }
      const neu = await window.HTBAH.ui.prompt({
        titel: 'Eintrag umbenennen',
        beschreibung: 'Bezeichnung:',
        label: 'Bezeichnung',
        startwert: e.name || '',
        bestaetigenText: 'Speichern',
        trim: false,
      });
      if (neu === null) {
        return;
      }
      const t = neu.trim();
      if (!t) {
        return;
      }
      this.zustand = {
        ...this.zustand,
        eintraege: this.zustand.eintraege.map((x) => (x.id === e.id ? { ...x, name: t } : x)),
      };
      this.persist();
      this.zeigeStatus('Bezeichnung gespeichert.');
    },
    async eintragLoeschen(e) {
      if (!e) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Bild entfernen?',
        beschreibung: 'Dieses Bild aus dem Speicher entfernen?',
        bestaetigenText: 'Entfernen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }
      window.HTBAH.bildbetrachterSchliesseFuerWeltenbauEintrag(e.id);
      this.zustand = {
        ...this.zustand,
        eintraege: this.zustand.eintraege.filter((x) => x.id !== e.id),
      };
      this.persist();
      this.zeigeStatus('Bild entfernt.');
    },
    vorschauOeffnen(e) {
      window.HTBAH.bildbetrachterOeffnen({
        dataUrl: e.dataUrl,
        titel: e.name || 'Bild',
        weltenbauEintragId: e.id,
      });
    },
    formatEintragImportdatum(eintrag) {
      if (!eintrag || !eintrag.hinzugefuegtAm) {
        return '';
      }
      return formatDatumZeit(eintrag.hinzugefuegtAm);
    },
    formatEintragDateigroesse(eintrag) {
      if (!eintrag || !Number.isFinite(eintrag.dateigroesseBytes) || eintrag.dateigroesseBytes <= 0) {
        return '';
      }
      return formatBytes(eintrag.dateigroesseBytes);
    },
  },
  mounted() {
    window.addEventListener('resize', this.onFensterGroesseGeaendert);
    window.addEventListener('keydown', this.onGlobaleTaste);
  },
  beforeUnmount() {
    this.beendeGeneratorZiehen();
    this.beendeGeneratorResize();
    window.removeEventListener('resize', this.onFensterGroesseGeaendert);
    window.removeEventListener('keydown', this.onGlobaleTaste);
  },
  template: `
    <div class="container content py-3">
      <weltenbau-uebersicht-modal
        :offen="weltenbauMapModalOffen"
        :gruppe-id="ausgewaehlteGruppeId"
        @schliessen="onWeltenbauMapModalSchliessen" />
      <weltenbau-bild-import-modal
        ref="weltenbauImportModal"
        @fertig="onWeltenbauBildImportFertig"
        @abgebrochen="onWeltenbauBildImportAbgebrochen"
        @datei-import-fehler="onWeltenbauDateiImportFehler" />

      <h4 class="text-center mb-1 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">🗺️</span>
        <span>Weltenbau</span>
      </h4>
      <p class="small text-body-secondary text-center mb-3">
        Externe Generatoren (u. a. Karten, Gebäude, Dungeons) mit Export als PNG/JSON.
      </p>

      <div class="card p-3 mb-3">
        <div class="row">
          <div class="col-12">
            <p class="small text-body-secondary mb-3">
              Im interaktiven Weltenbau-Übersichts-Modal siehst du alle NPCs, Orte, Fraktionen, Bestien usw.<br>
              Dafür musst du zuerst eine Gruppe von Spielenden auswählen.
            </p>
          </div>          
        </div>
        <div class="row g-2 align-items-end">
          <div class="col-12 col-md-8">
            <label class="form-label small text-secondary mb-1" for="weltenbau-gruppe-select">Gruppe</label>
            <select
              id="weltenbau-gruppe-select"
              class="form-select"
              v-model="ausgewaehlteGruppeId"
              :disabled="gruppenAuswahlDeaktiviert">
              <option v-for="g in spielleiterGruppen" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div class="col-12 col-md-4 d-grid">
            <button type="button" class="btn btn-primary" :disabled="!ausgewaehlteGruppeId" @click="weltenbauMapModalOffen = true">
              Interaktive Übersicht öffnen
            </button>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <h6 class="mb-0">Importierte Bilder</h6>
          <div class="d-flex align-items-center gap-2">
            <span class="badge text-bg-secondary" v-if="geschaetzteSpeicherGroesseKb">
              ca. {{ geschaetzteSpeicherGroesseKb }} KB (nur diese Seite)
            </span>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
              aria-label="Hinweis zum Bildimport anzeigen"
              :aria-expanded="zeigeImportHinweis"
              @click="importHinweisUmschalten">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
            </button>
          </div>
        </div>
        <div v-if="zeigeImportHinweis" class="alert alert-info py-2 small mb-3" role="note">
          Unterstützt: gängige Bildformate (PNG, JPEG, WebP, GIF, BMP, …). Rohdateien bis
          {{ maxRohDateiHuman }} — danach öffnet sich ein Zuschnitt mit Cropper;
          gespeichert wird maximal 2048 px Kantenlänge als JPEG/WebP (kleiner als die Rohdatei, geeignet für den Browser-Speicher).
          Gesamtkontingent: typisch etwa 5–10 MB pro Website im Browser — bei vollem Speicher erscheint eine Meldung.
          Bilder lassen sich in einem eigenen Fenster vergrößern, scrollen und per Ecke in der Größe ändern (auch mehrere gleichzeitig).
        </div>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <input
            ref="dateiInput"
            type="file"
            class="d-none"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg"
            multiple
            @change="onDateienGewaehlt" />
          <icon-text-button
            type="button"
            class="btn btn-primary"
            icon="add_photo_alternate"
            @click="$refs.dateiInput.click()">
            Bilder importieren
          </icon-text-button>
        </div>

        <p v-if="!zustand.eintraege.length" class="small text-body-secondary mb-0">
          Noch keine Bilder gespeichert.
        </p>
        <div v-else class="row g-2">
          <div
            v-for="e in zustand.eintraege"
            :key="e.id"
            class="col-6 col-md-4 col-lg-3">
            <div class="card h-100 shadow-sm htbah-weltenbau-karte">
              <div class="d-flex align-items-center justify-content-between gap-1 px-2 pb-1 htbah-weltenbau-karte-kopf">
                <div class="small fw-semibold text-truncate mb-0 flex-grow-1 htbah-weltenbau-titel" :title="e.name">
                  {{ e.name }}
                </div>
                <div class="dropdown htbah-weltenbau-karte-menu">
                  <button
                    type="button"
                    class="btn d-flex align-items-center justify-content-center htbah-weltenbau-karte-menu-button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Aktionen für importiertes Bild"
                    @click.stop>
                    <span class="material-symbols-outlined" aria-hidden="true">more_vert</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <button type="button" class="dropdown-item" @click.stop="eintragUmbenennen(e)">
                        Umbenennen
                      </button>
                    </li>
                    <li>
                      <button type="button" class="dropdown-item text-danger" @click.stop="eintragLoeschen(e)">
                        Löschen
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <button
                type="button"
                class="btn btn-link p-0 border-0 text-start w-100 htbah-weltenbau-thumb-wrap"
                @click="vorschauOeffnen(e)">
                <img
                  class="htbah-weltenbau-thumb"
                  :src="e.dataUrl"
                  :alt="e.name || 'Import'" />
              </button>
              <div class="card-body py-1 px-2">
                <div v-if="formatEintragImportdatum(e)" class="text-body-secondary text-truncate htbah-weltenbau-meta-zeile">
                  Upload: {{ formatEintragImportdatum(e) }}
                </div>
                <div v-if="formatEintragDateigroesse(e)" class="text-body-secondary text-truncate htbah-weltenbau-meta-zeile">
                  Dateigröße: {{ formatEintragDateigroesse(e) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <h6 class="mb-2">Generatoren (extern)</h6>
        <div class="alert alert-warning py-2 small mb-3" role="alert">
          Diese Generatoren stammen von Watabou und werden hier nur eingebettet. JSON-Exporte kannst du
          in den Generatoren selbst sichern und später wieder laden. Die zuletzt bekannte Generator-URL
          (inkl. Query-Parametern, soweit vom Browser zugänglich) wird lokal gespeichert und beim nächsten Öffnen wiederverwendet.
        </div>
        <div class="row g-2">
          <div
            v-for="generator in generatoren"
            :key="generator.id"
            class="col-12 col-sm-6 col-lg-4">
            <component
              :is="generator.nurExternerTab ? 'a' : 'button'"
              v-bind="
                generator.nurExternerTab
                  ? { href: generator.startUrl, target: '_blank', rel: 'noopener noreferrer' }
                  : { type: 'button' }
              "
              class="card shadow-sm w-100 h-100 text-start htbah-weltenbau-generator-card"
              :class="{ 'text-decoration-none text-body': generator.nurExternerTab }"
              @click="onWeltenbauGeneratorKarteKlick(generator)">
              <div class="card-body py-2 px-3">
                <div class="fw-semibold mb-1 d-flex align-items-center flex-wrap gap-1">
                  <span>{{ generator.titel }}</span>
                  <template v-if="generator.nurExternerTab">
                    <span class="text-body-secondary" aria-hidden="true">(</span>
                    <span
                      class="material-symbols-outlined htbah-weltenbau-extern-tab-icon"
                      aria-hidden="true">open_in_new</span>
                    <span class="text-body-secondary" aria-hidden="true">)</span>
                  </template>
                </div>
                <div class="small text-body-secondary text-truncate" :title="generator.sourceUrl">
                  Quelle: {{ generator.sourceUrl }}
                </div>
                <div
                  v-if="!generator.nurExternerTab && zustand.generatorUrls && zustand.generatorUrls[generator.id]"
                  class="small text-body-secondary text-truncate"
                  :title="zustand.generatorUrls[generator.id]">
                  Letzte URL: {{ zustand.generatorUrls[generator.id] }}
                </div>
                <div
                  v-if="zustand.generatorAufrufe && zustand.generatorAufrufe[generator.id]"
                  class="small text-body-secondary"
                  :title="formatGeneratorAufruf(zustand.generatorAufrufe[generator.id])">
                  Letzter Aufruf: {{ formatGeneratorAufruf(zustand.generatorAufrufe[generator.id]) }}
                </div>
              </div>
            </component>
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>

      <div v-if="generatorModal.offen" class="regelwerk-modal-layer htbah-generator-modal-layer">
        <div
          ref="generatorFenster"
          class="regelwerk-modal-window card shadow htbah-generator-modal-window"
          :class="{ 'regelwerk-modal-window-fullscreen': generatorModal.istVollbild }"
          :style="generatorModalStil">
          <div
            class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2"
            @pointerdown="starteGeneratorZiehen">
            <div class="d-flex flex-column flex-grow-1 pe-2 overflow-hidden">
              <h6 class="mb-0 text-truncate" :title="generatorModal.titel">{{ generatorModal.titel }}</h6>
              <small class="text-body-secondary text-truncate" :title="generatorModal.sourceUrl">
                Quelle: {{ generatorModal.sourceUrl }}
              </small>
            </div>
            <div class="d-flex gap-1 align-items-center flex-shrink-0">
              <button
                type="button"
                class="regelwerk-icon-button"
                title="Neu laden"
                aria-label="Neu laden"
                @click="generatorNeuLaden">
                <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
              </button>
              <button
                type="button"
                class="regelwerk-icon-button"
                title="Im neuen Tab öffnen"
                aria-label="Im neuen Tab öffnen"
                @click="generatorInNeuemTab">
                <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
              </button>
              <button
                type="button"
                class="regelwerk-icon-button"
                :title="generatorVollbildLabel"
                :aria-label="generatorVollbildLabel"
                @click="generatorVollbildUmschalten">
                <span class="material-symbols-outlined" aria-hidden="true">{{ generatorVollbildIcon }}</span>
              </button>
              <button
                type="button"
                class="btn-close"
                aria-label="Schließen"
                title="Schließen"
                @click="schliesseGeneratorModal"></button>
            </div>
          </div>
          <div class="px-2 py-1 border-top border-bottom bg-body-tertiary">
            <input
              type="url"
              class="form-control form-control-sm"
              :value="generatorModal.iframeUrl"
              placeholder="Generator-URL"
              @blur="onGeneratorUrlEingabeBlur"
              @keydown.enter.prevent="onGeneratorUrlEingabeBlur($event)" />
            <small class="text-body-secondary">
              Hinweis: Manche interne Navigationsschritte im eingebetteten Frame sind aus Sicherheitsgründen nicht lesbar.
            </small>
          </div>
          <iframe
            ref="generatorIframe"
            :src="generatorModal.iframeUrl"
            class="htbah-generator-modal-content"
            allowfullscreen
            @load="onGeneratorIframeLoad"></iframe>
          <div
            v-if="!generatorModal.istVollbild"
            class="regelwerk-modal-resize-handle"
            role="presentation"
            aria-hidden="true"
            @pointerdown="starteGeneratorResize"></div>
        </div>
      </div>
    </div>
  `,
};
