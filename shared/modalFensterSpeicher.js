/**
 * Persistenz offener schwebender Modalfenster (nicht Export/Import).
 * @see shared/modalFenster.js
 */
(function () {
  const SPEICHER_KEY = 'htbah_offene_modals';
  const LEGACY_KEYS = Object.freeze({
    'wuerfel-beutel': 'htbah_wuerfel_beutel_fenster',
    konflikt: 'htbah_konflikt_fenster',
  });
  const DEBOUNCE_MS = 220;
  const _debounceTimer = Object.create(null);

  const MODAL_META = Object.freeze({
    regelwerk: { titel: 'Regelwerk', emoji: '📜' },
    abenteuerbuch: { titel: 'Abenteuerbuch', emoji: '📔' },
    zeichen: { titel: 'Zeichnen', emoji: '✏️' },
    konflikt: { titel: 'Konflikt', emoji: '⚔️' },
    inventar: { titel: 'Inventar', emoji: '🎒' },
    weltenbau: { titel: 'Interaktive Welt', emoji: '🗺️' },
    'wuerfel-beutel': { titel: 'Würfelbeutel', emoji: '🎲' },
    musikboard: { titel: 'Musik', emoji: '🎵' },
  });

  function speicherZugriff() {
    return window.HTBAH && window.HTBAH.speicher ? window.HTBAH.speicher : null;
  }

  function leseMap() {
    const s = speicherZugriff();
    if (!s) {
      return {};
    }
    try {
      const roh = s.leseJson(SPEICHER_KEY, null);
      return roh && typeof roh === 'object' && !Array.isArray(roh) ? roh : {};
    } catch {
      return {};
    }
  }

  function schreibeMap(map) {
    const s = speicherZugriff();
    if (!s) {
      return false;
    }
    try {
      if (!map || typeof map !== 'object' || !Object.keys(map).length) {
        s.loescheKey(SPEICHER_KEY);
        return true;
      }
      return !!s.schreibeJson(SPEICHER_KEY, map);
    } catch {
      return false;
    }
  }

  function normalisiereEintrag(roh) {
    if (!roh || typeof roh !== 'object') {
      return null;
    }
    const eintrag = {
      offen: !!roh.offen,
      istVollbild: !!roh.istVollbild,
      minimiert: !!roh.minimiert,
      positionX: null,
      positionY: null,
      breite: null,
      hoehe: null,
    };
    const px = Number(roh.positionX);
    const py = Number(roh.positionY);
    const br = Number(roh.breite);
    const ho = Number(roh.hoehe);
    if (Number.isFinite(px)) {
      eintrag.positionX = Math.round(px);
    }
    if (Number.isFinite(py)) {
      eintrag.positionY = Math.round(py);
    }
    if (Number.isFinite(br) && br > 0) {
      eintrag.breite = Math.round(br);
    }
    if (Number.isFinite(ho) && ho > 0) {
      eintrag.hoehe = Math.round(ho);
    }
    if (typeof roh.gruppeId === 'string' && roh.gruppeId.trim()) {
      eintrag.gruppeId = roh.gruppeId.trim();
    }
    if (typeof roh.kampagneId === 'string' && roh.kampagneId.trim()) {
      eintrag.kampagneId = roh.kampagneId.trim();
    }
    if (typeof roh.wuerfelModalTab === 'string' && roh.wuerfelModalTab.trim()) {
      eintrag.wuerfelModalTab = roh.wuerfelModalTab.trim();
    }
    if (typeof roh.dockTitel === 'string' && roh.dockTitel.trim()) {
      eintrag.dockTitel = roh.dockTitel.trim();
    }
    if (typeof roh.dockEmoji === 'string') {
      eintrag.dockEmoji = roh.dockEmoji;
    }
    return eintrag;
  }

  function serialisiere(fenster, extras, modalId) {
    if (!fenster || typeof fenster !== 'object') {
      return { offen: true, istVollbild: false, minimiert: false };
    }
    const id = modalId || fenster._htbahModalSpeicherId || '';
    const eintrag = {
      offen: true,
      istVollbild: !!fenster.istVollbild,
      minimiert: !!fenster.minimiert,
      positionX:
        fenster.positionX != null && Number.isFinite(Number(fenster.positionX))
          ? Math.round(Number(fenster.positionX))
          : null,
      positionY:
        fenster.positionY != null && Number.isFinite(Number(fenster.positionY))
          ? Math.round(Number(fenster.positionY))
          : null,
      breite:
        fenster.breite != null && Number.isFinite(Number(fenster.breite))
          ? Math.round(Number(fenster.breite))
          : null,
      hoehe:
        fenster.hoehe != null && Number.isFinite(Number(fenster.hoehe))
          ? Math.round(Number(fenster.hoehe))
          : null,
    };
    if (extras && typeof extras === 'object') {
      if (extras.gruppeId) {
        eintrag.gruppeId = String(extras.gruppeId).trim();
      }
      if (extras.kampagneId) {
        eintrag.kampagneId = String(extras.kampagneId).trim();
      }
      if (extras.wuerfelModalTab) {
        eintrag.wuerfelModalTab = String(extras.wuerfelModalTab).trim();
      }
      if (extras.dockTitel) {
        eintrag.dockTitel = String(extras.dockTitel).trim();
      }
      if (extras.dockEmoji != null) {
        eintrag.dockEmoji = String(extras.dockEmoji);
      }
    }
    const meta = MODAL_META[id];
    if (meta && !eintrag.dockTitel) {
      eintrag.dockTitel = meta.titel;
      eintrag.dockEmoji = meta.emoji;
    }
    return eintrag;
  }

  function wendeAufFenster(fenster, eintrag, opts) {
    const MF = window.HTBAH_MODAL_FENSTER;
    if (!fenster || !eintrag || !MF) {
      return;
    }
    const minBreite = (opts && opts.minBreite) || MF.minBreite;
    const minHoehe = (opts && opts.minHoehe) || MF.minHoehe;
    fenster.istVollbild = !!eintrag.istVollbild;
    fenster.minimiert = !!eintrag.minimiert;
    if (fenster.istVollbild) {
      return;
    }
    if (eintrag.breite != null && eintrag.hoehe != null) {
      const g = MF.utils.begrenzeGroesse(eintrag.breite, eintrag.hoehe, minBreite, minHoehe);
      fenster.breite = g.breite;
      fenster.hoehe = g.hoehe;
    }
    if (
      eintrag.positionX != null &&
      eintrag.positionY != null &&
      fenster.breite != null &&
      fenster.hoehe != null
    ) {
      const p = MF.utils.begrenzePosition(
        eintrag.positionX,
        eintrag.positionY,
        fenster.breite,
        fenster.hoehe,
      );
      fenster.positionX = p.x;
      fenster.positionY = p.y;
    } else if (eintrag.positionX != null && eintrag.positionY != null) {
      fenster.positionX = eintrag.positionX;
      fenster.positionY = eintrag.positionY;
    }
  }

  function loescheLegacyKey(modalId) {
    const legacy = LEGACY_KEYS[modalId];
    const s = speicherZugriff();
    if (legacy && s) {
      try {
        s.loescheKey(legacy);
      } catch {
        /* optional */
      }
    }
  }

  function persistiere(modalId, fenster, extras) {
    if (!modalId) {
      return;
    }
    const map = leseMap();
    map[modalId] = serialisiere(fenster, extras, modalId);
    schreibeMap(map);
    loescheLegacyKey(modalId);
  }

  function persistiereDebounced(modalId, fenster, extras) {
    if (!modalId) {
      return;
    }
    if (_debounceTimer[modalId]) {
      window.clearTimeout(_debounceTimer[modalId]);
    }
    _debounceTimer[modalId] = window.setTimeout(() => {
      _debounceTimer[modalId] = null;
      persistiere(modalId, fenster, extras);
    }, DEBOUNCE_MS);
  }

  function lade(modalId) {
    if (!modalId) {
      return null;
    }
    const map = leseMap();
    return normalisiereEintrag(map[modalId]);
  }

  function istOffenGespeichert(modalId) {
    const e = lade(modalId);
    return !!(e && e.offen);
  }

  function entferne(modalId) {
    if (!modalId) {
      return;
    }
    if (_debounceTimer[modalId]) {
      window.clearTimeout(_debounceTimer[modalId]);
      _debounceTimer[modalId] = null;
    }
    const map = leseMap();
    if (!(modalId in map)) {
      return;
    }
    delete map[modalId];
    schreibeMap(map);
    loescheLegacyKey(modalId);
  }

  function loescheAlle() {
    Object.keys(_debounceTimer).forEach((id) => {
      if (_debounceTimer[id]) {
        window.clearTimeout(_debounceTimer[id]);
      }
    });
    Object.keys(_debounceTimer).forEach((id) => {
      delete _debounceTimer[id];
    });
    const s = speicherZugriff();
    if (s) {
      try {
        s.loescheKey(SPEICHER_KEY);
      } catch {
        /* optional */
      }
    }
    Object.values(LEGACY_KEYS).forEach((key) => {
      try {
        s && s.loescheKey(key);
      } catch {
        /* optional */
      }
    });
  }

  function metaFuerModal(modalId, eintrag) {
    const basis = MODAL_META[modalId] || { titel: 'Fenster', emoji: '' };
    return {
      titel: (eintrag && eintrag.dockTitel) || basis.titel,
      emoji: eintrag && eintrag.dockEmoji != null ? eintrag.dockEmoji : basis.emoji,
    };
  }

  function registriereMinimiertImDock(modalId, fenster, onWiederherstellen) {
    const MF = window.HTBAH_MODAL_FENSTER;
    if (!MF || !modalId || !fenster || !fenster.minimiert) {
      return;
    }
    const eintrag = lade(modalId);
    const meta = metaFuerModal(modalId, eintrag);
    fenster._dockId = modalId;
    MF.dock.registriere({
      id: modalId,
      titel: meta.titel,
      emoji: meta.emoji,
      wiederherstellen() {
        MF.methoden.wiederherstellen.call(fenster);
        persistiere(modalId, fenster);
        if (typeof onWiederherstellen === 'function') {
          onWiederherstellen();
        }
      },
    });
  }

  function migriereLegacyEinmalig(modalId, fenster, opts) {
    const legacy = LEGACY_KEYS[modalId];
    const s = speicherZugriff();
    if (!legacy || !s || lade(modalId)) {
      return false;
    }
    try {
      const o = s.leseJson(legacy, null);
      if (!o || typeof o !== 'object') {
        return false;
      }
      wendeAufFenster(fenster, normalisiereEintrag(o), opts);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @param {object} fenster
   * @param {object} vm
   * @param {{ initialisierePosition?: function, fokussiere?: function }} [schritte]
   */
  function nachGeoeffnetAusSpeicher(fenster, vm, schritte) {
    if (!fenster) {
      return;
    }
    const s = schritte || {};
    if (!fenster.istVollbild && typeof s.initialisierePosition === 'function') {
      s.initialisierePosition.call(vm);
    }
    if (!fenster.minimiert && typeof s.fokussiere === 'function') {
      s.fokussiere.call(vm);
    }
  }

  function beimModalOeffnen(modalId, fenster, options) {
    const MF = window.HTBAH_MODAL_FENSTER;
    const M = MF && MF.methoden;
    if (!modalId || !fenster || !M) {
      return;
    }
    const opts = options && options.fensterOpts;
    migriereLegacyEinmalig(modalId, fenster, opts);
    const eintrag = lade(modalId);
    if (eintrag) {
      wendeAufFenster(fenster, eintrag, opts);
    }
    M.bindModalSpeicher.call(
      fenster,
      modalId,
      options && options.extrasLieferant ? options.extrasLieferant : null,
    );
    M.persistiereModalWennGebunden.call(fenster);
    if (eintrag && eintrag.minimiert) {
      registriereMinimiertImDock(
        modalId,
        fenster,
        options && options.onWiederherstellen ? options.onWiederherstellen : null,
      );
    }
  }

  function beimModalSchliessen(fenster, dockId) {
    const MF = window.HTBAH_MODAL_FENSTER;
    const M = MF && MF.methoden;
    if (!fenster || !M) {
      return;
    }
    M.bereinigeMinimiertZustand.call(fenster, dockId || fenster._htbahModalSpeicherId);
    M.entferneModalSpeicher.call(fenster);
  }

  /** UI ausblenden (z. B. Kampagne verlassen), Fensterzustand in localStorage behalten. */
  function beimModalUiAusblenden(modalId, fenster, extrasLieferant) {
    const MF = window.HTBAH_MODAL_FENSTER;
    const M = MF && MF.methoden;
    if (!modalId || !fenster || !M) {
      return;
    }
    const extras =
      typeof extrasLieferant === 'function' ? extrasLieferant() || {} : extrasLieferant || {};
    persistiere(modalId, fenster, extras);
    M.bereinigeMinimiertZustand.call(fenster, modalId);
    fenster._htbahModalSpeicherId = null;
    fenster._htbahModalSpeicherExtras = null;
  }

  const api = {
    SPEICHER_KEY,
    nachGeoeffnetAusSpeicher,
    beimModalOeffnen,
    beimModalSchliessen,
    beimModalUiAusblenden,
    MODAL_IDS: Object.freeze({
      regelwerk: 'regelwerk',
      abenteuerbuch: 'abenteuerbuch',
      zeichen: 'zeichen',
      konflikt: 'konflikt',
      inventar: 'inventar',
      weltenbau: 'weltenbau',
      wuerfelBeutel: 'wuerfel-beutel',
      musikboard: 'musikboard',
    }),
    leseMap,
    lade,
    istOffenGespeichert,
    serialisiere,
    wendeAufFenster,
    persistiere,
    persistiereDebounced,
    entferne,
    loescheAlle,
    metaFuerModal,
    registriereMinimiertImDock,
    migriereLegacyEinmalig,
  };

  window.HTBAH_MODAL_FENSTER = window.HTBAH_MODAL_FENSTER || {};
  window.HTBAH_MODAL_FENSTER.speicher = api;
})();
