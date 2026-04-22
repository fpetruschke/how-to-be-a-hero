window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function htbahTextVorschau(html, maxLen) {
  const grenze = typeof maxLen === 'number' ? maxLen : 72;
  const t = htbahHtmlText(html);
  if (!t) {
    return '—';
  }
  return t.length > grenze ? `${t.slice(0, grenze)}…` : t;
}

function htbahHtmlText(html) {
  const div = document.createElement('div');
  div.innerHTML = typeof html === 'string' ? html : '';
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

const ZUFALLSTABELLEN_MAX_ROH_DATEI_BYTES = 40 * 1024 * 1024;

function zufallstabellenIstBildDatei(file) {
  if (!file) {
    return false;
  }
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  const n = String(file.name || '').toLowerCase();
  return /\.(png|apng|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(n);
}

function zufallstabellenFormatBytes(n) {
  if (!Number.isFinite(n) || n <= 0) {
    return '';
  }
  if (n >= 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MiB`;
  }
  if (n >= 1024) {
    return `${Math.round(n / 1024)} KiB`;
  }
  return `${Math.round(n)} B`;
}

function zufallstabellenDateiZuDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

window.HTBAH_SEITEN.Zufallstabellen = {
  components: {
    WeltenbauBildImportModal: window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal,
  },
  data() {
    return {
      zustand: window.HTBAH.ladeZufallstabellenZustand(),
      bearbeitung: null,
      bearbeitungIndex: -1,
      zeileQuillInstanz: null,
      /** DOM-Knoten des Quill-Hosts (Funktions-Ref feuert bei jedem Re-Render erneut) */
      zeileQuillHostElement: null,
      zeileQuillSession: 0,
      zeileModalInstanz: null,
      zuLoeschendeZeile: null,
      zufallNpcEpoche: 'mittelalter',
      zufallGegenstandEpoche: 'mittelalter',
      zufallGegenstandKleidung: true,
      zufallFraktionEpoche: 'mittelalter',
      /** Stabile Funktion für :ref (wie InventarModal), kein String-ref im Modal */
      zeileQuillHostRefFn: null,
      sucheOrte: '',
      sucheFraktionen: '',
      sucheNpcs: '',
      sucheGegenstaende: '',
      suchePantheon: '',
      medienImportWarteschlange: [],
      galerieModalInstanz: null,
      galerieModalZeile: null,
    };
  },
  created() {
    this.zeileQuillHostRefFn = (el) => {
      this.zeileQuillHostRef(el);
    };
  },
  computed: {
    zeileModalTitel() {
      if (!this.bearbeitung) {
        return '';
      }
      const neu = this.bearbeitungIndex < 0 ? 'Neu: ' : '';
      if (this.bearbeitung.typ === 'npc') {
        return `${neu}👤 NPC`;
      }
      if (this.bearbeitung.typ === 'ort') {
        return `${neu}🗺️ Ort`;
      }
      if (this.bearbeitung.typ === 'fraktion') {
        return `${neu}🏛️ Fraktion`;
      }
      if (this.bearbeitung.typ === 'pantheon') {
        return `${neu}✨ Gottheit`;
      }
      return `${neu}📦 Gegenstand`;
    },
    zufallsgeneratorBereit() {
      return !!(window.HTBAH && window.HTBAH.Zufallsgenerator);
    },
    /** Fraktionen mit auswählbarem Namen (NPC-Dropdown) */
    fraktionenMitNamen() {
      return (this.zustand.fraktionen || []).filter((f) => f && String(f.name || '').trim());
    },
    /** Pantheon-Namen für NPC-Glaube (Datalist / Kombinationsfeld) */
    pantheonNamenListe() {
      return (this.zustand.pantheon || [])
        .map((p) => (p && p.name ? String(p.name).trim() : ''))
        .filter(Boolean);
    },
    gefilterteOrte() {
      const q = this.normSucheText(this.sucheOrte);
      if (!q) {
        return this.zustand.orte || [];
      }
      return (this.zustand.orte || []).filter((row) =>
        this.trifftSucheZu(row, ['name', 'groesse', 'lage', 'zustand', 'notizenHtml'], q),
      );
    },
    gefilterteFraktionen() {
      const q = this.normSucheText(this.sucheFraktionen);
      if (!q) {
        return this.zustand.fraktionen || [];
      }
      return (this.zustand.fraktionen || []).filter((row) =>
        this.trifftSucheZu(
          row,
          ['art', 'name', 'ziel', 'gesinnungVerhalten', 'beschreibungHtml'],
          q,
        ),
      );
    },
    gefilterteNpcs() {
      const q = this.normSucheText(this.sucheNpcs);
      if (!q) {
        return this.zustand.npcs || [];
      }
      return (this.zustand.npcs || []).filter((row) => {
        const felder = [
          'name',
          'spitzname',
          'geschlecht',
          'alter',
          'familienstand',
          'statur',
          'lebenspunkte',
          'gesinnung',
          'glaube',
          'beruf',
          'fraktion',
          'aufenthaltsort',
          'ziel',
          'stimme',
          'waffe',
          'schadenswert',
          'notizenHtml',
        ];
        return this.trifftSucheZu(row, felder, q, this.npcWaffenWerteText(row));
      });
    },
    gefilterteGegenstaende() {
      const q = this.normSucheText(this.sucheGegenstaende);
      if (!q) {
        return this.zustand.gegenstaende || [];
      }
      return (this.zustand.gegenstaende || []).filter((row) =>
        this.trifftSucheZu(
          row,
          ['name', 'schadenswert', 'kampfart', 'beschreibungHtml'],
          q,
          this.gegenstandWaffenWerteText(row),
        ),
      );
    },
    gefiltertesPantheon() {
      const q = this.normSucheText(this.suchePantheon);
      if (!q) {
        return this.zustand.pantheon || [];
      }
      return (this.zustand.pantheon || []).filter((row) =>
        this.trifftSucheZu(
          row,
          [
            'name',
            'geschlecht',
            'domaene',
            'charakter',
            'staerke',
            'schwaeche',
            'schutzpatronat',
            'verlangen',
            'mythosGaben',
            'notizenHtml',
          ],
          q,
        ),
      );
    },
  },
  methods: {
    persist() {
      window.HTBAH.speichereZufallstabellenZustand(this.zustand);
    },
    textVorschau(html) {
      return htbahTextVorschau(html);
    },
    richTextHtml(html) {
      const inhalt = typeof html === 'string' ? html : '';
      return htbahHtmlText(inhalt) ? inhalt : '';
    },
    normSucheText(wert) {
      return String(wert || '')
        .toLocaleLowerCase('de-DE')
        .trim();
    },
    zeilenWertAlsText(wert) {
      if (wert == null) {
        return '';
      }
      if (typeof wert === 'string') {
        const raw = wert.trim();
        if (!raw) {
          return '';
        }
        if (raw.includes('<') && raw.includes('>')) {
          return htbahHtmlText(raw);
        }
        return raw;
      }
      return String(wert).trim();
    },
    trifftSucheZu(row, felder, query, extra) {
      const basis = (Array.isArray(felder) ? felder : [])
        .map((feld) => this.zeilenWertAlsText(row ? row[feld] : ''))
        .filter(Boolean)
        .join(' ');
      const gesamterText = `${basis} ${this.zeilenWertAlsText(extra)}`.trim();
      return this.normSucheText(gesamterText).includes(query);
    },
    karteWert(wert) {
      const text = this.zeilenWertAlsText(wert);
      return text || '—';
    },
    indexNachId(liste, id) {
      return (liste || []).findIndex((row) => row.id === id);
    },
    medienAusZeile(row) {
      return row && Array.isArray(row.medien) ? row.medien : [];
    },
    medienBilderAusZeile(row) {
      return this.medienAusZeile(row).filter((m) => this.mediumIstBild(m));
    },
    medienDateienAusZeile(row) {
      return this.medienAusZeile(row).filter((m) => !this.mediumIstBild(m));
    },
    medienAnzahl(row) {
      return this.medienAusZeile(row).length;
    },
    mediumIstBild(medium) {
      if (!medium || typeof medium !== 'object') {
        return false;
      }
      if (medium.typ === 'bild') {
        return true;
      }
      if (typeof medium.mimeType === 'string' && medium.mimeType.startsWith('image/')) {
        return true;
      }
      return typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/');
    },
    mediumDateiname(medium) {
      if (!medium) {
        return 'Datei';
      }
      const text = String(medium.name || '').trim();
      if (text) {
        return text;
      }
      return this.mediumIstBild(medium) ? 'Bild' : 'Datei';
    },
    mediumDateiTypLabel(medium) {
      const mime = String((medium && medium.mimeType) || '').trim();
      if (mime) {
        return mime;
      }
      return this.mediumIstBild(medium) ? 'Bilddatei' : 'Datei';
    },
    mediumDateigroesseLabel(medium) {
      return zufallstabellenFormatBytes(medium && medium.size);
    },
    mediumImBildbetrachterOeffnen(medium) {
      if (!this.mediumIstBild(medium)) {
        return;
      }
      const dataUrl = typeof medium.dataUrl === 'string' ? medium.dataUrl : '';
      if (!dataUrl.startsWith('data:image/')) {
        return;
      }
      window.HTBAH.bildbetrachterOeffnen({
        dataUrl,
        titel: this.mediumDateiname(medium),
      });
    },
    mediumHerunterladen(medium) {
      if (!medium || typeof medium.dataUrl !== 'string' || !medium.dataUrl.startsWith('data:')) {
        return;
      }
      const a = document.createElement('a');
      a.href = medium.dataUrl;
      a.download = this.mediumDateiname(medium);
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    mediumAusBearbeitungEntfernen(index) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !Array.isArray(this.bearbeitung.zeile.medien)) {
        return;
      }
      if (!Number.isInteger(index) || index < 0 || index >= this.bearbeitung.zeile.medien.length) {
        return;
      }
      this.bearbeitung.zeile.medien.splice(index, 1);
    },
    mediumZurBearbeitungHinzufuegen(eintrag) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !eintrag) {
        return;
      }
      if (!Array.isArray(this.bearbeitung.zeile.medien)) {
        this.bearbeitung.zeile.medien = [];
      }
      this.bearbeitung.zeile.medien.push(eintrag);
    },
    bildImportNaechstesAusWarteschlange() {
      if (!this.medienImportWarteschlange.length) {
        return;
      }
      const file = this.medienImportWarteschlange.shift();
      window.setTimeout(() => {
        const modal = this.$refs.zufallstabellenBildImportModal;
        if (modal && typeof modal.oeffnenMitDatei === 'function') {
          modal.oeffnenMitDatei(file);
        }
      }, 200);
    },
    onZufallstabellenBildImportFertig({ dataUrl, name, dateigroesseBytes }) {
      if (!dataUrl || !String(dataUrl).startsWith('data:image/')) {
        this.bildImportNaechstesAusWarteschlange();
        return;
      }
      this.mediumZurBearbeitungHinzufuegen({
        id: window.HTBAH.neueEntropieId(),
        typ: 'bild',
        name: typeof name === 'string' && name.trim() ? name.trim() : 'Bild',
        mimeType: (String(dataUrl).match(/^data:([^;,]+)/i) || [])[1] || '',
        dataUrl,
        size: Number.isFinite(dateigroesseBytes) && dateigroesseBytes > 0 ? Math.round(dateigroesseBytes) : null,
        createdAt: new Date().toISOString(),
      });
      this.bildImportNaechstesAusWarteschlange();
    },
    onZufallstabellenBildImportAbgebrochen() {
      this.medienImportWarteschlange = [];
    },
    onZufallstabellenBildImportFehler() {
      this.bildImportNaechstesAusWarteschlange();
    },
    async onBearbeitungsMedienDateienGewaehlt(ev) {
      const input = ev && ev.target ? ev.target : null;
      const dateiListe = input && input.files ? Array.from(input.files) : [];
      if (input) {
        input.value = '';
      }
      if (!dateiListe.length) {
        return;
      }
      const max = ZUFALLSTABELLEN_MAX_ROH_DATEI_BYTES;
      const zuGross = dateiListe.filter((f) => Number.isFinite(f.size) && f.size > max);
      const verwertbar = dateiListe.filter((f) => !Number.isFinite(f.size) || f.size <= max);
      if (zuGross.length) {
        const namen = zuGross.map((f) => `"${f.name}" (${zufallstabellenFormatBytes(f.size)})`).join(', ');
        await window.HTBAH.ui.alert({
          titel: 'Dateien übersprungen',
          beschreibung:
            `Übersprungen (zu groß, max. ${zufallstabellenFormatBytes(max)} pro Datei): ${namen}`,
        });
      }
      const bildDateien = verwertbar.filter(zufallstabellenIstBildDatei);
      const sonstigeDateien = verwertbar.filter((f) => !zufallstabellenIstBildDatei(f));
      if (bildDateien.length) {
        this.medienImportWarteschlange = this.medienImportWarteschlange.concat(bildDateien);
        if (this.medienImportWarteschlange.length === bildDateien.length) {
          this.bildImportNaechstesAusWarteschlange();
        }
      }
      for (const file of sonstigeDateien) {
        try {
          const dataUrl = await zufallstabellenDateiZuDataUrl(file);
          if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new Error('Ungültige Datei');
          }
          this.mediumZurBearbeitungHinzufuegen({
            id: window.HTBAH.neueEntropieId(),
            typ: 'datei',
            name: typeof file.name === 'string' && file.name.trim() ? file.name.trim() : 'Datei',
            mimeType: typeof file.type === 'string' ? file.type : '',
            dataUrl,
            size: Number.isFinite(file.size) && file.size > 0 ? Math.round(file.size) : null,
            createdAt: new Date().toISOString(),
          });
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Datei konnte nicht gelesen werden',
            beschreibung: `Datei konnte nicht gelesen werden: ${file && file.name ? file.name : 'Unbekannt'}`,
          });
        }
      }
    },
    galerieFuerZeileOeffnen(row) {
      this.galerieModalZeile = row || null;
      this.$nextTick(() => {
        const el = this.$refs.galerieModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.galerieModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.galerieModalInstanz.show();
      });
    },
    onGalerieModalHidden() {
      this.galerieModalZeile = null;
    },
    npcWaffenWerteText(row) {
      const schadenswert = String(row && row.schadenswert ? row.schadenswert : '').trim();
      const kampfart = row && row.kampfart === 'fernkampf' ? 'Fernkampf' : 'Nahkampf';
      if (!schadenswert) {
        return '—';
      }
      return `Schaden ${schadenswert} · ${kampfart}`;
    },
    gegenstandWaffenWerteText(row) {
      if (!row || !row.istWaffe) {
        return '—';
      }
      const schadenswert = String(row.schadenswert || '').trim();
      let kampfLabel = 'Nahkampf';
      if (row.kampfart === 'fernkampf') {
        kampfLabel = 'Fernkampf';
      } else if (row.kampfart === 'sonstiges') {
        kampfLabel = 'Sonstiges';
      }
      if (!schadenswert) {
        return kampfLabel;
      }
      return `Schaden ${schadenswert} · ${kampfLabel}`;
    },
    npcLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        spitzname: '',
        geschlecht: '',
        alter: '',
        familienstand: '',
        statur: '',
        gesinnung: '',
        beruf: '',
        ziel: '',
        stimme: '',
        lebenspunkte: '',
        waffe: '',
        schadenswert: '',
        kampfart: 'nahkampf',
        aufenthaltsort: '',
        fraktion: '',
        glaube: '',
        notizenHtml: '',
        medien: [],
      };
    },
    ortLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        groesse: '',
        lage: '',
        zustand: '',
        notizenHtml: '',
        medien: [],
      };
    },
    gegenstandLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        beschreibungHtml: '',
        istWaffe: false,
        schadenswert: '',
        kampfart: 'nahkampf',
        medien: [],
      };
    },
    fraktionLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        art: '',
        name: '',
        ziel: '',
        gesinnungVerhalten: '',
        beschreibungHtml: '',
        medien: [],
      };
    },
    pantheonLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        geschlecht: '',
        domaene: '',
        charakter: '',
        staerke: '',
        schwaeche: '',
        schutzpatronat: '',
        verlangen: '',
        mythosGaben: '',
        notizenHtml: '',
        medien: [],
      };
    },
    zeileQuillOrphanToolbarsInModalBodyEntfernen() {
      const modal = this.$refs.zeileModalElement;
      if (!modal) {
        return;
      }
      const body = modal.querySelector('.modal-body');
      if (!body) {
        return;
      }
      /* Quill hängt .ql-toolbar als Geschwister vor den Host — ohne Wrapper bleiben sie bei v-if/key von Vue liegen */
      body.querySelectorAll(':scope > .ql-toolbar.ql-snow').forEach((node) => {
        node.remove();
      });
    },
    zeileModalOeffnen(typ, zeile, index) {
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = null;
      this.zeileQuillSession += 1;
      const zeileKopie = JSON.parse(JSON.stringify(zeile));
      if (!Array.isArray(zeileKopie.medien)) {
        zeileKopie.medien = [];
      }
      this.bearbeitung = {
        typ,
        zeile: zeileKopie,
      };
      this.bearbeitungIndex = index;
      this.$nextTick(() => {
        this.zeileQuillOrphanToolbarsInModalBodyEntfernen();
        const el = this.$refs.zeileModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.zeileModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.zeileModalInstanz.show();
      });
    },
    npcHinzufuegen() {
      this.zeileModalOeffnen('npc', this.npcLeer(), -1);
    },
    npcBearbeiten(row, index) {
      this.zeileModalOeffnen('npc', row, index);
    },
    ortHinzufuegen() {
      this.zeileModalOeffnen('ort', this.ortLeer(), -1);
    },
    ortBearbeiten(row, index) {
      this.zeileModalOeffnen('ort', row, index);
    },
    gegenstandHinzufuegen() {
      this.zeileModalOeffnen('gegenstand', this.gegenstandLeer(), -1);
    },
    gegenstandBearbeiten(row, index) {
      this.zeileModalOeffnen('gegenstand', row, index);
    },
    fraktionHinzufuegen() {
      this.zeileModalOeffnen('fraktion', this.fraktionLeer(), -1);
    },
    fraktionBearbeiten(row, index) {
      this.zeileModalOeffnen('fraktion', row, index);
    },
    pantheonHinzufuegen() {
      this.zeileModalOeffnen('pantheon', this.pantheonLeer(), -1);
    },
    pantheonBearbeiten(row, index) {
      this.zeileModalOeffnen('pantheon', row, index);
    },
    htmlFuerQuillAusBearbeitung() {
      if (!this.bearbeitung) {
        return '';
      }
      if (this.bearbeitung.typ === 'gegenstand') {
        return this.bearbeitung.zeile.beschreibungHtml || '';
      }
      if (this.bearbeitung.typ === 'fraktion') {
        return this.bearbeitung.zeile.beschreibungHtml || '';
      }
      return this.bearbeitung.zeile.notizenHtml || '';
    },
    zeileQuillHostRef(el) {
      if (!el) {
        this.zeileQuillInstanz = null;
        this.zeileQuillHostElement = null;
        return;
      }
      if (!this.bearbeitung) {
        return;
      }
      this.$nextTick(() => {
        if (!this.bearbeitung) {
          return;
        }
        this.zeileQuillAufHostEinrichten(el);
      });
    },
    zeileQuillHostDomLeeren(el) {
      if (!el) {
        return;
      }
      el.querySelectorAll('.ql-toolbar.ql-snow').forEach((node) => {
        node.remove();
      });
      el.innerHTML = '';
    },
    zeileQuillAufHostEinrichten(el, quillRetry) {
      const r = typeof quillRetry === 'number' ? quillRetry : 0;
      if (!el || !this.bearbeitung) {
        return;
      }
      if (!window.Quill) {
        if (r < 40) {
          setTimeout(() => this.zeileQuillAufHostEinrichten(el, r + 1), 25);
        }
        return;
      }
      /* Funktions-:ref wird bei jedem Re-Render erneut aufgerufen — keine zweite Quill-Instanz */
      if (
        this.zeileQuillInstanz &&
        this.zeileQuillHostElement === el &&
        el.contains(this.zeileQuillInstanz.root)
      ) {
        return;
      }
      this.zeileQuillHostDomLeeren(el);
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = el;
      this.zeileQuillInstanz = new window.Quill(el, {
        theme: 'snow',
        placeholder: 'Text formatieren…',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            [{ header: [1, 2, false] }],
            ['clean'],
          ],
        },
      });
      this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
    },
    onZeileModalHidden() {
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = null;
      this.medienImportWarteschlange = [];
      this.bearbeitung = null;
      this.bearbeitungIndex = -1;
      this.$nextTick(() => this.zeileQuillOrphanToolbarsInModalBodyEntfernen());
    },
    quillHtmlInBearbeitungSchreiben() {
      if (!this.bearbeitung || !this.zeileQuillInstanz) {
        return;
      }
      const html = this.zeileQuillInstanz.root.innerHTML;
      if (this.bearbeitung.typ === 'gegenstand' || this.bearbeitung.typ === 'fraktion') {
        this.bearbeitung.zeile.beschreibungHtml = html;
      } else {
        this.bearbeitung.zeile.notizenHtml = html;
      }
    },
    quillAusBearbeitungSetzen() {
      if (!this.zeileQuillInstanz) {
        return;
      }
      this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
    },
    zufallsvorschlagUebernehmen() {
      if (!this.bearbeitung || this.bearbeitungIndex >= 0) {
        return;
      }
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G) {
        return;
      }
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      let felder;
      if (typ === 'npc') {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        const fraktionNamen = (this.zustand.fraktionen || []).map((f) =>
          f && f.name ? String(f.name) : '',
        );
        const pantheonNamen = (this.zustand.pantheon || []).map((p) =>
          p && p.name ? String(p.name) : '',
        );
        felder = G.npc({
          epoche: this.zufallNpcEpoche,
          orteNamen,
          fraktionNamen,
          pantheonNamen,
        });
      } else if (typ === 'ort') {
        felder = G.ort();
      } else if (typ === 'fraktion') {
        felder = G.fraktion({ epoche: this.zufallFraktionEpoche });
      } else if (typ === 'pantheon') {
        felder = G.pantheon();
      } else {
        felder = G.gegenstand({
          epoche: this.zufallGegenstandEpoche,
          mitKleidung: this.zufallGegenstandKleidung,
        });
      }
      Object.assign(z, felder);
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    zeileSpeichern() {
      if (!this.bearbeitung) {
        return;
      }
      this.quillHtmlInBearbeitungSchreiben();
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else {
        liste = this.zustand.gegenstaende;
      }
      if (this.bearbeitungIndex < 0) {
        liste.push(z);
      } else {
        liste[this.bearbeitungIndex] = z;
      }
      this.persist();
      if (this.zeileModalInstanz) {
        this.zeileModalInstanz.hide();
      }
    },
    zeileLoeschenDialog(typ, id) {
      this.zuLoeschendeZeile = { typ, id };
      this.$refs.zufallstabellenBestaetigen.oeffnen({
        titel: 'Zeile löschen?',
        beschreibung: 'Diese Tabellenzeile wird entfernt.',
        onBestaetigen: () => this.zeileLoeschenAusfuehren(),
      });
    },
    zeileLoeschenAusfuehren() {
      const p = this.zuLoeschendeZeile;
      this.zuLoeschendeZeile = null;
      if (!p) {
        return;
      }
      const { typ, id } = p;
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else {
        liste = this.zustand.gegenstaende;
      }
      const i = liste.findIndex((r) => r.id === id);
      if (i !== -1) {
        liste.splice(i, 1);
        this.persist();
      }
    },
    pantheonExportieren() {
      const paket = window.HTBAH.erstellePantheonExportPaket();
      const datum = new Date();
      const yyyy = String(datum.getFullYear());
      const mm = String(datum.getMonth() + 1).padStart(2, '0');
      const dd = String(datum.getDate()).padStart(2, '0');
      window.HTBAH.dateiHerunterladenJson(paket, `htbah-pantheon-${yyyy}-${mm}-${dd}.json`);
    },
    async pantheonImportieren(event) {
      const datei = event.target.files?.[0];
      if (!datei) {
        return;
      }
      let text;
      try {
        text = await datei.text();
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: 'Die Datei konnte nicht gelesen werden.',
        });
        event.target.value = '';
        return;
      }
      let roh;
      try {
        roh = JSON.parse(text);
      } catch {
        await window.HTBAH.ui.alert({
          titel: 'Ungültige Datei',
          beschreibung: 'Kein gültiges JSON.',
        });
        event.target.value = '';
        return;
      }
      const r = window.HTBAH.pantheonImportAusPaket(roh);
      if (!r.ok) {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung: r.fehler,
        });
        event.target.value = '';
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Pantheon ersetzen?',
        beschreibung: 'Das Pantheon wird vollständig durch die Importdatei ersetzt. Fortfahren?',
        bestaetigenText: 'Ersetzen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        event.target.value = '';
        return;
      }
      this.zustand.pantheon = r.pantheon;
      this.persist();
      event.target.value = '';
    },
    tabelleLeerenDialog(typ) {
      const labels = {
        npcs: '👤 NPCs',
        orte: '🗺️ Orte',
        gegenstaende: '📦 Gegenstände',
        fraktionen: '🏛️ Fraktionen',
        pantheon: '✨ Pantheon',
      };
      this.$refs.zufallstabellenBestaetigen.oeffnen({
        titel: `${labels[typ] || 'Tabelle'} leeren?`,
        beschreibung: 'Alle Einträge in dieser Tabelle werden entfernt.',
        onBestaetigen: () => {
          if (typ === 'npcs') {
            this.zustand.npcs = [];
          } else if (typ === 'orte') {
            this.zustand.orte = [];
          } else if (typ === 'gegenstaende') {
            this.zustand.gegenstaende = [];
          } else if (typ === 'fraktionen') {
            this.zustand.fraktionen = [];
          } else if (typ === 'pantheon') {
            this.zustand.pantheon = [];
          }
          this.persist();
        },
      });
    },
  },
  beforeUnmount() {
    this.zeileQuillInstanz = null;
    this.zeileQuillHostElement = null;
  },
  template: `
    <div class="container content py-3">
      <weltenbau-bild-import-modal
        ref="zufallstabellenBildImportModal"
        @fertig="onZufallstabellenBildImportFertig"
        @abgebrochen="onZufallstabellenBildImportAbgebrochen"
        @datei-import-fehler="onZufallstabellenBildImportFehler" />

      <h4 class="text-center mb-3 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">📚</span>
        <span>Zufallstabellen</span>
      </h4>
      <p class="text-secondary text-center small mb-4">
        Eigene Tabellen für Spielrunden.
      </p>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">🗺️ Orte</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('orte')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="ortHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheOrte"
              type="search"
              class="form-control form-control-sm"
              placeholder="Orte durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Größe</th>
                  <th>Lage</th>
                  <th>Zustand</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gefilterteOrte.length">
                  <td colspan="6" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="row in gefilterteOrte" :key="row.id">
                  <td>{{ karteWert(row.name) }}</td>
                  <td>{{ karteWert(row.groesse) }}</td>
                  <td>{{ karteWert(row.lage) }}</td>
                  <td>{{ karteWert(row.zustand) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="ortBearbeiten(row, indexNachId(zustand.orte, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('ort', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!gefilterteOrte.length" class="text-secondary text-center py-3 small">
              Noch keine Einträge.
            </div>
            <div v-for="row in gefilterteOrte" :key="'ort-card-' + row.id" class="card zufallstabellen-mobile-card mb-2">
              <div class="card-body p-2">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Größe:</span> {{ karteWert(row.groesse) }}</div>
                <div class="small"><span class="text-secondary">Lage:</span> {{ karteWert(row.lage) }}</div>
                <div class="small mb-2"><span class="text-secondary">Zustand:</span> {{ karteWert(row.zustand) }}</div>
                <div
                  v-if="medienBilderAusZeile(row).length"
                  class="zufallstabellen-mobile-slides mb-2">
                  <button
                    v-for="(bild, bildIndex) in medienBilderAusZeile(row)"
                    :key="'ort-bild-' + row.id + '-' + bild.id"
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    :aria-label="'Bild ' + (bildIndex + 1) + ' anzeigen'"
                    @click="mediumImBildbetrachterOeffnen(bild)">
                    <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="ortBearbeiten(row, indexNachId(zustand.orte, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('ort', row.id)">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">🏛️ Fraktionen</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('fraktionen')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="fraktionHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheFraktionen"
              type="search"
              class="form-control form-control-sm"
              placeholder="Fraktionen durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Art</th>
                  <th>Name</th>
                  <th>Ziel</th>
                  <th>Gesinnung / Verhalten</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gefilterteFraktionen.length">
                  <td colspan="6" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="row in gefilterteFraktionen" :key="row.id">
                  <td>{{ karteWert(row.art) }}</td>
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small">{{ karteWert(row.ziel) }}</td>
                  <td class="small">{{ karteWert(row.gesinnungVerhalten) }}</td>
                  <td class="small">{{ textVorschau(row.beschreibungHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="fraktionBearbeiten(row, indexNachId(zustand.fraktionen, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('fraktion', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!gefilterteFraktionen.length" class="text-secondary text-center py-3 small">
              Noch keine Einträge.
            </div>
            <div
              v-for="row in gefilterteFraktionen"
              :key="'fraktion-card-' + row.id"
              class="card zufallstabellen-mobile-card mb-2">
              <div class="card-body p-2">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Art:</span> {{ karteWert(row.art) }}</div>
                <div class="small"><span class="text-secondary">Ziel:</span> {{ karteWert(row.ziel) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Gesinnung:</span> {{ karteWert(row.gesinnungVerhalten) }}
                </div>
                <div
                  v-if="medienBilderAusZeile(row).length"
                  class="zufallstabellen-mobile-slides mb-2">
                  <button
                    v-for="(bild, bildIndex) in medienBilderAusZeile(row)"
                    :key="'fraktion-bild-' + row.id + '-' + bild.id"
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    :aria-label="'Bild ' + (bildIndex + 1) + ' anzeigen'"
                    @click="mediumImBildbetrachterOeffnen(bild)">
                    <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="fraktionBearbeiten(row, indexNachId(zustand.fraktionen, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('fraktion', row.id)">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">👤 NPCs</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('npcs')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="npcHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheNpcs"
              type="search"
              class="form-control form-control-sm"
              placeholder="NPCs durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Spitzname</th>
                  <th>Geschlecht</th>
                  <th>Alter</th>
                  <th>Familienstand</th>
                  <th>Statur</th>
                  <th>LP</th>
                  <th>Gesinnung</th>
                  <th>Glaube</th>
                  <th>Beruf</th>
                  <th>Fraktion</th>
                  <th>Aufenthaltsort</th>
                  <th>Ziel</th>
                  <th>Stimme</th>
                  <th>Waffe</th>
                  <th>Werte</th>
                  <th>Notizen</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gefilterteNpcs.length">
                  <td colspan="18" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="row in gefilterteNpcs" :key="row.id">
                  <td>{{ karteWert(row.name) }}</td>
                  <td>{{ karteWert(row.spitzname) }}</td>
                  <td>{{ karteWert(row.geschlecht) }}</td>
                  <td>{{ karteWert(row.alter) }}</td>
                  <td>{{ karteWert(row.familienstand) }}</td>
                  <td>{{ karteWert(row.statur) }}</td>
                  <td>{{ karteWert(row.lebenspunkte) }}</td>
                  <td>{{ karteWert(row.gesinnung) }}</td>
                  <td>{{ karteWert(row.glaube) }}</td>
                  <td>{{ karteWert(row.beruf) }}</td>
                  <td>{{ karteWert(row.fraktion) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td>{{ karteWert(row.ziel) }}</td>
                  <td>{{ karteWert(row.stimme) }}</td>
                  <td>{{ karteWert(row.waffe) }}</td>
                  <td class="small">{{ npcWaffenWerteText(row) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="npcBearbeiten(row, indexNachId(zustand.npcs, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('npc', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!gefilterteNpcs.length" class="text-secondary text-center py-3 small">
              Noch keine Einträge.
            </div>
            <div v-for="row in gefilterteNpcs" :key="'npc-card-' + row.id" class="card zufallstabellen-mobile-card mb-2">
              <div class="card-body p-2">
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="zeilenWertAlsText(row.spitzname)" class="fw-normal text-secondary">({{ row.spitzname }})</span>
                </div>
                <div class="small"><span class="text-secondary">Beruf:</span> {{ karteWert(row.beruf) }}</div>
                <div class="small"><span class="text-secondary">Gesinnung:</span> {{ karteWert(row.gesinnung) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small"><span class="text-secondary">Fraktion:</span> {{ karteWert(row.fraktion) }}</div>
                <div class="small mb-2"><span class="text-secondary">Werte:</span> {{ npcWaffenWerteText(row) }}</div>
                <div
                  v-if="medienBilderAusZeile(row).length"
                  class="zufallstabellen-mobile-slides mb-2">
                  <button
                    v-for="(bild, bildIndex) in medienBilderAusZeile(row)"
                    :key="'npc-bild-' + row.id + '-' + bild.id"
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    :aria-label="'Bild ' + (bildIndex + 1) + ' anzeigen'"
                    @click="mediumImBildbetrachterOeffnen(bild)">
                    <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="npcBearbeiten(row, indexNachId(zustand.npcs, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('npc', row.id)">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">📦 Gegenstände</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('gegenstaende')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="gegenstandHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheGegenstaende"
              type="search"
              class="form-control form-control-sm"
              placeholder="Gegenstände durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kampfwerte</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gefilterteGegenstaende.length">
                  <td colspan="4" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="row in gefilterteGegenstaende" :key="row.id">
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small text-nowrap">{{ gegenstandWaffenWerteText(row) }}</td>
                  <td class="small">{{ textVorschau(row.beschreibungHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="gegenstandBearbeiten(row, indexNachId(zustand.gegenstaende, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('gegenstand', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!gefilterteGegenstaende.length" class="text-secondary text-center py-3 small">
              Noch keine Einträge.
            </div>
            <div
              v-for="row in gefilterteGegenstaende"
              :key="'gegenstand-card-' + row.id"
              class="card zufallstabellen-mobile-card mb-2">
              <div class="card-body p-2">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Kampfwerte:</span> {{ gegenstandWaffenWerteText(row) }}</div>
                <div
                  v-if="medienBilderAusZeile(row).length"
                  class="zufallstabellen-mobile-slides my-2">
                  <button
                    v-for="(bild, bildIndex) in medienBilderAusZeile(row)"
                    :key="'gegenstand-bild-' + row.id + '-' + bild.id"
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    :aria-label="'Bild ' + (bildIndex + 1) + ' anzeigen'"
                    @click="mediumImBildbetrachterOeffnen(bild)">
                    <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="gegenstandBearbeiten(row, indexNachId(zustand.gegenstaende, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('gegenstand', row.id)">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">✨ Pantheon</span>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="pantheonExportieren" title="Nur Pantheon als JSON">
              Export
            </button>
            <label class="btn btn-sm btn-outline-secondary mb-0" title="Pantheon aus JSON ersetzen">
              Import
              <input
                type="file"
                class="d-none"
                accept="application/json,.json"
                @change="pantheonImportieren" />
            </label>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('pantheon')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="pantheonHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="suchePantheon"
              type="search"
              class="form-control form-control-sm"
              placeholder="Pantheon durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Domäne</th>
                  <th>Charakter</th>
                  <th>Schutzpatronat</th>
                  <th>Notizen</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!gefiltertesPantheon.length">
                  <td colspan="6" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="row in gefiltertesPantheon" :key="row.id">
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small">{{ karteWert(row.domaene) }}</td>
                  <td class="small">{{ karteWert(row.charakter) }}</td>
                  <td class="small">{{ karteWert(row.schutzpatronat) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="pantheonBearbeiten(row, indexNachId(zustand.pantheon, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('pantheon', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!gefiltertesPantheon.length" class="text-secondary text-center py-3 small">
              Noch keine Einträge.
            </div>
            <div
              v-for="row in gefiltertesPantheon"
              :key="'pantheon-card-' + row.id"
              class="card zufallstabellen-mobile-card mb-2">
              <div class="card-body p-2">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Domäne:</span> {{ karteWert(row.domaene) }}</div>
                <div class="small"><span class="text-secondary">Charakter:</span> {{ karteWert(row.charakter) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Schutzpatronat:</span> {{ karteWert(row.schutzpatronat) }}
                </div>
                <div
                  v-if="medienBilderAusZeile(row).length"
                  class="zufallstabellen-mobile-slides mb-2">
                  <button
                    v-for="(bild, bildIndex) in medienBilderAusZeile(row)"
                    :key="'pantheon-bild-' + row.id + '-' + bild.id"
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    :aria-label="'Bild ' + (bildIndex + 1) + ' anzeigen'"
                    @click="mediumImBildbetrachterOeffnen(bild)">
                    <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="pantheonBearbeiten(row, indexNachId(zustand.pantheon, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('pantheon', row.id)">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>

      <div
        class="modal fade"
        id="htbahZufallstabellenZeileModal"
        ref="zeileModalElement"
        tabindex="-1"
        aria-labelledby="htbahZufallstabellenZeileModalLabel"
        aria-hidden="true"
        @hidden.bs.modal="onZeileModalHidden">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title me-auto" id="htbahZufallstabellenZeileModalLabel">{{ zeileModalTitel }}</h5>
              <button
                v-if="bearbeitung && bearbeitungIndex < 0"
                type="button"
                class="btn btn-sm btn-outline-secondary me-2"
                :disabled="!zufallsgeneratorBereit"
                :title="zufallsgeneratorBereit ? '' : 'Zufallsgenerator nicht geladen'"
                @click="zufallsvorschlagUebernehmen">
                Zufallsvorschlag
              </button>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start" v-if="bearbeitung">
              <template v-if="bearbeitung.typ === 'npc'">
                <div class="row g-2 mb-2 align-items-end" v-if="bearbeitungIndex < 0">
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfn-epoche">Epoche für Zufallsvorschlag</label>
                    <select id="zfn-epoche" class="form-select form-select-sm" v-model="zufallNpcEpoche">
                      <option value="mittelalter">Mittelalter</option>
                      <option value="gegenwart">Gegenwart</option>
                      <option value="zukunft">Zukunft</option>
                    </select>
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                      <label for="zfn-name">Name</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-spitzname" class="form-control" v-model="bearbeitung.zeile.spitzname" placeholder=" " />
                      <label for="zfn-spitzname">Spitzname</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-geschlecht" class="form-control" v-model="bearbeitung.zeile.geschlecht" placeholder=" " />
                      <label for="zfn-geschlecht">Geschlecht</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-alter" class="form-control" v-model="bearbeitung.zeile.alter" placeholder=" " />
                      <label for="zfn-alter">Alter</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-familienstand" class="form-control" v-model="bearbeitung.zeile.familienstand" placeholder=" " />
                      <label for="zfn-familienstand">Familienstand</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-statur" class="form-control" v-model="bearbeitung.zeile.statur" placeholder=" " />
                      <label for="zfn-statur">Statur</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        id="zfn-lp"
                        class="form-control"
                        v-model="bearbeitung.zeile.lebenspunkte"
                        placeholder=" "
                        inputmode="numeric"
                        autocomplete="off" />
                      <label for="zfn-lp">Lebenspunkte</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-gesinnung" class="form-control" v-model="bearbeitung.zeile.gesinnung" placeholder=" " />
                      <label for="zfn-gesinnung">Gesinnung</label>
                    </div>
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfn-glaube">Glaube</label>
                    <input
                      id="zfn-glaube"
                      class="form-control"
                      v-model="bearbeitung.zeile.glaube"
                      :list="pantheonNamenListe.length ? 'zfn-glaube-datalist' : undefined"
                      placeholder="Leer, aus Liste wählen oder Freitext"
                      autocomplete="off" />
                    <datalist v-if="pantheonNamenListe.length" id="zfn-glaube-datalist">
                      <option v-for="n in pantheonNamenListe" :key="'pg-' + n" :value="n"></option>
                    </datalist>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-beruf" class="form-control" v-model="bearbeitung.zeile.beruf" placeholder=" " />
                      <label for="zfn-beruf">Beruf</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfn-fraktion">Fraktion</label>
                    <select id="zfn-fraktion" class="form-select" v-model="bearbeitung.zeile.fraktion">
                      <option value="">— keine —</option>
                      <option v-for="f in fraktionenMitNamen" :key="f.id" :value="f.name">{{ f.name }}</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input
                        id="zfn-aufenthaltsort"
                        class="form-control"
                        v-model="bearbeitung.zeile.aufenthaltsort"
                        placeholder=" "
                        autocomplete="off" />
                      <label for="zfn-aufenthaltsort">Aufenthaltsort</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfn-ziel" class="form-control" v-model="bearbeitung.zeile.ziel" placeholder=" " />
                      <label for="zfn-ziel">Ziel (z. B. Wohlstand, Lebenswandel)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-stimme" class="form-control" v-model="bearbeitung.zeile.stimme" placeholder=" " />
                      <label for="zfn-stimme">Stimme</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-waffe" class="form-control" v-model="bearbeitung.zeile.waffe" placeholder=" " />
                      <label for="zfn-waffe">Waffe</label>
                    </div>
                  </div>
                </div>
                <div class="row g-2 align-items-end">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-schaden" class="form-control" v-model="bearbeitung.zeile.schadenswert" placeholder=" " />
                      <label for="zfn-schaden">Schadenswert</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfn-kampfart">Kampfart</label>
                    <select id="zfn-kampfart" class="form-select" v-model="bearbeitung.zeile.kampfart">
                      <option value="nahkampf">Nahkampf</option>
                      <option value="fernkampf">Fernkampf</option>
                    </select>
                  </div>
                </div>
              </template>

              <template v-else-if="bearbeitung.typ === 'ort'">
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfo-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                      <label for="zfo-name">Name</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfo-groesse" class="form-control" v-model="bearbeitung.zeile.groesse" placeholder=" " />
                      <label for="zfo-groesse">Größe</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfo-lage" class="form-control" v-model="bearbeitung.zeile.lage" placeholder=" " />
                      <label for="zfo-lage">Lage (z. B. Wald, Hafenstadt, Fluss, Insel)</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfo-zustand" class="form-control" v-model="bearbeitung.zeile.zustand" placeholder=" " />
                      <label for="zfo-zustand">Zustand (z. B. zerstört, intakt, florierend)</label>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="bearbeitung.typ === 'fraktion'">
                <div class="row g-2 mb-2 align-items-end" v-if="bearbeitungIndex < 0">
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zff-epoche">Epoche für Namensvorschlag</label>
                    <select id="zff-epoche" class="form-select form-select-sm" v-model="zufallFraktionEpoche">
                      <option value="mittelalter">Mittelalter</option>
                      <option value="gegenwart">Gegenwart</option>
                      <option value="zukunft">Zukunft</option>
                    </select>
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zff-art" class="form-control" v-model="bearbeitung.zeile.art" placeholder=" " />
                      <label for="zff-art">Art (z. B. Gilde, Partei, Bande)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zff-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                      <label for="zff-name">Name</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zff-ziel" class="form-control" v-model="bearbeitung.zeile.ziel" placeholder=" " />
                      <label for="zff-ziel">Ziel</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <textarea id="zff-ges" class="form-control" v-model="bearbeitung.zeile.gesinnungVerhalten" placeholder=" " style="height: 5rem"></textarea>
                      <label for="zff-ges">Gesinnung / Verhalten</label>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="bearbeitung.typ === 'pantheon'">
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfp-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                      <label for="zfp-name">Name</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfp-geschlecht" class="form-control" v-model="bearbeitung.zeile.geschlecht" placeholder=" " />
                      <label for="zfp-geschlecht">Geschlecht / Darstellung</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfp-dom" class="form-control" v-model="bearbeitung.zeile.domaene" placeholder=" " />
                      <label for="zfp-dom">Wofür steht die Gottheit (Domäne)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea id="zfp-ch" class="form-control" v-model="bearbeitung.zeile.charakter" placeholder=" " style="height: 4.5rem"></textarea>
                      <label for="zfp-ch">Charakter (z. B. rachsüchtig, gütig)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea id="zfp-st" class="form-control" v-model="bearbeitung.zeile.staerke" placeholder=" " style="height: 4.5rem"></textarea>
                      <label for="zfp-st">Stärken</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea id="zfp-sw" class="form-control" v-model="bearbeitung.zeile.schwaeche" placeholder=" " style="height: 4.5rem"></textarea>
                      <label for="zfp-sw">Schwächen</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea id="zfp-pat" class="form-control" v-model="bearbeitung.zeile.schutzpatronat" placeholder=" " style="height: 4.5rem"></textarea>
                      <label for="zfp-pat">Schutzpatronat (wer / was)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea id="zfp-ver" class="form-control" v-model="bearbeitung.zeile.verlangen" placeholder=" " style="height: 4.5rem"></textarea>
                      <label for="zfp-ver">Was verlangt sie (Opfer, Gebote)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <textarea id="zfp-myth" class="form-control" v-model="bearbeitung.zeile.mythosGaben" placeholder=" " style="height: 4.5rem"></textarea>
                      <label for="zfp-myth">Mythos: Was wird erzählt, dass sie geben würde</label>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="bearbeitung.typ === 'gegenstand'">
                <div class="row g-2 mb-2 align-items-end" v-if="bearbeitungIndex < 0">
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfg-epoche">Epoche für Zufallsvorschlag</label>
                    <select id="zfg-epoche" class="form-select form-select-sm" v-model="zufallGegenstandEpoche">
                      <option value="mittelalter">Mittelalter</option>
                      <option value="gegenwart">Gegenwart</option>
                      <option value="zukunft">Zukunft</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check mt-3">
                      <input id="zfg-kleidung" class="form-check-input" type="checkbox" v-model="zufallGegenstandKleidung" />
                      <label class="form-check-label small" for="zfg-kleidung">Kleidung als Kategorie zulassen</label>
                    </div>
                  </div>
                </div>
                <div class="form-floating mb-3">
                  <input id="zfg-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                  <label for="zfg-name">Name</label>
                </div>
                <div class="form-check mb-3">
                  <input id="zfg-waffe" class="form-check-input" type="checkbox" v-model="bearbeitung.zeile.istWaffe" />
                  <label class="form-check-label" for="zfg-waffe">Waffe</label>
                </div>
                <div class="row g-2 mb-1 align-items-end" v-if="bearbeitung.zeile.istWaffe">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input
                        id="zfg-schaden"
                        class="form-control"
                        v-model="bearbeitung.zeile.schadenswert"
                        placeholder=" "
                        autocomplete="off" />
                      <label for="zfg-schaden">Schadenswert (z. B. 2W10+1)</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfg-kampfart">Kampfart</label>
                    <select id="zfg-kampfart" class="form-select" v-model="bearbeitung.zeile.kampfart">
                      <option value="nahkampf">Nahkampf</option>
                      <option value="fernkampf">Fernkampf</option>
                      <option value="sonstiges">Sonstiges / andere</option>
                    </select>
                  </div>
                </div>
              </template>

              <div class="mt-3 mb-3">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <label class="form-label mb-0">Medien & Dateien</label>
                  <label class="btn btn-sm btn-outline-secondary mb-0">
                    Hochladen
                    <input
                      type="file"
                      class="d-none"
                      multiple
                      @change="onBearbeitungsMedienDateienGewaehlt" />
                  </label>
                </div>
                <div v-if="!medienAusZeile(bearbeitung.zeile).length" class="text-secondary small">
                  Noch keine Medien.
                </div>
                <div v-else class="row g-2">
                  <div
                    v-for="(medium, mediumIndex) in medienAusZeile(bearbeitung.zeile)"
                    :key="'bearbeitung-medium-' + medium.id"
                    class="col-12 col-md-6">
                    <div class="border rounded p-2 h-100 zufallstabellen-medium-karte">
                      <button
                        v-if="mediumIstBild(medium)"
                        type="button"
                        class="zufallstabellen-medium-thumb-button mb-2"
                        @click="mediumImBildbetrachterOeffnen(medium)">
                        <img :src="medium.dataUrl" :alt="mediumDateiname(medium)" />
                      </button>
                      <div class="d-flex justify-content-between align-items-start gap-2">
                        <div class="small">
                          <div class="fw-semibold">{{ mediumDateiname(medium) }}</div>
                          <div class="text-secondary">{{ mediumDateiTypLabel(medium) }}</div>
                          <div v-if="mediumDateigroesseLabel(medium)" class="text-secondary">
                            {{ mediumDateigroesseLabel(medium) }}
                          </div>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-1">
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            @click="mediumHerunterladen(medium)">
                            Download
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            @click="mediumAusBearbeitungEntfernen(mediumIndex)">
                            Entfernen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <label class="form-label mt-3 mb-1" v-if="bearbeitung.typ === 'npc'">Notizen</label>
              <label class="form-label mt-3 mb-1" v-else-if="bearbeitung.typ === 'pantheon'">Notizen & Mythos</label>
              <label class="form-label mt-3 mb-1" v-else>Beschreibung</label>
              <div
                class="zufallstabellen-quill-wrap"
                :key="'zeile-q-' + zeileQuillSession">
                <div
                  :ref="zeileQuillHostRefFn"
                  class="quill-editor-host zufallstabellen-quill-host"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
              <button type="button" class="btn btn-primary" @click="zeileSpeichern">Speichern</button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="htbahZufallstabellenGalerieModal"
        ref="galerieModalElement"
        tabindex="-1"
        aria-labelledby="htbahZufallstabellenGalerieModalLabel"
        aria-hidden="true"
        @hidden.bs.modal="onGalerieModalHidden">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="htbahZufallstabellenGalerieModalLabel">Medien</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start">
              <div v-if="!galerieModalZeile || !medienAnzahl(galerieModalZeile)" class="text-secondary small">
                Für diesen Eintrag sind keine Medien hinterlegt.
              </div>
              <template v-else>
                <h6 class="small text-secondary text-uppercase mb-2">Bilder</h6>
                <div v-if="!medienBilderAusZeile(galerieModalZeile).length" class="small text-secondary mb-3">
                  Keine Bilder.
                </div>
                <div v-else class="row g-2 mb-3">
                  <div
                    v-for="bild in medienBilderAusZeile(galerieModalZeile)"
                    :key="'galerie-bild-' + bild.id"
                    class="col-6 col-md-4">
                    <button
                      type="button"
                      class="zufallstabellen-galerie-thumb"
                      @click="mediumImBildbetrachterOeffnen(bild)">
                      <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                    </button>
                    <div class="small mt-1 text-truncate">{{ mediumDateiname(bild) }}</div>
                  </div>
                </div>

                <h6 class="small text-secondary text-uppercase mb-2">Dateien</h6>
                <div v-if="!medienDateienAusZeile(galerieModalZeile).length" class="small text-secondary">
                  Keine weiteren Dateien.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div
                    v-for="datei in medienDateienAusZeile(galerieModalZeile)"
                    :key="'galerie-datei-' + datei.id"
                    class="list-group-item px-0">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                      <div class="small">
                        <div class="fw-semibold">{{ mediumDateiname(datei) }}</div>
                        <div class="text-secondary">{{ mediumDateiTypLabel(datei) }}</div>
                        <div v-if="mediumDateigroesseLabel(datei)" class="text-secondary">
                          {{ mediumDateigroesseLabel(datei) }}
                        </div>
                      </div>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="mediumHerunterladen(datei)">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <bestaetigen-modal ref="zufallstabellenBestaetigen" modal-id="htbahZufallstabellenBestaetigen" />
    </div>
  `,
};
