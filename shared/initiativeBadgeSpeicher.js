/**
 * Initiative-Badge je Charakter (Spieler, aktives Spiel): Wert + Schließen-Zustand.
 */
(function () {
  const SPEICHER_KEY = 'htbah_initiative_badge';

  function speicherZugriff() {
    return window.HTBAH && window.HTBAH.speicher ? window.HTBAH.speicher : null;
  }

  function leseMap() {
    const s = speicherZugriff();
    if (!s) {
      return {};
    }
    try {
      const roh = s.leseJson(SPEICHER_KEY, null);
      return roh && typeof roh === 'object' && !Array.isArray(roh) ? roh : {};
    } catch {
      return {};
    }
  }

  function schreibeMap(map) {
    const s = speicherZugriff();
    if (!s) {
      return false;
    }
    try {
      if (!map || typeof map !== 'object' || !Object.keys(map).length) {
        s.loescheKey(SPEICHER_KEY);
        return true;
      }
      return !!s.schreibeJson(SPEICHER_KEY, map);
    } catch {
      return false;
    }
  }

  function normalisiereEintrag(roh) {
    if (!roh || typeof roh !== 'object') {
      return null;
    }
    const wert = typeof roh.wert === 'string' ? roh.wert.trim() : '';
    if (!wert) {
      return null;
    }
    return {
      wert,
      geschlossen: !!roh.geschlossen,
    };
  }

  function lade(charakterId) {
    const cid = typeof charakterId === 'string' && charakterId.trim() ? charakterId.trim() : '';
    if (!cid) {
      return null;
    }
    const map = leseMap();
    return normalisiereEintrag(map[cid]);
  }

  function speichere(charakterId, wert, geschlossen) {
    const cid = typeof charakterId === 'string' && charakterId.trim() ? charakterId.trim() : '';
    const ini = typeof wert === 'string' ? wert.trim() : String(wert || '').trim();
    if (!cid || !ini) {
      return entferne(charakterId);
    }
    const map = leseMap();
    map[cid] = { wert: ini, geschlossen: !!geschlossen };
    return schreibeMap(map);
  }

  function entferne(charakterId) {
    const cid = typeof charakterId === 'string' && charakterId.trim() ? charakterId.trim() : '';
    if (!cid) {
      return false;
    }
    const map = leseMap();
    if (!(cid in map)) {
      return true;
    }
    delete map[cid];
    return schreibeMap(map);
  }

  function loescheAlle() {
    const s = speicherZugriff();
    if (!s) {
      return;
    }
    try {
      s.loescheKey(SPEICHER_KEY);
    } catch {
      /* optional */
    }
  }

  window.HTBAH_INITIATIVE_BADGE_SPEICHER = {
    SPEICHER_KEY,
    lade,
    speichere,
    entferne,
    loescheAlle,
  };
})();
