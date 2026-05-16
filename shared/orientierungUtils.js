/**
 * Bildschirmausrichtung: Nutzerwahl „as is“ verankern (Ankerwinkel) und visuell per CSS
 * stabil halten; optional screen.orientation.lock() als Zusatz.
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

const ORIENT_SPEICHER_KEY_MODUS = 'htbah_orientation_mode';
const ORIENT_SPEICHER_KEY_ANKER = 'htbah_orientation_anchor_angle';

const ORIENT_GUELTIGE_UNTER_MODI = new Set([
  'landscape-primary',
  'landscape-secondary',
  'portrait-primary',
  'portrait-secondary',
]);

const ORIENT_MODUS_ZU_WINKEL = {
  'portrait-primary': 0,
  'landscape-primary': 90,
  'portrait-secondary': 180,
  'landscape-secondary': 270,
};

const ORIENT_KLASSE_AKTIV = 'htbah-orient-erzwungen';
const ORIENT_KLASSE_DREHUNG_CW = 'htbah-orient-drehung-cw';
const ORIENT_KLASSE_DREHUNG_CCW = 'htbah-orient-drehung-ccw';
const ORIENT_KLASSE_DREHUNG_180 = 'htbah-orient-drehung-180';

const ORIENT_DREH_KLASSEN = [
  ORIENT_KLASSE_AKTIV,
  ORIENT_KLASSE_DREHUNG_CW,
  ORIENT_KLASSE_DREHUNG_CCW,
  ORIENT_KLASSE_DREHUNG_180,
];

let orientierungSpeicher = null;
let orientierungAktualisierungRaf = 0;

function orientierungSetzeSpeicher(speicher) {
  orientierungSpeicher = speicher;
}

function orientierungLeseText(key, fallback) {
  if (!orientierungSpeicher || typeof orientierungSpeicher.leseText !== 'function') {
    return fallback;
  }
  return orientierungSpeicher.leseText(key, fallback);
}

function orientierungSchreibeText(key, wert) {
  if (!orientierungSpeicher || typeof orientierungSpeicher.schreibeText !== 'function') {
    return;
  }
  orientierungSpeicher.schreibeText(key, wert);
}

function orientierungLoescheKey(key) {
  if (!orientierungSpeicher || typeof orientierungSpeicher.loescheKey !== 'function') {
    return;
  }
  orientierungSpeicher.loescheKey(key);
}

function orientierungNormalisiereWinkel(winkel) {
  const n = Number(winkel);
  if (!Number.isFinite(n)) {
    return null;
  }
  const norm = ((Math.round(n) % 360) + 360) % 360;
  if (norm % 90 !== 0) {
    return null;
  }
  return norm;
}

function orientierungErmittleGeraeteWinkel() {
  if (typeof screen !== 'undefined' && screen.orientation) {
    const apiWinkel = orientierungNormalisiereWinkel(screen.orientation.angle);
    if (apiWinkel !== null) {
      return apiWinkel;
    }
  }
  if (typeof window !== 'undefined' && typeof window.orientation === 'number') {
    const o = window.orientation;
    if (o === 90) {
      return 90;
    }
    if (o === -90) {
      return 270;
    }
    if (o === 180 || o === -180) {
      return 180;
    }
    if (o === 0) {
      return 0;
    }
  }
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight ? 90 : 0;
  }
  return 0;
}

function orientierungErmittleTypAusWinkel(winkel) {
  const norm = orientierungNormalisiereWinkel(winkel);
  if (norm === 90) {
    return 'landscape-primary';
  }
  if (norm === 270) {
    return 'landscape-secondary';
  }
  if (norm === 180) {
    return 'portrait-secondary';
  }
  return 'portrait-primary';
}

function orientierungBestimmeGruppe(modus) {
  if (typeof modus !== 'string') {
    return 'frei';
  }
  if (modus.indexOf('landscape') === 0) {
    return 'landscape';
  }
  if (modus.indexOf('portrait') === 0) {
    return 'portrait';
  }
  return 'frei';
}

function orientierungNormalisiereModus(modus) {
  if (ORIENT_GUELTIGE_UNTER_MODI.has(modus)) {
    return modus;
  }
  if (modus === 'landscape') {
    return 'landscape-primary';
  }
  if (modus === 'portrait') {
    return 'portrait-primary';
  }
  return 'frei';
}

function orientierungLadeAnkerWinkel(fallbackModus) {
  const roh = orientierungLeseText(ORIENT_SPEICHER_KEY_ANKER, null);
  const ausSpeicher = orientierungNormalisiereWinkel(roh);
  if (ausSpeicher !== null) {
    return ausSpeicher;
  }
  const modusWinkel = ORIENT_MODUS_ZU_WINKEL[orientierungNormalisiereModus(fallbackModus)];
  if (typeof modusWinkel === 'number') {
    return modusWinkel;
  }
  return orientierungErmittleGeraeteWinkel();
}

function orientierungEntsperreNativeWennMoeglich() {
  if (typeof screen === 'undefined') {
    return;
  }
  const orientationApi = screen.orientation;
  if (!orientationApi || typeof orientationApi.unlock !== 'function') {
    return;
  }
  try {
    orientationApi.unlock();
  } catch {
    /* ignorieren */
  }
}

async function orientierungSperreNativeWennMoeglich(ziel) {
  if (typeof screen === 'undefined') {
    return false;
  }
  const orientationApi = screen.orientation;
  if (!orientationApi || typeof orientationApi.lock !== 'function') {
    return false;
  }
  try {
    await orientationApi.lock(ziel);
    return true;
  } catch {
    return false;
  }
}

function orientierungEntferneCssKlassen(html) {
  if (!html) {
    return;
  }
  html.classList.remove(...ORIENT_DREH_KLASSEN);
}

