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

  globalObj.BootstrapModalHelper = {
    ensureModalInstance,
    bindHiddenEvent,
    unbindHiddenEvent,
  };
})(window.HTBAH_SHARED);
