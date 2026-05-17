/**
 * Hierarchischer Export-/Import-Baum für die Einstellungsseite (lokaler Speicher).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

const EXPORT_ZTF_KATEGORIEN = [
  { schluessel: 'orte', label: 'Orte' },
  { schluessel: 'fraktionen', label: 'Fraktionen' },
  { schluessel: 'npcs', label: 'NPCs' },
  { schluessel: 'gegenstaende', label: 'Gegenstände' },
  { schluessel: 'raetsel', label: 'Rätsel' },
  { schluessel: 'bestien', label: 'Bestien' },
  { schluessel: 'pantheon', label: 'Pantheon' },
];

const WUERFELBECHER_BUNDLE_KEY = 'htbah_wuerfelbecher_bundle';

const GLOBAL_BLATT_DEFINITIONEN = [
  {
    id: 'sicherheitsmechanismen',
    key: 'htbah_sicherheitsmechanismen_bundle',
    label: 'Sicherheitsmechanismen',
  },
  {
    id: 'theme',
    key: 'htbah_theme',
    label: 'Theme-Einstellungen',
  },
  {
    id: 'wuerfelbecher',
    key: WUERFELBECHER_BUNDLE_KEY,
    label: 'Würfelbecher-Einstellungen',
  },
  {
    id: 'presets',
    key: 'htbah_presets',
    label: 'Fähigkeiten-Presets',
    nurSpielleitung: true,
  },
];

/** Legacy-Sammel- und Teilexporte (Import-Label, weiterhin importierbar). */
const LEGACY_SLOT_META = [
  {
    lsTyp: 'kampagne_komplett',
    prefix: 'kampagne_komplett:',
    label: 'Komplett (Legacy)',
  },
  {
    lsTyp: 'kampagne_komplett_ohne_gruppe',
    prefix: 'kampagne_komplett_ohne_gruppe:',
    label: 'Komplett ohne Gruppe (Legacy)',
  },
  {
    lsTyp: 'spielleiter_teil',
    prefix: 'spielleiter_teil:',
    label: 'Gruppe, Abenteuerbuch, Wetter (Legacy)',
  },
  {
    lsTyp: 'spielleiter_ohne_gruppe',
    prefix: 'spielleiter_ohne_gruppe:',
    label: 'Abenteuerbuch und Wetter ohne Gruppe (Legacy)',
  },
  {
    lsTyp: 'ztf_kampagne',
    prefix: 'ztf_kampagne:',
    label: 'Zufallstabellen: alle Kategorien (Legacy)',
  },
  {
    lsTyp: 'ztf_pantheon',
    prefix: 'ztf_pantheon:',
    label: 'Zufallstabellen: Pantheon (Legacy)',
  },
  {
    lsTyp: 'wb_kampagne',
    prefix: 'wb_kampagne:',
    label: 'Weltenbau: gesamt (Legacy)',
  },
];

const LEGACY_GLOBAL = [
  { id: 'kampagnen', key: 'htbah_spielleiter_kampagnen', label: 'Alle Spielleiter-Kampagnen (Legacy)' },
  { id: 'zufallstabellen', key: 'htbah_zufallstabellen', label: 'Zufallstabellen aller Kampagnen (Legacy)' },
  { id: 'weltenbau', key: 'htbah_weltenbau', label: 'Weltenbau aller Kampagnen (Legacy)' },
];

function blattKnoten(id, label, slot) {
  return {
    id,
    typ: 'blatt',
    label,
    slot: { id, ...slot },
  };
}

function gruppenKnoten(id, label, kinder) {
  return {
    id,
    typ: 'gruppe',
    label,
    kinder: kinder || [],
  };
}

function sammleBlattKnoten(knoten) {
  if (!knoten) {
    return [];
  }
  if (knoten.typ === 'blatt') {
    return [knoten];
  }
  const liste = [];
  (knoten.kinder || []).forEach((k) => {
    liste.push(...sammleBlattKnoten(k));
  });
  return liste;
}

function sammleBlattIdsUnterWurzel(wurzel) {
  const ids = [];
  (wurzel || []).forEach((k) => {
    sammleBlattKnoten(k).forEach((b) => ids.push(b.id));
  });
  return ids;
}

function baumZuFlacherListe(wurzel, tiefe) {
  const liste = [];
  const t = typeof tiefe === 'number' ? tiefe : 0;
  (wurzel || []).forEach((knoten) => {
    liste.push({
      id: knoten.id,
      typ: knoten.typ,
      label: knoten.label,
      tiefe: t,
      slot: knoten.typ === 'blatt' ? knoten.slot : null,
    });
    if (knoten.typ === 'gruppe' && knoten.kinder && knoten.kinder.length) {
      liste.push(...baumZuFlacherListe(knoten.kinder, t + 1));
    }
  });
  return liste;
}

