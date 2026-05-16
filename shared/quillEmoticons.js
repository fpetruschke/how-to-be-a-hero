window.HTBAH_SHARED = window.HTBAH_SHARED || {};

/**
 * Emoticon-Picker für alle Quill-Editoren (Toolbar-Button, Suche, Klick-Einfügen).
 */
(function (SHARED) {
  'use strict';

  const TOOLBAR_KEY = 'emoticons';
  const PANEL_Z_INDEX = 10050;

  /** @type {Array<{ emoji?: string, html?: string, label: string, tags: string[] }>} */
  const EMOTICON_EINTRAGE = [
    { emoji: '😀', label: 'Grinsen', tags: ['lächeln', 'happy', 'fröhlich', 'smile'] },
    { emoji: '😃', label: 'Lächeln', tags: ['grinsen', 'freude'] },
    { emoji: '😄', label: 'Lachen', tags: ['fröhlich', 'lachen'] },
    { emoji: '😁', label: 'Grinsen breit', tags: ['zähne', 'begeistert'] },
    { emoji: '😆', label: 'Lachen zu', tags: ['heiter', 'lach'] },
    { emoji: '😅', label: 'Schweiß lächeln', tags: ['nervös', 'erleichtert'] },
    { emoji: '🤣', label: 'Rollen', tags: ['lol', 'heulen', 'lachen'] },
    { emoji: '😂', label: 'Freudentränen', tags: ['lachen', 'tränen'] },
    { emoji: '🙂', label: 'Leicht lächeln', tags: ['neutral', 'smile'] },
    { emoji: '😉', label: 'Zwinkern', tags: ['wink', 'flirt'] },
    { emoji: '😊', label: 'Erröten', tags: ['schüchtern', 'freundlich'] },
    { emoji: '😇', label: 'Heilig', tags: ['engel', 'unschuld'] },
    { emoji: '🥰', label: 'Verliebt', tags: ['herz', 'liebe'] },
    { emoji: '😍', label: 'Herzaugen', tags: ['liebe', 'bewunderung'] },
    { emoji: '🤩', label: 'Begeistert', tags: ['sterne', 'wow'] },
    { emoji: '😘', label: 'Kuss', tags: ['liebe', 'küssen'] },
    { emoji: '😗', label: 'Küssen', tags: ['mund', 'kuss'] },
    { emoji: '😋', label: 'Lecker', tags: ['essen', 'yummy'] },
    { emoji: '😛', label: 'Zunge', tags: ['albern', 'zunge'] },
    { emoji: '😜', label: 'Zwinker Zunge', tags: ['albern', 'spaß'] },
    { emoji: '🤪', label: 'Verrückt', tags: ['irre', 'albern'] },
    { emoji: '😝', label: 'Zunge zu', tags: ['albern'] },
    { emoji: '🤑', label: 'Geld', tags: ['reich', 'gold', 'münzen'] },
    { emoji: '🤗', label: 'Umarmung', tags: ['drück', 'herzlich'] },
    { emoji: '🤭', label: 'Oops', tags: ['ups', 'geheim'] },
    { emoji: '🤫', label: 'Psst', tags: ['still', 'geheim'] },
    { emoji: '🤔', label: 'Nachdenken', tags: ['denken', 'hmm', 'frage'] },
    { emoji: '🤐', label: 'Mund zu', tags: ['still', 'schweigen'] },
    { emoji: '😐', label: 'Neutral', tags: ['meh', 'ernst'] },
    { emoji: '😑', label: 'Ausdruckslos', tags: ['gelangweilt'] },
    { emoji: '😶', label: 'Kein Mund', tags: ['stumm', 'sprachlos'] },
    { emoji: '😏', label: 'Schmunzeln', tags: ['list', 'ironie'] },
    { emoji: '😒', label: 'Genervt', tags: ['langweilig', 'unbeeindruckt'] },
    { emoji: '🙄', label: 'Augen rollen', tags: ['genervt', 'sarkasmus'] },
    { emoji: '😬', label: 'Grimasse', tags: ['peinlich', 'awkward'] },
    { emoji: '😮‍💨', label: 'Seufzen', tags: ['müde', 'erleichtert'] },
    { emoji: '🤥', label: 'Lüge', tags: ['pinocchio', 'lügen'] },
    { emoji: '😌', label: 'Erleichtert', tags: ['ruhe', 'entspannt'] },
    { emoji: '😔', label: 'Nachdenklich traurig', tags: ['traurig', 'schuldbewusst'] },
    { emoji: '😪', label: 'Müde', tags: ['schlaf', 'gähn'] },
    { emoji: '🤤', label: 'Sabbern', tags: ['hunger', 'begehren'] },
    { emoji: '😴', label: 'Schlafen', tags: ['zzz', 'müde'] },
    { emoji: '😷', label: 'Maske', tags: ['krank', 'medizin'] },
    { emoji: '🤒', label: 'Fieber', tags: ['krank', 'thermometer'] },
    { emoji: '🤕', label: 'Verletzt', tags: ['kopf', 'verband', 'wunde'] },
    { emoji: '🤢', label: 'Übel', tags: ['kotz', 'krank'] },
    { emoji: '🤮', label: 'Kotzen', tags: ['übel', 'ekel'] },
    { emoji: '🤧', label: 'Niesen', tags: ['erkältung', 'hemdchen'] },
    { emoji: '🥵', label: 'Heiß', tags: ['schwitzen', 'sommer'] },
    { emoji: '🥶', label: 'Kalt', tags: ['frieren', 'winter', 'eis'] },
    { emoji: '😵', label: 'Benommen', tags: ['schwindel', 'ko'] },
    { emoji: '🤯', label: 'Kopf explodiert', tags: ['schock', 'wow'] },
    { emoji: '😎', label: 'Cool', tags: ['sonnenbrille', 'cool'] },
    { emoji: '🤓', label: 'Nerd', tags: ['brille', 'weise'] },
    { emoji: '🧐', label: 'Monokel', tags: ['prüfen', 'untersuchen'] },
    { emoji: '😕', label: 'Verwirrt', tags: ['unsicher'] },
    { emoji: '😟', label: 'Besorgt', tags: ['sorge', 'ängstlich'] },
    { emoji: '🙁', label: 'Leicht traurig', tags: ['traurig'] },
    { emoji: '☹️', label: 'Traurig', tags: ['unglücklich'] },
    { emoji: '😮', label: 'Überrascht', tags: ['oh', 'überraschung'] },
    { emoji: '😯', label: 'Staunen', tags: ['überrascht'] },
    { emoji: '😲', label: 'Schock', tags: ['wow', 'überrascht'] },
    { emoji: '😳', label: 'Verlegen', tags: ['rot', 'peinlich'] },
    { emoji: '🥺', label: 'Bittend', tags: ['bitte', 'tränen', 'herz'] },
    { emoji: '😦', label: 'Stirnrunzeln offen', tags: ['erschrocken'] },
    { emoji: '😧', label: 'Qual', tags: ['leid', 'stress'] },
    { emoji: '😨', label: 'Angst', tags: ['furcht', 'grusel'] },
    { emoji: '😰', label: 'Angstschweiß', tags: ['nervös', 'panik'] },
    { emoji: '😥', label: 'Traurig erleichtert', tags: ['puh'] },
    { emoji: '😢', label: 'Weinen', tags: ['tränen', 'traurig'] },
    { emoji: '😭', label: 'Heulen', tags: ['tränen', 'schluchzen'] },
    { emoji: '😱', label: 'Schrei', tags: ['angst', 'grusel', 'schock'] },
    { emoji: '😖', label: 'Verwirrt', tags: ['frustriert'] },
    { emoji: '😣', label: 'Durchhalten', tags: ['anstrengung'] },
    { emoji: '😞', label: 'Enttäuscht', tags: ['traurig', 'misserfolg'] },
    { emoji: '😓', label: 'Schweiß', tags: ['müde', 'arbeit'] },
    { emoji: '😩', label: 'Erschöpft', tags: ['müde', 'genervt'] },
    { emoji: '😫', label: 'Müde', tags: ['erschöpft'] },
    { emoji: '🥱', label: 'Gähnen', tags: ['müde', 'schlaf'] },
    { emoji: '😤', label: 'Triumph', tags: ['stolz', 'dampf'] },
    { emoji: '😡', label: 'Wütend', tags: ['zorn', 'rot'] },
    { emoji: '😠', label: 'Verärgert', tags: ['wut', 'ärger'] },
    { emoji: '🤬', label: 'Fluchen', tags: ['wut', 'symbole'] },
    { emoji: '👍', label: 'Daumen hoch', tags: ['gut', 'ok', 'ja', 'like'] },
    { emoji: '👎', label: 'Daumen runter', tags: ['nein', 'schlecht'] },
    { emoji: '👌', label: 'OK', tags: ['perfekt', 'gut'] },
    { emoji: '✌️', label: 'Frieden', tags: ['victory', 'zwei'] },
    { emoji: '🤞', label: 'Fingers crossed', tags: ['glück', 'hoffnung'] },
    { emoji: '🤟', label: 'Rock', tags: ['liebe', 'horn'] },
    { emoji: '🤘', label: 'Metal', tags: ['rock', 'horn'] },
    { emoji: '🤙', label: 'Anruf', tags: ['shaka', 'telefon'] },
    { emoji: '👋', label: 'Winken', tags: ['hallo', 'tschüss'] },
    { emoji: '🤚', label: 'Handfläche', tags: ['stopp', 'high five'] },
    { emoji: '🖐️', label: 'Hand offen', tags: ['fünf'] },
    { emoji: '✋', label: 'Stopp', tags: ['halt', 'hand'] },
    { emoji: '👏', label: 'Applaus', tags: ['klatschen', 'bravo'] },
    { emoji: '🙌', label: 'Hände hoch', tags: ['hurra', 'feier'] },
    { emoji: '🙏', label: 'Beten', tags: ['danke', 'bitte', 'namaste'] },
    { emoji: '💪', label: 'Muskel', tags: ['stark', 'kraft'] },
    { emoji: '🦾', label: 'Prothese', tags: ['cyborg', 'technik'] },
    { emoji: '👀', label: 'Augen', tags: ['sehen', 'schauen'] },
    { emoji: '👁️', label: 'Auge', tags: ['blick', 'wächter'] },
    { emoji: '👅', label: 'Zunge', tags: ['geschmack'] },
    { emoji: '👄', label: 'Mund', tags: ['lippen', 'kuss'] },
    { emoji: '💋', label: 'Kussabdruck', tags: ['liebe', 'kuss'] },
    { emoji: '❤️', label: 'Herz rot', tags: ['liebe', 'herz'] },
    { emoji: '🧡', label: 'Herz orange', tags: ['liebe'] },
    { emoji: '💛', label: 'Herz gelb', tags: ['liebe', 'freundschaft'] },
    { emoji: '💚', label: 'Herz grün', tags: ['liebe', 'natur'] },
    { emoji: '💙', label: 'Herz blau', tags: ['liebe', 'treue'] },
    { emoji: '💜', label: 'Herz lila', tags: ['liebe'] },
    { emoji: '🖤', label: 'Herz schwarz', tags: ['dunkel', 'humor'] },
    { emoji: '🤍', label: 'Herz weiß', tags: ['rein', 'frieden'] },
    { emoji: '💔', label: 'Herz gebrochen', tags: ['trennung', 'traurig'] },
    { emoji: '❣️', label: 'Herz Ausruf', tags: ['liebe'] },
    { emoji: '💕', label: 'Herzen', tags: ['liebe'] },
    { emoji: '💖', label: 'Funkelherz', tags: ['liebe'] },
    { emoji: '💗', label: 'Wachsendes Herz', tags: ['liebe'] },
    { emoji: '💘', label: 'Herz Pfeil', tags: ['amor', 'liebe'] },
    { emoji: '💝', label: 'Herz Geschenk', tags: ['liebe', 'geschenk'] },
    { emoji: '⭐', label: 'Stern', tags: ['stern', 'glanz', 'wichtig'] },
    { emoji: '🌟', label: 'Stern funkeln', tags: ['glanz', 'besonders'] },
    { emoji: '✨', label: 'Funkeln', tags: ['magie', 'glitzer'] },
    { emoji: '⚡', label: 'Blitz', tags: ['energie', 'schnell', 'magie'] },
    { emoji: '🔥', label: 'Feuer', tags: ['flamme', 'heiß', 'gefahr'] },
    { emoji: '💧', label: 'Tropfen', tags: ['wasser', 'nass'] },
    { emoji: '❄️', label: 'Schneeflocke', tags: ['kalt', 'winter', 'eis'] },
    { emoji: '🌈', label: 'Regenbogen', tags: ['farbe', 'hoffnung'] },
    { emoji: '☀️', label: 'Sonne', tags: ['tag', 'hell', 'wetter'] },
    { emoji: '🌙', label: 'Mond', tags: ['nacht', 'dunkel'] },
    { emoji: '☁️', label: 'Wolke', tags: ['wetter', 'bewölkt'] },
    { emoji: '🌧️', label: 'Regen', tags: ['wetter', 'nass'] },
    { emoji: '⛈️', label: 'Gewitter', tags: ['blitz', 'sturm'] },
    { emoji: '🌊', label: 'Welle', tags: ['meer', 'wasser', 'flut'] },
    { emoji: '🌍', label: 'Erde', tags: ['welt', 'planet'] },
    { emoji: '🌲', label: 'Nadelbaum', tags: ['wald', 'natur'] },
    { emoji: '🌳', label: 'Baum', tags: ['wald', 'natur'] },
    { emoji: '🌸', label: 'Kirschblüte', tags: ['blume', 'frühling'] },
    { emoji: '🌹', label: 'Rose', tags: ['blume', 'liebe'] },
    { emoji: '🍀', label: 'Klee', tags: ['glück', 'vier'] },
    { emoji: '🍄', label: 'Pilz', tags: ['wald', 'gift'] },
    { emoji: '🐉', label: 'Drache', tags: ['fantasy', 'drache', 'monster'] },
    { emoji: '🐲', label: 'Drachenkopf', tags: ['fantasy', 'drache'] },
    { emoji: '🦄', label: 'Einhorn', tags: ['fantasy', 'magie'] },
    { emoji: '🐺', label: 'Wolf', tags: ['tier', 'rudel'] },
    { emoji: '🦊', label: 'Fuchs', tags: ['tier', 'schlau'] },
    { emoji: '🐻', label: 'Bär', tags: ['tier', 'stark'] },
    { emoji: '🦁', label: 'Löwe', tags: ['tier', 'könig'] },
    { emoji: '🐯', label: 'Tiger', tags: ['tier', 'raubkatze'] },
    { emoji: '🐎', label: 'Pferd', tags: ['reiten', 'tier', 'ross'] },
    { emoji: '🦅', label: 'Adler', tags: ['vogel', 'tier'] },
    { emoji: '🦇', label: 'Fledermaus', tags: ['nacht', 'vampir'] },
    { emoji: '🐍', label: 'Schlange', tags: ['tier', 'gift'] },
    { emoji: '🕷️', label: 'Spinne', tags: ['tier', 'grusel'] },
    { emoji: '🦂', label: 'Skorpion', tags: ['wüste', 'gift'] },
    { emoji: '⚔️', label: 'Schwerter', tags: ['kampf', 'waffe', 'krieg'] },
    { emoji: '🗡️', label: 'Dolch', tags: ['waffe', 'nahkampf', 'mord'] },
    { emoji: '🏹', label: 'Bogen', tags: ['waffe', 'fernkampf', 'pfeil'] },
    { emoji: '🛡️', label: 'Schild', tags: ['verteidigung', 'schutz', 'parade'] },
    { emoji: '🔨', label: 'Hammer', tags: ['werkzeug', 'schmied'] },
    { emoji: '⚒️', label: 'Hammer Pickel', tags: ['werkzeug', 'bergbau'] },
    { emoji: '🪓', label: 'Axt', tags: ['waffe', 'holz', 'holzfäller'] },
    { emoji: '🔧', label: 'Schraubenschlüssel', tags: ['werkzeug', 'reparatur'] },
    { emoji: '⚙️', label: 'Zahnrad', tags: ['mechanik', 'technik'] },
    { emoji: '🔑', label: 'Schlüssel', tags: ['tür', 'schloss', 'geheimnis'] },
    { emoji: '🗝️', label: 'Alter Schlüssel', tags: ['schatz', 'dungeon'] },
    { emoji: '💎', label: 'Diamant', tags: ['schatz', 'juwel', 'wert'] },
    { emoji: '👑', label: 'Krone', tags: ['könig', 'königin', 'adel'] },
    { emoji: '🏰', label: 'Burg', tags: ['ort', 'festung', 'mittelalter'] },
    { emoji: '🏯', label: 'Turm', tags: ['burg', 'ostasien'] },
    { emoji: '⛪', label: 'Kirche', tags: ['tempel', 'glaube'] },
    { emoji: '🗺️', label: 'Karte', tags: ['ort', 'navigation', 'reise'] },
    { emoji: '🧭', label: 'Kompass', tags: ['richtung', 'navigation'] },
    { emoji: '📜', label: 'Schriftrolle', tags: ['quest', 'vertrag', 'brief'] },
    { emoji: '📖', label: 'Buch', tags: ['wissen', 'zauberbuch', 'regelwerk'] },
    { emoji: '✉️', label: 'Brief', tags: ['nachricht', 'post'] },
    { emoji: '🕯️', label: 'Kerze', tags: ['licht', 'dunkel', 'atmosphäre'] },
    { emoji: '🪔', label: 'Öllampe', tags: ['licht', 'orient'] },
    { emoji: '🔮', label: 'Kristallkugel', tags: ['magie', 'orakel', 'seher'] },
    { emoji: '🧪', label: 'Reagenzglas', tags: ['trank', 'alchemie', 'gift'] },
    { emoji: '⚗️', label: 'Alchemie', tags: ['trank', 'magie'] },
    { emoji: '🎲', label: 'Würfel', tags: ['w6', 'w20', 'spiel', 'zufall'] },
    { emoji: '🎯', label: 'Zielscheibe', tags: ['treffer', 'ziel'] },
    { emoji: '🏆', label: 'Pokal', tags: ['sieg', 'preis'] },
    { emoji: '🎖️', label: 'Medaille', tags: ['ehre', 'orden'] },
    { emoji: '💀', label: 'Totenkopf', tags: ['tod', 'gefahr', 'untot'] },
    { emoji: '☠️', label: 'Piratenschädel', tags: ['tod', 'gift'] },
    { emoji: '👻', label: 'Geist', tags: ['spuk', 'gespenst'] },
    { emoji: '👽', label: 'Alien', tags: ['ufo', 'sci-fi'] },
    { emoji: '🤖', label: 'Roboter', tags: ['sci-fi', 'technik'] },
    { emoji: '🧙', label: 'Magier', tags: ['zauberer', 'wizard', 'magie'] },
    { emoji: '🧝', label: 'Elf', tags: ['fantasy', 'elfe'] },
    { emoji: '🧛', label: 'Vampir', tags: ['untot', 'blut'] },
    { emoji: '🧟', label: 'Zombie', tags: ['untot', 'horror'] },
    { emoji: '⚰️', label: 'Sarg', tags: ['tod', 'beerdigung'] },
    { emoji: '🪦', label: 'Grabstein', tags: ['tod', 'friedhof'] },
    { emoji: '⛓️', label: 'Kette', tags: ['gefängnis', 'sklave'] },
    { emoji: '💣', label: 'Bombe', tags: ['explosion', 'gefahr'] },
    { emoji: '🧨', label: 'Feuerwerk', tags: ['explosion', 'knall'] },
    { emoji: '✅', label: 'Haken grün', tags: ['erledigt', 'ja', 'ok'] },
    { emoji: '❌', label: 'Kreuz', tags: ['nein', 'fehler'] },
    { emoji: '❓', label: 'Frage', tags: ['fragezeichen', 'rätsel'] },
    { emoji: '❗', label: 'Ausruf', tags: ['wichtig', 'achtung'] },
    { emoji: '‼️', label: 'Doppel-Ausruf', tags: ['wichtig', 'alarm'] },
    { emoji: '⚠️', label: 'Warnung', tags: ['achtung', 'gefahr'] },
    { emoji: '🔴', label: 'Kreis rot', tags: ['status', 'gefahr', 'stop'] },
    { emoji: '🟡', label: 'Kreis gelb', tags: ['status', 'vorsicht'] },
    { emoji: '🟢', label: 'Kreis grün', tags: ['status', 'ok', 'sicher'] },
    { emoji: '🔵', label: 'Kreis blau', tags: ['status', 'info'] },
    { emoji: '⚪', label: 'Kreis weiß', tags: ['status', 'neutral'] },
    { emoji: '⚫', label: 'Kreis schwarz', tags: ['status', 'dunkel'] },
    { emoji: '➡️', label: 'Pfeil rechts', tags: ['richtung', 'weiter'] },
    { emoji: '⬅️', label: 'Pfeil links', tags: ['zurück', 'richtung'] },
    { emoji: '⬆️', label: 'Pfeil hoch', tags: ['oben', 'richtung'] },
    { emoji: '⬇️', label: 'Pfeil runter', tags: ['unten', 'richtung'] },
    { emoji: '↔️', label: 'Pfeil horizontal', tags: ['richtung'] },
    { emoji: '↕️', label: 'Pfeil vertikal', tags: ['richtung'] },
    { emoji: '🔄', label: 'Pfeile Kreis', tags: ['wiederholen', 'wechsel'] },
    { emoji: '🔁', label: 'Wiederholen', tags: ['loop', 'erneut'] },
    { emoji: '✳️', label: 'Sternchen', tags: ['hervorheben', 'wichtig'] },
    { emoji: '❇️', label: 'Funkeln klein', tags: ['magie', 'glanz'] },
    { emoji: '©️', label: 'Copyright', tags: ['recht'] },
    { emoji: '™️', label: 'Trademark', tags: ['marke'] },
    { html: '<strong>⚔️</strong>', label: 'Schwerter fett', tags: ['html', 'kampf', 'betont'] },
    { html: '<em>✨</em>', label: 'Funkeln kursiv', tags: ['html', 'magie', 'betont'] },
    { html: '<span style="font-size:1.35em">🎲</span>', label: 'Würfel groß', tags: ['html', 'würfel', 'groß'] },
    { html: '<span title="Wichtig">❗</span>', label: 'Wichtig (Titel)', tags: ['html', 'tooltip', 'achtung'] },
  ];

  let panel = null;
  let panelSearchInput = null;
  let panelGrid = null;
  let panelEmpty = null;
  let activeQuill = null;
  let activeToolbarButton = null;
  let outsidePointerHandler = null;
  let iconsRegistered = false;

  function normSuchtext(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function eintragSuchtext(eintrag) {
    return normSuchtext([eintrag.label, ...(eintrag.tags || []), eintrag.emoji || ''].join(' '));
  }

  function gefilterteEintraege(query) {
    const q = normSuchtext(query);
    if (!q) {
      return EMOTICON_EINTRAGE;
    }
    return EMOTICON_EINTRAGE.filter((eintrag) => eintragSuchtext(eintrag).includes(q));
  }

  function registerToolbarIcon() {
    if (iconsRegistered || !window.Quill) {
      return;
    }
    try {
      const icons = window.Quill.import('ui/icons');
      icons[TOOLBAR_KEY] =
        '<svg viewBox="0 0 18 18" aria-hidden="true"><text x="2" y="14" font-size="13">😀</text></svg>';
      iconsRegistered = true;
    } catch {
      /* Quill-Icons nicht verfügbar */
    }
  }

  function ensurePanel() {
    if (panel) {
      return panel;
    }
    panel = document.createElement('div');
    panel.className = 'htbah-quill-emoticon-picker';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Emoticons einfügen');

    const header = document.createElement('div');
    header.className = 'htbah-quill-emoticon-picker__header';

    panelSearchInput = document.createElement('input');
    panelSearchInput.type = 'search';
    panelSearchInput.className = 'form-control form-control-sm htbah-quill-emoticon-picker__search';
    panelSearchInput.placeholder = 'Emoticon suchen …';
    panelSearchInput.setAttribute('autocomplete', 'off');
    panelSearchInput.setAttribute('spellcheck', 'false');

    header.appendChild(panelSearchInput);
    panel.appendChild(header);

    panelGrid = document.createElement('div');
    panelGrid.className = 'htbah-quill-emoticon-picker__grid';
    panelGrid.setAttribute('role', 'listbox');
    panel.appendChild(panelGrid);

    panelEmpty = document.createElement('div');
    panelEmpty.className = 'htbah-quill-emoticon-picker__empty small text-secondary';
    panelEmpty.textContent = 'Keine Treffer.';
    panelEmpty.hidden = true;
    panel.appendChild(panelEmpty);

    panelSearchInput.addEventListener('input', () => {
      renderGrid(panelSearchInput.value);
    });
    panelSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePicker();
      }
    });
    panelGrid.addEventListener('mousedown', (event) => {
      event.preventDefault();
      const btn = event.target.closest('[data-emoticon-index]');
      if (!btn) {
        return;
      }
      const index = Number(btn.getAttribute('data-emoticon-index'));
      const liste = gefilterteEintraege(panelSearchInput.value);
      const eintrag = liste[index];
      if (eintrag) {
        insertEmoticon(eintrag);
      }
    });

    document.body.appendChild(panel);
    return panel;
  }

  function renderGrid(query) {
    if (!panelGrid || !panelEmpty) {
      return;
    }
    const liste = gefilterteEintraege(query);
    panelGrid.innerHTML = '';
    panelEmpty.hidden = liste.length > 0;
    liste.forEach((eintrag, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'htbah-quill-emoticon-picker__item';
      btn.setAttribute('data-emoticon-index', String(index));
      btn.setAttribute('role', 'option');
      btn.title = eintrag.label;
      btn.setAttribute('aria-label', eintrag.label);
      if (eintrag.html) {
        btn.innerHTML = eintrag.html;
        btn.classList.add('htbah-quill-emoticon-picker__item--html');
      } else {
        btn.textContent = eintrag.emoji || '';
      }
      panelGrid.appendChild(btn);
    });
  }

  function positionPanel(anchorEl) {
    if (!panel || !anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const margin = 6;
    const panelBreite = Math.min(320, window.innerWidth - margin * 2);
    panel.style.width = `${panelBreite}px`;
    panel.hidden = false;
    const panelRect = panel.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + margin;
    if (left + panelRect.width > window.innerWidth - margin) {
      left = window.innerWidth - panelRect.width - margin;
    }
    if (left < margin) {
      left = margin;
    }
    if (top + panelRect.height > window.innerHeight - margin) {
      top = rect.top - panelRect.height - margin;
    }
    if (top < margin) {
      top = margin;
    }
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  function insertEmoticon(eintrag) {
    const quill = activeQuill;
    if (!quill || !eintrag) {
      return;
    }
    const range = quill.getSelection(true);
    const index = range && Number.isInteger(range.index) ? range.index : Math.max(0, quill.getLength() - 1);
    if (eintrag.html) {
      const lenBefore = quill.getLength();
      quill.clipboard.dangerouslyPasteHTML(index, eintrag.html, 'user');
      const delta = quill.getLength() - lenBefore;
      quill.setSelection(index + Math.max(1, delta), 0, 'silent');
    } else {
      const text = eintrag.emoji || '';
      quill.insertText(index, text, 'user');
      quill.setSelection(index + text.length, 0, 'silent');
    }
    closePicker();
    quill.focus();
  }

  function closePicker() {
    if (panel) {
      panel.hidden = true;
    }
    activeQuill = null;
    activeToolbarButton = null;
    if (outsidePointerHandler) {
      document.removeEventListener('pointerdown', outsidePointerHandler, true);
      outsidePointerHandler = null;
    }
  }

  function openPicker(quill, toolbarButton) {
    if (!quill || quill.isEnabled && !quill.isEnabled()) {
      return;
    }
    ensurePanel();
    activeQuill = quill;
    activeToolbarButton = toolbarButton || null;
    if (panelSearchInput) {
      panelSearchInput.value = '';
    }
    renderGrid('');
    const anchor =
      toolbarButton ||
      (quill.container && quill.container.querySelector
        ? quill.container.querySelector(`.ql-${TOOLBAR_KEY}`)
        : null);
    positionPanel(anchor || quill.container);
    if (panelSearchInput) {
      panelSearchInput.focus();
      panelSearchInput.select();
    }
    if (outsidePointerHandler) {
      document.removeEventListener('pointerdown', outsidePointerHandler, true);
    }
    outsidePointerHandler = (event) => {
      const target = event.target;
      if (panel && panel.contains(target)) {
        return;
      }
      if (anchor && anchor.contains && anchor.contains(target)) {
        return;
      }
      closePicker();
    };
    document.addEventListener('pointerdown', outsidePointerHandler, true);
  }

  function togglePicker(quill, toolbarButton) {
    if (panel && !panel.hidden && activeQuill === quill) {
      closePicker();
      return;
    }
    openPicker(quill, toolbarButton);
  }

  function toolbarHandler() {
    const quill = this.quill;
    const btn =
      this.container && typeof this.container.querySelector === 'function'
        ? this.container.querySelector(`.ql-${TOOLBAR_KEY}`)
        : null;
    togglePicker(quill, btn);
  }

  function toolbarHatEmoticonButton(container) {
    if (!container) {
      return false;
    }
    if (Array.isArray(container)) {
      return container.some((row) => toolbarHatEmoticonButton(row));
    }
    if (typeof container === 'string') {
      return container === TOOLBAR_KEY;
    }
    return false;
  }

  function fuegeEmoticonZurToolbarHinzu(container) {
    if (!Array.isArray(container) || toolbarHatEmoticonButton(container)) {
      return container;
    }
    const copy = container.map((row) => (Array.isArray(row) ? row.slice() : [row]));
    const letzteZeile = copy[copy.length - 1];
    if (Array.isArray(letzteZeile)) {
      letzteZeile.push(TOOLBAR_KEY);
    } else {
      copy.push([TOOLBAR_KEY]);
    }
    return copy;
  }

  function enhanceModules(modules) {
    const next = modules && typeof modules === 'object' ? { ...modules } : {};
    if (next.toolbar === false) {
      return next;
    }
    registerToolbarIcon();
    const handlers = { [TOOLBAR_KEY]: toolbarHandler };
    if (!next.toolbar) {
      return {
        ...next,
        toolbar: {
          container: [[TOOLBAR_KEY]],
          handlers,
        },
      };
    }
    if (Array.isArray(next.toolbar)) {
      return {
        ...next,
        toolbar: {
          container: fuegeEmoticonZurToolbarHinzu(next.toolbar),
          handlers,
        },
      };
    }
    if (typeof next.toolbar === 'object') {
      const container = Array.isArray(next.toolbar.container)
        ? fuegeEmoticonZurToolbarHinzu(next.toolbar.container)
        : [[TOOLBAR_KEY]];
      return {
        ...next,
        toolbar: {
          ...next.toolbar,
          container,
          handlers: {
            ...handlers,
            ...(next.toolbar.handlers && typeof next.toolbar.handlers === 'object'
              ? next.toolbar.handlers
              : {}),
          },
        },
      };
    }
    return next;
  }

  function patchQuillConstructor() {
    const Original = window.Quill;
    if (!Original || Original.__htbahEmoticonsPatched) {
      return;
    }
    registerToolbarIcon();

    function QuillMitEmoticons(container, options) {
      const opts = options && typeof options === 'object' ? { ...options } : {};
      const modules = opts.modules && typeof opts.modules === 'object' ? { ...opts.modules } : {};
      opts.modules = enhanceModules(modules);
      const instance = new Original(container, opts);
      return instance;
    }

    Object.assign(QuillMitEmoticons, Original);
    QuillMitEmoticons.prototype = Original.prototype;
    QuillMitEmoticons.__htbahEmoticonsPatched = true;
    window.Quill = QuillMitEmoticons;
  }

  function registerPxSizeAttributor() {
    if (window.__HTBAH_QUILL_SIZE_STYLE_REGISTRIERT__) {
      return true;
    }
    if (!window.Quill) {
      return false;
    }
    try {
      const SizeStyle = window.Quill.import('attributors/style/size');
      if (SizeStyle) {
        SizeStyle.whitelist = null;
        window.Quill.register(SizeStyle, true);
      }
      window.__HTBAH_QUILL_SIZE_STYLE_REGISTRIERT__ = true;
      return true;
    } catch {
      return false;
    }
  }

  function installEmoticons() {
    registerPxSizeAttributor();
    patchQuillConstructor();
  }

  function zerstoereEmoticonPickerFuerQuill(quill) {
    if (activeQuill === quill) {
      closePicker();
    }
  }

  if (window.Quill) {
    installEmoticons();
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        installEmoticons();
      },
      { once: true },
    );
  }

  SHARED.QuillEmoticons = {
    installEmoticons,
    registerPxSizeAttributor,
    openPicker,
    closePicker,
    togglePicker,
    insertEmoticon,
    gefilterteEintraege,
    zerstoereEmoticonPickerFuerQuill,
    TOOLBAR_KEY,
  };
})(window.HTBAH_SHARED);
