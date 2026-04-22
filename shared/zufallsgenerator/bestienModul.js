/**
 * Bestarium-Zufallsgenerator (Epoche, Kategorie).
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const E = U.EPOCHE;
  const L = window.HTBAH.ZufallsgeneratorBestienListen;

  const KAT = {
    NORM: 'normales_tier',
    FANTASY: 'fantasy_tier',
    MUTANT: 'mutiert',
    MONSTER: 'monster',
  };

  function w10MitMod(maxW = 4) {
    const w = U.zufallsInt(1, maxW);
    const mod = U.zufallsInt(0, 5);
    if (mod === 0) {
      return `${w}W10`;
    }
    return `${w}W10+${mod}`;
  }

  function verteidigungWert(kategorie) {
    if (kategorie === KAT.NORM) {
      return Math.random() < 0.55 ? String(U.zufallsInt(3, 18)) : w10MitMod(2);
    }
    if (kategorie === KAT.FANTASY) {
      return Math.random() < 0.45 ? String(U.zufallsInt(6, 28)) : w10MitMod(3);
    }
    if (kategorie === KAT.MUTANT) {
      return Math.random() < 0.4 ? String(U.zufallsInt(8, 32)) : w10MitMod(3);
    }
    return Math.random() < 0.35 ? String(U.zufallsInt(10, 40)) : w10MitMod(4);
  }

  function lebenspunkteWert(kategorie) {
    if (kategorie === KAT.NORM) {
      return Math.random() < 0.5 ? String(U.zufallsInt(6, 42)) : w10MitMod(3);
    }
    if (kategorie === KAT.FANTASY) {
      return Math.random() < 0.45 ? String(U.zufallsInt(12, 70)) : w10MitMod(4);
    }
    if (kategorie === KAT.MUTANT) {
      return Math.random() < 0.4 ? String(U.zufallsInt(14, 85)) : w10MitMod(4);
    }
    return Math.random() < 0.35 ? String(U.zufallsInt(20, 120)) : w10MitMod(4);
  }

  function angriffWert(kategorie) {
    if (kategorie === KAT.NORM) {
      return Math.random() < 0.35 ? String(U.zufallsInt(2, 12)) : w10MitMod(2);
    }
    if (kategorie === KAT.FANTASY) {
      return w10MitMod(3);
    }
    if (kategorie === KAT.MUTANT) {
      return w10MitMod(3);
    }
    return w10MitMod(4);
  }

  function listenSchluesselFuerName(epoche, kategorie) {
    const ep =
      epoche === E.GEGENWART ? 'GEGENWART' : epoche === E.ZUKUNFT ? 'ZUKUNFT' : 'MITTELALTER';
    if (kategorie === KAT.NORM) {
      return `NORM_${ep}`;
    }
    if (kategorie === KAT.FANTASY) {
      return `FANTASY_${ep}`;
    }
    if (kategorie === KAT.MUTANT) {
      return `MUTANT_${ep}`;
    }
    return `MONSTER_${ep}`;
  }

  function nameFuer(epoche, kategorie) {
    const key = listenSchluesselFuerName(epoche, kategorie);
    const arr = L[key];
    if (Array.isArray(arr) && arr.length) {
      return U.zufaellig(arr);
    }
    return 'Unbenannte Bestie';
  }

  function lebensraumFuer(epoche) {
    const ep =
      epoche === E.GEGENWART ? 'GEGENWART' : epoche === E.ZUKUNFT ? 'ZUKUNFT' : 'MITTELALTER';
    const arr = L[`LEBENSRAUM_${ep}`];
    if (Array.isArray(arr) && arr.length) {
      return U.zufaellig(arr);
    }
    return 'Unbekanntes Terrain';
  }

  function optionalText(listeKey, chance) {
    const arr = L[listeKey];
    if (!Array.isArray(arr) || !arr.length || Math.random() > chance) {
      return '';
    }
    return U.zufaellig(arr);
  }

  function kategorieGewichtet(epoche) {
    const zukunftTech = epoche === E.ZUKUNFT;
    return U.gewichtet([
      { wert: KAT.NORM, gewicht: zukunftTech ? 22 : 32 },
      { wert: KAT.FANTASY, gewicht: zukunftTech ? 28 : 26 },
      { wert: KAT.MUTANT, gewicht: zukunftTech ? 30 : 22 },
      { wert: KAT.MONSTER, gewicht: zukunftTech ? 20 : 20 },
    ]);
  }

  function aggressivitaetFuer(kategorie) {
    const basis =
      kategorie === KAT.NORM
        ? U.zufallsInt(1, 7)
        : kategorie === KAT.FANTASY
          ? U.zufallsInt(2, 9)
          : kategorie === KAT.MUTANT
            ? U.zufallsInt(3, 10)
            : U.zufallsInt(4, 10);
    const jitter = U.zufallsInt(-1, 1);
    return Math.min(10, Math.max(1, basis + jitter));
  }

  function beschreibungHtmlBauen({ name, lebensraum, kategorieLabel }) {
    const n = U.htmlEsc(name);
    const lr = U.htmlEsc(lebensraum);
    const kl = U.htmlEsc(kategorieLabel);
    return `<p><strong>${n}</strong> (${kl}) lebt typischerweise in oder nahe: ${lr}.</p><p>Verhalten und Jagdweise können je nach Beute, Jahreszeit und Nahrungsdruck stark variieren.</p>`;
  }

  window.HTBAH.ZufallsgeneratorBestienModul = {
    EPOCHE: E,
    KATEGORIEN: KAT,
    /**
     * @param {{ epoche?: string }} opts
     */
    generiere(opts) {
      const epoche = (opts && opts.epoche) || E.MITTELALTER;
      const kategorie = kategorieGewichtet(epoche);
      const name = nameFuer(epoche, kategorie);
      const angriff = angriffWert(kategorie);
      const verteidigung = verteidigungWert(kategorie);
      const lebenspunkte = lebenspunkteWert(kategorie);
      const staerke = optionalText('STAERKEN', 0.72);
      const schwaeche = optionalText('SCHWAECHEN', 0.72);
      const aggressivitaetSkala = aggressivitaetFuer(kategorie);
      const lebensraum = lebensraumFuer(epoche);
      const katLabels = {
        [KAT.NORM]: 'normales Tier',
        [KAT.FANTASY]: 'magisches / Fantasy-Tier',
        [KAT.MUTANT]: 'mutiertes Wesen',
        [KAT.MONSTER]: 'Monster',
      };
      const beschreibungHtml = beschreibungHtmlBauen({
        name,
        lebensraum,
        kategorieLabel: katLabels[kategorie] || 'Bestie',
      });
      return {
        epoche,
        kategorie,
        name,
        angriff,
        verteidigung,
        lebenspunkte,
        staerke,
        schwaeche,
        aggressivitaetSkala,
        beschreibungHtml,
      };
    },
  };
})();
