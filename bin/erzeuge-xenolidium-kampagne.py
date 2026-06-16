#!/usr/bin/env python3
"""Erzeugt die Beispiel-Kampagne demo-xenolidium-notfall und patcht Gruppengröße-Labels."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KAMPAGNEN_DIR = ROOT / "assets" / "beispiel-kampagnen"

KAMP_ID = "demo-xenolidium-notfall"
EXPORT_AM = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

LABEL_2_4 = {
    "id": "lbl-gruppengroesse-2-4",
    "name": "2-4",
    "kategorie": "gruppengroesse",
    "bg": "secondary",
    "text": "light",
}

KAMPAGNE_LABELS = [
    {
        "id": "lbl-setting-scifi",
        "name": "Sci-Fi",
        "kategorie": "setting",
        "bg": "info",
        "text": "dark",
    },
    {
        "id": "lbl-format-one-shot",
        "name": "One-Shot",
        "kategorie": "format",
        "bg": "primary",
        "text": "light",
    },
    {
        "id": "lbl-format-tutorial",
        "name": "Tutorial",
        "kategorie": "format",
        "bg": "primary",
        "text": "light",
    },
    {
        "id": "lbl-gruppengroesse-solo",
        "name": "Solo",
        "kategorie": "gruppengroesse",
        "bg": "secondary",
        "text": "light",
    },
]


def entity_link(typ: str, eid: str, name: str) -> str:
    return (
        f'<a href="https://htbah.local/entity/{typ}/{eid}" '
        f'rel="noopener noreferrer" target="_blank">@{name}</a>'
    )


def abenteuerbuch_reiter() -> list[dict]:
    hangar = entity_link("ort", "xnl-ort-hangar", "Handels-Hangar K-7")
    schiff = entity_link("ort", "xnl-ort-schiff", "Andockplatz C-14")
    lux = entity_link("npc", "xnl-npc-lux", "Lux Vexara")
    techniker = entity_link("npc", "xnl-npc-korvex", "Korvex-9")
    schaulustige = entity_link("npc", "xnl-npc-schaulustige", "Die Schaulustigen")
    xenolidium = entity_link("gegenstand", "xnl-item-xenolidium", "Xenolidium")

    abenteuer_html = f"""<h1>Xenolidium-Notfall</h1>
<p><strong>Sci-Fi-Solo-Tutorial</strong> · 1 Charakter · ca. 45–60 Min · Autor: Florian Petruschke</p>
<p>Regelschwerpunkte: W100-Proben, Begabungen Handeln / Wissen / Soziales, Geistesblitzpunkte, verzweigende Konsequenzen.</p>
<p><strong>Solo-Spiel:</strong> Du bist gleichzeitig die spielende Person und die Spielleitung. Lies die markierten Tutorial-Hinweise leise mit — sie erklären Regeln und helfen dir, Konsequenzen fair zu würdigen.</p>
<p><strong>Kern:</strong> Dein Raumschiff ist am {hangar} angedockt ({schiff}). Der Hypersprungantrieb meldet kritischen Brennstoffmangel — ohne {xenolidium} bleibst du in diesem Sektor fest. Drei kurze Situationen führen dich vom Schiff zum Händler und zurück.</p>
<p><strong>Charakter:</strong> Wähle eine Sci-Fi-Charaktervorlage (Pilot, Ingenieur oder Diplomat passen besonders gut). Beschreibe kurz, wie du aussiehst und warum du unter Zeitdruck bist.</p>
<p><strong>Ende,</strong> wenn du Xenolidium hast und wieder am Schiff bist — oder wenn du die Konsequenzen eines klaren Scheiterns spielst.</p>"""

    einstieg_html = """<h1>Einstieg</h1>
<p>Die Andockklammern vibrieren leise. Draußen: das Summen eines belebten Weltraumhandels-Hangars — Werbehologramme, fremde Sprachen, das Klatschen von Servodroiden auf Metallboden.</p>
<p>Dein Schiffscomputer meldet nüchtern:</p>
<p><em>„Hypersprung inaktiv. Xenolidium-Kern leer. Geschätzte Zeit bis Reaktorkühlung kritisch: 4 Standardstunden.“</em></p>
<p>Am Terminal blinkt die Route zum nächsten Xenolidium-Händler: Schalter 7-B, Etage Gamma. Der Weg führt durch die Hangarhalle.</p>"""

    situation1_html = f"""<h1>Situation 1 — Die klemmende Luke</h1>
