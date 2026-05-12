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
