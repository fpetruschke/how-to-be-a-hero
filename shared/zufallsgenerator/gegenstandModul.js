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

  function schadenswertW10Zufaellig() {
    const wuerfel = U.zufallsInt(1, 4);
    const mod = U.zufallsInt(0, 5);
    if (mod === 0) {
      return `${wuerfel}W10`;
    }
    return `${wuerfel}W10+${mod}`;
  }

  function aufenthaltsortAusOrteListe(orteNamen) {
    if (!Array.isArray(orteNamen) || !orteNamen.length) {
      return '';
    }
    const namen = orteNamen
      .map((n) => (typeof n === 'string' ? n.trim() : ''))
      .filter(Boolean);
    if (!namen.length) {
      return '';
    }
    return U.zufaellig(namen);
  }

  window.HTBAH.ZufallsgeneratorGegenstandModul = {
    EPOCHE: E,
    /**
     * @param {{ epoche?: string, mitKleidung?: boolean, orteNamen?: string[] }} opts
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
      let istWaffe = false;
      let schadenswertNahkampf = '';
      let schadenswertFernkampf = '';

      if (kategorie === 'waffe') {
        typLabel = 'Waffe';
        basisName = waffeFuerEpoche(epoche);
        istWaffe = true;
        schadenswertNahkampf = schadenswertW10Zufaellig();
        schadenswertFernkampf = Math.random() < 0.7 ? schadenswertW10Zufaellig() : '';
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

      const kopfzeilen = [
        `<p><strong>Art:</strong> ${U.htmlEsc(typLabel)} (${U.htmlEsc(epoche)})</p>`,
        `<p><strong>Details:</strong> ${U.htmlEsc(material)}, ${U.htmlEsc(farbe)}, ${U.htmlEsc(zust)}.</p>`,
      ];
      if (istWaffe) {
        kopfzeilen.push(
          `<p><strong>Schadenswert Nahkampf:</strong> ${U.htmlEsc(schadenswertNahkampf || '—')} · <strong>Fernkampf:</strong> ${U.htmlEsc(
            schadenswertFernkampf || '—',
          )}</p>`,
        );
      }
      kopfzeilen.push(`<p>${U.htmlEsc(U.zufaellig(L.FLAVOR))}</p>`);
      const beschreibungHtml = kopfzeilen.join('');

      return {
        name: basisName,
        beschreibungHtml,
        istWaffe,
        schadenswertNahkampf,
        schadenswertFernkampf,
        aufenthaltsort: aufenthaltsortAusOrteListe(opts && opts.orteNamen),
      };
    },
  };
})();
