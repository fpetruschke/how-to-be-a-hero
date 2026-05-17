const SPEICHER_KEY_APP_ROLLE = 'htbah_app_rolle';
const SPEICHER_KEY_CHARAKTER_LEGACY = 'htbah_character';
const SPEICHER_KEY_CHARAKTER = 'htbah_characters';
const SPEICHER_KEY_AKTIVER_CHARAKTER = 'htbah_active_character_id';
const SPEICHER_KEY_PRESETS = 'htbah_presets';
const SPEICHER_KEY_THEME = 'htbah_theme';
const SPEICHER_KEY_CHARAKTER_BILD_LEGACY = 'htbah_character_image';
const SPEICHER_KEY_SPIELLEITER = 'htbah_spielleiter_kampagnen';
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
const SPEICHER_KEY_ZEICHEN_MODAL = 'htbah_zeichen_brett';
const SPEICHER_KEY_MENTION_NAV_TARGET = 'htbah_mention_nav_target';
const SPEICHER_KEY_ORIENTATION_MODE = 'htbah_orientation_mode';
const SPEICHER_KEY_INTERAKTIVE_WELT_STATS_ANZEIGEN = 'htbah_interaktive_welt_stats_anzeigen';

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

function normalisiereSpielleiterMitglied(m) {
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

function normalisiereSpielleiterKampagne(g) {
  if (!g || typeof g !== 'object') {
    return null;
  }
  const mitglieder = Array.isArray(g.mitglieder)
    ? g.mitglieder.map(normalisiereSpielleiterMitglied).filter(Boolean)
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
  const labels = KL ? KL.normalisiereKampagneLabels(g.labels) : [];
  return {
    id: typeof g.id === 'string' && g.id ? g.id : neueEntropieId(),
    name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : 'Kampagne',
    mitglieder,
    labels,
    abenteuerbuch,
    atmosphaere,
    atmosphaereBadgePos,
    zeitmessung,
    zeitmessungBadgePos,
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
  const sl = ladeSpielleiterZustand();
  const idx = (Array.isArray(sl.kampagnen) ? sl.kampagnen : []).findIndex((k) => k && k.id === kid);
  if (idx < 0) {
    return false;
  }
  const kampagnen = sl.kampagnen.slice();
  kampagnen[idx] = { ...kampagnen[idx], labels: normLabels };
  sl.kampagnen = kampagnen;
  speichereSpielleiterZustand(sl);
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
  const sl = ladeSpielleiterZustand();
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

function ladeSpielleiterZustand() {
  const roh = htbahSpeicher.leseJson(SPEICHER_KEY_SPIELLEITER, null);
  if (!roh || typeof roh !== 'object') {
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
  const kampagnen = Array.isArray(roh.kampagnen)
    ? roh.kampagnen.map(normalisiereSpielleiterKampagne).filter(Boolean)
    : [];
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

function htbahDispatchKampagneDatenGeaendert(detail) {
  try {
    window.dispatchEvent(new CustomEvent('htbah:kampagne-daten-geaendert', { detail }));
  } catch {
    /* ignorieren */
  }
}

function speichereSpielleiterZustand(zustand) {
  htbahSpeicher.schreibeJson(SPEICHER_KEY_SPIELLEITER, zustand);
  const kid =
    zustand && typeof zustand.aktiveKampagneId === 'string' && zustand.aktiveKampagneId.trim()
      ? zustand.aktiveKampagneId.trim()
      : null;
  htbahDispatchKampagneDatenGeaendert({ art: 'spielleiter', kampagneId: kid });
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

function kampagnenPfad(tab = 'gruppe', kampagneId = null) {
  const erlaubt = new Set(['gruppe', 'welt', 'zufallstabellen', 'generatoren']);
  const zielTab = erlaubt.has(tab) ? tab : 'gruppe';
  const zustand = ladeSpielleiterZustand();
  const kampagnen = Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
  if (!kampagnen.length) {
    return '/spielleiter';
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
    return '/spielleiter';
  }
  return `/kampagne/${encodeURIComponent(kampagnenSlugAusName(aktive.name))}/${zielTab}`;
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

function normalisiereZufallstabellenNpcZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const handeln = Math.max(0, Math.min(40, Math.round(Number(z.handeln) || 0)));
  const wissen = Math.max(0, Math.min(40, Math.round(Number(z.wissen) || 0)));
  const soziales = Math.max(0, Math.min(40, Math.round(Number(z.soziales) || 0)));
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  const schadenswertNahkampf =
    typeof z.schadenswertNahkampf === 'string' ? z.schadenswertNahkampf : '';
  const schadenswertFernkampf =
    typeof z.schadenswertFernkampf === 'string' ? z.schadenswertFernkampf : '';
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
    geheimnis: typeof z.geheimnis === 'string' ? z.geheimnis : '',
    stimme: typeof z.stimme === 'string' ? z.stimme : '',
    waffe: typeof z.waffe === 'string' ? z.waffe : '',
    lebenspunkte: typeof z.lebenspunkte === 'string' ? z.lebenspunkte : '',
    kampfZustand: ermittleKampfZustandFuerNpcBestie(z),
    schadenswertNahkampf,
    schadenswertFernkampf,
    waffenloserKampf: typeof z.waffenloserKampf === 'string' ? z.waffenloserKampf : '',
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    handeln,
    wissen,
    soziales,
    fraktion: typeof z.fraktion === 'string' ? z.fraktion : '',
    glaube: typeof z.glaube === 'string' ? z.glaube : '',
    initiative: typeof z.initiative === 'string' ? z.initiative : '',
    inventar: normalisiereZufallstabellenInventarListe(z.inventar),
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
  };
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
  };
}

function normalisiereZufallstabellenGegenstandZeile(z) {
  if (!z || typeof z !== 'object') {
    return null;
  }
  const schadenswertNahkampf =
    typeof z.schadenswertNahkampf === 'string' ? z.schadenswertNahkampf : '';
  const schadenswertFernkampf =
    typeof z.schadenswertFernkampf === 'string' ? z.schadenswertFernkampf : '';
  const medien = normalisiereZufallstabellenMedienListe(z.medien);
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    name: typeof z.name === 'string' ? z.name : '',
    beschreibungHtml: typeof z.beschreibungHtml === 'string' ? z.beschreibungHtml : '',
    istWaffe: !!z.istWaffe,
    schadenswertNahkampf,
    schadenswertFernkampf,
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    inGegenstandId: typeof z.inGegenstandId === 'string' ? z.inGegenstandId.trim() : '',
    besitzerTyp: typeof z.besitzerTyp === 'string' ? z.besitzerTyp.trim() : '',
    besitzerId: typeof z.besitzerId === 'string' ? z.besitzerId.trim() : '',
    initiative: typeof z.initiative === 'string' ? z.initiative : '',
    fraktionen: Array.isArray(z.fraktionen)
      ? z.fraktionen.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean)
      : [],
    lpBewusstlosAusgeblendet: Boolean(z.lpBewusstlosAusgeblendet),
    lpMassenschadenBewusstlos: Boolean(z.lpMassenschadenBewusstlos),
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
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
  const handeln = Math.max(0, Math.min(40, Math.round(Number(z.handeln) || 0)));
  const wissen = Math.max(0, Math.min(40, Math.round(Number(z.wissen) || 0)));
  const soziales = Math.max(0, Math.min(40, Math.round(Number(z.soziales) || 0)));
  const schadenswertNahkampf =
    typeof z.schadenswertNahkampf === 'string' ? z.schadenswertNahkampf : '';
  const schadenswertFernkampf =
    typeof z.schadenswertFernkampf === 'string' ? z.schadenswertFernkampf : '';
  return {
    id: typeof z.id === 'string' && z.id ? z.id : neueEntropieId(),
    epoche,
    kategorie,
    name: typeof z.name === 'string' ? z.name : '',
    waffe: typeof z.waffe === 'string' ? z.waffe : '',
    angriff: typeof z.angriff === 'string' ? z.angriff : '',
    verteidigung: typeof z.verteidigung === 'string' ? z.verteidigung : '',
    lebenspunkte: typeof z.lebenspunkte === 'string' ? z.lebenspunkte : '',
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    handeln,
    wissen,
    soziales,
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
    schadenswertNahkampf,
    schadenswertFernkampf,
    inventar: normalisiereZufallstabellenInventarListe(z.inventar),
    medien: normalisiereZufallstabellenMedienListe(z.medien),
  };
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
  const z = ladeSpielleiterZustand();
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
 * @param {'alles' | 'galerie' | 'interaktive_welt' | 'interaktive_welt_einstellungen' | 'generatoren'} bereich
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
  } else if (bereich === 'generatoren') {
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

function loescheSpielleiterKampagneKomplett(kampagneId) {
  const gid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!gid) {
    return { ok: false, grund: 'Keine Kampagne.' };
  }
  const zustand = ladeSpielleiterZustand();
  const kampagnen = Array.isArray(zustand.kampagnen) ? zustand.kampagnen : [];
  if (!kampagnen.some((k) => k && k.id === gid)) {
    return { ok: false, grund: 'Kampagne nicht gefunden.' };
  }
  loescheZufallstabellenUndWeltenbauFuerKampagne(gid);
  htbahDispatchKampagneDatenGeaendert({ art: 'zufallstabellen', kampagneId: gid });
  htbahDispatchKampagneDatenGeaendert({ art: 'weltenbau', kampagneId: gid });
  zustand.kampagnen = kampagnen.filter((x) => !x || x.id !== gid);
  if (!zustand.mitgliedWahlProKampagne || typeof zustand.mitgliedWahlProKampagne !== 'object') {
    zustand.mitgliedWahlProKampagne = {};
  }
  delete zustand.mitgliedWahlProKampagne[gid];
  if (zustand.aktiveKampagneId === gid) {
    zustand.aktiveKampagneId = zustand.kampagnen[0] ? zustand.kampagnen[0].id : null;
  }
  speichereSpielleiterZustand(zustand);
  return { ok: true };
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
  const zustand = ladeSpielleiterZustand();
  const kampagne = findeKampagneById(zustand, kampagneId);
  if (!kampagne) {
    return false;
  }
  mutator(kampagne);
  speichereSpielleiterZustand(zustand);
  return true;
}

function ladeKampagnenAtmosphaereZustand(kampagneId) {
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kampagneId);
  return normalisiereAtmosphaereZustand(kampagne && kampagne.atmosphaere);
}

function speichereKampagnenAtmosphaereZustand(kampagneId, zustand) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.atmosphaere = normalisiereAtmosphaereZustand(zustand);
  });
}

