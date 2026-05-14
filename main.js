const SPEICHER_KEY_APP_ROLLE = 'htbah_app_rolle';
const SPEICHER_KEY_CHARAKTER_LEGACY = 'htbah_character';
const SPEICHER_KEY_CHARAKTER = 'htbah_characters';
const SPEICHER_KEY_AKTIVER_CHARAKTER = 'htbah_active_character_id';
const SPEICHER_KEY_PRESETS = 'htbah_presets';
const SPEICHER_KEY_THEME = 'htbah_theme';
const SPEICHER_KEY_CHARAKTER_BILD_LEGACY = 'htbah_character_image';
const SPEICHER_KEY_SPIELLEITER = 'htbah_spielleiter_kampagnen';
const SPEICHER_KEY_ZUFALLSTABELLEN = 'htbah_zufallstabellen';
const SPEICHER_KEY_WELTENBAU = 'htbah_weltenbau';
const SPEICHER_KEY_WUERFEL_AUDIO = 'htbah_wuerfel_audio';
/** @deprecated nur Migration; neuer Speicher: SPEICHER_KEY_WUERFEL_AUDIO */
const SPEICHER_KEY_WUERFEL_SOUND_LEGACY = 'htbah_wuerfel_sound';
const SPEICHER_KEY_DICE_COLORS = 'htbah_dice_colors';
const SPEICHER_KEY_WUERFEL_BEUTEL_FENSTER = 'htbah_wuerfel_beutel_fenster';
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
  };
}

function normalisiereSpielleiterKampagne(g) {
  if (!g || typeof g !== 'object') {
    return null;
  }
  const mitglieder = Array.isArray(g.mitglieder)
    ? g.mitglieder.map(normalisiereSpielleiterMitglied).filter(Boolean)
    : [];
  const abenteuerbuchHtml =
    typeof g.abenteuerbuchHtml === 'string' ? g.abenteuerbuchHtml : '';
  const atmosphaere = normalisiereAtmosphaereZustand(g.atmosphaere);
  const atmosphaereBadgePos = normalisiereAtmosphaereBadgePosition(g.atmosphaereBadgePos);
  return {
    id: typeof g.id === 'string' && g.id ? g.id : neueEntropieId(),
    name: typeof g.name === 'string' && g.name.trim() ? g.name.trim() : 'Kampagne',
    mitglieder,
    abenteuerbuchHtml,
    atmosphaere,
    atmosphaereBadgePos,
  };
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
    lpBewusstlosAusgeblendet: Boolean(z.lpBewusstlosAusgeblendet),
    lpMassenschadenBewusstlos: Boolean(z.lpMassenschadenBewusstlos),
    schadenswertNahkampf,
    schadenswertFernkampf,
    aufenthaltsort: typeof z.aufenthaltsort === 'string' ? z.aufenthaltsort : '',
    handeln,
    wissen,
    soziales,
    fraktion: typeof z.fraktion === 'string' ? z.fraktion : '',
    glaube: typeof z.glaube === 'string' ? z.glaube : '',
    initiative: typeof z.initiative === 'string' ? z.initiative : '',
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
    geloest: Boolean(z.geloest),
    notizenHtml: typeof z.notizenHtml === 'string' ? z.notizenHtml : '',
    medien,
    primaryMediumId: normalisiereZufallstabellenPrimaryMediumId(z.primaryMediumId, medien),
  };
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
    lpBewusstlosAusgeblendet: Boolean(z.lpBewusstlosAusgeblendet),
    lpMassenschadenBewusstlos: Boolean(z.lpMassenschadenBewusstlos),
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
 * @param {'alles' | 'galerie' | 'interaktive_welt' | 'generatoren'} bereich
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
  };
}

function speichereZufallstabellenZustand(zustand, kampagneId) {
  const kid = ermittleKampagneIdFuerKampagnenSpeicher(kampagneId);
  if (!kid) {
    return;
  }
  const speicherKey = zufallstabellenSpeicherKeyFuerKampagne(kid);
  htbahSpeicher.schreibeJson(speicherKey, zustand);
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

function ladeKampagnenAbenteuerbuchHtml(kampagneId) {
  const kampagne = findeKampagneById(ladeSpielleiterZustand(), kampagneId);
  return kampagne && typeof kampagne.abenteuerbuchHtml === 'string'
    ? kampagne.abenteuerbuchHtml
    : '';
}

function speichereKampagnenAbenteuerbuchHtml(kampagneId, html) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.abenteuerbuchHtml = typeof html === 'string' ? html : '';
  });
}

