/**
 * NPC-Zufallsgenerator.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const L = window.HTBAH.ZufallsgeneratorNpcListen;

  window.HTBAH.ZufallsgeneratorNpcModul = {
    generiere() {
      const maennlich = Math.random() < 0.5;
      const vor = maennlich ? U.zufaellig(L.VORNAMEN_M) : U.zufaellig(L.VORNAMEN_W);
      const nach = U.zufaellig(L.NACHNAMEN);
      const name = `${vor} ${nach}`;
      const geschlecht = maennlich ? 'Männlich' : 'Weiblich';
      const alter = String(U.zufallsInt(16, 72));
      const ziel = U.zufaellig(L.ZIEL);

      const notizenHtml = [
        `<p><strong>Eindruck:</strong> ${U.htmlEsc(U.zufaellig(L.EINDRUCK))}.</p>`,
        `<p><strong>Merkmal:</strong> ${U.htmlEsc(U.zufaellig(L.MERKMAL))}.</p>`,
      ].join('');

      return {
        name,
        spitzname: U.zufaellig(L.SPITZNAMEN),
        geschlecht,
        alter,
        familienstand: U.zufaellig(L.FAMILIENSTAND),
        statur: U.zufaellig(L.STATUR),
        gesinnung: U.zufaellig(L.GESINNUNG),
        beruf: U.zufaellig(L.BERUF),
        ziel,
        notizenHtml,
      };
    },
  };
})();
