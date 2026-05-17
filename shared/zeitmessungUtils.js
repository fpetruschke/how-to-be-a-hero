/**
 * Zeitmessung (Timer/Stoppuhr) und synthetische Töne (Web Audio API).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

const ZEITMESSUNG_DEFAULTS = {
  klickAktiv: true,
  klickLautstaerke: 0.65,
  stoppuhrMitKlick: false,
  countdownAbSekunde: 10,
};

/** Sanfte Melodie bei abgelaufenem Timer (Hz). */
const ZEITMESSUNG_ABGELAUFEN_TOENE = [523.25, 659.25, 783.99];

let htbahZeitmessungAudioCtx = null;

function htbahZeitmessungHoleAudioContext() {
  if (htbahZeitmessungAudioCtx) {
    return htbahZeitmessungAudioCtx;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  htbahZeitmessungAudioCtx = new Ctx();
  return htbahZeitmessungAudioCtx;
}

function htbahZeitmessungResumeContext(ctx) {
  if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }
}

function htbahZeitmessungBegrenzeZahl(roh, min, max, fallback) {
  const n = Math.round(Number(roh));
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function htbahZeitmessungNormalisiereProfil(roh) {
  const o = roh && typeof roh === 'object' ? roh : {};
  const lz =
    typeof o.klickLautstaerke === 'number' && Number.isFinite(o.klickLautstaerke)
      ? Math.min(1, Math.max(0, o.klickLautstaerke))
      : ZEITMESSUNG_DEFAULTS.klickLautstaerke;
  return {
    klickAktiv: o.klickAktiv !== undefined ? Boolean(o.klickAktiv) : ZEITMESSUNG_DEFAULTS.klickAktiv,
    klickLautstaerke: lz,
    stoppuhrMitKlick:
      o.stoppuhrMitKlick !== undefined
        ? Boolean(o.stoppuhrMitKlick)
        : ZEITMESSUNG_DEFAULTS.stoppuhrMitKlick,
    countdownAbSekunde: htbahZeitmessungBegrenzeZahl(
      o.countdownAbSekunde,
      0,
      35999,
      ZEITMESSUNG_DEFAULTS.countdownAbSekunde,
    ),
  };
}

function htbahZeitmessungFormatHhMmSs(ms) {
  const gesamtSek = Math.max(0, Math.floor(Number(ms) / 1000));
  const h = Math.floor(gesamtSek / 3600);
  const m = Math.floor((gesamtSek % 3600) / 60);
  const s = gesamtSek % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function htbahZeitmessungMsAusTeilen(stunden, minuten, sekunden) {
  const h = htbahZeitmessungBegrenzeZahl(stunden, 0, 99, 0);
  const m = htbahZeitmessungBegrenzeZahl(minuten, 0, 59, 0);
  const s = htbahZeitmessungBegrenzeZahl(sekunden, 0, 59, 0);
  return (h * 3600 + m * 60 + s) * 1000;
}

/**
 * @param {number} [lautstaerkeOverride]
 * @returns {number | null} 0–1 oder null wenn stumm
 */
function htbahZeitmessungErmittleLautstaerke(lautstaerkeOverride) {
  if (typeof lautstaerkeOverride === 'number' && Number.isFinite(lautstaerkeOverride)) {
    return Math.min(1, Math.max(0, lautstaerkeOverride));
  }
  const profil = window.HTBAH_SHARED.ZeitmessungUtils.ladeProfil();
  if (!profil.klickAktiv) {
    return null;
  }
  return profil.klickLautstaerke;
}

/**
 * Weicher Tick (Sinus + Tiefpass, sanfte Hüllkurve) — kein harter Square-Klick.
 * @param {number} [lautstaerkeOverride] 0–1, optional
 */
function htbahZeitmessungSpieleKlick(lautstaerkeOverride) {
  const vol = htbahZeitmessungErmittleLautstaerke(lautstaerkeOverride);
  if (vol == null || vol <= 0) {
    return;
  }
  try {
    const ctx = htbahZeitmessungHoleAudioContext();
    if (!ctx) {
      return;
    }
    htbahZeitmessungResumeContext(ctx);
    const t0 = ctx.currentTime;
    const peak = vol * 0.18;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(620, t0 + 0.07);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t0);
    filter.Q.setValueAtTime(0.5, t0);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.11);
  } catch {
    /* Autoplay-Richtlinie o. ä. */
  }
}

/**
 * Sanfte Dreiton-Melodie wenn der Timer auf 0 läuft.
 * @param {number} [lautstaerkeOverride] 0–1, optional
 */
