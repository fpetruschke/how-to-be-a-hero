/**
 * Einstieg: Factory unter window.HTBAH.Zufallsgenerator.
 * Lädt die Skripte in index.html in dieser Reihenfolge:
 * util → Wortlisten → Module → diese Datei.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const npc = window.HTBAH.ZufallsgeneratorNpcModul;
  const ort = window.HTBAH.ZufallsgeneratorOrtModul;
  const gegenstand = window.HTBAH.ZufallsgeneratorGegenstandModul;
  const fraktion = window.HTBAH.ZufallsgeneratorFraktionModul;
  const pantheon = window.HTBAH.ZufallsgeneratorPantheonModul;

  if (!U || !npc || !ort || !gegenstand || !fraktion || !pantheon) {
    return;
  }

  window.HTBAH.Zufallsgenerator = {
    EPOCHE: U ? U.EPOCHE : {},
    npc: (opts) => npc.generiere(opts || {}),
    ort: () => ort.generiere(),
    gegenstand: (opts) => gegenstand.generiere(opts || {}),
    fraktion: (opts) => fraktion.generiere(opts || {}),
    pantheon: () => pantheon.generiere(),
  };
})();
