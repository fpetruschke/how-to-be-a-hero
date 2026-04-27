window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ZufallstabellenZeileModal = {
  name: 'ZufallstabellenZeileModal',
  components: {
    ParadeModal: window.HTBAH_KOMPONENTEN.ParadeModal,
  },
  props: {
    anlage: { type: Object, required: true },
    zeileModalTitel: { type: String, default: '' },
    eingebettet: { type: Boolean, default: false },
    randomSichtbar: { type: Boolean, default: true },
    zufallsgeneratorBereit: { type: Boolean, default: false },
    zufallNpcEpoche: { type: String, default: 'mittelalter' },
    zufallGegenstandEpoche: { type: String, default: 'mittelalter' },
    zufallGegenstandKleidung: { type: Boolean, default: true },
    zufallFraktionEpoche: { type: String, default: 'mittelalter' },
    zufallRaetselEpoche: { type: String, default: 'mittelalter' },
    pantheonNamenListe: { type: Array, default: () => [] },
    fraktionenMitNamen: { type: Array, default: () => [] },
    orteNamenListe: { type: Array, default: () => [] },
    speicherDeaktiviert: { type: Boolean, default: false },
    speicherHinweis: { type: String, default: '' },
    zeileQuillSession: { type: Number, default: 0 },
    zeileQuillHostRefFn: { type: Function, required: true },
  },
  emits: [
    'close',
    'save',
    'random',
    'media-upload',
    'media-remove',
    'media-set-primary',
    'media-open',
    'media-download',
    'update:zufallNpcEpoche',
    'update:zufallGegenstandEpoche',
    'update:zufallGegenstandKleidung',
    'update:zufallFraktionEpoche',
    'update:zufallRaetselEpoche',
  ],
  data() {
    return {
      modal: { ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten() },
      fraktionOrtEingabe: '',
    };
  },
  computed: {
    fensterStil() {
      return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this.modal);
    },
    vollbildIcon() {
      return this.modal.istVollbild ? 'close_fullscreen' : 'open_in_full';
    },
    entitaetGespeichert() {
      return !(Number.isInteger(this.anlage && this.anlage.index) && this.anlage.index < 0);
    },
  },
  watch: {
    'anlage.offen'(offen) {
      if (offen && !this.eingebettet) {
        this.$nextTick(() => this.initialisierePosition());
      } else if (!offen) {
        this.beendeZiehen();
        this.beendeResize();
        this.modal.istVollbild = false;
      }
      this.fraktionOrtEingabe = '';
    },
  },
  mounted() {
    window.addEventListener('resize', this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
    this.beendeZiehen();
    this.beendeResize();
  },
  methods: {
    ermittleViewportGroesse() {
      return window.HTBAH_MODAL_FENSTER.utils.ermittleViewportGroesse();
    },
    begrenzeFensterGroesse(breite, hoehe) {
      return window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(breite, hoehe, 360, 300);
    },
    initialisierePosition() {
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      if (this.modal.breite == null || this.modal.hoehe == null) {
        const groesse = this.begrenzeFensterGroesse(fenster.offsetWidth, fenster.offsetHeight);
        this.modal.breite = groesse.breite;
        this.modal.hoehe = groesse.hoehe;
      }
      if (this.modal.positionX == null || this.modal.positionY == null) {
        const v = this.ermittleViewportGroesse();
        this.modal.positionX = Math.max(0, Math.round((v.viewportBreite - this.modal.breite) / 2));
        this.modal.positionY = Math.max(0, Math.round((v.viewportHoehe - this.modal.hoehe) / 2));
      }
      this.stelleSichtbaresFensterSicher();
    },
    stelleSichtbaresFensterSicher() {
      if (this.modal.istVollbild || this.modal.breite == null || this.modal.hoehe == null) {
        return;
      }
      const groesse = this.begrenzeFensterGroesse(this.modal.breite, this.modal.hoehe);
      this.modal.breite = groesse.breite;
      this.modal.hoehe = groesse.hoehe;
      const pos = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(
        this.modal.positionX || 0,
        this.modal.positionY || 0,
        this.modal.breite,
        this.modal.hoehe,
      );
      this.modal.positionX = pos.x;
      this.modal.positionY = pos.y;
    },
    starteZiehen(event) {
      if (this.modal.istVollbild || (event.target && event.target.closest('button, a, input, select, textarea'))) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      const rechteck = fenster.getBoundingClientRect();
      this.modal.ziehenAktiv = true;
      this.modal.ziehOffsetX = event.clientX - rechteck.left;
      this.modal.ziehOffsetY = event.clientY - rechteck.top;
      window.addEventListener('pointermove', this.beimZiehen);
      window.addEventListener('pointerup', this.beendeZiehen);
      window.addEventListener('pointercancel', this.beendeZiehen);
      event.preventDefault();
    },
    beimZiehen(event) {
      if (!this.modal.ziehenAktiv || this.modal.istVollbild || this.modal.breite == null || this.modal.hoehe == null) {
        return;
      }
      this.modal.positionX = event.clientX - this.modal.ziehOffsetX;
      this.modal.positionY = event.clientY - this.modal.ziehOffsetY;
      this.stelleSichtbaresFensterSicher();
    },
    beendeZiehen() {
      this.modal.ziehenAktiv = false;
      window.removeEventListener('pointermove', this.beimZiehen);
      window.removeEventListener('pointerup', this.beendeZiehen);
      window.removeEventListener('pointercancel', this.beendeZiehen);
    },
    starteResize(event) {
      if (this.modal.istVollbild) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      const fenster = this.$refs.fensterElement;
      if (!fenster) {
        return;
      }
      this.modal.resizeAktiv = true;
      this.modal.resizeStartX = event.clientX;
      this.modal.resizeStartY = event.clientY;
      this.modal.resizeStartBreite = this.modal.breite != null ? this.modal.breite : fenster.offsetWidth;
      this.modal.resizeStartHoehe = this.modal.hoehe != null ? this.modal.hoehe : fenster.offsetHeight;
      window.addEventListener('pointermove', this.beimResize);
      window.addEventListener('pointerup', this.beendeResize);
      window.addEventListener('pointercancel', this.beendeResize);
      event.preventDefault();
    },
    beimResize(event) {
      if (!this.modal.resizeAktiv || this.modal.istVollbild) {
        return;
      }
      const neueBreite = this.modal.resizeStartBreite + (event.clientX - this.modal.resizeStartX);
      const neueHoehe = this.modal.resizeStartHoehe + (event.clientY - this.modal.resizeStartY);
      const groesse = this.begrenzeFensterGroesse(neueBreite, neueHoehe);
      this.modal.breite = groesse.breite;
      this.modal.hoehe = groesse.hoehe;
      this.stelleSichtbaresFensterSicher();
    },
    beendeResize() {
      this.modal.resizeAktiv = false;
      window.removeEventListener('pointermove', this.beimResize);
      window.removeEventListener('pointerup', this.beendeResize);
      window.removeEventListener('pointercancel', this.beendeResize);
    },
    vollbildUmschalten() {
      this.modal.istVollbild = !this.modal.istVollbild;
      if (!this.modal.istVollbild) {
        this.$nextTick(() => this.stelleSichtbaresFensterSicher());
      }
    },
    onResize() {
      this.$nextTick(() => this.stelleSichtbaresFensterSicher());
    },
    fraktionOrtHinzufuegen() {
      if (!this.anlage || this.anlage.typ !== 'fraktion' || !this.anlage.zeile) {
        return;
      }
      const ort = String(this.fraktionOrtEingabe || '').trim();
      if (!ort) {
        return;
      }
      const liste = Array.isArray(this.anlage.zeile.orte) ? this.anlage.zeile.orte : [];
      if (!liste.includes(ort)) {
        this.anlage.zeile.orte = [...liste, ort];
      }
      this.fraktionOrtEingabe = '';
    },
    fraktionOrtEntfernen(index) {
      if (!this.anlage || this.anlage.typ !== 'fraktion' || !this.anlage.zeile) {
        return;
      }
      if (!Array.isArray(this.anlage.zeile.orte)) {
        return;
      }
      if (index < 0 || index >= this.anlage.zeile.orte.length) {
        return;
      }
      this.anlage.zeile.orte.splice(index, 1);
    },
    bestieFraktionAktiv(fraktionsName) {
      const liste = Array.isArray(this.anlage && this.anlage.zeile && this.anlage.zeile.fraktionen)
        ? this.anlage.zeile.fraktionen
        : [];
      return liste.includes(fraktionsName);
    },
    bestieFraktionUmschalten(fraktionsName) {
      if (!this.anlage || this.anlage.typ !== 'bestie' || !this.anlage.zeile || !fraktionsName) {
        return;
      }
      const liste = Array.isArray(this.anlage.zeile.fraktionen) ? this.anlage.zeile.fraktionen.slice() : [];
      const index = liste.indexOf(fraktionsName);
      if (index >= 0) {
        liste.splice(index, 1);
      } else {
        liste.push(fraktionsName);
      }
      this.anlage.zeile.fraktionen = liste;
    },
    berechneHandelnFuerInitiative() {
      if (!this.anlage || !this.anlage.zeile) {
        return 0;
      }
      const handeln = Math.round(Number(this.anlage.zeile.handeln) || 0);
      return Math.max(0, Math.min(40, handeln));
    },
    initiativeWuerfelnFuerZeile() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const handeln = this.berechneHandelnFuerInitiative();
      const gesamt = window.HTBAH.wuerfelW10() + handeln;
      window.HTBAH.spieleWuerfelSounds(1);
      const max = 10 + handeln;
      this.anlage.zeile.initiative = String(Math.max(1, Math.min(max, gesamt)));
    },
    async initiativeZuruecksetzen() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const hatWert = String(this.anlage.zeile.initiative || '').trim();
      if (!hatWert) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Initiative zurücksetzen?',
        beschreibung: 'Ist der Kampf wirklich schon vorbei?',
        bestaetigenText: 'Zurücksetzen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: false,
      });
      if (!bestaetigt) {
        return;
      }
      this.anlage.zeile.initiative = '';
    },
    paradeModalOeffnenFuerZeile() {
      if (!this.anlage || !this.anlage.zeile) {
        return;
      }
      const basiswert = this.berechneHandelnFuerInitiative();
      const titelTeil = this.anlage.typ === 'bestie' ? 'Bestie' : 'NPC';
      this.$refs.paradeModal?.oeffnen({
        titel: `Parade-Probe (${titelTeil})`,
        basiswert,
        ruestungen: [],
      });
    },
  },
  template: `
    <div v-if="anlage.offen && anlage.zeile" class="regelwerk-modal-layer">
      <div
        ref="fensterElement"
        class="regelwerk-modal-window card shadow"
        :class="{ 'regelwerk-modal-window-fullscreen': modal.istVollbild }"
        :style="fensterStil">
        <div class="regelwerk-modal-header d-flex justify-content-between align-items-center p-2" @pointerdown="starteZiehen">
          <strong>{{ zeileModalTitel }}</strong>
          <div class="d-flex align-items-center gap-2">
            <button
              v-if="randomSichtbar"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="!zufallsgeneratorBereit"
              @click="$emit('random')">
              Zufallsvorschlag
            </button>
            <button type="button" class="regelwerk-icon-button" @click="vollbildUmschalten">
              <span class="material-symbols-outlined">{{ vollbildIcon }}</span>
            </button>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>
        </div>
        <div class="card-body py-2 small" style="max-height:70vh; overflow:auto;">
        <template v-if="anlage.typ === 'npc'">
          <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1">Epoche für Zufallsvorschlag</label>
              <select class="form-select form-select-sm" :value="zufallNpcEpoche" @change="$emit('update:zufallNpcEpoche', $event.target.value)">
                <option value="mittelalter">Mittelalter</option>
                <option value="gegenwart">Gegenwart</option>
                <option value="zukunft">Zukunft</option>
              </select>
            </div>
          </div>
          <div class="row g-2">
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.spitzname" placeholder=" " /><label>Spitzname</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.geschlecht" placeholder=" " /><label>Geschlecht</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.alter" placeholder=" " /><label>Alter</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.familienstand" placeholder=" " /><label>Familienstand</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.statur" placeholder=" " /><label>Statur</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.lebenspunkte" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Lebenspunkte</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.handeln" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Handeln (0-40)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.wissen" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Wissen (0-40)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.soziales" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Soziales (0-40)</label></div></div>
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1">Initiative</label>
              <div class="input-group">
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  :max="10 + Math.max(0, Math.min(40, Math.round(Number(anlage.zeile.handeln) || 0)))"
                  v-model="anlage.zeile.initiative"
                  placeholder="z. B. 14"
                  inputmode="numeric"
                  autocomplete="off" />
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  @click="initiativeWuerfelnFuerZeile">
                  🎲
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="!String(anlage.zeile.initiative || '').trim()"
                  @click="initiativeZuruecksetzen">
                  Reset
                </button>
              </div>
              <div class="mt-2">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm w-100"
                  @click="paradeModalOeffnenFuerZeile">
                  🛡️ Parieren
                </button>
              </div>
              <div class="form-text">Gültig: 1 bis {{ 10 + Math.max(0, Math.min(40, Math.round(Number(anlage.zeile.handeln) || 0))) }} (1W10 + Handeln).</div>
            </div>
            <div class="col-12">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="anlage.zeile.lpBewusstlosAusgeblendet" id="wb-npc-ausblenden" />
                <label class="form-check-label small" for="wb-npc-ausblenden">Bewusstlos-Status aus LP-Bereich ausblenden</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="anlage.zeile.lpMassenschadenBewusstlos" id="wb-npc-massen" />
                <label class="form-check-label small" for="wb-npc-massen">Bewusstlos durch Massenschaden erzwingen</label>
              </div>
            </div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.gesinnung" placeholder=" " /><label>Gesinnung</label></div></div>
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1" for="wb-zfn-glaube">Glaube</label>
              <input id="wb-zfn-glaube" class="form-control" v-model="anlage.zeile.glaube" :list="pantheonNamenListe.length ? 'wb-zfn-glaube-datalist' : undefined" placeholder="Leer, aus Liste wählen oder Freitext" autocomplete="off" />
              <datalist v-if="pantheonNamenListe.length" id="wb-zfn-glaube-datalist">
                <option v-for="n in pantheonNamenListe" :key="'wb-pg-' + n" :value="n"></option>
              </datalist>
            </div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.beruf" placeholder=" " /><label>Beruf</label></div></div>
            <div class="col-md-6"><label class="form-label small text-secondary mb-1">Fraktion</label><select class="form-select" v-model="anlage.zeile.fraktion"><option value="">— keine —</option><option v-for="f in fraktionenMitNamen" :key="f.id" :value="f.name">{{ f.name }}</option></select></div>
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1" for="wb-zfn-ort">Aufenthaltsort</label>
              <input
                id="wb-zfn-ort"
                class="form-control"
                v-model="anlage.zeile.aufenthaltsort"
                :list="orteNamenListe.length ? 'wb-zfn-ort-datalist' : undefined"
                placeholder="Ort wählen oder Freitext"
                autocomplete="off" />
              <datalist v-if="orteNamenListe.length" id="wb-zfn-ort-datalist">
                <option v-for="ort in orteNamenListe" :key="'wb-zfn-ort-' + ort" :value="ort"></option>
              </datalist>
            </div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.geheimnis" placeholder=" " /><label>Geheimnis</label></div></div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.ziel" placeholder=" " /><label>Ziel (z. B. Wohlstand, Lebenswandel)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.stimme" placeholder=" " /><label>Stimme</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.waffe" placeholder=" " /><label>Waffe</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertNahkampf" placeholder=" " autocomplete="off" /><label>Schadenswert Nahkampf</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertFernkampf" placeholder=" " autocomplete="off" /><label>Schadenswert Fernkampf</label></div></div>
          </div>
        </template>
        <template v-else-if="anlage.typ === 'ort'">
          <div class="row g-2">
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.groesse" placeholder=" " /><label>Größe</label></div></div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.lage" placeholder=" " /><label>Lage (z. B. Wald, Hafenstadt, Fluss, Insel)</label></div></div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.zustand" placeholder=" " /><label>Zustand (z. B. zerstört, intakt, florierend)</label></div></div>
          </div>
        </template>
        <template v-else-if="anlage.typ === 'fraktion'">
          <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1">Epoche für Namensvorschlag</label>
              <select class="form-select form-select-sm" :value="zufallFraktionEpoche" @change="$emit('update:zufallFraktionEpoche', $event.target.value)">
                <option value="mittelalter">Mittelalter</option>
                <option value="gegenwart">Gegenwart</option>
                <option value="zukunft">Zukunft</option>
              </select>
            </div>
          </div>
          <div class="row g-2">
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.art" placeholder=" " /><label>Art (z. B. Gilde, Partei, Bande)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div></div>
            <div class="col-12">
              <label class="form-label small text-secondary mb-1">Zugeordnete Orte (Mehrfachauswahl)</label>
              <div class="input-group">
                <input
                  class="form-control"
                  v-model="fraktionOrtEingabe"
                  :list="orteNamenListe.length ? 'zst-fraktion-orte-datalist' : undefined"
                  placeholder="Ort wählen oder frei eingeben"
                  autocomplete="off"
                  @keydown.enter.prevent="fraktionOrtHinzufuegen" />
                <button type="button" class="btn btn-outline-secondary" @click="fraktionOrtHinzufuegen">
                  Hinzufügen
                </button>
              </div>
              <datalist v-if="orteNamenListe.length" id="zst-fraktion-orte-datalist">
                <option v-for="ort in orteNamenListe" :key="'zst-fraktion-ort-' + ort" :value="ort"></option>
              </datalist>
              <div class="d-flex flex-wrap gap-1 mt-2">
                <span
                  v-for="(ort, ortIndex) in (anlage.zeile.orte || [])"
                  :key="'fraktion-ort-chip-' + ort + '-' + ortIndex"
                  class="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                  {{ ort }}
                  <button
                    type="button"
                    class="btn-close btn-close-white"
                    aria-label="Ort entfernen"
                    style="font-size: .6rem;"
                    @click="fraktionOrtEntfernen(ortIndex)"></button>
                </span>
              </div>
            </div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.ziel" placeholder=" " /><label>Ziel</label></div></div>
            <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:5rem" v-model="anlage.zeile.gesinnungVerhalten" placeholder=" "></textarea><label>Gesinnung / Verhalten</label></div></div>
          </div>
        </template>
        <template v-else-if="anlage.typ === 'pantheon'">
          <div class="row g-2">
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.geschlecht" placeholder=" " /><label>Geschlecht / Darstellung</label></div></div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.domaene" placeholder=" " /><label>Wofür steht die Gottheit (Domäne)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.charakter" placeholder=" "></textarea><label>Charakter (z. B. rachsüchtig, gütig)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.staerke" placeholder=" "></textarea><label>Stärken</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.schwaeche" placeholder=" "></textarea><label>Schwächen</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.schutzpatronat" placeholder=" "></textarea><label>Schutzpatronat (wer / was)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.verlangen" placeholder=" "></textarea><label>Was verlangt sie (Opfer, Gebote)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.mythosGaben" placeholder=" "></textarea><label>Mythos: Was wird erzählt, dass sie geben würde</label></div></div>
          </div>
        </template>
        <template v-else-if="anlage.typ === 'raetsel'">
          <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1">Epoche für Zufallsvorschlag</label>
              <select class="form-select form-select-sm" :value="zufallRaetselEpoche" @change="$emit('update:zufallRaetselEpoche', $event.target.value)">
                <option value="mittelalter">Mittelalter</option>
                <option value="gegenwart">Gegenwart</option>
                <option value="zukunft">Zukunft</option>
              </select>
            </div>
            <div class="col-md-6 small text-secondary align-self-end">
              Namen aus den Tabellen „Orte“ und „NPCs“ können im Ergebnistext vorkommen, wenn Einträge existieren.
            </div>
          </div>
          <div class="row g-2">
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.art" placeholder=" " /><label>Art (z. B. Licht- & Spiegelpuzzle)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.titel" placeholder=" " /><label>Titel / Stichwort</label></div></div>
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1" for="wb-zr-ort">Aufenthaltsort (optional)</label>
              <input
                id="wb-zr-ort"
                class="form-control"
                v-model="anlage.zeile.aufenthaltsort"
                :list="orteNamenListe.length ? 'wb-zr-ort-datalist' : undefined"
                placeholder="Ort wählen oder Freitext"
                autocomplete="off" />
              <datalist v-if="orteNamenListe.length" id="wb-zr-ort-datalist">
                <option v-for="ort in orteNamenListe" :key="'wb-zr-ort-' + ort" :value="ort"></option>
              </datalist>
            </div>
            <div class="col-md-6 d-flex align-items-center">
              <div class="form-check form-switch mt-2">
                <input class="form-check-input" type="checkbox" role="switch" v-model="anlage.zeile.geloest" id="wb-zr-geloest" />
                <label class="form-check-label" for="wb-zr-geloest">Rätsel gelöst</label>
              </div>
            </div>
            <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.aufgabeWas" placeholder=" "></textarea><label>Was könnte die Aufgabe sein?</label></div></div>
            <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.aufgabenstellung" placeholder=" "></textarea><label>Wie könnte die Aufgabenstellung lauten?</label></div></div>
            <div class="col-12"><div class="form-floating"><textarea class="form-control" style="height:4rem" v-model="anlage.zeile.ergebnis" placeholder=" "></textarea><label>Ergebnis (Himmelsrichtung, Ort, Person, Tageszeit …)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schwierigkeit" placeholder=" " /><label>Schwierigkeit</label></div></div>
          </div>
        </template>
        <template v-else-if="anlage.typ === 'bestie'">
          <div class="row g-2">
            <div class="col-md-6"><label class="form-label small text-secondary mb-1">Epoche</label><select class="form-select" v-model="anlage.zeile.epoche"><option value="mittelalter">Mittelalter</option><option value="gegenwart">Gegenwart</option><option value="zukunft">Zukunft</option></select></div>
            <div class="col-md-6"><label class="form-label small text-secondary mb-1">Kategorie</label><select class="form-select" v-model="anlage.zeile.kategorie"><option value="normales_tier">Normales Tier</option><option value="fantasy_tier">Magisch / Fantasy</option><option value="mutiert">Mutiert</option><option value="monster">Monster</option></select></div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name der Bestie</label></div></div>
            <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.angriff" placeholder=" " autocomplete="off" /><label>Angriff</label></div></div>
            <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.verteidigung" placeholder=" " autocomplete="off" /><label>Verteidigung</label></div></div>
            <div class="col-md-4"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.lebenspunkte" placeholder=" " autocomplete="off" /><label>Lebenspunkte</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.waffe" placeholder=" " /><label>Waffe</label></div></div>
            <div class="col-md-3"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertNahkampf" placeholder=" " autocomplete="off" /><label>Schaden NK</label></div></div>
            <div class="col-md-3"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertFernkampf" placeholder=" " autocomplete="off" /><label>Schaden FK</label></div></div>
            <div class="col-md-4"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.handeln" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Handeln (0-40)</label></div></div>
            <div class="col-md-4"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.wissen" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Wissen (0-40)</label></div></div>
            <div class="col-md-4"><div class="form-floating"><input class="form-control" type="number" min="0" max="40" v-model.number="anlage.zeile.soziales" placeholder=" " inputmode="numeric" autocomplete="off" /><label>Begabung Soziales (0-40)</label></div></div>
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1">Initiative</label>
              <div class="input-group">
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  :max="10 + Math.max(0, Math.min(40, Math.round(Number(anlage.zeile.handeln) || 0)))"
                  v-model="anlage.zeile.initiative"
                  placeholder="z. B. 11"
                  inputmode="numeric"
                  autocomplete="off" />
                <button
                  type="button"
                  class="btn btn-outline-primary"
                  @click="initiativeWuerfelnFuerZeile">
                  🎲
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="!String(anlage.zeile.initiative || '').trim()"
                  @click="initiativeZuruecksetzen">
                  Reset
                </button>
              </div>
              <div class="mt-2">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm w-100"
                  @click="paradeModalOeffnenFuerZeile">
                  🛡️ Parieren
                </button>
              </div>
              <div class="form-text">Gültig: 1 bis {{ 10 + Math.max(0, Math.min(40, Math.round(Number(anlage.zeile.handeln) || 0))) }} (1W10 + Handeln).</div>
            </div>
            <div class="col-12">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="anlage.zeile.lpBewusstlosAusgeblendet" id="wb-bestie-ausblenden" />
                <label class="form-check-label small" for="wb-bestie-ausblenden">Bewusstlos-Status aus LP-Bereich ausblenden</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="anlage.zeile.lpMassenschadenBewusstlos" id="wb-bestie-massen" />
                <label class="form-check-label small" for="wb-bestie-massen">Bewusstlos durch Massenschaden erzwingen</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label small text-secondary mb-1" for="wb-zb-ort">Aufenthaltsort</label>
              <input
                id="wb-zb-ort"
                class="form-control"
                v-model="anlage.zeile.aufenthaltsort"
                :list="orteNamenListe.length ? 'wb-zb-ort-datalist' : undefined"
                placeholder="Ort wählen oder Freitext"
                autocomplete="off" />
              <datalist v-if="orteNamenListe.length" id="wb-zb-ort-datalist">
                <option v-for="ort in orteNamenListe" :key="'wb-zb-ort-' + ort" :value="ort"></option>
              </datalist>
            </div>
            <div class="col-12"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.geheimnis" placeholder=" " /><label>Geheimnis</label></div></div>
            <div class="col-12">
              <label class="form-label small text-secondary mb-1">Fraktionen</label>
              <div v-if="fraktionenMitNamen.length" class="d-flex flex-wrap gap-2">
                <button
                  v-for="f in fraktionenMitNamen"
                  :key="'bestie-fraktion-chip-' + f.id"
                  type="button"
                  class="btn btn-sm"
                  :class="bestieFraktionAktiv(f.name) ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="bestieFraktionUmschalten(f.name)">
                  {{ f.name }}
                </button>
              </div>
              <div v-else class="small text-body-secondary">Keine Fraktionen vorhanden.</div>
              <div class="form-text">Mehrfachauswahl per Tap/Klick auf die Chips.</div>
            </div>
            <div class="col-12">
              <label class="form-label small text-secondary mb-1">
                Aggressivität und Offensive (Skala 1 = sehr defensiv / scheu, 10 = sehr aggressiv und offensiv)
              </label>
              <div class="d-flex align-items-center gap-3">
                <input type="range" class="form-range flex-grow-1" min="1" max="10" step="1" v-model.number="anlage.zeile.aggressivitaetSkala" />
                <span class="small text-nowrap text-secondary" style="min-width: 3.5rem">{{ Math.min(10, Math.max(1, Math.round(Number(anlage.zeile.aggressivitaetSkala) || 1))) }} / 10</span>
              </div>
            </div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.staerke" placeholder=" "></textarea><label>Stärken (optional)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><textarea class="form-control" style="height:4.5rem" v-model="anlage.zeile.schwaeche" placeholder=" "></textarea><label>Schwächen (optional)</label></div></div>
          </div>
        </template>
        <template v-else-if="anlage.typ === 'gegenstand'">
          <div class="row g-2 mb-2 align-items-end" v-if="randomSichtbar">
            <div class="col-md-6">
              <label class="form-label small text-secondary mb-1">Epoche für Zufallsvorschlag</label>
              <select class="form-select form-select-sm" :value="zufallGegenstandEpoche" @change="$emit('update:zufallGegenstandEpoche', $event.target.value)">
                <option value="mittelalter">Mittelalter</option>
                <option value="gegenwart">Gegenwart</option>
                <option value="zukunft">Zukunft</option>
              </select>
            </div>
            <div class="col-md-6"><div class="form-check mt-3"><input class="form-check-input" type="checkbox" :checked="zufallGegenstandKleidung" @change="$emit('update:zufallGegenstandKleidung', $event.target.checked)" id="wb-zg-kleid" /><label class="form-check-label small" for="wb-zg-kleid">Kleidung als Kategorie zulassen</label></div></div>
          </div>
          <div class="form-floating mb-3"><input class="form-control" v-model="anlage.zeile.name" placeholder=" " /><label>Name</label></div>
          <label class="form-label small text-secondary mb-1" for="wb-zg-ort">Aufenthaltsort</label>
          <input
            id="wb-zg-ort"
            class="form-control mb-3"
            v-model="anlage.zeile.aufenthaltsort"
            :list="orteNamenListe.length ? 'wb-zg-ort-datalist' : undefined"
            placeholder="Ort wählen oder Freitext"
            autocomplete="off" />
          <datalist v-if="orteNamenListe.length" id="wb-zg-ort-datalist">
            <option v-for="ort in orteNamenListe" :key="'wb-zg-ort-' + ort" :value="ort"></option>
          </datalist>
          <label class="form-label small text-secondary mb-1">Initiative</label>
          <div class="input-group mb-3">
            <input
              class="form-control"
              type="number"
              min="1"
              max="50"
              v-model="anlage.zeile.initiative"
              placeholder="z. B. 9"
              inputmode="numeric"
              autocomplete="off" />
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="!String(anlage.zeile.initiative || '').trim()"
              @click="anlage.zeile.initiative = ''">
              Leeren
            </button>
          </div>
          <div class="form-check mb-3"><input class="form-check-input" type="checkbox" v-model="anlage.zeile.istWaffe" id="wb-zg-waffe" /><label class="form-check-label" for="wb-zg-waffe">Waffe</label></div>
          <div class="row g-2 mb-1 align-items-end" v-if="anlage.zeile.istWaffe">
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertNahkampf" placeholder=" " autocomplete="off" /><label>Schadenswert Nahkampf (z. B. 2W10+1)</label></div></div>
            <div class="col-md-6"><div class="form-floating"><input class="form-control" v-model="anlage.zeile.schadenswertFernkampf" placeholder=" " autocomplete="off" /><label>Schadenswert Fernkampf (z. B. 3W10)</label></div></div>
          </div>
        </template>

        <div class="mt-3 mb-3">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <label class="form-label mb-0">Medien & Dateien (Schritt 2)</label>
            <label v-if="entitaetGespeichert" class="btn btn-sm btn-outline-secondary mb-0">
              Hochladen
              <input type="file" class="d-none" multiple @change="$emit('media-upload', $event)" />
            </label>
          </div>
          <div v-if="!entitaetGespeichert" class="alert alert-info py-2 small">
            Schritt 1: Entität zuerst speichern. Schritt 2: Danach kannst Du hier Dateien/Bilder anhängen.
          </div>
          <div v-if="!(anlage.zeile.medien || []).length" class="text-secondary small">Noch keine Medien.</div>
          <div v-else class="row g-2">
            <div v-for="(medium, mediumIndex) in (anlage.zeile.medien || [])" :key="'wb-bearbeitung-medium-' + medium.id" class="col-12 col-md-6">
              <div class="border rounded p-2 h-100 zufallstabellen-medium-karte">
                <button
                  v-if="typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/')"
                  type="button"
                  class="zufallstabellen-medium-thumb-button mb-2"
                  @click="$emit('media-open', medium)">
                  <img :src="medium.dataUrl" :alt="medium.name || 'Bild'" />
                </button>
                <div class="small">
                  <div class="fw-semibold">{{ medium.name || 'Datei' }}</div>
                  <div class="text-secondary">{{ medium.mimeType || 'Datei' }}</div>
                  <div v-if="Number.isFinite(medium.size)" class="text-secondary">{{ Math.round(medium.size / 1024) }} KiB</div>
                </div>
                <div class="d-flex gap-2 mt-2">
                  <button
                    v-if="typeof medium.dataUrl === 'string' && medium.dataUrl.startsWith('data:image/')"
                    type="button"
                    class="btn btn-sm"
                    :class="anlage.zeile.primaryMediumId === medium.id ? 'btn-primary' : 'btn-outline-primary'"
                    @click="$emit('media-set-primary', medium.id)">
                    {{ anlage.zeile.primaryMediumId === medium.id ? 'Titelbild' : 'Als Titelbild' }}
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="$emit('media-download', medium)">Download</button>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="$emit('media-remove', mediumIndex)">Entfernen</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <label class="form-label mt-3 mb-1" v-if="anlage.typ === 'npc'">Notizen</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'pantheon'">Notizen & Mythos</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'raetsel'">Aufgabe, Spielleitung & Notizen</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'bestie'">Lebensraum, Lebensweise und Legende</label>
        <label class="form-label mt-3 mb-1" v-else-if="anlage.typ === 'ort'">Beschreibung / Notizen</label>
        <label class="form-label mt-3 mb-1" v-else>Beschreibung</label>
        <div class="zufallstabellen-quill-wrap" :key="'wb-zeile-q-' + zeileQuillSession">
          <div :ref="zeileQuillHostRefFn" class="quill-editor-host zufallstabellen-quill-host"></div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="$emit('close')">Abbrechen</button>
          <button type="button" class="btn btn-sm btn-primary" :disabled="speicherDeaktiviert" @click="$emit('save')">Speichern</button>
        </div>
        <div v-if="speicherHinweis" class="form-text text-end mt-1">{{ speicherHinweis }}</div>
        </div>
        <parade-modal ref="paradeModal" />
        <div
          v-if="!modal.istVollbild"
          class="regelwerk-modal-resize-handle"
          role="presentation"
          aria-hidden="true"
          @pointerdown="starteResize"></div>
      </div>
    </div>
  `,
};
