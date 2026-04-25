window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  const MAP_ZOOM_MIN = 0.01; // 1% (0% ist technisch nicht nutzbar)
  const MAP_ZOOM_MAX = 10; // 1000%

  function formatBytes(n) {
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

  function textWert(v, fallback = '—') {
    const t = typeof v === 'string' ? v.trim() : '';
    return t || fallback;
  }

  function statusFuerLebenspunkte(row) {
    if (!row || typeof window.HTBAH.berechneLebenspunkteStatus !== 'function') {
      return { tot: false, bewusstlos: false };
    }
    return window.HTBAH.berechneLebenspunkteStatus(row);
  }

  function warningEntityStyle() {
    return {
      background: '#fff3cd',
      borderColor: '#ffc107',
      color: '#664d03',
      boxShadow: '0 0 0 1px rgba(255, 193, 7, 0.35), 0 0.1rem 0.25rem rgba(0, 0, 0, 0.12)',
    };
  }

  function dangerEntityStyle() {
    return {
      background: '#f8d7da',
      borderColor: '#dc3545',
      color: '#842029',
      boxShadow: '0 0 0 1px rgba(220, 53, 69, 0.35), 0 0.1rem 0.25rem rgba(0, 0, 0, 0.12)',
    };
  }

  window.HTBAH_KOMPONENTEN.WeltenbauUebersichtModal = {
    name: 'WeltenbauUebersichtModal',
    components: {
      ZufallstabellenZeileModal: window.HTBAH_KOMPONENTEN.ZufallstabellenZeileModal,
      WeltenbauBildImportModal: window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal,
    },
    props: {
      offen: { type: Boolean, default: false },
      gruppeId: { type: String, default: '' },
    },
    emits: ['schliessen'],
    data() {
      return {
        modal: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(), detailsOffen: false },
        zustand: window.HTBAH.ladeZufallstabellenZustand(),
        detail: null,
        graph: { nodes: [], edges: [], layoutAlle: {}, gruppeKey: 'default' },
        map: {
          scale: 1,
          itemScale: 100,
          edgeColor: '#5c636a',
          edgeWidth: 4,
          dragHoverNodeId: '',
          offsetX: 0,
          offsetY: 0,
          panning: false,
          panStartX: 0,
          panStartY: 0,
          panOffsetStartX: 0,
          panOffsetStartY: 0,
          touchPointer: {},
          pinchAktiv: false,
          pinchStartAbstand: 0,
          pinchStartScale: 1,
          pinchWeltX: 0,
          pinchWeltY: 0,
          stageWidth: 5200,
          stageHeight: 3600,
        },
        verlauf: {
          undoStack: [],
          redoStack: [],
          pendingBefore: null,
          zoomCommitTimer: 0,
        },
        nodeDrag: {
          aktiv: false,
          nodeId: '',
          startClientX: 0,
          startClientY: 0,
          startNodeX: 0,
          startNodeY: 0,
          bewegt: false,
        },
        zuletztGezogeneNodeId: '',
        anlage: {
          offen: false,
          typ: '',
          zeile: null,
          index: -1,
        },
        charakterModal: {
          offen: false,
          mitgliedId: '',
          charakter: null,
          charakterBild: '',
          lpEingabeAktiv: false,
          lpAenderungWaehrenEingabe: false,
          lpSnapshotVorEingabe: null,
          prevLpSnapshot: 0,
        },
        spielleiterTick: 0,
        zufallNpcEpoche: 'mittelalter',
        zufallGegenstandEpoche: 'mittelalter',
        zufallGegenstandKleidung: true,
        zufallFraktionEpoche: 'mittelalter',
        zufallRaetselEpoche: 'mittelalter',
        zeileQuillInstanz: null,
        zeileQuillHostElement: null,
        zeileQuillSession: 0,
        zeileQuillHostRefFn: null,
        charakterQuillInstanz: null,
        charakterQuillHostElement: null,
        charakterQuillSession: 0,
        charakterQuillHostRefFn: null,
        hintergrundUploadLaeuft: false,
        mapHintergrundTick: 0,
        sichtbarkeitsFilter: {
          toteNpcsAnzeigen: true,
          toteBestienAnzeigen: true,
          geloesteRaetselAnzeigen: true,
        },
      };
    },
    created() {
      this.zeileQuillHostRefFn = (el) => this.zeileQuillHostRef(el);
      this.charakterQuillHostRefFn = (el) => this.charakterQuillHostRef(el);
    },
    computed: {
      fensterStil() {
        return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.modal);
      },
      gruppen() {
        // Recompute when local game-master state was persisted from this modal.
        void this.spielleiterTick;
        return (window.HTBAH.ladeSpielleiterZustand().gruppen || []).filter(Boolean);
      },
      aktiveGruppe() {
        return this.gruppen.find((g) => g.id === this.gruppeId) || null;
      },
      zeileModalTitel() {
        if (!this.anlage.typ) {
          return '';
        }
        const neu = 'Neu: ';
        if (this.anlage.typ === 'npc') {
          return `${neu}👤 NPC`;
        }
        if (this.anlage.typ === 'ort') {
          return `${neu}🗺️ Ort`;
        }
        if (this.anlage.typ === 'fraktion') {
          return `${neu}🏛️ Fraktion`;
        }
        if (this.anlage.typ === 'bestie') {
          return `${neu}🦁 Bestarium`;
        }
      if (this.anlage.typ === 'raetsel') {
        return `${neu}🧩 Rätsel`;
      }
        return `${neu}📦 Gegenstand`;
      },
      zufallsgeneratorBereit() {
        return !!(window.HTBAH && window.HTBAH.Zufallsgenerator);
      },
      fraktionenMitNamen() {
        return (this.zustand.fraktionen || []).filter((f) => f && String(f.name || '').trim());
      },
      orteNamenListe() {
        return (this.zustand.orte || [])
          .map((o) => (o && o.name ? String(o.name).trim() : ''))
          .filter(Boolean);
      },
      pantheonNamenListe() {
        return (this.zustand.pantheon || [])
          .map((p) => (p && p.name ? String(p.name).trim() : ''))
          .filter(Boolean);
      },
      mapStageStyle() {
        return {
          width: `${this.map.stageWidth}px`,
          height: `${this.map.stageHeight}px`,
          transform: `translate(${this.map.offsetX}px, ${this.map.offsetY}px) scale(${this.map.scale})`,
          transformOrigin: '0 0',
        };
      },
      mapHintergrundDataUrl() {
        void this.mapHintergrundTick;
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const map = wb && wb.mapHintergruende && typeof wb.mapHintergruende === 'object' ? wb.mapHintergruende : {};
        const key = this.gruppeId || 'default';
        const dataUrl = map[key];
        return typeof dataUrl === 'string' ? dataUrl : '';
      },
      mapHintergrundLayerStyle() {
        if (!this.mapHintergrundDataUrl) {
          return {};
        }
        return {
          backgroundImage: `url("${this.mapHintergrundDataUrl}")`,
        };
      },
      kantenLinien() {
        const byId = new Map(this.graph.nodes.map((n) => [n.id, n]));
        const center = (node) => ({
          x: (node.position && Number(node.position.x)) || 0,
          y: (node.position && Number(node.position.y)) || 0,
          w: this.nodeBreite(node),
          h: this.nodeHoehe(node),
        });
        return (this.graph.edges || [])
          .map((e) => {
            const s = byId.get(e.source);
            const t = byId.get(e.target);
            if (!s || !t) {
              return null;
            }
            const sc = center(s);
            const tc = center(t);
            return {
              id: e.id,
              x1: sc.x + sc.w / 2,
              y1: sc.y + sc.h / 2,
              x2: tc.x + tc.w / 2,
              y2: tc.y + tc.h / 2,
            };
          })
          .filter(Boolean);
      },
      itemScaleProzent() {
        return Math.round(Number(this.map.itemScale) || 100);
      },
      mapScaleProzent() {
        return Math.round((Number(this.map.scale) || 1) * 100);
      },
      mapScaleLabel() {
        const prozent = (Number(this.map.scale) || 1) * 100;
        if (prozent < 10) {
          return `${prozent.toFixed(1).replace('.', ',')}%`;
        }
        return `${Math.round(prozent)}%`;
      },
      kannUndo() {
        return !!(this.verlauf.undoStack && this.verlauf.undoStack.length);
      },
      kannRedo() {
        return !!(this.verlauf.redoStack && this.verlauf.redoStack.length);
      },
      charakterModalStatus() {
        if (!this.charakterModal.charakter) {
          return { tot: false, bewusstlos: false };
        }
        return statusFuerLebenspunkte(this.charakterModal.charakter);
      },
      ausgeblendeteFilterAnzahl() {
        let anzahl = 0;
        if (!this.sichtbarkeitsFilter.toteNpcsAnzeigen) {
          anzahl += 1;
        }
        if (!this.sichtbarkeitsFilter.toteBestienAnzeigen) {
          anzahl += 1;
        }
        if (!this.sichtbarkeitsFilter.geloesteRaetselAnzeigen) {
          anzahl += 1;
        }
        return anzahl;
      },
    },
    methods: {
      fraktionOrteListe(fraktion) {
        if (!fraktion || typeof fraktion !== 'object') {
          return [];
        }
        const orte = Array.isArray(fraktion.orte)
          ? fraktion.orte.map((ort) => (typeof ort === 'string' ? ort.trim() : '')).filter(Boolean)
          : [];
        if (orte.length) {
          return orte;
        }
        const legacy = typeof fraktion.aufenthaltsort === 'string' ? fraktion.aufenthaltsort.trim() : '';
        return legacy ? [legacy] : [];
      },
      normalisiereFraktionenArray(wert) {
        if (Array.isArray(wert)) {
          return wert.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean);
        }
        if (typeof wert === 'string' && wert.trim()) {
          return [wert.trim()];
        }
        return [];
      },
      entitaetFraktionsNamen(entityType, row) {
        if (!row || typeof row !== 'object') {
          return [];
        }
        if (entityType === 'npc') {
          return this.normalisiereFraktionenArray(row.fraktion);
        }
        if (entityType === 'bestie' || entityType === 'charakter') {
          const liste = this.normalisiereFraktionenArray(row.fraktionen);
          if (liste.length) {
            return liste;
          }
          return this.normalisiereFraktionenArray(row.fraktion);
        }
        return [];
      },
      charakterFraktionAktiv(fraktionsName) {
        const liste = Array.isArray(this.charakterModal.charakter && this.charakterModal.charakter.fraktionen)
          ? this.charakterModal.charakter.fraktionen
          : [];
        return liste.includes(fraktionsName);
      },
      charakterFraktionUmschalten(fraktionsName) {
        if (!this.charakterModal.charakter || !fraktionsName) {
          return;
        }
        const liste = Array.isArray(this.charakterModal.charakter.fraktionen)
          ? this.charakterModal.charakter.fraktionen.slice()
          : [];
        const index = liste.indexOf(fraktionsName);
        if (index >= 0) {
          liste.splice(index, 1);
        } else {
          liste.push(fraktionsName);
        }
        this.charakterModal.charakter.fraktionen = liste;
      },
      fraktionNodeIdsFuerNamen(fraktionNamen, ortName, fraktionByName, fraktionNodeByOrtSchluessel) {
        if (!Array.isArray(fraktionNamen) || !fraktionNamen.length) {
          return [];
        }
        return fraktionNamen
          .map((name) => {
            const fraktion = fraktionByName.get(name);
            if (!fraktion) {
              return '';
            }
            return (
              fraktionNodeByOrtSchluessel.get(`${fraktion.id}::${ortName}`) ||
              fraktionNodeByOrtSchluessel.get(`${fraktion.id}::`) ||
              ''
            );
          })
          .filter(Boolean);
      },
      ermittleViewportGroesse() {
        return window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
      },
      begrenzeFensterGroesse(breite, hoehe) {
        return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 320, 260);
      },
      initialisierePosition() {
        const fenster = this.$refs.fensterElement;
        if (!fenster) {
          return;
        }
        if (this.modal.breite == null || this.modal.hoehe == null) {
          const groesse = this.begrenzeFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
          this.modal.breite = groesse.breite;
          this.modal.hoehe = groesse.hoehe;
        }
        if (this.modal.positionX == null || this.modal.positionY == null) {
          const v = this.ermittleViewportGroesse();
          this.modal.positionX = Math.max(0, Math.round((v.viewportBreite - this.modal.breite) / 2));
          this.modal.positionY = Math.max(0, Math.round((v.viewportHoehe - this.modal.hoehe) / 2));
        }
      },
      stelleSichtbaresFensterSicher() {
        if (this.modal.istVollbild || this.modal.breite == null || this.modal.hoehe == null) {
          return;
        }
        const groesse = this.begrenzeFensterGroesse(this.modal.breite, this.modal.hoehe);
        this.modal.breite = groesse.breite;
        this.modal.hoehe = groesse.hoehe;
        const v = this.ermittleViewportGroesse();
        const maxX = Math.max(0, v.viewportBreite - this.modal.breite);
        const maxY = Math.max(0, v.viewportHoehe - this.modal.hoehe);
        this.modal.positionX = Math.min(Math.max(0, this.modal.positionX || 0), maxX);
        this.modal.positionY = Math.min(Math.max(0, this.modal.positionY || 0), maxY);
      },
      starteZiehen(event) {
        if (
          this.modal.istVollbild ||
          event.target.closest('button, a, input') ||
          event.target.closest('.htbah-weltenbau-map-actions')
        ) {
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        const fenster = this.$refs.fensterElement;
        if (!fenster) {
          return;
        }
        const rect = fenster.getBoundingClientRect();
        this.modal.ziehenAktiv = true;
        this.modal.ziehOffsetX = event.clientX - rect.left;
        this.modal.ziehOffsetY = event.clientY - rect.top;
        window.addEventListener('pointermove', this.beimZiehen);
        window.addEventListener('pointerup', this.beendeZiehen);
        window.addEventListener('pointercancel', this.beendeZiehen);
        event.preventDefault();
      },
      beimZiehen(event) {
        if (!this.modal.ziehenAktiv || this.modal.istVollbild) {
          return;
        }
        const fenster = this.$refs.fensterElement;
        if (!fenster) {
          return;
        }
        const maxX = Math.max(0, window.innerWidth - fenster.offsetWidth);
        const maxY = Math.max(0, window.innerHeight - fenster.offsetHeight);
        this.modal.positionX = Math.min(Math.max(0, event.clientX - this.modal.ziehOffsetX), maxX);
        this.modal.positionY = Math.min(Math.max(0, event.clientY - this.modal.ziehOffsetY), maxY);
      },
      beendeZiehen() {
        this.modal.ziehenAktiv = false;
        window.removeEventListener('pointermove', this.beimZiehen);
        window.removeEventListener('pointerup', this.beendeZiehen);
        window.removeEventListener('pointercancel', this.beendeZiehen);
      },
      starteResize(event) {
        if (this.modal.istVollbild) {
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        const fenster = this.$refs.fensterElement;
        if (!fenster) {
          return;
        }
        this.modal.resizeAktiv = true;
        this.modal.resizeStartX = event.clientX;
        this.modal.resizeStartY = event.clientY;
        this.modal.resizeStartBreite = this.modal.breite != null ? this.modal.breite : fenster.offsetWidth;
        this.modal.resizeStartHoehe = this.modal.hoehe != null ? this.modal.hoehe : fenster.offsetHeight;
        window.addEventListener('pointermove', this.beimResize);
        window.addEventListener('pointerup', this.beendeResize);
        window.addEventListener('pointercancel', this.beendeResize);
        event.preventDefault();
      },
      beimResize(event) {
        if (!this.modal.resizeAktiv || this.modal.istVollbild) {
          return;
        }
        const groesse = this.begrenzeFensterGroesse(
          this.modal.resizeStartBreite + (event.clientX - this.modal.resizeStartX),
          this.modal.resizeStartHoehe + (event.clientY - this.modal.resizeStartY),
        );
        this.modal.breite = groesse.breite;
        this.modal.hoehe = groesse.hoehe;
        this.stelleSichtbaresFensterSicher();
      },
      beendeResize() {
        this.modal.resizeAktiv = false;
        window.removeEventListener('pointermove', this.beimResize);
        window.removeEventListener('pointerup', this.beendeResize);
        window.removeEventListener('pointercancel', this.beendeResize);
      },
      vollbildUmschalten() {
        this.modal.istVollbild = !this.modal.istVollbild;
      },
      schliessen() {
        this.$emit('schliessen');
      },
      aktualisiereZustand() {
        this.zustand = window.HTBAH.ladeZufallstabellenZustand();
      },
      speichereZustand() {
        window.HTBAH.speichereZufallstabellenZustand(this.zustand);
      },
      ladeLayouts() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        return wb && wb.mapLayouts && typeof wb.mapLayouts === 'object' ? wb.mapLayouts : {};
      },
      speichereLayout(layoutMap) {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        wb.mapLayouts = layoutMap;
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      ladeMapEinstellungen() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const alle = wb && wb.mapEinstellungen && typeof wb.mapEinstellungen === 'object' ? wb.mapEinstellungen : {};
        const key = this.gruppeId || 'default';
        const gruppe = alle[key] && typeof alle[key] === 'object' ? alle[key] : {};
        const filter =
          gruppe.sichtbarkeitsFilter && typeof gruppe.sichtbarkeitsFilter === 'object'
            ? gruppe.sichtbarkeitsFilter
            : {};
        return {
          itemScale: Number.isFinite(Number(gruppe.itemScale))
            ? Math.max(0, Math.min(500, Math.round(Number(gruppe.itemScale))))
            : 100,
          edgeColor:
            typeof gruppe.edgeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(gruppe.edgeColor)
              ? gruppe.edgeColor
              : '#5c636a',
          edgeWidth: Number.isFinite(Number(gruppe.edgeWidth))
            ? Math.max(1, Math.min(16, Math.round(Number(gruppe.edgeWidth))))
            : 4,
          sichtbarkeitsFilter: {
            toteNpcsAnzeigen: filter.toteNpcsAnzeigen !== false,
            toteBestienAnzeigen: filter.toteBestienAnzeigen !== false,
            geloesteRaetselAnzeigen: filter.geloesteRaetselAnzeigen !== false,
          },
        };
      },
      uebernehmeMapEinstellungen() {
        const einstellungen = this.ladeMapEinstellungen();
        this.map.itemScale = einstellungen.itemScale;
        this.map.edgeColor = einstellungen.edgeColor;
        this.map.edgeWidth = einstellungen.edgeWidth;
        this.sichtbarkeitsFilter = {
          ...this.sichtbarkeitsFilter,
          ...einstellungen.sichtbarkeitsFilter,
        };
      },
      speichereMapEinstellung(key, value) {
        if (!key) {
          return;
        }
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const alle = wb && wb.mapEinstellungen && typeof wb.mapEinstellungen === 'object' ? wb.mapEinstellungen : {};
        const gruppeKey = this.gruppeId || 'default';
        const gruppe = alle[gruppeKey] && typeof alle[gruppeKey] === 'object' ? alle[gruppeKey] : {};
        wb.mapEinstellungen = {
          ...alle,
          [gruppeKey]: {
            ...gruppe,
            [key]: value,
          },
        };
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      speichereMapHintergrund(dataUrl) {
        const key = this.gruppeId || 'default';
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const map = wb && wb.mapHintergruende && typeof wb.mapHintergruende === 'object' ? wb.mapHintergruende : {};
        const nextMap = { ...map };
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
          nextMap[key] = dataUrl;
        } else {
          delete nextMap[key];
        }
        wb.mapHintergruende = nextMap;
        window.HTBAH.speichereWeltenbauZustand(wb);
        this.mapHintergrundTick += 1;
      },
      hintergrundDateiInputClick() {
        if (this.hintergrundUploadLaeuft) {
          return;
        }
        const input = this.$refs.hintergrundDateiInput;
        if (input && typeof input.click === 'function') {
          input.click();
        }
      },
      onHintergrundDateiGewaehlt(event) {
        const input = event && event.target;
        const file = input && input.files && input.files[0] ? input.files[0] : null;
        if (input) {
          input.value = '';
        }
        if (!file) {
          return;
        }
        const modal = this.$refs.weltenbauHintergrundImportModal;
        if (modal && typeof modal.oeffnenMitDatei === 'function') {
          this.hintergrundUploadLaeuft = true;
          modal.oeffnenMitDatei(file);
        }
      },
      async mapHintergrundBearbeiten() {
        if (!this.mapHintergrundDataUrl || this.hintergrundUploadLaeuft) {
          return;
        }
        const modal = this.$refs.weltenbauHintergrundImportModal;
        if (!modal || typeof modal.oeffnenMitDatei !== 'function') {
          return;
        }
        this.hintergrundUploadLaeuft = true;
        const file = await this.dataUrlZuDatei(this.mapHintergrundDataUrl, 'weltenbau-hintergrund');
        if (!file) {
          this.hintergrundUploadLaeuft = false;
          await window.HTBAH.ui.alert({
            titel: 'Bild konnte nicht geladen werden',
            beschreibung: 'Das vorhandene Hintergrundbild konnte nicht zur Bearbeitung geöffnet werden.',
          });
          return;
        }
        modal.oeffnenMitDatei(file);
      },
      async mapHintergrundLoeschen() {
        if (!this.mapHintergrundDataUrl) {
          return;
        }
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Hintergrundbild entfernen?',
          beschreibung: 'Das Hintergrundbild dieser Gruppe wird gelöscht.',
          bestaetigenText: 'Entfernen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (!bestaetigt) {
          return;
        }
        this.speichereMapHintergrund('');
      },
      onMapHintergrundImportFertig(payload) {
        const dataUrl = payload && typeof payload.dataUrl === 'string' ? payload.dataUrl : '';
        this.speichereMapHintergrund(dataUrl);
        this.hintergrundUploadLaeuft = false;
      },
      onMapHintergrundImportAbgebrochen() {
        this.hintergrundUploadLaeuft = false;
      },
      onMapHintergrundImportFehler() {
        this.hintergrundUploadLaeuft = false;
      },
      async dataUrlZuDatei(dataUrl, basisName) {
        if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
          return null;
        }
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const mime = (blob && blob.type) || 'image/png';
          const extension = mime === 'image/jpeg' ? 'jpg' : mime.startsWith('image/') ? mime.slice(6) : 'png';
          const fileName = `${basisName}.${extension}`;
          return new File([blob], fileName, { type: mime });
        } catch {
          return null;
        }
      },
      baueGraph() {
        const gruppeKey = this.gruppeId || 'default';
        const layoutAlle = this.ladeLayouts();
        const layout = layoutAlle[gruppeKey] || {};
        const ortNodes = (this.zustand.orte || []).map((ort, idx) => {
          const key = `ort:${ort.id}`;
          return {
            id: key,
            type: 'default',
            position: layout[key] || { x: 180 + idx * 260, y: 180 + (idx % 3) * 220 },
            data: { label: `🗺️ ${textWert(ort.name)}`, entityType: 'ort', entityId: ort.id, payload: ort },
            style: { width: 220, borderWidth: 2 },
          };
        });
        const ortByName = new Map((this.zustand.orte || []).map((o) => [String(o.name || '').trim(), o]));
        const edges = [];
        const nodes = ortNodes.slice();
        const fraktionByName = new Map(
          (this.zustand.fraktionen || [])
            .filter((f) => f && String(f.name || '').trim())
            .map((f) => [String(f.name || '').trim(), f]),
        );
        const fraktionNodeByOrtSchluessel = new Map();
        (this.zustand.fraktionen || []).forEach((fraktion, idx) => {
          const orte = this.fraktionOrteListe(fraktion);
          if (!orte.length) {
            const key = `fraktion:${fraktion.id}:ohne-ort`;
            fraktionNodeByOrtSchluessel.set(`${fraktion.id}::`, key);
            nodes.push({
              id: key,
              type: 'default',
              position: layout[key] || { x: 900, y: 140 + idx * 90 },
              data: {
                label: `🏛️ ${textWert(fraktion.name)}`,
                entityType: 'fraktion',
                entityId: fraktion.id,
                payload: fraktion,
                multiOrtCount: orte.length,
              },
              style: { width: 210, borderWidth: 2 },
            });
            return;
          }
          orte.forEach((ortName, ortIndex) => {
            const ort = ortByName.get(ortName);
            if (!ort) {
              return;
            }
            const key = `fraktion:${fraktion.id}:ort:${ort.id}`;
            fraktionNodeByOrtSchluessel.set(`${fraktion.id}::${ortName}`, key);
            const ortAnchor = layout[`ort:${ort.id}`] || { x: 280, y: 200 };
            nodes.push({
              id: key,
              type: 'default',
              position: layout[key] || { x: ortAnchor.x + 260 + (ortIndex % 2) * 40, y: ortAnchor.y + 90 + Math.floor(ortIndex / 2) * 70 },
              data: {
                label: `🏛️ ${textWert(fraktion.name)}`,
                entityType: 'fraktion',
                entityId: fraktion.id,
                payload: fraktion,
                multiOrtCount: orte.length,
              },
              style: { width: 210, borderWidth: 2 },
            });
            edges.push({
              id: `e-ort:${ort.id}-${key}-${ortName}`,
              source: `ort:${ort.id}`,
              target: key,
              type: 'straight',
            });
          });
        });
        const pushEnt = (prefix, emoji, liste, ortFeld, fallbackY, statusFaerben = false) => {
          (liste || []).forEach((row, idx) => {
            const key = `${prefix}:${row.id}`;
            const ortName = String(row[ortFeld] || '').trim();
            const ort = ortByName.get(ortName);
            const fraktionNamen = this.entitaetFraktionsNamen(prefix, row);
            const fraktionNodeIds = this.fraktionNodeIdsFuerNamen(
              fraktionNamen,
              ortName,
              fraktionByName,
              fraktionNodeByOrtSchluessel,
            );
            const anchor =
              fraktionNodeIds.length
                ? layout[fraktionNodeIds[0]] || { x: 520, y: 280 }
                : ort
                  ? layout[`ort:${ort.id}`] || { x: 280, y: 200 }
                  : { x: 1200, y: 140 + fallbackY };
            const status = statusFaerben ? statusFuerLebenspunkte(row) : { tot: false, bewusstlos: false };
            if (prefix === 'npc' && status.tot && !this.sichtbarkeitsFilter.toteNpcsAnzeigen) {
              return;
            }
            if (prefix === 'bestie' && status.tot && !this.sichtbarkeitsFilter.toteBestienAnzeigen) {
              return;
            }
            if (prefix === 'raetsel' && row && row.geloest && !this.sichtbarkeitsFilter.geloesteRaetselAnzeigen) {
              return;
            }
            const style = status.tot
              ? dangerEntityStyle()
              : status.bewusstlos
                ? warningEntityStyle()
                : {};
            nodes.push({
              id: key,
              type: 'default',
              position: layout[key] || { x: anchor.x + 240 + (idx % 3) * 210, y: anchor.y + Math.floor(idx / 3) * 120 },
              data: {
                label: `${emoji} ${textWert(row.name)}`,
                entityType: prefix,
                entityId: row.id,
                payload: row,
                initiative: typeof row.initiative === 'string' ? row.initiative : '',
                statusEmoji: status.tot ? '💀' : status.bewusstlos ? '😵' : '',
              },
              style: { width: 200, ...style },
            });
            if (ort && !fraktionNodeIds.length) {
              edges.push({ id: `e-${key}-ort:${ort.id}`, source: `ort:${ort.id}`, target: key, type: 'straight' });
            }
            fraktionNodeIds.forEach((fraktionNodeId, fraktionIndex) => {
              edges.push({
                id: `e-${fraktionNodeId}-${key}-${fraktionIndex}`,
                source: fraktionNodeId,
                target: key,
                type: 'straight',
              });
            });
          });
        };
        pushEnt('npc', '👤', this.zustand.npcs, 'aufenthaltsort', 60, true);
        pushEnt('bestie', '🦁', this.zustand.bestien, 'aufenthaltsort', 260, true);
        pushEnt('gegenstand', '📦', this.zustand.gegenstaende, 'aufenthaltsort', 460, false);
        pushEnt('raetsel', '🧩', this.zustand.raetsel, 'aufenthaltsort', 660, false);
        nodes.forEach((node) => {
          if (!(node && node.data && node.data.entityType === 'raetsel')) {
            return;
          }
          if (node.data.payload && node.data.payload.geloest) {
            node.data.statusEmoji = '✅';
          }
        });
        (this.aktiveGruppe && this.aktiveGruppe.mitglieder ? this.aktiveGruppe.mitglieder : []).forEach((m, idx) => {
          const char = m.charakter || {};
          const ortName = String(char.aufenthaltsort || '').trim();
          const ort = ortByName.get(ortName);
          const fraktionNamen = this.entitaetFraktionsNamen('charakter', char);
          const fraktionNodeIds = this.fraktionNodeIdsFuerNamen(
            fraktionNamen,
            ortName,
            fraktionByName,
            fraktionNodeByOrtSchluessel,
          );
          const anchor =
            fraktionNodeIds.length
              ? layout[fraktionNodeIds[0]] || { x: 520, y: 240 }
              : ort
                ? layout[`ort:${ort.id}`] || { x: 220, y: 120 }
                : { x: 150, y: 40 };
          const status = statusFuerLebenspunkte(char);
          const statusEmoji = status.tot ? '💀' : status.bewusstlos ? '😵' : '';
          const charStatusStyle = status.tot
            ? dangerEntityStyle()
            : status.bewusstlos
              ? warningEntityStyle()
              : {};
          const key = `charakter:${m.id}`;
          nodes.push({
            id: key,
            position: layout[key] || { x: anchor.x + (idx % 3) * 180, y: anchor.y - 150 + Math.floor(idx / 3) * 90 },
            data: {
              label: textWert(char.name, 'Charakter'),
              entityType: 'charakter',
              entityId: m.id,
              payload: char,
              charakterBild: typeof m.charakterBild === 'string' ? m.charakterBild : '',
              initiative: typeof char.initiative === 'string' ? char.initiative : '',
              statusEmoji,
            },
            style: { width: 220, ...charStatusStyle },
          });
          if (ort && !fraktionNodeIds.length) {
            edges.push({ id: `e-ort:${ort.id}-${key}`, source: `ort:${ort.id}`, target: key, type: 'straight' });
          }
          fraktionNodeIds.forEach((fraktionNodeId, fraktionIndex) => {
            edges.push({
              id: `e-${fraktionNodeId}-${key}-${fraktionIndex}`,
              source: fraktionNodeId,
              target: key,
              type: 'straight',
            });
          });
        });
        return { nodes, edges, layoutAlle, gruppeKey };
      },
      schreibeNodePosition(nodeId, position, gruppeKey) {
        const aktuelleLayouts = this.ladeLayouts();
        const next = { ...aktuelleLayouts };
        next[gruppeKey] = {
          ...(next[gruppeKey] || {}),
          [nodeId]: { x: Math.round(position.x), y: Math.round(position.y) },
        };
        this.speichereLayout(next);
        this.graph.layoutAlle = next;
      },
      refreshGraph() {
        this.graph = this.baueGraph();
      },
      nodeKlassen(node) {
        const t = node && node.data && node.data.entityType;
        const istDragHoverZiel =
          !!(this.nodeDrag && this.nodeDrag.aktiv && this.map && this.map.dragHoverNodeId && node && node.id === this.map.dragHoverNodeId);
        return {
          'htbah-map-node': true,
          'htbah-map-node-ort': t === 'ort',
          'htbah-map-node-charakter': t === 'charakter',
          'htbah-map-node-drag-hover': istDragHoverZiel,
        };
      },
      nodeStil(node) {
        const itemScale = Math.max(0, (Number(this.map.itemScale) || 100) / 100);
        const istCharakter = !!(node && node.data && node.data.entityType === 'charakter');
        const basisFont = istCharakter ? 14 : 14;
        const basisPaddingY = istCharakter ? 6 : 8;
        const basisPaddingX = istCharakter ? 8 : 10;
        return {
          ...(node.style || {}),
          left: `${Math.round((node.position && node.position.x) || 0)}px`,
          top: `${Math.round((node.position && node.position.y) || 0)}px`,
          width: `${this.nodeBreite(node)}px`,
          minHeight:
            node && node.style && Number.isFinite(Number(node.style.minHeight))
              ? `${Math.max(18, Math.round(Number(node.style.minHeight) * itemScale))}px`
              : undefined,
          fontSize: `${Math.max(8, Math.round(basisFont * itemScale))}px`,
          padding: `${Math.max(2, Math.round(basisPaddingY * itemScale))}px ${Math.max(
            3,
            Math.round(basisPaddingX * itemScale),
          )}px`,
          '--htbah-node-scale': String(itemScale),
        };
      },
      nodeBreite(node) {
        const itemScale = Math.max(0, (Number(this.map.itemScale) || 100) / 100);
        const basisBreite = (node && node.style && Number(node.style.width)) || 200;
        return Math.max(22, Math.round(basisBreite * itemScale));
      },
      nodeHoehe(node) {
        const itemScale = Math.max(0, (Number(this.map.itemScale) || 100) / 100);
        const basisHoehe =
          node && node.style && Number.isFinite(Number(node.style.minHeight))
            ? Number(node.style.minHeight)
            : (node && node.style && Number(node.style.height)) || 56;
        return Math.max(18, Math.round(basisHoehe * itemScale));
      },
      findeNode(nodeId) {
        return this.graph.nodes.find((n) => n.id === nodeId) || null;
      },
      naechsterOrtNodeZu(node) {
        if (!node || !node.position) {
          return null;
        }
        const ortNodes = this.graph.nodes.filter((n) => n.data && n.data.entityType === 'ort');
        let closest = null;
        let closestD = Number.POSITIVE_INFINITY;
        ortNodes.forEach((ortNode) => {
          const dx = (ortNode.position.x || 0) - (node.position.x || 0);
          const dy = (ortNode.position.y || 0) - (node.position.y || 0);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < closestD) {
            closest = ortNode;
            closestD = d;
          }
        });
        return { closest, distance: closestD };
      },
      findeDropTargetNode(event, draggedNodeId) {
        if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
          return null;
        }
        const el = document.elementFromPoint(event.clientX, event.clientY);
        if (!el || typeof el.closest !== 'function') {
          return null;
        }
        const nodeEl = el.closest('[data-node-id]');
        if (!nodeEl) {
          return null;
        }
        const nodeId = nodeEl.getAttribute('data-node-id') || '';
        if (!nodeId || nodeId === draggedNodeId) {
          return null;
        }
        return this.findeNode(nodeId);
      },
      nodeRechteck(node) {
        if (!node || !node.position) {
          return null;
        }
        const x = Number(node.position.x) || 0;
        const y = Number(node.position.y) || 0;
        const w = this.nodeBreite(node);
        const h = this.nodeHoehe(node);
        return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
      },
      rechteckeUeberlappen(a, b, padding = 0) {
        if (!a || !b) {
          return false;
        }
        const p = Number(padding) || 0;
        return !(
          a.x + a.w + p < b.x - p ||
          b.x + b.w + p < a.x - p ||
          a.y + a.h + p < b.y - p ||
          b.y + b.h + p < a.y - p
        );
      },
      findeUeberlappendesZuordnungsZiel(sourceNode) {
        if (!sourceNode || !sourceNode.data) {
          return null;
        }
        const sourceType = sourceNode.data.entityType;
        if (!['charakter', 'npc', 'bestie', 'gegenstand', 'raetsel'].includes(sourceType)) {
          return null;
        }
        const sourceRect = this.nodeRechteck(sourceNode);
        if (!sourceRect) {
          return null;
        }
        const itemScale = Math.max(0, (Number(this.map.itemScale) || 100) / 100);
        const padding = Math.max(6, Math.round(10 * itemScale));
        const kandidaten = (this.graph.nodes || []).filter((n) => {
          if (!n || !n.data || n.id === sourceNode.id) {
            return false;
          }
          const t = n.data.entityType;
          return t === 'ort' || t === 'fraktion';
        });
        let best = null;
        let bestScore = Number.POSITIVE_INFINITY;
        kandidaten.forEach((k) => {
          const r = this.nodeRechteck(k);
          if (!r) {
            return;
          }
          if (!this.rechteckeUeberlappen(sourceRect, r, padding)) {
            return;
          }
          const dx = r.cx - sourceRect.cx;
          const dy = r.cy - sourceRect.cy;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestScore) {
            bestScore = d2;
            best = k;
          }
        });
        return best;
      },
      setzeDragHoverZiel(nodeId) {
        const next = typeof nodeId === 'string' && nodeId ? nodeId : '';
        if (this.map.dragHoverNodeId === next) {
          return;
        }
        this.map.dragHoverNodeId = next;
      },
      updateCharakterZuordnung(mitgliedId, updater) {
        if (!mitgliedId || !this.gruppeId || typeof updater !== 'function') {
          return false;
        }
        const zustand = window.HTBAH.ladeSpielleiterZustand();
        const gruppe = (zustand.gruppen || []).find((g) => g && g.id === this.gruppeId);
        if (!gruppe || !Array.isArray(gruppe.mitglieder)) {
          return false;
        }
        const index = gruppe.mitglieder.findIndex((m) => m && m.id === mitgliedId);
        if (index < 0) {
          return false;
        }
        const mitglied = gruppe.mitglieder[index];
        const charakter = window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(mitglied.charakter || {});
        const nextCharakter = updater(charakter);
        gruppe.mitglieder[index] = {
          ...mitglied,
          charakter: nextCharakter || charakter,
        };
        window.HTBAH.speichereSpielleiterZustand(zustand);
        this.spielleiterTick += 1;
        return true;
      },
      wendeDropVerknuepfungAn(sourceNode, targetNode) {
        if (!sourceNode || !sourceNode.data || !targetNode || !targetNode.data) {
          return false;
        }
        const sourceType = sourceNode.data.entityType;
        const sourceId = sourceNode.data.entityId;
        const targetType = targetNode.data.entityType;
        const targetPayload = targetNode.data.payload || {};
        if (targetType === 'ort') {
          const ortName = String(targetPayload.name || '').trim();
          if (!ortName) {
            return false;
          }
          if (sourceType === 'charakter') {
            return this.updateCharakterZuordnung(sourceId, (charakter) => ({
              ...charakter,
              aufenthaltsort: ortName,
              fraktionen: [],
              fraktion: '',
            }));
          }
          if (['npc', 'bestie', 'gegenstand', 'raetsel'].includes(sourceType)) {
            if (sourceType === 'npc') {
              this.zustand.npcs = (this.zustand.npcs || []).map((npc) =>
                npc.id === sourceId ? { ...npc, aufenthaltsort: ortName, fraktion: '' } : npc,
              );
              this.speichereZustand();
              return true;
            }
            if (sourceType === 'bestie') {
              this.zustand.bestien = (this.zustand.bestien || []).map((bestie) =>
                bestie.id === sourceId ? { ...bestie, aufenthaltsort: ortName, fraktionen: [] } : bestie,
              );
              this.speichereZustand();
              return true;
            }
            this.updateAufenthaltsort(sourceType, sourceId, ortName);
            return true;
          }
          return false;
        }
        if (targetType === 'fraktion') {
          const fraktionName = String(targetPayload.name || '').trim();
          const fraktionOrte = this.fraktionOrteListe(targetPayload);
          const bevorzugterOrt = fraktionOrte.length ? String(fraktionOrte[0] || '').trim() : '';
          if (!fraktionName) {
            return false;
          }
          if (sourceType === 'npc') {
            this.zustand.npcs = (this.zustand.npcs || []).map((npc) =>
              npc.id === sourceId
                ? {
                    ...npc,
                    fraktion: fraktionName,
                    aufenthaltsort: bevorzugterOrt || npc.aufenthaltsort || '',
                  }
                : npc,
            );
            this.speichereZustand();
            return true;
          }
          if (sourceType === 'bestie') {
            this.zustand.bestien = (this.zustand.bestien || []).map((bestie) =>
              bestie.id === sourceId
                ? {
                    ...bestie,
                    fraktionen: [fraktionName],
                    aufenthaltsort: bevorzugterOrt || bestie.aufenthaltsort || '',
                  }
                : bestie,
            );
            this.speichereZustand();
            return true;
          }
          if (sourceType === 'charakter') {
            return this.updateCharakterZuordnung(sourceId, (charakter) => ({
              ...charakter,
              fraktionen: [fraktionName],
              fraktion: fraktionName,
              aufenthaltsort: bevorzugterOrt || charakter.aufenthaltsort || '',
            }));
          }
          if (sourceType === 'gegenstand' || sourceType === 'raetsel') {
            if (!bevorzugterOrt) {
              return false;
            }
            this.updateAufenthaltsort(sourceType, sourceId, bevorzugterOrt);
            return true;
          }
          return false;
        }
        return false;
      },
      starteNodeDrag(event, node) {
        if (!node || !node.id) {
          return;
        }
        this.starteVerlaufAktion();
        this.nodeDrag.aktiv = true;
        this.nodeDrag.nodeId = node.id;
        this.nodeDrag.startClientX = event.clientX;
        this.nodeDrag.startClientY = event.clientY;
        this.nodeDrag.startNodeX = (node.position && Number(node.position.x)) || 0;
        this.nodeDrag.startNodeY = (node.position && Number(node.position.y)) || 0;
        this.nodeDrag.bewegt = false;
        this.setzeDragHoverZiel('');
        event.preventDefault();
      },
      onNodeClick(node) {
        if (!node || !node.id) {
          return;
        }
        if (this.zuletztGezogeneNodeId && this.zuletztGezogeneNodeId === node.id) {
          return;
        }
        const typ = node && node.data ? node.data.entityType : '';
        if (typ === 'charakter') {
          this.oeffneCharakterModal(node);
          return;
        }
        this.detail = node && node.data ? node.data : null;
        this.starteBearbeitungAusDetail();
      },
      oeffneCharakterModal(node) {
        const mitgliedId = node && node.data ? node.data.entityId : '';
        if (!mitgliedId || !this.gruppeId) {
          return;
        }
        const sl = window.HTBAH.ladeSpielleiterZustand();
        const gruppe = (sl.gruppen || []).find((g) => g && g.id === this.gruppeId);
        if (!gruppe || !Array.isArray(gruppe.mitglieder)) {
          return;
        }
        const mitglied = gruppe.mitglieder.find((m) => m && m.id === mitgliedId);
        if (!mitglied) {
          return;
        }
        const charakterQuelle = window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(mitglied.charakter || {});
        const charakter = JSON.parse(JSON.stringify(charakterQuelle));
        if (!charakter.geistesblitzVerbleibend || typeof charakter.geistesblitzVerbleibend !== 'object') {
          charakter.geistesblitzVerbleibend = { handeln: 0, wissen: 0, soziales: 0 };
        }
        if (!Array.isArray(charakter.inventar)) {
          charakter.inventar = [];
        }
        charakter.fraktionen = this.normalisiereFraktionenArray(charakter.fraktionen);
        this.charakterModal.offen = true;
        this.charakterModal.mitgliedId = mitgliedId;
        this.charakterModal.charakter = charakter;
        this.charakterModal.charakterBild = typeof mitglied.charakterBild === 'string' ? mitglied.charakterBild : '';
        this.charakterModal.prevLpSnapshot = this.normalisiereLp(charakter.lebenspunkte);
        this.charakterModal.lpSnapshotVorEingabe = null;
        this.charakterModal.lpEingabeAktiv = false;
        this.charakterModal.lpAenderungWaehrenEingabe = false;
        this.charakterQuillSession += 1;
      },
      oeffneCharakterBearbeitung(node) {
        const mitgliedId = node && node.data ? node.data.entityId : '';
        if (!mitgliedId || !this.gruppeId) {
          return;
        }
        const zustand = window.HTBAH.ladeSpielleiterZustand();
        zustand.aktiveGruppeId = this.gruppeId;
        zustand.mitgliedWahlProGruppe = {
          ...(zustand.mitgliedWahlProGruppe || {}),
          [this.gruppeId]: mitgliedId,
        };
        window.HTBAH.speichereSpielleiterZustand(zustand);
        this.schliessen();
        if (this.$router && typeof this.$router.push === 'function') {
          this.$router.push(`/spielleiter/gruppe/${this.gruppeId}`);
        }
      },
      schliesseCharakterModal() {
        this.charakterQuillInstanz = null;
        this.charakterQuillHostElement = null;
        this.charakterModal.offen = false;
        this.charakterModal.mitgliedId = '';
        this.charakterModal.charakter = null;
        this.charakterModal.charakterBild = '';
        this.charakterModal.prevLpSnapshot = 0;
        this.charakterModal.lpSnapshotVorEingabe = null;
        this.charakterModal.lpEingabeAktiv = false;
        this.charakterModal.lpAenderungWaehrenEingabe = false;
      },
      charakterNotizenHtml() {
        if (!this.charakterModal.charakter) {
          return '';
        }
        return this.charakterModal.charakter.journalHtml || '';
      },
      charakterQuillHostRef(el) {
        if (!el) {
          this.charakterQuillInstanz = null;
          this.charakterQuillHostElement = null;
          return;
        }
        if (!this.charakterModal.charakter) {
          return;
        }
        this.$nextTick(() => this.charakterQuillAufHostEinrichten(el));
      },
      charakterQuillAufHostEinrichten(el, retry) {
        const r = typeof retry === 'number' ? retry : 0;
        if (!el || !this.charakterModal.charakter) {
          return;
        }
        if (!window.Quill) {
          if (r < 40) {
            window.setTimeout(() => this.charakterQuillAufHostEinrichten(el, r + 1), 25);
          }
          return;
        }
        if (this.charakterQuillInstanz && this.charakterQuillHostElement === el && el.contains(this.charakterQuillInstanz.root)) {
          return;
        }
        el.innerHTML = '';
        this.charakterQuillInstanz = null;
        this.charakterQuillHostElement = el;
        this.charakterQuillInstanz = new window.Quill(el, {
          theme: 'snow',
          placeholder: 'Notizen zum Charakter…',
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
        this.charakterQuillInstanz.root.innerHTML = this.charakterNotizenHtml();
      },
      normalisiereLp(roh) {
        const n = Math.round(Number(roh));
        if (Number.isNaN(n) || n < 0) {
          return 0;
        }
        return n;
      },
      normalisiereBegabungswert(roh) {
        const n = Math.round(Number(roh));
        if (Number.isNaN(n) || n < 0) {
          return 0;
        }
        return Math.min(40, n);
      },
      normalisiereInitiativeWert(roh, begabungswertHandeln) {
        const txt = typeof roh === 'string' ? roh.trim() : String(roh == null ? '' : roh).trim();
        if (!txt) {
          return '';
        }
        const parsed = Math.round(Number(txt));
        if (Number.isNaN(parsed)) {
          return '';
        }
        const max = Math.max(1, 10 + this.normalisiereBegabungswert(begabungswertHandeln));
        return String(Math.max(1, Math.min(max, parsed)));
      },
      initiativeBadgeText(wert) {
        const t = typeof wert === 'string' ? wert.trim() : '';
        return t;
      },
      verarbeiteCharakterLebenspunkteAenderung(vorher, nach) {
        if (!this.charakterModal.charakter) {
          return;
        }
        const charakter = this.charakterModal.charakter;
        const n = this.normalisiereLp(nach);
        const v = this.normalisiereLp(vorher);
        charakter.lebenspunkte = n;
        if (n === 0) {
          charakter.lpStatusTot = true;
          return;
        }
        charakter.lpStatusTot = false;
        const verlust = v - n;
        if (verlust >= 60) {
          charakter.lpMassenschadenBewusstlos = true;
          charakter.lpBewusstlosAusgeblendet = false;
        }
        if (v > 10 && n >= 1 && n <= 10) {
          charakter.lpBewusstlosAusgeblendet = false;
        }
      },
      onCharakterLebenspunkteFocus() {
        this.charakterModal.lpEingabeAktiv = true;
        this.charakterModal.lpAenderungWaehrenEingabe = false;
        this.charakterModal.lpSnapshotVorEingabe = this.charakterModal.prevLpSnapshot;
      },
      inventarEintragHinzufuegen() {
        if (!this.charakterModal.charakter || !Array.isArray(this.charakterModal.charakter.inventar)) {
          return;
        }
        this.charakterModal.charakter.inventar.push({
          id: window.HTBAH_CHARAKTER_MODEL.neueInventarId(),
          name: '',
          typ: 'gegenstand',
          beschreibungHtml: '',
          schadenswert: '',
          rustwert: '',
          kampfart: 'nahkampf',
        });
      },
      inventarEintragEntfernen(index) {
        if (!this.charakterModal.charakter || !Array.isArray(this.charakterModal.charakter.inventar)) {
          return;
        }
        if (index < 0 || index >= this.charakterModal.charakter.inventar.length) {
          return;
        }
        this.charakterModal.charakter.inventar.splice(index, 1);
      },
      aktualisiereCharakterLpStatus(charakter) {
        if (!charakter || typeof charakter !== 'object') {
          return;
        }
        const lpNum = Number(charakter.lebenspunkte);
        charakter.lebenspunkte = Number.isFinite(lpNum) ? Math.round(lpNum) : 0;
        const status = statusFuerLebenspunkte(charakter);
        charakter.lpStatusTot = !!status.tot;
      },
      onCharakterLebenspunkteBlur() {
        if (!this.charakterModal.charakter) {
          return;
        }
        const char = this.charakterModal.charakter;
        const lpFinal = this.normalisiereLp(char.lebenspunkte);
        char.lebenspunkte = lpFinal;
        const hatteLpAenderung =
          this.charakterModal.lpAenderungWaehrenEingabe || lpFinal !== this.charakterModal.prevLpSnapshot;
        if (hatteLpAenderung) {
          const vorher =
            this.charakterModal.lpAenderungWaehrenEingabe && this.charakterModal.lpSnapshotVorEingabe != null
              ? this.normalisiereLp(this.charakterModal.lpSnapshotVorEingabe)
              : this.charakterModal.prevLpSnapshot;
          this.verarbeiteCharakterLebenspunkteAenderung(vorher, lpFinal);
          this.charakterModal.prevLpSnapshot = this.normalisiereLp(char.lebenspunkte);
        }
        this.charakterModal.lpEingabeAktiv = false;
        this.charakterModal.lpAenderungWaehrenEingabe = false;
        this.charakterModal.lpSnapshotVorEingabe = null;
        this.aktualisiereCharakterLpStatus(char);
        this.refreshGraph();
      },
      speichereCharakterModal() {
        if (!this.charakterModal.charakter || !this.charakterModal.mitgliedId || !this.gruppeId) {
          return;
        }
        const z = window.HTBAH.ladeSpielleiterZustand();
        const g = (z.gruppen || []).find((gr) => gr && gr.id === this.gruppeId);
        if (!g || !Array.isArray(g.mitglieder)) {
          return;
        }
        const idx = g.mitglieder.findIndex((m) => m && m.id === this.charakterModal.mitgliedId);
        if (idx < 0) {
          return;
        }
        const charakter = JSON.parse(JSON.stringify(this.charakterModal.charakter));
        if (this.charakterQuillInstanz) {
          charakter.journalHtml = this.charakterQuillInstanz.root.innerHTML;
        }
        this.aktualisiereCharakterLpStatus(charakter);
        const handelnSumme = Array.isArray(charakter.handeln)
          ? charakter.handeln.reduce((sum, eintrag) => sum + (Number(eintrag && eintrag.value) || 0), 0)
          : 0;
        const handelnBegabungswert = Math.max(0, Math.round(handelnSumme / 10));
        charakter.initiative = this.normalisiereInitiativeWert(charakter.initiative, handelnBegabungswert);
        charakter.aufenthaltsort = String(charakter.aufenthaltsort || '').trim();
        charakter.fraktionen = this.normalisiereFraktionenArray(charakter.fraktionen);
        charakter.fraktion = charakter.fraktionen.length ? charakter.fraktionen[0] : '';
        const gb = charakter.geistesblitzVerbleibend || {};
        charakter.geistesblitzVerbleibend = {
          handeln: Number.isFinite(Number(gb.handeln)) ? Number(gb.handeln) : 0,
          wissen: Number.isFinite(Number(gb.wissen)) ? Number(gb.wissen) : 0,
          soziales: Number.isFinite(Number(gb.soziales)) ? Number(gb.soziales) : 0,
        };
        charakter.inventar = Array.isArray(charakter.inventar)
          ? charakter.inventar.map((item) => window.HTBAH_CHARAKTER_MODEL.inventarEintragNachTypBereinigen({
              id: item && item.id ? item.id : window.HTBAH_CHARAKTER_MODEL.neueInventarId(),
              name: String((item && item.name) || ''),
              typ: item && item.typ ? item.typ : 'gegenstand',
              beschreibungHtml: String((item && item.beschreibungHtml) || ''),
              schadenswert: item ? item.schadenswert : '',
              rustwert: item ? item.rustwert : '',
              kampfart: item && item.kampfart === 'fernkampf' ? 'fernkampf' : 'nahkampf',
            }))
          : [];
        g.mitglieder[idx] = {
          ...g.mitglieder[idx],
          charakter,
        };
        window.HTBAH.speichereSpielleiterZustand(z);
        this.spielleiterTick += 1;
        this.schliesseCharakterModal();
        this.refreshGraph();
      },
      springeZumCharakterAusModal() {
        const node = {
          data: { entityId: this.charakterModal.mitgliedId },
        };
        this.oeffneCharakterBearbeitung(node);
      },
      begrenzeMapScale(wert) {
        return Math.min(MAP_ZOOM_MAX, Math.max(MAP_ZOOM_MIN, Number(wert) || 1));
      },
      setzeMapScaleMitAnker(neueScale, clientX, clientY) {
        const scaleAlt = Number(this.map.scale) || 1;
        const scaleNeu = this.begrenzeMapScale(neueScale);
        if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
          this.map.scale = scaleNeu;
          return;
        }
        const weltX = (clientX - this.map.offsetX) / scaleAlt;
        const weltY = (clientY - this.map.offsetY) / scaleAlt;
        this.map.scale = scaleNeu;
        this.map.offsetX = clientX - weltX * scaleNeu;
        this.map.offsetY = clientY - weltY * scaleNeu;
      },
      erstelleVerlaufSnapshot() {
        const nodePositionen = {};
        (this.graph.nodes || []).forEach((node) => {
          if (!node || !node.id || !node.position) {
            return;
          }
          nodePositionen[node.id] = {
            x: Math.round(Number(node.position.x) || 0),
            y: Math.round(Number(node.position.y) || 0),
          };
        });
        return {
          gruppeKey: this.graph.gruppeKey || this.gruppeId || 'default',
          scale: Number(this.map.scale) || 1,
          offsetX: Number(this.map.offsetX) || 0,
          offsetY: Number(this.map.offsetY) || 0,
          nodePositionen,
        };
      },
      snapshotsSindGleich(a, b) {
        if (!a || !b) {
          return false;
        }
        if (
          a.gruppeKey !== b.gruppeKey ||
          a.scale !== b.scale ||
          a.offsetX !== b.offsetX ||
          a.offsetY !== b.offsetY
        ) {
          return false;
        }
        const aKeys = Object.keys(a.nodePositionen || {});
        const bKeys = Object.keys(b.nodePositionen || {});
        if (aKeys.length !== bKeys.length) {
          return false;
        }
        return aKeys.every((key) => {
          const pa = a.nodePositionen[key];
          const pb = b.nodePositionen[key];
          return !!pb && pa.x === pb.x && pa.y === pb.y;
        });
      },
      verlaufZuruecksetzen() {
        if (this.verlauf.zoomCommitTimer) {
          window.clearTimeout(this.verlauf.zoomCommitTimer);
          this.verlauf.zoomCommitTimer = 0;
        }
        this.verlauf.undoStack = [];
        this.verlauf.redoStack = [];
        this.verlauf.pendingBefore = null;
      },
      starteVerlaufAktion() {
        if (!this.verlauf.pendingBefore) {
          this.verlauf.pendingBefore = this.erstelleVerlaufSnapshot();
        }
      },
      bestaetigeVerlaufAktion() {
        if (!this.verlauf.pendingBefore) {
          return;
        }
        const vorher = this.verlauf.pendingBefore;
        const nachher = this.erstelleVerlaufSnapshot();
        this.verlauf.pendingBefore = null;
        if (this.snapshotsSindGleich(vorher, nachher)) {
          return;
        }
        this.verlauf.undoStack.push(vorher);
        if (this.verlauf.undoStack.length > 120) {
          this.verlauf.undoStack.splice(0, this.verlauf.undoStack.length - 120);
        }
        this.verlauf.redoStack = [];
      },
      planeZoomVerlaufCommit() {
        if (this.verlauf.zoomCommitTimer) {
          window.clearTimeout(this.verlauf.zoomCommitTimer);
        }
        this.verlauf.zoomCommitTimer = window.setTimeout(() => {
          this.verlauf.zoomCommitTimer = 0;
          this.bestaetigeVerlaufAktion();
        }, 220);
      },
      wendeSnapshotAn(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
          return;
        }
        this.map.scale = this.begrenzeMapScale(snapshot.scale);
        this.map.offsetX = Number(snapshot.offsetX) || 0;
        this.map.offsetY = Number(snapshot.offsetY) || 0;
        (this.graph.nodes || []).forEach((node) => {
          const pos = snapshot.nodePositionen && snapshot.nodePositionen[node.id];
          if (!pos) {
            return;
          }
          node.position = {
            x: Math.round(Number(pos.x) || 0),
            y: Math.round(Number(pos.y) || 0),
          };
        });
        const gruppeKey = snapshot.gruppeKey || this.graph.gruppeKey || this.gruppeId || 'default';
        const aktuelleLayouts = this.ladeLayouts();
        const next = { ...aktuelleLayouts };
        const gruppeLayout = { ...(next[gruppeKey] || {}) };
        Object.keys(snapshot.nodePositionen || {}).forEach((nodeId) => {
          const pos = snapshot.nodePositionen[nodeId];
          gruppeLayout[nodeId] = {
            x: Math.round(Number(pos.x) || 0),
            y: Math.round(Number(pos.y) || 0),
          };
        });
        next[gruppeKey] = gruppeLayout;
        this.speichereLayout(next);
        this.graph.layoutAlle = next;
      },
      verlaufUndo() {
        if (!this.kannUndo) {
          return;
        }
        const vorher = this.verlauf.undoStack.pop();
        const jetzt = this.erstelleVerlaufSnapshot();
        this.verlauf.redoStack.push(jetzt);
        this.wendeSnapshotAn(vorher);
      },
      verlaufRedo() {
        if (!this.kannRedo) {
          return;
        }
        const nachher = this.verlauf.redoStack.pop();
        const jetzt = this.erstelleVerlaufSnapshot();
        this.verlauf.undoStack.push(jetzt);
        this.wendeSnapshotAn(nachher);
      },
      mapViewportMitteClient() {
        const canvas = this.$el && this.$el.querySelector ? this.$el.querySelector('.htbah-weltenbau-map-canvas') : null;
        if (!canvas || typeof canvas.getBoundingClientRect !== 'function') {
          return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }
        const rect = canvas.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      },
      mapZoomIn() {
        this.starteVerlaufAktion();
        const mitte = this.mapViewportMitteClient();
        this.setzeMapScaleMitAnker((Number(this.map.scale) || 1) * 1.12, mitte.x, mitte.y);
        this.bestaetigeVerlaufAktion();
      },
      mapZoomOut() {
        this.starteVerlaufAktion();
        const mitte = this.mapViewportMitteClient();
        this.setzeMapScaleMitAnker((Number(this.map.scale) || 1) / 1.12, mitte.x, mitte.y);
        this.bestaetigeVerlaufAktion();
      },
      mapZoomReset() {
        this.starteVerlaufAktion();
        const mitte = this.mapViewportMitteClient();
        this.setzeMapScaleMitAnker(1, mitte.x, mitte.y);
        this.bestaetigeVerlaufAktion();
      },
      speichereTouchPointer(event) {
        if (!event || !Number.isFinite(event.pointerId)) {
          return;
        }
        this.map.touchPointer[event.pointerId] = { x: event.clientX, y: event.clientY };
      },
      entferneTouchPointer(event) {
        if (!event || !Number.isFinite(event.pointerId)) {
          return;
        }
        delete this.map.touchPointer[event.pointerId];
      },
      touchPointerListe() {
        return Object.values(this.map.touchPointer || {});
      },
      berechnePinchMitte(pointerListe) {
        const a = pointerListe && pointerListe[0];
        const b = pointerListe && pointerListe[1];
        if (!a || !b) {
          return null;
        }
        return {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
        };
      },
      berechnePinchAbstand(pointerListe) {
        const a = pointerListe && pointerListe[0];
        const b = pointerListe && pointerListe[1];
        if (!a || !b) {
          return 0;
        }
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
      },
      startePinch(pointerListe) {
        const mitte = this.berechnePinchMitte(pointerListe);
        const distanz = this.berechnePinchAbstand(pointerListe);
        if (!mitte || distanz <= 0) {
          return;
        }
        this.starteVerlaufAktion();
        this.map.pinchAktiv = true;
        this.map.panning = false;
        this.map.pinchStartAbstand = distanz;
        this.map.pinchStartScale = Number(this.map.scale) || 1;
        this.map.pinchWeltX = (mitte.x - this.map.offsetX) / this.map.pinchStartScale;
        this.map.pinchWeltY = (mitte.y - this.map.offsetY) / this.map.pinchStartScale;
      },
      startePan(event) {
        if (event.target && typeof event.target.closest === 'function' && event.target.closest('.htbah-map-node')) {
          return;
        }
        if (event.pointerType === 'touch') {
          this.speichereTouchPointer(event);
          const pointerListe = this.touchPointerListe();
          if (pointerListe.length >= 2) {
            this.startePinch(pointerListe);
            event.preventDefault();
            return;
          }
        }
        this.starteVerlaufAktion();
        this.map.panning = true;
        this.map.panStartX = event.clientX;
        this.map.panStartY = event.clientY;
        this.map.panOffsetStartX = this.map.offsetX;
        this.map.panOffsetStartY = this.map.offsetY;
      },
      onMapPointerMove(event) {
        if (event.pointerType === 'touch') {
          this.speichereTouchPointer(event);
          if (this.map.pinchAktiv) {
            const pointerListe = this.touchPointerListe();
            if (pointerListe.length >= 2 && this.map.pinchStartAbstand > 0) {
              const mitte = this.berechnePinchMitte(pointerListe);
              const distanz = this.berechnePinchAbstand(pointerListe);
              const faktor = distanz / this.map.pinchStartAbstand;
              const scaleNeu = this.begrenzeMapScale(this.map.pinchStartScale * faktor);
              this.map.scale = scaleNeu;
              this.map.offsetX = mitte.x - this.map.pinchWeltX * scaleNeu;
              this.map.offsetY = mitte.y - this.map.pinchWeltY * scaleNeu;
              event.preventDefault();
              return;
            }
          }
        }
        if (this.nodeDrag.aktiv) {
          const node = this.findeNode(this.nodeDrag.nodeId);
          if (!node) {
            return;
          }
          const dx = (event.clientX - this.nodeDrag.startClientX) / this.map.scale;
          const dy = (event.clientY - this.nodeDrag.startClientY) / this.map.scale;
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            this.nodeDrag.bewegt = true;
          }
          node.position = {
            x: Math.max(0, Math.round(this.nodeDrag.startNodeX + dx)),
            y: Math.max(0, Math.round(this.nodeDrag.startNodeY + dy)),
          };
          const hoverZiel = this.findeUeberlappendesZuordnungsZiel(node);
          this.setzeDragHoverZiel(hoverZiel && hoverZiel.id ? hoverZiel.id : '');
          return;
        }
        if (!this.map.panning) {
          return;
        }
        this.map.offsetX = this.map.panOffsetStartX + (event.clientX - this.map.panStartX);
        this.map.offsetY = this.map.panOffsetStartY + (event.clientY - this.map.panStartY);
      },
      onMapPointerUp(event) {
        if (event.pointerType === 'touch') {
          this.entferneTouchPointer(event);
          const pointerListe = this.touchPointerListe();
          if (this.map.pinchAktiv && pointerListe.length < 2) {
            this.map.pinchAktiv = false;
            this.map.pinchStartAbstand = 0;
            if (pointerListe.length === 1) {
              const pointer = pointerListe[0];
              this.map.panning = true;
              this.map.panStartX = pointer.x;
              this.map.panStartY = pointer.y;
              this.map.panOffsetStartX = this.map.offsetX;
              this.map.panOffsetStartY = this.map.offsetY;
              return;
            }
            this.bestaetigeVerlaufAktion();
          }
        }
        if (this.nodeDrag.aktiv) {
          const node = this.findeNode(this.nodeDrag.nodeId);
          if (node) {
            this.schreibeNodePosition(node.id, node.position, this.graph.gruppeKey);
            this.zuletztGezogeneNodeId = this.nodeDrag.bewegt ? node.id : '';
            if (this.zuletztGezogeneNodeId) {
              window.setTimeout(() => {
                if (this.zuletztGezogeneNodeId === node.id) {
                  this.zuletztGezogeneNodeId = '';
                }
              }, 220);
            }
            if (node.data && node.data.entityType !== 'ort') {
              let wurdeAktualisiert = false;
              if (this.nodeDrag.bewegt) {
                const dropTarget =
                  this.findeDropTargetNode(event, node.id) ||
                  (this.map.dragHoverNodeId ? this.findeNode(this.map.dragHoverNodeId) : null);
                wurdeAktualisiert = this.wendeDropVerknuepfungAn(node, dropTarget);
              }
              if (!wurdeAktualisiert && node.data.entityType !== 'charakter') {
                const nah = this.naechsterOrtNodeZu(node);
                if (nah && nah.closest && nah.distance < 260) {
                  const ortName = (nah.closest.data && nah.closest.data.payload && nah.closest.data.payload.name) || '';
                  this.updateAufenthaltsort(node.data.entityType, node.data.entityId, ortName);
                  wurdeAktualisiert = true;
                }
              }
              if (wurdeAktualisiert) {
                this.refreshGraph();
              }
            }
          }
        }
        this.nodeDrag.aktiv = false;
        this.nodeDrag.nodeId = '';
        this.setzeDragHoverZiel('');
        this.map.panning = false;
        this.bestaetigeVerlaufAktion();
      },
      onMapWheel(event) {
        this.starteVerlaufAktion();
        const faktor = Math.exp(-event.deltaY * 0.0015);
        this.setzeMapScaleMitAnker((Number(this.map.scale) || 1) * faktor, event.clientX, event.clientY);
        this.planeZoomVerlaufCommit();
      },
      istEditierbaresElement(el) {
        if (!el || typeof el.closest !== 'function') {
          return false;
        }
        return !!el.closest('input, textarea, select, [contenteditable="true"], .ql-editor');
      },
      onGlobalKeydown(event) {
        if (!this.offen || !event) {
          return;
        }
        if (!(event.ctrlKey || event.metaKey)) {
          return;
        }
        if (this.istEditierbaresElement(event.target)) {
          return;
        }
        const key = String(event.key || '').toLowerCase();
        if (key === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            this.verlaufRedo();
          } else {
            this.verlaufUndo();
          }
          return;
        }
        if (key === 'y') {
          event.preventDefault();
          this.verlaufRedo();
        }
      },
      updateAufenthaltsort(entityType, entityId, ortName) {
        const listeName =
          entityType === 'npc'
            ? 'npcs'
            : entityType === 'bestie'
              ? 'bestien'
              : entityType === 'raetsel'
                ? 'raetsel'
                : 'gegenstande';
        if (listeName === 'gegenstande') {
          this.zustand.gegenstaende = (this.zustand.gegenstaende || []).map((g) =>
            g.id === entityId ? { ...g, aufenthaltsort: ortName } : g,
          );
        } else if (listeName === 'raetsel') {
          this.zustand.raetsel = (this.zustand.raetsel || []).map((e) =>
            e.id === entityId ? { ...e, aufenthaltsort: ortName } : e,
          );
        } else {
          this.zustand[listeName] = (this.zustand[listeName] || []).map((e) =>
            e.id === entityId ? { ...e, aufenthaltsort: ortName } : e,
          );
        }
        this.speichereZustand();
      },
      oeffneDetail(node) {
        this.detail = node && node.data ? node.data : null;
        this.modal.detailsOffen = !!this.detail;
      },
      starteBearbeitungAusDetail() {
        if (!this.detail || !this.detail.entityType || !this.detail.entityId) {
          return;
        }
        const typ = this.detail.entityType;
        if (typ === 'charakter') {
          return;
        }
        const liste =
          typ === 'ort'
            ? this.zustand.orte || []
            : typ === 'npc'
              ? this.zustand.npcs || []
              : typ === 'fraktion'
                ? this.zustand.fraktionen || []
              : typ === 'bestie'
                ? this.zustand.bestien || []
                : typ === 'raetsel'
                  ? this.zustand.raetsel || []
                  : this.zustand.gegenstaende || [];
        const index = liste.findIndex((z) => z && z.id === this.detail.entityId);
        if (index < 0) {
          return;
        }
        const zeile = JSON.parse(JSON.stringify(liste[index]));
        if (!Array.isArray(zeile.medien)) {
          zeile.medien = [];
        }
        if (typ === 'fraktion') {
          zeile.orte = this.fraktionOrteListe(zeile);
        }
        this.anlage.typ = typ;
        this.anlage.index = index;
        this.anlage.zeile = zeile;
        this.anlage.offen = true;
        this.zeileQuillSession += 1;
        this.modal.detailsOffen = false;
      },
      neueAnlageZeile(typ) {
        const ortDefault = ((this.zustand.orte || [])[0] && (this.zustand.orte || [])[0].name) || '';
        if (typ === 'ort') {
          return {
            id: window.HTBAH.neueEntropieId(),
            name: '',
            groesse: '',
            lage: '',
            zustand: '',
            notizenHtml: '',
            medien: [],
          };
        }
        if (typ === 'npc') {
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
            lebenspunkte: '60',
            waffe: '',
            schadenswert: '',
            kampfart: 'nahkampf',
            aufenthaltsort: ortDefault,
            handeln: 12,
            wissen: 14,
            soziales: 14,
            initiative: '',
            fraktion: '',
            glaube: '',
            lpBewusstlosAusgeblendet: false,
            lpMassenschadenBewusstlos: false,
            notizenHtml: '',
            medien: [],
          };
        }
        if (typ === 'bestie') {
          return {
            id: window.HTBAH.neueEntropieId(),
            epoche: 'mittelalter',
            kategorie: 'normales_tier',
            name: '',
            angriff: '',
            verteidigung: '',
            lebenspunkte: '60',
            aufenthaltsort: ortDefault,
            handeln: 16,
            wissen: 8,
            soziales: 16,
            initiative: '',
            fraktionen: [],
            staerke: '',
            schwaeche: '',
            beschreibungHtml: '',
            aggressivitaetSkala: 5,
            lpBewusstlosAusgeblendet: false,
            lpMassenschadenBewusstlos: false,
            medien: [],
          };
        }
        if (typ === 'fraktion') {
          return {
            id: window.HTBAH.neueEntropieId(),
            art: '',
            name: '',
            ziel: '',
            gesinnungVerhalten: '',
            orte: [],
            beschreibungHtml: '',
            medien: [],
          };
        }
        if (typ === 'raetsel') {
          return {
            id: window.HTBAH.neueEntropieId(),
            art: '',
            titel: '',
            aufenthaltsort: ortDefault,
            aufgabeWas: '',
            aufgabenstellung: '',
            ergebnis: '',
            schwierigkeit: '',
            geloest: false,
            notizenHtml: '',
            medien: [],
          };
        }
        return {
          id: window.HTBAH.neueEntropieId(),
          name: '',
          istWaffe: false,
          schadenswert: '',
          kampfart: 'nahkampf',
          aufenthaltsort: ortDefault,
          initiative: '',
          beschreibungHtml: '',
          medien: [],
        };
      },
      starteAnlageFlow(typ) {
        if (!typ) {
          return;
        }
        this.anlage.typ = typ;
        this.anlage.index = -1;
        this.anlage.zeile = this.neueAnlageZeile(typ);
        this.anlage.offen = true;
        this.zeileQuillSession += 1;
      },
      zufallsvorschlagUebernehmen() {
        if (!this.anlage.zeile || !this.anlage.typ || !this.zufallsgeneratorBereit) {
          return;
        }
        const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
        const typ = this.anlage.typ;
        const z = this.anlage.zeile;
        let felder = {};
        if (typ === 'npc') {
          const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
          const fraktionNamen = (this.zustand.fraktionen || []).map((f) => (f && f.name ? String(f.name) : ''));
          const pantheonNamen = (this.zustand.pantheon || []).map((p) => (p && p.name ? String(p.name) : ''));
          felder = G.npc({ epoche: this.zufallNpcEpoche, orteNamen, fraktionNamen, pantheonNamen });
        } else if (typ === 'ort') {
          felder = G.ort();
        } else if (typ === 'fraktion') {
          felder = G.fraktion({ epoche: this.zufallFraktionEpoche });
        } else if (typ === 'bestie') {
          const ep = z && z.epoche ? String(z.epoche) : 'mittelalter';
          const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
          felder = G.bestie({ epoche: ep, orteNamen });
        } else if (typ === 'raetsel') {
          const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
          const npcNamen = (this.zustand.npcs || []).map((n) => (n && n.name ? String(n.name) : ''));
          felder = G.raetsel({
            epoche: this.zufallRaetselEpoche,
            orteNamen,
            npcNamen,
          });
        } else if (typ === 'gegenstand') {
          const orteNamen = (this.zustand.orte || []).map((o) => (o && o.name ? String(o.name) : ''));
          felder = G.gegenstand({
            epoche: this.zufallGegenstandEpoche,
            mitKleidung: this.zufallGegenstandKleidung,
            orteNamen,
          });
        }
        this.anlage.zeile = {
          ...this.anlage.zeile,
          ...felder,
          id: this.anlage.zeile.id,
          medien: Array.isArray(this.anlage.zeile.medien) ? this.anlage.zeile.medien : [],
        };
        this.$nextTick(() => {
          if (this.zeileQuillInstanz) {
            this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
          }
        });
      },
      htmlFuerQuillAusBearbeitung() {
        if (!this.anlage.zeile || !this.anlage.typ) {
          return '';
        }
        if (this.anlage.typ === 'npc' || this.anlage.typ === 'ort' || this.anlage.typ === 'raetsel') {
          return this.anlage.zeile.notizenHtml || '';
        }
        return this.anlage.zeile.beschreibungHtml || '';
      },
      zeileQuillHostRef(el) {
        if (!el) {
          this.zeileQuillInstanz = null;
          this.zeileQuillHostElement = null;
          return;
        }
        if (!this.anlage.zeile) {
          return;
        }
        this.$nextTick(() => this.zeileQuillAufHostEinrichten(el));
      },
      zeileQuillAufHostEinrichten(el, retry) {
        const r = typeof retry === 'number' ? retry : 0;
        if (!el || !this.anlage.zeile) {
          return;
        }
        if (!window.Quill) {
          if (r < 40) {
            window.setTimeout(() => this.zeileQuillAufHostEinrichten(el, r + 1), 25);
          }
          return;
        }
        if (this.zeileQuillInstanz && this.zeileQuillHostElement === el && el.contains(this.zeileQuillInstanz.root)) {
          return;
        }
        el.innerHTML = '';
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
      quillHtmlInBearbeitungSchreiben() {
        if (!this.anlage.zeile || !this.zeileQuillInstanz) {
          return;
        }
        const html = this.zeileQuillInstanz.root.innerHTML;
        if (this.anlage.typ === 'npc' || this.anlage.typ === 'ort' || this.anlage.typ === 'raetsel') {
          this.anlage.zeile.notizenHtml = html;
        } else {
          this.anlage.zeile.beschreibungHtml = html;
        }
      },
      async onBearbeitungsMedienDateienGewaehlt(ev) {
        if (!this.anlage.zeile) {
          return;
        }
        const input = ev && ev.target;
        const dateien = input && input.files ? Array.from(input.files) : [];
        if (input) {
          input.value = '';
        }
        if (!dateien.length) {
          return;
        }
        const neu = [];
        for (const file of dateien) {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.readAsDataURL(file);
          }).catch(() => '');
          if (!dataUrl) {
            continue;
          }
          const mimeType = String(file.type || '').trim();
          neu.push({
            id: window.HTBAH.neueEntropieId(),
            typ: mimeType.startsWith('image/') ? 'bild' : 'datei',
            name: String(file.name || '').trim() || 'Datei',
            mimeType,
            dataUrl,
            size: Number.isFinite(file.size) ? Math.round(file.size) : null,
            createdAt: new Date().toISOString(),
          });
        }
        this.anlage.zeile.medien = [...(Array.isArray(this.anlage.zeile.medien) ? this.anlage.zeile.medien : []), ...neu];
      },
      mediumIstBild(medium) {
        if (!medium || typeof medium !== 'object') {
          return false;
        }
        if (medium.typ === 'bild') {
          return true;
        }
        return typeof medium.mimeType === 'string' && medium.mimeType.startsWith('image/');
      },
      mediumDateiname(medium) {
        const t = String((medium && medium.name) || '').trim();
        if (t) {
          return t;
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
        return formatBytes(medium && medium.size);
      },
      mediumImBildbetrachterOeffnen(medium) {
        if (!this.mediumIstBild(medium) || typeof window.HTBAH.bildbetrachterOeffnen !== 'function') {
          return;
        }
        window.HTBAH.bildbetrachterOeffnen({
          dataUrl: medium.dataUrl,
          titel: this.mediumDateiname(medium),
        });
      },
      mediumHerunterladen(medium) {
        if (!medium || typeof medium.dataUrl !== 'string' || !medium.dataUrl) {
          return;
        }
        const a = document.createElement('a');
        a.href = medium.dataUrl;
        a.download = this.mediumDateiname(medium);
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      mediumAusBearbeitungEntfernen(index) {
        if (!this.anlage.zeile || !Array.isArray(this.anlage.zeile.medien)) {
          return;
        }
        if (!Number.isInteger(index) || index < 0 || index >= this.anlage.zeile.medien.length) {
          return;
        }
        this.anlage.zeile.medien.splice(index, 1);
      },
      schliesseAnlageModal() {
        this.zeileQuillInstanz = null;
        this.zeileQuillHostElement = null;
        this.anlage.offen = false;
        this.anlage.typ = '';
        this.anlage.zeile = null;
        this.anlage.index = -1;
      },
      speichereAnlage() {
        if (!this.anlage.offen || !this.anlage.zeile || !this.anlage.typ) {
          return;
        }
        this.quillHtmlInBearbeitungSchreiben();
        const typ = this.anlage.typ;
        const index = Number.isInteger(this.anlage.index) ? this.anlage.index : -1;
        const z = JSON.parse(JSON.stringify(this.anlage.zeile));
        if (typ === 'npc') {
          z.handeln = this.normalisiereBegabungswert(z.handeln);
          z.wissen = this.normalisiereBegabungswert(z.wissen);
          z.soziales = this.normalisiereBegabungswert(z.soziales);
          z.initiative = this.normalisiereInitiativeWert(z.initiative, z.handeln);
        } else if (typ === 'bestie') {
          z.handeln = this.normalisiereBegabungswert(z.handeln);
          z.wissen = this.normalisiereBegabungswert(z.wissen);
          z.soziales = this.normalisiereBegabungswert(z.soziales);
          z.initiative = this.normalisiereInitiativeWert(z.initiative, z.handeln);
          z.fraktionen = this.normalisiereFraktionenArray(z.fraktionen);
        } else if (typ === 'gegenstand') {
          z.initiative = this.normalisiereInitiativeWert(z.initiative, 40);
        }
        if (typ === 'ort') {
          if (index >= 0) {
            this.zustand.orte = (this.zustand.orte || []).map((row, i) => (i === index ? z : row));
          } else {
            this.zustand.orte = [...(this.zustand.orte || []), z];
          }
        } else if (typ === 'npc') {
          if (index >= 0) {
            this.zustand.npcs = (this.zustand.npcs || []).map((row, i) => (i === index ? z : row));
          } else {
            this.zustand.npcs = [...(this.zustand.npcs || []), z];
          }
        } else if (typ === 'fraktion') {
          z.orte = this.fraktionOrteListe(z);
          if (index >= 0) {
            this.zustand.fraktionen = (this.zustand.fraktionen || []).map((row, i) => (i === index ? z : row));
          } else {
            this.zustand.fraktionen = [...(this.zustand.fraktionen || []), z];
          }
        } else if (typ === 'bestie') {
          if (index >= 0) {
            this.zustand.bestien = (this.zustand.bestien || []).map((row, i) => (i === index ? z : row));
          } else {
            this.zustand.bestien = [...(this.zustand.bestien || []), z];
          }
        } else if (typ === 'raetsel') {
          if (index >= 0) {
            this.zustand.raetsel = (this.zustand.raetsel || []).map((row, i) => (i === index ? z : row));
          } else {
            this.zustand.raetsel = [...(this.zustand.raetsel || []), z];
          }
        } else if (typ === 'gegenstand') {
          if (index >= 0) {
            this.zustand.gegenstaende = (this.zustand.gegenstaende || []).map((row, i) => (i === index ? z : row));
          } else {
            this.zustand.gegenstaende = [...(this.zustand.gegenstaende || []), z];
          }
        }
        this.speichereZustand();
        this.schliesseAnlageModal();
        this.$nextTick(() => this.refreshGraph());
      },
      onResize() {
        if (this.offen) {
          this.$nextTick(() => this.stelleSichtbaresFensterSicher());
        }
      },
    },
    watch: {
      offen(neu) {
        if (neu) {
          this.aktualisiereZustand();
          this.uebernehmeMapEinstellungen();
          this.$nextTick(() => {
            this.initialisierePosition();
            this.refreshGraph();
            this.verlaufZuruecksetzen();
          });
        } else {
          this.nodeDrag.aktiv = false;
          this.map.panning = false;
          this.map.pinchAktiv = false;
          this.map.touchPointer = {};
          this.setzeDragHoverZiel('');
          this.verlaufZuruecksetzen();
        }
      },
      gruppeId() {
        if (this.offen) {
          this.uebernehmeMapEinstellungen();
          this.$nextTick(() => {
            this.refreshGraph();
            this.verlaufZuruecksetzen();
          });
        }
      },
      'map.edgeColor'(neu) {
        if (typeof neu === 'string' && /^#[0-9a-fA-F]{6}$/.test(neu)) {
          this.speichereMapEinstellung('edgeColor', neu);
        }
      },
      sichtbarkeitsFilter: {
        deep: true,
        handler() {
          this.speichereMapEinstellung('sichtbarkeitsFilter', this.sichtbarkeitsFilter);
          if (this.offen) {
            this.$nextTick(() => this.refreshGraph());
          }
        },
      },
      'map.itemScale'(neu) {
        if (Number.isFinite(Number(neu))) {
          const normalisiert = Math.max(0, Math.min(500, Math.round(Number(neu))));
          if (normalisiert !== neu) {
            this.map.itemScale = normalisiert;
            return;
          }
          this.speichereMapEinstellung('itemScale', normalisiert);
        }
        if (this.offen) {
          this.$nextTick(() => this.refreshGraph());
        }
      },
      'map.edgeWidth'(neu) {
        if (!Number.isFinite(Number(neu))) {
          return;
        }
        const normalisiert = Math.max(1, Math.min(16, Math.round(Number(neu))));
        if (normalisiert !== neu) {
          this.map.edgeWidth = normalisiert;
          return;
        }
        this.speichereMapEinstellung('edgeWidth', normalisiert);
      },
    },
    mounted() {
      window.addEventListener('resize', this.onResize);
      window.addEventListener('pointermove', this.onMapPointerMove);
      window.addEventListener('pointerup', this.onMapPointerUp);
      window.addEventListener('pointercancel', this.onMapPointerUp);
      window.addEventListener('keydown', this.onGlobalKeydown);
    },
    beforeUnmount() {
      this.verlaufZuruecksetzen();
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('pointermove', this.onMapPointerMove);
      window.removeEventListener('pointerup', this.onMapPointerUp);
      window.removeEventListener('pointercancel', this.onMapPointerUp);
      window.removeEventListener('keydown', this.onGlobalKeydown);
    },
    template: `
      <div v-if="offen" class="regelwerk-modal-layer htbah-weltenbau-map-layer">
        <div
          ref="fensterElement"
          class="regelwerk-modal-window card shadow htbah-weltenbau-map-window"
          :class="{ 'regelwerk-modal-window-fullscreen': modal.istVollbild }"
          :style="fensterStil">
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2 htbah-weltenbau-map-header" @pointerdown="starteZiehen($event)">
            <h6 class="mb-0 htbah-weltenbau-map-title">Interaktive Welt</h6>
            <div class="d-flex align-items-center gap-1 htbah-weltenbau-map-actions">
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click="starteAnlageFlow('ort')">
                  Hinzufügen
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary dropdown-toggle dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-label="Typ zum Hinzufügen wählen">
                  <span class="visually-hidden">Weitere Typen</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('ort')">Ort</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('npc')">NPC</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('fraktion')">Fraktion</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('bestie')">Bestie</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('raetsel')">Rätsel</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('gegenstand')">Gegenstand</button></li>
                </ul>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false">
                  Einstellungen
                  <span v-if="ausgeblendeteFilterAnzahl" class="badge text-bg-secondary ms-1">
                    {{ ausgeblendeteFilterAnzahl }}
                  </span>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 280px;">
                  <label class="form-label small text-secondary mb-1" for="wb-item-scale">
                    Canvas-Item-Größe: {{ itemScaleProzent }}%
                  </label>
                  <input
                    id="wb-item-scale"
                    class="form-range mb-3"
                    type="range"
                    min="0"
                    max="500"
                    step="5"
                    v-model.number="map.itemScale" />
                  <label class="form-label small text-secondary mb-1" for="wb-edge-color">
                    Linienfarbe
                  </label>
                  <input
                    id="wb-edge-color"
                    class="form-control form-control-color w-100 mb-2"
                    type="color"
                    v-model="map.edgeColor" />
                  <label class="form-label small text-secondary mb-1" for="wb-edge-width">
                    Linien-Dicke: {{ map.edgeWidth }} px
                  </label>
                  <input
                    id="wb-edge-width"
                    class="form-range mb-2"
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    v-model.number="map.edgeWidth" />
                  <hr class="my-2" />
                  <div class="form-check form-switch mb-2">
                    <input
                      id="wb-filter-tote-npcs"
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      v-model="sichtbarkeitsFilter.toteNpcsAnzeigen" />
                    <label class="form-check-label" for="wb-filter-tote-npcs">
                      Tote NPCs anzeigen
                    </label>
                  </div>
                  <div class="form-check form-switch mb-2">
                    <input
                      id="wb-filter-tote-bestien"
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      v-model="sichtbarkeitsFilter.toteBestienAnzeigen" />
                    <label class="form-check-label" for="wb-filter-tote-bestien">
                      Tote Bestien anzeigen
                    </label>
                  </div>
                  <div class="form-check form-switch mb-0">
                    <input
                      id="wb-filter-geloeste-raetsel"
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      v-model="sichtbarkeitsFilter.geloesteRaetselAnzeigen" />
                    <label class="form-check-label" for="wb-filter-geloeste-raetsel">
                      Gelöste Rätsel anzeigen
                    </label>
                  </div>
                </div>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="!kannUndo"
                  @click="verlaufUndo"
                  aria-label="Rückgängig">
                  ↶
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="!kannRedo"
                  @click="verlaufRedo"
                  aria-label="Wiederholen">
                  ↷
                </button>
              </div>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="mapZoomOut" aria-label="Zoom verkleinern">
                  −
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="mapZoomReset" :title="'Aktueller Zoom: ' + mapScaleLabel">
                  {{ mapScaleLabel }}
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="mapZoomIn" aria-label="Zoom vergrößern">
                  +
                </button>
              </div>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                  Hintergrund
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <button class="dropdown-item" type="button" @click="hintergrundDateiInputClick">
                      Bild hochladen
                    </button>
                  </li>
                  <li>
                    <button
                      class="dropdown-item"
                      type="button"
                      :disabled="!mapHintergrundDataUrl"
                      @click="mapHintergrundBearbeiten">
                      Bild bearbeiten
                    </button>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <button
                      class="dropdown-item text-danger"
                      type="button"
                      :disabled="!mapHintergrundDataUrl"
                      @click="mapHintergrundLoeschen">
                      Bild löschen
                    </button>
                  </li>
                </ul>
              </div>
              <button type="button" class="regelwerk-icon-button" @click="vollbildUmschalten">
                <span class="material-symbols-outlined">{{ modal.istVollbild ? 'close_fullscreen' : 'open_in_full' }}</span>
              </button>
              <button type="button" class="btn-close" @click="schliessen"></button>
            </div>
          </div>
          <div class="htbah-weltenbau-map-content">
            <input
              ref="hintergrundDateiInput"
              type="file"
              class="d-none"
              accept="image/*"
              @change="onHintergrundDateiGewaehlt" />
            <div
              class="htbah-weltenbau-map-canvas"
              @pointerdown="startePan($event)"
              @wheel.prevent="onMapWheel($event)">
              <div class="htbah-weltenbau-map-stage" :style="mapStageStyle">
                <div
                  v-if="mapHintergrundDataUrl"
                  class="htbah-weltenbau-map-hintergrund"
                  :style="mapHintergrundLayerStyle"></div>
                <div
                  v-if="mapHintergrundDataUrl"
                  class="htbah-weltenbau-map-grid-overlay"
                  aria-hidden="true"></div>
                <svg class="htbah-weltenbau-map-edges" :width="map.stageWidth" :height="map.stageHeight">
                  <line
                    v-for="kante in kantenLinien"
                    :key="kante.id"
                    :x1="kante.x1"
                    :y1="kante.y1"
                    :x2="kante.x2"
                    :y2="kante.y2"
                    :stroke="map.edgeColor"
                    stroke-opacity="0.8"
                    :stroke-width="map.edgeWidth" />
                </svg>
                <button
                  v-for="node in graph.nodes"
                  :key="node.id"
                  type="button"
                  :data-node-id="node.id"
                  :class="nodeKlassen(node)"
                  :style="nodeStil(node)"
                  @pointerdown.stop="starteNodeDrag($event, node)"
                  @click.stop="onNodeClick(node)">
                  <template v-if="node.data && node.data.entityType === 'charakter'">
                    <div class="d-flex align-items-center gap-2">
                      <div class="htbah-map-charakter-avatar-wrap">
                        <img
                          v-if="node.data.charakterBild"
                          :src="node.data.charakterBild"
                          alt="Charakterbild"
                          class="htbah-map-charakterbild" />
                        <div v-else class="htbah-map-charakterbild htbah-map-charakter-emoji">🧙</div>
                        <div v-if="node.data.statusEmoji" class="htbah-map-charakter-status">{{ node.data.statusEmoji }}</div>
                      </div>
                      <div class="text-start">
                        <span>{{ node.data && node.data.label ? node.data.label : 'Charakter' }}</span>
                        <span
                          v-if="node.data && initiativeBadgeText(node.data.initiative)"
                          class="badge rounded-pill text-bg-info ms-1">
                          INI {{ initiativeBadgeText(node.data.initiative) }}
                        </span>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="position-relative">
                      {{ node.data && node.data.label ? node.data.label : 'Eintrag' }}
                      <span
                        v-if="node.data && node.data.entityType === 'fraktion' && Number(node.data.multiOrtCount) > 1"
                        class="badge rounded-pill text-bg-secondary ms-1"
                        :title="'Diese Fraktion ist ' + Number(node.data.multiOrtCount) + ' Orten zugeordnet.'">
                        {{ Number(node.data.multiOrtCount) }} Orte
                      </span>
                      <span
                        v-if="node.data && initiativeBadgeText(node.data.initiative)"
                        class="badge rounded-pill text-bg-info ms-1">
                        INI {{ initiativeBadgeText(node.data.initiative) }}
                      </span>
                      <div v-if="node.data && node.data.statusEmoji" class="htbah-map-charakter-status">{{ node.data.statusEmoji }}</div>
                    </div>
                  </template>
                </button>
              </div>
            </div>
          </div>
          <div v-if="!modal.istVollbild" class="regelwerk-modal-resize-handle" @pointerdown="starteResize($event)"></div>
        </div>
        <div v-if="modal.detailsOffen && detail" class="htbah-weltenbau-map-detail card shadow">
          <div class="card-header d-flex justify-content-between align-items-center py-2">
            <strong>{{ detail.label }}</strong>
            <button type="button" class="btn-close" @click="modal.detailsOffen = false"></button>
          </div>
          <div class="card-body py-2 small">
            <div><span class="text-secondary">Typ:</span> {{ detail.entityType }}</div>
            <div v-if="detail.payload && detail.payload.aufenthaltsort"><span class="text-secondary">Aufenthaltsort:</span> {{ detail.payload.aufenthaltsort }}</div>
            <div v-if="detail.payload && detail.payload.lebenspunkte"><span class="text-secondary">Lebenspunkte:</span> {{ detail.payload.lebenspunkte }}</div>
            <div v-if="detail.payload && initiativeBadgeText(detail.payload.initiative)"><span class="text-secondary">Initiative:</span> {{ initiativeBadgeText(detail.payload.initiative) }}</div>
            <div v-if="detail.payload && detail.payload.beschreibungHtml" v-html="detail.payload.beschreibungHtml"></div>
            <div class="d-flex justify-content-end mt-3" v-if="detail.entityType !== 'charakter'">
              <button type="button" class="btn btn-sm btn-outline-primary" @click="starteBearbeitungAusDetail">
                Bearbeiten
              </button>
            </div>
          </div>
        </div>
        <zufallstabellen-zeile-modal
          :anlage="anlage"
          :zeile-modal-titel="zeileModalTitel"
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
          @close="schliesseAnlageModal"
          @save="speichereAnlage"
          @random="zufallsvorschlagUebernehmen"
          @media-upload="onBearbeitungsMedienDateienGewaehlt"
          @media-remove="mediumAusBearbeitungEntfernen"
          @media-open="mediumImBildbetrachterOeffnen"
          @media-download="mediumHerunterladen"
          @update:zufallNpcEpoche="zufallNpcEpoche = $event"
          @update:zufallGegenstandEpoche="zufallGegenstandEpoche = $event"
          @update:zufallGegenstandKleidung="zufallGegenstandKleidung = $event"
          @update:zufallFraktionEpoche="zufallFraktionEpoche = $event"
          @update:zufallRaetselEpoche="zufallRaetselEpoche = $event" />
        <weltenbau-bild-import-modal
          ref="weltenbauHintergrundImportModal"
          @fertig="onMapHintergrundImportFertig"
          @abgebrochen="onMapHintergrundImportAbgebrochen"
          @datei-import-fehler="onMapHintergrundImportFehler" />
        <div v-if="charakterModal.offen && charakterModal.charakter" class="htbah-weltenbau-map-detail card shadow">
          <div class="card-header d-flex justify-content-between align-items-center py-2">
            <strong>🧙 Charakter bearbeiten</strong>
            <button type="button" class="btn-close" @click="schliesseCharakterModal"></button>
          </div>
          <div class="card-body py-2 small">
            <div
              v-if="charakterModalStatus.tot || charakterModalStatus.bewusstlos"
              class="alert py-2 px-3 mb-2 htbah-charakter-status-alert"
              :class="charakterModalStatus.tot ? 'alert-secondary' : 'alert-warning'">
              <strong v-if="charakterModalStatus.tot">💀 Tot</strong>
              <strong v-else>😵 Bewusstlos</strong>
              <span class="ms-1">— LP 0 = tot, LP 1–10 oder Massenschaden (>=60 Verlust) = bewusstlos.</span>
            </div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <img
                v-if="charakterModal.charakterBild"
                :src="charakterModal.charakterBild"
                alt="Charakterbild"
                class="htbah-map-charakterbild htbah-map-charakterbild--gross" />
              <div class="fw-semibold">{{ charakterModal.charakter.name || 'Charakter' }}</div>
            </div>
            <div class="row g-2">
              <div class="col-md-6">
                <div class="form-floating">
                  <input
                    class="form-control"
                    type="number"
                    v-model.number="charakterModal.charakter.lebenspunkte"
                    placeholder=" "
                    @focus="onCharakterLebenspunkteFocus"
                    @input="charakterModal.lpAenderungWaehrenEingabe = true"
                    @blur="onCharakterLebenspunkteBlur" />
                  <label>Lebenspunkte</label>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Geistesblitz (Handeln/Wissen/Soziales)</label>
                <div class="d-flex gap-1">
                  <input class="form-control form-control-sm" type="number" v-model.number="charakterModal.charakter.geistesblitzVerbleibend.handeln" />
                  <input class="form-control form-control-sm" type="number" v-model.number="charakterModal.charakter.geistesblitzVerbleibend.wissen" />
                  <input class="form-control form-control-sm" type="number" v-model.number="charakterModal.charakter.geistesblitzVerbleibend.soziales" />
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Initiative</label>
                <div class="input-group">
                  <input
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                    :max="10 + Math.max(0, Math.round(((charakterModal.charakter.handeln || []).reduce((sum, eintrag) => sum + (Number(eintrag && eintrag.value) || 0), 0)) / 10))"
                    v-model="charakterModal.charakter.initiative"
                    placeholder="z. B. 12"
                    inputmode="numeric"
                    autocomplete="off" />
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="!String(charakterModal.charakter.initiative || '').trim()"
                    @click="charakterModal.charakter.initiative = ''">
                    Leeren
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-floating">
                  <input
                    class="form-control"
                    v-model="charakterModal.charakter.aufenthaltsort"
                    placeholder=" "
                    autocomplete="off" />
                  <label>Aufenthaltsort</label>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1">Fraktionen</label>
                <div v-if="fraktionenMitNamen.length" class="d-flex flex-wrap gap-2">
                  <button
                    v-for="f in fraktionenMitNamen"
                    :key="'char-modal-fraktion-chip-' + f.id"
                    type="button"
                    class="btn btn-sm"
                    :class="charakterFraktionAktiv(f.name) ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="charakterFraktionUmschalten(f.name)">
                    {{ f.name }}
                  </button>
                </div>
                <div v-else class="small text-body-secondary">Keine Fraktionen vorhanden.</div>
              </div>
            </div>
            <label class="form-label mt-3 mb-1">Inventar</label>
            <div class="d-flex justify-content-end mb-2">
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="inventarEintragHinzufuegen">Eintrag hinzufügen</button>
            </div>
            <div v-if="!charakterModal.charakter.inventar.length" class="text-secondary small mb-2">Kein Inventar.</div>
            <div v-else class="d-flex flex-column gap-2 mb-2">
              <div v-for="(item, idx) in charakterModal.charakter.inventar" :key="item.id || idx" class="border rounded p-2">
                <div class="row g-2">
                  <div class="col-md-4"><input class="form-control form-control-sm" v-model="item.name" placeholder="Name" /></div>
                  <div class="col-md-4">
                    <select class="form-select form-select-sm" v-model="item.typ">
                      <option value="gegenstand">Gegenstand</option>
                      <option value="waffe">Waffe</option>
                      <option value="rustung">Rüstung</option>
                    </select>
                  </div>
                  <div class="col-md-4 d-flex justify-content-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="inventarEintragEntfernen(idx)">Entfernen</button>
                  </div>
                  <div class="col-md-6" v-if="item.typ === 'waffe'"><input class="form-control form-control-sm" v-model="item.schadenswert" placeholder="Schadenswert" /></div>
                  <div class="col-md-6" v-if="item.typ === 'waffe'">
                    <select class="form-select form-select-sm" v-model="item.kampfart">
                      <option value="nahkampf">Nahkampf</option>
                      <option value="fernkampf">Fernkampf</option>
                    </select>
                  </div>
                  <div class="col-md-6" v-if="item.typ === 'rustung'"><input class="form-control form-control-sm" v-model="item.rustwert" placeholder="Rüstwert" /></div>
                  <div class="col-12"><textarea class="form-control form-control-sm" rows="2" v-model="item.beschreibungHtml" placeholder="Beschreibung"></textarea></div>
                </div>
              </div>
            </div>
            <label class="form-label mt-2 mb-1">Notizen</label>
            <div class="zufallstabellen-quill-wrap" :key="'wb-char-q-' + charakterQuillSession">
              <div :ref="charakterQuillHostRefFn" class="quill-editor-host zufallstabellen-quill-host"></div>
            </div>
            <div class="d-flex justify-content-between gap-2 mt-3">
              <button type="button" class="btn btn-sm btn-outline-secondary" @click="springeZumCharakterAusModal">
                Zum Charakter springen
              </button>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="schliesseCharakterModal">Abbrechen</button>
                <button type="button" class="btn btn-sm btn-primary" @click="speichereCharakterModal">Speichern</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})();
