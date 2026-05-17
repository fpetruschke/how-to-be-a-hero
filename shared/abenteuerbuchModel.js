/**
 * Abenteuerbuch: Reiter mit Name und Quill-HTML pro Kampagne.
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerAbenteuerbuchModel() {
  const M = window.HTBAH_SHARED;

  const DEFAULT_REITER_NAME = 'Übersicht';

  function neueReiterId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalisiereReiter(r) {
    if (!r || typeof r !== 'object') {
      return null;
    }
    const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : neueReiterId();
    let name = typeof r.name === 'string' ? r.name.trim() : '';
    if (!name) {
      name = DEFAULT_REITER_NAME;
    }
    return {
      id,
      name: name.slice(0, 80),
      html: typeof r.html === 'string' ? r.html : '',
    };
  }

  function normalisiereAbenteuerbuch(roh, legacyHtml) {
    let reiter = [];
    let aktiverReiterId = null;

    if (roh && typeof roh === 'object') {
      if (Array.isArray(roh.reiter)) {
        reiter = roh.reiter.map(normalisiereReiter).filter(Boolean);
      }
      if (typeof roh.aktiverReiterId === 'string' && roh.aktiverReiterId.trim()) {
        aktiverReiterId = roh.aktiverReiterId.trim();
      }
    }

    const legacy = typeof legacyHtml === 'string' ? legacyHtml : '';
    if (!reiter.length && legacy) {
      const id = neueReiterId();
      reiter = [{ id, name: DEFAULT_REITER_NAME, html: legacy }];
      aktiverReiterId = id;
    }

    if (!reiter.length) {
      const id = neueReiterId();
      reiter = [{ id, name: DEFAULT_REITER_NAME, html: '' }];
      aktiverReiterId = id;
    }

    if (!aktiverReiterId || !reiter.some((t) => t.id === aktiverReiterId)) {
      aktiverReiterId = reiter[0].id;
    }

    return { reiter, aktiverReiterId };
  }

  function erstelleLeeresAbenteuerbuch() {
    const id = neueReiterId();
    return {
      reiter: [{ id, name: DEFAULT_REITER_NAME, html: '' }],
      aktiverReiterId: id,
    };
  }

  function naechsterStandardReiterName(reiter) {
    const liste = Array.isArray(reiter) ? reiter : [];
    const belegt = new Set(liste.map((t) => String(t.name || '').toLowerCase()));
    let n = liste.length + 1;
    while (belegt.has(`reiter ${n}`.toLowerCase())) {
      n += 1;
    }
    return `Reiter ${n}`;
  }

  function abenteuerbuchAusImportPaket(roh) {
    if (!roh || typeof roh !== 'object') {
      return erstelleLeeresAbenteuerbuch();
    }
    if (roh.abenteuerbuch && typeof roh.abenteuerbuch === 'object') {
      return normalisiereAbenteuerbuch(roh.abenteuerbuch, roh.abenteuerbuchHtml);
    }
    return normalisiereAbenteuerbuch(null, roh.abenteuerbuchHtml);
  }

  function ersterReiterHtml(abenteuerbuch) {
    const norm = normalisiereAbenteuerbuch(abenteuerbuch);
    return norm.reiter[0] ? norm.reiter[0].html : '';
  }

  M.ABENTEUERBUCH_DEFAULT_REITER_NAME = DEFAULT_REITER_NAME;
  M.neueAbenteuerbuchReiterId = neueReiterId;
  M.normalisiereAbenteuerbuch = normalisiereAbenteuerbuch;
  M.erstelleLeeresAbenteuerbuch = erstelleLeeresAbenteuerbuch;
  M.naechsterAbenteuerbuchReiterName = naechsterStandardReiterName;
  M.abenteuerbuchAusImportPaket = abenteuerbuchAusImportPaket;
  M.abenteuerbuchErsterReiterHtml = ersterReiterHtml;
})();
