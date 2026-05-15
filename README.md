# How to be a hero - Begleit-App

![HTBAH Begleit-App Logo](assets/img/htbah-begleit-app-logo.png)

https://fpetruschke.github.io/how-to-be-a-hero

## Hinweis zum Regelwerk / Quelle

Das verwendete Regelwerk ist **nicht** meine Arbeit.

Die Inhalte stammen u.a. von **Hauke Gerdes**, dem Verein **How to be a Hero e.V. und der Community**!

Offizielles Wiki / Quelle:
https://howtobeahero.de/index.php/Hauptseite

## Lokale Entwicklung

### Einmaliges Setup

Git-Hooks pro Clone aktivieren:

```bash
./bin/setup-hooks
```

Das setzt `core.hooksPath` auf das versionierte `.githooks/`-Verzeichnis. Aktuell sorgt das dafür, dass `assets/beispiel-kampagnen/index.json` automatisch zum Inhalt des Ordners passt: Beim Commit wird die Datei regeneriert und mit-gestaged, untracked oder vergessene `.json`-Dateien werden gemeldet. Notbremse einmalig: `git commit --no-verify` bzw. `git push --no-verify`.

### Lokales Hosting

Für lokales Hosting gibt es ein Skript unter `bin/serve`.

#### Start

```bash
./bin/serve
```

#### Konfiguration (optional)

```bash
HOST=0.0.0.0 PORT=5173 ./bin/serve
```

#### Verhalten

- Mit `npx` verfügbar: Start mit `browser-sync` inkl. Live-Reload.
- Ohne `npx`: Fallback auf `python3 -m http.server` (ohne Live-Reload).

#### Voraussetzungen

- Für Live-Reload: `node` + `npx`
- Für Fallback: `python3`

## Android / Termux

Das Skript kann auch unter Termux laufen, wenn folgende Tools installiert sind:

- Live-Reload: `pkg install nodejs` (stellt `npx` bereit)
- Fallback: `pkg install python`

Empfehlung für Zugriff vom Android-Browser im selben Gerät:

```bash
HOST=0.0.0.0 PORT=8080 ./bin/serve
```

## Beispiel-Kampagnen (Assets)

Unter **Spielleiter → Kampagnen** können Nutzerinnen und Nutzer vorgefertigte Kampagnen aus dem Ordner `assets/beispiel-kampagnen/` additiv laden. Jede Datei ist ein JSON-Paket im gleichen Format wie der **Daten-Export** unter Einstellungen (`typ: "lokaler-speicher"` mit Array `daten`).

### Export als Beispiel-Kampagne nutzen

Du kannst eine Kampagne (oder einen vollständigen Backup-Export) in der App exportieren und die `.json`-Datei direkt als Beispiel-Asset ablegen — **ohne** manuelles Umbauen in ein anderes Format.

Unterstützt werden:

- **Neuer Export** mit `htbah_export_ls:*`-Einträgen (z. B. Abenteuerbuch, Wetter, Zufallstabellen je Kategorie, Weltenbau je Bereich, Komplett-Bundle)
- **Legacy-Sammel-Export** mit `htbah_spielleiter_kampagnen`, `htbah_zufallstabellen` und `htbah_weltenbau` (wie bei älteren Beispielen z. B. „Das schwarze Wasser“)

Beim Laden wird die Kampagne **additiv** eingespielt: vorhandene Kampagnen bleiben erhalten, Einträge mit gleicher ID werden übersprungen.

### Metadaten für die Auswahlliste (empfohlen)

Optional kannst du oben in der JSON-Datei ein Objekt `beispiel` ergänzen (Titel und Beschreibung in der UI). Ohne `beispiel` wird der Dateiname als Titel verwendet.

```json
{
  "htbahExportVersion": 1,
  "typ": "lokaler-speicher",
  "beispiel": {
    "titel": "Meine Demo-Kampagne",
    "untertitel": "Kurze Einordnung (optional)",
    "beschreibung": "Ein bis zwei Sätze für die Kampagnen-Auswahl.",
    "autoren": "Name(n) (optional)",
    "kontext": "z. B. One-Shot, 60 Min (optional)",
    "lizenz": "CC BY-NC-SA 4.0 (optional)"
  },
  "daten": [ … ]
}
```

Weitere optionale Felder: `quelleUrl`, `quelleLabel`.

### Index aktualisieren

Neue oder geänderte `.json`-Dateien (außer `index.json`) eintragen:

```bash
./bin/aktualisiere-beispiel-kampagnen-index
```

Beim Commit/Push übernimmt das der Git-Hook automatisch (siehe [Einmaliges Setup](#einmaliges-setup)), sofern `./bin/setup-hooks` ausgeführt wurde.

Das Skript prüft, ob im Paket eine Spielleiter-Kampagne erkennbar ist (Legacy `htbah_spielleiter_kampagnen` oder `htbah_export_ls:*` mit Kampagnen-ID). Dateien ohne erkennbare Kampagne werden übersprungen und als Hinweis ausgegeben.
