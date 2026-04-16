const SPEICHER_KEY_CHARAKTER = 'htbah_character';
const SPEICHER_KEY_PRESETS = 'htbah_presets';
const SPEICHER_KEY_THEME = 'htbah_theme';
const SPEICHER_KEY_CHARAKTER_BILD = 'htbah_character_image';

function ladeCharakter() {
  return JSON.parse(localStorage.getItem(SPEICHER_KEY_CHARAKTER));
}

function speichereCharakter(charakter) {
  localStorage.setItem(SPEICHER_KEY_CHARAKTER, JSON.stringify(charakter));
}

function ladePresets() {
  return JSON.parse(localStorage.getItem(SPEICHER_KEY_PRESETS)) || [];
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

function ermittleRegelwerkQuelleUrl() {
  const basisPfad = window.location.pathname.endsWith('/')
    ? window.location.pathname
    : window.location.pathname.replace(/\/[^/]*$/, '/');

  return (
    window.location.origin +
    basisPfad +
    'assets/pdf/how-to-be-a-hero-Regelwerk.pdf'
  );
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
  ermittleRegelwerkQuelleUrl,
  ladeTheme,
  setzeTheme,
  ladeCharakterBild,
  speichereCharakterBild,
  loescheCharakterBild,
};

const routes = [
  { path: '/', component: window.HTBAH_SEITEN.Startseite },
  { path: '/charakter-erstellung', component: window.HTBAH_SEITEN.CharakterErstellung },
  { path: '/abenteuer', component: window.HTBAH_SEITEN.Abenteuer },
  { path: '/preset-verwaltung', component: window.HTBAH_SEITEN.PresetVerwaltung },
  { path: '/preset-bearbeiten', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/preset-bearbeiten/:id', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/einstellungen', component: window.HTBAH_SEITEN.Einstellungen },
  { path: '/create', redirect: '/charakter-erstellung' },
  { path: '/play', redirect: '/abenteuer' },
  { path: '/presets', redirect: '/preset-verwaltung' },
  { path: '/presets/form', redirect: '/preset-bearbeiten' },
  { path: '/presets/form/:id', redirect: '/preset-bearbeiten/:id' },
  { path: '/settings', redirect: '/einstellungen' },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

const uiZustand = Vue.reactive({
  regelwerkOffen: false,
});

const app = Vue.createApp({
  data() {
    return {
      uiZustand,
    };
  },
  template: `
    <router-view></router-view>
    <regelwerk-modal :ui-zustand="uiZustand"></regelwerk-modal>
    <bottom-nav :ui-zustand="uiZustand"></bottom-nav>
  `,
});

app.use(router);
app.component('regelwerk-modal', window.HTBAH_KOMPONENTEN.RegelwerkModal);
app.component('bottom-nav', window.HTBAH_KOMPONENTEN.BottomNav);
app.mount('#app');
