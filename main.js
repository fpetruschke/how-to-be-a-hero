const SPEICHER_KEY_CHARAKTER = 'htbah_character';
const SPEICHER_KEY_PRESETS = 'htbah_presets';
const SPEICHER_KEY_THEME = 'htbah_theme';
const SPEICHER_KEY_CHARAKTER_BILD = 'htbah_character_image';
const SPEICHER_KEY_SPIELLEITER = 'htbah_spielleiter_gruppen';
const SPEICHER_KEY_ZUFALLSTABELLEN = 'htbah_zufallstabellen';
const SPEICHER_KEY_SPIELLEITER_ABENTEUERBUCH = 'htbah_spielleitung_abenteuerbuch';

function neueEntropieId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalisiereSpielleiterMitglied(m) {
  if (!m || typeof m !== 'object') {
    return null;
  }
  return {
    id: typeof m.id === 'string' && m.id ? m.id : neueEntropieId(),
    charakter: window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(m.charakter),
    charakterBild: typeof m.charakterBild === 'string' ? m.charakterBild : '',
  };
}

function normalisiereSpielleiterGruppe(g) {
  if (!g || typeof g !== 'object') {
    return null;
  }
  const mitglieder = Array.isArray(g.mitglieder)
    ? g.mitglieder.map(normalisiereSpielleiterMitglied).filter(Boolean)
    : [];
  return {
    id: typeof g.id === 'string' && g.id ? g.id : neueEntropieId(),
    name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : 'Gruppe',
    mitglieder,
  };
}

function ladeSpielleiterZustand() {
  let roh = null;
  try {
    roh = JSON.parse(localStorage.getItem(SPEICHER_KEY_SPIELLEITER) || 'null');
  } catch {
    roh = null;
  }
  if (!roh || typeof roh !== 'object') {
    return { version: 1, gruppen: [], aktiveGruppeId: null, mitgliedWahlProGruppe: {} };
  }
  const gruppen = Array.isArray(roh.gruppen)
    ? roh.gruppen.map(normalisiereSpielleiterGruppe).filter(Boolean)
    : [];
  let aktiveGruppeId = typeof roh.aktiveGruppeId === 'string' ? roh.aktiveGruppeId : null;
  if (aktiveGruppeId && !gruppen.some((g) => g.id === aktiveGruppeId)) {
    aktiveGruppeId = gruppen[0] ? gruppen[0].id : null;
  }
  return {
    version: 1,
    gruppen,
    aktiveGruppeId,
    mitgliedWahlProGruppe:
      roh.mitgliedWahlProGruppe && typeof roh.mitgliedWahlProGruppe === 'object'
        ? roh.mitgliedWahlProGruppe
        : {},
  };
}

function speichereSpielleiterZustand(zustand) {
  localStorage.setItem(SPEICHER_KEY_SPIELLEITER, JSON.stringify(zustand));
}

function normalisiereZufallstabellenNpcZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    spitzname: typeof z.spitzname === 'string' ? z.spitzname : '',
    geschlecht: typeof z.geschlecht === 'string' ? z.geschlecht : '',
    alter: typeof z.alter === 'string' ? z.alter : '',
    familienstand: typeof z.familienstand === 'string' ? z.familienstand : '',
    statur: typeof z.statur === 'string' ? z.statur : '',
    gesinnung: typeof z.gesinnung === 'string' ? z.gesinnung : '',
    beruf: typeof z.beruf === 'string' ? z.beruf : '',
    ziel: typeof z.ziel === 'string' ? z.ziel : '',
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
  };
}

function normalisiereZufallstabellenOrtZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    groesse: typeof z.groesse === 'string' ? z.groesse : '',
    lage: typeof z.lage === 'string' ? z.lage : '',
    zustand: typeof z.zustand === 'string' ? z.zustand : '',
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
  };
}

function normalisiereZufallstabellenGegenstandZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    beschreibungHtml: typeof z.beschreibungHtml === 'string' ? z.beschreibungHtml : '',
  };
}

