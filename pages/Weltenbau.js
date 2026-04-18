window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

const WATABOU_URL = 'https://watabou.github.io/';

/** Rohdatei-Limit vor dem Laden (Browser- & Speicher-Schutz). */
const WELTENBAU_MAX_ROH_DATEI_BYTES = 40 * 1024 * 1024;

function istBildDatei(file) {
  if (!file) {
    return false;
  }
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  const n = (file.name || '').toLowerCase();
  return /\.(png|apng|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i.test(n);
}

function formatBytes(n) {
  if (n >= 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MiB`;
  }
  if (n >= 1024) {
    return `${Math.round(n / 1024)} KiB`;
  }
  return `${n} B`;
}

window.HTBAH_SEITEN.Weltenbau = {
  components: {
    WeltenbauBildImportModal: window.HTBAH_KOMPONENTEN.WeltenbauBildImportModal,
  },
  data() {
    return {
      watabouUrl: WATABOU_URL,
      zustand: window.HTBAH.ladeWeltenbauZustand(),
      statusMeldung: '',
      statusTyp: 'success',
      importWarteschlange: [],
    };
  },
  computed: {
    geschaetzteSpeicherGroesseKb() {
      try {
        let n = 0;
        for (const e of this.zustand.eintraege) {
          if (e && typeof e.dataUrl === 'string') {
            n += e.dataUrl.length;
          }
        }
        n += Math.max(0, (this.zustand.eintraege.length + 1) * 80);
        return Math.max(0, Math.round(n / 1024));
      } catch {
        return 0;
      }
    },
    statusAlertKlasse() {
      if (this.statusTyp === 'warning') {
        return 'alert-warning';
      }
      if (this.statusTyp === 'danger') {
        return 'alert-danger';
      }
      return 'alert-success';
    },
    maxRohDateiHuman() {
      return formatBytes(WELTENBAU_MAX_ROH_DATEI_BYTES);
    },
  },
  methods: {
    persist() {
      window.HTBAH.speichereWeltenbauZustand(this.zustand);
    },
    zeigeStatus(text, typ = 'success') {
      this.statusMeldung = text;
      this.statusTyp = typ;
      window.clearTimeout(this._statusTimer);
      this._statusTimer = window.setTimeout(() => {
        this.statusMeldung = '';
        this.statusTyp = 'success';
      }, 7200);
    },
    importNaechsteAusWarteschlange() {
      if (!this.importWarteschlange.length) {
        return;
      }
      const file = this.importWarteschlange.shift();
      window.setTimeout(() => {
        const m = this.$refs.weltenbauImportModal;
        if (m && typeof m.oeffnenMitDatei === 'function') {
          m.oeffnenMitDatei(file);
        }
      }, 450);
    },
    onWeltenbauBildImportFertig({ dataUrl, name }) {
      const vorher = this.zustand.eintraege.slice();
      const neu = {
        id: window.HTBAH.neueEntropieId(),
        name: typeof name === 'string' && name.trim() ? name.trim() : 'Bild',
        dataUrl,
        hinzugefuegtAm: new Date().toISOString(),
      };
      this.zustand = {
        version: 1,
        eintraege: [...this.zustand.eintraege, neu],
      };
      try {
        this.persist();
      } catch (err) {
        this.zustand = { version: 1, eintraege: vorher };
        this.importWarteschlange = [];
        if (err && err.name === 'QuotaExceededError') {
          this.zeigeStatus(
            'Browser-Speicher voll. Ältere Weltenbau-Bilder löschen oder in den Einstellungen Platz schaffen.',
            'danger',
          );
          return;
        }
        this.zeigeStatus('Speichern fehlgeschlagen.', 'danger');
        return;
      }
      this.zeigeStatus('Bild gespeichert (komprimiert).', 'success');
      this.importNaechsteAusWarteschlange();
    },
    onWeltenbauBildImportAbgebrochen() {
      this.importWarteschlange = [];
    },
    onWeltenbauDateiImportFehler() {
      window.setTimeout(() => this.importNaechsteAusWarteschlange(), 450);
    },
    onDateienGewaehlt(ev) {
      const input = ev.target;
      // FileList ist oft live: Zuerst kopieren, dann value leeren — sonst ist die Liste leer.
      const dateiListe = input && input.files ? Array.from(input.files) : [];
      if (input) {
        input.value = '';
      }
      if (!dateiListe.length) {
        return;
      }
      const bildDateien = dateiListe.filter(istBildDatei);
      if (!bildDateien.length) {
        this.zeigeStatus(
          'Keine Bilddateien erkannt. Erlaubt sind gängige Rasterformate (PNG, JPEG, WebP, GIF usw.) oder passende Dateiendung.',
          'warning',
        );
        return;
      }
      const max = WELTENBAU_MAX_ROH_DATEI_BYTES;
      const zuGross = bildDateien.filter((f) => f.size > max);
      const ok = bildDateien.filter((f) => f.size <= max);
      if (zuGross.length) {
        const namen = zuGross.map((f) => `"${f.name}" (${formatBytes(f.size)})`).join(', ');
        this.zeigeStatus(
          `Übersprungen (zu groß, max. ${formatBytes(max)} pro Datei): ${namen}.`,
          'warning',
        );
      }
      if (!ok.length) {
        return;
      }
      this.importWarteschlange = ok.slice();
      this.importNaechsteAusWarteschlange();
    },
    eintragUmbenennen(e) {
      if (!e) {
        return;
      }
      const neu = window.prompt('Bezeichnung:', e.name || '');
      if (neu === null) {
        return;
      }
      const t = neu.trim();
      if (!t) {
        return;
      }
      this.zustand = {
        ...this.zustand,
        eintraege: this.zustand.eintraege.map((x) => (x.id === e.id ? { ...x, name: t } : x)),
      };
      this.persist();
      this.zeigeStatus('Bezeichnung gespeichert.');
    },
    eintragLoeschen(e) {
      if (!e) {
        return;
      }
      if (!window.confirm('Dieses Bild aus dem Speicher entfernen?')) {
        return;
      }
      window.HTBAH.bildbetrachterSchliesseFuerWeltenbauEintrag(e.id);
      this.zustand = {
        ...this.zustand,
        eintraege: this.zustand.eintraege.filter((x) => x.id !== e.id),
      };
      this.persist();
      this.zeigeStatus('Bild entfernt.');
    },
    vorschauOeffnen(e) {
      window.HTBAH.bildbetrachterOeffnen({
        dataUrl: e.dataUrl,
        titel: e.name || 'Bild',
        weltenbauEintragId: e.id,
      });
    },
  },
  template: `
    <div class="container content py-3">
      <weltenbau-bild-import-modal
        ref="weltenbauImportModal"
        @fertig="onWeltenbauBildImportFertig"
        @abgebrochen="onWeltenbauBildImportAbgebrochen"
        @datei-import-fehler="onWeltenbauDateiImportFehler" />

      <h4 class="mb-1">Spielleitung · Weltenbau</h4>
      <p class="small text-body-secondary mb-3">
        Externe Generatoren (u. a. Karten, Gebäude, Dungeons) mit Export als PNG. Der JSON-Export der Generatoren
        wird hier nicht eingebunden — nur Bilder lassen sich sinnvoll in dieser Ansicht ablegen.
      </p>

      <div class="card p-3 mb-3">
        <h6 class="mb-2">Generatoren (extern)</h6>
        <p class="small text-body-secondary mb-2">
          Watabous Procgen-Sammlung öffnet in einem neuen Tab.
        </p>
        <a
          class="btn btn-outline-primary"
          :href="watabouUrl"
          target="_blank"
          rel="noopener noreferrer">
          Watabou (Procgen) öffnen
        </a>
      </div>

      <div class="card p-3 mb-3">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <h6 class="mb-0">Importierte Bilder</h6>
          <span class="badge text-bg-secondary" v-if="geschaetzteSpeicherGroesseKb">
            ca. {{ geschaetzteSpeicherGroesseKb }} KB (nur diese Seite)
          </span>
        </div>
        <p class="small text-body-secondary mb-3">
          Unterstützt: gängige Bildformate (PNG, JPEG, WebP, GIF, BMP, …). Rohdateien bis
          {{ maxRohDateiHuman }} — danach öffnet sich ein Zuschnitt mit Cropper;
          gespeichert wird maximal 2048 px Kantenlänge als JPEG/WebP (kleiner als die Rohdatei, geeignet für den Browser-Speicher).
          Gesamtkontingent: typisch etwa 5–10 MB pro Website im Browser — bei vollem Speicher erscheint eine Meldung.
          Bilder lassen sich in einem eigenen Fenster vergrößern, scrollen und per Ecke in der Größe ändern (auch mehrere gleichzeitig).
        </p>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <input
            ref="dateiInput"
            type="file"
            class="d-none"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg"
            multiple
            @change="onDateienGewaehlt" />
          <icon-text-button
            type="button"
            class="btn btn-primary"
            icon="add_photo_alternate"
            @click="$refs.dateiInput.click()">
            Bilder importieren
          </icon-text-button>
        </div>

        <p v-if="!zustand.eintraege.length" class="small text-body-secondary mb-0">
          Noch keine Bilder gespeichert.
        </p>
        <div v-else class="row g-2">
          <div
            v-for="e in zustand.eintraege"
            :key="e.id"
            class="col-6 col-md-4 col-lg-3">
            <div class="card h-100 shadow-sm htbah-weltenbau-karte">
              <button
                type="button"
                class="btn btn-link p-0 border-0 text-start w-100 htbah-weltenbau-thumb-wrap"
                @click="vorschauOeffnen(e)">
                <img
                  class="htbah-weltenbau-thumb"
                  :src="e.dataUrl"
                  :alt="e.name || 'Import'" />
              </button>
              <div class="card-body py-2 px-2">
                <div class="small text-truncate mb-1" :title="e.name">{{ e.name }}</div>
                <div class="d-flex flex-wrap gap-1">
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click.stop="eintragUmbenennen(e)">
                    Umbenennen
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click.stop="eintragLoeschen(e)">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <teleport to="body">
        <div
          v-if="statusMeldung"
          :class="['htbah-erfolgs-toast alert alert-dismissible py-2 mb-0 text-center shadow', statusAlertKlasse]"
          role="status">
          {{ statusMeldung }}
          <button
            type="button"
            class="btn-close"
            aria-label="Meldung schließen"
            @click="statusMeldung = ''"></button>
        </div>
      </teleport>
    </div>
  `,
};
