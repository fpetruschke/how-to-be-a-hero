window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function () {
  const ENTITY_LINK_PREFIX = 'https://htbah.local/entity/';
  const NAV_TARGET_KEY = 'htbah_mention_nav_target';
  const MENTION_TYP_SORT = {
    charakter: 0,
    npc: 1,
    ort: 2,
    fraktion: 3,
    gegenstand: 4,
    bestie: 5,
    raetsel: 6,
    pantheon: 7,
  };
  const TYP_ALIAS = {
    charakter: ['charakter', 'charaktere', 'held', 'helden', 'character', 'characters'],
    npc: ['npc', 'npcs'],
    ort: ['ort', 'orte', 'location', 'locations'],
    fraktion: ['fraktion', 'fraktionen', 'faction', 'factions'],
    gegenstand: ['gegenstand', 'gegenstaende', 'gegenstände', 'item', 'items', 'objekt', 'objekte'],
    bestie: ['bestie', 'bestien', 'monster', 'kreatur', 'kreaturen'],
    raetsel: ['rätsel', 'raetsel', 'puzzle', 'puzzles'],
    pantheon: ['pantheon', 'gottheit', 'gottheiten', 'gott', 'goetter', 'götter'],
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseEntityLink(href) {
    if (typeof href !== 'string' || !href) {
      return null;
    }
    const trimmed = href.trim();
    const legacyPrefix = 'htbah://entity/';
    const prefix = trimmed.startsWith(ENTITY_LINK_PREFIX)
      ? ENTITY_LINK_PREFIX
      : trimmed.startsWith(legacyPrefix)
        ? legacyPrefix
        : '';
    if (!prefix) {
      return null;
    }
    const rest = trimmed.slice(prefix.length);
    const firstSlash = rest.indexOf('/');
    if (firstSlash <= 0) {
      return null;
    }
    const entityType = decodeURIComponent(rest.slice(0, firstSlash));
    const entityId = decodeURIComponent(rest.slice(firstSlash + 1));
    if (!entityType || !entityId) {
      return null;
    }
    return { entityType, entityId };
  }

  function entityLink(entityType, entityId) {
    if (!entityType || !entityId) {
      return '';
    }
    return `${ENTITY_LINK_PREFIX}${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`;
  }

  function mentionScore(name, query) {
    const n = String(name || '').trim().toLowerCase();
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      return 500;
    }
    if (n === q) {
      return 0;
    }
    if (`@${n}` === q || n === q.replace(/^@+/, '')) {
      return 1;
    }
    if (n.startsWith(q)) {
      return 2;
    }
    if (n.split(/\s+/).some((teil) => teil.startsWith(q))) {
      return 3;
    }
    if (n.includes(q)) {
      return 4;
    }
    return 99;
  }

  function typAliasTreffer(query, entityType) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      return false;
    }
    const aliases = TYP_ALIAS[entityType] || [];
    return aliases.some((alias) => alias === q || alias.startsWith(q) || q.startsWith(alias));
  }

  function pushEntity(list, query, entityType, row, nameField) {
    if (!row || typeof row !== 'object') {
      return;
    }
    const id = String(row.id || '').trim();
    const name = String(row[nameField] || '').trim();
    if (!id || !name) {
      return;
    }
    const nameScore = mentionScore(name, query);
    const groupHit = typAliasTreffer(query, entityType);
    let score = nameScore;
    if (groupHit) {
      // Gruppen-/Typbegriffe wie "@fraktion" sollen die Typ-Ergebnisse sichtbar machen.
      score = Math.min(score, 5);
    }
    if (score >= 99 && !groupHit) {
      return;
    }
    const typTitel = {
      charakter: 'Charakter',
      npc: 'NPC',
      ort: 'Ort',
      fraktion: 'Fraktion',
      pantheon: 'Gottheit',
      raetsel: 'Rätsel',
      bestie: 'Bestie',
      gegenstand: 'Gegenstand',
    };
    list.push({
      entityType,
      entityId: id,
      name,
      score,
      untertitel: typTitel[entityType] || 'Entität',
    });
  }

  function collectMentionItems(queryText, opts) {
    const options = opts && typeof opts === 'object' ? opts : {};
    const query = String(queryText || '').trim().toLowerCase();
    const result = [];
    const z = window.HTBAH && typeof window.HTBAH.ladeZufallstabellenZustand === 'function'
      ? window.HTBAH.ladeZufallstabellenZustand()
      : {};
    (z.npcs || []).forEach((row) => pushEntity(result, query, 'npc', row, 'name'));
    (z.orte || []).forEach((row) => pushEntity(result, query, 'ort', row, 'name'));
    (z.fraktionen || []).forEach((row) => pushEntity(result, query, 'fraktion', row, 'name'));
    (z.pantheon || []).forEach((row) => pushEntity(result, query, 'pantheon', row, 'name'));
    (z.raetsel || []).forEach((row) => pushEntity(result, query, 'raetsel', row, 'titel'));
    (z.bestien || []).forEach((row) => pushEntity(result, query, 'bestie', row, 'name'));
    (z.gegenstaende || []).forEach((row) => pushEntity(result, query, 'gegenstand', row, 'name'));

    const sl = window.HTBAH && typeof window.HTBAH.ladeSpielleiterZustand === 'function'
      ? window.HTBAH.ladeSpielleiterZustand()
      : {};
    const onlyGruppeId = typeof options.gruppeId === 'string' ? options.gruppeId : '';
    (sl.kampagnen || []).forEach((kampagne) => {
      if (onlyGruppeId && String(kampagne && kampagne.id) !== onlyGruppeId) {
        return;
      }
      (kampagne && kampagne.mitglieder ? kampagne.mitglieder : []).forEach((mitglied) => {
        const charakter = window.HTBAH_CHARAKTER_MODEL
          ? window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(mitglied && mitglied.charakter)
          : (mitglied && mitglied.charakter) || {};
        const row = { ...charakter, id: mitglied && mitglied.id ? mitglied.id : charakter.id };
        pushEntity(result, query, 'charakter', row, 'name');
      });
    });

    const dedupe = new Map();
    result.forEach((item) => {
      const key = `${item.entityType}:${item.entityId}`;
      if (!dedupe.has(key) || dedupe.get(key).score > item.score) {
        dedupe.set(key, item);
      }
    });
    return [...dedupe.values()]
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        const typeDelta = (MENTION_TYP_SORT[a.entityType] ?? 99) - (MENTION_TYP_SORT[b.entityType] ?? 99);
        if (typeDelta !== 0) {
          return typeDelta;
        }
        return String(a.name || '').localeCompare(String(b.name || ''), 'de', { sensitivity: 'base' });
      })
      .slice(0, 80)
      .map(({ score, ...item }) => item);
  }

  function oeffneEntitaetGlobal(target) {
    if (!target || !target.entityType || !target.entityId) {
      return;
    }
    const payload = {
      entityType: String(target.entityType || '').trim(),
      entityId: String(target.entityId || '').trim(),
      ts: Date.now(),
    };
    if (!payload.entityType || !payload.entityId) {
      return;
    }
    try {
      localStorage.setItem(NAV_TARGET_KEY, JSON.stringify(payload));
    } catch {
      return;
    }
    const requestEvent = new CustomEvent('htbah:open-entity-request', {
      detail: { ...payload },
      cancelable: true,
    });
    window.dispatchEvent(requestEvent);
    // Wichtig: Kein Redirect/Fallback-Navigation. URL bleibt unverändert.
  }

  function leseNavigationTargetRaw() {
    try {
      const raw = localStorage.getItem(NAV_TARGET_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') {
        return null;
      }
      const entityType = String(data.entityType || '').trim();
      const entityId = String(data.entityId || '').trim();
      if (!entityType || !entityId) {
        return null;
      }
      return { entityType, entityId };
    } catch {
      return null;
    }
  }

  function peekNavigationTarget() {
    return leseNavigationTargetRaw();
  }

  function consumeNavigationTarget() {
    const target = leseNavigationTargetRaw();
    try {
      localStorage.removeItem(NAV_TARGET_KEY);
    } catch {
      // ignore
    }
    return target;
  }

  function installMentions(quill, options) {
    if (!quill || !quill.root) {
      return null;
    }
    const opts = options && typeof options === 'object' ? options : {};
    const getItems = typeof opts.getItems === 'function' ? opts.getItems : () => [];
    const onEntityClick = typeof opts.onEntityClick === 'function' ? opts.onEntityClick : null;

    const container = document.createElement('div');
    container.className = 'htbah-mention-dropdown';
    container.style.display = 'none';
    document.body.appendChild(container);

    const state = {
      active: false,
      applying: false,
      query: '',
      denotationIndex: -1,
      selectedIndex: 0,
      items: [],
    };

    function hide() {
      state.active = false;
      state.query = '';
      state.denotationIndex = -1;
      state.items = [];
      state.selectedIndex = 0;
      container.style.display = 'none';
      container.innerHTML = '';
    }

    function render() {
      if (!state.active || !state.items.length) {
        hide();
        return;
      }
      const html = state.items
        .map((item, index) => {
          const activeClass = index === state.selectedIndex ? ' is-active' : '';
          const subtitle = item.untertitel ? `<small>${escapeHtml(item.untertitel)}</small>` : '';
          return `<button type="button" class="htbah-mention-item${activeClass}" data-mention-index="${index}"><span>${escapeHtml(
            item.name,
          )}</span>${subtitle}</button>`;
        })
        .join('');
      container.innerHTML = html;
      container.style.display = 'block';
      const range = quill.getSelection(true);
      if (!range) {
        return;
      }
      const bounds = quill.getBounds(range.index);
      const rootRect = quill.root.getBoundingClientRect();
      const top = Math.round(rootRect.top + window.scrollY + bounds.top + bounds.height + 6);
      const left = Math.round(rootRect.left + window.scrollX + bounds.left);
      container.style.top = `${top}px`;
      container.style.left = `${left}px`;
    }

    function applySelection(item) {
      const insertAt = Number(state.denotationIndex);
      const range = quill.getSelection(true);
      if (!range || !Number.isFinite(insertAt) || insertAt < 0) {
        hide();
        return;
      }
      const replaceLength = Math.max(0, range.index - insertAt);
      const link = entityLink(item.entityType, item.entityId);
      const text = `@${String(item && item.name ? item.name : '').trim()}`;
      if (text === '@') {
        hide();
        return;
      }
      state.applying = true;
      quill.deleteText(insertAt, replaceLength, 'silent');
      quill.insertText(insertAt, text, { link }, 'silent');
      quill.setSelection(insertAt + text.length, 0, 'silent');
      state.applying = false;
      hide();
    }

    function searchAtCursor() {
      const range = quill.getSelection(true);
      if (!range) {
        hide();
        return;
      }
      const before = quill.getText(0, range.index);
      const match = before.match(/(?:^|\s)@([^\s@]*)$/);
      if (!match) {
        hide();
        return;
      }
      const query = String(match[1] || '').trim().toLowerCase();
      const items = getItems(query).slice(0, 12);
      if (!items.length) {
        hide();
        return;
      }
      state.active = true;
      state.query = query;
      state.denotationIndex = range.index - match[1].length - 1;
      state.items = items;
      state.selectedIndex = 0;
      render();
    }

    function onTextChange(_delta, _oldDelta, source) {
      if (state.applying) {
        return;
      }
      if (source !== 'user') {
        return;
      }
      searchAtCursor();
    }

    function onSelectionChange(range) {
      if (!range) {
        hide();
        return;
      }
      if (state.active) {
        searchAtCursor();
      }
    }

    function onKeyDown(event) {
      if (!state.active) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        state.selectedIndex = (state.selectedIndex + 1) % state.items.length;
        render();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        state.selectedIndex = (state.selectedIndex - 1 + state.items.length) % state.items.length;
        render();
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const item = state.items[state.selectedIndex];
        if (item) {
          applySelection(item);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        hide();
      }
    }

    function onRootLinkInteraction(event) {
      const target = event.target;
      const anchor = target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
      if (!anchor) {
        return;
      }
      const parsed = parseEntityLink(anchor.getAttribute('href') || anchor.href || '');
      if (!parsed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (onEntityClick) {
        onEntityClick(parsed);
      }
    }

    function onOutsidePointer(event) {
      if (!container.contains(event.target)) {
        hide();
      }
    }

    container.addEventListener('mousedown', (event) => {
      event.preventDefault();
      const btn = event.target.closest('[data-mention-index]');
      if (!btn) {
        return;
      }
      const index = Number(btn.getAttribute('data-mention-index'));
      if (!Number.isInteger(index) || index < 0 || index >= state.items.length) {
        return;
      }
      applySelection(state.items[index]);
    });
    quill.root.addEventListener('keydown', onKeyDown);
    quill.root.addEventListener('click', onRootLinkInteraction);
    quill.root.addEventListener('mousedown', onRootLinkInteraction);
    quill.root.addEventListener('touchstart', onRootLinkInteraction, { passive: false });
    document.addEventListener('pointerdown', onOutsidePointer);
    quill.on('text-change', onTextChange);
    quill.on('selection-change', onSelectionChange);

    return {
      destroy() {
        hide();
        quill.root.removeEventListener('keydown', onKeyDown);
        quill.root.removeEventListener('click', onRootLinkInteraction);
        quill.root.removeEventListener('mousedown', onRootLinkInteraction);
        quill.root.removeEventListener('touchstart', onRootLinkInteraction);
        document.removeEventListener('pointerdown', onOutsidePointer);
        container.remove();
      },
    };
  }

  window.HTBAH_SHARED.QuillEntityMentions = {
    installMentions,
    entityLink,
    parseEntityLink,
    collectMentionItems,
    oeffneEntitaetGlobal,
    peekNavigationTarget,
    consumeNavigationTarget,
  };
})();
