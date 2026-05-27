#!/usr/bin/env node
/**
 * Prüft Fähigkeiten in Demo-Kampagnen (Preset-Namen, Warnung bei >450 Punkten).
 * Aufruf: ./bin/validiere-demo-kampagnen-faehigkeiten
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const KAMPAGNEN_DIR = path.join(ROOT, 'assets', 'beispiel-kampagnen');

function ladeModel() {
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
      },
    },
  };
  vm.runInNewContext(presetsCode, sandbox);
  vm.runInNewContext(cvCode, sandbox);
  vm.runInNewContext(efCode, sandbox);
  return {
    CV: sandbox.window.HTBAH_CHARAKTERVORLAGEN_MODEL,
    EF: sandbox.window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL,
  };
}

function pruefeZeile(EF, CV, zeile, typ, kontext) {
  const fehler = [];
  const z = EF.normalisiereEntitaetFaehigkeiten(zeile, { typ });
  const preset = CV.findeStandardPreset(z.presetId);
  if (!preset) {
    fehler.push(`unbekanntes Preset ${z.presetId}`);
  } else {
    const erlaubt = CV.skillNamenAusPreset(preset);
    ['handeln', 'wissen', 'soziales'].forEach((kat) => {
      (z[kat] || []).forEach((f) => {
        if (!erlaubt.has(f.name)) {
          fehler.push(`Skill „${f.name}“ nicht im Preset`);
        }
      });
    });
  }
  const punkte = EF.gesamtPunkte(z);
  const beg = EF.begabungenAusEntitaet(z);
  if (punkte > 450) {
    fehler.push(`sehr hohe Punkte (${punkte})`);
  }
  return { fehler, beg, punkte, name: z.name || '—' };
}

function walk(obj, EF, CV, stats, pfad) {
  if (obj == null) {
    return;
  }
  if (typeof obj === 'string' && obj.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(obj);
      if (parsed.typ === 'htbah-zufallstabellen-kategorie') {
        const typ = parsed.kategorie === 'bestien' ? 'bestie' : 'npc';
        if (parsed.kategorie === 'npcs' || parsed.kategorie === 'bestien') {
          (parsed.zeilen || []).forEach((z) => {
            const r = pruefeZeile(EF, CV, z, typ, pfad);
            stats.entitaeten += 1;
            if (r.fehler.length) {
              stats.fehler += 1;
              console.error(
                `✗ ${pfad} / ${r.name}: ${r.fehler.join('; ')} (Punkte ${r.punkte}, B H${r.beg.handeln} W${r.beg.wissen} S${r.beg.soziales})`,
              );
            } else {
              console.log(
                `  ✓ ${r.name} — ${r.punkte} Pkt, Begabungen H${r.beg.handeln} W${r.beg.wissen} S${r.beg.soziales}`,
              );
            }
          });
        }
      }
    } catch {
      /* */
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, EF, CV, stats, `${pfad}[${i}]`));
    return;
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((k) => walk(obj[k], EF, CV, stats, `${pfad}.${k}`));
  }
}

function main() {
  const { EF, CV } = ladeModel();
  const index = JSON.parse(
    fs.readFileSync(path.join(KAMPAGNEN_DIR, 'index.json'), 'utf8'),
  );
  let gesamtFehler = 0;
  index.forEach((eintrag) => {
    console.log(`\n${eintrag.titel} (${eintrag.datei})`);
    const roh = JSON.parse(fs.readFileSync(path.join(KAMPAGNEN_DIR, eintrag.datei), 'utf8'));
    const stats = { entitaeten: 0, fehler: 0 };
    walk(roh, EF, CV, stats, eintrag.datei);
    gesamtFehler += stats.fehler;
    console.log(`  → ${stats.entitaeten} NPC(s)/Bestie(n), ${stats.fehler} Problem(e)`);
  });
  if (gesamtFehler) {
    process.exitCode = 1;
  }
}

main();