function parseLsExportKeyMeta(key) {
  const pr = 'htbah_export_ls:';
  if (typeof key !== 'string' || !key.startsWith(pr)) {
    return null;
  }
  const tail = key.slice(pr.length);
  const typen = [
    ['kampagne_komplett_ohne_gruppe:', 'kampagne_komplett_ohne_gruppe'],
    ['kampagne_komplett:', 'kampagne_komplett'],
    ['spielleiter_ohne_gruppe:', 'spielleiter_ohne_gruppe'],
    ['spielleiter_teil:', 'spielleiter_teil'],
    ['sl_mitglied:', 'sl_mitglied'],
    ['sl_abenteuerbuch:', 'sl_abenteuerbuch'],
    ['sl_atmosphaere:', 'sl_atmosphaere'],
    ['sl_zeitmessung:', 'sl_zeitmessung'],
    ['ztf_pantheon:', 'ztf_pantheon'],
    ['ztf_kampagne:', 'ztf_kampagne'],
    ['ztf_kategorie:', 'ztf_kategorie'],
    ['wb_kampagne:', 'wb_kampagne'],
    ['wb_bereich:', 'wb_bereich'],
  ];
  for (let i = 0; i < typen.length; i += 1) {
    const prefix = typen[i][0];
    const lsTyp = typen[i][1];
    if (!tail.startsWith(prefix)) {
      continue;
    }
    const rest = tail.slice(prefix.length);
    if (lsTyp === 'sl_mitglied') {
      const li = rest.lastIndexOf(':');
      const kampagneId = li > 0 ? rest.slice(0, li) : rest;
      const mitgliedId = li > 0 ? rest.slice(li + 1) : undefined;
      return { lsTyp, kampagneId, mitgliedId };
    }
    if (lsTyp === 'ztf_kategorie') {
      const li = rest.lastIndexOf(':');
      const kampagneId = li > 0 ? rest.slice(0, li) : rest;
      const kategorie = li > 0 ? rest.slice(li + 1) : undefined;
      return { lsTyp, kampagneId, kategorie };
    }
    if (lsTyp === 'wb_bereich') {
      const li = rest.lastIndexOf(':');
      const kampagneId = li > 0 ? rest.slice(0, li) : rest;
      const weltenbauBereich = li > 0 ? rest.slice(li + 1) : undefined;
      return { lsTyp, kampagneId, weltenbauBereich };
    }
    if (lsTyp === 'sl_abenteuerbuch' || lsTyp === 'sl_atmosphaere' || lsTyp === 'sl_zeitmessung') {
      return { lsTyp, kampagneId: rest };
    }
    return { lsTyp, kampagneId: rest };
  }
  return null;
}

function lsExportKeyAusSlot(slot) {
  if (!slot || !slot.lsTyp) {
    return slot && slot.key ? slot.key : '';
  }
  const kid = slot.kampagneId || '';
  if (slot.lsTyp === 'sl_mitglied') {
    return `htbah_export_ls:sl_mitglied:${kid}:${slot.mitgliedId || ''}`;
  }
  if (slot.lsTyp === 'sl_abenteuerbuch') {
    return `htbah_export_ls:sl_abenteuerbuch:${kid}`;
  }
  if (slot.lsTyp === 'sl_atmosphaere') {
    return `htbah_export_ls:sl_atmosphaere:${kid}`;
  }
  if (slot.lsTyp === 'sl_zeitmessung') {
    return `htbah_export_ls:sl_zeitmessung:${kid}`;
  }
  if (slot.lsTyp === 'ztf_kategorie') {
    return `htbah_export_ls:ztf_kategorie:${kid}:${slot.kategorie || ''}`;
  }
  if (slot.lsTyp === 'wb_bereich') {
    return `htbah_export_ls:wb_bereich:${kid}:${slot.weltenbauBereich || ''}`;
  }
  const legacy = LEGACY_SLOT_META.find((l) => l.lsTyp === slot.lsTyp);
  if (legacy) {
    return `htbah_export_ls:${legacy.prefix}${kid}`;
  }
  return '';
}

