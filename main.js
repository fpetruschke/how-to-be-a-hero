const SPEICHER_KEY_APP_ROLLE = 'htbah_app_rolle';
const SPEICHER_KEY_CHARAKTER_LEGACY = 'htbah_character';
const SPEICHER_KEY_CHARAKTER = 'htbah_characters';
const SPEICHER_KEY_CHARAKTER_ENTRY_PRAEFIX = 'htbah_character_entry:';
const SPEICHER_KEY_AKTIVER_CHARAKTER = 'htbah_active_character_id';
const SPEICHER_KEY_PRESETS = 'htbah_presets';
const SPEICHER_KEY_THEME = 'htbah_theme';
const SPEICHER_KEY_CHARAKTER_BILD_LEGACY = 'htbah_character_image';
const SPEICHER_KEY_SPIELLEITUNG = 'htbah_spielleitung_kampagnen';
/** @deprecated Migration von früheren Versionen */
const SPEICHER_KEY_SPIELLEITUNG_LEGACY = 'htbah_spielleiter_kampagnen';
const SPEICHER_KEY_KAMPAGNEN_LABELS_KATALOG = 'htbah_kampagnen_labels_katalog';
const SPEICHER_KEY_ZUFALLSTABELLEN = 'htbah_zufallstabellen';
const SPEICHER_KEY_WELTENBAU = 'htbah_weltenbau';
const SPEICHER_KEY_WUERFEL_AUDIO = 'htbah_wuerfel_audio';
/** @deprecated nur Migration; neuer Speicher: SPEICHER_KEY_WUERFEL_AUDIO */
const SPEICHER_KEY_WUERFEL_SOUND_LEGACY = 'htbah_wuerfel_sound';
const SPEICHER_KEY_DICE_COLORS = 'htbah_dice_colors';
const SPEICHER_KEY_WUERFEL_BEUTEL_FENSTER = 'htbah_wuerfel_beutel_fenster';
const SPEICHER_KEY_ZEITMESSUNG = 'htbah_zeitmessung_einstellungen';
const SPEICHER_KEY_ZEITMESSUNG_BADGE_POS = 'htbah_zeitmessung_badge_pos';
const SPEICHER_KEY_ABENTEUERBUCH_EINSTELLUNGEN = 'htbah_abenteuerbuch_einstellungen';
const SPEICHER_KEY_ZEICHEN_MODAL = 'htbah_zeichen_brett';
const SPEICHER_KEY_MENTION_NAV_TARGET = 'htbah_mention_nav_target';
const SPEICHER_KEY_ORIENTATION_MODE = 'htbah_orientation_mode';
const SPEICHER_KEY_INTERAKTIVE_WELT_STATS_ANZEIGEN = 'htbah_interaktive_welt_stats_anzeigen';
const SPEICHER_KEY_KONFLIKT_FENSTER = 'htbah_konflikt_fenster';
const SPEICHER_KEY_OFFENE_MODALS = 'htbah_offene_modals';
const SPEICHER_KEY_FLOATING_FAB_POS = 'htbah_floating_fab_pos';
const SPEICHER_KEY_EFFEKT_RAHMEN = 'htbah_effekt_rahmen_einstellungen';
const SPEICHER_KEY_TOKEN_EXPORT = 'htbah_token_export_einstellungen';

function erstelleLocalStorageBackend() {
  return {
    lese(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    schreibe(key, wert) {
      try {
        localStorage.setItem(key, wert);
        return true;
      } catch {
        return false;
      }
    },
    loesche(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignorieren */
      }
    },
  };
}

function erstelleSpeicherGateway() {
  const backends = new Map();
  const keyRouten = new Map();
  const standardBackendName = 'localStorage';

  backends.set(standardBackendName, erstelleLocalStorageBackend());

  function backendFuerKey(key) {
    const backendName = keyRouten.get(key) || standardBackendName;
    return backends.get(backendName) || backends.get(standardBackendName);
  }

  return {
    registriereBackend(name, backend) {
      if (!name || typeof name !== 'string' || !backend || typeof backend !== 'object') {
        return false;
      }
      if (typeof backend.lese !== 'function') {
        return false;
      }
      backends.set(name, backend);
      return true;
    },
    setzeRoute(key, backendName) {
      if (typeof key !== 'string' || !key || typeof backendName !== 'string' || !backendName) {
        return false;
      }
      if (!backends.has(backendName)) {
        return false;
      }
      keyRouten.set(key, backendName);
      return true;
    },
    leseText(key, fallback = null) {
      if (typeof key !== 'string' || !key) {
        return fallback;
      }
      const backend = backendFuerKey(key);
      if (!backend || typeof backend.lese !== 'function') {
        return fallback;
      }
      const wert = backend.lese(key);
      return typeof wert === 'string' ? wert : fallback;
    },
    leseJson(key, fallback = null) {
      const text = this.leseText(key, null);
      if (text == null || text === '') {
        return fallback;
      }
      try {
        return JSON.parse(text);
      } catch {
        return fallback;
      }
    },
    schreibeText(key, wert) {
      if (typeof key !== 'string' || !key) {
        return false;
      }
      const backend = backendFuerKey(key);
      if (!backend || typeof backend.schreibe !== 'function') {
        return false;
      }
      return backend.schreibe(key, String(wert));
    },
    schreibeJson(key, wert) {
      return this.schreibeText(key, JSON.stringify(wert));
    },
    loescheKey(key) {
      if (typeof key !== 'string' || !key) {
        return;
      }
      const backend = backendFuerKey(key);
      if (!backend || typeof backend.loesche !== 'function') {
        return;
      }
      backend.loesche(key);
    },
    loescheKeys(keys) {
      if (!Array.isArray(keys)) {
        return;
      }
      keys.forEach((key) => this.loescheKey(key));
    },
    loescheKeysMitPraefix(praefix) {
      if (typeof praefix !== 'string' || !praefix) {
        return;
      }
      try {
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (key && key.startsWith(praefix)) {
            this.loescheKey(key);
          }
        }
      } catch {
        /* ignorieren */
      }
    },
    /**
     * Summiert localStorage nach UTF-16-Länge von Key und Wert (übliche Näherung für die Nutzung pro Eintrag).
     * @returns {{ ok: boolean, htbahBytes: number, gesamtBytes: number, htbahSchluesselAnzahl: number, originLocalStorageSchluesselAnzahl: number }}
     */
    messeLocalStorageByteStatistik() {
      const zusaetzlicheAppKeys = new Set(['verstanden_am', 'entwicklungshinweis_verstanden_am']);
      let htbahBytes = 0;
      let gesamtBytes = 0;
      let htbahSchluesselAnzahl = 0;
      try {
        const n = localStorage.length;
        for (let i = 0; i < n; i += 1) {
          const key = localStorage.key(i);
          if (!key) {
            continue;
          }
          let wert = '';
          try {
            const raw = localStorage.getItem(key);
            wert = raw == null ? '' : raw;
          } catch {
            wert = '';
          }
          const eintragBytes = key.length * 2 + wert.length * 2;
          gesamtBytes += eintragBytes;
          if (key.startsWith('htbah_') || zusaetzlicheAppKeys.has(key)) {
            htbahBytes += eintragBytes;
            htbahSchluesselAnzahl += 1;
          }
        }
        return {
          ok: true,
          htbahBytes,
          gesamtBytes,
          htbahSchluesselAnzahl,
          originLocalStorageSchluesselAnzahl: n,
        };
      } catch {
        return {
          ok: false,
          htbahBytes: 0,
          gesamtBytes: 0,
          htbahSchluesselAnzahl: 0,
          originLocalStorageSchluesselAnzahl: 0,
        };
      }
    },
    listBackends() {
      return [...backends.keys()];
    },
    routeFuerKey(key) {
      return keyRouten.get(key) || standardBackendName;
    },
    standardBackend() {
      return standardBackendName;
    },
  };
}

const htbahSpeicher = erstelleSpeicherGateway();

function neueEntropieId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalisiereKampagneSicherheitsmechanismen(roh) {
  const quelle = roh && typeof roh === 'object' ? roh : {};
  return {
    tabuHtml: typeof quelle.tabuHtml === 'string' ? quelle.tabuHtml : '',
    schleierHtml: typeof quelle.schleierHtml === 'string' ? quelle.schleierHtml : '',
  };
}

function normalisiereSpielleitungMitglied(m) {
  if (!m || typeof m !== 'object') {
    return null;
  }
  return {
    id: typeof m.id === 'string' && m.id ? m.id : neueEntropieId(),
    charakter: window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(m.charakter),
    charakterBild: typeof m.charakterBild === 'string' ? m.charakterBild : '',
    charakterStorageId:
      typeof m.charakterStorageId === 'string' && m.charakterStorageId.trim()
        ? m.charakterStorageId.trim()
        : '',
  };
}

function normalisiereSpielleitungKampagne(g) {
  if (!g || typeof g !== 'object') {
    return null;
  }
  const mitglieder = Array.isArray(g.mitglieder)
    ? g.mitglieder.map(normalisiereSpielleitungMitglied).filter(Boolean)
    : [];
  const AB = window.HTBAH_SHARED;
  const abenteuerbuch = AB
    ? AB.normalisiereAbenteuerbuch(g.abenteuerbuch, g.abenteuerbuchHtml)
    : { reiter: [], aktiverReiterId: null };
  const atmosphaere = normalisiereAtmosphaereZustand(g.atmosphaere);
  const atmosphaereBadgePos = normalisiereAtmosphaereBadgePosition(g.atmosphaereBadgePos);
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  const zeitmessung = ZU
    ? ZU.normalisiereKampagnenZustand(g.zeitmessung)
    : g.zeitmessung && typeof g.zeitmessung === 'object'
      ? g.zeitmessung
      : null;
  const zeitmessungBadgePos = ZU
    ? ZU.normalisiereBadgePosition(g.zeitmessungBadgePos)
    : normalisiereAtmosphaereBadgePosition(g.zeitmessungBadgePos);
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  let labels = KL ? KL.normalisiereKampagneLabels(g.labels) : [];
  const KM = window.HTBAH_SHARED && window.HTBAH_SHARED.KonfliktModel;
  const konflikt = KM ? KM.normalisiereKonfliktZustand(g.konflikt) : null;
  const TE = window.HTBAH_SHARED && window.HTBAH_SHARED.ThemenEinstellungen;
  let themeSetting =
    TE && typeof TE.normalisiereKampagnenThemeSetting === 'function'
      ? TE.normalisiereKampagnenThemeSetting(g.themeSetting)
      : '';
  const demoKampagne = {
    id: typeof g.id === 'string' ? g.id : '',
    name: typeof g.name === 'string' ? g.name : '',
  };
  if (
    !themeSetting &&
    TE &&
    typeof TE.beispielDefaultThemeFuerKampagne === 'function' &&
    typeof TE.normalisiereKampagnenThemeSetting === 'function'
  ) {
    themeSetting = TE.normalisiereKampagnenThemeSetting(TE.beispielDefaultThemeFuerKampagne(demoKampagne));
  }
  if (
    KL &&
    TE &&
    typeof TE.beispielDefaultThemeFuerKampagne === 'function' &&
    Array.isArray(KL.STANDARD_KATALOG_EINTRAGE)
  ) {
    const demoTheme = TE.beispielDefaultThemeFuerKampagne(demoKampagne);
    const settingLabelId =
      demoTheme === 'scifi'
        ? 'lbl-setting-scifi'
        : demoTheme === 'gegenwart'
          ? 'lbl-setting-gegenwart'
          : demoTheme === 'fantasy'
            ? 'lbl-setting-mittelalter-fantasy'
            : '';
    const hatSettingLabel = labels.some((l) => l && l.kategorie === 'setting');
    if (settingLabelId && !hatSettingLabel) {
      const eintrag = KL.STANDARD_KATALOG_EINTRAGE.find((e) => e && e.id === settingLabelId);
      if (eintrag) {
        labels = KL.normalisiereKampagneLabels([eintrag, ...labels]);
      }
    }
  }
  return {
    id: typeof g.id === 'string' && g.id ? g.id : neueEntropieId(),
    name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : 'Kampagne',
    mitglieder,
    labels,
    themeSetting,
    abenteuerbuch,
    atmosphaere,
    atmosphaereBadgePos,
    zeitmessung,
    zeitmessungBadgePos,
    konflikt,
    sicherheitsmechanismen: normalisiereKampagneSicherheitsmechanismen(g.sicherheitsmechanismen),
  };
}

function ladeKampagnenLabelsKatalog() {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return { version: 1, eintraege: [] };
  }
  const roh = htbahSpeicher.leseJson(SPEICHER_KEY_KAMPAGNEN_LABELS_KATALOG, null);
  return KL.normalisiereKatalog(roh);
}

function speichereKampagnenLabelsKatalog(katalog) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return false;
  }
  const norm = KL.normalisiereKatalog(katalog);
  return htbahSpeicher.schreibeJson(SPEICHER_KEY_KAMPAGNEN_LABELS_KATALOG, norm);
}

function erstelleKampagnenLabelImKatalog(meta) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return { katalog: null, eintrag: null, neu: false };
  }
  const katalog = ladeKampagnenLabelsKatalog();
  const ergebnis = KL.erstelleKatalogEintrag(katalog, meta, neueEntropieId);
  if (ergebnis.katalog) {
    speichereKampagnenLabelsKatalog(ergebnis.katalog);
  }
  return ergebnis;
}

function aktualisiereKampagnenLabelImKatalog(eintragId, patch) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return false;
  }
  const next = KL.aktualisiereKatalogEintrag(ladeKampagnenLabelsKatalog(), eintragId, patch);
  return speichereKampagnenLabelsKatalog(next);
}

function importiereKampagnenLabelsInGlobalenKatalog(labelListe) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return false;
  }
  const snaps = KL.normalisiereKampagneLabels(labelListe);
  if (!snaps.length) {
    return true;
  }
  const next = KL.importLabelsInKatalog(ladeKampagnenLabelsKatalog(), snaps);
  return speichereKampagnenLabelsKatalog(next);
}

function loescheKampagnenLabelAusKatalog(eintragId) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return false;
  }
  const next = KL.entferneKatalogEintrag(ladeKampagnenLabelsKatalog(), eintragId);
  return speichereKampagnenLabelsKatalog(next);
}

function aktualisiereKampagneLabels(kampagneId, labels) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return false;
  }
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  const normLabels = KL ? KL.normalisiereKampagneLabels(labels) : [];
  const sl = ladeSpielleitungZustand();
  const idx = (Array.isArray(sl.kampagnen) ? sl.kampagnen : []).findIndex((k) => k && k.id === kid);
  if (idx < 0) {
    return false;
  }
  const kampagnen = sl.kampagnen.slice();
  kampagnen[idx] = { ...kampagnen[idx], labels: normLabels };
  sl.kampagnen = kampagnen;
  speichereSpielleitungZustand(sl);
  return true;
}

function setzeKampagneLabelAktiv(kampagneId, labelId, aktiv) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  const lid = typeof labelId === 'string' && labelId.trim() ? labelId.trim() : '';
  if (!kid || !lid) {
    return false;
  }
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return false;
  }
  const sl = ladeSpielleitungZustand();
  const kampagne = (Array.isArray(sl.kampagnen) ? sl.kampagnen : []).find((k) => k && k.id === kid);
  if (!kampagne) {
    return false;
  }
  let eintrag = KL.findeKatalogEintrag(ladeKampagnenLabelsKatalog(), { id: lid });
  if (!eintrag) {
    const snap = KL.normalisiereKampagneLabels(kampagne.labels).find((l) => l.id === lid);
    if (snap) {
      eintrag = snap;
    }
  }
  if (!eintrag && aktiv) {
    return false;
  }
  const labels = eintrag
    ? KL.setzeKampagneLabelAktiv(kampagne, eintrag, aktiv)
    : KL.normalisiereKampagneLabels(kampagne.labels).filter((l) => l.id !== lid);
  return aktualisiereKampagneLabels(kid, labels);
}

function kampagneLabelNachNameZuweisen(kampagneId, name) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return false;
  }
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return false;
  }
  const eintrag = KL.findeKatalogEintrag(ladeKampagnenLabelsKatalog(), { name });
  if (!eintrag) {
    return false;
  }
  return setzeKampagneLabelAktiv(kid, eintrag.id, true);
}

function kampagnenLabelBadgeKlasse(labelOderKategorie) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL) {
    return 'text-bg-secondary';
  }
  if (labelOderKategorie && typeof labelOderKategorie === 'object') {
    return KL.badgeKlasseFuerLabel(labelOderKategorie);
  }
  return KL.badgeKlasseFuerKategorie(labelOderKategorie);
}

function istKampagnenSpeicherKey(key) {
  return key === SPEICHER_KEY_SPIELLEITUNG || key === SPEICHER_KEY_SPIELLEITUNG_LEGACY;
}

function leseSpielleitungZustandRoh() {
  let roh = htbahSpeicher.leseJson(SPEICHER_KEY_SPIELLEITUNG, null);
  if (!roh || typeof roh !== 'object') {
    const legacy = htbahSpeicher.leseJson(SPEICHER_KEY_SPIELLEITUNG_LEGACY, null);
    if (legacy && typeof legacy === 'object') {
      roh = legacy;
      htbahSpeicher.schreibeJson(SPEICHER_KEY_SPIELLEITUNG, roh);
      htbahSpeicher.loescheKey(SPEICHER_KEY_SPIELLEITUNG_LEGACY);
    }
  }
  return roh && typeof roh === 'object' ? roh : null;
}

function normalisiereMitgliedFuerKampagnenUebersicht(mitglied) {
  if (!mitglied || typeof mitglied !== 'object') {
    return null;
  }
  const id = typeof mitglied.id === 'string' ? mitglied.id : '';
  const name =
    mitglied.charakter && typeof mitglied.charakter.name === 'string'
      ? mitglied.charakter.name.trim()
      : '';
  const charakterBild =
    typeof mitglied.charakterBild === 'string' ? mitglied.charakterBild : '';
  return {
    id,
    charakter: { name },
    charakterBild,
  };
}

/** Leichtgewichtige Kampagnenliste für die Übersicht (ohne Abenteuerbuch-/Konflikt-Normalisierung). */
function ladeSpielleitungKampagnenUebersichtListe() {
  const roh = leseSpielleitungZustandRoh();
  if (!roh || !Array.isArray(roh.kampagnen)) {
    return [];
  }
  return roh.kampagnen
    .filter((g) => g && typeof g.id === 'string' && g.id.trim())
    .map((g) => ({
      id: g.id.trim(),
      name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : 'Kampagne',
      mitglieder: Array.isArray(g.mitglieder)
        ? g.mitglieder.map(normalisiereMitgliedFuerKampagnenUebersicht).filter(Boolean)
        : [],
      labels: Array.isArray(g.labels) ? g.labels : [],
    }));
}

function ladeSpielleitungZustandLeicht() {
  const roh = leseSpielleitungZustandRoh();
  if (!roh) {
    return {
      version: 1,
      kampagnen: [],
      aktiveKampagneId: null,
      mitgliedWahlProKampagne: {},
      gruppen: [],
      aktiveGruppeId: null,
      mitgliedWahlProGruppe: {},
    };
  }
  return ladeSpielleitungZustandLeichtAusRoh(roh);
}

function ladeSpielleitungZustandLeichtAusRoh(roh) {
  const kampagnen = Array.isArray(roh.kampagnen)
    ? roh.kampagnen.filter((g) => g && typeof g.id === 'string' && g.id)
    : [];
  let aktiveKampagneId = typeof roh.aktiveKampagneId === 'string' ? roh.aktiveKampagneId : null;
  if (aktiveKampagneId && !kampagnen.some((g) => g.id === aktiveKampagneId)) {
    aktiveKampagneId = kampagnen[0] ? kampagnen[0].id : null;
  }
  const mitgliedWahl =
    roh.mitgliedWahlProKampagne && typeof roh.mitgliedWahlProKampagne === 'object'
      ? roh.mitgliedWahlProKampagne
      : {};
  return {
    version: 1,
    kampagnen,
    aktiveKampagneId,
    mitgliedWahlProKampagne: mitgliedWahl,
    gruppen: kampagnen,
    aktiveGruppeId: aktiveKampagneId,
    mitgliedWahlProGruppe: mitgliedWahl,
  };
}

function migriereFehlendeDemoKampagnenDefaultsInRoh(roh, kampagnenNorm) {
  if (!roh || !Array.isArray(roh.kampagnen) || !Array.isArray(kampagnenNorm)) {
    return false;
  }
  const normById = new Map(
    kampagnenNorm
      .filter((k) => k && typeof k.id === 'string' && k.id)
      .map((k) => [k.id, k]),
  );
  let geaendert = false;
  roh.kampagnen = roh.kampagnen.map((rohK) => {
    if (!rohK || typeof rohK.id !== 'string' || !rohK.id) {
      return rohK;
    }
    const norm = normById.get(rohK.id);
    if (!norm) {
      return rohK;
    }
    let next = rohK;
    if (norm.themeSetting && !rohK.themeSetting) {
      next = { ...next, themeSetting: norm.themeSetting };
      geaendert = true;
    }
    const rohHatSetting =
      Array.isArray(rohK.labels) && rohK.labels.some((l) => l && l.kategorie === 'setting');
    const normHatSetting =
      Array.isArray(norm.labels) && norm.labels.some((l) => l && l.kategorie === 'setting');
    if (normHatSetting && !rohHatSetting) {
      next = { ...next, labels: norm.labels };
      geaendert = true;
    }
    return next;
  });
  return geaendert;
}

function ladeSpielleitungZustand() {
  const roh = leseSpielleitungZustandRoh();
  if (!roh) {
    return {
      version: 1,
      kampagnen: [],
      aktiveKampagneId: null,
      mitgliedWahlProKampagne: {},
      gruppen: [],
      aktiveGruppeId: null,
      mitgliedWahlProGruppe: {},
    };
  }
  if (htbahSpeicherBulkModusTiefe > 0) {
    return ladeSpielleitungZustandLeichtAusRoh(roh);
  }
  const kampagnen = Array.isArray(roh.kampagnen)
    ? roh.kampagnen.map(normalisiereSpielleitungKampagne).filter(Boolean)
    : [];
  if (migriereFehlendeDemoKampagnenDefaultsInRoh(roh, kampagnen)) {
    speichereSpielleitungRoh(roh);
  }
  let aktiveKampagneId = typeof roh.aktiveKampagneId === 'string' ? roh.aktiveKampagneId : null;
  if (aktiveKampagneId && !kampagnen.some((g) => g.id === aktiveKampagneId)) {
    aktiveKampagneId = kampagnen[0] ? kampagnen[0].id : null;
  }
  return {
    version: 1,
    kampagnen,
    aktiveKampagneId,
    mitgliedWahlProKampagne:
      roh.mitgliedWahlProKampagne && typeof roh.mitgliedWahlProKampagne === 'object'
        ? roh.mitgliedWahlProKampagne
        : {},
    gruppen: kampagnen,
    aktiveGruppeId: aktiveKampagneId,
    mitgliedWahlProGruppe:
      roh.mitgliedWahlProKampagne && typeof roh.mitgliedWahlProKampagne === 'object'
        ? roh.mitgliedWahlProKampagne
        : {},
  };
}

let htbahKampagneDatenEventUnterdrueckungTiefe = 0;
let htbahSpeicherBulkModusTiefe = 0;
let htbahFortschrittAktiv = false;
const htbahKampagneDatenEventQueue = [];

const SAH =
  window.HTBAH_SHARED && window.HTBAH_SHARED.SpeicherAufgabeHilfen
    ? window.HTBAH_SHARED.SpeicherAufgabeHilfen
    : null;

const HTBAH_DIAG_LOG = window.HTBAH_DIAG || null;

function htbahDiagLog(bereich, phase, details) {
  if (HTBAH_DIAG_LOG && typeof HTBAH_DIAG_LOG.log === 'function') {
    HTBAH_DIAG_LOG.log(bereich, phase, details);
  }
}

function htbahYieldAnMainThread() {
  if (SAH && typeof SAH.yieldAnMainThread === 'function') {
    return SAH.yieldAnMainThread();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function htbahEnqueueKampagneDatenGeaendert(detail) {
  if (!detail || typeof detail !== 'object') {
    return;
  }
  htbahKampagneDatenEventQueue.push(detail);
  htbahDiagLog('events', 'enqueue', detail);
}

function htbahFlushKampagneDatenEvents() {
  if (!htbahKampagneDatenEventQueue.length) {
    return;
  }
  const queue = htbahKampagneDatenEventQueue.splice(0);
  htbahDiagLog('events', 'flush-sync', queue.length);
  queue.forEach((detail) => {
    try {
      window.dispatchEvent(new CustomEvent('htbah:kampagne-daten-geaendert', { detail }));
    } catch {
      /* ignorieren */
    }
  });
}

async function htbahFlushKampagneDatenEventsAsync() {
  if (!htbahKampagneDatenEventQueue.length) {
    return;
  }
  const queue = htbahKampagneDatenEventQueue.splice(0);
  htbahDiagLog('events', 'flush-async-start', queue.length);
  for (let i = 0; i < queue.length; i += 1) {
    const detail = queue[i];
    await htbahYieldAnMainThread();
    try {
      htbahDiagLog('events', 'dispatch', detail);
      window.dispatchEvent(new CustomEvent('htbah:kampagne-daten-geaendert', { detail }));
    } catch {
      /* ignorieren */
    }
  }
  htbahDiagLog('events', 'flush-async-fertig');
}

function htbahDispatchKampagneDatenGeaendert(detail) {
  if (htbahFortschrittAktiv || htbahKampagneDatenEventUnterdrueckungTiefe > 0) {
    htbahEnqueueKampagneDatenGeaendert(detail);
    return;
  }
  try {
    htbahDiagLog('events', 'dispatch', detail);
    window.dispatchEvent(new CustomEvent('htbah:kampagne-daten-geaendert', { detail }));
  } catch {
    /* ignorieren */
  }
}

function htbahBulkSpeicherModusBeendet() {
  if (htbahKampagneDatenEventUnterdrueckungTiefe === 0 && !htbahFortschrittAktiv) {
    htbahFlushKampagneDatenEvents();
  }
}

function htbahMitUnterdruecktenKampagneDatenEvents(fn) {
  htbahKampagneDatenEventUnterdrueckungTiefe += 1;
  try {
    return fn();
  } finally {
    htbahKampagneDatenEventUnterdrueckungTiefe -= 1;
  }
}

/** Unterdrückt Events und vermeidet teure Voll-Normalisierung bei jedem Speicher-Lesen. */
function htbahMitBulkSpeicherModus(fn) {
  htbahKampagneDatenEventUnterdrueckungTiefe += 1;
  htbahSpeicherBulkModusTiefe += 1;
  try {
    return fn();
  } finally {
    htbahSpeicherBulkModusTiefe -= 1;
    htbahKampagneDatenEventUnterdrueckungTiefe -= 1;
    htbahBulkSpeicherModusBeendet();
  }
}

async function htbahMitBulkSpeicherModusAsync(fn) {
  htbahKampagneDatenEventUnterdrueckungTiefe += 1;
  htbahSpeicherBulkModusTiefe += 1;
  try {
    return await fn();
  } finally {
    htbahSpeicherBulkModusTiefe -= 1;
    htbahKampagneDatenEventUnterdrueckungTiefe -= 1;
    htbahBulkSpeicherModusBeendet();
  }
}

function speichereSpielleitungRoh(roh) {
  if (!roh || typeof roh !== 'object') {
    return false;
  }
  return htbahSpeicher.schreibeJson(SPEICHER_KEY_SPIELLEITUNG, roh);
}

function listeSpeicherKeysMitPraefix(praefix) {
  if (typeof praefix !== 'string' || !praefix) {
    return [];
  }
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(praefix)) {
        keys.push(key);
      }
    }
  } catch {
    /* ignorieren */
  }
  return keys;
}

function speichereSpielleitungZustand(zustand) {
  htbahSpeicher.schreibeJson(SPEICHER_KEY_SPIELLEITUNG, zustand);
  const kid =
    zustand && typeof zustand.aktiveKampagneId === 'string' && zustand.aktiveKampagneId.trim()
      ? zustand.aktiveKampagneId.trim()
      : null;
  htbahDispatchKampagneDatenGeaendert({ art: 'spielleitung', kampagneId: kid });
}

function kampagnenSlugAusName(name) {
  const basis = String(name || '')
    .toLocaleLowerCase('de')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return basis || 'kampagne';
}

const KAMPAGNEN_TAB_IDS = new Set(['gruppe', 'einstellungen', 'welt', 'zufallstabellen', 'assets']);
const KAMPAGNEN_TAB_LEGACY_IDS = new Set(['generatoren']);

function normalisiereKampagnenTabId(tab, fallback = 'einstellungen') {
  if (tab === 'generatoren') {
    return 'assets';
  }
  return KAMPAGNEN_TAB_IDS.has(tab) ? tab : fallback;
}

function leseTabProKampagneMap() {
  const roh = leseSpielleitungZustandRoh();
  if (!roh || !roh.tabProKampagne || typeof roh.tabProKampagne !== 'object') {
    return {};
  }
  return roh.tabProKampagne;
}

function leseGespeichertenKampagnenTab(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  const tab = leseTabProKampagneMap()[kid];
  const normal = normalisiereKampagnenTabId(tab, '');
  return KAMPAGNEN_TAB_IDS.has(normal) ? normal : null;
}

function kampagnenEinstiegsTab(kampagneId) {
  return leseGespeichertenKampagnenTab(kampagneId) || 'einstellungen';
}

function speichereKampagnenTab(kampagneId, tab) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  const normal = normalisiereKampagnenTabId(tab, '');
  const tabFinal = KAMPAGNEN_TAB_IDS.has(normal) ? normal : null;
  if (!kid || !tabFinal) {
    return false;
  }
  const roh = leseSpielleitungZustandRoh();
  if (!roh) {
    return false;
  }
  if (!roh.tabProKampagne || typeof roh.tabProKampagne !== 'object') {
    roh.tabProKampagne = {};
  }
  if (roh.tabProKampagne[kid] === tabFinal) {
    return true;
  }
  roh.tabProKampagne[kid] = tabFinal;
  return speichereSpielleitungRoh(roh);
}

function findeSpielleitungKampagneNachId(kampagneId) {
  const kid = typeof kampagneId === 'string' ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  const zustand = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
  return kampagnen.find((k) => k && k.id === kid) || null;
}

function kampagneIdAusPfad(pfad) {
  const p = typeof pfad === 'string' ? pfad : '';
  const parts = p.split('/').filter(Boolean);
  if (
    parts.length >= 3 &&
    parts[0] === 'kampagnen' &&
    (KAMPAGNEN_TAB_IDS.has(parts[2]) || KAMPAGNEN_TAB_LEGACY_IDS.has(parts[2]))
  ) {
    return kampagneIdAusSlug(parts[1]);
  }
  return null;
}

function kampagneIdAusSlug(slugRaw) {
  const slug = typeof slugRaw === 'string' ? decodeURIComponent(slugRaw) : '';
  if (!slug) {
    return null;
  }
  const zustand = ladeSpielleitungZustandLeicht();
  const kampagnen = Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
  const gefunden = kampagnen.find((k) => k && kampagnenSlugAusName(k.name) === slug) || null;
  return gefunden && typeof gefunden.id === 'string' && gefunden.id ? gefunden.id : null;
}

function kampagnenEinstiegsPfadFuerSlug(slugRaw) {
  const slug = typeof slugRaw === 'string' ? decodeURIComponent(slugRaw) : '';
  const kid = kampagneIdAusSlug(slug);
  if (kid) {
    return kampagnenPfad(null, kid);
  }
  const sichererSlug = slug || 'kampagne';
  return `/kampagnen/${encodeURIComponent(sichererSlug)}/einstellungen`;
}

function kampagnenPfad(tab = null, kampagneId = null) {
  const zielTab =
    tab === null || tab === undefined
      ? null
      : normalisiereKampagnenTabId(tab, 'einstellungen');
  const zustand = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
  if (!kampagnen.length) {
    return '/kampagnen';
  }
  let aktive = null;
  if (typeof kampagneId === 'string' && kampagneId) {
    aktive = kampagnen.find((k) => k && k.id === kampagneId) || null;
  }
  if (!aktive && typeof zustand.aktiveKampagneId === 'string' && zustand.aktiveKampagneId) {
    aktive = kampagnen.find((k) => k && k.id === zustand.aktiveKampagneId) || null;
  }
  if (!aktive) {
    aktive = kampagnen[0] || null;
  }
  if (!aktive) {
    return '/kampagnen';
  }
  const tabEffektiv = zielTab || kampagnenEinstiegsTab(aktive.id);
  return `/kampagnen/${encodeURIComponent(kampagnenSlugAusName(aktive.name))}/${tabEffektiv}`;
}