function ladeKampagnenAtmosphaereBadgePosition(kampagneId) {
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kampagneId);
  return normalisiereAtmosphaereBadgePosition(kampagne && kampagne.atmosphaereBadgePos);
}

function speichereKampagnenAtmosphaereBadgePosition(kampagneId, pos) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.atmosphaereBadgePos = normalisiereAtmosphaereBadgePosition(pos);
  });
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
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kid);
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
      : { modus: 'timer', status: 'bereit', eingabeH: 0, eingabeM: 5, eingabeS: 0 };
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kampagneId);
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
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kid);
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
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kampagneId);
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

const EXPORT_TYP_SPIELLEITER_KAMPAGNE_TEIL = 'htbah-spielleiter-kampagne-teil';
const EXPORT_TYP_ZUFALLSTABELLEN_KAMPAGNE = 'htbah-zufallstabellen-kampagne';
const EXPORT_TYP_ZUFALLSTABELLEN_KATEGORIE = 'htbah-zufallstabellen-kategorie';
const EXPORT_TYP_WELTENBAU_KAMPAGNE = 'htbah-weltenbau-kampagne';
const EXPORT_TYP_WELTENBAU_BEREICH = 'htbah-weltenbau-bereich';
const EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_BUNDLE = 'htbah-export-ls-kampagne-komplett-bundle';
const EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE = 'htbah-export-ls-kampagne-komplett-ohne-gruppe';
const EXPORT_TYP_SL_MITGLIED = 'htbah-spielleiter-mitglied';
const EXPORT_TYP_SL_ABENTEUERBUCH = 'htbah-spielleiter-abenteuerbuch-teil';
const EXPORT_TYP_SL_ATMOSPHAERE = 'htbah-spielleiter-atmosphaere-teil';
const EXPORT_TYP_SL_ZEITMESSUNG = 'htbah-spielleiter-zeitmessung-teil';

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

