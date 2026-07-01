window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerCharakterUtils(globalObj) {
  const KATEGORIE_INFOS = {
    handeln: {
      erklaerung:
        'Handeln umfasst körperliche, praktische und unmittelbare Aktionen in der Spielwelt.',
      beispiele: ['Klettern', 'Schleichen', 'Kampf', 'Schlösser knacken', 'Fahren'],
    },
    wissen: {
      erklaerung:
        'Wissen umfasst gelerntes, logisches und analytisches Können rund um Fakten und Zusammenhänge.',
      beispiele: ['Heilkunde', 'Geschichte', 'Magiekunde', 'Sprachen', 'Technik'],
    },
    soziales: {
      erklaerung:
        'Soziales umfasst alle Fähigkeiten im Umgang mit anderen Personen, Gruppen und Beziehungen.',
      beispiele: ['Überreden', 'Lügen', 'Menschenkenntnis', 'Verhandeln', 'Auftreten'],
    },
  };

  const FAEHIGKEIT_MAX_PUNKTE_STANDARD = 70;
  const FAEHIGKEIT_EFFEKTIV_MAX = 100;

  const FAEHIGKEIT_HINWEIS_HOHE_PUNKTE =
    'Mehr als 70 Punkte auf eine Fähigkeit sind normalerweise nicht erlaubt — nur mit ausdrücklicher Erlaubnis der Spielleitung.';

  const FAEHIGKEIT_HINWEIS_EFFEKTIV_UEBER_MAX =
    'Der effektive Wert (Fähigkeit + Begabung) liegt über 100; überzählige Punkte zählen für Proben nicht (Zielwert max. 100).';

  function faehigkeitBasiswert(faehigkeit) {
    const v = Number(faehigkeit && faehigkeit.value);
    return Number.isFinite(v) ? v : 0;
  }

  function faehigkeitHatZuVielePunkte(faehigkeit, limit = FAEHIGKEIT_MAX_PUNKTE_STANDARD) {
    return faehigkeitBasiswert(faehigkeit) > limit;
  }

  function faehigkeitEffektivRohwert(faehigkeit, begabung) {
    return faehigkeitBasiswert(faehigkeit) + (Number(begabung) || 0);
  }

  function faehigkeitEffektivUeberLimit(
    faehigkeit,
    begabung,
    max = FAEHIGKEIT_EFFEKTIV_MAX,
  ) {
    return faehigkeitEffektivRohwert(faehigkeit, begabung) > max;
  }

  /** @returns {{ klassen: string[], hinweis: string }} */
  function faehigkeitZeilenWarnung(faehigkeit, begabung) {
    const hohePunkte = faehigkeitHatZuVielePunkte(faehigkeit);
    const effektivHoch = faehigkeitEffektivUeberLimit(faehigkeit, begabung);
    const teile = [];
    if (hohePunkte) {
      teile.push(FAEHIGKEIT_HINWEIS_HOHE_PUNKTE);
    }
    if (effektivHoch) {
      teile.push(FAEHIGKEIT_HINWEIS_EFFEKTIV_UEBER_MAX);
    }
    const klassen = [];
    if (hohePunkte) {
      klassen.push('faehigkeiten-zeile--warn-hoch');
    }
    if (effektivHoch) {
      klassen.push('faehigkeiten-zeile--info-effektiv');
    }
    return { klassen, hinweis: teile.join('\n\n') };
  }

  const GEISTESBLITZ_INFO_ZEILEN = [
    'Maximalwert pro Begabung: Begabungswert geteilt durch 10, kaufmännisch runden (wie im Regelwerk).',
    'Nur für dieselbe Begabung: Ein Punkt aus „Wissen“ gilt nicht für eine Handeln-Probe (und umgekehrt).',
    'Einsatz am Tisch: noch einmal würfeln, wenn die erste Probe misslungen ist — nicht bei kritischem Misserfolg.',
    'Verbrauchte Punkte bleiben weg, bis du die Konten wieder auffüllst (z. B. nach Abenteuerende).',
    'Gültigkeit: ein Abend bzw. ein Abenteuer; ungenutzte Punkte sind nicht übertragbar; neues Abenteuer startet mit vollem Konto. Wird ein Abenteuer auf mehrere Abende verteilt, regenerieren die Punkte bis zum nächsten Abend.',
  ];

  function normalisiereFaehigkeitenPreset(roh) {
    if (!roh || typeof roh !== 'object') return null;
    const kategorien = ['handeln', 'wissen', 'soziales'];
    const out = { name: typeof roh.name === 'string' ? roh.name.trim() : '' };
    for (const k of kategorien) {
      if (!Array.isArray(roh[k])) return null;
      const arr = [];
      for (const eintrag of roh[k]) {
        if (!eintrag || typeof eintrag !== 'object') continue;
        const name = typeof eintrag.name === 'string' ? eintrag.name.trim() : '';
        if (!name) continue;
        const rohWert = eintrag.value;
        if (rohWert === null || rohWert === undefined || rohWert === '') {
          arr.push({ name, value: null });
          continue;
        }
        const value = Number(rohWert);
        if (Number.isNaN(value) || value < 0 || value > 100) continue;
        arr.push({ name, value });
      }
      out[k] = arr;
    }
    return out;
  }

  globalObj.CharakterUtils = {
    KATEGORIE_INFOS,
    GEISTESBLITZ_INFO_ZEILEN,
    FAEHIGKEIT_MAX_PUNKTE_STANDARD,
    FAEHIGKEIT_EFFEKTIV_MAX,
    FAEHIGKEIT_HINWEIS_HOHE_PUNKTE,
    FAEHIGKEIT_HINWEIS_EFFEKTIV_UEBER_MAX,
    faehigkeitBasiswert,
    faehigkeitHatZuVielePunkte,
    faehigkeitEffektivRohwert,
    faehigkeitEffektivUeberLimit,
    faehigkeitZeilenWarnung,
    normalisiereFaehigkeitenPreset,
  };
})(window.HTBAH_SHARED);
