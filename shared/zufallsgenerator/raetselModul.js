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

  function artFuerFamilie(familie, epoche) {
    const k = epocheKey(epoche);
    const map = L.ART_FAMILIE && L.ART_FAMILIE[familie];
    if (map && map[k]) {
      return map[k];
    }
    return zufaelligListe(Ls('ARTIKEL', epoche));
  }

  function slTippFuerFamilie(familie) {
    const tipps = L.SL_TIPPS_FAMILIE && L.SL_TIPPS_FAMILIE[familie];
    if (Array.isArray(tipps) && tipps.length) {
      return U.zufaellig(tipps);
    }
    return U.zufaellig(L.SL_TIPPS_ALLGEMEIN || L.SL_TIPPS || []);
  }

  function ideeBasisFuerFamilie(familie) {
    const basis = L.IDEE_BASIS && L.IDEE_BASIS[familie];
    return typeof basis === 'string' ? basis.trim() : '';
  }

  /** SL-Hinweise unter einem Block „Idee“ — ohne Dubletten. */
  function ideeAbsatz(familie, zusaetzlichePunkte) {
    const punkte = [];
    const seen = new Set();

    function hinzufuegen(text) {
      const t = String(text || '').trim();
      if (!t) {
        return;
      }
      const key = t
        .toLowerCase()
        .replace(/[„“"']/g, '')
        .replace(/\s+/g, ' ');
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      punkte.push(t);
    }

    hinzufuegen(ideeBasisFuerFamilie(familie));
    if (Array.isArray(zusaetzlichePunkte)) {
      zusaetzlichePunkte.forEach(hinzufuegen);
    }
    hinzufuegen(slTippFuerFamilie(familie));

    if (!punkte.length) {
      return '';
    }
    if (punkte.length === 1) {
      return `<p><strong>Idee:</strong> ${U.htmlEsc(punkte[0])}</p>`;
    }
    return `<p><strong>Idee:</strong></p><ul class="mb-0 ps-3">${punkte
      .map((p) => `<li>${U.htmlEsc(p)}</li>`)
      .join('')}</ul>`;
  }

  function ergebnisText(epoche, orteNamen, npcNamen, familie) {
    const ortListe = bereinigteNamen(orteNamen);
    const npcListe = bereinigteNamen(npcNamen);

    const gewichte = [
      { wert: 'richtung', gewicht: 14 },
      { wert: 'tageszeit', gewicht: 10 },
      { wert: 'ort_eintrag', gewicht: ortListe.length ? 12 : 0 },
      { wert: 'ort_abstrakt', gewicht: 10 },
      { wert: 'person_eintrag', gewicht: npcListe.length ? 10 : 0 },
      { wert: 'person_abstrakt', gewicht: 8 },
      { wert: 'zahl', gewicht: familie === 'code' || familie === 'muster' ? 14 : 8 },
      { wert: 'symbol', gewicht: familie === 'code' || familie === 'muster' ? 16 : 8 },
    ];

    const typ = U.gewichtet(gewichte);

    if (typ === 'richtung') {
      const r = U.zufaellig(L.HIMMELSRICHTUNGEN);
      return `Die Lösung weist auf die Himmelsrichtung „${r}“ hin — wörtlich oder als Symbol (z. B. Pfeil, Windrose).`;
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
      return `Die Antwort bezieht sich auf „${n}“ (Name oder Rolle in der Szene).`;
    }
    if (typ === 'person_abstrakt') {
      const p = zufaelligListe(Ls('PERSON_ROLLE', epoche));
      return `Das Ergebnis beschreibt: ${p}.`;
    }
    if (typ === 'zahl') {
      const n = U.zufallsInt(2, 19);
      return `Die entscheidende Zahl ist ${n} (als Ziffer, Quersumme oder Anzahl von Betätigungen).`;
    }
    const sym = U.zufaellig(['ein Kreis', 'ein Dreieck', 'ein Quadrat', 'eine Spirale', 'ein Stern']);
    return `Das Lösungssymbol ist ${sym} — es kann später erneut in der Kampagne auftauchen.`;
  }

  function wortRaetselKern(epoche) {
    const woerter = Ls('WORT_RAETSEL_WORTE', epoche);
    const wort = woerter.length ? U.zufaellig(woerter) : 'RÄTSEL';
    const buchstaben = wort.split('');
    const perm = buchstaben.slice().sort(() => Math.random() - 0.5);
    const anagramm = perm.join(' · ');
    const kontext = zufaelligListe(Ls('WORT_RAETSEL_KONTEXT', epoche));
    const aufgabenstellung = `„Auf einer Tafel stehen lose Buchstaben: ${anagramm}. Ordnet sie zu einem Wort, das hier einen Sinn ergibt.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Aus den Buchstaben <em>${U.htmlEsc(anagramm)}</em> ein sinnvolles Wort bilden (Anagramm).</p>`,
      `<p><strong>Kontext:</strong> ${U.htmlEsc(kontext)}</p>`,
      `<p><strong>Lösung (nur SL):</strong> ${U.htmlEsc(wort)}</p>`,
    ].join('');
    return { html, aufgabenstellung, idee: [] };
  }

  function ratespielKern(epoche) {
    const ziel = zufaelligListe(Ls('RATEZIEL_SACHLICH', epoche));
    const hinweise = Ls('RATEZIEL_HINWEISE', epoche);
    const a = hinweise.length
      ? U.zufaellig(hinweise)
      : 'Es ist schwerer oder leichter, als es auf den ersten Blick wirkt.';
    const b = U.zufaellig([
      'Es hängt mit einem Versprechen oder Vertrag zusammen.',
      'Jemand hat es absichtlich sichtbar hinterlassen — aber nicht beschriftet.',
      'Es passt zu etwas, das in der Szene schon erwähnt wurde.',
      'Nur unter bestimmten Lichtverhältnissen fällt ein Detail auf.',
    ]);
    const aufgabenstellung = `„Ihr findet: ${ziel}. Was ist das — und was bedeutet es für euch? Ich gebe euch zwei Hinweise: (1) ${a} (2) ${b}.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Die Gruppe entdeckt <em>${U.htmlEsc(ziel)}</em>. Was ist es, wozu dient es, wer könnte es hinterlassen haben?</p>`,
      `<p><strong>Hinweis 1:</strong> ${U.htmlEsc(a)}</p>`,
      `<p><strong>Hinweis 2:</strong> ${U.htmlEsc(b)}</p>`,
    ].join('');
    return { html, aufgabenstellung, idee: [] };
  }

  function schlossKern(epoche) {
    const k = epocheKey(epoche);
    const varianten = Ls('SCHLOSS_VARIANTEN', epoche);
    const variant = varianten.length
      ? U.zufaellig(varianten)
      : k === 'mittelalter'
        ? 'Ein Schlüssel passt nicht — aber drei Markierungen am Türstock deuten auf eine verborgene Öffnung.'
        : k === 'gegenwart'
          ? 'Ein Zahlenschloss verlangt eine PIN; Hinweise liegen auf Zetteln im Raum verteilt.'
          : 'Ein Chip muss in mehreren Lesegeräten nacheinander gelesen werden — die Reihenfolge ist verschlüsselt.';
    const aufgabenstellung = `„Der Zugang ist gesperrt. ${variant} Findet einen Weg hinein — ein Fehlversuch soll spürbar sein, muss aber nicht sofort tödlich enden.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Tür, Truhe oder Schrank öffnen, ohne Alarm oder Fluch auszulösen.</p>`,
      `<p>${U.htmlEsc(variant)}</p>`,
    ].join('');
    return { html, aufgabenstellung, idee: [] };
  }

  function mechanikLichtKern(epoche) {
    const szene = zufaelligListe(Ls('MECHANIK_SZENE', epoche));
    const aufgabenstellung = `„${szene} Beschreibt, wie ihr vorgeht — ich sage euch, was sich jeweils verändert.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> ${U.htmlEsc(szene)}</p>`,
    ].join('');
    return { html, aufgabenstellung, idee: [] };
  }

  function codefolgeKern(epoche) {
    const sym = ['◯', '△', '□', '◇', '✦'];
    const n = U.zufallsInt(3, 4);
    const symbole = [];
    for (let i = 0; i < n; i += 1) {
      symbole.push(U.zufaellig(sym));
    }
    const anzeige = symbole.join('   ');
    const regel = U.zufaellig(Ls('CODEFOLGE_REGELN', epoche));
    const aufgabenstellung = `„An der Wand sind Symbole eingraviert: ${anzeige}. Am Boden (oder an Hebeln) findet ihr dieselben Zeichen noch einmal — aber in anderer Anordnung. Welche Reihenfolge ist richtig?“`;
    const html = [
      `<p><strong>Aufgabe:</strong> Die Symbole <em>${U.htmlEsc(anzeige)}</em> erscheinen an der Wand. Hebel, Druckplatten oder Leuchtfelder im Raum tragen dieselben Zeichen — die Gruppe muss die richtige Betätigungsreihenfolge finden.</p>`,
      `<p><strong>Regel (nur SL):</strong> ${U.htmlEsc(regel)}</p>`,
      `<p><strong>Lösung (Vorschlag):</strong> Reihenfolge gemäß Regel — z. B. ${U.htmlEsc(
        symbole.slice().reverse().join(' → '),
      )} wenn „rückwärts lesen“ gemeint ist.</p>`,
    ].join('');
    return { html, aufgabenstellung, idee: [] };
  }

  function musterKern(epoche) {
    const beispiel = zufaelligListe(Ls('MUSTER_BEISPIELE', epoche));
    const aufgabenstellung = `„${beispiel} Probiert in Ruhe — oder ich setze optional Zeitdruck.“`;
    const html = [
      `<p><strong>Aufgabe:</strong> ${U.htmlEsc(beispiel)}</p>`,
    ].join('');
    return { html, aufgabenstellung, idee: [] };
  }

  window.HTBAH.ZufallsgeneratorRaetselModul = {
    schwierigkeitOptionen() {
      return L.SCHWIERIGKEIT.slice();
    },
    familieOptionen() {
      return [
        { wert: 'wort', label: 'Worträtsel', icon: '🔤' },
        { wert: 'rate', label: 'Ratespiel', icon: '❓' },
        { wert: 'schloss', label: 'Schloss / Zugang', icon: '🔐' },
        { wert: 'mechanik', label: 'Mechanik / Licht', icon: '⚙️' },
        { wert: 'code', label: 'Symbolfolge', icon: '🔣' },
        { wert: 'muster', label: 'Muster / Reihenfolge', icon: '🔁' },
      ];
    },
    /**
     * @param {{ epoche?: string, familie?: string, schwierigkeit?: string, orteNamen?: string[], npcNamen?: string[] }} opts
     */
    generiere(opts) {
      opts = opts || {};
      const epoche = opts.epoche || E.MITTELALTER;

      const familieVorgabe = typeof opts.familie === 'string' ? opts.familie.trim() : '';
      const familie = familieVorgabe
        ? familieVorgabe
        : U.gewichtet([
            { wert: 'wort', gewicht: 12 },
            { wert: 'rate', gewicht: 12 },
            { wert: 'schloss', gewicht: 10 },
            { wert: 'mechanik', gewicht: 14 },
            { wert: 'code', gewicht: 12 },
            { wert: 'muster', gewicht: 10 },
          ]);

      const art = artFuerFamilie(familie, epoche);
      const titel = zufaelligListe(Ls('TITEL_HOOK', epoche));
      const schwierigkeitVorgabe =
        opts.schwierigkeit && L.SCHWIERIGKEIT.includes(opts.schwierigkeit)
          ? opts.schwierigkeit
          : '';
      const schwierigkeit = schwierigkeitVorgabe || U.zufaellig(L.SCHWIERIGKEIT);
      const ergebnis = ergebnisText(epoche, opts.orteNamen, opts.npcNamen, familie);

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
        kern = codefolgeKern(epoche);
      } else {
        kern = musterKern(epoche);
      }

      const { html: kernHtml, aufgabenstellung, idee } = kern;

      const atmoListe = L.ATMOSPHAERE && L.ATMOSPHAERE[epocheKey(epoche)];
      const atmosphaere = Array.isArray(atmoListe) && atmoListe.length ? U.zufaellig(atmoListe) : '';
      const ideeHtml = ideeAbsatz(familie, idee);
      const notizenHtml = [
        atmosphaere ? `<p>${U.htmlEsc(atmosphaere)}</p>` : '',
        kernHtml,
        ideeHtml,
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