function normalisiereZufallstabellenMedium(eintrag) {
  if (!eintrag || typeof eintrag !== 'object') {
    return null;
  }
  const dataUrl = typeof eintrag.dataUrl === 'string' ? eintrag.dataUrl.trim() : '';
  if (!dataUrl.startsWith('data:')) {
    return null;
  }
  const mimeType = typeof eintrag.mimeType === 'string' && eintrag.mimeType.trim()
    ? eintrag.mimeType.trim()
    : (dataUrl.match(/^data:([^;,]+)/i) || [])[1] || '';
  const istBild = mimeType.startsWith('image/') || dataUrl.startsWith('data:image/');
  const typ = eintrag.typ === 'bild' || eintrag.typ === 'datei' ? eintrag.typ : (istBild ? 'bild' : 'datei');
  const fallbackName = istBild ? 'Bild' : 'Datei';
  const name = typeof eintrag.name === 'string' && eintrag.name.trim() ? eintrag.name.trim() : fallbackName;
  return {
    id: typeof eintrag.id === 'string' && eintrag.id ? eintrag.id : neueEntropieId(),
    typ,
    name,
    mimeType,
    dataUrl,
    size: Number.isFinite(eintrag.size) && eintrag.size > 0 ? Math.round(eintrag.size) : null,
    createdAt: typeof eintrag.createdAt === 'string' ? eintrag.createdAt : '',
  };
}

function normalisiereZufallstabellenMedienListe(medien) {
  if (!Array.isArray(medien)) {
    return [];
  }
  return medien.map(normalisiereZufallstabellenMedium).filter(Boolean);
}

function normalisiereZufallstabellenKartenIcon(kartenIcon, entityTyp) {
  const api = window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon;
  if (!api || typeof api.normalisiereKartenIcon !== 'function') {
    return {
      quelle: '',
      emoji: '',
      mediumId: '',
      eigenDataUrl: '',
      form: 'eckig',
    };
  }
  return api.normalisiereKartenIcon(kartenIcon, entityTyp);
}

function normalisiereZufallstabellenPrimaryMediumId(primaryMediumId, medien) {
  const bilder = Array.isArray(medien)
    ? medien.filter(
        (m) =>
          m &&
          (m.typ === 'bild' ||
            (typeof m.mimeType === 'string' && m.mimeType.startsWith('image/')) ||
            (typeof m.dataUrl === 'string' && m.dataUrl.startsWith('data:image/'))),
      )
    : [];
  const rohId = typeof primaryMediumId === 'string' ? primaryMediumId.trim() : '';
  if (rohId && bilder.some((m) => m.id === rohId)) {
    return rohId;
  }
  return bilder[0] && typeof bilder[0].id === 'string' ? bilder[0].id : '';
}

function normalisiereZufallstabellenInventarListe(arr) {
  const M = window.HTBAH_CHARAKTER_MODEL;
  if (!Array.isArray(arr)) {
    return [];
  }
  if (!M || typeof M.inventarEintragNachTypBereinigen !== 'function') {
    return [];
  }
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      if (M.istInventarWaffenlosEintrag && M.istInventarWaffenlosEintrag(item)) {
        return null;
      }
      return M.inventarEintragNachTypBereinigen({
        id:
          typeof item.id === 'string' && item.id
            ? item.id
            : typeof M.neueInventarId === 'function'
              ? M.neueInventarId()
              : `inv-${Date.now()}`,
        name: typeof item.name === 'string' ? item.name : '',
        typ: item.typ,
        beschreibungHtml: typeof item.beschreibungHtml === 'string' ? item.beschreibungHtml : '',
        rustwert: item.rustwert,
        schadenswert: item.schadenswert,
        kampfart: item.kampfart,
        schadenswertNahkampf: item.schadenswertNahkampf,
        schadenswertFernkampf: item.schadenswertFernkampf,
        gegenstandId: item.gegenstandId,
      });
    })
    .filter(Boolean);
}

/** Entity-Felder alter Speicherstände (Waffe/Schaden) — nur für Import-Migration ins Inventar. */
function legacyKampfwerteAusImportZeile(z, typ) {
  if (!z || typeof z !== 'object') {
    return {};
  }
  const out = {};
  const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  const waffe = str(z.waffe);
  if (waffe) {
    out.waffe = waffe;
  }
  const nah = str(z.schadenswertNahkampf);
  if (nah) {
    out.schadenswertNahkampf = nah;
  }
  const fern = str(z.schadenswertFernkampf);
  if (fern) {
    out.schadenswertFernkampf = fern;
  }
  if (typ === 'npc') {
    const wl = str(z.waffenloserKampf);
    if (wl) {
      out.waffenloserKampf = wl;
    }
  }
  if (typ === 'bestie') {
    const angriff = str(z.angriff);
    if (angriff) {
      out.angriff = angriff;
    }
    const verteidigung = str(z.verteidigung);
    if (verteidigung) {
      out.verteidigung = verteidigung;
    }
  }
  return out;
}

function normalisiereZufallstabellenNpcZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  const M = window.HTBAH_CHARAKTER_MODEL;
  const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
  const rohZeile = {
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
    geheimnis: typeof z.geheimnis === 'string' ? z.geheimnis : '',
    stimme: typeof z.stimme === 'string' ? z.stimme : '',
    lebenspunkte: typeof z.lebenspunkte === 'string' ? z.lebenspunkte : '',
    kampfZustand: ermittleKampfZustandFuerNpcBestie(z),
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    presetId: typeof z.presetId === 'string' ? z.presetId : '',
    handeln: Array.isArray(z.handeln) ? z.handeln : z.handeln,
    wissen: Array.isArray(z.wissen) ? z.wissen : z.wissen,
    soziales: Array.isArray(z.soziales) ? z.soziales : z.soziales,
    fraktion: typeof z.fraktion === 'string' ? z.fraktion : '',
    glaube: typeof z.glaube === 'string' ? z.glaube : '',
    initiative: typeof z.initiative === 'string' ? z.initiative : '',
    inventar: normalisiereZufallstabellenInventarListe(z.inventar),
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
  };
  let migriert =
    M && typeof M.migriereLegacyKampfwerteNachInventar === 'function'
      ? M.migriereLegacyKampfwerteNachInventar(
          { ...rohZeile, ...legacyKampfwerteAusImportZeile(z, 'npc') },
          { npc: true },
        )
      : rohZeile;
  if (EF && typeof EF.normalisiereEntitaetFaehigkeiten === 'function') {
    migriert = EF.normalisiereEntitaetFaehigkeiten(migriert, { typ: 'npc' });
  }
  return migriert;
}

function normalisiereZufallstabellenOrtZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    groesse: typeof z.groesse === 'string' ? z.groesse : '',
    lage: typeof z.lage === 'string' ? z.lage : '',
    zustand: typeof z.zustand === 'string' ? z.zustand : '',
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
    kartenIcon: normalisiereZufallstabellenKartenIcon(z.kartenIcon, 'ort'),
  };
}

function normalisiereZufallstabellenGegenstandZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    kategorie: ['waffe', 'kleidung', 'sonstiges'].includes(z.kategorie) ? z.kategorie : '',
    beschreibungHtml: typeof z.beschreibungHtml === 'string' ? z.beschreibungHtml : '',
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    inGegenstandId: typeof z.inGegenstandId === 'string' ? z.inGegenstandId.trim() : '',
    besitzerTyp: typeof z.besitzerTyp === 'string' ? z.besitzerTyp.trim() : '',
    besitzerId: typeof z.besitzerId === 'string' ? z.besitzerId.trim() : '',
    istWaffe: Boolean(z.istWaffe),
    schadenswertNahkampf: typeof z.schadenswertNahkampf === 'string' ? z.schadenswertNahkampf : '',
    schadenswertFernkampf: typeof z.schadenswertFernkampf === 'string' ? z.schadenswertFernkampf : '',
    fraktionen: Array.isArray(z.fraktionen)
      ? z.fraktionen.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean)
      : [],
    lpBewusstlosAusgeblendet: Boolean(z.lpBewusstlosAusgeblendet),
    lpMassenschadenBewusstlos: Boolean(z.lpMassenschadenBewusstlos),
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
    kartenIcon: normalisiereZufallstabellenKartenIcon(z.kartenIcon, 'gegenstand'),
  };
}

function normalisiereZufallstabellenFraktionZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const orteListe = Array.isArray(z.orte)
    ? z.orte
        .map((ort) => (typeof ort === 'string' ? ort.trim() : ''))
        .filter(Boolean)
    : [];
  const altAufenthaltsort = typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort.trim() : '';
  const orte = orteListe.length ? orteListe : altAufenthaltsort ? [altAufenthaltsort] : [];
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    art: typeof z.art === 'string' ? z.art : '',
    name: typeof z.name === 'string' ? z.name : '',
    ziel: typeof z.ziel === 'string' ? z.ziel : '',
    gesinnungVerhalten: typeof z.gesinnungVerhalten === 'string' ? z.gesinnungVerhalten : '',
    orte,
    beschreibungHtml: typeof z.beschreibungHtml === 'string' ? z.beschreibungHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
    kartenIcon: normalisiereZufallstabellenKartenIcon(z.kartenIcon, 'fraktion'),
  };
}

function normalisiereZufallstabellenPantheonZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    geschlecht: typeof z.geschlecht === 'string' ? z.geschlecht : '',
    domaene: typeof z.domaene === 'string' ? z.domaene : '',
    charakter: typeof z.charakter === 'string' ? z.charakter : '',
    staerke: typeof z.staerke === 'string' ? z.staerke : '',
    schwaeche: typeof z.schwaeche === 'string' ? z.schwaeche : '',
    schutzpatronat: typeof z.schutzpatronat === 'string' ? z.schutzpatronat : '',
    verlangen: typeof z.verlangen === 'string' ? z.verlangen : '',
    mythosGaben: typeof z.mythosGaben === 'string' ? z.mythosGaben : '',
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
  };
}

function normalisiereZufallstabellenRaetselZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    art: typeof z.art === 'string' ? z.art : '',
    titel: typeof z.titel === 'string' ? z.titel : '',
    aufgabeWas: typeof z.aufgabeWas === 'string' ? z.aufgabeWas : '',
    aufgabenstellung: typeof z.aufgabenstellung === 'string' ? z.aufgabenstellung : '',
    ergebnis: typeof z.ergebnis === 'string' ? z.ergebnis : '',
    schwierigkeit: typeof z.schwierigkeit === 'string' ? z.schwierigkeit : '',
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    gegenstandId: typeof z.gegenstandId === 'string' ? z.gegenstandId.trim() : '',
    geloest: Boolean(z.geloest),
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
    kartenIcon: normalisiereZufallstabellenKartenIcon(z.kartenIcon, 'raetsel'),
  };
}

function bereinigeZufallstabellenParentReferenzen(zustand) {
  if (!zustand || typeof zustand !== 'object') {
    return zustand;
  }
  const gegenstaende = Array.isArray(zustand.gegenstaende)
    ? zustand.gegenstaende.filter((g) => g && g.id)
    : [];
  const gegenstandIds = new Set(gegenstaende.map((g) => String(g.id)));
  const npcIds = new Set((zustand.npcs || []).filter((n) => n && n.id).map((n) => String(n.id)));
  const bestieIds = new Set((zustand.bestien || []).filter((b) => b && b.id).map((b) => String(b.id)));
  const byId = new Map(gegenstaende.map((g) => [String(g.id), g]));
  zustand.gegenstaende = gegenstaende.map((g) => {
    const id = String(g.id);
    let parentId = String(g.inGegenstandId || '').trim();
    if (!parentId || parentId === id || !gegenstandIds.has(parentId)) {
      parentId = '';
    } else {
      const besucht = new Set([id]);
      let aktuell = parentId;
      while (aktuell) {
        if (besucht.has(aktuell)) {
          parentId = '';
          break;
        }
        besucht.add(aktuell);
        const parent = byId.get(aktuell);
        aktuell = parent ? String(parent.inGegenstandId || '').trim() : '';
      }
    }
    let besitzerTyp = String(g.besitzerTyp || '').trim();
    let besitzerId = String(g.besitzerId || '').trim();
    if (besitzerTyp === 'npc' && (!besitzerId || !npcIds.has(besitzerId))) {
      besitzerTyp = '';
      besitzerId = '';
    } else if (besitzerTyp === 'bestie' && (!besitzerId || !bestieIds.has(besitzerId))) {
      besitzerTyp = '';
      besitzerId = '';
    } else if (besitzerTyp === 'charakter') {
      if (!besitzerId) {
        besitzerTyp = '';
      }
    } else if (besitzerTyp) {
      besitzerTyp = '';
      besitzerId = '';
    }
    return { ...g, inGegenstandId: parentId, besitzerTyp, besitzerId };
  });
  zustand.raetsel = (Array.isArray(zustand.raetsel) ? zustand.raetsel : [])
    .filter((r) => r && r.id)
    .map((r) => {
      const gegenstandId = String(r.gegenstandId || '').trim();
      if (gegenstandId && gegenstandIds.has(gegenstandId)) {
        return { ...r, gegenstandId };
      }
      return { ...r, gegenstandId: '' };
    });
  return synchronisiereGegenstandBesitzerAusInventar(zustand);
}

function synchronisiereGegenstandBesitzerAusInventar(zustand) {
  if (!zustand || typeof zustand !== 'object') {
    return zustand;
  }
  const zuordnung = new Map();
  const ausInventar = (typ, entityId, inventar) => {
    const besitzerId = String(entityId || '').trim();
    if (!besitzerId) {
      return;
    }
    (Array.isArray(inventar) ? inventar : []).forEach((item) => {
      const gegenstandId = String(item && item.gegenstandId ? item.gegenstandId : '').trim();
      if (gegenstandId) {
        zuordnung.set(gegenstandId, { typ, id: besitzerId });
      }
    });
  };
  (zustand.npcs || []).forEach((npc) => {
    if (npc && npc.id) {
      ausInventar('npc', npc.id, npc.inventar);
    }
  });
  (zustand.bestien || []).forEach((bestie) => {
    if (bestie && bestie.id) {
      ausInventar('bestie', bestie.id, bestie.inventar);
    }
  });
  if (!zuordnung.size) {
    return zustand;
  }
  zustand.gegenstaende = (zustand.gegenstaende || []).map((g) => {
    if (!g || !g.id) {
      return g;
    }
    const inv = zuordnung.get(String(g.id));
    if (!inv) {
      return g;
    }
    const besitzerTyp = String(g.besitzerTyp || '').trim();
    const besitzerId = String(g.besitzerId || '').trim();
    if (besitzerTyp && besitzerId) {
      return g;
    }
    return { ...g, besitzerTyp: inv.typ, besitzerId: inv.id };
  });
  return zustand;
}

function entferneZufallstabellenParentReferenzenAufGegenstand(zustand, geloeschteGegenstandId) {
  const id = String(geloeschteGegenstandId || '').trim();
  if (!id || !zustand || typeof zustand !== 'object') {
    return zustand;
  }
  zustand.gegenstaende = (zustand.gegenstaende || []).map((g) =>
    g && String(g.inGegenstandId || '').trim() === id ? { ...g, inGegenstandId: '' } : g,
  );
  zustand.raetsel = (zustand.raetsel || []).map((r) =>
    r && String(r.gegenstandId || '').trim() === id ? { ...r, gegenstandId: '' } : r,
  );
  return zustand;
}

function entferneZufallstabellenBesitzerReferenzen(zustand, besitzerTyp, besitzerId) {
  const typ = String(besitzerTyp || '').trim();
  const id = String(besitzerId || '').trim();
  if (!typ || !id || !zustand || typeof zustand !== 'object') {
    return zustand;
  }
  zustand.gegenstaende = (zustand.gegenstaende || []).map((g) => {
    if (!g || String(g.besitzerTyp || '').trim() !== typ || String(g.besitzerId || '').trim() !== id) {
      return g;
    }
    return { ...g, besitzerTyp: '', besitzerId: '' };
  });
  return zustand;
}

function entferneGegenstandAusAllenInventaren(zustand, gegenstandId) {
  const id = String(gegenstandId || '').trim();
  if (!id || !zustand || typeof zustand !== 'object') {
    return zustand;
  }
  const ohneGegenstand = (row) => {
    if (!row || !Array.isArray(row.inventar)) {
      return row;
    }
    return {
      ...row,
      inventar: row.inventar.filter((item) => item && String(item.gegenstandId || '').trim() !== id),
    };
  };
  zustand.npcs = (zustand.npcs || []).map(ohneGegenstand);
  zustand.bestien = (zustand.bestien || []).map(ohneGegenstand);
  return zustand;
}

function zstDuplizierAktualisiereParentReferenzen(zielZ, idMaps) {
  if (!zielZ || !idMaps) {
    return;
  }
  (zielZ.gegenstaende || []).forEach((g) => {
    if (!g) {
      return;
    }
    const parent = String(g.inGegenstandId || '').trim();
    if (!parent) {
      return;
    }
    const neu = idMaps.gegenstand && idMaps.gegenstand[parent];
    if (neu) {
      g.inGegenstandId = neu;
    }
  });
  (zielZ.raetsel || []).forEach((r) => {
    if (!r) {
      return;
    }
    const gegenstand = String(r.gegenstandId || '').trim();
    if (!gegenstand) {
      return;
    }
    const neu = idMaps.gegenstand && idMaps.gegenstand[gegenstand];
    if (neu) {
      r.gegenstandId = neu;
    }
  });
  (zielZ.gegenstaende || []).forEach((g) => {
    if (!g) {
      return;
    }
    const typ = String(g.besitzerTyp || '').trim();
    const id = String(g.besitzerId || '').trim();
    if (!typ || !id) {
      return;
    }
    const map = idMaps[typ];
    const neu = map && map[id];
    if (neu) {
      g.besitzerId = neu;
    }
  });
  const inventarGegenstandIdAktualisieren = (liste) => {
    (liste || []).forEach((row) => {
      if (!row || !Array.isArray(row.inventar)) {
        return;
      }
      row.inventar.forEach((item) => {
        if (!item) {
          return;
        }
        const alt = String(item.gegenstandId || '').trim();
        if (!alt) {
          return;
        }
        const neu = idMaps.gegenstand && idMaps.gegenstand[alt];
        if (neu) {
          item.gegenstandId = neu;
        }
      });
    });
  };
  inventarGegenstandIdAktualisieren(zielZ.npcs);
  inventarGegenstandIdAktualisieren(zielZ.bestien);
}

function normalisiereZufallstabellenBestieZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const epocheRaw = typeof z.epoche === 'string' ? z.epoche : '';
  const epoche =
    epocheRaw === 'gegenwart' || epocheRaw === 'zukunft' ? epocheRaw : 'mittelalter';
  const katRaw = typeof z.kategorie === 'string' ? z.kategorie : '';
  const kategorie =
    katRaw === 'fantasy_tier' || katRaw === 'mutiert' || katRaw === 'monster'
      ? katRaw
      : 'normales_tier';
  let agg = Number(z.aggressivitaetSkala);
  if (!Number.isFinite(agg)) {
    agg = 5;
  }
  agg = Math.round(agg);
  if (agg < 1) {
    agg = 1;
  }
  if (agg > 10) {
    agg = 10;
  }
  const M = window.HTBAH_CHARAKTER_MODEL;
  const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
  const rohZeile = {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    epoche,
    kategorie,
    name: typeof z.name === 'string' ? z.name : '',
    lebenspunkte: typeof z.lebenspunkte === 'string' ? z.lebenspunkte : '',
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    presetId: typeof z.presetId === 'string' ? z.presetId : '',
    handeln: Array.isArray(z.handeln) ? z.handeln : z.handeln,
    wissen: Array.isArray(z.wissen) ? z.wissen : z.wissen,
    soziales: Array.isArray(z.soziales) ? z.soziales : z.soziales,
    initiative: typeof z.initiative === 'string' ? z.initiative : '',
    kampfZustand: ermittleKampfZustandFuerNpcBestie(z),
    staerke: typeof z.staerke === 'string' ? z.staerke : '',
    schwaeche: typeof z.schwaeche === 'string' ? z.schwaeche : '',
    geheimnis: typeof z.geheimnis === 'string' ? z.geheimnis : '',
    fraktionen: Array.isArray(z.fraktionen)
      ? z.fraktionen.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean)
      : [],
    beschreibungHtml: typeof z.beschreibungHtml === 'string' ? z.beschreibungHtml : '',
    aggressivitaetSkala: agg,
    inventar: normalisiereZufallstabellenInventarListe(z.inventar),
    medien: normalisiereZufallstabellenMedienListe(z.medien),
  };
  let migriert =
    M && typeof M.migriereLegacyKampfwerteNachInventar === 'function'
      ? M.migriereLegacyKampfwerteNachInventar(
          { ...rohZeile, ...legacyKampfwerteAusImportZeile(z, 'bestie') },
          { bestie: true },
        )
      : rohZeile;
  if (EF && typeof EF.normalisiereEntitaetFaehigkeiten === 'function') {
    migriert = EF.normalisiereEntitaetFaehigkeiten(migriert, {
      typ: 'bestie',
      fallbackEpocheUi: epoche,
    });
  }
  return migriert;
}

function zufallstabellenSpeicherKeyFuerKampagne(kampagneId) {
  if (typeof kampagneId !== 'string' || !kampagneId.trim()) {
    return '';
  }
  return `${SPEICHER_KEY_ZUFALLSTABELLEN}__${kampagneId.trim()}`;
}

function weltenbauSpeicherKeyFuerKampagne(kampagneId) {
  if (typeof kampagneId !== 'string' || !kampagneId.trim()) {
    return '';
  }
  return `${SPEICHER_KEY_WELTENBAU}__${kampagneId.trim()}`;
}

function ermittleKampagneIdFuerKampagnenSpeicher(kampagneId) {
  if (typeof kampagneId === 'string' && kampagneId.trim()) {
    return kampagneId.trim();
  }
  const z = ladeSpielleitungZustand();
  return typeof z.aktiveKampagneId === 'string' && z.aktiveKampagneId.trim()
    ? z.aktiveKampagneId.trim()
    : '';
}

function leerenZufallstabellenZustand() {
  return {
    version: 1,
    npcs: [],
    orte: [],
    gegenstaende: [],
    fraktionen: [],
    pantheon: [],
    raetsel: [],
    bestien: [],
  };
}

function loescheZufallstabellenUndWeltenbauFuerKampagne(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return;
  }
  htbahSpeicher.loescheKey(zufallstabellenSpeicherKeyFuerKampagne(kid));
  htbahSpeicher.loescheKey(weltenbauSpeicherKeyFuerKampagne(kid));
}

const ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET = new Set([
  'npcs',
  'orte',
  'gegenstaende',
  'fraktionen',
  'pantheon',
  'raetsel',
  'bestien',
]);

/**
 * @param {string} kampagneId
 * @param {string | null} listenSchluessel Eine Liste (z. B. 'orte') oder null für die gesamte Zufallstabellen-Datei dieser Kampagne.
 */
function loescheZufallstabellenListeFuerKampagne(kampagneId, listenSchluessel) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return false;
  }
  if (listenSchluessel == null) {
    htbahSpeicher.loescheKey(zufallstabellenSpeicherKeyFuerKampagne(kid));
    htbahDispatchKampagneDatenGeaendert({ art: 'zufallstabellen', kampagneId: kid });
    return true;
  }
  if (!ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(listenSchluessel)) {
    return false;
  }
  const z = ladeZufallstabellenZustand(kid);
  z[listenSchluessel] = [];
  speichereZufallstabellenZustand(z, kid);
  return true;
}

/**
 * @param {string} kampagneId
 * @param {'alles' | 'galerie' | 'interaktive_welt' | 'interaktive_welt_einstellungen' | 'generatoren' | 'assets'} bereich
 */
function loescheWeltenbauBereichFuerKampagne(kampagneId, bereich) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return false;
  }
  if (bereich === 'alles') {
    htbahSpeicher.loescheKey(weltenbauSpeicherKeyFuerKampagne(kid));
    htbahDispatchKampagneDatenGeaendert({ art: 'weltenbau', kampagneId: kid });
    return true;
  }
  const wb = ladeWeltenbauZustand(kid);
  if (bereich === 'galerie') {
    wb.eintraege = [];
  } else if (bereich === 'generatoren' || bereich === 'assets') {
    wb.generatorUrls = {};
    wb.generatorAufrufe = {};
  } else if (bereich === 'interaktive_welt') {
    wb.mapLayouts = {};
    wb.mapBildLayouts = {};
    wb.mapFreieBilder = {};
    wb.mapFreieNotizen = {};
    wb.mapFreiePfeile = {};
    wb.mapHintergruende = {};
    wb.mapEinstellungen = {};
    wb.mapElementLocks = {};
  } else if (bereich === 'interaktive_welt_einstellungen') {
    wb.mapEinstellungen = {};
    wb.mapElementLocks = {};
  } else {
    return false;
  }
  speichereWeltenbauZustand(wb, kid);
  return true;
}

function loescheSpielleitungKampagneKomplett(kampagneId) {
  const gid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!gid) {
    return { ok: false, grund: 'Keine Kampagne.' };
  }
  return htbahMitBulkSpeicherModus(() => loescheSpielleitungKampagneKomplettIntern(gid));
}

function loescheVerknuepfteCharaktereDerKampagne(gid) {
  const roh = leseSpielleitungZustandRoh();
  const kampagnen = roh && Array.isArray(roh.kampagnen) ? roh.kampagnen : [];
  const kampagne = kampagnen.find((k) => k && k.id === gid);
  if (!kampagne) {
    return;
  }
  const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
  const storageIds = new Set();
  mitglieder.forEach((m) => {
    const sid =
      m && typeof m.charakterStorageId === 'string' ? m.charakterStorageId.trim() : '';
    if (sid) {
      storageIds.add(sid);
    }
  });
  storageIds.forEach((charakterId) => {
    loescheCharakterById(charakterId);
  });
}

function loescheSpielleitungKampagneKomplettIntern(gid, opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const eventsMelden = o.eventsMelden !== false;
  const roh = leseSpielleitungZustandRoh();
  const kampagnen = roh && Array.isArray(roh.kampagnen) ? roh.kampagnen : [];
  if (!kampagnen.some((k) => k && k.id === gid)) {
    return { ok: false, grund: 'Kampagne nicht gefunden.', aktivKampagneId: null };
  }
  loescheVerknuepfteCharaktereDerKampagne(gid);
  loescheZufallstabellenUndWeltenbauFuerKampagne(gid);
  roh.kampagnen = kampagnen.filter((x) => !x || x.id !== gid);
  if (!roh.mitgliedWahlProKampagne || typeof roh.mitgliedWahlProKampagne !== 'object') {
    roh.mitgliedWahlProKampagne = {};
  }
  delete roh.mitgliedWahlProKampagne[gid];
  if (!roh.tabProKampagne || typeof roh.tabProKampagne !== 'object') {
    roh.tabProKampagne = {};
  }
  delete roh.tabProKampagne[gid];
  if (roh.aktiveKampagneId === gid) {
    const erste = roh.kampagnen.find((k) => k && k.id);
    roh.aktiveKampagneId = erste ? erste.id : null;
  }
  speichereSpielleitungRoh(roh);
  const fabSpeicher = window.HTBAH_FLOATING_FAB_SPEICHER;
  if (fabSpeicher && typeof fabSpeicher.entferneKampagne === 'function') {
    fabSpeicher.entferneKampagne(gid);
  }
  const aktiv =
    typeof roh.aktiveKampagneId === 'string' && roh.aktiveKampagneId.trim()
      ? roh.aktiveKampagneId.trim()
      : null;
  if (eventsMelden) {
    htbahDispatchKampagneDatenGeaendert({ art: 'zufallstabellen', kampagneId: gid });
    htbahDispatchKampagneDatenGeaendert({ art: 'weltenbau', kampagneId: gid });
    htbahDispatchKampagneDatenGeaendert({ art: 'spielleitung', kampagneId: aktiv });
  }
  return { ok: true, aktivKampagneId: aktiv };
}

async function loescheSpielleitungKampagneKomplettAsync(kampagneId, report) {
  const gid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!gid) {
    return { ok: false, grund: 'Keine Kampagne.' };
  }
  htbahDiagLog('loeschen', 'kampagne-start', gid);
  return htbahMitBulkSpeicherModusAsync(async () => {
    const schritte = [
      {
        label: 'Verknüpfte Charaktere werden entfernt …',
        fn: async () => {
          loescheVerknuepfteCharaktereDerKampagne(gid);
        },
      },
      {
        label: 'Zufallstabellen und Weltenbau werden entfernt …',
        fn: async () => {
          loescheZufallstabellenUndWeltenbauFuerKampagne(gid);
        },
      },
      {
        label: 'Kampagne wird aus der Liste entfernt …',
        fn: async () => {
          const roh = leseSpielleitungZustandRoh();
          const kampagnen = roh && Array.isArray(roh.kampagnen) ? roh.kampagnen : [];
          if (!kampagnen.some((k) => k && k.id === gid)) {
            throw new Error('Kampagne nicht gefunden.');
          }
          roh.kampagnen = kampagnen.filter((x) => !x || x.id !== gid);
          if (!roh.mitgliedWahlProKampagne || typeof roh.mitgliedWahlProKampagne !== 'object') {
            roh.mitgliedWahlProKampagne = {};
          }
          delete roh.mitgliedWahlProKampagne[gid];
          if (!roh.tabProKampagne || typeof roh.tabProKampagne !== 'object') {
            roh.tabProKampagne = {};
          }
          delete roh.tabProKampagne[gid];
          if (roh.aktiveKampagneId === gid) {
            const erste = roh.kampagnen.find((k) => k && k.id);
            roh.aktiveKampagneId = erste ? erste.id : null;
          }
          speichereSpielleitungRoh(roh);
        },
      },
      {
        label: 'Floating Buttons werden bereinigt …',
        fn: async () => {
          const fabSpeicher = window.HTBAH_FLOATING_FAB_SPEICHER;
          if (fabSpeicher && typeof fabSpeicher.entferneKampagne === 'function') {
            fabSpeicher.entferneKampagne(gid);
          }
        },
      },
    ];
    try {
      if (SAH && typeof SAH.fuehreSchritteMitFortschrittAus === 'function') {
        await SAH.fuehreSchritteMitFortschrittAus(schritte, report);
      } else {
        for (const schritt of schritte) {
          await htbahYieldAnMainThread();
          await schritt.fn();
          if (typeof report === 'function') {
            report({ prozent: 50, text: schritt.label });
          }
        }
      }
      if (typeof report === 'function') {
      report({ prozent: 100, text: 'Kampagne gelöscht.' });
    }
    await htbahYieldAnMainThread();
    htbahDiagLog('loeschen', 'kampagne-fertig', gid);
    return { ok: true };
    } catch (err) {
      htbahDiagLog('loeschen', 'kampagne-fehler', err && err.message ? err.message : err);
      if (typeof report === 'function') {
        report({
          prozent: 0,
          text: err && err.message ? err.message : 'Löschen fehlgeschlagen.',
        });
      }
      return { ok: false, grund: err && err.message ? err.message : 'Löschen fehlgeschlagen.' };
    }
  });
}

const ALLE_LOKALEN_APP_SPEICHER_KEYS = [
  'htbah_app_rolle',
  'htbah_active_character_id',
  'htbah_characters',
  'htbah_character',
  'htbah_character_image',
  'htbah_presets',
  'htbah_theme',
  'htbah_spielleitung_kampagnen',
  'htbah_kampagnen_labels_katalog',
  'htbah_zufallstabellen',
  'htbah_weltenbau',
  'htbah_wuerfel_audio',
  'htbah_wuerfel_sound',
  'htbah_zeitmessung_einstellungen',
  'htbah_zeitmessung_badge_pos',
  'htbah_abenteuerbuch_einstellungen',
  'htbah_dice_colors',
  'htbah_wuerfel_beutel_fenster',
  'htbah_konflikt_fenster',
  'htbah_offene_modals',
  'htbah_floating_fab_pos',
  'htbah_wuerfelbecher_bundle',
  'htbah_orientation_mode',
  'htbah_orientation_anchor_angle',
  'htbah_interaktive_welt_stats_anzeigen',
  'htbah_zeichen_brett',
  'htbah_effekt_rahmen_einstellungen',
  'htbah_token_export_einstellungen',
  'verstanden_am',
  'entwicklungshinweis_verstanden_am',
];

async function loescheAlleLokalenAppDatenAsync(report) {
  htbahDiagLog('loeschen', 'alles-start');
  return htbahMitBulkSpeicherModusAsync(async () => {
    if (typeof report === 'function') {
      report({ prozent: 0, text: 'Speicher-Einträge werden gesammelt …' });
    }
    await htbahYieldAnMainThread();
    const keySet = new Set(ALLE_LOKALEN_APP_SPEICHER_KEYS);
    listeSpeicherKeysMitPraefix(HTBAH_SPEICHER_KEYS.zufallstabellenProKampagnePraefix).forEach((k) =>
      keySet.add(k),
    );
    listeSpeicherKeysMitPraefix(HTBAH_SPEICHER_KEYS.weltenbauProKampagnePraefix).forEach((k) =>
      keySet.add(k),
    );
    const keys = [...keySet];
    if (SAH && typeof SAH.loescheKeysMitFortschritt === 'function') {
      await SAH.loescheKeysMitFortschritt(keys, report, {
        paketGroesse: 2,
        label: 'Lokale App-Daten',
        maxProzent: 85,
        abschlussMelden: false,
      });
    } else {
      keys.forEach((k) => htbahSpeicher.loescheKey(k));
      if (typeof report === 'function') {
        report({ prozent: 85, text: 'Lokale App-Daten gelöscht.' });
      }
    }
    if (typeof report === 'function') {
      report({ prozent: 90, text: 'Modale und Floating Buttons werden zurückgesetzt …' });
    }
    await htbahYieldAnMainThread();
    if (window.HTBAH && typeof window.HTBAH.loescheOffeneModalsSpeicher === 'function') {
      window.HTBAH.loescheOffeneModalsSpeicher();
    }
    loescheFloatingFabSpeicherKomplett();
    if (typeof report === 'function') {
      report({ prozent: 100, text: 'Alle lokalen Daten wurden gelöscht.' });
    }
    await htbahYieldAnMainThread();
    htbahDiagLog('loeschen', 'alles-fertig');
    return { ok: true, appDatenGeleert: true };
  });
}

