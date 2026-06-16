/**
 * Thematisches Setting (Fantasy / Gegenwart / Sci-Fi) und Epochen-Defaults.
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function () {
  const M = {};

  const THEME_MODES = Object.freeze(['light', 'dark']);
  const THEME_SETTINGS = Object.freeze(['fantasy', 'gegenwart', 'scifi']);

  const DEFAULT_PROFIL = Object.freeze({
    mode: 'light',
    setting: 'fantasy',
  });

  const ZUFALL_EPOCHE_PRO_SETTING = Object.freeze({
    fantasy: 'mittelalter',
    gegenwart: 'gegenwart',
    scifi: 'zukunft',
  });

  const CHARAKTER_EPOCHE_PRO_SETTING = Object.freeze({
    fantasy: 'mittelalter-fantasy',
    gegenwart: 'gegenwart',
    scifi: 'scifi',
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

  function standardZufallEpoche(setting) {
    const s = istGueltigesSetting(setting) ? setting : DEFAULT_PROFIL.setting;
    return ZUFALL_EPOCHE_PRO_SETTING[s] || ZUFALL_EPOCHE_PRO_SETTING.fantasy;
  }

  function standardCharakterEpoche(setting) {
    const s = istGueltigesSetting(setting) ? setting : DEFAULT_PROFIL.setting;
    return CHARAKTER_EPOCHE_PRO_SETTING[s] || CHARAKTER_EPOCHE_PRO_SETTING.fantasy;
  }

  function bgImageDateiname(setting, variant) {
    const s = istGueltigesSetting(setting) ? setting : DEFAULT_PROFIL.setting;
    if (variant === 'mobile-portrait') {
      return `bg-mobile-device-portrait-${s}.png`;
    }
    return `bg-desktop-${s}.png`;
  }

  M.THEME_MODES = THEME_MODES;
  M.THEME_SETTINGS = THEME_SETTINGS;
  M.DEFAULT_PROFIL = DEFAULT_PROFIL;
  M.ZUFALL_EPOCHE_PRO_SETTING = ZUFALL_EPOCHE_PRO_SETTING;
  M.CHARAKTER_EPOCHE_PRO_SETTING = CHARAKTER_EPOCHE_PRO_SETTING;
  M.istGueltigerMode = istGueltigerMode;
  M.istGueltigesSetting = istGueltigesSetting;
  M.normalisiereThemeProfil = normalisiereThemeProfil;
  M.serialisiereThemeProfil = serialisiereThemeProfil;
  M.standardZufallEpoche = standardZufallEpoche;
  M.standardCharakterEpoche = standardCharakterEpoche;
  M.bgImageDateiname = bgImageDateiname;

  window.HTBAH_SHARED.ThemenEinstellungen = M;
})();
