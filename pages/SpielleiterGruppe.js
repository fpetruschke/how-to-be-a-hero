window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.SpielleiterGruppe = {
  components: {
    Charakter: window.HTBAH_SEITEN.Charakter,
  },
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      aktivesMitgliedId: null,
      statusMeldung: '',
    };
  },
  computed: {
    gruppeId() {
      return this.$route.params.gruppeId || '';
    },
    aktiveGruppe() {
      return this.zustand.gruppen.find((g) => g.id === this.gruppeId) || null;
    },
    aktivesMitglied() {
      const g = this.aktiveGruppe;
      if (!g || !this.aktivesMitgliedId) {
        return null;
      }
      return g.mitglieder.find((m) => m.id === this.aktivesMitgliedId) || null;
    },
  },
  watch: {
    gruppeId: {
      immediate: true,
      handler() {
        this.syncAusRoute();
      },
    },
    aktivesMitglied(m) {
      if (m) {
        return;
      }
      window.HTBAH.syncLebenspunkteStatusFromCharakter(null);
    },
  },
  mounted() {
    window.HTBAH._spielleiterAnsichtAktiv = true;
    window.HTBAH._spielleiterPersistFn = () => this.persist();
    if (!this.aktivesMitglied) {
      window.HTBAH.syncLebenspunkteStatusFromCharakter(null);
    }
  },
  beforeUnmount() {
    window.HTBAH._spielleiterAnsichtAktiv = false;
    window.HTBAH._spielleiterPersistFn = null;
    window.HTBAH.syncLebenspunkteStatusFromCharakter(window.HTBAH.ladeCharakter());
  },
  methods: {
    syncAusRoute() {
      const gid = this.gruppeId;
      const z = window.HTBAH.ladeSpielleiterZustand();
      if (!gid || !z.gruppen.some((g) => g.id === gid)) {
        this.$router.replace('/spielleiter');
        return;
      }
      z.aktiveGruppeId = gid;
      this.zustand = z;
      const ag = z.gruppen.find((g) => g.id === gid);
      let aktivesMitgliedId = null;
      if (ag && ag.mitglieder.length) {
        const mid = z.mitgliedWahlProGruppe[gid];
        aktivesMitgliedId =
          mid && ag.mitglieder.some((m) => m.id === mid) ? mid : ag.mitglieder[0].id;
      }
      this.aktivesMitgliedId = aktivesMitgliedId;
    },
    persist() {
      window.HTBAH.speichereSpielleiterZustand(this.zustand);
    },
    zeigeStatus(text) {
      this.statusMeldung = text;
      window.clearTimeout(this._statusTimer);
      this._statusTimer = window.setTimeout(() => {
        this.statusMeldung = '';
      }, 3200);
    },
    charakterName(m) {
      const n = m && m.charakter && typeof m.charakter.name === 'string' ? m.charakter.name : '';
      return n.trim() || 'Ohne Namen';
    },
    beiGruppenwechsel() {
      const g = this.aktiveGruppe;
      if (!g || !g.mitglieder.length) {
        this.aktivesMitgliedId = null;
        this.persist();
        return;
      }
      const mid = this.zustand.mitgliedWahlProGruppe[g.id];
      if (mid && g.mitglieder.some((m) => m.id === mid)) {
        this.aktivesMitgliedId = mid;
      } else {
        this.aktivesMitgliedId = g.mitglieder[0].id;
        this.zustand.mitgliedWahlProGruppe[g.id] = this.aktivesMitgliedId;
      }
      this.persist();
    },
    waehleMitglied(id) {
      this.aktivesMitgliedId = id;
      if (this.aktiveGruppe) {
        this.zustand.mitgliedWahlProGruppe[this.aktiveGruppe.id] = id;
      }
      this.persist();
    },
    mitgliedEntfernen() {
      const g = this.aktiveGruppe;
      const m = this.aktivesMitglied;
      if (!g || !m) {
        return;
      }
      if (!window.confirm(`„${this.charakterName(m)}“ aus dieser Gruppe entfernen?`)) {
        return;
      }
      g.mitglieder = g.mitglieder.filter((x) => x.id !== m.id);
      this.beiGruppenwechsel();
      this.persist();
      this.zeigeStatus('Charakter entfernt.');
    },
    fuegeMitgliedHinzu(charakter, charakterBild) {
      const g = this.aktiveGruppe;
      if (!g) {
        return;
      }
      const mitglied = {
        id: window.HTBAH.neueEntropieId(),
        charakter,
        charakterBild: typeof charakterBild === 'string' ? charakterBild : '',
      };
      g.mitglieder.push(mitglied);
      this.aktivesMitgliedId = mitglied.id;
      this.zustand.mitgliedWahlProGruppe[g.id] = mitglied.id;
    },
    async importJsonDateien(event) {
      const input = event.target;
      const files = input.files;
      if (!files || !files.length) {
        return;
      }
      let importiert = 0;
      for (let i = 0; i < files.length; i++) {
        const datei = files[i];
        let text;
        try {
          text = await datei.text();
        } catch {
          alert(`Datei „${datei.name}“ konnte nicht gelesen werden.`);
          continue;
        }
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          alert(`„${datei.name}“ ist kein gültiges JSON.`);
          continue;
        }
        if (
          json &&
          json.typ === 'spielleiter_gruppe' &&
          Array.isArray(json.mitglieder)
        ) {
          for (let k = 0; k < json.mitglieder.length; k++) {
            const raw = json.mitglieder[k];
            if (!raw || typeof raw !== 'object') {
              continue;
            }
            const c = window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(raw.charakter);
            const bild = typeof raw.charakterBild === 'string' ? raw.charakterBild : '';
            this.fuegeMitgliedHinzu(c, bild);
            importiert += 1;
          }
          continue;
        }
        const stuecke = Array.isArray(json) ? json : [json];
        for (let j = 0; j < stuecke.length; j++) {
          const ergebnis = window.HTBAH.parseCharakterImportPaket(stuecke[j]);
          if (!ergebnis.ok) {
            alert(
              `„${datei.name}“${stuecke.length > 1 ? ` (Eintrag ${j + 1})` : ''}: ${ergebnis.fehler}`,
            );
            continue;
          }
          this.fuegeMitgliedHinzu(ergebnis.charakter, ergebnis.charakterBild);
          importiert += 1;
        }
      }
      input.value = '';
      this.persist();
      if (importiert) {
        this.zeigeStatus(
          importiert === 1 ? 'Ein Charakter importiert.' : `${importiert} Charaktere importiert.`,
        );
      }
    },
    exportGruppeJson() {
      const g = this.aktiveGruppe;
      if (!g || !g.mitglieder.length) {
        return;
      }
      const payload = {
        htbahExportVersion: 1,
        typ: 'spielleiter_gruppe',
        exportiertAm: new Date().toISOString(),
        name: g.name,
        mitglieder: g.mitglieder.map((m) => ({
          id: m.id,
          charakter: JSON.parse(JSON.stringify(m.charakter)),
          charakterBild: m.charakterBild || '',
        })),
      };
      const sicher = g.name.replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 64) || 'gruppe';
      window.HTBAH.dateiHerunterladenJson(payload, `htbah-gruppe-${sicher}.json`);
    },
  },
  template: `
    <div class="container content py-3">
      <nav class="mb-2" aria-label="Brotkrumen">
        <router-link to="/spielleiter" class="small text-decoration-none">
          ← Zurück zur Gruppenübersicht
        </router-link>
      </nav>

      <template v-if="aktiveGruppe">
      <h4 class="mb-1">👥 {{ aktiveGruppe.name }}</h4>
      <p class="small text-body-secondary mb-3">
        Charaktere per JSON importieren (Export vom Spieler), zwischen Helden wechseln und Werte bearbeiten.
      </p>

      <div class="card p-3 mb-3">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            :disabled="!aktiveGruppe.mitglieder.length"
            @click="exportGruppeJson">
            Gruppe als JSON exportieren
          </button>
          <label class="btn btn-sm btn-success mb-0">
            Charakterblätter importieren
            <input
              type="file"
              accept="application/json,.json"
              multiple
              class="d-none"
              @change="importJsonDateien" />
          </label>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <h6 class="mb-2">Charaktere in dieser Gruppe</h6>

        <div
          v-if="aktiveGruppe.mitglieder.length"
          class="htbah-sl-chips d-flex flex-nowrap gap-2 overflow-auto pb-1 mb-2"
          role="tablist"
          aria-label="Charakter wählen">
          <button
            v-for="m in aktiveGruppe.mitglieder"
            :key="m.id"
            type="button"
            class="btn btn-sm rounded-pill text-nowrap flex-shrink-0"
            :class="aktivesMitgliedId === m.id ? 'btn-primary' : 'btn-outline-primary'"
            role="tab"
            :aria-selected="aktivesMitgliedId === m.id"
            @click="waehleMitglied(m.id)">
            {{ charakterName(m) }}
          </button>
        </div>
        <p v-else class="small text-body-secondary mb-0">
          Noch keine Charaktere — nutze „Charakterblätter importieren“ (vom Spieler exportierte Datei).
        </p>

        <button
          v-if="aktivesMitglied"
          type="button"
          class="btn btn-outline-danger btn-sm"
          @click="mitgliedEntfernen">
          Aus Gruppe entfernen
        </button>
      </div>

      <charakter
        v-if="aktivesMitglied"
        :key="aktivesMitglied.id"
        :spielleiter-mitglied="aktivesMitglied"
        :on-spielleiter-persist="persist"
      />

      <div
        v-else-if="!aktiveGruppe.mitglieder.length"
        class="alert alert-secondary">
        Importiere einen Charakter, um das Blatt zu bearbeiten.
      </div>
      </template>

      <div v-if="!aktivesMitglied" class="abstandshalter" aria-hidden="true"></div>

      <teleport to="body">
        <div
          v-if="statusMeldung"
          class="htbah-erfolgs-toast alert alert-success alert-dismissible py-2 mb-0 text-center shadow"
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
