/**
 * Fraktions-Zufallsgenerator (epochenabhängige Namen und Beschreibungen).
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const E = U.EPOCHE;
  const L = window.HTBAH.ZufallsgeneratorFraktionListen;

  function nameMittelalter() {
    const roll = Math.random();
    if (roll < 0.35) {
      return `Die ${U.zufaellig(L.MITTEL_ADJ)} ${U.zufaellig(L.MITTEL_SUB)}`;
    }
    if (roll < 0.65) {
      return `${U.zufaellig(L.MITTEL_ORG)} vom ${U.zufaellig(L.MITTEL_SUB)}${U.zufaellig(['tal', 'berg', 'feld', 'wald', 'tor'])}`;
    }
    return `${U.zufaellig(L.MITTEL_ADJ)} ${U.zufaellig(L.MITTEL_ORG)}`;
  }

  function nameGegenwart() {
    const geo = U.zufaellig(L.GEO_MODERN);
    const suf = U.zufaellig(L.MODERN_SUFFIX);
    if (Math.random() < 0.4) {
      return `${geo}-${suf}`;
    }
    return `${U.zufaellig(['Bürger', 'Offene', 'Stille', 'Junge', 'Neue'])} ${geo} ${suf}`;
  }

  function nameZukunft() {
    const a = U.zufaellig(L.SF_PREFIX);
    const b = U.zufaellig(L.SF_CORE);
    const n = U.zufaellig(L.SF_NUM);
    const patterns = [
      () => `${a}-${b}`,
      () => `${b} „${a}-${n}“`,
      () => `${U.zufaellig(['Das', 'Die', 'Der'])} ${a} ${b}`,
      () => `${b} ${n}`,
    ];
    return U.zufaellig(patterns)();
  }

  function nameFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return nameGegenwart();
    }
    if (epoche === E.ZUKUNFT) {
      return nameZukunft();
    }
    return nameMittelalter();
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

  function beschreibungHtmlFuerEpoche(epoche) {
    const oeffentlich = U.zufaellig(
      listeFuerEpoche(
        epoche,
        L.OEFFENTLICHES_BILD,
        L.OEFFENTLICHES_BILD_GEGENWART,
        L.OEFFENTLICHES_BILD_ZUKUNFT,
      ),
    );
    const intern = U.zufaellig(
      listeFuerEpoche(
        epoche,
        L.INTERNE_DYNAMIK,
        L.INTERNE_DYNAMIK_GEGENWART,
        L.INTERNE_DYNAMIK_ZUKUNFT,
      ),
    );
    const atmosphaere = U.zufaellig(
      listeFuerEpoche(epoche, L.ATMOSPHAERE, L.ATMOSPHAERE_GEGENWART, L.ATMOSPHAERE_ZUKUNFT),
    );
    return [
      `<p>${U.htmlEsc(atmosphaere)}</p>`,
      `<p><strong>Öffentliches Bild:</strong> ${U.htmlEsc(oeffentlich)}</p>`,
      `<p><strong>Interne Dynamik:</strong> ${U.htmlEsc(intern)}</p>`,
    ].join('');
  }

  function wertAusListeOderZufaellig(wert, liste) {
    const fix = typeof wert === 'string' ? wert.trim() : '';
    if (fix && liste.includes(fix)) {
      return fix;
    }
    if (fix) {
      return fix;
    }
    return U.zufaellig(liste);
  }

  window.HTBAH.ZufallsgeneratorFraktionModul = {
    artenOptionen() {
      return L.ARTEN.slice();
    },

    /**
     * @param {{ epoche?: string, art?: string }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const art = wertAusListeOderZufaellig(opts && opts.art, L.ARTEN);
      const name = nameFuerEpoche(epoche);
      const ziel = U.zufaellig(L.ZIELE);
      const gesinnungVerhalten = U.zufaellig(L.GESINNUNG_VERHALTEN);
      const beschreibungHtml = beschreibungHtmlFuerEpoche(epoche);

      return {
        art,
        name,
        ziel,
        gesinnungVerhalten,
        beschreibungHtml,
      };
    },
  };
})();
