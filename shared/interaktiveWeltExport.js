/**
 * Bildexport der interaktiven Welt (PNG + PDF-Tiles).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerInteraktiveWeltExport() {
  const G = () => window.HTBAH_SHARED.InteraktiveWeltGraph;
  const U = () => window.HTBAH_SHARED.PdfRenderUtils;

  const EXPORT_PADDING = 48;
  const MAP_ZOOM_SCHRITT = 1.12;
  const MAX_EXPORT_KANTE_PX = 6000;

  function ladeKampagnenKontext(kampagneId) {
    const kid = typeof kampagneId === 'string' ? kampagneId.trim() : '';
    if (!kid) {
      throw new Error('Keine Kampagne angegeben.');
    }
    const sl = window.HTBAH.ladeSpielleiterZustand();
    const kampagne = (sl.kampagnen || []).find((k) => k && k.id === kid) || null;
    if (!kampagne) {
      throw new Error('Kampagne nicht gefunden.');
    }
    const zustand = window.HTBAH.ladeZufallstabellenZustand(kid);
    const wb = window.HTBAH.ladeWeltenbauZustand(kid);
    const gruppeKey = kid;
    const layoutAlle =
      wb && wb.mapLayouts && typeof wb.mapLayouts === 'object' ? wb.mapLayouts : {};
    const layout = layoutAlle[gruppeKey] || layoutAlle.default || {};
    const bildLayoutsAlle =
      wb && wb.mapBildLayouts && typeof wb.mapBildLayouts === 'object' ? wb.mapBildLayouts : {};
    const bildLayouts = bildLayoutsAlle[gruppeKey] || bildLayoutsAlle.default || {};
    const mapEinst =
      wb && wb.mapEinstellungen && wb.mapEinstellungen[gruppeKey]
        ? wb.mapEinstellungen[gruppeKey]
        : {};
    const graph = G().baueGraph({
      zustand,
      layout,
      gruppeId: gruppeKey,
      aktiveGruppe: kampagne,
      sichtbarkeitsFilter: {
        toteNpcsAnzeigen: true,
        toteBestienAnzeigen: true,
        geloesteRaetselAnzeigen: true,
      },
    });
    const bildElemente = G().sammleOrtBildElemente({
      zustand,
      weltenbau: wb,
      gruppeId: gruppeKey,
      layouts: bildLayouts,
    });
    const hintergrundMap =
      wb && wb.mapHintergruende && typeof wb.mapHintergruende === 'object' ? wb.mapHintergruende : {};
    const hintergrundDataUrl =
      typeof hintergrundMap[gruppeKey] === 'string' ? hintergrundMap[gruppeKey] : '';
    const itemScaleRoh = Number(mapEinst.itemScale);
    const itemScale = Number.isFinite(itemScaleRoh)
      ? Math.max(0, Math.min(500, Math.round(itemScaleRoh)))
      : 100;
    return {
      kampagne,
      zustand,
      wb,
      graph,
      bildElemente,
      hintergrundDataUrl,
      edgeColor: typeof mapEinst.edgeColor === 'string' ? mapEinst.edgeColor : '#5c636a',
      edgeWidth: Number.isFinite(Number(mapEinst.edgeWidth)) ? Number(mapEinst.edgeWidth) : 4,
      itemScale,
      stageWidth: Number.isFinite(Number(wb && wb.stageWidth)) ? Number(wb.stageWidth) : 5200,
      stageHeight: Number.isFinite(Number(wb && wb.stageHeight)) ? Number(wb.stageHeight) : 3600,
    };
  }

  function nodeExportAbmessungen(node, itemScale) {
    const entityType = node && node.data ? node.data.entityType : '';
    const w = nodeBreiteExport(node, itemScale);
    const h = nodeHoeheExport(node, itemScale);
    if (entityType === 'charakter' || entityType === 'npc' || entityType === 'bestie') {
      return { w, h: h + 32 };
    }
    return { w, h };
  }

  function berechneBounds(graph, bildElemente, itemScale, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const erweitere = (x, y, w, h) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    };
    (graph.nodes || []).forEach((node) => {
      const x = (node.position && Number(node.position.x)) || 0;
      const y = (node.position && Number(node.position.y)) || 0;
      const dim = nodeExportAbmessungen(node, itemScale);
      erweitere(x, y, dim.w, dim.h);
    });
    (bildElemente || []).forEach((bild) => {
      erweitere(
        Number(bild.x) || 0,
        Number(bild.y) || 0,
        Number(bild.width) || 100,
        Number(bild.height) || 80,
      );
    });
    if (!Number.isFinite(minX)) {
      return { x: 0, y: 0, w: 800, h: 600 };
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    let pad = EXPORT_PADDING;
    if (opts.fuerPdf) {
      const extra = (Math.max(contentW, contentH) * (MAP_ZOOM_SCHRITT - 1)) / 2;
      pad = EXPORT_PADDING + extra;
    }
    return {
      x: minX - pad,
      y: minY - pad,
      w: contentW + pad * 2,
      h: contentH + pad * 2,
    };
  }

  function escapeAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function itemScaleFaktor(kontext) {
    return Math.max(0, (Number(kontext && kontext.itemScale) || 100) / 100);
  }

  function stilZuInline(stil) {
    if (!stil || typeof stil !== 'object') {
      return '';
    }
    return Object.keys(stil)
      .filter((key) => stil[key] != null && stil[key] !== '')
      .map((key) => {
        const val = stil[key];
        if (key.startsWith('--')) {
          return `${key}:${val}`;
        }
        const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        return `${cssKey}:${val}`;
      })
      .join(';');
  }

  function ortBildStilExport(bild) {
    const minBreite = bild && (bild.ankerTyp === 'pfeil' || bild.ankerTyp === 'notiz') ? 220 : 1;
    const minHoehe = bild && (bild.ankerTyp === 'pfeil' || bild.ankerTyp === 'notiz') ? 56 : 1;
    const istDrehbar = bild && bild.ankerTyp !== 'notiz';
    const winkel = Number.isFinite(Number(bild && bild.angleDeg)) ? Number(bild.angleDeg) : 0;
    const pfeilHoehe = Math.max(minHoehe, Math.round(Number(bild && bild.height) || 220));
    const pfeilLinienstaerke = Math.max(4, Math.round(pfeilHoehe * 0.12));
    const pfeilSpitzenHoehe = Math.max(12, Math.round(pfeilHoehe * 0.42));
    const breite = Math.max(minBreite, Math.round(Number(bild.width) || 320));
    const minDimension = Math.max(20, Math.min(breite, pfeilHoehe));
    return {
      left: `${Math.round(Number(bild.x) || 0)}px`,
      top: `${Math.round(Number(bild.y) || 0)}px`,
      width: `${breite}px`,
      height: `${pfeilHoehe}px`,
      transform: istDrehbar ? `rotate(${winkel}deg)` : undefined,
      transformOrigin: istDrehbar ? 'center center' : undefined,
      '--htbah-pfeil-farbe':
        bild && bild.ankerTyp === 'pfeil' && /^#[0-9a-fA-F]{6}$/.test(String(bild.pfeilFarbe || '').trim())
          ? String(bild.pfeilFarbe).trim()
          : '#509b4a',
      '--htbah-pfeil-linienstaerke': `${pfeilLinienstaerke}px`,
      '--htbah-pfeil-spitzenhoehe': `${pfeilSpitzenHoehe}px`,
      '--htbah-pfeil-spitzenbreite': `${Math.max(14, Math.round(pfeilSpitzenHoehe * 0.9))}px`,
      '--htbah-notiz-bg':
        bild && bild.ankerTyp === 'notiz' && /^#[0-9a-fA-F]{6}$/.test(String(bild.notizBgColor || '').trim())
          ? String(bild.notizBgColor).trim()
          : '#fff8bf',
      '--htbah-element-min-dim': `${minDimension}px`,
    };
  }

  function nodeBreiteExport(node, itemScale) {
    const sk = itemScaleFaktor({ itemScale });
    const basisBreite = (node && node.style && Number(node.style.width)) || 200;
    return Math.max(22, Math.round(basisBreite * sk));
  }

  function nodeHoeheExport(node, itemScale) {
    const sk = itemScaleFaktor({ itemScale });
    const entityType = node && node.data ? node.data.entityType : '';
    if (entityType === 'charakter' || entityType === 'npc' || entityType === 'bestie') {
      return Math.max(30, Math.round(86 * sk));
    }
    const basisHoehe =
      node && node.style && Number.isFinite(Number(node.style.minHeight))
        ? Number(node.style.minHeight)
        : (node && node.style && Number(node.style.height)) || 56;
    return Math.max(18, Math.round(basisHoehe * sk));
  }

  function nodeStilExport(node, itemScale) {
    const sk = itemScaleFaktor({ itemScale });
    const entityType = node && node.data ? node.data.entityType : '';
    const istCharakter = entityType === 'charakter';
    const istKreisEntitaet = entityType === 'charakter' || entityType === 'npc' || entityType === 'bestie';
    const basisFont = 14;
    const basisPaddingY = istCharakter ? 6 : 8;
    const basisPaddingX = istCharakter ? 8 : 10;
    const breite = nodeBreiteExport(node, itemScale);
    const hoehe = nodeHoeheExport(node, itemScale);
    const kreisDurchmesser = istKreisEntitaet ? Math.max(30, Math.round(Math.min(breite, hoehe) * 0.78)) : null;
    const avatarGroesse =
      istKreisEntitaet && kreisDurchmesser ? Math.max(22, Math.round(kreisDurchmesser * 0.86)) : null;
    const basisMinHeight =
      node && node.style && Number.isFinite(Number(node.style.minHeight))
        ? Math.max(18, Math.round(Number(node.style.minHeight) * sk))
        : undefined;
    const borderWidthRoh = node && node.style ? Number(node.style.borderWidth) : NaN;
    const borderWidth =
      Number.isFinite(borderWidthRoh) && borderWidthRoh > 0 ? borderWidthRoh : istKreisEntitaet ? 3 : undefined;
    const finaleBreite = istKreisEntitaet ? kreisDurchmesser : breite;
    const finaleHoehe = istKreisEntitaet
      ? kreisDurchmesser
      : basisMinHeight != null
        ? Math.max(basisMinHeight, hoehe)
        : hoehe;
    const minDimension = Math.max(20, Math.round(Math.min(finaleBreite || 0, finaleHoehe || 0)));
    return {
      ...(node.style || {}),
      left: `${Math.round((node.position && node.position.x) || 0)}px`,
      top: `${Math.round((node.position && node.position.y) || 0)}px`,
      width: istKreisEntitaet ? `${kreisDurchmesser}px` : `${breite}px`,
      minHeight: istKreisEntitaet
        ? `${kreisDurchmesser}px`
        : basisMinHeight != null
          ? `${basisMinHeight}px`
          : `${hoehe}px`,
      height: istKreisEntitaet ? `${kreisDurchmesser}px` : undefined,
      borderRadius: istKreisEntitaet ? '999px' : undefined,
      borderWidth: borderWidth != null ? `${borderWidth}px` : undefined,
      fontSize: `${Math.max(8, Math.round(basisFont * sk))}px`,
      padding: `${Math.max(2, Math.round(basisPaddingY * sk))}px ${Math.max(3, Math.round(basisPaddingX * sk))}px`,
      '--htbah-node-avatar-size': avatarGroesse ? `${avatarGroesse}px` : undefined,
      '--htbah-node-scale': String(sk),
      '--htbah-element-min-dim': `${minDimension}px`,
    };
  }

  function nodeKlassenExport(node) {
    const t = node && node.data ? node.data.entityType : '';
    const istKreisNode = t === 'charakter' || t === 'npc' || t === 'bestie';
    const istKartenIconRechteck =
      t === 'ort' || t === 'fraktion' || t === 'raetsel' || t === 'gegenstand';
    const klassen = ['htbah-map-node'];
    if (t === 'ort') {
      klassen.push('htbah-map-node-ort');
    }
    if (t === 'charakter') {
      klassen.push('htbah-map-node-charakter');
    }
    if (istKreisNode) {
      klassen.push('htbah-map-node-kreis');
    }
    if (istKartenIconRechteck) {
      klassen.push('htbah-map-node-rechteck');
    }
    return klassen.join(' ');
  }

  function initiativeBadgeText(initiative) {
    if (initiative == null || initiative === '') {
      return '';
    }
    return String(initiative).trim();
  }

  function kartenIconHtml(node) {
    const data = node.data || {};
    const icon = data.kartenIconAnzeige || G().graphKnotenIconAnzeige(data.payload, data.entityType);
    if (icon && icon.art === 'bild' && icon.bildDataUrl) {
      return `<img src="${icon.bildDataUrl}" alt="" class="htbah-map-node-icon-bild" draggable="false" />`;
    }
    const emoji = (icon && icon.emoji) || '📌';
    return `<span class="htbah-map-node-icon-emoji">${escapeAttr(emoji)}</span>`;
  }

  function skalierePxStil(stil, exportScale) {
    const es = exportScale || 1;
    const out = {};
    Object.keys(stil || {}).forEach((key) => {
      const val = stil[key];
      if (typeof val === 'string' && /^\d+(\.\d+)?px$/.test(val.trim())) {
        out[key] = `${Math.round(parseFloat(val) * es)}px`;
      } else {
        out[key] = val;
      }
    });
    return out;
  }

  function nodeHtmlExport(node, offsetX, offsetY, itemScale, exportScale) {
    const es = exportScale || 1;
    const x = (((node.position && Number(node.position.x)) || 0) - offsetX) * es;
    const y = (((node.position && Number(node.position.y)) || 0) - offsetY) * es;
    const stil = skalierePxStil(nodeStilExport(node, itemScale), es);
    stil.left = `${Math.round(x)}px`;
    stil.top = `${Math.round(y)}px`;
    const klassen = nodeKlassenExport(node);
    const data = node.data || {};
    const entityType = data.entityType || '';
    const label = escapeAttr(data.label || 'Eintrag');
    const ini = initiativeBadgeText(data.initiative);
    const iniBadge = ini
      ? `<span class="badge rounded-pill text-bg-info ms-1">INI ${escapeAttr(ini)}</span>`
      : '';

    if (entityType === 'charakter' || entityType === 'npc' || entityType === 'bestie') {
      const bild =
        entityType === 'charakter' ? data.charakterBild : data.avatarDataUrl;
      const bildHtml =
        typeof bild === 'string' && bild.startsWith('data:')
          ? `<img src="${bild}" alt="" class="htbah-map-charakterbild" draggable="false" />`
          : `<div class="htbah-map-charakterbild htbah-map-charakter-emoji">${entityType === 'bestie' ? '🦁' : entityType === 'npc' ? '👤' : '🧙'}</div>`;
      const status = data.statusEmoji
        ? `<div class="htbah-map-charakter-status">${data.statusEmoji}</div>`
        : '';
      return `<div class="${klassen}" style="${stilZuInline(stil)}">
        <div class="htbah-map-charakter-avatar-wrap">${bildHtml}${status}</div>
        <div class="htbah-map-node-kreis-meta">
          <div class="htbah-map-node-kreis-label"><span>${label}</span>${iniBadge}</div>
        </div>
      </div>`;
    }

    const icon = data.kartenIconAnzeige || G().graphKnotenIconAnzeige(data.payload, entityType);
    const iconForm = icon && icon.form === 'rund' ? 'rund' : 'eckig';
    const iconSlot =
      entityType === 'ort' || entityType === 'fraktion' || entityType === 'raetsel' || entityType === 'gegenstand'
        ? `<div class="htbah-map-node-icon-slot htbah-map-node-icon-slot--${iconForm}">${kartenIconHtml(node)}</div>`
        : '';
    const statusRect = data.statusEmoji
      ? `<div class="htbah-map-charakter-status">${data.statusEmoji}</div>`
      : '';
    return `<div class="${klassen}" style="${stilZuInline(stil)}">
      <div class="htbah-map-node-rechteck-inhalt">
        ${iconSlot}
        <div class="htbah-map-node-text position-relative">
          <span>${label}</span>${iniBadge}${statusRect}
        </div>
      </div>
    </div>`;
  }

  function bildElementHtmlExport(bild, offsetX, offsetY, exportScale) {
    const es = exportScale || 1;
    const clone = {
      ...bild,
      x: ((Number(bild.x) || 0) - offsetX) * es,
      y: ((Number(bild.y) || 0) - offsetY) * es,
      width: (Number(bild.width) || 100) * es,
      height: (Number(bild.height) || 80) * es,
    };
    const stil = ortBildStilExport(clone);
    const ankerTyp = bild.ankerTyp || 'bild';
    if (ankerTyp === 'notiz') {
      return `<div class="htbah-map-ort-bild" data-map-element-type="notiz" style="${stilZuInline(stil)}"><div class="htbah-map-notiz-editor-host htbah-pdf-html">${bild.notizHtml || ''}</div></div>`;
    }
    if (ankerTyp === 'pfeil') {
      return `<div class="htbah-map-ort-bild" data-map-element-type="pfeil" style="${stilZuInline(stil)}"><div class="htbah-map-pfeil-wrap" aria-hidden="true"><div class="htbah-map-pfeil-schaft"></div><div class="htbah-map-pfeil-spitze"></div></div></div>`;
    }
    if (bild.dataUrl) {
      return `<div class="htbah-map-ort-bild" data-map-element-type="bild" style="${stilZuInline(stil)}"><img src="${bild.dataUrl}" alt="" draggable="false" /></div>`;
    }
    return '';
  }

  /** html2canvas-kompatibles CSS (ohne color-mix / color()) — nur für Export-Host */
  function mapExportEssentialCssText() {
    return `
.htbah-iw-export-host { --text-color:#212529; --card-bg:#ffffff; --border-color:#dee2e6; }
.htbah-weltenbau-map-stage { position:relative; background:#f4f6f8; }
.htbah-weltenbau-map-hintergrund { position:absolute; inset:0; z-index:0; pointer-events:none; background-color:#fff; background-position:center; background-repeat:no-repeat; background-size:contain; }
.htbah-weltenbau-map-grid-overlay { position:absolute; inset:0; z-index:1; pointer-events:none; background:linear-gradient(0deg,rgba(0,0,0,.05) 1px,transparent 1px) 0 0/32px 32px,linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px) 0 0/32px 32px; }
.htbah-weltenbau-map-edges { position:absolute; inset:0; z-index:12; pointer-events:none; overflow:visible; }
.htbah-weltenbau-map-edges line { vector-effect:non-scaling-stroke; stroke-linecap:round; }
.htbah-map-node { position:absolute; z-index:20; min-height:54px; text-align:left; border:2px solid #adb5bd; background:#fff; border-radius:.5rem; padding:.35rem .5rem; box-shadow:0 .1rem .25rem rgba(0,0,0,.12); }
.htbah-map-node-charakter { border-color:#0d6efd; }
.htbah-map-node-kreis { display:flex; align-items:center; justify-content:center; padding:0!important; overflow:visible; text-align:center; }
.htbah-map-node-rechteck { display:flex; align-items:center; padding:0 .5rem 0 0; overflow:hidden; }
.htbah-map-node-rechteck-inhalt { display:flex; align-items:center; gap:.5rem; width:100%; min-height:54px; }
.htbah-map-node-icon-slot { --htbah-map-node-icon-kante:50px; flex:0 0 var(--htbah-map-node-icon-kante); width:var(--htbah-map-node-icon-kante); height:var(--htbah-map-node-icon-kante); display:flex; align-items:center; justify-content:center; overflow:hidden; background:rgba(15,23,42,.06); margin-right:.35rem; }
.htbah-map-node-icon-slot--eckig { border-radius:.2rem; border:1px solid rgba(108,117,125,.35); }
.htbah-map-node-icon-slot--rund { border-radius:50%; border:1px solid rgba(108,117,125,.3); }
.htbah-map-node-icon-bild { width:100%; height:100%; object-fit:cover; display:block; }
.htbah-map-node-icon-emoji { font-size:1.45rem; line-height:1; }
.htbah-map-node-text { flex:1 1 auto; min-width:0; display:flex; align-items:center; flex-wrap:wrap; gap:.15rem .35rem; padding:.35rem 0; }
.htbah-map-ort-bild { position:absolute; z-index:2; border:2px solid rgba(108,117,125,.65); border-radius:.45rem; overflow:hidden; box-shadow:0 .2rem .5rem rgba(0,0,0,.16); background:#fff; }
.htbah-map-ort-bild[data-map-element-type='notiz'] { background:var(--htbah-notiz-bg,#fff8bf); border-color:rgba(160,130,15,.75); z-index:9; }
.htbah-map-ort-bild[data-map-element-type='pfeil'] { background:transparent; border-style:dashed; border-color:rgba(40,40,40,.45); z-index:9; overflow:visible; }
.htbah-map-ort-bild img { width:100%; height:100%; display:block; object-fit:cover; pointer-events:none; }
.htbah-map-notiz-editor-host { width:100%; height:100%; padding:8px; font-size:10px; line-height:1.35; }
.htbah-map-pfeil-wrap { position:relative; width:100%; height:100%; display:flex; align-items:center; padding:10px 18px; pointer-events:none; }
.htbah-map-pfeil-schaft { height:var(--htbah-pfeil-linienstaerke,8px); flex:1 1 auto; border-radius:999px; background:var(--htbah-pfeil-farbe,#509b4a); box-shadow:inset 0 0 0 1px rgba(0,0,0,.16); }
.htbah-map-pfeil-spitze { width:0; height:0; border-top:var(--htbah-pfeil-spitzenhoehe,16px) solid transparent; border-bottom:var(--htbah-pfeil-spitzenhoehe,16px) solid transparent; border-left:var(--htbah-pfeil-spitzenbreite,28px) solid var(--htbah-pfeil-farbe,#509b4a); margin-left:calc(var(--htbah-pfeil-linienstaerke,8px)*-.9); }
.htbah-map-charakter-avatar-wrap { position:relative; width:var(--htbah-node-avatar-size,36px); height:var(--htbah-node-avatar-size,36px); flex:0 0 auto; }
.htbah-map-charakterbild { width:var(--htbah-node-avatar-size,36px); height:var(--htbah-node-avatar-size,36px); object-fit:cover; border-radius:999px; border:1px solid rgba(0,0,0,.12); }
.htbah-map-charakter-emoji { display:flex; align-items:center; justify-content:center; background:#f8f9fa; width:100%; height:100%; border-radius:999px; font-size:1.4rem; }
.htbah-map-charakter-status { position:absolute; top:-8px; left:-6px; font-size:14px; line-height:1; }
.htbah-map-node-kreis-meta { position:absolute; top:calc(100% + 6px); left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; z-index:4; pointer-events:none; }
.htbah-map-node-kreis-label { white-space:nowrap; font-size:calc(11px*var(--htbah-node-scale,1)); font-weight:600; color:#212529; background:#ffffff; border:1px solid #dee2e6; border-radius:999px; padding:2px 8px; box-shadow:0 2px 6px rgba(0,0,0,.18); }
.htbah-map-node-kreis-label .badge { font-size:9px; font-weight:600; padding:2px 6px; margin-left:4px; background:#0dcaf0; color:#055160; border-radius:999px; }
`;
  }

  function html2canvasOncloneIwExport(clonedDoc) {
    if (!clonedDoc || typeof clonedDoc.querySelectorAll !== 'function') {
      return;
    }
    clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => link.remove());
    clonedDoc.querySelectorAll('style').forEach((styleEl) => {
      const text = styleEl.textContent || '';
      if (/color-mix\s*\(/i.test(text)) {
        styleEl.remove();
      }
    });
    const style = clonedDoc.createElement('style');
    style.textContent = mapExportEssentialCssText();
    const ziel = clonedDoc.head || clonedDoc.body || clonedDoc.documentElement;
    if (ziel) {
      ziel.appendChild(style);
    }
  }

  function html2canvasOptionenIwExport(basis) {
    const opts = basis && typeof basis === 'object' ? { ...basis } : {};
    const vorhanden = opts.onclone;
    opts.onclone = (clonedDoc, clonedElement) => {
      html2canvasOncloneIwExport(clonedDoc);
      if (typeof vorhanden === 'function') {
        vorhanden(clonedDoc, clonedElement);
      }
    };
    return opts;
  }

  function entferneExportChrome(wurzel) {
    if (!wurzel || typeof wurzel.querySelectorAll !== 'function') {
      return;
    }
    wurzel
      .querySelectorAll(
        'button, .htbah-map-element-lock-button, .htbah-map-element-delete-button, .htbah-map-element-color-picker, .htbah-map-pfeil-resize-handle, .htbah-map-pfeil-rotate-handle, .htbah-map-ort-bild-rotate-handle, .htbah-map-ort-bild-resize, .htbah-map-pfeil-angle-badge, .htbah-map-notiz-drag-handle',
      )
      .forEach((el) => el.remove());
  }

  async function warteAufBilder(wurzel, timeoutMs) {
    if (!wurzel || typeof wurzel.querySelectorAll !== 'function') {
      return;
    }
    const imgs = Array.from(wurzel.querySelectorAll('img'));
    const pending = imgs.filter((img) => !img.complete);
    if (!pending.length) {
      return;
    }
    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise((resolve) => {
              const done = () => resolve();
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            }),
        ),
      ),
      new Promise((resolve) => window.setTimeout(resolve, timeoutMs || 8000)),
    ]);
  }

  function baueExportStageHtml(kontext) {
    const bounds = berechneBounds(kontext.graph, kontext.bildElemente, kontext.itemScale, {
      fuerPdf: !!kontext.fuerPdf,
    });
    let exportScale = 1;
    if (Math.max(bounds.w, bounds.h) > MAX_EXPORT_KANTE_PX) {
      exportScale = MAX_EXPORT_KANTE_PX / Math.max(bounds.w, bounds.h);
    }
    const stageW = Math.ceil(bounds.w * exportScale);
    const stageH = Math.ceil(bounds.h * exportScale);
    const offsetX = bounds.x;
    const offsetY = bounds.y;
    const itemScale = kontext.itemScale;
    const kanten = G().kantenLinienAusGraph(
      kontext.graph,
      kontext.edgeColor,
      kontext.edgeWidth,
    );
    let svgLines = '';
    kanten.forEach((k) => {
      const x1 = (k.x1 - offsetX) * exportScale;
      const y1 = (k.y1 - offsetY) * exportScale;
      const x2 = (k.x2 - offsetX) * exportScale;
      const y2 = (k.y2 - offsetY) * exportScale;
      svgLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escapeAttr(k.stroke)}" stroke-width="${k.strokeWidth}" stroke-opacity="0.8" stroke-linecap="round" />`;
    });
    const hintergrund =
      kontext.hintergrundDataUrl && kontext.hintergrundDataUrl.startsWith('data:')
        ? `<div class="htbah-weltenbau-map-hintergrund" style="background-image:url('${kontext.hintergrundDataUrl}');"></div><div class="htbah-weltenbau-map-grid-overlay" aria-hidden="true"></div>`
        : '';
    let nodesHtml = '';
    (kontext.graph.nodes || []).forEach((node) => {
      nodesHtml += nodeHtmlExport(node, offsetX, offsetY, itemScale, exportScale);
    });
    let bilderHtml = '';
    (kontext.bildElemente || []).forEach((bild) => {
      bilderHtml += bildElementHtmlExport(bild, offsetX, offsetY, exportScale);
    });

    const quillCss = U() ? U().quillHtmlBasisStyles() : '';
    return {
      bounds,
      scale: exportScale,
      stageW,
      stageH,
      html: `<div class="htbah-pdf-wurzel htbah-iw-export-host" style="width:${stageW}px;height:${stageH}px;position:relative;overflow:hidden;">
        <style>${mapExportEssentialCssText()}${quillCss}</style>
        <div class="htbah-weltenbau-map-stage htbah-iw-export-stage" style="position:relative;width:${stageW}px;height:${stageH}px;overflow:visible;">
          ${hintergrund}
          <svg class="htbah-weltenbau-map-edges" width="${stageW}" height="${stageH}" style="position:absolute;left:0;top:0;z-index:12;pointer-events:none;overflow:visible;">${svgLines}</svg>
          ${bilderHtml}
          ${nodesHtml}
        </div>
      </div>`,
    };
  }

  async function erzeugeCanvasVonMapStage(stageEl, kampagneId, optionen) {
    if (!(stageEl instanceof HTMLElement)) {
      throw new Error('Karten-Stage für Export nicht gefunden.');
    }
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const kontext = ladeKampagnenKontext(kampagneId);
    const bounds = berechneBounds(kontext.graph, kontext.bildElemente, kontext.itemScale, {
      fuerPdf: !!opts.fuerPdf,
    });
    let exportScale = 1;
    if (Math.max(bounds.w, bounds.h) > MAX_EXPORT_KANTE_PX) {
      exportScale = MAX_EXPORT_KANTE_PX / Math.max(bounds.w, bounds.h);
    }
    const stageW = Math.ceil(bounds.w * exportScale);
    const stageH = Math.ceil(bounds.h * exportScale);

    const host = document.createElement('div');
    host.className = 'htbah-iw-export-host';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `position:fixed;left:-99999px;top:0;width:${stageW}px;height:${stageH}px;overflow:hidden;background:#f4f6f8;z-index:-1;pointer-events:none;`;

    const viewport = document.createElement('div');
    viewport.style.cssText = `position:relative;width:${stageW}px;height:${stageH}px;overflow:hidden;`;

    const clone = stageEl.cloneNode(true);
    clone.classList.add('htbah-iw-export-capture');
    entferneExportChrome(clone);
    clone.style.position = 'absolute';
    clone.style.left = `${-bounds.x * exportScale}px`;
    clone.style.top = `${-bounds.y * exportScale}px`;
    clone.style.margin = '0';
    if (exportScale < 1) {
      clone.style.transform = `scale(${exportScale})`;
      clone.style.transformOrigin = '0 0';
    } else {
      clone.style.transform = 'none';
    }

    viewport.appendChild(clone);
    host.appendChild(viewport);
    document.body.appendChild(host);

    try {
      await warteAufBilder(clone);
      const canvas = await window.html2canvas(
        viewport,
        html2canvasOptionenIwExport({
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#f4f6f8',
          width: stageW,
          height: stageH,
          windowWidth: stageW,
          windowHeight: stageH,
        }),
      );
      return { canvas, kontext, stage: { bounds, scale: exportScale, stageW, stageH } };
    } finally {
      document.body.removeChild(host);
    }
  }

  function findeSichtbareMapStage() {
    const kandidaten = document.querySelectorAll('.htbah-weltenbau-map-stage');
    for (let i = 0; i < kandidaten.length; i += 1) {
      const el = kandidaten[i];
      if (!(el instanceof HTMLElement)) {
        continue;
      }
      const modal = el.closest('.modal');
      if (modal && modal.classList.contains('show')) {
        return el;
      }
    }
    return null;
  }

  async function erzeugeInteraktiveWeltCanvas(kampagneId, optionen) {
    if (typeof window.html2canvas !== 'function') {
      throw new Error('html2canvas fehlt.');
    }
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const stageEl =
      opts.mapStageElement instanceof HTMLElement
        ? opts.mapStageElement
        : findeSichtbareMapStage();
    if (stageEl) {
      return erzeugeCanvasVonMapStage(stageEl, kampagneId, opts);
    }
    const kontext = ladeKampagnenKontext(kampagneId);
    kontext.fuerPdf = !!opts.fuerPdf;
    const stage = baueExportStageHtml(kontext);
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    const canvas = await U().renderHtmlZuCanvas(stage.html, {
      breitePx: stage.stageW,
      hoehePx: stage.stageH,
      backgroundColor: '#f4f6f8',
      interaktiveWeltExport: true,
    });
    return { canvas, kontext, stage };
  }

  function canvasZuPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG-Export fehlgeschlagen.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  }

  function normalisiereWeltPdfSeitenAnzahl(seitenAnzahl) {
    const n = Number(seitenAnzahl);
    if (n === 1 || n === 2 || n === 4 || n === 8) {
      return n;
    }
    return 2;
  }

  function weltPdfRasterLayout(seitenAnzahl) {
    const n = normalisiereWeltPdfSeitenAnzahl(seitenAnzahl);
    if (n === 1) {
      return { n: 1, cols: 1, rows: 1 };
    }
    if (n === 8) {
      return { n: 8, cols: 2, rows: 4 };
    }
    if (n === 4) {
      return { n: 4, cols: 2, rows: 2 };
    }
    return { n: 2, cols: 1, rows: 2 };
  }

  function teileCanvasInRaster(canvas, seitenAnzahl) {
    const { n, cols, rows } = weltPdfRasterLayout(seitenAnzahl);
    const tileW = Math.ceil(canvas.width / cols);
    const tileH = Math.ceil(canvas.height / rows);
    const tiles = [];
    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        index += 1;
        const sx = col * tileW;
        const sy = row * tileH;
        const sw = Math.min(tileW, canvas.width - sx);
        const sh = Math.min(tileH, canvas.height - sy);
        const tile = document.createElement('canvas');
        tile.width = sw;
        tile.height = sh;
        const ctx = tile.getContext('2d');
        if (!ctx) {
          continue;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        tiles.push({ canvas: tile, label: `Interaktive Welt (${index}/${n})` });
      }
    }
    return tiles;
  }

  async function erzeugeInteraktiveWeltPng(kampagneId, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const { canvas } = await erzeugeInteraktiveWeltCanvas(kampagneId, opts);
    const blob = await canvasZuPngBlob(canvas);
    const sl = window.HTBAH.ladeSpielleiterZustand();
    const kampagne = (sl.kampagnen || []).find((k) => k && k.id === kampagneId);
    const name = U().sichererDateinameTeil(kampagne && kampagne.name, 'kampagne');
    const zeit = U().dateinameZeitstempel();
    return {
      blob,
      dateiname: `htbah-interaktive-welt-${name}-${zeit}.png`,
    };
  }

  async function erzeugeInteraktiveWeltPdfTiles(kampagneId, seitenAnzahl, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const { canvas } = await erzeugeInteraktiveWeltCanvas(kampagneId, { ...opts, fuerPdf: true });
    return teileCanvasInRaster(canvas, normalisiereWeltPdfSeitenAnzahl(seitenAnzahl));
  }

  window.HTBAH_SHARED.InteraktiveWeltExport = {
    ladeKampagnenKontext,
    findeSichtbareMapStage,
    berechneBounds,
    baueExportStageHtml,
    erzeugeInteraktiveWeltCanvas,
    erzeugeCanvasVonMapStage,
    erzeugeInteraktiveWeltPng,
    erzeugeInteraktiveWeltPdfTiles,
    normalisiereWeltPdfSeitenAnzahl,
    weltPdfRasterLayout,
    teileCanvasInRaster,
    mapExportEssentialCssText,
    html2canvasOncloneIwExport,
    html2canvasOptionenIwExport,
  };

  window.HTBAH = window.HTBAH || {};
  window.HTBAH.erzeugeInteraktiveWeltPng = erzeugeInteraktiveWeltPng;
})();