function loescheFloatingFabSpeicherKomplett() {
  const fabSpeicher = window.HTBAH_FLOATING_FAB_SPEICHER;
  if (fabSpeicher && typeof fabSpeicher.loescheAlle === 'function') {
    fabSpeicher.loescheAlle();
  }
  window.dispatchEvent(new CustomEvent('htbah:floating-fab-speicher-geleert'));
}

function ladeZufallstabellenZustand(kampagneId) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher(kampagneId);
  if (!kid) {
    return leerenZufallstabellenZustand();
  }
  const speicherKey = zufallstabellenSpeicherKeyFuerKampagne(kid);
  const roh = htbahSpeicher.leseJson(speicherKey, null);
  if (!roh || typeof roh !== 'object') {
    return leerenZufallstabellenZustand();
  }
  return bereinigeZufallstabellenParentReferenzen({
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
    fraktionen: Array.isArray(roh.fraktionen)
      ? roh.fraktionen.map(normalisiereZufallstabellenFraktionZeile).filter(Boolean)
      : [],
    pantheon: Array.isArray(roh.pantheon)
      ? roh.pantheon.map(normalisiereZufallstabellenPantheonZeile).filter(Boolean)
      : [],
    raetsel: Array.isArray(roh.raetsel)
      ? roh.raetsel.map(normalisiereZufallstabellenRaetselZeile).filter(Boolean)
      : [],
    bestien: Array.isArray(roh.bestien)
      ? roh.bestien.map(normalisiereZufallstabellenBestieZeile).filter(Boolean)
      : [],
  });
}

function zufallstabellenZustandFuerSpeicher(zustand) {
  const z = zustand && typeof zustand === 'object' ? zustand : {};
  return bereinigeZufallstabellenParentReferenzen({
    version: 1,
    npcs: Array.isArray(z.npcs)
      ? z.npcs.map(normalisiereZufallstabellenNpcZeile).filter(Boolean)
      : [],
    orte: Array.isArray(z.orte)
      ? z.orte.map(normalisiereZufallstabellenOrtZeile).filter(Boolean)
      : [],
    gegenstaende: Array.isArray(z.gegenstaende)
      ? z.gegenstaende.map(normalisiereZufallstabellenGegenstandZeile).filter(Boolean)
      : [],
    fraktionen: Array.isArray(z.fraktionen)
      ? z.fraktionen.map(normalisiereZufallstabellenFraktionZeile).filter(Boolean)
      : [],
    pantheon: Array.isArray(z.pantheon)
      ? z.pantheon.map(normalisiereZufallstabellenPantheonZeile).filter(Boolean)
      : [],
    raetsel: Array.isArray(z.raetsel)
      ? z.raetsel.map(normalisiereZufallstabellenRaetselZeile).filter(Boolean)
      : [],
    bestien: Array.isArray(z.bestien)
      ? z.bestien.map(normalisiereZufallstabellenBestieZeile).filter(Boolean)
      : [],
  });
}

function speichereZufallstabellenZustand(zustand, kampagneId) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher(kampagneId);
  if (!kid) {
    return;
  }
  const speicherKey = zufallstabellenSpeicherKeyFuerKampagne(kid);
  htbahSpeicher.schreibeJson(speicherKey, zufallstabellenZustandFuerSpeicher(zustand));
  htbahDispatchKampagneDatenGeaendert({ art: 'zufallstabellen', kampagneId: kid });
}

function erstellePantheonExportPaket(kampagneId) {
  const z = ladeZufallstabellenZustand(kampagneId);
  return {
    htbahExportVersion: 1,
    typ: 'zufallstabellen-pantheon',
    exportiertAm: new Date().toISOString(),
    pantheon: JSON.parse(JSON.stringify(z.pantheon || [])),
  };
}

function pantheonImportAusPaket(roh) {
  if (!roh || typeof roh !== 'object') {
    return { ok: false, fehler: 'Kein gültiges JSON-Objekt.' };
  }
  if (
    roh.htbahExportVersion !== 1 ||
    roh.typ !== 'zufallstabellen-pantheon' ||
    !Array.isArray(roh.pantheon)
  ) {
    return {
      ok: false,
      fehler:
        'Ungültige Pantheon-Datei. Bitte eine JSON-Datei aus „Pantheon exportieren“ (Zufallstabellen) verwenden.',
    };
  }
  const pantheon = roh.pantheon.map(normalisiereZufallstabellenPantheonZeile).filter(Boolean);
  return { ok: true, pantheon };
}

function atmosphaereLeer() {
  return {
    version: 1,
    jahreszeitId: '',
    jahreszeitLabel: '',
    jahreszeitEmoji: '',
    jahreszeitFarbe: '',
    tageszeitId: '',
    tageszeitLabel: '',
    tageszeitEmoji: '',
    tageszeitFarbe: '',
    temperatur: '',
    bewoelkung: '',
    niederschlagKey: '',
    niederschlagLabel: '',
    niederschlagEmoji: '',
    wind: '',
    windStaerke: '',
    windBeaufort: '',
    wetterAkzentFarbe: '',
  };
}

function normalisiereAtmosphaereZustand(roh) {
  const A = window.HTBAH && window.HTBAH.AtmosphaereZufall;
  const leer = atmosphaereLeer();
  if (!roh || typeof roh !== 'object') {
    return leer;
  }
  const jId = typeof roh.jahreszeitId === 'string' ? roh.jahreszeitId : '';
  const tId = typeof roh.tageszeitId === 'string' ? roh.tageszeitId : '';
  let jh = {
    jahreszeitLabel: typeof roh.jahreszeitLabel === 'string' ? roh.jahreszeitLabel : '',
    jahreszeitEmoji: typeof roh.jahreszeitEmoji === 'string' ? roh.jahreszeitEmoji : '',
    jahreszeitFarbe: typeof roh.jahreszeitFarbe === 'string' ? roh.jahreszeitFarbe : '',
  };
  let th = {
    tageszeitLabel: typeof roh.tageszeitLabel === 'string' ? roh.tageszeitLabel : '',
    tageszeitEmoji: typeof roh.tageszeitEmoji === 'string' ? roh.tageszeitEmoji : '',
    tageszeitFarbe: typeof roh.tageszeitFarbe === 'string' ? roh.tageszeitFarbe : '',
  };
  if (A && jId) {
    const m = A.jahreszeitMeta(jId);
    if (m) {
      jh = {
        jahreszeitLabel: jh.jahreszeitLabel || m.label,
        jahreszeitEmoji: jh.jahreszeitEmoji || m.emoji,
        jahreszeitFarbe: jh.jahreszeitFarbe || m.farbe,
      };
    }
  }
  if (A && tId) {
    const m = A.tageszeitMeta(tId);
    if (m) {
      th = {
        tageszeitLabel: th.tageszeitLabel || m.label,
        tageszeitEmoji: th.tageszeitEmoji || m.emoji,
        tageszeitFarbe: th.tageszeitFarbe || m.farbe,
      };
    }
  }
  return {
    version: 1,
    jahreszeitId: jId,
    ...jh,
    tageszeitId: tId,
    ...th,
    temperatur: typeof roh.temperatur === 'string' ? roh.temperatur : '',
    bewoelkung: typeof roh.bewoelkung === 'string' ? roh.bewoelkung : '',
    niederschlagKey: typeof roh.niederschlagKey === 'string' ? roh.niederschlagKey : '',
    niederschlagLabel: typeof roh.niederschlagLabel === 'string' ? roh.niederschlagLabel : '',
    niederschlagEmoji: typeof roh.niederschlagEmoji === 'string' ? roh.niederschlagEmoji : '',
    wind: typeof roh.wind === 'string' ? roh.wind : '',
    ...(() => {
      let ws = typeof roh.windStaerke === 'string' ? roh.windStaerke : '';
      let wb = typeof roh.windBeaufort === 'string' ? roh.windBeaufort : '';
      const AZ = window.HTBAH && window.HTBAH.AtmosphaereZufall;
      if (AZ && typeof AZ.windStaerkeUndBeaufortNormalisieren === 'function') {
        const w = AZ.windStaerkeUndBeaufortNormalisieren(ws, wb);
        ws = w.windStaerke;
        wb = w.windBeaufort;
      }
      return { windStaerke: ws, windBeaufort: wb };
    })(),
    wetterAkzentFarbe: typeof roh.wetterAkzentFarbe === 'string' ? roh.wetterAkzentFarbe : '',
  };
}

function normalisiereAtmosphaereBadgePosition(roh) {
  if (!roh || typeof roh !== 'object') {
    return null;
  }
  if (roh.mode === 'fixed' && typeof roh.left === 'number' && typeof roh.top === 'number') {
    return { mode: 'fixed', left: roh.left, top: roh.top };
  }
  return null;
}

function findeKampagneById(zustand, kampagneId) {
  if (!zustand || !Array.isArray(zustand.kampagnen) || typeof kampagneId !== 'string' || !kampagneId) {
    return null;
  }
  return zustand.kampagnen.find((k) => k && k.id === kampagneId) || null;
}

function aktualisiereKampagneFeld(kampagneId, mutator) {
  if (typeof kampagneId !== 'string' || !kampagneId || typeof mutator !== 'function') {
    return false;
  }
  const zustand = ladeSpielleitungZustand();
  const kampagne = findeKampagneById(zustand, kampagneId);
  if (!kampagne) {
    return false;
  }
  mutator(kampagne);
  speichereSpielleitungZustand(zustand);
  return true;
}

function ladeKampagnenAtmosphaereZustand(kampagneId) {
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kampagneId);
  return normalisiereAtmosphaereZustand(kampagne && kampagne.atmosphaere);
}

function speichereKampagnenAtmosphaereZustand(kampagneId, zustand) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.atmosphaere = normalisiereAtmosphaereZustand(zustand);
  });
}

function ladeKampagnenAtmosphaereBadgePosition(kampagneId) {
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kampagneId);
  return normalisiereAtmosphaereBadgePosition(kampagne && kampagne.atmosphaereBadgePos);
}

function speichereKampagnenAtmosphaereBadgePosition(kampagneId, pos) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.atmosphaereBadgePos = normalisiereAtmosphaereBadgePosition(pos);
  });
}

function ladeKampagnenKonfliktZustand(kampagneId) {
  const KM = window.HTBAH_SHARED && window.HTBAH_SHARED.KonfliktModel;
  const leer = KM ? KM.leererKonfliktZustand() : { teilnehmer: [], aktiverTab: 'auswahl' };
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kampagneId);
  return KM ? KM.normalisiereKonfliktZustand(kampagne && kampagne.konflikt) : leer;
}

function speichereKampagnenKonfliktZustand(kampagneId, zustand) {
  const KM = window.HTBAH_SHARED && window.HTBAH_SHARED.KonfliktModel;
  const normalisiert = KM ? KM.normalisiereKonfliktZustand(zustand) : zustand;
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  const ok = aktualisiereKampagneFeld(kid, (kampagne) => {
    kampagne.konflikt = normalisiert;
  });
  if (ok) {
    htbahDispatchKampagneDatenGeaendert({ art: 'konflikt', kampagneId: kid });
  }
  return ok;
}

function normalisiereKampagnenZeitmessungZustand(roh) {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  if (ZU && typeof ZU.normalisiereKampagnenZustand === 'function') {
    return ZU.normalisiereKampagnenZustand(roh);
  }
  return roh && typeof roh === 'object' ? roh : null;
}

function normalisiereKampagnenZeitmessungBadgePosition(roh) {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  if (ZU && typeof ZU.normalisiereBadgePosition === 'function') {
    return ZU.normalisiereBadgePosition(roh);
  }
  return normalisiereAtmosphaereBadgePosition(roh);
}

function migriereGlobaleZeitmessungBadgePosZuKampagne(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kid);
  if (!kampagne) {
    return null;
  }
  const vorhanden = normalisiereKampagnenZeitmessungBadgePosition(kampagne.zeitmessungBadgePos);
  if (vorhanden) {
    return vorhanden;
  }
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_ZEITMESSUNG_BADGE_POS, null);
    if (roh && String(roh).trim().startsWith('{')) {
      const global = normalisiereKampagnenZeitmessungBadgePosition(JSON.parse(roh));
      if (global) {
        speichereKampagnenZeitmessungBadgePosition(kid, global);
        try {
          htbahSpeicher.loescheKey(SPEICHER_KEY_ZEITMESSUNG_BADGE_POS);
        } catch {
          /* optional */
        }
        return global;
      }
    }
  } catch {
    /* defektes JSON */
  }
  return null;
}

function ladeKampagnenZeitmessungZustand(kampagneId) {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  const leer =
    ZU && typeof ZU.leererKampagnenZustand === 'function'
      ? ZU.leererKampagnenZustand()
      : { modus: 'timer', status: 'bereit', eingabeH: 0, eingabeM: 0, eingabeS: 0 };
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kampagneId);
  return normalisiereKampagnenZeitmessungZustand(kampagne && kampagne.zeitmessung) || leer;
}

function speichereKampagnenZeitmessungZustand(kampagneId, zustand) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.zeitmessung = normalisiereKampagnenZeitmessungZustand(zustand);
  });
}

function ladeKampagnenZeitmessungBadgePosition(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  migriereGlobaleZeitmessungBadgePosZuKampagne(kid);
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kid);
  return normalisiereKampagnenZeitmessungBadgePosition(kampagne && kampagne.zeitmessungBadgePos);
}

function speichereKampagnenZeitmessungBadgePosition(kampagneId, pos) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.zeitmessungBadgePos = normalisiereKampagnenZeitmessungBadgePosition(pos);
  });
}

function ladeZeitmessungBadgePosition() {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher();
  if (kid) {
    return ladeKampagnenZeitmessungBadgePosition(kid);
  }
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_ZEITMESSUNG_BADGE_POS, null);
    if (roh && String(roh).trim().startsWith('{')) {
      return normalisiereKampagnenZeitmessungBadgePosition(JSON.parse(roh));
    }
  } catch {
    /* defektes JSON */
  }
  return null;
}

function speichereZeitmessungBadgePosition(pos) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher();
  const normalisiert = normalisiereKampagnenZeitmessungBadgePosition(pos);
  if (kid) {
    speichereKampagnenZeitmessungBadgePosition(kid, normalisiert);
    return;
  }
  if (normalisiert) {
    htbahSpeicher.schreibeText(SPEICHER_KEY_ZEITMESSUNG_BADGE_POS, JSON.stringify(normalisiert));
  } else {
    try {
      htbahSpeicher.loescheKey(SPEICHER_KEY_ZEITMESSUNG_BADGE_POS);
    } catch {
      /* optional */
    }
  }
}

function ladeKampagnenAbenteuerbuch(kampagneId) {
  const kampagne = findeKampagneById(ladeSpielleitungZustand(), kampagneId);
  const AB = window.HTBAH_SHARED;
  if (!AB || typeof AB.normalisiereAbenteuerbuch !== 'function') {
    return { reiter: [], aktiverReiterId: null };
  }
  if (!kampagne) {
    return AB.erstelleLeeresAbenteuerbuch();
  }
  return AB.normalisiereAbenteuerbuch(kampagne.abenteuerbuch, kampagne.abenteuerbuchHtml);
}

function speichereKampagnenAbenteuerbuch(kampagneId, abenteuerbuch) {
  const AB = window.HTBAH_SHARED;
  const norm =
    AB && typeof AB.normalisiereAbenteuerbuch === 'function'
      ? AB.normalisiereAbenteuerbuch(abenteuerbuch)
      : abenteuerbuch;
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.abenteuerbuch = norm;
    delete kampagne.abenteuerbuchHtml;
  });
}

function ladeKampagnenAbenteuerbuchHtml(kampagneId) {
  const AB = window.HTBAH_SHARED;
  if (AB && typeof AB.abenteuerbuchErsterReiterHtml === 'function') {
    return AB.abenteuerbuchErsterReiterHtml(ladeKampagnenAbenteuerbuch(kampagneId));
  }
  return '';
}

function speichereKampagnenAbenteuerbuchHtml(kampagneId, html) {
  const AB = window.HTBAH_SHARED;
  const basis = ladeKampagnenAbenteuerbuch(kampagneId);
  const reiter = Array.isArray(basis.reiter) ? basis.reiter.map((t) => ({ ...t })) : [];
  if (!reiter.length) {
    const id =
      AB && typeof AB.neueAbenteuerbuchReiterId === 'function'
        ? AB.neueAbenteuerbuchReiterId()
        : `ab-${Date.now()}`;
    reiter.push({
      id,
      name: AB ? AB.ABENTEUERBUCH_DEFAULT_REITER_NAME : 'Übersicht',
      html: typeof html === 'string' ? html : '',
    });
    basis.aktiverReiterId = id;
  } else {
    const ziel =
      reiter.find((t) => t.id === basis.aktiverReiterId) || reiter[0];
    ziel.html = typeof html === 'string' ? html : '';
  }
  return speichereKampagnenAbenteuerbuch(kampagneId, { ...basis, reiter });
}

function loescheKampagnenAbenteuerbuch(kampagneId) {
  const AB = window.HTBAH_SHARED;
  const leer =
    AB && typeof AB.erstelleLeeresAbenteuerbuch === 'function'
      ? AB.erstelleLeeresAbenteuerbuch()
      : { reiter: [], aktiverReiterId: null };
  return speichereKampagnenAbenteuerbuch(kampagneId, leer);
}

function normalisiereWeltenbauEintrag(e) {
  if (!e || typeof e !== 'object') {
    return null;
  }
  const dataUrl = typeof e.dataUrl === 'string' ? e.dataUrl : '';
  if (!dataUrl.startsWith('data:image/')) {
    return null;
  }
  return {
    id: typeof e.id === 'string' && e.id ? e.id : neueEntropieId(),
    name: typeof e.name === 'string' ? e.name : '',
    dataUrl,
    hinzugefuegtAm:
      typeof e.hinzugefuegtAm === 'string' && e.hinzugefuegtAm ? e.hinzugefuegtAm : new Date().toISOString(),
  };
}

function normalisiereWeltenbauGeneratorUrls(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([id, url]) => {
    if (typeof id !== 'string' || !id || typeof url !== 'string') {
      return;
    }
    const t = url.trim();
    if (/^https?:\/\//i.test(t)) {
      map[id] = t;
    }
  });
  return map;
}

function normalisiereWeltenbauMapHintergruende(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([gruppeId, dataUrl]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || typeof dataUrl !== 'string') {
      return;
    }
    const t = dataUrl.trim();
    if (t.startsWith('data:image/')) {
      map[gruppeId] = t;
    }
  });
  return map;
}

function normalisiereWeltenbauMapEinstellungen(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([gruppeId, einstellungen]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || !einstellungen || typeof einstellungen !== 'object') {
      return;
    }
    const zoomScaleNum = Number(einstellungen.zoomScale);
    const zoomScale = Number.isFinite(zoomScaleNum)
      ? Math.max(0.01, Math.min(10, zoomScaleNum))
      : 1;
    const itemScaleNum = Number(einstellungen.itemScale);
    const itemScale = Number.isFinite(itemScaleNum) ? Math.max(0, Math.min(500, Math.round(itemScaleNum))) : 100;
    const edgeWidthNum = Number(einstellungen.edgeWidth);
    const edgeWidth = Number.isFinite(edgeWidthNum) ? Math.max(1, Math.min(16, Math.round(edgeWidthNum))) : 4;
    const mapCenterXNum = Number(einstellungen.mapCenterX);
    const mapCenterYNum = Number(einstellungen.mapCenterY);
    const mapCenterX = Number.isFinite(mapCenterXNum) ? Math.round(mapCenterXNum) : 2600;
    const mapCenterY = Number.isFinite(mapCenterYNum) ? Math.round(mapCenterYNum) : 1800;
    const edgeColorRoh = typeof einstellungen.edgeColor === 'string' ? einstellungen.edgeColor.trim() : '';
    const edgeColor = /^#[0-9a-fA-F]{6}$/.test(edgeColorRoh) ? edgeColorRoh : '#5c636a';
    const filter = einstellungen.sichtbarkeitsFilter && typeof einstellungen.sichtbarkeitsFilter === 'object'
      ? einstellungen.sichtbarkeitsFilter
      : {};
    const kampfwerteAnzeigen =
      typeof einstellungen.kampfwerteAnzeigen === 'boolean' ? einstellungen.kampfwerteAnzeigen : false;
    map[gruppeId] = {
      zoomScale,
      itemScale,
      edgeColor,
      edgeWidth,
      mapCenterX,
      mapCenterY,
      kampfwerteAnzeigen,
      sichtbarkeitsFilter: {
        toteNpcsAnzeigen: filter.toteNpcsAnzeigen !== false,
        toteBestienAnzeigen: filter.toteBestienAnzeigen !== false,
        geloesteRaetselAnzeigen: filter.geloesteRaetselAnzeigen !== false,
      },
    };
  });
  return map;
}

function weltenbauInteraktiveWeltEinstellungenExportDaten(wb) {
  return {
    mapEinstellungen: JSON.parse(JSON.stringify(wb.mapEinstellungen || {})),
    mapElementLocks: JSON.parse(JSON.stringify(wb.mapElementLocks || {})),
  };
}

function wendeWeltenbauInteraktiveWeltEinstellungenImport(wb, daten) {
  const d = daten && typeof daten === 'object' ? daten : {};
  wb.mapEinstellungen = normalisiereWeltenbauMapEinstellungen(d.mapEinstellungen);
  wb.mapElementLocks = normalisiereWeltenbauMapElementLocks(d.mapElementLocks);
}

function normalisiereWeltenbauEinzelBildLayout(layout) {
  if (!layout || typeof layout !== 'object') {
    return null;
  }
  const x = Math.round(Number(layout.x) || 0);
  const y = Math.round(Number(layout.y) || 0);
  const width = Math.max(1, Math.round(Number(layout.width) || 260));
  const height = Math.max(1, Math.round(Number(layout.height) || 180));
  const winkelRaw = Number(layout.angleDeg);
  const angleDeg = Number.isFinite(winkelRaw)
    ? Math.max(-3600, Math.min(3600, Math.round(winkelRaw * 100) / 100))
    : 0;
  return { x, y, width, height, angleDeg };
}

function istWeltenbauEinzelBildLayout(wert) {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) {
    return false;
  }
  const kern = ['x', 'y', 'width', 'height', 'angleDeg'];
  const hatKern = kern.some((k) => Object.prototype.hasOwnProperty.call(wert, k));
  if (!hatKern) {
    return false;
  }
  const fremd = Object.keys(wert).filter((k) => !kern.includes(k));
  return fremd.length === 0;
}

function normalisiereWeltenbauMapBildLayouts(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  const flacheLayouts = {};
  Object.entries(roh).forEach(([gruppeId, gruppeLayouts]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || !gruppeLayouts || typeof gruppeLayouts !== 'object') {
      return;
    }
    if (istWeltenbauEinzelBildLayout(gruppeLayouts)) {
      const normalisiert = normalisiereWeltenbauEinzelBildLayout(gruppeLayouts);
      if (normalisiert) {
        flacheLayouts[gruppeId] = normalisiert;
      }
      return;
    }
    const gruppeMap = {};
    Object.entries(gruppeLayouts).forEach(([bildId, layout]) => {
      if (typeof bildId !== 'string' || !bildId) {
        return;
      }
      const normalisiert = normalisiereWeltenbauEinzelBildLayout(layout);
      if (normalisiert) {
        gruppeMap[bildId] = normalisiert;
      }
    });
    if (Object.keys(gruppeMap).length) {
      map[gruppeId] = gruppeMap;
    }
  });
  if (Object.keys(flacheLayouts).length) {
    const defaultKey = 'default';
    map[defaultKey] = {
      ...(map[defaultKey] || {}),
      ...flacheLayouts,
    };
  }
  return map;
}

function speichereWeltenbauMapBildLayoutsGruppe(kampagneId, gruppeKey, gruppeLayouts) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher(kampagneId);
  const key = typeof gruppeKey === 'string' && gruppeKey ? gruppeKey : 'default';
  if (!kid) {
    return;
  }
  const wb = ladeWeltenbauZustand(kid);
  const alle = normalisiereWeltenbauMapBildLayouts(wb.mapBildLayouts);
  const normalisiert = {};
  Object.entries(gruppeLayouts && typeof gruppeLayouts === 'object' ? gruppeLayouts : {}).forEach(([bildId, layout]) => {
    if (typeof bildId !== 'string' || !bildId) {
      return;
    }
    const eintrag = normalisiereWeltenbauEinzelBildLayout(layout);
    if (eintrag) {
      normalisiert[bildId] = eintrag;
    }
  });
  wb.mapBildLayouts = {
    ...alle,
    [key]: normalisiert,
  };
  speichereWeltenbauZustand(wb, kid);
}

function normalisiereWeltenbauMapElementLocks(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([gruppeId, gruppeLocks]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || !gruppeLocks || typeof gruppeLocks !== 'object') {
      return;
    }
    const lockMap = {};
    Object.entries(gruppeLocks).forEach(([elementId, locked]) => {
      if (typeof elementId !== 'string' || !elementId || typeof locked !== 'boolean') {
        return;
      }
      lockMap[elementId] = locked;
    });
    map[gruppeId] = lockMap;
  });
  return map;
}

function normalisiereWeltenbauMapFreieNotizen(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([gruppeId, liste]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || !Array.isArray(liste)) {
      return;
    }
    map[gruppeId] = liste
      .map((eintrag) => {
        const notizId = typeof (eintrag && eintrag.notizId) === 'string' ? eintrag.notizId.trim() : '';
        if (!notizId) {
          return null;
        }
        return {
          notizId,
          html: typeof (eintrag && eintrag.html) === 'string' ? eintrag.html : '',
          bgColor:
            typeof (eintrag && eintrag.bgColor) === 'string' &&
            /^#[0-9a-fA-F]{6}$/.test(String(eintrag.bgColor).trim())
              ? String(eintrag.bgColor).trim()
              : '#fff8bf',
        };
      })
      .filter(Boolean);
  });
  return map;
}

function normalisiereWeltenbauMapFreiePfeile(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([gruppeId, liste]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || !Array.isArray(liste)) {
      return;
    }
    map[gruppeId] = liste
      .map((eintrag) => {
        const pfeilId = typeof (eintrag && eintrag.pfeilId) === 'string' ? eintrag.pfeilId.trim() : '';
        if (!pfeilId) {
          return null;
        }
        const farbeRaw = typeof (eintrag && eintrag.farbe) === 'string' ? eintrag.farbe.trim() : '';
        const farbe = /^#[0-9a-fA-F]{6}$/.test(farbeRaw) ? farbeRaw : '#509b4a';
        return { pfeilId, farbe };
      })
      .filter(Boolean);
  });
  return map;
}

function ladeWeltenbauZustand(kampagneId) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher(kampagneId);
  if (!kid) {
    return {
      version: 4,
      eintraege: [],
      generatorUrls: {},
      generatorAufrufe: {},
      mapLayouts: {},
      mapBildLayouts: {},
      mapFreieBilder: {},
      mapFreieNotizen: {},
      mapFreiePfeile: {},
      mapHintergruende: {},
      mapEinstellungen: {},
      mapElementLocks: {},
    };
  }
  const speicherKey = weltenbauSpeicherKeyFuerKampagne(kid);
  const roh = htbahSpeicher.leseJson(speicherKey, null);
  if (!roh || typeof roh !== 'object') {
    return {
      version: 4,
      eintraege: [],
      generatorUrls: {},
      generatorAufrufe: {},
      mapLayouts: {},
      mapBildLayouts: {},
      mapFreieBilder: {},
      mapFreieNotizen: {},
      mapFreiePfeile: {},
      mapHintergruende: {},
      mapEinstellungen: {},
      mapElementLocks: {},
    };
  }
  const eintraege = Array.isArray(roh.eintraege)
    ? roh.eintraege.map(normalisiereWeltenbauEintrag).filter(Boolean)
    : [];
  const generatorUrls = normalisiereWeltenbauGeneratorUrls(roh.generatorUrls);
  const generatorAufrufe = roh.generatorAufrufe && typeof roh.generatorAufrufe === 'object' ? roh.generatorAufrufe : {};
  const mapLayouts = roh.mapLayouts && typeof roh.mapLayouts === 'object' ? roh.mapLayouts : {};
  const mapBildLayouts = normalisiereWeltenbauMapBildLayouts(roh.mapBildLayouts);
  const mapFreieBilder = roh.mapFreieBilder && typeof roh.mapFreieBilder === 'object' ? roh.mapFreieBilder : {};
  const mapFreieNotizen = normalisiereWeltenbauMapFreieNotizen(roh.mapFreieNotizen);
  const mapFreiePfeile = normalisiereWeltenbauMapFreiePfeile(roh.mapFreiePfeile);
  const mapHintergruende = normalisiereWeltenbauMapHintergruende(roh.mapHintergruende);
  const mapEinstellungen = normalisiereWeltenbauMapEinstellungen(roh.mapEinstellungen);
  const mapElementLocks = normalisiereWeltenbauMapElementLocks(roh.mapElementLocks);
  return {
    version: 4,
    eintraege,
    generatorUrls,
    generatorAufrufe,
    mapLayouts,
    mapBildLayouts,
    mapFreieBilder,
    mapFreieNotizen,
    mapFreiePfeile,
    mapHintergruende,
    mapEinstellungen,
    mapElementLocks,
  };
}

function speichereWeltenbauZustand(zustand, kampagneId) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher(kampagneId);
  if (!kid) {
    return;
  }
  const speicherKey = weltenbauSpeicherKeyFuerKampagne(kid);
  htbahSpeicher.schreibeJson(speicherKey, zustand);
  htbahDispatchKampagneDatenGeaendert({ art: 'weltenbau', kampagneId: kid });
}

const EXPORT_TYP_SPIELLEITUNG_KAMPAGNE_TEIL = 'htbah-spielleitung-kampagne-teil';
const EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE = 'htbah-zufallstabellen-kampagne';
const EXPORT_TYP_ZUFALLSTABELLEN_KATEGORIE = 'htbah-zufallstabellen-kategorie';
const EXPORT_TYP_WELTENBAU_KAMPAGNE = 'htbah-weltenbau-kampagne';
const EXPORT_TYP_WELTENBAU_BEREICH = 'htbah-weltenbau-bereich';
const EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_BUNDLE = 'htbah-export-ls-kampagne-komplett-bundle';
const EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE = 'htbah-export-ls-kampagne-komplett-ohne-gruppe';
const EXPORT_TYP_SL_MITGLIED = 'htbah-spielleitung-mitglied';
const EXPORT_TYP_SL_ABENTEUERBUCH = 'htbah-spielleitung-abenteuerbuch-teil';
const EXPORT_TYP_SL_ATMOSPHAERE = 'htbah-spielleitung-atmosphaere-teil';
const EXPORT_TYP_SL_ZEITMESSUNG = 'htbah-spielleitung-zeitmessung-teil';
const EXPORT_TYP_SPIELLEITUNG_KAMPAGNE_TEIL_LEGACY = 'htbah-spielleiter-kampagne-teil';
const EXPORT_TYP_SL_MITGLIED_LEGACY = 'htbah-spielleiter-mitglied';
const EXPORT_TYP_SL_ABENTEUERBUCH_LEGACY = 'htbah-spielleiter-abenteuerbuch-teil';
const EXPORT_TYP_SL_ATMOSPHAERE_LEGACY = 'htbah-spielleiter-atmosphaere-teil';
const EXPORT_TYP_SL_ZEITMESSUNG_LEGACY = 'htbah-spielleiter-zeitmessung-teil';

function istSpielleitungKampagneTeilExportTyp(typ) {
  return (
    typ === EXPORT_TYP_SPIELLEITUNG_KAMPAGNE_TEIL || typ === EXPORT_TYP_SPIELLEITUNG_KAMPAGNE_TEIL_LEGACY
  );
}

function istSpielleitungMitgliedExportTyp(typ) {
  return typ === EXPORT_TYP_SL_MITGLIED || typ === EXPORT_TYP_SL_MITGLIED_LEGACY;
}

function istSpielleitungAbenteuerbuchExportTyp(typ) {
  return typ === EXPORT_TYP_SL_ABENTEUERBUCH || typ === EXPORT_TYP_SL_ABENTEUERBUCH_LEGACY;
}

function istSpielleitungAtmosphaereExportTyp(typ) {
  return typ === EXPORT_TYP_SL_ATMOSPHAERE || typ === EXPORT_TYP_SL_ATMOSPHAERE_LEGACY;
}

function istSpielleitungZeitmessungExportTyp(typ) {
  return typ === EXPORT_TYP_SL_ZEITMESSUNG || typ === EXPORT_TYP_SL_ZEITMESSUNG_LEGACY;
}

function leseSpielleitungTeilAusExport(roh) {
  if (!roh || typeof roh !== 'object') {
    return null;
  }
  return roh.spielleitungTeil || roh.spielleiterTeil || null;
}