function spielleiterKampagneIndexNachId(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return -1;
  }
  const sl = ladeSpielleiterZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen : [];
  return kampagnen.findIndex((g) => g && g.id === kid);
}

function erstelleSpielleiterKampagneTeilExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return null;
  }
  const sl = ladeSpielleiterZustand();
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
    typ: EXPORT_TYP_SPIELLEITER_KAMPAGNE_TEIL,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    kampagne: JSON.parse(JSON.stringify(g)),
    mitgliedWahlMitgliedId,
  };
}

function erstelleSpielleiterKampagneTeilOhneMitgliederExportPaket(kampagneId) {
  const pak = erstelleSpielleiterKampagneTeilExportPaket(kampagneId);
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

function importiereSpielleiterKampagneTeilPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || roh.typ !== EXPORT_TYP_SPIELLEITER_KAMPAGNE_TEIL) {
    return { ok: false, fehler: 'Ungültige Datei (Spielleiter-Kampagne erwartet).' };
  }
  const idx = spielleiterKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const sl = ladeSpielleiterZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  const merged = normalisiereSpielleiterKampagne({
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
  speichereSpielleiterZustand(sl);
  if (merged.labels && merged.labels.length) {
    importiereKampagnenLabelsInGlobalenKatalog(merged.labels);
  }
  return { ok: true };
}

function erstelleSpielleiterMitgliedExportPaket(kampagneId, mitgliedId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  const mid = typeof mitgliedId === 'string' && mitgliedId.trim() ? mitgliedId.trim() : '';
  if (!kid || !mid) {
    return null;
  }
  const sl = ladeSpielleiterZustand();
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

function importiereSpielleiterMitgliedPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    roh.typ !== EXPORT_TYP_SL_MITGLIED ||
    !roh.mitglied
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Gruppen-Charakter erwartet).' };
  }
  const idx = spielleiterKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const merged = normalisiereSpielleiterMitglied(roh.mitglied);
  if (!merged) {
    return { ok: false, fehler: 'Charakterdaten ungültig.' };
  }
  const sl = ladeSpielleiterZustand();
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
  speichereSpielleiterZustand(sl);
  return { ok: true };
}

function erstelleSpielleiterAbenteuerbuchExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
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

function importiereSpielleiterAbenteuerbuchPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    roh.typ !== EXPORT_TYP_SL_ABENTEUERBUCH
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Abenteuerbuch erwartet).' };
  }
  if (spielleiterKampagneIndexNachId(ziel) < 0) {
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

function erstelleSpielleiterAtmosphaereExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const sl = ladeSpielleiterZustand();
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

function importiereSpielleiterAtmosphaerePaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    roh.typ !== EXPORT_TYP_SL_ATMOSPHAERE
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Wetter/Tageszeit erwartet).' };
  }
  const idx = spielleiterKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const sl = ladeSpielleiterZustand();
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
  speichereSpielleiterZustand(sl);
  return { ok: true };
}

function erstelleSpielleiterZeitmessungExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const sl = ladeSpielleiterZustand();
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

function importiereSpielleiterZeitmessungPaket(zielKampagneId, roh) {
  const ziel = typeof zielKampagneId === 'string' && zielKampagneId.trim() ? zielKampagneId.trim() : '';
  if (!ziel) {
    return { ok: false, fehler: 'Keine Ziel-Kampagne.' };
  }
  if (
    !roh ||
    typeof roh !== 'object' ||
    roh.htbahExportVersion !== 1 ||
    roh.typ !== EXPORT_TYP_SL_ZEITMESSUNG
  ) {
    return { ok: false, fehler: 'Ungültige Datei (Timer/Stoppuhr erwartet).' };
  }
  const idx = spielleiterKampagneIndexNachId(ziel);
  if (idx < 0) {
    return { ok: false, fehler: 'Ziel-Kampagne nicht gefunden.' };
  }
  const sl = ladeSpielleiterZustand();
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
  speichereSpielleiterZustand(sl);
  htbahDispatchKampagneDatenGeaendert({ art: 'zeitmessung', kampagneId: ziel });
  return { ok: true };
}

