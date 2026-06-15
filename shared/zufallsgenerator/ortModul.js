/**
 * Orts-Zufallsgenerator (epochenabhängige Namen und Listen).
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const E = U.EPOCHE;
  const L = window.HTBAH.ZufallsgeneratorOrtListen;

  function namensListenFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return {
        prefix: L.GEGENWART_PREFIX,
        kern: L.GEGENWART_KERN,
        suffix: L.GEGENWART_SUFFIX,
      };
    }
    if (epoche === E.ZUKUNFT) {
      return {
        prefix: L.ZUKUNFT_PREFIX,
        kern: L.ZUKUNFT_KERN,
        suffix: L.ZUKUNFT_SUFFIX,
      };
    }
    return {
      prefix: L.PREFIX,
      kern: L.KERN,
      suffix: L.SUFFIX,
    };
  }

  function nameFuerEpoche(epoche) {
    const listen = namensListenFuerEpoche(epoche);
    const nameCore = U.zufaellig(listen.prefix) + U.zufaellig(listen.kern) + U.zufaellig(listen.suffix);
    return nameCore.trim().replace(/^./, (c) => c.toUpperCase());
  }

  function groesseListeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return [...L.GROESSE, ...L.GROESSE_GEGENWART];
    }
    if (epoche === E.ZUKUNFT) {
      return [...L.GROESSE, ...L.GROESSE_ZUKUNFT];
    }
    return L.GROESSE;
  }

  function lageListeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return [...L.LAGE, ...L.LAGE_GEGENWART];
    }
    if (epoche === E.ZUKUNFT) {
      return [...L.LAGE, ...L.LAGE_ZUKUNFT];
    }
    return L.LAGE;
  }

  function zustandListeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return L.ZUSTAND_GEGENWART;
    }
    if (epoche === E.ZUKUNFT) {
      return L.ZUSTAND_ZUKUNFT;
    }
    return L.ZUSTAND;
  }

  function geruechtListeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return L.GERUECHT_GEGENWART;
    }
    if (epoche === E.ZUKUNFT) {
      return L.GERUECHT_ZUKUNFT;
    }
    return L.GERUECHT;
  }

  function bekanntFuerListeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return L.BEKANNT_FUER_GEGENWART;
    }
    if (epoche === E.ZUKUNFT) {
      return L.BEKANNT_FUER_ZUKUNFT;
    }
    return L.BEKANNT_FUER;
  }

  function atmosphaereListeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return L.ATMOSPHAERE_GEGENWART;
    }
    if (epoche === E.ZUKUNFT) {
      return L.ATMOSPHAERE_ZUKUNFT;
    }
    return L.ATMOSPHAERE;
  }

  function notizenHtmlFuerEpoche(epoche) {
    const atmosphaere = U.zufaellig(atmosphaereListeFuerEpoche(epoche));
    const geruecht = U.zufaellig(geruechtListeFuerEpoche(epoche));
    const bekanntFuer = U.zufaellig(bekanntFuerListeFuerEpoche(epoche));
    return [
      `<p>${U.htmlEsc(atmosphaere)}</p>`,
      `<p>${U.htmlEsc(geruecht)}</p>`,
      `<p><strong>Bekannt für:</strong> ${U.htmlEsc(bekanntFuer)}.</p>`,
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

  window.HTBAH.ZufallsgeneratorOrtModul = {
    groesseOptionenFuerEpoche(epoche) {
      const ep = epoche || E.MITTELALTER;
      return groesseListeFuerEpoche(ep);
    },

    lageOptionenFuerEpoche(epoche) {
      const ep = epoche || E.MITTELALTER;
      return lageListeFuerEpoche(ep);
    },

    /**
     * @param {{ epoche?: string, groesse?: string, lage?: string, name?: string }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const groesseListe = groesseListeFuerEpoche(epoche);
      const lageListe = lageListeFuerEpoche(epoche);
      const name =
        opts && typeof opts.name === 'string' && opts.name.trim()
          ? opts.name.trim()
          : nameFuerEpoche(epoche);
      const groesse = wertAusListeOderZufaellig(opts && opts.groesse, groesseListe);
      const lage = wertAusListeOderZufaellig(opts && opts.lage, lageListe);
      const zustand = U.zufaellig(zustandListeFuerEpoche(epoche));
      const notizenHtml = notizenHtmlFuerEpoche(epoche);
      return { name, groesse, lage, zustand, notizenHtml };
    },
  };
})();
