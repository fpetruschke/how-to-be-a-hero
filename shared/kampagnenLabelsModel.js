/**
 * Globale Kampagnen-Labels (Setting + Inhaltshinweise) mit vollständigem Snapshot auf Kampagnen.
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerKampagnenLabelsModel(globalObj) {
  const KATEGORIE_SETTING = 'setting';
  const KATEGORIE_FORMAT = 'format';
  const KATEGORIE_INHALT = 'inhalt';

  const KATEGORIEN = [
    { id: KATEGORIE_SETTING, label: 'Setting / Epoche', emoji: '🏰' },
    { id: KATEGORIE_FORMAT, label: 'Format', emoji: '📋' },
    { id: KATEGORIE_INHALT, label: 'Inhaltshinweis', emoji: '🎭' },
  ];

  /** Bootstrap-Hintergrund mit deutscher Bezeichnung und Vorschau-Farbe (entspricht BS 5.3). */
  const HINTERGRUND_FARBEN_META = [
    { id: 'primary', labelDe: 'Blau', hex: '#0d6efd' },
    { id: 'secondary', labelDe: 'Grau', hex: '#6c757d' },
    { id: 'success', labelDe: 'Grün', hex: '#198754' },
    { id: 'danger', labelDe: 'Rot', hex: '#dc3545' },
    { id: 'warning', labelDe: 'Gelb', hex: '#ffc107' },
    { id: 'info', labelDe: 'Türkis', hex: '#0dcaf0' },
    { id: 'light', labelDe: 'Hell', hex: '#f8f9fa' },
    { id: 'dark', labelDe: 'Dunkel', hex: '#212529' },
  ];

  const BOOTSTRAP_HINTERGRUND_FARBEN = HINTERGRUND_FARBEN_META.map((f) => f.id);

  function hintergrundFarbeMeta(bgId) {
    const id = typeof bgId === 'string' ? bgId : '';
    return HINTERGRUND_FARBEN_META.find((f) => f.id === id) || null;
  }

  const STANDARD_KATALOG_EINTRAGE = [
    {
      id: 'lbl-setting-mittelalter-fantasy',
      name: 'Mittelalter / Fantasy',
      kategorie: KATEGORIE_SETTING,
      bg: 'info',
      text: 'dark',
    },
    {
      id: 'lbl-setting-gegenwart',
      name: 'Gegenwart',
      kategorie: KATEGORIE_SETTING,
      bg: 'info',
      text: 'dark',
    },
    {
      id: 'lbl-setting-scifi',
      name: 'Sci-Fi',
      kategorie: KATEGORIE_SETTING,
      bg: 'info',
      text: 'dark',
    },
    {
      id: 'lbl-format-one-shot',
      name: 'One-Shot',
      kategorie: KATEGORIE_FORMAT,
      bg: 'primary',
      text: 'light',
    },
    {
      id: 'lbl-inhalt-gewalt',
      name: 'Gewalt',
      kategorie: KATEGORIE_INHALT,
      bg: 'danger',
      text: 'light',
    },
    {
      id: 'lbl-inhalt-drogen',
      name: 'Drogen & Suchtmittel',
      kategorie: KATEGORIE_INHALT,
      bg: 'danger',
      text: 'light',
    },
    {
      id: 'lbl-inhalt-obszoenitaet',
      name: 'Obszönität',
      kategorie: KATEGORIE_INHALT,
      bg: 'danger',
      text: 'light',
    },
    {
      id: 'lbl-inhalt-selbstverletzung',
      name: 'Selbstverletzung',
      kategorie: KATEGORIE_INHALT,
      bg: 'danger',
      text: 'light',
    },
  ];

  const ICON_BADGE_KLASSE = 'badge text-bg-light text-dark htbah-kampagnen-label-icon-badge';

  function kategorieEmoji(kategorie) {
    if (kategorie === KATEGORIE_INHALT) {
      return '🎭';
    }
    if (kategorie === KATEGORIE_FORMAT) {
      return '📋';
    }
    return '🏰';
  }

  function defaultBgFuerKategorie(kategorie) {
    if (kategorie === KATEGORIE_INHALT) {
      return 'danger';
    }
    if (kategorie === KATEGORIE_FORMAT) {
      return 'primary';
    }
    return 'info';
  }

  function defaultTextFuerKategorie(kategorie) {
    if (kategorie === KATEGORIE_INHALT || kategorie === KATEGORIE_FORMAT) {
      return 'light';
    }
    return 'dark';
  }

  function normalisiereLabelName(name) {
    return String(name || '')
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function labelNameSchluessel(name) {
    return normalisiereLabelName(name).toLocaleLowerCase('de');
  }

  function normalisiereKategorie(raw) {
    if (raw === KATEGORIE_INHALT) {
      return KATEGORIE_INHALT;
    }
    if (raw === KATEGORIE_FORMAT) {
      return KATEGORIE_FORMAT;
    }
    return KATEGORIE_SETTING;
  }

  function normalisiereHintergrund(raw, kategorie) {
    const kat = normalisiereKategorie(kategorie);
    if (typeof raw === 'string' && BOOTSTRAP_HINTERGRUND_FARBEN.includes(raw)) {
      return raw;
    }
    return defaultBgFuerKategorie(kat);
  }

  function normalisiereTextfarbe(raw, kategorie, bg) {
    if (raw === 'dark' || raw === 'light') {
      return raw;
    }
    if (bg === 'light' || bg === 'warning') {
      return 'dark';
    }
    return defaultTextFuerKategorie(kategorie);
  }

  function iconBadgeKlasse() {
    return ICON_BADGE_KLASSE;
  }

  function normalisiereLabelMeta(roh) {
    if (!roh || typeof roh !== 'object') {
      return null;
    }
    const name = normalisiereLabelName(roh.name);
    if (!name) {
      return null;
    }
    const kategorie = normalisiereKategorie(roh.kategorie);
    const bg = normalisiereHintergrund(roh.bg, kategorie);
    const text = normalisiereTextfarbe(roh.text, kategorie, bg);
    const id =
      typeof roh.id === 'string' && roh.id.trim() ? roh.id.trim() : `lbl-${labelNameSchluessel(name)}`;
    return { id, name, kategorie, bg, text };
  }

  function normalisiereKatalogEintrag(roh) {
    return normalisiereLabelMeta(roh);
  }

  function normalisiereKatalog(roh) {
    const eintraege = [];
    const seenIds = new Set();
    const quelle = roh && Array.isArray(roh.eintraege) ? roh.eintraege : [];
    quelle.forEach((e) => {
      const norm = normalisiereKatalogEintrag(e);
      if (!norm || seenIds.has(norm.id)) {
        return;
      }
      seenIds.add(norm.id);
      eintraege.push(norm);
    });
    STANDARD_KATALOG_EINTRAGE.forEach((std) => {
      if (!seenIds.has(std.id)) {
        eintraege.push({ ...std });
        seenIds.add(std.id);
      }
    });
    const kategorieReihenfolge = (kat) => {
      if (kat === KATEGORIE_SETTING) {
        return 0;
      }
      if (kat === KATEGORIE_FORMAT) {
        return 1;
      }
      return 2;
    };
    eintraege.sort((a, b) => {
      const ordA = kategorieReihenfolge(a.kategorie);
      const ordB = kategorieReihenfolge(b.kategorie);
      if (ordA !== ordB) {
        return ordA - ordB;
      }
      return a.name.localeCompare(b.name, 'de');
    });
    return { version: 2, eintraege };
  }

  function normalisiereKampagneLabelSnapshot(roh) {
    return normalisiereLabelMeta(roh);
  }

  function normalisiereKampagneLabels(liste) {
    if (!Array.isArray(liste)) {
      return [];
    }
    const out = [];
    const seen = new Set();
    liste.forEach((e) => {
      const norm = normalisiereKampagneLabelSnapshot(e);
      if (!norm || seen.has(norm.id)) {
        return;
      }
      seen.add(norm.id);
      out.push(norm);
    });
    return out;
  }

  function snapshotAusKatalogEintrag(eintrag) {
    const norm = normalisiereLabelMeta(eintrag);
    if (!norm) {
      return null;
    }
    return { ...norm };
  }

  function kategorieLabel(kategorie) {
    if (kategorie === KATEGORIE_INHALT) {
      return 'Inhaltshinweis';
    }
    if (kategorie === KATEGORIE_FORMAT) {
      return 'Format';
    }
    return 'Setting';
  }

  function badgeKlasseFuerLabel(label) {
    const norm = normalisiereLabelMeta(label);
    if (!norm) {
      return 'text-bg-secondary htbah-kampagnen-label-badge htbah-kampagnen-label--text-light';
    }
    const teile = [`text-bg-${norm.bg}`, 'htbah-kampagnen-label-badge'];
    /* Bootstrap text-bg-info/warning/light erzwingen oft dunklen Text — explizite Klasse nötig. */
    if (norm.text === 'dark') {
      teile.push('htbah-kampagnen-label--text-dark');
    } else {
      teile.push('htbah-kampagnen-label--text-light');
    }
    return teile.join(' ');
  }

  function badgeKlasseFuerKategorie(kategorie) {
    return badgeKlasseFuerLabel({ kategorie, bg: defaultBgFuerKategorie(kategorie), text: defaultTextFuerKategorie(kategorie) });
  }

  function btnCloseWeiss(label) {
    const norm = normalisiereLabelMeta(label);
    return norm && norm.text === 'light';
  }

  function findeKatalogEintrag(katalog, { id, name, kategorie }) {
    const eintraege = katalog && Array.isArray(katalog.eintraege) ? katalog.eintraege : [];
    if (typeof id === 'string' && id) {
      return eintraege.find((e) => e && e.id === id) || null;
    }
    const zielName = labelNameSchluessel(name);
    if (!zielName) {
      return null;
    }
    const kat = typeof kategorie === 'string' ? normalisiereKategorie(kategorie) : null;
    return (
      eintraege.find((e) => {
        if (!e || labelNameSchluessel(e.name) !== zielName) {
          return false;
        }
        if (kat && e.kategorie !== kat) {
          return false;
        }
        return true;
      }) || null
    );
  }

  function erstelleKatalogEintrag(katalog, meta, neueIdFn) {
    const norm = normalisiereLabelMeta(typeof meta === 'string' ? { name: meta } : meta);
    if (!norm) {
      return { katalog, eintrag: null, neu: false };
    }
    const vorhanden = findeKatalogEintrag(katalog, { name: norm.name });
    if (vorhanden) {
      return { katalog, eintrag: vorhanden, neu: false };
    }
    const idFn = typeof neueIdFn === 'function' ? neueIdFn : () => `lbl-${Date.now()}`;
    const eintrag = { ...norm, id: norm.id || idFn() };
    const next = normalisiereKatalog({
      eintraege: [...(katalog.eintraege || []), eintrag],
    });
    return { katalog: next, eintrag, neu: true };
  }

  function aktualisiereKatalogEintrag(katalog, eintragId, patch) {
    const id = typeof eintragId === 'string' ? eintragId.trim() : '';
    if (!id) {
      return katalog;
    }
    const eintraege = (katalog.eintraege || []).map((e) => {
      if (!e || e.id !== id) {
        return e;
      }
      return normalisiereLabelMeta({ ...e, ...patch, id });
    });
    return normalisiereKatalog({ eintraege });
  }

  function entferneKatalogEintrag(katalog, eintragId) {
    const id = typeof eintragId === 'string' ? eintragId.trim() : '';
    if (!id) {
      return katalog;
    }
    return normalisiereKatalog({
      eintraege: (katalog.eintraege || []).filter((e) => e && e.id !== id),
    });
  }

  function kampagneHatLabel(kampagne, eintragId) {
    const labels = normalisiereKampagneLabels(kampagne && kampagne.labels);
    return labels.some((l) => l.id === eintragId);
  }

  function setzeKampagneLabelAktiv(kampagne, eintrag, aktiv) {
    const snap = snapshotAusKatalogEintrag(eintrag);
    if (!snap) {
      return normalisiereKampagneLabels(kampagne && kampagne.labels);
    }
    let labels = normalisiereKampagneLabels(kampagne && kampagne.labels);
    const idx = labels.findIndex((l) => l.id === snap.id);
    if (aktiv) {
      if (idx >= 0) {
        labels[idx] = { ...snap };
      } else {
        labels = [...labels, snap];
      }
    } else if (idx >= 0) {
      labels = labels.filter((l) => l.id !== snap.id);
    }
    return labels;
  }

  function importLabelsInKatalog(katalog, labelListe) {
    let next = normalisiereKatalog(katalog);
    const snaps = normalisiereKampagneLabels(labelListe);
    snaps.forEach((snap) => {
      let existing = findeKatalogEintrag(next, { id: snap.id });
      if (!existing) {
        existing = findeKatalogEintrag(next, { name: snap.name });
      }
      if (!existing) {
        const ergebnis = erstelleKatalogEintrag(next, snap);
        next = ergebnis.katalog;
      }
    });
    return next;
  }

  function autocompleteVorschlaege(katalog, { query, limit, excludeIds }) {
    const max = typeof limit === 'number' && limit > 0 ? limit : 16;
    const q = labelNameSchluessel(query);
    const ausgeschlossen = new Set(Array.isArray(excludeIds) ? excludeIds : []);
    const eintraege = (katalog && katalog.eintraege) || [];
    return eintraege
      .filter((e) => {
        if (!e || ausgeschlossen.has(e.id)) {
          return false;
        }
        if (!q) {
          return true;
        }
        return labelNameSchluessel(e.name).includes(q);
      })
      .slice(0, max);
  }

  globalObj.KampagnenLabels = {
    SPEICHER_KEY: 'htbah_kampagnen_labels_katalog',
    KATEGORIE_SETTING,
    KATEGORIE_FORMAT,
    KATEGORIE_INHALT,
    KATEGORIEN,
    BOOTSTRAP_HINTERGRUND_FARBEN,
    HINTERGRUND_FARBEN_META,
    hintergrundFarbeMeta,
    STANDARD_KATALOG_EINTRAGE,
    kategorieEmoji,
    defaultBgFuerKategorie,
    defaultTextFuerKategorie,
    normalisiereLabelName,
    labelNameSchluessel,
    normalisiereKategorie,
    normalisiereLabelMeta,
    normalisiereKatalogEintrag,
    normalisiereKatalog,
    normalisiereKampagneLabelSnapshot,
    normalisiereKampagneLabels,
    snapshotAusKatalogEintrag,
    kategorieLabel,
    badgeKlasseFuerLabel,
    badgeKlasseFuerKategorie,
    iconBadgeKlasse,
    btnCloseWeiss,
    findeKatalogEintrag,
    erstelleKatalogEintrag,
    aktualisiereKatalogEintrag,
    entferneKatalogEintrag,
    kampagneHatLabel,
    setzeKampagneLabelAktiv,
    importLabelsInKatalog,
    autocompleteVorschlaege,
  };
})(window.HTBAH_SHARED);
