/**
 * Jahreszeit, Wetter und Tageszeit — stimmige Zufallswerte (kein Schnee im Hochsommer).
 * Nutzt window.HTBAH.wuerfelW10 / w100, falls verfügbar.
 */
window.HTBAH = window.HTBAH || {};

(function () {
  function w10() {
    const H = window.HTBAH;
    if (H && typeof H.wuerfelW10 === 'function') {
      return H.wuerfelW10();
    }
    return Math.floor(Math.random() * 10) + 1;
  }

  function w100() {
    const H = window.HTBAH;
    if (H && typeof H.wuerfelW100 === 'function') {
      return H.wuerfelW100();
    }
    return Math.floor(Math.random() * 100) + 1;
  }

  function zufaellig(arr) {
    if (!arr || !arr.length) {
      return null;
    }
    return arr[(w10() - 1) % arr.length];
  }

  /** pairs: Array von { w: number, v: any } — w sind Gewichte (beliebige Skala). */
  function gewichtet(pairs) {
    const sum = pairs.reduce((s, p) => s + Math.max(0, Number(p.w) || 0), 0);
    if (sum <= 0) {
      return pairs[0] ? pairs[0].v : null;
    }
    let r = (w100() - 1) % sum;
    for (let i = 0; i < pairs.length; i++) {
      const wi = Math.max(0, Number(pairs[i].w) || 0);
      if (r < wi) {
        return pairs[i].v;
      }
      r -= wi;
    }
    return pairs[pairs.length - 1].v;
  }

  const JAHRESZEITEN = Object.freeze([
    { id: 'fruehling', label: 'Frühling', emoji: '🌸', farbe: '#ec4899' },
    { id: 'sommer', label: 'Sommer', emoji: '☀️', farbe: '#f59e0b' },
    { id: 'herbst', label: 'Herbst', emoji: '🍂', farbe: '#ea580c' },
    { id: 'winter', label: 'Winter', emoji: '❄️', farbe: '#38bdf8' },
  ]);

  const TAGESZEITEN = Object.freeze([
    { id: 'nacht', label: 'Nacht', emoji: '🌙', farbe: '#6366f1' },
    { id: 'frueher_morgen', label: 'früher Morgen', emoji: '🌅', farbe: '#fb923c' },
    { id: 'morgen', label: 'Morgen', emoji: '🌤️', farbe: '#fbbf24' },
    { id: 'mittag', label: 'Mittag', emoji: '☀️', farbe: '#fcd34d' },
    { id: 'nachmittag', label: 'Nachmittag', emoji: '🌥️', farbe: '#f59e0b' },
    { id: 'abend', label: 'Abend', emoji: '🌆', farbe: '#a855f7' },
    { id: 'spaeter_abend', label: 'später Abend', emoji: '🌃', farbe: '#4f46e5' },
  ]);

  const WINDRICHTUNGEN = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];

  function jahreszeitMeta(id) {
    return JAHRESZEITEN.find((j) => j.id === id) || JAHRESZEITEN[0];
  }

  function tageszeitMeta(id) {
    return TAGESZEITEN.find((t) => t.id === id) || TAGESZEITEN[3];
  }

  /**
   * Niederschlag / Phänomen — Gewichte je Jahreszeit (kohärent).
   * Keys: kein, niesel, regen_maessig, regen_stark, gewitter, hagel, schnee_leicht, schnee, schneesturm, graupel
   */
  function niederschlagGewichte(jz) {
    if (jz === 'sommer') {
      return [
        { w: 28, v: 'kein' },
        { w: 14, v: 'niesel' },
        { w: 16, v: 'regen_maessig' },
        { w: 12, v: 'regen_stark' },
        { w: 18, v: 'gewitter' },
        { w: 8, v: 'hagel' },
        { w: 4, v: 'graupel' },
      ];
    }
    if (jz === 'winter') {
      return [
        { w: 18, v: 'kein' },
        { w: 8, v: 'niesel' },
        { w: 6, v: 'regen_maessig' },
        { w: 4, v: 'regen_stark' },
        { w: 3, v: 'gewitter' },
        { w: 3, v: 'hagel' },
        { w: 18, v: 'schnee_leicht' },
        { w: 22, v: 'schnee' },
        { w: 10, v: 'schneesturm' },
      ];
    }
    if (jz === 'herbst') {
      return [
        { w: 20, v: 'kein' },
        { w: 14, v: 'niesel' },
        { w: 16, v: 'regen_maessig' },
        { w: 14, v: 'regen_stark' },
        { w: 10, v: 'gewitter' },
        { w: 6, v: 'hagel' },
        { w: 8, v: 'schnee_leicht' },
        { w: 6, v: 'schnee' },
        { w: 2, v: 'schneesturm' },
        { w: 4, v: 'graupel' },
      ];
    }
    /* Frühling */
    return [
      { w: 22, v: 'kein' },
      { w: 16, v: 'niesel' },
      { w: 16, v: 'regen_maessig' },
      { w: 12, v: 'regen_stark' },
      { w: 14, v: 'gewitter' },
      { w: 8, v: 'hagel' },
      { w: 4, v: 'schnee_leicht' },
      { w: 4, v: 'schnee' },
      { w: 2, v: 'schneesturm' },
      { w: 2, v: 'graupel' },
    ];
  }

  const NIEDERSCHLAG_TEXT = {
    kein: { label: 'kein Niederschlag', emoji: '✨' },
    niesel: { label: 'Nieselregen', emoji: '🌦️' },
    regen_maessig: { label: 'mäßiger Regen', emoji: '🌧️' },
    regen_stark: { label: 'starker Regen', emoji: '⛈️' },
    gewitter: { label: 'Gewitter', emoji: '🌩️' },
    hagel: { label: 'Hagel', emoji: '🧊' },
    schnee_leicht: { label: 'leichter Schneefall', emoji: '🌨️' },
    schnee: { label: 'Schnee', emoji: '❄️' },
    schneesturm: { label: 'Schneesturm', emoji: '🌨️' },
    graupel: { label: 'Graupel', emoji: '🌨️' },
  };

  function bewoelkungGewichte(jz) {
    if (jz === 'sommer') {
      return [
        { w: 22, v: 'wolkenlos' },
        { w: 18, v: 'sonnig, leichte Schleierwolken' },
        { w: 20, v: 'leicht bewölkt' },
        { w: 18, v: 'wechselnd bewölkt' },
        { w: 14, v: 'stark bewölkt' },
        { w: 8, v: 'bedeckt' },
      ];
    }
    if (jz === 'winter') {
      return [
        { w: 8, v: 'wolkenlos (klirrend kalt)' },
        { w: 12, v: 'sonnig, kalt' },
        { w: 14, v: 'leicht bewölkt' },
        { w: 18, v: 'wechselnd bewölkt' },
        { w: 22, v: 'stark bewölkt' },
        { w: 16, v: 'bedeckt, grau' },
      ];
    }
    if (jz === 'herbst') {
      return [
        { w: 10, v: 'neblig-trüb' },
        { w: 14, v: 'leicht bewölkt' },
        { w: 18, v: 'wechselnd bewölkt' },
        { w: 22, v: 'stark bewölkt' },
        { w: 20, v: 'bedeckt' },
        { w: 6, v: 'Nebelfelder' },
      ];
    }
    return [
      { w: 14, v: 'sonnig, frisch' },
      { w: 18, v: 'leicht bewölkt' },
      { w: 22, v: 'wechselnd bewölkt' },
      { w: 20, v: 'stark bewölkt' },
      { w: 16, v: 'bedeckt' },
      { w: 10, v: 'neblig' },
    ];
  }

  function temperaturZuNiederschlag(jz, nied) {
    const kalt = ['sehr kalt', 'eisig', 'frostig', 'kalt'];
    const mild = ['kühl', 'mild', 'angenehm'];
    const warm = ['warm', 'heiß', 'schwül-heiß'];
    if (nied === 'schneesturm' || nied === 'schnee' || nied === 'schnee_leicht') {
      return zufaellig(jz === 'winter' ? kalt : jz === 'herbst' ? ['kalt', 'kühl', 'mild'] : ['kalt', 'kühl']);
    }
    if (nied === 'gewitter' || nied === 'regen_stark') {
      return zufaellig(jz === 'sommer' ? ['warm', 'schwül-heiß', 'heiß'] : ['mild', 'warm', 'kühl']);
    }
    if (jz === 'winter') {
      return zufaellig(kalt);
    }
    if (jz === 'sommer') {
      return zufaellig(warm);
    }
    if (jz === 'herbst') {
      return zufaellig([...mild, 'kalt']);
    }
    return zufaellig([...mild, ...warm.slice(0, 2)]);
  }

  function windPaket() {
    const richtung = zufaellig(WINDRICHTUNGEN);
    /** Näherungsbereiche mittlerer Windgeschwindigkeit in km/h zu Beaufort-Bändern. */
    const staerke = gewichtet([
      { w: 18, v: { bft: '0–2', kmh: 'ca. 1–11 km/h', label: 'windstill bis schwache Brise' } },
      { w: 28, v: { bft: '3–4', kmh: 'ca. 12–28 km/h', label: 'schwache bis frische Brise' } },
      { w: 26, v: { bft: '5–6', kmh: 'ca. 29–49 km/h', label: 'frischer Wind bis starker Wind' } },
      { w: 18, v: { bft: '7–8', kmh: 'ca. 50–74 km/h', label: 'starker Wind / Sturmböen' } },
      { w: 8, v: { bft: '9–10', kmh: 'ca. 75–102 km/h', label: 'Sturm' } },
      { w: 2, v: { bft: '11–12', kmh: 'ca. 103–118 km/h', label: 'schwerer Sturm' } },
    ]);
    return {
      wind: `${staerke.label}, aus ${richtung}`,
      windStaerke: staerke.kmh,
      windBeaufort: `Beaufort ${staerke.bft}`,
      windRichtung: richtung,
    };
  }

  function generiereJahreszeit() {
    const j = zufaellig(JAHRESZEITEN);
    return {
      jahreszeitId: j.id,
      jahreszeitLabel: j.label,
      jahreszeitEmoji: j.emoji,
      jahreszeitFarbe: j.farbe,
    };
  }

  function generiereTageszeit() {
    const t = zufaellig(TAGESZEITEN);
    return {
      tageszeitId: t.id,
      tageszeitLabel: t.label,
      tageszeitEmoji: t.emoji,
      tageszeitFarbe: t.farbe,
    };
  }

  function generiereWetter(jahreszeitId) {
    const jz = jahreszeitMeta(jahreszeitId);
    const niedKey = gewichtet(niederschlagGewichte(jahreszeitId));
    const nt = NIEDERSCHLAG_TEXT[niedKey] || NIEDERSCHLAG_TEXT.kein;
    const bewoelkung = gewichtet(bewoelkungGewichte(jahreszeitId));
    const temperatur = temperaturZuNiederschlag(jahreszeitId, niedKey);
    const w = windPaket();

    return {
      niederschlagKey: niedKey,
      niederschlagLabel: nt.label,
      niederschlagEmoji: nt.emoji,
      bewoelkung,
      temperatur,
      wind: w.wind,
      windStaerke: w.windStaerke,
      windBeaufort: w.windBeaufort,
      wetterAkzentFarbe: jz.farbe,
    };
  }

  function generiereJahreszeitUndWetter() {
    const j = generiereJahreszeit();
    const wetter = generiereWetter(j.jahreszeitId);
    return { ...j, ...wetter };
  }

  function generiereAlles() {
    const jw = generiereJahreszeitUndWetter();
    const tz = generiereTageszeit();
    return { ...jw, ...tz };
  }

  /** Mittlere Windgeschwindigkeit (km/h) zu den Beaufort-Bändern aus windPaket(). */
  const BEAUFORT_BAND_KMH = Object.freeze({
    '0–2': 'ca. 1–11 km/h',
    '0-2': 'ca. 1–11 km/h',
    '3–4': 'ca. 12–28 km/h',
    '3-4': 'ca. 12–28 km/h',
    '5–6': 'ca. 29–49 km/h',
    '5-6': 'ca. 29–49 km/h',
    '7–8': 'ca. 50–74 km/h',
    '7-8': 'ca. 50–74 km/h',
    '9–10': 'ca. 75–102 km/h',
    '9-10': 'ca. 75–102 km/h',
    '11–12': 'ca. 103–118 km/h',
    '11-12': 'ca. 103–118 km/h',
  });

  /**
   * Stellt sicher: windStaerke = km/h-Text, windBeaufort = z. B. „Beaufort 3–4“.
   * Migriert alte Speicher, bei denen nur „Beaufort …“ in windStaerke stand.
   */
  function windStaerkeUndBeaufortNormalisieren(windStaerke, windBeaufort) {
    let ws = typeof windStaerke === 'string' ? windStaerke.trim() : '';
    let wb = typeof windBeaufort === 'string' ? windBeaufort.trim() : '';

    if (/km\/h/i.test(ws)) {
      return { windStaerke: ws, windBeaufort: wb };
    }

    function bandAusText(t) {
      const m = String(t || '').match(/Beaufort\s*([\d\-–]+(?:\s*[\-–]\s*[\d]+)?)/i);
      return m ? String(m[1]).trim().replace(/-/g, '–') : '';
    }

    let band = bandAusText(ws) || bandAusText(wb);
    if (!band && (ws || wb)) {
      const t = ws || wb;
      const m2 = String(t).match(/([\d\-–]+\s*[\-–]\s*[\d]+)/);
      if (m2) {
        band = String(m2[1]).trim().replace(/\s+/g, '').replace(/-/g, '–');
      }
    }

    if (band) {
      const kmh = BEAUFORT_BAND_KMH[band] || BEAUFORT_BAND_KMH[band.replace(/–/g, '-')];
      if (kmh) {
        if (!wb || !/beaufort/i.test(wb)) {
          wb = `Beaufort ${band}`;
        }
        ws = kmh;
      }
    }

    return { windStaerke: ws, windBeaufort: wb };
  }

  window.HTBAH.AtmosphaereZufall = {
    JAHRESZEITEN,
    TAGESZEITEN,
    BEAUFORT_BAND_KMH,
    jahreszeitMeta,
    tageszeitMeta,
    generiereJahreszeit,
    generiereTageszeit,
    generiereWetter,
    generiereJahreszeitUndWetter,
    generiereAlles,
    windStaerkeUndBeaufortNormalisieren,
  };
})();