function normalisiereZufallstabellenZeilenListeExportImport(schluessel, arr) {
  if (!ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(schluessel) || !Array.isArray(arr)) {
    return [];
  }
  const mapper = {
    npcs: normalisiereZufallstabellenNpcZeile,
    orte: normalisiereZufallstabellenOrtZeile,
    gegenstaende: normalisiereZufallstabellenGegenstandZeile,
    fraktionen: normalisiereZufallstabellenFraktionZeile,
    pantheon: normalisiereZufallstabellenPantheonZeile,
    raetsel: normalisiereZufallstabellenRaetselZeile,
    bestien: normalisiereZufallstabellenBestieZeile,
  };
  const fn = mapper[schluessel];
  return fn ? arr.map(fn).filter(Boolean) : [];
}

function spielleitungKampagneIndexNachId(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return -1;
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen : [];
  return kampagnen.findIndex((g) => g && g.id === kid);
}

function erstelleSpielleitungKampagneTeilExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen : [];
  const g = kampagnen.find((x) => x && x.id === kid);
  if (!g) {
    return null;
  }
  const mwp =
    sl.mitgliedWahlProKampagne && typeof sl.mitgliedWahlProKampagne === 'object'
      ? sl.mitgliedWahlProKampagne
      : {};
  const mitgliedWahlMitgliedId = typeof mwp[kid] === 'string' ? mwp[kid] : '';
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_SPIELLEITUNG_KAMPAGNE_TEIL,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    kampagne: JSON.parse(JSON.stringify(g)),
    mitgliedWahlMitgliedId,
  };
}

function erstelleSpielleitungKampagneTeilOhneMitgliederExportPaket(kampagneId) {
  const pak = erstelleSpielleitungKampagneTeilExportPaket(kampagneId);
  if (!pak || !pak.kampagne || typeof pak.kampagne !== 'object') {
    return null;
  }
  return {
    ...pak,
    kampagne: {
      ...pak.kampagne,
      mitglieder: [],
    },
    mitgliedWahlMitgliedId: '',
    exportOhneImportierteMitglieder: true,
  };
}

function importiereSpielleitungKampagneTeilPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || !istSpielleitungKampagneTeilExportTyp(roh.typ)) {
    return { ok: false, fehler: 'Ungültige Datei (Spielleitung-Kampagne erwartet).' };
  }
  const idx = spielleitungKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  const merged = normalisiereSpielleitungKampagne({
    ...(roh.kampagne && typeof roh.kampagne === 'object' ? roh.kampagne : {}),
    id: ziel,
  });
  if (!merged) {
    return { ok: false, fehler: 'Kampagnendaten ungültig.' };
  }
  kampagnen[idx] = merged;
  if (!sl.mitgliedWahlProKampagne || typeof sl.mitgliedWahlProKampagne !== 'object') {
    sl.mitgliedWahlProKampagne = {};
  }
  if (Object.prototype.hasOwnProperty.call(roh, 'mitgliedWahlMitgliedId')) {
    if (typeof roh.mitgliedWahlMitgliedId === 'string' && roh.mitgliedWahlMitgliedId) {
      sl.mitgliedWahlProKampagne[ziel] = roh.mitgliedWahlMitgliedId;
    } else {
      delete sl.mitgliedWahlProKampagne[ziel];
    }
  }
  sl.kampagnen = kampagnen;
  speichereSpielleitungZustand(sl);
  if (merged.labels && merged.labels.length) {
    importiereKampagnenLabelsInGlobalenKatalog(merged.labels);
  }
  return { ok: true };
}

function erstelleSpielleitungMitgliedExportPaket(kampagneId, mitgliedId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  const mid = typeof mitgliedId === 'string' && mitgliedId.trim() ? mitgliedId.trim() : '';
  if (!kid || !mid) {
    return null;
  }
  const sl = ladeSpielleitungZustand();
  const g = (Array.isArray(sl.kampagnen) ? sl.kampagnen : []).find((x) => x && x.id === kid);
  const m = g && Array.isArray(g.mitglieder) ? g.mitglieder.find((x) => x && x.id === mid) : null;
  if (!m) {
    return null;
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_SL_MITGLIED,
    kampagneId: kid,
    mitgliedId: mid,
    exportiertAm: new Date().toISOString(),
    mitglied: JSON.parse(JSON.stringify(m)),
  };
}

function importiereSpielleitungMitgliedPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    !istSpielleitungMitgliedExportTyp(roh.typ) ||
    !roh.mitglied
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Gruppen-Charakter erwartet).' };
  }
  const idx = spielleitungKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const merged = normalisiereSpielleitungMitglied(roh.mitglied);
  if (!merged) {
    return { ok: false, fehler: 'Charakterdaten ungültig.' };
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  const kampagne = kampagnen[idx];
  const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder.slice() : [];
  const mIdx = mitglieder.findIndex((x) => x && x.id === merged.id);
  if (mIdx >= 0) {
    mitglieder[mIdx] = merged;
  } else {
    mitglieder.push(merged);
  }
  kampagnen[idx] = { ...kampagne, mitglieder };
  sl.kampagnen = kampagnen;
  speichereSpielleitungZustand(sl);
  return { ok: true };
}

function erstelleSpielleitungAbenteuerbuchExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_SL_ABENTEUERBUCH,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    abenteuerbuch: ladeKampagnenAbenteuerbuch(kid),
    abenteuerbuchHtml: ladeKampagnenAbenteuerbuchHtml(kid),
  };
}

function importiereSpielleitungAbenteuerbuchExportPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    !istSpielleitungAbenteuerbuchExportTyp(roh.typ)
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Abenteuerbuch erwartet).' };
  }
  if (spielleitungKampagneIndexNachId(ziel) < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const AB = window.HTBAH_SHARED;
  const importiert =
    AB && typeof AB.abenteuerbuchAusImportPaket === 'function'
      ? AB.abenteuerbuchAusImportPaket(roh)
      : null;
  if (importiert) {
    speichereKampagnenAbenteuerbuch(ziel, importiert);
  } else {
    speichereKampagnenAbenteuerbuchHtml(
      ziel,
      typeof roh.abenteuerbuchHtml === 'string' ? roh.abenteuerbuchHtml : '',
    );
  }
  return { ok: true };
}

function erstelleSpielleitungAtmosphaereExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const sl = ladeSpielleitungZustand();
  const g = (Array.isArray(sl.kampagnen) ? sl.kampagnen : []).find((x) => x && x.id === kid);
  if (!g) {
    return null;
  }
  const mwp =
    sl.mitgliedWahlProKampagne && typeof sl.mitgliedWahlProKampagne === 'object'
      ? sl.mitgliedWahlProKampagne
      : {};
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_SL_ATMOSPHAERE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    atmosphaere: JSON.parse(JSON.stringify(g.atmosphaere || {})),
    atmosphaereBadgePos: JSON.parse(JSON.stringify(g.atmosphaereBadgePos || {})),
    mitgliedWahlMitgliedId: typeof mwp[kid] === 'string' ? mwp[kid] : '',
  };
}

function importiereSpielleitungAtmosphaereExportPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    !istSpielleitungAtmosphaereExportTyp(roh.typ)
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Wetter/Tageszeit erwartet).' };
  }
  const idx = spielleitungKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  const kampagne = kampagnen[idx];
  kampagnen[idx] = {
    ...kampagne,
    atmosphaere: normalisiereAtmosphaereZustand(roh.atmosphaere),
    atmosphaereBadgePos: normalisiereAtmosphaereBadgePosition(roh.atmosphaereBadgePos),
  };
  if (!sl.mitgliedWahlProKampagne || typeof sl.mitgliedWahlProKampagne !== 'object') {
    sl.mitgliedWahlProKampagne = {};
  }
  if (Object.prototype.hasOwnProperty.call(roh, 'mitgliedWahlMitgliedId')) {
    if (typeof roh.mitgliedWahlMitgliedId === 'string' && roh.mitgliedWahlMitgliedId) {
      sl.mitgliedWahlProKampagne[ziel] = roh.mitgliedWahlMitgliedId;
    } else {
      delete sl.mitgliedWahlProKampagne[ziel];
    }
  }
  sl.kampagnen = kampagnen;
  speichereSpielleitungZustand(sl);
  return { ok: true };
}

function erstelleSpielleitungZeitmessungExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const sl = ladeSpielleitungZustand();
  const g = (Array.isArray(sl.kampagnen) ? sl.kampagnen : []).find((x) => x && x.id === kid);
  if (!g) {
    return null;
  }
  const mwp =
    sl.mitgliedWahlProKampagne && typeof sl.mitgliedWahlProKampagne === 'object'
      ? sl.mitgliedWahlProKampagne
      : {};
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_SL_ZEITMESSUNG,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    zeitmessung: JSON.parse(JSON.stringify(normalisiereKampagnenZeitmessungZustand(g.zeitmessung))),
    zeitmessungBadgePos: JSON.parse(
      JSON.stringify(normalisiereKampagnenZeitmessungBadgePosition(g.zeitmessungBadgePos) || {}),
    ),
    mitgliedWahlMitgliedId: typeof mwp[kid] === 'string' ? mwp[kid] : '',
  };
}

function importiereSpielleitungZeitmessungExportPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    !istSpielleitungZeitmessungExportTyp(roh.typ)
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Timer/Stoppuhr erwartet).' };
  }
  const idx = spielleitungKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  const kampagne = kampagnen[idx];
  kampagnen[idx] = {
    ...kampagne,
    zeitmessung: normalisiereKampagnenZeitmessungZustand(roh.zeitmessung),
    zeitmessungBadgePos: normalisiereKampagnenZeitmessungBadgePosition(roh.zeitmessungBadgePos),
  };
  if (!sl.mitgliedWahlProKampagne || typeof sl.mitgliedWahlProKampagne !== 'object') {
    sl.mitgliedWahlProKampagne = {};
  }
  if (Object.prototype.hasOwnProperty.call(roh, 'mitgliedWahlMitgliedId')) {
    if (typeof roh.mitgliedWahlMitgliedId === 'string' && roh.mitgliedWahlMitgliedId) {
      sl.mitgliedWahlProKampagne[ziel] = roh.mitgliedWahlMitgliedId;
    } else {
      delete sl.mitgliedWahlProKampagne[ziel];
    }
  }
  sl.kampagnen = kampagnen;
  speichereSpielleitungZustand(sl);
  htbahDispatchKampagneDatenGeaendert({ art: 'zeitmessung', kampagneId: ziel });
  return { ok: true };
}

function erstelleZufallstabellenKampagneExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const daten = JSON.parse(JSON.stringify(ladeZufallstabellenZustand(kid)));
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    daten,
  };
}

function importiereZufallstabellenKampagnePaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (spielleitungKampagneIndexNachId(ziel) < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || roh.typ !== EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE) {
    return { ok: false, fehler: 'Ungültige Datei (Zufallstabellen-Kampagne erwartet).' };
  }
  if (!roh.daten || typeof roh.daten !== 'object') {
    return { ok: false, fehler: 'Zufallstabellen-Daten fehlen.' };
  }
  const speicherKey = zufallstabellenSpeicherKeyFuerKampagne(ziel);
  htbahSpeicher.schreibeJson(speicherKey, roh.daten);
  const normalized = ladeZufallstabellenZustand(ziel);
  speichereZufallstabellenZustand(normalized, ziel);
  return { ok: true };
}

function erstelleZufallstabellenKategorieExportPaket(kampagneId, kategorie) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || !ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(kategorie) || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const z = ladeZufallstabellenZustand(kid);
  const zeilen = Array.isArray(z[kategorie]) ? JSON.parse(JSON.stringify(z[kategorie])) : [];
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_ZUFALLSTABELLEN_KATEGORIE,
    kampagneId: kid,
    kategorie,
    exportiertAm: new Date().toISOString(),
    zeilen,
  };
}

function importiereZufallstabellenKategoriePaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (spielleitungKampagneIndexNachId(ziel) < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || roh.typ !== EXPORT_TYP_ZUFALLSTABELLEN_KATEGORIE) {
    return { ok: false, fehler: 'Ungültige Datei (Zufallstabellen-Kategorie erwartet).' };
  }
  const kat = typeof roh.kategorie === 'string' ? roh.kategorie : '';
  if (!ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(kat)) {
    return { ok: false, fehler: 'Unbekannte Tabellen-Kategorie.' };
  }
  const z = ladeZufallstabellenZustand(ziel);
  z[kat] = normalisiereZufallstabellenZeilenListeExportImport(kat, roh.zeilen);
  speichereZufallstabellenZustand(z, ziel);
  return { ok: true };
}

function erstelleWeltenbauKampagneExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const daten = JSON.parse(JSON.stringify(ladeWeltenbauZustand(kid)));
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_WELTENBAU_KAMPAGNE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    daten,
  };
}

function importiereWeltenbauKampagnePaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (spielleitungKampagneIndexNachId(ziel) < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || roh.typ !== EXPORT_TYP_WELTENBAU_KAMPAGNE) {
    return { ok: false, fehler: 'Ungültige Datei (Weltenbau-Kampagne erwartet).' };
  }
  if (!roh.daten || typeof roh.daten !== 'object') {
    return { ok: false, fehler: 'Weltenbau-Daten fehlen.' };
  }
  const speicherKey = weltenbauSpeicherKeyFuerKampagne(ziel);
  htbahSpeicher.schreibeJson(speicherKey, roh.daten);
  const normalized = ladeWeltenbauZustand(ziel);
  speichereWeltenbauZustand(normalized, ziel);
  return { ok: true };
}

function erstelleWeltenbauBereichExportPaket(kampagneId, bereich) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  if (
    bereich !== 'galerie' &&
    bereich !== 'interaktive_welt' &&
    bereich !== 'interaktive_welt_einstellungen' &&
    bereich !== 'generatoren' &&
    bereich !== 'assets'
  ) {
    return null;
  }
  const wb = ladeWeltenbauZustand(kid);
  let daten = {};
  if (bereich === 'galerie') {
    daten = { eintraege: JSON.parse(JSON.stringify(wb.eintraege || [])) };
  } else if (bereich === 'generatoren' || bereich === 'assets') {
    daten = {
      generatorUrls: JSON.parse(JSON.stringify(wb.generatorUrls || {})),
      generatorAufrufe: JSON.parse(JSON.stringify(wb.generatorAufrufe || {})),
    };
  } else if (bereich === 'interaktive_welt_einstellungen') {
    daten = weltenbauInteraktiveWeltEinstellungenExportDaten(wb);
  } else {
    daten = {
      mapLayouts: JSON.parse(JSON.stringify(wb.mapLayouts || {})),
      mapBildLayouts: JSON.parse(JSON.stringify(wb.mapBildLayouts || {})),
      mapFreieBilder: JSON.parse(JSON.stringify(wb.mapFreieBilder || {})),
      mapFreieNotizen: JSON.parse(JSON.stringify(wb.mapFreieNotizen || {})),
      mapFreiePfeile: JSON.parse(JSON.stringify(wb.mapFreiePfeile || {})),
      mapHintergruende: JSON.parse(JSON.stringify(wb.mapHintergruende || {})),
      ...weltenbauInteraktiveWeltEinstellungenExportDaten(wb),
    };
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_WELTENBAU_BEREICH,
    kampagneId: kid,
    bereich,
    exportiertAm: new Date().toISOString(),
    daten,
  };
}

function importiereWeltenbauBereichPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (spielleitungKampagneIndexNachId(ziel) < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || roh.typ !== EXPORT_TYP_WELTENBAU_BEREICH) {
    return { ok: false, fehler: 'Ungültige Datei (Weltenbau-Bereich erwartet).' };
  }
  const bereich = roh.bereich;
  if (
    bereich !== 'galerie' &&
    bereich !== 'interaktive_welt' &&
    bereich !== 'interaktive_welt_einstellungen' &&
    bereich !== 'generatoren' &&
    bereich !== 'assets'
  ) {
    return { ok: false, fehler: 'Unbekannter Weltenbau-Bereich.' };
  }
  const d = roh.daten && typeof roh.daten === 'object' ? roh.daten : {};
  const wb = ladeWeltenbauZustand(ziel);
  if (bereich === 'galerie') {
    wb.eintraege = Array.isArray(d.eintraege)
      ? d.eintraege.map(normalisiereWeltenbauEintrag).filter(Boolean)
      : [];
  } else if (bereich === 'generatoren' || bereich === 'assets') {
    wb.generatorUrls = normalisiereWeltenbauGeneratorUrls(d.generatorUrls);
    wb.generatorAufrufe = d.generatorAufrufe && typeof d.generatorAufrufe === 'object' ? d.generatorAufrufe : {};
  } else if (bereich === 'interaktive_welt_einstellungen') {
    wendeWeltenbauInteraktiveWeltEinstellungenImport(wb, d);
  } else {
    wb.mapLayouts = d.mapLayouts && typeof d.mapLayouts === 'object' ? d.mapLayouts : {};
    wb.mapBildLayouts = normalisiereWeltenbauMapBildLayouts(d.mapBildLayouts);
    wb.mapFreieBilder = d.mapFreieBilder && typeof d.mapFreieBilder === 'object' ? d.mapFreieBilder : {};
    wb.mapFreieNotizen = normalisiereWeltenbauMapFreieNotizen(d.mapFreieNotizen);
    wb.mapFreiePfeile = normalisiereWeltenbauMapFreiePfeile(d.mapFreiePfeile);
    wb.mapHintergruende = normalisiereWeltenbauMapHintergruende(d.mapHintergruende);
    wendeWeltenbauInteraktiveWeltEinstellungenImport(wb, d);
  }
  speichereWeltenbauZustand(wb, ziel);
  return { ok: true };
}

/**
 * Prüft, ob eine JSON-Datei zum gewählten kampagnenbezogenen Import passt (vor Bestätigungsdialog).
 * @param {'spielleitung'|'spielleitung_ohne_gruppe'|'komplett_ohne_gruppe'|'ztf'|'ztf_kat'|'wb'|'wb_bereich'} ctxArt
 * @param {object} roh
 * @param {{ kategorie?: string, wbBereich?: string }} [extras]
 */
function validiereKampagneDatenImportDatei(ctxArt, roh, extras) {
  const ex = extras && typeof extras === 'object' ? extras : {};
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || typeof roh.typ !== 'string') {
    return { ok: false, fehler: 'Ungültige oder alte Export-Datei (Version 1 erwartet).' };
  }
  if (ctxArt === 'spielleitung') {
    if (!istSpielleitungKampagneTeilExportTyp(roh.typ)) {
      return { ok: false, fehler: 'Keine Spielleitung-Kampagnen-Datei (falscher Dateityp).' };
    }
    return { ok: true };
  }
  if (ctxArt === 'spielleitung_ohne_gruppe') {
    if (!istSpielleitungKampagneTeilExportTyp(roh.typ)) {
      return { ok: false, fehler: 'Keine Spielleitung-Kampagnen-Datei (falscher Dateityp).' };
    }
    return { ok: true };
  }
  if (ctxArt === 'komplett_ohne_gruppe') {
    if (roh.typ !== EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE) {
      return { ok: false, fehler: 'Kein Komplett-Export ohne importierte Charaktere.' };
    }
    if (!leseSpielleitungTeilAusExport(roh) || !roh.zufallstabellenKampagne || !roh.weltenbauKampagne) {
      return { ok: false, fehler: 'Komplett-Paket unvollständig.' };
    }
    return { ok: true };
  }
  if (ctxArt === 'ztf') {
    if (roh.typ !== EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE) {
      return { ok: false, fehler: 'Keine Zufallstabellen-Kampagnen-Datei (falscher Dateityp).' };
    }
    if (!roh.daten || typeof roh.daten !== 'object') {
      return { ok: false, fehler: 'Zufallstabellen-Daten fehlen in der Datei.' };
    }
    return { ok: true };
  }
  if (ctxArt === 'ztf_kat') {
    if (roh.typ !== EXPORT_TYP_ZUFALLSTABELLEN_KATEGORIE) {
      return { ok: false, fehler: 'Keine Zufallstabellen-Kategorie-Datei (falscher Dateityp).' };
    }
    const kat = typeof ex.kategorie === 'string' ? ex.kategorie : '';
    if (!ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(kat) || roh.kategorie !== kat) {
      return { ok: false, fehler: 'Die Datei enthält eine andere Tabellen-Kategorie als erwartet.' };
    }
    return { ok: true };
  }
  if (ctxArt === 'wb') {
    if (roh.typ !== EXPORT_TYP_WELTENBAU_KAMPAGNE) {
      return { ok: false, fehler: 'Keine Weltenbau-Kampagnen-Datei (falscher Dateityp).' };
    }
    if (!roh.daten || typeof roh.daten !== 'object') {
      return { ok: false, fehler: 'Weltenbau-Daten fehlen in der Datei.' };
    }
    return { ok: true };
  }
  if (ctxArt === 'wb_bereich') {
    if (roh.typ !== EXPORT_TYP_WELTENBAU_BEREICH) {
      return { ok: false, fehler: 'Keine Weltenbau-Bereichs-Datei (falscher Dateityp).' };
    }
    const br = typeof ex.wbBereich === 'string' ? ex.wbBereich : '';
    const erwarteterBereich = br === 'generatoren' ? 'assets' : br;
    const dateiBereich = roh.bereich === 'generatoren' ? 'assets' : roh.bereich;
    if (erwarteterBereich !== dateiBereich) {
      return { ok: false, fehler: 'Die Datei gehört zu einem anderen Weltenbau-Bereich.' };
    }
    return { ok: true };
  }
  return { ok: false, fehler: 'Unbekannte Import-Aktion.' };
}

function erstelleKampagneKomplettBackupBundle(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const spielleitungTeil = erstelleSpielleitungKampagneTeilExportPaket(kid);
  const ztf = erstelleZufallstabellenKampagneExportPaket(kid);
  const wb = erstelleWeltenbauKampagneExportPaket(kid);
  if (!spielleitungTeil || !ztf || !wb) {
    return null;
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_BUNDLE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    spielleitungTeil,
    zufallstabellenKampagne: ztf,
    weltenbauKampagne: wb,
  };
}

function erstelleKampagneKomplettOhneGruppeBackupBundle(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleitungKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const spielleitungTeil = erstelleSpielleitungKampagneTeilOhneMitgliederExportPaket(kid);
  const ztf = erstelleZufallstabellenKampagneExportPaket(kid);
  const wb = erstelleWeltenbauKampagneExportPaket(kid);
  if (!spielleitungTeil || !ztf || !wb) {
    return null;
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    spielleitungTeil,
    zufallstabellenKampagne: ztf,
    weltenbauKampagne: wb,
  };
}

function parseLsExportKeyMetaBeispiel(key) {
  const Baum = window.HTBAH_SHARED && window.HTBAH_SHARED.ExportImportBaum;
  if (Baum && typeof Baum.parseLsExportKeyMeta === 'function') {
    return Baum.parseLsExportKeyMeta(key);
  }
  return null;
}

function beispielKampagneNameAusPaket(paket, kampagneId) {
  const titel =
    paket && paket.beispiel && typeof paket.beispiel.titel === 'string'
      ? paket.beispiel.titel.trim()
      : '';
  if (titel) {
    return titel;
  }
  const daten = Array.isArray(paket && paket.daten) ? paket.daten : [];
  for (let i = 0; i < daten.length; i += 1) {
    const e = daten[i];
    if (!e || !istKampagnenSpeicherKey(e.key) || !e.vorhanden || typeof e.wert !== 'string') {
      continue;
    }
    try {
      const p = JSON.parse(e.wert);
      const liste = Array.isArray(p.kampagnen) ? p.kampagnen : [];
      const treffer = liste.find((k) => k && k.id === kampagneId);
      if (treffer && typeof treffer.name === 'string' && treffer.name.trim()) {
        return treffer.name.trim();
      }
    } catch {
      /* ignorieren */
    }
  }
  for (let i = 0; i < daten.length; i += 1) {
    const e = daten[i];
    if (!e || !e.vorhanden || typeof e.wert !== 'string') {
      continue;
    }
    const meta = parseLsExportKeyMetaBeispiel(e.key);
    if (!meta || meta.kampagneId !== kampagneId) {
      continue;
    }
    try {
      const p = JSON.parse(e.wert);
      const name =
        (p.kampagne && typeof p.kampagne.name === 'string' && p.kampagne.name) ||
        (leseSpielleitungTeilAusExport(p) &&
          leseSpielleitungTeilAusExport(p).kampagne &&
          typeof leseSpielleitungTeilAusExport(p).kampagne.name === 'string' &&
          leseSpielleitungTeilAusExport(p).kampagne.name) ||
        '';
      if (typeof name === 'string' && name.trim()) {
        return name.trim();
      }
    } catch {
      /* ignorieren */
    }
  }
  return typeof kampagneId === 'string' && kampagneId ? kampagneId : 'Unbenannte Kampagne';
}

function beispielSpielleitungTeilAusPaket(paket, kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  const daten = Array.isArray(paket && paket.daten) ? paket.daten : [];
  for (let i = 0; i < daten.length; i += 1) {
    const bereich = daten[i];
    if (!bereich || !bereich.vorhanden || typeof bereich.wert !== 'string') {
      continue;
    }
    const meta = parseLsExportKeyMetaBeispiel(bereich.key);
    if (
      !meta ||
      meta.kampagneId !== kid ||
      (meta.lsTyp !== 'spielleitung_teil' && meta.lsTyp !== 'spielleitung_ohne_gruppe')
    ) {
      continue;
    }
    return beispielParsePaketBereichWert(bereich);
  }
  return null;
}

function beispielThemeSettingAusPaket(paket, kampagneId) {
  const teil = beispielSpielleitungTeilAusPaket(paket, kampagneId);
  const TE = HTBAH_THEMEN_EINSTELLUNGEN;
  if (TE && typeof TE.normalisiereKampagnenThemeSetting === 'function') {
    const ausTeil =
      teil && teil.kampagne && teil.kampagne.themeSetting != null
        ? TE.normalisiereKampagnenThemeSetting(teil.kampagne.themeSetting)
        : '';
    if (ausTeil) {
      return ausTeil;
    }
    if (typeof TE.beispielDefaultThemeFuerKampagne === 'function') {
      return TE.normalisiereKampagnenThemeSetting(
        TE.beispielDefaultThemeFuerKampagne({ id: kampagneId }),
      );
    }
  }
  return '';
}

function beispielKampagneRohAusPaket(paket, kampagneId) {
  const teil = beispielSpielleitungTeilAusPaket(paket, kampagneId);
  if (!teil || !teil.kampagne || typeof teil.kampagne !== 'object') {
    return null;
  }
  const themeSetting = beispielThemeSettingAusPaket(paket, kampagneId);
  return {
    ...teil.kampagne,
    ...(themeSetting ? { themeSetting } : {}),
  };
}

function sicherstelleSpielleitungKampagneFuerBeispielImport(kampagneId, opts) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return { ok: false, fehler: 'Keine Kampagnen-ID.' };
  }
  if (spielleitungKampagneIndexNachId(kid) >= 0) {
    return { ok: true, status: 'vorhanden', kampagneId: kid };
  }
  const o = opts && typeof opts === 'object' ? opts : {};
  let kampagneRoh = o.kampagneRoh;
  const spielleitungTeilRoh = leseSpielleitungTeilAusExport(o);
  if (!kampagneRoh && spielleitungTeilRoh && spielleitungTeilRoh.kampagne) {
    kampagneRoh = spielleitungTeilRoh.kampagne;
  }
  const merged = kampagneRoh
    ? normalisiereSpielleitungKampagne({ ...kampagneRoh, id: kid })
    : normalisiereSpielleitungKampagne({
        id: kid,
        name:
          typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Unbenannte Kampagne',
        mitglieder: [],
      });
  if (!merged) {
    return { ok: false, fehler: 'Kampagnendaten ungültig.' };
  }
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  kampagnen.push(merged);
  sl.kampagnen = kampagnen;
  speichereSpielleitungZustand(sl);
  if (merged.labels && merged.labels.length) {
    importiereKampagnenLabelsInGlobalenKatalog(merged.labels);
  }
  return { ok: true, status: 'neu', kampagneId: kid };
}

function beispielZufallstabellenKategorieAdditiv(kampagneId, roh, ergebnis) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || !roh || typeof roh !== 'object' || roh.typ !== EXPORT_TYP_ZUFALLSTABELLEN_KATEGORIE) {
    return;
  }
  const kat = typeof roh.kategorie === 'string' ? roh.kategorie : '';
  if (!ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(kat)) {
    return;
  }
  const eingang = normalisiereZufallstabellenZeilenListeExportImport(
    kat,
    Array.isArray(roh.zeilen) ? roh.zeilen : [],
  );
  const aktuell = ladeZufallstabellenZustand(kid);
  if (!Array.isArray(aktuell[kat])) {
    aktuell[kat] = [];
  }
  const vorhandenIds = new Set(
    aktuell[kat]
      .map((e) => (e && typeof e.id === 'string' ? e.id : ''))
      .filter(Boolean),
  );
  eingang.forEach((eintrag) => {
    if (!eintrag || typeof eintrag.id !== 'string' || !eintrag.id) {
      return;
    }
    if (vorhandenIds.has(eintrag.id)) {
      ergebnis.zufallVorhanden += 1;
      return;
    }
    aktuell[kat].push(eintrag);
    vorhandenIds.add(eintrag.id);
    ergebnis.zufallNeu += 1;
  });
  speichereZufallstabellenZustand(aktuell, kid);
}

function beispielZufallstabellenZustandAdditiv(kampagneId, zufZustand, ergebnis) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || !zufZustand || typeof zufZustand !== 'object') {
    return;
  }
  const aktuell = ladeZufallstabellenZustand(kid);
  ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.forEach((kat) => {
    const eingang = Array.isArray(zufZustand[kat]) ? zufZustand[kat] : [];
    if (!Array.isArray(aktuell[kat])) {
      aktuell[kat] = [];
    }
    const vorhandenIds = new Set(
      aktuell[kat]
        .map((e) => (e && typeof e.id === 'string' ? e.id : ''))
        .filter(Boolean),
    );
    eingang.forEach((eintrag) => {
      if (!eintrag || typeof eintrag.id !== 'string' || !eintrag.id) {
        return;
      }
      if (vorhandenIds.has(eintrag.id)) {
        ergebnis.zufallVorhanden += 1;
        return;
      }
      aktuell[kat].push(eintrag);
      vorhandenIds.add(eintrag.id);
      ergebnis.zufallNeu += 1;
    });
  });
  if (Array.isArray(zufZustand.pantheon) && zufZustand.pantheon.length) {
    const vorPantheon = Array.isArray(aktuell.pantheon) ? aktuell.pantheon : [];
    const pantheonIds = new Set(
      vorPantheon.map((e) => (e && typeof e.id === 'string' ? e.id : '')).filter(Boolean),
    );
    zufZustand.pantheon.forEach((eintrag) => {
      if (!eintrag || typeof eintrag.id !== 'string' || !eintrag.id) {
        return;
      }
      if (pantheonIds.has(eintrag.id)) {
        ergebnis.zufallVorhanden += 1;
        return;
      }
      vorPantheon.push(eintrag);
      pantheonIds.add(eintrag.id);
      ergebnis.zufallNeu += 1;
    });
    aktuell.pantheon = vorPantheon;
  }
  speichereZufallstabellenZustand(aktuell, kid);
}

function kampagneIdsAusLokalerSpeicherPaket(paket) {
  const ids = new Set();
  const daten = Array.isArray(paket && paket.daten) ? paket.daten : [];
  daten.forEach((e) => {
    if (!e || typeof e.key !== 'string') {
      return;
    }
    if (istKampagnenSpeicherKey(e.key) && e.vorhanden && typeof e.wert === 'string') {
      try {
        const p = JSON.parse(e.wert);
        (Array.isArray(p.kampagnen) ? p.kampagnen : []).forEach((k) => {
          if (k && typeof k.id === 'string' && k.id) {
            ids.add(k.id);
          }
        });
      } catch {
        /* ignorieren */
      }
    }
    const meta = parseLsExportKeyMetaBeispiel(e.key);
    if (meta && meta.kampagneId) {
      ids.add(meta.kampagneId);
    }
  });
  return ids;
}

/** Labels aus einem `lokaler-speicher`-Paket (Beispiel-Kampagne-Vorschau vor Import). */
function extrahiereKampagneLabelsAusLokalerSpeicherPaket(paket) {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;
  if (!KL || typeof KL.normalisiereKampagneLabels !== 'function') {
    return [];
  }
  const sammeln = (labels) => {
    const n = KL.normalisiereKampagneLabels(labels);
    return Array.isArray(n) && n.length ? n : [];
  };
  const daten = Array.isArray(paket && paket.daten) ? paket.daten : [];
  for (const e of daten) {
    if (!e || !e.vorhanden || typeof e.wert !== 'string') {
      continue;
    }
    if (istKampagnenSpeicherKey(e.key)) {
      try {
        const p = JSON.parse(e.wert);
        for (const k of Array.isArray(p.kampagnen) ? p.kampagnen : []) {
          if (k && Array.isArray(k.labels) && k.labels.length) {
            return sammeln(k.labels);
          }
        }
      } catch {
        /* ignorieren */
      }
      continue;
    }
    const meta = parseLsExportKeyMetaBeispiel(e.key);
    if (!meta || !meta.kampagneId) {
      continue;
    }
    let p = null;
    try {
      p = JSON.parse(e.wert);
    } catch {
      continue;
    }
    if (
      (meta.lsTyp === 'spielleitung_teil' || meta.lsTyp === 'spielleitung_ohne_gruppe') &&
      p &&
      p.kampagne
    ) {
      return sammeln(p.kampagne.labels);
    }
    if (meta.lsTyp === 'kampagne_komplett_bundle' && p && p.spielleitungTeil && p.spielleitungTeil.kampagne) {
      return sammeln(p.spielleitungTeil.kampagne.labels);
    }
  }
  return [];
}

