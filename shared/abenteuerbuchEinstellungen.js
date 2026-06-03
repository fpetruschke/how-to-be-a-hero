/**
 * Spielleitung: globale Abenteuerbuch-Anzeige-Einstellungen (localStorage).
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerAbenteuerbuchEinstellungen() {
  const M = window.HTBAH_SHARED;

  function normalisiereAbenteuerbuchEinstellungen(roh) {
    const o = roh && typeof roh === 'object' ? roh : {};
    return {
      /** true = Reiter umbrechen (mehrzeilig, alle sichtbar); false = eine Zeile mit horizontalem Scroll */
      reiterLeisteUmbruch: Boolean(o.reiterLeisteUmbruch),
    };
  }

  M.normalisiereAbenteuerbuchEinstellungen = normalisiereAbenteuerbuchEinstellungen;
})();
