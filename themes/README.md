# Themes

Themen werden über zwei unabhängige Achsen gesteuert:

| Achse | HTML-Attribut | Dateien |
|-------|---------------|---------|
| Hell / Dunkel | `data-theme` | `themes/modes/light.css`, `themes/modes/dark.css` |
| Setting (Fantasy, …) | `data-theme-setting` | `themes/settings/<id>.css` |

Die App liest `themes/themeRegistry.js` für Labels, Epochen-Defaults und Validierung; das CSS setzt Farben, Typografie und Hintergründe.

## Neues Setting hinzufügen

1. **Registry** — in `themes/themeRegistry.js` einen Eintrag ergänzen:

```javascript
{
  id: 'steampunk',           // Kleinbuchstaben, keine Leerzeichen
  label: 'Steampunk',
  emoji: '⚙️',
  zufallEpoche: 'viktoriisch',
  charakterEpoche: 'steampunk',
  pdfStil: 'steampunk',
}
```

2. **CSS** — `themes/settings/_template.css` nach `themes/settings/steampunk.css` kopieren, `<deine-id>` durch `steampunk` ersetzen und Tokens anpassen.

3. **Import** — in `themes/index.css` ergänzen:

```css
@import url('settings/steampunk.css');
```

4. **Hintergrundbilder** (optional, Namenskonvention):

- `assets/img/bg-desktop-steampunk.png`
- `assets/img/bg-mobile-device-portrait-steampunk.png`

5. Seite neu laden — die Auswahl erscheint automatisch in den Einstellungen und bei Kampagnen.

## Bestehendes Setting anpassen

Nur die jeweilige Datei unter `themes/settings/` bearbeiten. Für globale Hell/Dunkel-Farben: `themes/modes/`.

## Sci-Fi-Sonderfall

Eckige UI-Elemente (kein `border-radius`) liegen bewusst in `themes/settings/scifi.css`, nicht in `main.css`. Analog können setting-spezifische Overrides in der jeweiligen Setting-Datei stehen.

## Technische Details

- `main.css` importiert `themes/index.css` und enthält nur App-Layout (Abstände, z-Index-Stapel).
- `shared/themenEinstellungen.js` leitet Listen und Hilfsfunktionen aus `HTBAH_THEME_REGISTRY` ab.
- `themes/themeRegistry.js` muss in `index.html` **vor** `shared/themenEinstellungen.js` geladen werden.
