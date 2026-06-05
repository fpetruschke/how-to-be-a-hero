window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerBootstrapModalHelper(globalObj) {
  function ensureModalInstance(el, optionen) {
    if (!el || !window.bootstrap || !window.bootstrap.Modal) {
      return null;
    }
    return window.bootstrap.Modal.getOrCreateInstance(el, optionen || {});
  }

  function bindHiddenEvent(el, callback) {
    if (!el || typeof callback !== 'function') {
      return;
    }
    el.addEventListener('hidden.bs.modal', callback);
  }

  function unbindHiddenEvent(el, callback) {
    if (!el || typeof callback !== 'function') {
      return;
    }
    el.removeEventListener('hidden.bs.modal', callback);
  }

  /** Entfernt hängengebliebene Bootstrap-Modal-Backdrops (z. B. nach blockierendem JS). */
  function bereinigeBackdrop() {
    const root = document.documentElement;
    document.body.classList.remove('modal-open');
    document.body.removeAttribute('data-bs-overflow');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    root.style.removeProperty('overflow');
    root.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach((el) => {
      el.remove();
    });
    document.querySelectorAll('.modal.show').forEach((el) => {
      if (el.classList.contains('htbah-fortschritt-overlay')) {
        return;
      }
      el.classList.remove('show');
      el.style.removeProperty('display');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  /**
   * Wartet auf hidden.bs.modal oder löst nach Timeout auf (Fallback).
   * @param {HTMLElement} el
   * @param {number} [timeoutMs]
   */
  function waitForHidden(el, timeoutMs) {
    if (!el) {
      return Promise.resolve();
    }
    const limit = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 400;
    return new Promise((resolve) => {
      let erledigt = false;
      const fertig = () => {
        if (erledigt) {
          return;
        }
        erledigt = true;
        unbindHiddenEvent(el, onHidden);
        window.clearTimeout(timerId);
        resolve();
      };
      const onHidden = () => fertig();
      bindHiddenEvent(el, onHidden);
      const timerId = window.setTimeout(fertig, limit);
    });
  }

  /** Schließt Bootstrap-Modal und räumt Backdrop/Body-Klassen zuverlässig auf. */
  function erzwingeModalSchliessen(el, modalInstanz) {
    if (modalInstanz && typeof modalInstanz.hide === 'function') {
      try {
        modalInstanz.hide();
      } catch {
        /* ignorieren */
      }
    }
    if (modalInstanz && typeof modalInstanz.dispose === 'function') {
      try {
        modalInstanz.dispose();
      } catch {
        /* ignorieren */
      }
    }
    if (el) {
      el.classList.remove('show');
      el.style.removeProperty('display');
      el.setAttribute('aria-hidden', 'true');
    }
    bereinigeBackdrop();
  }

  globalObj.BootstrapModalHelper = {
    ensureModalInstance,
    bindHiddenEvent,
    unbindHiddenEvent,
    bereinigeBackdrop,
    waitForHidden,
    erzwingeModalSchliessen,
  };
})(window.HTBAH_SHARED);
