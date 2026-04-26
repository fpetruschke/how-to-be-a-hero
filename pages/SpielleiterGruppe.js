window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.SpielleiterGruppe = {
  components: {
    Charakter: window.HTBAH_SEITEN.Charakter,
  },
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      aktivesMitgliedId: null,
      zielGruppeId: '',
      verschiebeModalInstanz: null,
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
    andereGruppen() {
      const aktiveId = this.gruppeId;
      return this.zustand.gruppen.filter((g) => g.id !== aktiveId);
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
    if (this.verschiebeModalInstanz) {
      this.verschiebeModalInstanz.hide();
      this.verschiebeModalInstanz = null;
    }
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
      window.HTBAH.ui.notify({ text, typ: 'success' });
    },
    charakterName(m) {
      const n = m && m.charakter && typeof m.charakter.name === 'string' ? m.charakter.name : '';
      return n.trim() || 'Ohne Namen';
    },
    charakterBild(m) {
      return m && typeof m.charakterBild === 'string' ? m.charakterBild : '';
    },
    charakterZustandStatus(m) {
      const berechne =
        window.HTBAH && typeof window.HTBAH.berechneLebenspunkteStatus === 'function'
          ? window.HTBAH.berechneLebenspunkteStatus
          : null;
      if (!berechne) {
        return { tot: false, bewusstlos: false };
      }
      return berechne(m && m.charakter ? m.charakter : null);
    },
    charakterZustandEmoji(m) {
      const status = this.charakterZustandStatus(m);
      if (status.tot) {
        return '💀';
      }
      if (status.bewusstlos) {
        return '😵';
      }
      return '';
    },
    charakterZustandLabel(m) {
      const status = this.charakterZustandStatus(m);
      if (status.tot) {
        return 'Charakter ist tot';
      }
      if (status.bewusstlos) {
        return 'Charakter ist bewusstlos';
      }
      return '';
    },
    charakterStatusPillKlasse(m) {
      const status = this.charakterZustandStatus(m);
      if (status.tot) {
        return 'htbah-sl-pill-status-tot';
      }
      if (status.bewusstlos) {
        return 'htbah-sl-pill-status-bewusstlos';
      }
      return '';
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
    async mitgliedEntfernen() {
      const g = this.aktiveGruppe;
      const m = this.aktivesMitglied;
      if (!g || !m) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Mitglied entfernen?',
        beschreibung: `„${this.charakterName(m)}“ aus dieser Gruppe entfernen?`,
        bestaetigenText: 'Entfernen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }
      const alterIndex = g.mitglieder.findIndex((x) => x.id === m.id);
      g.mitglieder = g.mitglieder.filter((x) => x.id !== m.id);
      if (g.mitglieder.length) {
        const nextIndex = Math.min(Math.max(0, alterIndex), g.mitglieder.length - 1);
        const naechstes = g.mitglieder[nextIndex] || g.mitglieder[0];
        this.aktivesMitgliedId = naechstes ? naechstes.id : null;
        if (this.aktivesMitgliedId) {
          this.zustand.mitgliedWahlProGruppe[g.id] = this.aktivesMitgliedId;
        }
        this.persist();
        this.zeigeStatus('Charakter entfernt.');
        return;
      }
      this.aktivesMitgliedId = null;
      delete this.zustand.mitgliedWahlProGruppe[g.id];
      this.persist();
      const gruppeLoeschen = await window.HTBAH.ui.confirm({
        titel: 'Letztes Mitglied entfernt',
        beschreibung:
          `In der Gruppe „${g.name}“ sind keine Mitglieder mehr. Soll die Gruppe ebenfalls gelöscht werden?`,
        bestaetigenText: 'Gruppe löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!gruppeLoeschen) {
        this.zeigeStatus('Charakter entfernt. Die Gruppe bleibt leer bestehen.');
        return;
      }
      this.zustand.gruppen = this.zustand.gruppen.filter((eintrag) => eintrag.id !== g.id);
      delete this.zustand.mitgliedWahlProGruppe[g.id];
      this.persist();
      this.zeigeStatus('Letztes Mitglied entfernt und Gruppe gelöscht.');
      this.$router.replace('/spielleiter');
    },
    oeffneVerschiebenModal() {
      if (!this.aktivesMitglied || this.andereGruppen.length === 0 || !window.bootstrap) {
        return;
      }
      this.zielGruppeId = this.andereGruppen[0].id;
      this.$nextTick(() => {
        const el = this.$refs.verschiebeModalElement;
        if (!el) {
          return;
        }
        this.verschiebeModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.verschiebeModalInstanz.show();
      });
    },
    verschiebeMitgliedInAndereGruppe() {
      const quellGruppe = this.aktiveGruppe;
      const m = this.aktivesMitglied;
      if (!quellGruppe || !m) {
        return;
      }
      const zielGruppe = this.andereGruppen.find((g) => g.id === this.zielGruppeId) || null;
      if (!zielGruppe) {
        return;
      }

      quellGruppe.mitglieder = quellGruppe.mitglieder.filter((x) => x.id !== m.id);
      zielGruppe.mitglieder.push(m);
      this.zustand.mitgliedWahlProGruppe[zielGruppe.id] = m.id;

      const name = this.charakterName(m);
      this.beiGruppenwechsel();
      this.persist();

      if (this.verschiebeModalInstanz) {
        this.verschiebeModalInstanz.hide();
      }
      this.zeigeStatus(`„${name}“ wurde verschoben.`);
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
          await window.HTBAH.ui.alert({
            titel: 'Import fehlgeschlagen',
            beschreibung: `Datei „${datei.name}“ konnte nicht gelesen werden.`,
          });
          continue;
        }
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          await window.HTBAH.ui.alert({
            titel: 'Ungültige Datei',
            beschreibung: `„${datei.name}“ ist kein gültiges JSON.`,
          });
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
          const kandidaten = window.HTBAH.parseCharakterImportKandidaten(stuecke[j]);
          if (!kandidaten.length) {
            await window.HTBAH.ui.alert({
              titel: 'Import nicht möglich',
              beschreibung:
                `„${datei.name}“${stuecke.length > 1 ? ` (Eintrag ${j + 1})` : ''}: Kein importierbarer Charakter.`,
            });
            continue;
          }
          kandidaten.forEach((kandidat) => {
            this.fuegeMitgliedHinzu(kandidat.charakter, kandidat.charakterBild);
            importiert += 1;
          });
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
  },
  template: `
    <div class="container content py-3">
      <nav class="mb-2" aria-label="Brotkrumen">
        <router-link to="/spielleiter" class="htbah-back-link">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          <span>Zurück zur Übersicht</span>
        </router-link>
      </nav>

      <template v-if="aktiveGruppe">
      <h4 class="text-center mb-1 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">👥</span>
        <span>{{ aktiveGruppe.name }}</span>
      </h4>
      <p class="small text-body-secondary text-center mb-3">
        Charaktere per JSON importieren (Export vom Spieler), zwischen Helden wechseln und Werte bearbeiten.
      </p>

      <div class="alert alert-info mb-3">
        <p class="small mb-2">
          Charakterblätter als JSON importieren (Einzel-Export oder Komplett-Export).
        </p>
        <div class="form-floating">
          <input
            id="sl-gruppe-import"
            type="file"
            accept="application/json,.json"
            multiple
            class="form-control"
            @change="importJsonDateien" />
          <label for="sl-gruppe-import">Charakterblätter importieren</label>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <h6 class="mb-2">Charaktere in dieser Gruppe</h6>
        <ul
          v-if="aktiveGruppe.mitglieder.length"
          class="nav htbah-weltenbau-pill-tabs mb-2"
          role="tablist"
          aria-label="Charakter wählen">
          <li
            v-for="m in aktiveGruppe.mitglieder"
            :key="m.id"
            class="nav-item"
            role="presentation">
            <button
              type="button"
              class="nav-link htbah-weltenbau-pill-tab"
              :class="[{ active: aktivesMitgliedId === m.id }, charakterStatusPillKlasse(m)]"
              role="tab"
              :aria-selected="aktivesMitgliedId === m.id"
              @click="waehleMitglied(m.id)">
              <span class="htbah-pill-avatar-wrap">
                <img
                  v-if="charakterBild(m)"
                  :src="charakterBild(m)"
                  :alt="'Profilbild ' + charakterName(m)"
                  class="rounded-circle border"
                  style="width: 1rem; height: 1rem; object-fit: cover;" />
                <span v-else aria-hidden="true">🧙</span>
                <span
                  v-if="charakterZustandEmoji(m)"
                  class="htbah-charakter-zustand-overlay htbah-charakter-zustand-overlay--mini"
                  :aria-label="charakterZustandLabel(m)"
                  role="img">
                  {{ charakterZustandEmoji(m) }}
                </span>
              </span>
              <span>{{ charakterName(m) }}</span>
            </button>
          </li>
        </ul>

        <p v-else class="small text-body-secondary mb-0">
          Noch keine Charaktere — nutze „Charakterblätter importieren“ (vom Spieler exportierte Datei).
        </p>

        <div class="d-flex flex-wrap gap-2">
          <button
            v-if="aktivesMitglied && andereGruppen.length"
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="oeffneVerschiebenModal">
            In andere Gruppe verschieben
          </button>
          <button
            v-if="aktivesMitglied"
            type="button"
            class="btn btn-outline-danger btn-sm"
            @click="mitgliedEntfernen">
            Aus Gruppe entfernen
          </button>
        </div>
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
          ref="verschiebeModalElement"
          class="modal fade"
          id="spielleiterVerschiebenModal"
          tabindex="-1"
          aria-labelledby="spielleiterVerschiebenModalLabel"
          aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow">
              <div class="modal-header">
                <h5 class="modal-title" id="spielleiterVerschiebenModalLabel">
                  In andere Gruppe verschieben
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Schließen"></button>
              </div>
              <div class="modal-body">
                <label for="spielleiter-ziel-gruppe" class="form-label">
                  Zielgruppe auswählen
                </label>
                <select
                  id="spielleiter-ziel-gruppe"
                  class="form-select"
                  v-model="zielGruppeId">
                  <option v-for="g in andereGruppen" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
                <p class="small text-body-secondary mb-0 mt-2">
                  „{{ aktivesMitglied ? charakterName(aktivesMitglied) : '' }}“ nach
                  „{{ (andereGruppen.find((g) => g.id === zielGruppeId) || {}).name || '' }}“
                  verschieben?
                </p>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-bs-dismiss="modal">
                  Abbrechen
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="!zielGruppeId"
                  @click="verschiebeMitgliedInAndereGruppe">
                  Verschieben
                </button>
              </div>
            </div>
          </div>
        </div>
      </teleport>
    </div>
  `,
};
