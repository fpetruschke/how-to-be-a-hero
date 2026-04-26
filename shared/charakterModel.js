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

  M.inventarEintragNachTypBereinigen = function inventarEintragNachTypBereinigen(e) {
    const t = ['rustung', 'waffe', 'gegenstand'].includes(e.typ) ? e.typ : 'gegenstand';
    e.typ = t;
    if (t === 'gegenstand') {
      delete e.rustwert;
      delete e.schadenswert;
      delete e.kampfart;
    } else if (t === 'rustung') {
      e.rustwert =
        e.rustwert == null || e.rustwert === ''
          ? ''
          : String(e.rustwert).trim();
      delete e.schadenswert;
      delete e.kampfart;
    } else if (t === 'waffe') {
      e.schadenswert =
        e.schadenswert == null || e.schadenswert === ''
          ? ''
          : String(e.schadenswert).trim();
      e.kampfart = e.kampfart === 'fernkampf' ? 'fernkampf' : 'nahkampf';
      delete e.rustwert;
    }
    return e;
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
      lpStatusTot: false,
      lpBewusstlosAusgeblendet: false,
      lpMassenschadenBewusstlos: false,
    };
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
      lpStatusTot: Boolean(quelle.lpStatusTot),
      lpBewusstlosAusgeblendet: Boolean(quelle.lpBewusstlosAusgeblendet),
      lpMassenschadenBewusstlos: Boolean(quelle.lpMassenschadenBewusstlos),
    };
  };
})();
