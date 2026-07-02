window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerEffektRahmenModel(SHARED) {
  'use strict';

  const VERSION = 1;
  const BUILTIN_IDS = ['tot', 'bewusstlos', 'schlafend'];
  const BUILTIN_DEFAULT_WIDTH_PX = 12;

  const FALLBACK_FARBEN = Object.freeze({
    tot: '#dc2626',
    bewusstlos: '#d97706',
    schlafend: '#7dd3fc',
  });

  function leseCssVar(name, fallback) {
    try {
      const wert = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return wert || fallback;
    } catch {
      return fallback;
    }
  }

  function standardFarbeFuerBuiltin(id) {
    const key = String(id || '').trim();
    if (key === 'tot') {
      return leseCssVar('--danger-color', FALLBACK_FARBEN.tot);
    }
    if (key === 'bewusstlos') {
      return leseCssVar('--warning-color', FALLBACK_FARBEN.bewusstlos);
    }
    if (key === 'schlafend') {
      return FALLBACK_FARBEN.schlafend;
    }
    return '#000000';
  }

  function standardBuiltinRahmen() {
    return [
      {
        id: 'tot',
        label: 'Tot',
        color: standardFarbeFuerBuiltin('tot'),
        widthPx: BUILTIN_DEFAULT_WIDTH_PX,
        builtIn: true,
        enabledByDefault: true,
        showLabel: true,
      },
      {
        id: 'bewusstlos',
        label: 'Bewusstlos',
        color: standardFarbeFuerBuiltin('bewusstlos'),
        widthPx: BUILTIN_DEFAULT_WIDTH_PX,
        builtIn: true,
        enabledByDefault: true,
        showLabel: true,
      },
      {
        id: 'schlafend',
        label: 'Schlafend',
        color: standardFarbeFuerBuiltin('schlafend'),
        widthPx: BUILTIN_DEFAULT_WIDTH_PX,
        builtIn: true,
        enabledByDefault: true,
        showLabel: true,
      },
    ];
  }

  function normalisiereHexFarbe(roh, fallback) {
    const s = typeof roh === 'string' ? roh.trim() : '';
    if (/^#[0-9a-fA-F]{6}$/.test(s)) {
      return s;
    }
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return fallback;
  }

  function normalisiereRahmenEintrag(roh, fallback) {
    const basis = fallback && typeof fallback === 'object' ? fallback : null;
    if (!roh || typeof roh !== 'object') {
      return basis ? { ...basis } : null;
    }
    const id = typeof roh.id === 'string' && roh.id.trim() ? roh.id.trim() : basis ? basis.id : '';
    if (!id) {
      return null;
    }
    const label =
      typeof roh.label === 'string' && roh.label.trim()
        ? roh.label.trim()
        : basis
          ? basis.label
          : id;
    const color = normalisiereHexFarbe(
      roh.color,
      basis ? basis.color : standardFarbeFuerBuiltin(id),
    );
    const widthPx = Number.isFinite(Number(roh.widthPx))
      ? Math.min(24, Math.max(1, Math.round(Number(roh.widthPx))))
      : basis
        ? basis.widthPx
        : 4;
    const builtIn = roh.builtIn === true || BUILTIN_IDS.includes(id);
    const showLabel =
      roh.showLabel !== undefined ? Boolean(roh.showLabel) : basis ? basis.showLabel !== false : true;
    const enabledByDefault =
      roh.enabledByDefault !== undefined ? Boolean(roh.enabledByDefault) : basis ? basis.enabledByDefault : true;
    return { id, label, color, widthPx, builtIn, enabledByDefault, showLabel };
  }

  function normalisiereEffektRahmenKonfiguration(roh) {
    const builtins = standardBuiltinRahmen();
    const builtinMap = new Map(builtins.map((b) => [b.id, b]));
    const rohListe = roh && Array.isArray(roh.rahmen) ? roh.rahmen : [];
    const benutzerMap = new Map();
    rohListe.forEach((eintrag) => {
      const norm = normalisiereRahmenEintrag(eintrag, builtinMap.get(String(eintrag && eintrag.id)));
      if (norm && !norm.builtIn) {
        benutzerMap.set(norm.id, norm);
      }
    });
    const mergedBuiltins = builtins.map((b) => {
      const ausSpeicher = rohListe.find((e) => e && e.id === b.id);
      let norm = normalisiereRahmenEintrag(ausSpeicher, b) || b;
      if (
        norm.builtIn &&
        ausSpeicher &&
        Number(ausSpeicher.widthPx) === 4 &&
        b.widthPx === BUILTIN_DEFAULT_WIDTH_PX
      ) {
        norm = { ...norm, widthPx: BUILTIN_DEFAULT_WIDTH_PX };
      }
      return norm;
    });
    const rahmen = [...mergedBuiltins, ...benutzerMap.values()];
    return { version: VERSION, rahmen };
  }

  function normalisiereTokenExportEinstellungen(roh) {
    const basis = {
      version: VERSION,
      format: 'A4',
      ausrichtung: 'portrait',
      tokenGroesseMm: 25,
      seitenRandMm: 8,
      abstandMm: 2,
      defaultShape: 'kreis',
      borderColor: '#000000',
      borderWidthPx: 8,
      showName: true,
      includeEffects: true,
      showEffectNames: true,
      nameFontSizePx: 0,
      kategorieShapes: {},
      entityShapes: {},
      entityBorders: {},
      entityShowNames: {},
      entityCounts: {},
      effectCounts: {},
    };
    if (!roh || typeof roh !== 'object') {
      return {
        ...basis,
        kategorieShapes: {},
        entityShapes: {},
        entityBorders: {},
        entityShowNames: {},
        entityCounts: {},
        effectCounts: {},
      };
    }
    const shapeRaw = String(roh.defaultShape || '').trim();
    const defaultShape = shapeRaw === 'quadrat' ? 'quadrat' : 'kreis';
    const kategorieShapes = {};
    if (roh.kategorieShapes && typeof roh.kategorieShapes === 'object') {
      Object.keys(roh.kategorieShapes).forEach((key) => {
        const s = String(roh.kategorieShapes[key] || '').trim();
        if (s === 'kreis' || s === 'quadrat') {
          kategorieShapes[key] = s;
        }
      });
    }
    const entityShapes = {};
    if (roh.entityShapes && typeof roh.entityShapes === 'object') {
      Object.keys(roh.entityShapes).forEach((key) => {
        const s = String(roh.entityShapes[key] || '').trim();
        if (s === 'kreis' || s === 'quadrat') {
          entityShapes[key] = s;
        }
      });
    }
    const entityBorders = {};
    if (roh.entityBorders && typeof roh.entityBorders === 'object') {
      Object.keys(roh.entityBorders).forEach((key) => {
        const v = roh.entityBorders[key];
        if (v === true || v === false) {
          entityBorders[key] = v;
          return;
        }
        if (v && typeof v === 'object') {
          const entry = {};
          if (typeof v.color === 'string' && v.color.trim()) {
            entry.color = normalisiereHexFarbe(v.color, basis.borderColor);
          }
          if (Number.isFinite(Number(v.widthPx))) {
            entry.widthPx = Math.min(24, Math.max(0, Math.round(Number(v.widthPx))));
          }
          if (Object.keys(entry).length) {
            entityBorders[key] = entry;
          }
        }
      });
    }
    const entityShowNames = {};
    if (roh.entityShowNames && typeof roh.entityShowNames === 'object') {
      Object.keys(roh.entityShowNames).forEach((key) => {
        entityShowNames[key] = Boolean(roh.entityShowNames[key]);
      });
    }
    const entityCounts = {};
    if (roh.entityCounts && typeof roh.entityCounts === 'object') {
      Object.keys(roh.entityCounts).forEach((key) => {
        const n = Number(roh.entityCounts[key]);
        if (Number.isFinite(n)) {
          entityCounts[key] = Math.min(99, Math.max(0, Math.round(n)));
        }
      });
    }
    const effectCounts = {};
    if (roh.effectCounts && typeof roh.effectCounts === 'object') {
      Object.keys(roh.effectCounts).forEach((key) => {
        const n = Number(roh.effectCounts[key]);
        if (Number.isFinite(n)) {
          effectCounts[key] = Math.min(99, Math.max(0, Math.round(n)));
        }
      });
    }
    return {
      version: VERSION,
      format: typeof roh.format === 'string' && roh.format.trim() ? roh.format.trim().toUpperCase() : basis.format,
      ausrichtung: roh.ausrichtung === 'landscape' ? 'landscape' : 'portrait',
      tokenGroesseMm: Number.isFinite(Number(roh.tokenGroesseMm))
        ? Math.min(80, Math.max(10, Number(roh.tokenGroesseMm)))
        : basis.tokenGroesseMm,
      seitenRandMm: Number.isFinite(Number(roh.seitenRandMm))
        ? Math.min(40, Math.max(0, Number(roh.seitenRandMm)))
        : basis.seitenRandMm,
      abstandMm: Number.isFinite(Number(roh.abstandMm))
        ? Math.min(20, Math.max(0, Number(roh.abstandMm)))
        : basis.abstandMm,
      defaultShape,
      borderColor: normalisiereHexFarbe(roh.borderColor, basis.borderColor),
      borderWidthPx: Number.isFinite(Number(roh.borderWidthPx))
        ? Math.min(24, Math.max(0, Math.round(Number(roh.borderWidthPx))))
        : basis.borderWidthPx,
      showName: roh.showName !== undefined ? Boolean(roh.showName) : basis.showName,
      includeEffects: roh.includeEffects !== undefined ? Boolean(roh.includeEffects) : basis.includeEffects,
      showEffectNames: roh.showEffectNames !== undefined ? Boolean(roh.showEffectNames) : basis.showEffectNames,
      nameFontSizePx: Number.isFinite(Number(roh.nameFontSizePx))
        ? Math.min(64, Math.max(0, Math.round(Number(roh.nameFontSizePx))))
        : basis.nameFontSizePx,
      kategorieShapes,
      entityShapes,
      entityBorders,
      entityShowNames,
      entityCounts,
      effectCounts,
    };
  }

  function neueRahmenId() {
    return `effekt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  SHARED.EffektRahmenModel = {
    VERSION,
    BUILTIN_IDS,
    BUILTIN_DEFAULT_WIDTH_PX,
    FALLBACK_FARBEN,
    standardBuiltinRahmen,
    standardFarbeFuerBuiltin,
    normalisiereEffektRahmenKonfiguration,
    normalisiereTokenExportEinstellungen,
    normalisiereRahmenEintrag,
    normalisiereHexFarbe,
    neueRahmenId,
  };
})(window.HTBAH_SHARED);
