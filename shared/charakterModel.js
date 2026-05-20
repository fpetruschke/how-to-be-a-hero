/**
 * Gemeinsames Charakterdatenmodell (Import/Export, Spielleiter, Spieler).
 * Wird vor den Seiten-Skripten geladen.
 */
window.HTBAH_CHARAKTER_MODEL = window.HTBAH_CHARAKTER_MODEL || {};

(function () {
  const M = window.HTBAH_CHARAKTER_MODEL;

  M.neueInventarId = function neueInventarId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  M.inventarEintragAusGegenstand = function inventarEintragAusGegenstand(gegenstand) {
    const g = gegenstand && typeof gegenstand === 'object' ? gegenstand : {};
    const typ = g.istWaffe ? 'waffe' : 'gegenstand';
    return M.inventarEintragNachTypBereinigen({
      id: M.neueInventarId(),
      name: typeof g.name === 'string' ? g.name.trim() : '',
      typ,
      beschreibungHtml: typeof g.beschreibungHtml === 'string' ? g.beschreibungHtml : '',
      schadenswertNahkampf: g.schadenswertNahkampf,
      schadenswertFernkampf: g.schadenswertFernkampf,
      gegenstandId: typeof g.id === 'string' ? g.id.trim() : '',
    });
  };

  M.summenAusCharakter = function summenAusCharakter(charakter) {
    const sum = (kat) =>
      (Array.isArray(charakter && charakter[kat]) ? charakter[kat] : []).reduce(
        (s, e) => s + (Number(e && e.value) || 0),
        0,
      );
    return {
      handeln: sum('handeln'),
      wissen: sum('wissen'),
      soziales: sum('soziales'),
    };
  };

  M.begabungenAusSummen = function begabungenAusSummen(summen) {
    const b = (v) => Math.round(Number(v) / 10);
    return {
      handeln: b(summen.handeln),
      wissen: b(summen.wissen),
      soziales: b(summen.soziales),
    };
  };

  M.inventarEintragNachTypBereinigen = function inventarEintragNachTypBereinigen(e) {
    const t = ['rustung', 'waffe', 'gegenstand'].includes(e.typ) ? e.typ : 'gegenstand';
    e.typ = t;
    if (t === 'gegenstand') {
      delete e.rustwert;
      delete e.schadenswert;
      delete e.kampfart;
      delete e.schadenswertNahkampf;
      delete e.schadenswertFernkampf;
    } else if (t === 'rustung') {
      e.rustwert =
        e.rustwert == null || e.rustwert === ''
          ? ''
          : String(e.rustwert).trim();
      delete e.schadenswert;
      delete e.kampfart;
      delete e.schadenswertNahkampf;
      delete e.schadenswertFernkampf;
    } else if (t === 'waffe') {
      e.schadenswertNahkampf =
        e.schadenswertNahkampf == null || e.schadenswertNahkampf === ''
          ? ''
          : String(e.schadenswertNahkampf).trim();
      e.schadenswertFernkampf =
        e.schadenswertFernkampf == null || e.schadenswertFernkampf === ''
          ? ''
          : String(e.schadenswertFernkampf).trim();
      delete e.schadenswert;
      delete e.kampfart;
      delete e.rustwert;
    }
    e.gegenstandId = typeof e.gegenstandId === 'string' ? e.gegenstandId.trim() : '';
    return e;
  };

  M.inventarWaffenAusEntitaet = function inventarWaffenAusEntitaet(zeile, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const prefix = typeof o.prefix === 'string' && o.prefix ? o.prefix : 'entitaet';
    const inventar = [];
    (Array.isArray(zeile && zeile.inventar) ? zeile.inventar : []).forEach((item, index) => {
      if (!item || item.typ !== 'waffe') {
        return;
      }
      const name = String(item.name || '').trim() || 'Waffe';
      inventar.push({
        id: item.id || `${prefix}-waffe-${index}`,
        typ: 'waffe',
        name,
        schadenswertNahkampf: item.schadenswertNahkampf || '',
        schadenswertFernkampf: item.schadenswertFernkampf || '',
      });
    });
    if (o.waffenloser) {
      const wl = String(zeile && zeile.waffenloserKampf ? zeile.waffenloserKampf : '').trim();
      if (wl) {
        inventar.push({
          id: `${prefix}-waffenlos`,
          typ: 'waffe',
          name: 'Waffenlos (Fäuste, Tritte)',
          schadenswertNahkampf: wl,
          schadenswertFernkampf: '',
        });
      }
    }
    return inventar;
  };

  M.entitaetInventarWaffenAnzeigeText = function entitaetInventarWaffenAnzeigeText(zeile, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const waffen = M.inventarWaffenAusEntitaet(zeile, o);
    if (!waffen.length) {
      return '—';
    }
    return waffen
      .map((waffe) => {
        const nah = String(waffe.schadenswertNahkampf || '').trim();
        const fern = String(waffe.schadenswertFernkampf || '').trim();
        const teile = [];
        if (nah) {
          teile.push(`NK ${nah}`);
        }
        if (fern) {
          teile.push(`FK ${fern}`);
        }
        const schaden = teile.length ? ` (${teile.join(' · ')})` : '';
        return `${waffe.name}${schaden}`;
      })
      .join(' · ');
  };

  M.migriereLegacyKampfwerteNachInventar = function migriereLegacyKampfwerteNachInventar(zeile, opts) {
    if (!zeile || typeof zeile !== 'object') {
      return zeile;
    }
    const o = opts && typeof opts === 'object' ? opts : {};
    const inventar = Array.isArray(zeile.inventar)
      ? zeile.inventar.map((item) => M.inventarEintragNachTypBereinigen({ ...item }))
      : [];
    const hatWaffe = inventar.some((item) => item && item.typ === 'waffe');
    const waffeName = String(zeile.waffe || '').trim();
    const nah = String(zeile.schadenswertNahkampf || '').trim();
    const fern = String(zeile.schadenswertFernkampf || '').trim();
    if (!hatWaffe && (waffeName || nah || fern)) {
      inventar.push(
        M.inventarEintragNachTypBereinigen({
          id: M.neueInventarId(),
          typ: 'waffe',
          name: waffeName || 'Waffe',
          beschreibungHtml: '',
          schadenswertNahkampf: nah,
          schadenswertFernkampf: fern,
        }),
      );
    }
    if (o.npc) {
      const wl = String(zeile.waffenloserKampf || '').trim();
      const hatWl = inventar.some(
        (item) =>
          item &&
          item.typ === 'waffe' &&
          /waffenlos|fäuste|tritte/i.test(String(item.name || '')),
      );
      if (wl && !hatWl) {
        inventar.push(
          M.inventarEintragNachTypBereinigen({
            id: M.neueInventarId(),
            typ: 'waffe',
            name: 'Waffenlos (Fäuste, Tritte)',
            beschreibungHtml: '',
            schadenswertNahkampf: wl,
            schadenswertFernkampf: '',
          }),
        );
      }
    }
    const migriert = { ...zeile, inventar };
    delete migriert.waffe;
    delete migriert.schadenswertNahkampf;
    delete migriert.schadenswertFernkampf;
    if (o.bestie) {
      delete migriert.angriff;
      delete migriert.verteidigung;
    }
    return migriert;
  };

  M.inventarAusQuelle = function inventarAusQuelle(quelle) {
    if (Array.isArray(quelle.inventar) && quelle.inventar.length) {
      return quelle.inventar.map((item, index) => {
        const roh = {
          id: item.id || `inv-mig-${index}-${Date.now()}`,
          name: typeof item.name === 'string' ? item.name : '',
          beschreibungHtml:
            typeof item.beschreibungHtml === 'string' ? item.beschreibungHtml : '',
          typ: item.typ,
          rustwert: item.rustwert,
          schadenswert: item.schadenswert,
          kampfart: item.kampfart,
          schadenswertNahkampf: item.schadenswertNahkampf,
          schadenswertFernkampf: item.schadenswertFernkampf,
          gegenstandId: item.gegenstandId,
        };
        return M.inventarEintragNachTypBereinigen(roh);
      });
    }
    const alt = quelle.inventarHtml;
    if (typeof alt === 'string' && alt.trim()) {
      return [
        M.inventarEintragNachTypBereinigen({
          id: M.neueInventarId(),
          name: '',
          beschreibungHtml: alt,
          typ: 'gegenstand',
        }),
      ];
    }
    return [];
  };

  M.leererCharakter = function leererCharakter() {
    return {
      name: '',
      geschlecht: '',
      alter: null,
      lebenspunkte: 100,
      initiative: '',
      aufenthaltsort: '',
      fraktion: '',
      fraktionen: [],
      statur: '',
      glaube: '',
      beruf: '',
      familienstand: '',
      inventar: [],
      vorNachteilePaare: [],
      journalHtml: '',
      sicherheitsmechanismen: {
        tabuHtml: '',
        schleierHtml: '',
      },
      handeln: [],
      wissen: [],
      soziales: [],
      geistesblitzVerbleibend: null,
      kampfZustand: 'vital',
      lpStatusTot: false,
      lpBewusstlosAusgeblendet: false,
      lpMassenschadenBewusstlos: false,
      aktivesSpielBegonnen: false,
    };
  };

  /** URL-Suffix für Standard-Reiter (session-zero | aktives-spiel). */
  M.charakterStandardTabSuffix = function charakterStandardTabSuffix(charakter) {
    const c = charakter && typeof charakter === 'object' ? charakter : {};
    return c.aktivesSpielBegonnen ? 'aktives-spiel' : 'session-zero';
  };

  M.charakterMitDefaults = function charakterMitDefaults(gespeicherterCharakter) {
    const basis = M.leererCharakter();
    const quelle =
      gespeicherterCharakter && typeof gespeicherterCharakter === 'object'
        ? gespeicherterCharakter
        : {};

    const zusammengefuehrt = { ...basis, ...quelle };
    delete zusammengefuehrt.inventarHtml;
    delete zusammengefuehrt.religion;

    const gb = quelle.geistesblitzVerbleibend;
    const geistesblitzVerbleibend =
      gb &&
      typeof gb === 'object' &&
      ['handeln', 'wissen', 'soziales'].every((k) => typeof gb[k] === 'number')
        ? {
            handeln: gb.handeln,
            wissen: gb.wissen,
            soziales: gb.soziales,
          }
        : null;

    const glaubeAusQuelle =
      typeof quelle.glaube === 'string'
        ? quelle.glaube
        : typeof quelle.religion === 'string'
          ? quelle.religion
          : typeof zusammengefuehrt.glaube === 'string'
            ? zusammengefuehrt.glaube
            : '';

    const sicherheitsmechanismenQuelle =
      quelle.sicherheitsmechanismen && typeof quelle.sicherheitsmechanismen === 'object'
        ? quelle.sicherheitsmechanismen
        : {};

    return {
      ...zusammengefuehrt,
      glaube: glaubeAusQuelle,
      aufenthaltsort: typeof quelle.aufenthaltsort === 'string' ? quelle.aufenthaltsort : '',
      fraktion: typeof quelle.fraktion === 'string' ? quelle.fraktion : '',
      fraktionen: Array.isArray(quelle.fraktionen)
        ? quelle.fraktionen.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean)
        : typeof quelle.fraktion === 'string' && quelle.fraktion.trim()
          ? [quelle.fraktion.trim()]
          : [],
      handeln: Array.isArray(quelle.handeln) ? quelle.handeln : [],
      wissen: Array.isArray(quelle.wissen) ? quelle.wissen : [],
      soziales: Array.isArray(quelle.soziales) ? quelle.soziales : [],
      inventar: M.inventarAusQuelle(quelle),
      vorNachteilePaare: Array.isArray(quelle.vorNachteilePaare)
        ? quelle.vorNachteilePaare.map((p, index) => ({
            id:
              typeof p.id === 'string' && p.id
                ? p.id
                : `vn-mig-${index}-${Date.now()}`,
            vorteilHtml: typeof p.vorteilHtml === 'string' ? p.vorteilHtml : '',
            nachteilHtml: typeof p.nachteilHtml === 'string' ? p.nachteilHtml : '',
          }))
        : [],
      sicherheitsmechanismen: {
        tabuHtml:
          typeof sicherheitsmechanismenQuelle.tabuHtml === 'string'
            ? sicherheitsmechanismenQuelle.tabuHtml
            : '',
        schleierHtml:
          typeof sicherheitsmechanismenQuelle.schleierHtml === 'string'
            ? sicherheitsmechanismenQuelle.schleierHtml
            : '',
      },
      geistesblitzVerbleibend,
      kampfZustand:
        typeof quelle.kampfZustand === 'string' && quelle.kampfZustand.trim()
          ? quelle.kampfZustand.trim().toLowerCase()
          : basis.kampfZustand,
      lpStatusTot: Boolean(quelle.lpStatusTot),
      lpBewusstlosAusgeblendet: Boolean(quelle.lpBewusstlosAusgeblendet),
      lpMassenschadenBewusstlos: Boolean(quelle.lpMassenschadenBewusstlos),
      aktivesSpielBegonnen: Boolean(quelle.aktivesSpielBegonnen),
    };
  };
})();
