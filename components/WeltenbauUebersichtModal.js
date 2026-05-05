window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};
var HTBAH_REFACTOR_UTILS =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.RefactorUtils) || null;

(function () {
  const MAP_ZOOM_MIN = 0.01; // 1% (0% ist technisch nicht nutzbar)
  const MAP_ZOOM_MAX = 10; // 1000%
  const MAP_STANDARD_EINSTELLUNGEN = Object.freeze({
    zoomScale: 1,
    itemScale: 100,
    edgeColor: '#5c636a',
    edgeWidth: 4,
    sichtbarkeitsFilter: {
      toteNpcsAnzeigen: true,
      toteBestienAnzeigen: true,
      geloesteRaetselAnzeigen: true,
    },
  });

  function formatBytes(n) {
    if (!HTBAH_REFACTOR_UTILS || !Number.isFinite(n) || n <= 0) {
      return '';
    }
    return HTBAH_REFACTOR_UTILS.formatBytesBinary(n);
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
      WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
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
          stageWidth: 12000,
          stageHeight: 9000,
        },
        verlauf: {
          undoStack: [],
          redoStack: [],
          pendingBefore: null,
          zoomCommitTimer: 0,
          mapScaleSpeicherTimer: 0,
          ortBildLayoutSpeicherTimer: 0,
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
        ortBildDrag: {
          aktiv: false,
          ortId: '',
          modus: '',
          startClientX: 0,
          startClientY: 0,
          startX: 0,
          startY: 0,
          startWidth: 0,
          startHeight: 0,
          startAngleDeg: 0,
          startPointerAngleDeg: 0,
          startCenterX: 0,
          startCenterY: 0,
          aktuellAngleDeg: 0,
          bewegt: false,
        },
        gruppenDrag: {
          aktiv: false,
          startClientX: 0,
          startClientY: 0,
          nodeStartPositionen: {},
          bildStartLayouts: {},
          bewegt: false,
        },
        auswahlRahmen: {
          aktiv: false,
          startClientX: 0,
          startClientY: 0,
          endeClientX: 0,
          endeClientY: 0,
        },
        ausgewaehlteElemente: {},
        mapBildLayoutsLokal: {},
        zuletztGezogeneNodeId: '',
        anlage: {
          offen: false,
          typ: '',
          zeile: null,
          index: -1,
        },
        anlageOverlay: {
          offen: false,
          typ: '',
          zeile: null,
          index: -1,
        },
        medienUploadLaeuft: false,
        medienImportWarteschlange: [],
        medienGalerieModalOffen: false,
        speicherStatusHinweis: '',
        charakterModal: {
          offen: false,
          mitgliedId: '',
          charakter: null,
          charakterBild: '',
          lpEingabeAktiv: false,
          lpAenderungWaehrenEingabe: false,
          lpSnapshotVorEingabe: null,
          prevLpSnapshot: 0,
          fenster: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten() },
        },
        spielleiterTick: 0,
        zufallNpcEpoche: 'mittelalter',
        zufallGegenstandEpoche: 'mittelalter',
        zufallGegenstandKleidung: true,
        zufallFraktionEpoche: 'mittelalter',
        zufallRaetselEpoche: 'mittelalter',
        zeileQuillInstanz: null,
        zeileMentionController: null,
        zeileQuillHostElement: null,
        zeileQuillSession: 0,
        zeileQuillHostRefFn: null,
        overlayZeileQuillInstanz: null,
        overlayZeileMentionController: null,
        overlayZeileQuillHostElement: null,
        overlayZeileQuillSession: 0,
        overlayZeileQuillHostRefFn: null,
        charakterQuillInstanz: null,
        charakterMentionController: null,
        charakterQuillHostElement: null,
        charakterQuillSession: 0,
        charakterQuillHostRefFn: null,
        notizQuillInstanzen: {},
        notizQuillEditorRefs: {},
        hintergrundUploadLaeuft: false,
        bildImportKontext: 'hintergrund',
        mapHintergrundTick: 0,
        mapFreieElementeTick: 0,
        mapViewportPersistPause: false,
        sichtbarkeitsFilter: {
          toteNpcsAnzeigen: true,
          toteBestienAnzeigen: true,
          geloesteRaetselAnzeigen: true,
        },
        elementLocks: {},
        suchText: '',
        sucheFokusAktiv: false,
        sucheBlurTimer: 0,
        klickUnterdrueckenBisMs: 0,
      };
    },
    created() {
      this.zeileQuillHostRefFn = (el) => this.zeileQuillHostRef(el);
      this.overlayZeileQuillHostRefFn = (el) => this.withAnlageKontext('overlay', () => this.zeileQuillHostRef(el));
      this.charakterQuillHostRefFn = (el) => this.charakterQuillHostRef(el);
    },
    computed: {
      fensterStil() {
        return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.modal);
      },
      charakterFensterStil() {
        return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.charakterModal.fenster);
      },
      charakterVollbildIcon() {
        return this.charakterModal.fenster.istVollbild ? 'close_fullscreen' : 'open_in_full';
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
      zeileModalTitelOverlay() {
        if (!this.anlageOverlay.typ) {
          return '';
        }
        const neu = 'Neu: ';
        if (this.anlageOverlay.typ === 'npc') {
          return `${neu}👤 NPC`;
        }
        if (this.anlageOverlay.typ === 'ort') {
          return `${neu}🗺️ Ort`;
        }
        if (this.anlageOverlay.typ === 'fraktion') {
          return `${neu}🏛️ Fraktion`;
        }
        if (this.anlageOverlay.typ === 'bestie') {
          return `${neu}🦁 Bestarium`;
        }
        if (this.anlageOverlay.typ === 'raetsel') {
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
        return Array.from(new Set((this.zustand.orte || [])
          .map((o) => (o && o.name ? String(o.name).trim() : ''))
          .filter(Boolean)));
      },
      speicherAnlageDeaktiviert() {
        return this.medienUploadLaeuft;
      },
      speicherAnlageHinweis() {
        if (this.medienUploadLaeuft) {
          return 'Dateien werden noch verarbeitet. Bitte warten, bevor Du speicherst.';
        }
        return this.speicherStatusHinweis;
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
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        };
      },
      ortBildElemente() {
        void this.mapFreieElementeTick;
        const gruppeLayouts = this.mapBildLayoutsLokal && typeof this.mapBildLayoutsLokal === 'object'
          ? this.mapBildLayoutsLokal
          : {};
        const ortBilder = (this.zustand.orte || [])
          .map((ort, index) => {
            const dataUrl = this.entitaetBildDataUrl(ort);
            if (!dataUrl) {
              return null;
            }
            const ortNodeId = `ort:${ort.id}`;
            const bildId = `ortbild:${ort.id}`;
            const layout = gruppeLayouts[ortNodeId] && typeof gruppeLayouts[ortNodeId] === 'object' ? gruppeLayouts[ortNodeId] : {};
            return {
              ankerTyp: 'ort',
              layoutKey: ortNodeId,
              ortNodeId,
              bildId,
              ortName: textWert(ort.name),
              anzeigename: textWert(ort.name),
              dataUrl,
              x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 140 + index * 40,
              y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 120 + index * 30,
              width: Number.isFinite(Number(layout.width)) ? Math.max(1, Math.round(Number(layout.width))) : 320,
              height: Number.isFinite(Number(layout.height)) ? Math.max(1, Math.round(Number(layout.height))) : 220,
              angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
            };
          })
          .filter(Boolean);
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const alleEintraege = Array.isArray(wb && wb.eintraege) ? wb.eintraege : [];
        const eintragById = new Map(alleEintraege.map((eintrag) => [eintrag && eintrag.id, eintrag]));
        const freieBilder = this.ladeFreieBildAuswahl()
          .map((auswahl, index) => {
            const eintrag = eintragById.get(auswahl && auswahl.eintragId);
            const dataUrl = eintrag && typeof eintrag.dataUrl === 'string' ? eintrag.dataUrl : '';
            if (!dataUrl) {
              return null;
            }
            const bildId = String((auswahl && auswahl.bildId) || '').trim();
            if (!bildId) {
              return null;
            }
            const layoutKey = bildId;
            // Rückwärtskompatibel: ältere Builds haben freie Bild-Layouts unter "freibild:freibild:<id>" abgelegt.
            const layoutKandidat =
              (gruppeLayouts[layoutKey] && typeof gruppeLayouts[layoutKey] === 'object'
                ? gruppeLayouts[layoutKey]
                : null) ||
              (gruppeLayouts[`freibild:${bildId}`] && typeof gruppeLayouts[`freibild:${bildId}`] === 'object'
                ? gruppeLayouts[`freibild:${bildId}`]
                : null);
            const layout = layoutKandidat || {};
            const name = String(((auswahl && auswahl.name) || (eintrag && eintrag.name) || 'Bild')).trim() || 'Bild';
            return {
              ankerTyp: 'frei',
              layoutKey,
              ortNodeId: '',
              bildId,
              ortName: name,
              anzeigename: name,
              dataUrl,
              x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 220 + index * 34,
              y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 180 + index * 28,
              width: Number.isFinite(Number(layout.width)) ? Math.max(1, Math.round(Number(layout.width))) : 320,
              height: Number.isFinite(Number(layout.height)) ? Math.max(1, Math.round(Number(layout.height))) : 220,
              angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
            };
          })
          .filter(Boolean);
        const freieNotizen = this.ladeFreieNotizen()
          .map((eintrag, index) => {
            const notizId = String((eintrag && eintrag.notizId) || '').trim();
            if (!notizId) {
              return null;
            }
            const layoutKey = notizId;
            const layout = gruppeLayouts[layoutKey] && typeof gruppeLayouts[layoutKey] === 'object' ? gruppeLayouts[layoutKey] : {};
            return {
              ankerTyp: 'notiz',
              layoutKey,
              ortNodeId: '',
              bildId: notizId,
              ortName: 'Notizzettel',
              anzeigename: 'Notizzettel',
              notizHtml: typeof (eintrag && eintrag.html) === 'string' ? eintrag.html : '',
              notizBgColor:
                typeof (eintrag && eintrag.bgColor) === 'string' &&
                /^#[0-9a-fA-F]{6}$/.test(String(eintrag.bgColor).trim())
                  ? String(eintrag.bgColor).trim()
                  : '#fff8bf',
              x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 280 + index * 30,
              y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 220 + index * 24,
              width: Number.isFinite(Number(layout.width)) ? Math.max(220, Math.round(Number(layout.width))) : 220,
              height: Number.isFinite(Number(layout.height)) ? Math.max(56, Math.round(Number(layout.height))) : 56,
              angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
            };
          })
          .filter(Boolean);
        const freiePfeile = this.ladeFreiePfeile()
          .map((eintrag, index) => {
            const pfeilId = String((eintrag && eintrag.pfeilId) || '').trim();
            if (!pfeilId) {
              return null;
            }
            const layoutKey = pfeilId;
            const layout = gruppeLayouts[layoutKey] && typeof gruppeLayouts[layoutKey] === 'object' ? gruppeLayouts[layoutKey] : {};
            return {
              ankerTyp: 'pfeil',
              layoutKey,
              ortNodeId: '',
              bildId: pfeilId,
              ortName: 'Pfeil',
              anzeigename: 'Pfeil',
              pfeilFarbe:
                typeof (eintrag && eintrag.farbe) === 'string' &&
                /^#[0-9a-fA-F]{6}$/.test(String(eintrag.farbe).trim())
                  ? String(eintrag.farbe).trim()
                  : '#509b4a',
              x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 320 + index * 36,
              y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 320 + index * 20,
              width: Number.isFinite(Number(layout.width)) ? Math.max(220, Math.round(Number(layout.width))) : 220,
              height: Number.isFinite(Number(layout.height)) ? Math.max(56, Math.round(Number(layout.height))) : 56,
              angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
            };
          })
          .filter(Boolean);
        return [...ortBilder, ...freieBilder, ...freieNotizen, ...freiePfeile];
      },
      kantenLinien() {
        const byId = new Map(this.graph.nodes.map((n) => [n.id, n]));
        const center = (node) => ({
          x: (node.position && Number(node.position.x)) || 0,
          y: (node.position && Number(node.position.y)) || 0,
          w: this.nodeBreite(node),
          h: this.nodeHoehe(node),
        });
        const schnittpunktAmBildrand = (sx, sy, rectX, rectY, rectW, rectH) => {
          const cx = rectX + rectW / 2;
          const cy = rectY + rectH / 2;
          const dx = cx - sx;
          const dy = cy - sy;
          if (dx === 0 && dy === 0) {
            return { x: cx, y: cy };
          }
          const halbW = rectW / 2;
          const halbH = rectH / 2;
          const tx = dx !== 0 ? Math.abs(halbW / dx) : Number.POSITIVE_INFINITY;
          const ty = dy !== 0 ? Math.abs(halbH / dy) : Number.POSITIVE_INFINITY;
          const t = Math.min(tx, ty);
          return {
            x: cx - dx * t,
            y: cy - dy * t,
          };
        };
        const knotenKanten = (this.graph.edges || [])
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
        const ortBildKanten = this.ortBildElemente
          .map((bild) => {
            if (!bild || !bild.ortNodeId) {
              return null;
            }
            const ortNode = byId.get(bild.ortNodeId);
            if (!ortNode) {
              return null;
            }
            const tc = center(ortNode);
            const sourceX = tc.x + tc.w / 2;
            const sourceY = tc.y + tc.h / 2;
            const bildX = Number(bild.x) || 0;
            const bildY = Number(bild.y) || 0;
            const bildW = Math.max(1, Number(bild.width) || 0);
            const bildH = Math.max(1, Number(bild.height) || 0);
            const rand = schnittpunktAmBildrand(sourceX, sourceY, bildX, bildY, bildW, bildH);
            return {
              id: `e-bild-${bild.bildId}`,
              x1: sourceX,
              y1: sourceY,
              x2: rand.x,
              y2: rand.y,
            };
          })
          .filter(Boolean);
        return [...knotenKanten, ...ortBildKanten];
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
      suchtrefferListe() {
        const q = String(this.suchText || '').trim().toLowerCase();
        if (!q) {
          return [];
        }
        const typAliasMap = {
          ort: ['ort', 'orte', 'location'],
          npc: ['npc', 'npcs'],
          fraktion: ['fraktion', 'fraktionen', 'faction'],
          bestie: ['bestie', 'bestien', 'monster', 'kreatur', 'kreaturen'],
          raetsel: ['rätsel', 'raetsel', 'puzzle'],
          gegenstand: ['gegenstand', 'gegenstände', 'gegenstaende', 'item', 'items', 'objekt', 'objekte'],
          charakter: ['charakter', 'charaktere', 'character', 'characters', 'held', 'helden'],
        };
        const passtZuTypSuche = (entityType) => {
          const alias = typAliasMap[entityType];
          if (!alias || !alias.length) {
            return false;
          }
          return alias.some((wort) => wort.includes(q) || q.includes(wort));
        };
        const treffer = [];
        (this.graph.nodes || []).forEach((node) => {
          const label = String((node && node.data && node.data.label) || '').trim();
          const entityType = String((node && node.data && node.data.entityType) || '').trim();
          const typTreffer = passtZuTypSuche(entityType);
          if (!label || (!label.toLowerCase().includes(q) && !typTreffer)) {
            return;
          }
          const typTitelMap = {
            ort: 'Ort',
            npc: 'NPC',
            fraktion: 'Fraktion',
            bestie: 'Bestie',
            raetsel: 'Rätsel',
            gegenstand: 'Gegenstand',
            charakter: 'Charakter',
          };
          treffer.push({
            id: `node:${node.id}`,
            zielTyp: 'node',
            zielId: node.id,
            titel: label,
            untertitel: typTitelMap[entityType] || 'Knoten',
          });
        });
        (this.ortBildElemente || []).forEach((bild) => {
          const name = String((bild && bild.anzeigename) || '').trim();
          const notizText = bild && bild.ankerTyp === 'notiz'
            ? String(this.htmlAlsSuchtext(bild.notizHtml || '')).trim()
            : '';
          const nameTreffer = !!(name && name.toLowerCase().includes(q));
          const notizTreffer = !!(notizText && notizText.toLowerCase().includes(q));
          if (!nameTreffer && !notizTreffer) {
            return;
          }
          const istNotiz = bild && bild.ankerTyp === 'notiz';
          const titel = istNotiz
            ? `📝 ${name || 'Notiz'}`
            : `🖼️ ${name}`;
          const untertitel = istNotiz
            ? 'Notiz'
            : bild && bild.ankerTyp === 'ort'
              ? 'Ortsbild'
              : bild && bild.ankerTyp === 'pfeil'
                ? 'Pfeil'
                : 'Bild';
          treffer.push({
            id: `bild:${bild.bildId}`,
            zielTyp: 'bild',
            zielId: bild.bildId,
            titel,
            untertitel,
          });
        });
        return treffer.slice(0, 16);
      },
      suchtrefferAnzeigen() {
        return this.sucheFokusAktiv && this.suchtrefferListe.length > 0;
      },
      ausgewaehlteElementeAnzahl() {
        return Object.keys(this.ausgewaehlteElemente || {}).length;
      },
      auswahlRahmenStil() {
        if (!this.auswahlRahmen.aktiv) {
          return {};
        }
        const minX = Math.min(this.auswahlRahmen.startClientX, this.auswahlRahmen.endeClientX);
        const minY = Math.min(this.auswahlRahmen.startClientY, this.auswahlRahmen.endeClientY);
        const breite = Math.abs(this.auswahlRahmen.endeClientX - this.auswahlRahmen.startClientX);
        const hoehe = Math.abs(this.auswahlRahmen.endeClientY - this.auswahlRahmen.startClientY);
        return {
          left: `${Math.round(minX)}px`,
          top: `${Math.round(minY)}px`,
          width: `${Math.max(1, Math.round(breite))}px`,
          height: `${Math.max(1, Math.round(hoehe))}px`,
        };
      },
    },
    methods: {
      withAnlageKontext(ziel, fn) {
        if (ziel !== 'overlay') {
          return fn();
        }
        const snapshot = {
          anlage: this.anlage,
          zeileQuillInstanz: this.zeileQuillInstanz,
          zeileMentionController: this.zeileMentionController,
          zeileQuillHostElement: this.zeileQuillHostElement,
          zeileQuillSession: this.zeileQuillSession,
        };
        this.anlage = this.anlageOverlay;
        this.zeileQuillInstanz = this.overlayZeileQuillInstanz;
        this.zeileMentionController = this.overlayZeileMentionController;
        this.zeileQuillHostElement = this.overlayZeileQuillHostElement;
        this.zeileQuillSession = this.overlayZeileQuillSession;
        const result = fn();
        this.anlageOverlay = this.anlage;
        this.overlayZeileQuillInstanz = this.zeileQuillInstanz;
        this.overlayZeileMentionController = this.zeileMentionController;
        this.overlayZeileQuillHostElement = this.zeileQuillHostElement;
        this.overlayZeileQuillSession = this.zeileQuillSession;
        this.anlage = snapshot.anlage;
        this.zeileQuillInstanz = snapshot.zeileQuillInstanz;
        this.zeileMentionController = snapshot.zeileMentionController;
        this.zeileQuillHostElement = snapshot.zeileQuillHostElement;
        this.zeileQuillSession = snapshot.zeileQuillSession;
        return result;
      },
      entitaetTypLabelFuerMentions(typ) {
        const map = {
          charakter: 'Charakter',
          npc: 'NPC',
          ort: 'Ort',
          fraktion: 'Fraktion',
          pantheon: 'Gottheit',
          raetsel: 'Rätsel',
          bestie: 'Bestie',
          gegenstand: 'Gegenstand',
        };
        return map[typ] || 'Entität';
      },
      mentionTypSortIndex(typ) {
        const order = {
          charakter: 0,
          npc: 1,
          ort: 2,
          fraktion: 3,
          gegenstand: 4,
          bestie: 5,
          raetsel: 6,
          pantheon: 7,
        };
        return Number.isInteger(order[typ]) ? order[typ] : 99;
      },
      mentionScore(name, query) {
        const n = String(name || '').trim().toLowerCase();
        const q = String(query || '').trim().toLowerCase();
        if (!q) {
          return 500;
        }
        if (n === q) {
          return 0;
        }
        if (`@${n}` === q || n === q.replace(/^@+/, '')) {
          return 1;
        }
        if (n.startsWith(q)) {
          return 2;
        }
        const wortTreffer = n.split(/\s+/).some((teil) => teil.startsWith(q));
        if (wortTreffer) {
          return 3;
        }
        if (n.includes(q)) {
          return 4;
        }
        return 99;
      },
      mentionItemsFuerQuill(queryText) {
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (!mentionApi || typeof mentionApi.collectMentionItems !== 'function') {
          return [];
        }
        return mentionApi.collectMentionItems(queryText, { gruppeId: this.gruppeId });
      },
      oeffneEntitaetAusMention({ entityType, entityId }) {
        const typ = String(entityType || '').trim();
        const id = String(entityId || '').trim();
        if (!typ || !id) {
          return false;
        }
        if (typ === 'charakter') {
          this.oeffneCharakterModal({ data: { entityType: 'charakter', entityId: id } });
          return true;
        }
        if (this.anlage.offen && !this.anlageOverlay.offen) {
          this.detail = { entityType: typ, entityId: id };
          this.starteBearbeitungAusDetail({ alsOverlay: true });
          return !!this.anlageOverlay.offen;
        }
        const vorher = this.anlage && this.anlage.offen;
        this.detail = { entityType: typ, entityId: id };
        this.starteBearbeitungAusDetail();
        return !!(this.anlage && this.anlage.offen) || !!vorher;
      },
      verarbeiteMentionNavigationTarget() {
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (!mentionApi || typeof mentionApi.consumeNavigationTarget !== 'function') {
          return;
        }
        const target = mentionApi.consumeNavigationTarget();
        if (!target || !target.entityType || !target.entityId) {
          return;
        }
        this.oeffneEntitaetAusMention(target);
      },
      onGlobalOpenEntityRequest(event) {
        if (!this.offen) {
          return;
        }
        const detail = event && event.detail ? event.detail : null;
        if (!detail || !detail.entityType || !detail.entityId) {
          return;
        }
        const erfolg = this.oeffneEntitaetAusMention(detail);
        if (erfolg) {
          event.preventDefault();
        }
      },
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
      entitaetBildDataUrl(payload) {
        if (!payload || typeof payload !== 'object') {
          return '';
        }
        const medien = Array.isArray(payload.medien) ? payload.medien : [];
        const bilder = medien.filter((m) => this.mediumIstBild(m));
        if (!bilder.length) {
          return '';
        }
        const primaryId = typeof payload.primaryMediumId === 'string' ? payload.primaryMediumId.trim() : '';
        if (primaryId) {
          const gefunden = bilder.find((bild) => bild.id === primaryId);
          if (gefunden && typeof gefunden.dataUrl === 'string') {
            return gefunden.dataUrl;
          }
        }
        return typeof bilder[0].dataUrl === 'string' ? bilder[0].dataUrl : '';
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
      ladeBildLayouts() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        return wb && wb.mapBildLayouts && typeof wb.mapBildLayouts === 'object' ? wb.mapBildLayouts : {};
      },
      speichereBildLayouts(layoutMap) {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        wb.mapBildLayouts = layoutMap;
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      ladeFreieBildAuswahl() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map = wb && wb.mapFreieBilder && typeof wb.mapFreieBilder === 'object' ? wb.mapFreieBilder : {};
        const liste = Array.isArray(map[gruppeKey]) ? map[gruppeKey] : [];
        return liste
          .map((eintrag) => {
            const bildId = String((eintrag && eintrag.bildId) || '').trim();
            const eintragId = String((eintrag && eintrag.eintragId) || '').trim();
            const name = String((eintrag && eintrag.name) || '').trim();
            if (!bildId || !eintragId) {
              return null;
            }
            return {
              bildId,
              eintragId,
              name: name || 'Bild',
            };
          })
          .filter(Boolean);
      },
      ladeFreieNotizen() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map = wb && wb.mapFreieNotizen && typeof wb.mapFreieNotizen === 'object' ? wb.mapFreieNotizen : {};
        const liste = Array.isArray(map[gruppeKey]) ? map[gruppeKey] : [];
        return liste
          .map((eintrag) => {
            const notizId = String((eintrag && eintrag.notizId) || '').trim();
            if (!notizId) {
              return null;
            }
            return {
              notizId,
              html: typeof (eintrag && eintrag.html) === 'string' ? eintrag.html : '',
              bgColor:
                typeof (eintrag && eintrag.bgColor) === 'string' &&
                /^#[0-9a-fA-F]{6}$/.test(String(eintrag.bgColor).trim())
                  ? String(eintrag.bgColor).trim()
                  : '#fff8bf',
            };
          })
          .filter(Boolean);
      },
      speichereFreieNotizen(liste) {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map = wb && wb.mapFreieNotizen && typeof wb.mapFreieNotizen === 'object' ? wb.mapFreieNotizen : {};
        wb.mapFreieNotizen = {
          ...map,
          [gruppeKey]: Array.isArray(liste) ? liste.slice() : [],
        };
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      ladeFreiePfeile() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map = wb && wb.mapFreiePfeile && typeof wb.mapFreiePfeile === 'object' ? wb.mapFreiePfeile : {};
        const liste = Array.isArray(map[gruppeKey]) ? map[gruppeKey] : [];
        return liste
          .map((eintrag) => {
            const pfeilId = String((eintrag && eintrag.pfeilId) || '').trim();
            if (!pfeilId) {
              return null;
            }
            const farbeRaw = String((eintrag && eintrag.farbe) || '').trim();
            return {
              pfeilId,
              farbe: /^#[0-9a-fA-F]{6}$/.test(farbeRaw) ? farbeRaw : '#509b4a',
            };
          })
          .filter(Boolean);
      },
      speichereFreiePfeile(liste) {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map = wb && wb.mapFreiePfeile && typeof wb.mapFreiePfeile === 'object' ? wb.mapFreiePfeile : {};
        wb.mapFreiePfeile = {
          ...map,
          [gruppeKey]: Array.isArray(liste) ? liste.slice() : [],
        };
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      speichereFreieBildAuswahl(liste) {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map = wb && wb.mapFreieBilder && typeof wb.mapFreieBilder === 'object' ? wb.mapFreieBilder : {};
        wb.mapFreieBilder = {
          ...map,
          [gruppeKey]: Array.isArray(liste) ? liste.slice() : [],
        };
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      uebernehmeBildLayouts() {
        const gruppeKey = this.gruppeId || 'default';
        const alleLayouts = this.ladeBildLayouts();
        const gruppeLayouts = alleLayouts[gruppeKey] && typeof alleLayouts[gruppeKey] === 'object'
          ? alleLayouts[gruppeKey]
          : {};
        this.mapBildLayoutsLokal = JSON.parse(JSON.stringify(gruppeLayouts));
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
          mapScale: this.begrenzeMapScale(
            Number.isFinite(Number(gruppe.zoomScale))
              ? Number(gruppe.zoomScale)
              : MAP_STANDARD_EINSTELLUNGEN.zoomScale,
          ),
          mapCenterX: Number.isFinite(Number(gruppe.mapCenterX))
            ? Number(gruppe.mapCenterX)
            : Math.round((Number(this.map.stageWidth) || 5200) / 2),
          mapCenterY: Number.isFinite(Number(gruppe.mapCenterY))
            ? Number(gruppe.mapCenterY)
            : Math.round((Number(this.map.stageHeight) || 3600) / 2),
          itemScale: Number.isFinite(Number(gruppe.itemScale))
            ? Math.max(0, Math.min(500, Math.round(Number(gruppe.itemScale))))
            : MAP_STANDARD_EINSTELLUNGEN.itemScale,
          edgeColor:
            typeof gruppe.edgeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(gruppe.edgeColor)
              ? gruppe.edgeColor
              : MAP_STANDARD_EINSTELLUNGEN.edgeColor,
          edgeWidth: Number.isFinite(Number(gruppe.edgeWidth))
            ? Math.max(1, Math.min(16, Math.round(Number(gruppe.edgeWidth))))
            : MAP_STANDARD_EINSTELLUNGEN.edgeWidth,
          sichtbarkeitsFilter: {
            toteNpcsAnzeigen:
              typeof filter.toteNpcsAnzeigen === 'boolean'
                ? filter.toteNpcsAnzeigen
                : MAP_STANDARD_EINSTELLUNGEN.sichtbarkeitsFilter.toteNpcsAnzeigen,
            toteBestienAnzeigen:
              typeof filter.toteBestienAnzeigen === 'boolean'
                ? filter.toteBestienAnzeigen
                : MAP_STANDARD_EINSTELLUNGEN.sichtbarkeitsFilter.toteBestienAnzeigen,
            geloesteRaetselAnzeigen:
              typeof filter.geloesteRaetselAnzeigen === 'boolean'
                ? filter.geloesteRaetselAnzeigen
                : MAP_STANDARD_EINSTELLUNGEN.sichtbarkeitsFilter.geloesteRaetselAnzeigen,
          },
          elementLocks: this.ladeElementLocks(),
        };
      },
      ladeElementLocks() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const map =
          wb && wb.mapElementLocks && typeof wb.mapElementLocks === 'object'
            ? wb.mapElementLocks
            : {};
        const gruppeLocks =
          map[gruppeKey] && typeof map[gruppeKey] === 'object'
            ? map[gruppeKey]
            : {};
        if (Object.keys(gruppeLocks).length) {
          return Object.fromEntries(
            Object.entries(gruppeLocks).filter(
              ([id, aktiv]) => typeof id === 'string' && id && typeof aktiv === 'boolean',
            ),
          );
        }
        // Backward compatibility: fallback to legacy storage in mapEinstellungen.
        const alle = wb && wb.mapEinstellungen && typeof wb.mapEinstellungen === 'object' ? wb.mapEinstellungen : {};
        const gruppe = alle[gruppeKey] && typeof alle[gruppeKey] === 'object' ? alle[gruppeKey] : {};
        const legacy = gruppe.elementLocks && typeof gruppe.elementLocks === 'object' ? gruppe.elementLocks : {};
        return Object.fromEntries(
          Object.entries(legacy).filter(
            ([id, aktiv]) => typeof id === 'string' && id && typeof aktiv === 'boolean',
          ),
        );
      },
      speichereElementLocksDirekt(lockMap) {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const gruppeKey = this.gruppeId || 'default';
        const alle =
          wb && wb.mapElementLocks && typeof wb.mapElementLocks === 'object'
            ? wb.mapElementLocks
            : {};
        wb.mapElementLocks = {
          ...alle,
          [gruppeKey]: { ...(lockMap || {}) },
        };
        window.HTBAH.speichereWeltenbauZustand(wb);
      },
      uebernehmeMapEinstellungen() {
        this.mapViewportPersistPause = true;
        const einstellungen = this.ladeMapEinstellungen();
        this.map.scale = einstellungen.mapScale;
        this.map.itemScale = einstellungen.itemScale;
        this.map.edgeColor = einstellungen.edgeColor;
        this.map.edgeWidth = einstellungen.edgeWidth;
        this.$nextTick(() => {
          this.wendeMapCenterWeltAn(einstellungen.mapCenterX, einstellungen.mapCenterY);
          this.$nextTick(() => {
            this.mapViewportPersistPause = false;
          });
        });
        this.sichtbarkeitsFilter = {
          ...this.sichtbarkeitsFilter,
          ...einstellungen.sichtbarkeitsFilter,
        };
        this.elementLocks = { ...(einstellungen.elementLocks || {}) };
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
      mapEinstellungenZuruecksetzen() {
        const defaults = MAP_STANDARD_EINSTELLUNGEN;
        this.map.scale = defaults.zoomScale;
        this.map.itemScale = defaults.itemScale;
        this.map.edgeColor = defaults.edgeColor;
        this.map.edgeWidth = defaults.edgeWidth;
        this.$nextTick(() => {
          this.wendeMapCenterWeltAn(
            Math.round((Number(this.map.stageWidth) || 5200) / 2),
            Math.round((Number(this.map.stageHeight) || 3600) / 2),
          );
        });
        this.sichtbarkeitsFilter = { ...defaults.sichtbarkeitsFilter };
        this.elementLocks = {};
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const alle = wb && wb.mapEinstellungen && typeof wb.mapEinstellungen === 'object' ? wb.mapEinstellungen : {};
        const gruppeKey = this.gruppeId || 'default';
        const next = { ...alle };
        delete next[gruppeKey];
        wb.mapEinstellungen = next;
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
          this.bildImportKontext = 'hintergrund';
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
        this.bildImportKontext = 'hintergrund';
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
        if (this.bildImportKontext === 'anlage') {
          this.onZeilenBildImportFertig(payload);
          return;
        }
        const dataUrl = payload && typeof payload.dataUrl === 'string' ? payload.dataUrl : '';
        this.speichereMapHintergrund(dataUrl);
        this.hintergrundUploadLaeuft = false;
      },
      onMapHintergrundImportAbgebrochen() {
        if (this.bildImportKontext === 'anlage') {
          this.onZeilenBildImportAbgebrochen();
          return;
        }
        this.hintergrundUploadLaeuft = false;
      },
      onMapHintergrundImportFehler() {
        if (this.bildImportKontext === 'anlage') {
          this.onZeilenBildImportFehler();
          return;
        }
        this.hintergrundUploadLaeuft = false;
      },
      verfuegbareWeltenbauBilder() {
        const wb = window.HTBAH.ladeWeltenbauZustand();
        const liste = Array.isArray(wb && wb.eintraege) ? wb.eintraege : [];
        return liste.filter((eintrag) => eintrag && typeof eintrag.dataUrl === 'string' && eintrag.dataUrl.startsWith('data:image/'));
      },
      oeffneMedienGalerieModal() {
        this.medienGalerieModalOffen = true;
      },
      schliesseMedienGalerieModal() {
        this.medienGalerieModalOffen = false;
      },
      fuegeFreiesBildZurKarteHinzu(eintrag) {
        const bildEintragId = String((eintrag && eintrag.id) || '').trim();
        if (!bildEintragId) {
          return;
        }
        const liste = this.ladeFreieBildAuswahl();
        const bildId = `freibild:${window.HTBAH.neueEntropieId()}`;
        liste.push({
          bildId,
          eintragId: bildEintragId,
          name: String((eintrag && eintrag.name) || '').trim() || 'Bild',
        });
        this.speichereFreieBildAuswahl(liste);
        this.setzeStartLayoutImViewportZentrum(bildId, {
          width: 320,
          height: 220,
        });
        this.mapFreieElementeTick += 1;
        this.schliesseMedienGalerieModal();
        this.$nextTick(() => this.refreshGraph());
      },
      fuegeNotizzettelZurKarteHinzu() {
        const liste = this.ladeFreieNotizen();
        const notizId = `notiz:${window.HTBAH.neueEntropieId()}`;
        liste.push({
          notizId,
          html: '<p>Neue Notiz…</p>',
          bgColor: '#fff8bf',
        });
        this.speichereFreieNotizen(liste);
        this.setzeStartLayoutImViewportZentrum(notizId, {
          width: 2200,
          height: 560,
        });
        this.mapFreieElementeTick += 1;
        this.$nextTick(() => this.refreshGraph());
      },
      fuegePfeilZurKarteHinzu() {
        const liste = this.ladeFreiePfeile();
        const pfeilId = `pfeil:${window.HTBAH.neueEntropieId()}`;
        liste.push({ pfeilId, farbe: '#509b4a' });
        this.speichereFreiePfeile(liste);
        this.setzeStartLayoutImViewportZentrum(pfeilId, {
          width: 2200,
          height: 560,
        });
        this.mapFreieElementeTick += 1;
        this.$nextTick(() => this.refreshGraph());
      },
      setzeStartLayoutImViewportZentrum(layoutKey, groesse) {
        if (!layoutKey) {
          return;
        }
        const center = this.ermittleMapCenterWelt();
        const width = Math.max(1, Math.round(Number(groesse && groesse.width) || 220));
        const height = Math.max(1, Math.round(Number(groesse && groesse.height) || 56));
        this.schreibeOrtBildLayout(layoutKey, {
          x: Math.round((Number(center.x) || 0) - width / 2),
          y: Math.round((Number(center.y) || 0) - height / 2),
          width,
          height,
        });
        this.persistiereLokaleOrtBildLayouts();
      },
      setzeNodeStartPositionImViewportZentrum(nodeId, groesse) {
        if (!nodeId) {
          return;
        }
        const gruppeKey = this.graph.gruppeKey || this.gruppeId || 'default';
        const center = this.ermittleMapCenterWelt();
        const width = Math.max(1, Math.round(Number(groesse && groesse.width) || 220));
        const height = Math.max(1, Math.round(Number(groesse && groesse.height) || 56));
        this.schreibeNodePosition(
          nodeId,
          {
            x: Math.round((Number(center.x) || 0) - width / 2),
            y: Math.round((Number(center.y) || 0) - height / 2),
          },
          gruppeKey,
        );
      },
      htmlAlsSuchtext(html) {
        const quelltext = typeof html === 'string' ? html : '';
        if (!quelltext) {
          return '';
        }
        if (typeof DOMParser !== 'undefined') {
          try {
            const doc = new DOMParser().parseFromString(quelltext, 'text/html');
            return String((doc && doc.body && doc.body.textContent) || '').replace(/\s+/g, ' ').trim();
          } catch {
            // fallback weiter unten
          }
        }
        return quelltext
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
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
                avatarDataUrl: this.entitaetBildDataUrl(fraktion),
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
                avatarDataUrl: this.entitaetBildDataUrl(fraktion),
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
                label: `${emoji} ${textWert(prefix === 'raetsel' ? row.titel : row.name)}`,
                entityType: prefix,
                entityId: row.id,
                payload: row,
                avatarDataUrl: this.entitaetBildDataUrl(row),
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
      fokussiereNeuGespeicherteEntitaet(typ, entitaetId) {
        if (!typ || !entitaetId || !this.graph || !Array.isArray(this.graph.nodes)) {
          return;
        }
        const zielNode = this.graph.nodes.find((node) => {
          const data = node && node.data;
          return data && data.entityType === typ && data.entityId === entitaetId;
        });
        if (!zielNode || !zielNode.position) {
          return;
        }
        const centerX = Number(zielNode.position.x || 0) + this.nodeBreite(zielNode) / 2;
        const centerY = Number(zielNode.position.y || 0) + this.nodeHoehe(zielNode) / 2;
        this.wendeMapCenterWeltAn(centerX, centerY);
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
        const ortBildEl = el.closest('[data-ort-node-id]');
        if (!nodeEl && ortBildEl) {
          const ortNodeId = ortBildEl.getAttribute('data-ort-node-id') || '';
          if (ortNodeId && ortNodeId !== draggedNodeId) {
            return this.findeNode(ortNodeId);
          }
        }
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
      ortBildStil(bild) {
        const minBreite = bild && (bild.ankerTyp === 'pfeil' || bild.ankerTyp === 'notiz') ? 220 : 1;
        const minHoehe = bild && (bild.ankerTyp === 'pfeil' || bild.ankerTyp === 'notiz') ? 56 : 1;
        const istDrehbar = bild && bild.ankerTyp !== 'notiz';
        const winkel = Number.isFinite(Number(bild && bild.angleDeg)) ? Number(bild.angleDeg) : 0;
        const pfeilHoehe = Math.max(minHoehe, Math.round(Number(bild && bild.height) || 220));
        const pfeilLinienstaerke = Math.max(4, Math.round(pfeilHoehe * 0.12));
        const pfeilSpitzenHoehe = Math.max(12, Math.round(pfeilHoehe * 0.42));
        return {
          left: `${Math.round(Number(bild.x) || 0)}px`,
          top: `${Math.round(Number(bild.y) || 0)}px`,
          width: `${Math.max(minBreite, Math.round(Number(bild.width) || 320))}px`,
          height: `${pfeilHoehe}px`,
          transform: istDrehbar ? `rotate(${winkel}deg)` : undefined,
          transformOrigin: istDrehbar ? 'center center' : undefined,
          '--htbah-pfeil-farbe':
            bild && bild.ankerTyp === 'pfeil' && /^#[0-9a-fA-F]{6}$/.test(String(bild.pfeilFarbe || '').trim())
              ? String(bild.pfeilFarbe).trim()
              : '#509b4a',
          '--htbah-pfeil-linienstaerke': `${pfeilLinienstaerke}px`,
          '--htbah-pfeil-spitzenhoehe': `${pfeilSpitzenHoehe}px`,
          '--htbah-pfeil-spitzenbreite': `${Math.max(14, Math.round(pfeilSpitzenHoehe * 0.9))}px`,
          '--htbah-notiz-bg':
            bild && bild.ankerTyp === 'notiz' && /^#[0-9a-fA-F]{6}$/.test(String(bild.notizBgColor || '').trim())
              ? String(bild.notizBgColor).trim()
              : '#fff8bf',
        };
      },
      pfeilWinkelBadgeText(bild) {
        const winkel = this.ortBildDrag.aktiv &&
          this.ortBildDrag.modus === 'rotate' &&
          this.ortBildDrag.ortId === (bild && bild.bildId)
          ? Number(this.ortBildDrag.aktuellAngleDeg)
          : Number(bild && bild.angleDeg);
        const normalisiert = Number.isFinite(winkel) ? winkel : 0;
        const grad = Math.round(normalisiert);
        return `${grad}°`;
      },
      pfeilWinkelMitSnap(winkelDeg, event) {
        const basis = Number(winkelDeg);
        if (!Number.isFinite(basis)) {
          return 0;
        }
        // Shift = freies Drehen; sonst auf 15° einrasten.
        if (event && event.shiftKey) {
          return basis;
        }
        return Math.round(basis / 15) * 15;
      },
      ortBildKlassen(bild) {
        const ortId = bild && bild.bildId ? bild.bildId : '';
        return {
          'htbah-map-element-locked': this.istElementGesperrt(ortId),
          'htbah-map-element-ausgewaehlt': this.istElementAusgewaehlt(ortId),
        };
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
          'htbah-map-element-locked': this.istElementGesperrt(node && node.id),
          'htbah-map-element-ausgewaehlt': this.istElementAusgewaehlt(node && node.id),
        };
      },
      elementLockButtonIcon(elementId) {
        return this.istElementGesperrt(elementId) ? '🔒' : '🔓';
      },
      elementLockButtonTitle(elementId) {
        return this.istElementGesperrt(elementId)
          ? '🔒 Gesperrt: Position/Groesse/Drehung fix'
          : '🔓 Entsperrt: Position/Groesse/Drehung veraenderbar';
      },
      elementLockButtonKlassen(elementId) {
        return {
          'htbah-map-element-lock-button': true,
          'is-locked': this.istElementGesperrt(elementId),
          'is-unlocked': !this.istElementGesperrt(elementId),
        };
      },
      istElementGesperrt(elementId) {
        if (!elementId) {
          return false;
        }
        return !!(this.elementLocks && this.elementLocks[elementId]);
      },
      istElementAusgewaehlt(elementId) {
        if (!elementId) {
          return false;
        }
        return !!(this.ausgewaehlteElemente && this.ausgewaehlteElemente[elementId]);
      },
      auswahlEnthaeltVerschiebbaresElement(elementId) {
        return this.istElementAusgewaehlt(elementId) && !this.istElementGesperrt(elementId);
      },
      anzahlAusgewaehlteVerschiebbareElemente() {
        return Object.keys(this.ausgewaehlteElemente || {}).filter((id) => this.auswahlEnthaeltVerschiebbaresElement(id)).length;
      },
      markiereElemente(elementIds) {
        const next = {};
        (Array.isArray(elementIds) ? elementIds : []).forEach((id) => {
          if (typeof id === 'string' && id) {
            next[id] = true;
          }
        });
        this.ausgewaehlteElemente = next;
      },
      auswahlAufheben() {
        this.ausgewaehlteElemente = {};
      },
      elementRechteckWeltById(elementId) {
        if (!elementId) {
          return null;
        }
        if (
          String(elementId).startsWith('ortbild:') ||
          String(elementId).startsWith('freibild:') ||
          String(elementId).startsWith('notiz:') ||
          String(elementId).startsWith('pfeil:')
        ) {
          const bild = (this.ortBildElemente || []).find((b) => b && b.bildId === elementId);
          if (!bild) {
            return null;
          }
          return {
            x: Number(bild.x) || 0,
            y: Number(bild.y) || 0,
            w: Math.max(1, Number(bild.width) || 1),
            h: Math.max(1, Number(bild.height) || 1),
          };
        }
        const node = this.findeNode(elementId);
        if (!node) {
          return null;
        }
        return this.nodeRechteck(node);
      },
      starteAuswahlRahmen(event) {
        if (!event || !event.shiftKey) {
          return false;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return false;
        }
        this.auswahlRahmen.aktiv = true;
        this.auswahlRahmen.startClientX = event.clientX;
        this.auswahlRahmen.startClientY = event.clientY;
        this.auswahlRahmen.endeClientX = event.clientX;
        this.auswahlRahmen.endeClientY = event.clientY;
        event.preventDefault();
        return true;
      },
      starteGruppenDrag(event) {
        const ids = Object.keys(this.ausgewaehlteElemente || {}).filter((id) => this.auswahlEnthaeltVerschiebbaresElement(id));
        if (!ids.length) {
          return false;
        }
        this.starteVerlaufAktion();
        this.gruppenDrag.aktiv = true;
        this.gruppenDrag.startClientX = event.clientX;
        this.gruppenDrag.startClientY = event.clientY;
        this.gruppenDrag.bewegt = false;
        const nodeStart = {};
        const bildStart = {};
        ids.forEach((id) => {
          if (
            String(id).startsWith('ortbild:') ||
            String(id).startsWith('freibild:') ||
            String(id).startsWith('notiz:') ||
            String(id).startsWith('pfeil:')
          ) {
            const bild = (this.ortBildElemente || []).find((b) => b && b.bildId === id);
            if (!bild) {
              return;
            }
            bildStart[id] = {
              layoutKey: bild.layoutKey,
              ortNodeId: bild.ortNodeId,
              x: Number(bild.x) || 0,
              y: Number(bild.y) || 0,
              width: Math.max(1, Number(bild.width) || 1),
              height: Math.max(1, Number(bild.height) || 1),
            };
            return;
          }
          const node = this.findeNode(id);
          if (!node || !node.position) {
            return;
          }
          nodeStart[id] = {
            x: Number(node.position.x) || 0,
            y: Number(node.position.y) || 0,
          };
        });
        this.gruppenDrag.nodeStartPositionen = nodeStart;
        this.gruppenDrag.bildStartLayouts = bildStart;
        event.preventDefault();
        return true;
      },
      toggleElementLock(elementId) {
        if (!elementId) {
          return;
        }
        const next = { ...(this.elementLocks || {}) };
        if (next[elementId]) {
          delete next[elementId];
        } else {
          next[elementId] = true;
        }
        this.elementLocks = next;
        this.persistiereElementLocks();
        this.aktualisiereNotizEditorModi();
      },
      persistiereElementLocks() {
        const map = { ...(this.elementLocks || {}) };
        this.speichereElementLocksDirekt(map);
        // Legacy mirror for existing installs/features.
        this.speichereMapEinstellung('elementLocks', map);
      },
      alleElementeSperren() {
        const next = {};
        (this.graph.nodes || []).forEach((node) => {
          if (node && node.id) {
            next[node.id] = true;
          }
        });
        (this.ortBildElemente || []).forEach((bild) => {
          if (bild && bild.bildId) {
            next[bild.bildId] = true;
          }
        });
        this.elementLocks = next;
        this.persistiereElementLocks();
        this.aktualisiereNotizEditorModi();
      },
      alleElementeEntsperren() {
        this.elementLocks = {};
        this.persistiereElementLocks();
        this.aktualisiereNotizEditorModi();
      },
      springeZuSuchtreffer(treffer) {
        if (!treffer || !treffer.zielTyp || !treffer.zielId) {
          return;
        }
        if (treffer.zielTyp === 'node') {
          const node = this.findeNode(treffer.zielId);
          if (!node || !node.position) {
            return;
          }
          const centerX = Number(node.position.x || 0) + this.nodeBreite(node) / 2;
          const centerY = Number(node.position.y || 0) + this.nodeHoehe(node) / 2;
          this.wendeMapCenterWeltAn(centerX, centerY);
        } else if (treffer.zielTyp === 'bild') {
          const bild = (this.ortBildElemente || []).find((eintrag) => eintrag && eintrag.bildId === treffer.zielId);
          if (!bild) {
            return;
          }
          const centerX = (Number(bild.x) || 0) + Math.max(1, Number(bild.width) || 1) / 2;
          const centerY = (Number(bild.y) || 0) + Math.max(1, Number(bild.height) || 1) / 2;
          this.wendeMapCenterWeltAn(centerX, centerY);
        }
        this.sucheFokusAktiv = false;
      },
      onSucheBlur() {
        if (this.sucheBlurTimer) {
          globalThis.clearTimeout(this.sucheBlurTimer);
          this.sucheBlurTimer = 0;
        }
        this.sucheBlurTimer = globalThis.setTimeout(() => {
          this.sucheFokusAktiv = false;
          this.sucheBlurTimer = 0;
        }, 120);
      },
      schreibeOrtBildLayout(ortId, layout) {
        if (!ortId || !layout) {
          return;
        }
        const istNotiz = String(ortId).startsWith('notiz:');
        const istPfeil = String(ortId).startsWith('pfeil:');
        const minWidth = istPfeil || istNotiz ? 220 : 1;
        const minHeight = istPfeil || istNotiz ? 56 : 1;
        const alt = this.mapBildLayoutsLokal && this.mapBildLayoutsLokal[ortId]
          ? this.mapBildLayoutsLokal[ortId]
          : null;
        const angleDegRaw = Number(layout.angleDeg);
        const angleDeg = Number.isFinite(angleDegRaw)
          ? Math.round(angleDegRaw * 100) / 100
          : Number.isFinite(Number(alt && alt.angleDeg))
            ? Number(alt && alt.angleDeg)
            : 0;
        this.mapBildLayoutsLokal = {
          ...(this.mapBildLayoutsLokal || {}),
          [ortId]: {
            x: Math.round(Number(layout.x) || 0),
            y: Math.round(Number(layout.y) || 0),
            width: Math.max(minWidth, Math.round(Number(layout.width) || 320)),
            height: Math.max(minHeight, Math.round(Number(layout.height) || 220)),
            angleDeg,
          },
        };
        this.planeOrtBildLayoutsPersistieren();
      },
      persistiereLokaleOrtBildLayouts() {
        if (this.verlauf.ortBildLayoutSpeicherTimer) {
          window.clearTimeout(this.verlauf.ortBildLayoutSpeicherTimer);
          this.verlauf.ortBildLayoutSpeicherTimer = 0;
        }
        const gruppeKey = this.gruppeId || 'default';
        const alleLayouts = this.ladeBildLayouts();
        this.speichereBildLayouts({
          ...alleLayouts,
          [gruppeKey]: JSON.parse(JSON.stringify(this.mapBildLayoutsLokal || {})),
        });
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
        if (!['charakter', 'npc', 'bestie', 'gegenstand', 'raetsel', 'fraktion'].includes(sourceType)) {
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
          if (sourceType === 'fraktion') {
            return t === 'ort';
          }
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
          if (sourceType === 'fraktion') {
            return this.verknuepfeFraktionMitOrt(sourceId, ortName);
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
      winkelGradZwischenPunkten(vonX, vonY, nachX, nachY) {
        const dx = Number(nachX) - Number(vonX);
        const dy = Number(nachY) - Number(vonY);
        return (Math.atan2(dy, dx) * 180) / Math.PI;
      },
      clientZuWelt(clientX, clientY) {
        const canvas = this.$el && this.$el.querySelector ? this.$el.querySelector('.htbah-weltenbau-map-canvas') : null;
        const rect =
          canvas && typeof canvas.getBoundingClientRect === 'function'
            ? canvas.getBoundingClientRect()
            : { left: 0, top: 0 };
        const scale = Number(this.map.scale) || 1;
        return {
          x: (Number(clientX) - (rect.left || 0) - (Number(this.map.offsetX) || 0)) / scale,
          y: (Number(clientY) - (rect.top || 0) - (Number(this.map.offsetY) || 0)) / scale,
        };
      },
      starteOrtBildDrag(event, bild, modus = 'move') {
        if (!bild || !bild.bildId) {
          return;
        }
        if (event && event.shiftKey) {
          this.starteAuswahlRahmen(event);
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        if (this.istElementGesperrt(bild.bildId)) {
          this.startePan(event, { ignoriereElementTreffer: true });
          return;
        }
        if (modus === 'move' && this.anzahlAusgewaehlteVerschiebbareElemente() > 1) {
          if (this.starteGruppenDrag(event)) {
            return;
          }
        }
        this.starteVerlaufAktion();
        this.ortBildDrag.aktiv = true;
        this.ortBildDrag.ortId = bild.bildId;
        this.ortBildDrag.modus =
          modus === 'resize' || modus === 'resize-left' || modus === 'rotate' ? modus : 'move';
        this.ortBildDrag.startClientX = event.clientX;
        this.ortBildDrag.startClientY = event.clientY;
        this.ortBildDrag.startX = Number(bild.x) || 0;
        this.ortBildDrag.startY = Number(bild.y) || 0;
        this.ortBildDrag.startWidth = Number(bild.width) || 320;
        this.ortBildDrag.startHeight = Number(bild.height) || 220;
        this.ortBildDrag.startAngleDeg = Number.isFinite(Number(bild.angleDeg)) ? Number(bild.angleDeg) : 0;
        this.ortBildDrag.aktuellAngleDeg = this.ortBildDrag.startAngleDeg;
        this.ortBildDrag.startCenterX = this.ortBildDrag.startX + this.ortBildDrag.startWidth / 2;
        this.ortBildDrag.startCenterY = this.ortBildDrag.startY + this.ortBildDrag.startHeight / 2;
        const startPointerWelt = this.clientZuWelt(event.clientX, event.clientY);
        this.ortBildDrag.startPointerAngleDeg = this.winkelGradZwischenPunkten(
          this.ortBildDrag.startCenterX,
          this.ortBildDrag.startCenterY,
          startPointerWelt.x,
          startPointerWelt.y,
        );
        this.ortBildDrag.bewegt = false;
        this.setzeDragHoverZiel('');
        event.preventDefault();
      },
      starteNodeDrag(event, node) {
        if (!node || !node.id) {
          return;
        }
        if (event && event.shiftKey) {
          this.starteAuswahlRahmen(event);
          return;
        }
        if (this.istElementGesperrt(node.id)) {
          return;
        }
        if (this.anzahlAusgewaehlteVerschiebbareElemente() > 1) {
          if (this.starteGruppenDrag(event)) {
            return;
          }
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
        if (Date.now() < (Number(this.klickUnterdrueckenBisMs) || 0)) {
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
        this.$nextTick(() => this.initialisiereCharakterFenster());
      },
      oeffneCharakterBearbeitung(node) {
        const mitgliedId = node && node.data ? node.data.entityId : '';
        if (!mitgliedId || !this.gruppeId) {
          return;
        }
        const zustand = window.HTBAH.ladeSpielleiterZustand();
        zustand.aktiveKampagneId = this.gruppeId;
        zustand.mitgliedWahlProKampagne = {
          ...(zustand.mitgliedWahlProKampagne || {}),
          [this.gruppeId]: mitgliedId,
        };
        window.HTBAH.speichereSpielleiterZustand(zustand);
        this.schliessen();
        if (this.$router && typeof this.$router.push === 'function') {
          this.$router.push(`/spielleiter/kampagne/${this.gruppeId}`);
        }
      },
      schliesseCharakterModal() {
        if (this.charakterMentionController && typeof this.charakterMentionController.destroy === 'function') {
          this.charakterMentionController.destroy();
        }
        this.charakterMentionController = null;
        this.beendeCharakterZiehen();
        this.beendeCharakterResize();
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
        this.charakterModal.fenster.istVollbild = false;
      },
      begrenzeCharakterFensterGroesse(breite, hoehe) {
        return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 420, 320);
      },
      initialisiereCharakterFenster() {
        const fenster = this.$refs.charakterFensterElement;
        if (!fenster || !this.charakterModal.offen) {
          return;
        }
        if (this.charakterModal.fenster.breite == null || this.charakterModal.fenster.hoehe == null) {
          const groesse = this.begrenzeCharakterFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
          this.charakterModal.fenster.breite = groesse.breite;
          this.charakterModal.fenster.hoehe = groesse.hoehe;
        }
        if (this.charakterModal.fenster.positionX == null || this.charakterModal.fenster.positionY == null) {
          const v = this.ermittleViewportGroesse();
          this.charakterModal.fenster.positionX = Math.max(0, Math.round((v.viewportBreite - this.charakterModal.fenster.breite) / 2));
          this.charakterModal.fenster.positionY = Math.max(0, Math.round((v.viewportHoehe - this.charakterModal.fenster.hoehe) / 2));
        }
        this.stelleSichtbaresCharakterFensterSicher();
      },
      stelleSichtbaresCharakterFensterSicher() {
        const fenster = this.charakterModal.fenster;
        if (fenster.istVollbild || fenster.breite == null || fenster.hoehe == null) {
          return;
        }
        const groesse = this.begrenzeCharakterFensterGroesse(fenster.breite, fenster.hoehe);
        fenster.breite = groesse.breite;
        fenster.hoehe = groesse.hoehe;
        const pos = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(
          fenster.positionX || 0,
          fenster.positionY || 0,
          fenster.breite,
          fenster.hoehe,
        );
        fenster.positionX = pos.x;
        fenster.positionY = pos.y;
      },
      starteCharakterZiehen(event) {
        const fenster = this.charakterModal.fenster;
        if (fenster.istVollbild || (event.target && event.target.closest('button, a, input, select, textarea'))) {
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        const el = this.$refs.charakterFensterElement;
        if (!el) {
          return;
        }
        const rect = el.getBoundingClientRect();
        fenster.ziehenAktiv = true;
        fenster.ziehOffsetX = event.clientX - rect.left;
        fenster.ziehOffsetY = event.clientY - rect.top;
        window.addEventListener('pointermove', this.beimCharakterZiehen);
        window.addEventListener('pointerup', this.beendeCharakterZiehen);
        window.addEventListener('pointercancel', this.beendeCharakterZiehen);
        event.preventDefault();
      },
      beimCharakterZiehen(event) {
        const fenster = this.charakterModal.fenster;
        if (!fenster.ziehenAktiv || fenster.istVollbild || fenster.breite == null || fenster.hoehe == null) {
          return;
        }
        fenster.positionX = event.clientX - fenster.ziehOffsetX;
        fenster.positionY = event.clientY - fenster.ziehOffsetY;
        this.stelleSichtbaresCharakterFensterSicher();
      },
      beendeCharakterZiehen() {
        this.charakterModal.fenster.ziehenAktiv = false;
        window.removeEventListener('pointermove', this.beimCharakterZiehen);
        window.removeEventListener('pointerup', this.beendeCharakterZiehen);
        window.removeEventListener('pointercancel', this.beendeCharakterZiehen);
      },
      starteCharakterResize(event) {
        const fenster = this.charakterModal.fenster;
        if (fenster.istVollbild) {
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        const el = this.$refs.charakterFensterElement;
        if (!el) {
          return;
        }
        fenster.resizeAktiv = true;
        fenster.resizeStartX = event.clientX;
        fenster.resizeStartY = event.clientY;
        fenster.resizeStartBreite = fenster.breite != null ? fenster.breite : el.offsetWidth;
        fenster.resizeStartHoehe = fenster.hoehe != null ? fenster.hoehe : el.offsetHeight;
        window.addEventListener('pointermove', this.beimCharakterResize);
        window.addEventListener('pointerup', this.beendeCharakterResize);
        window.addEventListener('pointercancel', this.beendeCharakterResize);
        event.preventDefault();
      },
      beimCharakterResize(event) {
        const fenster = this.charakterModal.fenster;
        if (!fenster.resizeAktiv || fenster.istVollbild) {
          return;
        }
        const neueBreite = fenster.resizeStartBreite + (event.clientX - fenster.resizeStartX);
        const neueHoehe = fenster.resizeStartHoehe + (event.clientY - fenster.resizeStartY);
        const groesse = this.begrenzeCharakterFensterGroesse(neueBreite, neueHoehe);
        fenster.breite = groesse.breite;
        fenster.hoehe = groesse.hoehe;
        this.stelleSichtbaresCharakterFensterSicher();
      },
      beendeCharakterResize() {
        this.charakterModal.fenster.resizeAktiv = false;
        window.removeEventListener('pointermove', this.beimCharakterResize);
        window.removeEventListener('pointerup', this.beendeCharakterResize);
        window.removeEventListener('pointercancel', this.beendeCharakterResize);
      },
      charakterVollbildUmschalten() {
        this.charakterModal.fenster.istVollbild = !this.charakterModal.fenster.istVollbild;
        if (!this.charakterModal.fenster.istVollbild) {
          this.$nextTick(() => this.stelleSichtbaresCharakterFensterSicher());
        }
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
        if (this.charakterMentionController && typeof this.charakterMentionController.destroy === 'function') {
          this.charakterMentionController.destroy();
        }
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.charakterMentionController = mentionApi.installMentions(this.charakterQuillInstanz, {
            getItems: (query) => this.mentionItemsFuerQuill(query),
            onEntityClick: (target) => this.oeffneEntitaetAusMention(target),
          });
        }
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
      charakterInitiativeWuerfeln() {
        if (!this.charakterModal.charakter) {
          return;
        }
        const handelnSumme = Array.isArray(this.charakterModal.charakter.handeln)
          ? this.charakterModal.charakter.handeln.reduce(
              (sum, eintrag) => sum + (Number(eintrag && eintrag.value) || 0),
              0,
            )
          : 0;
        const handelnBegabungswert = Math.max(0, Math.round(handelnSumme / 10));
        this.$refs.charakterInitiativeWuerfelbecher?.wuerfeln('1W10').then((werte) => {
          const wurf = Array.isArray(werte) && werte.length ? Number(werte[0]) || 1 : 1;
          const gesamt = wurf + handelnBegabungswert;
          this.charakterModal.charakter.initiative = this.normalisiereInitiativeWert(
            gesamt,
            handelnBegabungswert,
          );
        });
      },
      async charakterInitiativeZuruecksetzen() {
        if (!this.charakterModal.charakter) {
          return;
        }
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Initiative zurücksetzen?',
          beschreibung: 'Ist der Kampf wirklich schon vorbei?',
          bestaetigenText: 'Zurücksetzen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: false,
        });
        if (!bestaetigt) {
          return;
        }
        this.charakterModal.charakter.initiative = '';
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
          schadenswertNahkampf: '',
          schadenswertFernkampf: '',
          rustwert: '',
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
              schadenswertNahkampf: item ? item.schadenswertNahkampf : '',
              schadenswertFernkampf: item ? item.schadenswertFernkampf : '',
              rustwert: item ? item.rustwert : '',
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
        if (this.verlauf.mapScaleSpeicherTimer) {
          window.clearTimeout(this.verlauf.mapScaleSpeicherTimer);
          this.verlauf.mapScaleSpeicherTimer = 0;
        }
        if (this.verlauf.ortBildLayoutSpeicherTimer) {
          window.clearTimeout(this.verlauf.ortBildLayoutSpeicherTimer);
          this.verlauf.ortBildLayoutSpeicherTimer = 0;
        }
        this.verlauf.undoStack = [];
        this.verlauf.redoStack = [];
        this.verlauf.pendingBefore = null;
      },
      planeOrtBildLayoutsPersistieren() {
        if (this.verlauf.ortBildLayoutSpeicherTimer) {
          window.clearTimeout(this.verlauf.ortBildLayoutSpeicherTimer);
        }
        this.verlauf.ortBildLayoutSpeicherTimer = window.setTimeout(() => {
          this.verlauf.ortBildLayoutSpeicherTimer = 0;
          this.persistiereLokaleOrtBildLayouts();
        }, 120);
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
      planeMapViewportEinstellungenSpeichern() {
        if (this.mapViewportPersistPause) {
          return;
        }
        if (this.verlauf.mapScaleSpeicherTimer) {
          window.clearTimeout(this.verlauf.mapScaleSpeicherTimer);
        }
        this.verlauf.mapScaleSpeicherTimer = window.setTimeout(() => {
          this.verlauf.mapScaleSpeicherTimer = 0;
          const normalisiert = this.begrenzeMapScale(Number(this.map.scale) || 1);
          const center = this.ermittleMapCenterWelt();
          this.speichereMapEinstellung('zoomScale', normalisiert);
          this.speichereMapEinstellung('mapCenterX', Math.round(Number(center.x) || 0));
          this.speichereMapEinstellung('mapCenterY', Math.round(Number(center.y) || 0));
        }, 180);
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
      ermittleMapCenterWelt() {
        const mitte = this.mapViewportMitteClient();
        const scale = Number(this.map.scale) || 1;
        return {
          x: (mitte.x - (Number(this.map.offsetX) || 0)) / scale,
          y: (mitte.y - (Number(this.map.offsetY) || 0)) / scale,
        };
      },
      wendeMapCenterWeltAn(centerX, centerY) {
        if (!Number.isFinite(Number(centerX)) || !Number.isFinite(Number(centerY))) {
          return;
        }
        const mitte = this.mapViewportMitteClient();
        const scale = Number(this.map.scale) || 1;
        this.map.offsetX = mitte.x - Number(centerX) * scale;
        this.map.offsetY = mitte.y - Number(centerY) * scale;
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
      startePan(event, optionen) {
        const opts = optionen && typeof optionen === 'object' ? optionen : {};
        if (this.starteAuswahlRahmen(event)) {
          return;
        }
        if (
          !opts.ignoriereElementTreffer &&
          event.target &&
          typeof event.target.closest === 'function' &&
          (event.target.closest('.htbah-map-node') || event.target.closest('.htbah-map-ort-bild'))
        ) {
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
        if (this.auswahlRahmen.aktiv) {
          this.auswahlRahmen.endeClientX = event.clientX;
          this.auswahlRahmen.endeClientY = event.clientY;
          return;
        }
        if (this.gruppenDrag.aktiv) {
          const dx = (event.clientX - this.gruppenDrag.startClientX) / this.map.scale;
          const dy = (event.clientY - this.gruppenDrag.startClientY) / this.map.scale;
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            this.gruppenDrag.bewegt = true;
          }
          Object.entries(this.gruppenDrag.nodeStartPositionen || {}).forEach(([nodeId, start]) => {
            const node = this.findeNode(nodeId);
            if (!node) {
              return;
            }
            node.position = {
              x: Math.round((Number(start.x) || 0) + dx),
              y: Math.round((Number(start.y) || 0) + dy),
            };
          });
          Object.entries(this.gruppenDrag.bildStartLayouts || {}).forEach(([bildId, start]) => {
            this.schreibeOrtBildLayout(start.layoutKey || start.ortNodeId || bildId, {
              x: (Number(start.x) || 0) + dx,
              y: (Number(start.y) || 0) + dy,
              width: Math.max(1, Number(start.width) || 1),
              height: Math.max(1, Number(start.height) || 1),
            });
          });
          return;
        }
        if (this.ortBildDrag.aktiv) {
          const bild = this.ortBildElemente.find((eintrag) => eintrag.bildId === this.ortBildDrag.ortId);
          if (!bild) {
            return;
          }
          const dx = (event.clientX - this.ortBildDrag.startClientX) / this.map.scale;
          const dy = (event.clientY - this.ortBildDrag.startClientY) / this.map.scale;
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            this.ortBildDrag.bewegt = true;
          }
          if (this.ortBildDrag.modus === 'rotate') {
            const pointerWelt = this.clientZuWelt(event.clientX, event.clientY);
            const currentPointerAngle = this.winkelGradZwischenPunkten(
              this.ortBildDrag.startCenterX,
              this.ortBildDrag.startCenterY,
              pointerWelt.x,
              pointerWelt.y,
            );
            const delta = currentPointerAngle - this.ortBildDrag.startPointerAngleDeg;
            this.ortBildDrag.aktuellAngleDeg = this.pfeilWinkelMitSnap(this.ortBildDrag.startAngleDeg + delta, event);
            this.schreibeOrtBildLayout(bild.layoutKey || bild.ortNodeId || bild.bildId, {
              x: this.ortBildDrag.startX,
              y: this.ortBildDrag.startY,
              width: this.ortBildDrag.startWidth,
              height: this.ortBildDrag.startHeight,
              angleDeg: this.ortBildDrag.aktuellAngleDeg,
            });
          } else if (this.ortBildDrag.modus === 'resize') {
            this.schreibeOrtBildLayout(bild.layoutKey || bild.ortNodeId || bild.bildId, {
              x: this.ortBildDrag.startX,
              y: this.ortBildDrag.startY,
              width: Math.max(1, this.ortBildDrag.startWidth + dx),
              height: Math.max(1, this.ortBildDrag.startHeight + dy),
            });
          } else if (this.ortBildDrag.modus === 'resize-left') {
            const minBreite = bild && bild.ankerTyp === 'pfeil' ? 220 : 1;
            const zielBreite = this.ortBildDrag.startWidth - dx;
            const neueBreite = Math.max(minBreite, zielBreite);
            const verbrauchtDx = this.ortBildDrag.startWidth - neueBreite;
            this.schreibeOrtBildLayout(bild.layoutKey || bild.ortNodeId || bild.bildId, {
              x: this.ortBildDrag.startX + verbrauchtDx,
              y: this.ortBildDrag.startY,
              width: neueBreite,
              height: Math.max(1, this.ortBildDrag.startHeight + dy),
            });
          } else {
            this.schreibeOrtBildLayout(bild.layoutKey || bild.ortNodeId || bild.bildId, {
              x: this.ortBildDrag.startX + dx,
              y: this.ortBildDrag.startY + dy,
              width: this.ortBildDrag.startWidth,
              height: this.ortBildDrag.startHeight,
            });
          }
          return;
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
            x: Math.round(this.nodeDrag.startNodeX + dx),
            y: Math.round(this.nodeDrag.startNodeY + dy),
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
        if (this.auswahlRahmen.aktiv) {
          this.auswahlRahmen.endeClientX = event.clientX;
          this.auswahlRahmen.endeClientY = event.clientY;
          const minClientX = Math.min(this.auswahlRahmen.startClientX, this.auswahlRahmen.endeClientX);
          const minClientY = Math.min(this.auswahlRahmen.startClientY, this.auswahlRahmen.endeClientY);
          const maxClientX = Math.max(this.auswahlRahmen.startClientX, this.auswahlRahmen.endeClientX);
          const maxClientY = Math.max(this.auswahlRahmen.startClientY, this.auswahlRahmen.endeClientY);
          const canvas = this.$el && this.$el.querySelector ? this.$el.querySelector('.htbah-weltenbau-map-canvas') : null;
          const canvasRect = canvas && typeof canvas.getBoundingClientRect === 'function'
            ? canvas.getBoundingClientRect()
            : { left: 0, top: 0 };
          const scale = Number(this.map.scale) || 1;
          const auswahlRect = {
            x: (minClientX - (canvasRect.left || 0) - (Number(this.map.offsetX) || 0)) / scale,
            y: (minClientY - (canvasRect.top || 0) - (Number(this.map.offsetY) || 0)) / scale,
            w: Math.max(1, (maxClientX - minClientX) / scale),
            h: Math.max(1, (maxClientY - minClientY) / scale),
          };
          const treffer = [];
          (this.graph.nodes || []).forEach((node) => {
            const r = this.nodeRechteck(node);
            if (r && this.rechteckeUeberlappen(auswahlRect, r, 0)) {
              treffer.push(node.id);
            }
          });
          (this.ortBildElemente || []).forEach((bild) => {
            const r = {
              x: Number(bild.x) || 0,
              y: Number(bild.y) || 0,
              w: Math.max(1, Number(bild.width) || 1),
              h: Math.max(1, Number(bild.height) || 1),
            };
            if (this.rechteckeUeberlappen(auswahlRect, r, 0)) {
              treffer.push(bild.bildId);
            }
          });
          this.markiereElemente(treffer);
          this.auswahlRahmen.aktiv = false;
          return;
        }
        if (this.gruppenDrag.aktiv) {
          Object.keys(this.gruppenDrag.nodeStartPositionen || {}).forEach((nodeId) => {
            const node = this.findeNode(nodeId);
            if (!node || !node.position) {
              return;
            }
            this.schreibeNodePosition(node.id, node.position, this.graph.gruppeKey);
          });
          if (Object.keys(this.gruppenDrag.bildStartLayouts || {}).length) {
            this.persistiereLokaleOrtBildLayouts();
          }
          if (this.gruppenDrag.bewegt) {
            this.klickUnterdrueckenBisMs = Date.now() + 260;
          }
          this.gruppenDrag.aktiv = false;
          this.gruppenDrag.nodeStartPositionen = {};
          this.gruppenDrag.bildStartLayouts = {};
          this.bestaetigeVerlaufAktion();
          return;
        }
        if (this.ortBildDrag.aktiv) {
          this.ortBildDrag.aktiv = false;
          const ortId = this.ortBildDrag.ortId;
          const dragBild = ortId ? this.ortBildElemente.find((eintrag) => eintrag && eintrag.bildId === ortId) : null;
          const ortNode = dragBild && dragBild.ortNodeId ? this.findeNode(dragBild.ortNodeId) : null;
          const ortName = ortNode && ortNode.data && ortNode.data.payload
            ? String(ortNode.data.payload.name || '').trim()
            : '';
          const aktuellesBildLayout =
            dragBild && dragBild.layoutKey && this.mapBildLayoutsLokal ? this.mapBildLayoutsLokal[dragBild.layoutKey] : null;
          const deltaX = aktuellesBildLayout
            ? Math.round((Number(aktuellesBildLayout.x) || 0) - this.ortBildDrag.startX)
            : 0;
          const deltaY = aktuellesBildLayout
            ? Math.round((Number(aktuellesBildLayout.y) || 0) - this.ortBildDrag.startY)
            : 0;
          this.persistiereLokaleOrtBildLayouts();
          if (
            this.ortBildDrag.modus === 'move' &&
            this.ortBildDrag.bewegt &&
            dragBild &&
            dragBild.ankerTyp === 'ort' &&
            ortName &&
            (deltaX !== 0 || deltaY !== 0)
          ) {
            const verschiebbareTypen = new Set(['charakter', 'npc', 'bestie', 'gegenstand', 'raetsel']);
            (this.graph.nodes || []).forEach((node) => {
              if (!node || !node.data || !node.position || !verschiebbareTypen.has(node.data.entityType)) {
                return;
              }
              const payload = node.data.payload || {};
              const aufenthaltsort = String(payload.aufenthaltsort || '').trim();
              if (!aufenthaltsort || aufenthaltsort !== ortName) {
                return;
              }
              node.position = {
                x: Math.round((Number(node.position.x) || 0) + deltaX),
                y: Math.round((Number(node.position.y) || 0) + deltaY),
              };
              this.schreibeNodePosition(node.id, node.position, this.graph.gruppeKey);
            });
          }
          this.ortBildDrag.ortId = '';
          this.ortBildDrag.modus = '';
          this.ortBildDrag.aktuellAngleDeg = 0;
          this.bestaetigeVerlaufAktion();
          return;
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
                  if (node.data.entityType === 'fraktion') {
                    wurdeAktualisiert = this.verknuepfeFraktionMitOrt(node.data.entityId, ortName);
                  } else {
                    this.updateAufenthaltsort(node.data.entityType, node.data.entityId, ortName);
                    wurdeAktualisiert = true;
                  }
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
        if (event.key === 'Escape' && this.ausgewaehlteElementeAnzahl > 0) {
          event.preventDefault();
          this.auswahlAufheben();
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
      verknuepfeFraktionMitOrt(fraktionId, ortName) {
        const name = String(ortName || '').trim();
        if (!fraktionId || !name) {
          return false;
        }
        let wurdeGeaendert = false;
        this.zustand.fraktionen = (this.zustand.fraktionen || []).map((fraktion) => {
          if (!fraktion || fraktion.id !== fraktionId) {
            return fraktion;
          }
          const orte = this.fraktionOrteListe(fraktion);
          if (orte.includes(name)) {
            return fraktion;
          }
          wurdeGeaendert = true;
          return {
            ...fraktion,
            orte: [...orte, name],
          };
        });
        if (wurdeGeaendert) {
          this.speichereZustand();
        }
        return wurdeGeaendert;
      },
      async loescheAnlageMitBestaetigung() {
        const typ = this.anlage && this.anlage.typ;
        const index = this.anlage && Number.isInteger(this.anlage.index) ? this.anlage.index : -1;
        if (!typ || index < 0) {
          return;
        }
        if (!['npc', 'ort', 'fraktion', 'pantheon', 'raetsel', 'bestie', 'gegenstand'].includes(typ)) {
          return;
        }
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Eintrag löschen?',
          beschreibung: 'Der Eintrag wird dauerhaft aus der Interaktiven Welt entfernt.',
          bestaetigenText: 'Löschen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: false,
        });
        if (!bestaetigt) {
          return;
        }
        if (!this.loescheAnlageIntern(typ, index)) {
          return;
        }
        this.schliesseAnlageModal();
        this.$nextTick(() => this.refreshGraph());
      },
      loescheAnlageIntern(typ, index) {
        if (!Number.isInteger(index) || index < 0) {
          return false;
        }
        const listeName =
          typ === 'npc'
            ? 'npcs'
            : typ === 'ort'
              ? 'orte'
              : typ === 'fraktion'
                ? 'fraktionen'
                : typ === 'pantheon'
                  ? 'pantheon'
                  : typ === 'raetsel'
                    ? 'raetsel'
                    : typ === 'bestie'
                      ? 'bestien'
                      : typ === 'gegenstand'
                        ? 'gegenstaende'
                        : '';
        if (!listeName || !Array.isArray(this.zustand[listeName]) || index >= this.zustand[listeName].length) {
          return false;
        }
        this.zustand[listeName] = this.zustand[listeName].filter((_, i) => i !== index);
        this.speichereZustand();
        return true;
      },
      dupliziereAnlageAusModal() {
        if (!this.anlage || this.anlage.typ !== 'bestie' || !this.anlage.zeile) {
          return;
        }
        const kopie = JSON.parse(JSON.stringify(this.anlage.zeile));
        kopie.id = window.HTBAH.neueEntropieId();
        const basisName = String(kopie.name || '').trim();
        kopie.name = basisName ? `${basisName} (Kopie)` : 'Neue Bestie (Kopie)';
        this.zustand.bestien = [...(this.zustand.bestien || []), kopie];
        this.speichereZustand();
        this.schliesseAnlageModal();
        this.$nextTick(() => {
          this.refreshGraph();
          this.$nextTick(() => this.fokussiereNeuGespeicherteEntitaet('bestie', kopie.id));
        });
      },
      oeffneDetail(node) {
        this.detail = node && node.data ? node.data : null;
        this.modal.detailsOffen = !!this.detail;
      },
      starteBearbeitungAusDetail(optionen) {
        const opts = optionen && typeof optionen === 'object' ? optionen : {};
        const alsOverlay = !!opts.alsOverlay;
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
        if (typeof zeile.primaryMediumId !== 'string') {
          zeile.primaryMediumId = '';
        }
        if (typ === 'fraktion') {
          zeile.orte = this.fraktionOrteListe(zeile);
        }
        if (alsOverlay) {
          this.anlageOverlay.typ = typ;
          this.anlageOverlay.index = index;
          this.anlageOverlay.zeile = zeile;
          this.anlageOverlay.offen = true;
          this.overlayZeileQuillInstanz = null;
          this.overlayZeileMentionController = null;
          this.overlayZeileQuillHostElement = null;
          this.overlayZeileQuillSession += 1;
        } else {
          this.anlage.typ = typ;
          this.anlage.index = index;
          this.anlage.zeile = zeile;
          this.anlage.offen = true;
          this.zeileQuillSession += 1;
        }
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
            primaryMediumId: '',
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
            geheimnis: '',
            stimme: '',
            lebenspunkte: '60',
            waffe: '',
            schadenswertNahkampf: '',
            schadenswertFernkampf: '',
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
            primaryMediumId: '',
          };
        }
        if (typ === 'bestie') {
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
            lebenspunkte: '60',
            aufenthaltsort: ortDefault,
            handeln: 16,
            wissen: 8,
            soziales: 16,
            initiative: '',
            fraktionen: [],
            staerke: '',
            schwaeche: '',
            geheimnis: '',
            beschreibungHtml: '',
            aggressivitaetSkala: 5,
            lpBewusstlosAusgeblendet: false,
            lpMassenschadenBewusstlos: false,
            medien: [],
            primaryMediumId: '',
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
            primaryMediumId: '',
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
            primaryMediumId: '',
          };
        }
        return {
          id: window.HTBAH.neueEntropieId(),
          name: '',
          istWaffe: false,
          schadenswertNahkampf: '',
          schadenswertFernkampf: '',
          aufenthaltsort: ortDefault,
          initiative: '',
          beschreibungHtml: '',
          medien: [],
          primaryMediumId: '',
        };
      },
      starteAnlageFlow(typ) {
        if (!typ) {
          return;
        }
        if (typ === 'bild') {
          this.oeffneMedienGalerieModal();
          return;
        }
        if (typ === 'notizzettel') {
          this.fuegeNotizzettelZurKarteHinzu();
          return;
        }
        if (typ === 'pfeil') {
          this.fuegePfeilZurKarteHinzu();
          return;
        }
        this.anlage.typ = typ;
        this.anlage.index = -1;
        this.anlage.zeile = this.neueAnlageZeile(typ);
        this.anlage.offen = true;
        this.speicherStatusHinweis = '';
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
        if (this.zeileMentionController && typeof this.zeileMentionController.destroy === 'function') {
          this.zeileMentionController.destroy();
        }
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.zeileMentionController = mentionApi.installMentions(this.zeileQuillInstanz, {
            getItems: (query) => this.mentionItemsFuerQuill(query),
            onEntityClick: (target) => this.oeffneEntitaetAusMention(target),
          });
        }
        this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
        this.zeileQuillInstanz.on('selection-change', (range, oldRange) => {
          if (this.anlage.offen && this.anlage.index >= 0 && oldRange && !range) {
            this.anlageBearbeitungBeiBlurSpeichern();
          }
        });
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
      bildImportNaechstesAusWarteschlange() {
        if (!this.medienImportWarteschlange.length) {
          this.medienUploadLaeuft = false;
          this.bildImportKontext = 'hintergrund';
          return;
        }
        const file = this.medienImportWarteschlange.shift();
        window.setTimeout(() => {
          const modal = this.$refs.weltenbauHintergrundImportModal;
          if (modal && typeof modal.oeffnenMitDatei === 'function') {
            this.bildImportKontext = 'anlage';
            modal.oeffnenMitDatei(file);
          } else {
            this.medienUploadLaeuft = false;
          }
        }, 100);
      },
      onZeilenBildImportFertig({ dataUrl, name, dateigroesseBytes }) {
        if (!this.anlage.zeile || !dataUrl || !String(dataUrl).startsWith('data:image/')) {
          this.bildImportNaechstesAusWarteschlange();
          return;
        }
        const neuerEintrag = {
          id: window.HTBAH.neueEntropieId(),
          typ: 'bild',
          name: typeof name === 'string' && name.trim() ? name.trim() : 'Bild',
          mimeType: (String(dataUrl).match(/^data:([^;,]+)/i) || [])[1] || '',
          dataUrl,
          size: Number.isFinite(dateigroesseBytes) && dateigroesseBytes > 0 ? Math.round(dateigroesseBytes) : null,
          createdAt: new Date().toISOString(),
        };
        const liste = Array.isArray(this.anlage.zeile.medien) ? this.anlage.zeile.medien.slice() : [];
        liste.push(neuerEintrag);
        this.anlage.zeile.medien = liste;
        if (!String(this.anlage.zeile.primaryMediumId || '').trim()) {
          this.anlage.zeile.primaryMediumId = neuerEintrag.id;
        }
        this.anlageBearbeitungBeiBlurSpeichern();
        this.bildImportNaechstesAusWarteschlange();
      },
      onZeilenBildImportAbgebrochen() {
        this.medienImportWarteschlange = [];
        this.medienUploadLaeuft = false;
        this.bildImportKontext = 'hintergrund';
      },
      onZeilenBildImportFehler() {
        this.bildImportNaechstesAusWarteschlange();
      },
      async onBearbeitungsMedienDateienGewaehlt(ev) {
        if (!this.anlage.zeile) {
          return;
        }
        if (this.anlage.index < 0) {
          await window.HTBAH.ui.alert({
            titel: 'Entität zuerst speichern',
            beschreibung: 'Dateien und Bilder können erst bei bereits gespeicherten Entitäten bearbeitet werden.',
          });
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
        this.medienUploadLaeuft = true;
        this.speicherStatusHinweis = '';
        const neu = [];
        try {
          const bildDateien = dateien.filter((file) => String(file.type || '').startsWith('image/'));
          const sonstigeDateien = dateien.filter((file) => !String(file.type || '').startsWith('image/'));
          for (const file of sonstigeDateien) {
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
              typ: 'datei',
              name: String(file.name || '').trim() || 'Datei',
              mimeType,
              dataUrl,
              size: Number.isFinite(file.size) ? Math.round(file.size) : null,
              createdAt: new Date().toISOString(),
            });
          }
          if (bildDateien.length) {
            this.medienImportWarteschlange = this.medienImportWarteschlange.concat(bildDateien);
          }
        } finally {
          if (!this.medienImportWarteschlange.length) {
            this.medienUploadLaeuft = false;
          }
        }
        this.anlage.zeile.medien = [...(Array.isArray(this.anlage.zeile.medien) ? this.anlage.zeile.medien : []), ...neu];
        this.anlageBearbeitungBeiBlurSpeichern();
        if (this.medienImportWarteschlange.length) {
          this.bildImportNaechstesAusWarteschlange();
        }
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
      ortHatBildLayout(ortId) {
        const id = String(ortId || '').trim();
        if (!id) {
          return false;
        }
        const key = `ort:${id}`;
        return !!(this.mapBildLayoutsLokal && this.mapBildLayoutsLokal[key]);
      },
      ortBildLayoutBeimNodeInitialisieren(ortId) {
        const id = String(ortId || '').trim();
        if (!id) {
          return;
        }
        const layoutKey = `ort:${id}`;
        if (this.mapBildLayoutsLokal && this.mapBildLayoutsLokal[layoutKey]) {
          return;
        }
        const ortNode = this.findeNode(layoutKey);
        if (!ortNode || !ortNode.position) {
          return;
        }
        const width = 320;
        const height = 220;
        const nodeX = Number(ortNode.position.x) || 0;
        const nodeY = Number(ortNode.position.y) || 0;
        const x = Math.round(nodeX + (this.nodeBreite(ortNode) - width) / 2);
        const y = Math.round(nodeY + this.nodeHoehe(ortNode) + 16);
        this.schreibeOrtBildLayout(layoutKey, { x, y, width, height });
        this.persistiereLokaleOrtBildLayouts();
      },
      initialisiereFehlendeOrtBildLayoutsAusGraph() {
        const orte = Array.isArray(this.zustand && this.zustand.orte) ? this.zustand.orte : [];
        let geaendert = false;
        orte.forEach((ort) => {
          const ortId = String((ort && ort.id) || '').trim();
          if (!ortId || this.ortHatBildLayout(ortId)) {
            return;
          }
          const dataUrl = this.entitaetBildDataUrl(ort);
          if (!dataUrl) {
            return;
          }
          this.ortBildLayoutBeimNodeInitialisieren(ortId);
          geaendert = true;
        });
        return geaendert;
      },
      async setzeBearbeitungPrimaryMedium(mediumId) {
        if (!this.anlage.zeile || !Array.isArray(this.anlage.zeile.medien)) {
          return;
        }
        const id = typeof mediumId === 'string' ? mediumId.trim() : '';
        if (!id) {
          return;
        }
        const medium = this.anlage.zeile.medien.find((m) => m && m.id === id);
        if (!this.mediumIstBild(medium)) {
          return;
        }
        const bisherigePrimaryId = String(this.anlage.zeile.primaryMediumId || '').trim();
        if (this.anlage.typ === 'ort' && bisherigePrimaryId && bisherigePrimaryId !== id) {
          const bisherigesMedium = this.anlage.zeile.medien.find((m) => m && m.id === bisherigePrimaryId);
          if (this.mediumIstBild(bisherigesMedium)) {
            const bestaetigt = await window.HTBAH.ui.confirm({
              titel: 'Titelbild ersetzen?',
              beschreibung:
                'Dieser Ort hat in der Interaktiven Welt bereits ein Bild. Soll das bestehende Bild durch das neue Titelbild ersetzt werden?',
              bestaetigenText: 'Ersetzen',
              bestaetigenButtonClass: 'btn-warning',
              warnhinweisAnzeigen: false,
            });
            if (!bestaetigt) {
              return;
            }
          }
        }
        this.anlage.zeile.primaryMediumId = id;
        this.anlageBearbeitungBeiBlurSpeichern();
        if (this.anlage.typ === 'ort') {
          this.ortBildLayoutBeimNodeInitialisieren(this.anlage.zeile.id);
        }
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
        const entfernt = this.anlage.zeile.medien[index];
        this.anlage.zeile.medien.splice(index, 1);
        const primaryId = String(this.anlage.zeile.primaryMediumId || '').trim();
        if (primaryId && entfernt && primaryId === entfernt.id) {
          const fallback = (this.anlage.zeile.medien || []).find((m) => this.mediumIstBild(m));
          this.anlage.zeile.primaryMediumId = fallback && fallback.id ? fallback.id : '';
        }
        this.anlageBearbeitungBeiBlurSpeichern();
      },
      schliesseAnlageModal() {
        if (this.zeileMentionController && typeof this.zeileMentionController.destroy === 'function') {
          this.zeileMentionController.destroy();
        }
        this.zeileMentionController = null;
        this.zeileQuillInstanz = null;
        this.zeileQuillHostElement = null;
        this.medienUploadLaeuft = false;
        this.medienImportWarteschlange = [];
        this.speicherStatusHinweis = '';
        this.anlage.offen = false;
        this.anlage.typ = '';
        this.anlage.zeile = null;
        this.anlage.index = -1;
      },
      schliesseAnlageOverlayModal() {
        this.withAnlageKontext('overlay', () => this.schliesseAnlageModal());
        this.anlageOverlay.offen = false;
        this.anlageOverlay.typ = '';
        this.anlageOverlay.zeile = null;
        this.anlageOverlay.index = -1;
        this.overlayZeileQuillInstanz = null;
        this.overlayZeileMentionController = null;
        this.overlayZeileQuillHostElement = null;
      },
      speichereAnlageOverlay() {
        this.withAnlageKontext('overlay', () => this.speichereAnlageIntern({ schliessenNachSpeichern: true }));
        this.schliesseAnlageOverlayModal();
      },
      anlageOverlayBeiBlurSpeichern() {
        this.withAnlageKontext('overlay', () => this.anlageBearbeitungBeiBlurSpeichern());
      },
      zufallsvorschlagOverlayUebernehmen() {
        this.withAnlageKontext('overlay', () => this.zufallsvorschlagUebernehmen());
      },
      onBearbeitungsMedienDateienOverlayGewaehlt(ev) {
        this.withAnlageKontext('overlay', () => this.onBearbeitungsMedienDateienGewaehlt(ev));
      },
      mediumAusOverlayBearbeitungEntfernen(index) {
        this.withAnlageKontext('overlay', () => this.mediumAusBearbeitungEntfernen(index));
      },
      setzeOverlayPrimaryMedium(mediumId) {
        this.withAnlageKontext('overlay', () => this.setzeBearbeitungPrimaryMedium(mediumId));
      },
      mediumOverlayHerunterladen(medium) {
        this.withAnlageKontext('overlay', () => this.mediumHerunterladen(medium));
      },
      loescheOverlayAnlageMitBestaetigung() {
        this.withAnlageKontext('overlay', () => this.loescheAnlageMitBestaetigung());
      },
      dupliziereAnlageAusOverlayModal() {
        this.withAnlageKontext('overlay', () => this.dupliziereAnlageAusModal());
      },
      speichereAnlage() {
        this.speichereAnlageIntern({ schliessenNachSpeichern: true });
      },
      notizEditorRef(elementId, el) {
        if (!elementId) {
          return;
        }
        if (!el) {
          const eintrag = this.notizQuillInstanzen[elementId];
          if (eintrag && eintrag.quill) {
            eintrag.quill.off('text-change', eintrag.textChangeHandler);
          }
          delete this.notizQuillInstanzen[elementId];
          delete this.notizQuillEditorRefs[elementId];
          return;
        }
        this.notizQuillEditorRefs[elementId] = el;
        this.$nextTick(() => this.richteNotizEditorEin(elementId));
      },
      richteNotizEditorEin(elementId, retry) {
        const r = typeof retry === 'number' ? retry : 0;
        const host = this.notizQuillEditorRefs[elementId];
        const bild = (this.ortBildElemente || []).find((eintrag) => eintrag && eintrag.bildId === elementId);
        if (!host || !bild || bild.ankerTyp !== 'notiz') {
          return;
        }
        if (!window.Quill) {
          if (r < 40) {
            window.setTimeout(() => this.richteNotizEditorEin(elementId, r + 1), 25);
          }
          return;
        }
        if (!window.__HTBAH_QUILL_SIZE_STYLE_REGISTRIERT__) {
          try {
            const SizeStyle = window.Quill.import('attributors/style/size');
            if (SizeStyle) {
              SizeStyle.whitelist = null;
            }
            window.Quill.register(SizeStyle, true);
            window.__HTBAH_QUILL_SIZE_STYLE_REGISTRIERT__ = true;
          } catch {
            // Fallback: Standard-Quill-Format ohne freie px-Groesse.
          }
        }
        const istReadOnly = this.istElementGesperrt(elementId);
        const vorhanden = this.notizQuillInstanzen[elementId];
        if (
          vorhanden &&
          vorhanden.quill &&
          vorhanden.host === host &&
          host.contains(vorhanden.quill.root) &&
          !!vorhanden.istReadOnly === istReadOnly
        ) {
          const html = typeof bild.notizHtml === 'string' ? bild.notizHtml : '';
          if (vorhanden.lastHtml !== html) {
            vorhanden.quill.root.innerHTML = html;
            vorhanden.lastHtml = html;
          }
          return;
        }
        if (vorhanden && vorhanden.quill) {
          vorhanden.quill.off('text-change', vorhanden.textChangeHandler);
          if (Array.isArray(vorhanden.cleanupFns)) {
            vorhanden.cleanupFns.forEach((fn) => {
              if (typeof fn === 'function') {
                fn();
              }
            });
          }
        }
        host.innerHTML = '';
        const quill = new window.Quill(host, {
          theme: 'snow',
          placeholder: 'Notiz…',
          modules: {
            toolbar: istReadOnly
              ? false
              : [
                  ['bold', 'italic', 'underline'],
                  [{ color: [] }, { background: [] }],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean'],
                ],
          },
          readOnly: istReadOnly,
        });
        const cleanupFns = [];
        if (!istReadOnly) {
          const parent = host.parentElement;
          const toolbarEl =
            (parent && parent.querySelector && parent.querySelector('.ql-toolbar.ql-snow')) ||
            (host.previousElementSibling &&
            host.previousElementSibling.classList &&
            host.previousElementSibling.classList.contains('ql-toolbar')
              ? host.previousElementSibling
              : null);
          if (toolbarEl) {
            const bereitsVorhanden = toolbarEl.querySelector('.htbah-quill-size-wrap');
            if (bereitsVorhanden && bereitsVorhanden.parentNode) {
              bereitsVorhanden.parentNode.removeChild(bereitsVorhanden);
            }
            const groesseWrap = document.createElement('span');
            groesseWrap.className = 'ql-formats htbah-quill-size-wrap';
            const groesseInput = document.createElement('input');
            groesseInput.type = 'number';
            groesseInput.min = '1';
            groesseInput.step = '1';
            groesseInput.placeholder = 'px';
            groesseInput.className = 'htbah-quill-size-input';
            groesseInput.title = 'Schriftgröße in px';
            const groesseLabel = document.createElement('span');
            groesseLabel.className = 'htbah-quill-size-label';
            groesseLabel.textContent = 'px';
            const stopEvent = (ev) => {
              if (ev && typeof ev.stopPropagation === 'function') {
                ev.stopPropagation();
              }
            };
            groesseInput.addEventListener('pointerdown', stopEvent);
            groesseInput.addEventListener('click', stopEvent);
            const anwendenGroesse = () => {
              const px = Math.max(1, Math.round(Number(groesseInput.value) || 0));
              if (!Number.isFinite(px) || px <= 0) {
                return;
              }
              quill.format('size', `${px}px`);
            };
            groesseInput.addEventListener('change', anwendenGroesse);
            groesseInput.addEventListener('blur', anwendenGroesse);
            const leseGroesseAusFormat = (format) => {
              const raw = String((format && format.size) || '').trim();
              const parsed = Number.parseFloat(raw.replace('px', ''));
              if (Number.isFinite(parsed) && parsed > 0) {
                groesseInput.value = String(Math.round(parsed));
                return true;
              }
              return false;
            };
            const syncGroesse = () => {
              const range = quill.getSelection();
              if (range) {
                const format = quill.getFormat(range);
                if (leseGroesseAusFormat(format)) {
                  return;
                }
              }
              const formatStart = quill.getFormat(0, 1);
              if (leseGroesseAusFormat(formatStart)) {
                return;
              }
              try {
                const computed = window.getComputedStyle(quill.root);
                const fallback = Number.parseFloat(String((computed && computed.fontSize) || '').replace('px', ''));
                if (Number.isFinite(fallback) && fallback > 0) {
                  groesseInput.value = String(Math.round(fallback));
                  return;
                }
              } catch {
                // ignore
              }
              groesseInput.value = '14';
            };
            quill.on('selection-change', syncGroesse);
            groesseWrap.appendChild(groesseInput);
            groesseWrap.appendChild(groesseLabel);
            toolbarEl.prepend(groesseWrap);
            syncGroesse();
            cleanupFns.push(() => {
              quill.off('selection-change', syncGroesse);
              groesseInput.removeEventListener('pointerdown', stopEvent);
              groesseInput.removeEventListener('click', stopEvent);
              groesseInput.removeEventListener('change', anwendenGroesse);
              groesseInput.removeEventListener('blur', anwendenGroesse);
            });
          }
        }
        const textChangeHandler = () => {
          const html = quill.root.innerHTML;
          this.speichereNotizHtml(elementId, html);
          const ref = this.notizQuillInstanzen[elementId];
          if (ref) {
            ref.lastHtml = html;
          }
        };
        quill.on('text-change', textChangeHandler);
        const html = typeof bild.notizHtml === 'string' ? bild.notizHtml : '';
        quill.root.innerHTML = html;
        quill.enable(!istReadOnly);
        this.notizQuillInstanzen[elementId] = {
          quill,
          host,
          textChangeHandler,
          cleanupFns,
          lastHtml: html,
          istReadOnly,
        };
      },
      aktualisiereNotizEditorModi() {
        this.$nextTick(() => {
          (this.ortBildElemente || []).forEach((bild) => {
            if (bild && bild.ankerTyp === 'notiz' && bild.bildId) {
              this.richteNotizEditorEin(bild.bildId);
            }
          });
        });
      },
      speichereNotizHtml(notizId, html) {
        if (!notizId) {
          return;
        }
        const liste = this.ladeFreieNotizen();
        const index = liste.findIndex((eintrag) => eintrag && eintrag.notizId === notizId);
        if (index < 0) {
          return;
        }
        liste[index] = {
          ...liste[index],
          html: typeof html === 'string' ? html : '',
        };
        this.speichereFreieNotizen(liste);
        this.mapFreieElementeTick += 1;
      },
      beendeAlleNotizEditoren() {
        Object.keys(this.notizQuillInstanzen || {}).forEach((id) => {
          const eintrag = this.notizQuillInstanzen[id];
          if (eintrag && eintrag.quill) {
            eintrag.quill.off('text-change', eintrag.textChangeHandler);
            if (Array.isArray(eintrag.cleanupFns)) {
              eintrag.cleanupFns.forEach((fn) => {
                if (typeof fn === 'function') {
                  fn();
                }
              });
            }
          }
        });
        this.notizQuillInstanzen = {};
        this.notizQuillEditorRefs = {};
      },
      entferneFreiesElementLayoutUndLock(elementId) {
        if (!elementId) {
          return;
        }
        if (this.mapBildLayoutsLokal && this.mapBildLayoutsLokal[elementId]) {
          const nextLayouts = { ...(this.mapBildLayoutsLokal || {}) };
          delete nextLayouts[elementId];
          this.mapBildLayoutsLokal = nextLayouts;
          this.persistiereLokaleOrtBildLayouts();
        }
        if (this.elementLocks && this.elementLocks[elementId]) {
          const nextLocks = { ...(this.elementLocks || {}) };
          delete nextLocks[elementId];
          this.elementLocks = nextLocks;
          this.persistiereElementLocks();
        }
        if (this.ausgewaehlteElemente && this.ausgewaehlteElemente[elementId]) {
          const nextAuswahl = { ...(this.ausgewaehlteElemente || {}) };
          delete nextAuswahl[elementId];
          this.ausgewaehlteElemente = nextAuswahl;
        }
      },
      async loescheNotizElementMitBestaetigung(bild) {
        const notizId = String((bild && bild.bildId) || '').trim();
        if (!notizId || !notizId.startsWith('notiz:')) {
          return;
        }
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Notizzettel löschen?',
          beschreibung: 'Dieser Notizzettel wird dauerhaft entfernt.',
          bestaetigenText: 'Löschen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: true,
        });
        if (!bestaetigt) {
          return;
        }
        const liste = this.ladeFreieNotizen().filter((eintrag) => eintrag && eintrag.notizId !== notizId);
        this.speichereFreieNotizen(liste);
        this.entferneFreiesElementLayoutUndLock(notizId);
        this.mapFreieElementeTick += 1;
        this.$nextTick(() => this.refreshGraph());
      },
      loeschePfeilElementDirekt(bild) {
        const pfeilId = String((bild && bild.bildId) || '').trim();
        if (!pfeilId || !pfeilId.startsWith('pfeil:')) {
          return;
        }
        const liste = this.ladeFreiePfeile().filter((eintrag) => eintrag && eintrag.pfeilId !== pfeilId);
        this.speichereFreiePfeile(liste);
        this.entferneFreiesElementLayoutUndLock(pfeilId);
        this.mapFreieElementeTick += 1;
        this.$nextTick(() => this.refreshGraph());
      },
      setzePfeilFarbe(bild, farbe) {
        const pfeilId = String((bild && bild.bildId) || '').trim();
        const farbeHex = String(farbe || '').trim();
        if (!pfeilId || !pfeilId.startsWith('pfeil:') || !/^#[0-9a-fA-F]{6}$/.test(farbeHex)) {
          return;
        }
        const liste = this.ladeFreiePfeile().map((eintrag) =>
          eintrag && eintrag.pfeilId === pfeilId
            ? {
                ...eintrag,
                farbe: farbeHex,
              }
            : eintrag,
        );
        this.speichereFreiePfeile(liste);
        this.mapFreieElementeTick += 1;
      },
      setzeNotizHintergrundfarbe(bild, farbe) {
        const notizId = String((bild && bild.bildId) || '').trim();
        const farbeHex = String(farbe || '').trim();
        if (!notizId || !notizId.startsWith('notiz:') || !/^#[0-9a-fA-F]{6}$/.test(farbeHex)) {
          return;
        }
        const liste = this.ladeFreieNotizen().map((eintrag) =>
          eintrag && eintrag.notizId === notizId
            ? {
                ...eintrag,
                bgColor: farbeHex,
              }
            : eintrag,
        );
        this.speichereFreieNotizen(liste);
        this.mapFreieElementeTick += 1;
      },
      anlageBearbeitungBeiBlurSpeichern() {
        if (!this.anlage.offen || !this.anlage.zeile || !this.anlage.typ || this.anlage.index < 0) {
          return;
        }
        this.speichereAnlageIntern({ schliessenNachSpeichern: false });
      },
      speichereAnlageIntern({ schliessenNachSpeichern }) {
        if (!this.anlage.offen || !this.anlage.zeile || !this.anlage.typ) {
          return;
        }
        if (this.medienUploadLaeuft) {
          this.speicherStatusHinweis = 'Dateien werden noch verarbeitet. Speichern ist erst danach möglich.';
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
        try {
          this.speichereZustand();
        } catch (error) {
          const msg = error && error.name === 'QuotaExceededError'
            ? 'Speichern fehlgeschlagen: Browser-Speicher ist voll. Bitte Daten/Bilder reduzieren und erneut versuchen.'
            : 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
          this.speicherStatusHinweis = msg;
          window.HTBAH.ui.notify({ text: msg, typ: 'danger' });
          return;
        }
        if (index < 0) {
          this.speicherStatusHinweis = '';
        }
        if (schliessenNachSpeichern) {
          this.schliesseAnlageModal();
        }
        if (index < 0 && z && z.id) {
          const nodeIdPrefix =
            typ === 'ort'
              ? 'ort'
              : typ === 'npc'
                ? 'npc'
                : typ === 'fraktion'
                  ? 'fraktion'
                  : typ === 'bestie'
                    ? 'bestie'
                    : typ === 'raetsel'
                      ? 'raetsel'
                      : typ === 'gegenstand'
                        ? 'gegenstand'
                        : '';
          if (nodeIdPrefix) {
            const nodeId = `${nodeIdPrefix}:${z.id}`;
            const standardGroesse =
              typ === 'fraktion'
                ? { width: 210, height: 56 }
                : typ === 'ort'
                  ? { width: 220, height: 56 }
                  : { width: 200, height: 56 };
            this.setzeNodeStartPositionImViewportZentrum(nodeId, standardGroesse);
          }
        }
        if (typ === 'ort' && z && z.id) {
          const hatBild = !!this.entitaetBildDataUrl(z);
          if (hatBild) {
            this.ortBildLayoutBeimNodeInitialisieren(z.id);
          }
        }
        this.$nextTick(() => {
          this.refreshGraph();
          if (index < 0 && z && z.id) {
            this.$nextTick(() => this.fokussiereNeuGespeicherteEntitaet(typ, z.id));
          }
        });
      },
      onResize() {
        if (this.offen) {
          this.$nextTick(() => {
            this.stelleSichtbaresFensterSicher();
          });
        }
        if (this.charakterModal.offen) {
          this.$nextTick(() => this.stelleSichtbaresCharakterFensterSicher());
        }
      },
    },
    watch: {
      offen(neu) {
        if (neu) {
          this.mapHintergrundTick += 1;
          this.mapFreieElementeTick += 1;
          this.aktualisiereZustand();
          this.uebernehmeBildLayouts();
          this.$nextTick(() => {
            this.initialisierePosition();
            this.refreshGraph();
            if (this.initialisiereFehlendeOrtBildLayoutsAusGraph()) {
              this.refreshGraph();
            }
            this.uebernehmeMapEinstellungen();
            this.verlaufZuruecksetzen();
            this.$nextTick(() => this.verarbeiteMentionNavigationTarget());
          });
        } else {
          this.persistiereLokaleOrtBildLayouts();
          this.persistiereElementLocks();
          this.beendeAlleNotizEditoren();
          if (this.anlageOverlay.offen) {
            this.schliesseAnlageOverlayModal();
          }
          if (this.charakterModal.offen) {
            this.schliesseCharakterModal();
          }
          this.nodeDrag.aktiv = false;
          this.map.panning = false;
          this.map.pinchAktiv = false;
          this.map.touchPointer = {};
          this.auswahlRahmen.aktiv = false;
          this.gruppenDrag.aktiv = false;
          this.gruppenDrag.nodeStartPositionen = {};
          this.gruppenDrag.bildStartLayouts = {};
          this.ausgewaehlteElemente = {};
          this.setzeDragHoverZiel('');
          this.verlaufZuruecksetzen();
        }
      },
      gruppeId() {
        this.mapHintergrundTick += 1;
        this.mapFreieElementeTick += 1;
        if (this.offen) {
          this.uebernehmeBildLayouts();
          this.$nextTick(() => {
            this.refreshGraph();
            this.uebernehmeMapEinstellungen();
            this.verlaufZuruecksetzen();
          });
        }
      },
      'map.edgeColor'(neu) {
        if (typeof neu === 'string' && /^#[0-9a-fA-F]{6}$/.test(neu)) {
          this.speichereMapEinstellung('edgeColor', neu);
        }
      },
      'map.scale'(neu) {
        if (this.mapViewportPersistPause) {
          return;
        }
        if (!Number.isFinite(Number(neu))) {
          return;
        }
        const normalisiert = this.begrenzeMapScale(neu);
        if (normalisiert !== neu) {
          this.map.scale = normalisiert;
          return;
        }
        this.planeMapViewportEinstellungenSpeichern();
      },
      'map.offsetX'() {
        if (this.mapViewportPersistPause) {
          return;
        }
        this.planeMapViewportEinstellungenSpeichern();
      },
      'map.offsetY'() {
        if (this.mapViewportPersistPause) {
          return;
        }
        this.planeMapViewportEinstellungenSpeichern();
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
      window.addEventListener('htbah:mention-nav-target-updated', this.verarbeiteMentionNavigationTarget);
      window.addEventListener('htbah:open-entity-request', this.onGlobalOpenEntityRequest);
    },
    beforeUnmount() {
      if (this.zeileMentionController && typeof this.zeileMentionController.destroy === 'function') {
        this.zeileMentionController.destroy();
      }
      if (this.charakterMentionController && typeof this.charakterMentionController.destroy === 'function') {
        this.charakterMentionController.destroy();
      }
      this.zeileMentionController = null;
      this.charakterMentionController = null;
      if (this.sucheBlurTimer) {
        globalThis.clearTimeout(this.sucheBlurTimer);
        this.sucheBlurTimer = 0;
      }
      this.persistiereLokaleOrtBildLayouts();
      this.persistiereElementLocks();
      this.beendeAlleNotizEditoren();
      this.verlaufZuruecksetzen();
      this.beendeCharakterZiehen();
      this.beendeCharakterResize();
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('pointermove', this.onMapPointerMove);
      window.removeEventListener('pointerup', this.onMapPointerUp);
      window.removeEventListener('pointercancel', this.onMapPointerUp);
      window.removeEventListener('keydown', this.onGlobalKeydown);
      window.removeEventListener('htbah:mention-nav-target-updated', this.verarbeiteMentionNavigationTarget);
      window.removeEventListener('htbah:open-entity-request', this.onGlobalOpenEntityRequest);
      if (this.anlageOverlay.offen) {
        this.schliesseAnlageOverlayModal();
      }
    },
    template: `
      <div v-if="offen" class="regelwerk-modal-layer htbah-weltenbau-map-layer">
        <div
          ref="fensterElement"
          class="regelwerk-modal-window card shadow htbah-weltenbau-map-window"
          :class="{ 'regelwerk-modal-window-fullscreen': modal.istVollbild }"
          :style="fensterStil">
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2 htbah-weltenbau-map-header" @pointerdown="starteZiehen($event)">
            <div class="d-flex align-items-start gap-1 htbah-weltenbau-map-header-top">
              <h6 class="mb-0 htbah-weltenbau-map-title">Interaktive Welt</h6>
              <div class="d-flex align-items-center gap-1 flex-shrink-0 htbah-weltenbau-map-actions-corner">
              <button
                type="button"
                class="regelwerk-icon-button"
                :aria-label="modal.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
                :title="modal.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
                @click="vollbildUmschalten">
                <span class="material-symbols-outlined">{{ modal.istVollbild ? 'close_fullscreen' : 'open_in_full' }}</span>
              </button>
              <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1 htbah-weltenbau-map-actions htbah-weltenbau-map-actions-main">
              <span
                v-if="ausgewaehlteElementeAnzahl > 0"
                class="badge text-bg-success"
                :title="ausgewaehlteElementeAnzahl + ' Elemente ausgewählt'">
                {{ ausgewaehlteElementeAnzahl }} ausgewählt
              </span>
              <button
                v-if="ausgewaehlteElementeAnzahl > 0"
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="auswahlAufheben">
                Auswahl aufheben
              </button>
              <div class="htbah-map-suche-wrap">
                <input
                  type="search"
                  class="form-control form-control-sm htbah-map-suche-input"
                  v-model.trim="suchText"
                  placeholder="🔎 Suchen…"
                  @focus="sucheFokusAktiv = true"
                  @blur="onSucheBlur"
                  @keydown.esc.stop.prevent="sucheFokusAktiv = false" />
                <div v-if="suchtrefferAnzeigen" class="htbah-map-suche-treffer card shadow-sm">
                  <button
                    v-for="treffer in suchtrefferListe"
                    :key="treffer.id"
                    type="button"
                    class="htbah-map-suche-treffer-item"
                    @mousedown.prevent
                    @click.stop="springeZuSuchtreffer(treffer)">
                    <span class="fw-semibold">{{ treffer.titel }}</span>
                    <small class="text-body-secondary">{{ treffer.untertitel }}</small>
                  </button>
                </div>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="Typ zum Hinzufügen wählen">
                  Hinzufügen
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('ort')">Ort</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('npc')">NPC</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('fraktion')">Fraktion</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('bestie')">Bestie</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('raetsel')">Rätsel</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('gegenstand')">Gegenstand</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('bild')">Bild</button></li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><h6 class="dropdown-header">Sonstiges</h6></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('notizzettel')">Notiz</button></li>
                  <li><button class="dropdown-item" type="button" @click="starteAnlageFlow('pfeil')">Pfeil</button></li>
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
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="small text-secondary">Canvas-Einstellungen</span>
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-secondary p-0 text-decoration-none"
                      @click.stop="mapEinstellungenZuruecksetzen">
                      Zurücksetzen
                    </button>
                  </div>
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
                  <div class="card border-0 bg-body-secondary-subtle p-2 mb-2">
                    <div class="small text-secondary fw-semibold mb-2">Alle Elemente/Bilder</div>
                    <div class="btn-group btn-group-sm w-100" role="group" aria-label="Alle Elemente/Bilder sperren oder entsperren">
                      <button type="button" class="btn btn-outline-secondary" @click.stop="alleElementeSperren">
                        🔒 verankern
                      </button>
                      <button type="button" class="btn btn-outline-secondary" @click.stop="alleElementeEntsperren">
                        🔓 lösen
                      </button>
                    </div>
                  </div>
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
              <div
                v-if="auswahlRahmen.aktiv"
                class="htbah-map-auswahl-rahmen"
                :style="auswahlRahmenStil"
                aria-hidden="true"></div>
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
                <div
                  v-for="bild in ortBildElemente"
                  :key="'ort-bild-map-' + bild.bildId"
                  :data-ort-image-id="bild.bildId"
                  :data-ort-node-id="bild.ortNodeId || null"
                  class="htbah-map-ort-bild"
                  :data-map-element-type="bild.ankerTyp || 'bild'"
                  :class="ortBildKlassen(bild)"
                  :style="ortBildStil(bild)"
                  @pointerdown.stop="starteOrtBildDrag($event, bild, 'move')">
                  <template v-if="bild.ankerTyp === 'notiz'">
                    <div
                      class="htbah-map-notiz-drag-handle"
                      title="Notizzettel verschieben"
                      @pointerdown.stop.prevent="starteOrtBildDrag($event, bild, 'move')"></div>
                    <label
                      v-if="!istElementGesperrt(bild.bildId)"
                      class="htbah-map-element-color-picker"
                      title="Notiz-Hintergrundfarbe">
                      <span class="visually-hidden">Notiz-Hintergrundfarbe</span>
                      <input
                        type="color"
                        :value="bild.notizBgColor || '#fff8bf'"
                        @pointerdown.stop
                        @click.stop
                        @input.stop="setzeNotizHintergrundfarbe(bild, $event.target.value)"
                        @change.stop="setzeNotizHintergrundfarbe(bild, $event.target.value)" />
                    </label>
                    <div
                      class="htbah-map-notiz-editor-host"
                      @pointerdown.stop
                      @click.stop
                      :ref="(el) => notizEditorRef(bild.bildId, el)"></div>
                  </template>
                  <template v-else-if="bild.ankerTyp === 'pfeil'">
                    <button
                      v-if="!istElementGesperrt(bild.bildId)"
                      type="button"
                      class="htbah-map-pfeil-resize-handle htbah-map-pfeil-resize-left"
                      aria-label="Pfeil links skalieren"
                      @pointerdown.stop.prevent="starteOrtBildDrag($event, bild, 'resize-left')"></button>
                    <div class="htbah-map-pfeil-wrap" aria-hidden="true">
                      <div class="htbah-map-pfeil-schaft"></div>
                      <div class="htbah-map-pfeil-spitze"></div>
                    </div>
                    <button
                      v-if="!istElementGesperrt(bild.bildId)"
                      type="button"
                      class="htbah-map-pfeil-resize-handle htbah-map-pfeil-resize-right"
                      aria-label="Pfeil rechts skalieren"
                      @pointerdown.stop.prevent="starteOrtBildDrag($event, bild, 'resize')"></button>
                    <button
                      v-if="!istElementGesperrt(bild.bildId)"
                      type="button"
                      class="htbah-map-pfeil-rotate-handle"
                      aria-label="Pfeil drehen"
                      @pointerdown.stop.prevent="starteOrtBildDrag($event, bild, 'rotate')"></button>
                    <div
                      v-if="ortBildDrag.aktiv && ortBildDrag.modus === 'rotate' && ortBildDrag.ortId === bild.bildId"
                      class="htbah-map-pfeil-angle-badge">
                      {{ pfeilWinkelBadgeText(bild) }}
                    </div>
                    <label
                      v-if="!istElementGesperrt(bild.bildId)"
                      class="htbah-map-element-color-picker"
                      title="Pfeilfarbe">
                      <span class="visually-hidden">Pfeilfarbe</span>
                      <input
                        type="color"
                        :value="bild.pfeilFarbe || '#509b4a'"
                        @pointerdown.stop
                        @click.stop
                        @input.stop="setzePfeilFarbe(bild, $event.target.value)"
                        @change.stop="setzePfeilFarbe(bild, $event.target.value)" />
                    </label>
                  </template>
                  <img v-else :src="bild.dataUrl" :alt="'Bild: ' + bild.anzeigename" draggable="false" />
                  <button
                    v-if="bild.ankerTyp !== 'notiz' && bild.ankerTyp !== 'pfeil' && !istElementGesperrt(bild.bildId)"
                    type="button"
                    class="htbah-map-ort-bild-rotate-handle"
                    aria-label="Bild drehen"
                    @pointerdown.stop.prevent="starteOrtBildDrag($event, bild, 'rotate')"></button>
                  <div
                    v-if="ortBildDrag.aktiv && ortBildDrag.modus === 'rotate' && ortBildDrag.ortId === bild.bildId"
                    class="htbah-map-pfeil-angle-badge">
                    {{ pfeilWinkelBadgeText(bild) }}
                  </div>
                  <button
                    type="button"
                    :class="elementLockButtonKlassen(bild.bildId)"
                    :aria-label="elementLockButtonTitle(bild.bildId)"
                    :title="elementLockButtonTitle(bild.bildId)"
                    @pointerdown.stop.prevent
                    @click.stop.prevent="toggleElementLock(bild.bildId)">
                    <span aria-hidden="true">{{ elementLockButtonIcon(bild.bildId) }}</span>
                  </button>
                  <button
                    v-if="(bild.ankerTyp === 'notiz' || bild.ankerTyp === 'pfeil') && !istElementGesperrt(bild.bildId)"
                    type="button"
                    class="htbah-map-element-delete-button"
                    aria-label="Element löschen"
                    title="Element löschen"
                    @pointerdown.stop.prevent
                    @click.stop.prevent="
                      bild.ankerTyp === 'notiz'
                        ? loescheNotizElementMitBestaetigung(bild)
                        : loeschePfeilElementDirekt(bild)
                    ">
                    <span aria-hidden="true">🗑️</span>
                  </button>
                  <button
                    type="button"
                    class="htbah-map-ort-bild-resize"
                    v-if="bild.ankerTyp !== 'pfeil' && !istElementGesperrt(bild.bildId)"
                    aria-label="Ortsbild skalieren"
                    @pointerdown.stop.prevent="starteOrtBildDrag($event, bild, 'resize')"></button>
                </div>
                <div
                  v-for="node in graph.nodes"
                  :key="node.id"
                  role="button"
                  tabindex="0"
                  :data-node-id="node.id"
                  :class="nodeKlassen(node)"
                  :style="nodeStil(node)"
                  @pointerdown.stop="starteNodeDrag($event, node)"
                  @keydown.enter.prevent.stop="onNodeClick(node)"
                  @keydown.space.prevent.stop="onNodeClick(node)"
                  @click.stop="onNodeClick(node)">
                  <button
                    type="button"
                    :class="elementLockButtonKlassen(node.id)"
                    :aria-label="elementLockButtonTitle(node.id)"
                    :title="elementLockButtonTitle(node.id)"
                    @pointerdown.stop.prevent
                    @click.stop.prevent="toggleElementLock(node.id)">
                    <span aria-hidden="true">{{ elementLockButtonIcon(node.id) }}</span>
                  </button>
                  <template v-if="node.data && node.data.entityType === 'charakter'">
                    <div class="d-flex align-items-center gap-2">
                      <div class="htbah-map-charakter-avatar-wrap">
                        <img
                          v-if="node.data.charakterBild"
                          :src="node.data.charakterBild"
                          alt="Charakterbild"
                          class="htbah-map-charakterbild"
                          draggable="false" />
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
                    <div class="d-flex align-items-center gap-2">
                      <div
                        v-if="node.data && node.data.avatarDataUrl"
                        class="htbah-map-charakter-avatar-wrap">
                        <img
                          :src="node.data.avatarDataUrl"
                          alt="Avatar"
                          class="htbah-map-charakterbild"
                          draggable="false" />
                        <div v-if="node.data && node.data.statusEmoji" class="htbah-map-charakter-status">{{ node.data.statusEmoji }}</div>
                      </div>
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
                        <div
                          v-if="node.data && node.data.statusEmoji && !node.data.avatarDataUrl"
                          class="htbah-map-charakter-status">
                          {{ node.data.statusEmoji }}
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!modal.istVollbild" class="regelwerk-modal-resize-handle" @pointerdown="starteResize($event)"></div>
        </div>
        <div v-if="modal.detailsOffen && detail" class="htbah-weltenbau-map-detail card shadow">
          <div class="card-header d-flex justify-content-between align-items-center py-2">
            <strong>{{ detail.label }}</strong>
            <button type="button" class="btn-close" aria-label="Details schließen" @click="modal.detailsOffen = false"></button>
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
          :speicher-deaktiviert="speicherAnlageDeaktiviert"
          :speicher-hinweis="speicherAnlageHinweis"
          :zeile-quill-session="zeileQuillSession"
          :zeile-quill-host-ref-fn="zeileQuillHostRefFn"
          @close="schliesseAnlageModal"
          @save="speichereAnlage"
          @edit-blur="anlageBearbeitungBeiBlurSpeichern"
          @random="zufallsvorschlagUebernehmen"
          @media-upload="onBearbeitungsMedienDateienGewaehlt"
          @media-remove="mediumAusBearbeitungEntfernen"
          @media-set-primary="setzeBearbeitungPrimaryMedium"
          @media-open="mediumImBildbetrachterOeffnen"
          @media-download="mediumHerunterladen"
          @delete="loescheOverlayAnlageMitBestaetigung"
          @duplicate="dupliziereAnlageAusOverlayModal"
          @update:zufallNpcEpoche="zufallNpcEpoche = $event"
          @update:zufallGegenstandEpoche="zufallGegenstandEpoche = $event"
          @update:zufallGegenstandKleidung="zufallGegenstandKleidung = $event"
          @update:zufallFraktionEpoche="zufallFraktionEpoche = $event"
          @update:zufallRaetselEpoche="zufallRaetselEpoche = $event" />
        <zufallstabellen-zeile-modal
          :anlage="anlageOverlay"
          :zeile-modal-titel="zeileModalTitelOverlay"
          :zufallsgenerator-bereit="zufallsgeneratorBereit"
          :zufall-npc-epoche="zufallNpcEpoche"
          :zufall-gegenstand-epoche="zufallGegenstandEpoche"
          :zufall-gegenstand-kleidung="zufallGegenstandKleidung"
          :zufall-fraktion-epoche="zufallFraktionEpoche"
          :zufall-raetsel-epoche="zufallRaetselEpoche"
          :pantheon-namen-liste="pantheonNamenListe"
          :fraktionen-mit-namen="fraktionenMitNamen"
          :orte-namen-liste="orteNamenListe"
          :speicher-deaktiviert="speicherAnlageDeaktiviert"
          :speicher-hinweis="speicherAnlageHinweis"
          :zeile-quill-session="overlayZeileQuillSession"
          :zeile-quill-host-ref-fn="overlayZeileQuillHostRefFn"
          @close="schliesseAnlageOverlayModal"
          @save="speichereAnlageOverlay"
          @edit-blur="anlageOverlayBeiBlurSpeichern"
          @random="zufallsvorschlagOverlayUebernehmen"
          @media-upload="onBearbeitungsMedienDateienOverlayGewaehlt"
          @media-remove="mediumAusOverlayBearbeitungEntfernen"
          @media-set-primary="setzeOverlayPrimaryMedium"
          @media-open="mediumImBildbetrachterOeffnen"
          @media-download="mediumOverlayHerunterladen"
          @delete="loescheAnlageMitBestaetigung"
          @duplicate="dupliziereAnlageAusModal"
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
        <div
          v-if="medienGalerieModalOffen"
          class="regelwerk-modal-layer"
          @click.self="schliesseMedienGalerieModal">
          <div class="regelwerk-modal-window card shadow" style="width:min(960px,92vw);max-height:86vh;">
            <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2">
              <strong>Bild aus Galerie wählen</strong>
              <button type="button" class="btn-close" aria-label="Schließen" @click="schliesseMedienGalerieModal"></button>
            </div>
            <div class="card-body">
              <p class="small text-body-secondary mb-2">
                Wähle ein importiertes Bild. Nach dem Klick wird es direkt auf der Karte platziert.
              </p>
              <div v-if="!verfuegbareWeltenbauBilder().length" class="small text-body-secondary">
                Keine importierten Bilder gefunden.
              </div>
              <div v-else class="row g-2" style="max-height:60vh;overflow:auto;">
                <div
                  v-for="eintrag in verfuegbareWeltenbauBilder()"
                  :key="'wb-bild-auswahl-' + eintrag.id"
                  class="col-6 col-md-4 col-lg-3">
                  <button
                    type="button"
                    class="btn btn-light border w-100 text-start p-2 h-100"
                    @click="fuegeFreiesBildZurKarteHinzu(eintrag)">
                    <img
                      :src="eintrag.dataUrl"
                      :alt="eintrag.name || 'Bild'"
                      style="width:100%;height:120px;object-fit:cover;border-radius:6px;" />
                    <div class="small text-truncate mt-2">{{ eintrag.name || 'Bild' }}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="charakterModal.offen && charakterModal.charakter"
          ref="charakterFensterElement"
          class="regelwerk-modal-window card shadow htbah-weltenbau-charakter-modal-window"
          :class="{ 'regelwerk-modal-window-fullscreen': charakterModal.fenster.istVollbild }"
          :style="charakterFensterStil">
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2" @pointerdown="starteCharakterZiehen($event)">
            <strong>🧙 Charakter bearbeiten</strong>
            <div class="d-flex align-items-center gap-2">
              <button
                type="button"
                class="regelwerk-icon-button"
                :aria-label="charakterModal.fenster.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
                :title="charakterModal.fenster.istVollbild ? 'Vollbild beenden' : 'Vollbild'"
                @click="charakterVollbildUmschalten">
                <span class="material-symbols-outlined">{{ charakterVollbildIcon }}</span>
              </button>
              <button type="button" class="btn-close" aria-label="Charakterfenster schließen" @click="schliesseCharakterModal"></button>
            </div>
          </div>
          <div class="card-body py-2 small htbah-weltenbau-charakter-modal-body">
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
                    class="form-control"
                    type="number"
                    min="1"
                    :max="10 + Math.max(0, Math.round(((charakterModal.charakter.handeln || []).reduce((sum, eintrag) => sum + (Number(eintrag && eintrag.value) || 0), 0)) / 10))"
                    v-model="charakterModal.charakter.initiative"
                    placeholder="z. B. 12"
                    inputmode="numeric"
                    autocomplete="off" />
                  <button
                    type="button"
                    class="btn btn-outline-primary"
                    @click="charakterInitiativeWuerfeln">
                    🎲
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :disabled="!String(charakterModal.charakter.initiative || '').trim()"
                    @click="charakterInitiativeZuruecksetzen">
                    Reset
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small text-secondary mb-1" for="wb-char-ort">Aufenthaltsort</label>
                <input
                  id="wb-char-ort"
                  class="form-control"
                  v-model="charakterModal.charakter.aufenthaltsort"
                  :list="orteNamenListe.length ? 'wb-char-ort-datalist' : undefined"
                  placeholder="Ort wählen oder Freitext"
                  autocomplete="off" />
                <datalist v-if="orteNamenListe.length" id="wb-char-ort-datalist">
                  <option v-for="ort in orteNamenListe" :key="'wb-char-ort-' + ort" :value="ort"></option>
                </datalist>
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
                  <div class="col-md-6" v-if="item.typ === 'waffe'"><input class="form-control form-control-sm" v-model="item.schadenswertNahkampf" placeholder="Schadenswert Nahkampf" /></div>
                  <div class="col-md-6" v-if="item.typ === 'waffe'"><input class="form-control form-control-sm" v-model="item.schadenswertFernkampf" placeholder="Schadenswert Fernkampf" /></div>
                  <div class="col-md-6" v-if="item.typ === 'rustung'"><input class="form-control form-control-sm" v-model="item.rustwert" placeholder="Rüstwert" /></div>
                  <div class="col-12"><textarea class="form-control form-control-sm" rows="2" v-model="item.beschreibungHtml" placeholder="Beschreibung"></textarea></div>
                </div>
              </div>
            </div>
            <label class="form-label mt-2 mb-1">Notizen</label>
            <div class="zufallstabellen-quill-wrap" :key="'wb-char-q-' + charakterQuillSession">
              <div :ref="charakterQuillHostRefFn" class="quill-editor-host zufallstabellen-quill-host htbah-charakter-journal-host"></div>
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
          <div
            v-if="!charakterModal.fenster.istVollbild"
            class="regelwerk-modal-resize-handle"
            role="presentation"
            aria-hidden="true"
            @pointerdown="starteCharakterResize($event)"></div>
        </div>
        <div class="d-none" aria-hidden="true">
          <wuerfelbecher-wurf ref="charakterInitiativeWuerfelbecher" modus="w10" :auto-init="false" />
        </div>
      </div>
    `,
  };
})();