<p>Die innere Schleusenluke zur Gangway klemmt. Das Display zeigt <em>DRUCKAUSGLEICH UNVOLLSTÄNDIG</em>. Du musst raus.</p>
<p><strong>Lernziel:</strong> Proben auf <strong>Handeln</strong> oder <strong>Wissen</strong> — wähle den Ansatz, der zu deinem Charakter passt.</p>
<p><strong>Mögliche Fähigkeiten:</strong></p>
<p><strong>Handeln:</strong> Wartung &amp; Reparatur, Schwerelosigkeits-Manöver, Exoanzug-Einsatz, Schleichen (Hebel finden), Drohnensteuerung (kleine Wartungsdrohne) …</p>
<p><strong>Wissen:</strong> Raumschifftechnik, KI-Systeme, Cybernetik, Wahrnehmung (Schaden lokalisieren) …</p>
<p><strong>Erfolg:</strong> Luke öffnet sich knarrend — du stehst auf der Gangway zum Hangar.</p>
<p><strong>Misserfolg:</strong> Die Luke bleibt zu. Geistesblitz erlaubt dir einen neuen Wurf; alternativ eine kreative Lösung (Notentriegelung, Hilferuf an {techniker}, Rettungskapsel-Nebenausgang — belohne gute Ideen selbst).</p>
<p><strong>Tutorial-Hinweis:</strong> Hier lernst du W100, Fähigkeitswert, Begabung und kritische Erfolge/Misserfolge. Würfle laut für dich selbst und beschreibe das Ergebnis in ein bis zwei Sätzen.</p>"""

    situation2_html = f"""<h1>Situation 2 — Schaulustige Aliens</h1>
<p>Du betrittst die Hangarhalle. Zwischen Frachtcontainern und Imbissständen sammelt sich eine Menschenmenge — nein: <em>Aliens</em>menge. {schaulustige} haben dich entdeckt.</p>
<p>Sie starren, flüstern, zücken Holo-Kameras. Einer ruft: <em>„Schau mal — ein echter Solosektor-Pilot!“</em> (oder passend zu deinem Charakter). Du wirst langsamer, weil du im Weg bist.</p>
<p><strong>Lernziel:</strong> Soziale Probe — oder bei schlechtem Ausgang <strong>Handeln</strong> unter Druck.</p>
<p><strong>Mögliche Fähigkeiten:</strong></p>
<p><strong>Soziales:</strong> Diplomatie (interstellar), Verhandeln, Menschenkenntnis, Begeistern, Kulturelle Anpassung, Außerirdische Spezies deuten, Überzeugen …</p>
<p><strong>Handeln (bei Misserfolg oder Blockade):</strong> Schwerelosigkeits-Manöver, Schleichen, Drohnensteuerung, Exoanzug-Einsatz …</p>
<p><strong>Erfolg / kritischer Erfolg:</strong> Du bahnst dir respektvoll den Weg; einige Aliens machen sogar Platz. Gerüchte bleiben freundlich. Notiere dir: <strong>Situation 3 = Soziales</strong>.</p>
<p><strong>Normaler Misserfolg:</strong> Du stolperst metaphorisch — die Menge wird lauter, jemand postet ein peinliches Holo. {lux} hat davon gehört. Notiere dir: <strong>Situation 3 = Handeln</strong> (härteres Feilschen unter schlechtem Ruf).</p>
<p><strong>Kritischer Misserfolg:</strong> Die Schaulustigen blockieren dich. Du musst <strong>Handeln</strong> probieren (Schwerelosigkeits-Manöver, Schleichen, Drohnensteuerung), um überhaupt weiterzukommen. Situation 3 wird <strong>Handeln</strong>; der Xenolidium-Preis steigt um 20&nbsp;%. Notiere dir den Ausgang — er wirkt direkt in Situation 3.</p>
<p><strong>Tutorial-Hinweis:</strong> Nicht jede Interaktion braucht einen Wurf. Wenn du eine Szene lebendig beschreibst, darfst du den Wurf weglassen. Als Solo-Spielleitung entscheidest du das fair für deinen Charakter.</p>"""

    situation3_html = f"""<h1>Situation 3 — Xenolidium kaufen</h1>
