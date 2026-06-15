/**
 * Pantheon-/Gottheiten-Zufallsgenerator (epochenabhängige Notizen).
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const E = U.EPOCHE;
  const L = window.HTBAH.ZufallsgeneratorPantheonListen;

  function listeFuerEpoche(epoche, basis, gegenwart, zukunft) {
    if (epoche === E.GEGENWART) {
      return gegenwart;
    }
    if (epoche === E.ZUKUNFT) {
      return zukunft;
    }
    return basis;
  }

  function nameGenerieren() {
    if (Math.random() < 0.45) {
      const p = U.zufaellig(L.NAMEN_PREFIX);
      const s = U.zufaellig(L.NAMEN_SUFFIX);
      const titel = U.zufaellig(L.NAMEN_TITEL);
      return `${p}${s}, ${titel}`;
    }
    const p = U.zufaellig(L.NAMEN_PREFIX);
    const s = U.zufaellig(L.NAMEN_SUFFIX);
    return `${p}${s}`;
  }

  function notizenHtmlFuerEpoche(epoche) {
    const atmosphaere = U.zufaellig(
      listeFuerEpoche(epoche, L.ATMOSPHAERE, L.ATMOSPHAERE_GEGENWART, L.ATMOSPHAERE_ZUKUNFT),
    );
    const kult = U.zufaellig(
      listeFuerEpoche(
        epoche,
        L.KULT_STIMMUNG,
        L.KULT_STIMMUNG_GEGENWART,
        L.KULT_STIMMUNG_ZUKUNFT,
      ),
    );
    const rivale = U.zufaellig(
      listeFuerEpoche(epoche, L.RIVALE, L.RIVALE_GEGENWART, L.RIVALE_ZUKUNFT),
    );
    return [
      `<p>${U.htmlEsc(atmosphaere)}</p>`,
      `<p><strong>Kult-Stimmung:</strong> ${U.htmlEsc(kult)}</p>`,
      `<p><strong>Rivale im Mythos:</strong> ${U.htmlEsc(rivale)}</p>`,
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

  window.HTBAH.ZufallsgeneratorPantheonModul = {
    domaenenOptionen() {
      return L.DOMAENEN.slice();
    },

    /**
     * @param {{ epoche?: string, domaene?: string }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const name = nameGenerieren();
      const geschlecht = U.zufaellig(L.GESCHLECHT);
      const domaene = wertAusListeOderZufaellig(opts && opts.domaene, L.DOMAENEN);
      const charakter = U.zufaellig(L.CHARAKTER);
      const staerke = U.zufaellig(L.STAERKEN);
      const schwaeche = U.zufaellig(L.SCHWAECHEN);
      const schutzpatronat = U.zufaellig(
        listeFuerEpoche(
          epoche,
          L.SCHUTZPATRONAT,
          L.SCHUTZPATRONAT_GEGENWART,
          L.SCHUTZPATRONAT_ZUKUNFT,
        ),
      );
      const verlangen = U.zufaellig(L.VERLANGEN);
      const mythosGaben = U.zufaellig(L.MYTHOS_GABEN);
      const notizenHtml = notizenHtmlFuerEpoche(epoche);

      return {
        name,
        geschlecht,
        domaene,
        charakter,
        staerke,
        schwaeche,
        schutzpatronat,
        verlangen,
        mythosGaben,
        notizenHtml,
      };
    },
  };
})();
