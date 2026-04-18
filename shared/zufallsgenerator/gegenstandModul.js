/**
 * Gegenstand-Zufallsgenerator (Epoche, Kleidung optional).
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const E = U.EPOCHE;
  const L = window.HTBAH.ZufallsgeneratorGegenstandListen;

  function waffeFuerEpoche(epoche) {
    if (epoche === E.MITTELALTER) {
      return U.gewichtet(L.WAFFE_MITTELALTER);
    }
    if (epoche === E.GEGENWART) {
      return U.gewichtet(L.WAFFE_GEGENWART);
    }
    return U.gewichtet(L.WAFFE_ZUKUNFT);
  }

  function kleidungFuerEpoche(epoche) {
    if (epoche === E.MITTELALTER) {
      return U.zufaellig(L.KLEIDUNG_MITTELALTER);
    }
    if (epoche === E.GEGENWART) {
      return U.zufaellig(L.KLEIDUNG_GEGENWART);
    }
    return U.zufaellig(L.KLEIDUNG_ZUKUNFT);
  }

  function sonstigesFuerEpoche(epoche) {
    if (epoche === E.MITTELALTER) {
      return U.zufaellig(L.SONSTIGES_MITTELALTER);
    }
    if (epoche === E.GEGENWART) {
      return U.zufaellig(L.SONSTIGES_GEGENWART);
    }
    return U.zufaellig(L.SONSTIGES_ZUKUNFT);
  }

  window.HTBAH.ZufallsgeneratorGegenstandModul = {
    EPOCHE: E,
    /**
     * @param {{ epoche?: string, mitKleidung?: boolean }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const mitKleidung = opts && opts.mitKleidung !== false;

      let kategorie = U.gewichtet([
        { wert: 'waffe', gewicht: mitKleidung ? 40 : 55 },
        { wert: 'kleidung', gewicht: mitKleidung ? 35 : 0 },
        { wert: 'sonstiges', gewicht: mitKleidung ? 25 : 45 },
      ]);

      if (!mitKleidung && kategorie === 'kleidung') {
        kategorie = Math.random() < 0.55 ? 'waffe' : 'sonstiges';
      }

      let basisName;
      let typLabel;

      if (kategorie === 'waffe') {
        typLabel = 'Waffe';
        basisName = waffeFuerEpoche(epoche);
      } else if (kategorie === 'kleidung') {
        typLabel = 'Kleidung';
        basisName = kleidungFuerEpoche(epoche);
      } else {
        typLabel = 'Gegenstand';
        basisName = sonstigesFuerEpoche(epoche);
      }

      const material = U.zufaellig(L.MATERIAL);
      const zust = U.zufaellig(L.ZUSTAND_ITEM);
      const farbe = U.zufaellig(L.FARBE);

      const beschreibungHtml = [
        `<p><strong>Art:</strong> ${U.htmlEsc(typLabel)} (${U.htmlEsc(epoche)})</p>`,
        `<p><strong>Details:</strong> ${U.htmlEsc(material)}, ${U.htmlEsc(farbe)}, ${U.htmlEsc(zust)}.</p>`,
        `<p>${U.htmlEsc(U.zufaellig(L.FLAVOR))}</p>`,
      ].join('');

      return {
        name: basisName,
        beschreibungHtml,
      };
    },
  };
})();
