window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

const PE_KATEGORIE_INFOS = {
  handeln: {
    erklaerung:
      'Handeln umfasst körperliche, praktische und unmittelbare Aktionen in der Spielwelt.',
    beispiele: ['Klettern', 'Schleichen', 'Kampf', 'Schlösser knacken', 'Fahren'],
  },
  wissen: {
    erklaerung:
      'Wissen umfasst gelerntes, logisches und analytisches Können rund um Fakten und Zusammenhänge.',
    beispiele: ['Heilkunde', 'Geschichte', 'Magiekunde', 'Sprachen', 'Technik'],
  },
  soziales: {
    erklaerung:
      'Soziales umfasst alle Fähigkeiten im Umgang mit anderen Personen, Gruppen und Beziehungen.',
    beispiele: ['Überreden', 'Lügen', 'Menschenkenntnis', 'Verhandeln', 'Auftreten'],
  },
};

window.HTBAH_SEITEN.PresetEditor = {
  components: {
    FaehigkeitFormular: window.HTBAH_KOMPONENTEN.FaehigkeitFormular,
  },
  data() {
    return {
      preset: {
        name: '',
        handeln: [],
        wissen: [],
        soziales: [],
      },
      neueFaehigkeit: { name: '', value: null, type: 'handeln' },
      istBearbeitung: false,
      presetIndex: null,
      aktiveKategorieInfo: null,
      bearbeitungEntwurf: { name: '', value: null, type: 'handeln' },
      bearbeitungReferenz: null,
      bearbeitungKategorie: '',
    };
  },
  created() {
    const id = this.$route.params.id;

    if (id !== undefined) {
      const presets = window.HTBAH.ladePresets();
      const preset = presets[id];

      if (preset) {
        this.preset = JSON.parse(JSON.stringify(preset));
        this.istBearbeitung = true;
        this.presetIndex = id;
      }
    }
  },
  computed: {
    kategorieInfos() {
      return PE_KATEGORIE_INFOS;
    },
    sortierteFaehigkeiten() {
      return (kategorie) =>
        [...this.preset[kategorie]].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    },
  },
  methods: {
    kategorieInfoUmschalten(kategorie) {
      this.aktiveKategorieInfo = this.aktiveKategorieInfo === kategorie ? null : kategorie;
    },
    wertAnzeige(faehigkeit) {
      const v = faehigkeit.value;
      if (v === null || v === undefined) {
        return '—';
      }
      return v;
    },
    async faehigkeitHinzufuegen() {
      const nameTrim = String(this.neueFaehigkeit.name || '').trim();
      if (!nameTrim) {
        await window.HTBAH.ui.alert({
          titel: 'Eingabe unvollständig',
          beschreibung: 'Gib einen Namen an.',
        });
        return;
      }

      let wert = null;
      const v = this.neueFaehigkeit.value;
      if (v !== null && v !== undefined && v !== '') {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 1 || n > 100) {
          await window.HTBAH.ui.alert({
            titel: 'Ungültiger Wert',
            beschreibung: 'Wert muss zwischen 1 und 100 liegen oder leer bleiben.',
          });
          return;
        }
        wert = n;
      }

      this.preset[this.neueFaehigkeit.type].push({
        name: nameTrim,
        value: wert,
      });

      this.neueFaehigkeit = {
        name: '',
        value: null,
        type: this.neueFaehigkeit.type,
      };
    },
    bearbeitungModalOeffnen(kategorie, faehigkeit) {
      this.bearbeitungReferenz = faehigkeit;
      this.bearbeitungKategorie = kategorie;
      this.bearbeitungEntwurf = {
        name: faehigkeit.name,
        value: faehigkeit.value,
        type: kategorie,
      };

      this.$nextTick(() => {
        const el = this.$refs.faehigkeitBearbeitenModalElement;
        if (!el || !window.bootstrap) {
          return;
        }
        window.bootstrap.Modal.getOrCreateInstance(el).show();
      });
    },
    bearbeitungModalGeschlossen() {
      this.bearbeitungReferenz = null;
      this.bearbeitungKategorie = '';
    },
    bearbeitungModalSchliessen() {
      const el = this.$refs.faehigkeitBearbeitenModalElement;
      if (el && window.bootstrap) {
        const instanz = window.bootstrap.Modal.getInstance(el);
        if (instanz) {
          instanz.hide();
        }
      }
    },
    async bearbeitungSpeichern() {
      const { name, value, type } = this.bearbeitungEntwurf;
      const ref = this.bearbeitungReferenz;
      const altKat = this.bearbeitungKategorie;

      if (!ref || !altKat) {
        return;
      }

      const nameTrim = typeof name === 'string' ? name.trim() : '';
      if (!nameTrim) {
        await window.HTBAH.ui.alert({
          titel: 'Eingabe unvollständig',
          beschreibung: 'Gib einen Namen an.',
        });
        return;
      }

      let wert = null;
      if (value !== null && value !== undefined && value !== '') {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 1 || n > 100) {
          await window.HTBAH.ui.alert({
            titel: 'Ungültiger Wert',
            beschreibung: 'Wert muss zwischen 1 und 100 liegen oder leer bleiben.',
          });
          return;
        }
        wert = n;
      }

      if (type !== altKat) {
        const idx = this.preset[altKat].indexOf(ref);
        if (idx !== -1) {
          this.preset[altKat].splice(idx, 1);
        }
        ref.name = nameTrim;
        ref.value = wert;
        this.preset[type].push(ref);
      } else {
        ref.name = nameTrim;
        ref.value = wert;
      }

      this.bearbeitungModalSchliessen();
    },
    faehigkeitLoeschenAnfragen(kategorie, faehigkeit) {
      this.$refs.faehigkeitLoeschenModal.oeffnen({
        titel: 'Fähigkeit löschen?',
        beschreibung: `Die Fähigkeit „${faehigkeit.name}“ wird aus dem Preset entfernt.`,
        onBestaetigen: () => {
          const index = this.preset[kategorie].indexOf(faehigkeit);
          if (index !== -1) {
            this.preset[kategorie].splice(index, 1);
          }
        },
      });
    },
    async presetSpeichern() {
      if (!this.preset.name) {
        await window.HTBAH.ui.alert({
          titel: 'Preset kann nicht gespeichert werden',
          beschreibung: 'Name fehlt.',
        });
        return;
      }

      const presets = window.HTBAH.ladePresets();
      const zuSpeichern = JSON.parse(JSON.stringify(this.preset));
      if (!this.istBearbeitung && zuSpeichern.htbahPresetId) {
        delete zuSpeichern.htbahPresetId;
      }

      if (this.istBearbeitung) {
        presets[this.presetIndex] = zuSpeichern;
      } else {
        presets.push(zuSpeichern);
      }

      window.HTBAH.speicherePresets(presets);
      this.$router.push('/faehigkeiten-presets');
    },
  },
  template: `
    <div class="container content py-3">
      <nav class="mb-2" aria-label="Brotkrumen">
        <router-link to="/faehigkeiten-presets" class="htbah-back-link">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          <span>Zurück zur Übersicht</span>
        </router-link>
      </nav>

      <h4 class="text-center mb-3 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">📦</span>
        <span>{{ istBearbeitung ? 'Fähigkeiten-Preset bearbeiten' : 'Fähigkeiten-Preset erstellen' }}</span>
      </h4>
      <p v-if="preset.htbahPresetId" class="small text-body-secondary text-center mb-3">
        Vorgegebenes Preset: Name und Fähigkeiten sind anpassbar; in der Übersicht kann es nicht gelöscht werden.
      </p>

      <div class="card p-3 mb-2">
        <div class="form-floating mb-0">
          <input id="pe-preset-name" class="form-control" v-model="preset.name" placeholder=" " autocomplete="off" />
          <label for="pe-preset-name">Name des Fähigkeiten-Presets</label>
        </div>
      </div>

      <div class="card p-2 mb-2">
        <h5 class="mb-2">Fähigkeiten</h5>
        <p class="small text-body-secondary mb-3 mb-md-2">
          Im Preset legst du nur Fähigkeitsnamen fest. Punkte (Werte) trägst du am Charakter ein —
          dort erscheint wie gewohnt die Spalte „Effektiv“ (Wert + Begabung).
        </p>

        <div class="row g-2 mb-2">
          <div
            v-for="kategorie in ['handeln','wissen','soziales']"
            :key="kategorie"
            class="col-12 col-md-4">
            <div class="card p-2 h-100">
              <h5 class="text-uppercase fw-bold d-flex align-items-center gap-1">
                <span>{{ kategorie }}</span>
                <span
                  class="material-symbols-outlined"
                  style="cursor:pointer;"
                  role="button"
                  tabindex="0"
                  aria-label="Kategorie-Info"
                  @click="kategorieInfoUmschalten(kategorie)"
                  @keydown.enter.prevent="kategorieInfoUmschalten(kategorie)"
                  @keydown.space.prevent="kategorieInfoUmschalten(kategorie)">
                  info
                </span>
              </h5>
              <div
                v-if="aktiveKategorieInfo === kategorie"
                class="faehigkeiten-stat-info-panel mb-2 mt-0">
                <small class="d-block">
                  {{ kategorieInfos[kategorie].erklaerung }}
                </small>
                <ul class="mt-2 mb-0 small">
                  <li v-for="beispiel in kategorieInfos[kategorie].beispiele" :key="beispiel">
                    {{ beispiel }}
                  </li>
                </ul>
              </div>

              <div class="table-responsive rounded border border-secondary border-opacity-25">
                <table class="table table-sm mb-0 faehigkeiten-tabelle">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col" class="text-end">Wert</th>
                      <th scope="col" class="text-end">Effektiv</th>
                      <th scope="col" class="text-end text-nowrap ps-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!sortierteFaehigkeiten(kategorie).length">
                      <td colspan="4" class="text-muted small py-2">Keine Fähigkeiten</td>
                    </tr>
                    <tr
                      v-for="faehigkeit in sortierteFaehigkeiten(kategorie)"
                      :key="kategorie + '-' + faehigkeit.name">
                      <td class="align-middle">{{ faehigkeit.name }}</td>
                      <td class="align-middle text-end">{{ wertAnzeige(faehigkeit) }}</td>
                      <td class="align-middle text-end text-muted small">—</td>
                      <td class="align-middle text-end ps-2">
                        <div class="btn-group btn-group-sm" role="group" :aria-label="'Aktionen für ' + faehigkeit.name">
                          <button
                            type="button"
                            class="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                            :aria-label="'Bearbeiten: ' + faehigkeit.name"
                            @click="bearbeitungModalOeffnen(kategorie, faehigkeit)">
                            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn-outline-danger d-flex align-items-center justify-content-center"
                            :aria-label="'Löschen: ' + faehigkeit.name"
                            @click="faehigkeitLoeschenAnfragen(kategorie, faehigkeit)">
                            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-2">
          <h5>Neue Fähigkeit</h5>
          <faehigkeit-formular
            v-model="neueFaehigkeit"
            id-prefix="pe-neu"
            :nullable-wert="true"
          />
          <button type="button" class="btn btn-primary w-100 mt-2" @click="faehigkeitHinzufuegen">
            Hinzufügen
          </button>
        </div>
      </div>

      <button type="button" class="btn btn-success w-100" @click="presetSpeichern">
        Fähigkeiten-Preset speichern
      </button>

      <div class="abstandshalter" aria-hidden="true"></div>

      <div
        class="modal fade"
        id="peFaehigkeitBearbeitenModal"
        ref="faehigkeitBearbeitenModalElement"
        tabindex="-1"
        aria-labelledby="peFaehigkeitBearbeitenLabel"
        aria-hidden="true"
        v-on="{ 'hidden.bs.modal': bearbeitungModalGeschlossen }">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title" id="peFaehigkeitBearbeitenLabel">Fähigkeit bearbeiten</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <faehigkeit-formular
                v-model="bearbeitungEntwurf"
                id-prefix="pe-bearb"
                :nullable-wert="true"
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
              <button type="button" class="btn btn-primary" @click="bearbeitungSpeichern">Speichern</button>
            </div>
          </div>
        </div>
      </div>

      <bestaetigen-modal ref="faehigkeitLoeschenModal" />
    </div>
  `,
};
