/**
 * Cheat-Sheet: gemeinsame Inhaltsdaten für PDF-Export und Regelwerk-Modal.
 */
window.HTBAH_SHARED = window.HTBAH_SHARED || {};

(function registerSpielleitungPdfCheatSheet() {
  const U = () => window.HTBAH_SHARED.PdfRenderUtils;

  const CHEAT_SHEET_META = Object.freeze({
    titel: 'Cheat-Sheet',
    einleitung:
      'Kurzreferenz nach dem How-to-be-a-Hero-Regelwerk — für die Spielleitung am Tisch.',
    fussnote: 'Quelle: How to be a Hero — Regelwerk (Hoschianer)',
  });

  const WAFFEN_TABELLE = Object.freeze({
    kopfzeilen: ['Waffe (Beispiel)', 'Schaden'],
    zeilen: [
      ['Improvisiert / waffenlos', '1W10'],
      ['Stock', '1W10 +5'],
      ['Messer / Dolch', '2W10'],
      ['Steinschleuder / Wurfwaffe', '3W10'],
      ['Axt / Streitkolben / Hammer / Schläger', '4W10'],
      ['Schwert / Machete', '5W10'],
      ['Bogen / Armbrust', '6W10'],
      ['Pistole', '7W10'],
      ['Gewehr', '8W10'],
      ['Schrotflinte (Entfernung beachten)', '9W10'],
      ['Bombe / Granate / Raketenwerfer', '10W10'],
    ],
    optionen: { colWidths: ['72%', '28%'], rechteSpalteRechts: true },
  });

  const BALANCING_TABELLE = Object.freeze({
    kopfzeilen: ['Rolle', 'Begabung H (ca.)', 'Kampf-Fähigkeit', 'LP'],
    zeilen: [
      ['Kleinvieh / Hinterhalt', '4–7', '10–20', '15–30'],
      ['Standardgegner', '8–12', '25–40', '35–55'],
      ['Elite / Leutnant', '12–18', '40–55', '55–75'],
      ['Boss / Endgegner', '18–30+', '55–80+', '80–100'],
    ],
  });

  function ladeCheatSheetKarten() {
    return [
      {
        titel: 'Fähigkeiten & Begabungen',
        pdfGrid2x2: true,
        inhaltHtml: `<p><strong>400 Fähigkeitspunkte</strong> auf Handeln, Wissen und Soziales verteilen (einzelne Fähigkeiten), z. B. Summe Handeln 127 → Begabung 13 (127 ÷ 10, kaufmännisch gerundet).</p>
<ul>
  <li><strong>Begabung</strong> = Summe der Fähigkeitspunkte in der Kategorie ÷ 10 (kaufmännisch gerundet)</li>
  <li><strong>Effektivwert</strong> = Fähigkeitsbasis + Begabung (max. 100)</li>
  <li>Ohne passende Fähigkeit: Probe auf den <strong>Begabungswert</strong> (kein kritischer Erfolg)</li>
</ul>`,
      },
      {
        titel: 'Geistesblitzpunkte',
        pdfGrid2x2: true,
        inhaltHtml: `<ul>
  <li><strong>Anzahl</strong> pro Kategorie = Begabungswert ÷ 10 (kaufmännisch gerundet), z. B. Begabung 15 → 2 Punkte</li>
  <li>Nur in <strong>derselben</strong> Begabung einsetzbar (Wissen ersetzt keine Handeln-Probe)</li>
  <li><strong>Wann:</strong> Erneuter Wurf nach verpatzter Probe, wenn der erste Wurf <em>kein</em> kritischer Misserfolg war</li>
  <li><strong>Aufladung:</strong> Voll zu Abenteuerbeginn; Regeneration am Abenteuerende. Mehrere Abende pro Abenteuer → bis zum nächsten Spielabend</li>
  <li>Ungenutzte Punkte verfallen — keine Übertragung ins nächste Abenteuer</li>
</ul>`,
      },
      {
        titel: 'Lebenspunkte & Status',
        pdfGrid2x2: true,
        inhaltHtml: `<ul>
  <li>Standard: <strong>100 LP</strong> (Charaktere)</li>
  <li><strong>Vital:</strong> LP &gt; 10, handlungs- und kampffähig</li>
  <li><strong>Bewusstlos:</strong> LP ≤ 10 <em>oder</em> ein Treffer mit mehr als 60 LP Verlust auf einmal — medizinische Hilfe nötig</li>
  <li><strong>Tot:</strong> LP = 0 (sofortiger Tod)</li>
</ul>`,
      },
      {
        titel: 'Was ist eine Probe?',
        pdfGrid2x2: true,
        inhaltHtml: `<p>Proben werden mit einem <strong>W100</strong> gewürfelt (Ziel = effektiver Fähigkeits- oder Begabungswert).</p>
<ul>
  <li><strong>Bestanden:</strong> Wurf ≤ Zielwert</li>
  <li><strong>Nicht bestanden:</strong> Wurf &gt; Zielwert</li>
</ul>
<p class="htbah-cheat-sheet-zwischenkopf">Kritische Würfe (nur Fähigkeitsproben):</p>
<ul>
  <li><strong>Kritischer Erfolg:</strong> Wurf im unteren 10&nbsp;% des Zielwerts (≤ ⌊Ziel × 0,1⌋)</li>
  <li><strong>Kritischer Misserfolg:</strong> Wurf von ⌈90 + Ziel × 0,1⌉ bis 100</li>
  <li>Dazwischen: bestanden als guter oder mittelmäßiger Wurf (untere/obere Hälfte der Erfolgszone)</li>
</ul>`,
      },
      {
        titel: 'Kampf — Ablauf',
        inhaltHtml: `<ol>
  <li><strong>Initiative:</strong> 1W10 + Begabung Handeln je Teilnehmer (Spielleitung: pro NPC oder gemeinsam)</li>
  <li><strong>Überraschungsrunde:</strong> Überraschte setzen Runde 1 aus (unabhängig von Initiative)</li>
  <li><strong>Kampfrunden:</strong> Reihenfolge absteigend Initiative — vor jedem Kampf neu würfeln
    <ol>
      <li><strong>Angriff:</strong> Probe auf passende Kampf-Fähigkeit — bei Erfolg Schaden</li>
      <li><strong>Parade</strong> (1× pro Runde): Probe auf Handeln; bei Erfolg kein Schaden. Kritische Angriffe nicht parierbar. Schusswaffen nicht parierbar. Parieren mit bloßen Fäusten: halber Schaden (gerundet)</li>
      <li><strong>Schaden:</strong> X×W10 laut Waffe; kritischer Treffer verdoppelt den Schaden</li>
    </ol>
  </li>
  <li><strong>Ende:</strong> Eine Seite ohne LP, Flucht außer Reichweite oder Kapitulation</li>
</ol>`,
      },
      {
        titel: 'Waffen — Schadensrichtwerte (Regelwerk)',
        tabelle: WAFFEN_TABELLE,
        inhaltHtml: `<p class="htbah-cheat-sheet-hinweis">Spielleitung kann Boni vergeben (Meisterwerk, Legende). Fernkampf: Parade i. d. R. nicht möglich.</p>`,
      },
      {
        titel: 'Rüstung & Schilde',
        inhaltHtml: `<p>Im Grundregelwerk keine feste Rüstungstabelle. Die Spielleitung kann bei Schilden, Rüstungen oder Deckung <strong>Parade-Boni/Mali</strong> auf Handeln oder Schadensreduktion festlegen — einheitlich in der Gruppe vereinbaren.</p>`,
      },
      {
        titel: 'Gegner balancieren (Richtwerte)',
        inhaltVorTabelle: '<p>Orientierung für NPCs und Bestien — an die Heldengruppe anpassen:</p>',
        tabelle: BALANCING_TABELLE,
        inhaltHtml:
          '<p class="htbah-cheat-sheet-hinweis">Initiative wie bei Charakteren (1W10 + Handeln). Waffenschaden aus Tabelle wählen. Mehrere schwache Gegner sind oft spannender als ein übermächtiger Einzelner.</p>',
      },
    ];
  }

  function baueTabelleHtml(kopfzeilen, zeilen, optionen, kontext) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const esc = U().escapeHtml;
    if (kontext === 'anzeige') {
      let html = '<table class="table table-sm table-bordered mb-2 htbah-cheat-sheet-tabelle"><thead><tr>';
      kopfzeilen.forEach((z, idx) => {
        const align = idx === kopfzeilen.length - 1 && opts.rechteSpalteRechts ? 'text-end' : '';
        html += `<th scope="col" class="${align}">${esc(z)}</th>`;
      });
      html += '</tr></thead><tbody>';
      zeilen.forEach((zeile) => {
        html += '<tr>';
        zeile.forEach((zelle, idx) => {
          const align = idx === zeile.length - 1 && opts.rechteSpalteRechts ? 'text-end text-nowrap' : '';
          html += `<td class="${align}">${esc(zelle)}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      return html;
    }
    const colgroup = opts.colWidths
      ? `<colgroup>${opts.colWidths.map((w) => `<col style="width:${w};" />`).join('')}</colgroup>`
      : '';
    let html = `<table style="width:100%;border-collapse:collapse;font-size:7px;line-height:1.35;margin:4px 0 0;table-layout:fixed;">${colgroup}`;
    if (kopfzeilen && kopfzeilen.length) {
      html += '<thead><tr>';
      kopfzeilen.forEach((z, idx) => {
        const align = idx === kopfzeilen.length - 1 && opts.rechteSpalteRechts ? 'right' : 'left';
        html += `<th style="text-align:${align};padding:3px 4px;border-bottom:1px solid #c4b59a;font-weight:800;">${esc(z)}</th>`;
      });
      html += '</tr></thead>';
    }
    html += '<tbody>';
    zeilen.forEach((zeile) => {
      html += '<tr>';
      zeile.forEach((zelle, idx) => {
        const align = idx === zeile.length - 1 && opts.rechteSpalteRechts ? 'right' : 'left';
        const nowrap = idx === zeile.length - 1 && opts.rechteSpalteRechts ? 'white-space:nowrap;' : '';
        html += `<td style="padding:2px 4px;border-bottom:1px solid #e8e0d0;vertical-align:top;text-align:${align};${nowrap}">${esc(zelle)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function baueKartenInhaltHtml(karte, kontext) {
    const teile = [];
    if (karte.inhaltVorTabelle) {
      teile.push(karte.inhaltVorTabelle);
    }
    if (karte.tabelle) {
      const t = karte.tabelle;
      teile.push(baueTabelleHtml(t.kopfzeilen, t.zeilen, t.optionen, kontext));
    }
    if (karte.inhaltHtml) {
      teile.push(karte.inhaltHtml);
    }
    return teile.join('');
  }

  function baueInfoCardHtml(titel, inhaltHtml, stil, kontext, cardOpts) {
    const s = stil || {};
    const opts = cardOpts && typeof cardOpts === 'object' ? cardOpts : {};
    const esc = U().escapeHtml;
    const kompakt = !!opts.kompakt;
    if (kontext === 'anzeige') {
      const bodyClass = kompakt ? 'py-2 px-2' : 'py-2 px-3';
      const titleClass = kompakt ? 'h6 card-title mb-1 small' : 'h6 card-title mb-2';
      const w100 = kompakt ? ' w-100' : '';
      return `<article class="htbah-cheat-sheet-karte card mb-0 h-100${w100}">
        <div class="card-body ${bodyClass}">
          <h3 class="${titleClass}">${esc(titel)}</h3>
          <div class="htbah-cheat-sheet-karte-inhalt small mb-0">${inhaltHtml}</div>
        </div>
      </article>`;
    }
    const pad = kompakt ? '4px 5px' : '8px 10px';
    const titelPx = kompakt ? 7 : 9;
    const textPx = kompakt ? 7 : 8;
    const margin = kompakt ? '0' : '0 0 8px';
    const breite = kompakt ? 'width:100%;' : '';
    return `<div class="htbah-sl-pdf-info-card" style="border:1px solid ${s.kartenRahmen || '#8b6f47'};border-radius:6px;padding:${pad};margin:${margin};background:#fff;break-inside:avoid;page-break-inside:avoid;height:100%;box-sizing:border-box;${breite}">
      <div style="font-size:${titelPx}px;font-weight:800;color:${s.kopfTitel || '#5b3b17'};margin:0 0 ${kompakt ? 3 : 5}px;text-transform:uppercase;letter-spacing:0.04em;line-height:1.2;">${esc(titel)}</div>
      <div style="font-size:${textPx}px;line-height:1.3;color:#222;">${inhaltHtml}</div>
    </div>`;
  }

  function baueCheatSheetGridZeileHtml(zeilenKarten, stil, zeilenOpts) {
    const s = stil || {};
    const opts = zeilenOpts && typeof zeilenOpts === 'object' ? zeilenOpts : {};
    const letzteZeile = !!opts.letzteZeile;
    const marginBottom = letzteZeile ? '6px' : '5px';
    return `<div class="htbah-sl-pdf-cheat-grid-zeile" style="display:flex;gap:5px;margin:0 0 ${marginBottom};align-items:stretch;">${zeilenKarten
      .map(
        (karte) =>
          `<div style="flex:1 1 0;min-width:0;display:flex;">${baueInfoCardHtml(
            karte.titel,
            baueKartenInhaltHtml(karte, 'pdf'),
            s,
            'pdf',
            { kompakt: true },
          )}</div>`,
      )
      .join('')}</div>`;
  }

  function baueCheatSheetKartenLayoutHtml(karten, stil, kontext) {
    const s = stil || {};
    const grid = karten.filter((k) => k.pdfGrid2x2);
    const rest = karten.filter((k) => !k.pdfGrid2x2);
    let html = '';
    if (grid.length) {
      const zeilen = [];
      for (let i = 0; i < grid.length; i += 2) {
        zeilen.push(grid.slice(i, i + 2));
      }
      if (kontext === 'anzeige') {
        html += `<div class="htbah-cheat-sheet-grid-2x2">${zeilen
          .map((zeilenKarten, index) => {
            const letzteZeile = index === zeilen.length - 1;
            return `<div class="row g-2 ${letzteZeile ? 'mb-2' : 'mb-2'} htbah-cheat-sheet-grid-zeile">${zeilenKarten
              .map(
                (karte) =>
                  `<div class="col-12 col-md-6 d-flex">${baueInfoCardHtml(
                    karte.titel,
                    baueKartenInhaltHtml(karte, kontext),
                    s,
                    kontext,
                    { kompakt: true },
                  )}</div>`,
              )
              .join('')}</div>`;
          })
          .join('')}</div>`;
      } else {
        html += `<div class="htbah-sl-pdf-cheat-grid" style="margin:0 0 0;">${zeilen
          .map((zeilenKarten, index) =>
            baueCheatSheetGridZeileHtml(zeilenKarten, s, {
              letzteZeile: index === zeilen.length - 1,
            }),
          )
          .join('')}</div>`;
      }
    }
    if (rest.length) {
      const restHtml = rest
        .map((karte) =>
          baueInfoCardHtml(karte.titel, baueKartenInhaltHtml(karte, kontext), s, kontext),
        )
        .join('');
      if (kontext === 'anzeige') {
        html += `<div class="htbah-cheat-sheet-karten-stapel">${restHtml}</div>`;
      } else {
        html += restHtml;
      }
    }
    return html;
  }

  function baueCheatSheetHtml(stil, optionen) {
    const opts = optionen && typeof optionen === 'object' ? optionen : {};
    const kontext = opts.kontext === 'anzeige' ? 'anzeige' : 'pdf';
    const s = stil || {};
    const meta = CHEAT_SHEET_META;
    const esc = U().escapeHtml;
    const karten = ladeCheatSheetKarten();
    const kartenHtml = baueCheatSheetKartenLayoutHtml(karten, s, kontext);

    if (kontext === 'anzeige') {
      return `<div class="htbah-cheat-sheet-anzeige">
        <header class="htbah-cheat-sheet-anzeige-kopf mb-3">
          <h2 class="h4 mb-2">${esc(meta.titel)}</h2>
          <p class="text-body-secondary small mb-0">${esc(meta.einleitung)}</p>
        </header>
        ${kartenHtml}
        <p class="text-body-secondary text-center small mt-3 mb-0">${esc(meta.fussnote)}</p>
      </div>`;
    }

    return `<div class="htbah-sl-pdf-cheat-sheet" style="padding:0 4px 6px;">
      <style>
        .htbah-sl-pdf-cheat-grid ul, .htbah-sl-pdf-cheat-grid ol,
        .htbah-sl-pdf-cheat-grid-zeile ul, .htbah-sl-pdf-cheat-grid-zeile ol { margin:0;padding-left:11px; }
        .htbah-sl-pdf-cheat-grid li, .htbah-sl-pdf-cheat-grid-zeile li { margin:0 0 1px; }
        .htbah-sl-pdf-cheat-grid p, .htbah-sl-pdf-cheat-grid-zeile p { margin:0 0 2px; }
        .htbah-sl-pdf-cheat-grid .htbah-cheat-sheet-zwischenkopf,
        .htbah-sl-pdf-cheat-grid-zeile .htbah-cheat-sheet-zwischenkopf { margin:2px 0 1px;font-size:7px;font-weight:700; }
      </style>
      <h2 style="font-size:14px;font-weight:800;margin:0 0 6px;color:${s.kopfTitel || '#5b3b17'};border-bottom:2px solid ${s.akzent || '#2f6a29'};padding-bottom:3px;">${esc(meta.titel)}</h2>
      <p style="font-size:7px;line-height:1.3;color:#444;margin:0 0 6px;">${esc(meta.einleitung)}</p>
      ${kartenHtml}
      <p style="font-size:6px;color:#888;margin:6px 0 0;text-align:center;">${esc(meta.fussnote)}</p>
    </div>`;
  }

  function baueCheatSheetAnzeigeHtml(stil) {
    return baueCheatSheetHtml(stil, { kontext: 'anzeige' });
  }

  function leseCheatSheetStil(optionen) {
    if (window.HTBAH && typeof window.HTBAH.leseCharakterPdfStilKonfiguration === 'function') {
      return window.HTBAH.leseCharakterPdfStilKonfiguration(optionen);
    }
    return {
      kopfTitel: '#5b3b17',
      akzent: '#2f6a29',
      kartenRahmen: '#8b6f47',
    };
  }

  function normalisiereSicherheitsmechanismen(roh) {
    const quelle = roh && typeof roh === 'object' ? roh : {};
    return {
      tabuHtml: typeof quelle.tabuHtml === 'string' ? quelle.tabuHtml : '',
      schleierHtml: typeof quelle.schleierHtml === 'string' ? quelle.schleierHtml : '',
    };
  }

  function htmlHatSichtbarenInhalt(html) {
    const text = String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return !!text;
  }

  function pdfLinienPlatzhalter(anzahl) {
    let html = '';
    for (let i = 0; i < anzahl; i += 1) {
      html +=
        '<div style="height:13px;border-bottom:1px solid #c8c8c8;box-sizing:border-box;margin:0 0 2px;"></div>';
    }
    return html;
  }

  function ladeKampagnenSicherheitsmechanismen(kampagne) {
    if (!kampagne || typeof kampagne !== 'object') {
      return normalisiereSicherheitsmechanismen(null);
    }
    const direkt = normalisiereSicherheitsmechanismen(kampagne.sicherheitsmechanismen);
    if (htmlHatSichtbarenInhalt(direkt.tabuHtml) || htmlHatSichtbarenInhalt(direkt.schleierHtml)) {
      return direkt;
    }
    const mitglieder = Array.isArray(kampagne.mitglieder) ? kampagne.mitglieder : [];
    for (let i = 0; i < mitglieder.length; i += 1) {
      const m = mitglieder[i];
      const char =
        m && m.charakter && typeof m.charakter === 'object' ? m.charakter : null;
      const ausChar = normalisiereSicherheitsmechanismen(
        char && char.sicherheitsmechanismen ? char.sicherheitsmechanismen : null,
      );
      if (htmlHatSichtbarenInhalt(ausChar.tabuHtml) || htmlHatSichtbarenInhalt(ausChar.schleierHtml)) {
        return ausChar;
      }
    }
    return direkt;
  }

  function baueSicherheitsfeldHtml(label, html, stil, leer) {
    const s = stil || {};
    const esc = U().escapeHtml;
    const inhalt = leer
      ? pdfLinienPlatzhalter(6)
      : htmlHatSichtbarenInhalt(html)
        ? html
        : '<p style="color:#666;margin:0;">Keine Einträge.</p>';
    return `<div style="border:1px solid ${s.kartenRahmen || '#8b6f47'};border-radius:4px;padding:6px 7px;background:#fff;margin:0 0 6px;">
      <div style="font-size:8px;font-weight:700;margin:0 0 4px;color:${s.akzent || '#2f6a29'};">${esc(label)}</div>
      <div class="htbah-pdf-html" style="font-size:7px;line-height:1.35;min-height:78px;">${inhalt}</div>
    </div>`;
  }

  function baueSicherheitsmechanismenPdfHtml(kampagne, stil) {
    const s = stil || {};
    const esc = U().escapeHtml;
    const sicher = ladeKampagnenSicherheitsmechanismen(kampagne);
    const tabuLeer = !htmlHatSichtbarenInhalt(sicher.tabuHtml);
    const schleierLeer = !htmlHatSichtbarenInhalt(sicher.schleierHtml);
    return `<div class="htbah-sl-pdf-sicherheitsmechanismen" style="padding:0 4px 6px;">
      <h2 style="font-size:14px;font-weight:800;margin:0 0 6px;color:${s.kopfTitel || '#5b3b17'};border-bottom:2px solid ${s.akzent || '#2f6a29'};padding-bottom:3px;">Sicherheitsmechanismen</h2>
      <p style="font-size:7px;line-height:1.35;color:#444;margin:0 0 6px;">Session Zero — Grenzen, Schleier und X-Karte. Leere Felder können handschriftlich ergänzt werden.</p>
      <div style="border:2px solid #b91c1c;border-radius:4px;padding:6px 7px;background:#fee2e2;margin:0 0 6px;">
        <div style="font-size:8px;font-weight:800;color:#7f1d1d;margin:0 0 2px;">X-Karte-Regel</div>
        <div style="font-size:7px;color:#7f1d1d;line-height:1.35;">Wird eine X-Karte gelegt, endet die Szene sofort oder wird umgeschnitten — ohne Diskussion, Nachfrage oder Rechtfertigungspflicht.</div>
      </div>
      ${baueSicherheitsfeldHtml('Diese Inhalte wollen wir nicht:', sicher.tabuHtml, s, tabuLeer)}
      ${baueSicherheitsfeldHtml('Diese Inhalte sollen verschleiert werden:', sicher.schleierHtml, s, schleierLeer)}
    </div>`;
  }

  window.HTBAH_SHARED.SpielleitungPdfCheatSheet = {
    CHEAT_SHEET_META,
    ladeCheatSheetKarten,
    baueCheatSheetHtml,
    baueCheatSheetAnzeigeHtml,
    leseCheatSheetStil,
    normalisiereSicherheitsmechanismen,
    ladeKampagnenSicherheitsmechanismen,
    baueSicherheitsmechanismenPdfHtml,
  };
})();
