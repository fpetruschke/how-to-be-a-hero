window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function () {
  const SEITEN = ['helden', 'gegner'];
  const TABS = ['auswahl', 'initiative', 'kampf'];

  function leererKonfliktZustand() {
    return {
      version: 1,
      titel: '',
      heldenLabel: 'Gruppe',
      gegnerLabel: 'Gegner',
      aktiverTab: 'auswahl',
      teilnehmer: [],
    };
  }

  function teilnehmerRef(typ, entityId) {
    const t = typeof typ === 'string' ? typ.trim() : '';
    const id = typeof entityId === 'string' ? entityId.trim() : '';
    if (!t || !id) {
      return '';
    }
    return `${t}:${id}`;
  }

  function parseTeilnehmerRef(ref) {
    const s = typeof ref === 'string' ? ref.trim() : '';
    const idx = s.indexOf(':');
    if (idx <= 0) {
      return null;
    }
    const typ = s.slice(0, idx);
    const entityId = s.slice(idx + 1);
    if (!entityId) {
      return null;
    }
    return { typ, entityId };
  }

  function normalisiereSeite(wert) {
    const s = typeof wert === 'string' ? wert.trim().toLowerCase() : '';
    return SEITEN.includes(s) ? s : 'gegner';
  }

  function normalisiereTab(wert) {
    const s = typeof wert === 'string' ? wert.trim().toLowerCase() : '';
    return TABS.includes(s) ? s : 'auswahl';
  }

  function normalisiereTeilnehmerEintrag(roh) {
    if (!roh || typeof roh !== 'object') {
      return null;
    }
    const typ = typeof roh.typ === 'string' ? roh.typ.trim() : '';
    const entityId = typeof roh.entityId === 'string' ? roh.entityId.trim() : '';
    if (!typ || !entityId) {
      return null;
    }
    if (typ !== 'charakter' && typ !== 'npc' && typ !== 'bestie') {
      return null;
    }
    return {
      typ,
      entityId,
      seite: normalisiereSeite(roh.seite),
    };
  }

  function normalisiereKonfliktZustand(roh) {
    const basis = leererKonfliktZustand();
    if (!roh || typeof roh !== 'object') {
      return basis;
    }
    const teilnehmer = Array.isArray(roh.teilnehmer)
      ? roh.teilnehmer.map(normalisiereTeilnehmerEintrag).filter(Boolean)
      : [];
    const seen = new Set();
    const unique = [];
    teilnehmer.forEach((t) => {
      const key = teilnehmerRef(t.typ, t.entityId);
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(t);
    });
    let heldenLabel =
      typeof roh.heldenLabel === 'string' && roh.heldenLabel.trim()
        ? roh.heldenLabel.trim()
        : basis.heldenLabel;
    if (heldenLabel === 'Helden') {
      heldenLabel = 'Gruppe';
    }
    return {
      version: 1,
      titel: typeof roh.titel === 'string' ? roh.titel.trim() : '',
      heldenLabel,
      gegnerLabel:
        typeof roh.gegnerLabel === 'string' && roh.gegnerLabel.trim()
          ? roh.gegnerLabel.trim()
          : basis.gegnerLabel,
      aktiverTab: normalisiereTab(roh.aktiverTab),
      teilnehmer: unique,
    };
  }

  function normalisiereBegabungswertHandeln(roh) {
    const n = Math.round(Number(roh));
    if (Number.isNaN(n) || n < 0) {
      return 0;
    }
    return Math.min(40, n);
  }

  function begabungHandelnAusCharakter(charakter) {
    if (!charakter || !Array.isArray(charakter.handeln)) {
      return 0;
    }
    const summe = charakter.handeln.reduce(
      (s, eintrag) => s + (Number(eintrag && eintrag.value) || 0),
      0,
    );
    return Math.max(0, Math.round(summe / 10));
  }

  function begabungHandelnFuerEntitaet(typ, payload) {
    if (!payload || typeof payload !== 'object') {
      return 0;
    }
    if (typ === 'charakter') {
      return begabungHandelnAusCharakter(payload);
    }
    return normalisiereBegabungswertHandeln(payload.handeln);
  }

  function normalisiereInitiativeWert(roh, begabungswertHandeln) {
    const txt = typeof roh === 'string' ? roh.trim() : String(roh == null ? '' : roh).trim();
    if (!txt) {
      return '';
    }
    const parsed = Math.round(Number(txt));
    if (Number.isNaN(parsed)) {
      return '';
    }
    const max = Math.max(1, 10 + normalisiereBegabungswertHandeln(begabungswertHandeln));
    return String(Math.max(1, Math.min(max, parsed)));
  }

  function initiativeAlsZahl(wert) {
    const n = Math.round(Number(typeof wert === 'string' ? wert.trim() : wert));
    return Number.isFinite(n) ? n : null;
  }

  function standardSeiteFuerTyp(typ) {
    return typ === 'charakter' ? 'helden' : 'gegner';
  }

  const KATEGORIE_LABELS = {
    handeln: 'Handeln',
    wissen: 'Wissen',
    soziales: 'Soziales',
  };

  function inventarWerteText(eintrag) {
    if (!eintrag || typeof eintrag !== 'object') {
      return '—';
    }
    const t = eintrag.typ || 'gegenstand';
    if (t === 'gegenstand') {
      return '—';
    }
    if (t === 'rustung') {
      const rw = String(eintrag.rustwert != null ? eintrag.rustwert : '').trim();
      return rw ? `Rüstwert ${rw}` : '—';
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
      return teile.length ? teile.join(' · ') : '—';
    }
    return '—';
  }

  function inventarTypLabel(typ) {
    if (typ === 'waffe') {
      return 'Waffe';
    }
    if (typ === 'rustung') {
      return 'Rüstung';
    }
    return 'Gegenstand';
  }

  function baueKonfliktKampfHandelnUebersicht(typ, payload) {
    const leer = { kategorien: [], kampfZeilen: [], inventarZeilen: [] };
    if (!payload || typeof payload !== 'object') {
      return leer;
    }
    const M = window.HTBAH_CHARAKTER_MODEL;
    const kategorien = [];
    const kampfZeilen = [];
    const inventarZeilen = [];

    if (typ === 'charakter' && M && typeof M.summenAusCharakter === 'function') {
      const summen = M.summenAusCharakter(payload);
      const begabungen =
        typeof M.begabungenAusSummen === 'function'
          ? M.begabungenAusSummen(summen)
          : { handeln: 0, wissen: 0, soziales: 0 };
      const gb = payload.geistesblitzVerbleibend || {};
      ['handeln', 'wissen', 'soziales'].forEach((kat) => {
        const b = begabungen[kat] || 0;
        const faehigkeiten = (Array.isArray(payload[kat]) ? payload[kat] : [])
          .map((f) => {
            const basis = Math.round(Number(f && f.value) || 0);
            if (basis <= 0) {
              return null;
            }
            const name = typeof f.name === 'string' ? f.name.trim() : '';
            return {
              name: name || '—',
              basis,
              effektiv: Math.min(100, basis + b),
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name, 'de'));
        kategorien.push({
          id: kat,
          label: KATEGORIE_LABELS[kat] || kat,
          summe: summen[kat] || 0,
          begabung: b,
          gbVerbleibend: Number.isFinite(Number(gb[kat])) ? Number(gb[kat]) : null,
          gbMax: Math.round(b),
          faehigkeiten,
        });
      });
      if (M && typeof M.entitaetInventarWaffenAnzeigeText === 'function') {
        const waffen = M.entitaetInventarWaffenAnzeigeText(payload, { prefix: 'charakter' });
        if (waffen && waffen !== '—') {
          kampfZeilen.push({ label: 'Waffen', wert: waffen });
        }
      }
    } else if (typ === 'npc' || typ === 'bestie') {
      const h = normalisiereBegabungswertHandeln(payload.handeln);
      const w = normalisiereBegabungswertHandeln(payload.wissen);
      const s = normalisiereBegabungswertHandeln(payload.soziales);
      kategorien.push({
        id: 'begabungen',
        label: 'Begabungen',
        begabungenKompakt: { handeln: h, wissen: w, soziales: s },
        faehigkeiten: [],
      });
      if (M && typeof M.entitaetInventarWaffenAnzeigeText === 'function') {
        const waffen = M.entitaetInventarWaffenAnzeigeText(payload, {
          prefix: typ,
          waffenloser: typ === 'npc',
        });
        if (waffen && waffen !== '—') {
          kampfZeilen.push({ label: 'Waffen & Angriff', wert: waffen });
        }
      }
      const nah = String(payload.schadenswertNahkampf || '').trim();
      const fern = String(payload.schadenswertFernkampf || '').trim();
      if ((nah || fern) && !kampfZeilen.length) {
        const teile = [];
        if (nah) {
          teile.push(`NK ${nah}`);
        }
        if (fern) {
          teile.push(`FK ${fern}`);
        }
        kampfZeilen.push({ label: 'Schaden', wert: teile.join(' · ') });
      }
      if (typ === 'npc') {
        const wl = String(payload.waffenloserKampf || '').trim();
        if (wl && !kampfZeilen.some((z) => z.wert.includes(wl))) {
          kampfZeilen.push({ label: 'Waffenlos', wert: wl });
        }
      }
    }

    (Array.isArray(payload.inventar) ? payload.inventar : []).forEach((item) => {
      if (!item || typeof item !== 'object') {
        return;
      }
      const name = String(item.name || '').trim() || '—';
      inventarZeilen.push({
        name,
        typ: inventarTypLabel(item.typ),
        werte: inventarWerteText(item),
      });
    });

    return { kategorien, kampfZeilen, inventarZeilen };
  }

  window.HTBAH_SHARED.KonfliktModel = {
    SEITEN,
    TABS,
    leererKonfliktZustand,
    teilnehmerRef,
    parseTeilnehmerRef,
    normalisiereKonfliktZustand,
    normalisiereSeite,
    normalisiereTab,
    normalisiereTeilnehmerEintrag,
    normalisiereBegabungswertHandeln,
    begabungHandelnAusCharakter,
    begabungHandelnFuerEntitaet,
    normalisiereInitiativeWert,
    initiativeAlsZahl,
    standardSeiteFuerTyp,
    baueKonfliktKampfHandelnUebersicht,
  };
})();
