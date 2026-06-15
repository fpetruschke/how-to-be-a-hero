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

  function listeFuerEpoche(epoche, basis, gegenwart, zukunft) {
    if (epoche === E.GEGENWART) {
      return gegenwart;
    }
    if (epoche === E.ZUKUNFT) {
      return zukunft;
    }
    return basis;
  }

  function materialFuerEpoche(epoche) {
    return U.zufaellig(
      listeFuerEpoche(epoche, L.MATERIAL, L.MATERIAL_GEGENWART, L.MATERIAL_ZUKUNFT),
    );
  }

  function zustandFuerEpoche(epoche) {
    return U.zufaellig(
      listeFuerEpoche(epoche, L.ZUSTAND_ITEM, L.ZUSTAND_GEGENWART, L.ZUSTAND_ZUKUNFT),
    );
  }

  function flavorFuerEpoche(epoche) {
    return U.zufaellig(listeFuerEpoche(epoche, L.FLAVOR, L.FLAVOR_GEGENWART, L.FLAVOR_ZUKUNFT));
  }

  window.HTBAH.ZufallsgeneratorGegenstandModul = {
    EPOCHE: E,
    kategorienOptionen() {
      return [
        { wert: 'waffe', label: 'Waffe', icon: '⚔️' },
        { wert: 'kleidung', label: 'Kleidung', icon: '👕' },
        { wert: 'sonstiges', label: 'Sonstiges', icon: '📦' },
      ];
    },
    /**
     * @param {{ epoche?: string, kategorie?: string, orteNamen?: string[] }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const kategorieVorgabe =
        opts && opts.kategorie === 'waffe'
          ? 'waffe'
          : opts && opts.kategorie === 'kleidung'
            ? 'kleidung'
            : opts && opts.kategorie === 'sonstiges'
              ? 'sonstiges'
              : '';

      const kategorie = kategorieVorgabe
        ? kategorieVorgabe
        : U.gewichtet([
            { wert: 'waffe', gewicht: 40 },
            { wert: 'kleidung', gewicht: 35 },
            { wert: 'sonstiges', gewicht: 25 },
          ]);

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

      const material = materialFuerEpoche(epoche);
      const zust = zustandFuerEpoche(epoche);
      const farbe = U.zufaellig(L.FARBE);

      const kopfzeilen = [
        `<p>${U.htmlEsc(flavorFuerEpoche(epoche))}</p>`,
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
      const beschreibungHtml = kopfzeilen.join('');

      return {
        name: basisName,
        kategorie,
        beschreibungHtml,
        istWaffe,
        schadenswertNahkampf,
        schadenswertFernkampf,
        aufenthaltsort: aufenthaltsortAusOrteListe(opts && opts.orteNamen),
      };
    },
  };
})();
