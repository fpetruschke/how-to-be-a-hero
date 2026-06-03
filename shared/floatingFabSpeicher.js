/**
 * Positionen der schwebenden FAB-Stacks je Kampagne (nicht Export/Import).
 */
(function () {
  const SPEICHER_KEY = 'htbah_floating_fab_pos';
  const FAB_IDS = Object.freeze(['sicherheits', 'konflikt', 'wuerfelbeutel']);

  function speicherZugriff() {
    return window.HTBAH && window.HTBAH.speicher ? window.HTBAH.speicher : null;
  }

  function normalisierePosition(roh) {
    if (!roh || typeof roh !== 'object') {
      return null;
    }
    if (roh.mode === 'fixed' && typeof roh.left === 'number' && typeof roh.top === 'number') {
      return { mode: 'fixed', left: Math.round(roh.left), top: Math.round(roh.top) };
    }
    return null;
  }

  function begrenzePosition(pos, groesse, viewport) {
    const normalisiert = normalisierePosition(pos);
    if (!normalisiert) {
      return null;
    }
    const vw =
      viewport && typeof viewport.width === 'number' && viewport.width > 0
        ? viewport.width
        : typeof window !== 'undefined'
          ? window.innerWidth
          : 320;
    const vh =
      viewport && typeof viewport.height === 'number' && viewport.height > 0
        ? viewport.height
        : typeof window !== 'undefined'
          ? window.innerHeight
          : 568;
    const w =
      groesse && typeof groesse.width === 'number' && groesse.width > 0 ? groesse.width : 48;
    const h =
      groesse && typeof groesse.height === 'number' && groesse.height > 0 ? groesse.height : 48;
    const pad = 6;
    return {
      mode: 'fixed',
      left: Math.round(
        Math.min(Math.max(pad, normalisiert.left), Math.max(pad, vw - w - pad)),
      ),
      top: Math.round(
        Math.min(Math.max(pad, normalisiert.top), Math.max(pad, vh - h - pad)),
      ),
    };
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

  function normalisiereKampagneEintrag(roh) {
    if (!roh || typeof roh !== 'object') {
      return null;
    }
    const eintrag = {};
    FAB_IDS.forEach((id) => {
      const pos = normalisierePosition(roh[id]);
      if (pos) {
        eintrag[id] = pos;
      }
    });
    return Object.keys(eintrag).length ? eintrag : null;
  }

  function lade(kampagneId, fabId) {
    const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
    const fid = typeof fabId === 'string' && fabId.trim() ? fabId.trim() : '';
    if (!kid || !fid || !FAB_IDS.includes(fid)) {
      return null;
    }
    const map = leseMap();
    const kampagne = normalisiereKampagneEintrag(map[kid]);
    return kampagne ? kampagne[fid] || null : null;
  }

  function speichere(kampagneId, fabId, pos) {
    const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
    const fid = typeof fabId === 'string' && fabId.trim() ? fabId.trim() : '';
    if (!kid || !fid || !FAB_IDS.includes(fid)) {
      return false;
    }
    const map = leseMap();
    const normalisiert = normalisierePosition(pos);
    let kampagne = normalisiereKampagneEintrag(map[kid]) || {};
    if (normalisiert) {
      kampagne[fid] = normalisiert;
      map[kid] = kampagne;
    } else {
      delete kampagne[fid];
      if (Object.keys(kampagne).length) {
        map[kid] = kampagne;
      } else {
        delete map[kid];
      }
    }
    return schreibeMap(map);
  }

  function entferneKampagne(kampagneId) {
    const kid = typeof kampagneId === 'string' && kampagneId.trim() ? kampagneId.trim() : '';
    if (!kid) {
      return;
    }
    const map = leseMap();
    if (!(kid in map)) {
      return;
    }
    delete map[kid];
    schreibeMap(map);
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

  window.HTBAH_FLOATING_FAB_SPEICHER = {
    SPEICHER_KEY,
    FAB_IDS,
    lade,
    speichere,
    entferneKampagne,
    loescheAlle,
    normalisierePosition,
    begrenzePosition,
  };
})();
