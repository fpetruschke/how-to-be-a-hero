/**
 * Einstieg: Factory unter window.HTBAH.Zufallsgenerator.
 * Lädt die Skripte in index.html in dieser Reihenfolge:
 * util → Wortlisten → Module (inkl. Bestien) → diese Datei.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const npc = window.HTBAH.ZufallsgeneratorNpcModul;
  const ort = window.HTBAH.ZufallsgeneratorOrtModul;
  const gegenstand = window.HTBAH.ZufallsgeneratorGegenstandModul;
  const fraktion = window.HTBAH.ZufallsgeneratorFraktionModul;
  const pantheon = window.HTBAH.ZufallsgeneratorPantheonModul;
  const raetsel = window.HTBAH.ZufallsgeneratorRaetselModul;
  const bestie = window.HTBAH.ZufallsgeneratorBestienModul;

  if (!U || !npc || !ort || !gegenstand || !fraktion || !pantheon || !raetsel || !bestie) {
    return;
  }

  window.HTBAH.Zufallsgenerator = {
    EPOCHE: U ? U.EPOCHE : {},
    npc: (opts) => npc.generiere(opts || {}),
    ort: () => ort.generiere(),
    gegenstand: (opts) => gegenstand.generiere(opts || {}),
    fraktion: (opts) => fraktion.generiere(opts || {}),
    pantheon: () => pantheon.generiere(),
    raetsel: (opts) => raetsel.generiere(opts || {}),
    bestie: (opts) => bestie.generiere(opts || {}),
  };
})();
