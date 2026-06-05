window.HTBAH_DIAG = window.HTBAH_DIAG || (function registerHtbahDiagLog() {
  const PREFIX = '[HTBAH-DIAG]';
  const STORAGE_KEY = 'htbah_diag_log';
  const marks = new Map();

  function istAktiv() {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function log(bereich, phase, details) {
    if (!istAktiv()) {
      return;
    }
    const teile = [`${PREFIX} ${bereich} · ${phase}`];
    if (details !== undefined && details !== null) {
      teile.push(details);
    }
    console.log.apply(console, teile);
  }

  function mark(name) {
    if (!istAktiv()) {
      return;
    }
    marks.set(name, performance.now());
    log('perf', 'mark', name);
  }

  function measure(name) {
    if (!istAktiv()) {
      return null;
    }
    const start = marks.get(name);
    if (start == null) {
      log('perf', 'measure-missing', name);
      return null;
    }
    const ms = Math.round(performance.now() - start);
    marks.delete(name);
    log('perf', 'measure', `${name}: ${ms} ms`);
    return ms;
  }

  function aktivieren() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignorieren */
    }
    log('diag', 'aktiviert');
  }

  function deaktivieren() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorieren */
    }
  }

  function setzeAktiv(aktiv) {
    if (aktiv) {
      aktivieren();
      return;
    }
    deaktivieren();
  }

  return {
    istAktiv,
    log,
    mark,
    measure,
    aktivieren,
    deaktivieren,
    setzeAktiv,
  };
})();
