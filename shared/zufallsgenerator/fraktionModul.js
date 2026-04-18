/**
 * Fraktions-Zufallsgenerator (epochenabhängige Namen).
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

  window.HTBAH.ZufallsgeneratorFraktionModul = {
    /**
     * @param {{ epoche?: string }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const art = U.zufaellig(L.ARTEN);
      const name = nameFuerEpoche(epoche);
      const ziel = U.zufaellig(L.ZIELE);
      const gesinnungVerhalten = U.zufaellig(L.GESINNUNG_VERHALTEN);

      const beschreibungHtml = [
        `<p><strong>Art:</strong> ${U.htmlEsc(art)} · <strong>Epoche (Name):</strong> ${U.htmlEsc(epoche)}</p>`,
        `<p><strong>Öffentliches Bild:</strong> ${U.htmlEsc(
          U.zufaellig([
            'wird als unnahbar beschrieben',
            'gilt als „praktisch“ und lästig für Behörden',
            'hat Sympathien in der Bevölkerung',
            'wird gefürchtet, aber kaum verstanden',
            'tritt als Wohltäter auf, Hintergrund unklar',
            'ist in Gerüchten allgegenwärtig',
          ]),
        )}</p>`,
        `<p><strong>Interne Dynamik:</strong> ${U.htmlEsc(
          U.zufaellig([
            'Führungsstreit zwischen Alten und Jungen',
            'Spitzelverdacht lastet auf mehreren Mitgliedern',
            'starker Mentor-Kult um eine Figur',
            'Rituale halten die Gruppe zusammen',
            'knappes Budget zwingt zu riskanten Jobs',
          ]),
        )}</p>`,
      ].join('');

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
