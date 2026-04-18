/**
 * Gemeinsame Hilfsfunktionen für den Zufallsgenerator.
 */
window.HTBAH = window.HTBAH || {};

window.HTBAH.ZufallsgeneratorUtil = {
  EPOCHE: {
    MITTELALTER: 'mittelalter',
    GEGENWART: 'gegenwart',
    ZUKUNFT: 'zukunft',
  },

  zufaellig(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  zufallsInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /** @param {{ wert: *, gewicht: number }[]} eintraege */
  gewichtet(eintraege) {
    const sum = eintraege.reduce((a, e) => a + Math.max(0, e.gewicht), 0);
    if (sum <= 0) {
      return eintraege.length ? eintraege[0].wert : null;
    }
    let r = Math.random() * sum;
    for (let i = 0; i < eintraege.length; i += 1) {
      r -= Math.max(0, eintraege[i].gewicht);
      if (r <= 0) {
        return eintraege[i].wert;
      }
    }
    return eintraege[eintraege.length - 1].wert;
  },

  htmlEsc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};
