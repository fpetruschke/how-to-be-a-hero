# How to be a hero - Begleit-App

![HTBAH Begleit-App Logo](assets/img/htbah-begleit-app-logo.png)

https://fpetruschke.github.io/how-to-be-a-hero

## Hinweis zum Regelwerk / Quelle

Das verwendete Regelwerk ist **nicht** meine Arbeit.

Die Inhalte stammen u.a. von **Hauke Gerdes**, dem Verein **How to be a Hero e.V. und der Community**!

Offizielles Wiki / Quelle:
https://howtobeahero.de/index.php/Hauptseite

## Lokale Entwicklung

Für lokales Hosting gibt es ein Skript unter `bin/serve`.

### Start

```bash
./bin/serve
```

### Konfiguration (optional)

```bash
HOST=0.0.0.0 PORT=5173 ./bin/serve
```

### Verhalten

- Mit `npx` verfügbar: Start mit `browser-sync` inkl. Live-Reload.
- Ohne `npx`: Fallback auf `python3 -m http.server` (ohne Live-Reload).

### Voraussetzungen

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
