window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.SpielleiterGruppe = {
  props: {
    eingebettet: { type: Boolean, default: false },
    kampagneId: { type: String, default: '' },
  },
  components: {
    Charakter: window.HTBAH_SEITEN.Charakter,
  },
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      lokaleCharaktere: [],
      ausgewaehlterLokalerCharakterId: '',
      aktivesMitgliedId: null,
      zielKampagneId: '',
      verschiebeModalInstanz: null,
    };
  },
  computed: {
    kampagneIdEffektiv() {
      if (typeof this.kampagneId === 'string' && this.kampagneId.trim()) {
        return this.kampagneId.trim();
      }
      const routeId = this.$route.params.kampagneId || '';
      if (routeId) {
        return routeId;
      }
      const slugRaw = this.$route.params.kampagneSlug;
      const slug = typeof slugRaw === 'string' ? decodeURIComponent(slugRaw) : '';
      if (slug && window.HTBAH && typeof window.HTBAH.kampagnenSlugAusName === 'function') {
        const kampagnen = Array.isArray(this.zustand && this.zustand.kampagnen)
          ? this.zustand.kampagnen
          : [];
        const gefunden = kampagnen.find(
          (k) => k && window.HTBAH.kampagnenSlugAusName(k.name) === slug,
        );
        if (gefunden && typeof gefunden.id === 'string' && gefunden.id) {
          return gefunden.id;
        }
      }
      const ausZustand =
        this.zustand && typeof this.zustand.aktiveKampagneId === 'string'
          ? this.zustand.aktiveKampagneId
          : '';
      if (ausZustand) {
        return ausZustand;
      }
      const ersteKampagne = Array.isArray(this.zustand && this.zustand.kampagnen)
        ? this.zustand.kampagnen[0]
        : null;
      return ersteKampagne && typeof ersteKampagne.id === 'string' ? ersteKampagne.id : '';
    },
    kampagneId() {
      return this.kampagneIdEffektiv;
    },
    aktiveKampagne() {
      return this.zustand.kampagnen.find((g) => g.id === this.kampagneId) || null;
    },
    aktivesMitglied() {
      const g = this.aktiveKampagne;
      if (!g || !this.aktivesMitgliedId) {
        return null;
      }
      return g.mitglieder.find((m) => m.id === this.aktivesMitgliedId) || null;
    },
    andereKampagnen() {
      const aktiveId = this.kampagneId;
      return this.zustand.kampagnen.filter((g) => g.id !== aktiveId);
    },
    verfuegbareLokaleCharaktere() {
      const g = this.aktiveKampagne;
      const mitglieder = Array.isArray(g && g.mitglieder) ? g.mitglieder : [];
      const belegteStorageIds = new Set(
        mitglieder
          .map((m) => (m && typeof m.charakterStorageId === 'string' ? m.charakterStorageId : ''))
          .filter(Boolean),
      );
      return this.lokaleCharaktere.filter((eintrag) => {
        if (!eintrag || typeof eintrag.id !== 'string') {
          return false;
        }
        return !belegteStorageIds.has(eintrag.id);
      });
    },
    hatLokaleCharaktere() {
      return this.verfuegbareLokaleCharaktere.length > 0;
    },
  },
  watch: {
    kampagneIdEffektiv: {
      immediate: true,
      handler(neu, alt) {
        if (neu && neu !== alt) {
          this.zustand = window.HTBAH.ladeSpielleiterZustand();
        }
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
    this.lokaleCharaktereNeuLaden();
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
      const z = window.HTBAH.ladeSpielleiterZustand();
      const gid = this.kampagneIdEffektiv;
      if (!gid || !z.kampagnen.some((g) => g.id === gid)) {
        this.$router.replace('/spielleiter');
        return;
      }
      z.aktiveKampagneId = gid;
      this.zustand = z;
      const ag = z.kampagnen.find((g) => g.id === gid);
      let aktivesMitgliedId = null;
      if (ag && ag.mitglieder.length) {
        const mid = z.mitgliedWahlProKampagne[gid];
        aktivesMitgliedId =
          mid && ag.mitglieder.some((m) => m.id === mid) ? mid : ag.mitglieder[0].id;
      }
      this.aktivesMitgliedId = aktivesMitgliedId;
    },
    persist() {
      const kid = this.kampagneIdEffektiv;
      if (kid) {
        this.zustand.aktiveKampagneId = kid;
      }
      window.HTBAH.speichereSpielleiterZustand(this.zustand);
    },
    labelsGeaendert() {
      this.zustand = window.HTBAH.ladeSpielleiterZustand();
    },
    nachMitgliedImportAktualisieren(mitgliedId = '') {
      const g = this.aktiveKampagne;
      if (!g) {
        return;
      }
      const mid =
        typeof mitgliedId === 'string' && mitgliedId && g.mitglieder.some((m) => m && m.id === mitgliedId)
          ? mitgliedId
          : g.mitglieder.length
            ? g.mitglieder[g.mitglieder.length - 1].id
            : null;
      this.aktivesMitgliedId = mid;
      if (mid) {
        this.zustand.mitgliedWahlProKampagne[g.id] = mid;
      }
      this.persist();
      this.zustand = window.HTBAH.ladeSpielleiterZustand();
      if (mid) {
        const ag = this.aktiveKampagne;
        this.aktivesMitgliedId =
          ag && ag.mitglieder.some((m) => m && m.id === mid)
            ? mid
            : ag && ag.mitglieder.length
              ? ag.mitglieder[ag.mitglieder.length - 1].id
              : null;
      }
      this.lokaleCharaktereNeuLaden();
    },
    zeigeStatus(text) {
      window.HTBAH.ui.notify({ text, typ: 'success' });
    },
    lokaleCharaktereNeuLaden() {
      const liste =
        window.HTBAH && typeof window.HTBAH.listeCharaktere === 'function'
          ? window.HTBAH.listeCharaktere()
          : [];
      this.lokaleCharaktere = Array.isArray(liste) ? liste : [];
      if (
        this.ausgewaehlterLokalerCharakterId &&
        !this.verfuegbareLokaleCharaktere.some(
          (eintrag) => eintrag.id === this.ausgewaehlterLokalerCharakterId,
        )
      ) {
        this.ausgewaehlterLokalerCharakterId = '';
      }
    },
    lokalerCharakterLabel(eintrag, index) {
      const name =
        eintrag &&
        eintrag.charakter &&
        typeof eintrag.charakter.name === 'string' &&
        eintrag.charakter.name.trim()
          ? eintrag.charakter.name.trim()
          : `Charakter ${index + 1}`;
      return name;
    },
    lokalenCharakterZurKampagneHinzufuegen() {
      if (!this.ausgewaehlterLokalerCharakterId) {
        return;
      }
      const eintrag =
        window.HTBAH && typeof window.HTBAH.ladeCharakterEintrag === 'function'
          ? window.HTBAH.ladeCharakterEintrag(this.ausgewaehlterLokalerCharakterId)
          : null;
      if (!eintrag) {
        this.lokaleCharaktereNeuLaden();
        window.HTBAH.ui.notify({
          text: 'Der ausgewählte lokale Charakter wurde nicht gefunden.',
          typ: 'warning',
        });
        return;
      }
      const mitgliedId = this.fuegeMitgliedHinzu(
        window.HTBAH_CHARAKTER_MODEL.charakterMitDefaults(eintrag.charakter),
        typeof eintrag.charakterBild === 'string' ? eintrag.charakterBild : '',
        eintrag.id,
      );
      this.lokaleCharaktereNeuLaden();
      this.nachMitgliedImportAktualisieren(mitgliedId);
      this.zeigeStatus('Lokaler Charakter hinzugefügt.');
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
      const g = this.aktiveKampagne;
      if (!g || !g.mitglieder.length) {
        this.aktivesMitgliedId = null;
        this.persist();
        return;
      }
      const mid = this.zustand.mitgliedWahlProKampagne[g.id];
      if (mid && g.mitglieder.some((m) => m.id === mid)) {
        this.aktivesMitgliedId = mid;
      } else {
        this.aktivesMitgliedId = g.mitglieder[0].id;
        this.zustand.mitgliedWahlProKampagne[g.id] = this.aktivesMitgliedId;
      }
      this.persist();
    },
    waehleMitglied(id) {
      this.aktivesMitgliedId = id;
      if (this.aktiveKampagne) {
        this.zustand.mitgliedWahlProKampagne[this.aktiveKampagne.id] = id;
      }
      this.persist();
    },
    async mitgliedEntfernen() {
      const g = this.aktiveKampagne;
      const m = this.aktivesMitglied;
      if (!g || !m) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Mitglied entfernen?',
        beschreibung: `„${this.charakterName(m)}“ aus dieser Kampagne entfernen?`,
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
          this.zustand.mitgliedWahlProKampagne[g.id] = this.aktivesMitgliedId;
        }
        this.persist();
        this.zeigeStatus('Charakter entfernt.');
        return;
      }
      this.aktivesMitgliedId = null;
      delete this.zustand.mitgliedWahlProKampagne[g.id];
      this.persist();
      const gruppeLoeschen = await window.HTBAH.ui.confirm({
        titel: 'Letztes Mitglied entfernt',
        beschreibung:
          `In der Kampagne „${g.name}“ sind keine Mitglieder mehr. Soll die Kampagne ebenfalls gelöscht werden?`,
        bestaetigenText: 'Kampagne löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!gruppeLoeschen) {
        this.zeigeStatus('Charakter entfernt. Die Kampagne bleibt leer bestehen.');
        return;
      }
      this.zustand.kampagnen = this.zustand.kampagnen.filter((eintrag) => eintrag.id !== g.id);
      delete this.zustand.mitgliedWahlProKampagne[g.id];
      this.persist();
      this.zeigeStatus('Letztes Mitglied entfernt und Kampagne gelöscht.');
      this.$router.replace('/spielleiter');
    },
    oeffneVerschiebenModal() {
      if (!this.aktivesMitglied || this.andereKampagnen.length === 0 || !window.bootstrap) {
        return;
      }
      this.zielKampagneId = this.andereKampagnen[0].id;
      this.$nextTick(() => {
        const el = this.$refs.verschiebeModalElement;
        if (!el) {
          return;
        }
        this.verschiebeModalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.verschiebeModalInstanz.show();
      });
    },
    verschiebeMitgliedInAndereKampagne() {
      const quellGruppe = this.aktiveKampagne;
      const m = this.aktivesMitglied;
      if (!quellGruppe || !m) {
        return;
      }
      const zielGruppe = this.andereKampagnen.find((g) => g.id === this.zielKampagneId) || null;
      if (!zielGruppe) {
        return;
      }

      quellGruppe.mitglieder = quellGruppe.mitglieder.filter((x) => x.id !== m.id);
      zielGruppe.mitglieder.push(m);
      this.zustand.mitgliedWahlProKampagne[zielGruppe.id] = m.id;

      const name = this.charakterName(m);
      this.beiGruppenwechsel();
      this.persist();

      if (this.verschiebeModalInstanz) {
        this.verschiebeModalInstanz.hide();
      }
      this.zeigeStatus(`„${name}“ wurde verschoben.`);
    },
    fuegeMitgliedHinzu(charakter, charakterBild, charakterStorageId = '', mitgliedId = '') {
      const g = this.aktiveKampagne;
      if (!g) {
        return null;
      }
      const storageId = typeof charakterStorageId === 'string' ? charakterStorageId.trim() : '';
      const gewuenschteId = typeof mitgliedId === 'string' ? mitgliedId.trim() : '';
      const vorhandenIdx =
        gewuenschteId && Array.isArray(g.mitglieder)
          ? g.mitglieder.findIndex((m) => m && m.id === gewuenschteId)
          : -1;
      const mitglied = {
        id: gewuenschteId || window.HTBAH.neueEntropieId(),
        charakter,
        charakterBild: typeof charakterBild === 'string' ? charakterBild : '',
        charakterStorageId: storageId,
      };
      if (vorhandenIdx >= 0) {
        g.mitglieder[vorhandenIdx] = {
          ...g.mitglieder[vorhandenIdx],
          ...mitglied,
        };
      } else {
        g.mitglieder.push(mitglied);
      }
      this.aktivesMitgliedId = mitglied.id;
      this.zustand.mitgliedWahlProKampagne[g.id] = mitglied.id;
      return mitglied.id;
    },
    charakterAusImportInLokalenSpeicher(kandidat) {
      if (
        !kandidat ||
        !window.HTBAH ||
        typeof window.HTBAH.importiereOderAktualisiereCharakterEintrag !== 'function'
      ) {
        return '';
      }
      const aktiveIdVorher =
        typeof window.HTBAH.ladeAktivenCharakterId === 'function'
          ? window.HTBAH.ladeAktivenCharakterId()
          : null;
      const eintrag = window.HTBAH.importiereOderAktualisiereCharakterEintrag({
        id: typeof kandidat.id === 'string' && kandidat.id ? kandidat.id : null,
        charakter: kandidat.charakter,
        charakterBild: kandidat.charakterBild,
      });
      if (typeof window.HTBAH.setzeAktivenCharakterId === 'function') {
        window.HTBAH.setzeAktivenCharakterId(aktiveIdVorher || null);
      }
      return eintrag && typeof eintrag.id === 'string' ? eintrag.id : '';
    },
    importiereMitgliedPaketAusJson(json) {
      const kid = this.kampagneIdEffektiv;
      if (!kid) {
        return { ok: false, fehler: 'Keine aktive Kampagne.' };
      }
      if (
        !window.HTBAH ||
        typeof window.HTBAH.importiereSpielleiterMitgliedPaket !== 'function'
      ) {
        return { ok: false, fehler: 'Import nicht verfügbar.' };
      }
      return window.HTBAH.importiereSpielleiterMitgliedPaket(kid, json);
    },
    importiereKandidatAlsMitglied(kandidat) {
      if (!kandidat || !kandidat.charakter) {
        return '';
      }
      const storageId = this.charakterAusImportInLokalenSpeicher(kandidat);
      const mitgliedId =
        kandidat.quelle === 'spielleiter-kampagne' && typeof kandidat.id === 'string'
          ? kandidat.id
          : '';
      return (
        this.fuegeMitgliedHinzu(
          kandidat.charakter,
          kandidat.charakterBild,
          storageId,
          mitgliedId,
        ) || ''
      );
    },
    async importJsonDateien(event) {
      const input = event.target;
      const files = input.files;
      if (!files || !files.length) {
        return;
      }
      if (!this.kampagneIdEffektiv) {
        await window.HTBAH.ui.alert({
          titel: 'Keine Kampagne',
          beschreibung: 'Bitte zuerst eine Kampagne auswählen.',
        });
        input.value = '';
        return;
      }
      let importiert = 0;
      let zuletztImportiertesMitgliedId = '';
      try {
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
          json.htbahExportVersion === 1 &&
          json.typ === 'htbah-spielleiter-mitglied' &&
          json.mitglied
        ) {
          const ergebnis = this.importiereMitgliedPaketAusJson(json);
          if (!ergebnis || !ergebnis.ok) {
            await window.HTBAH.ui.alert({
              titel: 'Import nicht möglich',
              beschreibung:
                (ergebnis && ergebnis.fehler) ||
                `„${datei.name}“: Gruppen-Charakter konnte nicht importiert werden.`,
            });
            continue;
          }
          const mid =
            json.mitglied && typeof json.mitglied.id === 'string' ? json.mitglied.id : '';
          if (mid) {
            zuletztImportiertesMitgliedId = mid;
          }
          this.zustand = window.HTBAH.ladeSpielleiterZustand();
          importiert += 1;
          continue;
        }
        if (
          json &&
          json.typ === 'spielleiter_kampagne' &&
          Array.isArray(json.mitglieder)
        ) {
          for (let k = 0; k < json.mitglieder.length; k++) {
            const raw = json.mitglieder[k];
            if (!raw || typeof raw !== 'object') {
              continue;
            }
            const ergebnis = this.importiereMitgliedPaketAusJson({
              htbahExportVersion: 1,
              typ: 'htbah-spielleiter-mitglied',
              mitglied: raw,
            });
            if (!ergebnis || !ergebnis.ok) {
              continue;
            }
            if (typeof raw.id === 'string' && raw.id) {
              zuletztImportiertesMitgliedId = raw.id;
            }
            importiert += 1;
          }
          this.zustand = window.HTBAH.ladeSpielleiterZustand();
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
            const mid = this.importiereKandidatAlsMitglied(kandidat);
            if (mid) {
              zuletztImportiertesMitgliedId = mid;
              importiert += 1;
            }
          });
        }
      }
      } catch (err) {
        await window.HTBAH.ui.alert({
          titel: 'Import fehlgeschlagen',
          beschreibung:
            err && err.message
              ? err.message
              : 'Beim Import ist ein unerwarteter Fehler aufgetreten.',
        });
      }
      input.value = '';
      if (importiert) {
        this.nachMitgliedImportAktualisieren(zuletztImportiertesMitgliedId);
        this.zeigeStatus(
          importiert === 1 ? 'Ein Charakter importiert.' : `${importiert} Charaktere importiert.`,
        );
      } else if (!this.aktiveKampagne) {
        await window.HTBAH.ui.alert({
          titel: 'Import nicht möglich',
          beschreibung: 'Keine aktive Kampagne zum Hinzufügen des Charakters.',
        });
      }
    },
  },
  template: `
    <div :class="eingebettet ? 'py-3' : 'container content py-3'">
      <nav v-if="!eingebettet" class="mb-2" aria-label="Brotkrumen">
        <router-link to="/spielleiter" class="htbah-back-link">
          <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          <span>Zurück zur Übersicht</span>
        </router-link>
      </nav>

      <template v-if="aktiveKampagne">
      <div class="card p-3 mb-3">
        <span class="fw-semibold d-block mb-2">Kampagne: {{ aktiveKampagne.name }}</span>
        <kampagnen-labels-editor
          :kampagne-id="kampagneId"
          @geaendert="labelsGeaendert" />
      </div>
      <div class="card p-3 mb-3">
        <span class="fw-semibold d-block mb-2">
          Charakter-Auswahl
        </span>
        <div class="row g-2 mb-2">
          <div class="col-12 col-lg-8">
            <div class="form-floating">
              <select
                id="sl-kampagne-lokal-charakter"
                class="form-select"
                v-model="ausgewaehlterLokalerCharakterId">
                <option value="">Lokalen Charakter wählen …</option>
                <option
                  v-for="(eintrag, index) in verfuegbareLokaleCharaktere"
                  :key="'lokal-' + eintrag.id"
                  :value="eintrag.id">
                  {{ lokalerCharakterLabel(eintrag, index) }}
                </option>
              </select>
              <label for="sl-kampagne-lokal-charakter">Lokaler Charakter (Storage)</label>
            </div>
          </div>
          <div class="col-12 col-lg-4 d-grid">
            <button
              type="button"
              class="btn btn-outline-primary"
              :disabled="!ausgewaehlterLokalerCharakterId || !hatLokaleCharaktere"
              @click="lokalenCharakterZurKampagneHinzufuegen">
              Lokalen Charakter hinzufügen
            </button>
          </div>
        </div>
        <p v-if="!hatLokaleCharaktere" class="small text-body-secondary mb-2">
          Keine lokal gespeicherten Charaktere gefunden.
        </p>
        <div class="form-floating mb-0">
          <input
            id="sl-kampagne-import"
            type="file"
            accept="application/json,.json"
            multiple
            class="form-control"
            @change="importJsonDateien" />
          <label for="sl-kampagne-import">Charakterblätter aus JSON importieren</label>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <span class="fw-semibold d-block mb-2">Charaktere in dieser Kampagne</span>
        <ul
          v-if="aktiveKampagne.mitglieder.length"
          class="nav htbah-weltenbau-pill-tabs mb-2"
          role="tablist"
          aria-label="Charakter wählen">
          <li
            v-for="m in aktiveKampagne.mitglieder"
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
            v-if="aktivesMitglied && andereKampagnen.length"
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="oeffneVerschiebenModal">
            In andere Kampagne verschieben
          </button>
          <button
            v-if="aktivesMitglied"
            type="button"
            class="btn btn-outline-danger btn-sm"
            @click="mitgliedEntfernen">
            Aus Kampagne entfernen
          </button>
        </div>
        <div v-if="aktivesMitglied" class="mt-3 pt-3 border-top border-secondary border-opacity-25">
          <charakter
            :key="aktivesMitglied.id"
            :spielleiter-mitglied="aktivesMitglied"
            :aktive-kampagne-id="kampagneId"
            :on-spielleiter-persist="persist"
          />
        </div>
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
                  In andere Kampagne verschieben
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Schließen"></button>
              </div>
              <div class="modal-body">
                <label for="spielleiter-ziel-kampagne" class="form-label">
                  Zielkampagne auswählen
                </label>
                <select
                  id="spielleiter-ziel-kampagne"
                  class="form-select"
                  v-model="zielKampagneId">
                  <option v-for="g in andereKampagnen" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
                <p class="small text-body-secondary mb-0 mt-2">
                  „{{ aktivesMitglied ? charakterName(aktivesMitglied) : '' }}“ nach
                  „{{ (andereKampagnen.find((g) => g.id === zielKampagneId) || {}).name || '' }}“
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
                  :disabled="!zielKampagneId"
                  @click="verschiebeMitgliedInAndereKampagne">
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
