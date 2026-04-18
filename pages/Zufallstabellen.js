window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function htbahTextVorschau(html, maxLen) {
  const grenze = typeof maxLen === 'number' ? maxLen : 72;
  const div = document.createElement('div');
  div.innerHTML = typeof html === 'string' ? html : '';
  const t = (div.textContent || '').replace(/\s+/g, ' ').trim();
  if (!t) {
    return '—';
  }
  return t.length > grenze ? `${t.slice(0, grenze)}…` : t;
}

window.HTBAH_SEITEN.Zufallstabellen = {
  data() {
    return {
      zustand: window.HTBAH.ladeZufallstabellenZustand(),
      bearbeitung: null,
      bearbeitungIndex: -1,
      zeileQuillInstanz: null,
      /** DOM-Knoten des Quill-Hosts (Funktions-Ref feuert bei jedem Re-Render erneut) */
      zeileQuillHostElement: null,
      zeileQuillSession: 0,
      zeileModalInstanz: null,
      zuLoeschendeZeile: null,
      zufallGegenstandEpoche: 'mittelalter',
      zufallGegenstandKleidung: true,
      /** Stabile Funktion für :ref (wie InventarModal), kein String-ref im Modal */
      zeileQuillHostRefFn: null,
    };
  },
  created() {
    this.zeileQuillHostRefFn = (el) => {
      this.zeileQuillHostRef(el);
    };
  },
  computed: {
    zeileModalTitel() {
      if (!this.bearbeitung) {
        return '';
      }
      const neu = this.bearbeitungIndex < 0 ? 'Neu: ' : '';
      if (this.bearbeitung.typ === 'npc') {
        return `${neu}NPC`;
      }
      if (this.bearbeitung.typ === 'ort') {
        return `${neu}Ort`;
      }
      return `${neu}Gegenstand`;
    },
    zufallsgeneratorBereit() {
      return !!(window.HTBAH && window.HTBAH.Zufallsgenerator);
    },
  },
  methods: {
    persist() {
      window.HTBAH.speichereZufallstabellenZustand(this.zustand);
    },
    textVorschau(html) {
      return htbahTextVorschau(html);
    },
    npcLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        spitzname: '',
        geschlecht: '',
        alter: '',
        familienstand: '',
        statur: '',
        gesinnung: '',
        beruf: '',
        ziel: '',
        notizenHtml: '',
      };
    },
    ortLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        groesse: '',
        lage: '',
        zustand: '',
        notizenHtml: '',
      };
    },
    gegenstandLeer() {
      return {
        id: window.HTBAH.neueEntropieId(),
        name: '',
        beschreibungHtml: '',
      };
    },
    zeileQuillOrphanToolbarsInModalBodyEntfernen() {
      const modal = this.$refs.zeileModalElement;
      if (!modal) {
        return;
      }
      const body = modal.querySelector('.modal-body');
      if (!body) {
        return;
      }
      /* Quill hängt .ql-toolbar als Geschwister vor den Host — ohne Wrapper bleiben sie bei v-if/key von Vue liegen */
      body.querySelectorAll(':scope > .ql-toolbar.ql-snow').forEach((node) => {
        node.remove();
      });
    },
    zeileModalOeffnen(typ, zeile, index) {
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = null;
      this.zeileQuillSession += 1;
      this.bearbeitung = {
        typ,
        zeile: JSON.parse(JSON.stringify(zeile)),
      };
      this.bearbeitungIndex = index;
      this.$nextTick(() => {
        this.zeileQuillOrphanToolbarsInModalBodyEntfernen();
        const el = this.$refs.zeileModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        this.zeileModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.zeileModalInstanz.show();
      });
    },
    npcHinzufuegen() {
      this.zeileModalOeffnen('npc', this.npcLeer(), -1);
    },
    npcBearbeiten(row, index) {
      this.zeileModalOeffnen('npc', row, index);
    },
    ortHinzufuegen() {
      this.zeileModalOeffnen('ort', this.ortLeer(), -1);
    },
    ortBearbeiten(row, index) {
      this.zeileModalOeffnen('ort', row, index);
    },
    gegenstandHinzufuegen() {
      this.zeileModalOeffnen('gegenstand', this.gegenstandLeer(), -1);
    },
    gegenstandBearbeiten(row, index) {
      this.zeileModalOeffnen('gegenstand', row, index);
    },
    htmlFuerQuillAusBearbeitung() {
      if (!this.bearbeitung) {
        return '';
      }
      if (this.bearbeitung.typ === 'gegenstand') {
        return this.bearbeitung.zeile.beschreibungHtml || '';
      }
      return this.bearbeitung.zeile.notizenHtml || '';
    },
    zeileQuillHostRef(el) {
      if (!el) {
        this.zeileQuillInstanz = null;
        this.zeileQuillHostElement = null;
        return;
      }
      if (!this.bearbeitung) {
        return;
      }
      this.$nextTick(() => {
        if (!this.bearbeitung) {
          return;
        }
        this.zeileQuillAufHostEinrichten(el);
      });
    },
    zeileQuillHostDomLeeren(el) {
      if (!el) {
        return;
      }
      el.querySelectorAll('.ql-toolbar.ql-snow').forEach((node) => {
        node.remove();
      });
      el.innerHTML = '';
    },
    zeileQuillAufHostEinrichten(el, quillRetry) {
      const r = typeof quillRetry === 'number' ? quillRetry : 0;
      if (!el || !this.bearbeitung) {
        return;
      }
      if (!window.Quill) {
        if (r < 40) {
          setTimeout(() => this.zeileQuillAufHostEinrichten(el, r + 1), 25);
        }
        return;
      }
      /* Funktions-:ref wird bei jedem Re-Render erneut aufgerufen — keine zweite Quill-Instanz */
      if (
        this.zeileQuillInstanz &&
        this.zeileQuillHostElement === el &&
        el.contains(this.zeileQuillInstanz.root)
      ) {
        return;
      }
      this.zeileQuillHostDomLeeren(el);
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = el;
      this.zeileQuillInstanz = new window.Quill(el, {
        theme: 'snow',
        placeholder: 'Text formatieren…',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            [{ header: [1, 2, false] }],
            ['clean'],
          ],
        },
      });
      this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
    },
    onZeileModalHidden() {
      this.zeileQuillInstanz = null;
      this.zeileQuillHostElement = null;
      this.bearbeitung = null;
      this.bearbeitungIndex = -1;
      this.$nextTick(() => this.zeileQuillOrphanToolbarsInModalBodyEntfernen());
    },
    quillHtmlInBearbeitungSchreiben() {
      if (!this.bearbeitung || !this.zeileQuillInstanz) {
        return;
      }
      const html = this.zeileQuillInstanz.root.innerHTML;
      if (this.bearbeitung.typ === 'gegenstand') {
        this.bearbeitung.zeile.beschreibungHtml = html;
      } else {
        this.bearbeitung.zeile.notizenHtml = html;
      }
    },
    quillAusBearbeitungSetzen() {
      if (!this.zeileQuillInstanz) {
        return;
      }
      this.zeileQuillInstanz.root.innerHTML = this.htmlFuerQuillAusBearbeitung();
    },
    zufallsvorschlagUebernehmen() {
      if (!this.bearbeitung || this.bearbeitungIndex >= 0) {
        return;
      }
      const G = window.HTBAH && window.HTBAH.Zufallsgenerator;
      if (!G) {
        return;
      }
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      let felder;
      if (typ === 'npc') {
        felder = G.npc();
      } else if (typ === 'ort') {
        felder = G.ort();
      } else {
        felder = G.gegenstand({
          epoche: this.zufallGegenstandEpoche,
          mitKleidung: this.zufallGegenstandKleidung,
        });
      }
      Object.assign(z, felder);
      this.$nextTick(() => this.quillAusBearbeitungSetzen());
    },
    zeileSpeichern() {
      if (!this.bearbeitung) {
        return;
      }
      this.quillHtmlInBearbeitungSchreiben();
      const z = this.bearbeitung.zeile;
      const typ = this.bearbeitung.typ;
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else {
        liste = this.zustand.gegenstaende;
      }
      if (this.bearbeitungIndex < 0) {
        liste.push(z);
      } else {
        liste[this.bearbeitungIndex] = z;
      }
      this.persist();
      if (this.zeileModalInstanz) {
        this.zeileModalInstanz.hide();
      }
    },
    zeileLoeschenDialog(typ, id) {
      this.zuLoeschendeZeile = { typ, id };
      this.$refs.zufallstabellenBestaetigen.oeffnen({
        titel: 'Zeile löschen?',
        beschreibung: 'Diese Tabellenzeile wird entfernt.',
        onBestaetigen: () => this.zeileLoeschenAusfuehren(),
      });
    },
    zeileLoeschenAusfuehren() {
      const p = this.zuLoeschendeZeile;
      this.zuLoeschendeZeile = null;
      if (!p) {
        return;
      }
      const { typ, id } = p;
      let liste;
      if (typ === 'npc') {
        liste = this.zustand.npcs;
      } else if (typ === 'ort') {
        liste = this.zustand.orte;
      } else {
        liste = this.zustand.gegenstaende;
      }
      const i = liste.findIndex((r) => r.id === id);
      if (i !== -1) {
        liste.splice(i, 1);
        this.persist();
      }
    },
    tabelleLeerenDialog(typ) {
      const labels = {
        npcs: 'NPCs',
        orte: 'Orte',
        gegenstaende: 'Gegenstände',
      };
      this.$refs.zufallstabellenBestaetigen.oeffnen({
        titel: `${labels[typ] || 'Tabelle'} leeren?`,
        beschreibung: 'Alle Einträge in dieser Tabelle werden entfernt.',
        onBestaetigen: () => {
          if (typ === 'npcs') {
            this.zustand.npcs = [];
          } else if (typ === 'orte') {
            this.zustand.orte = [];
          } else if (typ === 'gegenstaende') {
            this.zustand.gegenstaende = [];
          }
          this.persist();
        },
      });
    },
  },
  beforeUnmount() {
    this.zeileQuillInstanz = null;
    this.zeileQuillHostElement = null;
  },
  template: `
    <div class="container content py-3">
      <h4 class="text-center mb-3">Zufallstabellen</h4>
      <p class="text-secondary text-center small mb-4">
        Eigene Tabellen für Spielrunden — Einträge werden lokal gespeichert.
      </p>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">NPCs</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('npcs')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="npcHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Spitzname</th>
                  <th>Geschlecht</th>
                  <th>Alter</th>
                  <th>Familienstand</th>
                  <th>Statur</th>
                  <th>Gesinnung</th>
                  <th>Beruf</th>
                  <th>Ziel</th>
                  <th>Notizen</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!zustand.npcs.length">
                  <td colspan="11" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="(row, index) in zustand.npcs" :key="row.id">
                  <td>{{ row.name || '—' }}</td>
                  <td>{{ row.spitzname || '—' }}</td>
                  <td>{{ row.geschlecht || '—' }}</td>
                  <td>{{ row.alter || '—' }}</td>
                  <td>{{ row.familienstand || '—' }}</td>
                  <td>{{ row.statur || '—' }}</td>
                  <td>{{ row.gesinnung || '—' }}</td>
                  <td>{{ row.beruf || '—' }}</td>
                  <td>{{ row.ziel || '—' }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="npcBearbeiten(row, index)">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('npc', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">Orte</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('orte')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="ortHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Größe</th>
                  <th>Lage</th>
                  <th>Zustand</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!zustand.orte.length">
                  <td colspan="6" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="(row, index) in zustand.orte" :key="row.id">
                  <td>{{ row.name || '—' }}</td>
                  <td>{{ row.groesse || '—' }}</td>
                  <td>{{ row.lage || '—' }}</td>
                  <td>{{ row.zustand || '—' }}</td>
                  <td class="small">{{ textVorschau(row.notizenHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="ortBearbeiten(row, index)">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('ort', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card mb-3 text-start">
        <div class="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="fw-semibold">Gegenstände</span>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger" @click="tabelleLeerenDialog('gegenstaende')">
              Leeren
            </button>
            <icon-text-button
              type="button"
              class="btn btn-sm btn-outline-primary flex-shrink-0"
              icon="add"
              @click="gegenstandHinzufuegen"
              aria-label="Eintrag hinzufügen">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-striped mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Beschreibung</th>
                  <th class="text-end text-nowrap">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!zustand.gegenstaende.length">
                  <td colspan="3" class="text-secondary text-center py-3">Noch keine Einträge.</td>
                </tr>
                <tr v-for="(row, index) in zustand.gegenstaende" :key="row.id">
                  <td>{{ row.name || '—' }}</td>
                  <td class="small">{{ textVorschau(row.beschreibungHtml) }}</td>
                  <td class="text-end text-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="gegenstandBearbeiten(row, index)">
                      Bearbeiten
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="zeileLoeschenDialog('gegenstand', row.id)">
                      Löschen
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="htbahZufallstabellenZeileModal"
        ref="zeileModalElement"
        tabindex="-1"
        aria-labelledby="htbahZufallstabellenZeileModalLabel"
        aria-hidden="true"
        @hidden.bs.modal="onZeileModalHidden">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title me-auto" id="htbahZufallstabellenZeileModalLabel">{{ zeileModalTitel }}</h5>
              <button
                v-if="bearbeitung && bearbeitungIndex < 0"
                type="button"
                class="btn btn-sm btn-outline-secondary me-2"
                :disabled="!zufallsgeneratorBereit"
                :title="zufallsgeneratorBereit ? '' : 'Zufallsgenerator nicht geladen'"
                @click="zufallsvorschlagUebernehmen">
                Zufallsvorschlag
              </button>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body text-start" v-if="bearbeitung">
              <template v-if="bearbeitung.typ === 'npc'">
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                      <label for="zfn-name">Name</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-spitzname" class="form-control" v-model="bearbeitung.zeile.spitzname" placeholder=" " />
                      <label for="zfn-spitzname">Spitzname</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-geschlecht" class="form-control" v-model="bearbeitung.zeile.geschlecht" placeholder=" " />
                      <label for="zfn-geschlecht">Geschlecht</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-alter" class="form-control" v-model="bearbeitung.zeile.alter" placeholder=" " />
                      <label for="zfn-alter">Alter</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-familienstand" class="form-control" v-model="bearbeitung.zeile.familienstand" placeholder=" " />
                      <label for="zfn-familienstand">Familienstand</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-statur" class="form-control" v-model="bearbeitung.zeile.statur" placeholder=" " />
                      <label for="zfn-statur">Statur</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-gesinnung" class="form-control" v-model="bearbeitung.zeile.gesinnung" placeholder=" " />
                      <label for="zfn-gesinnung">Gesinnung</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfn-beruf" class="form-control" v-model="bearbeitung.zeile.beruf" placeholder=" " />
                      <label for="zfn-beruf">Beruf</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfn-ziel" class="form-control" v-model="bearbeitung.zeile.ziel" placeholder=" " />
                      <label for="zfn-ziel">Ziel (z. B. Wohlstand, Lebenswandel)</label>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="bearbeitung.typ === 'ort'">
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfo-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                      <label for="zfo-name">Name</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating">
                      <input id="zfo-groesse" class="form-control" v-model="bearbeitung.zeile.groesse" placeholder=" " />
                      <label for="zfo-groesse">Größe</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfo-lage" class="form-control" v-model="bearbeitung.zeile.lage" placeholder=" " />
                      <label for="zfo-lage">Lage (z. B. Wald, Hafenstadt, Fluss, Insel)</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating">
                      <input id="zfo-zustand" class="form-control" v-model="bearbeitung.zeile.zustand" placeholder=" " />
                      <label for="zfo-zustand">Zustand (z. B. zerstört, intakt, florierend)</label>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="bearbeitung.typ === 'gegenstand'">
                <div class="row g-2 mb-2 align-items-end" v-if="bearbeitungIndex < 0">
                  <div class="col-md-6">
                    <label class="form-label small text-secondary mb-1" for="zfg-epoche">Epoche für Zufallsvorschlag</label>
                    <select id="zfg-epoche" class="form-select form-select-sm" v-model="zufallGegenstandEpoche">
                      <option value="mittelalter">Mittelalter</option>
                      <option value="gegenwart">Gegenwart</option>
                      <option value="zukunft">Zukunft</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check mt-3">
                      <input id="zfg-kleidung" class="form-check-input" type="checkbox" v-model="zufallGegenstandKleidung" />
                      <label class="form-check-label small" for="zfg-kleidung">Kleidung als Kategorie zulassen</label>
                    </div>
                  </div>
                </div>
                <div class="form-floating mb-3">
                  <input id="zfg-name" class="form-control" v-model="bearbeitung.zeile.name" placeholder=" " />
                  <label for="zfg-name">Name</label>
                </div>
              </template>

              <label class="form-label mt-3 mb-1" v-if="bearbeitung.typ === 'npc'">Notizen</label>
              <label class="form-label mt-3 mb-1" v-else>Beschreibung</label>
              <div
                class="zufallstabellen-quill-wrap"
                :key="'zeile-q-' + zeileQuillSession">
                <div
                  :ref="zeileQuillHostRefFn"
                  class="quill-editor-host zufallstabellen-quill-host"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
              <button type="button" class="btn btn-primary" @click="zeileSpeichern">Speichern</button>
            </div>
          </div>
        </div>
      </div>

      <bestaetigen-modal ref="zufallstabellenBestaetigen" modal-id="htbahZufallstabellenBestaetigen" />
    </div>
  `,
};