function ladeZufallstabellenZustand() {
  let roh = null;
  try {
    roh = JSON.parse(localStorage.getItem(SPEICHER_KEY_ZUFALLSTABELLEN) || 'null');
  } catch {
    roh = null;
  }
  if (!roh || typeof roh !== 'object') {
    return { version: 1, npcs: [], orte: [], gegenstaende: [] };
  }
  return {
    version: 1,
    npcs: Array.isArray(roh.npcs)
      ? roh.npcs.map(normalisiereZufallstabellenNpcZeile).filter(Boolean)
      : [],
    orte: Array.isArray(roh.orte)
      ? roh.orte.map(normalisiereZufallstabellenOrtZeile).filter(Boolean)
      : [],
    gegenstaende: Array.isArray(roh.gegenstaende)
      ? roh.gegenstaende.map(normalisiereZufallstabellenGegenstandZeile).filter(Boolean)
      : [],
  };
}

function speichereZufallstabellenZustand(zustand) {
  localStorage.setItem(SPEICHER_KEY_ZUFALLSTABELLEN, JSON.stringify(zustand));
}

function ladeSpielleitungAbenteuerbuchHtml() {
  try {
    return localStorage.getItem(SPEICHER_KEY_SPIELLEITER_ABENTEUERBUCH) || '';
  } catch {
    return '';
  }
}

function speichereSpielleitungAbenteuerbuchHtml(html) {
  const s = typeof html === 'string' ? html : '';
  localStorage.setItem(SPEICHER_KEY_SPIELLEITER_ABENTEUERBUCH, s);
}

function loescheSpielleitungAbenteuerbuch() {
  localStorage.removeItem(SPEICHER_KEY_SPIELLEITER_ABENTEUERBUCH);
}

function erstelleCharakterExportPaket(charakter, charakterBild) {
  const roh =
    charakter && typeof charakter === 'object' ? charakter : {};
  const normalisiert = window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(roh);
  return {
    htbahExportVersion: 1,
    typ: 'charakter',
    exportiertAm: new Date().toISOString(),
    charakter: JSON.parse(JSON.stringify(normalisiert)),
    charakterBild: typeof charakterBild === 'string' ? charakterBild : '',
  };
}

function parseCharakterImportPaket(roh) {
  if (!roh || typeof roh !== 'object') {
    return { ok: false, fehler: 'Kein gültiges JSON-Objekt.' };
  }
  let charakterRoh;
  let bild = '';
  if (roh.htbahExportVersion === 1 && roh.typ === 'charakter' && roh.charakter) {
    charakterRoh = roh.charakter;
    bild = typeof roh.charakterBild === 'string' ? roh.charakterBild : '';
  } else if (
    roh.handeln !== undefined ||
    roh.wissen !== undefined ||
    roh.soziales !== undefined ||
    typeof roh.name === 'string'
  ) {
    charakterRoh = roh;
  } else {
    return {
      ok: false,
      fehler: 'Unbekanntes Format (HTBAH-Export oder Charakterobjekt erwartet).',
    };
  }
  const charakter = window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(charakterRoh);
  return { ok: true, charakter, charakterBild: bild };
}