/**
 * Wendet ein `lokaler-speicher`-Paket additiv an (Beispiel-Kampagnen).
 * Unterstützt Legacy-Sammel-Exporte und neue `htbah_export_ls:*`-Teilexporte.
 */
function wendeBeispielLokalerSpeicherPaketAdditivAn(paket) {
  const ergebnis = {
    kampagneId: '',
    kampagneStatus: '',
    zufallNeu: 0,
    zufallVorhanden: 0,
  };
  if (!paket || paket.typ !== 'lokaler-speicher' || !Array.isArray(paket.daten)) {
    return ergebnis;
  }

  const daten = paket.daten;
  const neuAngelegteKampagnen = new Set();

  const kampBereich = daten.find((d) => d && istKampagnenSpeicherKey(d.key));
  if (kampBereich && kampBereich.vorhanden && typeof kampBereich.wert === 'string') {
    let kampPaket = null;
    try {
      kampPaket = JSON.parse(kampBereich.wert);
    } catch {
      kampPaket = null;
    }
    const liste = kampPaket && Array.isArray(kampPaket.kampagnen) ? kampPaket.kampagnen : [];
    liste.forEach((beispielKampagne) => {
      if (!beispielKampagne || typeof beispielKampagne.id !== 'string' || !beispielKampagne.id) {
        return;
      }
      const kid = beispielKampagne.id;
      const vorherIdx = spielleitungKampagneIndexNachId(kid);
      const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(kid, {
        kampagneRoh: beispielKampagne,
      });
      if (!sicher.ok) {
        return;
      }
      if (sicher.status === 'neu') {
        neuAngelegteKampagnen.add(kid);
      }
      if (!ergebnis.kampagneId) {
        ergebnis.kampagneId = kid;
        ergebnis.kampagneStatus = vorherIdx >= 0 || sicher.status === 'vorhanden' ? 'vorhanden' : 'neu';
      }
    });
    if (ergebnis.kampagneId) {
      const sl = ladeSpielleitungZustand();
      sl.aktiveKampagneId = ergebnis.kampagneId;
      speichereSpielleitungZustand(sl);
    }
  }

  const lsKampagneIds = [...kampagneIdsAusLokalerSpeicherPaket(paket)];

  lsKampagneIds.forEach((kid) => {
    if (spielleitungKampagneIndexNachId(kid) >= 0) {
      if (!ergebnis.kampagneId) {
        ergebnis.kampagneId = kid;
        ergebnis.kampagneStatus = 'vorhanden';
      }
      return;
    }
    const name = beispielKampagneNameAusPaket(paket, kid);
    const kampagneRoh = beispielKampagneRohAusPaket(paket, kid);
    const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(kid, {
      name,
      kampagneRoh,
    });
    if (sicher.ok && sicher.status === 'neu') {
      neuAngelegteKampagnen.add(kid);
      if (!ergebnis.kampagneId) {
        ergebnis.kampagneId = kid;
        ergebnis.kampagneStatus = 'neu';
      }
    }
  });

  daten.forEach((bereich) => {
    if (!bereich || typeof bereich.key !== 'string' || !bereich.vorhanden || typeof bereich.wert !== 'string') {
      return;
    }
    const meta = parseLsExportKeyMetaBeispiel(bereich.key);
    if (!meta || !meta.kampagneId) {
      return;
    }
    const kid = meta.kampagneId;
    let p = null;
    try {
      p = JSON.parse(bereich.wert);
    } catch {
      return;
    }
    if (!p || typeof p !== 'object') {
      return;
    }

    if (meta.lsTyp === 'kampagne_komplett' || meta.lsTyp === 'kampagne_komplett_ohne_gruppe') {
      const vorher = spielleitungKampagneIndexNachId(kid);
      sicherstelleSpielleitungKampagneFuerBeispielImport(kid, {
        name: beispielKampagneNameAusPaket(paket, kid),
        spielleitungTeil: p.spielleitungTeil,
      });
      importiereKampagneKomplettBackupBundle(kid, p);
      if (vorher < 0) {
        neuAngelegteKampagnen.add(kid);
      }
      if (!ergebnis.kampagneId) {
        ergebnis.kampagneId = kid;
        ergebnis.kampagneStatus = vorher >= 0 ? 'vorhanden' : 'neu';
      }
      return;
    }

    if (spielleitungKampagneIndexNachId(kid) < 0) {
      const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(kid, {
        name: beispielKampagneNameAusPaket(paket, kid),
        spielleitungTeil: meta.lsTyp === 'spielleitung_teil' || meta.lsTyp === 'spielleitung_ohne_gruppe' ? p : null,
        kampagneRoh: p.kampagne,
      });
      if (sicher.ok && sicher.status === 'neu') {
        neuAngelegteKampagnen.add(kid);
      }
    }

    if (meta.lsTyp === 'spielleitung_teil' || meta.lsTyp === 'spielleitung_ohne_gruppe') {
      importiereSpielleitungKampagneTeilPaket(kid, p);
    } else if (meta.lsTyp === 'sl_abenteuerbuch') {
      importiereSpielleitungAbenteuerbuchExportPaket(kid, p);
    } else if (meta.lsTyp === 'sl_atmosphaere') {
      importiereSpielleitungAtmosphaereExportPaket(kid, p);
    } else if (meta.lsTyp === 'sl_zeitmessung') {
      importiereSpielleitungZeitmessungExportPaket(kid, p);
    } else if (meta.lsTyp === 'sl_mitglied') {
      importiereSpielleitungMitgliedPaket(kid, p);
    } else if (meta.lsTyp === 'ztf_kategorie') {
      beispielZufallstabellenKategorieAdditiv(kid, p, ergebnis);
    } else if (meta.lsTyp === 'ztf_kampagne') {
      if (p.daten && typeof p.daten === 'object') {
        beispielZufallstabellenZustandAdditiv(kid, p.daten, ergebnis);
      }
    } else if (meta.lsTyp === 'ztf_pantheon') {
      const r = pantheonImportAusPaket(p);
      if (r.ok) {
        const z = ladeZufallstabellenZustand(kid);
        const alt = Array.isArray(z.pantheon) ? z.pantheon : [];
        const ids = new Set(alt.map((e) => (e && e.id ? e.id : '')).filter(Boolean));
        (Array.isArray(r.pantheon) ? r.pantheon : []).forEach((eintrag) => {
          if (!eintrag || !eintrag.id) {
            return;
          }
          if (ids.has(eintrag.id)) {
            ergebnis.zufallVorhanden += 1;
            return;
          }
          alt.push(eintrag);
          ids.add(eintrag.id);
          ergebnis.zufallNeu += 1;
        });
        z.pantheon = alt;
        speichereZufallstabellenZustand(z, kid);
      }
    } else if (meta.lsTyp === 'wb_kampagne') {
      if (neuAngelegteKampagnen.has(kid) && p.daten) {
        importiereWeltenbauKampagnePaket(kid, p);
      }
    } else if (meta.lsTyp === 'wb_bereich') {
      const wbBereich = typeof p.bereich === 'string' ? p.bereich : '';
      if (wbBereich === 'interaktive_welt_einstellungen' || neuAngelegteKampagnen.has(kid)) {
        importiereWeltenbauBereichPaket(kid, p);
      }
    }

    if (!ergebnis.kampagneId) {
      ergebnis.kampagneId = kid;
      ergebnis.kampagneStatus = neuAngelegteKampagnen.has(kid) ? 'neu' : 'vorhanden';
    }
  });

  if (ergebnis.kampagneId) {
    const zufBereich = daten.find((d) => d && d.key === 'htbah_zufallstabellen');
    if (zufBereich && zufBereich.vorhanden && typeof zufBereich.wert === 'string') {
      try {
        const zufPaket = JSON.parse(zufBereich.wert);
        if (zufPaket && typeof zufPaket === 'object') {
          if (
            zufPaket.typ === 'htbah-zufallstabellen-pro-kampagne' &&
            zufPaket.proKampagne &&
            typeof zufPaket.proKampagne === 'object'
          ) {
            Object.keys(zufPaket.proKampagne).forEach((kid) => {
              sicherstelleSpielleitungKampagneFuerBeispielImport(kid, {
                name: beispielKampagneNameAusPaket(paket, kid),
              });
              beispielZufallstabellenZustandAdditiv(kid, zufPaket.proKampagne[kid], ergebnis);
              if (!ergebnis.kampagneId) {
                ergebnis.kampagneId = kid;
              }
            });
          } else {
            beispielZufallstabellenZustandAdditiv(ergebnis.kampagneId, zufPaket, ergebnis);
          }
        }
      } catch {
        /* ignorieren */
      }
    }

    if (neuAngelegteKampagnen.has(ergebnis.kampagneId)) {
      const welBereich = daten.find((d) => d && d.key === 'htbah_weltenbau');
      if (welBereich && welBereich.vorhanden && typeof welBereich.wert === 'string') {
        try {
          const welPaket = JSON.parse(welBereich.wert);
          if (welPaket && typeof welPaket === 'object') {
            if (
              welPaket.typ === 'htbah-weltenbau-pro-kampagne' &&
              welPaket.proKampagne &&
              typeof welPaket.proKampagne === 'object' &&
              welPaket.proKampagne[ergebnis.kampagneId]
            ) {
              const wbDaten = welPaket.proKampagne[ergebnis.kampagneId];
              if (Number(wbDaten.version) === 4) {
                speichereWeltenbauZustand(wbDaten, ergebnis.kampagneId);
              }
            } else if (Number(welPaket.version) === 4) {
              speichereWeltenbauZustand(welPaket, ergebnis.kampagneId);
            }
          }
        } catch {
          /* ignorieren */
        }
      }
    }

    const sl = ladeSpielleitungZustand();
    sl.aktiveKampagneId = ergebnis.kampagneId;
    speichereSpielleitungZustand(sl);
  }

  return ergebnis;
}

function importiereKampagneKomplettBackupBundle(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    (roh.typ !== EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_BUNDLE &&
      roh.typ !== EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE)
  ) {
    return { ok: false, fehler: 'Ungültiger Komplett-Export dieser Kampagne.' };
  }
  if (typeof roh.kampagneId === 'string' && roh.kampagneId && roh.kampagneId !== ziel) {
    return { ok: false, fehler: 'Kampagnen-ID der Datei passt nicht zum Import-Slot.' };
  }
  const r0 = importiereSpielleitungKampagneTeilPaket(ziel, leseSpielleitungTeilAusExport(roh));
  if (!r0.ok) {
    return r0;
  }
  const r1 = importiereZufallstabellenKampagnePaket(ziel, roh.zufallstabellenKampagne);
  if (!r1.ok) {
    return r1;
  }
  return importiereWeltenbauKampagnePaket(ziel, roh.weltenbauKampagne);
}

function importierePantheonPaketInKampagne(kampagneId, roh) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (spielleitungKampagneIndexNachId(kid) < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const r = pantheonImportAusPaket(roh);
  if (!r.ok) {
    return r;
  }
  const z = ladeZufallstabellenZustand(kid);
  z.pantheon = r.pantheon;
  speichereZufallstabellenZustand(z, kid);
  return { ok: true };
}

const ZST_DUPLIZIER_TYP_ZU_LISTE = Object.freeze({
  npc: 'npcs',
  ort: 'orte',
  fraktion: 'fraktionen',
  pantheon: 'pantheon',
  raetsel: 'raetsel',
  bestie: 'bestien',
  gegenstand: 'gegenstaende',
});

const ZST_DUPLIZIER_TYP_REIHENFOLGE = Object.freeze([
  'ort',
  'fraktion',
  'npc',
  'bestie',
  'gegenstand',
  'raetsel',
  'pantheon',
]);

