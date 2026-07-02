/**
 * Felddefinitionen für Entitäts-Detailansichten (Zufallstabellen + Spielleitung-PDF).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerEntitaetDetailFelder() {
  const TABLE_TYPE_CONFIG = {
    npc: { label: 'NPC', emoji: '👤' },
    ort: { label: 'Ort', emoji: '🗺️' },
    fraktion: { label: 'Fraktion', emoji: '🏛️' },
    pantheon: { label: 'Gottheit', emoji: '✨' },
    raetsel: { label: 'Rätsel', emoji: '🧩' },
    bestie: { label: 'Bestie', emoji: '🦁' },
    gegenstand: { label: 'Gegenstand', emoji: '📦' },
    kartenobjekt: { label: 'Kartenobjekt', emoji: '🌳' },
    charakter: { label: 'Charakter', emoji: '🧙' },
  };

  function formatPlainValue(val) {
    if (val == null || val === '') {
      return '';
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    if (Array.isArray(val)) {
      return val
        .map((e) => formatPlainValue(e))
        .filter((s) => s && String(s).trim())
        .join(', ');
    }
    if (typeof val === 'object') {
      const name = typeof val.name === 'string' ? val.name.trim() : '';
      if (!name) {
        return '';
      }
      const v = val.value;
      if (v != null && v !== '' && Number.isFinite(Number(v))) {
        return `${name} ${Math.round(Number(v))}`;
      }
      return name;
    }
    return String(val);
  }

  function plain(label, val) {
    return {
      label,
      text: formatPlainValue(val),
      html: null,
    };
  }

  function faehigkeitenModel() {
    return window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
  }

  function faehigkeitenPdfDaten(zeile) {
    const M = faehigkeitenModel();
    if (!M || !zeile || typeof zeile !== 'object') {
      return null;
    }
    const labels = { handeln: 'Handeln', wissen: 'Wissen', soziales: 'Soziales' };
    const summen = M.summenAusEntitaet(zeile);
    const begabungen = M.begabungenAusEntitaet(zeile);
    const arrayFormat = M.istFaehigkeitenArrayFormat(zeile);
    const kategorien = ['handeln', 'wissen', 'soziales'].map((kat) => {
      const faehigkeiten = arrayFormat
        ? M.normalisiereFaehigkeitenListe(zeile[kat] || [], { slModus: true }).filter(
            (f) => f && Number(f.value) > 0,
          )
        : [];
      const begabung = arrayFormat ? begabungen[kat] : M.legacyBegabungAusZeile(zeile, kat);
      return {
        id: kat,
        label: labels[kat],
        begabung,
        summe: summen[kat],
        faehigkeiten,
      };
    });
    return { kategorien, arrayFormat };
  }

  function bereich(titel, felder, spalten) {
    const liste = Array.isArray(felder) ? felder.filter((f) => f && (f.text || f.html)) : [];
    if (!liste.length) {
      return null;
    }
    return {
      titel,
      felder: liste,
      spalten: spalten === 1 ? 1 : 2,
    };
  }

  function rich(label, html) {
    return {
      label,
      text: '',
      html: typeof html === 'string' ? html : '',
    };
  }

  function fraktionOrteListe(row) {
    if (!row || typeof row !== 'object') {
      return [];
    }
    const orte = Array.isArray(row.orte)
      ? row.orte.map((ort) => (typeof ort === 'string' ? ort.trim() : '')).filter(Boolean)
      : [];
    if (orte.length) {
      return orte;
    }
    const legacy = typeof row.aufenthaltsort === 'string' ? row.aufenthaltsort.trim() : '';
    return legacy ? [legacy] : [];
  }

  function fraktionOrteText(row) {
    const orte = fraktionOrteListe(row);
    return orte.length ? orte.join(', ') : '';
  }

  function bereinigeFraktionBeschreibungHtml(html) {
    const inhalt = typeof html === 'string' ? html : '';
    return inhalt.replace(/<p><strong>Art:<\/strong>[\s\S]*?<\/p>/gi, '').trim();
  }

  function bereinigeNpcNotizenHtml(html) {
    const inhalt = typeof html === 'string' ? html : '';
    return inhalt
      .replace(/<p><strong>Geheimnis:<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Lebenspunkte:<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Waffe:<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(
        /<p><strong>Waffenloser Nahkampf \(Fäuste, Tritte\):<\/strong>[\s\S]*?<\/p>/gi,
        '',
      )
      .trim();
  }

  function bereinigeRaetselNotizenHtml(html) {
    const inhalt = typeof html === 'string' ? html : '';
    return inhalt
      .replace(/<p><strong>Schwierigkeit:<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Ergebnis bei gelöstem Rätsel \(Vorschlag\):<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Schwierigkeit:<\/strong>[\s\S]*?Epoche-Stimmung:[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Was könnte die Aufgabe sein\?<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Wie könnte die Aufgabenstellung lauten\?<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Spielleitung:<\/strong>[\s\S]*?<\/p>/gi, '')
      .replace(/<p><strong>Tipp für die Spielleitung:<\/strong>[\s\S]*?<\/p>/gi, '')
      .trim();
  }

  function gegenstandKategorieLabel(kategorie, istWaffe) {
    if (kategorie === 'waffe' || istWaffe) {
      return 'Waffe';
    }
    if (kategorie === 'kleidung') {
      return 'Kleidung';
    }
    return 'Gegenstand';
  }

  function bestieKategorieLabel(kategorie) {
    if (kategorie === 'fantasy_tier') {
      return 'Magisch / Fantasy';
    }
    if (kategorie === 'mutiert') {
      return 'Mutiert';
    }
    if (kategorie === 'monster') {
      return 'Monster';
    }
    return 'Normales Tier';
  }

  function bestieAggressivitaetText(row) {
    const n = row && Number(row.aggressivitaetSkala);
    if (!Number.isFinite(n)) {
      return '—';
    }
    const k = Math.min(10, Math.max(1, Math.round(n)));
    return `${k} / 10`;
  }

  function entitaetInventarWaffenAnzeigeText(zeile, opts) {
    const M = window.HTBAH_CHARAKTER_MODEL;
    if (M && typeof M.entitaetInventarWaffenAnzeigeText === 'function') {
      return M.entitaetInventarWaffenAnzeigeText(zeile, opts);
    }
    return '—';
  }

  function gegenstandWaffenWerteText() {
    return '—';
  }

  function entitaetAnzeigeName(zeile, typ) {
    if (!zeile || typeof zeile !== 'object') {
      return '';
    }
    if (typ === 'raetsel') {
      return String(zeile.titel || zeile.name || '').trim();
    }
    return String(zeile.name || '').trim();
  }

  function mediumIstBild(medium) {
    if (!medium || typeof medium !== 'object') {
      return false;
    }
    if (medium.typ === 'bild') {
      return true;
    }
    if (typeof medium.mimeType === 'string' && medium.mimeType.startsWith('image/')) {
      return true;
    }
    return typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/');
  }

  function featuredBildAusZeile(row) {
    const medien = Array.isArray(row && row.medien) ? row.medien : [];
    const bilder = medien.filter((m) => mediumIstBild(m));
    if (!bilder.length) {
      return null;
    }
    const primaryId = row && typeof row.primaryMediumId === 'string' ? row.primaryMediumId.trim() : '';
    if (primaryId) {
      const gefunden = bilder.find((b) => b.id === primaryId);
      if (gefunden) {
        return gefunden;
      }
    }
    return bilder[0];
  }

  function charakterKompaktFelder(charakter, charakterBild) {
    const z = charakter || {};
    const status =
      window.HTBAH && typeof window.HTBAH.berechneLebenspunkteStatus === 'function'
        ? window.HTBAH.berechneLebenspunkteStatus(z)
        : { tot: false, bewusstlos: false };
    let zustand = 'Vital';
    if (status.tot) {
      zustand = 'Tot';
    } else if (status.bewusstlos) {
      zustand = 'Bewusstlos';
    }
    const fraktionen = Array.isArray(z.fraktionen)
      ? z.fraktionen.filter(Boolean).join(', ')
      : typeof z.fraktion === 'string'
        ? z.fraktion.trim()
        : '';
    const felder = [
      plain('Name', z.name),
      plain('Geschlecht', z.geschlecht),
      plain('Alter', z.alter),
      plain('Beruf', z.beruf),
      plain('Statur', z.statur),
      plain('Lebenspunkte', z.lebenspunkte),
      plain('Initiative', z.initiative),
      plain('Zustand', zustand),
      plain('Aufenthaltsort', z.aufenthaltsort),
      plain('Fraktion(en)', fraktionen),
    ];
    const inventar = Array.isArray(z.inventar) ? z.inventar : [];
    if (inventar.length) {
      const liste = inventar
        .map((e) => {
          const n = String(e && e.name ? e.name : '').trim() || '—';
          const t = String(e && e.typ ? e.typ : 'gegenstand');
          return `${n} (${t})`;
        })
        .join('; ');
      felder.push(plain('Inventar (Überblick)', liste));
    }
    const journal =
      typeof z.journalHtml === 'string' && z.journalHtml.trim() ? z.journalHtml : '';
    if (journal) {
      felder.push(rich('Notizen / Journal', journal));
    }
    const bereiche = [
      bereich('🧾 Stammdaten', [
        plain('Name', z.name),
        plain('Geschlecht', z.geschlecht),
        plain('Alter', z.alter),
        plain('Beruf', z.beruf),
        plain('Statur', z.statur),
      ]),
      bereich('⚔️ Kampf', [
        plain('Lebenspunkte', z.lebenspunkte),
        plain('Initiative', z.initiative),
        plain('Zustand', zustand),
      ]),
      bereich('🧭 Zugehörigkeit', [
        plain('Aufenthaltsort', z.aufenthaltsort),
        plain('Fraktion(en)', fraktionen),
      ]),
      inventar.length
        ? bereich('🎒 Inventar', [
            plain(
              'Gegenstände',
              inventar
                .map((e) => {
                  const n = String(e && e.name ? e.name : '').trim() || '—';
                  const t = String(e && e.typ ? e.typ : 'gegenstand');
                  return `${n} (${t})`;
                })
                .join('; '),
            ),
          ])
        : null,
      journal ? bereich('📝 Notizen', [rich('Journal', journal)], 1) : null,
    ].filter(Boolean);
    return {
      typ: 'charakter',
      titel: entitaetAnzeigeName(z, 'charakter') || 'Charakter',
      emoji: TABLE_TYPE_CONFIG.charakter.emoji,
      bildDataUrl: typeof charakterBild === 'string' && charakterBild.startsWith('data:') ? charakterBild : '',
      layout: 'bereiche',
      bereiche,
      faehigkeiten: faehigkeitenPdfDaten(z),
      felder,
    };
  }

  function npcBereicheFuerPdf(z) {
    return [
      bereich('🧾 Stammdaten', [
        plain('Name', z.name),
        plain('Spitzname', z.spitzname),
        plain('Geschlecht', z.geschlecht),
        plain('Alter', z.alter),
        plain('Familienstand', z.familienstand),
        plain('Beruf', z.beruf),
      ]),
      bereich('🧍 Körper & Merkmale', [plain('Statur', z.statur), plain('Stimme', z.stimme)]),
      bereich('⚔️ Kampfwerte', [
        plain('Lebenspunkte', z.lebenspunkte),
        plain('Waffen (Inventar)', entitaetInventarWaffenAnzeigeText(z)),
        plain('Initiative', z.initiative),
      ]),
      bereich('🧭 Zugehörigkeit & Kontext', [
        plain('Gesinnung', z.gesinnung),
        plain('Glaube', z.glaube),
        plain('Fraktion', z.fraktion),
        plain('Aufenthaltsort', z.aufenthaltsort),
      ]),
      bereich('🎯 Motivation', [plain('Geheimnis', z.geheimnis), plain('Ziel', z.ziel)]),
      bereich('📝 Notizen', [rich('Notizen', bereinigeNpcNotizenHtml(z.notizenHtml))], 1),
    ].filter(Boolean);
  }

  function bestieBereicheFuerPdf(z) {
    return [
      bereich('🧾 Stammdaten', [
        plain('Kategorie', bestieKategorieLabel(z.kategorie)),
        plain('Name', z.name),
      ]),
      bereich('⚔️ Kampfwerte', [
        plain('Lebenspunkte', z.lebenspunkte),
        plain('Waffen (Inventar)', entitaetInventarWaffenAnzeigeText(z)),
        plain('Initiative', z.initiative),
      ]),
      bereich('🐾 Verhalten & Natur', [
        plain('Aggressivität (1–10)', bestieAggressivitaetText(z)),
        plain('Stärken', z.staerke),
        plain('Schwächen', z.schwaeche),
      ]),
      bereich('🌍 Weltbezug', [plain('Aufenthaltsort', z.aufenthaltsort), plain('Geheimnis', z.geheimnis)]),
      bereich('📖 Lebensraum & Legende', [rich('Beschreibung', z.beschreibungHtml)], 1),
    ].filter(Boolean);
  }

  function detailFelderFuerZeile(typ, zeile, optionen) {
    const z = zeile && typeof zeile === 'object' ? zeile : {};
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    if (typ === 'charakter') {
      return charakterKompaktFelder(z, opts.charakterBild);
    }
    let felder = [];
    if (typ === 'ort') {
      felder = [
        plain('Name', z.name),
        plain('Größe', z.groesse),
        plain('Lage', z.lage),
        plain('Zustand', z.zustand),
        rich('Beschreibung / Notizen', z.notizenHtml),
      ];
    } else if (typ === 'fraktion') {
      felder = [
        plain('Art', z.art),
        plain('Name', z.name),
        plain('Orte', fraktionOrteText(z)),
        plain('Ziel', z.ziel),
        plain('Gesinnung / Verhalten', z.gesinnungVerhalten),
        rich('Beschreibung', bereinigeFraktionBeschreibungHtml(z.beschreibungHtml)),
      ];
    } else if (typ === 'npc') {
      felder = [
        plain('Name', z.name),
        plain('Spitzname', z.spitzname),
        plain('Geschlecht', z.geschlecht),
        plain('Alter', z.alter),
        plain('Familienstand', z.familienstand),
        plain('Statur', z.statur),
        plain('Lebenspunkte', z.lebenspunkte),
        plain('Gesinnung', z.gesinnung),
        plain('Glaube', z.glaube),
        plain('Beruf', z.beruf),
        plain('Fraktion', z.fraktion),
        plain('Aufenthaltsort', z.aufenthaltsort),
        plain('Ziel', z.ziel),
        plain('Stimme', z.stimme),
        plain('Waffen (Inventar)', entitaetInventarWaffenAnzeigeText(z)),
        plain('Initiative', z.initiative),
        rich('Notizen', bereinigeNpcNotizenHtml(z.notizenHtml)),
      ];
    } else if (typ === 'gegenstand') {
      felder = [
        plain('Name', z.name),
        plain('Art', gegenstandKategorieLabel(z.kategorie, z.istWaffe)),
        plain('Aufenthaltsort', z.aufenthaltsort),
        rich('Beschreibung', z.beschreibungHtml),
      ];
    } else if (typ === 'kartenobjekt') {
      felder = [
        plain('Name', z.name),
        rich('Beschreibung', z.beschreibungHtml),
      ];
    } else if (typ === 'pantheon') {
      felder = [
        plain('Name', z.name),
        plain('Geschlecht / Darstellung', z.geschlecht),
        plain('Domäne', z.domaene),
        rich('Charakter', z.charakter),
        plain('Stärken', z.staerke),
        plain('Schwächen', z.schwaeche),
        rich('Schutzpatronat', z.schutzpatronat),
        rich('Verlangen / Opfer / Gebote', z.verlangen),
        rich('Mythos: Gaben (Erzähltes)', z.mythosGaben),
        rich('Notizen & Mythos (formatiert)', z.notizenHtml),
      ];
    } else if (typ === 'raetsel') {
      felder = [
        plain('Art', z.art),
        plain('Titel / Stichwort', z.titel),
        plain('Aufenthaltsort', z.aufenthaltsort),
        plain('Gelöst', z.geloest ? 'Ja' : 'Nein'),
        plain('Wie könnte die Aufgabenstellung lauten?', z.aufgabenstellung),
        plain('Ergebnis', z.ergebnis),
        plain('Schwierigkeit', z.schwierigkeit),
        rich('Notizen', bereinigeRaetselNotizenHtml(z.notizenHtml)),
      ];
    } else if (typ === 'bestie') {
      felder = [
        plain('Kategorie', bestieKategorieLabel(z.kategorie)),
        plain('Name', z.name),
        plain('Waffen (Inventar)', entitaetInventarWaffenAnzeigeText(z)),
        plain('Lebenspunkte', z.lebenspunkte),
        plain('Aufenthaltsort', z.aufenthaltsort),
        plain('Initiative', z.initiative),
        plain('Aggressivität (1–10)', bestieAggressivitaetText(z)),
        plain('Stärken', z.staerke),
        plain('Schwächen', z.schwaeche),
        rich('Lebensraum, Lebensweise und Legende', z.beschreibungHtml),
      ];
    }
    const cfg = TABLE_TYPE_CONFIG[typ] || TABLE_TYPE_CONFIG.gegenstand;
    const bild = featuredBildAusZeile(z);
    const basis = {
      typ,
      titel: entitaetAnzeigeName(z, typ) || cfg.label,
      emoji: cfg.emoji,
      bildDataUrl: bild && typeof bild.dataUrl === 'string' ? bild.dataUrl : '',
      felder,
      layout: 'felder',
      bereiche: null,
      faehigkeiten: null,
    };
    if (typ === 'npc') {
      basis.layout = 'bereiche';
      basis.bereiche = npcBereicheFuerPdf(z);
      basis.faehigkeiten = faehigkeitenPdfDaten(z);
    } else if (typ === 'bestie') {
      basis.layout = 'bereiche';
      basis.bereiche = bestieBereicheFuerPdf(z);
      basis.faehigkeiten = faehigkeitenPdfDaten(z);
    }
    return basis;
  }

  window.HTBAH_SHARED.EntitaetDetailFelder = {
    TABLE_TYPE_CONFIG,
    detailFelderFuerZeile,
    charakterKompaktFelder,
    fraktionOrteText,
    fraktionOrteListe,
    bereinigeFraktionBeschreibungHtml,
    bereinigeNpcNotizenHtml,
    bereinigeRaetselNotizenHtml,
    bestieKategorieLabel,
    bestieAggressivitaetText,
    entitaetInventarWaffenAnzeigeText,
    gegenstandWaffenWerteText,
    featuredBildAusZeile,
    mediumIstBild,
    entitaetAnzeigeName,
    formatPlainValue,
    faehigkeitenPdfDaten,
  };
})();
