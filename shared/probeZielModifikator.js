window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function (SHARED) {
  'use strict';

  function berechneEffektiverModifikator(modifikatorArt, bonusWert, malusWert) {
    if (modifikatorArt === 'kein') {
      return 0;
    }
    if (modifikatorArt === 'bonus') {
      const b = Math.round(Number(bonusWert) || 0);
      return Math.max(1, Math.min(100, b));
    }
    const m = Math.round(Number(malusWert) || 0);
    return Math.max(-100, Math.min(-1, m));
  }

  function berechneZielwert(basiswert, modifikatorArt, bonusWert, malusWert) {
    const basis = Math.max(0, Math.round(Number(basiswert) || 0));
    const mod = berechneEffektiverModifikator(modifikatorArt, bonusWert, malusWert);
    return Math.max(0, Math.min(100, basis + mod));
  }

  SHARED.ProbeZielModifikator = {
    berechneEffektiverModifikator,
    berechneZielwert,
  };
})(window.HTBAH_SHARED);
