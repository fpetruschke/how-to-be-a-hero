/**
 * Pantheon-/Gottheiten-Zufallsgenerator.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const L = window.HTBAH.ZufallsgeneratorPantheonListen;

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

  window.HTBAH.ZufallsgeneratorPantheonModul = {
    generiere() {
      const name = nameGenerieren();
      const geschlecht = U.zufaellig(L.GESCHLECHT);
      const domaene = U.zufaellig(L.DOMAENEN);
      const charakter = U.zufaellig(L.CHARAKTER);
      const staerke = U.zufaellig(L.STAERKEN);
      const schwaeche = U.zufaellig(L.SCHWAECHEN);
      const schutzpatronat = U.zufaellig(L.SCHUTZPATRONAT);
      const verlangen = U.zufaellig(L.VERLANGEN);
      const mythosGaben = U.zufaellig(L.MYTHOS_GABEN);

      const notizenHtml = [
        `<p><strong>Kult-Stimmung:</strong> ${U.htmlEsc(
          U.zufaellig([
            'öffentlich geduldet, privat geliebt',
            'nur in einer Region wirklich präsent',
            'verboten — aber überall',
            'elitär, teure Einweihung',
            'volksnah, laut, farbenfroh',
          ]),
        )}</p>`,
        `<p><strong>Rivale im Mythos:</strong> ${U.htmlEsc(
          U.zufaellig([
            'eine Wassergottheit, mit der sie ewige Fehde hat',
            'ein abtrünniger Heiliger, der als Dämon läuft',
            'ein sterblicher Held, den sie neidisch macht',
            'niemand — sie ist isoliert und seltsam',
          ]),
        )}</p>`,
      ].join('');

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
