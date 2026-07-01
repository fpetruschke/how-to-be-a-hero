/**
 * Thematisches Setting (Fantasy / Gegenwart / Sci-Fi) und Epochen-Defaults.
 * Registry: themes/themeRegistry.js → window.HTBAH_THEME_REGISTRY
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function () {
  const M = {};

  const THEME_MODES = Object.freeze(['light', 'dark']);

  const REGISTRY_EINTRAEGE = Array.isArray(window.HTBAH_THEME_REGISTRY)
    ? window.HTBAH_THEME_REGISTRY.slice()
    : [];

  const FALLBACK_REGISTRY = Object.freeze([
    {
      id: 'fantasy',
      label: 'Fantasy',
      emoji: '🏰',
      zufallEpoche: 'mittelalter',
      charakterEpoche: 'mittelalter-fantasy',
      pdfStil: 'fantasy-mittelalter',
    },
    {
      id: 'gegenwart',
      label: 'Gegenwart',
      emoji: '🏙️',
      zufallEpoche: 'gegenwart',
      charakterEpoche: 'gegenwart',
      pdfStil: 'gegenwart',
      istStandard: true,
    },
    {
      id: 'scifi',
      label: 'Sci-Fi',
      emoji: '🚀',
      zufallEpoche: 'zukunft',
      charakterEpoche: 'scifi',
      pdfStil: 'modern-futuristisch',
    },
  ]);

  const THEME_REGISTRY = Object.freeze(
    REGISTRY_EINTRAEGE.length > 0 ? REGISTRY_EINTRAEGE : FALLBACK_REGISTRY,
  );

  const STANDARD_SETTING_ID =
    THEME_REGISTRY.find((e) => e && e.istStandard === true)?.id ||
    THEME_REGISTRY.find((e) => e && e.id === 'gegenwart')?.id ||
    THEME_REGISTRY[0]?.id ||
    'gegenwart';

  const THEME_SETTINGS = Object.freeze(
    THEME_REGISTRY.map((e) => e.id).filter((id) => typeof id === 'string' && id.length > 0),
  );

  const DEFAULT_PROFIL = Object.freeze({
    mode: 'light',
    setting: STANDARD_SETTING_ID,
  });

  function mapAusRegistry(feld, fallbackId) {
    const out = {};
    for (const e of THEME_REGISTRY) {
      if (!e || typeof e.id !== 'string' || !e.id) {
        continue;
      }
      const wert = e[feld];
      if (typeof wert === 'string' && wert) {
        out[e.id] = wert;
      }
    }
    if (fallbackId && out[fallbackId] == null && THEME_REGISTRY[0]) {
      out[fallbackId] = THEME_REGISTRY[0][feld];
    }
    return Object.freeze(out);
  }

  const ZUFALL_EPOCHE_PRO_SETTING = mapAusRegistry('zufallEpoche', 'fantasy');
  const CHARAKTER_EPOCHE_PRO_SETTING = mapAusRegistry('charakterEpoche', 'fantasy');
  const PDF_STIL_PRO_SETTING = mapAusRegistry('pdfStil', 'fantasy');

  const THEME_SETTING_OPTIONEN = Object.freeze(
    THEME_REGISTRY.map((e) => ({
      id: e.id,
      label: e.label || e.id,
      emoji: e.emoji || '🎨',
    })),
  );

  const KAMPAGNEN_THEME_OPTIONEN = Object.freeze([
    { id: '', label: 'Keine Vorgabe', emoji: '⚙️' },
    ...THEME_SETTING_OPTIONEN,
  ]);

  /** Demo-Quell-IDs aus assets/beispiel-kampagnen (additiver Import). */
  const BEISPIEL_KAMPAGNEN_QUELL_ID_THEME = Object.freeze({
    'demo-heldenpruefung-fuer-anfaenger': 'fantasy',
    'demo-schroeders-heisse-kastanien': 'fantasy',
    'demo-das-schwarze-wasser': 'fantasy',
    'demo-xenolidium-notfall': 'scifi',
  });

  /** Basisnamen inkl. Kopien ohne „ #N“-Suffix (Neue-Instanz-Import). */
  const BEISPIEL_KAMPAGNEN_BASISNAME_THEME = Object.freeze({
    'Heldenprüfung für Anfänger (Demo)': 'fantasy',
    'Heldenprüfung für Anfänger (Tutorial)': 'fantasy',
    'Schröders heiße Kastanien (Demo)': 'fantasy',
    'Das schwarze Wasser (Demo)': 'fantasy',
    'Xenolidium-Notfall (Solo-Tutorial)': 'scifi',
  });

  function istGueltigerMode(mode) {
    return THEME_MODES.includes(mode);
  }

  function istGueltigesSetting(setting) {
    return THEME_SETTINGS.includes(setting);
  }

  function profilAusObjekt(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return null;
    }
    const mode = istGueltigerMode(obj.mode) ? obj.mode : DEFAULT_PROFIL.mode;
    const setting = istGueltigesSetting(obj.setting) ? obj.setting : DEFAULT_PROFIL.setting;
    return { mode, setting };
  }

  function normalisiereThemeProfil(raw) {
    if (raw == null || raw === '') {
      return { ...DEFAULT_PROFIL };
    }
    const ausObjekt = profilAusObjekt(raw);
    if (ausObjekt) {
      return ausObjekt;
    }
    const text = String(raw).trim();
    if (text === 'light' || text === 'dark') {
      return { mode: text, setting: DEFAULT_PROFIL.setting };
    }
    try {
      const parsed = JSON.parse(text);
      const ausParsed = profilAusObjekt(parsed);
      if (ausParsed) {
        return ausParsed;
      }
    } catch {
      /* Legacy oder ungültig */
    }
    return { ...DEFAULT_PROFIL };
  }

  function serialisiereThemeProfil(profil) {
    const norm = normalisiereThemeProfil(profil);
    return JSON.stringify(norm);
  }

  function wertProSetting(map, setting, fallbackKey) {
    const s = istGueltigesSetting(setting) ? setting : DEFAULT_PROFIL.setting;
    return map[s] || map[fallbackKey] || map[THEME_SETTINGS[0]];
  }

  function standardZufallEpoche(setting) {
    return wertProSetting(ZUFALL_EPOCHE_PRO_SETTING, setting, 'fantasy');
  }

  function standardCharakterEpoche(setting) {
    return wertProSetting(CHARAKTER_EPOCHE_PRO_SETTING, setting, 'fantasy');
  }

  function standardPdfStil(setting) {
    return wertProSetting(PDF_STIL_PRO_SETTING, setting, 'fantasy');
  }

  function normalisiereKampagnenThemeSetting(raw) {
    if (raw == null || raw === '' || raw === 'none' || raw === 'keine') {
      return '';
    }
    const s = String(raw).trim().toLowerCase();
    return istGueltigesSetting(s) ? s : '';
  }

  function beispielDefaultThemeFuerKampagne(kampagne) {
    const k = kampagne && typeof kampagne === 'object' ? kampagne : {};
    const id = typeof k.id === 'string' ? k.id.trim() : '';
    if (id && BEISPIEL_KAMPAGNEN_QUELL_ID_THEME[id]) {
      return BEISPIEL_KAMPAGNEN_QUELL_ID_THEME[id];
    }
    const name = typeof k.name === 'string' ? k.name.trim() : '';
    if (!name) {
      return '';
    }
    const basis = name.replace(/\s+#\d+$/, '');
    return BEISPIEL_KAMPAGNEN_BASISNAME_THEME[basis] || '';
  }

  function bgImageDateiname(setting, variant) {
    const s = istGueltigesSetting(setting) ? setting : DEFAULT_PROFIL.setting;
    if (variant === 'mobile-portrait') {
      return `bg-mobile-device-portrait-${s}.png`;
    }
    return `bg-desktop-${s}.png`;
  }

  M.THEME_MODES = THEME_MODES;
  M.THEME_REGISTRY = THEME_REGISTRY;
  M.THEME_SETTINGS = THEME_SETTINGS;
  M.THEME_SETTING_OPTIONEN = THEME_SETTING_OPTIONEN;
  M.KAMPAGNEN_THEME_OPTIONEN = KAMPAGNEN_THEME_OPTIONEN;
  M.BEISPIEL_KAMPAGNEN_QUELL_ID_THEME = BEISPIEL_KAMPAGNEN_QUELL_ID_THEME;
  M.BEISPIEL_KAMPAGNEN_BASISNAME_THEME = BEISPIEL_KAMPAGNEN_BASISNAME_THEME;
  M.DEFAULT_PROFIL = DEFAULT_PROFIL;
  M.ZUFALL_EPOCHE_PRO_SETTING = ZUFALL_EPOCHE_PRO_SETTING;
  M.CHARAKTER_EPOCHE_PRO_SETTING = CHARAKTER_EPOCHE_PRO_SETTING;
  M.PDF_STIL_PRO_SETTING = PDF_STIL_PRO_SETTING;
  M.istGueltigerMode = istGueltigerMode;
  M.istGueltigesSetting = istGueltigesSetting;
  M.normalisiereThemeProfil = normalisiereThemeProfil;
  M.serialisiereThemeProfil = serialisiereThemeProfil;
  M.standardZufallEpoche = standardZufallEpoche;
  M.standardCharakterEpoche = standardCharakterEpoche;
  M.standardPdfStil = standardPdfStil;
  M.normalisiereKampagnenThemeSetting = normalisiereKampagnenThemeSetting;
  M.beispielDefaultThemeFuerKampagne = beispielDefaultThemeFuerKampagne;
  M.bgImageDateiname = bgImageDateiname;

  window.HTBAH_SHARED.ThemenEinstellungen = M;
})();