function htbahZeitmessungSpieleAbgelaufen(lautstaerkeOverride) {
  const vol = htbahZeitmessungErmittleLautstaerke(lautstaerkeOverride);
  if (vol == null || vol <= 0) {
    return;
  }
  try {
    const ctx = htbahZeitmessungHoleAudioContext();
    if (!ctx) {
      return;
    }
    htbahZeitmessungResumeContext(ctx);
    const t0 = ctx.currentTime;
    const abstand = 0.16;
    const haltDauer = 0.42;

    ZEITMESSUNG_ABGELAUFEN_TOENE.forEach((freq, index) => {
      const t = t0 + index * abstand;
      const peak = vol * 0.26 * (1 - index * 0.08);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.Q.setValueAtTime(0.4, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.028);
      gain.gain.setValueAtTime(peak * 0.85, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + haltDauer);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + haltDauer + 0.02);
    });
  } catch {
    /* Autoplay-Richtlinie o. ä. */
  }
}

function htbahZeitmessungNormalisiereBadgePosition(roh) {
  if (!roh || typeof roh !== 'object') {
    return null;
  }
  if (roh.mode === 'fixed' && typeof roh.left === 'number' && typeof roh.top === 'number') {
    return { mode: 'fixed', left: roh.left, top: roh.top };
  }
  return null;
}

function htbahZeitmessungLeererKampagnenZustand() {
  const ms = htbahZeitmessungMsAusTeilen(0, 5, 0);
  return {
    modus: 'timer',
    status: 'bereit',
    eingabeH: 0,
    eingabeM: 5,
    eingabeS: 0,
    anzeigeMs: ms,
    basisMs: 0,
    zielMs: ms,
    startWallMs: 0,
    letzteKlickSekunde: -1,
  };
}

function htbahZeitmessungNormalisiereKampagnenZustand(roh) {
  const leer = htbahZeitmessungLeererKampagnenZustand();
  if (!roh || typeof roh !== 'object') {
    return leer;
  }
  const modus = roh.modus === 'stoppuhr' ? 'stoppuhr' : 'timer';
  const status =
    roh.status === 'laeuft' || roh.status === 'pausiert' || roh.status === 'abgelaufen'
      ? roh.status
      : 'bereit';
  const eingabeH = htbahZeitmessungBegrenzeZahl(roh.eingabeH, 0, 99, leer.eingabeH);
  const eingabeM = htbahZeitmessungBegrenzeZahl(roh.eingabeM, 0, 59, leer.eingabeM);
  const eingabeS = htbahZeitmessungBegrenzeZahl(roh.eingabeS, 0, 59, leer.eingabeS);
  const eingabeMs = htbahZeitmessungMsAusTeilen(eingabeH, eingabeM, eingabeS);
  let anzeigeMs =
    typeof roh.anzeigeMs === 'number' && Number.isFinite(roh.anzeigeMs)
      ? Math.max(0, Math.round(roh.anzeigeMs))
      : eingabeMs;
  let basisMs =
    typeof roh.basisMs === 'number' && Number.isFinite(roh.basisMs)
      ? Math.max(0, Math.round(roh.basisMs))
      : 0;
  let zielMs =
    typeof roh.zielMs === 'number' && Number.isFinite(roh.zielMs)
      ? Math.max(0, Math.round(roh.zielMs))
      : eingabeMs;
  const startWallMs =
    typeof roh.startWallMs === 'number' && Number.isFinite(roh.startWallMs) && roh.startWallMs > 0
      ? Math.round(roh.startWallMs)
      : 0;
  const letzteKlickSekunde =
    typeof roh.letzteKlickSekunde === 'number' && Number.isFinite(roh.letzteKlickSekunde)
      ? Math.round(roh.letzteKlickSekunde)
      : -1;
  if (status === 'bereit' && modus === 'timer') {
    anzeigeMs = eingabeMs;
    zielMs = eingabeMs;
    basisMs = 0;
  }
  if (status === 'abgelaufen') {
    anzeigeMs = 0;
    zielMs = 0;
    basisMs = 0;
    startWallMs = 0;
  }
  return {
    modus,
    status,
    eingabeH,
    eingabeM,
    eingabeS,
    anzeigeMs,
    basisMs,
    zielMs,
    startWallMs,
    letzteKlickSekunde,
  };
}

window.HTBAH_SHARED.ZeitmessungUtils = {
  DEFAULTS: ZEITMESSUNG_DEFAULTS,
  normalisiereProfil: htbahZeitmessungNormalisiereProfil,
  normalisiereKampagnenZustand: htbahZeitmessungNormalisiereKampagnenZustand,
  leererKampagnenZustand: htbahZeitmessungLeererKampagnenZustand,
  normalisiereBadgePosition: htbahZeitmessungNormalisiereBadgePosition,
  formatHhMmSs: htbahZeitmessungFormatHhMmSs,
  msAusTeilen: htbahZeitmessungMsAusTeilen,
  spieleKlick: htbahZeitmessungSpieleKlick,
  spieleAbgelaufen: htbahZeitmessungSpieleAbgelaufen,
  ladeProfil() {
    if (window.HTBAH && typeof window.HTBAH.ladeZeitmessungProfil === 'function') {
      return window.HTBAH.ladeZeitmessungProfil();
    }
    return { ...ZEITMESSUNG_DEFAULTS };
  },
};