function normalisiereKampagnenNameVergleich(name) {
  return String(name || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('de');
}

function erstelleSpielleitungKampagne(opts) {
  const roh = opts && typeof opts === 'object' ? opts : {};
  const sl = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  const basis =
    typeof roh.name === 'string' && roh.name.trim()
      ? roh.name.trim()
      : `Kampagne ${kampagnen.length + 1}`;
  const vergleich = normalisiereKampagnenNameVergleich(basis);
  if (kampagnen.some((k) => k && normalisiereKampagnenNameVergleich(k.name) === vergleich)) {
    return { ok: false, fehler: 'name_exists' };
  }
  const id = neueEntropieId();
  kampagnen.push(normalisiereSpielleitungKampagne({ id, name: basis, mitglieder: [] }));
  speichereSpielleitungZustand({ ...sl, kampagnen });
  return { ok: true, id };
}

function zstDuplizierLeeresIdMaps() {
  return {
    ort: {},
    fraktion: {},
    npc: {},
    bestie: {},
    gegenstand: {},
    raetsel: {},
    pantheon: {},
  };
}

function zstDuplizierWendeKopieSuffix(zeile, typ) {
  if (!zeile || typeof zeile !== 'object') {
    return;
  }
  const suffix = ' (Kopie)';
  if (typ === 'raetsel') {
    const t = String(zeile.titel != null ? zeile.titel : '').trim();
    zeile.titel = t ? `${t}${suffix}` : `Rätsel${suffix}`;
    return;
  }
  const n = String(zeile.name != null ? zeile.name : '').trim();
  zeile.name = n ? `${n}${suffix}` : suffix.trim();
}

function zstDuplizierMapLayoutKey(layoutKey, idMaps) {
  const k = String(layoutKey || '').trim();
  if (!k || !idMaps) {
    return null;
  }
  const einfach = (prefix) => {
    const p = `${prefix}:`;
    if (!k.startsWith(p)) {
      return null;
    }
    const alt = k.slice(p.length);
    const neu = idMaps[prefix] && idMaps[prefix][alt];
    return neu ? `${prefix}:${neu}` : null;
  };
  let neuKey = einfach('ort');
  if (neuKey) {
    return neuKey;
  }
  neuKey = einfach('npc');
  if (neuKey) {
    return neuKey;
  }
  neuKey = einfach('bestie');
  if (neuKey) {
    return neuKey;
  }
  neuKey = einfach('gegenstand');
  if (neuKey) {
    return neuKey;
  }
  neuKey = einfach('raetsel');
  if (neuKey) {
    return neuKey;
  }
  neuKey = einfach('pantheon');
  if (neuKey) {
    return neuKey;
  }
  let m = /^fraktion:([^:]+):ohne-ort$/.exec(k);
  if (m && idMaps.fraktion[m[1]]) {
    return `fraktion:${idMaps.fraktion[m[1]]}:ohne-ort`;
  }
  m = /^fraktion:([^:]+):ort:(.+)$/.exec(k);
  if (m && idMaps.fraktion[m[1]]) {
    const newF = idMaps.fraktion[m[1]];
    const newO = idMaps.ort[m[2]];
    if (newO) {
      return `fraktion:${newF}:ort:${newO}`;
    }
    return `fraktion:${newF}:ohne-ort`;
  }
  return null;
}

function zstDuplizierMergeWeltenbauKarteile(wbQuelle, wbZiel, feld, idMaps) {
  const quelleRoot = wbQuelle && wbQuelle[feld] && typeof wbQuelle[feld] === 'object' ? wbQuelle[feld] : {};
  const zielRoot = wbZiel && wbZiel[feld] && typeof wbZiel[feld] === 'object' ? { ...wbZiel[feld] } : {};
  Object.keys(quelleRoot).forEach((gruppeKey) => {
    const layerQ = quelleRoot[gruppeKey] && typeof quelleRoot[gruppeKey] === 'object' ? quelleRoot[gruppeKey] : {};
    const layerZ = zielRoot[gruppeKey] && typeof zielRoot[gruppeKey] === 'object' ? { ...zielRoot[gruppeKey] } : {};
    Object.entries(layerQ).forEach(([layoutKey, val]) => {
      const nk = zstDuplizierMapLayoutKey(layoutKey, idMaps);
      if (!nk) {
        return;
      }
      layerZ[nk] = val && typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val;
    });
    zielRoot[gruppeKey] = layerZ;
  });
  return zielRoot;
}

const BEISPIEL_ZTF_KAT_ZU_DUPLIZIER_TYP = Object.freeze({
  orte: 'ort',
  fraktionen: 'fraktion',
  npcs: 'npc',
  gegenstaende: 'gegenstand',
  raetsel: 'raetsel',
  bestien: 'bestie',
  pantheon: 'pantheon',
});

/** Eindeutiger Kampagnenname für Beispiel-Import: Basisname ohne Suffix, ab #2 nur bei Namenskollision. */
function beispielNaechsterKampagnenInstanzName(basisName) {
  const basis =
    typeof basisName === 'string' && basisName.trim() ? basisName.trim() : 'Demo-Kampagne';
  const kampagnen = ladeSpielleitungKampagnenUebersichtListe();
  const basisNorm = normalisiereKampagnenNameVergleich(basis);
  let maxNum = 0;
  kampagnen.forEach((k) => {
    if (!k || typeof k.name !== 'string') {
      return;
    }
    const nameNorm = normalisiereKampagnenNameVergleich(k.name);
    if (nameNorm === basisNorm) {
      maxNum = Math.max(maxNum, 1);
      return;
    }
    const praefix = `${basisNorm} #`;
    if (!nameNorm.startsWith(praefix)) {
      return;
    }
    const nr = parseInt(nameNorm.slice(praefix.length).trim(), 10);
    if (Number.isFinite(nr) && nr > 0) {
      maxNum = Math.max(maxNum, nr);
    }
  });
  if (maxNum === 0) {
    return basis;
  }
  return `${basis} #${maxNum + 1}`;
}

function beispielSammleEntityIdMapsAusPaketDaten(daten) {
  const idMaps = zstDuplizierLeeresIdMaps();
  (Array.isArray(daten) ? daten : []).forEach((bereich) => {
    if (!bereich || typeof bereich.key !== 'string' || !bereich.vorhanden || typeof bereich.wert !== 'string') {
      return;
    }
    const meta = parseLsExportKeyMetaBeispiel(bereich.key);
    if (!meta || meta.lsTyp !== 'ztf_kategorie') {
      return;
    }
    const typ = BEISPIEL_ZTF_KAT_ZU_DUPLIZIER_TYP[meta.kategorie];
    if (!typ) {
      return;
    }
    let p = null;
    try {
      p = JSON.parse(bereich.wert);
    } catch {
      return;
    }
    (Array.isArray(p.zeilen) ? p.zeilen : []).forEach((z) => {
      if (!z || typeof z.id !== 'string' || !z.id || idMaps[typ][z.id]) {
        return;
      }
      idMaps[typ][z.id] = neueEntropieId();
    });
  });
  return idMaps;
}

function beispielRemapEntityLinksInText(text, idMaps) {
  if (typeof text !== 'string' || !text) {
    return text;
  }
  let out = text;
  const praefixe = ['https://htbah.local/entity/', 'htbah://entity/'];
  Object.keys(idMaps).forEach((typ) => {
    const map = idMaps[typ];
    if (!map) {
      return;
    }
    Object.entries(map).forEach(([altId, neuId]) => {
      praefixe.forEach((prefix) => {
        const altUrl = `${prefix}${encodeURIComponent(typ)}/${encodeURIComponent(altId)}`;
        const neuUrl = `${prefix}${encodeURIComponent(typ)}/${encodeURIComponent(neuId)}`;
        out = out.split(altUrl).join(neuUrl);
        const altPlain = `${prefix}${typ}/${altId}`;
        const neuPlain = `${prefix}${typ}/${neuId}`;
        out = out.split(altPlain).join(neuPlain);
      });
    });
  });
  return out;
}

function beispielRemapZeileHtmlFelder(zeile, idMaps) {
  if (!zeile || typeof zeile !== 'object') {
    return;
  }
  ['notizenHtml', 'beschreibungHtml', 'text', 'hinweisHtml'].forEach((feld) => {
    if (typeof zeile[feld] === 'string' && zeile[feld]) {
      zeile[feld] = beispielRemapEntityLinksInText(zeile[feld], idMaps);
    }
  });
}

function beispielBaueZustandAusPaketZtfKategorien(daten, quellKid, idMaps) {
  const zustand = {
    orte: [],
    fraktionen: [],
    npcs: [],
    gegenstaende: [],
    raetsel: [],
    bestien: [],
    pantheon: [],
  };
  (Array.isArray(daten) ? daten : []).forEach((bereich) => {
    const meta = parseLsExportKeyMetaBeispiel(bereich && bereich.key);
    if (!meta || meta.lsTyp !== 'ztf_kategorie' || meta.kampagneId !== quellKid) {
      return;
    }
    const typ = BEISPIEL_ZTF_KAT_ZU_DUPLIZIER_TYP[meta.kategorie];
    const listeKey = typ && ZST_DUPLIZIER_TYP_ZU_LISTE[typ];
    if (!listeKey) {
      return;
    }
    let p = null;
    try {
      p = JSON.parse(bereich.wert);
    } catch {
      return;
    }
    (Array.isArray(p.zeilen) ? p.zeilen : []).forEach((z) => {
      if (!z || typeof z.id !== 'string' || !z.id) {
        return;
      }
      const neuZeilenId = idMaps[typ] && idMaps[typ][z.id] ? idMaps[typ][z.id] : neueEntropieId();
      const copy = JSON.parse(JSON.stringify(z));
      copy.id = neuZeilenId;
      beispielRemapZeileHtmlFelder(copy, idMaps);
      zustand[listeKey].push(copy);
    });
  });
  zstDuplizierAktualisiereParentReferenzen(zustand, idMaps);
  Object.values(zustand).forEach((liste) => {
    if (!Array.isArray(liste)) {
      return;
    }
    liste.forEach((z) => beispielRemapZeileHtmlFelder(z, idMaps));
  });
  return zustand;
}

function beispielRemapWeltenbauGruppeKey(gruppeKey, altKid, neuKid) {
  const gk = typeof gruppeKey === 'string' ? gruppeKey : '';
  const alt = typeof altKid === 'string' && altKid.trim() ? altKid.trim() : '';
  const neu = typeof neuKid === 'string' && neuKid.trim() ? neuKid.trim() : '';
  if (alt && neu && gk === alt) {
    return neu;
  }
  return gk;
}

function beispielRemapWeltenbauNestedGruppeRoot(root, idMaps, altKid, neuKid) {
  if (!root || typeof root !== 'object') {
    return {};
  }
  const neuRoot = {};
  Object.keys(root).forEach((gruppeKey) => {
    const layer = root[gruppeKey];
    if (!layer || typeof layer !== 'object') {
      return;
    }
    const neuLayer = {};
    Object.entries(layer).forEach(([layoutKey, val]) => {
      const nk = zstDuplizierMapLayoutKey(layoutKey, idMaps) || layoutKey;
      neuLayer[nk] = val;
    });
    neuRoot[beispielRemapWeltenbauGruppeKey(gruppeKey, altKid, neuKid)] = neuLayer;
  });
  return neuRoot;
}

function beispielRemapWeltenbauFlatGruppeRoot(root, altKid, neuKid) {
  if (!root || typeof root !== 'object') {
    return {};
  }
  const neuRoot = {};
  Object.entries(root).forEach(([gruppeKey, val]) => {
    if (typeof gruppeKey !== 'string' || !gruppeKey) {
      return;
    }
    neuRoot[beispielRemapWeltenbauGruppeKey(gruppeKey, altKid, neuKid)] = val;
  });
  return neuRoot;
}

function beispielRemapWeltenbauBereichDaten(daten, idMaps, altKid, neuKid) {
  if (!daten || typeof daten !== 'object') {
    return daten;
  }
  const out = JSON.parse(JSON.stringify(daten));
  ['mapLayouts', 'mapBildLayouts', 'mapElementLocks'].forEach((feld) => {
    out[feld] = beispielRemapWeltenbauNestedGruppeRoot(out[feld], idMaps, altKid, neuKid);
  });
  ['mapHintergruende', 'mapEinstellungen', 'mapFreieBilder', 'mapFreieNotizen', 'mapFreiePfeile'].forEach(
    (feld) => {
      out[feld] = beispielRemapWeltenbauFlatGruppeRoot(out[feld], altKid, neuKid);
    },
  );
  return out;
}

function beispielRemapAbenteuerbuchPaket(p, idMaps) {
  if (!p || typeof p !== 'object') {
    return;
  }
  if (typeof p.abenteuerbuchHtml === 'string') {
    p.abenteuerbuchHtml = beispielRemapEntityLinksInText(p.abenteuerbuchHtml, idMaps);
  }
  if (p.abenteuerbuch && Array.isArray(p.abenteuerbuch.reiter)) {
    p.abenteuerbuch.reiter.forEach((r) => {
      if (r && typeof r.html === 'string') {
        r.html = beispielRemapEntityLinksInText(r.html, idMaps);
      }
    });
  }
}

function beispielRemapZtfZustandObjekt(roh, idMaps) {
  if (!roh || typeof roh !== 'object') {
    return roh;
  }
  const zustand = JSON.parse(JSON.stringify(roh));
  Object.entries(BEISPIEL_ZTF_KAT_ZU_DUPLIZIER_TYP).forEach(([kat, typ]) => {
    const listeKey = ZST_DUPLIZIER_TYP_ZU_LISTE[typ];
    if (!listeKey || !Array.isArray(zustand[listeKey])) {
      return;
    }
    zustand[listeKey] = zustand[listeKey].map((z) => {
      if (!z || typeof z.id !== 'string' || !z.id) {
        return z;
      }
      const copy = JSON.parse(JSON.stringify(z));
      if (idMaps[typ] && idMaps[typ][z.id]) {
        copy.id = idMaps[typ][z.id];
      }
      beispielRemapZeileHtmlFelder(copy, idMaps);
      return copy;
    });
  });
  zstDuplizierAktualisiereParentReferenzen(zustand, idMaps);
  Object.values(zustand).forEach((liste) => {
    if (!Array.isArray(liste)) {
      return;
    }
    liste.forEach((z) => beispielRemapZeileHtmlFelder(z, idMaps));
  });
  return zustand;
}

function beispielParsePaketBereichWert(bereich) {
  if (!bereich || !bereich.vorhanden || typeof bereich.wert !== 'string') {
    return null;
  }
  try {
    const p = JSON.parse(bereich.wert);
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}

/**
 * Legt aus einem Beispiel-Paket eine neue Kampagnen-Instanz an (eigene ID, Name mit #N).
 * Importiert Inhalte direkt in die neue Kampagne — ohne vollständiges Paket-Klonen.
 */
function wendeBeispielLokalerSpeicherPaketAlsNeueInstanzAn(paket) {
  const ergebnis = {
    kampagneId: '',
    kampagneStatus: 'neu',
    zufallNeu: 0,
    zufallVorhanden: 0,
    kampagneName: '',
    warKopie: true,
  };
  if (!paket || paket.typ !== 'lokaler-speicher' || !Array.isArray(paket.daten)) {
    return ergebnis;
  }

  const importErgebnis = htbahMitBulkSpeicherModus(() => {
  const quellIds = [...kampagneIdsAusLokalerSpeicherPaket(paket)];
  const altKid = quellIds[0] || '';
  if (!altKid) {
    return wendeBeispielLokalerSpeicherPaketAdditivAn(paket);
  }

  const neuKid = neueEntropieId();
  const basisName = beispielKampagneNameAusPaket(paket, altKid);
  const neuerName = beispielNaechsterKampagnenInstanzName(basisName);
  const daten = paket.daten;
  const idMaps = beispielSammleEntityIdMapsAusPaketDaten(daten);
  const ztfZustand = beispielBaueZustandAusPaketZtfKategorien(daten, altKid, idMaps);

  const teilBereich = daten.find((bereich) => {
    const meta = parseLsExportKeyMetaBeispiel(bereich && bereich.key);
    return (
      meta &&
      meta.kampagneId === altKid &&
      (meta.lsTyp === 'spielleitung_teil' || meta.lsTyp === 'spielleitung_ohne_gruppe')
    );
  });
  const teilPaket = beispielParsePaketBereichWert(teilBereich);
  if (teilPaket) {
    const themeSetting = beispielThemeSettingAusPaket(paket, altKid);
    if (teilPaket.kampagne && typeof teilPaket.kampagne === 'object') {
      teilPaket.kampagne = {
        ...teilPaket.kampagne,
        id: neuKid,
        name: neuerName,
        mitglieder: [],
        ...(themeSetting ? { themeSetting } : {}),
      };
    }
    teilPaket.kampagneId = neuKid;
    const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(neuKid, {
      name: neuerName,
      kampagneRoh: teilPaket.kampagne,
    });
    if (!sicher.ok) {
      throw new Error(sicher.fehler || 'Kampagne konnte nicht angelegt werden.');
    }
    importiereSpielleitungKampagneTeilPaket(neuKid, teilPaket);
  } else {
    const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(neuKid, { name: neuerName });
    if (!sicher.ok) {
      throw new Error(sicher.fehler || 'Kampagne konnte nicht angelegt werden.');
    }
  }

  const ztfLeer = ladeZufallstabellenZustand(neuKid);
  Object.keys(ztfZustand).forEach((kat) => {
    const liste = ztfZustand[kat];
    if (!Array.isArray(liste) || !liste.length) {
      return;
    }
    ztfLeer[kat] = liste;
    ergebnis.zufallNeu += liste.length;
  });
  speichereZufallstabellenZustand(ztfLeer, neuKid);

  daten.forEach((bereich) => {
    if (!bereich || !bereich.vorhanden || typeof bereich.wert !== 'string') {
      return;
    }
    const meta = parseLsExportKeyMetaBeispiel(bereich.key);
    if (!meta || meta.kampagneId !== altKid) {
      return;
    }
    if (
      meta.lsTyp === 'spielleitung_teil' ||
      meta.lsTyp === 'spielleitung_ohne_gruppe' ||
      meta.lsTyp === 'ztf_kategorie' ||
      meta.lsTyp === 'sl_mitglied'
    ) {
      return;
    }

    const p = beispielParsePaketBereichWert(bereich);
    if (!p) {
      return;
    }
    p.kampagneId = neuKid;

    if (meta.lsTyp === 'sl_abenteuerbuch') {
      beispielRemapAbenteuerbuchPaket(p, idMaps);
      importiereSpielleitungAbenteuerbuchExportPaket(neuKid, p);
    } else if (meta.lsTyp === 'sl_atmosphaere') {
      importiereSpielleitungAtmosphaereExportPaket(neuKid, p);
    } else if (meta.lsTyp === 'sl_zeitmessung') {
      importiereSpielleitungZeitmessungExportPaket(neuKid, p);
    } else if (meta.lsTyp === 'wb_bereich' && p.daten) {
      p.daten = beispielRemapWeltenbauBereichDaten(p.daten, idMaps, altKid, neuKid);
      importiereWeltenbauBereichPaket(neuKid, p);
    } else if (meta.lsTyp === 'wb_kampagne' && p.daten) {
      p.daten = beispielRemapWeltenbauBereichDaten(p.daten, idMaps, altKid, neuKid);
      importiereWeltenbauKampagnePaket(neuKid, p);
    } else if (meta.lsTyp === 'ztf_kampagne' && p.daten) {
      const remapped = beispielRemapZtfZustandObjekt(p.daten, idMaps);
      importiereZufallstabellenKampagnePaket(neuKid, { ...p, daten: remapped });
    } else if (meta.lsTyp === 'kampagne_komplett' || meta.lsTyp === 'kampagne_komplett_ohne_gruppe') {
      p.kampagneId = neuKid;
      const teil = leseSpielleitungTeilAusExport(p);
      if (teil && teil.kampagne && typeof teil.kampagne === 'object') {
        teil.kampagne.id = neuKid;
        teil.kampagne.name = neuerName;
        teil.kampagne.mitglieder = [];
      }
      if (p.zufallstabellenKampagne && p.zufallstabellenKampagne.daten) {
        p.zufallstabellenKampagne = {
          ...p.zufallstabellenKampagne,
          daten: beispielRemapZtfZustandObjekt(p.zufallstabellenKampagne.daten, idMaps),
        };
      }
      if (p.weltenbauKampagne && p.weltenbauKampagne.daten) {
        p.weltenbauKampagne = {
          ...p.weltenbauKampagne,
          daten: beispielRemapWeltenbauBereichDaten(p.weltenbauKampagne.daten, idMaps, altKid, neuKid),
        };
      }
      importiereKampagneKomplettBackupBundle(neuKid, p);
    }
  });

  const zufLegacy = daten.find((d) => d && d.key === 'htbah_zufallstabellen');
  const zufLegacyPaket = beispielParsePaketBereichWert(zufLegacy);
  if (zufLegacyPaket && typeof zufLegacyPaket === 'object') {
    if (
      zufLegacyPaket.typ === 'htbah-zufallstabellen-pro-kampagne' &&
      zufLegacyPaket.proKampagne &&
      zufLegacyPaket.proKampagne[altKid]
    ) {
      const remapped = beispielRemapZtfZustandObjekt(zufLegacyPaket.proKampagne[altKid], idMaps);
      importiereZufallstabellenKampagnePaket(neuKid, {
        htbahExportVersion: 1,
        typ: EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE,
        kampagneId: neuKid,
        daten: remapped,
      });
    }
  }

  const welLegacy = daten.find((d) => d && d.key === 'htbah_weltenbau');
  const welLegacyPaket = beispielParsePaketBereichWert(welLegacy);
  if (welLegacyPaket && typeof welLegacyPaket === 'object') {
    if (
      welLegacyPaket.typ === 'htbah-weltenbau-pro-kampagne' &&
      welLegacyPaket.proKampagne &&
      welLegacyPaket.proKampagne[altKid]
    ) {
      const wbDaten = beispielRemapWeltenbauBereichDaten(
        welLegacyPaket.proKampagne[altKid],
        idMaps,
        altKid,
        neuKid,
      );
      if (Number(wbDaten.version) === 4) {
        speichereWeltenbauZustand(wbDaten, neuKid);
      }
    }
  }

  ergebnis.kampagneId = neuKid;
  ergebnis.kampagneName = neuerName;
  const rohAktiv = leseSpielleitungZustandRoh();
  if (rohAktiv) {
    rohAktiv.aktiveKampagneId = neuKid;
    speichereSpielleitungRoh(rohAktiv);
  }
  return ergebnis;
  });
  const finalesErgebnis = importErgebnis || ergebnis;
  if (finalesErgebnis && finalesErgebnis.kampagneId) {
    htbahDispatchKampagneDatenGeaendert({
      art: 'zufallstabellen',
      kampagneId: finalesErgebnis.kampagneId,
    });
    htbahDispatchKampagneDatenGeaendert({ art: 'weltenbau', kampagneId: finalesErgebnis.kampagneId });
    htbahDispatchKampagneDatenGeaendert({ art: 'spielleitung', kampagneId: finalesErgebnis.kampagneId });
  }
  return finalesErgebnis;
}

function beispielImportBereicheFuerSchritte(daten, altKid) {
  return (Array.isArray(daten) ? daten : []).filter((bereich) => {
    if (!bereich || !bereich.vorhanden || typeof bereich.wert !== 'string') {
      return false;
    }
    const meta = parseLsExportKeyMetaBeispiel(bereich.key);
    if (!meta || meta.kampagneId !== altKid) {
      return false;
    }
    if (
      meta.lsTyp === 'spielleitung_teil' ||
      meta.lsTyp === 'spielleitung_ohne_gruppe' ||
      meta.lsTyp === 'ztf_kategorie' ||
      meta.lsTyp === 'sl_mitglied'
    ) {
      return false;
    }
    return true;
  });
}

function beispielImportierePaketBereich(neuKid, neuerName, bereich, idMaps, altKid) {
  const meta = parseLsExportKeyMetaBeispiel(bereich && bereich.key);
  if (!meta) {
    return;
  }
  const p = beispielParsePaketBereichWert(bereich);
  if (!p) {
    return;
  }
  p.kampagneId = neuKid;
  if (meta.lsTyp === 'sl_abenteuerbuch') {
    beispielRemapAbenteuerbuchPaket(p, idMaps);
    importiereSpielleitungAbenteuerbuchExportPaket(neuKid, p);
  } else if (meta.lsTyp === 'sl_atmosphaere') {
    importiereSpielleitungAtmosphaereExportPaket(neuKid, p);
  } else if (meta.lsTyp === 'sl_zeitmessung') {
    importiereSpielleitungZeitmessungExportPaket(neuKid, p);
  } else if (meta.lsTyp === 'wb_bereich' && p.daten) {
    p.daten = beispielRemapWeltenbauBereichDaten(p.daten, idMaps, altKid, neuKid);
    importiereWeltenbauBereichPaket(neuKid, p);
  } else if (meta.lsTyp === 'wb_kampagne' && p.daten) {
    p.daten = beispielRemapWeltenbauBereichDaten(p.daten, idMaps, altKid, neuKid);
    importiereWeltenbauKampagnePaket(neuKid, p);
  } else if (meta.lsTyp === 'ztf_kampagne' && p.daten) {
    const remapped = beispielRemapZtfZustandObjekt(p.daten, idMaps);
    importiereZufallstabellenKampagnePaket(neuKid, { ...p, daten: remapped });
  } else if (meta.lsTyp === 'kampagne_komplett' || meta.lsTyp === 'kampagne_komplett_ohne_gruppe') {
    p.kampagneId = neuKid;
    const teil = leseSpielleitungTeilAusExport(p);
    if (teil && teil.kampagne && typeof teil.kampagne === 'object') {
      teil.kampagne.id = neuKid;
      teil.kampagne.name = neuerName;
      teil.kampagne.mitglieder = [];
    }
    if (p.zufallstabellenKampagne && p.zufallstabellenKampagne.daten) {
      p.zufallstabellenKampagne = {
        ...p.zufallstabellenKampagne,
        daten: beispielRemapZtfZustandObjekt(p.zufallstabellenKampagne.daten, idMaps),
      };
    }
    if (p.weltenbauKampagne && p.weltenbauKampagne.daten) {
      p.weltenbauKampagne = {
        ...p.weltenbauKampagne,
        daten: beispielRemapWeltenbauBereichDaten(p.weltenbauKampagne.daten, idMaps, altKid, neuKid),
      };
    }
    importiereKampagneKomplettBackupBundle(neuKid, p);
  }
}

function beispielImportLegacyDaten(daten, altKid, neuKid, idMaps) {
  const zufLegacy = daten.find((d) => d && d.key === 'htbah_zufallstabellen');
  const zufLegacyPaket = beispielParsePaketBereichWert(zufLegacy);
  if (zufLegacyPaket && typeof zufLegacyPaket === 'object') {
    if (
      zufLegacyPaket.typ === 'htbah-zufallstabellen-pro-kampagne' &&
      zufLegacyPaket.proKampagne &&
      zufLegacyPaket.proKampagne[altKid]
    ) {
      const remapped = beispielRemapZtfZustandObjekt(zufLegacyPaket.proKampagne[altKid], idMaps);
      importiereZufallstabellenKampagnePaket(neuKid, {
        htbahExportVersion: 1,
        typ: EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE,
        kampagneId: neuKid,
        daten: remapped,
      });
    }
  }

  const welLegacy = daten.find((d) => d && d.key === 'htbah_weltenbau');
  const welLegacyPaket = beispielParsePaketBereichWert(welLegacy);
  if (welLegacyPaket && typeof welLegacyPaket === 'object') {
    if (
      welLegacyPaket.typ === 'htbah-weltenbau-pro-kampagne' &&
      welLegacyPaket.proKampagne &&
      welLegacyPaket.proKampagne[altKid]
    ) {
      const wbDaten = beispielRemapWeltenbauBereichDaten(
        welLegacyPaket.proKampagne[altKid],
        idMaps,
        altKid,
        neuKid,
      );
      if (Number(wbDaten.version) === 4) {
        speichereWeltenbauZustand(wbDaten, neuKid);
      }
    }
  }
}

function beispielImportBereichLabel(meta) {
  if (!meta || typeof meta.lsTyp !== 'string') {
    return 'Datenbereich';
  }
  const labels = {
    sl_abenteuerbuch: 'Abenteuerbuch',
    sl_atmosphaere: 'Atmosphäre',
    sl_zeitmessung: 'Zeitmessung',
    wb_bereich: 'Weltenbau-Bereich',
    wb_kampagne: 'Weltenbau',
    ztf_kampagne: 'Zufallstabellen',
    kampagne_komplett: 'Kampagne (komplett)',
    kampagne_komplett_ohne_gruppe: 'Kampagne (komplett)',
  };
  if (meta.lsTyp === 'wb_bereich' && meta.kategorie) {
    return `Weltenbau: ${meta.kategorie}`;
  }
  if (meta.lsTyp === 'ztf_kategorie' && meta.kategorie) {
    return `Zufallstabellen: ${meta.kategorie}`;
  }
  return labels[meta.lsTyp] || meta.lsTyp;
}

async function wendeBeispielLokalerSpeicherPaketAlsNeueInstanzAsync(paket, report) {
  const leer = {
    kampagneId: '',
    kampagneStatus: 'neu',
    zufallNeu: 0,
    zufallVorhanden: 0,
    kampagneName: '',
    warKopie: true,
  };
  if (!paket || paket.typ !== 'lokaler-speicher' || !Array.isArray(paket.daten)) {
    return leer;
  }

  if (HTBAH_DIAG_LOG && typeof HTBAH_DIAG_LOG.mark === 'function') {
    HTBAH_DIAG_LOG.mark('beispiel-import');
  }
  htbahDiagLog('import', 'start');

  const quellIds = [...kampagneIdsAusLokalerSpeicherPaket(paket)];
  const altKid = quellIds[0] || '';
  if (!altKid) {
    htbahDiagLog('import', 'additiv-fallback');
    const ergebnis = wendeBeispielLokalerSpeicherPaketAdditivAn(paket);
    if (typeof report === 'function') {
      report({ prozent: 100, text: 'Import abgeschlossen.' });
    }
    return ergebnis;
  }

  const ergebnis = { ...leer };
  const neuKid = neueEntropieId();
  const basisName = beispielKampagneNameAusPaket(paket, altKid);
  const neuerName = beispielNaechsterKampagnenInstanzName(basisName);
  const daten = paket.daten;
  const idMaps = beispielSammleEntityIdMapsAusPaketDaten(daten);
  const ztfZustand = beispielBaueZustandAusPaketZtfKategorien(daten, altKid, idMaps);

  const teilBereich = daten.find((bereich) => {
    const meta = parseLsExportKeyMetaBeispiel(bereich && bereich.key);
    return (
      meta &&
      meta.kampagneId === altKid &&
      (meta.lsTyp === 'spielleitung_teil' || meta.lsTyp === 'spielleitung_ohne_gruppe')
    );
  });
  const teilPaket = beispielParsePaketBereichWert(teilBereich);

  const schritte = [
    {
      label: 'Import wird vorbereitet …',
      fn: async () => {},
    },
    {
      label: 'Kampagne wird angelegt …',
      fn: async () => {
        htbahMitBulkSpeicherModus(() => {
          if (teilPaket) {
            if (teilPaket.kampagne && typeof teilPaket.kampagne === 'object') {
              teilPaket.kampagne = {
                ...teilPaket.kampagne,
                id: neuKid,
                name: neuerName,
                mitglieder: [],
              };
            }
            teilPaket.kampagneId = neuKid;
            const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(neuKid, {
              name: neuerName,
              kampagneRoh: teilPaket.kampagne,
            });
            if (!sicher.ok) {
              throw new Error(sicher.fehler || 'Kampagne konnte nicht angelegt werden.');
            }
            importiereSpielleitungKampagneTeilPaket(neuKid, teilPaket);
          } else {
            const sicher = sicherstelleSpielleitungKampagneFuerBeispielImport(neuKid, {
              name: neuerName,
            });
            if (!sicher.ok) {
              throw new Error(sicher.fehler || 'Kampagne konnte nicht angelegt werden.');
            }
          }
        });
      },
    },
    {
      label: 'Zufallstabellen werden importiert …',
      fn: async () => {
        htbahMitBulkSpeicherModus(() => {
          const ztfLeer = ladeZufallstabellenZustand(neuKid);
          Object.keys(ztfZustand).forEach((kat) => {
            const liste = ztfZustand[kat];
            if (!Array.isArray(liste) || !liste.length) {
              return;
            }
            ztfLeer[kat] = liste;
            ergebnis.zufallNeu += liste.length;
          });
          speichereZufallstabellenZustand(ztfLeer, neuKid);
        });
      },
    },
  ];

  beispielImportBereicheFuerSchritte(daten, altKid).forEach((bereich) => {
    const meta = parseLsExportKeyMetaBeispiel(bereich.key);
    schritte.push({
      label: `${beispielImportBereichLabel(meta)} wird importiert …`,
      fn: async () => {
        htbahMitBulkSpeicherModus(() => {
          beispielImportierePaketBereich(neuKid, neuerName, bereich, idMaps, altKid);
        });
      },
    });
  });

  schritte.push(
    {
      label: 'Legacy-Daten werden übernommen …',
      fn: async () => {
        htbahMitBulkSpeicherModus(() => {
          beispielImportLegacyDaten(daten, altKid, neuKid, idMaps);
        });
      },
    },
    {
      label: 'Kampagne wird aktiviert …',
      fn: async () => {
        htbahMitBulkSpeicherModus(() => {
          ergebnis.kampagneId = neuKid;
          ergebnis.kampagneName = neuerName;
          const rohAktiv = leseSpielleitungZustandRoh();
          if (rohAktiv) {
            rohAktiv.aktiveKampagneId = neuKid;
            speichereSpielleitungRoh(rohAktiv);
          }
        });
      },
    },
  );

  await htbahMitBulkSpeicherModusAsync(async () => {
    if (SAH && typeof SAH.fuehreSchritteMitFortschrittAus === 'function') {
      await SAH.fuehreSchritteMitFortschrittAus(schritte, report);
    } else {
      for (const schritt of schritte) {
        await htbahYieldAnMainThread();
        await schritt.fn();
        if (typeof report === 'function') {
          report({ prozent: 50, text: schritt.label });
        }
      }
    }
  });

  if (ergebnis.kampagneId) {
    htbahDispatchKampagneDatenGeaendert({
      art: 'zufallstabellen',
      kampagneId: ergebnis.kampagneId,
    });
    htbahDispatchKampagneDatenGeaendert({ art: 'weltenbau', kampagneId: ergebnis.kampagneId });
    htbahDispatchKampagneDatenGeaendert({ art: 'spielleitung', kampagneId: ergebnis.kampagneId });
  }

  if (typeof report === 'function') {
    report({
      prozent: 100,
      text: ergebnis.kampagneId ? `„${neuerName}“ wurde angelegt.` : 'Import abgeschlossen.',
    });
  }

  if (HTBAH_DIAG_LOG && typeof HTBAH_DIAG_LOG.measure === 'function') {
    HTBAH_DIAG_LOG.measure('beispiel-import');
  }
  htbahDiagLog('import', 'fertig', ergebnis.kampagneId);
  return ergebnis;
}

function dupliziereZufallstabellenEntitaeten(opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const quelle = ermittleKampagneIdFuerKampagnenSpeicher(o.quelleKampagneId);
  const ziel = ermittleKampagneIdFuerKampagnenSpeicher(o.zielKampagneId);
  if (!quelle || !ziel) {
    return { ok: false, fehler: 'Keine gültige Kampagne.', angelegt: 0, ergebnisse: [] };
  }
  const eintraegeRoh = Array.isArray(o.eintraege) ? o.eintraege : [];
  const schon = new Set();
  const eintraege = [];
  eintraegeRoh.forEach((e) => {
    const typ = String(e && e.typ ? e.typ : '').trim();
    const id = String(e && e.id ? e.id : '').trim();
    if (!typ || !id || !ZST_DUPLIZIER_TYP_ZU_LISTE[typ]) {
      return;
    }
    const sk = `${typ}:${id}`;
    if (schon.has(sk)) {
      return;
    }
    schon.add(sk);
    eintraege.push({ typ, id });
  });
  if (!eintraege.length) {
    return { ok: false, fehler: 'Keine Einträge ausgewählt.', angelegt: 0, ergebnisse: [] };
  }
  const reihenIndex = (typ) => {
    const i = ZST_DUPLIZIER_TYP_REIHENFOLGE.indexOf(typ);
    return i >= 0 ? i : 99;
  };
  eintraege.sort((a, b) => reihenIndex(a.typ) - reihenIndex(b.typ) || a.typ.localeCompare(b.typ));

  const quelleZ = JSON.parse(JSON.stringify(ladeZufallstabellenZustand(quelle)));
  const zielZ = JSON.parse(JSON.stringify(ladeZufallstabellenZustand(ziel)));
  const gleicheKampagne = quelle === ziel;
  const idMaps = zstDuplizierLeeresIdMaps();
  const ergebnisse = [];
  eintraege.forEach(({ typ, id }) => {
    const listeKey = ZST_DUPLIZIER_TYP_ZU_LISTE[typ];
    const quelleListe = Array.isArray(quelleZ[listeKey]) ? quelleZ[listeKey] : [];
    const zeileRoh = quelleListe.find((z) => z && z.id === id);
    if (!zeileRoh) {
      return;
    }
    const zeile = JSON.parse(JSON.stringify(zeileRoh));
    const altId = id;
    const neuId = neueEntropieId();
    zeile.id = neuId;
    if (gleicheKampagne) {
      zstDuplizierWendeKopieSuffix(zeile, typ);
    }
    idMaps[typ][altId] = neuId;
    if (!Array.isArray(zielZ[listeKey])) {
      zielZ[listeKey] = [];
    }
    zielZ[listeKey].push(zeile);
    ergebnisse.push({ typ, altId, neuId });
  });
  if (!ergebnisse.length) {
    return { ok: false, fehler: 'Keine der Entitäten wurde gefunden.', angelegt: 0, ergebnisse: [] };
  }
  zstDuplizierAktualisiereParentReferenzen(zielZ, idMaps);
  speichereZufallstabellenZustand(zielZ, ziel);

  const wbQuelle = ladeWeltenbauZustand(quelle);
  const wbZiel = JSON.parse(JSON.stringify(ladeWeltenbauZustand(ziel)));
  wbZiel.mapLayouts = zstDuplizierMergeWeltenbauKarteile(wbQuelle, wbZiel, 'mapLayouts', idMaps);
  wbZiel.mapBildLayouts = zstDuplizierMergeWeltenbauKarteile(wbQuelle, wbZiel, 'mapBildLayouts', idMaps);
  wbZiel.mapElementLocks = zstDuplizierMergeWeltenbauKarteile(wbQuelle, wbZiel, 'mapElementLocks', idMaps);
  speichereWeltenbauZustand(wbZiel, ziel);

  return { ok: true, angelegt: ergebnisse.length, ergebnisse };
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

function parseCharakterImportKandidaten(roh) {
  if (!roh || typeof roh !== 'object') {
    return [];
  }
  const kandidaten = [];
  const pushKandidat = (charakterRoh, bild, quelle, id = null) => {
    const charakter = window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(charakterRoh);
    kandidaten.push({
      id: typeof id === 'string' && id ? id : null,
      quelle,
      charakter,
      charakterBild: typeof bild === 'string' ? bild : '',
    });
  };

  if (roh.htbahExportVersion === 1 && roh.typ === 'charakter' && roh.charakter) {
    pushKandidat(roh.charakter, roh.charakterBild, 'charakter-export');
    return kandidaten;
  }

  if (
    roh.handeln !== undefined ||
    roh.wissen !== undefined ||
    roh.soziales !== undefined ||
    typeof roh.name === 'string'
  ) {
    pushKandidat(roh, '', 'charakter-objekt');
    return kandidaten;
  }

  if (Array.isArray(roh)) {
    roh.forEach((eintrag) => {
      const inner = parseCharakterImportKandidaten(eintrag);
      inner.forEach((kandidat) => kandidaten.push(kandidat));
    });
    return kandidaten;
  }

  if ((roh.typ === 'spielleitung_kampagne' || roh.typ === 'spielleiter_kampagne') && Array.isArray(roh.mitglieder)) {
    roh.mitglieder.forEach((mitglied) => {
      if (!mitglied || typeof mitglied !== 'object') {
        return;
      }
      pushKandidat(
        mitglied.charakter || {},
        mitglied.charakterBild || '',
        'spielleitung-kampagne',
        typeof mitglied.id === 'string' ? mitglied.id : null,
      );
    });
    return kandidaten;
  }

  if (roh.typ === 'lokaler-speicher' && Array.isArray(roh.daten)) {
    const importierteCharakterIds = new Set();
    const bereichZeichenkette = roh.daten.find(
      (eintrag) =>
        eintrag &&
        eintrag.key === SPEICHER_KEY_CHARAKTER &&
        eintrag.vorhanden &&
        typeof eintrag.wert === 'string',
    );
    if (bereichZeichenkette) {
      try {
        const parsed = JSON.parse(bereichZeichenkette.wert);
        const sammlung = normalisiereCharakterSammlung(parsed);
        sammlung.charaktere.forEach((eintrag) => {
          pushKandidat(eintrag.charakter, eintrag.charakterBild, 'backup-charaktere', eintrag.id);
          if (typeof eintrag.id === 'string' && eintrag.id) {
            importierteCharakterIds.add(eintrag.id);
          }
        });
      } catch {
        // ignorieren, unten ggf. Legacy prüfen
      }
    }

    roh.daten.forEach((eintrag) => {
      if (
        !eintrag ||
        typeof eintrag !== 'object' ||
        typeof eintrag.key !== 'string' ||
        !eintrag.key.startsWith(SPEICHER_KEY_CHARAKTER_ENTRY_PRAEFIX) ||
        !eintrag.vorhanden ||
        typeof eintrag.wert !== 'string'
      ) {
        return;
      }
      const keyId = eintrag.key.slice(SPEICHER_KEY_CHARAKTER_ENTRY_PRAEFIX.length);
      try {
        const payload = JSON.parse(eintrag.wert);
        const kandidatId =
          payload && typeof payload.id === 'string' && payload.id ? payload.id : keyId || null;
        if (kandidatId && importierteCharakterIds.has(kandidatId)) {
          return;
        }
        const charakterRoh =
          payload && payload.charakter && typeof payload.charakter === 'object'
            ? payload.charakter
            : payload;
        const charakterBild =
          payload && typeof payload.charakterBild === 'string' ? payload.charakterBild : '';
        pushKandidat(charakterRoh, charakterBild, 'backup-charakter-eintrag', kandidatId);
        if (kandidatId) {
          importierteCharakterIds.add(kandidatId);
        }
      } catch {
        // ignorieren
      }
    });

    const legacyChar = roh.daten.find(
      (eintrag) =>
        eintrag &&
        eintrag.key === SPEICHER_KEY_CHARAKTER_LEGACY &&
        eintrag.vorhanden &&
        typeof eintrag.wert === 'string',
    );
    if (legacyChar) {
      try {
        const charakterRoh = JSON.parse(legacyChar.wert);
        const legacyBild = roh.daten.find(
          (eintrag) =>
            eintrag &&
            eintrag.key === SPEICHER_KEY_CHARAKTER_BILD_LEGACY &&
            eintrag.vorhanden &&
            typeof eintrag.wert === 'string',
        );
        pushKandidat(charakterRoh, legacyBild ? legacyBild.wert : '', 'backup-legacy-charakter');
      } catch {
        // ignorieren
      }
    }
  }

  return kandidaten;
}

function parseCharakterImportPaket(roh) {
  const kandidaten = parseCharakterImportKandidaten(roh);
  if (!kandidaten.length) {
    return {
      ok: false,
      fehler:
        'Unbekanntes Format (HTBAH-Export, Charakterobjekt, Kampagnen- oder Komplett-Export erwartet).',
    };
  }
  return {
    ok: true,
    charakter: kandidaten[0].charakter,
    charakterBild: kandidaten[0].charakterBild,
  };
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

function normalisiereCharakterEintrag(eintrag) {
  if (!eintrag || typeof eintrag !== 'object') {
    return null;
  }
  return {
    id: typeof eintrag.id === 'string' && eintrag.id ? eintrag.id : neueEntropieId(),
    charakter: window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(eintrag.charakter),
    charakterBild: typeof eintrag.charakterBild === 'string' ? eintrag.charakterBild : '',
  };
}

function normalisiereCharakterSammlung(roh) {
  const quelle =
    roh && typeof roh === 'object'
      ? Array.isArray(roh)
        ? { charaktere: roh }
        : roh
      : { charaktere: [] };
  const listeRoh = Array.isArray(quelle.charaktere) ? quelle.charaktere : [];
  const charaktere = listeRoh
    .map((eintrag) => {
      if (!eintrag || typeof eintrag !== 'object') {
        return null;
      }
      if (eintrag.charakter && typeof eintrag.charakter === 'object') {
        return normalisiereCharakterEintrag(eintrag);
      }
      return normalisiereCharakterEintrag({
        id: eintrag.id,
        charakter: eintrag,
        charakterBild: '',
      });
    })
    .filter(Boolean);
  return {
    version: 1,
    charaktere,
  };
}

function ladeCharakterSammlung() {
  const roh = htbahSpeicher.leseJson(SPEICHER_KEY_CHARAKTER, null);
  return normalisiereCharakterSammlung(roh);
}

function speichereCharakterSammlung(sammlung) {
  htbahSpeicher.schreibeJson(SPEICHER_KEY_CHARAKTER, normalisiereCharakterSammlung(sammlung));
}

function ladeAktivenCharakterId() {
  const id = htbahSpeicher.leseText(SPEICHER_KEY_AKTIVER_CHARAKTER, null);
  return typeof id === 'string' && id ? id : null;
}

function setzeAktivenCharakterId(charakterId) {
  if (typeof charakterId === 'string' && charakterId) {
    htbahSpeicher.schreibeText(SPEICHER_KEY_AKTIVER_CHARAKTER, charakterId);
    return;
  }
  htbahSpeicher.loescheKey(SPEICHER_KEY_AKTIVER_CHARAKTER);
}

function listeCharaktere() {
  return ladeCharakterSammlung().charaktere;
}

function ladeCharakterEintrag(charakterId) {
  if (typeof charakterId !== 'string' || !charakterId) {
    return null;
  }
  const eintrag = ladeCharakterSammlung().charaktere.find((item) => item.id === charakterId);
  return eintrag || null;
}

function charakterPfadMitStandardTab(charakterId) {
  if (typeof charakterId !== 'string' || !charakterId) {
    return '/charakter/neu/session-zero';
  }
  const eintrag = ladeCharakterEintrag(charakterId);
  const suffix = eintrag
    ? window.HTBAH_CHARAKTER_MODEL.charakterStandardTabSuffix(eintrag.charakter)
    : 'session-zero';
  return `/charakter/${charakterId}/${suffix}`;
}

function speichereCharakterEintrag(payload) {
  const roh = payload && typeof payload === 'object' ? payload : {};
  const sammlung = ladeCharakterSammlung();
  const id = typeof roh.id === 'string' && roh.id ? roh.id : neueEntropieId();
  const nextEintrag = normalisiereCharakterEintrag({
    id,
    charakter: roh.charakter || {},
    charakterBild: roh.charakterBild || '',
  });
  const index = sammlung.charaktere.findIndex((item) => item.id === id);
  if (index >= 0) {
    sammlung.charaktere.splice(index, 1, nextEintrag);
  } else {
    sammlung.charaktere.push(nextEintrag);
  }
  speichereCharakterSammlung(sammlung);
  setzeAktivenCharakterId(id);
  return nextEintrag;
}

function importiereOderAktualisiereCharakterEintrag(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  return speichereCharakterEintrag({
    id: typeof payload.id === 'string' && payload.id ? payload.id : null,
    charakter: payload.charakter || {},
    charakterBild: payload.charakterBild || '',
  });
}

function loescheCharakterById(charakterId) {
  if (typeof charakterId !== 'string' || !charakterId) {
    return { geloescht: false, naechsteId: ladeAktivenCharakterId() };
  }
  const sammlung = ladeCharakterSammlung();
  const index = sammlung.charaktere.findIndex((item) => item.id === charakterId);
  if (index < 0) {
    return { geloescht: false, naechsteId: ladeAktivenCharakterId() };
  }
  sammlung.charaktere.splice(index, 1);
  speichereCharakterSammlung(sammlung);
  const naechster = sammlung.charaktere[0] ? sammlung.charaktere[0].id : null;
  const aktiveId = ladeAktivenCharakterId();
  if (aktiveId === charakterId) {
    setzeAktivenCharakterId(naechster);
  }
  return { geloescht: true, naechsteId: naechster };
}

function ladeCharakter(charakterId = null) {
  const sammlung = ladeCharakterSammlung();
  const id = typeof charakterId === 'string' && charakterId ? charakterId : ladeAktivenCharakterId();
  if (id) {
    const gefunden = sammlung.charaktere.find((eintrag) => eintrag.id === id);
    if (gefunden) {
      return gefunden.charakter;
    }
  }
  if (sammlung.charaktere[0]) {
    return sammlung.charaktere[0].charakter;
  }
  return null;
}

function speichereCharakter(charakter) {
  const aktiveId = ladeAktivenCharakterId();
  speichereCharakterEintrag({
    id: aktiveId,
    charakter,
    charakterBild: ladeCharakterBild(aktiveId),
  });
}

function istSystemFaehigkeitenPreset(preset) {
  return Boolean(preset && typeof preset === 'object' && preset.htbahPresetId);
}

/**
 * Liest rohe Preset-Liste aus dem Speicher und ergänzt vorgegebene Fähigkeiten-Presets.
 * Nutzer-Presets (ohne htbahPresetId) bleiben erhalten und folgen danach.
 */
function mergeFaehigkeitenPresetsAusSpeicher(roh) {
  const standard = window.HTBAH_STANDARD_FAEHIGKEITEN_PRESETS;
  let arr = [];
  if (Array.isArray(roh)) {
    arr = roh;
  }
  if (!Array.isArray(standard) || standard.length === 0) {
    return arr;
  }
  const systemMerged = standard.map((def) => {
    const legacyIds = Array.isArray(def.legacyPresetIds) ? def.legacyPresetIds : [];
    const user = arr.find(
      (s) =>
        s &&
        (s.htbahPresetId === def.htbahPresetId ||
          (s.htbahPresetId && legacyIds.includes(s.htbahPresetId))),
    );
    if (!user) {
      return JSON.parse(JSON.stringify(def));
    }
    const name =
      typeof user.name === 'string' && user.name.trim() ? user.name.trim() : def.name;
    return {
      ...def,
      ...user,
      htbahPresetId: def.htbahPresetId,
      name,
      handeln: Array.isArray(user.handeln) ? user.handeln : def.handeln,
      wissen: Array.isArray(user.wissen) ? user.wissen : def.wissen,
      soziales: Array.isArray(user.soziales) ? user.soziales : def.soziales,
    };
  });
  const ohneSystem = arr.filter((s) => s && typeof s === 'object' && !s.htbahPresetId);
  return [...systemMerged, ...ohneSystem];
}

function ladePresets() {
  const roh = htbahSpeicher.leseText(SPEICHER_KEY_PRESETS, null);
  if (roh == null || roh === '') {
    return mergeFaehigkeitenPresetsAusSpeicher([]);
  }
  try {
    const w = JSON.parse(roh);
    return mergeFaehigkeitenPresetsAusSpeicher(Array.isArray(w) ? w : []);
  } catch {
    return mergeFaehigkeitenPresetsAusSpeicher([]);
  }
}

function speicherePresets(presets) {
  htbahSpeicher.schreibeJson(SPEICHER_KEY_PRESETS, presets);
}

const CHARAKTERVORLAGEN_BASIS_PFAD = 'assets/charaktervorlagen';
let _charaktervorlagenIndexCache = null;
let _charaktervorlagenInhaltCache = Object.create(null);
let _charaktervorlagenIndexLadePromise = null;

function charaktervorlagenAssetUrl(relativ) {
  const teil = String(relativ || '').replace(/^\/+/, '');
  return ermittleAssetUrl(`${CHARAKTERVORLAGEN_BASIS_PFAD}/${teil}`);
}

async function ladeCharaktervorlagenIndex() {
  if (_charaktervorlagenIndexCache) {
    return _charaktervorlagenIndexCache;
  }
  if (_charaktervorlagenIndexLadePromise) {
    return _charaktervorlagenIndexLadePromise;
  }
  _charaktervorlagenIndexLadePromise = (async () => {
    try {
      const res = await fetch(charaktervorlagenAssetUrl('index.json'), { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      _charaktervorlagenIndexCache = Array.isArray(json) ? json : [];
      return _charaktervorlagenIndexCache;
    } catch (err) {
      console.warn('Charaktervorlagen-Index konnte nicht geladen werden:', err);
      _charaktervorlagenIndexCache = [];
      return _charaktervorlagenIndexCache;
    } finally {
      _charaktervorlagenIndexLadePromise = null;
    }
  })();
  return _charaktervorlagenIndexLadePromise;
}

async function ladeCharaktervorlageInhalt(datei) {
  const rel = typeof datei === 'string' ? datei.trim() : '';
  if (!rel) {
    return null;
  }
  if (_charaktervorlagenInhaltCache[rel]) {
    return _charaktervorlagenInhaltCache[rel];
  }
  try {
    const res = await fetch(charaktervorlagenAssetUrl(rel), { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const roh = await res.json();
    const VM = window.HTBAH_CHARAKTERVORLAGEN_MODEL;
    if (!VM || typeof VM.validiereVorlage !== 'function') {
      return null;
    }
    const ergebnis = VM.validiereVorlage(roh);
    if (!ergebnis.ok) {
      console.warn(`Vorlage ${rel}: ${ergebnis.fehler}`);
      return null;
    }
    _charaktervorlagenInhaltCache[rel] = ergebnis.vorlage;
    return ergebnis.vorlage;
  } catch (err) {
    console.warn(`Charaktervorlage ${rel} konnte nicht geladen werden:`, err);
    return null;
  }
}

async function ladeCharaktervorlagenKatalog() {
  const index = await ladeCharaktervorlagenIndex();
  const geladen = await Promise.all(
    index.map(async (meta) => {
      const vorlage = await ladeCharaktervorlageInhalt(meta.datei);
      if (!vorlage) {
        return null;
      }
      return { meta, vorlage };
    }),
  );
  return geladen.filter(Boolean);
}

function listeCharaktervorlagenEpochen() {
  const VM = window.HTBAH_CHARAKTERVORLAGEN_MODEL;
  return VM && Array.isArray(VM.EPOCHEN) ? VM.EPOCHEN : [];
}

function wendeCharaktervorlageAufCharakter(charakter, vorlage) {
  const VM = window.HTBAH_CHARAKTERVORLAGEN_MODEL;
  if (!VM || typeof VM.vorlageAufCharakterAnwenden !== 'function' || !vorlage) {
    return charakter;
  }
  return VM.vorlageAufCharakterAnwenden(charakter, vorlage);
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
  const zehnProzentRoh = z * 0.1;
  const kritErfolgMax = Math.floor(zehnProzentRoh);
  const kritMissMin = Math.ceil(90 + zehnProzentRoh);

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

function ermittleWuerfelSoundUrl() {
  return ermittleAssetUrl('assets/audio/wuerfel.mp3');
}

function htbahIstHexFarbe6(text) {
  return /^#[0-9a-fA-F]{6}$/.test(String(text || '').trim());
}

/**
 * @returns {{ stumm: boolean, lautstaerke: number }}
 */
function ladeWuerfelAudioProfil() {
  const defaults = { stumm: false, lautstaerke: 0.88 };
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_WUERFEL_AUDIO, null);
    if (roh && String(roh).trim().startsWith('{')) {
      const o = JSON.parse(roh);
      const lz =
        typeof o.lautstaerke === 'number' && Number.isFinite(o.lautstaerke)
          ? Math.min(1, Math.max(0, o.lautstaerke))
          : defaults.lautstaerke;
      return {
        stumm: Boolean(o.stumm),
        lautstaerke: lz,
      };
    }
  } catch {
    /* defektes JSON */
  }
  const legacy = htbahSpeicher.leseText(SPEICHER_KEY_WUERFEL_SOUND_LEGACY, null);
  if (legacy === '0') {
    return { stumm: true, lautstaerke: defaults.lautstaerke };
  }
  return defaults;
}

/**
 * @param {{ stumm?: boolean, lautstaerke?: number }} teil
 */
function setzeWuerfelAudioProfil(teil) {
  const aktuell = ladeWuerfelAudioProfil();
  const neu = {
    stumm: teil.stumm !== undefined ? Boolean(teil.stumm) : aktuell.stumm,
    lautstaerke:
      teil.lautstaerke !== undefined
        ? Math.min(1, Math.max(0, Number(teil.lautstaerke) || aktuell.lautstaerke))
        : aktuell.lautstaerke,
  };
  htbahSpeicher.schreibeText(SPEICHER_KEY_WUERFEL_AUDIO, JSON.stringify(neu));
  try {
    htbahSpeicher.loescheKey(SPEICHER_KEY_WUERFEL_SOUND_LEGACY);
  } catch {
    /* optional */
  }
  return neu;
}

/**
 * @returns {{ enabled: boolean, theme: string }}
 */
function ladeWuerfelAnzeigeProfil() {
  const defaults = { enabled: true, theme: '#509b4a', themeOnes: '#509b4a', themeTens: '#3b7a36' };
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_DICE_COLORS, null);
    if (!roh) {
      return defaults;
    }
    const parsed = JSON.parse(roh);
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }
    const themeRaw = typeof parsed.theme === 'string' ? parsed.theme.trim() : '';
    const themeOnesRaw = typeof parsed.themeOnes === 'string' ? parsed.themeOnes.trim() : '';
    const themeTensRaw = typeof parsed.themeTens === 'string' ? parsed.themeTens.trim() : '';
    const themeOnes = htbahIstHexFarbe6(themeOnesRaw)
      ? themeOnesRaw
      : htbahIstHexFarbe6(themeRaw)
        ? themeRaw
        : defaults.themeOnes;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : defaults.enabled,
      theme: themeOnes,
      themeOnes,
      themeTens: htbahIstHexFarbe6(themeTensRaw) ? themeTensRaw : defaults.themeTens,
    };
  } catch {
    return defaults;
  }
}

/**
 * @param {{ enabled?: boolean, theme?: string }} teil
 */
function setzeWuerfelAnzeigeProfil(teil) {
  const aktuell = ladeWuerfelAnzeigeProfil();
  const themeRaw = typeof teil?.theme === 'string' ? teil.theme.trim() : '';
  const themeOnesRaw = typeof teil?.themeOnes === 'string' ? teil.themeOnes.trim() : '';
  const themeTensRaw = typeof teil?.themeTens === 'string' ? teil.themeTens.trim() : '';
  const naechsteOnes = htbahIstHexFarbe6(themeOnesRaw)
    ? themeOnesRaw
    : htbahIstHexFarbe6(themeRaw)
      ? themeRaw
      : aktuell.themeOnes || aktuell.theme;
  const neu = {
    enabled: teil?.enabled !== undefined ? Boolean(teil.enabled) : aktuell.enabled,
    theme: naechsteOnes,
    themeOnes: naechsteOnes,
    themeTens: htbahIstHexFarbe6(themeTensRaw) ? themeTensRaw : aktuell.themeTens,
  };
  htbahSpeicher.schreibeText(SPEICHER_KEY_DICE_COLORS, JSON.stringify(neu));
  return neu;
}

/** Wiederverwendbare Audio-Elemente statt pro Wurf neue Instanzen (vermeidet GC-Druck). */
const WUERFEL_AUDIO_POOL = [];
const WUERFEL_AUDIO_POOL_MAX = 8;

function holeWuerfelAudioElement(url) {
  for (let i = 0; i < WUERFEL_AUDIO_POOL.length; i += 1) {
    const kandidat = WUERFEL_AUDIO_POOL[i];
    if (kandidat.paused || kandidat.ended) {
      if (kandidat.src !== url) {
        kandidat.src = url;
      }
      return kandidat;
    }
  }
  if (WUERFEL_AUDIO_POOL.length < WUERFEL_AUDIO_POOL_MAX) {
    const neu = new Audio(url);
    WUERFEL_AUDIO_POOL.push(neu);
    return neu;
  }
  const aeltestes = WUERFEL_AUDIO_POOL[0];
  try {
    aeltestes.pause();
    aeltestes.currentTime = 0;
  } catch {
    /* ignorieren */
  }
  if (aeltestes.src !== url) {
    aeltestes.src = url;
  }
  return aeltestes;
}

/**
 * Spielt den Würfel-Klang einmal pro Würfel. Erster Klang bei delay 0 ms (Klickfeedback);
 * weitere leicht zufällig gestaffelt (wirkt natürlicher als fester Abstand).
 * @param {number} anzahl
 */
function ladeZeitmessungProfil() {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  const defaults = ZU ? ZU.normalisiereProfil(null) : { klickAktiv: true, klickLautstaerke: 0.65, stoppuhrMitKlick: false, countdownAbSekunde: 10 };
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_ZEITMESSUNG, null);
    if (roh && String(roh).trim().startsWith('{')) {
      const o = JSON.parse(roh);
      return ZU ? ZU.normalisiereProfil(o) : defaults;
    }
  } catch {
    /* defektes JSON */
  }
  return defaults;
}

/**
 * @param {{ klickAktiv?: boolean, klickLautstaerke?: number, stoppuhrMitKlick?: boolean, countdownAbSekunde?: number }} teil
 */
function setzeZeitmessungProfil(teil) {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  const aktuell = ladeZeitmessungProfil();
  const zusammengefuegt = {
    klickAktiv: teil.klickAktiv !== undefined ? Boolean(teil.klickAktiv) : aktuell.klickAktiv,
    klickLautstaerke:
      teil.klickLautstaerke !== undefined
        ? Math.min(1, Math.max(0, Number(teil.klickLautstaerke) || aktuell.klickLautstaerke))
        : aktuell.klickLautstaerke,
    stoppuhrMitKlick:
      teil.stoppuhrMitKlick !== undefined ? Boolean(teil.stoppuhrMitKlick) : aktuell.stoppuhrMitKlick,
    countdownAbSekunde:
      teil.countdownAbSekunde !== undefined
        ? Math.min(35999, Math.max(0, Math.round(Number(teil.countdownAbSekunde) || 0)))
        : aktuell.countdownAbSekunde,
  };
  const neu = ZU ? ZU.normalisiereProfil(zusammengefuegt) : zusammengefuegt;
  htbahSpeicher.schreibeText(SPEICHER_KEY_ZEITMESSUNG, JSON.stringify(neu));
  return neu;
}

function ladeAbenteuerbuchEinstellungen() {
  const AE = window.HTBAH_SHARED && window.HTBAH_SHARED.normalisiereAbenteuerbuchEinstellungen;
  const defaults = AE ? AE(null) : { reiterLeisteUmbruch: false };
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_ABENTEUERBUCH_EINSTELLUNGEN, null);
    if (roh && String(roh).trim().startsWith('{')) {
      const o = JSON.parse(roh);
      return AE ? AE(o) : defaults;
    }
  } catch {
    /* defektes JSON */
  }
  return defaults;
}