function baueKampagneKnoten(kampagne, opts) {
  const kid = kampagne.id;
  const kname = opts.kampagneNameFn(kampagne);
  const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
  const gruppenCharKinder = mitglieder
    .filter((m) => m && m.id)
    .map((m) =>
      blattKnoten(`ex:sl:mit:${kid}:${m.id}`, opts.mitgliedNameFn(m), {
        key: `htbah_export_ls:sl_mitglied:${kid}:${m.id}`,
        label: opts.mitgliedNameFn(m),
        lsTyp: 'sl_mitglied',
        kampagneId: kid,
        mitgliedId: m.id,
      }),
    );
  const kinder = [];
  if (gruppenCharKinder.length) {
    kinder.push(gruppenKnoten(`grp:sl:gruppe:${kid}`, 'Gruppen-Charaktere', gruppenCharKinder));
  }
  kinder.push(
    blattKnoten(`ex:sl:ab:${kid}`, 'Abenteuerbuch', {
      key: `htbah_export_ls:sl_abenteuerbuch:${kid}`,
      label: 'Abenteuerbuch',
      lsTyp: 'sl_abenteuerbuch',
      kampagneId: kid,
    }),
  );
  kinder.push(
    blattKnoten(`ex:sl:atm:${kid}`, 'Wetter, Jahr- und Tageszeit', {
      key: `htbah_export_ls:sl_atmosphaere:${kid}`,
      label: 'Wetter, Jahr- und Tageszeit',
      lsTyp: 'sl_atmosphaere',
      kampagneId: kid,
    }),
  );
  kinder.push(
    blattKnoten(`ex:sl:zeit:${kid}`, 'Timer & Stoppuhr', {
      key: `htbah_export_ls:sl_zeitmessung:${kid}`,
      label: 'Timer & Stoppuhr',
      lsTyp: 'sl_zeitmessung',
      kampagneId: kid,
    }),
  );
  const ztfKinder = EXPORT_ZTF_KATEGORIEN.map((kat) =>
    blattKnoten(`ex:ztf:${kid}:${kat.schluessel}`, kat.label, {
      key: `htbah_export_ls:ztf_kategorie:${kid}:${kat.schluessel}`,
      label: kat.label,
      lsTyp: 'ztf_kategorie',
      kampagneId: kid,
      kategorie: kat.schluessel,
    }),
  );
  kinder.push(gruppenKnoten(`grp:ztf:${kid}`, 'Zufallstabellen', ztfKinder));
  const wbKinder = [
    blattKnoten(`ex:wb:${kid}:galerie`, 'Galerie', {
      key: `htbah_export_ls:wb_bereich:${kid}:galerie`,
      label: 'Galerie',
      lsTyp: 'wb_bereich',
      kampagneId: kid,
      weltenbauBereich: 'galerie',
    }),
    blattKnoten(`ex:wb:${kid}:iw`, 'Interaktive Welt / Karten', {
      key: `htbah_export_ls:wb_bereich:${kid}:interaktive_welt`,
      label: 'Interaktive Welt / Karten',
      lsTyp: 'wb_bereich',
      kampagneId: kid,
      weltenbauBereich: 'interaktive_welt',
    }),
    blattKnoten(`ex:wb:${kid}:gen`, 'Generatoren', {
      key: `htbah_export_ls:wb_bereich:${kid}:generatoren`,
      label: 'Generatoren',
      lsTyp: 'wb_bereich',
      kampagneId: kid,
      weltenbauBereich: 'generatoren',
    }),
  ];
  kinder.push(gruppenKnoten(`grp:wb:${kid}`, 'Weltenbau', wbKinder));
  return gruppenKnoten(`grp:kampagne:${kid}`, kname, kinder);
}

function baueExportBaumWurzel(opts) {
  const wurzel = [];
  const charaktere = (opts.charakterEintraege || [])
    .filter((e) => e && e.id)
    .map((e) =>
      blattKnoten(`ex:char:${e.id}`, opts.charakterNameFn(e), {
        key: `htbah_character_entry:${e.id}`,
        label: opts.charakterNameFn(e),
      }),
    );
  if (charaktere.length) {
    wurzel.push(gruppenKnoten('grp:charaktere', 'Charaktere', charaktere));
  }
  GLOBAL_BLATT_DEFINITIONEN.forEach((def) => {
    if (def.nurSpielleitung && opts.appRolle !== 'spielleitung') {
      return;
    }
    wurzel.push(
      blattKnoten(`ex:global:${def.id}`, def.label, {
        key: def.key,
        label: def.label,
        globalId: def.id,
      }),
    );
  });
  if (opts.appRolle === 'spielleitung') {
    (opts.spielleiterKampagnen || [])
      .filter((k) => k && k.id)
      .forEach((k) => {
        wurzel.push(baueKampagneKnoten(k, opts));
      });
  }
  return wurzel;
}

