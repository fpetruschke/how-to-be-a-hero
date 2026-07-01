/**
 * Charaktervorlagen: Validierung, Epochen-Mapping, Anwendung auf Charakterobjekte.
 */
window.HTBAH_CHARAKTERVORLAGEN_MODEL = window.HTBAH_CHARAKTERVORLAGEN_MODEL || {};

(function () {
  const M = window.HTBAH_CHARAKTERVORLAGEN_MODEL;
  const KATEGORIEN = ['handeln', 'wissen', 'soziales'];

  M.EPOCHEN = Object.freeze([
    {
      id: 'mittelalter-fantasy',
      label: 'Mittelalter/Fantasy',
      presetId: 'htbah-mittelalter-fantasy',
    },
    {
      id: 'gegenwart',
      label: 'Gegenwart',
      presetId: 'htbah-gegenwart',
      legacyPresetIds: ['htbah-zombie-apokalypse'],
    },
    {
      id: 'scifi',
      label: 'Sci-Fi',
      presetId: 'htbah-scifi',
    },
  ]);

  M.presetIdFuerEpoche = function presetIdFuerEpoche(epocheId) {
    const ep = M.EPOCHEN.find((e) => e.id === epocheId);
    return ep ? ep.presetId : '';
  };

  M.epocheFuerPresetId = function epocheFuerPresetId(presetId) {
    const pid = typeof presetId === 'string' ? presetId.trim() : '';
    if (!pid) {
      return '';
    }
    const ep = M.EPOCHEN.find(
      (e) =>
        e.presetId === pid ||
        (Array.isArray(e.legacyPresetIds) && e.legacyPresetIds.includes(pid)),
    );
    return ep ? ep.id : '';
  };

  M.findeStandardPreset = function findeStandardPreset(presetId) {
    const liste = window.HTBAH_STANDARD_FAEHIGKEITEN_PRESETS;
    if (!Array.isArray(liste)) {
      return null;
    }
    const pid = typeof presetId === 'string' ? presetId.trim() : '';
    return (
      liste.find((p) => p && p.htbahPresetId === pid) ||
      liste.find(
        (p) =>
          p &&
          Array.isArray(p.legacyPresetIds) &&
          p.legacyPresetIds.includes(pid),
      ) ||
      null
    );
  };

  M.skillNamenAusPreset = function skillNamenAusPreset(preset) {
    const namen = new Set();
    if (!preset || typeof preset !== 'object') {
      return namen;
    }
    for (const kat of KATEGORIEN) {
      const arr = Array.isArray(preset[kat]) ? preset[kat] : [];
      arr.forEach((e) => {
        const n = e && typeof e.name === 'string' ? e.name.trim() : '';
        if (n) {
          namen.add(n);
        }
      });
    }
    return namen;
  };

  M.summeFaehigkeiten = function summeFaehigkeiten(vorlage, kategorie) {
    const arr = Array.isArray(vorlage && vorlage[kategorie]) ? vorlage[kategorie] : [];
    return arr.reduce((s, e) => s + (Number(e && e.value) || 0), 0);
  };

  M.summenAusVorlage = function summenAusVorlage(vorlage) {
    return {
      handeln: M.summeFaehigkeiten(vorlage, 'handeln'),
      wissen: M.summeFaehigkeiten(vorlage, 'wissen'),
      soziales: M.summeFaehigkeiten(vorlage, 'soziales'),
    };
  };

  M.begabungenAusVorlage = function begabungenAusVorlage(vorlage) {
    const s = M.summenAusVorlage(vorlage);
    const b = (v) => Math.round(Number(v) / 10);
    return {
      handeln: b(s.handeln),
      wissen: b(s.wissen),
      soziales: b(s.soziales),
    };
  };

  M.normalisiereFaehigkeitenListe = function normalisiereFaehigkeitenListe(roh) {
    if (!Array.isArray(roh)) {
      return [];
    }
    const out = [];
    for (const eintrag of roh) {
      if (!eintrag || typeof eintrag !== 'object') {
        continue;
      }
      const name = typeof eintrag.name === 'string' ? eintrag.name.trim() : '';
      if (!name) {
        continue;
      }
      const value = Number(eintrag.value);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        continue;
      }
      out.push({ name, value });
    }
    return out;
  };

  M.normalisiereInventarListe = function normalisiereInventarListe(roh) {
    const CM = window.HTBAH_CHARAKTER_MODEL;
    if (!CM || typeof CM.inventarEintragNachTypBereinigen !== 'function') {
      return [];
    }
    if (!Array.isArray(roh)) {
      return [];
    }
    return roh
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const typ = ['rustung', 'waffe', 'gegenstand'].includes(item.typ)
          ? item.typ
          : 'gegenstand';
        const id =
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim()
            : CM.neueInventarId
              ? CM.neueInventarId()
              : `inv-vorlage-${index}`;
        return CM.inventarEintragNachTypBereinigen({
          id,
          name: typeof item.name === 'string' ? item.name.trim() : '',
          typ,
          beschreibungHtml:
            typeof item.beschreibungHtml === 'string' ? item.beschreibungHtml : '',
          rustwert: item.rustwert,
          schadenswertNahkampf: item.schadenswertNahkampf,
          schadenswertFernkampf: item.schadenswertFernkampf,
        });
      })
      .filter(Boolean);
  };

  M.normalisiereVorNachteileAusRoh = function normalisiereVorNachteileAusRoh(roh) {
    const CM = window.HTBAH_CHARAKTER_MODEL;
    if (!CM || typeof CM.vorNachteileAusQuelle !== 'function') {
      return { vorteile: [], nachteile: [] };
    }
    return CM.vorNachteileAusQuelle(roh);
  };

  /** @deprecated Nutze normalisiereVorNachteileAusRoh. */
  M.normalisiereVorNachteilePaare = function normalisiereVorNachteilePaare(roh) {
    return M.normalisiereVorNachteileAusRoh({ vorNachteilePaare: roh }).vorteile;
  };

  /**
   * @returns {{ ok: true, vorlage: object } | { ok: false, fehler: string }}
   */
  M.validiereVorlage = function validiereVorlage(roh) {
    if (!roh || typeof roh !== 'object') {
      return { ok: false, fehler: 'Keine Vorlage.' };
    }
    const id = typeof roh.id === 'string' ? roh.id.trim() : '';
    const name = typeof roh.name === 'string' ? roh.name.trim() : '';
    const epoche = typeof roh.epoche === 'string' ? roh.epoche.trim() : '';
    const presetId =
      typeof roh.presetId === 'string' && roh.presetId.trim()
        ? roh.presetId.trim()
        : M.presetIdFuerEpoche(epoche);
    if (!id || !name || !epoche) {
      return { ok: false, fehler: 'Vorlage braucht id, name und epoche.' };
    }
    const preset = M.findeStandardPreset(presetId);
    if (!preset) {
      return { ok: false, fehler: `Unbekanntes Preset: ${presetId}` };
    }
    const erlaubt = M.skillNamenAusPreset(preset);
    const vorlage = {
      htbahVorlageVersion: 1,
      id,
      epoche,
      presetId: preset.htbahPresetId,
      name,
      untertitel: typeof roh.untertitel === 'string' ? roh.untertitel.trim() : '',
      beruf: typeof roh.beruf === 'string' ? roh.beruf.trim() : '',
      geschlecht: typeof roh.geschlecht === 'string' ? roh.geschlecht.trim() : '',
      alter:
        typeof roh.alter === 'number' && Number.isFinite(roh.alter) && roh.alter >= 0
          ? roh.alter
          : null,
      statur: typeof roh.statur === 'string' ? roh.statur.trim() : '',
      fraktion: typeof roh.fraktion === 'string' ? roh.fraktion.trim() : '',
      glaube: typeof roh.glaube === 'string' ? roh.glaube.trim() : '',
      familienstand: typeof roh.familienstand === 'string' ? roh.familienstand.trim() : '',
      aufenthaltsort: typeof roh.aufenthaltsort === 'string' ? roh.aufenthaltsort.trim() : '',
      kernFaehigkeiten: Array.isArray(roh.kernFaehigkeiten)
        ? roh.kernFaehigkeiten.map((k) => String(k).trim()).filter(Boolean)
        : [],
      handeln: M.normalisiereFaehigkeitenListe(roh.handeln),
      wissen: M.normalisiereFaehigkeitenListe(roh.wissen),
      soziales: M.normalisiereFaehigkeitenListe(roh.soziales),
      inventar: M.normalisiereInventarListe(roh.inventar),
      ...M.normalisiereVorNachteileAusRoh(roh),
    };
    for (const kat of KATEGORIEN) {
      for (const f of vorlage[kat]) {
        if (!erlaubt.has(f.name)) {
          return {
            ok: false,
            fehler: `Fähigkeit „${f.name}“ ist nicht im Preset „${preset.name}“.`,
          };
        }
      }
    }
    const gesamt =
      M.summeFaehigkeiten(vorlage, 'handeln') +
      M.summeFaehigkeiten(vorlage, 'wissen') +
      M.summeFaehigkeiten(vorlage, 'soziales');
    const CM = window.HTBAH_CHARAKTER_MODEL;
    const budget =
      CM && typeof CM.faehigkeitspunkteBudgetAusCharakter === 'function'
        ? CM.faehigkeitspunkteBudgetAusCharakter(vorlage)
        : 400;
    if (gesamt > budget) {
      return {
        ok: false,
        fehler: `Zu viele Fähigkeitspunkte (${gesamt} / ${budget}).`,
      };
    }
    if (gesamt < budget) {
      return {
        ok: false,
        fehler: `Zu wenige Fähigkeitspunkte (${gesamt} / ${budget}). Vorlagen sollen voll ausgeschöpft sein.`,
      };
    }
    return { ok: true, vorlage };
  };

  M.stammdatenAusVorlageUebernehmen = function stammdatenAusVorlageUebernehmen(basis, vorlage) {
    if (!basis || !vorlage || typeof vorlage !== 'object') {
      return;
    }
    if (vorlage.name) {
      basis.name = vorlage.name;
    }
    const textFelder = [
      'beruf',
      'geschlecht',
      'statur',
      'fraktion',
      'glaube',
      'familienstand',
      'aufenthaltsort',
    ];
    for (const feld of textFelder) {
      if (typeof vorlage[feld] === 'string' && vorlage[feld].trim()) {
        basis[feld] = vorlage[feld].trim();
      }
    }
    const alter = Number(vorlage.alter);
    if (Number.isFinite(alter) && alter >= 0) {
      basis.alter = alter;
    }
  };

  M.vorlageAufCharakterAnwenden = function vorlageAufCharakterAnwenden(charakter, vorlage) {
    const CM = window.HTBAH_CHARAKTER_MODEL;
    const basis = CM.charakterMitDefaults(charakter);
    M.stammdatenAusVorlageUebernehmen(basis, vorlage);
    basis.handeln = JSON.parse(JSON.stringify(vorlage.handeln));
    basis.wissen = JSON.parse(JSON.stringify(vorlage.wissen));
    basis.soziales = JSON.parse(JSON.stringify(vorlage.soziales));
    basis.inventar = JSON.parse(JSON.stringify(vorlage.inventar));
    const vn = M.normalisiereVorNachteileAusRoh(vorlage);
    basis.vorteile = JSON.parse(JSON.stringify(vn.vorteile));
    basis.nachteile = JSON.parse(JSON.stringify(vn.nachteile));
    basis.geistesblitzVerbleibend = null;
    return basis;
  };

  /** Session Zero: nur Fähigkeiten; Inventar optional. Stammdaten, Notizen und Vor-/Nachteile bleiben unberührt. */
  M.vorlageSessionZeroAufCharakterAnwenden = function vorlageSessionZeroAufCharakterAnwenden(
    charakter,
    vorlage,
    optionen = {},
  ) {
    const CM = window.HTBAH_CHARAKTER_MODEL;
    const basis = CM.charakterMitDefaults(charakter);
    basis.handeln = JSON.parse(JSON.stringify(vorlage.handeln));
    basis.wissen = JSON.parse(JSON.stringify(vorlage.wissen));
    basis.soziales = JSON.parse(JSON.stringify(vorlage.soziales));
    if (optionen.inventarUeberschreiben) {
      basis.inventar = JSON.parse(JSON.stringify(vorlage.inventar));
    }
    basis.geistesblitzVerbleibend = null;
    return basis;
  };

  M.faehigkeitenListenHtml = function faehigkeitenListenHtml(vorlage) {
    const kern = new Set(
      Array.isArray(vorlage.kernFaehigkeiten) ? vorlage.kernFaehigkeiten : [],
    );
    const zeilen = (kat, label) => {
      const arr = Array.isArray(vorlage[kat]) ? vorlage[kat] : [];
      if (!arr.length) {
        return '';
      }
      const kernHtml = arr
        .filter((f) => kern.has(f.name))
        .map((f) => `<li>${f.name} (${f.value})</li>`)
        .join('');
      const restHtml = arr
        .filter((f) => !kern.has(f.name))
        .map((f) => `<li>${f.name} (${f.value})</li>`)
        .join('');
      let html = '';
      if (kernHtml) {
        html += `<h3>Kern-Fähigkeiten (${label})</h3><ul>${kernHtml}</ul>`;
      }
      if (restHtml) {
        html += `<h3>Weitere Fähigkeiten (${label})</h3><ul>${restHtml}</ul>`;
      }
      return html;
    };
    const beg = M.begabungenAusVorlage(vorlage);
    const begHtml = `<h3>Begabungen</h3><ul><li>Handeln (${beg.handeln})</li><li>Wissen (${beg.wissen})</li><li>Soziales (${beg.soziales})</li></ul><p><em>Geistesblitzpunkte werden in der App automatisch aus den Begabungen ermittelt.</em></p>`;
    const inv = (Array.isArray(vorlage.inventar) ? vorlage.inventar : [])
      .map((i) => `<li>${i.name || 'Gegenstand'}</li>`)
      .join('');
    const invHtml = inv ? `<h3>Inventar</h3><ul>${inv}</ul>` : '';
    return (
      invHtml +
      zeilen('handeln', 'Handeln') +
      zeilen('wissen', 'Wissen') +
      zeilen('soziales', 'Soziales') +
      begHtml
    );
  };
})();