/**
 * @param {{ reiterLeisteUmbruch?: boolean }} teil
 */
function setzeAbenteuerbuchEinstellungen(teil) {
  const AE = window.HTBAH_SHARED && window.HTBAH_SHARED.normalisiereAbenteuerbuchEinstellungen;
  const aktuell = ladeAbenteuerbuchEinstellungen();
  const zusammengefuegt = {
    reiterLeisteUmbruch:
      teil.reiterLeisteUmbruch !== undefined
        ? Boolean(teil.reiterLeisteUmbruch)
        : aktuell.reiterLeisteUmbruch,
  };
  const neu = AE ? AE(zusammengefuegt) : zusammengefuegt;
  htbahSpeicher.schreibeText(SPEICHER_KEY_ABENTEUERBUCH_EINSTELLUNGEN, JSON.stringify(neu));
  return neu;
}

function ladeEffektRahmenEinstellungen() {
  const ERM = window.HTBAH_SHARED && window.HTBAH_SHARED.EffektRahmenModel;
  const defaults = ERM ? ERM.normalisiereEffektRahmenKonfiguration(null) : { version: 1, rahmen: [] };
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_EFFEKT_RAHMEN, null);
    if (roh && String(roh).trim().startsWith('{')) {
      const o = JSON.parse(roh);
      return ERM ? ERM.normalisiereEffektRahmenKonfiguration(o) : defaults;
    }
  } catch {
    /* defektes JSON */
  }
  return defaults;
}

/**
 * @param {{ rahmen?: Array<object> }} teil
 */
function setzeEffektRahmenEinstellungen(teil) {
  const ERM = window.HTBAH_SHARED && window.HTBAH_SHARED.EffektRahmenModel;
  const aktuell = ladeEffektRahmenEinstellungen();
  const zusammengefuegt = {
    rahmen: teil && Array.isArray(teil.rahmen) ? teil.rahmen : aktuell.rahmen,
  };
  const neu = ERM ? ERM.normalisiereEffektRahmenKonfiguration(zusammengefuegt) : zusammengefuegt;
  htbahSpeicher.schreibeText(SPEICHER_KEY_EFFEKT_RAHMEN, JSON.stringify(neu));
  window.dispatchEvent(new CustomEvent('htbah:effekt-rahmen-geaendert', { detail: { ...neu } }));
  return neu;
}

function ladeTokenExportEinstellungen() {
  const ERM = window.HTBAH_SHARED && window.HTBAH_SHARED.EffektRahmenModel;
  const defaults = ERM ? ERM.normalisiereTokenExportEinstellungen(null) : {};
  try {
    const roh = htbahSpeicher.leseText(SPEICHER_KEY_TOKEN_EXPORT, null);
    if (roh && String(roh).trim().startsWith('{')) {
      const o = JSON.parse(roh);
      return ERM ? ERM.normalisiereTokenExportEinstellungen(o) : defaults;
    }
  } catch {
    /* defektes JSON */
  }
  return defaults;
}

/**
 * @param {object} teil
 */
function setzeTokenExportEinstellungen(teil) {
  const ERM = window.HTBAH_SHARED && window.HTBAH_SHARED.EffektRahmenModel;
  const aktuell = ladeTokenExportEinstellungen();
  const zusammengefuegt = { ...aktuell, ...(teil && typeof teil === 'object' ? teil : {}) };
  const neu = ERM ? ERM.normalisiereTokenExportEinstellungen(zusammengefuegt) : zusammengefuegt;
  htbahSpeicher.schreibeText(SPEICHER_KEY_TOKEN_EXPORT, JSON.stringify(neu));
  return neu;
}

function spieleZeitmessungKlick(lautstaerkeOverride) {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  if (ZU && typeof ZU.spieleKlick === 'function') {
    ZU.spieleKlick(lautstaerkeOverride);
  }
}

function spieleZeitmessungAbgelaufen(lautstaerkeOverride) {
  const ZU = window.HTBAH_SHARED && window.HTBAH_SHARED.ZeitmessungUtils;
  if (ZU && typeof ZU.spieleAbgelaufen === 'function') {
    ZU.spieleAbgelaufen(lautstaerkeOverride);
  }
}

function spieleWuerfelSounds(anzahl) {
  const n = Math.max(0, Math.min(50, Math.floor(Number(anzahl) || 0)));
  if (n === 0) {
    return;
  }
  const profil = ladeWuerfelAudioProfil();
  if (profil.stumm) {
    return;
  }
  const vol = Math.min(1, Math.max(0, profil.lautstaerke));
  const url = ermittleWuerfelSoundUrl();
  /** Mindest- und Zusatz-Millisekunden bis zum nächsten Klang (nur bei n > 1). */
  const staffelMinMs = 85;
  const staffelZufallMs = 110;
  let t = 0;
  for (let i = 0; i < n; i++) {
    const delay = t;
    window.setTimeout(() => {
      try {
        const a = holeWuerfelAudioElement(url);
        a.volume = vol;
        const p = a.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch {
        /* optional: Autoplay / MIME */
      }
    }, delay);
    if (i < n - 1) {
      t += staffelMinMs + Math.floor(Math.random() * staffelZufallMs);
    }
  }
}

function ermittleRegelwerkQuelleUrl() {
  return ermittleAssetUrl('assets/pdf/how-to-be-a-hero-Regelwerk-hoschianer.pdf');
}

const HTBAH_THEMEN_EINSTELLUNGEN =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.ThemenEinstellungen) || null;

function ladeThemeProfil() {
  const raw = htbahSpeicher.leseText(SPEICHER_KEY_THEME, null);
  if (HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil === 'function') {
    return HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil(raw);
  }
  const mode = raw === 'dark' ? 'dark' : 'light';
  return { mode, setting: 'gegenwart' };
}

