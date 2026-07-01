window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.VorNachteileEditorPanel = {
  name: 'VorNachteileEditorPanel',
  components: {
    VorNachteilZeileModal: window.HTBAH_KOMPONENTEN.VorNachteilZeileModal,
  },
  props: {
    charakter: { type: Object, required: true },
    bearbeitbar: { type: Boolean, default: true },
    idPrefix: { type: String, default: 'vn-panel' },
  },
  emits: ['budget-geaendert'],
  data() {
    return {
      neueZeilenEntwurf: {
        vorteil: { beschreibung: '', punkte: '' },
        nachteil: { beschreibung: '', punkte: '' },
      },
    };
  },
  computed: {
    vorteile() {
      return Array.isArray(this.charakter.vorteile) ? this.charakter.vorteile : [];
    },
    nachteile() {
      return Array.isArray(this.charakter.nachteile) ? this.charakter.nachteile : [];
    },
    hatEintraege() {
      return this.vorteile.length > 0 || this.nachteile.length > 0;
    },
    faehigkeitspunkteBudget() {
      const CM = window.HTBAH_CHARAKTER_MODEL;
      if (!CM || typeof CM.vorNachteilePunkteAusCharakter !== 'function') {
        return 400;
      }
      const vorteile = Array.isArray(this.charakter.vorteile) ? this.charakter.vorteile : [];
      const nachteile = Array.isArray(this.charakter.nachteile) ? this.charakter.nachteile : [];
      for (const e of vorteile) {
        void (e && e.punkte);
      }
      for (const e of nachteile) {
        void (e && e.punkte);
      }
      const { vorteilSumme, nachteilSumme } = CM.vorNachteilePunkteAusCharakter(this.charakter);
      return CM.FAEHIGKEITSPUNKTE_BASIS - vorteilSumme + nachteilSumme;
    },
    faehigkeitspunkteGesamt() {
      const CM = window.HTBAH_CHARAKTER_MODEL;
      return CM && typeof CM.faehigkeitspunkteGesamtAusCharakter === 'function'
        ? CM.faehigkeitspunkteGesamtAusCharakter(this.charakter)
        : 0;
    },
  },
  mounted() {
    this.stelleListenSicher();
  },
  watch: {
    charakter: {
      handler() {
        this.stelleListenSicher();
      },
      deep: false,
    },
  },
  methods: {
    stelleListenSicher() {
      if (!Array.isArray(this.charakter.vorteile)) {
        this.charakter.vorteile = [];
      }
      if (!Array.isArray(this.charakter.nachteile)) {
        this.charakter.nachteile = [];
      }
    },
    beschreibungVorschau(eintrag) {
      const CM = window.HTBAH_CHARAKTER_MODEL;
      return CM && typeof CM.vorNachteilBeschreibungVorschau === 'function'
        ? CM.vorNachteilBeschreibungVorschau(eintrag && eintrag.beschreibungHtml)
        : '';
    },
    wertAnzeige(typ, eintrag) {
      if (!eintrag || !eintrag.punkte) {
        return '—';
      }
      return typ === 'nachteil' ? `−${eintrag.punkte}` : `+${eintrag.punkte}`;
    },
    wertZelleKlasse(typ) {
      return typ === 'nachteil' ? 'text-danger' : 'text-success';
    },
    budgetNachAenderungPruefen() {
      const gesamt = this.faehigkeitspunkteGesamt;
      const budget = this.faehigkeitspunkteBudget;
      this.$emit('budget-geaendert', { gesamt, budget });
      return gesamt <= budget;
    },
    async budgetWarnungWennNoetig() {
      if (this.budgetNachAenderungPruefen()) {
        return true;
      }
      await window.HTBAH.ui.alert({
        titel: 'Zu viele Fähigkeitspunkte',
        beschreibung: `Durch Vorteile stehen nur noch ${this.faehigkeitspunkteBudget} Fähigkeitspunkte zur Verfügung (400 minus Vorteile plus Nachteile) — aktuell sind ${this.faehigkeitspunkteGesamt} auf Fähigkeiten verteilt. Bitte Fähigkeiten oder Vor-/Nachteil-Punkte anpassen.`,
      });
      return false;
    },
    zeileBearbeiten(typ, eintrag) {
      this.$refs.zeileModal?.oeffnen(typ, eintrag);
    },
    async zeileLoeschen(typ, eintrag) {
      const liste = typ === 'nachteil' ? this.charakter.nachteile : this.charakter.vorteile;
      const label = typ === 'nachteil' ? 'Nachteil' : 'Vorteil';
      const vorschau = this.beschreibungVorschau(eintrag) || label;
      const ok = await window.HTBAH.ui.confirm({
        titel: `${label} löschen?`,
        beschreibung: `„${vorschau}“ wirklich entfernen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: false,
      });
      if (!ok) {
        return;
      }
      const index = liste.indexOf(eintrag);
      if (index !== -1) {
        liste.splice(index, 1);
      }
      this.budgetNachAenderungPruefen();
    },
    leererZeilenEntwurf() {
      return { beschreibung: '', punkte: '' };
    },
    async zeileHinzufuegen(typ) {
      const entwurf = this.neueZeilenEntwurf[typ];
      if (!entwurf) {
        return;
      }
      const CM = window.HTBAH_CHARAKTER_MODEL;
      const beschreibung = String(entwurf.beschreibung || '').trim();
      if (!beschreibung) {
        await window.HTBAH.ui.alert({
          titel: 'Eingabe unvollständig',
          beschreibung: 'Bitte eine Beschreibung angeben.',
        });
        return;
      }
      const punkte = CM.normalisiereVorNachteilPunkte(entwurf.punkte);
      const liste = typ === 'nachteil' ? this.charakter.nachteile : this.charakter.vorteile;
      liste.push({
        id: CM.neueVorNachteilZeilenId(),
        beschreibungHtml: CM.vorNachteilBeschreibungAlsHtml(beschreibung),
        punkte,
      });
      this.neueZeilenEntwurf[typ] = this.leererZeilenEntwurf();
      await this.budgetWarnungWennNoetig();
    },
    async zeileModalGespeichert() {
      await this.budgetWarnungWennNoetig();
    },
  },
  template: `
    <div class="htbah-vor-nachteile-editor-panel">
      <p v-if="bearbeitbar" class="small text-body-secondary mb-3">
        Im Feld <strong>Pkt.</strong> legst du fest, wie viele Fähigkeitspunkte ein Eintrag auf dein Budget wirkt:
        <strong>Vorteile</strong> ziehen Punkte von den 400 ab, <strong>Nachteile</strong> geben zusätzliche Punkte zum Verteilen.
        Ohne Punktwert bleibt der Eintrag rein beschreibend.
      </p>
      <div class="row g-2 mb-0">
        <div
          v-for="typ in ['vorteil', 'nachteil']"
          :key="idPrefix + '-' + typ"
          class="col-12 col-md-6">
          <div class="card p-2 h-100 vn-spalte-karte" :class="typ === 'vorteil' ? 'vn-spalte-karte--vorteil' : 'vn-spalte-karte--nachteil'">
            <h5 class="text-uppercase fw-bold mb-2">
              {{ typ === 'vorteil' ? 'Vorteile' : 'Nachteile' }}
            </h5>
            <div class="table-responsive rounded border border-secondary border-opacity-25">
              <table class="table table-sm mb-0 faehigkeiten-tabelle vor-nachteile-liste-tabelle">
                <thead>
                  <tr>
                    <th scope="col">Beschreibung</th>
                    <th scope="col" class="text-end">Wert</th>
                    <th v-if="bearbeitbar" scope="col" class="text-end text-nowrap ps-1">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!(typ === 'vorteil' ? vorteile : nachteile).length">
                    <td :colspan="bearbeitbar ? 3 : 2" class="text-muted small py-2">
                      Keine {{ typ === 'vorteil' ? 'Vorteile' : 'Nachteile' }}
                    </td>
                  </tr>
                  <tr
                    v-for="eintrag in (typ === 'vorteil' ? vorteile : nachteile)"
                    :key="idPrefix + '-' + typ + '-' + eintrag.id">
                    <td class="align-middle">
                      <div
                        class="vn-beschreibung-vorschau small"
                        :title="beschreibungVorschau(eintrag)">
                        {{ beschreibungVorschau(eintrag) || '—' }}
                      </div>
                    </td>
                    <td class="align-middle text-end fw-semibold" :class="wertZelleKlasse(typ)">
                      {{ wertAnzeige(typ, eintrag) }}
                    </td>
                    <td v-if="bearbeitbar" class="align-middle text-end ps-1">
                      <div class="btn-group">
                        <button
                          type="button"
                          class="btn btn-outline-secondary htbah-input-icon-btn"
                          :aria-label="'Bearbeiten ' + beschreibungVorschau(eintrag)"
                          @click="zeileBearbeiten(typ, eintrag)">
                          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-outline-danger htbah-input-icon-btn"
                          :aria-label="'Löschen ' + beschreibungVorschau(eintrag)"
                          @click="zeileLoeschen(typ, eintrag)">
                          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="bearbeitbar" class="input-group input-group-sm vn-zeile-hinzufuegen-gruppe mt-2">
              <textarea
                :id="idPrefix + '-neu-' + typ + '-beschr'"
                class="form-control vn-zeile-hinzufuegen-text"
                rows="2"
                v-model="neueZeilenEntwurf[typ].beschreibung"
                :placeholder="typ === 'vorteil' ? 'Neuer Vorteil…' : 'Neuer Nachteil…'"
                :aria-label="typ === 'vorteil' ? 'Beschreibung Vorteil' : 'Beschreibung Nachteil'"></textarea>
              <input
                :id="idPrefix + '-neu-' + typ + '-punkte'"
                type="number"
                class="form-control vn-zeile-hinzufuegen-wert"
                min="1"
                step="1"
                inputmode="numeric"
                v-model="neueZeilenEntwurf[typ].punkte"
                placeholder="Pkt."
                aria-label="Punkte (optional)" />
              <button
                type="button"
                class="btn btn-primary htbah-input-icon-btn"
                :aria-label="typ === 'vorteil' ? 'Vorteil hinzufügen' : 'Nachteil hinzufügen'"
                @click="zeileHinzufuegen(typ)">
                <span class="material-symbols-outlined" aria-hidden="true">add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-if="!hatEintraege && !bearbeitbar" class="small text-body-secondary mb-0 mt-2">
        Keine Vor- oder Nachteile eingetragen.
      </p>
      <vor-nachteil-zeile-modal ref="zeileModal" @gespeichert="zeileModalGespeichert" />
    </div>
  `,
};