<p>Schalter 7-B: ein bunter Markstand voller schwebender Ampullen. Hinter der Theke: {lux}, Xenolidium-Spezialistin mit drei Augen und einem Lächeln, das zu viele Zähne zeigt.</p>
<p>&gt; „Ah. Du bist die Person mit dem klemmenden Schiff, oder? Xenolidium hab ich. Premium. Frisch destilliert. Nicht billig.“</p>
<p>Listenpreis: <strong>800 Credits</strong>. Du hast <strong>650 Credits</strong> (passe die Summe bei Bedarf an dein Charakter-Inventar an).</p>
<p><strong>Mögliche Fähigkeiten:</strong></p>
<p><strong>Soziales (wenn Situation 2 gut lief):</strong> Verhandeln, Diplomatie (interstellar), Menschenkenntnis, Überzeugen, Begeistern …</p>
<p><strong>Handeln (wenn Situation 2 schlecht lief):</strong> Schleichen, Drohnensteuerung, Nahkampf (Energiewaffen), Exoanzug-Einsatz … — oft kombiniert mit Lügen oder Einschüchtern aus Soziales</p>
<p><strong>Wissen (Alternativweg):</strong> Raumschifftechnik, Xenobiologie, KI-Systeme, Wahrnehmung (Qualität der Ampullen prüfen) …</p>
<p><strong>Abhängig von Situation 2:</strong></p>
<p><strong>Situation 2 gut (Soziales):</strong> Lux kennt dich nur vom Hörensagen — freundlich, neugierig. Sie beginnt bei 750 Credits und ist gesprächsbereit. Probe auf <strong>Soziales</strong>. <em>Erfolg:</em> Rabatt auf 650 oder Ratenzahlung. <em>Kritischer Erfolg:</em> 650 Credits reichen sofort; Lux schenkt dir einen Andock-Gutschein für K-7. <em>Misserfolg:</em> Lux bleibt nett, verhandelt aber hart — du brauchst 700 Credits oder einen Gegenstand als Anzahlung.</p>
<p><strong>Situation 2 normal schlecht (Handeln):</strong> Lux hat das peinliche Holo gesehen. Sie grinst: <em>„Berühmtheit kostet extra.“</em> Startpreis 850 Credits. Probe auf <strong>Handeln</strong> oder <strong>Soziales</strong> (Lügen, Einschüchtern, Verhandeln). <em>Erfolg:</em> 650 Credits reichen trotzdem. <em>Misserfolg:</em> Kollateral aus deinem Inventar oder eine kleine Gefälligkeits-Aufgabe (z. B. Holo löschen lassen).</p>
<p><strong>Situation 2 kritisch schlecht (Handeln + Blockade):</strong> Lux hat die Clips <em>und</em> die Blockade mitbekommen. Startpreis 960 Credits (+20&nbsp;%). Sie ist misstrauisch. Probe auf <strong>Handeln</strong> — oder überzeuge sie mit <strong>Wissen</strong> (Xenobiologie: Qualität erkennen). <em>Erfolg:</em> 650 Credits + ein Inventar-Gegenstand als Pfand. <em>Misserfolg:</em> Lux bietet nur verdünntes Xenolidium an (Wissen-Probe zum Entlarven) oder du akzeptierst eine Follow-up-Aufgabe.</p>
<p><strong>Alternativen:</strong> Repariere Lux' defekten Preisanzeiger (Wartung &amp; Reparatur) oder tausche gegen ein seltenes Inventarstück. Kreative Lösungen darfst du dir selbst genehmigen, solange sie zum Charakter passen.</p>
<p><strong>Erfolg:</strong> Du erhältst {xenolidium} (1 Kern, ausreichend für einen Sprung). Rückweg zum Schiff — optional kurze Wiederholungs-Probe, wenn Situation 1 knapp war.</p>"""

    finale_html = f"""<h1>Finale — Zurück am Schiff</h1>