function loescheKampagnenAbenteuerbuch(kampagneId) {
  return aktualisiereKampagneFeld(kampagneId, (kampagne) => {
    kampagne.abenteuerbuchHtml = '';
  });
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
    map[gruppeId] = {
      zoomScale,
      itemScale,
      edgeColor,
      edgeWidth,
      mapCenterX,
      mapCenterY,
      sichtbarkeitsFilter: {
        toteNpcsAnzeigen: filter.toteNpcsAnzeigen !== false,
        toteBestienAnzeigen: filter.toteBestienAnzeigen !== false,
        geloesteRaetselAnzeigen: filter.geloesteRaetselAnzeigen !== false,
      },
    };
  });
  return map;
}

function normalisiereWeltenbauMapBildLayouts(roh) {
  if (!roh || typeof roh !== 'object') {
    return {};
  }
  const map = {};
  Object.entries(roh).forEach(([gruppeId, gruppeLayouts]) => {
    if (typeof gruppeId !== 'string' || !gruppeId || !gruppeLayouts || typeof gruppeLayouts !== 'object') {
      return;
    }
    const gruppeMap = {};
    Object.entries(gruppeLayouts).forEach(([bildId, layout]) => {
      if (typeof bildId !== 'string' || !bildId || !layout || typeof layout !== 'object') {
        return;
      }
      const x = Math.round(Number(layout.x) || 0);
      const y = Math.round(Number(layout.y) || 0);
      const width = Math.max(1, Math.round(Number(layout.width) || 260));
      const height = Math.max(1, Math.round(Number(layout.height) || 180));
      const winkelRaw = Number(layout.angleDeg);
      const angleDeg = Number.isFinite(winkelRaw)
        ? Math.max(-3600, Math.min(3600, Math.round(winkelRaw * 100) / 100))
        : 0;
      gruppeMap[bildId] = { x, y, width, height, angleDeg };
    });
    map[gruppeId] = gruppeMap;
  });
  return map;
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
  if (bereich !== 'galerie' && bereich !== 'interaktive_welt' && bereich !== 'generatoren') {
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
  } else {
    daten = {
      mapLayouts: JSON.parse(JSON.stringify(wb.mapLayouts || {})),
      mapBildLayouts: JSON.parse(JSON.stringify(wb.mapBildLayouts || {})),
      mapFreieBilder: JSON.parse(JSON.stringify(wb.mapFreieBilder || {})),
      mapFreieNotizen: JSON.parse(JSON.stringify(wb.mapFreieNotizen || {})),
      mapFreiePfeile: JSON.parse(JSON.stringify(wb.mapFreiePfeile || {})),
      mapHintergruende: JSON.parse(JSON.stringify(wb.mapHintergruende || {})),
      mapEinstellungen: JSON.parse(JSON.stringify(wb.mapEinstellungen || {})),
      mapElementLocks: JSON.parse(JSON.stringify(wb.mapElementLocks || {})),
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
  if (bereich !== 'galerie' && bereich !== 'interaktive_welt' && bereich !== 'generatoren') {
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
  } else {
    wb.mapLayouts = d.mapLayouts && typeof d.mapLayouts === 'object' ? d.mapLayouts : {};
    wb.mapBildLayouts = normalisiereWeltenbauMapBildLayouts(d.mapBildLayouts);
    wb.mapFreieBilder = d.mapFreieBilder && typeof d.mapFreieBilder === 'object' ? d.mapFreieBilder : {};
    wb.mapFreieNotizen = normalisiereWeltenbauMapFreieNotizen(d.mapFreieNotizen);
    wb.mapFreiePfeile = normalisiereWeltenbauMapFreiePfeile(d.mapFreiePfeile);
    wb.mapHintergruende = normalisiereWeltenbauMapHintergruende(d.mapHintergruende);
    wb.mapEinstellungen = normalisiereWeltenbauMapEinstellungen(d.mapEinstellungen);
    wb.mapElementLocks = normalisiereWeltenbauMapElementLocks(d.mapElementLocks);
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

/**
 * Spielt den Würfel-Klang einmal pro Würfel. Erster Klang bei delay 0 ms (Klickfeedback);
 * weitere leicht zufällig gestaffelt (wirkt natürlicher als fester Abstand).
 * @param {number} anzahl
 */
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
        const a = new Audio(url);
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

const ORIENT_GUELTIGE_UNTER_MODI = new Set([
  'landscape-primary',
  'landscape-secondary',
  'portrait-primary',
  'portrait-secondary',
]);

const ORIENT_WINKEL_MAP = {
  'portrait-primary': 0,
  'landscape-primary': 90,
  'portrait-secondary': 180,
  'landscape-secondary': 270,
};

function bestimmeOrientierungsGruppe(modus) {
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

function normalisiereOrientierungModus(modus) {
  if (ORIENT_GUELTIGE_UNTER_MODI.has(modus)) {
    return modus;
  }
  // Legacy-Werte aus älteren Versionen sinnvoll auf eine konkrete Untervariante mappen.
  if (modus === 'landscape') {
    return 'landscape-primary';
  }
  if (modus === 'portrait') {
    return 'portrait-primary';
  }
  return 'frei';
}

function ladeOrientierungModus() {
  return normalisiereOrientierungModus(htbahSpeicher.leseText(SPEICHER_KEY_ORIENTATION_MODE, 'frei'));
}

function entsperreBildschirmAusrichtungWennMoeglich() {
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
    // Einige Browser erlauben unlock nur in bestimmten Kontexten.
  }
}

async function sperreBildschirmAusrichtungWennMoeglich(ziel) {
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
    // In einigen Browsern nur mit Nutzerinteraktion/Fullscreen erlaubt.
    return false;
  }
}

const HTBAH_ORIENT_KLASSE_AKTIV = 'htbah-orient-erzwungen';
const HTBAH_ORIENT_KLASSE_DREHUNG_CW = 'htbah-orient-drehung-cw';
const HTBAH_ORIENT_KLASSE_DREHUNG_CCW = 'htbah-orient-drehung-ccw';
const HTBAH_ORIENT_KLASSE_DREHUNG_180 = 'htbah-orient-drehung-180';

function ermittleAktuelleBildschirmAusrichtung() {
  if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.type === 'string') {
    return screen.orientation.type;
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(orientation: landscape)').matches ? 'landscape-primary' : 'portrait-primary';
  }
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight ? 'landscape-primary' : 'portrait-primary';
  }
  return 'portrait-primary';
}

function aktualisiereOrientierungCssFallback(modus) {
  if (typeof document === 'undefined') {
    return;
  }
  const html = document.documentElement;
  if (!html) {
    return;
  }
  html.classList.remove(
    HTBAH_ORIENT_KLASSE_AKTIV,
    HTBAH_ORIENT_KLASSE_DREHUNG_CW,
    HTBAH_ORIENT_KLASSE_DREHUNG_CCW,
    HTBAH_ORIENT_KLASSE_DREHUNG_180,
  );
  const normalisiert = normalisiereOrientierungModus(modus);
  if (normalisiert === 'frei') {
    return;
  }
  const aktuelle = ermittleAktuelleBildschirmAusrichtung();
  if (aktuelle === normalisiert) {
    return;
  }
  const aktuellerWinkel = ORIENT_WINKEL_MAP[aktuelle];
  const zielWinkel = ORIENT_WINKEL_MAP[normalisiert];
  if (typeof aktuellerWinkel !== 'number' || typeof zielWinkel !== 'number') {
    return;
  }
  // Delta in Grad gegen den Uhrzeigersinn, das den Inhalt von der aktuellen Geräte-Lage
  // zurück in die gewünschte Ausrichtung dreht.
  const delta = (((zielWinkel - aktuellerWinkel) % 360) + 360) % 360;
  let drehKlasse = null;
  if (delta === 90) {
    drehKlasse = HTBAH_ORIENT_KLASSE_DREHUNG_CCW;
  } else if (delta === 180) {
    drehKlasse = HTBAH_ORIENT_KLASSE_DREHUNG_180;
  } else if (delta === 270) {
    drehKlasse = HTBAH_ORIENT_KLASSE_DREHUNG_CW;
  }
  if (!drehKlasse) {
    return;
  }
  html.classList.add(HTBAH_ORIENT_KLASSE_AKTIV, drehKlasse);
}

async function versucheOrientierungSperreSonstCssFallback(modus) {
  const gesperrt = await sperreBildschirmAusrichtungWennMoeglich(modus);
  if (gesperrt) {
    // Native Sperre hat übernommen – CSS-Fallback wird nicht zusätzlich benötigt.
    aktualisiereOrientierungCssFallback('frei');
  } else {
    aktualisiereOrientierungCssFallback(modus);
  }
}

function wendeOrientierungModusAn(modus) {
  const normalisiert = normalisiereOrientierungModus(modus);
  if (normalisiert === 'frei') {
    entsperreBildschirmAusrichtungWennMoeglich();
    aktualisiereOrientierungCssFallback('frei');
    return;
  }
  void versucheOrientierungSperreSonstCssFallback(normalisiert);
}

function aufloeseOrientierungZielUnterModus(generischerModus) {
  // Bei generischer Auswahl ('landscape'/'portrait') die aktuelle Geräte-Lage übernehmen,
  // damit ein bereits "kopfüber" gehaltenes Device nicht zwangsweise um 180° zurückgedreht wird.
  const aktuelle = ermittleAktuelleBildschirmAusrichtung();
  const aktuelleGruppe = bestimmeOrientierungsGruppe(aktuelle);
  if (aktuelleGruppe === generischerModus && ORIENT_GUELTIGE_UNTER_MODI.has(aktuelle)) {
    return aktuelle;
  }
  return generischerModus === 'landscape' ? 'landscape-primary' : 'portrait-primary';
}

function speichereOrientierungModus(modus) {
  let normalisiert;
  if (modus === 'landscape' || modus === 'portrait') {
    normalisiert = aufloeseOrientierungZielUnterModus(modus);
  } else {
    normalisiert = normalisiereOrientierungModus(modus);
  }
  htbahSpeicher.schreibeText(SPEICHER_KEY_ORIENTATION_MODE, normalisiert);
  wendeOrientierungModusAn(normalisiert);
  return normalisiert;
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
  zufallstabellen: SPEICHER_KEY_ZUFALLSTABELLEN,
  weltenbau: SPEICHER_KEY_WELTENBAU,
  /** Präfix aller pro-Kampagne-Keys (Zufallstabellen), inkl. „__“. */
  zufallstabellenProKampagnePraefix: `${SPEICHER_KEY_ZUFALLSTABELLEN}__`,
  /** Präfix aller pro-Kampagne-Keys (Weltenbau / interaktive Welt), inkl. „__“. */
  weltenbauProKampagnePraefix: `${SPEICHER_KEY_WELTENBAU}__`,
  wuerfelAudio: SPEICHER_KEY_WUERFEL_AUDIO,
  diceColors: SPEICHER_KEY_DICE_COLORS,
  wuerfelBeutelFenster: SPEICHER_KEY_WUERFEL_BEUTEL_FENSTER,
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
  ladeKampagnenAbenteuerbuchHtml,
  speichereKampagnenAbenteuerbuchHtml,
  loescheKampagnenAbenteuerbuch,
  ladeWeltenbauZustand,
  speichereWeltenbauZustand,
  erstelleSpielleiterKampagne,
  dupliziereZufallstabellenEntitaeten,
  loescheZufallstabellenUndWeltenbauFuerKampagne,
  loescheZufallstabellenListeFuerKampagne,
  loescheWeltenbauBereichFuerKampagne,
  loescheSpielleiterKampagneKomplett,
  erstelleSpielleiterKampagneTeilExportPaket,
  erstelleSpielleiterKampagneTeilOhneMitgliederExportPaket,
  importiereSpielleiterKampagneTeilPaket,
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

router.beforeEach((to) => {
  const rolle = window.HTBAH.ladeAppRolle();
  const ziel = to.path || '/';

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

function berechneLebenspunkteStatus(charakter) {
  if (!charakter || typeof charakter !== 'object') {
    return { tot: false, bewusstlos: false };
  }
  const lp = Math.max(0, Math.round(Number(charakter.lebenspunkte) || 0));
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
app.component('bildbetrachter-host', window.HTBAH_KOMPONENTEN.BildbetrachterHost);
app.mount('#app');
wendeOrientierungModusAn(ladeOrientierungModus());
window.addEventListener('orientationchange', () => {
  wendeOrientierungModusAn(ladeOrientierungModus());
});
window.addEventListener('resize', () => {
  // CSS-Fallback ggf. neu evaluieren, wenn sich Viewport-Dimensionen ändern (z. B. Drehung im Browser-Tab).
  aktualisiereOrientierungCssFallback(ladeOrientierungModus());
});
if (
  typeof screen !== 'undefined' &&
  screen.orientation &&
  typeof screen.orientation.addEventListener === 'function'
) {
  screen.orientation.addEventListener('change', () => {
    wendeOrientierungModusAn(ladeOrientierungModus());
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    wendeOrientierungModusAn(ladeOrientierungModus());
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
