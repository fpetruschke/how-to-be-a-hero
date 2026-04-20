/**
 * NPC-Zufallsgenerator.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const E = U.EPOCHE;
  const L = window.HTBAH.ZufallsgeneratorNpcListen;

  function berufFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return U.zufaellig(L.BERUF_GEGENWART);
    }
    if (epoche === E.ZUKUNFT) {
      return U.zufaellig(L.BERUF_ZUKUNFT);
    }
    return U.zufaellig(L.BERUF_MITTELALTER);
  }

  function zielFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return U.zufaellig(L.ZIEL_GEGENWART);
    }
    if (epoche === E.ZUKUNFT) {
      return U.zufaellig(L.ZIEL_ZUKUNFT);
    }
    return U.zufaellig(L.ZIEL_MITTELALTER);
  }

  function waffeFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return U.gewichtet(L.WAFFE_GEGENWART.map((w) => ({ wert: w, gewicht: w.gewicht })));
    }
    if (epoche === E.ZUKUNFT) {
      return U.gewichtet(L.WAFFE_ZUKUNFT.map((w) => ({ wert: w, gewicht: w.gewicht })));
    }
    return U.gewichtet(L.WAFFE_MITTELALTER.map((w) => ({ wert: w, gewicht: w.gewicht })));
  }

  /** Schadensnotation wie bei Waffen (z. B. 1W10+2), für Fäuste/Tritte nach Statur abgestuft. */
  function waffenloserNahkampfSchaden(statur) {
    const stark = ['Kräftig', 'Athletisch', 'Breitschultrig', 'Stämmig'];
    const mittel = ['Schlank', 'Groß', 'Untersetzt', 'Schwerfällig'];
    const gering = ['Klein', 'Zierlich', 'Dünn', 'Hager'];
    if (stark.indexOf(statur) !== -1) {
      return U.zufaellig(['2W10', '1W10+3', '2W10+1', '1W10+4']);
    }
    if (mittel.indexOf(statur) !== -1) {
      return U.zufaellig(['1W10+1', '1W10+2', '2W10']);
    }
    if (gering.indexOf(statur) !== -1) {
      return U.zufaellig(['1W10', '1W10+1', '1W10-1']);
    }
    return U.zufaellig(['1W10', '1W10+1']);
  }

  function lebenspunkteFuerStaturUndAlter(statur, alterStr) {
    let lp = 70 + U.zufallsInt(-15, 26);
    const stark = ['Kräftig', 'Athletisch', 'Breitschultrig', 'Stämmig'];
    const gering = ['Klein', 'Zierlich', 'Dünn', 'Hager'];
    if (stark.indexOf(statur) !== -1) {
      lp += U.zufallsInt(5, 21);
    } else if (gering.indexOf(statur) !== -1) {
      lp -= U.zufallsInt(5, 21);
    }
    const alter = parseInt(String(alterStr || '').trim(), 10);
    if (!Number.isNaN(alter)) {
      if (alter > 65) {
        lp -= U.zufallsInt(5, 21);
      } else if (alter < 26) {
        lp += U.zufallsInt(0, 16);
      }
    }
    lp = Math.max(28, Math.min(125, lp));
    return String(lp);
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

  function fraktionAusFraktionenListe(fraktionNamen) {
    if (!Array.isArray(fraktionNamen) || !fraktionNamen.length) {
      return '';
    }
    const namen = fraktionNamen
      .map((n) => (typeof n === 'string' ? n.trim() : ''))
      .filter(Boolean);
    if (!namen.length) {
      return '';
    }
    return U.zufaellig(namen);
  }

  window.HTBAH.ZufallsgeneratorNpcModul = {
    /**
     * @param {{ epoche?: string, orteNamen?: string[], fraktionNamen?: string[], pantheonNamen?: string[] }} opts — orteNamen: Namen aus der Orte-Tabelle; fraktionNamen: Namen aus der Fraktionen-Tabelle; pantheonNamen: Gottheitsnamen aus der Pantheon-Tabelle (für Glaube, wie Fraktion zufällig wenn vorhanden).
     */
    generiere(opts) {
      opts = opts || {};
      const epoche = opts.epoche || E.MITTELALTER;
      const maennlich = Math.random() < 0.5;
      const vor = maennlich ? U.zufaellig(L.VORNAMEN_M) : U.zufaellig(L.VORNAMEN_W);
      const nach = U.zufaellig(L.NACHNAMEN);
      const name = `${vor} ${nach}`;
      const geschlecht = maennlich ? 'Männlich' : 'Weiblich';
      const alter = String(U.zufallsInt(16, 72));
      const ziel = zielFuerEpoche(epoche);
      const beruf = berufFuerEpoche(epoche);
      const stimme = U.zufaellig(L.STIMME);
      const waffe = waffeFuerEpoche(epoche);
      const statur = U.zufaellig(L.STATUR);
      const lebenspunkte = lebenspunkteFuerStaturUndAlter(statur, alter);
      const schadenWaffenlos = waffenloserNahkampfSchaden(statur);

      const aufenthaltsort = aufenthaltsortAusOrteListe(opts.orteNamen);
      const fraktion = fraktionAusFraktionenListe(opts.fraktionNamen);
      const glaube = fraktionAusFraktionenListe(opts.pantheonNamen);

      const notizenHtml = [
        `<p><strong>Eindruck:</strong> ${U.htmlEsc(U.zufaellig(L.EINDRUCK))}.</p>`,
        `<p><strong>Merkmal:</strong> ${U.htmlEsc(U.zufaellig(L.MERKMAL))}.</p>`,
        `<p><strong>Lebenspunkte:</strong> ${U.htmlEsc(lebenspunkte)}.</p>`,
        `<p><strong>Waffenloser Nahkampf (Fäuste, Tritte):</strong> ${U.htmlEsc(schadenWaffenlos)}.</p>`,
        `<p><strong>Stimme:</strong> ${U.htmlEsc(stimme)}.</p>`,
        `<p><strong>Waffe:</strong> ${U.htmlEsc(waffe.name)} (${U.htmlEsc(waffe.schadenswert)}, ${U.htmlEsc(
          waffe.kampfart === 'fernkampf' ? 'Fernkampf' : 'Nahkampf',
        )}).</p>`,
      ].join('');

      return {
        name,
        spitzname: U.zufaellig(L.SPITZNAMEN),
        geschlecht,
        alter,
        familienstand: U.zufaellig(L.FAMILIENSTAND),
        statur,
        gesinnung: U.zufaellig(L.GESINNUNG),
        beruf,
        ziel,
        stimme,
        waffe: waffe.name,
        schadenswert: waffe.schadenswert,
        kampfart: waffe.kampfart,
        lebenspunkte,
        aufenthaltsort,
        fraktion,
        glaube,
        notizenHtml,
      };
    },
  };
})();
