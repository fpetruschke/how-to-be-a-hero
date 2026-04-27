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

  function geheimnisFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return U.zufaellig(L.GEHEIMNIS_GEGENWART);
    }
    if (epoche === E.ZUKUNFT) {
      return U.zufaellig(L.GEHEIMNIS_ZUKUNFT);
    }
    return U.zufaellig(L.GEHEIMNIS_MITTELALTER);
  }

  function berufsProfil(beruf) {
    const b = String(beruf || '').toLowerCase();
    const istWissen = ['gelehrter', 'bibliothekar', 'archivarin', 'wissenschaftler', 'it-administrator', 'programmierer', 'nanomediziner', 'heiler', 'schreiber'].some((s) => b.includes(s));
    const istSozial = ['händler', 'gastwirt', 'barde', 'anwältin', 'journalistin', 'unterhändlerin', 'influencer', 'advokat', 'kellner'].some((s) => b.includes(s));
    const istKampf = ['wache', 'soldat', 'sicherheits', 'leibwächter', 'söldner', 'polizist', 'scharfschütze', 'ranger', 'jäger'].some((s) => b.includes(s));
    if (istWissen) {
      return { handelnMin: 8, handelnMax: 14, wissenMin: 16, wissenMax: 24, sozialesMin: 6, sozialesMax: 16, fernkampfBonus: 2, nahkampfBonus: -2, schwereWaffenMalus: true };
    }
    if (istSozial) {
      return { handelnMin: 8, handelnMax: 14, wissenMin: 8, wissenMax: 14, sozialesMin: 14, sozialesMax: 24, fernkampfBonus: 0, nahkampfBonus: -2, schwereWaffenMalus: true };
    }
    if (istKampf) {
      return { handelnMin: 16, handelnMax: 24, wissenMin: 4, wissenMax: 12, sozialesMin: 4, sozialesMax: 14, fernkampfBonus: 1, nahkampfBonus: 2, schwereWaffenMalus: false };
    }
    return { handelnMin: 10, handelnMax: 18, wissenMin: 6, wissenMax: 16, sozialesMin: 6, sozialesMax: 16, fernkampfBonus: 0, nahkampfBonus: 0, schwereWaffenMalus: false };
  }

  function staturAusAlterUndBeruf(alter, beruf) {
    const staturen = [];
    const alterNum = Number(alter);
    const profil = berufsProfil(beruf);
    const basis = L.STATUR || [];
    for (let i = 0; i < basis.length; i += 1) {
      const s = basis[i];
      let gewicht = 1;
      if (['Athletisch', 'Kräftig', 'Breitschultrig'].indexOf(s) !== -1) {
        gewicht += profil.nahkampfBonus > 0 ? 2 : 0;
        if (Number.isFinite(alterNum) && alterNum >= 55) {
          gewicht -= 1;
        }
      }
      if (['Schwerfällig', 'Hager'].indexOf(s) !== -1 && Number.isFinite(alterNum) && alterNum >= 60) {
        gewicht += 2;
      }
      if (['Zierlich', 'Schlank'].indexOf(s) !== -1 && profil.schwereWaffenMalus) {
        gewicht += 1;
      }
      staturen.push({ wert: s, gewicht: Math.max(1, gewicht) });
    }
    return U.gewichtet(staturen);
  }

  function waffeFuerBerufUndEpoche(beruf, epoche) {
    const profil = berufsProfil(beruf);
    let basis = L.WAFFE_MITTELALTER;
    if (epoche === E.GEGENWART) {
      basis = L.WAFFE_GEGENWART;
    } else if (epoche === E.ZUKUNFT) {
      basis = L.WAFFE_ZUKUNFT;
    }
    const gewichtet = basis.map((w) => {
      let gewicht = Number(w.gewicht) || 1;
      if (w.kampfart === 'fernkampf') {
        gewicht += profil.fernkampfBonus;
      } else {
        gewicht += profil.nahkampfBonus;
      }
      if (profil.schwereWaffenMalus && /^3W10|^4W10/.test(String(w.schadenswert || ''))) {
        gewicht -= 3;
      }
      return { wert: w, gewicht: Math.max(1, gewicht) };
    });
    return U.gewichtet(gewichtet);
  }

  function dualeWaffenwerte(waffe, statur) {
    const basis = typeof waffe?.schadenswert === 'string' ? waffe.schadenswert : '';
    let schadenswertNahkampf = typeof waffe?.schadenswertNahkampf === 'string'
      ? waffe.schadenswertNahkampf
      : '';
    let schadenswertFernkampf = typeof waffe?.schadenswertFernkampf === 'string'
      ? waffe.schadenswertFernkampf
      : '';
    if (!schadenswertNahkampf && !schadenswertFernkampf && basis) {
      if (waffe.kampfart === 'fernkampf') {
        schadenswertFernkampf = basis;
      } else {
        schadenswertNahkampf = basis;
      }
    }
    if (!schadenswertNahkampf && Math.random() < 0.25) {
      schadenswertNahkampf = waffenloserNahkampfSchaden(statur);
    }
    if (!schadenswertFernkampf && Math.random() < 0.2) {
      schadenswertFernkampf = U.zufaellig(['1W10+2', '2W10', '2W10+1']);
    }
    return { schadenswertNahkampf, schadenswertFernkampf };
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

  function begabungswerteVerteilen(beruf) {
    // Regelwerk: 400 Fähigkeitspunkte gesamt -> max. Begabungswert pro Gruppe 40.
    const gesamt = 40;
    const profil = berufsProfil(beruf);
    const handeln = U.zufallsInt(profil.handelnMin, profil.handelnMax);
    const wissen = U.zufallsInt(profil.wissenMin, profil.wissenMax);
    let soziales = gesamt - handeln - wissen;
    if (soziales < profil.sozialesMin) {
      soziales = profil.sozialesMin;
    }
    soziales = Math.min(profil.sozialesMax, soziales);
    return { handeln, wissen, soziales: Math.max(0, soziales) };
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
      const waffe = waffeFuerBerufUndEpoche(beruf, epoche);
      const statur = staturAusAlterUndBeruf(alter, beruf);
      const waffenwerte = dualeWaffenwerte(waffe, statur);
      const geheimnis = geheimnisFuerEpoche(epoche);
      const lebenspunkte = lebenspunkteFuerStaturUndAlter(statur, alter);
      const schadenWaffenlos = waffenloserNahkampfSchaden(statur);
      const begabung = begabungswerteVerteilen(beruf);

      const aufenthaltsort = aufenthaltsortAusOrteListe(opts.orteNamen);
      const fraktion = fraktionAusFraktionenListe(opts.fraktionNamen);
      const glaube = fraktionAusFraktionenListe(opts.pantheonNamen);

      const notizenHtml = [
        `<p><strong>Eindruck:</strong> ${U.htmlEsc(U.zufaellig(L.EINDRUCK))}.</p>`,
        `<p><strong>Merkmal:</strong> ${U.htmlEsc(U.zufaellig(L.MERKMAL))}.</p>`,
        `<p><strong>Lebenspunkte:</strong> ${U.htmlEsc(lebenspunkte)}.</p>`,
        `<p><strong>Waffenloser Nahkampf (Fäuste, Tritte):</strong> ${U.htmlEsc(schadenWaffenlos)}.</p>`,
        `<p><strong>Stimme:</strong> ${U.htmlEsc(stimme)}.</p>`,
        `<p><strong>Geheimnis:</strong> ${U.htmlEsc(geheimnis)}.</p>`,
        `<p><strong>Waffe:</strong> ${U.htmlEsc(waffe.name)}${waffenwerte.schadenswertNahkampf ? ` · Nahkampf ${U.htmlEsc(waffenwerte.schadenswertNahkampf)}` : ''}${waffenwerte.schadenswertFernkampf ? ` · Fernkampf ${U.htmlEsc(waffenwerte.schadenswertFernkampf)}` : ''}.</p>`,
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
        geheimnis,
        stimme,
        waffe: waffe.name,
        schadenswertNahkampf: waffenwerte.schadenswertNahkampf,
        schadenswertFernkampf: waffenwerte.schadenswertFernkampf,
        lebenspunkte,
        aufenthaltsort,
        handeln: begabung.handeln,
        wissen: begabung.wissen,
        soziales: begabung.soziales,
        fraktion,
        glaube,
        notizenHtml,
      };
    },
  };
})();
