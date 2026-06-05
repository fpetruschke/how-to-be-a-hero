window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.FaehigkeitenEditorPanel = {
  name: 'FaehigkeitenEditorPanel',
  components: {
    FaehigkeitFormular: window.HTBAH_KOMPONENTEN.FaehigkeitFormular,
  },
  props: {
    entitaet: { type: Object, required: true },
    /** 'charakter' | 'sl' */
    modus: { type: String, default: 'charakter' },
    presetId: { type: String, default: '' },
    zeigeNeuFormular: { type: Boolean, default: true },
    idPrefix: { type: String, default: 'faeh-panel' },
  },
  emits: ['probe'],
  data() {
    return {
      aktiveInfo: null,
      aktiveKategorieInfo: null,
      neueFaehigkeit: { name: '', value: 0, type: 'handeln' },
      bearbeitungReferenz: null,
      bearbeitungKategorie: '',
      bearbeitungEntwurf: { name: '', value: 0, type: 'handeln' },
    };
  },
  computed: {
    istSl() {
      return this.modus === 'sl';
    },
    kategorieInfos() {
      return window.HTBAH_CHARAKTER_UTILS ? window.HTBAH_CHARAKTER_UTILS.KATEGORIE_INFOS : {};
    },
    summen() {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (EF && typeof EF.summenAusEntitaet === 'function') {
        return EF.summenAusEntitaet(this.entitaet);
      }
      const sum = (kat) =>
        (Array.isArray(this.entitaet[kat]) ? this.entitaet[kat] : []).reduce(
          (s, e) => s + (Number(e && e.value) || 0),
          0,
        );
      return { handeln: sum('handeln'), wissen: sum('wissen'), soziales: sum('soziales') };
    },
    begabungen() {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      if (EF && typeof EF.begabungenAusEntitaet === 'function') {
        return EF.begabungenAusEntitaet(this.entitaet);
      }
      return {
        handeln: Math.round(this.summen.handeln / 10),
        wissen: Math.round(this.summen.wissen / 10),
        soziales: Math.round(this.summen.soziales / 10),
      };
    },
    punkte() {
      return this.summen.handeln + this.summen.wissen + this.summen.soziales;
    },
    hatZuVieleFaehigkeitspunkte() {
      return !this.istSl && this.punkte > 400;
    },
    faehigkeitspunkteUeberLimit() {
      return Math.max(0, this.punkte - 400);
    },
    zeigtHeldenLimitHinweis() {
      return this.istSl && this.punkte > 400;
    },
    presetSkillNamen() {
      const EF = window.HTBAH_ENTITAET_FAEHIGKEITEN_MODEL;
      const pid =
        this.presetId ||
        (EF && typeof EF.presetIdFuerEntitaet === 'function'
          ? EF.presetIdFuerEntitaet('npc', this.entitaet, 'mittelalter')
          : '');
      const preset = EF && typeof EF.findePreset === 'function' ? EF.findePreset(pid) : null;
      const CV = window.HTBAH_CHARAKTERVORLAGEN_MODEL;
      if (!preset || !CV || typeof CV.skillNamenAusPreset !== 'function') {
        return [];
      }
      return [...CV.skillNamenAusPreset(preset)].sort((a, b) => a.localeCompare(b, 'de'));
    },
    maxWertProSkill() {
      return this.istSl ? 200 : 100;
    },
  },
  mounted() {
    this.stelleArraysSicher();
  },
  watch: {
    entitaet: {
      handler() {
        this.stelleArraysSicher();
      },
      deep: false,
    },
  },
  methods: {
    stelleArraysSicher() {
      const e = this.entitaet;
      if (!e || typeof e !== 'object') {
        return;
      }
      ['handeln', 'wissen', 'soziales'].forEach((kat) => {
        if (!Array.isArray(e[kat])) {
          e[kat] = [];
        }
      });
    },
    kategorieAnzeige(kategorie) {
      const namen = { handeln: 'Handeln', wissen: 'Wissen', soziales: 'Soziales' };
      return namen[kategorie] || kategorie;
    },
    sortierteFaehigkeiten(kategorie) {
      const arr = Array.isArray(this.entitaet[kategorie]) ? this.entitaet[kategorie] : [];
      return [...arr].sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
    },
    infoUmschalten(kategorie) {
      this.aktiveInfo = this.aktiveInfo === kategorie ? null : kategorie;
    },
    kategorieInfoUmschalten(kategorie) {
      this.aktiveKategorieInfo =
        this.aktiveKategorieInfo === kategorie ? null : kategorie;
    },
    effektiverWert(kategorie, faehigkeit) {
      const basis = Number(faehigkeit.value) || 0;
      return Math.min(100, basis + this.begabungen[kategorie]);
    },
    probeBegabung(kategorie) {
      const zielwert = this.begabungen[kategorie];
      this.$emit('probe', {
        typ: 'begabung',
        kategorie,
        zielwert,
        titel: 'Probe: Begabung ' + this.kategorieAnzeige(kategorie),
        untertitel:
          'Nur der Begabungswert — ohne einzelne Fähigkeit. Keine kritischen Erfolge (Regelwerk).',
      });
    },
    probeFaehigkeit(kategorie, faehigkeit) {
      const b = this.begabungen[kategorie];
      const fWert = Number(faehigkeit.value) || 0;
      const z = this.effektiverWert(kategorie, faehigkeit);
      let untertitel =
        'Effektivwert ' +
        z +
        ' (' +
        fWert +
        ' + ' +
        b +
        ' Begabung, ' +
        this.kategorieAnzeige(kategorie) +
        ')';
      if (fWert + b > 100) {
        untertitel += '. Überzählige Punkte zählen für die Probe nicht (Regelwerk 3.4, Ziel 100).';
      }
      this.$emit('probe', {
        typ: 'faehigkeit',
        kategorie,
        faehigkeit,
        zielwert: z,
        titel: 'Probe: ' + faehigkeit.name,
        untertitel,
      });
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
    async wertGueltig(wert, punkteOhneAlt, alterWert) {
      if (!Number.isFinite(wert) || wert < 0) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiger Wert',
          beschreibung: 'Negative Werte sind nicht erlaubt.',
        });
        return false;
      }
      if (wert > this.maxWertProSkill) {
        await window.HTBAH.ui.alert({
          titel: 'Ungültiger Wert',
          beschreibung: `Maximalwert ist ${this.maxWertProSkill}.`,
        });
        return false;
      }
      if (!this.istSl) {
        const punkteNeu = punkteOhneAlt + wert;
        if (punkteNeu > 400) {
          await window.HTBAH.ui.alert({
            titel: 'Zu viele Punkte',
            beschreibung: `Maximal 400 Fähigkeitspunkte (${punkteNeu} / 400).`,
          });
          return false;
        }
      }
      return true;
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
      const wert = Number(value);
      const punkteOhne = this.punkte - (Number(ref.value) || 0);
      if (!(await this.wertGueltig(wert, punkteOhne, ref.value))) {
        return;
      }
      if (type !== altKat) {
        const idx = this.entitaet[altKat].indexOf(ref);
        if (idx !== -1) {
          this.entitaet[altKat].splice(idx, 1);
        }
        ref.name = nameTrim;
        ref.value = wert;
        this.entitaet[type].push(ref);
      } else {
        ref.name = nameTrim;
        ref.value = wert;
      }
      this.bearbeitungModalSchliessen();
    },
    async faehigkeitLoeschen(kategorie, faehigkeit) {
      const ok = await window.HTBAH.ui.confirm({
        titel: 'Fähigkeit löschen?',
        beschreibung: `Die Fähigkeit „${faehigkeit.name}“ wird entfernt.`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: false,
      });
      if (!ok) {
        return;
      }
      const index = this.entitaet[kategorie].indexOf(faehigkeit);
      if (index !== -1) {
        this.entitaet[kategorie].splice(index, 1);
      }
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
      const wert = Number(this.neueFaehigkeit.value);
      if (!(await this.wertGueltig(wert, this.punkte, 0))) {
        return;
      }
      const kat = this.neueFaehigkeit.type;
      if (!Array.isArray(this.entitaet[kat])) {
        this.entitaet[kat] = [];
      }
      this.entitaet[kat].push({ name: nameTrim, value: wert });
      this.neueFaehigkeit.name = '';
      this.neueFaehigkeit.value = 0;
    },
  },
  template: `
    <div class="htbah-faehigkeiten-editor-panel">
      <div v-if="hatZuVieleFaehigkeitspunkte" class="alert alert-danger py-2 mb-2" role="alert">
        Zu viele Fähigkeitspunkte verteilt: {{ punkte }} / 400
        ({{ faehigkeitspunkteUeberLimit }} über dem Maximum). Bitte Punkte reduzieren.
      </div>
      <p v-else-if="zeigtHeldenLimitHinweis" class="small text-secondary mb-2">
        Hinweis: {{ punkte }} Fähigkeitspunkte — deutlich über typischen Helden (400). Für ausgewogene Kämpfe eher weniger vergeben.
      </p>
      <p v-if="!istSl" class="mb-2">
        Punkte: <strong>{{ punkte }}</strong> / 400
        <span class="text-warning">({{ 400 - punkte }} übrig)</span>
      </p>
      <p v-else class="mb-2 small text-secondary">
        Fähigkeitspunkte gesamt: <strong>{{ punkte }}</strong>
        <span v-if="begabungen.handeln || begabungen.wissen || begabungen.soziales">
          · Begabungen H {{ begabungen.handeln }} / W {{ begabungen.wissen }} / S {{ begabungen.soziales }}
        </span>
      </p>
      <div v-if="!istSl" class="progress mb-3" style="height:10px;">
        <div class="progress-bar" :style="{ width: Math.min(100, punkte / 400 * 100) + '%' }"></div>
      </div>
      <div class="htbah-faehigkeit-kat-spalten mb-2">
        <div class="htbah-faehigkeit-kat-spalten-inner">
        <div v-for="kategorie in ['handeln','wissen','soziales']" :key="idPrefix + '-' + kategorie" class="htbah-faehigkeit-kat-spalte">
          <div class="card p-2 h-100">
            <h5 class="text-uppercase fw-bold d-flex align-items-center gap-1 mb-2">
              <span>{{ kategorieAnzeige(kategorie) }}</span>
              <span
                class="material-symbols-outlined"
                style="cursor:pointer;font-size:1.1rem;"
                role="button"
                tabindex="0"
                :aria-label="'Info ' + kategorie"
                @click="kategorieInfoUmschalten(kategorie)">info</span>
            </h5>
            <div v-if="aktiveKategorieInfo === kategorie && kategorieInfos[kategorie]" class="faehigkeiten-stat-info-panel mb-2">
              <small class="d-block">{{ kategorieInfos[kategorie].erklaerung }}</small>
            </div>
            <div class="faehigkeiten-stat-badges-row mb-2" role="group">
              <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-summe me-1">
                Summe {{ summen[kategorie] }}
              </span>
              <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-begabung me-1">
                Begabung {{ begabungen[kategorie] }}
              </span>
              <button
                type="button"
                class="faehigkeiten-stat-info-btn faehigkeiten-probe-wuerfel-btn"
                :aria-label="'Probe Begabung ' + kategorieAnzeige(kategorie)"
                @click="probeBegabung(kategorie)">
                <span class="faehigkeiten-wuerfel-emoji" aria-hidden="true">🎲</span>
              </button>
              <button
                type="button"
                class="faehigkeiten-stat-info-btn"
                :aria-label="'Info Begabung'"
                @click="infoUmschalten(kategorie)">
                <span class="material-symbols-outlined" aria-hidden="true">info</span>
              </button>
            </div>
            <div
              v-if="aktiveInfo === kategorie"
              class="faehigkeiten-stat-info-panel faehigkeiten-stat-info-panel--begabung mb-2">
              <small>Begabung = Summe der Fähigkeiten / 10 (kaufmännisch runden).</small>
            </div>
            <div class="table-responsive rounded border border-secondary border-opacity-25">
              <table class="table table-sm mb-0 faehigkeiten-tabelle">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col" class="text-end">Wert</th>
                    <th scope="col" class="text-end">Effektiv</th>
                    <th scope="col" class="text-end text-nowrap ps-1">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!sortierteFaehigkeiten(kategorie).length">
                    <td colspan="4" class="text-muted small py-2">Keine Fähigkeiten</td>
                  </tr>
                  <tr v-for="f in sortierteFaehigkeiten(kategorie)" :key="idPrefix + '-f-' + kategorie + '-' + f.name">
                    <td class="align-middle">{{ f.name }}</td>
                    <td class="align-middle text-end text-muted">{{ f.value }}</td>
                    <td class="align-middle text-end">{{ effektiverWert(kategorie, f) }}</td>
                    <td class="align-middle text-end ps-1">
                      <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary py-0 px-1" :aria-label="'Probe ' + f.name" @click="probeFaehigkeit(kategorie, f)">
                          <span class="faehigkeiten-wuerfel-emoji" aria-hidden="true">🎲</span>
                        </button>
                        <button type="button" class="btn btn-outline-secondary py-0 px-1" :aria-label="'Bearbeiten ' + f.name" @click="bearbeitungModalOeffnen(kategorie, f)">
                          <span class="material-symbols-outlined" style="font-size:1rem;">edit</span>
                        </button>
                        <button type="button" class="btn btn-outline-danger py-0 px-1" :aria-label="'Löschen ' + f.name" @click="faehigkeitLoeschen(kategorie, f)">
                          <span class="material-symbols-outlined" style="font-size:1rem;">delete</span>
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
      </div>
      <div v-if="zeigeNeuFormular" class="card p-2">
        <h5 class="h6 mb-2">Neue Fähigkeit</h5>
        <faehigkeit-formular v-model="neueFaehigkeit" :id-prefix="idPrefix + '-neu'" />
        <datalist v-if="presetSkillNamen.length" :id="idPrefix + '-skill-datalist'">
          <option v-for="n in presetSkillNamen" :key="idPrefix + '-sk-' + n" :value="n"></option>
        </datalist>
        <button type="button" class="btn btn-primary w-100 mt-2 btn-sm" @click="faehigkeitHinzufuegen">Hinzufügen</button>
      </div>
      <div
        class="modal fade"
        :id="idPrefix + '-bearb-modal'"
        ref="faehigkeitBearbeitenModalElement"
        tabindex="-1"
        aria-hidden="true"
        v-on="{ 'hidden.bs.modal': bearbeitungModalGeschlossen }">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title">Fähigkeit bearbeiten</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
            </div>
            <div class="modal-body">
              <faehigkeit-formular v-model="bearbeitungEntwurf" :id-prefix="idPrefix + '-bearb'" />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Abbrechen</button>
              <button type="button" class="btn btn-primary btn-sm" @click="bearbeitungSpeichern">Speichern</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