function dateiHerunterladenJson(objekt, dateiname) {
  const blob = new Blob([JSON.stringify(objekt, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function ladeCharakter() {
  const roh = localStorage.getItem(SPEICHER_KEY_CHARAKTER);
  if (roh == null || roh === '') {
    return null;
  }
  try {
    return JSON.parse(roh);
  } catch {
    return null;
  }
}

function speichereCharakter(charakter) {
  localStorage.setItem(SPEICHER_KEY_CHARAKTER, JSON.stringify(charakter));
}

function ladePresets() {
  const roh = localStorage.getItem(SPEICHER_KEY_PRESETS);
  if (roh == null || roh === '') {
    return [];
  }
  try {
    const w = JSON.parse(roh);
    return Array.isArray(w) ? w : [];
  } catch {
    return [];
  }
}

function speicherePresets(presets) {
  localStorage.setItem(SPEICHER_KEY_PRESETS, JSON.stringify(presets));
}

function wuerfelW10() {
  return Math.floor(Math.random() * 10) + 1;
}

function wuerfelW100() {
  return Math.floor(Math.random() * 100) + 1;
}

/**
 * W100-Proben nach Regelwerk (Lexikon: Probe, Kritische Würfe).
 * @param {number} wurf
 * @param {number} zielwert
 * @param {{ nurBegabung?: boolean }} optionen
 */
function berechneProbeAuswertung(wurf, zielwert, optionen = {}) {
  const nurBegabung = Boolean(optionen.nurBegabung);
  const w = Math.max(1, Math.min(100, Math.floor(Number(wurf) || 0)));
  const z = Math.max(0, Math.round(Number(zielwert) || 0));
  const zehnProzent = Math.round(z * 0.1);
  const kritErfolgMax = zehnProzent;
  const kritMissMin = 90 + zehnProzent;

  if (w >= kritMissMin) {
    return {
      stufe: 'kritisch_misserfolg',
      label: 'Kritischer Misserfolg',
      kurztext: 'Zwischen ' + kritMissMin + ' und 100 (Regelwerk: 90 + 10 % des Zielwerts).',
    };
  }

  if (w > z) {
    return {
      stufe: 'schlecht',
      label: 'Schlechter Wurf',
      kurztext: 'Probe nicht bestanden (Wurf höher als der Zielwert).',
    };
  }

  if (!nurBegabung && kritErfolgMax >= 1 && w <= kritErfolgMax) {
    return {
      stufe: 'kritisch_erfolg',
      label: 'Kritischer Erfolg',
      kurztext: 'Im unteren 10 %-Bereich des Zielwerts (nur bei Fähigkeitsproben).',
    };
  }

  const unten = nurBegabung ? 1 : Math.max(1, kritErfolgMax + 1);
  const oben = z;
  const mitte = Math.floor((unten + oben) / 2);

  if (w <= mitte) {
    return {
      stufe: 'gut',
      label: 'Guter Wurf',
      kurztext: 'Probe bestanden (untere Hälfte der nicht kritischen Erfolgszone).',
    };
  }

  return {
    stufe: 'mittel',
    label: 'Mittelmäßiger Wurf',
    kurztext: 'Probe bestanden (obere Hälfte der nicht kritischen Erfolgszone).',
  };
}

function ermittleAssetUrl(relativerPfad) {
  const basisPfad = window.location.pathname.endsWith('/')
    ? window.location.pathname
    : window.location.pathname.replace(/\/[^/]*$/, '/');

  return window.location.origin + basisPfad + relativerPfad.replace(/^\/+/, '');
}

function ermittleRegelwerkQuelleUrl() {
  return ermittleAssetUrl('assets/pdf/how-to-be-a-hero-Regelwerk-hoschianer.pdf');
}

function ladeTheme() {
  const gespeichertesTheme = localStorage.getItem(SPEICHER_KEY_THEME);
  return gespeichertesTheme === 'light' ? 'light' : 'dark';
}

function setzeTheme(theme) {
  const gueltigesTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', gueltigesTheme);
  localStorage.setItem(SPEICHER_KEY_THEME, gueltigesTheme);
  return gueltigesTheme;
}

function ladeCharakterBild() {
  return localStorage.getItem(SPEICHER_KEY_CHARAKTER_BILD) || '';
}

function speichereCharakterBild(dataUrl) {
  localStorage.setItem(SPEICHER_KEY_CHARAKTER_BILD, dataUrl);
}

function loescheCharakterBild() {
  localStorage.removeItem(SPEICHER_KEY_CHARAKTER_BILD);
}

setzeTheme(ladeTheme());

window.HTBAH = {
  ladeCharakter,
  speichereCharakter,
  ladePresets,
  speicherePresets,
  wuerfelW10,
  wuerfelW100,
  berechneProbeAuswertung,
  ermittleAssetUrl,
  ermittleRegelwerkQuelleUrl,
  ladeTheme,
  setzeTheme,
  ladeCharakterBild,
  speichereCharakterBild,
  loescheCharakterBild,
  neueEntropieId,
  ladeSpielleiterZustand,
  speichereSpielleiterZustand,
  erstelleCharakterExportPaket,
  parseCharakterImportPaket,
  dateiHerunterladenJson,
  ladeZufallstabellenZustand,
  speichereZufallstabellenZustand,
  ladeSpielleitungAbenteuerbuchHtml,
  speichereSpielleitungAbenteuerbuchHtml,
  loescheSpielleitungAbenteuerbuch,
};

const routes = [
  { path: '/', component: window.HTBAH_SEITEN.Startseite },
  { path: '/charakter', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter-erstellung', redirect: '/charakter' },
  { path: '/preset-verwaltung', component: window.HTBAH_SEITEN.PresetVerwaltung },
  { path: '/preset-bearbeiten', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/preset-bearbeiten/:id', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/einstellungen', component: window.HTBAH_SEITEN.Einstellungen },
  { path: '/spielleiter', component: window.HTBAH_SEITEN.SpielleiterGruppenUebersicht },
  { path: '/spielleiter/gruppe/:gruppeId', component: window.HTBAH_SEITEN.SpielleiterGruppe },
  { path: '/zufallstabellen', component: window.HTBAH_SEITEN.Zufallstabellen },
  { path: '/create', redirect: '/charakter' },
  { path: '/presets', redirect: '/preset-verwaltung' },
  { path: '/presets/form', redirect: '/preset-bearbeiten' },
  { path: '/presets/form/:id', redirect: '/preset-bearbeiten/:id' },
  { path: '/settings', redirect: '/einstellungen' },
  { path: '/gm', redirect: '/spielleiter' },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

const uiZustand = Vue.reactive({
  regelwerkOffen: false,
  abenteuerbuchOffen: false,
});

const lebenspunkteStatus = Vue.reactive({
  tot: false,
  bewusstlos: false,
});

function syncLebenspunkteStatusFromCharakter(charakter) {
  if (!charakter || typeof charakter !== 'object') {
    lebenspunkteStatus.tot = false;
    lebenspunkteStatus.bewusstlos = false;
    return;
  }
  const lp = Math.max(0, Math.round(Number(charakter.lebenspunkte) || 0));
  const tot = lp === 0;
  const ausgeblendet = Boolean(charakter.lpBewusstlosAusgeblendet);
  const massenschaden = Boolean(charakter.lpMassenschadenBewusstlos);
  lebenspunkteStatus.tot = tot;
  const bewusstlosTypisch = lp >= 1 && lp <= 10;
  const bewusstlosMassenschaden = massenschaden && lp > 10;
  lebenspunkteStatus.bewusstlos =
    !tot && !ausgeblendet && (bewusstlosTypisch || bewusstlosMassenschaden);
}

window.HTBAH.lebenspunkteStatus = lebenspunkteStatus;
window.HTBAH.syncLebenspunkteStatusFromCharakter = syncLebenspunkteStatusFromCharakter;

const app = Vue.createApp({
  data() {
    return {
      uiZustand,
    };
  },
  created() {
    syncLebenspunkteStatusFromCharakter(window.HTBAH.ladeCharakter());
  },
  template: `
    <lebenspunkte-status-banner />
    <router-view></router-view>
    <lokaler-speicher-hinweis-modal />
    <regelwerk-modal :ui-zustand="uiZustand"></regelwerk-modal>
    <abenteuerbuch-modal :ui-zustand="uiZustand"></abenteuerbuch-modal>
    <bottom-nav :ui-zustand="uiZustand"></bottom-nav>
  `,
});

app.use(router);
router.afterEach((to) => {
  if (to.path.startsWith('/spielleiter/gruppe/')) {
    return;
  }
  syncLebenspunkteStatusFromCharakter(window.HTBAH.ladeCharakter());
});
app.component('regelwerk-modal', window.HTBAH_KOMPONENTEN.RegelwerkModal);
app.component('abenteuerbuch-modal', window.HTBAH_KOMPONENTEN.AbenteuerbuchModal);
app.component(
  'lokaler-speicher-hinweis-modal',
  window.HTBAH_KOMPONENTEN.LokalerSpeicherHinweisModal,
);
app.component('bottom-nav', window.HTBAH_KOMPONENTEN.BottomNav);
app.component('bestaetigen-modal', window.HTBAH_KOMPONENTEN.BestaetigenModal);
app.component('lebenspunkte-status-banner', window.HTBAH_KOMPONENTEN.LebenspunkteStatusBanner);
app.component('icon-text-button', window.HTBAH_KOMPONENTEN.IconTextButton);
app.mount('#app');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
