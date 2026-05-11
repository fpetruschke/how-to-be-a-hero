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

  function zufallsNameUndGeschlecht(vorgabe) {
    let maennlich;
    if (vorgabe === 'Männlich') {
      maennlich = true;
    } else if (vorgabe === 'Weiblich') {
      maennlich = false;
    } else {
      maennlich = Math.random() < 0.5;
    }
    const vor = maennlich ? U.zufaellig(L.VORNAMEN_M) : U.zufaellig(L.VORNAMEN_W);
    const nach = U.zufaellig(L.NACHNAMEN);
    return {
      name: `${vor} ${nach}`,
      geschlecht: maennlich ? 'Männlich' : 'Weiblich',
    };
  }

  /** Wählt eine Stimme passend zum Alter (gewichtet). */
  function stimmeFuerAlter(alterStr) {
    const alter = parseInt(String(alterStr || '').trim(), 10);
    if (!Number.isFinite(alter)) {
      return U.zufaellig(L.STIMME);
    }
    const gewichtet = (L.STIMME || []).map((stimme) => {
      const s = String(stimme).toLowerCase();
      let gewicht = 1;
      const wirktAlt = s.includes('brüchig') || s.includes('alter') || s.includes('heiser');
      const wirktJung = s.includes('hell') || s.includes('hastig') || s.includes('schnell');
      if (alter >= 60 && wirktAlt) {
        gewicht += 3;
      }
      if (alter < 25 && wirktAlt) {
        gewicht = 0.05;
      }
      if (alter < 25 && wirktJung) {
        gewicht += 2;
      }
      if (alter >= 65 && wirktJung) {
        gewicht = 0.3;
      }
      return { wert: stimme, gewicht: Math.max(0.05, gewicht) };
    });
    return U.gewichtet(gewichtet);
  }

  /** Liefert die Berufeliste zur Epoche (für UI/Autocomplete). */
  function berufslisteFuerEpoche(epoche) {
    if (epoche === E.GEGENWART) {
      return (L.BERUF_GEGENWART || []).slice();
    }
    if (epoche === E.ZUKUNFT) {
      return (L.BERUF_ZUKUNFT || []).slice();
    }
    return (L.BERUF_MITTELALTER || []).slice();
  }

  function basisKontextFuerNeuberechnung(zeile, opts) {
    const z = zeile || {};
    const o = opts || {};
    return {
      epoche: o.epoche || E.MITTELALTER,
      orteNamen: Array.isArray(o.orteNamen) ? o.orteNamen : [],
      fraktionNamen: Array.isArray(o.fraktionNamen) ? o.fraktionNamen : [],
      pantheonNamen: Array.isArray(o.pantheonNamen) ? o.pantheonNamen : [],
      alter: String(z.alter || ''),
      beruf: String(z.beruf || ''),
      statur: String(z.statur || ''),
      waffe: String(z.waffe || ''),
    };
  }

  function neuFeldUndAbhaengige(zeile, feld, opts) {
    const kontext = basisKontextFuerNeuberechnung(zeile, opts);
    const patch = {};
    if (feld === 'name' || feld === 'geschlecht') {
      const ng = zufallsNameUndGeschlecht();
      patch.name = ng.name;
      patch.geschlecht = ng.geschlecht;
      return patch;
    }
    if (feld === 'spitzname') {
      patch.spitzname = U.zufaellig(L.SPITZNAMEN);
      return patch;
    }
    if (feld === 'familienstand') {
      patch.familienstand = U.zufaellig(L.FAMILIENSTAND);
      return patch;
    }
    if (feld === 'gesinnung') {
      patch.gesinnung = U.zufaellig(L.GESINNUNG);
      return patch;
    }
    if (feld === 'ziel') {
      patch.ziel = zielFuerEpoche(kontext.epoche);
      return patch;
    }
    if (feld === 'geheimnis') {
      patch.geheimnis = geheimnisFuerEpoche(kontext.epoche);
      return patch;
    }
    if (feld === 'stimme') {
      patch.stimme = U.zufaellig(L.STIMME);
      return patch;
    }
    if (feld === 'aufenthaltsort') {
      patch.aufenthaltsort = aufenthaltsortAusOrteListe(kontext.orteNamen);
      return patch;
    }
    if (feld === 'fraktion') {
      patch.fraktion = fraktionAusFraktionenListe(kontext.fraktionNamen);
      return patch;
    }
    if (feld === 'glaube') {
      patch.glaube = fraktionAusFraktionenListe(kontext.pantheonNamen);
      return patch;
    }

    if (feld === 'alter') {
      const neuesAlter = String(U.zufallsInt(16, 72));
      patch.alter = neuesAlter;
      const wirksamerBeruf = kontext.beruf || berufFuerEpoche(kontext.epoche);
      const neueStatur = staturAusAlterUndBeruf(neuesAlter, wirksamerBeruf);
      patch.statur = neueStatur;
      patch.lebenspunkte = lebenspunkteFuerStaturUndAlter(neueStatur, neuesAlter);
      return patch;
    }

    if (feld === 'beruf') {
      const neuerBeruf = berufFuerEpoche(kontext.epoche);
      patch.beruf = neuerBeruf;
      const wirksamesAlter = kontext.alter || String(U.zufallsInt(16, 72));
      if (!kontext.alter) {
        patch.alter = wirksamesAlter;
      }
      const neueStatur = staturAusAlterUndBeruf(wirksamesAlter, neuerBeruf);
      patch.statur = neueStatur;
      const neueWaffe = waffeFuerBerufUndEpoche(neuerBeruf, kontext.epoche);
      patch.waffe = neueWaffe.name;
      const waffenwerte = dualeWaffenwerte(neueWaffe, neueStatur);
      patch.schadenswertNahkampf = waffenwerte.schadenswertNahkampf;
      patch.schadenswertFernkampf = waffenwerte.schadenswertFernkampf;
      patch.lebenspunkte = lebenspunkteFuerStaturUndAlter(neueStatur, wirksamesAlter);
      const begabung = begabungswerteVerteilen(neuerBeruf);
      patch.handeln = begabung.handeln;
      patch.wissen = begabung.wissen;
      patch.soziales = begabung.soziales;
      return patch;
    }

    if (feld === 'statur') {
      const wirksamesAlter = kontext.alter || String(U.zufallsInt(16, 72));
      const wirksamerBeruf = kontext.beruf || berufFuerEpoche(kontext.epoche);
      const neueStatur = staturAusAlterUndBeruf(wirksamesAlter, wirksamerBeruf);
      patch.statur = neueStatur;
      patch.lebenspunkte = lebenspunkteFuerStaturUndAlter(neueStatur, wirksamesAlter);
      return patch;
    }

    if (feld === 'waffe') {
      const wirksamerBeruf = kontext.beruf || berufFuerEpoche(kontext.epoche);
      const wirksameStatur = kontext.statur || staturAusAlterUndBeruf(kontext.alter, wirksamerBeruf);
      if (!kontext.statur) {
        patch.statur = wirksameStatur;
      }
      const neueWaffe = waffeFuerBerufUndEpoche(wirksamerBeruf, kontext.epoche);
      patch.waffe = neueWaffe.name;
      const waffenwerte = dualeWaffenwerte(neueWaffe, wirksameStatur);
      patch.schadenswertNahkampf = waffenwerte.schadenswertNahkampf;
      patch.schadenswertFernkampf = waffenwerte.schadenswertFernkampf;
      return patch;
    }

    if (feld === 'lebenspunkte') {
      const wirksameStatur = kontext.statur || staturAusAlterUndBeruf(kontext.alter, kontext.beruf);
      const wirksamesAlter = kontext.alter || String(U.zufallsInt(16, 72));
      if (!kontext.statur) {
        patch.statur = wirksameStatur;
      }
      if (!kontext.alter) {
        patch.alter = wirksamesAlter;
      }
      patch.lebenspunkte = lebenspunkteFuerStaturUndAlter(wirksameStatur, wirksamesAlter);
      return patch;
    }

    if (feld === 'begabung') {
      const wirksamerBeruf = kontext.beruf || berufFuerEpoche(kontext.epoche);
      if (!kontext.beruf) {
        patch.beruf = wirksamerBeruf;
      }
      const begabung = begabungswerteVerteilen(wirksamerBeruf);
      patch.handeln = begabung.handeln;
      patch.wissen = begabung.wissen;
      patch.soziales = begabung.soziales;
      return patch;
    }

    return patch;
  }

  function neuFeldEinzeln(zeile, feld, opts) {
    const kontext = basisKontextFuerNeuberechnung(zeile, opts);
    const patch = {};
    if (feld === 'name') {
      patch.name = zufallsNameUndGeschlecht().name;
      return patch;
    }
    if (feld === 'geschlecht') {
      patch.geschlecht = Math.random() < 0.5 ? 'Männlich' : 'Weiblich';
      return patch;
    }
    if (feld === 'spitzname') {
      patch.spitzname = U.zufaellig(L.SPITZNAMEN);
      return patch;
    }
    if (feld === 'alter') {
      patch.alter = String(U.zufallsInt(16, 72));
      return patch;
    }
    if (feld === 'familienstand') {
      patch.familienstand = U.zufaellig(L.FAMILIENSTAND);
      return patch;
    }
    if (feld === 'statur') {
      patch.statur = U.zufaellig(L.STATUR);
      return patch;
    }
    if (feld === 'gesinnung') {
      patch.gesinnung = U.zufaellig(L.GESINNUNG);
      return patch;
    }
    if (feld === 'beruf') {
      patch.beruf = berufFuerEpoche(kontext.epoche);
      return patch;
    }
    if (feld === 'ziel') {
      patch.ziel = zielFuerEpoche(kontext.epoche);
      return patch;
    }
    if (feld === 'geheimnis') {
      patch.geheimnis = geheimnisFuerEpoche(kontext.epoche);
      return patch;
    }
    if (feld === 'stimme') {
      patch.stimme = U.zufaellig(L.STIMME);
      return patch;
    }
    if (feld === 'waffe') {
      patch.waffe = waffeFuerEpoche(kontext.epoche).name;
      return patch;
    }
    if (feld === 'schadenswertNahkampf') {
      patch.schadenswertNahkampf = U.zufaellig(['1W10', '1W10+1', '1W10+2', '2W10']);
      return patch;
    }
    if (feld === 'schadenswertFernkampf') {
      patch.schadenswertFernkampf = U.zufaellig(['1W10+2', '2W10', '2W10+1', '3W10']);
      return patch;
    }
    if (feld === 'lebenspunkte') {
      patch.lebenspunkte = String(U.zufallsInt(45, 110));
      return patch;
    }
    if (feld === 'aufenthaltsort') {
      patch.aufenthaltsort = aufenthaltsortAusOrteListe(kontext.orteNamen);
      return patch;
    }
    if (feld === 'fraktion') {
      patch.fraktion = fraktionAusFraktionenListe(kontext.fraktionNamen);
      return patch;
    }
    if (feld === 'glaube') {
      patch.glaube = fraktionAusFraktionenListe(kontext.pantheonNamen);
      return patch;
    }
    if (feld === 'begabung') {
      patch.handeln = U.zufallsInt(8, 22);
      patch.wissen = U.zufallsInt(8, 22);
      patch.soziales = U.zufallsInt(8, 22);
      return patch;
    }
    return patch;
  }

  window.HTBAH.ZufallsgeneratorNpcModul = {
    abhaengigkeiten() {
      return [
        { ausloeser: 'alter', abhaengige: ['statur', 'lebenspunkte'] },
        { ausloeser: 'beruf', abhaengige: ['statur', 'waffe', 'schadenswertNahkampf', 'schadenswertFernkampf', 'lebenspunkte', 'handeln', 'wissen', 'soziales'] },
        { ausloeser: 'statur', abhaengige: ['lebenspunkte'] },
        { ausloeser: 'waffe', abhaengige: ['schadenswertNahkampf', 'schadenswertFernkampf'] },
      ];
    },
    neuBerechnenFeld(zeile, feld, opts) {
      const modus = opts && opts.modus === 'einzeln' ? 'einzeln' : 'mitAbhaengigen';
      if (!feld) {
        return {};
      }
      if (modus === 'einzeln') {
        return neuFeldEinzeln(zeile, feld, opts);
      }
      return neuFeldUndAbhaengige(zeile, feld, opts);
    },
    /**
     * @param {{ epoche?: string, orteNamen?: string[], fraktionNamen?: string[], pantheonNamen?: string[] }} opts — orteNamen: Namen aus der Orte-Tabelle; fraktionNamen: Namen aus der Fraktionen-Tabelle; pantheonNamen: Gottheitsnamen aus der Pantheon-Tabelle (für Glaube, wie Fraktion zufällig wenn vorhanden).
     */
    berufslisteFuerEpoche(epoche) {
      return berufslisteFuerEpoche(epoche);
    },
    /**
     * Generiert einen NPC. Wenn opts.geschlecht/alter/beruf gesetzt sind, werden diese
     * als Vorgaben übernommen (z. B. aus dem NPC-Wizard).
     * @param {{
     *   epoche?: string,
     *   geschlecht?: string,
     *   alter?: string|number,
     *   beruf?: string,
     *   orteNamen?: string[],
     *   fraktionNamen?: string[],
     *   pantheonNamen?: string[],
     * }} opts
     */
    generiere(opts) {
      opts = opts || {};
      const epoche = opts.epoche || E.MITTELALTER;
      const geschlechtVorgabe = typeof opts.geschlecht === 'string' ? opts.geschlecht.trim() : '';
      const nameGeschlecht = zufallsNameUndGeschlecht(geschlechtVorgabe);
      const name = nameGeschlecht.name;
      const geschlecht = nameGeschlecht.geschlecht;
      const alterVorgabe = opts.alter != null ? String(opts.alter).trim() : '';
      const alter = alterVorgabe || String(U.zufallsInt(16, 72));
      const berufVorgabe = typeof opts.beruf === 'string' ? opts.beruf.trim() : '';
      const beruf = berufVorgabe || berufFuerEpoche(epoche);
      const ziel = zielFuerEpoche(epoche);
      const stimme = stimmeFuerAlter(alter);
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
        `<p><strong>Waffenloser Nahkampf (Fäuste, Tritte):</strong> ${U.htmlEsc(schadenWaffenlos)}.</p>`,
        `<p><strong>Geheimnis:</strong> ${U.htmlEsc(geheimnis)}.</p>`,
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
