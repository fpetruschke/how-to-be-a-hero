window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function registerTokensEffekteEditorModal() {
  const EXPORT_API = window.HTBAH_SHARED && window.HTBAH_SHARED.TokensEffekteExport;
  const SPIEL = window.HTBAH_SHARED && window.HTBAH_SHARED.SpielmattenExport;
  const DIN_OPTIONEN = SPIEL && Array.isArray(SPIEL.DIN_OPTIONEN) ? SPIEL.DIN_OPTIONEN : ['A4'];

  function downloadBlob(blobUrl, dateiname) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = dateiname || 'tokens';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.HTBAH_KOMPONENTEN.TokensEffekteEditorModal = {
    name: 'TokensEffekteEditorModal',
    components: {
      CharakterPdfModal: window.HTBAH_KOMPONENTEN.CharakterPdfModal,
      EffektRahmenVerwaltung: window.HTBAH_KOMPONENTEN.EffektRahmenVerwaltung,
    },
    emits: ['schliessen'],
    data() {
      return {
        offen: false,
        laedt: false,
        statusText: '',
        kampagneId: '',
        entitaeten: [],
        selectedEntityIds: [],
        format: 'A4',
        ausrichtung: 'portrait',
        tokenGroesseMm: 25,
        seitenRandMm: 8,
        abstandMm: 2,
        defaultShape: 'kreis',
        borderColor: '#000000',
        borderWidthPx: 8,
        showName: true,
        includeEffects: true,
        showEffectNames: true,
        nameFontSizePx: 0,
        kategorieShapes: {},
        entityShapes: {},
        entityBorders: {},
        entityShowNames: {},
        entityCounts: {},
        effectCounts: {},
        entityBorderExpanded: {},
        effectFrames: [],
        pdfBlobUrl: '',
        pdfDateiname: '',
        pdfVorschauOffen: false,
        effektRahmenSichtbar: false,
        entitaetenGruppenOffen: {},
      };
    },
    computed: {
      dinOptionen() {
        return DIN_OPTIONEN;
      },
      gruppierteEntitaeten() {
        const map = new Map();
        this.entitaeten.forEach((e) => {
          const key = e.kategorieKey || e.entityTyp;
          if (!map.has(key)) {
            map.set(key, {
              key,
              label: e.kategorieLabel || key,
              entitaeten: [],
            });
          }
          map.get(key).entitaeten.push(e);
        });
        return [...map.values()];
      },
      alleAusgewaehlt() {
        return this.entitaeten.length > 0 && this.selectedEntityIds.length === this.entitaeten.length;
      },
      kannExportieren() {
        return !this.laedt && this.gesamtExportItemAnzahl > 0;
      },
      gesamtTokenAnzahl() {
        const selected = new Set(this.selectedEntityIds);
        return this.entitaeten.reduce((sum, e) => {
          if (!selected.has(e.id)) {
            return sum;
          }
          const count = this.entityCounts[e.id];
          const n = Number.isFinite(Number(count)) ? Math.round(Number(count)) : 1;
          return sum + Math.min(99, Math.max(0, n));
        }, 0);
      },
      gesamtEffektAnzahl() {
        if (!this.includeEffects) {
          return 0;
        }
        return this.effectFrames.reduce((sum, r) => {
          if (!r || !r.id) {
            return sum;
          }
          const count = this.effectCounts[r.id];
          const n = Number.isFinite(Number(count)) ? Math.round(Number(count)) : this.standardEffektStueckzahl;
          return sum + Math.min(99, Math.max(0, n));
        }, 0);
      },
      gesamtExportItemAnzahl() {
        return this.gesamtTokenAnzahl + this.gesamtEffektAnzahl;
      },
      standardEffektStueckzahl() {
        const relevant = new Set(['charaktere', 'npcs', 'bestien']);
        const selected = new Set(this.selectedEntityIds);
        return this.entitaeten.filter((e) => selected.has(e.id) && relevant.has(e.kategorieKey)).length;
      },
      exportZusammenfassung() {
        const tokenAnzahl = this.gesamtTokenAnzahl;
        const effektAnzahl = this.gesamtEffektAnzahl;
        return `${tokenAnzahl} Token${tokenAnzahl === 1 ? '' : 's'}${effektAnzahl ? ` + ${effektAnzahl} Effekt-Rahmen` : ''}`;
      },
    },
    beforeUnmount() {
      this.revokePdfBlobUrl();
      if (this._effektRahmenHandler) {
        window.removeEventListener('htbah:effekt-rahmen-geaendert', this._effektRahmenHandler);
      }
    },
    methods: {
      oeffne(kampagneId) {
        this.kampagneId = typeof kampagneId === 'string' ? kampagneId.trim() : '';
        this.ladeKonfiguration();
        this.offen = true;
        this.statusText = '';
        this.pdfVorschauOffen = false;
        this.revokePdfBlobUrl();
        if (!this._effektRahmenHandler) {
          this._effektRahmenHandler = () => this.ladeEffektRahmen();
          window.addEventListener('htbah:effekt-rahmen-geaendert', this._effektRahmenHandler);
        }
      },
      schliessen() {
        this.speichereTokenExportPrefs();
        this.pdfVorschauOffen = false;
        this.revokePdfBlobUrl();
        this.offen = false;
        this.statusText = '';
        this.$emit('schliessen');
      },
      ladeKonfiguration() {
        const prefs =
          window.HTBAH && typeof window.HTBAH.ladeTokenExportEinstellungen === 'function'
            ? window.HTBAH.ladeTokenExportEinstellungen()
            : {};
        this.format = prefs.format || 'A4';
        this.ausrichtung = prefs.ausrichtung || 'portrait';
        this.tokenGroesseMm = prefs.tokenGroesseMm != null ? prefs.tokenGroesseMm : 25;
        this.seitenRandMm = prefs.seitenRandMm != null ? prefs.seitenRandMm : 8;
        this.abstandMm = prefs.abstandMm != null ? prefs.abstandMm : 2;
        this.defaultShape = prefs.defaultShape || 'kreis';
        this.borderColor = prefs.borderColor || '#000000';
        this.borderWidthPx = prefs.borderWidthPx != null ? prefs.borderWidthPx : 8;
        this.showName = prefs.showName !== false;
        this.includeEffects = prefs.includeEffects !== false;
        this.showEffectNames = prefs.showEffectNames !== false;
        this.nameFontSizePx = prefs.nameFontSizePx != null ? prefs.nameFontSizePx : 0;
        this.kategorieShapes = { ...(prefs.kategorieShapes || {}) };
        this.entityShapes = { ...(prefs.entityShapes || {}) };
        this.entityBorders = { ...(prefs.entityBorders || {}) };
        this.entityShowNames = { ...(prefs.entityShowNames || {}) };
        this.entityCounts = { ...(prefs.entityCounts || {}) };
        this.effectCounts = { ...(prefs.effectCounts || {}) };
        this.entitaeten =
          EXPORT_API && typeof EXPORT_API.sammleExportEntitaeten === 'function'
            ? EXPORT_API.sammleExportEntitaeten(this.kampagneId)
            : [];
        this.selectedEntityIds = this.entitaeten.map((e) => e.id);
        this.initialisiereEntityCounts();
        this.initialisiereEntitaetenGruppenOffen();
        this.ladeEffektRahmen();
        this.initialisiereEffectCounts();
      },
      initialisiereEntityCounts() {
        const counts = { ...this.entityCounts };
        this.entitaeten.forEach((e) => {
          if (counts[e.id] === undefined) {
            counts[e.id] = 1;
          }
        });
        this.entityCounts = counts;
      },
      initialisiereEffectCounts() {
        const def = this.standardEffektStueckzahl;
        const counts = { ...this.effectCounts };
        this.effectFrames.forEach((r) => {
          if (!r || !r.id) {
            return;
          }
          if (counts[r.id] === undefined) {
            counts[r.id] = def;
          }
        });
        this.effectCounts = counts;
      },
      initialisiereEntitaetenGruppenOffen() {
        const offen = {};
        this.entitaeten.forEach((e) => {
          const key = e.kategorieKey || e.entityTyp;
          offen[key] = false;
        });
        this.entitaetenGruppenOffen = offen;
      },
      ladeEffektRahmen() {
        const konfig =
          window.HTBAH && typeof window.HTBAH.ladeEffektRahmenEinstellungen === 'function'
            ? window.HTBAH.ladeEffektRahmenEinstellungen()
            : { rahmen: [] };
        this.effectFrames = Array.isArray(konfig.rahmen) ? konfig.rahmen.map((r) => ({ ...r })) : [];
        this.initialisiereEffectCounts();
      },
      speichereTokenExportPrefs() {
        if (!window.HTBAH || typeof window.HTBAH.setzeTokenExportEinstellungen !== 'function') {
          return;
        }
        window.HTBAH.setzeTokenExportEinstellungen({
          format: this.format,
          ausrichtung: this.ausrichtung,
          tokenGroesseMm: this.tokenGroesseMm,
          seitenRandMm: this.seitenRandMm,
          abstandMm: this.abstandMm,
          defaultShape: this.defaultShape,
          borderColor: this.borderColor,
          borderWidthPx: this.borderWidthPx,
          showName: this.showName,
          includeEffects: this.includeEffects,
          showEffectNames: this.showEffectNames,
          nameFontSizePx: this.nameFontSizePx,
          kategorieShapes: { ...this.kategorieShapes },
          entityShapes: { ...this.entityShapes },
          entityBorders: { ...this.entityBorders },
          entityShowNames: { ...this.entityShowNames },
          entityCounts: { ...this.entityCounts },
          effectCounts: { ...this.effectCounts },
        });
      },
      aktuelleExportEinstellungen() {
        return {
          kampagneId: this.kampagneId,
          entitaeten: this.entitaeten,
          selectedEntityIds: [...this.selectedEntityIds],
          format: this.format,
          ausrichtung: this.ausrichtung,
          tokenGroesseMm: this.tokenGroesseMm,
          seitenRandMm: this.seitenRandMm,
          abstandMm: this.abstandMm,
          defaultShape: this.defaultShape,
          borderColor: this.borderColor,
          borderWidthPx: this.borderWidthPx,
          showName: this.showName,
          includeEffects: this.includeEffects,
          showEffectNames: this.showEffectNames,
          nameFontSizePx: this.nameFontSizePx,
          kategorieShapes: { ...this.kategorieShapes },
          entityShapes: { ...this.entityShapes },
          entityBorders: { ...this.entityBorders },
          entityShowNames: { ...this.entityShowNames },
          entityCounts: { ...this.entityCounts },
          effectCounts: { ...this.effectCounts },
          effectFrames: this.effectFrames.map((r) => ({ ...r })),
        };
      },
      alleAuswaehlenToggle() {
        if (this.alleAusgewaehlt) {
          this.selectedEntityIds = [];
        } else {
          this.selectedEntityIds = this.entitaeten.map((e) => e.id);
        }
        this.verwerfePdfVorschau();
      },
      gruppeAuswaehlenToggle(gruppe) {
        const ids = gruppe.entitaeten.map((e) => e.id);
        const alleGruppe = ids.every((id) => this.selectedEntityIds.includes(id));
        if (alleGruppe) {
          const set = new Set(ids);
          this.selectedEntityIds = this.selectedEntityIds.filter((id) => !set.has(id));
        } else {
          const merged = new Set([...this.selectedEntityIds, ...ids]);
          this.selectedEntityIds = [...merged];
        }
        this.verwerfePdfVorschau();
      },
      gruppeIstVollAusgewaehlt(gruppe) {
        return gruppe.entitaeten.length > 0 && gruppe.entitaeten.every((e) => this.selectedEntityIds.includes(e.id));
      },
      gruppeAuswahlAnzahl(gruppe) {
        return gruppe.entitaeten.filter((e) => this.selectedEntityIds.includes(e.id)).length;
      },
      gruppeIstOffen(key) {
        return this.entitaetenGruppenOffen[key] === true;
      },
      gruppeToggle(key) {
        this.entitaetenGruppenOffen = {
          ...this.entitaetenGruppenOffen,
          [key]: !this.gruppeIstOffen(key),
        };
      },
      entitaetToggle(id) {
        if (this.selectedEntityIds.includes(id)) {
          this.selectedEntityIds = this.selectedEntityIds.filter((x) => x !== id);
        } else {
          this.selectedEntityIds = [...this.selectedEntityIds, id];
        }
        this.verwerfePdfVorschau();
      },
      setzeKategorieShape(key, shape) {
        if (shape) {
          this.kategorieShapes = { ...this.kategorieShapes, [key]: shape };
        } else {
          const next = { ...this.kategorieShapes };
          delete next[key];
          this.kategorieShapes = next;
        }
        this.verwerfePdfVorschau();
      },
      setzeEntityShape(id, shape) {
        if (shape) {
          this.entityShapes = { ...this.entityShapes, [id]: shape };
        } else {
          const next = { ...this.entityShapes };
          delete next[id];
          this.entityShapes = next;
        }
        this.verwerfePdfVorschau();
      },
      effektiveEntityShape(entitaet) {
        if (this.entityShapes[entitaet.id]) {
          return this.entityShapes[entitaet.id];
        }
        if (this.kategorieShapes[entitaet.kategorieKey]) {
          return this.kategorieShapes[entitaet.kategorieKey];
        }
        return this.defaultShape;
      },
      entityBorderModus(id) {
        const cfg = this.entityBorders[id];
        if (cfg === false) {
          return 'off';
        }
        if (cfg && typeof cfg === 'object') {
          return 'custom';
        }
        return 'default';
      },
      setzeEntityBorderModus(id, modus) {
        const next = { ...this.entityBorders };
        if (modus === 'off') {
          next[id] = false;
        } else if (modus === 'custom') {
          next[id] = {
            color: next[id] && typeof next[id] === 'object' && next[id].color ? next[id].color : this.borderColor,
            widthPx:
              next[id] && typeof next[id] === 'object' && next[id].widthPx != null
                ? next[id].widthPx
                : this.borderWidthPx,
          };
          this.entityBorderExpanded = { ...this.entityBorderExpanded, [id]: true };
        } else {
          delete next[id];
        }
        this.entityBorders = next;
        this.verwerfePdfVorschau();
      },
      setzeEntityBorderCustom(id, field, value) {
        const current =
          this.entityBorders[id] && typeof this.entityBorders[id] === 'object'
            ? { ...this.entityBorders[id] }
            : { color: this.borderColor, widthPx: this.borderWidthPx };
        if (field === 'color') {
          current.color = value;
        } else if (field === 'widthPx') {
          current.widthPx = value;
        }
        this.entityBorders = { ...this.entityBorders, [id]: current };
        this.verwerfePdfVorschau();
      },
      entityNameModus(id) {
        if (this.entityShowNames[id] === true) {
          return 'on';
        }
        if (this.entityShowNames[id] === false) {
          return 'off';
        }
        return 'default';
      },
      setzeEntityNameModus(id, modus) {
        const next = { ...this.entityShowNames };
        if (modus === 'on') {
          next[id] = true;
        } else if (modus === 'off') {
          next[id] = false;
        } else {
          delete next[id];
        }
        this.entityShowNames = next;
        this.verwerfePdfVorschau();
      },
      setzeEntityCount(id, value) {
        const n = Number(value);
        this.entityCounts = {
          ...this.entityCounts,
          [id]: Number.isFinite(n) ? Math.min(99, Math.max(0, Math.round(n))) : 1,
        };
        this.verwerfePdfVorschau();
      },
      setzeEffectCount(id, value) {
        const n = Number(value);
        this.effectCounts = {
          ...this.effectCounts,
          [id]: Number.isFinite(n) ? Math.min(99, Math.max(0, Math.round(n))) : this.standardEffektStueckzahl,
        };
        this.verwerfePdfVorschau();
      },
      setzeAlleEffektCountsAufStandard() {
        const def = this.standardEffektStueckzahl;
        const counts = { ...this.effectCounts };
        this.effectFrames.forEach((r) => {
          if (r && r.id) {
            counts[r.id] = def;
          }
        });
        this.effectCounts = counts;
        this.verwerfePdfVorschau();
      },
      revokePdfBlobUrl() {
        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
          this.pdfBlobUrl = '';
        }
      },
      verwerfePdfVorschau() {
        if (!this.pdfBlobUrl) {
          return;
        }
        this.revokePdfBlobUrl();
        this.pdfDateiname = '';
      },
      onEffektRahmenGeaendert(rahmen) {
        this.effectFrames = Array.isArray(rahmen) ? rahmen.map((r) => ({ ...r })) : [];
        this.initialisiereEffectCounts();
        this.verwerfePdfVorschau();
      },
      async pngExportieren() {
        if (!EXPORT_API || typeof EXPORT_API.erzeugeTokensPng !== 'function' || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = '';
        try {
          this.speichereTokenExportPrefs();
          const { blob, dateiname } = await EXPORT_API.erzeugeTokensPng(this.aktuelleExportEinstellungen());
          const url = URL.createObjectURL(blob);
          downloadBlob(url, dateiname);
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          this.statusText = 'PNG exportiert.';
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'PNG-Export fehlgeschlagen.';
        } finally {
          this.laedt = false;
        }
      },
      async pdfExportieren() {
        if (!EXPORT_API || typeof EXPORT_API.erzeugeTokensPdf !== 'function' || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = '';
        try {
          this.speichereTokenExportPrefs();
          const { blob, dateiname } = await EXPORT_API.erzeugeTokensPdf(this.aktuelleExportEinstellungen());
          const url = URL.createObjectURL(blob);
          downloadBlob(url, dateiname);
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          this.statusText = 'PDF exportiert.';
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'PDF-Export fehlgeschlagen.';
        } finally {
          this.laedt = false;
        }
      },
      async pdfVorschauOeffnen() {
        if (!EXPORT_API || typeof EXPORT_API.erzeugeTokensPdf !== 'function' || !this.kannExportieren) {
          return;
        }
        this.laedt = true;
        this.statusText = '';
        try {
          this.speichereTokenExportPrefs();
          const { blob, dateiname } = await EXPORT_API.erzeugeTokensPdf(this.aktuelleExportEinstellungen());
          const url = URL.createObjectURL(blob);
          this.revokePdfBlobUrl();
          this.pdfBlobUrl = url;
          this.pdfDateiname = dateiname;
          this.pdfVorschauOffen = true;
          this.statusText = 'PDF-Vorschau geöffnet.';
        } catch (error) {
          this.statusText = error && error.message ? error.message : 'PDF-Vorschau fehlgeschlagen.';
        } finally {
          this.laedt = false;
        }
      },
      pdfVorschauSchliessen() {
        this.pdfVorschauOffen = false;
      },
      pdfHerunterladen() {
        if (!this.pdfBlobUrl) {
          return;
        }
        downloadBlob(this.pdfBlobUrl, this.pdfDateiname || 'tokens.pdf');
      },
    },
    template: `
      <div v-if="offen" class="regelwerk-modal-layer htbah-sl-pdf-export-modal-layer">
        <div
          class="regelwerk-modal-window card shadow-lg htbah-sl-pdf-export-modal-window htbah-tokens-effekte-modal-window"
          role="dialog"
          aria-modal="true"
          aria-label="Tokens und Effekte">
          <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2 border-bottom">
            <h6 class="mb-0 d-flex align-items-center gap-2">
              <span aria-hidden="true">🎯</span>
              <span>Tokens &amp; Effekte</span>
            </h6>
            <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
          </div>
          <div class="card-body pt-2 pb-1 overflow-auto">
            <div class="d-flex flex-column gap-3">
              <div class="card p-0 htbah-tokens-effekte-sektion shadow-sm">
                <div class="card-header py-2">
                  <h6 class="mb-0 small fw-semibold">Seite</h6>
                </div>
                <div class="card-body py-2">
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Format</label>
                      <select v-model="format" class="form-select form-select-sm" @change="verwerfePdfVorschau">
                        <option v-for="opt in dinOptionen" :key="opt" :value="opt">DIN {{ opt }}</option>
                      </select>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1 d-block">Ausrichtung</label>
                      <div class="btn-group btn-group-sm w-100" role="group" aria-label="Ausrichtung">
                        <input id="tokens-ausrichtung-hoch" v-model="ausrichtung" class="btn-check" type="radio" value="portrait" @change="verwerfePdfVorschau" />
                        <label class="btn btn-outline-secondary" for="tokens-ausrichtung-hoch">Hoch</label>
                        <input id="tokens-ausrichtung-quer" v-model="ausrichtung" class="btn-check" type="radio" value="landscape" @change="verwerfePdfVorschau" />
                        <label class="btn btn-outline-secondary" for="tokens-ausrichtung-quer">Quer</label>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Seitenrand</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="seitenRandMm" class="form-control" type="number" min="0" max="40" step="1" @input="verwerfePdfVorschau" />
                        <span class="input-group-text">mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card p-0 htbah-tokens-effekte-sektion shadow-sm">
                <div class="card-header py-2">
                  <h6 class="mb-0 small fw-semibold">Token</h6>
                </div>
                <div class="card-body py-2">
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Größe</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="tokenGroesseMm" class="form-control" type="number" min="10" max="80" step="1" @input="verwerfePdfVorschau" />
                        <span class="input-group-text">mm</span>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Abstand</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="abstandMm" class="form-control" type="number" min="0" max="20" step="1" @input="verwerfePdfVorschau" />
                        <span class="input-group-text">mm</span>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1 d-block">Form</label>
                      <div class="btn-group btn-group-sm w-100" role="group">
                        <input id="tokens-shape-kreis" v-model="defaultShape" class="btn-check" type="radio" value="kreis" @change="verwerfePdfVorschau" />
                        <label class="btn btn-outline-secondary" for="tokens-shape-kreis">Kreis</label>
                        <input id="tokens-shape-quadrat" v-model="defaultShape" class="btn-check" type="radio" value="quadrat" @change="verwerfePdfVorschau" />
                        <label class="btn btn-outline-secondary" for="tokens-shape-quadrat">Quadrat</label>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Rahmenfarbe</label>
                      <input v-model="borderColor" class="form-control form-control-color form-control-sm" type="color" @input="verwerfePdfVorschau" />
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1">Rahmenbreite</label>
                      <div class="input-group input-group-sm">
                        <input v-model.number="borderWidthPx" class="form-control" type="number" min="0" max="24" step="1" @input="verwerfePdfVorschau" />
                        <span class="input-group-text">px</span>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small mb-1" for="tokens-name-font-size">Schriftgröße</label>
                      <div class="input-group input-group-sm">
                        <input
                          id="tokens-name-font-size"
                          v-model.number="nameFontSizePx"
                          class="form-control"
                          type="number"
                          min="0"
                          max="64"
                          step="1"
                          @input="verwerfePdfVorschau" />
                        <span class="input-group-text">px</span>
                      </div>
                      <div class="form-text">0 = automatisch (~12 % der Token-Breite). Sonst Schriftgröße in Export-Pixeln.</div>
                    </div>
                    <div class="col-12">
                      <div class="form-check form-switch mb-0">
                        <input id="tokens-show-name" v-model="showName" class="form-check-input" type="checkbox" @change="verwerfePdfVorschau" />
                        <label class="form-check-label small" for="tokens-show-name">Namen auf Token anzeigen</label>
                      </div>
                    </div>
                  </div>

                  <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                      <h6 class="small text-body-secondary mb-0">Entitäten-Auswahl</h6>
                      <button type="button" class="btn btn-outline-secondary btn-sm" @click="alleAuswaehlenToggle">
                        {{ alleAusgewaehlt ? 'Keine auswählen' : 'Alle auswählen' }}
                      </button>
                    </div>
                    <p v-if="!entitaeten.length" class="small text-body-secondary mb-0">
                      Keine Entitäten in Zufallstabellen oder Charakter-Gruppe gefunden.
                    </p>
                    <div v-for="gruppe in gruppierteEntitaeten" :key="gruppe.key" class="htbah-tokens-entitaeten-gruppe mb-2">
                      <div class="htbah-tokens-entitaeten-gruppe-kopf d-flex flex-wrap align-items-center gap-2">
                        <button
                          type="button"
                          class="btn btn-link btn-sm p-0 text-decoration-none flex-shrink-0"
                          :aria-label="gruppeIstVollAusgewaehlt(gruppe) ? 'Gruppe abwählen' : 'Gruppe auswählen'"
                          @click.stop="gruppeAuswaehlenToggle(gruppe)">
                          {{ gruppeIstVollAusgewaehlt(gruppe) ? '☑' : '☐' }}
                        </button>
                        <button
                          type="button"
                          class="btn btn-link btn-sm p-0 text-decoration-none d-flex align-items-center gap-1 flex-grow-1 min-w-0 text-start text-body"
                          :aria-expanded="gruppeIstOffen(gruppe.key) ? 'true' : 'false'"
                          @click="gruppeToggle(gruppe.key)">
                          <span class="material-symbols-outlined htbah-tokens-gruppe-collapse-ico flex-shrink-0" aria-hidden="true">
                            {{ gruppeIstOffen(gruppe.key) ? 'expand_less' : 'expand_more' }}
                          </span>
                          <span class="fw-semibold small text-truncate">{{ gruppe.label }}</span>
                          <span class="badge rounded-pill text-bg-secondary flex-shrink-0">{{ gruppe.entitaeten.length }}</span>
                          <span
                            v-if="!gruppeIstVollAusgewaehlt(gruppe)"
                            class="small text-body-secondary flex-shrink-0">
                            ({{ gruppeAuswahlAnzahl(gruppe) }}/{{ gruppe.entitaeten.length }})
                          </span>
                        </button>
                        <select
                          class="form-select form-select-sm flex-shrink-0"
                          style="width: auto; min-width: 7rem"
                          :value="kategorieShapes[gruppe.key] || ''"
                          @click.stop
                          @change="setzeKategorieShape(gruppe.key, $event.target.value || null)">
                          <option value="">Form: Standard</option>
                          <option value="kreis">Kreis</option>
                          <option value="quadrat">Quadrat</option>
                        </select>
                      </div>
                      <div v-show="gruppeIstOffen(gruppe.key)" class="htbah-tokens-entitaeten-liste">
                        <div
                          v-for="entitaet in gruppe.entitaeten"
                          :key="entitaet.id"
                          class="htbah-tokens-entitaet-zeile small py-1 px-2 rounded">
                          <div class="d-flex align-items-center gap-2 flex-wrap">
                            <input
                              type="checkbox"
                              class="form-check-input m-0 flex-shrink-0"
                              :checked="selectedEntityIds.includes(entitaet.id)"
                              @change="entitaetToggle(entitaet.id)" />
                            <span class="text-truncate flex-grow-1 min-w-0" :title="entitaet.name || entitaet.id">
                              {{ entitaet.art === 'bild' ? '🖼️' : (entitaet.emoji || '📌') }}
                              {{ entitaet.name || 'Ohne Name' }}
                            </span>
                            <div class="input-group input-group-sm flex-shrink-0 htbah-tokens-count-input">
                              <span class="input-group-text">×</span>
                              <input
                                type="number"
                                class="form-control"
                                min="0"
                                max="99"
                                :value="entityCounts[entitaet.id] != null ? entityCounts[entitaet.id] : 1"
                                :disabled="!selectedEntityIds.includes(entitaet.id)"
                                title="Anzahl"
                                @input="setzeEntityCount(entitaet.id, $event.target.value)" />
                            </div>
                            <select
                              class="form-select form-select-sm flex-shrink-0"
                              style="width: 6.5rem"
                              :value="entityShapes[entitaet.id] || ''"
                              @change="setzeEntityShape(entitaet.id, $event.target.value || null)">
                              <option value="">Std.</option>
                              <option value="kreis">○</option>
                              <option value="quadrat">□</option>
                            </select>
                            <select
                              class="form-select form-select-sm flex-shrink-0"
                              style="width: 6.5rem"
                              :value="entityBorderModus(entitaet.id)"
                              title="Rahmen"
                              @change="setzeEntityBorderModus(entitaet.id, $event.target.value)">
                              <option value="default">Rahmen: Std.</option>
                              <option value="off">Rahmen: Aus</option>
                              <option value="custom">Rahmen: Eigene</option>
                            </select>
                            <select
                              class="form-select form-select-sm flex-shrink-0"
                              style="width: 6rem"
                              :value="entityNameModus(entitaet.id)"
                              title="Name"
                              @change="setzeEntityNameModus(entitaet.id, $event.target.value)">
                              <option value="default">Name: Std.</option>
                              <option value="on">Name: An</option>
                              <option value="off">Name: Aus</option>
                            </select>
                          </div>
                          <div
                            v-if="entityBorderModus(entitaet.id) === 'custom'"
                            class="d-flex flex-wrap align-items-center gap-2 mt-1 ps-4">
                            <input
                              type="color"
                              class="form-control form-control-color form-control-sm"
                              :value="(entityBorders[entitaet.id] && entityBorders[entitaet.id].color) || borderColor"
                              title="Rahmenfarbe"
                              @input="setzeEntityBorderCustom(entitaet.id, 'color', $event.target.value)" />
                            <div class="input-group input-group-sm" style="width: 7rem">
                              <input
                                type="number"
                                class="form-control"
                                min="0"
                                max="24"
                                :value="(entityBorders[entitaet.id] && entityBorders[entitaet.id].widthPx != null) ? entityBorders[entitaet.id].widthPx : borderWidthPx"
                                @input="setzeEntityBorderCustom(entitaet.id, 'widthPx', $event.target.value)" />
                              <span class="input-group-text">px</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card p-0 htbah-tokens-effekte-sektion shadow-sm">
                <div class="card-header py-2">
                  <h6 class="mb-0 small fw-semibold">Effekte</h6>
                </div>
                <div class="card-body py-2">
                  <div class="form-check form-switch mb-2">
                    <input id="tokens-include-effects" v-model="includeEffects" class="form-check-input" type="checkbox" @change="verwerfePdfVorschau" />
                    <label class="form-check-label small" for="tokens-include-effects">Effekt-Rahmen generieren</label>
                  </div>
                  <template v-if="includeEffects">
                    <div class="form-check form-switch mb-2">
                      <input id="tokens-show-effect-names" v-model="showEffectNames" class="form-check-input" type="checkbox" @change="verwerfePdfVorschau" />
                      <label class="form-check-label small" for="tokens-show-effect-names">Namen auf Effekt-Rahmen anzeigen</label>
                    </div>
                    <div v-if="effectFrames.length" class="mb-2">
                      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                        <span class="small text-body-secondary">Stückzahl pro Effekt-Rahmen</span>
                        <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" @click="setzeAlleEffektCountsAufStandard">
                          Standard ({{ standardEffektStueckzahl }})
                        </button>
                      </div>
                      <div
                        v-for="rahmen in effectFrames"
                        :key="'effekt-count-' + rahmen.id"
                        class="d-flex align-items-center gap-2 small py-1">
                        <span class="text-truncate flex-grow-1" :title="rahmen.label || rahmen.id">{{ rahmen.label || rahmen.id }}</span>
                        <div class="input-group input-group-sm flex-shrink-0 htbah-tokens-count-input">
                          <span class="input-group-text">×</span>
                          <input
                            type="number"
                            class="form-control"
                            min="0"
                            max="99"
                            :value="effectCounts[rahmen.id] != null ? effectCounts[rahmen.id] : standardEffektStueckzahl"
                            @input="setzeEffectCount(rahmen.id, $event.target.value)" />
                        </div>
                      </div>
                    </div>
                    <div class="pt-2 border-top border-secondary border-opacity-25">
                      <button
                        type="button"
                        class="btn btn-link btn-sm p-0 text-decoration-none"
                        @click="effektRahmenSichtbar = !effektRahmenSichtbar">
                        {{ effektRahmenSichtbar ? '▼' : '▶' }} Effekt-/Status-Rahmen bearbeiten
                      </button>
                      <div v-show="effektRahmenSichtbar" class="mt-2">
                        <effekt-rahmen-verwaltung kompakt @geaendert="onEffektRahmenGeaendert" />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <p v-if="statusText" class="small mb-0 mt-2" :class="statusText.includes('fehl') ? 'text-danger' : 'text-success'">
              {{ statusText }}
            </p>
            <p class="small text-body-secondary mb-0 mt-1">{{ exportZusammenfassung }}</p>
          </div>
          <div class="card-footer d-flex flex-wrap gap-2 justify-content-between align-items-center htbah-tokens-effekte-footer">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="schliessen">Schließen</button>
            <div class="d-flex flex-wrap gap-2 htbah-tokens-effekte-footer-actions">
              <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="!kannExportieren || laedt" @click="pngExportieren">
                PNG exportieren
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm" :disabled="!kannExportieren || laedt" @click="pdfVorschauOeffnen">
                PDF-Vorschau
              </button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="!kannExportieren || laedt" @click="pdfExportieren">
                PDF exportieren
              </button>
            </div>
          </div>
        </div>
        <charakter-pdf-modal
          :offen="pdfVorschauOffen"
          :pdf-url="pdfBlobUrl"
          :dateiname="pdfDateiname"
          titel="Tokens &amp; Effekte"
          @schliessen="pdfVorschauSchliessen" />
      </div>
    `,
  };
})();
