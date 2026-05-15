window.HTBAH_SHARED = window.HTBAH_SHARED || {};

/**
 * Bootstrap-Dropdowns mit position:fixed (Popper), damit Menüs nicht von
 * table-responsive, Cards oder Modal-Bodies abgeschnitten werden.
 */
(function registerBootstrapDropdownHelper(globalObj) {
  function popperConfigFixed(defaultBsPopperConfig) {
    return {
      ...defaultBsPopperConfig,
      strategy: 'fixed',
    };
  }

  function ensureDropdown(toggle) {
    if (!toggle || !window.bootstrap || !window.bootstrap.Dropdown) {
      return null;
    }
    const existing = window.bootstrap.Dropdown.getInstance(toggle);
    if (existing) {
      return existing;
    }
    return window.bootstrap.Dropdown.getOrCreateInstance(toggle, {
      popperConfig: popperConfigFixed,
    });
  }

  function initDropdownDataApi() {
    document.addEventListener(
      'click',
      (event) => {
        const toggle = event.target.closest('[data-bs-toggle="dropdown"]');
        if (!toggle) {
          return;
        }
        ensureDropdown(toggle);
      },
      true,
    );

    document.addEventListener('show.bs.dropdown', (event) => {
      const toggle = event.target;
      if (!(toggle instanceof Element)) {
        return;
      }
      const instance = window.bootstrap.Dropdown.getInstance(toggle);
      if (instance && instance._config) {
        instance._config.popperConfig = popperConfigFixed;
      }
      ensureDropdown(toggle);
    });
  }

  globalObj.BootstrapDropdownHelper = {
    popperConfigFixed,
    ensureDropdown,
    initDropdownDataApi,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdownDataApi);
  } else {
    initDropdownDataApi();
  }
})(window.HTBAH_SHARED);
