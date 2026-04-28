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
        if (Number.isNaN(value) || value < 1 || value > 100) continue;
        arr.push({ name, value });
      }
      out[k] = arr;
    }
    return out;
  }

  globalObj.CharakterUtils = {
    KATEGORIE_INFOS,
    GEISTESBLITZ_INFO_ZEILEN,
    normalisiereFaehigkeitenPreset,
  };
})(window.HTBAH_SHARED);