function orientierungWendeCssKompensationAn(modus) {
  if (typeof document === 'undefined') {
    return;
  }
  const html = document.documentElement;
  if (!html) {
    return;
  }
  orientierungEntferneCssKlassen(html);
  const normalisiert = orientierungNormalisiereModus(modus);
  if (normalisiert === 'frei') {
    return;
  }
  const anker = orientierungLadeAnkerWinkel(normalisiert);
  const aktuell = orientierungErmittleGeraeteWinkel();
  const delta = (((anker - aktuell) % 360) + 360) % 360;
  if (delta === 0) {
    return;
  }
  let drehKlasse = null;
  if (delta === 90) {
    drehKlasse = ORIENT_KLASSE_DREHUNG_CCW;
  } else if (delta === 180) {
    drehKlasse = ORIENT_KLASSE_DREHUNG_180;
  } else if (delta === 270) {
    drehKlasse = ORIENT_KLASSE_DREHUNG_CW;
  }
  if (!drehKlasse) {
    return;
  }
  html.classList.add(ORIENT_KLASSE_AKTIV, drehKlasse);
}

function orientierungLadeModus() {
  return orientierungNormalisiereModus(
    orientierungLeseText(ORIENT_SPEICHER_KEY_MODUS, 'frei'),
  );
}

function orientierungLoeseZielUnterModus(generischerModus) {
  const aktuellerWinkel = orientierungErmittleGeraeteWinkel();
  const aktuellerTyp = orientierungErmittleTypAusWinkel(aktuellerWinkel);
  const aktuelleGruppe = orientierungBestimmeGruppe(aktuellerTyp);
  if (aktuelleGruppe === generischerModus && ORIENT_GUELTIGE_UNTER_MODI.has(aktuellerTyp)) {
    return aktuellerTyp;
  }
  return generischerModus === 'landscape' ? 'landscape-primary' : 'portrait-primary';
}

function orientierungWendeModusAn(modus, optionen = {}) {
  const normalisiert = orientierungNormalisiereModus(modus);
  if (normalisiert === 'frei') {
    orientierungEntsperreNativeWennMoeglich();
    orientierungWendeCssKompensationAn('frei');
    return;
  }
  orientierungWendeCssKompensationAn(normalisiert);
  if (optionen.nativeLock !== false) {
    void orientierungSperreNativeWennMoeglich(normalisiert);
  }
}

function orientierungPlaneCssAktualisierung() {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
    orientierungWendeCssKompensationAn(orientierungLadeModus());
    return;
  }
  if (orientierungAktualisierungRaf) {
    cancelAnimationFrame(orientierungAktualisierungRaf);
  }
  orientierungAktualisierungRaf = requestAnimationFrame(() => {
    orientierungAktualisierungRaf = 0;
    orientierungWendeCssKompensationAn(orientierungLadeModus());
  });
}

function orientierungSpeichereModus(modus) {
  let normalisiert;
  if (modus === 'landscape' || modus === 'portrait') {
    normalisiert = orientierungLoeseZielUnterModus(modus);
  } else {
    normalisiert = orientierungNormalisiereModus(modus);
  }
  if (normalisiert === 'frei') {
    orientierungSchreibeText(ORIENT_SPEICHER_KEY_MODUS, 'frei');
    orientierungLoescheKey(ORIENT_SPEICHER_KEY_ANKER);
    orientierungWendeModusAn('frei');
    return normalisiert;
  }
  const ankerWinkel = orientierungErmittleGeraeteWinkel();
  orientierungSchreibeText(ORIENT_SPEICHER_KEY_MODUS, normalisiert);
  orientierungSchreibeText(ORIENT_SPEICHER_KEY_ANKER, String(ankerWinkel));
  orientierungWendeModusAn(normalisiert);
  return normalisiert;
}

function orientierungMigriereAnkerWinkelWennNoetig() {
  const modus = orientierungLadeModus();
  if (modus === 'frei') {
    return;
  }
  if (orientierungNormalisiereWinkel(orientierungLeseText(ORIENT_SPEICHER_KEY_ANKER, null)) !== null) {
    return;
  }
  const ausModus = ORIENT_MODUS_ZU_WINKEL[modus];
  if (typeof ausModus === 'number') {
    orientierungSchreibeText(ORIENT_SPEICHER_KEY_ANKER, String(ausModus));
  }
}

function orientierungInitialisiereListener() {
  orientierungMigriereAnkerWinkelWennNoetig();
  orientierungWendeModusAn(orientierungLadeModus());
  if (typeof window === 'undefined') {
    return;
  }
  window.addEventListener('orientationchange', orientierungPlaneCssAktualisierung);
  window.addEventListener('resize', orientierungPlaneCssAktualisierung);
  if (
    typeof screen !== 'undefined' &&
    screen.orientation &&
    typeof screen.orientation.addEventListener === 'function'
  ) {
    screen.orientation.addEventListener('change', orientierungPlaneCssAktualisierung);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        orientierungWendeModusAn(orientierungLadeModus());
      }
    });
  }
}

window.HTBAH_SHARED.Orientierung = {
  SPEICHER_KEY_MODUS: ORIENT_SPEICHER_KEY_MODUS,
  SPEICHER_KEY_ANKER: ORIENT_SPEICHER_KEY_ANKER,
  setzeSpeicher: orientierungSetzeSpeicher,
  ladeModus: orientierungLadeModus,
  speichereModus: orientierungSpeichereModus,
  wendeModusAn: orientierungWendeModusAn,
  bestimmeGruppe: orientierungBestimmeGruppe,
  initialisiereListener: orientierungInitialisiereListener,
  ermittleGeraeteWinkel: orientierungErmittleGeraeteWinkel,
};
