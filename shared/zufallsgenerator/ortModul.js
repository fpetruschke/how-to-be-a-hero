/**
 * Orts-Zufallsgenerator.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const L = window.HTBAH.ZufallsgeneratorOrtListen;

  window.HTBAH.ZufallsgeneratorOrtModul = {
    generiere() {
      const nameCore = U.zufaellig(L.PREFIX) + U.zufaellig(L.KERN) + U.zufaellig(L.SUFFIX);
      const name = nameCore.trim().replace(/^./, (c) => c.toUpperCase());
      const groesse = U.zufaellig(L.GROESSE);
      const lage = U.zufaellig(L.LAGE);
      const zustand = U.zufaellig(L.ZUSTAND);
      const notizenHtml = [
        `<p>${U.htmlEsc(U.zufaellig(L.GERUECHT))}</p>`,
        `<p><strong>Bekannt für:</strong> ${U.htmlEsc(U.zufaellig(L.BEKANNT_FUER))}.</p>`,
      ].join('');
      return { name, groesse, lage, zustand, notizenHtml };
    },
  };
})();
