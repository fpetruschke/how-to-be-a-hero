window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerBegegnungUtils(globalObj) {
  function stripHtmlText(html) {
    const div = document.createElement('div');
    div.innerHTML = typeof html === 'string' ? html : '';
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function bestieEpocheLabel(epoche) {
    if (epoche === 'gegenwart') {
      return 'Gegenwart';
    }
    if (epoche === 'zukunft') {
      return 'Zukunft';
    }
    return 'Mittelalter';
  }

  function bestieKategorieLabel(kategorie) {
    if (kategorie === 'fantasy_tier') {
      return 'Magisch / Fantasy';
    }
    if (kategorie === 'mutiert') {
      return 'Mutiert';
    }
    if (kategorie === 'monster') {
      return 'Monster';
    }
    return 'Normales Tier';
  }

  globalObj.BegegnungUtils = {
    stripHtmlText,
    bestieEpocheLabel,
    bestieKategorieLabel,
  };
})(window.HTBAH_SHARED);
