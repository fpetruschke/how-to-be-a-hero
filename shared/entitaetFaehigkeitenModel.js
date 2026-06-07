/**
 * Fähigkeiten für NPCs und Bestien (Preset-Listen, Verteilung, Legacy-Migration).
 */
window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL || {};

(function () {
  const M = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
  const KATEGORIEN = ['handeln', 'wissen', 'soziales'];
  const DEFAULT_PRESET_ID = 'htbah-mittelalter-fantasy';

  const EPOCHE_UI_ZU_VORLAGE = {
    mittelalter: 'mittelalter-fantasy',
    gegenwart: 'gegenwart',
    zukunft: 'scifi',
  };

  function cv() {
    return window.HTBAH_CHARAKTERVORLAGEN_MODEL;
  }

  function cm() {
    return window.HTBAH_CHARAKTER_MODEL;
  }

  function zufallsInt(min, max) {
    const a = Math.ceil(min);
    const b = Math.floor(max);
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  M.DEFAULT_PRESET_ID = DEFAULT_PRESET_ID;

  M.presetIdFuerEpocheUi = function presetIdFuerEpocheUi(epocheUi) {
    const key = typeof epocheUi === 'string' ? epocheUi.trim() : '';
    const vorlageEpoche = EPOCHE_UI_ZU_VORLAGE[key] || EPOCHE_UI_ZU_VORLAGE.mittelalter;
    const CV = cv();
    return CV && typeof CV.presetIdFuerEpoche === 'function'
      ? CV.presetIdFuerEpoche(vorlageEpoche) || DEFAULT_PRESET_ID
      : DEFAULT_PRESET_ID;
  };

  M.presetIdFuerEntitaet = function presetIdFuerEntitaet(typ, zeile, fallbackEpocheUi) {
    const z = zeile && typeof zeile === 'object' ? zeile : {};
    const pid = typeof z.presetId === 'string' ? z.presetId.trim() : '';
    if (pid) {
      return pid;
    }
    if (typ === 'bestie' && typeof z.epoche === 'string' && z.epoche.trim()) {
      return M.presetIdFuerEpocheUi(z.epoche.trim());
    }
    if (fallbackEpocheUi) {
      return M.presetIdFuerEpocheUi(fallbackEpocheUi);
    }
    return DEFAULT_PRESET_ID;
  };

  M.findePreset = function findePreset(presetId) {
    const CV = cv();
    return CV && typeof CV.findeStandardPreset === 'function'
      ? CV.findeStandardPreset(presetId)
      : null;
  };

  M.istFaehigkeitenArrayFormat = function istFaehigkeitenArrayFormat(zeile) {
    if (!zeile || typeof zeile !== 'object') {
      return false;
    }
    return KATEGORIEN.some((kat) => Array.isArray(zeile[kat]));
  };

  M.legacyBegabungAusZeile = function legacyBegabungAusZeile(zeile, kat) {
    if (!zeile || typeof zeile !== 'object') {
      return 0;
    }
    if (Array.isArray(zeile[kat])) {
      return 0;
    }
    const n = Math.round(Number(zeile[kat]));
    if (!Number.isFinite(n) || n < 0) {
      return 0;
    }
    return Math.min(40, n);
  };

  M.normalisiereFaehigkeitenListe = function normalisiereFaehigkeitenListe(roh, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const maxProSkill = o.slModus ? 200 : 100;
    if (!Array.isArray(roh)) {
      return [];
    }
    const out = [];
    const seen = new Set();
    for (const eintrag of roh) {
      if (!eintrag || typeof eintrag !== 'object') {
        continue;
      }
      const name = typeof eintrag.name === 'string' ? eintrag.name.trim() : '';
      if (!name || seen.has(name)) {
        continue;
      }
      const value = Math.round(Number(eintrag.value));
      if (!Number.isFinite(value) || value < 0 || value > maxProSkill) {
        continue;
      }
      seen.add(name);
      out.push({ name, value });
    }
    return out;
  };

  M.summenAusEntitaet = function summenAusEntitaet(zeile) {
    const CM = cm();
    if (CM && typeof CM.summenAusCharakter === 'function') {
      return CM.summenAusCharakter(zeile);
    }
    const sum = (kat) =>
      (Array.isArray(zeile && zeile[kat]) ? zeile[kat] : []).reduce(
        (s, e) => s + (Number(e && e.value) || 0),
        0,
      );
    return { handeln: sum('handeln'), wissen: sum('wissen'), soziales: sum('soziales') };
  };

  M.begabungenAusEntitaet = function begabungenAusEntitaet(zeile) {
    if (M.istFaehigkeitenArrayFormat(zeile)) {
      const s = M.summenAusEntitaet(zeile);
      const b = (v) => Math.max(0, Math.round(Number(v) / 10));
      return { handeln: b(s.handeln), wissen: b(s.wissen), soziales: b(s.soziales) };
    }
    return {
      handeln: M.legacyBegabungAusZeile(zeile, 'handeln'),
      wissen: M.legacyBegabungAusZeile(zeile, 'wissen'),
      soziales: M.legacyBegabungAusZeile(zeile, 'soziales'),
    };
  };

  M.begabungHandelnAusEntitaet = function begabungHandelnAusEntitaet(zeile) {
    if (M.istFaehigkeitenArrayFormat(zeile)) {
      return M.begabungenAusEntitaet(zeile).handeln;
    }
    return M.legacyBegabungAusZeile(zeile, 'handeln');
  };

  /** Berufsprofil (gleiche Logik wie npcModul). */
  M.berufsProfil = function berufsProfil(beruf) {
    const b = String(beruf || '').toLowerCase();
    const istWissen = [
      'gelehrter',
      'bibliothekar',
      'archivarin',
      'wissenschaftler',
      'it-administrator',
      'programmierer',
      'nanomediziner',
      'heiler',
      'schreiber',
      'alchemist',
      'magister',
    ].some((s) => b.includes(s));
    const istSozial = [
      'händler',
      'gastwirt',
      'barde',
      'anwältin',
      'journalistin',
      'unterhändlerin',
      'influencer',
      'advokat',
      'kellner',
      'wirt',
      'krug',
    ].some((s) => b.includes(s));
    const istHandwerk = ['schmied', 'schmiedin', 'schuster', 'tischler', 'schneider'].some((s) =>
      b.includes(s),
    );
    const istKampf = [
      'wache',
      'soldat',
      'sicherheits',
      'leibwächter',
      'söldner',
      'polizist',
      'scharfschütze',
      'ranger',
      'jäger',
      'krieger',
      'ritter',
    ].some((s) => b.includes(s));
    if (istWissen) {
      return {
        handelnMin: 8,
        handelnMax: 14,
        wissenMin: 16,
        wissenMax: 22,
        sozialesMin: 6,
        sozialesMax: 14,
        dominanz: 'wissen',
      };
    }
    if (istSozial) {
      return {
        handelnMin: 8,
        handelnMax: 14,
        wissenMin: 8,
        wissenMax: 14,
        sozialesMin: 14,
        sozialesMax: 22,
        dominanz: 'soziales',
      };
    }
    if (istKampf) {
      return {
        handelnMin: 14,
        handelnMax: 22,
        wissenMin: 4,
        wissenMax: 12,
        sozialesMin: 4,
        sozialesMax: 12,
        dominanz: 'handeln',
      };
    }
    if (istHandwerk) {
      return {
        handelnMin: 12,
        handelnMax: 18,
        wissenMin: 10,
        wissenMax: 16,
        sozialesMin: 6,
        sozialesMax: 12,
        dominanz: 'handeln',
      };
    }
    return {
      handelnMin: 10,
      handelnMax: 16,
      wissenMin: 8,
      wissenMax: 14,
      sozialesMin: 8,
      sozialesMax: 14,
      dominanz: 'handeln',
    };
  };

  function parseAlter(alterStr) {
    const s = String(alterStr || '').trim();
    const n = parseInt(s, 10);
    if (Number.isFinite(n)) {
      return n;
    }
    if (/älter|alt|betagt|greis/i.test(s)) {
      return 65;
    }
    if (/jung|knabe|mädchen/i.test(s)) {
      return 20;
    }
    return 35;
  }

  M.zielBegabungenFuerNpc = function zielBegabungenFuerNpc(ctx) {
    const c = ctx && typeof ctx === 'object' ? ctx : {};
    const profil = M.berufsProfil(c.beruf);
    let handeln = zufallsInt(profil.handelnMin, profil.handelnMax);
    let wissen = zufallsInt(profil.wissenMin, profil.wissenMax);
    let soziales = zufallsInt(profil.sozialesMin, profil.sozialesMax);
    const alter = parseAlter(c.alter);
    const statur = String(c.statur || '').toLowerCase();
    if (alter >= 55) {
      handeln = Math.max(profil.handelnMin, handeln - zufallsInt(1, 4));
      wissen = Math.min(22, wissen + zufallsInt(0, 3));
    } else if (alter < 26) {
      handeln = Math.min(22, handeln + zufallsInt(0, 2));
    }
    if (/athlet|kräftig|breitschultrig|stämmig/i.test(statur)) {
      handeln = Math.min(22, handeln + 2);
    }
    if (/zierlich|hager|dünn|klein/i.test(statur)) {
      handeln = Math.max(profil.handelnMin, handeln - 1);
      soziales = Math.min(22, soziales + 1);
    }
    if (c.zielBegabungen) {
      const z = c.zielBegabungen;
      if (Number.isFinite(z.handeln)) {
        handeln = clamp(Math.round(z.handeln), 0, 40);
      }
      if (Number.isFinite(z.wissen)) {
        wissen = clamp(Math.round(z.wissen), 0, 40);
      }
      if (Number.isFinite(z.soziales)) {
        soziales = clamp(Math.round(z.soziales), 0, 40);
      }
    }
    return {
      handeln: clamp(handeln, 0, 40),
      wissen: clamp(wissen, 0, 40),
      soziales: clamp(soziales, 0, 40),
    };
  };

  M.zielBegabungenFuerBestie = function zielBegabungenFuerBestie(ctx) {
    const c = ctx && typeof ctx === 'object' ? ctx : {};
    const kat = String(c.kategorie || 'normales_tier');
    let handeln = 12;
    let wissen = 6;
    let soziales = 4;
    if (kat === 'monster' || kat === 'mutiert') {
      handeln = zufallsInt(14, 20);
      wissen = zufallsInt(2, 8);
      soziales = zufallsInt(0, 6);
    } else if (kat === 'fantasy_tier') {
      handeln = zufallsInt(10, 16);
      wissen = zufallsInt(8, 14);
      soziales = zufallsInt(2, 8);
    } else {
      handeln = zufallsInt(10, 16);
      wissen = zufallsInt(4, 10);
      soziales = zufallsInt(2, 6);
    }
    const agg = Number(c.aggressivitaetSkala);
    if (Number.isFinite(agg) && agg >= 7) {
      handeln = Math.min(22, handeln + 2);
    }
    if (c.zielBegabungen) {
      const z = c.zielBegabungen;
      if (Number.isFinite(z.handeln)) {
        handeln = clamp(Math.round(z.handeln), 0, 40);
      }
      if (Number.isFinite(z.wissen)) {
        wissen = clamp(Math.round(z.wissen), 0, 40);
      }
      if (Number.isFinite(z.soziales)) {
        soziales = clamp(Math.round(z.soziales), 0, 40);
      }
    }
    return { handeln, wissen, soziales };
  };

  function skillGewichteNpc(ctx, preset) {
    const gewicht = new Map();
    const b = String(ctx.beruf || '').toLowerCase();
    const boost = (name, w) => {
      gewicht.set(name, (gewicht.get(name) || 1) + w);
    };
    KATEGORIEN.forEach((kat) => {
      const arr = Array.isArray(preset[kat]) ? preset[kat] : [];
      arr.forEach((e) => {
        const n = e && e.name ? String(e.name).trim() : '';
        if (n) {
          gewicht.set(n, 1);
        }
      });
    });
    if (/schmied|schmiedin|schuster|tischler/.test(b)) {
      boost('Nahkampf (bewaffnet)', 4);
      boost('Heben & Tragen', 3);
      boost('Physik & Mechanik', 3);
    }
    if (/bibliothekar|gelehrter|schreiber|magister/.test(b)) {
      boost('Geschichte & Legenden', 4);
      boost('Alte Sprachen', 3);
      boost('Religion', 2);
    }
    if (/barde|gastwirt|händler|wirt/.test(b)) {
      boost('Auftreten', 4);
      boost('Begeistern', 3);
      boost('Überreden', 3);
      boost('Handel & Feilschen', 2);
    }
    if (/wache|soldat|jäger|ritter|krieger/.test(b)) {
      boost('Nahkampf (bewaffnet)', 4);
      boost('Fernkampf', 2);
      boost('Athletik', 2);
      boost('Einschüchtern', 2);
    }
    if (/heiler|barbier/.test(b)) {
      boost('Heilkunde', 4);
      boost('Pflanzenkunde', 2);
    }
    if (/dieb|schurke/.test(b)) {
      boost('Schleichen', 4);
      boost('Schlösser knacken', 3);
      boost('Lügen', 2);
    }
    const inventar = Array.isArray(ctx.inventar) ? ctx.inventar : [];
    inventar.forEach((item) => {
      if (!item || item.typ !== 'waffe') {
        return;
      }
      const nah = String(item.schadenswertNahkampf || '').trim();
      const fern = String(item.schadenswertFernkampf || '').trim();
      if (nah) {
        boost('Nahkampf (bewaffnet)', 3);
        boost('Nahkampf (unbewaffnet)', 1);
      }
      if (fern) {
        boost('Fernkampf', 3);
      }
    });
    return gewicht;
  }

  function skillGewichteBestie(ctx, preset) {
    const gewicht = new Map();
    KATEGORIEN.forEach((kat) => {
      const arr = Array.isArray(preset[kat]) ? preset[kat] : [];
      arr.forEach((e) => {
        const n = e && e.name ? String(e.name).trim() : '';
        if (n) {
          gewicht.set(n, 1);
        }
      });
    });
    const boost = (name, w) => {
      if (gewicht.has(name)) {
        gewicht.set(name, gewicht.get(name) + w);
      }
    };
    const kat = String(ctx.kategorie || '');
    boost('Nahkampf (bewaffnet)', 3);
    boost('Nahkampf (unbewaffnet)', 2);
    boost('Wahrnehmung', 2);
    boost('Überleben (Wildnis)', 2);
    if (kat === 'fantasy_tier') {
      boost('Magischer Trick', 3);
      boost('Tierkunde & -dressur', 2);
    }
    if (kat === 'monster' || kat === 'mutiert') {
      boost('Athletik', 2);
      boost('Einschüchtern', 1);
    }
    return gewicht;
  }

  function kategorieFuerSkillName(name, preset) {
    for (const kat of KATEGORIEN) {
      const arr = Array.isArray(preset[kat]) ? preset[kat] : [];
      if (arr.some((e) => e && e.name === name)) {
        return kat;
      }
    }
    return null;
  }

  function waehleSkills(gewicht, preset, kategorie, anzahl) {
    const kandidaten = [];
    (Array.isArray(preset[kategorie]) ? preset[kategorie] : []).forEach((e) => {
      const name = e && e.name ? String(e.name).trim() : '';
      if (!name) {
        return;
      }
      const g = gewicht.get(name) || 1;
      kandidaten.push({ name, gewicht: g });
    });
    if (!kandidaten.length) {
      return [];
    }
    const gewaehlt = [];
    const rest = kandidaten.slice();
    const n = Math.min(anzahl, rest.length);
    for (let i = 0; i < n; i += 1) {
      const summe = rest.reduce((s, k) => s + k.gewicht, 0);
      let r = Math.random() * summe;
      let idx = 0;
      for (let j = 0; j < rest.length; j += 1) {
        r -= rest[j].gewicht;
        if (r <= 0) {
          idx = j;
          break;
        }
      }
      gewaehlt.push(rest[idx].name);
      rest.splice(idx, 1);
    }
    return gewaehlt;
  }

  function verteilePunkteAufSkills(skillNamen, gesamtPunkte, gewicht) {
    if (!skillNamen.length || gesamtPunkte <= 0) {
      return [];
    }
    const anteile = skillNamen.map((name) => gewicht.get(name) || 1);
    const sumG = anteile.reduce((a, b) => a + b, 0);
    const roh = anteile.map((g) => Math.max(5, Math.round((gesamtPunkte * g) / sumG)));
    let diff = gesamtPunkte - roh.reduce((a, b) => a + b, 0);
    const out = skillNamen.map((name, i) => ({ name, value: roh[i] }));
    let guard = 0;
    while (diff !== 0 && guard < 500) {
      guard += 1;
      const i = zufallsInt(0, out.length - 1);
      if (diff > 0) {
        out[i].value += 1;
        diff -= 1;
      } else if (out[i].value > 5) {
        out[i].value -= 1;
        diff += 1;
      }
    }
    return out.filter((e) => e.value > 0);
  }

  M.verteileFaehigkeitenListen = function verteileFaehigkeitenListen(ctx) {
    const c = ctx && typeof ctx === 'object' ? ctx : {};
    const presetId =
      typeof c.presetId === 'string' && c.presetId.trim()
        ? c.presetId.trim()
        : DEFAULT_PRESET_ID;
    const preset = M.findePreset(presetId);
    if (!preset) {
      return {
        presetId: DEFAULT_PRESET_ID,
        handeln: [],
        wissen: [],
        soziales: [],
      };
    }
    const ziel =
      c.typ === 'bestie'
        ? M.zielBegabungenFuerBestie(c)
        : M.zielBegabungenFuerNpc(c);
    const gewicht =
      c.typ === 'bestie' ? skillGewichteBestie(c, preset) : skillGewichteNpc(c, preset);
    const profil = c.typ === 'bestie' ? null : M.berufsProfil(c.beruf);
    const dominanz = profil ? profil.dominanz : 'handeln';
    const result = { handeln: [], wissen: [], soziales: [] };
    KATEGORIEN.forEach((kat) => {
      const punkte = ziel[kat] * 10;
      if (punkte <= 0) {
        return;
      }
      let anzahl = kat === dominanz ? zufallsInt(2, 4) : zufallsInt(1, 3);
      if (punkte < 40) {
        anzahl = Math.min(anzahl, 2);
      }
      const namen = waehleSkills(gewicht, preset, kat, anzahl);
      result[kat] = verteilePunkteAufSkills(namen, punkte, gewicht);
    });
    return {
      presetId: preset.htbahPresetId || presetId,
      handeln: result.handeln,
      wissen: result.wissen,
      soziales: result.soziales,
    };
  };

  M.verteileFaehigkeitenFuerNpc = function verteileFaehigkeitenFuerNpc(ctx) {
    return M.verteileFaehigkeitenListen({ ...ctx, typ: 'npc' });
  };

  M.verteileFaehigkeitenFuerBestie = function verteileFaehigkeitenFuerBestie(ctx) {
    return M.verteileFaehigkeitenListen({ ...ctx, typ: 'bestie' });
  };

  M.synthetisiereAusLegacyBegabungen = function synthetisiereAusLegacyBegabungen(zeile, presetId, opts) {
    const z = zeile && typeof zeile === 'object' ? zeile : {};
    const o = opts && typeof opts === 'object' ? opts : {};
    const legacy = {
      handeln: M.legacyBegabungAusZeile(z, 'handeln'),
      wissen: M.legacyBegabungAusZeile(z, 'wissen'),
      soziales: M.legacyBegabungAusZeile(z, 'soziales'),
    };
    if (!legacy.handeln && !legacy.wissen && !legacy.soziales) {
      return null;
    }
    return M.verteileFaehigkeitenListen({
      typ: o.typ || 'npc',
      presetId: presetId || DEFAULT_PRESET_ID,
      beruf: z.beruf,
      alter: z.alter,
      statur: z.statur,
      inventar: z.inventar,
      kategorie: z.kategorie,
      aggressivitaetSkala: z.aggressivitaetSkala,
      zielBegabungen: legacy,
    });
  };

  M.normalisiereEntitaetFaehigkeiten = function normalisiereEntitaetFaehigkeiten(zeile, opts) {
    const z = zeile && typeof zeile === 'object' ? { ...zeile } : {};
    const o = opts && typeof opts === 'object' ? opts : {};
    const typ = o.typ === 'bestie' ? 'bestie' : 'npc';
    const presetId = M.presetIdFuerEntitaet(typ, z, o.fallbackEpocheUi);
    const preset = M.findePreset(presetId);
    const erlaubt =
      preset && cv() && typeof cv().skillNamenAusPreset === 'function'
        ? cv().skillNamenAusPreset(preset)
        : new Set();

    let handeln = [];
    let wissen = [];
    let soziales = [];

    if (M.istFaehigkeitenArrayFormat(z)) {
      handeln = M.normalisiereFaehigkeitenListe(z.handeln, { slModus: true });
      wissen = M.normalisiereFaehigkeitenListe(z.wissen, { slModus: true });
      soziales = M.normalisiereFaehigkeitenListe(z.soziales, { slModus: true });
    } else {
      const synth = M.synthetisiereAusLegacyBegabungen(z, presetId, { typ });
      if (synth) {
        handeln = synth.handeln;
        wissen = synth.wissen;
        soziales = synth.soziales;
      }
    }

    if (erlaubt.size) {
      const filter = (arr) =>
        arr.filter((f) => {
          if (!erlaubt.has(f.name)) {
            return false;
          }
          return kategorieFuerSkillName(f.name, preset) !== null;
        });
      handeln = filter(handeln);
      wissen = filter(wissen);
      soziales = filter(soziales);
    }

    z.presetId = preset ? preset.htbahPresetId || presetId : presetId;
    z.handeln = handeln;
    z.wissen = wissen;
    z.soziales = soziales;
    return z;
  };

  M.gesamtPunkte = function gesamtPunkte(zeile) {
    const s = M.summenAusEntitaet(zeile);
    return s.handeln + s.wissen + s.soziales;
  };
})();
