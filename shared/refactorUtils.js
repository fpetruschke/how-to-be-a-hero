window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerRefactorUtils(globalObj) {
  function formatBytesBinary(bytes) {
    const n = typeof bytes === 'number' && Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
    if (n >= 1024 * 1024) {
      return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MiB`;
    }
    if (n >= 1024) {
      return `${Math.round(n / 1024)} KiB`;
    }
    return `${n} B`;
  }

  function formatBytesDecimal(bytes) {
    const n = typeof bytes === 'number' && Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
    if (n === 0) {
      return '0 Bytes';
    }
    const stufen = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), stufen.length - 1);
    const wert = n / 1024 ** i;
    return `${wert.toLocaleString('de-DE', { maximumFractionDigits: i === 0 ? 0 : 2 })} ${stufen[i]}`;
  }

  function formatDatumZeit(value) {
    if (!value) {
      return '';
    }
    const datum = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(datum.getTime())) {
      return '';
    }
    const pad2 = (n) => String(n).padStart(2, '0');
    return `${pad2(datum.getDate())}.${pad2(datum.getMonth() + 1)}.${datum.getFullYear()} - ${pad2(datum.getHours())}:${pad2(datum.getMinutes())}:${pad2(datum.getSeconds())}`;
  }

  function dateinameOhneEndung(name, fallback = 'Bild') {
    const roh = typeof name === 'string' ? name.trim() : '';
    const ohne = roh.replace(/\.[^/.]+$/, '');
    return ohne || fallback;
  }

  function istHttpUrl(text) {
    if (typeof text !== 'string') {
      return false;
    }
    return /^https?:\/\//i.test(text.trim());
  }

  globalObj.RefactorUtils = {
    formatBytesBinary,
    formatBytesDecimal,
    formatDatumZeit,
    dateinameOhneEndung,
    istHttpUrl,
  };
})(window.HTBAH_SHARED);
