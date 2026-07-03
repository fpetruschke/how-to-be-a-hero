/**
 * Gemeinsames Charakterdatenmodell (Import/Export, Spielleitung, Charaktere).
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

  M.FAEHIGKEITSPUNKTE_BASIS = 400;

  M.neueVorNachteilZeilenId = function neueVorNachteilZeilenId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `vn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  /** Positiver Punktwert; null = nicht gesetzt (kein Effekt auf das Budget). */
  M.normalisiereVorNachteilPunkte = function normalisiereVorNachteilPunkte(wert) {
    if (wert == null || wert === '') {
      return null;
    }
    const n = Math.round(Number(wert));
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    return n;
  };

  M.vorNachteilBeschreibungAlsHtml = function vorNachteilBeschreibungAlsHtml(roh) {
    if (typeof roh !== 'string') {
      return '';
    }
    const t = roh.trim();
    if (!t) {
      return '';
    }
    if (/<[a-z][\s\S]*>/i.test(t)) {
      return t;
    }
    return `<p>${t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  };

  M.vorNachteilBeschreibungVorschau = function vorNachteilBeschreibungVorschau(html) {
    const t = String(html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return t;
  };

  M.normalisiereVorNachteilZeile = function normalisiereVorNachteilZeile(eintrag, index, praefix) {
    if (!eintrag || typeof eintrag !== 'object') {
      return null;
    }
    const beschreibungHtml = M.vorNachteilBeschreibungAlsHtml(
      typeof eintrag.beschreibungHtml === 'string'
        ? eintrag.beschreibungHtml
        : typeof eintrag.beschreibung === 'string'
          ? eintrag.beschreibung
          : '',
    );
    if (!beschreibungHtml) {
      return null;
    }
    return {
      id:
        typeof eintrag.id === 'string' && eintrag.id.trim()
          ? eintrag.id.trim()
          : `${praefix}-${index}`,
      beschreibungHtml,
      punkte: M.normalisiereVorNachteilPunkte(eintrag.punkte),
    };
  };

  M.normalisiereVorteileListe = function normalisiereVorteileListe(roh) {
    if (!Array.isArray(roh)) {
      return [];
    }
    return roh
      .map((e, index) => M.normalisiereVorNachteilZeile(e, index, 'vorteil'))
      .filter(Boolean);
  };

  M.normalisiereNachteileListe = function normalisiereNachteileListe(roh) {
    if (!Array.isArray(roh)) {
      return [];
    }
    return roh
      .map((e, index) => M.normalisiereVorNachteilZeile(e, index, 'nachteil'))
      .filter(Boolean);
  };

  /** Legacy: vorNachteilePaare → getrennte Listen. */
  M.migriereVorNachteilePaare = function migriereVorNachteilePaare(paare) {
    const vorteile = [];
    const nachteile = [];
    if (!Array.isArray(paare)) {
      return { vorteile, nachteile };
    }
    paare.forEach((paar, index) => {
      if (!paar || typeof paar !== 'object') {
        return;
      }
      const basisId =
        typeof paar.id === 'string' && paar.id.trim() ? paar.id.trim() : `vn-paar-${index}`;
      const vorteilHtml = typeof paar.vorteilHtml === 'string' ? paar.vorteilHtml.trim() : '';
      const nachteilHtml = typeof paar.nachteilHtml === 'string' ? paar.nachteilHtml.trim() : '';
      if (vorteilHtml) {
        vorteile.push({
          id: `${basisId}-v`,
          beschreibungHtml: vorteilHtml,
          punkte: M.normalisiereVorNachteilPunkte(paar.vorteilPunkte),
        });
      }
      if (nachteilHtml) {
        nachteile.push({
          id: `${basisId}-n`,
          beschreibungHtml: nachteilHtml,
          punkte: M.normalisiereVorNachteilPunkte(paar.nachteilPunkte),
        });
      }
    });
    return { vorteile, nachteile };
  };

  M.vorNachteileAusQuelle = function vorNachteileAusQuelle(quelle) {
    const q = quelle && typeof quelle === 'object' ? quelle : {};
    const hatPaare = Array.isArray(q.vorNachteilePaare) && q.vorNachteilePaare.length > 0;
    const hatListen =
      (Array.isArray(q.vorteile) && q.vorteile.length > 0) ||
      (Array.isArray(q.nachteile) && q.nachteile.length > 0);
    if (hatPaare && !hatListen) {
      return M.migriereVorNachteilePaare(q.vorNachteilePaare);
    }
    return {
      vorteile: M.normalisiereVorteileListe(q.vorteile),
      nachteile: M.normalisiereNachteileListe(q.nachteile),
    };
  };

  /**
   * Fähigkeitspunkte-Budget aus Vor-/Nachteilen:
   * 400 − Σ Vorteil-Punkte + Σ Nachteil-Punkte
   * (Vorteile kosten Punkte, Nachteile geben zusätzliche Punkte zum Verteilen).
   */
  M.vorNachteilePunkteAusCharakter = function vorNachteilePunkteAusCharakter(charakter) {
    const q = charakter && typeof charakter === 'object' ? charakter : {};
    let vorteile = Array.isArray(q.vorteile) ? q.vorteile : [];
    let nachteile = Array.isArray(q.nachteile) ? q.nachteile : [];
    if (!vorteile.length && !nachteile.length && Array.isArray(q.vorNachteilePaare) && q.vorNachteilePaare.length) {
      const migriert = M.migriereVorNachteilePaare(q.vorNachteilePaare);
      vorteile = migriert.vorteile;
      nachteile = migriert.nachteile;
    }
    let vorteilSumme = 0;
    let nachteilSumme = 0;
    for (const e of vorteile) {
      const p = M.normalisiereVorNachteilPunkte(e && e.punkte);
      if (p) {
        vorteilSumme += p;
      }
    }
    for (const e of nachteile) {
      const p = M.normalisiereVorNachteilPunkte(e && e.punkte);
      if (p) {
        nachteilSumme += p;
      }
    }
    return { vorteilSumme, nachteilSumme };
  };

  /** @deprecated Nur für Alt-Daten; nutze vorNachteilePunkteAusCharakter. */
  M.vorNachteilePunkteAusPaaren = function vorNachteilePunkteAusPaaren(paare) {
    return M.vorNachteilePunkteAusCharakter({ vorNachteilePaare: paare });
  };

  M.faehigkeitspunkteBudgetAusCharakter = function faehigkeitspunkteBudgetAusCharakter(charakter) {
    const { vorteilSumme, nachteilSumme } = M.vorNachteilePunkteAusCharakter(charakter);
    return M.FAEHIGKEITSPUNKTE_BASIS - vorteilSumme + nachteilSumme;
  };

  M.faehigkeitspunkteGesamtAusCharakter = function faehigkeitspunkteGesamtAusCharakter(charakter) {
    const summen = M.summenAusCharakter(charakter);
    return summen.handeln + summen.wissen + summen.soziales;
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

  M.istInventarWaffenlosEintrag = function istInventarWaffenlosEintrag(item) {
    if (!item || item.typ !== 'waffe') {
      return false;
    }
    return /waffenlos|fäuste|tritte/i.test(String(item.name || ''));
  };

  M.inventarOhneWaffenlosEntraege = function inventarOhneWaffenlosEntraege(inventar) {
    if (!Array.isArray(inventar)) {
      return [];
    }
    return inventar.filter((item) => item && !M.istInventarWaffenlosEintrag(item));
  };

  M.faehigkeitWertAusEntitaet = function faehigkeitWertAusEntitaet(zeile, faehigkeitsName) {
    const name = typeof faehigkeitsName === 'string' ? faehigkeitsName.trim() : '';
    if (!name || !zeile || typeof zeile !== 'object') {
      return 0;
    }
    for (const kat of ['handeln', 'wissen', 'soziales']) {
      const arr = Array.isArray(zeile[kat]) ? zeile[kat] : [];
      const treffer = arr.find((e) => e && String(e.name || '').trim() === name);
      if (treffer) {
        const wert = Math.round(Number(treffer.value));
        return Number.isFinite(wert) && wert > 0 ? wert : 0;
      }
    }
    return 0;
  };

  /** Bonus auf 1W10 (Regelwerk: improvisiert/waffenlos) aus Fähigkeit oder Handeln-Begabung. */
  M.unbewaffnetSchadensbonusAusEntitaet = function unbewaffnetSchadensbonusAusEntitaet(zeile) {
    const nahUnb = M.faehigkeitWertAusEntitaet(zeile, 'Nahkampf (unbewaffnet)');
    if (nahUnb > 0) {
      return { bonus: Math.round(nahUnb / 10), quelle: 'Nahkampf (unbewaffnet)' };
    }
    const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
    const beg =
      EF && typeof EF.begabungHandelnAusEntitaet === 'function'
        ? EF.begabungHandelnAusEntitaet(zeile)
        : Math.round(M.summenAusCharakter(zeile).handeln / 10);
    return { bonus: Math.max(0, Math.round(Number(beg) || 0)), quelle: 'Handeln' };
  };

  M.unbewaffnetSchadenswertTextAusEntitaet = function unbewaffnetSchadenswertTextAusEntitaet(zeile) {
    const { bonus } = M.unbewaffnetSchadensbonusAusEntitaet(zeile);
    return bonus > 0 ? `1W10+${bonus}` : '1W10';
  };

  M.inventarWaffenAusEntitaet = function inventarWaffenAusEntitaet(zeile, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const prefix = typeof o.prefix === 'string' && o.prefix ? o.prefix : 'entitaet';
    const inventar = [];
    M.inventarOhneWaffenlosEntraege(zeile && zeile.inventar).forEach((item, index) => {
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
    return inventar;
  };

  M.inventarHauptwaffeAktualisieren = function inventarHauptwaffeAktualisieren(inventar, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const inv = Array.isArray(inventar) ? inventar.map((item) => ({ ...item })) : [];
    const idx = inv.findIndex((item) => item && item.typ === 'waffe' && !M.istInventarWaffenlosEintrag(item));
    const eintrag = M.inventarEintragNachTypBereinigen({
      id: idx >= 0 ? inv[idx].id : M.neueInventarId(),
      typ: 'waffe',
      name: String(o.name || '').trim() || (idx >= 0 ? inv[idx].name : '') || 'Waffe',
      beschreibungHtml: idx >= 0 ? inv[idx].beschreibungHtml || '' : '',
      schadenswertNahkampf: o.schadenswertNahkampf == null ? '' : String(o.schadenswertNahkampf).trim(),
      schadenswertFernkampf: o.schadenswertFernkampf == null ? '' : String(o.schadenswertFernkampf).trim(),
    });
    if (idx >= 0) {
      inv[idx] = eintrag;
    } else {
      inv.push(eintrag);
    }
    return inv;
  };

  M.inventarTypLabelKurz = function inventarTypLabelKurz(typ) {
    if (typ === 'rustung') {
      return 'Rüstung';
    }
    if (typ === 'waffe') {
      return 'Waffe';
    }
    return 'Gegenstand';
  };

  M.inventarEintragWerteText = function inventarEintragWerteText(eintrag) {
    if (!eintrag || typeof eintrag !== 'object') {
      return '';
    }
    const t = eintrag.typ || 'gegenstand';
    if (t === 'gegenstand') {
      return '';
    }
    if (t === 'rustung') {
      const rw = String(eintrag.rustwert != null ? eintrag.rustwert : '').trim();
      return rw ? `Rüstwert ${rw}` : '';
    }
    if (t === 'waffe') {
      const sdNah = String(
        eintrag.schadenswertNahkampf != null ? eintrag.schadenswertNahkampf : '',
      ).trim();
      const sdFern = String(
        eintrag.schadenswertFernkampf != null ? eintrag.schadenswertFernkampf : '',
      ).trim();
      const teile = [];
      if (sdNah) {
        teile.push(`NK ${sdNah}`);
      }
      if (sdFern) {
        teile.push(`FK ${sdFern}`);
      }
      return teile.join(' · ');
    }
    return '';
  };

  M.entitaetInventarAnzeigeText = function entitaetInventarAnzeigeText(zeile, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    let quelle = zeile;
    if (o.typ === 'npc') {
      quelle = M.migriereLegacyKampfwerteNachInventar(zeile, { npc: true });
    } else if (o.typ === 'bestie') {
      quelle = M.migriereLegacyKampfwerteNachInventar(zeile, { bestie: true });
    } else if (o.typ === 'charakter') {
      const inventar = M.inventarAusQuelle(zeile);
      quelle = { ...zeile, inventar };
    }
    const inventar = M.inventarOhneWaffenlosEntraege(quelle && quelle.inventar);
    if (!inventar.length) {
      return '—';
    }
    return inventar
      .map((item) => {
        const name = String(item.name || '').trim() || '—';
        const typ = M.inventarTypLabelKurz(item.typ);
        const werte = M.inventarEintragWerteText(item);
        return werte ? `${name} (${typ}: ${werte})` : `${name} (${typ})`;
      })
      .join(' · ');
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

  /** Import-only: liest veraltete Entity-Felder (waffe, schadenswert*, waffenloserKampf) und schreibt sie ins Inventar. */
  M.migriereLegacyKampfwerteNachInventar = function migriereLegacyKampfwerteNachInventar(zeile, opts) {
    if (!zeile || typeof zeile !== 'object') {
      return zeile;
    }
    const o = opts && typeof opts === 'object' ? opts : {};
    let inventar = Array.isArray(zeile.inventar)
      ? zeile.inventar.map((item) => M.inventarEintragNachTypBereinigen({ ...item }))
      : [];
    inventar = M.inventarOhneWaffenlosEntraege(inventar);
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
    const migriert = { ...zeile, inventar: M.inventarOhneWaffenlosEntraege(inventar) };
    delete migriert.waffe;
    delete migriert.schadenswertNahkampf;
    delete migriert.schadenswertFernkampf;
    if (o.npc) {
      delete migriert.waffenloserKampf;
    }
    if (o.bestie) {
      delete migriert.angriff;
      delete migriert.verteidigung;
    }
    return migriert;
  };

  M.inventarAusQuelle = function inventarAusQuelle(quelle) {
    if (Array.isArray(quelle.inventar) && quelle.inventar.length) {
      return M.inventarOhneWaffenlosEntraege(
        quelle.inventar.map((item, index) => {
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
      }),
      );
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
      vorteile: [],
      nachteile: [],
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

  /**
   * Standard-Reiter beim Öffnen eines Charakters:
   * „Aktives Spiel“, sobald der Reiter einmal besucht wurde – sonst Session Zero.
   */
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
    delete zusammengefuehrt.vorNachteilePaare;

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

    const vorNachteile = M.vorNachteileAusQuelle(quelle);

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
      vorteile: vorNachteile.vorteile,
      nachteile: vorNachteile.nachteile,
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
