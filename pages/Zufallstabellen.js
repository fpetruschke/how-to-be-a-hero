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
  props: {
    eingebettet: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    WeltenbauBildImportModal: window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal,
    ZufallstabellenZeileModal: window.HTBAH_KOMPONENTEN.ZufallstabellenZeileModal,
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
      zuLoeschendeZeile: null,
      zufallNpcEpoche: 'mittelalter',
      zufallGegenstandEpoche: 'mittelalter',
      zufallGegenstandKleidung: true,
      zufallFraktionEpoche: 'mittelalter',
      zufallRaetselEpoche: 'mittelalter',
      /** Stabile Funktion für :ref (wie InventarModal), kein String-ref im Modal */
      zeileQuillHostRefFn: null,
      sucheOrte: '',
      sucheFraktionen: '',
      sucheNpcs: '',
      sucheGegenstaende: '',
      suchePantheon: '',
      sucheRaetsel: '',
      sucheBestien: '',
      /** Filtert alle Tabellen gleichzeitig (zusätzlich zu den Feldern pro Kategorie) */
      sucheGlobal: '',
      medienImportWarteschlange: [],
      galerieModalInstanz: null,
      galerieModalZeile: null,
      /** { typ, zeile } — Zeile als Deep-Kopie, nur Anzeige */
      detailAnsicht: null,
      detailAnsichtModalInstanz: null,
    };
  },
  created() {
    this.zeileQuillHostRefFn = (el) => {
      this.zeileQuillHostRef(el);
    };
  },
  computed: {
    rootKlassen() {
      return this.eingebettet ? '' : 'container content py-3';
    },
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
      if (this.bearbeitung.typ === 'raetsel') {
        return `${neu}🧩 Rätsel`;
      }
      if (this.bearbeitung.typ === 'bestie') {
        return `${neu}🦁 Bestarium`;
      }
      return `${neu}📦 Gegenstand`;
    },
    zufallsgeneratorBereit() {
      return !!(window.HTBAH && window.HTBAH.Zufallsgenerator);
    },
    detailAnsichtTitel() {
      if (!this.detailAnsicht) {
        return '';
      }
      const t = this.detailAnsicht.typ;
      if (t === 'npc') {
        return '👤 NPC · Übersicht';
      }
      if (t === 'ort') {
        return '🗺️ Ort · Übersicht';
      }
      if (t === 'fraktion') {
        return '🏛️ Fraktion · Übersicht';
      }
      if (t === 'pantheon') {
        return '✨ Gottheit · Übersicht';
      }
      if (t === 'raetsel') {
        return '🧩 Rätsel · Übersicht';
      }
      if (t === 'bestie') {
        return '🦁 Bestie · Übersicht';
      }
      return '📦 Gegenstand · Übersicht';
    },
    detailAnsichtFelder() {
      if (!this.detailAnsicht) {
        return [];
      }
      const z = this.detailAnsicht.zeile;
      const typ = this.detailAnsicht.typ;
      const plain = (label, val) => ({
        label,
        text: val != null ? String(val) : '',
        html: null,
      });
      const rich = (label, html) => ({
        label,
        text: '',
        html: typeof html === 'string' ? html : '',
      });
      if (typ === 'ort') {
        return [
          plain('Name', z.name),
          plain('Größe', z.groesse),
          plain('Lage', z.lage),
          plain('Zustand', z.zustand),
          rich('Beschreibung / Notizen', z.notizenHtml),
        ];
      }
      if (typ === 'fraktion') {
        return [
          plain('Art', z.art),
          plain('Name', z.name),
          plain('Orte', this.fraktionOrteText(z)),
          plain('Ziel', z.ziel),
          plain('Gesinnung / Verhalten', z.gesinnungVerhalten),
          rich('Beschreibung', z.beschreibungHtml),
        ];
      }
      if (typ === 'npc') {
        return [
          plain('Name', z.name),
          plain('Spitzname', z.spitzname),
          plain('Geschlecht', z.geschlecht),
          plain('Alter', z.alter),
          plain('Familienstand', z.familienstand),
          plain('Statur', z.statur),
          plain('Lebenspunkte', z.lebenspunkte),
          plain('Gesinnung', z.gesinnung),
          plain('Handeln (Begabungswert)', z.handeln),
          plain('Wissen (Begabungswert)', z.wissen),
          plain('Soziales (Begabungswert)', z.soziales),
          plain('Glaube', z.glaube),
          plain('Beruf', z.beruf),
          plain('Fraktion', z.fraktion),
          plain('Aufenthaltsort', z.aufenthaltsort),
          plain('Ziel', z.ziel),
          plain('Stimme', z.stimme),
          plain('Waffe', z.waffe),
          plain('Schadenswert Nahkampf', z.schadenswertNahkampf),
          plain('Schadenswert Fernkampf', z.schadenswertFernkampf),
          plain('Initiative', z.initiative),
          rich('Notizen', z.notizenHtml),
        ];
      }
      if (typ === 'gegenstand') {
        const waffenText = this.gegenstandWaffenWerteText(z);
        const istWaffe = z && z.istWaffe ? 'Ja' : 'Nein';
        return [
          plain('Name', z.name),
          plain('Aufenthaltsort', z.aufenthaltsort),
          plain('Ist Waffe / Kampfgegenstand', istWaffe),
          plain('Kampfwerte', waffenText),
          plain('Initiative', z.initiative),
          rich('Beschreibung', z.beschreibungHtml),
        ];
      }
      if (typ === 'pantheon') {
        return [
          plain('Name', z.name),
          plain('Geschlecht / Darstellung', z.geschlecht),
          plain('Domäne', z.domaene),
          plain('Charakter', z.charakter),
          plain('Stärken', z.staerke),
          plain('Schwächen', z.schwaeche),
          plain('Schutzpatronat', z.schutzpatronat),
          plain('Verlangen / Opfer / Gebote', z.verlangen),
          plain('Mythos: Gaben (Erzähltes)', z.mythosGaben),
          rich('Notizen & Mythos (formatiert)', z.notizenHtml),
        ];
      }
      if (typ === 'raetsel') {
        return [
          plain('Art', z.art),
          plain('Titel / Stichwort', z.titel),
          plain('Aufenthaltsort', z.aufenthaltsort),
          plain('Gelöst', z.geloest ? 'Ja' : 'Nein'),
          plain('Was könnte die Aufgabe sein?', z.aufgabeWas),
          plain('Wie könnte die Aufgabenstellung lauten?', z.aufgabenstellung),
          plain('Ergebnis', z.ergebnis),
          plain('Schwierigkeit', z.schwierigkeit),
          rich('Aufgabe, Spielleitung & Notizen', z.notizenHtml),
        ];
      }
      if (typ === 'bestie') {
        return [
          plain('Epoche', this.bestieEpocheLabel(z.epoche)),
          plain('Kategorie', this.bestieKategorieLabel(z.kategorie)),
          plain('Name', z.name),
          plain('Waffe', z.waffe),
          plain('Schadenswert Nahkampf', z.schadenswertNahkampf),
          plain('Schadenswert Fernkampf', z.schadenswertFernkampf),
          plain('Angriff', z.angriff),
          plain('Verteidigung', z.verteidigung),
          plain('Lebenspunkte', z.lebenspunkte),
          plain('Handeln (Begabungswert)', z.handeln),
          plain('Wissen (Begabungswert)', z.wissen),
          plain('Soziales (Begabungswert)', z.soziales),
          plain('Aufenthaltsort', z.aufenthaltsort),
          plain('Initiative', z.initiative),
          plain('Aggressivität (1–10)', this.bestieAggressivitaetText(z)),
          plain('Stärken', z.staerke),
          plain('Schwächen', z.schwaeche),
          rich('Lebensraum, Lebensweise und Legende', z.beschreibungHtml),
        ];
      }
      return [];
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
    orteNamenListe() {
      return (this.zustand.orte || [])
        .map((o) => (o && o.name ? String(o.name).trim() : ''))
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
          ['art', 'name', 'ziel', 'gesinnungVerhalten', 'beschreibungHtml', 'orte'],
          q,
          this.fraktionOrteText(row),
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
          'handeln',
          'wissen',
          'soziales',
          'gesinnung',
          'glaube',
          'beruf',
          'fraktion',
          'aufenthaltsort',
          'ziel',
          'geheimnis',
          'stimme',
          'waffe',
          'schadenswertNahkampf',
          'schadenswertFernkampf',
          'initiative',
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
          [
            'name',
            'schadenswertNahkampf',
            'schadenswertFernkampf',
            'aufenthaltsort',
            'initiative',
            'beschreibungHtml',
          ],
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
    gefilterteRaetsel() {
      const q = this.normSucheText(this.sucheRaetsel);
      if (!q) {
        return this.zustand.raetsel || [];
      }
      return (this.zustand.raetsel || []).filter((row) =>
        this.trifftSucheZu(
          row,
          ['art', 'titel', 'aufenthaltsort', 'aufgabeWas', 'aufgabenstellung', 'ergebnis', 'schwierigkeit', 'geloest', 'notizenHtml'],
          q,
        ),
      );
    },
    gefilterteBestien() {
      const q = this.normSucheText(this.sucheBestien);
      if (!q) {
        return this.zustand.bestien || [];
      }
      return (this.zustand.bestien || []).filter((row) => {
        const ep = this.bestieEpocheLabel(row.epoche);
        const kat = this.bestieKategorieLabel(row.kategorie);
        return this.trifftSucheZu(
          row,
          [
            'name',
            'angriff',
            'verteidigung',
            'lebenspunkte',
            'handeln',
            'wissen',
            'soziales',
            'aufenthaltsort',
            'initiative',
            'staerke',
            'schwaeche',
            'geheimnis',
            'beschreibungHtml',
          ],
          q,
          `${ep} ${kat}`,
        );
      });
    },
    globaleSucheAktiv() {
      return !!this.normSucheText(this.sucheGlobal);
    },
    anzeigeOrte() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteOrte;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(row, ['name', 'groesse', 'lage', 'zustand', 'notizenHtml'], gq),
      );
    },
    anzeigeFraktionen() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteFraktionen;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(row, ['art', 'name', 'ziel', 'gesinnungVerhalten', 'beschreibungHtml'], gq),
      );
    },
    anzeigeNpcs() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteNpcs;
      if (!gq) {
        return base;
      }
      return base.filter((row) => {
        const felder = [
          'name',
          'spitzname',
          'geschlecht',
          'alter',
          'familienstand',
          'statur',
          'lebenspunkte',
          'handeln',
          'wissen',
          'soziales',
          'gesinnung',
          'glaube',
          'beruf',
          'fraktion',
          'aufenthaltsort',
          'ziel',
          'geheimnis',
          'stimme',
          'waffe',
          'schadenswertNahkampf',
          'schadenswertFernkampf',
          'initiative',
          'notizenHtml',
        ];
        return this.trifftSucheZu(row, felder, gq, this.npcWaffenWerteText(row));
      });
    },
    anzeigeGegenstaende() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteGegenstaende;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(
          row,
          [
            'name',
            'schadenswertNahkampf',
            'schadenswertFernkampf',
            'aufenthaltsort',
            'initiative',
            'beschreibungHtml',
          ],
          gq,
          this.gegenstandWaffenWerteText(row),
        ),
      );
    },
    anzeigePantheon() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefiltertesPantheon;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
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
          gq,
        ),
      );
    },
    anzeigeRaetsel() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteRaetsel;
      if (!gq) {
        return base;
      }
      return base.filter((row) =>
        this.trifftSucheZu(row, ['art', 'titel', 'aufenthaltsort', 'aufgabeWas', 'aufgabenstellung', 'ergebnis', 'schwierigkeit', 'geloest', 'notizenHtml'], gq),
      );
    },
    anzeigeBestien() {
      const gq = this.normSucheText(this.sucheGlobal);
      const base = this.gefilterteBestien;
      if (!gq) {
        return base;
      }
      return base.filter((row) => {
        const ep = this.bestieEpocheLabel(row.epoche);
        const kat = this.bestieKategorieLabel(row.kategorie);
        return this.trifftSucheZu(
          row,
          ['name', 'angriff', 'verteidigung', 'lebenspunkte', 'handeln', 'wissen', 'soziales', 'aufenthaltsort', 'initiative', 'staerke', 'schwaeche', 'geheimnis', 'beschreibungHtml'],
          gq,
          `${ep} ${kat}`,
        );
      });
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
    /** Leer-Zelle in Tabellen: unterscheidet „noch keine Zeilen“ und „Suche ohne Treffer“ */
    zufallstabellenLeerNachricht(anzahlRoh, lokaleSuche) {
      const n = Number(anzahlRoh) || 0;
      if (!n) {
        return 'Noch keine Einträge.';
      }
      const qg = this.normSucheText(this.sucheGlobal);
      const ql = this.normSucheText(lokaleSuche);
      if (qg || ql) {
        return 'Keine Treffer für die aktuelle Suche.';
      }
      return 'Noch keine Einträge.';
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
    initiativeBadgeText(wert) {
      const text = this.zeilenWertAlsText(wert);
      return text || '';
    },
    raetselGeloest(row) {
      return !!(row && row.geloest);
    },
    normalisiereBegabungswert(roh) {
      const n = Math.round(Number(roh));
      if (Number.isNaN(n) || n < 0) {
        return 0;
      }
      return Math.min(40, n);
    },
    normalisiereInitiativeWert(roh, begabungswertHandeln) {
      const txt = String(roh == null ? '' : roh).trim();
      if (!txt) {
        return '';
      }
      const parsed = Math.round(Number(txt));
      if (Number.isNaN(parsed)) {
        return '';
      }
      const max = Math.max(1, 10 + this.normalisiereBegabungswert(begabungswertHandeln));
      const geklammert = Math.max(1, Math.min(max, parsed));
      return String(geklammert);
    },
    lebensstatusFuerZeile(row) {
      if (!row || typeof window.HTBAH.berechneLebenspunkteStatus !== 'function') {
        return { tot: false, bewusstlos: false };
      }
      return window.HTBAH.berechneLebenspunkteStatus(row);
    },
    statusEmoji(row) {
      const status = this.lebensstatusFuerZeile(row);
      if (status.tot) {
        return '💀';
      }
      if (status.bewusstlos) {
        return '😵';
      }
      return '';
    },
    statusZeilenKlasse(row) {
      const status = this.lebensstatusFuerZeile(row);
      if (status.tot) {
        return 'table-secondary text-body-secondary';
      }
      if (status.bewusstlos) {
        return 'table-warning';
      }
      return '';
    },
    statusCardKlasse(row) {
      const status = this.lebensstatusFuerZeile(row);
      if (status.tot) {
        return 'bg-secondary-subtle text-body-secondary border-secondary-subtle';
      }
      if (status.bewusstlos) {
        return 'bg-warning-subtle border-warning-subtle';
      }
      return '';
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
    featuredBildAusZeile(row) {
      const bilder = this.medienBilderAusZeile(row);
      if (!bilder.length) {
        return null;
      }
      const primaryId = row && typeof row.primaryMediumId === 'string' ? row.primaryMediumId.trim() : '';
      if (!primaryId) {
        return bilder[0];
      }
      return bilder.find((bild) => bild.id === primaryId) || bilder[0];
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
      const entfernt = this.bearbeitung.zeile.medien[index];
      this.bearbeitung.zeile.medien.splice(index, 1);
      const primaryId = String(this.bearbeitung.zeile.primaryMediumId || '').trim();
      if (!primaryId || !entfernt || primaryId !== entfernt.id) {
        return;
      }
      const fallback = this.medienBilderAusZeile(this.bearbeitung.zeile)[0];
      this.bearbeitung.zeile.primaryMediumId = fallback && fallback.id ? fallback.id : '';
    },
    mediumZurBearbeitungHinzufuegen(eintrag) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !eintrag) {
        return;
      }
      if (!Array.isArray(this.bearbeitung.zeile.medien)) {
        this.bearbeitung.zeile.medien = [];
      }
      this.bearbeitung.zeile.medien.push(eintrag);
      if (this.mediumIstBild(eintrag)) {
        const primaryId = String(this.bearbeitung.zeile.primaryMediumId || '').trim();
        if (!primaryId) {
          this.bearbeitung.zeile.primaryMediumId = eintrag.id;
        }
      }
    },
    setzeBearbeitungPrimaryMedium(mediumId) {
      if (!this.bearbeitung || !this.bearbeitung.zeile || !Array.isArray(this.bearbeitung.zeile.medien)) {
        return;
      }
      const id = typeof mediumId === 'string' ? mediumId.trim() : '';
      if (!id) {
        return;
      }
      const medium = this.bearbeitung.zeile.medien.find((m) => m && m.id === id);
      if (!this.mediumIstBild(medium)) {
        return;
      }
      this.bearbeitung.zeile.primaryMediumId = id;
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
    detailRichTextAnzeige(html) {
      const inhalt = typeof html === 'string' ? html : '';
      return inhalt.trim() ? inhalt : '';
    },
    detailAnsichtOeffnen(typ, row) {
      if (!row) {
        return;
      }
      const zeileKopie = JSON.parse(JSON.stringify(row));
      if (!Array.isArray(zeileKopie.medien)) {
        zeileKopie.medien = [];
      }
      this.detailAnsicht = { typ, zeile: zeileKopie };
      this.$nextTick(() => {
        const el = this.$refs.detailAnsichtModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.detailAnsichtModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.detailAnsichtModalInstanz.show();
      });
    },
    onDetailAnsichtModalHidden() {
      this.detailAnsicht = null;
      this.detailAnsichtModalInstanz = null;
    },
    detailAnsichtBearbeiten() {
      const d = this.detailAnsicht;
      if (!d) {
        return;
      }
      const { typ, zeile } = d;
      const id = zeile && zeile.id;
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else if (typ === 'raetsel') {
        liste = this.zustand.raetsel;
      } else if (typ === 'bestie') {
        liste = this.zustand.bestien;
      } else {
        liste = this.zustand.gegenstaende;
      }
      const idx = this.indexNachId(liste, id);
      const row = idx >= 0 ? liste[idx] : zeile;
      const el = this.$refs.detailAnsichtModalElement;
      const oeffneBearbeiten = () => {
        if (typ === 'npc') {
          this.npcBearbeiten(row, idx);
        } else if (typ === 'ort') {
          this.ortBearbeiten(row, idx);
        } else if (typ === 'fraktion') {
          this.fraktionBearbeiten(row, idx);
        } else if (typ === 'pantheon') {
          this.pantheonBearbeiten(row, idx);
        } else if (typ === 'raetsel') {
          this.raetselBearbeiten(row, idx);
        } else if (typ === 'bestie') {
          this.bestieBearbeiten(row, idx);
        } else {
          this.gegenstandBearbeiten(row, idx);
        }
      };
      if (this.detailAnsichtModalInstanz && el) {
        const einmal = () => {
          el.removeEventListener('hidden.bs.modal', einmal);
          oeffneBearbeiten();
        };
        el.addEventListener('hidden.bs.modal', einmal);
        this.detailAnsichtModalInstanz.hide();
      } else {
        oeffneBearbeiten();
      }
    },
    npcWaffenWerteText(row) {
      const schadenswertNahkampf = String(
        row && row.schadenswertNahkampf ? row.schadenswertNahkampf : '',
      ).trim();
      const schadenswertFernkampf = String(
        row && row.schadenswertFernkampf ? row.schadenswertFernkampf : '',
      ).trim();
      const teile = [];
      if (schadenswertNahkampf) {
        teile.push(`Nahkampf ${schadenswertNahkampf}`);
      }
      if (schadenswertFernkampf) {
        teile.push(`Fernkampf ${schadenswertFernkampf}`);
      }
      if (!teile.length) {
        return '—';
      }
      return teile.join(' · ');
    },
    bestieEpocheLabel(epoche) {
      if (epoche === 'gegenwart') {
        return 'Gegenwart';
      }
      if (epoche === 'zukunft') {
        return 'Zukunft';
      }
      return 'Mittelalter';
    },
    bestieKategorieLabel(kategorie) {
      if (kategorie === 'fantasy_tier') {
        return 'Magisch / Fantasy';
      }
      if (kategorie === 'mutiert') {
        return 'Mutiert';
      }
      if (kategorie === 'monster') {
        return 'Monster';
      }
      return 'Normales Tier';
    },
    bestieAggressivitaetText(row) {
      const n = row && Number(row.aggressivitaetSkala);
      if (!Number.isFinite(n)) {
        return '—';
      }
      const k = Math.min(10, Math.max(1, Math.round(n)));
      return `${k} / 10`;
    },
    begabungswerteKurzText(row) {
      if (!row || typeof row !== 'object') {
        return 'H 0 · W 0 · S 0';
      }
      const h = this.normalisiereBegabungswert(row.handeln);
      const w = this.normalisiereBegabungswert(row.wissen);
      const s = this.normalisiereBegabungswert(row.soziales);
      return `H ${h} · W ${w} · S ${s}`;
    },
    gegenstandWaffenWerteText(row) {
      if (!row || !row.istWaffe) {
        return '—';
      }
      const schadenswertNahkampf = String(row.schadenswertNahkampf || '').trim();
      const schadenswertFernkampf = String(row.schadenswertFernkampf || '').trim();
      const teile = [];
      if (schadenswertNahkampf) {
        teile.push(`Nahkampf ${schadenswertNahkampf}`);
      }
      if (schadenswertFernkampf) {
        teile.push(`Fernkampf ${schadenswertFernkampf}`);
      }
      return teile.length ? teile.join(' · ') : '—';
    },
    fraktionOrteListe(row) {
      if (!row || typeof row !== 'object') {
        return [];
      }
      const orte = Array.isArray(row.orte)
        ? row.orte.map((ort) => (typeof ort === 'string' ? ort.trim() : '')).filter(Boolean)
        : [];
      if (orte.length) {
        return orte;
      }
      const legacy = typeof row.aufenthaltsort === 'string' ? row.aufenthaltsort.trim() : '';
      return legacy ? [legacy] : [];
    },
    fraktionOrteText(row) {
      const orte = this.fraktionOrteListe(row);
      return orte.length ? orte.join(', ') : '';
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
        geheimnis: '',
        stimme: '',
        lebenspunkte: '',
        lpBewusstlosAusgeblendet: false,
        lpMassenschadenBewusstlos: false,
        waffe: '',
        schadenswertNahkampf: '',
        schadenswertFernkampf: '',
        aufenthaltsort: '',
        handeln: 12,
        wissen: 14,
        soziales: 14,
        initiative: '',
        fraktion: '',
        glaube: '',
        notizenHtml: '',
        medien: [],
        primaryMediumId: '',
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
        primaryMediumId: '',
      };
    },
    gegenstandLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        beschreibungHtml: '',
        istWaffe: false,
        schadenswertNahkampf: '',
        schadenswertFernkampf: '',
        aufenthaltsort: '',
        handeln: 16,
        wissen: 8,
        soziales: 16,
        initiative: '',
        lpBewusstlosAusgeblendet: false,
        lpMassenschadenBewusstlos: false,
        medien: [],
        primaryMediumId: '',
      };
    },
    fraktionLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        art: '',
        name: '',
        ziel: '',
        gesinnungVerhalten: '',
        orte: [],
        beschreibungHtml: '',
        medien: [],
        primaryMediumId: '',
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
    raetselLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        art: '',
        titel: '',
        aufenthaltsort: '',
        aufgabeWas: '',
        aufgabenstellung: '',
        ergebnis: '',
        schwierigkeit: '',
        geloest: false,
        notizenHtml: '',
        medien: [],
        primaryMediumId: '',
      };
    },
    bestieLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        epoche: 'mittelalter',
        kategorie: 'normales_tier',
        name: '',
        waffe: '',
        schadenswertNahkampf: '',
        schadenswertFernkampf: '',
        angriff: '',
        verteidigung: '',
        lebenspunkte: '',
        aufenthaltsort: '',
        initiative: '',
        lpBewusstlosAusgeblendet: false,
        lpMassenschadenBewusstlos: false,
        staerke: '',
        schwaeche: '',
        geheimnis: '',
        beschreibungHtml: '',
        aggressivitaetSkala: 5,
        medien: [],
        primaryMediumId: '',
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
      if (typeof zeileKopie.primaryMediumId !== 'string') {
        zeileKopie.primaryMediumId = '';
      }
      if (typ === 'fraktion') {
        zeileKopie.orte = this.fraktionOrteListe(zeileKopie);
      }
      this.bearbeitung = {
        typ,
        zeile: zeileKopie,
      };
      this.bearbeitungIndex = index;
      this.$nextTick(() => this.zeileQuillOrphanToolbarsInModalBodyEntfernen());
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
    raetselHinzufuegen() {
      this.zeileModalOeffnen('raetsel', this.raetselLeer(), -1);
    },
    raetselBearbeiten(row, index) {
      this.zeileModalOeffnen('raetsel', row, index);
    },
    bestieHinzufuegen() {
      this.zeileModalOeffnen('bestie', this.bestieLeer(), -1);
    },
    bestieBearbeiten(row, index) {
      this.zeileModalOeffnen('bestie', row, index);
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
      if (this.bearbeitung.typ === 'bestie') {
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
    schliesseZeileModal() {
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
      if (
        this.bearbeitung.typ === 'gegenstand' ||
        this.bearbeitung.typ === 'fraktion' ||
        this.bearbeitung.typ === 'bestie'
      ) {
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
      } else if (typ === 'raetsel') {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        const npcNamen = (this.zustand.npcs || []).map((n) => (n && n.name ? String(n.name) : ''));
        felder = G.raetsel({
          epoche: this.zufallRaetselEpoche,
          orteNamen,
          npcNamen,
        });
      } else if (typ === 'bestie') {
        const ep = z && z.epoche ? String(z.epoche) : 'mittelalter';
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        felder = G.bestie({ epoche: ep, orteNamen });
      } else {
        const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
        felder = G.gegenstand({
          epoche: this.zufallGegenstandEpoche,
          mitKleidung: this.zufallGegenstandKleidung,
          orteNamen,
        });
      }
      Object.assign(z, felder);
      if ((typ === 'bestie' || typ === 'gegenstand' || typ === 'raetsel') && !String(z.aufenthaltsort || '').trim()) {
        const ortMitNamen = (this.zustand.orte || []).find((o) => String((o && o.name) || '').trim());
        z.aufenthaltsort = ortMitNamen ? String(ortMitNamen.name).trim() : '';
      }
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    zeileSpeichern() {
      if (!this.bearbeitung) {
        return;
      }
      this.quillHtmlInBearbeitungSchreiben();
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      if (typ === 'bestie' && z) {
        let a = Number(z.aggressivitaetSkala);
        if (!Number.isFinite(a)) {
          a = 5;
        }
        a = Math.min(10, Math.max(1, Math.round(a)));
        z.aggressivitaetSkala = a;
      }
      if (typ === 'npc' && z) {
        z.handeln = this.normalisiereBegabungswert(z.handeln);
        z.wissen = this.normalisiereBegabungswert(z.wissen);
        z.soziales = this.normalisiereBegabungswert(z.soziales);
        z.initiative = this.normalisiereInitiativeWert(z.initiative, z.handeln);
      } else if (typ === 'bestie' && z) {
        z.handeln = this.normalisiereBegabungswert(z.handeln);
        z.wissen = this.normalisiereBegabungswert(z.wissen);
        z.soziales = this.normalisiereBegabungswert(z.soziales);
        z.initiative = this.normalisiereInitiativeWert(z.initiative, z.handeln);
      } else if (typ === 'gegenstand' && z) {
        z.initiative = this.normalisiereInitiativeWert(z.initiative, 40);
      } else if (typ === 'fraktion' && z) {
        z.orte = this.fraktionOrteListe(z);
      }
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else if (typ === 'fraktion') {
        liste = this.zustand.fraktionen;
      } else if (typ === 'pantheon') {
        liste = this.zustand.pantheon;
      } else if (typ === 'raetsel') {
        liste = this.zustand.raetsel;
      } else if (typ === 'bestie') {
        liste = this.zustand.bestien;
      } else {
        liste = this.zustand.gegenstaende;
      }
      if (this.bearbeitungIndex < 0) {
        liste.push(z);
      } else {
        liste[this.bearbeitungIndex] = z;
      }
      this.persist();
      this.schliesseZeileModal();
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
      } else if (typ === 'raetsel') {
        liste = this.zustand.raetsel;
      } else if (typ === 'bestie') {
        liste = this.zustand.bestien;
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
        raetsel: '🧩 Rätsel',
        bestien: '🦁 Bestarium',
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
          } else if (typ === 'raetsel') {
            this.zustand.raetsel = [];
          } else if (typ === 'bestien') {
            this.zustand.bestien = [];
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
    <div :class="rootKlassen">
      <weltenbau-bild-import-modal
        ref="zufallstabellenBildImportModal"
        @fertig="onZufallstabellenBildImportFertig"
        @abgebrochen="onZufallstabellenBildImportAbgebrochen"
        @datei-import-fehler="onZufallstabellenBildImportFehler" />

      <div class="mb-4">
        <div class="input-group">
          <span class="input-group-text text-secondary" aria-hidden="true">
            <span class="material-symbols-outlined" style="font-size: 1.25rem; line-height: 1;">search</span>
          </span>
          <input
            id="zufallstabellen-suche-global"
            v-model.trim="sucheGlobal"
            type="search"
            class="form-control"
            placeholder="Alle Tabellen durchsuchen …"
            autocomplete="off"
            aria-label="Alle Tabellen durchsuchen" />
        </div>
        <p v-if="globaleSucheAktiv" class="small text-secondary mb-0 mt-2">
          Pro Kategorie siehst du die Treffer oder den Hinweis, dass es dort keine gibt.
        </p>
      </div>

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
                <tr v-if="!anzeigeOrte.length">
                  <td colspan="6" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.orte || []).length, sucheOrte) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeOrte"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="detailAnsichtOeffnen('ort', row)">
                  <td>
                    {{ karteWert(row.name) }}
                    <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                      INI {{ initiativeBadgeText(row.initiative) }}
                    </span>
                  </td>
                  <td>{{ karteWert(row.groesse) }}</td>
                  <td>{{ karteWert(row.lage) }}</td>
                  <td>{{ karteWert(row.zustand) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
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
            <div v-if="!anzeigeOrte.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.orte || []).length, sucheOrte) }}
            </div>
            <div
              v-for="row in anzeigeOrte"
              :key="'ort-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('ort', row)">
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                    INI {{ initiativeBadgeText(row.initiative) }}
                  </span>
                </div>
                <div class="small"><span class="text-secondary">Größe:</span> {{ karteWert(row.groesse) }}</div>
                <div class="small"><span class="text-secondary">Lage:</span> {{ karteWert(row.lage) }}</div>
                <div class="small mb-2"><span class="text-secondary">Zustand:</span> {{ karteWert(row.zustand) }}</div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
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
                  <th>Orte</th>
                  <th>Ziel</th>
                  <th>Gesinnung / Verhalten</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeFraktionen.length">
                  <td colspan="7" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.fraktionen || []).length, sucheFraktionen) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeFraktionen"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="detailAnsichtOeffnen('fraktion', row)">
                  <td>{{ karteWert(row.art) }}</td>
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small">{{ karteWert(fraktionOrteText(row)) }}</td>
                  <td class="small">{{ karteWert(row.ziel) }}</td>
                  <td class="small">{{ karteWert(row.gesinnungVerhalten) }}</td>
                  <td class="small">{{ textVorschau(row.beschreibungHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
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
            <div v-if="!anzeigeFraktionen.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.fraktionen || []).length, sucheFraktionen) }}
            </div>
            <div
              v-for="row in anzeigeFraktionen"
              :key="'fraktion-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('fraktion', row)">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Art:</span> {{ karteWert(row.art) }}</div>
                <div class="small"><span class="text-secondary">Orte:</span> {{ karteWert(fraktionOrteText(row)) }}</div>
                <div class="small"><span class="text-secondary">Ziel:</span> {{ karteWert(row.ziel) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Gesinnung:</span> {{ karteWert(row.gesinnungVerhalten) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
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
                  <th>Begabungen</th>
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
                <tr v-if="!anzeigeNpcs.length">
                  <td colspan="19" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.npcs || []).length, sucheNpcs) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeNpcs"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  :class="statusZeilenKlasse(row)"
                  @click="detailAnsichtOeffnen('npc', row)">
                  <td>
                    {{ karteWert(row.name) }}
                    <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                      INI {{ initiativeBadgeText(row.initiative) }}
                    </span>
                    <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                  </td>
                  <td>{{ karteWert(row.spitzname) }}</td>
                  <td>{{ karteWert(row.geschlecht) }}</td>
                  <td>{{ karteWert(row.alter) }}</td>
                  <td>{{ karteWert(row.familienstand) }}</td>
                  <td>{{ karteWert(row.statur) }}</td>
                  <td>{{ karteWert(row.lebenspunkte) }}</td>
                  <td>{{ karteWert(row.gesinnung) }}</td>
                  <td class="small text-nowrap">{{ begabungswerteKurzText(row) }}</td>
                  <td>{{ karteWert(row.glaube) }}</td>
                  <td>{{ karteWert(row.beruf) }}</td>
                  <td>{{ karteWert(row.fraktion) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td>{{ karteWert(row.ziel) }}</td>
                  <td>{{ karteWert(row.stimme) }}</td>
                  <td>{{ karteWert(row.waffe) }}</td>
                  <td class="small">{{ npcWaffenWerteText(row) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
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
            <div v-if="!anzeigeNpcs.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.npcs || []).length, sucheNpcs) }}
            </div>
            <div
              v-for="row in anzeigeNpcs"
              :key="'npc-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2"
              :class="statusCardKlasse(row)">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('npc', row)">
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                    INI {{ initiativeBadgeText(row.initiative) }}
                  </span>
                  <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                  <span v-if="zeilenWertAlsText(row.spitzname)" class="fw-normal text-secondary">({{ row.spitzname }})</span>
                </div>
                <div class="small"><span class="text-secondary">Beruf:</span> {{ karteWert(row.beruf) }}</div>
                <div class="small"><span class="text-secondary">Gesinnung:</span> {{ karteWert(row.gesinnung) }}</div>
                <div class="small"><span class="text-secondary">Begabungen:</span> {{ begabungswerteKurzText(row) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small"><span class="text-secondary">Fraktion:</span> {{ karteWert(row.fraktion) }}</div>
                <div class="small mb-2"><span class="text-secondary">Werte:</span> {{ npcWaffenWerteText(row) }}</div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
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
                  <th>Aufenthaltsort</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeGegenstaende.length">
                  <td colspan="5" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.gegenstaende || []).length, sucheGegenstaende) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeGegenstaende"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="detailAnsichtOeffnen('gegenstand', row)">
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small text-nowrap">{{ gegenstandWaffenWerteText(row) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td class="small">{{ textVorschau(row.beschreibungHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
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
            <div v-if="!anzeigeGegenstaende.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.gegenstaende || []).length, sucheGegenstaende) }}
            </div>
            <div
              v-for="row in anzeigeGegenstaende"
              :key="'gegenstand-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('gegenstand', row)">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Kampfwerte:</span> {{ gegenstandWaffenWerteText(row) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides my-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
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
                <tr v-if="!anzeigePantheon.length">
                  <td colspan="6" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.pantheon || []).length, suchePantheon) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigePantheon"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="detailAnsichtOeffnen('pantheon', row)">
                  <td>{{ karteWert(row.name) }}</td>
                  <td class="small">{{ karteWert(row.domaene) }}</td>
                  <td class="small">{{ karteWert(row.charakter) }}</td>
                  <td class="small">{{ karteWert(row.schutzpatronat) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
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
            <div v-if="!anzeigePantheon.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.pantheon || []).length, suchePantheon) }}
            </div>
            <div
              v-for="row in anzeigePantheon"
              :key="'pantheon-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('pantheon', row)">
                <div class="fw-semibold mb-1">{{ karteWert(row.name) }}</div>
                <div class="small"><span class="text-secondary">Domäne:</span> {{ karteWert(row.domaene) }}</div>
                <div class="small"><span class="text-secondary">Charakter:</span> {{ karteWert(row.charakter) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Schutzpatronat:</span> {{ karteWert(row.schutzpatronat) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
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

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">🧩 Rätsel</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('raetsel')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="raetselHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheRaetsel"
              type="search"
              class="form-control form-control-sm"
              placeholder="Rätsel durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Art</th>
                  <th>Titel</th>
                  <th>Ort</th>
                  <th>Status</th>
                  <th>Was ist die Aufgabe?</th>
                  <th>Aufgabenstellung</th>
                  <th>Ergebnis</th>
                  <th>Schwierigkeit</th>
                  <th>Details</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeRaetsel.length">
                  <td colspan="10" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.raetsel || []).length, sucheRaetsel) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeRaetsel"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  @click="detailAnsichtOeffnen('raetsel', row)">
                  <td class="small">{{ karteWert(row.art) }}</td>
                  <td>{{ karteWert(row.titel) }}</td>
                  <td class="small">{{ karteWert(row.aufenthaltsort) }}</td>
                  <td class="small">
                    <span v-if="raetselGeloest(row)" class="text-success d-inline-flex align-items-center" title="Gelöst">
                      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                    </span>
                    <span v-else>—</span>
                  </td>
                  <td class="small">{{ textVorschau(row.aufgabeWas, 56) }}</td>
                  <td class="small">{{ textVorschau(row.aufgabenstellung, 56) }}</td>
                  <td class="small">{{ karteWert(row.ergebnis) }}</td>
                  <td class="small">{{ karteWert(row.schwierigkeit) }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="raetselBearbeiten(row, indexNachId(zustand.raetsel, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('raetsel', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeRaetsel.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.raetsel || []).length, sucheRaetsel) }}
            </div>
            <div
              v-for="row in anzeigeRaetsel"
              :key="'raetsel-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('raetsel', row)">
                <div class="fw-semibold mb-1">{{ karteWert(row.titel) }}</div>
                <div class="small"><span class="text-secondary">Art:</span> {{ karteWert(row.art) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small mb-1">
                  <span class="text-secondary">Status:</span>
                  <span v-if="raetselGeloest(row)" class="text-success d-inline-flex align-items-center">
                    <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  </span>
                  <span v-else>Offen</span>
                </div>
                <div class="small"><span class="text-secondary">Aufgabe:</span> {{ textVorschau(row.aufgabeWas, 96) }}</div>
                <div class="small"><span class="text-secondary">Formulierung:</span> {{ textVorschau(row.aufgabenstellung, 96) }}</div>
                <div class="small"><span class="text-secondary">Ergebnis:</span> {{ karteWert(row.ergebnis) }}</div>
                <div class="small mb-2">
                  <span class="text-secondary">Schwierigkeit:</span> {{ karteWert(row.schwierigkeit) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.notizenHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.notizenHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="raetselBearbeiten(row, indexNachId(zustand.raetsel, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('raetsel', row.id)">
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
          <span class="fw-semibold">🦁 Bestarium</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('bestien')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="bestieHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="p-2 border-bottom">
            <input
              v-model.trim="sucheBestien"
              type="search"
              class="form-control form-control-sm"
              placeholder="Bestien durchsuchen…" />
          </div>
          <div class="table-responsive d-none d-md-block">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Epoche</th>
                  <th>Art</th>
                  <th>Name</th>
                  <th>Angriff</th>
                  <th>Verteidigung</th>
                  <th>LP</th>
                  <th>Aufenthaltsort</th>
                  <th>Begabungen</th>
                  <th>Aggro</th>
                  <th>Stärken</th>
                  <th>Schwächen</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!anzeigeBestien.length">
                  <td colspan="13" class="text-secondary text-center py-3">
                    {{ zufallstabellenLeerNachricht((zustand.bestien || []).length, sucheBestien) }}
                  </td>
                </tr>
                <tr
                  v-for="row in anzeigeBestien"
                  :key="row.id"
                  class="zufallstabellen-tabellenzeile-klickbar"
                  :class="statusZeilenKlasse(row)"
                  @click="detailAnsichtOeffnen('bestie', row)">
                  <td class="small text-nowrap">{{ bestieEpocheLabel(row.epoche) }}</td>
                  <td class="small">{{ bestieKategorieLabel(row.kategorie) }}</td>
                  <td>
                    {{ karteWert(row.name) }}
                    <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                      INI {{ initiativeBadgeText(row.initiative) }}
                    </span>
                    <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                  </td>
                  <td class="small">{{ karteWert(row.angriff) }}</td>
                  <td class="small">{{ karteWert(row.verteidigung) }}</td>
                  <td class="small">{{ karteWert(row.lebenspunkte) }}</td>
                  <td>{{ karteWert(row.aufenthaltsort) }}</td>
                  <td class="small text-nowrap">{{ begabungswerteKurzText(row) }}</td>
                  <td class="small text-nowrap">{{ bestieAggressivitaetText(row) }}</td>
                  <td class="small">{{ textVorschau(row.staerke, 48) }}</td>
                  <td class="small">{{ textVorschau(row.schwaeche, 48) }}</td>
                  <td class="small">{{ textVorschau(row.beschreibungHtml) }}</td>
                  <td class="text-end text-nowrap" @click.stop>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary me-1"
                      @click="galerieFuerZeileOeffnen(row)">
                      Medien ({{ medienAnzahl(row) }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="bestieBearbeiten(row, indexNachId(zustand.bestien, row.id))">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('bestie', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-md-none p-2">
            <div v-if="!anzeigeBestien.length" class="text-secondary text-center py-3 small">
              {{ zufallstabellenLeerNachricht((zustand.bestien || []).length, sucheBestien) }}
            </div>
            <div
              v-for="row in anzeigeBestien"
              :key="'bestie-card-' + row.id"
              class="card zufallstabellen-mobile-card zufallstabellen-mobile-card--klickbar mb-2"
              :class="statusCardKlasse(row)">
              <div class="card-body p-2" @click="detailAnsichtOeffnen('bestie', row)">
                <div class="fw-semibold mb-1">
                  {{ karteWert(row.name) }}
                  <span v-if="initiativeBadgeText(row.initiative)" class="badge rounded-pill text-bg-info ms-1">
                    INI {{ initiativeBadgeText(row.initiative) }}
                  </span>
                  <span v-if="statusEmoji(row)">{{ statusEmoji(row) }}</span>
                </div>
                <div class="small"><span class="text-secondary">Epoche:</span> {{ bestieEpocheLabel(row.epoche) }}</div>
                <div class="small"><span class="text-secondary">Art:</span> {{ bestieKategorieLabel(row.kategorie) }}</div>
                <div class="small"><span class="text-secondary">Ort:</span> {{ karteWert(row.aufenthaltsort) }}</div>
                <div class="small"><span class="text-secondary">Begabungen:</span> {{ begabungswerteKurzText(row) }}</div>
                <div class="small">
                  <span class="text-secondary">Werte:</span> A {{ karteWert(row.angriff) }} · V {{ karteWert(row.verteidigung) }} · LP
                  {{ karteWert(row.lebenspunkte) }}
                </div>
                <div class="small mb-2">
                  <span class="text-secondary">Aggressiv / offensiv:</span> {{ bestieAggressivitaetText(row) }}
                </div>
                <div v-if="zeilenWertAlsText(row.staerke)" class="small">
                  <span class="text-secondary">Stärken:</span> {{ textVorschau(row.staerke, 120) }}
                </div>
                <div v-if="zeilenWertAlsText(row.schwaeche)" class="small mb-2">
                  <span class="text-secondary">Schwächen:</span> {{ textVorschau(row.schwaeche, 120) }}
                </div>                <div
                  v-if="featuredBildAusZeile(row)"
                  class="zufallstabellen-mobile-slides mb-2"
                  @click.stop>
                  <button
                    type="button"
                    class="zufallstabellen-mobile-slide"
                    aria-label="Titelbild anzeigen"
                    @click="mediumImBildbetrachterOeffnen(featuredBildAusZeile(row))">
                    <img :src="featuredBildAusZeile(row).dataUrl" :alt="mediumDateiname(featuredBildAusZeile(row))" loading="lazy" />
                  </button>
                </div>
                <div
                  v-if="zeilenWertAlsText(row.beschreibungHtml)"
                  class="small mb-2 zufallstabellen-richtext-vorschau"
                  v-html="richTextHtml(row.beschreibungHtml)"></div>
                <div v-else class="small mb-2">—</div>
                <div class="d-flex gap-2" @click.stop>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary flex-fill"
                    @click="bestieBearbeiten(row, indexNachId(zustand.bestien, row.id))">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger flex-fill"
                    @click="zeileLoeschenDialog('bestie', row.id)">
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
        id="htbahZufallstabellenDetailModal"
        ref="detailAnsichtModalElement"
        tabindex="-1"
        aria-labelledby="htbahZufallstabellenDetailModalLabel"
        aria-hidden="true"
        @hidden.bs.modal="onDetailAnsichtModalHidden">
        <div class="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down modal-xl">
          <div class="modal-content shadow border-0">
            <div class="modal-header py-2 py-md-3 border-0 border-bottom">
              <div class="me-auto pe-2">
                <div class="small text-secondary text-uppercase mb-0">Nur Lesen</div>
                <h5 class="modal-title h6 mb-0" id="htbahZufallstabellenDetailModalLabel">{{ detailAnsichtTitel }}</h5>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start pt-2 pt-md-3" v-if="detailAnsicht">
              <dl class="zufallstabellen-detail-sheet mb-0">
                <template v-for="(p, i) in detailAnsichtFelder" :key="'zfd-' + i">
                  <dt>{{ p.label }}</dt>
                  <dd v-if="p.html != null">
                    <div
                      v-if="detailRichTextAnzeige(p.html)"
                      class="zufallstabellen-detail-richtext"
                      v-html="detailRichTextAnzeige(p.html)"></div>
                    <span v-else class="text-secondary">—</span>
                  </dd>
                  <dd v-else class="zufallstabellen-detail-dd-plain">{{ karteWert(p.text) }}</dd>
                </template>
              </dl>
              <div class="mt-3 pt-3 border-top" v-if="medienAnzahl(detailAnsicht.zeile)">
                <h6 class="small text-secondary text-uppercase mb-2">Medien</h6>
                <div v-if="medienBilderAusZeile(detailAnsicht.zeile).length" class="row g-2 mb-2">
                  <div
                    v-for="bild in medienBilderAusZeile(detailAnsicht.zeile)"
                    :key="'detail-bild-' + bild.id"
                    class="col-6 col-sm-4 col-lg-3">
                    <button
                      type="button"
                      class="zufallstabellen-galerie-thumb"
                      @click="mediumImBildbetrachterOeffnen(bild)">
                      <img :src="bild.dataUrl" :alt="mediumDateiname(bild)" loading="lazy" />
                    </button>
                    <div class="small mt-1 text-break">{{ mediumDateiname(bild) }}</div>
                  </div>
                </div>
                <div v-if="medienDateienAusZeile(detailAnsicht.zeile).length" class="list-group list-group-flush">
                  <div
                    v-for="datei in medienDateienAusZeile(detailAnsicht.zeile)"
                    :key="'detail-datei-' + datei.id"
                    class="list-group-item px-0 py-2">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                      <div class="small text-break">
                        <div class="fw-semibold">{{ mediumDateiname(datei) }}</div>
                        <div class="text-secondary">{{ mediumDateiTypLabel(datei) }}</div>
                        <div v-if="mediumDateigroesseLabel(datei)" class="text-secondary">
                          {{ mediumDateigroesseLabel(datei) }}
                        </div>
                      </div>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary flex-shrink-0"
                        @click="mediumHerunterladen(datei)">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mt-3 pt-3 border-top small text-secondary">Keine Medien hinterlegt.</div>
            </div>
            <div class="modal-footer py-2 border-0 border-top flex-wrap gap-2">
              <button type="button" class="btn btn-outline-primary" @click="detailAnsichtBearbeiten">
                Bearbeiten
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>
            </div>
          </div>
        </div>
      </div>

      <zufallstabellen-zeile-modal
        :anlage="{ offen: !!bearbeitung, typ: bearbeitung ? bearbeitung.typ : '', zeile: bearbeitung ? bearbeitung.zeile : null }"
        :zeile-modal-titel="zeileModalTitel"
        :random-sichtbar="bearbeitungIndex < 0"
        :zufallsgenerator-bereit="zufallsgeneratorBereit"
        :zufall-npc-epoche="zufallNpcEpoche"
        :zufall-gegenstand-epoche="zufallGegenstandEpoche"
        :zufall-gegenstand-kleidung="zufallGegenstandKleidung"
        :zufall-fraktion-epoche="zufallFraktionEpoche"
        :zufall-raetsel-epoche="zufallRaetselEpoche"
        :pantheon-namen-liste="pantheonNamenListe"
        :fraktionen-mit-namen="fraktionenMitNamen"
        :orte-namen-liste="orteNamenListe"
        :zeile-quill-session="zeileQuillSession"
        :zeile-quill-host-ref-fn="zeileQuillHostRefFn"
        @close="schliesseZeileModal"
        @save="zeileSpeichern"
        @random="zufallsvorschlagUebernehmen"
        @media-upload="onBearbeitungsMedienDateienGewaehlt"
        @media-remove="mediumAusBearbeitungEntfernen"
        @media-set-primary="setzeBearbeitungPrimaryMedium"
        @media-open="mediumImBildbetrachterOeffnen"
        @media-download="mediumHerunterladen"
        @update:zufallNpcEpoche="zufallNpcEpoche = $event"
        @update:zufallGegenstandEpoche="zufallGegenstandEpoche = $event"
        @update:zufallGegenstandKleidung="zufallGegenstandKleidung = $event"
        @update:zufallFraktionEpoche="zufallFraktionEpoche = $event"
        @update:zufallRaetselEpoche="zufallRaetselEpoche = $event" />

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
