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

  if (!U || !npc || !ort || !gegenstand) {
    return;
  }

  window.HTBAH.Zufallsgenerator = {
    EPOCHE: U ? U.EPOCHE : {},
    npc: () => npc.generiere(),
    ort: () => ort.generiere(),
    gegenstand: (opts) => gegenstand.generiere(opts || {}),
  };
})();
