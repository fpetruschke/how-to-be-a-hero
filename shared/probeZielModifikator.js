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

  SHARED.ProbeZielModifikator = {
    berechneModifikatorGrenzen,
    berechneEffektiverModifikator,
    berechneZielwert,
  };
})(window.HTBAH_SHARED);
