window.HTBAH_SHARED = window.HTBAH_SHARED || {};

/**
 * Karten-Icon für Orte, Fraktionen, Rätsel und Gegenstände (Interaktive Welt).
 */
(function (SHARED) {
  'use strict';

  const KARTEN_ICON_ENTITY_TYPEN = ['ort', 'fraktion', 'raetsel', 'gegenstand'];

  const DEFAULT_EMOJI = Object.freeze({
    npc: '👤',
    ort: '🗺️',
    fraktion: '🏛️',
    raetsel: '🧩',
    bestie: '🦁',
    gegenstand: '📦',
    pantheon: '✨',
    charakter: '🧙',
  });

  function istKartenIconEntityTyp(entityTyp) {
    return KARTEN_ICON_ENTITY_TYPEN.includes(String(entityTyp || '').trim());
  }

  function defaultEmoji(entityTyp) {
    return DEFAULT_EMOJI[String(entityTyp || '').trim()] || '📌';
  }

  function leeresKartenIcon() {
    return {
      quelle: '',
      emoji: '',
      mediumId: '',
      eigenDataUrl: '',
      form: 'eckig',
    };
  }

  function mediumIstBild(medium) {
    if (!medium || typeof medium !== 'object') {
      return false;
    }
    if (medium.typ === 'bild') {
      return true;
    }
    if (typeof medium.mimeType === 'string' && medium.mimeType.startsWith('image/')) {
      return true;
    }
    return typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/');
  }

  function normalisiereKartenIcon(roh, entityTyp) {
    if (!istKartenIconEntityTyp(entityTyp)) {
      return leeresKartenIcon();
    }
    if (!roh || typeof roh !== 'object') {
      return leeresKartenIcon();
    }
    let quelle = String(roh.quelle || '').trim();
    if (!['emoji', 'medium', 'eigen'].includes(quelle)) {
      quelle = '';
    }
    const emoji = typeof roh.emoji === 'string' ? roh.emoji.trim() : '';
    const mediumId = typeof roh.mediumId === 'string' ? roh.mediumId.trim() : '';
    const eigenDataUrl = typeof roh.eigenDataUrl === 'string' ? roh.eigenDataUrl.trim() : '';
    let form = String(roh.form || '').trim();
    if (form !== 'rund' && form !== 'eckig') {
      form = 'eckig';
    }
    if (quelle === 'emoji' && !emoji) {
      quelle = '';
    }
    if (quelle === 'medium' && !mediumId) {
      quelle = '';
    }
    if (quelle === 'eigen' && (!eigenDataUrl || !eigenDataUrl.startsWith('data:'))) {
      quelle = '';
    }
    return { quelle, emoji, mediumId, eigenDataUrl, form };
  }

  function bildDataUrlAusMedium(zeile, mediumId) {
    const medien = Array.isArray(zeile && zeile.medien) ? zeile.medien : [];
    const medium = medien.find((m) => m && m.id === mediumId);
    if (!medium || !mediumIstBild(medium)) {
      return '';
    }
    return typeof medium.dataUrl === 'string' ? medium.dataUrl : '';
  }

  /**
   * @returns {{ art: 'emoji'|'bild', emoji?: string, bildDataUrl?: string, form: 'rund'|'eckig', istBenutzerdefiniert: boolean }}
   */
  function kartenIconAnzeige(zeile, entityTyp) {
    const typ = String(entityTyp || '').trim();
    const icon = normalisiereKartenIcon(zeile && zeile.kartenIcon, typ);
    const form = icon.form === 'rund' ? 'rund' : 'eckig';
    if (icon.quelle === 'emoji') {
      return {
        art: 'emoji',
        emoji: icon.emoji,
        form,
        istBenutzerdefiniert: true,
      };
    }
    if (icon.quelle === 'medium') {
      const bildDataUrl = bildDataUrlAusMedium(zeile, icon.mediumId);
      if (bildDataUrl) {
        return {
          art: 'bild',
          bildDataUrl,
          form,
          istBenutzerdefiniert: true,
        };
      }
    }
    if (icon.quelle === 'eigen' && icon.eigenDataUrl) {
      return {
        art: 'bild',
        bildDataUrl: icon.eigenDataUrl,
        form,
        istBenutzerdefiniert: true,
      };
    }
    return {
      art: 'emoji',
      emoji: defaultEmoji(typ),
      form,
      istBenutzerdefiniert: false,
    };
  }

  function entitaetAnzeigeName(zeile, entityTyp) {
    if (!zeile || typeof zeile !== 'object') {
      return '';
    }
    if (String(entityTyp || '').trim() === 'raetsel') {
      return typeof zeile.titel === 'string' ? zeile.titel : '';
    }
    return typeof zeile.name === 'string' ? zeile.name : '';
  }

  function stelleKartenIconSicher(zeile, entityTyp) {
    if (!zeile || typeof zeile !== 'object' || !istKartenIconEntityTyp(entityTyp)) {
      return zeile;
    }
    zeile.kartenIcon = normalisiereKartenIcon(zeile.kartenIcon, entityTyp);
    return zeile;
  }

  function titelBildDataUrl(zeile) {
    if (!zeile || typeof zeile !== 'object') {
      return '';
    }
    const medien = Array.isArray(zeile.medien) ? zeile.medien : [];
    const bilder = medien.filter((m) => mediumIstBild(m));
    if (!bilder.length) {
      return '';
    }
    const primaryId = typeof zeile.primaryMediumId === 'string' ? zeile.primaryMediumId.trim() : '';
    if (primaryId) {
      const gefunden = bilder.find((b) => b.id === primaryId);
      if (gefunden && typeof gefunden.dataUrl === 'string') {
        return gefunden.dataUrl;
      }
    }
    return typeof bilder[0].dataUrl === 'string' ? bilder[0].dataUrl : '';
  }

  /**
   * Icon für Listen- und Bearbeitungs-UI (Modal-Titel etc.).
   * @returns {{ art: 'emoji'|'bild', emoji?: string, bildDataUrl?: string, form?: 'rund'|'eckig' }}
   */
  function entitaetAnzeigeIcon(zeile, entityTyp, optionen) {
    const typ = String(entityTyp || '').trim();
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const charakterBild = typeof opts.charakterBild === 'string' ? opts.charakterBild.trim() : '';
    if (typ === 'charakter' && charakterBild.startsWith('data:')) {
      return { art: 'bild', bildDataUrl: charakterBild, form: 'rund' };
    }
    if (istKartenIconEntityTyp(typ)) {
      const karten = kartenIconAnzeige(zeile, typ);
      return {
        art: karten.art,
        emoji: karten.emoji,
        bildDataUrl: karten.bildDataUrl,
        form: karten.form,
      };
    }
    const titelBild = titelBildDataUrl(zeile);
    if (titelBild) {
      const form = typ === 'npc' || typ === 'bestie' || typ === 'charakter' ? 'rund' : 'eckig';
      return { art: 'bild', bildDataUrl: titelBild, form };
    }
    return { art: 'emoji', emoji: defaultEmoji(typ), form: 'eckig' };
  }

  function bereinigeKartenIconNachMediumEntfernung(zeile, entityTyp, entfernteMediumId) {
    if (!zeile || typeof zeile !== 'object' || !istKartenIconEntityTyp(entityTyp)) {
      return;
    }
    const mediumId = String(entfernteMediumId || '').trim();
    if (!mediumId) {
      return;
    }
    const icon = normalisiereKartenIcon(zeile.kartenIcon, entityTyp);
    if (icon.quelle === 'medium' && icon.mediumId === mediumId) {
      zeile.kartenIcon = leeresKartenIcon();
    }
  }

  SHARED.EntityKartenIcon = {
    KARTEN_ICON_ENTITY_TYPEN,
    DEFAULT_EMOJI,
    istKartenIconEntityTyp,
    defaultEmoji,
    leeresKartenIcon,
    normalisiereKartenIcon,
    kartenIconAnzeige,
    entitaetAnzeigeName,
    stelleKartenIconSicher,
    bereinigeKartenIconNachMediumEntfernung,
    mediumIstBild,
    bildDataUrlAusMedium,
    titelBildDataUrl,
    entitaetAnzeigeIcon,
  };
})(window.HTBAH_SHARED);