function baumGruppeHatBlattInDatei(knoten, dateiKeys) {
  return sammleBlattKnoten(knoten).some((b) => dateiKeys.has(b.slot.key));
}

function filterBaumFuerImport(wurzel, dateiKeys) {
  const gefiltert = [];
  (wurzel || []).forEach((knoten) => {
    if (knoten.typ === 'blatt') {
      if (dateiKeys.has(knoten.slot.key)) {
        gefiltert.push(knoten);
      }
      return;
    }
    const kinder = filterBaumFuerImport(knoten.kinder, dateiKeys);
    if (kinder.length) {
      gefiltert.push({ ...knoten, kinder });
    }
  });
  return gefiltert;
}

function legacyBlattAusEintrag(eintrag, kampagneNamen) {
  const lsMeta = parseLsExportKeyMeta(eintrag.key);
  if (lsMeta && lsMeta.lsTyp) {
    const legacy = LEGACY_SLOT_META.find((l) => l.lsTyp === lsMeta.lsTyp);
    const kid = lsMeta.kampagneId || '';
    const label =
      (typeof eintrag.label === 'string' && eintrag.label.trim()) ||
      (legacy ? legacy.label : eintrag.key);
    const id = `import:legacy:${eintrag.key}`;
    return blattKnoten(id, label, {
      key: eintrag.key,
      label,
      lsTyp: lsMeta.lsTyp,
      kampagneId: kid,
      kategorie: lsMeta.kategorie,
      weltenbauBereich: lsMeta.weltenbauBereich,
      mitgliedId: lsMeta.mitgliedId,
      importLegacy: true,
    });
  }
  const globalLegacy = LEGACY_GLOBAL.find((g) => g.key === eintrag.key);
  if (globalLegacy) {
    return blattKnoten(`import:legacy:${globalLegacy.id}`, globalLegacy.label, {
      key: globalLegacy.key,
      label: globalLegacy.label,
      globalId: globalLegacy.id,
      importLegacy: true,
    });
  }
  if (eintrag.key.startsWith('htbah_character_entry:')) {
    const label =
      (typeof eintrag.label === 'string' && eintrag.label.trim()) || 'Charakter';
    return blattKnoten(`import:${eintrag.key}`, label, {
      key: eintrag.key,
      label,
    });
  }
  const globalDef = GLOBAL_BLATT_DEFINITIONEN.find((g) => g.key === eintrag.key);
  if (globalDef) {
    return blattKnoten(`import:global:${globalDef.id}`, globalDef.label, {
      key: globalDef.key,
      label: globalDef.label,
      globalId: globalDef.id,
    });
  }
  return blattKnoten(`import:sonst:${eintrag.key}`, eintrag.label || eintrag.key, {
    key: eintrag.key,
    label: eintrag.label || eintrag.key,
  });
}

function baueImportBaumWurzel(opts) {
  const dateiEintraege = opts.dateiEintraege || [];
  const dateiKeys = new Set(
    dateiEintraege.filter((e) => e && typeof e.key === 'string').map((e) => e.key),
  );
  const template = baueExportBaumWurzel(opts);
  const importBaum = filterBaumFuerImport(template, dateiKeys);
  const templateKeys = new Set();
  sammleBlattKnoten({ typ: 'gruppe', kinder: template }).forEach((b) => {
    templateKeys.add(b.slot.key);
  });
  const orphanEintraege = dateiEintraege.filter((e) => e && e.key && !templateKeys.has(e.key));
  if (!orphanEintraege.length) {
    return importBaum;
  }
  const orphanBlaetter = orphanEintraege.map((e) => legacyBlattAusEintrag(e, opts.kampagneNamen));
  const byKampagne = new Map();
  const globalOrphans = [];
  orphanBlaetter.forEach((blatt) => {
    const kid = blatt.slot.kampagneId;
    if (kid) {
      if (!byKampagne.has(kid)) {
        byKampagne.set(kid, []);
      }
      byKampagne.get(kid).push(blatt);
    } else {
      globalOrphans.push(blatt);
    }
  });
  const ergebnis = [...importBaum];
  byKampagne.forEach((blaetter, kid) => {
    const name = (opts.kampagneNamen && opts.kampagneNamen.get(kid)) || kid;
    const idx = ergebnis.findIndex((k) => k.id === `grp:kampagne:${kid}`);
    if (idx >= 0) {
      const knoten = ergebnis[idx];
      ergebnis[idx] = {
        ...knoten,
        kinder: [...(knoten.kinder || []), gruppenKnoten(`grp:legacy:${kid}`, 'Weitere Importe', blaetter)],
      };
    } else {
      ergebnis.push(gruppenKnoten(`grp:kampagne:import:${kid}`, name, blaetter));
    }
  });
  if (globalOrphans.length) {
    ergebnis.push(gruppenKnoten('grp:import:sonst', 'Weitere Daten', globalOrphans));
  }
  return ergebnis;
}

