window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerTokensEffekteExport() {
  'use strict';

  const SPIEL = window.HTBAH_SHARED.SpielmattenExport;
  const EKI = window.HTBAH_SHARED.EntityKartenIcon;
  const ERM = window.HTBAH_SHARED.EffektRahmenModel;
  const DEFAULT_DPI = (SPIEL && SPIEL.DEFAULT_DPI) || 150;
  const REFERENZ_TOKEN_MM = 25;
  const MIN_TOKEN_RENDER_PX = 200;
  const MAX_EXPORT_DPI = 600;
  const MAX_SUPERSAMPLE_FAKTOR = 3;
  const NAME_FONT_STACK =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const EMOJI_FONT_STACK = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

  const ZTF_KATEGORIEN = [
    { schluessel: 'npcs', typ: 'npc', label: 'NPCs' },
    { schluessel: 'orte', typ: 'ort', label: 'Orte' },
    { schluessel: 'fraktionen', typ: 'fraktion', label: 'Fraktionen' },
    { schluessel: 'pantheon', typ: 'pantheon', label: 'Pantheon' },
    { schluessel: 'raetsel', typ: 'raetsel', label: 'Rätsel' },
    { schluessel: 'bestien', typ: 'bestie', label: 'Bestien' },
    { schluessel: 'gegenstaende', typ: 'gegenstand', label: 'Gegenstände' },
    { schluessel: 'kartenobjekte', typ: 'kartenobjekt', label: 'Kartenobjekte' },
  ];

  function mmZuPx(mm, dpi) {
    if (SPIEL && typeof SPIEL.mmZuPx === 'function') {
      return SPIEL.mmZuPx(mm, dpi);
    }
    return Math.max(1, Math.round((Number(mm) * Number(dpi)) / 25.4));
  }

  function berechneExportDpi(tokenMm, basisDpi) {
    const mm = Math.max(10, Number(tokenMm) || REFERENZ_TOKEN_MM);
    const dpi = Math.max(72, Number(basisDpi) || DEFAULT_DPI);
    const minDpiFuerToken = (MIN_TOKEN_RENDER_PX * 25.4) / mm;
    return Math.min(MAX_EXPORT_DPI, Math.max(dpi, Math.ceil(minDpiFuerToken)));
  }

  function berechneSupersampleFaktor(tokenPx, tokenMm) {
    const mm = Math.max(10, Number(tokenMm) || REFERENZ_TOKEN_MM);
    if (mm <= 14) {
      return MAX_SUPERSAMPLE_FAKTOR;
    }
    if (mm <= 20) {
      return 2;
    }
    const px = Number(tokenPx) || 0;
    if (px <= 200) {
      return 2;
    }
    return 1;
  }

  function skalierePxAnTokenGroesse(px, tokenPx, dpi) {
    const basis = Number(px) || 0;
    if (basis <= 0) {
      return 0;
    }
    const referenzTokenPx = mmZuPx(REFERENZ_TOKEN_MM, dpi);
    if (referenzTokenPx <= 0) {
      return basis;
    }
    return Math.max(0.5, basis * (tokenPx / referenzTokenPx));
  }

  function konfiguriereRenderKontext(ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  function zeichneSupersampled(zielCtx, destX, destY, destW, destH, faktor, zeichneFn) {
    const f = Math.max(1, Math.min(MAX_SUPERSAMPLE_FAKTOR, Math.round(faktor)));
    if (f <= 1 || destW <= 0 || destH <= 0) {
      zeichneFn(zielCtx, destX, destY, destW, destH);
      return;
    }
    const canvas = document.createElement('canvas');
    const srcW = Math.max(1, Math.ceil(destW * f));
    const srcH = Math.max(1, Math.ceil(destH * f));
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      zeichneFn(zielCtx, destX, destY, destW, destH);
      return;
    }
    konfiguriereRenderKontext(ctx);
    ctx.scale(f, f);
    zeichneFn(ctx, 0, 0, destW, destH);
    konfiguriereRenderKontext(zielCtx);
    zielCtx.drawImage(canvas, destX, destY, destW, destH);
  }

  async function zeichneSupersampledAsync(zielCtx, destX, destY, destW, destH, faktor, zeichneFn) {
    const f = Math.max(1, Math.min(MAX_SUPERSAMPLE_FAKTOR, Math.round(faktor)));
    if (f <= 1 || destW <= 0 || destH <= 0) {
      await zeichneFn(zielCtx, destX, destY, destW, destH);
      return;
    }
    const canvas = document.createElement('canvas');
    const srcW = Math.max(1, Math.ceil(destW * f));
    const srcH = Math.max(1, Math.ceil(destH * f));
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      await zeichneFn(zielCtx, destX, destY, destW, destH);
      return;
    }
    konfiguriereRenderKontext(ctx);
    ctx.scale(f, f);
    await zeichneFn(ctx, 0, 0, destW, destH);
    konfiguriereRenderKontext(zielCtx);
    zielCtx.drawImage(canvas, destX, destY, destW, destH);
  }

  function formatAbmessungenMm(formatRaw, ausrichtungRaw) {
    if (SPIEL && typeof SPIEL.formatAbmessungenMm === 'function') {
      return SPIEL.formatAbmessungenMm(formatRaw, ausrichtungRaw);
    }
    return { widthMm: 210, heightMm: 297, format: 'A4', ausrichtung: 'portrait' };
  }

  function ladeBild(dataUrl) {
    return new Promise((resolve, reject) => {
      if (!dataUrl || typeof dataUrl !== 'string') {
        reject(new Error('Kein Bild.'));
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      img.src = dataUrl;
    });
  }

  function entitaetId(typ, zeilenId) {
    return `${String(typ || '').trim()}:${String(zeilenId || '').trim()}`;
  }

  function charakterEntitaetId(mitgliedId) {
    return `charakter:${String(mitgliedId || '').trim()}`;
  }

  function entitaetAnzeigeFuerZeile(zeile, entityTyp, optionen) {
    if (!EKI) {
      return { art: 'emoji', emoji: '📌', bildDataUrl: '' };
    }
    const icon = EKI.entitaetAnzeigeIcon(zeile, entityTyp, optionen);
    if (icon.art === 'bild' && icon.bildDataUrl) {
      return { art: 'bild', bildDataUrl: icon.bildDataUrl, emoji: '' };
    }
    return {
      art: 'emoji',
      emoji: icon.emoji || EKI.defaultEmoji(entityTyp),
      bildDataUrl: '',
    };
  }

  /**
   * @param {string} kampagneId
   * @returns {Array<{ id: string, entityTyp: string, kategorieKey: string, kategorieLabel: string, name: string, art: string, emoji: string, bildDataUrl: string, quelle: string }>}
   */
  function sammleExportEntitaeten(kampagneId) {
    const kid = typeof kampagneId === 'string' ? kampagneId.trim() : '';
    const liste = [];
    if (!kid || !window.HTBAH) {
      return liste;
    }
    const ztf =
      typeof window.HTBAH.ladeZufallstabellenZustand === 'function'
        ? window.HTBAH.ladeZufallstabellenZustand(kid)
        : null;
    if (ztf && typeof ztf === 'object') {
      ZTF_KATEGORIEN.forEach((kat) => {
        const zeilen = Array.isArray(ztf[kat.schluessel]) ? ztf[kat.schluessel] : [];
        zeilen.forEach((zeile) => {
          if (!zeile || typeof zeile !== 'object' || !zeile.id) {
            return;
          }
          const anzeige = entitaetAnzeigeFuerZeile(zeile, kat.typ);
          const name = EKI ? EKI.entitaetAnzeigeName(zeile, kat.typ) : zeile.name || zeile.titel || '';
          liste.push({
            id: entitaetId(kat.typ, zeile.id),
            entityTyp: kat.typ,
            kategorieKey: kat.schluessel,
            kategorieLabel: kat.label,
            name: typeof name === 'string' ? name.trim() : '',
            art: anzeige.art,
            emoji: anzeige.emoji,
            bildDataUrl: anzeige.bildDataUrl,
            quelle: 'ztf',
          });
        });
      });
    }
    const sl =
      typeof window.HTBAH.ladeSpielleitungZustand === 'function'
        ? window.HTBAH.ladeSpielleitungZustand()
        : null;
    const kampagnen = sl && Array.isArray(sl.kampagnen) ? sl.kampagnen : [];
    const kampagne = kampagnen.find((k) => k && k.id === kid);
    const mitglieder = kampagne && Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
    mitglieder.forEach((m) => {
      if (!m || typeof m !== 'object' || !m.id) {
        return;
      }
      const charakter = m.charakter && typeof m.charakter === 'object' ? m.charakter : {};
      const name = typeof charakter.name === 'string' ? charakter.name.trim() : '';
      const charakterBild = typeof m.charakterBild === 'string' ? m.charakterBild.trim() : '';
      const anzeige = entitaetAnzeigeFuerZeile(charakter, 'charakter', { charakterBild });
      liste.push({
        id: charakterEntitaetId(m.id),
        entityTyp: 'charakter',
        kategorieKey: 'charaktere',
        kategorieLabel: 'Charakter-Gruppe',
        name,
        art: anzeige.art,
        emoji: anzeige.emoji,
        bildDataUrl: anzeige.bildDataUrl,
        quelle: 'gruppe',
      });
    });
    return liste;
  }

  function effektiveShape(einstellungen, entitaet) {
    const entityShapes =
      einstellungen && einstellungen.entityShapes && typeof einstellungen.entityShapes === 'object'
        ? einstellungen.entityShapes
        : {};
    if (entityShapes[entitaet.id] === 'kreis' || entityShapes[entitaet.id] === 'quadrat') {
      return entityShapes[entitaet.id];
    }
    const kategorieShapes =
      einstellungen && einstellungen.kategorieShapes && typeof einstellungen.kategorieShapes === 'object'
        ? einstellungen.kategorieShapes
        : {};
    const katKey = entitaet.kategorieKey || entitaet.entityTyp;
    if (kategorieShapes[katKey] === 'kreis' || kategorieShapes[katKey] === 'quadrat') {
      return kategorieShapes[katKey];
    }
    return einstellungen && einstellungen.defaultShape === 'quadrat' ? 'quadrat' : 'kreis';
  }

  function normalisiereStueckzahl(map, key, fallback) {
    const basis = Number.isFinite(Number(fallback)) ? Number(fallback) : 1;
    if (!map || typeof map !== 'object') {
      return basis;
    }
    const n = Number(map[key]);
    if (!Number.isFinite(n)) {
      return basis;
    }
    return Math.min(99, Math.max(0, Math.round(n)));
  }

  function effektiveBorder(einstellungen, entitaet) {
    const globalColor = einstellungen.borderColor || '#000000';
    const globalWidth = Number(einstellungen.borderWidthPx) || 0;
    const borders =
      einstellungen && einstellungen.entityBorders && typeof einstellungen.entityBorders === 'object'
        ? einstellungen.entityBorders
        : {};
    const cfg = borders[entitaet.id];
    if (cfg === false) {
      return { enabled: false, color: globalColor, widthPx: 0 };
    }
    if (cfg === true || cfg === undefined || cfg === null) {
      return { enabled: globalWidth > 0, color: globalColor, widthPx: globalWidth };
    }
    if (typeof cfg === 'object') {
      const widthPx = Number.isFinite(Number(cfg.widthPx)) ? Number(cfg.widthPx) : globalWidth;
      const color = cfg.color || globalColor;
      return { enabled: widthPx > 0, color, widthPx };
    }
    return { enabled: globalWidth > 0, color: globalColor, widthPx: globalWidth };
  }

  function effektiveShowName(einstellungen, entitaet) {
    const globalShow = einstellungen.showName !== false;
    const names =
      einstellungen && einstellungen.entityShowNames && typeof einstellungen.entityShowNames === 'object'
        ? einstellungen.entityShowNames
        : {};
    if (names[entitaet.id] === true) {
      return true;
    }
    if (names[entitaet.id] === false) {
      return false;
    }
    return globalShow;
  }

  function itemZeigtName(item, einstellungen) {
    if (item.typ === 'effekt') {
      return (
        einstellungen.showEffectNames !== false &&
        item.showLabel !== false &&
        !!String(item.name || '').trim()
      );
    }
    return item.showName !== false && !!String(item.name || '').trim();
  }

  function zeichneBildCover(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const skala = Math.max(w / iw, h / ih);
    const dw = iw * skala;
    const dh = ih * skala;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function zeichneEmoji(ctx, emoji, cx, cy, radius) {
    const fontSize = Math.max(8, Math.round(radius * 1.05));
    ctx.font = `${fontSize}px ${EMOJI_FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(emoji || '📌', cx, cy);
  }

  async function zeichneTokenIconInhalt(ctx, item, x, y, tokenPx, bildCache) {
    const shape = item.shape || 'kreis';
    ctx.save();
    if (shape === 'kreis') {
      ctx.beginPath();
      ctx.arc(x + tokenPx / 2, y + tokenPx / 2, tokenPx / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(x, y, tokenPx, tokenPx);
      ctx.clip();
    }

    if (item.art === 'bild' && item.bildDataUrl) {
      let img = bildCache.get(item.bildDataUrl);
      if (!img) {
        try {
          img = await ladeBild(item.bildDataUrl);
          bildCache.set(item.bildDataUrl, img);
        } catch {
          img = null;
        }
      }
      if (img) {
        zeichneBildCover(ctx, img, x, y, tokenPx, tokenPx);
      } else {
        zeichneEmoji(ctx, item.emoji || '📌', x + tokenPx / 2, y + tokenPx / 2, tokenPx / 2);
      }
    } else {
      zeichneEmoji(ctx, item.emoji || '📌', x + tokenPx / 2, y + tokenPx / 2, tokenPx / 2);
    }
    ctx.restore();
  }

  function zeichneTokenRahmen(ctx, shape, x, y, size, borderColor, borderWidthPx) {
    if (!borderWidthPx || borderWidthPx <= 0) {
      return;
    }
    const cx = x + size / 2;
    const cy = y + size / 2;
    const radius = size / 2;
    ctx.strokeStyle = borderColor || '#000000';
    ctx.lineWidth = borderWidthPx;
    ctx.beginPath();
    if (shape === 'kreis') {
      ctx.arc(cx, cy, radius - borderWidthPx / 2, 0, Math.PI * 2);
    } else {
      const inset = borderWidthPx / 2;
      ctx.rect(x + inset, y + inset, size - borderWidthPx, size - borderWidthPx);
    }
    ctx.stroke();
  }

  function zeichneEffektRahmen(ctx, shape, x, y, size, color, widthPx) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const radius = size / 2;
    const lw = Math.max(1, Number(widthPx) || 4);
    ctx.strokeStyle = color || '#000000';
    ctx.lineWidth = lw;
    ctx.beginPath();
    if (shape === 'kreis') {
      ctx.arc(cx, cy, radius - lw / 2, 0, Math.PI * 2);
    } else {
      const inset = lw / 2;
      ctx.rect(x + inset, y + inset, size - lw, size - lw);
    }
    ctx.stroke();
  }

  function umbrecheTextInZeilen(ctx, text, maxBreite) {
    const roh = String(text || '').trim();
    if (!roh) {
      return [];
    }
    const woerter = roh.split(/\s+/).filter(Boolean);
    const zeilen = [];
    let aktuell = '';

    function zeilePasst(zeile) {
      return ctx.measureText(zeile).width <= maxBreite;
    }

    function zuLangesWortEinfuegen(wort) {
      let teil = '';
      for (const zeichen of wort) {
        const kandidat = teil + zeichen;
        if (teil && !zeilePasst(kandidat)) {
          zeilen.push(teil);
          teil = zeichen;
        } else {
          teil = kandidat;
        }
      }
      aktuell = teil;
    }

    woerter.forEach((wort) => {
      const kandidat = aktuell ? `${aktuell} ${wort}` : wort;
      if (zeilePasst(kandidat)) {
        aktuell = kandidat;
        return;
      }
      if (aktuell) {
        zeilen.push(aktuell);
        aktuell = '';
      }
      if (zeilePasst(wort)) {
        aktuell = wort;
      } else {
        zuLangesWortEinfuegen(wort);
      }
    });
    if (aktuell) {
      zeilen.push(aktuell);
    }
    return zeilen;
  }

  function berechneNameFontSizePx(tokenPx, nameFontSizePxEinstellung) {
    const fest = Number(nameFontSizePxEinstellung);
    if (Number.isFinite(fest) && fest > 0) {
      return Math.max(6, Math.round(fest));
    }
    const px = Number(tokenPx) || 0;
    if (px <= 0) {
      return 13;
    }
    const autoGroesse = Math.round(px * 0.12);
    const minFont = Math.max(8, Math.round(px * 0.08));
    const maxFont = Math.round(px * 0.17);
    return Math.max(minFont, Math.min(maxFont, autoGroesse));
  }

  function messeTextZeilenMetrik(ctx, fontSize) {
    ctx.font = `600 ${fontSize}px ${NAME_FONT_STACK}`;
    const probe = ctx.measureText('Mg');
    const ascent = probe.actualBoundingBoxAscent > 0 ? probe.actualBoundingBoxAscent : fontSize * 0.78;
    const descent = probe.actualBoundingBoxDescent > 0 ? probe.actualBoundingBoxDescent : fontSize * 0.22;
    return { lineHeight: ascent + descent, ascent, descent };
  }

  function berechneNamenLabelLayout(ctx, name, tokenY, tokenPx, borderWidthPx, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const dpi = Number.isFinite(Number(opts.dpi)) ? Number(opts.dpi) : DEFAULT_DPI;
    const overlapToken = opts.overlapToken !== false;
    const lw = skalierePxAnTokenGroesse(borderWidthPx, tokenPx, dpi);
    const overlapPx = overlapToken ? Math.max(lw, Math.round(tokenPx * 0.14)) : 0;
    const hoehenVersatzPx = overlapToken ? Math.round(tokenPx * 0.03) : 0;
    const overlapGesamt = overlapPx + hoehenVersatzPx;
    const tokenBottom = tokenY + tokenPx;
    const boxWidth = tokenPx;
    const fontSize = berechneNameFontSizePx(tokenPx, opts.nameFontSizePx);
    const { lineHeight } = messeTextZeilenMetrik(ctx, fontSize);
    const lineGap = Math.max(1, Math.round(fontSize * 0.1));
    const paddingX = Math.max(4, Math.round(fontSize * 0.35));
    const paddingVert = Math.max(2, Math.round(fontSize * 0.12));

    ctx.font = `600 ${fontSize}px ${NAME_FONT_STACK}`;
    const maxTextBreite = Math.max(8, boxWidth - paddingX * 2 - lw);
    const zeilen = umbrecheTextInZeilen(ctx, name, maxTextBreite);
    const textHoehe =
      zeilen.length <= 1
        ? lineHeight
        : zeilen.length * lineHeight + (zeilen.length - 1) * lineGap;
    const inhaltHoehe = textHoehe + paddingVert * 2;
    const boxTop = tokenBottom - overlapGesamt;
    const boxHeight = overlapGesamt + inhaltHoehe;

    return {
      boxTop,
      boxWidth,
      boxHeight,
      fontSize,
      lineHeight,
      lineGap,
      paddingX,
      paddingVert,
      zeilen,
      lw,
      overlapGesamt,
    };
  }

  function zeichneNamenLabelInhalt(ctx, layout, borderColor, offsetX, offsetY) {
    const {
      boxTop,
      boxWidth,
      boxHeight,
      fontSize,
      lineHeight,
      lineGap,
      zeilen,
      lw,
    } = layout;
    const x = offsetX;
    const y = boxTop - offsetY;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, boxWidth, boxHeight);

    if (lw > 0) {
      ctx.strokeStyle = borderColor || '#000000';
      ctx.lineWidth = lw;
      const inset = lw / 2;
      ctx.strokeRect(x + inset, y + inset, boxWidth - lw, boxHeight - lw);
    }

    ctx.font = `600 ${fontSize}px ${NAME_FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    const boxCenterY = y + boxHeight / 2;
    const lineStep = lineHeight + lineGap;
    const blockSpan = zeilen.length > 1 ? (zeilen.length - 1) * lineStep : 0;
    const firstLineY = boxCenterY - blockSpan / 2;
    zeilen.forEach((zeile, index) => {
      ctx.fillText(zeile, x + boxWidth / 2, firstLineY + index * lineStep);
    });
  }

  function zeichneNamenMitRahmen(ctx, name, x, tokenY, tokenPx, _nameHoehePx, borderColor, borderWidthPx, optionen) {
    if (!name) {
      return;
    }
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const layout = berechneNamenLabelLayout(ctx, name, tokenY, tokenPx, borderWidthPx, optionen);
    const ss = berechneSupersampleFaktor(tokenPx, opts.tokenMm);
    zeichneSupersampled(ctx, x, layout.boxTop, layout.boxWidth, layout.boxHeight, ss, (sctx) => {
      zeichneNamenLabelInhalt(sctx, layout, borderColor, 0, layout.boxTop);
    });
  }

  async function zeichneTokenZelle(ctx, item, x, y, tokenPx, einstellungen, bildCache, dpi) {
    const shape = item.shape || 'kreis';
    const borderColor = item.borderColor || einstellungen.borderColor || '#000000';
    const borderWidthRoh =
      item.borderWidthPx != null ? Number(item.borderWidthPx) : Number(einstellungen.borderWidthPx) || 0;
    const borderWidthPx = skalierePxAnTokenGroesse(borderWidthRoh, tokenPx, dpi);
    const showName = item.showName !== false;
    const nameHoehePx = showName ? Math.max(18, Math.round(tokenPx * 0.3)) : 0;
    const tokenMm = Number(einstellungen.tokenGroesseMm) || REFERENZ_TOKEN_MM;
    const ss = berechneSupersampleFaktor(tokenPx, tokenMm);

    await zeichneSupersampledAsync(ctx, x, y, tokenPx, tokenPx, ss, async (sctx) => {
      await zeichneTokenIconInhalt(sctx, item, 0, 0, tokenPx, bildCache);
      zeichneTokenRahmen(sctx, shape, 0, 0, tokenPx, borderColor, borderWidthPx);
    });

    if (showName && item.name) {
      zeichneNamenMitRahmen(ctx, item.name, x, y, tokenPx, nameHoehePx, borderColor, borderWidthRoh, {
        overlapToken: true,
        nameFontSizePx: einstellungen.nameFontSizePx,
        dpi,
        tokenMm,
      });
    }
  }

  function berechneRaster(abmessungen, einstellungen, itemAnzahl, dpi, items) {
    const randMm = Number(einstellungen.seitenRandMm) || 0;
    const tokenMm = Number(einstellungen.tokenGroesseMm) || 25;
    const abstandMm = Number(einstellungen.abstandMm) || 2;
    const nameBereichAktiv = Array.isArray(items)
      ? items.some((item) => itemZeigtName(item, einstellungen))
      : einstellungen.showName !== false ||
        (einstellungen.includeEffects &&
          einstellungen.showEffectNames !== false &&
          Array.isArray(einstellungen.effectFrames) &&
          einstellungen.effectFrames.some((r) => r && r.showLabel !== false));
    const nameMm = nameBereichAktiv ? 6 : 0;
    const zellenBreiteMm = tokenMm;
    const zellenHoeheMm = tokenMm + nameMm;
    const nutzBreiteMm = Math.max(1, abmessungen.widthMm - randMm * 2);
    const nutzHoeheMm = Math.max(1, abmessungen.heightMm - randMm * 2);
    const schrittXMm = zellenBreiteMm + abstandMm;
    const schrittYMm = zellenHoeheMm + abstandMm;
    const spalten = Math.max(1, Math.floor((nutzBreiteMm + abstandMm) / schrittXMm));
    const zeilen = Math.max(1, Math.floor((nutzHoeheMm + abstandMm) / schrittYMm));
    const kapazitaet = spalten * zeilen;
    return {
      spalten,
      zeilen,
      kapazitaet,
      seitenAnzahl: Math.max(1, Math.ceil(itemAnzahl / kapazitaet)),
      tokenPx: mmZuPx(tokenMm, dpi),
      abstandPx: mmZuPx(abstandMm, dpi),
      nameHoehePx: mmZuPx(nameMm, dpi),
      randPx: mmZuPx(randMm, dpi),
      zellenBreitePx: mmZuPx(zellenBreiteMm, dpi),
      zellenHoehePx: mmZuPx(zellenHoeheMm, dpi),
      schrittXPx: mmZuPx(schrittXMm, dpi),
      schrittYPx: mmZuPx(schrittYMm, dpi),
    };
  }

  function baueExportItems(einstellungen, alleEntitaeten) {
    const selected = Array.isArray(einstellungen.selectedEntityIds) ? einstellungen.selectedEntityIds : [];
    const selectedSet = new Set(selected);
    const entitaeten = alleEntitaeten.filter((e) => selectedSet.has(e.id));
    const entityCounts =
      einstellungen && einstellungen.entityCounts && typeof einstellungen.entityCounts === 'object'
        ? einstellungen.entityCounts
        : {};
    const effectCounts =
      einstellungen && einstellungen.effectCounts && typeof einstellungen.effectCounts === 'object'
        ? einstellungen.effectCounts
        : {};
    const items = [];
    entitaeten.forEach((entitaet) => {
      const count = normalisiereStueckzahl(entityCounts, entitaet.id, 1);
      if (count <= 0) {
        return;
      }
      const border = effektiveBorder(einstellungen, entitaet);
      const showName = effektiveShowName(einstellungen, entitaet);
      for (let i = 0; i < count; i += 1) {
        items.push({
          typ: 'token',
          ...entitaet,
          id: count > 1 ? `${entitaet.id}#${i}` : entitaet.id,
          sourceEntityId: entitaet.id,
          copyIndex: i,
          shape: effektiveShape(einstellungen, entitaet),
          borderColor: border.color,
          borderWidthPx: border.enabled ? border.widthPx : 0,
          showName,
        });
      }
    });
    if (einstellungen.includeEffects) {
      const rahmen =
        einstellungen.effectFrames && Array.isArray(einstellungen.effectFrames)
          ? einstellungen.effectFrames
          : [];
      const defaultShape = einstellungen.defaultShape === 'quadrat' ? 'quadrat' : 'kreis';
      rahmen.forEach((rahmenEintrag) => {
        if (!rahmenEintrag || !rahmenEintrag.id) {
          return;
        }
        const count = normalisiereStueckzahl(effectCounts, rahmenEintrag.id, 1);
        if (count <= 0) {
          return;
        }
        for (let i = 0; i < count; i += 1) {
          items.push({
            typ: 'effekt',
            id: count > 1 ? `effekt:${rahmenEintrag.id}#${i}` : `effekt:${rahmenEintrag.id}`,
            sourceEffectId: rahmenEintrag.id,
            copyIndex: i,
            name: rahmenEintrag.label || rahmenEintrag.id,
            shape: defaultShape,
            rahmenFarbe: rahmenEintrag.color,
            rahmenBreitePx: rahmenEintrag.widthPx,
            showLabel: rahmenEintrag.showLabel !== false,
          });
        }
      });
    }
    return items;
  }

  async function renderTokensSeite(ctx, items, seitenIndex, raster, einstellungen, bildCache, dpi) {
    const start = seitenIndex * raster.kapazitaet;
    const end = Math.min(items.length, start + raster.kapazitaet);
    const seitenItems = items.slice(start, end);
    for (let i = 0; i < seitenItems.length; i += 1) {
      const item = seitenItems[i];
      const col = i % raster.spalten;
      const row = Math.floor(i / raster.spalten);
      const x = raster.randPx + col * raster.schrittXPx;
      const y = raster.randPx + row * raster.schrittYPx;
      if (item.typ === 'effekt') {
        const tokenMm = Number(einstellungen.tokenGroesseMm) || REFERENZ_TOKEN_MM;
        const rahmenBreite = skalierePxAnTokenGroesse(item.rahmenBreitePx, raster.tokenPx, dpi);
        const ss = berechneSupersampleFaktor(raster.tokenPx, tokenMm);
        zeichneSupersampled(ctx, x, y, raster.tokenPx, raster.tokenPx, ss, (sctx) => {
          zeichneEffektRahmen(sctx, item.shape, 0, 0, raster.tokenPx, item.rahmenFarbe, rahmenBreite);
        });
        if (
          einstellungen.showEffectNames !== false &&
          item.showLabel !== false &&
          item.name
        ) {
          zeichneNamenMitRahmen(
            ctx,
            item.name,
            x,
            y,
            raster.tokenPx,
            raster.nameHoehePx,
            item.rahmenFarbe || '#000000',
            item.rahmenBreitePx,
            {
              overlapToken: true,
              nameFontSizePx: einstellungen.nameFontSizePx,
              dpi,
              tokenMm,
            },
          );
        }
      } else {
        await zeichneTokenZelle(ctx, item, x, y, raster.tokenPx, einstellungen, bildCache, dpi);
      }
    }
  }

  async function renderTokensCanvas(einstellungen, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const basisDpi = Number.isFinite(Number(opts.dpi)) ? Math.max(72, Number(opts.dpi)) : DEFAULT_DPI;
    const format = einstellungen.format || 'A4';
    const ausrichtung = einstellungen.ausrichtung || 'portrait';
    const abmessungen = formatAbmessungenMm(format, ausrichtung);
    const alleEntitaeten =
      Array.isArray(einstellungen.entitaeten) && einstellungen.entitaeten.length
        ? einstellungen.entitaeten
        : sammleExportEntitaeten(einstellungen.kampagneId);
    const items = baueExportItems(einstellungen, alleEntitaeten);
    if (!items.length) {
      throw new Error('Keine Tokens zum Export ausgewählt.');
    }
    const tokenMm = Number(einstellungen.tokenGroesseMm) || REFERENZ_TOKEN_MM;
    const dpi = berechneExportDpi(tokenMm, basisDpi);
    const raster = berechneRaster(abmessungen, einstellungen, items.length, dpi, items);
    const seitenAnzahl = raster.seitenAnzahl;
    const widthPx = mmZuPx(abmessungen.widthMm, dpi);
    const heightPx = mmZuPx(abmessungen.heightMm, dpi);
    const seiten = [];
    const bildCache = new Map();
    for (let s = 0; s < seitenAnzahl; s += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = widthPx;
      canvas.height = heightPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas-Kontext konnte nicht erstellt werden.');
      }
      konfiguriereRenderKontext(ctx);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, widthPx, heightPx);
      await renderTokensSeite(ctx, items, s, raster, einstellungen, bildCache, dpi);
      seiten.push(canvas);
    }
    return {
      seiten,
      format: abmessungen.format,
      widthMm: abmessungen.widthMm,
      heightMm: abmessungen.heightMm,
      itemAnzahl: items.length,
      seitenAnzahl,
    };
  }

  function canvasZuPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG konnte nicht erzeugt werden.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  }

  async function erzeugeTokensPng(einstellungen) {
    const { seiten, format } = await renderTokensCanvas(einstellungen);
    if (seiten.length > 1) {
      throw new Error('Mehrseitiger PNG-Export wird nicht unterstützt — bitte PDF verwenden.');
    }
    const blob = await canvasZuPngBlob(seiten[0]);
    const zeit =
      window.HTBAH_SHARED.PdfRenderUtils && window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel
        ? window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel()
        : `${Date.now()}`;
    return { blob, dateiname: `htbah-tokens-${format.toLowerCase()}-${zeit}.png` };
  }

  async function erzeugeTokensPdf(einstellungen) {
    const { seiten, format, widthMm, heightMm } = await renderTokensCanvas(einstellungen);
    const jspdfNs = window.jspdf;
    const jsPDF = jspdfNs && (jspdfNs.jsPDF || jspdfNs.default);
    if (!jsPDF) {
      throw new Error('jsPDF fehlt.');
    }
    const pdf = new jsPDF({
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
      compress: false,
    });
    for (let i = 0; i < seiten.length; i += 1) {
      if (i > 0) {
        pdf.addPage([widthMm, heightMm], widthMm > heightMm ? 'landscape' : 'portrait');
      }
      const pngData = seiten[i].toDataURL('image/png');
      pdf.addImage(pngData, 'PNG', 0, 0, widthMm, heightMm);
    }
    const arrayBuffer = pdf.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const zeit =
      window.HTBAH_SHARED.PdfRenderUtils && window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel
        ? window.HTBAH_SHARED.PdfRenderUtils.dateinameZeitstempel()
        : `${Date.now()}`;
    return { blob, dateiname: `htbah-tokens-${format.toLowerCase()}-${zeit}.pdf` };
  }

  window.HTBAH_SHARED.TokensEffekteExport = {
    ZTF_KATEGORIEN,
    sammleExportEntitaeten,
    entitaetId,
    charakterEntitaetId,
    effektiveShape,
    berechneExportDpi,
    berechneSupersampleFaktor,
    skalierePxAnTokenGroesse,
    renderTokensCanvas,
    erzeugeTokensPng,
    erzeugeTokensPdf,
  };
})();