<p>Du lädst das Xenolidium in den Antriebskern. Das Display wechselt von Rot auf Grün:</p>
<p><em>„Hypersprung bereit. Zielkoordinaten?“</em></p>
<p>Der Hangar wird kleiner im Heckfenster. Irgendwo posten {schaulustige} vielleicht noch dein Holo — aber du bist frei.</p>
<p><strong>Ende.</strong> Optional: Nimm dir eine Minute und überlege, welche Begabung dir am häufigsten half und was sich bei kritischen Würfen geändert hat. Damit hast du das Solo-Tutorial abgeschlossen.</p>"""

    return [
        {"id": "xnl-ab-gesamt", "name": "Abenteuer", "html": abenteuer_html},
        {"id": "xnl-ab-einstieg", "name": "Einstieg", "html": einstieg_html},
        {"id": "xnl-ab-sit1", "name": "Situation 1", "html": situation1_html},
        {"id": "xnl-ab-sit2", "name": "Situation 2", "html": situation2_html},
        {"id": "xnl-ab-sit3", "name": "Situation 3", "html": situation3_html},
        {"id": "xnl-ab-finale", "name": "Finale", "html": finale_html},
    ]


def ztf_kategorie(kategorie: str, zeilen: list) -> dict:
    return {
        "htbahExportVersion": 1,
        "typ": "htbah-zufallstabellen-kategorie",
        "kampagneId": KAMP_ID,
        "kategorie": kategorie,
        "exportiertAm": EXPORT_AM,
        "zeilen": zeilen,
    }


def wb_bereich(bereich: str, daten: dict) -> dict:
    return {
        "htbahExportVersion": 1,
        "typ": "htbah-weltenbau-bereich",
        "kampagneId": KAMP_ID,
        "bereich": bereich,
        "exportiertAm": EXPORT_AM,
        "daten": daten,
    }


def ls_eintrag(entry_id: str, key: str, label: str, wert: dict) -> dict:
    return {
        "id": entry_id,
        "key": key,
        "label": label,
        "vorhanden": True,
        "wert": json.dumps(wert, ensure_ascii=False),
    }


def baue_kampagne() -> dict:
    reiter = abenteuerbuch_reiter()
    labels = KAMPAGNE_LABELS

    spielleitung = {
        "htbahExportVersion": 1,
        "typ": "htbah-spielleitung-kampagne-teil",
        "kampagneId": KAMP_ID,
        "exportiertAm": EXPORT_AM,
        "kampagne": {
            "id": KAMP_ID,
            "name": "Xenolidium-Notfall (Solo-Tutorial)",
            "mitglieder": [],
            "labels": labels,
        },
        "mitgliedWahlMitgliedId": "",
    }

    abenteuerbuch = {
        "htbahExportVersion": 1,
        "typ": "htbah-spielleitung-abenteuerbuch-teil",
        "kampagneId": KAMP_ID,
        "exportiertAm": EXPORT_AM,
        "abenteuerbuch": {
            "reiter": reiter,
            "aktiverReiterId": reiter[0]["id"],
        },
        "abenteuerbuchHtml": reiter[0]["html"],
    }

    atmosphaere = {
        "htbahExportVersion": 1,
        "typ": "htbah-spielleitung-atmosphaere-teil",
        "kampagneId": KAMP_ID,
        "exportiertAm": EXPORT_AM,
        "atmosphaere": {
            "version": 1,
            "jahreszeitId": "neutral",
            "jahreszeitLabel": "Orbitale Station",
            "jahreszeitEmoji": "🛸",
            "jahreszeitFarbe": "#6366f1",
            "tageszeitId": "zyklus",
            "tageszeitLabel": "Künstlicher Tagzyklus",
            "tageszeitEmoji": "💡",
            "tageszeitFarbe": "#94a3b8",
            "temperatur": "klimatisiert, leicht kühl",
            "bewoelkung": "keine — Blick auf Sternenfeld durch Panoramafenster",
            "niederschlagKey": "keiner",
            "niederschlagLabel": "Kein Niederschlag",
            "niederschlagEmoji": "✨",
            "wind": "Kein Wind — nur Lüftungsstrom",
            "windStaerke": "schwach",
            "windBeaufort": "—",
            "wetterAkzentFarbe": "#6366f1",
        },
        "atmosphaereBadgePos": None,
        "mitgliedWahlMitgliedId": "",
    }

    orte = [
        {
            "id": "xnl-ort-hangar",
            "name": "Handels-Hangar K-7",
            "groesse": "Große orbitaler Handelsring",
            "lage": "Neutralzone Sektor 12",
            "zustand": "Belebt, multikulturell, laut",
            "notizenHtml": (
                "<p>Zentraler Marktplatz mit Andockbuchten, Imbissständen und Xenohändlern. "
                "Schalter 7-B (Xenolidium) liegt in Etage Gamma.</p>"
            ),
        },
        {
            "id": "xnl-ort-schiff",
            "name": "Andockplatz C-14",
            "groesse": "Mittlere Frachtbucht",
            "lage": "Hangar K-7, Außenring",
            "zustand": "Dein Schiff angedockt, Luke klemmt zu Beginn",
            "notizenHtml": (
                "<p>Dein Schiff. Hypersprungantrieb ohne "
                '<a href="https://htbah.local/entity/gegenstand/xnl-item-xenolidium" '
                'rel="noopener noreferrer" target="_blank">@Xenolidium</a>.</p>'
            ),
        },
    ]

    npcs = [
        {
            "id": "xnl-npc-lux",
            "name": "Lux Vexara",
            "spitzname": "",
            "geschlecht": "weiblich",
            "alter": "Unbekannt (Trioculianerin)",
            "familienstand": "",
            "statur": "Schlank, drei Augen, viele Zähne",
            "gesinnung": "Geschäftstüchtig, charmant, opportunistisch",
            "beruf": "Xenolidium-Händlerin",
            "ziel": "Guter Deal, gute Stories für Kundschaft",
            "geheimnis": "Verdünnt Xenolidium bei schlecht verhandelnden Kunden — Wissen-Probe (Xenobiologie) kann das entlarven.",
            "stimme": "singend, schnell, freundlich",
            "lebenspunkte": "45",
            "kampfZustand": "vital",
            "lpBewusstlosAusgeblendet": False,
            "lpMassenschadenBewusstlos": False,
            "aufenthaltsort": "Schalter 7-B, Etage Gamma",
            "presetId": "htbah-scifi",
            "handeln": [
                {"name": "Schleichen", "value": 45},
                {"name": "Wartung & Reparatur", "value": 55},
            ],
            "wissen": [
                {"name": "Raumschifftechnik", "value": 82},
                {"name": "Xenobiologie", "value": 70},
                {"name": "Wahrnehmung", "value": 60},
            ],
            "soziales": [
                {"name": "Verhandeln", "value": 78},
                {"name": "Menschenkenntnis", "value": 65},
                {"name": "Lügen", "value": 72},
                {"name": "Begeistern", "value": 58},
            ],
            "fraktion": "",
            "glaube": "",
            "initiative": "9",
            "inventar": [],
            "notizenHtml": (
                "<p>Verkauft "
                '<a href="https://htbah.local/entity/gegenstand/xnl-item-xenolidium" '
                'rel="noopener noreferrer" target="_blank">@Xenolidium</a>. '
                "Reagiert auf Gerüchte aus Situation 2.</p>"
            ),
        },
        {
            "id": "xnl-npc-korvex",
            "name": "Korvex-9",
            "spitzname": "Korvex",
            "geschlecht": "keine Angabe",
            "alter": "Serie 9",
            "familienstand": "",
            "statur": "Servodroide, rollend, mehrere Greifarme",
            "gesinnung": "Hilfsbereit, pedantisch",
            "beruf": "Hangar-Wartungsdroide",
            "ziel": "Ordnung im Docking-Bereich",
            "geheimnis": "Kann die Luke per Fernfreigabe öffnen — verlangt aber gültigen Andock-Schein.",
            "stimme": "monoton, leise piepend",
            "lebenspunkte": "60",
            "kampfZustand": "vital",
            "lpBewusstlosAusgeblendet": False,
            "lpMassenschadenBewusstlos": False,
            "aufenthaltsort": "Gangway C-14",
            "presetId": "htbah-scifi",
            "handeln": [
                {"name": "Wartung & Reparatur", "value": 80},
                {"name": "Schwerelosigkeits-Manöver", "value": 65},
                {"name": "Drohnensteuerung", "value": 55},
            ],
            "wissen": [
                {"name": "Raumschifftechnik", "value": 90},
                {"name": "KI-Systeme", "value": 75},
                {"name": "Wahrnehmung", "value": 50},
            ],
            "soziales": [{"name": "Kulturelle Anpassung", "value": 40}],
            "fraktion": "",
            "glaube": "",
            "initiative": "6",
            "inventar": [],
            "notizenHtml": "<p>Optionale Hilfe bei klemmender Luke (Situation 1).</p>",
        },
        {
            "id": "xnl-npc-schaulustige",
            "name": "Die Schaulustigen",
            "spitzname": "",
            "geschlecht": "gemischt",
            "alter": "verschieden",
            "familienstand": "",
            "statur": "Bunte Mischung aus humanoiden und nichtmenschlichen Touristen",
            "gesinnung": "Neugierig, aufdringlich, harmlos",
            "beruf": "Reisende / Marktbesucher",
            "ziel": "Unterhaltung, seltene Selfies",
            "geheimnis": "Einer ist heimlich Holo-Blogger mit 50.000 Followern.",
            "stimme": "durcheinander, viele Sprachen",
            "lebenspunkte": "30",
            "kampfZustand": "vital",
            "lpBewusstlosAusgeblendet": False,
            "lpMassenschadenBewusstlos": False,
            "aufenthaltsort": "Hangarhalle, Hauptrasse",
            "presetId": "htbah-scifi",
            "handeln": [
                {"name": "Schwerelosigkeits-Manöver", "value": 35},
                {"name": "Schleichen", "value": 30},
            ],
            "wissen": [
                {"name": "Wahrnehmung", "value": 55},
                {"name": "Außerirdische Spezies deuten", "value": 40},
            ],
            "soziales": [
                {"name": "Begeistern", "value": 50},
                {"name": "Überzeugen", "value": 45},
                {"name": "Menschenkenntnis", "value": 42},
            ],
            "fraktion": "",
            "glaube": "",
            "initiative": "8",
            "inventar": [],
            "notizenHtml": (
                "<p>Blockieren den Weg in Situation 2. Erfolg in Soziales = freundlicher Durchgang.</p>"
            ),
        },
    ]

    gegenstaende = [
        {
            "id": "xnl-item-xenolidium",
            "name": "Xenolidium",
            "beschreibungHtml": (
                "<p>Leuchtend violetter Hyperantriebs-Kristall. "
                "Ein Kern reicht für einen Sprung in den nächsten Sektor. "
                "Extrem selten, extrem teuer.</p>"
            ),
        }
    ]

    interaktive_welt = {
        "mapLayouts": {
            KAMP_ID: {
                "ort:xnl-ort-schiff": {"x": -200, "y": 0},
                "ort:xnl-ort-hangar": {"x": 280, "y": 120},
                "npc:xnl-npc-korvex": {"x": -80, "y": 40},
                "npc:xnl-npc-schaulustige": {"x": 120, "y": 200},
                "npc:xnl-npc-lux": {"x": 420, "y": 80},
                "gegenstand:xnl-item-xenolidium": {"x": 400, "y": 160},
            }
        },
        "mapViewport": {KAMP_ID: {"x": 0, "y": 0, "scale": 1}},
    }

    daten = [
        ls_eintrag(
            f"ex:sl:teil:{KAMP_ID}",
            f"htbah_export_ls:spielleitung_teil:{KAMP_ID}",
            "Kampagne (Name & Labels)",
            spielleitung,
        ),
        ls_eintrag(
            f"ex:sl:ab:{KAMP_ID}",
            f"htbah_export_ls:sl_abenteuerbuch:{KAMP_ID}",
            "Abenteuerbuch",
            abenteuerbuch,
        ),
        ls_eintrag(
            f"ex:sl:atm:{KAMP_ID}",
            f"htbah_export_ls:sl_atmosphaere:{KAMP_ID}",
            "Wetter, Jahr- und Tageszeit",
            atmosphaere,
        ),
        ls_eintrag(
            f"ex:ztf:ort:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:orte",
            "Orte",
            ztf_kategorie("orte", orte),
        ),
        ls_eintrag(
            f"ex:ztf:npc:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:npcs",
            "NPCs",
            ztf_kategorie("npcs", npcs),
        ),
        ls_eintrag(
            f"ex:ztf:item:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:gegenstaende",
            "Gegenstände",
            ztf_kategorie("gegenstaende", gegenstaende),
        ),
        ls_eintrag(
            f"ex:ztf:fr:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:fraktionen",
            "Fraktionen",
            ztf_kategorie("fraktionen", []),
        ),
        ls_eintrag(
            f"ex:ztf:rae:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:raetsel",
            "Rätsel",
            ztf_kategorie("raetsel", []),
        ),
        ls_eintrag(
            f"ex:ztf:bes:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:bestien",
            "Bestien",
            ztf_kategorie("bestien", []),
        ),
        ls_eintrag(
            f"ex:ztf:pan:{KAMP_ID}",
            f"htbah_export_ls:ztf_kategorie:{KAMP_ID}:pantheon",
            "Pantheon",
            ztf_kategorie("pantheon", []),
        ),
        ls_eintrag(
            f"ex:wb:gal:{KAMP_ID}",
            f"htbah_export_ls:wb_bereich:{KAMP_ID}:galerie",
            "Galerie",
            wb_bereich("galerie", {"eintraege": []}),
        ),
        ls_eintrag(
            f"ex:wb:iw:{KAMP_ID}",
            f"htbah_export_ls:wb_bereich:{KAMP_ID}:interaktive_welt",
            "Interaktive Welt / Karten",
            wb_bereich("interaktive_welt", interaktive_welt),
        ),
        ls_eintrag(
            f"ex:wb:gen:{KAMP_ID}",
            f"htbah_export_ls:wb_bereich:{KAMP_ID}:generatoren",
            "Generatoren",
            wb_bereich("generatoren", {"generatorUrls": {}, "generatorAufrufe": {}}),
        ),
    ]

    return {
        "htbahExportVersion": 1,
        "typ": "lokaler-speicher",
        "exportiertAm": EXPORT_AM,
        "beispiel": {
            "titel": "Xenolidium-Notfall (Solo-Tutorial)",
            "untertitel": "Sci-Fi-One-Shot am Weltraumhandels-Hangar",
            "beschreibung": (
                "Solo-Tutorial in drei Situationen: klemmende Luke (Handeln/Wissen), "
                "schaulustige Aliens (Soziales — oder Handeln), Xenolidium-Kauf mit Folgen "
                "aus Szene 2. Ca. 45–60 Minuten."
            ),
            "autoren": "Florian Petruschke",
            "kontext": "Tutorial / Solo / Sci-Fi",
        },
        "daten": daten,
    }


def patch_gruppengroesse_2_4(pfad: Path) -> bool:
    with pfad.open(encoding="utf-8") as f:
        paket = json.load(f)
    geaendert = False
    for eintrag in paket.get("daten", []):
        key = eintrag.get("key", "")
        if "spielleitung_teil:" not in key:
            continue
        teil = json.loads(eintrag["wert"])
        labels = teil.get("kampagne", {}).get("labels", [])
        if any(l.get("id") == LABEL_2_4["id"] for l in labels):
            continue
        labels.append(dict(LABEL_2_4))
        teil["kampagne"]["labels"] = labels
        eintrag["wert"] = json.dumps(teil, ensure_ascii=False)
        geaendert = True
    if geaendert:
        with pfad.open("w", encoding="utf-8") as f:
            json.dump(paket, f, ensure_ascii=False, indent=2)
            f.write("\n")
    return geaendert


def main() -> None:
    ziel = KAMPAGNEN_DIR / "4-xenolidium-notfall.json"
    with ziel.open("w", encoding="utf-8") as f:
        json.dump(baue_kampagne(), f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Geschrieben: {ziel.relative_to(ROOT)}")

    for name in [
        "1-heldenpruefung-fuer-anfaenger.json",
        "2-schroeders-heisse-kastanien.json",
        "3-das-schwarze-wasser.json",
    ]:
        pfad = KAMPAGNEN_DIR / name
        if patch_gruppengroesse_2_4(pfad):
            print(f"Label 2-4 ergänzt: {name}")
        else:
            print(f"Label 2-4 bereits vorhanden: {name}")


if __name__ == "__main__":
    main()
