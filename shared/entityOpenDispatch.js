window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function () {
  const ZUFALLSTABELLEN_ENTITY_TYPES = new Set([
    'npc',
    'ort',
    'fraktion',
    'pantheon',
    'raetsel',
    'bestie',
    'gegenstand',
  ]);

  function kampagnenTabAusRoute(route) {
    const path = route && typeof route.path === 'string' ? route.path : '';
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 'kampagne') {
      return parts[2];
    }
    return '';
  }

  let pendingOpenEntityTimeoutId = null;

  function erneutOpenEntityRequest(detail, delayMs) {
    const delay = Number.isFinite(delayMs) ? delayMs : 120;
    if (pendingOpenEntityTimeoutId != null) {
      window.clearTimeout(pendingOpenEntityTimeoutId);
    }
    pendingOpenEntityTimeoutId = window.setTimeout(() => {
      pendingOpenEntityTimeoutId = null;
      window.dispatchEvent(
        new CustomEvent('htbah:open-entity-request', {
          detail: { ...detail, ts: Date.now() },
          cancelable: true,
        }),
      );
    }, delay);
  }

  function signalMentionNavTargetUpdated() {
    window.dispatchEvent(new CustomEvent('htbah:mention-nav-target-updated'));
  }

  function onOpenEntityRequest(event, router) {
    if (!event || event.defaultPrevented || !router) {
      return;
    }
    const detail = event.detail && typeof event.detail === 'object' ? event.detail : null;
    if (!detail || !detail.entityType || !detail.entityId) {
      return;
    }
    const typ = String(detail.entityType || '').trim();
    const route = router.currentRoute && router.currentRoute.value ? router.currentRoute.value : null;
    const tab = kampagnenTabAusRoute(route);
    const kampagnenPfad =
      window.HTBAH && typeof window.HTBAH.kampagnenPfad === 'function' ? window.HTBAH.kampagnenPfad : null;
    if (!kampagnenPfad) {
      return;
    }

    if (ZUFALLSTABELLEN_ENTITY_TYPES.has(typ)) {
      if (tab === 'zufallstabellen') {
        return;
      }
      const ziel = kampagnenPfad('zufallstabellen');
      const nav = router.push(ziel);
      if (nav && typeof nav.then === 'function') {
        nav.then(() => erneutOpenEntityRequest(detail)).catch(() => {});
      } else {
        erneutOpenEntityRequest(detail);
      }
      return;
    }

    if (typ === 'charakter') {
      if (tab === 'welt') {
        signalMentionNavTargetUpdated();
        return;
      }
      const ziel = kampagnenPfad('welt');
      const nav = router.push(ziel);
      if (nav && typeof nav.then === 'function') {
        nav.then(() => signalMentionNavTargetUpdated()).catch(() => {});
      }
    }
  }

  function installEntityOpenDispatch(router) {
    if (!router) {
      return () => {};
    }
    const handler = (event) => onOpenEntityRequest(event, router);
    window.addEventListener('htbah:open-entity-request', handler);
    return () => {
      if (pendingOpenEntityTimeoutId != null) {
        window.clearTimeout(pendingOpenEntityTimeoutId);
        pendingOpenEntityTimeoutId = null;
      }
      window.removeEventListener('htbah:open-entity-request', handler);
    };
  }

  window.HTBAH_SHARED.EntityOpenDispatch = {
    install: installEntityOpenDispatch,
    ZUFALLSTABELLEN_ENTITY_TYPES,
  };
})();