function blattAusSlotMitDatei(slot, dateiMap) {
  const eintrag = dateiMap.get(slot.key);
  if (!eintrag) {
    return null;
  }
  return {
    ...blattKnoten(slot.id, slot.label || eintrag.label, {
      ...slot,
      label: (typeof eintrag.label === 'string' && eintrag.label.trim()) || slot.label,
    }),
    vorhanden: Boolean(eintrag.vorhanden),
    wert: typeof eintrag.wert === 'string' ? eintrag.wert : null,
  };
}

function importBaumMitDateiWerten(wurzel, dateiEintraege) {
  const dateiMap = new Map();
  (dateiEintraege || []).forEach((e, i) => {
    if (e && typeof e.key === 'string') {
      dateiMap.set(e.key, e);
    }
  });

  function mapKnoten(knoten) {
    if (knoten.typ === 'blatt') {
      const eintrag = dateiMap.get(knoten.slot.key);
      return {
        ...knoten,
        vorhanden: eintrag ? Boolean(eintrag.vorhanden) : false,
        wert: eintrag && typeof eintrag.wert === 'string' ? eintrag.wert : null,
      };
    }
    return {
      ...knoten,
      kinder: (knoten.kinder || []).map(mapKnoten),
    };
  }
  return (wurzel || []).map(mapKnoten);
}

function neueAuswahlFuerBaum(wurzel, aktiv) {
  const auswahl = {};
  sammleBlattIdsUnterWurzel(wurzel).forEach((id) => {
    auswahl[id] = aktiv;
  });
  return auswahl;
}

function alleBlaetterAusgewaehlt(wurzel, auswahl) {
  const ids = sammleBlattIdsUnterWurzel(wurzel);
  if (!ids.length) {
    return false;
  }
  return ids.every((id) => auswahl[id]);
}

function ausgewaehlteBlaetter(wurzel, auswahl) {
  return sammleBlattKnoten({ typ: 'gruppe', kinder: wurzel }).filter((b) => auswahl[b.id]);
}

function gruppenToggleWert(wurzel, auswahl, gruppenId) {
  const gruppe = findeKnotenNachId(wurzel, gruppenId);
  if (!gruppe || gruppe.typ !== 'gruppe') {
    return false;
  }
  const blaetter = sammleBlattKnoten(gruppe);
  if (!blaetter.length) {
    return false;
  }
  return blaetter.every((b) => auswahl[b.id]);
}

function findeKnotenNachId(wurzel, id) {
  for (let i = 0; i < (wurzel || []).length; i += 1) {
    const k = wurzel[i];
    if (k.id === id) {
      return k;
    }
    if (k.typ === 'gruppe' && k.kinder) {
      const inner = findeKnotenNachId(k.kinder, id);
      if (inner) {
        return inner;
      }
    }
  }
  return null;
}

function setzeGruppeUndNachfahren(wurzel, auswahl, gruppenId, aktiv) {
  const gruppe = findeKnotenNachId(wurzel, gruppenId);
  if (!gruppe) {
    return auswahl;
  }
  const next = { ...auswahl };
  sammleBlattKnoten(gruppe).forEach((b) => {
    next[b.id] = aktiv;
  });
  return next;
}

window.HTBAH_SHARED.ExportImportBaum = {
  EXPORT_ZTF_KATEGORIEN,
  WUERFELBECHER_BUNDLE_KEY,
  GLOBAL_BLATT_DEFINITIONEN,
  LEGACY_GLOBAL,
  parseLsExportKeyMeta,
  lsExportKeyAusSlot,
  baueExportBaumWurzel,
  baueImportBaumWurzel,
  importBaumMitDateiWerten,
  baumZuFlacherListe,
  sammleBlattKnoten,
  sammleBlattIdsUnterWurzel,
  ausgewaehlteBlaetter,
  neueAuswahlFuerBaum,
  alleBlaetterAusgewaehlt,
  gruppenToggleWert,
  setzeGruppeUndNachfahren,
  findeKnotenNachId,
};
