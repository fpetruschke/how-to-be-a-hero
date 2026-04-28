window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerWeltenbauImport(globalObj) {
  function istBildDatei(file) {
    if (!file) {
      return false;
    }
    if (file.type && file.type.startsWith('image/')) {
      return true;
    }
    const n = (file.name || '').toLowerCase();
    return /\.(png|apng|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(n);
  }

  function teileDateienNachGroesse(dateien, maxBytes) {
    const bildDateien = (Array.isArray(dateien) ? dateien : []).filter(istBildDatei);
    const zuGross = bildDateien.filter((f) => Number(f.size) > maxBytes);
    const ok = bildDateien.filter((f) => Number(f.size) <= maxBytes);
    return { bildDateien, zuGross, ok };
  }

  globalObj.WeltenbauImport = {
    istBildDatei,
    teileDateienNachGroesse,
  };
})(window.HTBAH_SHARED);
