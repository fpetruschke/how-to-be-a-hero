/**
 * Rätsel-Zufallsgenerator (epochenabhängige Stimmung, viele Puzzle-Familien).
 */
window.HTBAH = window.HTBAH || {};

(function () {
  const U = window.HTBAH.ZufallsgeneratorUtil;
  const L = window.HTBAH.ZufallsgeneratorRaetselListen;
  const E = U.EPOCHE;

  function epocheKey(epoche) {
    if (epoche === E.GEGENWART) {
      return 'gegenwart';
    }
    if (epoche === E.ZUKUNFT) {
      return 'zukunft';
    }
    return 'mittelalter';
  }

  function Ls(key, epoche) {
    const tab = L[key];
    if (!tab) {
      return [];
    }
    const k = epocheKey(epoche);
    return tab[k] || tab.mittelalter || [];
  }

  function zufaelligListe(arr) {
    return arr.length ? U.zufaellig(arr) : '';
  }

  function bereinigteNamen(arr) {
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr.map((s) => String(s || '').trim()).filter(Boolean);
  }

  function ergebnisText(epoche, orteNamen, npcNamen) {
    const ortListe = bereinigteNamen(orteNamen);
    const npcListe = bereinigteNamen(npcNamen);
    const typ = U.gewichtet([
      { wert: 'richtung', gewicht: 14 },
      { wert: 'tageszeit', gewicht: 10 },
      { wert: 'ort_eintrag', gewicht: ortListe.length ? 12 : 0 },
      { wert: 'ort_abstrakt', gewicht: 10 },
      { wert: 'person_eintrag', gewicht: npcListe.length ? 10 : 0 },
      { wert: 'person_abstrakt', gewicht: 8 },
      { wert: 'zahl', gewicht: 8 },
      { wert: 'symbol', gewicht: 8 },
    ]);

    if (typ === 'richtung') {
      const r = U.zufaellig(L.HIMMELSRICHTUNGEN);
      return `Die Lösung weist klar auf die Himmelsrichtung „${r}“ hin (wörtlich oder symbolisch).`;
    }
    if (typ === 'tageszeit') {
      const t = U.zufaellig(L.TAGESZEITEN);
      return `Das Rätsel offenbart eine Tageszeit: ${t}.`;
    }
    if (typ === 'ort_eintrag') {
      const o = U.zufaellig(ortListe);
      return `Der Hinweis zielt auf den Ort „${o}“.`;
    }
    if (typ === 'ort_abstrakt') {
      const o = zufaelligListe(Ls('ORTE_ABSTRAKT', epoche));
      return `Die Spur führt zu: ${o}.`;
    }
    if (typ === 'person_eintrag') {
      const n = U.zufaellig(npcListe);
      return `Die Antwort bezieht sich auf die Person „${n}“ (Name oder Rolle).`;
    }
    if (typ === 'person_abstrakt') {
      const p = zufaelligListe(Ls('PERSON_ROLLE', epoche));
      return `Das Ergebnis beschreibt: ${p}.`;
    }
    if (typ === 'zahl') {
      const n = U.zufallsInt(2, 19);
      return `Die entscheidende Zahl ist ${n} (Ziffernfolge, Umdrehen oder Quersumme möglich).`;
    }
    const sym = U.zufaellig(['ein Kreis', 'ein Dreieck', 'eine Spirale', 'ein Stern', 'zwei parallele Linien']);
    return `Das Symbol der Lösung ist ${sym} — es kann später erneut auftauchen.`;
  }

  function wortRaetselKern(epoche) {
    const woerter = Ls('WORT_RAETSEL_WORTE', epoche);
    const wort = woerter.length ? U.zufaellig(woerter) : 'RÄTSEL';
    const buchstaben = wort.split('');
    const perm = buchstaben.slice().sort(() => Math.random() - 0.5);
    const anagramm = perm.join(' · ');
    const aufgabenstellung = `„Vor euch liegt eine Inschrift aus losen Buchstaben: ${anagramm}. Ordnet sie so, dass ein Wort entsteht, das hier Sinn ergibt.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Aus den Buchstaben soll ein sinnvolles Wort gebildet werden: <em>${U.htmlEsc(
        anagramm,
      )}</em> (Buchstaben dürfen neu angeordnet werden).</p>`,
      `<p><strong>Hinweis für die Gruppe:</strong> Es hat mit dem Ort oder dem Thema der Szene zu tun.</p>`,
      `<p><strong>Lösung (nur SL):</strong> ${U.htmlEsc(wort)}</p>`,
    ].join('');
    return { html, aufgabenstellung };
  }

  function ratespielKern(epoche) {
    const ziel = zufaelligListe(Ls('RATEZIEL_SACHLICH', epoche));
    const a = U.zufaellig([
      'Es riecht nach Metall und Regen.',
      'Es ist kleiner als eine Schuhsohle, aber schwerer als es aussieht.',
      'Nur eine Person im Raum hat es schon einmal gesehen — aber sie erinnert sich nicht wann.',
      'Es wurde absichtlich „vergessen“, aber nicht versteckt.',
    ]);
    const b = U.zufaellig([
      'Es hängt mit einem Versprechen zusammen.',
      'Es wurde von jemandem mit linkshändiger Schrift beschriftet.',
      'Es passt zu einem Lied, das in der Schenke gesungen wurde.',
    ]);
    const aufgabenstellung = `„Ihr entdeckt Folgendes: ${ziel}. Was fällt euch dazu ein? Ich gebe euch zwei weitere Eindrücke: (1) ${a} (2) ${b} — Was macht das mit euch?“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Die Helden finden <em>${U.htmlEsc(ziel)}</em>. Was ist es — oder was bedeutet es?</p>`,
      `<p><strong>Clue 1:</strong> ${U.htmlEsc(a)}</p>`,
      `<p><strong>Clue 2:</strong> ${U.htmlEsc(b)}</p>`,
    ].join('');
    return { html, aufgabenstellung };
  }

  function schlossKern(epoche) {
    const k = epocheKey(epoche);
    const variant =
      k === 'mittelalter'
        ? 'Ein eiserner Ring mit drei Kerben muss in der richtigen Tiefe gesteckt werden; daneben liegt ein falscher Schlüssel, der eine Falle scharf macht.'
        : k === 'gegenwart'
          ? 'Ein elektronisches Schloss akzeptiert nur die richtige PIN — Teile der Ziffern stehen auf Post-its, Visitenkarten und einem Kalenderblatt im Raum.'
          : 'Ein Schlüsselchip muss in drei Lesegeräte nacheinander — die Reihenfolge steht in einem Störsignal als Rhythmus.';
    const aufgabenstellung = `„Die Tür (oder der Behälter) weigert sich. ${variant} Findet einen Weg hinein — aber Vorsicht: ein Fehlversuch hat Folgen.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Zugang verschaffen, ohne Alarm oder Fluch auszulösen.</p>`,
      `<p>${U.htmlEsc(variant)}</p>`,
      `<p><strong>Spielleitung:</strong> Misserfolg = Lärm, Rufschaden, oder Zeitverlust — kein sofortiger Tod nötig.</p>`,
    ].join('');
    return { html, aufgabenstellung };
  }

  function mechanikLichtKern(epoche) {
    const szene = zufaelligListe(Ls('MECHANIK_SZENE', epoche));
    const aufgabenstellung = `„${szene} Was tut ihr? Beschreibt genau, wie ihr vorgeht — ich sage euch, was sich verändert.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> ${U.htmlEsc(szene)}</p>`,
      `<p><strong>Spielleitung:</strong> Jede falsche Drehung kann ein kleines Geräusch auslösen (Patrouille rollt würfeln). Bei Erfolg: ein Klick, ein Lichtfleck, ein sich öffnender Spalt.</p>`,
    ].join('');
    return { html, aufgabenstellung };
  }

  function codefolgeKern() {
    const sym = ['◯', '△', '□', '◇', '✦'];
    const n = U.zufallsInt(3, 5);
    const folge = [];
    for (let i = 0; i < n; i += 1) {
      folge.push(U.zufaellig(sym));
    }
    const folgeStr = folge.join(' → ');
    const falsch = U.zufaellig([
      'Eine der Inschriften ist absichtlich ein „Roter Hering“.',
      'Zwei Symbole sehen fast gleich aus — nur die Spitze unterscheidet sich.',
    ]);
    const aufgabenstellung = `„An der Wand leuchtet (oder ist eingraviert): ${folgeStr}. Ihr habt dieselben Symbole als Druckfelder oder Hebel. Was tut ihr?“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Die richtige Symbolfolge eingeben: die Wand zeigt <em>${U.htmlEsc(
        folgeStr,
      )}</em> — aber in welcher Reihenfolge müssen sie <strong>betätigt</strong> werden?</p>`,
      `<p><strong>Knackpunkt:</strong> ${U.htmlEsc(falsch)}</p>`,
      `<p><strong>Lösung (Vorschlag):</strong> Reihenfolge wie angezeigt <em>rückwärts</em> oder nach Größe der eingravierten Punkte sortieren.</p>`,
    ].join('');
    return { html, aufgabenstellung };
  }

  function musterKern(epoche) {
    const k = epocheKey(epoche);
    const beispiel =
      k === 'mittelalter'
        ? 'Glocken schlagen in der Reihenfolge tief — mittel — hoch — tief. Welche Glocke darf als Letzte?'
        : k === 'gegenwart'
          ? 'Drei Lichtschalter: jeder verändert den Zustand der anderen. Start: alle AUS. Ziel: nur die Mitte AN.'
          : 'Drei Energieknoten müssen gleichzeitig den gleichen „Phasenwinkel“ haben — die Konsole zeigt nur Relativwerte.';
    const aufgabenstellung = `„${beispiel} Ihr könnt in Ruhe kombinieren — oder ich starte eine Uhr. Was macht ihr als Erstes?“`;
    const html = [
      `<p><strong>Aufgabe:</strong> ${U.htmlEsc(beispiel)}</p>`,
      `<p><strong>Spielleitung:</strong> Notiere dir eine gültige Endkonfiguration; Spieler dürfen probieren, zähle Versuche oder setze eine Belastungs-Uhr.</p>`,
    ].join('');
    return { html, aufgabenstellung };
  }

  window.HTBAH.ZufallsgeneratorRaetselModul = {
    /**
     * @param {{ epoche?: string, orteNamen?: string[], npcNamen?: string[] }} opts
     */
    generiere(opts) {
      opts = opts || {};
      const epoche = opts.epoche || E.MITTELALTER;
      const orteNamen = opts.orteNamen;
      const npcNamen = opts.npcNamen;

      const art = zufaelligListe(Ls('ARTIKEL', epoche));
      const titel = zufaelligListe(Ls('TITEL_HOOK', epoche));
      const schwierigkeit = U.zufaellig(L.SCHWIERIGKEIT);
      const ergebnis = ergebnisText(epoche, orteNamen, npcNamen);

      const familie = U.gewichtet([
        { wert: 'wort', gewicht: 12 },
        { wert: 'rate', gewicht: 12 },
        { wert: 'schloss', gewicht: 10 },
        { wert: 'mechanik', gewicht: 14 },
        { wert: 'code', gewicht: 12 },
        { wert: 'muster', gewicht: 10 },
      ]);

      let kern;
      if (familie === 'wort') {
        kern = wortRaetselKern(epoche);
      } else if (familie === 'rate') {
        kern = ratespielKern(epoche);
      } else if (familie === 'schloss') {
        kern = schlossKern(epoche);
      } else if (familie === 'mechanik') {
        kern = mechanikLichtKern(epoche);
      } else if (familie === 'code') {
        kern = codefolgeKern();
      } else {
        kern = musterKern(epoche);
      }

      const { html: kernHtml, aufgabenstellung } = kern;

      const slTipp = U.zufaellig(L.SL_TIPPS);
      const notizenHtml = [
        `<p><strong>Schwierigkeit:</strong> ${U.htmlEsc(schwierigkeit)}</p>`,
        kernHtml,
        `<p><strong>Ergebnis bei gelöstem Rätsel (Vorschlag):</strong> ${U.htmlEsc(ergebnis)}</p>`,
        `<p><strong>Tipp für die Spielleitung:</strong> ${U.htmlEsc(slTipp)}</p>`,
      ].join('');

      return {
        art,
        titel,
        aufgabenstellung,
        ergebnis,
        schwierigkeit,
        notizenHtml,
      };
    },
  };
})();
