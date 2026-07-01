window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function (SHARED) {
  'use strict';

  function normalisiereBasiswert(basiswert) {
    return Math.max(0, Math.min(100, Math.round(Number(basiswert) || 0)));
  }

  function berechneModifikatorGrenzen(basiswert) {
    const basis = normalisiereBasiswert(basiswert);
    return {
      min: -basis,
      max: 100 - basis,
    };
  }

  function berechneEffektiverModifikator(modifikatorWert, basiswert) {
    const { min, max } = berechneModifikatorGrenzen(basiswert);
    const m = Math.round(Number(modifikatorWert) || 0);
    return Math.max(min, Math.min(max, m));
  }

  function berechneZielwert(basiswert, modifikatorWert) {
    const basis = normalisiereBasiswert(basiswert);
    const mod = berechneEffektiverModifikator(modifikatorWert, basiswert);
    return basis + mod;
  }

  function berechneModifikatorAusZielwert(basiswert, zielwert) {
    const basis = normalisiereBasiswert(basiswert);
    const z = Math.max(0, Math.min(100, Math.round(Number(zielwert) || 0)));
    return berechneEffektiverModifikator(z - basis, basiswert);
  }

  function berechneSymmetrischeModifikatorGrenzen(maxAbsolut) {
    const max = Math.max(1, Math.round(Number(maxAbsolut) || 50));
    return { min: -max, max };
  }

  function berechneEffektiverSymmetrischerModifikator(modifikatorWert, maxAbsolut) {
    const { min, max } = berechneSymmetrischeModifikatorGrenzen(maxAbsolut);
    const m = Math.round(Number(modifikatorWert) || 0);
    return Math.max(min, Math.min(max, m));
  }

  /**
   * Stärkestufen für SL-Modifikator (absoluter Betrag).
   * 1–10 klein, 11–30 normal, 31–40 groß, >40 extrem.
   */
  function berechneModifikatorStaerke(modifikatorWert) {
    const abs = Math.abs(Math.round(Number(modifikatorWert) || 0));
    if (abs === 0) {
      return { stufe: 0, label: '' };
    }
    if (abs <= 10) {
      return { stufe: 1, label: 'klein' };
    }
    if (abs <= 30) {
      return { stufe: 2, label: 'normal' };
    }
    if (abs <= 40) {
      return { stufe: 3, label: 'groß' };
    }
    return { stufe: 4, label: 'extrem' };
  }

  SHARED.ProbeZielModifikator = {
    berechneModifikatorGrenzen,
    berechneSymmetrischeModifikatorGrenzen,
    berechneEffektiverModifikator,
    berechneEffektiverSymmetrischerModifikator,
    berechneZielwert,
    berechneModifikatorAusZielwert,
    berechneModifikatorStaerke,
  };
})(window.HTBAH_SHARED);