function wendePwaChromeFarbenAn() {
  if (typeof document === 'undefined' || !document.documentElement || !document.head) {
    return;
  }
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const themeColor =
    styles.getPropertyValue('--primary-color').trim() ||
    styles.getPropertyValue('--navbar-bg').trim() ||
    '#1d6a85';
  const tileColor =
    styles.getPropertyValue('--navbar-bg').trim() ||
    styles.getPropertyValue('--bg-color').trim() ||
    '#f8fafc';
  const mode = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  root.style.colorScheme = mode;

  function setMetaName(name, content) {
    if (!name || !content) {
      return;
    }
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  setMetaName('theme-color', themeColor);
  setMetaName('msapplication-TileColor', tileColor);
  setMetaName(
    'apple-mobile-web-app-status-bar-style',
    mode === 'dark' ? 'black-translucent' : 'default',
  );
}

function wendeThemeProfilAufDom(profil) {
  const p =
    HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil === 'function'
      ? HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil(profil)
      : { mode: profil && profil.mode === 'dark' ? 'dark' : 'light', setting: 'gegenwart' };
  document.documentElement.setAttribute('data-theme', p.mode);
  document.documentElement.setAttribute('data-bs-theme', p.mode);
  document.documentElement.setAttribute('data-theme-setting', p.setting);
  wendePwaChromeFarbenAn();
  return p;
}

function wendeThemeProfilAn(profil) {
  const p = wendeThemeProfilAufDom(profil);
  try {
    window.dispatchEvent(
      new CustomEvent('htbah:theme-profil-geaendert', { detail: { ...p } }),
    );
  } catch {
    /* ignorieren */
  }
  return p;
}

function ladeAktivesThemeProfil(kampagneIdOptional) {
  const global =
    HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil === 'function'
      ? HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil(ladeThemeProfil())
      : ladeThemeProfil();
  const kid =
    (typeof kampagneIdOptional === 'string' && kampagneIdOptional.trim()
      ? kampagneIdOptional.trim()
      : null) || kampagneIdAusPfad(typeof window !== 'undefined' && window.location ? window.location.hash.replace(/^#/, '') || '/' : '/');
  if (!kid) {
    return { ...global };
  }
  const kampagne = findeSpielleitungKampagneNachId(kid);
  const kampagnenSetting =
    HTBAH_THEMEN_EINSTELLUNGEN &&
    typeof HTBAH_THEMEN_EINSTELLUNGEN.normalisiereKampagnenThemeSetting === 'function'
      ? HTBAH_THEMEN_EINSTELLUNGEN.normalisiereKampagnenThemeSetting(
          kampagne && kampagne.themeSetting,
        )
      : '';
  if (!kampagnenSetting) {
    return { ...global };
  }
  return { mode: global.mode, setting: kampagnenSetting };
}

function wendeEffektivesThemeAn(kampagneIdOptional) {
  return wendeThemeProfilAn(ladeAktivesThemeProfil(kampagneIdOptional));
}

function wendeGlobalesThemeAn() {
  return wendeThemeProfilAn(ladeThemeProfil());
}

function speichereKampagneThemeSetting(kampagneId, rawSetting) {
  const kid = typeof kampagneId === 'string' ? kampagneId.trim() : '';
  if (!kid) {
    return false;
  }
  const themeSetting =
    HTBAH_THEMEN_EINSTELLUNGEN &&
    typeof HTBAH_THEMEN_EINSTELLUNGEN.normalisiereKampagnenThemeSetting === 'function'
      ? HTBAH_THEMEN_EINSTELLUNGEN.normalisiereKampagnenThemeSetting(rawSetting)
      : '';
  const zustand = ladeSpielleitungZustand();
  const kampagnen = Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
  const idx = kampagnen.findIndex((k) => k && k.id === kid);
  if (idx < 0) {
    return false;
  }
  kampagnen[idx] = normalisiereSpielleitungKampagne({
    ...kampagnen[idx],
    themeSetting,
  });
  zustand.kampagnen = kampagnen;
  speichereSpielleitungZustand(zustand);
  wendeEffektivesThemeAn(kid);
  return true;
}

function setzeThemeProfil(profil) {
  const norm = ladeThemeProfil();
  const eingabe = profil && typeof profil === 'object' ? profil : {};
  const zusammengefuegt = {
    mode: eingabe.mode != null ? eingabe.mode : norm.mode,
    setting: eingabe.setting != null ? eingabe.setting : norm.setting,
  };
  const gueltig =
    HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil === 'function'
      ? HTBAH_THEMEN_EINSTELLUNGEN.normalisiereThemeProfil(zusammengefuegt)
      : { mode: zusammengefuegt.mode === 'dark' ? 'dark' : 'light', setting: 'gegenwart' };
  const serialisiert =
    HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.serialisiereThemeProfil === 'function'
      ? HTBAH_THEMEN_EINSTELLUNGEN.serialisiereThemeProfil(gueltig)
      : gueltig.mode;
  htbahSpeicher.schreibeText(SPEICHER_KEY_THEME, serialisiert);
  return wendeEffektivesThemeAn();
}

function ladeTheme() {
  return ladeThemeProfil().mode;
}

function setzeTheme(theme) {
  return setzeThemeProfil({ mode: theme }).mode;
}

function ladeThemeSetting() {
  return ladeThemeProfil().setting;
}

function setzeThemeSetting(setting) {
  return setzeThemeProfil({ setting }).setting;
}

function standardZufallEpocheFuerAktivesTheme() {
  const profil = ladeAktivesThemeProfil();
  if (HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.standardZufallEpoche === 'function') {
    return HTBAH_THEMEN_EINSTELLUNGEN.standardZufallEpoche(profil.setting);
  }
  return 'mittelalter';
}

function standardCharakterEpocheFuerAktivesTheme() {
  const profil = ladeAktivesThemeProfil();
  if (
    HTBAH_THEMEN_EINSTELLUNGEN &&
    typeof HTBAH_THEMEN_EINSTELLUNGEN.standardCharakterEpoche === 'function'
  ) {
    return HTBAH_THEMEN_EINSTELLUNGEN.standardCharakterEpoche(profil.setting);
  }
  return 'mittelalter-fantasy';
}

function standardPdfStilFuerAktivesTheme() {
  const profil = ladeAktivesThemeProfil();
  if (HTBAH_THEMEN_EINSTELLUNGEN && typeof HTBAH_THEMEN_EINSTELLUNGEN.standardPdfStil === 'function') {
    return HTBAH_THEMEN_EINSTELLUNGEN.standardPdfStil(profil.setting);
  }
  return 'fantasy-mittelalter';
}

function ladeInteraktiveWeltStatsAnzeigen() {
  const raw = String(htbahSpeicher.leseText(SPEICHER_KEY_INTERAKTIVE_WELT_STATS_ANZEIGEN, '') || '').trim();
  return raw === '1' || raw === 'true';
}

function speichereInteraktiveWeltStatsAnzeigen(aktiv) {
  const an = !!aktiv;
  htbahSpeicher.schreibeText(SPEICHER_KEY_INTERAKTIVE_WELT_STATS_ANZEIGEN, an ? '1' : '0');
  try {
    window.dispatchEvent(new CustomEvent('htbah:interaktive-welt-stats-anzeigen-geaendert'));
  } catch {
    /* ignorieren */
  }
  return an;
}

const HTBAH_ORIENTIERUNG =
  (window.HTBAH_SHARED && window.HTBAH_SHARED.Orientierung) || null;
if (HTBAH_ORIENTIERUNG && typeof HTBAH_ORIENTIERUNG.setzeSpeicher === 'function') {
  HTBAH_ORIENTIERUNG.setzeSpeicher(htbahSpeicher);
}

function ladeOrientierungModus() {
  return HTBAH_ORIENTIERUNG ? HTBAH_ORIENTIERUNG.ladeModus() : 'frei';
}

function speichereOrientierungModus(modus) {
  return HTBAH_ORIENTIERUNG ? HTBAH_ORIENTIERUNG.speichereModus(modus) : 'frei';
}

function bestimmeOrientierungsGruppe(modus) {
  return HTBAH_ORIENTIERUNG ? HTBAH_ORIENTIERUNG.bestimmeGruppe(modus) : 'frei';
}

function ladeCharakterBild(charakterId = null) {
  const id = typeof charakterId === 'string' && charakterId ? charakterId : ladeAktivenCharakterId();
  if (!id) {
    return '';
  }
  const eintrag = ladeCharakterEintrag(id);
  return eintrag ? eintrag.charakterBild : '';
}

function speichereCharakterBild(dataUrl, charakterId = null) {
  const id = typeof charakterId === 'string' && charakterId ? charakterId : ladeAktivenCharakterId();
  if (!id) {
    return null;
  }
  const eintrag = ladeCharakterEintrag(id);
  if (!eintrag) {
    return null;
  }
  return speichereCharakterEintrag({
    id,
    charakter: eintrag.charakter,
    charakterBild: typeof dataUrl === 'string' ? dataUrl : '',
  });
}

function loescheCharakterBild(charakterId = null) {
  return speichereCharakterBild('', charakterId);
}

function migriereLegacyCharakterSpeicherWennNoetig() {
  const sammlung = ladeCharakterSammlung();
  if (sammlung.charaktere.length) {
    return;
  }
  const legacyCharRoh = htbahSpeicher.leseText(SPEICHER_KEY_CHARAKTER_LEGACY, null);
  if (legacyCharRoh == null || legacyCharRoh === '') {
    return;
  }
  try {
    const legacyChar = JSON.parse(legacyCharRoh);
    const legacyBild = htbahSpeicher.leseText(SPEICHER_KEY_CHARAKTER_BILD_LEGACY, '') || '';
    const eintrag = speichereCharakterEintrag({
      id: neueEntropieId(),
      charakter: legacyChar,
      charakterBild: legacyBild,
    });
    if (eintrag && eintrag.id) {
      setzeAktivenCharakterId(eintrag.id);
    }
    htbahSpeicher.loescheKey(SPEICHER_KEY_CHARAKTER_LEGACY);
    htbahSpeicher.loescheKey(SPEICHER_KEY_CHARAKTER_BILD_LEGACY);
  } catch {
    // Legacy-Daten sind defekt -> ignorieren
  }
}

setzeThemeProfil(ladeThemeProfil());
migriereLegacyCharakterSpeicherWennNoetig();

/**
 * @returns {'charakter' | 'spielleitung' | null}
 */
function ladeAppRolle() {
  const r = htbahSpeicher.leseText(SPEICHER_KEY_APP_ROLLE, null);
  if (r === 'charakter' || r === 'spielleitung') {
    return r;
  }
  return null;
}

/**
 * @param {'charakter' | 'spielleitung' | null} rolle
 */
function speichereAppRolle(rolle) {
  if (rolle === 'charakter' || rolle === 'spielleitung') {
    htbahSpeicher.schreibeText(SPEICHER_KEY_APP_ROLLE, rolle);
    return;
  }
  htbahSpeicher.loescheKey(SPEICHER_KEY_APP_ROLLE);
}

const bildbetrachterZustand = Vue.reactive({
  naechsteZ: 4100,
  fenster: [],
});

/**
 * @param {{ dataUrl: string, titel?: string, weltenbauEintragId?: string }} opts
 */
function bildbetrachterOeffnen(opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const dataUrl = typeof o.dataUrl === 'string' ? o.dataUrl : '';
  if (!dataUrl.startsWith('data:image/')) {
    return null;
  }
  const id = neueEntropieId();
  const n = bildbetrachterZustand.fenster.length;
  const offset = 28 * n;
  const w = Math.min(560, Math.max(280, window.innerWidth - 48));
  const h = Math.min(440, Math.max(220, window.innerHeight - 100));
  bildbetrachterZustand.fenster.push({
    id,
    weltenbauEintragId: typeof o.weltenbauEintragId === 'string' ? o.weltenbauEintragId : '',
    titel: typeof o.titel === 'string' && o.titel.trim() ? o.titel.trim() : 'Bild',
    dataUrl,
    x: Math.min(24 + offset, Math.max(8, window.innerWidth - w - 8)),
    y: Math.min(24 + offset, Math.max(8, window.innerHeight - h - 8)),
    w,
    h,
    zoom: 1,
    naturalW: 0,
    naturalH: 0,
    fullscreen: false,
    zIndex: bildbetrachterZustand.naechsteZ++,
  });
  return id;
}

function bildbetrachterSchliessen(fensterId) {
  bildbetrachterZustand.fenster = bildbetrachterZustand.fenster.filter((f) => f.id !== fensterId);
}

function bildbetrachterSchliesseFuerWeltenbauEintrag(eintragId) {
  if (!eintragId) {
    return;
  }
  bildbetrachterZustand.fenster = bildbetrachterZustand.fenster.filter(
    (f) => f.weltenbauEintragId !== eintragId,
  );
}

function bildbetrachterNachVorne(fensterId) {
  const f = bildbetrachterZustand.fenster.find((x) => x.id === fensterId);
  if (f) {
    f.zIndex = bildbetrachterZustand.naechsteZ++;
  }
}

const HTBAH_SPEICHER_KEYS = Object.freeze({
  appRolle: SPEICHER_KEY_APP_ROLLE,
  charakter: SPEICHER_KEY_CHARAKTER,
  aktiverCharakter: SPEICHER_KEY_AKTIVER_CHARAKTER,
  legacyCharakter: SPEICHER_KEY_CHARAKTER_LEGACY,
  presets: SPEICHER_KEY_PRESETS,
  theme: SPEICHER_KEY_THEME,
  legacyCharakterBild: SPEICHER_KEY_CHARAKTER_BILD_LEGACY,
  spielleitung: SPEICHER_KEY_SPIELLEITUNG,
  kampagnenLabelsKatalog: SPEICHER_KEY_KAMPAGNEN_LABELS_KATALOG,
  zufallstabellen: SPEICHER_KEY_ZUFALLSTABELLEN,
  weltenbau: SPEICHER_KEY_WELTENBAU,
  /** Präfix aller pro-Kampagne-Keys (Zufallstabellen), inkl. „__“. */
  zufallstabellenProKampagnePraefix: `${SPEICHER_KEY_ZUFALLSTABELLEN}__`,
  /** Präfix aller pro-Kampagne-Keys (Weltenbau / interaktive Welt), inkl. „__“. */
  weltenbauProKampagnePraefix: `${SPEICHER_KEY_WELTENBAU}__`,
  wuerfelAudio: SPEICHER_KEY_WUERFEL_AUDIO,
  diceColors: SPEICHER_KEY_DICE_COLORS,
  wuerfelBeutelFenster: SPEICHER_KEY_WUERFEL_BEUTEL_FENSTER,
  zeitmessung: SPEICHER_KEY_ZEITMESSUNG,
  zeitmessungBadgePos: SPEICHER_KEY_ZEITMESSUNG_BADGE_POS,
  zeichenModal: SPEICHER_KEY_ZEICHEN_MODAL,
  mentionNavigationTarget: SPEICHER_KEY_MENTION_NAV_TARGET,
  interaktiveWeltStatsAnzeigen: SPEICHER_KEY_INTERAKTIVE_WELT_STATS_ANZEIGEN,
  konfliktFenster: SPEICHER_KEY_KONFLIKT_FENSTER,
  offeneModals: SPEICHER_KEY_OFFENE_MODALS,
  floatingFabPos: SPEICHER_KEY_FLOATING_FAB_POS,
  effektRahmen: SPEICHER_KEY_EFFEKT_RAHMEN,
  tokenExport: SPEICHER_KEY_TOKEN_EXPORT,
});

window.HTBAH = {
  ...(window.HTBAH || {}),
  ladeCharakter,
  speichereCharakter,
  ladeCharakterSammlung,
  listeCharaktere,
  ladeCharakterEintrag,
  speichereCharakterEintrag,
  importiereOderAktualisiereCharakterEintrag,
  loescheCharakterById,
  migriereLegacyCharakterSpeicherWennNoetig,
  ladeAktivenCharakterId,
  setzeAktivenCharakterId,
  ladePresets,
  speicherePresets,
  istSystemFaehigkeitenPreset,
  ladeCharaktervorlagenIndex,
  ladeCharaktervorlageInhalt,
  ladeCharaktervorlagenKatalog,
  listeCharaktervorlagenEpochen,
  wendeCharaktervorlageAufCharakter,
  wuerfelW10,
  wuerfelW100,
  ladeWuerfelAudioProfil,
  setzeWuerfelAudioProfil,
  ladeWuerfelAnzeigeProfil,
  setzeWuerfelAnzeigeProfil,
  spieleWuerfelSounds,
  ladeZeitmessungProfil,
  setzeZeitmessungProfil,
  ladeAbenteuerbuchEinstellungen,
  setzeAbenteuerbuchEinstellungen,
  ladeEffektRahmenEinstellungen,
  setzeEffektRahmenEinstellungen,
  ladeTokenExportEinstellungen,
  setzeTokenExportEinstellungen,
  spieleZeitmessungKlick,
  spieleZeitmessungAbgelaufen,
  ladeZeitmessungBadgePosition,
  speichereZeitmessungBadgePosition,
  berechneProbeAuswertung,
  ermittleAssetUrl,
  ermittleRegelwerkQuelleUrl,
  ladeTheme,
  setzeTheme,
  ladeThemeProfil,
  ladeAktivesThemeProfil,
  setzeThemeProfil,
  wendeThemeProfilAn,
  wendePwaChromeFarbenAn,
  wendeEffektivesThemeAn,
  wendeGlobalesThemeAn,
  speichereKampagneThemeSetting,
  ladeThemeSetting,
  setzeThemeSetting,
  standardZufallEpocheFuerAktivesTheme,
  standardCharakterEpocheFuerAktivesTheme,
  standardPdfStilFuerAktivesTheme,
  ladeCharakterBild,
  speichereCharakterBild,
  loescheCharakterBild,
  neueEntropieId,
  ladeSpielleitungZustand,
  ladeSpielleitungZustandLeicht,
  ladeSpielleitungKampagnenUebersichtListe,
  speichereSpielleitungZustand,
  ladeKampagnenLabelsKatalog,
  speichereKampagnenLabelsKatalog,
  erstelleKampagnenLabelImKatalog,
  aktualisiereKampagnenLabelImKatalog,
  importiereKampagnenLabelsInGlobalenKatalog,
  loescheKampagnenLabelAusKatalog,
  setzeKampagneLabelAktiv,
  kampagneLabelNachNameZuweisen,
  kampagnenLabelBadgeKlasse,
  aktualisiereKampagneLabels,
  kampagnenSlugAusName,
  kampagnenEinstiegsTab,
  kampagnenEinstiegsPfadFuerSlug,
  kampagneIdAusSlug,
  speichereKampagnenTab,
  kampagnenPfad,
  erstelleCharakterExportPaket,
  parseCharakterImportKandidaten,
  parseCharakterImportPaket,
  dateiHerunterladenJson,
  ladeZufallstabellenZustand,
  speichereZufallstabellenZustand,
  erstellePantheonExportPaket,
  pantheonImportAusPaket,
  ladeKampagnenAbenteuerbuch,
  speichereKampagnenAbenteuerbuch,
  ladeKampagnenAbenteuerbuchHtml,
  speichereKampagnenAbenteuerbuchHtml,
  loescheKampagnenAbenteuerbuch,
  ladeWeltenbauZustand,
  speichereWeltenbauZustand,
  speichereWeltenbauMapBildLayoutsGruppe,
  erstelleSpielleitungKampagne,
  dupliziereZufallstabellenEntitaeten,
  entferneZufallstabellenParentReferenzenAufGegenstand,
  entferneZufallstabellenBesitzerReferenzen,
  entferneGegenstandAusAllenInventaren,
  loescheZufallstabellenUndWeltenbauFuerKampagne,
  loescheZufallstabellenListeFuerKampagne,
  loescheWeltenbauBereichFuerKampagne,
  loescheSpielleitungKampagneKomplett,
  loescheSpielleitungKampagneKomplettAsync,
  loescheAlleLokalenAppDatenAsync,
  flushKampagneDatenEvents: htbahFlushKampagneDatenEvents,
  flushKampagneDatenEventsAsync: htbahFlushKampagneDatenEventsAsync,
  istSpeicherAktionAktiv() {
    return htbahFortschrittAktiv;
  },
  erstelleSpielleitungKampagneTeilExportPaket,
  erstelleSpielleitungKampagneTeilOhneMitgliederExportPaket,
  importiereSpielleitungKampagneTeilPaket,
  erstelleSpielleitungMitgliedExportPaket,
  importiereSpielleitungMitgliedPaket,
  erstelleSpielleitungAbenteuerbuchExportPaket,
  importiereSpielleitungAbenteuerbuchExportPaket,
  erstelleSpielleitungAtmosphaereExportPaket,
  importiereSpielleitungAtmosphaereExportPaket,
  erstelleSpielleitungZeitmessungExportPaket,
  importiereSpielleitungZeitmessungExportPaket,
  ladeKampagnenZeitmessungZustand,
  speichereKampagnenZeitmessungZustand,
  ladeKampagnenZeitmessungBadgePosition,
  speichereKampagnenZeitmessungBadgePosition,
  erstelleZufallstabellenKampagneExportPaket,
  importiereZufallstabellenKampagnePaket,
  erstelleZufallstabellenKategorieExportPaket,
  importiereZufallstabellenKategoriePaket,
  erstelleWeltenbauKampagneExportPaket,
  importiereWeltenbauKampagnePaket,
  erstelleWeltenbauBereichExportPaket,
  importiereWeltenbauBereichPaket,
  validiereKampagneDatenImportDatei,
  erstelleKampagneKomplettBackupBundle,
  erstelleKampagneKomplettOhneGruppeBackupBundle,
  importiereKampagneKomplettBackupBundle,
  wendeBeispielLokalerSpeicherPaketAdditivAn,
  wendeBeispielLokalerSpeicherPaketAlsNeueInstanzAn,
  wendeBeispielLokalerSpeicherPaketAlsNeueInstanzAsync,
  extrahiereKampagneLabelsAusLokalerSpeicherPaket,
  importierePantheonPaketInKampagne,
  ladeKampagnenAtmosphaereZustand,
  speichereKampagnenAtmosphaereZustand,
  ladeKampagnenAtmosphaereBadgePosition,
  speichereKampagnenAtmosphaereBadgePosition,
  ladeKampagnenKonfliktZustand,
  speichereKampagnenKonfliktZustand,
  bildbetrachter: bildbetrachterZustand,
  bildbetrachterOeffnen,
  bildbetrachterSchliessen,
  bildbetrachterSchliesseFuerWeltenbauEintrag,
  bildbetrachterNachVorne,
  ladeAppRolle,
  speichereAppRolle,
  ladeOrientierungModus,
  speichereOrientierungModus,
  bestimmeOrientierungsGruppe,
  ladeInteraktiveWeltStatsAnzeigen,
  speichereInteraktiveWeltStatsAnzeigen,
  speicher: htbahSpeicher,
  speicherKeys: HTBAH_SPEICHER_KEYS,
  loescheFloatingFabSpeicherKomplett,
  loescheOffeneModalsSpeicher() {
    const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
    if (S && typeof S.loescheAlle === 'function') {
      S.loescheAlle();
    }
    uiZustand.regelwerkOffen = false;
    uiZustand.abenteuerbuchOffen = false;
    uiZustand.zeichenModalOffen = false;
    uiZustand.weltenbauUebersichtModalOffen = false;
    uiZustand.weltenbauUebersichtModalGruppeId = '';
    window.dispatchEvent(new CustomEvent('htbah:offene-modals-speicher-geleert'));
  },
};

const uiApi = {
  _refs: {
    bestaetigenModal: null,
    hinweisModal: null,
    eingabeModal: null,
    fortschrittModal: null,
    toastHost: null,
  },
  setRefs(refs) {
    this._refs = {
      ...this._refs,
      ...(refs && typeof refs === 'object' ? refs : {}),
    };
  },
  bereinigeModalBackdrop() {
    const H = window.HTBAH_SHARED && window.HTBAH_SHARED.BootstrapModalHelper;
    if (H && typeof H.bereinigeBackdrop === 'function') {
      H.bereinigeBackdrop();
    }
  },
  confirm({
    titel = 'Bestätigen',
    beschreibung = '',
    bestaetigenText = 'Bestätigen',
    bestaetigenButtonClass = 'btn-primary',
    warnhinweisAnzeigen = false,
  } = {}) {
    const modal = this._refs.bestaetigenModal;
    if (!modal || typeof modal.oeffnen !== 'function') {
      return Promise.resolve(window.confirm(String(beschreibung || titel || 'Bestätigen?')));
    }
    return new Promise((resolve) => {
      modal.oeffnen({
        titel,
        beschreibung,
        bestaetigenText,
        bestaetigenButtonClass,
        warnhinweisAnzeigen,
        onBestaetigen: () => resolve(true),
        onAbbrechen: () => resolve(false),
      });
    });
  },
  async mitFortschritt({ titel = 'Bitte warten …', aufgabe } = {}) {
    const modal = this._refs.fortschrittModal;
    const reportLeer = () => {};
    if (typeof aufgabe !== 'function') {
      return undefined;
    }
    if (!modal || typeof modal.oeffnen !== 'function') {
      return aufgabe(reportLeer);
    }

    htbahFortschrittAktiv = true;
    htbahDiagLog('mitFortschritt', 'start', titel);
    if (HTBAH_DIAG_LOG && typeof HTBAH_DIAG_LOG.mark === 'function') {
      HTBAH_DIAG_LOG.mark('mitFortschritt');
    }

    this.bereinigeModalBackdrop();
    await htbahYieldAnMainThread();
    modal.oeffnen({ titel });
    await htbahYieldAnMainThread();

    let ergebnis;
    try {
      const report = (opts) => {
        if (typeof modal.setzeFortschritt === 'function') {
          modal.setzeFortschritt({
            prozent: opts && opts.prozent != null ? opts.prozent : 0,
            text: opts && opts.text ? opts.text : '',
          });
        }
      };
      ergebnis = await aufgabe(report);
      htbahDiagLog('mitFortschritt', 'aufgabe-fertig');
    } finally {
      try {
        if (typeof modal.schliessen === 'function') {
          const schliessenPromise = modal.schliessen({ minAnzeigeMs: 150 });
          if (schliessenPromise && typeof schliessenPromise.then === 'function') {
            await schliessenPromise;
          }
        } else if (typeof modal.warteAufGeschlossen === 'function') {
          await modal.warteAufGeschlossen();
        }
        this.bereinigeModalBackdrop();
        await htbahYieldAnMainThread();
        await htbahFlushKampagneDatenEventsAsync();
        htbahFortschrittAktiv = false;
        if (HTBAH_DIAG_LOG && typeof HTBAH_DIAG_LOG.measure === 'function') {
          HTBAH_DIAG_LOG.measure('mitFortschritt');
        }
        htbahDiagLog('mitFortschritt', 'fertig');
      } catch (schliessenFehler) {
        await htbahFlushKampagneDatenEventsAsync();
        htbahFortschrittAktiv = false;
        htbahDiagLog('mitFortschritt', 'schliessen-fehler', schliessenFehler);
        this.bereinigeModalBackdrop();
      }
    }
    return ergebnis;
  },
  alert({
    titel = 'Hinweis',
    beschreibung = '',
    bestaetigenText = 'OK',
    bestaetigenButtonClass = 'btn-primary',
  } = {}) {
    const modal = this._refs.hinweisModal;
    if (!modal || typeof modal.oeffnen !== 'function') {
      window.alert(String(beschreibung || titel || 'Hinweis'));
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      modal.oeffnen({
        titel,
        beschreibung,
        bestaetigenText,
        bestaetigenButtonClass,
        onBestaetigen: resolve,
      });
    });
  },
  prompt({
    titel = 'Eingabe',
    beschreibung = '',
    label = 'Eingabe',
    startwert = '',
    placeholder = '',
    bestaetigenText = 'Speichern',
    bestaetigenButtonClass = 'btn-primary',
    trim = false,
  } = {}) {
    const modal = this._refs.eingabeModal;
    if (!modal || typeof modal.oeffnen !== 'function') {
      const fallback = window.prompt(String(titel || 'Eingabe'), String(startwert || ''));
      if (fallback == null) {
        return Promise.resolve(null);
      }
      return Promise.resolve(trim ? fallback.trim() : fallback);
    }
    return new Promise((resolve) => {
      modal.oeffnen({
        titel,
        beschreibung,
        label,
        startwert,
        placeholder,
        bestaetigenText,
        bestaetigenButtonClass,
        onBestaetigen: (wert) => resolve(trim ? String(wert || '').trim() : String(wert || '')),
        onAbbrechen: () => resolve(null),
      });
    });
  },
  notify({ text, typ = 'success', dauerMs = 3200 } = {}) {
    const toastHost = this._refs.toastHost;
    if (!toastHost || typeof toastHost.notify !== 'function') {
      return null;
    }
    return toastHost.notify({ text, typ, dauerMs });
  },
};

window.HTBAH.ui = uiApi;

const routes = [
  { path: '/', component: window.HTBAH_SEITEN.Startseite },
  {
    path: '/charakter',
    redirect: () => charakterPfadMitStandardTab(window.HTBAH.ladeAktivenCharakterId()),
  },
  { path: '/charakter/neu', redirect: '/charakter/neu/session-zero' },
  { path: '/charakter/neu/session-zero', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/neu/aktives-spiel', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/neu/daten', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/neu/nachbereitung', redirect: '/charakter/neu/daten' },
  {
    path: '/charakter/:id',
    redirect: (to) => charakterPfadMitStandardTab(to.params.id),
  },
  { path: '/charakter/:id/session-zero', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/:id/aktives-spiel', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/:id/daten', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/:id/nachbereitung', redirect: (to) => `/charakter/${to.params.id}/daten` },
  { path: '/charakter-erstellung', redirect: '/charakter/neu' },
  { path: '/faehigkeiten-presets', component: window.HTBAH_SEITEN.PresetVerwaltung },
  { path: '/faehigkeiten-preset-bearbeiten', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/faehigkeiten-preset-bearbeiten/:id', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/einstellungen', component: window.HTBAH_SEITEN.Einstellungen },
  { path: '/kampagnen', component: window.HTBAH_SEITEN.KampagnenUebersicht },
  { path: '/kampagnen/:kampagneId', component: window.HTBAH_SEITEN.KampagneAnsicht },
  {
    path: '/kampagnen/:kampagneSlug',
    redirect: (to) => window.HTBAH.kampagnenEinstiegsPfadFuerSlug(to.params.kampagneSlug),
  },
  { path: '/kampagnen/:kampagneSlug/:tab', component: window.HTBAH_SEITEN.Weltenbau },
  { path: '/weltenbau', redirect: () => window.HTBAH.kampagnenPfad() },
  { path: '/weltenbau/:tab', redirect: (to) => window.HTBAH.kampagnenPfad(to.params.tab) },
  { path: '/spielleitung', redirect: '/kampagnen' },
  { path: '/spielleiter', redirect: '/kampagnen' },
  { path: '/kampagne/:kampagneSlug/:tab', redirect: (to) => `/kampagnen/${to.params.kampagneSlug}/${to.params.tab}` },
  {
    path: '/kampagne/:kampagneSlug',
    redirect: (to) => window.HTBAH.kampagnenEinstiegsPfadFuerSlug(to.params.kampagneSlug),
  },
  { path: '/create', redirect: '/charakter/neu' },
  { path: '/presets', redirect: '/faehigkeiten-presets' },
  { path: '/presets/form', redirect: '/faehigkeiten-preset-bearbeiten' },
  {
    path: '/presets/form/:id',
    redirect: (to) => `/faehigkeiten-preset-bearbeiten/${encodeURIComponent(to.params.id || '')}`,
  },
  { path: '/preset-verwaltung', redirect: '/faehigkeiten-presets' },
  { path: '/preset-bearbeiten', redirect: '/faehigkeiten-preset-bearbeiten' },
  {
    path: '/preset-bearbeiten/:id',
    redirect: (to) => `/faehigkeiten-preset-bearbeiten/${encodeURIComponent(to.params.id || '')}`,
  },
  { path: '/settings', redirect: '/einstellungen' },
  { path: '/gm', redirect: '/kampagnen' },
  {
    path: '/nicht-gefunden',
    name: 'nicht-gefunden',
    component: window.HTBAH_SEITEN.NichtGefunden,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => ({
      path: '/nicht-gefunden',
      query: {
        ...to.query,
        grund: typeof to.query.grund === 'string' ? to.query.grund : 'route',
        von: to.path,
      },
    }),
  },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (window.matchMedia('(min-width: 992px)').matches) {
      const app = document.getElementById('app');
      if (app) {
        app.scrollTo({ top: 0, left: 0 });
      }
      return false;
    }
    return { top: 0, left: 0 };
  },
});

function istNurCharakterRoute(pfad) {
  if (pfad === '/charakter' || pfad === '/charakter/neu' || pfad.startsWith('/charakter/neu/')) {
    return true;
  }
  return /^\/charakter\/[^/]+(?:\/[^/]+)?$/.test(pfad);
}

function istNurSpielleitungRoute(pfad) {
  if (pfad === '/kampagnen' || pfad === '/spielleitung' || pfad === '/spielleiter' || pfad === '/weltenbau') {
    return true;
  }
  if (pfad.startsWith('/weltenbau/')) {
    return true;
  }
  if (
    pfad.startsWith('/kampagnen/') ||
    pfad.startsWith('/kampagne/') ||
    pfad.startsWith('/spielleitung/') ||
    pfad.startsWith('/spielleiter/')
  ) {
    return true;
  }
  if (pfad === '/faehigkeiten-presets' || pfad === '/faehigkeiten-preset-bearbeiten') {
    return true;
  }
  if (/^\/faehigkeiten-preset-bearbeiten\/[^/]+$/.test(pfad)) {
    return true;
  }
  return false;
}

function istWeltenbauRoutePfad(pfad) {
  const p = typeof pfad === 'string' ? pfad : '';
  return (
    p === '/weltenbau' ||
    p.startsWith('/weltenbau/') ||
    /^\/kampagnen\/[^/]+\/(?:welt|zufallstabellen|assets|generatoren|einstellungen|gruppe)$/.test(p) ||
    /^\/kampagne\/[^/]+\/(?:welt|zufallstabellen|assets|generatoren|einstellungen|gruppe)$/.test(p)
  );
}

router.beforeEach(async (to, from) => {
  const rolle = window.HTBAH.ladeAppRolle();
  const ziel = to.path || '/';
  const legacyTabMatch = ziel.match(/^\/kampagnen\/([^/]+)\/generatoren$/);
  if (legacyTabMatch && legacyTabMatch[1]) {
    return { path: `/kampagnen/${legacyTabMatch[1]}/assets`, replace: true };
  }
  const legacyTabMatchSingular = ziel.match(/^\/kampagne\/([^/]+)\/generatoren$/);
  if (legacyTabMatchSingular && legacyTabMatchSingular[1]) {
    return { path: `/kampagne/${legacyTabMatchSingular[1]}/assets`, replace: true };
  }

  const weltenbauModal = window.HTBAH._weltenbauUebersichtModalInstanz;
  if (
    weltenbauModal &&
    weltenbauModal.offen &&
    !istWeltenbauRoutePfad(ziel) &&
    typeof weltenbauModal.bestaetigeVerlassenMitUngespeichert === 'function'
  ) {
    const darfVerlassen = await weltenbauModal.bestaetigeVerlassenMitUngespeichert();
    if (!darfVerlassen) {
      return false;
    }
    weltenbauModal.schliesseAlleBearbeitungsModalsOhnePruefung();
    weltenbauModal.$emit('schliessen');
  }

  if (ziel === '/' || ziel === '/nicht-gefunden') {
    return true;
  }

  if (!rolle) {
    return { path: '/' };
  }

  if (rolle === 'charakter' && istNurSpielleitungRoute(ziel)) {
    return { path: charakterPfadMitStandardTab(window.HTBAH.ladeAktivenCharakterId()) };
  }

  if (rolle === 'spielleitung' && istNurCharakterRoute(ziel)) {
    return { path: '/kampagnen' };
  }

  if (/^\/charakter\/[^/]+(?:\/[^/]+)?$/.test(ziel) && !ziel.startsWith('/charakter/neu')) {
    const charakterId = to.params && typeof to.params.id === 'string' ? to.params.id : '';
    if (charakterId) {
      const eintrag = window.HTBAH.ladeCharakterEintrag(charakterId);
      if (!eintrag) {
        return {
          name: 'nicht-gefunden',
          query: { grund: 'charakter', id: charakterId },
        };
      }
      window.HTBAH.setzeAktivenCharakterId(charakterId);
    }
  }

  return true;
});

const uiZustand = Vue.reactive({
  regelwerkOffen: false,
  abenteuerbuchOffen: false,
  zeichenModalOffen: false,
  weltenbauUebersichtModalOffen: false,
  weltenbauUebersichtModalGruppeId: '',
});

(function stelleUiZustandOffeneModalsWiederHer() {
  const S = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.speicher;
  if (!S) {
    return;
  }
  const I = S.MODAL_IDS;
  if (S.istOffenGespeichert(I.regelwerk)) {
    uiZustand.regelwerkOffen = true;
  }
  if (S.istOffenGespeichert(I.abenteuerbuch)) {
    uiZustand.abenteuerbuchOffen = true;
  }
  if (S.istOffenGespeichert(I.zeichen)) {
    uiZustand.zeichenModalOffen = true;
  }
  const wb = S.lade(I.weltenbau);
  if (wb && wb.offen && wb.gruppeId) {
    uiZustand.weltenbauUebersichtModalGruppeId = wb.gruppeId;
    uiZustand.weltenbauUebersichtModalOffen = true;
  }
})();

const lebenspunkteStatus = Vue.reactive({
  tot: false,
  bewusstlos: false,
});

const HTBAH_KAMPF_ZUSTAENDE = ['vital', 'bewusstlos', 'tot'];

function normalisiereKampfZustand(wert) {
  const z = typeof wert === 'string' ? wert.trim().toLowerCase() : '';
  return HTBAH_KAMPF_ZUSTAENDE.includes(z) ? z : '';
}

function parseLebenspunkteZahl(wert) {
  const n = Math.round(Number(String(wert ?? '').trim()) || 0);
  return Math.max(0, Number.isFinite(n) ? n : 0);
}

function berechneKampfZustandAusLp(aktuell, vorher) {
  const lp = parseLebenspunkteZahl(aktuell);
  const prev = parseLebenspunkteZahl(vorher);
  if (lp === 0) {
    return 'tot';
  }
  const verlust = prev - lp;
  if ((lp >= 1 && lp <= 10) || verlust >= 60) {
    return 'bewusstlos';
  }
  return 'vital';
}

function ermittleKampfZustandFuerNpcBestie(zeile) {
  if (!zeile || typeof zeile !== 'object') {
    return 'vital';
  }
  const explizit = normalisiereKampfZustand(zeile.kampfZustand);
  if (explizit) {
    return explizit;
  }
  const lp = parseLebenspunkteZahl(zeile.lebenspunkte);
  if (lp === 0) {
    return 'tot';
  }
  if (Boolean(zeile.lpMassenschadenBewusstlos) && lp > 10) {
    return 'bewusstlos';
  }
  if (lp >= 1 && lp <= 10 && !Boolean(zeile.lpBewusstlosAusgeblendet)) {
    return 'bewusstlos';
  }
  return berechneKampfZustandAusLp(lp, lp);
}

function ermittleKampfZustandFuerCharakter(charakter) {
  if (!charakter || typeof charakter !== 'object') {
    return 'vital';
  }
  const explizit = normalisiereKampfZustand(charakter.kampfZustand);
  if (explizit) {
    return explizit;
  }
  const lp = parseLebenspunkteZahl(charakter.lebenspunkte);
  if (lp === 0) {
    return 'tot';
  }
  if (Boolean(charakter.lpMassenschadenBewusstlos) && lp > 10) {
    return 'bewusstlos';
  }
  if (lp >= 1 && lp <= 10 && !Boolean(charakter.lpBewusstlosAusgeblendet)) {
    return 'bewusstlos';
  }
  return 'vital';
}

function syncCharakterLegacyAusKampfZustand(charakter) {
  if (!charakter || typeof charakter !== 'object') {
    return;
  }
  const kz = normalisiereKampfZustand(charakter.kampfZustand) || 'vital';
  charakter.kampfZustand = kz;
  charakter.lpStatusTot = kz === 'tot';
  if (kz === 'vital') {
    charakter.lpMassenschadenBewusstlos = false;
    return;
  }
  if (kz === 'tot') {
    charakter.lpMassenschadenBewusstlos = false;
    return;
  }
  const lp = parseLebenspunkteZahl(charakter.lebenspunkte);
  charakter.lpBewusstlosAusgeblendet = false;
  charakter.lpMassenschadenBewusstlos = lp > 10;
}

function initialisiereCharakterKampfZustand(charakter) {
  if (!charakter || typeof charakter !== 'object') {
    return;
  }
  const gespeichert = normalisiereKampfZustand(charakter.kampfZustand);
  if (gespeichert) {
    charakter.kampfZustand = gespeichert;
    syncCharakterLegacyAusKampfZustand(charakter);
    return;
  }
  charakter.kampfZustand = ermittleKampfZustandFuerCharakter(charakter);
  syncCharakterLegacyAusKampfZustand(charakter);
}

function aktualisiereCharakterKampfZustandAusLp(charakter, vorher, nach) {
  if (!charakter || typeof charakter !== 'object') {
    return;
  }
  let n = parseLebenspunkteZahl(nach);
  const v = parseLebenspunkteZahl(vorher);
  if (n !== charakter.lebenspunkte) {
    charakter.lebenspunkte = n;
  }
  charakter.kampfZustand = berechneKampfZustandAusLp(n, v);
  if (n === 0) {
    charakter.lpStatusTot = true;
    charakter.lpMassenschadenBewusstlos = false;
    return;
  }
  charakter.lpStatusTot = false;
  const verlust = v - n;
  if (verlust >= 60) {
    charakter.lpMassenschadenBewusstlos = true;
  }
  if (v > 10 && n >= 1 && n <= 10) {
    charakter.lpBewusstlosAusgeblendet = false;
  }
  if (verlust >= 60) {
    charakter.lpBewusstlosAusgeblendet = false;
  }
  if (n < v && n >= 1 && n <= 10 && v >= 1 && v <= 10) {
    charakter.lpBewusstlosAusgeblendet = false;
  }
}

function setzeCharakterKampfZustand(charakter, zustand) {
  const kz = normalisiereKampfZustand(zustand);
  if (!kz || !charakter || typeof charakter !== 'object') {
    return;
  }
  charakter.kampfZustand = kz;
  syncCharakterLegacyAusKampfZustand(charakter);
}

function berechneLebenspunkteStatus(charakter) {
  if (!charakter || typeof charakter !== 'object') {
    return { tot: false, bewusstlos: false };
  }
  const kampfZustand = normalisiereKampfZustand(charakter.kampfZustand);
  if (kampfZustand) {
    return {
      tot: kampfZustand === 'tot',
      bewusstlos: kampfZustand === 'bewusstlos',
    };
  }
  const lp = parseLebenspunkteZahl(charakter.lebenspunkte);
  const tot = lp === 0;
  const ausgeblendet = Boolean(charakter.lpBewusstlosAusgeblendet);
  const massenschaden = Boolean(charakter.lpMassenschadenBewusstlos);
  const bewusstlosTypisch = lp >= 1 && lp <= 10;
  const bewusstlosMassenschaden = massenschaden && lp > 10;
  return {
    tot,
    bewusstlos: !tot && !ausgeblendet && (bewusstlosTypisch || bewusstlosMassenschaden),
  };
}

function syncLebenspunkteStatusFromCharakter(charakter) {
  const status = berechneLebenspunkteStatus(charakter);
  lebenspunkteStatus.tot = status.tot;
  lebenspunkteStatus.bewusstlos = status.bewusstlos;
}

window.HTBAH.lebenspunkteStatus = lebenspunkteStatus;
window.HTBAH.berechneLebenspunkteStatus = berechneLebenspunkteStatus;
window.HTBAH.berechneKampfZustandAusLp = berechneKampfZustandAusLp;
window.HTBAH.normalisiereKampfZustand = normalisiereKampfZustand;
window.HTBAH.ermittleKampfZustandFuerNpcBestie = ermittleKampfZustandFuerNpcBestie;
window.HTBAH.ermittleKampfZustandFuerCharakter = ermittleKampfZustandFuerCharakter;
window.HTBAH.initialisiereCharakterKampfZustand = initialisiereCharakterKampfZustand;
window.HTBAH.aktualisiereCharakterKampfZustandAusLp = aktualisiereCharakterKampfZustandAusLp;
window.HTBAH.setzeCharakterKampfZustand = setzeCharakterKampfZustand;
window.HTBAH.syncLebenspunkteStatusFromCharakter = syncLebenspunkteStatusFromCharakter;
window.HTBAH.schliesseGlobaleInteraktiveWeltModal = function schliesseGlobaleInteraktiveWeltModal() {
  uiZustand.weltenbauUebersichtModalOffen = false;
  uiZustand.weltenbauUebersichtModalGruppeId = '';
};

window.HTBAH.oeffneInteraktiveWeltModal = function oeffneInteraktiveWeltModal(payload) {
  const kampagneId = typeof payload?.kampagneId === 'string' ? payload.kampagneId.trim() : '';
  const entityType = typeof payload?.entityType === 'string' ? payload.entityType.trim() : '';
  const entityId = typeof payload?.entityId === 'string' ? payload.entityId.trim() : '';
  if (!kampagneId || !entityType || !entityId) {
    return false;
  }
  uiZustand.weltenbauUebersichtModalGruppeId = kampagneId;
  uiZustand.weltenbauUebersichtModalOffen = true;
  const openMode =
    typeof payload?.openMode === 'string' && payload.openMode.trim().toLowerCase() === 'open'
      ? 'open'
      : 'focus';
  Vue.nextTick(() => {
    window.dispatchEvent(
      new CustomEvent('htbah:open-entity-request', {
        detail: { entityType, entityId, kampagneId, openMode },
      }),
    );
  });
  return true;
};

const app = Vue.createApp({
  data() {
    return {
      uiZustand,
    };
  },
  created() {
    syncLebenspunkteStatusFromCharakter(window.HTBAH.ladeCharakter());
  },
  mounted() {
    window.HTBAH.ui.setRefs({
      bestaetigenModal: this.$refs.globalBestaetigenModal || null,
      hinweisModal: this.$refs.globalHinweisModal || null,
      eingabeModal: this.$refs.globalEingabeModal || null,
      fortschrittModal: this.$refs.globalFortschrittModal || null,
      toastHost: this.$refs.globalToastHost || null,
    });
    const dispatch = window.HTBAH_SHARED && window.HTBAH_SHARED.EntityOpenDispatch;
    if (dispatch && typeof dispatch.install === 'function') {
      this._entityOpenDispatchCleanup = dispatch.install(this.$router);
    }
  },
  beforeUnmount() {
    if (typeof this._entityOpenDispatchCleanup === 'function') {
      this._entityOpenDispatchCleanup();
      this._entityOpenDispatchCleanup = null;
    }
  },
  template: `
    <lebenspunkte-status-banner />
    <weltenbau-uebersicht-modal
      :offen="uiZustand.weltenbauUebersichtModalOffen"
      :gruppe-id="uiZustand.weltenbauUebersichtModalGruppeId"
      @schliessen="uiZustand.weltenbauUebersichtModalOffen = false" />
    <router-view></router-view>
    <bestaetigen-modal ref="globalBestaetigenModal" modal-id="htbahGlobalBestaetigenModal" />
    <hinweis-modal ref="globalHinweisModal" />
    <eingabe-modal ref="globalEingabeModal" />
    <fortschritt-modal ref="globalFortschrittModal" modal-id="htbahGlobalFortschrittModal" />
    <ui-toast-host ref="globalToastHost" />
    <lokaler-speicher-hinweis-modal />
    <entwicklungshinweis-modal />
    <regelwerk-modal :ui-zustand="uiZustand"></regelwerk-modal>
    <abenteuerbuch-modal :ui-zustand="uiZustand"></abenteuerbuch-modal>
    <zeichen-modal :ui-zustand="uiZustand"></zeichen-modal>
    <bildbetrachter-host />
    <bottom-nav :ui-zustand="uiZustand"></bottom-nav>
    <modal-minimize-dock />
  `,
});

app.use(router);
router.afterEach((to) => {
  const kampagnenKid = kampagneIdAusPfad(to.path);
  if (kampagnenKid) {
    wendeEffektivesThemeAn(kampagnenKid);
  } else if (!to.path.startsWith('/kampagnen/') || to.path === '/kampagnen') {
    wendeGlobalesThemeAn();
  }
  if (to.path.startsWith('/kampagnen/')) {
    const parts = to.path.split('/').filter(Boolean);
    if (
      parts.length >= 3 &&
      parts[0] === 'kampagnen' &&
      (KAMPAGNEN_TAB_IDS.has(parts[2]) || KAMPAGNEN_TAB_LEGACY_IDS.has(parts[2]))
    ) {
      const kid = kampagneIdAusSlug(parts[1]);
      if (kid) {
        speichereKampagnenTab(kid, normalisiereKampagnenTabId(parts[2]));
      }
    }
    return;
  }
  if (to.path === '/nicht-gefunden') {
    syncLebenspunkteStatusFromCharakter(null);
    return;
  }
  if (to.path === '/') {
    syncLebenspunkteStatusFromCharakter(null);
    return;
  }
  if (to.path.startsWith('/charakter/neu')) {
    syncLebenspunkteStatusFromCharakter(null);
    return;
  }
  const charakterId = to.params && typeof to.params.id === 'string' ? to.params.id : null;
  syncLebenspunkteStatusFromCharakter(window.HTBAH.ladeCharakter(charakterId));
});
app.component('regelwerk-modal', window.HTBAH_KOMPONENTEN.RegelwerkModal);
app.component('abenteuerbuch-modal', window.HTBAH_KOMPONENTEN.AbenteuerbuchModal);
app.component('zeichen-modal', window.HTBAH_KOMPONENTEN.ZeichenModal);
app.component('sicherheitsmechanismen-modal', window.HTBAH_KOMPONENTEN.SicherheitsmechanismenModal);
app.component(
  'lokaler-speicher-hinweis-modal',
  window.HTBAH_KOMPONENTEN.LokalerSpeicherHinweisModal,
);
app.component(
  'entwicklungshinweis-modal',
  window.HTBAH_KOMPONENTEN.EntwicklungshinweisModal,
);
app.component('bottom-nav', window.HTBAH_KOMPONENTEN.BottomNav);
app.component('modal-minimize-dock', window.HTBAH_KOMPONENTEN.ModalMinimizeDock);
app.component('bestaetigen-modal', window.HTBAH_KOMPONENTEN.BestaetigenModal);
app.component('hinweis-modal', window.HTBAH_KOMPONENTEN.HinweisModal);
app.component('eingabe-modal', window.HTBAH_KOMPONENTEN.EingabeModal);
app.component('fortschritt-modal', window.HTBAH_KOMPONENTEN.FortschrittModal);
app.component('ui-toast-host', window.HTBAH_KOMPONENTEN.UiToastHost);
app.component('lebenspunkte-status-banner', window.HTBAH_KOMPONENTEN.LebenspunkteStatusBanner);
app.component('icon-text-button', window.HTBAH_KOMPONENTEN.IconTextButton);
app.component(
  'einstellungen-sektion',
  window.HTBAH_KOMPONENTEN.EinstellungenSektion,
);
app.component('weltenbau-uebersicht-modal', window.HTBAH_KOMPONENTEN.WeltenbauUebersichtModal);
app.component(
  'kampagnen-labels-editor',
  window.HTBAH_KOMPONENTEN.KampagnenLabelsEditor,
);
app.component(
  'kampagnen-labels-verwaltung',
  window.HTBAH_KOMPONENTEN.KampagnenLabelsVerwaltung,
);
app.component(
  'effekt-rahmen-verwaltung',
  window.HTBAH_KOMPONENTEN.EffektRahmenVerwaltung,
);
app.component(
  'tokens-effekte-editor-modal',
  window.HTBAH_KOMPONENTEN.TokensEffekteEditorModal,
);
app.component(
  'kampagne-einstellungen',
  window.HTBAH_KOMPONENTEN.KampagneEinstellungen,
);
app.component('bildbetrachter-host', window.HTBAH_KOMPONENTEN.BildbetrachterHost);
app.mount('#app');
if (HTBAH_ORIENTIERUNG && typeof HTBAH_ORIENTIERUNG.initialisiereListener === 'function') {
  HTBAH_ORIENTIERUNG.initialisiereListener();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