function erstelleZufallstabellenKampagneExportPaket(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
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
  if (spielleiterKampagneIndexNachId(ziel) < 0) {
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
  if (!kid || !ZUFALLSTABELLEN_LISTEN_SCHLUESSEL_SET.has(kategorie) || spielleiterKampagneIndexNachId(kid) < 0) {
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
  if (spielleiterKampagneIndexNachId(ziel) < 0) {
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
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
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
  if (spielleiterKampagneIndexNachId(ziel) < 0) {
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
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
    return null;
  }
  if (
    bereich !== 'galerie' &&
    bereich !== 'interaktive_welt' &&
    bereich !== 'interaktive_welt_einstellungen' &&
    bereich !== 'generatoren'
  ) {
    return null;
  }
  const wb = ladeWeltenbauZustand(kid);
  let daten = {};
  if (bereich === 'galerie') {
    daten = { eintraege: JSON.parse(JSON.stringify(wb.eintraege || [])) };
  } else if (bereich === 'generatoren') {
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
  if (spielleiterKampagneIndexNachId(ziel) < 0) {
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
    bereich !== 'generatoren'
  ) {
    return { ok: false, fehler: 'Unbekannter Weltenbau-Bereich.' };
  }
  const d = roh.daten && typeof roh.daten === 'object' ? roh.daten : {};
  const wb = ladeWeltenbauZustand(ziel);
  if (bereich === 'galerie') {
    wb.eintraege = Array.isArray(d.eintraege)
      ? d.eintraege.map(normalisiereWeltenbauEintrag).filter(Boolean)
      : [];
  } else if (bereich === 'generatoren') {
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
 * @param {'spielleiter'|'spielleiter_ohne_gruppe'|'komplett_ohne_gruppe'|'ztf'|'ztf_kat'|'wb'|'wb_bereich'} ctxArt
 * @param {object} roh
 * @param {{ kategorie?: string, wbBereich?: string }} [extras]
 */
function validiereKampagneDatenImportDatei(ctxArt, roh, extras) {
  const ex = extras && typeof extras === 'object' ? extras : {};
  if (!roh || typeof roh !== 'object' || roh.htbahExportVersion !== 1 || typeof roh.typ !== 'string') {
    return { ok: false, fehler: 'Ungültige oder alte Export-Datei (Version 1 erwartet).' };
  }
  if (ctxArt === 'spielleiter') {
    if (roh.typ !== EXPORT_TYP_SPIELLEITER_KAMPAGNE_TEIL) {
      return { ok: false, fehler: 'Keine Spielleiter-Kampagnen-Datei (falscher Dateityp).' };
    }
    return { ok: true };
  }
  if (ctxArt === 'spielleiter_ohne_gruppe') {
    if (roh.typ !== EXPORT_TYP_SPIELLEITER_KAMPAGNE_TEIL) {
      return { ok: false, fehler: 'Keine Spielleiter-Kampagnen-Datei (falscher Dateityp).' };
    }
    return { ok: true };
  }
  if (ctxArt === 'komplett_ohne_gruppe') {
    if (roh.typ !== EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE) {
      return { ok: false, fehler: 'Kein Komplett-Export ohne importierte Charaktere.' };
    }
    if (!roh.spielleiterTeil || !roh.zufallstabellenKampagne || !roh.weltenbauKampagne) {
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
    if (br !== roh.bereich) {
      return { ok: false, fehler: 'Die Datei gehört zu einem anderen Weltenbau-Bereich.' };
    }
    return { ok: true };
  }
  return { ok: false, fehler: 'Unbekannte Import-Aktion.' };
}

function erstelleKampagneKomplettBackupBundle(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const spielleiterTeil = erstelleSpielleiterKampagneTeilExportPaket(kid);
  const ztf = erstelleZufallstabellenKampagneExportPaket(kid);
  const wb = erstelleWeltenbauKampagneExportPaket(kid);
  if (!spielleiterTeil || !ztf || !wb) {
    return null;
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_BUNDLE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    spielleiterTeil,
    zufallstabellenKampagne: ztf,
    weltenbauKampagne: wb,
  };
}

function erstelleKampagneKomplettOhneGruppeBackupBundle(kampagneId) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid || spielleiterKampagneIndexNachId(kid) < 0) {
    return null;
  }
  const spielleiterTeil = erstelleSpielleiterKampagneTeilOhneMitgliederExportPaket(kid);
  const ztf = erstelleZufallstabellenKampagneExportPaket(kid);
  const wb = erstelleWeltenbauKampagneExportPaket(kid);
  if (!spielleiterTeil || !ztf || !wb) {
    return null;
  }
  return {
    htbahExportVersion: 1,
    typ: EXPORT_TYP_LS_KAMPAGNE_KOMPLETT_OHNE_GRUPPE,
    kampagneId: kid,
    exportiertAm: new Date().toISOString(),
    spielleiterTeil,
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
    if (!e || e.key !== 'htbah_spielleiter_kampagnen' || !e.vorhanden || typeof e.wert !== 'string') {
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
        (p.spielleiterTeil &&
          p.spielleiterTeil.kampagne &&
          typeof p.spielleiterTeil.kampagne.name === 'string' &&
          p.spielleiterTeil.kampagne.name) ||
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

function sicherstelleSpielleiterKampagneFuerBeispielImport(kampagneId, opts) {
  const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
  if (!kid) {
    return { ok: false, fehler: 'Keine Kampagnen-ID.' };
  }
  if (spielleiterKampagneIndexNachId(kid) >= 0) {
    return { ok: true, status: 'vorhanden', kampagneId: kid };
  }
  const o = opts && typeof opts === 'object' ? opts : {};
  let kampagneRoh = o.kampagneRoh;
  if (!kampagneRoh && o.spielleiterTeil && o.spielleiterTeil.kampagne) {
    kampagneRoh = o.spielleiterTeil.kampagne;
  }
  const merged = kampagneRoh
    ? normalisiereSpielleiterKampagne({ ...kampagneRoh, id: kid })
    : normalisiereSpielleiterKampagne({
        id: kid,
        name:
          typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Unbenannte Kampagne',
        mitglieder: [],
      });
  if (!merged) {
    return { ok: false, fehler: 'Kampagnendaten ungültig.' };
  }
  const sl = ladeSpielleiterZustand();
  const kampagnen = Array.isArray(sl.kampagnen) ? sl.kampagnen.slice() : [];
  kampagnen.push(merged);
  sl.kampagnen = kampagnen;
  speichereSpielleiterZustand(sl);
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
    if (e.key === 'htbah_spielleiter_kampagnen' && e.vorhanden && typeof e.wert === 'string') {
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
    if (e.key === 'htbah_spielleiter_kampagnen') {
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
      (meta.lsTyp === 'spielleiter_teil' || meta.lsTyp === 'spielleiter_ohne_gruppe') &&
      p &&
      p.kampagne
    ) {
      return sammeln(p.kampagne.labels);
    }
    if (meta.lsTyp === 'kampagne_komplett_bundle' && p && p.spielleiterTeil && p.spielleiterTeil.kampagne) {
      return sammeln(p.spielleiterTeil.kampagne.labels);
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

  const kampBereich = daten.find((d) => d && d.key === 'htbah_spielleiter_kampagnen');
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
      const vorherIdx = spielleiterKampagneIndexNachId(kid);
      const sicher = sicherstelleSpielleiterKampagneFuerBeispielImport(kid, {
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
      const sl = ladeSpielleiterZustand();
      sl.aktiveKampagneId = ergebnis.kampagneId;
      speichereSpielleiterZustand(sl);
    }
  }

  const lsKampagneIds = [...kampagneIdsAusLokalerSpeicherPaket(paket)];

  lsKampagneIds.forEach((kid) => {
    if (spielleiterKampagneIndexNachId(kid) >= 0) {
      if (!ergebnis.kampagneId) {
        ergebnis.kampagneId = kid;
        ergebnis.kampagneStatus = 'vorhanden';
      }
      return;
    }
    const name = beispielKampagneNameAusPaket(paket, kid);
    const sicher = sicherstelleSpielleiterKampagneFuerBeispielImport(kid, { name });
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
      const vorher = spielleiterKampagneIndexNachId(kid);
      sicherstelleSpielleiterKampagneFuerBeispielImport(kid, {
        name: beispielKampagneNameAusPaket(paket, kid),
        spielleiterTeil: p.spielleiterTeil,
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

    if (spielleiterKampagneIndexNachId(kid) < 0) {
      const sicher = sicherstelleSpielleiterKampagneFuerBeispielImport(kid, {
        name: beispielKampagneNameAusPaket(paket, kid),
        spielleiterTeil: meta.lsTyp === 'spielleiter_teil' || meta.lsTyp === 'spielleiter_ohne_gruppe' ? p : null,
        kampagneRoh: p.kampagne,
      });
      if (sicher.ok && sicher.status === 'neu') {
        neuAngelegteKampagnen.add(kid);
      }
    }

    if (meta.lsTyp === 'spielleiter_teil' || meta.lsTyp === 'spielleiter_ohne_gruppe') {
      importiereSpielleiterKampagneTeilPaket(kid, p);
    } else if (meta.lsTyp === 'sl_abenteuerbuch') {
      importiereSpielleiterAbenteuerbuchPaket(kid, p);
    } else if (meta.lsTyp === 'sl_atmosphaere') {
      importiereSpielleiterAtmosphaerePaket(kid, p);
    } else if (meta.lsTyp === 'sl_zeitmessung') {
      importiereSpielleiterZeitmessungPaket(kid, p);
    } else if (meta.lsTyp === 'sl_mitglied') {
      importiereSpielleiterMitgliedPaket(kid, p);
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
              sicherstelleSpielleiterKampagneFuerBeispielImport(kid, {
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

    const sl = ladeSpielleiterZustand();
    sl.aktiveKampagneId = ergebnis.kampagneId;
    speichereSpielleiterZustand(sl);
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
  const r0 = importiereSpielleiterKampagneTeilPaket(ziel, roh.spielleiterTeil);
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
  if (spielleiterKampagneIndexNachId(kid) < 0) {
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

function erstelleSpielleiterKampagne(opts) {
  const roh = opts && typeof opts === 'object' ? opts : {};
  const sl = ladeSpielleiterZustand();
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
  kampagnen.push(normalisiereSpielleiterKampagne({ id, name: basis, mitglieder: [] }));
  speichereSpielleiterZustand({ ...sl, kampagnen });
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

  if (roh.typ === 'spielleiter_kampagne' && Array.isArray(roh.mitglieder)) {
    roh.mitglieder.forEach((mitglied) => {
      if (!mitglied || typeof mitglied !== 'object') {
        return;
      }
      pushKandidat(
        mitglied.charakter || {},
        mitglied.charakterBild || '',
        'spielleiter-kampagne',
        typeof mitglied.id === 'string' ? mitglied.id : null,
      );
    });
    return kandidaten;
  }

  if (roh.typ === 'lokaler-speicher' && Array.isArray(roh.daten)) {
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
        });
      } catch {
        // ignorieren, unten ggf. Legacy prüfen
      }
    }

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
    const user = arr.find((s) => s && s.htbahPresetId === def.htbahPresetId);
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

function ladeTheme() {
  const gespeichertesTheme = htbahSpeicher.leseText(SPEICHER_KEY_THEME, null);
  return gespeichertesTheme === 'dark' ? 'dark' : 'light';
}

function setzeTheme(theme) {
  const gueltigesTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', gueltigesTheme);
  document.documentElement.setAttribute('data-bs-theme', gueltigesTheme);
  htbahSpeicher.schreibeText(SPEICHER_KEY_THEME, gueltigesTheme);
  return gueltigesTheme;
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

setzeTheme(ladeTheme());
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
  spielleiter: SPEICHER_KEY_SPIELLEITER,
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
  wuerfelW10,
  wuerfelW100,
  ladeWuerfelAudioProfil,
  setzeWuerfelAudioProfil,
  ladeWuerfelAnzeigeProfil,
  setzeWuerfelAnzeigeProfil,
  spieleWuerfelSounds,
  ladeZeitmessungProfil,
  setzeZeitmessungProfil,
  spieleZeitmessungKlick,
  spieleZeitmessungAbgelaufen,
  ladeZeitmessungBadgePosition,
  speichereZeitmessungBadgePosition,
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
  erstelleSpielleiterKampagne,
  dupliziereZufallstabellenEntitaeten,
  entferneZufallstabellenParentReferenzenAufGegenstand,
  entferneZufallstabellenBesitzerReferenzen,
  entferneGegenstandAusAllenInventaren,
  loescheZufallstabellenUndWeltenbauFuerKampagne,
  loescheZufallstabellenListeFuerKampagne,
  loescheWeltenbauBereichFuerKampagne,
  loescheSpielleiterKampagneKomplett,
  erstelleSpielleiterKampagneTeilExportPaket,
  erstelleSpielleiterKampagneTeilOhneMitgliederExportPaket,
  importiereSpielleiterKampagneTeilPaket,
  erstelleSpielleiterMitgliedExportPaket,
  importiereSpielleiterMitgliedPaket,
  erstelleSpielleiterAbenteuerbuchExportPaket,
  importiereSpielleiterAbenteuerbuchPaket,
  erstelleSpielleiterAtmosphaereExportPaket,
  importiereSpielleiterAtmosphaerePaket,
  erstelleSpielleiterZeitmessungExportPaket,
  importiereSpielleiterZeitmessungPaket,
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
  extrahiereKampagneLabelsAusLokalerSpeicherPaket,
  importierePantheonPaketInKampagne,
  ladeKampagnenAtmosphaereZustand,
  speichereKampagnenAtmosphaereZustand,
  ladeKampagnenAtmosphaereBadgePosition,
  speichereKampagnenAtmosphaereBadgePosition,
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
};

const uiApi = {
  _refs: {
    bestaetigenModal: null,
    hinweisModal: null,
    eingabeModal: null,
    toastHost: null,
  },
  setRefs(refs) {
    this._refs = {
      ...this._refs,
      ...(refs && typeof refs === 'object' ? refs : {}),
    };
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
  { path: '/spieler', redirect: '/charakter' },
  {
    path: '/charakter',
    redirect: () => {
      const aktiveId = window.HTBAH.ladeAktivenCharakterId();
      return aktiveId ? `/charakter/${aktiveId}/session-zero` : '/charakter/neu/session-zero';
    },
  },
  { path: '/charakter/neu', redirect: '/charakter/neu/session-zero' },
  { path: '/charakter/neu/session-zero', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/neu/aktives-spiel', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/neu/nachbereitung', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/:id', redirect: (to) => `/charakter/${to.params.id}/session-zero` },
  { path: '/charakter/:id/session-zero', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/:id/aktives-spiel', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter/:id/nachbereitung', component: window.HTBAH_SEITEN.Charakter },
  { path: '/charakter-erstellung', redirect: '/charakter/neu' },
  { path: '/faehigkeiten-presets', component: window.HTBAH_SEITEN.PresetVerwaltung },
  { path: '/faehigkeiten-preset-bearbeiten', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/faehigkeiten-preset-bearbeiten/:id', component: window.HTBAH_SEITEN.PresetEditor },
  { path: '/einstellungen', component: window.HTBAH_SEITEN.Einstellungen },
  { path: '/spielleiter', component: window.HTBAH_SEITEN.SpielleiterGruppenUebersicht },
  { path: '/spielleiter/kampagne/:kampagneId', component: window.HTBAH_SEITEN.SpielleiterGruppe },
  { path: '/kampagne/:kampagneSlug', redirect: (to) => `/kampagne/${to.params.kampagneSlug}/gruppe` },
  { path: '/kampagne/:kampagneSlug/:tab', component: window.HTBAH_SEITEN.Weltenbau },
  { path: '/weltenbau', redirect: () => window.HTBAH.kampagnenPfad('gruppe') },
  { path: '/weltenbau/:tab', redirect: (to) => window.HTBAH.kampagnenPfad(to.params.tab) },
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
  { path: '/gm', redirect: '/spielleiter' },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

function istNurCharakterRoute(pfad) {
  if (pfad === '/charakter' || pfad === '/charakter/neu' || pfad.startsWith('/charakter/neu/')) {
    return true;
  }
  return /^\/charakter\/[^/]+(?:\/[^/]+)?$/.test(pfad);
}

function istNurSpielleitungRoute(pfad) {
  if (pfad === '/spielleiter' || pfad === '/weltenbau') {
    return true;
  }
  if (pfad.startsWith('/weltenbau/')) {
    return true;
  }
  if (pfad.startsWith('/kampagne/')) {
    return true;
  }
  if (pfad.startsWith('/spielleiter/kampagne/')) {
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
  return p === '/weltenbau' || p.startsWith('/weltenbau/');
}

router.beforeEach(async (to, from) => {
  const rolle = window.HTBAH.ladeAppRolle();
  const ziel = to.path || '/';

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

  if (ziel === '/') {
    return true;
  }

  if (!rolle) {
    return { path: '/' };
  }

  if (rolle === 'charakter' && istNurSpielleitungRoute(ziel)) {
    const aktiveId = window.HTBAH.ladeAktivenCharakterId();
    return { path: aktiveId ? `/charakter/${aktiveId}/session-zero` : '/charakter/neu/session-zero' };
  }

  if (rolle === 'spielleitung' && istNurCharakterRoute(ziel)) {
    return { path: '/spielleiter' };
  }

  if (/^\/charakter\/[^/]+(?:\/[^/]+)?$/.test(ziel) && !ziel.startsWith('/charakter/neu')) {
    const charakterId = to.params && typeof to.params.id === 'string' ? to.params.id : '';
    if (charakterId) {
      const eintrag = window.HTBAH.ladeCharakterEintrag(charakterId);
      if (!eintrag) {
        return { path: '/charakter/neu/session-zero' };
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
});

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
    <router-view></router-view>
    <bestaetigen-modal ref="globalBestaetigenModal" modal-id="htbahGlobalBestaetigenModal" />
    <hinweis-modal ref="globalHinweisModal" />
    <eingabe-modal ref="globalEingabeModal" />
    <ui-toast-host ref="globalToastHost" />
    <lokaler-speicher-hinweis-modal />
    <entwicklungshinweis-modal />
    <regelwerk-modal :ui-zustand="uiZustand"></regelwerk-modal>
    <abenteuerbuch-modal :ui-zustand="uiZustand"></abenteuerbuch-modal>
    <zeichen-modal :ui-zustand="uiZustand"></zeichen-modal>
    <bildbetrachter-host />
    <bottom-nav :ui-zustand="uiZustand"></bottom-nav>
  `,
});

app.use(router);
router.afterEach((to) => {
  if (to.path.startsWith('/spielleiter/kampagne/')) {
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
app.component('bestaetigen-modal', window.HTBAH_KOMPONENTEN.BestaetigenModal);
app.component('hinweis-modal', window.HTBAH_KOMPONENTEN.HinweisModal);
app.component('eingabe-modal', window.HTBAH_KOMPONENTEN.EingabeModal);
app.component('ui-toast-host', window.HTBAH_KOMPONENTEN.UiToastHost);
app.component('lebenspunkte-status-banner', window.HTBAH_KOMPONENTEN.LebenspunkteStatusBanner);
app.component('icon-text-button', window.HTBAH_KOMPONENTEN.IconTextButton);
app.component(
  'kampagnen-labels-editor',
  window.HTBAH_KOMPONENTEN.KampagnenLabelsEditor,
);
app.component(
  'kampagnen-labels-verwaltung',
  window.HTBAH_KOMPONENTEN.KampagnenLabelsVerwaltung,
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
