window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function (SHARED) {
  'use strict';

  const KOMFORT_OPTIONEN = [
    {
      id: 'komfortabel',
      label: 'Komfortabel',
      beispiel: 'z. B. Bett',
      voreinstellung: 3,
    },
    {
      id: 'unkomfortabel',
      label: 'Unkomfortabel',
      beispiel: 'z. B. nackter Steinboden',
      voreinstellung: -3,
    },
  ];

  const MAX_LP = 100;

  function normalisiereLp(roh) {
    const n = Math.round(Number(roh));
    if (Number.isNaN(n) || n < 0) {
      return 0;
    }
    return n;
  }

  function berechneRastRegeneration(wuerfelwert, modifikator) {
    const w = Math.round(Number(wuerfelwert) || 0);
    const m = Math.round(Number(modifikator) || 0);
    return Math.max(0, w + m);
  }

  function komfortOption(id) {
    return KOMFORT_OPTIONEN.find((opt) => opt.id === id) || KOMFORT_OPTIONEN[0];
  }

  function berechneLpNachRast(vorher, regeneration) {
    const basis = normalisiereLp(vorher);
    const delta = Math.max(0, Math.round(Number(regeneration) || 0));
    return Math.min(MAX_LP, basis + delta);
  }

  function wendeRastAufCharakterAn(charakter, regeneration) {
    if (!charakter || typeof charakter !== 'object') {
      return { vorher: 0, nach: 0, angewendet: false };
    }
    const vorher = normalisiereLp(charakter.lebenspunkte);
    if (vorher === 0 || charakter.lpStatusTot === true) {
      return { vorher, nach: vorher, angewendet: false };
    }
    const nach = berechneLpNachRast(vorher, regeneration);
    charakter.lebenspunkte = nach;
    if (window.HTBAH && typeof window.HTBAH.aktualisiereCharakterKampfZustandAusLp === 'function') {
      window.HTBAH.aktualisiereCharakterKampfZustandAusLp(charakter, vorher, nach);
    }
    if (window.HTBAH && typeof window.HTBAH.syncLebenspunkteStatusFromCharakter === 'function') {
      window.HTBAH.syncLebenspunkteStatusFromCharakter(charakter);
    }
    return { vorher, nach, angewendet: true };
  }

  SHARED.RastBerechnung = {
    KOMFORT_OPTIONEN,
    MAX_LP,
    normalisiereLp,
    berechneRastRegeneration,
    berechneLpNachRast,
    komfortOption,
    wendeRastAufCharakterAn,
  };
})(window.HTBAH_SHARED);
