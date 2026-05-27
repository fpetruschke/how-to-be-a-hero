#!/usr/bin/env node
/**
 * Befüllt NPCs/Bestien in Demo-Kampagnen mit Fähigkeiten-Arrays (Mittelalter-Preset).
 * Aufruf: ./bin/migriere-demo-kampagnen-faehigkeiten
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const KAMPAGNEN_DIR = path.join(ROOT, 'assets', 'beispiel-kampagnen');

function ladeEntitaetModel() {
  const presetsCode = fs.readFileSync(
    path.join(ROOT, 'shared', 'faehigkeitenPresetsStandard.js'),
    'utf8',
  );
  const cvCode = fs.readFileSync(path.join(ROOT, 'shared', 'charaktervorlagenModel.js'), 'utf8');
  const efCode = fs.readFileSync(path.join(ROOT, 'shared', 'entitaetFaehigkeitenModel.js'), 'utf8');
  const sandbox = {
    window: {
      HTBAH_CHARAKTERVORLAGEN_MODEL: {},
      HTBAH_ENTITAET_FAEHIGKEITEN_MODEL: {},
      HTBAH_CHARAKTER_MODEL: {
        summenAusCharakter(c) {
          const sum = (kat) =>
            (Array.isArray(c[kat]) ? c[kat] : []).reduce(
              (s, e) => s + (Number(e && e.value) || 0),
              0,
            );
          return { handeln: sum('handeln'), wissen: sum('wissen'), soziales: sum('soziales') };
        },
        inventarEintragNachTypBereinigen(e) {
          return { ...e };
        },
      },
    },
  };
  vm.runInNewContext(presetsCode, sandbox);
  sandbox.window.HTBAH_STANDARD_FAEHIGKEITEN_PRESETS =
    sandbox.window.HTBAH_STANDARD_FAEHIGKEITEN_PRESETS;
  vm.runInNewContext(cvCode, sandbox);
  vm.runInNewContext(efCode, sandbox);
  return sandbox.window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
}

function migriereZeile(EF, zeile, typ) {
  if (!zeile || typeof zeile !== 'object') {
    return zeile;
  }
  const hatListen =
    EF.istFaehigkeitenArrayFormat(zeile) &&
    ['handeln', 'wissen', 'soziales'].some(
      (k) => Array.isArray(zeile[k]) && zeile[k].length > 0,
    );
  if (hatListen) {
    const norm = EF.normalisiereEntitaetFaehigkeiten(zeile, {
      typ,
      fallbackEpocheUi: zeile.epoche || 'mittelalter',
    });
    if (EF.gesamtPunkte(norm) <= 400) {
      return norm;
    }
    zeile = norm;
  }
  let legacy;
  if (
    EF.istFaehigkeitenArrayFormat(zeile) &&
    EF.gesamtPunkte(zeile) > 0
  ) {
    const beg = EF.begabungenAusEntitaet(zeile);
    legacy = { handeln: beg.handeln, wissen: beg.wissen, soziales: beg.soziales };
  } else {
    legacy = {
      handeln: EF.legacyBegabungAusZeile(zeile, 'handeln'),
      wissen: EF.legacyBegabungAusZeile(zeile, 'wissen'),
      soziales: EF.legacyBegabungAusZeile(zeile, 'soziales'),
    };
  }
  const cap = (n) => Math.min(16, Math.max(0, Math.round(n)));
  legacy = { handeln: cap(legacy.handeln), wissen: cap(legacy.wissen), soziales: cap(legacy.soziales) };
  let summe = legacy.handeln + legacy.wissen + legacy.soziales;
  const maxSumme = typ === 'bestie' ? 34 : 32;
  if (summe > maxSumme && summe > 0) {
    const f = maxSumme / summe;
    legacy = {
      handeln: Math.max(3, Math.round(legacy.handeln * f)),
      wissen: Math.max(3, Math.round(legacy.wissen * f)),
      soziales: Math.max(3, Math.round(legacy.soziales * f)),
    };
    summe = legacy.handeln + legacy.wissen + legacy.soziales;
  }
  const zielBegabungen = summe > 0 ? legacy : undefined;
  const verteilt =
    typ === 'bestie'
      ? EF.verteileFaehigkeitenFuerBestie({
          presetId: 'htbah-mittelalter-fantasy',
          kategorie: zeile.kategorie,
          aggressivitaetSkala: zeile.aggressivitaetSkala,
          inventar: zeile.inventar,
          zielBegabungen,
        })
      : EF.verteileFaehigkeitenFuerNpc({
          presetId: 'htbah-mittelalter-fantasy',
          beruf: zeile.beruf,
          alter: zeile.alter,
          statur: zeile.statur,
          inventar: zeile.inventar,
          waffenloserKampf: zeile.waffenloserKampf,
          zielBegabungen,
        });
  const merged = {
    ...zeile,
    presetId: verteilt.presetId || 'htbah-mittelalter-fantasy',
    handeln: verteilt.handeln,
    wissen: verteilt.wissen,
    soziales: verteilt.soziales,
  };
  return EF.normalisiereEntitaetFaehigkeiten(merged, {
    typ,
    fallbackEpocheUi: zeile.epoche || 'mittelalter',
  });
}

function verarbeiteExport(EF, parsed) {
  if (!parsed || parsed.typ !== 'htbah-zufallstabellen-kategorie') {
    return null;
  }
  const kat = parsed.kategorie;
  if (kat !== 'npcs' && kat !== 'bestien') {
    return null;
  }
  const typ = kat === 'npcs' ? 'npc' : 'bestie';
  const zeilen = Array.isArray(parsed.zeilen) ? parsed.zeilen : [];
  parsed.zeilen = zeilen.map((z) => migriereZeile(EF, z, typ));
  return parsed;
}

function walkWerte(obj, EF, stats) {
  if (obj == null) {
    return;
  }
  if (typeof obj === 'string') {
    const t = obj.trim();
    if (t.startsWith('{') && t.includes('htbah-zufallstabellen-kategorie')) {
      try {
        const parsed = JSON.parse(t);
        const neu = verarbeiteExport(EF, parsed);
        if (neu) {
          stats.exports += 1;
          return JSON.stringify(neu);
        }
      } catch {
        /* kein JSON */
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) {
      const v = obj[i];
      if (typeof v === 'string' && v.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(v);
          const neu = verarbeiteExport(EF, parsed);
          if (neu) {
            obj[i] = JSON.stringify(neu);
            stats.exports += 1;
          }
        } catch {
          /* */
        }
      } else {
        walkWerte(v, EF, stats);
      }
    }
    return;
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      const v = obj[key];
      if (typeof v === 'string' && v.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(v);
          const neu = verarbeiteExport(EF, parsed);
          if (neu) {
            obj[key] = JSON.stringify(neu);
            stats.exports += 1;
          }
        } catch {
          walkWerte(v, EF, stats);
        }
      } else {
        walkWerte(v, EF, stats);
      }
    });
  }
}

function main() {
  const EF = ladeEntitaetModel();
  const index = JSON.parse(
    fs.readFileSync(path.join(KAMPAGNEN_DIR, 'index.json'), 'utf8'),
  );
  index.forEach((eintrag) => {
    const datei = path.join(KAMPAGNEN_DIR, eintrag.datei);
    const stats = { exports: 0 };
    const roh = JSON.parse(fs.readFileSync(datei, 'utf8'));
    walkWerte(roh, EF, stats);
    fs.writeFileSync(datei, JSON.stringify(roh, null, 2) + '\n', 'utf8');
    console.log(`✓ ${eintrag.datei} — ${stats.exports} Zufallstabellen-Export(e) aktualisiert`);
  });
}

main();
