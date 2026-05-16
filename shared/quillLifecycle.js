window.HTBAH_SHARED = window.HTBAH_SHARED || {};

/**
 * Einheitliche Freigabe von Quill-Editoren (Listener, Mentions, DOM).
 * Verhindert typische SPA-Leaks bei wiederholtem Öffnen/Schließen von Modals.
 */
(function (SHARED) {
  'use strict';

  function zerstoereMentionController(controller) {
    if (controller && typeof controller.destroy === 'function') {
      try {
        controller.destroy();
      } catch {
        /* DOM/Quill kann beim Abbau bereits entfernt sein */
      }
    }
  }

  function schliesseEmoticonPickerFuerQuill(quill) {
    const api = SHARED.QuillEmoticons;
    if (api && typeof api.zerstoereEmoticonPickerFuerQuill === 'function' && quill) {
      try {
        api.zerstoereEmoticonPickerFuerQuill(quill);
      } catch {
        /* ignorieren */
      }
    }
  }

  function leereQuillHost(hostElement) {
    if (!hostElement) {
      return;
    }
    try {
      hostElement.innerHTML = '';
    } catch {
      /* Host kann bereits aus dem DOM entfernt sein */
    }
  }

  function entferneVerwaisteQuillToolbars(container) {
    if (!container || typeof container.querySelectorAll !== 'function') {
      return;
    }
    container.querySelectorAll('.ql-toolbar.ql-snow').forEach((node) => {
      try {
        node.remove();
      } catch {
        /* ignorieren */
      }
    });
  }

  /**
   * @param {{
   *   quill?: object|null,
   *   hostElement?: HTMLElement|null,
   *   mentionController?: object|null,
   *   handler?: Array<{ event: string, fn: Function }>|null,
   *   toolbarContainer?: Element|null,
   * }} [opts]
   */
  function zerstoereQuillInstanz(opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const quill = o.quill;
    const handler = Array.isArray(o.handler) ? o.handler : [];
    if (quill && typeof quill.off === 'function') {
      handler.forEach((entry) => {
        if (!entry || typeof entry.fn !== 'function') {
          return;
        }
        const eventName = typeof entry.event === 'string' ? entry.event : '';
        if (!eventName) {
          return;
        }
        try {
          quill.off(eventName, entry.fn);
        } catch {
          /* ignorieren */
        }
      });
    }
    zerstoereMentionController(o.mentionController);
    schliesseEmoticonPickerFuerQuill(quill);
    const host =
      o.hostElement && o.hostElement.parentNode
        ? o.hostElement
        : quill && quill.root && quill.root.parentNode
          ? quill.root.parentNode
          : null;
    if (host) {
      leereQuillHost(host);
    }
    const toolbarRoot = o.toolbarContainer || host?.parentElement || host;
    if (toolbarRoot) {
      entferneVerwaisteQuillToolbars(toolbarRoot);
    }
  }

  SHARED.QuillLifecycle = {
    zerstoereMentionController,
    schliesseEmoticonPickerFuerQuill,
    leereQuillHost,
    entferneVerwaisteQuillToolbars,
    zerstoereQuillInstanz,
  };
})(window.HTBAH_SHARED);
