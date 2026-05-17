(function () {
  const M = {};

  M.snapshotJson = function snapshotJson(obj) {
    try {
      return JSON.stringify(obj);
    } catch {
      return '';
    }
  };

  M.istGeaendert = function istGeaendert(snapshot, obj) {
    if (!snapshot) {
      return false;
    }
    return snapshot !== M.snapshotJson(obj);
  };

  /**
   * @returns {Promise<'save'|'discard'|'cancel'>}
   */
  M.bestaetigeUngespeichertSchliessen = function bestaetigeUngespeichertSchliessen(optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const beschreibung =
      typeof opts.beschreibung === 'string' && opts.beschreibung.trim()
        ? opts.beschreibung.trim()
        : 'Es gibt Änderungen, die noch nicht gespeichert wurden. Möchtest du speichern, verwerfen oder weiter bearbeiten?';
    const ui = window.HTBAH && window.HTBAH.ui;
    const modal = ui && ui._refs && ui._refs.bestaetigenModal;
    if (!modal || typeof modal.oeffnen !== 'function') {
      if (window.confirm('Ungespeicherte Änderungen. Jetzt speichern?')) {
        return Promise.resolve('save');
      }
      if (window.confirm('Änderungen wirklich verwerfen?')) {
        return Promise.resolve('discard');
      }
      return Promise.resolve('cancel');
    }
    return new Promise((resolve) => {
      modal.oeffnen({
        titel: 'Ungespeicherte Änderungen',
        beschreibung,
        bestaetigenText: 'Speichern',
        bestaetigenButtonClass: 'btn-primary',
        sekundaerText: 'Verwerfen',
        sekundaerButtonClass: 'btn-outline-danger',
        warnhinweisAnzeigen: false,
        onBestaetigen: () => resolve('save'),
        onSekundaer: () => resolve('discard'),
        onAbbrechen: () => resolve('cancel'),
      });
    });
  };

  window.HTBAH_SHARED = window.HTBAH_SHARED || {};
  window.HTBAH_SHARED.ModalBearbeitungDirty = M;
})();
