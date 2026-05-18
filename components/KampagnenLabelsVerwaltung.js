window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  const KL = window.HTBAH_SHARED && window.HTBAH_SHARED.KampagnenLabels;

  const LABEL_GRUPPEN = KL
    ? [
        { kategorie: KL.KATEGORIE_SETTING, titel: 'Setting / Epoche' },
        { kategorie: KL.KATEGORIE_FORMAT, titel: 'Format' },
        { kategorie: KL.KATEGORIE_INHALT, titel: 'Inhaltshinweis' },
      ]
    : [];

  window.HTBAH_KOMPONENTEN.KampagnenLabelsVerwaltung = {
    data() {
      return {
        katalog: null,
        neuerName: '',
        neueKategorie: KL ? KL.KATEGORIE_SETTING : 'setting',
        neuerBg: 'info',
        neuerText: 'dark',
        bearbeitungId: '',
        bearbeitungPatch: null,
        labelGruppen: LABEL_GRUPPEN,
      };
    },
    computed: {
      eintraege() {
        return this.katalog && Array.isArray(this.katalog.eintraege) ? this.katalog.eintraege : [];
      },
      hintergrundFarbenMeta() {
        return KL && Array.isArray(KL.HINTERGRUND_FARBEN_META) ? KL.HINTERGRUND_FARBEN_META : [];
      },
    },
    mounted() {
      this.neuLaden();
    },
    methods: {
      neuLaden() {
        this.katalog =
          window.HTBAH && typeof window.HTBAH.ladeKampagnenLabelsKatalog === 'function'
            ? window.HTBAH.ladeKampagnenLabelsKatalog()
            : KL
              ? KL.normalisiereKatalog(null)
              : { version: 2, eintraege: [] };
      },
      eintraegeFuerGruppe(kategorie) {
        return this.eintraege.filter((e) => e && e.kategorie === kategorie);
      },
      kategorieEmoji(kategorie) {
        return KL ? KL.kategorieEmoji(kategorie) : '';
      },
      gruppenTitel(gruppe) {
        if (!gruppe) {
          return '';
        }
        return `${this.kategorieEmoji(gruppe.kategorie)} ${gruppe.titel}`;
      },
      badgeKlasse(eintrag) {
        return window.HTBAH && typeof window.HTBAH.kampagnenLabelBadgeKlasse === 'function'
          ? window.HTBAH.kampagnenLabelBadgeKlasse(eintrag)
          : 'text-bg-secondary';
      },
      farbeSwatchAktiv(aktuell, farbeId) {
        return aktuell === farbeId;
      },
      farbeSwatchLabelStil(farbe) {
        if (!farbe) {
          return {};
        }
        if (farbe.id === 'light') {
          return { color: '#6c757d' };
        }
        return { color: farbe.hex };
      },
      setzeBearbeitungHintergrund(farbeId) {
        if (this.bearbeitungPatch) {
          this.bearbeitungPatch.bg = farbeId;
        }
      },
      setzeNeueKategorie(kategorie) {
        this.neueKategorie = kategorie;
        if (KL) {
          this.neuerBg = KL.defaultBgFuerKategorie(kategorie);
          this.neuerText = KL.defaultTextFuerKategorie(kategorie);
        }
      },
      labelHinzufuegen() {
        const name = KL ? KL.normalisiereLabelName(this.neuerName) : this.neuerName.trim();
        if (!name || !window.HTBAH || typeof window.HTBAH.erstelleKampagnenLabelImKatalog !== 'function') {
          return;
        }
        const ergebnis = window.HTBAH.erstelleKampagnenLabelImKatalog({
          name,
          kategorie: this.neueKategorie,
          bg: this.neuerBg,
          text: this.neuerText,
        });
        if (ergebnis && ergebnis.eintrag) {
          this.neuerName = '';
          this.neuLaden();
          if (ergebnis.neu) {
            window.HTBAH.ui.notify({ text: 'Label angelegt.', typ: 'success' });
          } else {
            window.HTBAH.ui.notify({ text: 'Label existiert bereits im Katalog.', typ: 'warning' });
          }
        }
      },
      starteBearbeitung(eintrag) {
        if (!eintrag) {
          return;
        }
        this.bearbeitungId = eintrag.id;
        this.bearbeitungPatch = {
          name: eintrag.name,
          kategorie: eintrag.kategorie,
          bg: eintrag.bg,
          text: eintrag.text,
        };
      },
      abbrechenBearbeitung() {
        this.bearbeitungId = '';
        this.bearbeitungPatch = null;
      },
      speichereBearbeitung() {
        if (
          !this.bearbeitungId ||
          !this.bearbeitungPatch ||
          !window.HTBAH ||
          typeof window.HTBAH.aktualisiereKampagnenLabelImKatalog !== 'function'
        ) {
          return;
        }
        const patch = {
          name: this.bearbeitungPatch.name,
          kategorie: this.bearbeitungPatch.kategorie,
          bg: this.bearbeitungPatch.bg,
          text: this.bearbeitungPatch.text,
        };
        if (window.HTBAH.aktualisiereKampagnenLabelImKatalog(this.bearbeitungId, patch)) {
          this.abbrechenBearbeitung();
          this.neuLaden();
          window.HTBAH.ui.notify({ text: 'Label gespeichert.', typ: 'success' });
        } else {
          window.HTBAH.ui.notify({
            text: 'Label konnte nicht gespeichert werden.',
            typ: 'danger',
          });
        }
      },
      async labelLoeschen(eintrag) {
        if (!eintrag || !window.HTBAH || typeof window.HTBAH.loescheKampagnenLabelAusKatalog !== 'function') {
          return;
        }
        const bestaetigt = await window.HTBAH.ui.confirm({
          titel: 'Label aus Katalog entfernen?',
          beschreibung: `„${eintrag.name}“ wird aus dem Katalog entfernt. Auf Kampagnen bleiben die gespeicherten Kopien.`,
          bestaetigenText: 'Entfernen',
          bestaetigenButtonClass: 'btn-danger',
        });
        if (!bestaetigt) {
          return;
        }
        if (window.HTBAH.loescheKampagnenLabelAusKatalog(eintrag.id)) {
          if (this.bearbeitungId === eintrag.id) {
            this.abbrechenBearbeitung();
          }
          this.neuLaden();
        }
      },
    },
    template: `
      <div class="htbah-kampagnen-labels-verwaltung text-start">
        <p class="small text-body-secondary mb-3">
          Labels für Kampagnen: 🏰 Setting/Epoche, 📋 Format (z. B. One-Shot) oder 🎭 Inhaltshinweis (z. B. Gewalt). Auf Kampagnen
          werden Kopien inkl. Farben gespeichert. Beim Import fehlende Labels werden global ergänzt; vorhandene bleiben
          unverändert.
        </p>

        <template v-if="eintraege.length">
          <section
            v-for="gruppe in labelGruppen"
            :key="'klv-gruppe-' + gruppe.kategorie"
            class="mb-3">
            <h6 class="small fw-semibold text-body-secondary mb-2">{{ gruppenTitel(gruppe) }}</h6>
            <ul class="list-unstyled mb-0">
              <li
                v-for="e in eintraegeFuerGruppe(gruppe.kategorie)"
                :key="'klv-' + e.id"
                class="border rounded p-2 mb-2">
                <template v-if="bearbeitungId === e.id && bearbeitungPatch">
                  <div class="row g-2 align-items-end">
                    <div class="col-12 col-md">
                      <label class="form-label small mb-0">Name</label>
                      <input v-model="bearbeitungPatch.name" type="text" class="form-control form-control-sm" autocomplete="off" />
                    </div>
                    <div class="col-auto">
                      <span class="form-label small d-block mb-1">Typ</span>
                      <div class="btn-group btn-group-sm" role="group" aria-label="Label-Typ">
                        <button
                          type="button"
                          class="btn"
                          :class="bearbeitungPatch.kategorie === 'setting' ? 'btn-primary' : 'btn-outline-secondary'"
                          title="Setting / Epoche"
                          @click="bearbeitungPatch.kategorie = 'setting'">
                          🏰
                        </button>
                        <button
                          type="button"
                          class="btn"
                          :class="bearbeitungPatch.kategorie === 'format' ? 'btn-primary' : 'btn-outline-secondary'"
                          title="Format"
                          @click="bearbeitungPatch.kategorie = 'format'; bearbeitungPatch.bg = 'primary'; bearbeitungPatch.text = 'light'">
                          📋
                        </button>
                        <button
                          type="button"
                          class="btn"
                          :class="bearbeitungPatch.kategorie === 'inhalt' ? 'btn-primary' : 'btn-outline-secondary'"
                          title="Inhaltshinweis"
                          @click="bearbeitungPatch.kategorie = 'inhalt'">
                          🎭
                        </button>
                      </div>
                    </div>
                    <div class="col-12">
                      <span class="form-label small d-block mb-1">Hintergrund</span>
                      <div class="d-flex flex-wrap gap-1" role="radiogroup" aria-label="Hintergrundfarbe">
                        <button
                          v-for="f in hintergrundFarbenMeta"
                          :key="'ed-farbe-' + f.id"
                          type="button"
                          class="htbah-label-farbe-swatch"
                          :class="{ 'htbah-label-farbe-swatch--aktiv': farbeSwatchAktiv(bearbeitungPatch.bg, f.id) }"
                          :title="f.labelDe"
                          :aria-label="f.labelDe"
                          :aria-pressed="farbeSwatchAktiv(bearbeitungPatch.bg, f.id) ? 'true' : 'false'"
                          @click="setzeBearbeitungHintergrund(f.id)">
                          <span class="htbah-label-farbe-swatch-flaeche" :style="{ backgroundColor: f.hex }"></span>
                          <span class="htbah-label-farbe-swatch-label" :style="farbeSwatchLabelStil(f)">{{ f.labelDe }}</span>
                        </button>
                      </div>
                    </div>
                    <div class="col-6 col-md-auto">
                      <label class="form-label small mb-0">Text</label>
                      <select v-model="bearbeitungPatch.text" class="form-select form-select-sm">
                        <option value="light">Hell</option>
                        <option value="dark">Dunkel</option>
                      </select>
                    </div>
                    <div class="col-12 d-flex flex-wrap gap-2 align-items-center">
                      <span class="badge d-inline-flex align-items-center gap-1" :class="badgeKlasse(bearbeitungPatch)">
                        {{ bearbeitungPatch.name || 'Vorschau' }}
                      </span>
                      <button type="button" class="btn btn-sm btn-primary ms-auto" @click="speichereBearbeitung">Speichern</button>
                      <button type="button" class="btn btn-sm btn-outline-secondary" @click="abbrechenBearbeitung">Abbrechen</button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="d-flex flex-wrap align-items-center gap-2">
                    <span class="badge" :class="badgeKlasse(e)">{{ e.name }}</span>
                    <div class="ms-auto d-flex gap-2">
                      <button type="button" class="btn btn-link btn-sm p-0" @click="starteBearbeitung(e)">Bearbeiten</button>
                      <button type="button" class="btn btn-link btn-sm text-danger p-0" @click="labelLoeschen(e)">Entfernen</button>
                    </div>
                  </div>
                </template>
              </li>
            </ul>
            <p v-if="!eintraegeFuerGruppe(gruppe.kategorie).length" class="small text-body-secondary mb-0 ps-1">
              Noch keine Labels in dieser Gruppe.
            </p>
          </section>
        </template>
        <p v-else class="small text-body-secondary mb-3">Noch keine Labels im Katalog.</p>

        <div class="border-top pt-3">
          <div class="small fw-semibold mb-2">Neues Label</div>
          <div class="row g-2 align-items-end">
            <div class="col-auto">
              <span class="form-label small d-block mb-1">Typ</span>
              <div class="btn-group btn-group-sm" role="group" aria-label="Typ für neues Label">
                <button
                  type="button"
                  class="btn"
                  :class="neueKategorie === 'setting' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Setting / Epoche"
                  @click="setzeNeueKategorie('setting')">
                  🏰
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="neueKategorie === 'format' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Format"
                  @click="setzeNeueKategorie('format')">
                  📋
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="neueKategorie === 'inhalt' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Inhaltshinweis"
                  @click="setzeNeueKategorie('inhalt')">
                  🎭
                </button>
              </div>
            </div>
            <div class="col-12 col-md">
              <label class="form-label small mb-0" for="klv-neu-name">Name</label>
              <input
                id="klv-neu-name"
                v-model="neuerName"
                type="text"
                class="form-control form-control-sm"
                placeholder="z. B. Horror oder Lustig"
                autocomplete="off"
                @keydown.enter.prevent="labelHinzufuegen" />
            </div>
            <div class="col-12">
              <span class="form-label small d-block mb-1" id="klv-neu-bg-label">Hintergrund</span>
              <div class="d-flex flex-wrap gap-1" role="radiogroup" aria-labelledby="klv-neu-bg-label">
                <button
                  v-for="f in hintergrundFarbenMeta"
                  :key="'neu-farbe-' + f.id"
                  type="button"
                  class="htbah-label-farbe-swatch"
                  :class="{ 'htbah-label-farbe-swatch--aktiv': farbeSwatchAktiv(neuerBg, f.id) }"
                  :title="f.labelDe"
                  :aria-label="f.labelDe"
                  :aria-pressed="farbeSwatchAktiv(neuerBg, f.id) ? 'true' : 'false'"
                  @click="neuerBg = f.id">
                  <span class="htbah-label-farbe-swatch-flaeche" :style="{ backgroundColor: f.hex }"></span>
                  <span class="htbah-label-farbe-swatch-label" :style="farbeSwatchLabelStil(f)">{{ f.labelDe }}</span>
                </button>
              </div>
            </div>
            <div class="col-6 col-md-auto">
              <label class="form-label small mb-0" for="klv-neu-text">Text</label>
              <select id="klv-neu-text" v-model="neuerText" class="form-select form-select-sm">
                <option value="light">Hell</option>
                <option value="dark">Dunkel</option>
              </select>
            </div>
            <div class="col-12 d-flex flex-wrap align-items-center gap-2">
              <span
                class="badge"
                :class="badgeKlasse({ kategorie: neueKategorie, bg: neuerBg, text: neuerText, name: neuerName })">
                {{ neuerName || 'Vorschau' }}
              </span>
              <button type="button" class="btn btn-sm btn-primary ms-auto" :disabled="!neuerName.trim()" @click="labelHinzufuegen">
                Anlegen
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})();
