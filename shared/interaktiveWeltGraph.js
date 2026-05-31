/**
 * Graph- und Karten-Element-Logik der interaktiven Welt (ohne Vue).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerInteraktiveWeltGraph() {
  function textWert(v, fallback) {
    const t = typeof v === 'string' ? v.trim() : '';
    return t || (fallback != null ? fallback : '—');
  }

  function kartenIconApi() {
    return window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon
      ? window.HTBAH_SHARED.EntityKartenIcon
      : null;
  }

  function graphKnotenLabel(payload, entityTyp) {
    const api = kartenIconApi();
    if (api && typeof api.entitaetAnzeigeName === 'function') {
      return textWert(api.entitaetAnzeigeName(payload, entityTyp));
    }
    const name =
      entityTyp === 'raetsel' && payload ? payload.titel : payload && payload.name;
    return textWert(name);
  }

  function graphKnotenIconAnzeige(payload, entityTyp) {
    const api = kartenIconApi();
    if (!api || typeof api.kartenIconAnzeige !== 'function') {
      return { art: 'emoji', emoji: '📌', form: 'eckig', istBenutzerdefiniert: false };
    }
    return api.kartenIconAnzeige(payload, entityTyp);
  }

  function statusFuerLebenspunkte(row) {
    if (!row || typeof window.HTBAH.berechneLebenspunkteStatus !== 'function') {
      return { tot: false, bewusstlos: false };
    }
    return window.HTBAH.berechneLebenspunkteStatus(row);
  }

  function warningEntityStyle() {
    return {
      background: '#fff3cd',
      borderColor: '#ffc107',
      color: '#664d03',
    };
  }

  function dangerEntityStyle() {
    return {
      background: '#f8d7da',
      borderColor: '#dc3545',
      color: '#842029',
    };
  }

  function mediumIstBild(medium) {
    const E = window.HTBAH_SHARED.EntitaetDetailFelder;
    if (E && typeof E.mediumIstBild === 'function') {
      return E.mediumIstBild(medium);
    }
    return false;
  }

  function entitaetBildDataUrl(payload) {
    if (!payload || typeof payload !== 'object') {
      return '';
    }
    const medien = Array.isArray(payload.medien) ? payload.medien : [];
    const bilder = medien.filter((m) => mediumIstBild(m));
    if (!bilder.length) {
      return '';
    }
    const primaryId = typeof payload.primaryMediumId === 'string' ? payload.primaryMediumId.trim() : '';
    if (primaryId) {
      const gefunden = bilder.find((bild) => bild.id === primaryId);
      if (gefunden && typeof gefunden.dataUrl === 'string') {
        return gefunden.dataUrl;
      }
    }
    return typeof bilder[0].dataUrl === 'string' ? bilder[0].dataUrl : '';
  }

  function fraktionOrteListe(fraktion) {
    const E = window.HTBAH_SHARED.EntitaetDetailFelder;
    if (E && typeof E.fraktionOrteListe === 'function') {
      return E.fraktionOrteListe(fraktion);
    }
    return [];
  }

  function normalisiereFraktionenArray(wert) {
    if (Array.isArray(wert)) {
      return wert.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean);
    }
    if (typeof wert === 'string' && wert.trim()) {
      return [wert.trim()];
    }
    return [];
  }

  function entitaetFraktionsNamen(entityType, row) {
    if (!row || typeof row !== 'object') {
      return [];
    }
    if (entityType === 'npc') {
      return normalisiereFraktionenArray(row.fraktion);
    }
    if (entityType === 'bestie' || entityType === 'charakter') {
      const liste = normalisiereFraktionenArray(row.fraktionen);
      if (liste.length) {
        return liste;
      }
      return normalisiereFraktionenArray(row.fraktion);
    }
    return [];
  }

  function fraktionNodeIdsFuerNamen(fraktionNamen, ortName, fraktionByName, fraktionNodeByOrtSchluessel) {
    if (!Array.isArray(fraktionNamen) || !fraktionNamen.length) {
      return [];
    }
    return fraktionNamen
      .map((name) => {
        const fraktion = fraktionByName.get(name);
        if (!fraktion) {
          return '';
        }
        return (
          fraktionNodeByOrtSchluessel.get(`${fraktion.id}::${ortName}`) ||
          fraktionNodeByOrtSchluessel.get(`${fraktion.id}::`) ||
          ''
        );
      })
      .filter(Boolean);
  }

  function gegenstaendeMitAufgeloestemBesitzer(zustand, aktiveGruppe) {
    const zuordnung = new Map();
    const ausInventar = (typ, entityId, inventar) => {
      const besitzerId = String(entityId || '').trim();
      if (!besitzerId) {
        return;
      }
      (Array.isArray(inventar) ? inventar : []).forEach((item) => {
        const gegenstandId = String(item && item.gegenstandId ? item.gegenstandId : '').trim();
        if (gegenstandId) {
          zuordnung.set(gegenstandId, { typ, id: besitzerId });
        }
      });
    };
    (zustand.npcs || []).forEach((npc) => {
      if (npc && npc.id) {
        ausInventar('npc', npc.id, npc.inventar);
      }
    });
    (zustand.bestien || []).forEach((bestie) => {
      if (bestie && bestie.id) {
        ausInventar('bestie', bestie.id, bestie.inventar);
      }
    });
    const mitglieder = aktiveGruppe && Array.isArray(aktiveGruppe.mitglieder) ? aktiveGruppe.mitglieder : [];
    mitglieder.forEach((mitglied) => {
      if (!mitglied || !mitglied.id) {
        return;
      }
      ausInventar('charakter', mitglied.id, (mitglied.charakter || {}).inventar);
    });
    return (zustand.gegenstaende || []).map((g) => {
      if (!g || !g.id) {
        return g;
      }
      const inv = zuordnung.get(String(g.id));
      if (!inv) {
        return g;
      }
      const besitzerTyp = String(g.besitzerTyp || '').trim();
      const besitzerId = String(g.besitzerId || '').trim();
      if (besitzerTyp && besitzerId) {
        return g;
      }
      return { ...g, besitzerTyp: inv.typ, besitzerId: inv.id };
    });
  }

  function ergaenzeBesitzerKanten(nodes, edges, gegenstaende) {
    const nodeIds = new Set((nodes || []).map((n) => n && n.id).filter(Boolean));
    const edgeIds = new Set((edges || []).map((e) => e && e.id).filter(Boolean));
    (gegenstaende || []).forEach((g) => {
      if (!g || !g.id) {
        return;
      }
      const typ = String(g.besitzerTyp || '').trim();
      const id = String(g.besitzerId || '').trim();
      if (!typ || !id) {
        return;
      }
      const besitzerKey = `${typ}:${id}`;
      const gegenstandKey = `gegenstand:${g.id}`;
      const edgeId = `e-${besitzerKey}-${gegenstandKey}`;
      if (!nodeIds.has(besitzerKey) || !nodeIds.has(gegenstandKey) || edgeIds.has(edgeId)) {
        return;
      }
      edges.push({
        id: edgeId,
        source: besitzerKey,
        target: gegenstandKey,
        type: 'straight',
      });
      edgeIds.add(edgeId);
    });
  }

  function nodeBreite(node) {
    const w = node && node.style && Number(node.style.width);
    return Number.isFinite(w) && w > 0 ? w : 200;
  }

  function nodeHoehe(node) {
    const entityType = node && node.data ? node.data.entityType : '';
    if (entityType === 'charakter' || entityType === 'npc' || entityType === 'bestie') {
      return 86;
    }
    return 52;
  }

  /**
   * @param {object} kontext
   * @param {object} kontext.zustand - Zufallstabellen-Zustand
   * @param {object} kontext.layout - Layout-Map für gruppeKey
   * @param {string} kontext.gruppeId
   * @param {object|null} kontext.aktiveGruppe - Spielleitung-Kampagne mit mitglieder
   * @param {object} kontext.sichtbarkeitsFilter
   */
  function baueGraph(kontext) {
    const ctx = kontext && typeof kontext === 'object' ? kontext : {};
    const zustand = ctx.zustand && typeof ctx.zustand === 'object' ? ctx.zustand : {};
    const layout = ctx.layout && typeof ctx.layout === 'object' ? ctx.layout : {};
    const gruppeId = typeof ctx.gruppeId === 'string' ? ctx.gruppeId : 'default';
    const aktiveGruppe = ctx.aktiveGruppe || null;
    const filter = {
      toteNpcsAnzeigen: true,
      toteBestienAnzeigen: true,
      geloesteRaetselAnzeigen: true,
      ...(ctx.sichtbarkeitsFilter && typeof ctx.sichtbarkeitsFilter === 'object'
        ? ctx.sichtbarkeitsFilter
        : {}),
    };

    const gegenstaende = gegenstaendeMitAufgeloestemBesitzer(zustand, aktiveGruppe);
    const ortNodes = (zustand.orte || []).map((ort, idx) => {
      const key = `ort:${ort.id}`;
      return {
        id: key,
        position: layout[key] || { x: 180 + idx * 260, y: 180 + (idx % 3) * 220 },
        data: {
          label: graphKnotenLabel(ort, 'ort'),
          kartenIconAnzeige: graphKnotenIconAnzeige(ort, 'ort'),
          entityType: 'ort',
          entityId: ort.id,
          payload: ort,
        },
        style: { width: 220 },
      };
    });
    const ortByName = new Map((zustand.orte || []).map((o) => [String(o.name || '').trim(), o]));
    const gegenstandById = new Map(
      gegenstaende.filter((g) => g && g.id).map((g) => [String(g.id), g]),
    );
    const edges = [];
    const nodes = ortNodes.slice();
    const fraktionByName = new Map(
      (zustand.fraktionen || [])
        .filter((f) => f && String(f.name || '').trim())
        .map((f) => [String(f.name || '').trim(), f]),
    );
    const fraktionNodeByOrtSchluessel = new Map();

    (zustand.fraktionen || []).forEach((fraktion, idx) => {
      const orte = fraktionOrteListe(fraktion);
      if (!orte.length) {
        const key = `fraktion:${fraktion.id}:ohne-ort`;
        fraktionNodeByOrtSchluessel.set(`${fraktion.id}::`, key);
        nodes.push({
          id: key,
          position: layout[key] || { x: 900, y: 140 + idx * 90 },
          data: {
            label: graphKnotenLabel(fraktion, 'fraktion'),
            kartenIconAnzeige: graphKnotenIconAnzeige(fraktion, 'fraktion'),
            entityType: 'fraktion',
            entityId: fraktion.id,
            payload: fraktion,
          },
          style: { width: 210 },
        });
        return;
      }
      orte.forEach((ortName, ortIndex) => {
        const ort = ortByName.get(ortName);
        if (!ort) {
          return;
        }
        const key = `fraktion:${fraktion.id}:ort:${ort.id}`;
        fraktionNodeByOrtSchluessel.set(`${fraktion.id}::${ortName}`, key);
        const ortAnchor = layout[`ort:${ort.id}`] || { x: 280, y: 200 };
        nodes.push({
          id: key,
          position:
            layout[key] || {
              x: ortAnchor.x + 260 + (ortIndex % 2) * 40,
              y: ortAnchor.y + 90 + Math.floor(ortIndex / 2) * 70,
            },
          data: {
            label: graphKnotenLabel(fraktion, 'fraktion'),
            kartenIconAnzeige: graphKnotenIconAnzeige(fraktion, 'fraktion'),
            entityType: 'fraktion',
            entityId: fraktion.id,
            payload: fraktion,
          },
          style: { width: 210 },
        });
        edges.push({
          id: `e-ort:${ort.id}-${key}-${ortName}`,
          source: `ort:${ort.id}`,
          target: key,
        });
      });
    });

    const pushEnt = (prefix, liste, ortFeld, fallbackY, statusFaerben) => {
      (liste || []).forEach((row, idx) => {
        const key = `${prefix}:${row.id}`;
        const ortName = String(row[ortFeld] || '').trim();
        const ort = ortByName.get(ortName);
        const fraktionNamen = entitaetFraktionsNamen(prefix, row);
        const fraktionNodeIds = fraktionNodeIdsFuerNamen(
          fraktionNamen,
          ortName,
          fraktionByName,
          fraktionNodeByOrtSchluessel,
        );
        const inGegenstandId = prefix === 'gegenstand' ? String(row.inGegenstandId || '').trim() : '';
        const raetselGegenstandId = prefix === 'raetsel' ? String(row.gegenstandId || '').trim() : '';
        const besitzerTyp = prefix === 'gegenstand' ? String(row.besitzerTyp || '').trim() : '';
        const besitzerId = prefix === 'gegenstand' ? String(row.besitzerId || '').trim() : '';
        let besitzerKey = '';
        if (besitzerTyp === 'npc' && besitzerId) {
          besitzerKey = `npc:${besitzerId}`;
        } else if (besitzerTyp === 'bestie' && besitzerId) {
          besitzerKey = `bestie:${besitzerId}`;
        } else if (besitzerTyp === 'charakter' && besitzerId) {
          besitzerKey = `charakter:${besitzerId}`;
        }
        const traegerGegenstandId = raetselGegenstandId || inGegenstandId;
        const traegerGegenstand = traegerGegenstandId ? gegenstandById.get(traegerGegenstandId) : null;
        const traegerGegenstandKey =
          traegerGegenstandId && traegerGegenstand ? `gegenstand:${traegerGegenstandId}` : '';
        const hatParentGegenstand = !!traegerGegenstandKey;
        const hatBesitzer = !!besitzerKey;
        const traegerOrtName = traegerGegenstand
          ? String(traegerGegenstand.aufenthaltsort || '').trim()
          : ortName;
        const traegerOrt = traegerOrtName ? ortByName.get(traegerOrtName) : ort;
        const anchor =
          traegerGegenstandKey && layout[traegerGegenstandKey]
            ? layout[traegerGegenstandKey]
            : besitzerKey && layout[besitzerKey]
              ? layout[besitzerKey]
              : fraktionNodeIds.length
                ? layout[fraktionNodeIds[0]] || { x: 520, y: 280 }
                : traegerOrt
                  ? layout[`ort:${traegerOrt.id}`] || { x: 280, y: 200 }
                  : ort
                    ? layout[`ort:${ort.id}`] || { x: 280, y: 200 }
                    : { x: 1200, y: 140 + fallbackY };
        const nestOffsetX =
          traegerGegenstandId || besitzerKey ? 24 + (idx % 2) * 108 : (idx % 3) * 210;
        const nestOffsetY =
          traegerGegenstandId || besitzerKey ? 58 + Math.floor(idx / 2) * 72 : Math.floor(idx / 3) * 120;
        const status = statusFaerben ? statusFuerLebenspunkte(row) : { tot: false, bewusstlos: false };
        if (prefix === 'npc' && status.tot && !filter.toteNpcsAnzeigen) {
          return;
        }
        if (prefix === 'bestie' && status.tot && !filter.toteBestienAnzeigen) {
          return;
        }
        if (prefix === 'raetsel' && row && row.geloest && !filter.geloesteRaetselAnzeigen) {
          return;
        }
        const styleExtra = status.tot
          ? dangerEntityStyle()
          : status.bewusstlos
            ? warningEntityStyle()
            : {};
        const istKreisTyp = prefix === 'npc' || prefix === 'bestie';
        nodes.push({
          id: key,
          position:
            layout[key] || {
              x: anchor.x + (traegerGegenstandId || besitzerKey ? nestOffsetX : 240 + nestOffsetX),
              y: anchor.y + nestOffsetY,
            },
          data: {
            label: graphKnotenLabel(row, prefix),
            kartenIconAnzeige:
              prefix === 'raetsel' || prefix === 'gegenstand'
                ? graphKnotenIconAnzeige(row, prefix)
                : null,
            entityType: prefix,
            entityId: row.id,
            payload: row,
            avatarDataUrl: prefix === 'npc' || prefix === 'bestie' ? entitaetBildDataUrl(row) : '',
            charakterBild: '',
            initiative: typeof row.initiative === 'string' ? row.initiative : '',
            statusEmoji: status.tot ? '💀' : status.bewusstlos ? '😵' : '',
          },
          style: { width: istKreisTyp ? 86 : 200, ...styleExtra },
        });
        if (hatParentGegenstand) {
          edges.push({ id: `e-${traegerGegenstandKey}-${key}`, source: traegerGegenstandKey, target: key });
        } else if (hatBesitzer) {
          edges.push({ id: `e-${besitzerKey}-${key}`, source: besitzerKey, target: key });
        } else {
          if (ort && !fraktionNodeIds.length) {
            edges.push({ id: `e-${key}-ort:${ort.id}`, source: `ort:${ort.id}`, target: key });
          }
          fraktionNodeIds.forEach((fraktionNodeId, fraktionIndex) => {
            edges.push({
              id: `e-${fraktionNodeId}-${key}-${fraktionIndex}`,
              source: fraktionNodeId,
              target: key,
            });
          });
        }
      });
    };

    pushEnt('npc', zustand.npcs, 'aufenthaltsort', 60, true);
    pushEnt('bestie', zustand.bestien, 'aufenthaltsort', 260, true);
    pushEnt('gegenstand', gegenstaende, 'aufenthaltsort', 460, false);
    pushEnt('raetsel', zustand.raetsel, 'aufenthaltsort', 660, false);

    nodes.forEach((node) => {
      if (!(node && node.data && node.data.entityType === 'raetsel')) {
        return;
      }
      if (node.data.payload && node.data.payload.geloest) {
        node.data.statusEmoji = '✅';
      }
    });

    const mitglieder = aktiveGruppe && Array.isArray(aktiveGruppe.mitglieder) ? aktiveGruppe.mitglieder : [];
    mitglieder.forEach((m, idx) => {
      const char = m.charakter || {};
      const ortName = String(char.aufenthaltsort || '').trim();
      const ort = ortByName.get(ortName);
      const fraktionNamen = entitaetFraktionsNamen('charakter', char);
      const fraktionNodeIds = fraktionNodeIdsFuerNamen(
        fraktionNamen,
        ortName,
        fraktionByName,
        fraktionNodeByOrtSchluessel,
      );
      const anchor = fraktionNodeIds.length
        ? layout[fraktionNodeIds[0]] || { x: 520, y: 240 }
        : ort
          ? layout[`ort:${ort.id}`] || { x: 220, y: 120 }
          : { x: 150, y: 40 };
      const status = statusFuerLebenspunkte(char);
      const statusEmoji = status.tot ? '💀' : status.bewusstlos ? '😵' : '';
      const charStatusStyle = status.tot
        ? dangerEntityStyle()
        : status.bewusstlos
          ? warningEntityStyle()
          : {};
      const key = `charakter:${m.id}`;
      nodes.push({
        id: key,
        position: layout[key] || { x: anchor.x + (idx % 3) * 180, y: anchor.y - 150 + Math.floor(idx / 3) * 90 },
        data: {
          label: textWert(char.name, 'Charakter'),
          entityType: 'charakter',
          entityId: m.id,
          payload: char,
          charakterBild: typeof m.charakterBild === 'string' ? m.charakterBild : '',
          avatarDataUrl: '',
          initiative: typeof char.initiative === 'string' ? char.initiative : '',
          statusEmoji,
        },
        style: { width: 86, ...charStatusStyle },
      });
      if (ort && !fraktionNodeIds.length) {
        edges.push({ id: `e-ort:${ort.id}-${key}`, source: `ort:${ort.id}`, target: key });
      }
      fraktionNodeIds.forEach((fraktionNodeId, fraktionIndex) => {
        edges.push({
          id: `e-${fraktionNodeId}-${key}-${fraktionIndex}`,
          source: fraktionNodeId,
          target: key,
        });
      });
    });

    ergaenzeBesitzerKanten(nodes, edges, gegenstaende);
    return { nodes, edges, gruppeKey: gruppeId };
  }

  function ladeFreieBildAuswahl(wb, gruppeKey) {
    const map = wb && wb.mapFreieBilder && typeof wb.mapFreieBilder === 'object' ? wb.mapFreieBilder : {};
    const liste = Array.isArray(map[gruppeKey]) ? map[gruppeKey] : [];
    return liste
      .map((eintrag) => {
        const bildId = String((eintrag && eintrag.bildId) || '').trim();
        const eintragId = String((eintrag && eintrag.eintragId) || '').trim();
        const name = String((eintrag && eintrag.name) || '').trim();
        if (!bildId || !eintragId) {
          return null;
        }
        return { bildId, eintragId, name: name || 'Bild' };
      })
      .filter(Boolean);
  }

  function ladeFreieNotizen(wb, gruppeKey) {
    const map = wb && wb.mapFreieNotizen && typeof wb.mapFreieNotizen === 'object' ? wb.mapFreieNotizen : {};
    const liste = Array.isArray(map[gruppeKey]) ? map[gruppeKey] : [];
    return liste
      .map((eintrag) => {
        const notizId = String((eintrag && eintrag.notizId) || '').trim();
        if (!notizId) {
          return null;
        }
        return {
          notizId,
          html: typeof (eintrag && eintrag.html) === 'string' ? eintrag.html : '',
          bgColor:
            typeof (eintrag && eintrag.bgColor) === 'string' &&
            /^#[0-9a-fA-F]{6}$/.test(String(eintrag.bgColor).trim())
              ? String(eintrag.bgColor).trim()
              : '#fff8bf',
        };
      })
      .filter(Boolean);
  }

  function ladeFreiePfeile(wb, gruppeKey) {
    const map = wb && wb.mapFreiePfeile && typeof wb.mapFreiePfeile === 'object' ? wb.mapFreiePfeile : {};
    const liste = Array.isArray(map[gruppeKey]) ? map[gruppeKey] : [];
    return liste
      .map((eintrag) => {
        const pfeilId = String((eintrag && eintrag.pfeilId) || '').trim();
        if (!pfeilId) {
          return null;
        }
        const farbeRaw = String((eintrag && eintrag.farbe) || '').trim();
        return {
          pfeilId,
          farbe: /^#[0-9a-fA-F]{6}$/.test(farbeRaw) ? farbeRaw : '#509b4a',
        };
      })
      .filter(Boolean);
  }

  function sammleOrtBildElemente(kontext) {
    const ctx = kontext && typeof kontext === 'object' ? kontext : {};
    const zustand = ctx.zustand || {};
    const wb = ctx.weltenbau || {};
    const gruppeKey = typeof ctx.gruppeId === 'string' ? ctx.gruppeId : 'default';
    const gruppeLayouts =
      ctx.layouts && typeof ctx.layouts === 'object'
        ? ctx.layouts
        : wb.mapBildLayouts && wb.mapBildLayouts[gruppeKey]
          ? wb.mapBildLayouts[gruppeKey]
          : {};

    const ortBilder = (zustand.orte || [])
      .map((ort, index) => {
        const dataUrl = entitaetBildDataUrl(ort);
        if (!dataUrl) {
          return null;
        }
        const ortNodeId = `ort:${ort.id}`;
        const bildId = `ortbild:${ort.id}`;
        const layout =
          (gruppeLayouts[ortNodeId] && typeof gruppeLayouts[ortNodeId] === 'object'
            ? gruppeLayouts[ortNodeId]
            : null) ||
          (gruppeLayouts[`ortbild:${ort.id}`] && typeof gruppeLayouts[`ortbild:${ort.id}`] === 'object'
            ? gruppeLayouts[`ortbild:${ort.id}`]
            : null) ||
          {};
        return {
          ankerTyp: 'ort',
          bildId,
          x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 140 + index * 40,
          y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 120 + index * 30,
          width: Number.isFinite(Number(layout.width)) ? Math.max(1, Math.round(Number(layout.width))) : 320,
          height: Number.isFinite(Number(layout.height)) ? Math.max(1, Math.round(Number(layout.height))) : 220,
          angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
          dataUrl,
          notizHtml: '',
          notizBgColor: '#fff8bf',
          pfeilFarbe: '#509b4a',
        };
      })
      .filter(Boolean);

    const alleEintraege = Array.isArray(wb.eintraege) ? wb.eintraege : [];
    const eintragById = new Map(alleEintraege.map((eintrag) => [eintrag && eintrag.id, eintrag]));

    const freieBilder = ladeFreieBildAuswahl(wb, gruppeKey)
      .map((auswahl, index) => {
        const eintrag = eintragById.get(auswahl && auswahl.eintragId);
        const dataUrl = eintrag && typeof eintrag.dataUrl === 'string' ? eintrag.dataUrl : '';
        if (!dataUrl) {
          return null;
        }
        const bildId = String((auswahl && auswahl.bildId) || '').trim();
        const layoutKey = bildId;
        const layout =
          (gruppeLayouts[layoutKey] && typeof gruppeLayouts[layoutKey] === 'object'
            ? gruppeLayouts[layoutKey]
            : null) ||
          (gruppeLayouts[`freibild:${bildId}`] && typeof gruppeLayouts[`freibild:${bildId}`] === 'object'
            ? gruppeLayouts[`freibild:${bildId}`]
            : null) ||
          {};
        return {
          ankerTyp: 'frei',
          bildId,
          x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 220 + index * 34,
          y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 180 + index * 28,
          width: Number.isFinite(Number(layout.width)) ? Math.max(1, Math.round(Number(layout.width))) : 320,
          height: Number.isFinite(Number(layout.height)) ? Math.max(1, Math.round(Number(layout.height))) : 220,
          angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
          dataUrl,
          notizHtml: '',
          notizBgColor: '#fff8bf',
          pfeilFarbe: '#509b4a',
        };
      })
      .filter(Boolean);

    const freieNotizen = ladeFreieNotizen(wb, gruppeKey)
      .map((eintrag, index) => {
        const notizId = String((eintrag && eintrag.notizId) || '').trim();
        const layout = gruppeLayouts[notizId] && typeof gruppeLayouts[notizId] === 'object' ? gruppeLayouts[notizId] : {};
        return {
          ankerTyp: 'notiz',
          bildId: notizId,
          x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 280 + index * 30,
          y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 220 + index * 24,
          width: Number.isFinite(Number(layout.width)) ? Math.max(220, Math.round(Number(layout.width))) : 220,
          height: Number.isFinite(Number(layout.height)) ? Math.max(56, Math.round(Number(layout.height))) : 56,
          angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
          dataUrl: '',
          notizHtml: typeof eintrag.html === 'string' ? eintrag.html : '',
          notizBgColor: eintrag.bgColor,
          pfeilFarbe: '#509b4a',
        };
      })
      .filter(Boolean);

    const freiePfeile = ladeFreiePfeile(wb, gruppeKey)
      .map((eintrag, index) => {
        const pfeilId = String((eintrag && eintrag.pfeilId) || '').trim();
        const layout = gruppeLayouts[pfeilId] && typeof gruppeLayouts[pfeilId] === 'object' ? gruppeLayouts[pfeilId] : {};
        return {
          ankerTyp: 'pfeil',
          bildId: pfeilId,
          x: Number.isFinite(Number(layout.x)) ? Math.round(Number(layout.x)) : 320 + index * 36,
          y: Number.isFinite(Number(layout.y)) ? Math.round(Number(layout.y)) : 320 + index * 20,
          width: Number.isFinite(Number(layout.width)) ? Math.max(220, Math.round(Number(layout.width))) : 220,
          height: Number.isFinite(Number(layout.height)) ? Math.max(56, Math.round(Number(layout.height))) : 56,
          angleDeg: Number.isFinite(Number(layout.angleDeg)) ? Number(layout.angleDeg) : 0,
          dataUrl: '',
          notizHtml: '',
          notizBgColor: '#fff8bf',
          pfeilFarbe: eintrag.farbe,
        };
      })
      .filter(Boolean);

    return [...ortBilder, ...freieBilder, ...freieNotizen, ...freiePfeile];
  }

  function kantenLinienAusGraph(graph, edgeColor, edgeWidth) {
    const byId = new Map((graph.nodes || []).map((n) => [n.id, n]));
    const color = typeof edgeColor === 'string' ? edgeColor : '#5c636a';
    const width = Number.isFinite(Number(edgeWidth)) ? Number(edgeWidth) : 4;
    return (graph.edges || [])
      .map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) {
          return null;
        }
        const sc = knotenCenter(source);
        const tc = knotenCenter(target);
        return {
          id: edge.id,
          x1: sc.cx,
          y1: sc.cy,
          x2: tc.cx,
          y2: tc.cy,
          stroke: color,
          strokeWidth: width,
        };
      })
      .filter(Boolean);
  }

  function knotenCenter(node) {
    const x = (node.position && Number(node.position.x)) || 0;
    const y = (node.position && Number(node.position.y)) || 0;
    const w = nodeBreite(node);
    const h = nodeHoehe(node);
    const entityType = node && node.data ? node.data.entityType : '';
    const istKreis =
      entityType === 'charakter' || entityType === 'npc' || entityType === 'bestie';
    if (istKreis) {
      const d = Math.max(30, Math.round(Math.min(w, h) * 0.78));
      return { cx: x + d / 2, cy: y + d / 2, w: d, h: d };
    }
    return { cx: x + w / 2, cy: y + h / 2, w, h };
  }

  window.HTBAH_SHARED.InteraktiveWeltGraph = {
    baueGraph,
    sammleOrtBildElemente,
    kantenLinienAusGraph,
    nodeBreite,
    nodeHoehe,
    knotenCenter,
    entitaetBildDataUrl,
    graphKnotenLabel,
    graphKnotenIconAnzeige,
  };
})();
