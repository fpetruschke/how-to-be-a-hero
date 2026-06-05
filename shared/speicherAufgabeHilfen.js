window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerSpeicherAufgabeHilfen(globalObj) {
  /** Gibt dem Browser zwischen schweren Schritten Zeit zum Rendern. */
  function yieldAnMainThread() {
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Führt nummerierte Schritte nacheinander aus und meldet Fortschritt.
   * @param {Array<{ label: string, fn: () => void | Promise<void> }>} schritte
   * @param {(opts: { prozent: number, text: string }) => void} report
   */
  async function fuehreSchritteMitFortschrittAus(schritte, report) {
    const liste = Array.isArray(schritte) ? schritte.filter((s) => s && typeof s.fn === 'function') : [];
    const gesamt = liste.length || 1;
    for (let i = 0; i < liste.length; i += 1) {
      const schritt = liste[i];
      await yieldAnMainThread();
      await schritt.fn();
      const prozent = Math.min(99, Math.round(((i + 1) / gesamt) * 100));
      if (typeof report === 'function') {
        report({ prozent, text: schritt.label || 'Arbeite …' });
      }
    }
    await yieldAnMainThread();
  }

  /**
   * Löscht Keys in kleinen Paketen mit Fortschrittsmeldung.
   * @param {string[]} keys
   * @param {(opts: { prozent: number, text: string }) => void} report
   * @param {{ paketGroesse?: number, label?: string }} [opts]
   */
  async function loescheKeysMitFortschritt(keys, report, opts) {
    const o = opts && typeof opts === 'object' ? opts : {};
    const paketGroesse = Math.max(1, Number(o.paketGroesse) || 3);
    const basisLabel = typeof o.label === 'string' && o.label.trim() ? o.label.trim() : 'Speicher-Einträge';
    const liste = Array.isArray(keys) ? keys.filter((k) => typeof k === 'string' && k) : [];
    const speicher = window.HTBAH && window.HTBAH.speicher;
    if (!speicher || typeof speicher.loescheKey !== 'function') {
      return;
    }
    const gesamt = liste.length || 1;
    const maxProzent = Math.min(100, Math.max(1, Number(o.maxProzent) || 99));
    const abschlussMelden = o.abschlussMelden !== false;
    for (let i = 0; i < liste.length; i += paketGroesse) {
      const paket = liste.slice(i, i + paketGroesse);
      await yieldAnMainThread();
      paket.forEach((key) => speicher.loescheKey(key));
      const prozent = Math.min(maxProzent, Math.round(((i + paket.length) / gesamt) * maxProzent));
      const keyLabel = paket.length === 1 ? paket[0] : `${paket.length} Einträge`;
      if (typeof report === 'function') {
        report({
          prozent,
          text: `${basisLabel}: ${keyLabel} …`,
        });
      }
    }
    if (typeof report === 'function' && abschlussMelden) {
      report({ prozent: maxProzent, text: `${basisLabel} gelöscht.` });
    }
    await yieldAnMainThread();
  }

  globalObj.SpeicherAufgabeHilfen = {
    yieldAnMainThread,
    fuehreSchritteMitFortschrittAus,
    loescheKeysMitFortschritt,
  };
})(window.HTBAH_SHARED);
