window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.SpielleiterGruppenUebersicht = {
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      neueGruppeNameEntwurf: '',
      statusMeldung: '',
    };
  },
  methods: {
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
    neueGruppe() {
      const name =
        (this.neueGruppeNameEntwurf || '').trim() ||
        'Gruppe ' + (this.zustand.gruppen.length + 1);
      const id = window.HTBAH.neueEntropieId();
      this.zustand.gruppen.push({ id, name, mitglieder: [] });
      this.zustand.aktiveGruppeId = id;
      this.neueGruppeNameEntwurf = '';
      this.persist();
      this.zeigeStatus('Gruppe angelegt.');
      this.$router.push('/spielleiter/gruppe/' + id);
    },
    gruppeUmbenennen(g) {
      if (!g) {
        return;
      }
      const neu = window.prompt('Neuer Gruppenname:', g.name);
      if (neu === null) {
        return;
      }
      const t = neu.trim();
      if (!t) {
        return;
      }
      g.name = t;
      this.persist();
      this.zeigeStatus('Name gespeichert.');
    },
    gruppeLoeschen(g) {
      if (!g) {
        return;
      }
      if (
        !window.confirm(
          `Gruppe „${g.name}“ inklusive aller importierten Charaktere löschen?`,
        )
      ) {
        return;
      }
      const gid = g.id;
      this.zustand.gruppen = this.zustand.gruppen.filter((x) => x.id !== gid);
      delete this.zustand.mitgliedWahlProGruppe[gid];
      if (this.zustand.aktiveGruppeId === gid) {
        this.zustand.aktiveGruppeId = this.zustand.gruppen[0]
          ? this.zustand.gruppen[0].id
          : null;
      }
      this.persist();
      this.zeigeStatus('Gruppe gelöscht.');
    },
  },
  template: `
    <div class="container content py-3">
      <h4 class="mb-1">Spielleiter · Gruppen</h4>
      <p class="small text-body-secondary mb-3">
        Gruppen anlegen und verwalten. In der Gruppenansicht importierst du Charakterblätter und bearbeitest sie.
      </p>

      <div class="input-group mb-3">
        <div class="form-floating flex-grow-1" style="min-width: 12rem;">
          <input
            id="sl-uebersicht-neue-gruppe-name"
            type="text"
            class="form-control"
            v-model="neueGruppeNameEntwurf"
            placeholder=" "
            autocomplete="off" />
          <label for="sl-uebersicht-neue-gruppe-name">Name (optional)</label>
        </div>
        <icon-text-button class="btn-primary" icon="add" @click="neueGruppe">
          Hinzufügen
        </icon-text-button>
      </div>

      <div v-if="!zustand.gruppen.length" class="alert alert-secondary mb-0">
        Noch keine Gruppe — oben „Hinzufügen“ nutzen.
      </div>

      <div v-else class="table-responsive rounded border">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Name</th>
              <th scope="col" class="text-nowrap">Mitglieder</th>
              <th scope="col" class="text-end text-nowrap">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in zustand.gruppen" :key="g.id">
              <td>
                <router-link :to="'/spielleiter/gruppe/' + g.id" class="fw-medium text-decoration-none">
                  {{ g.name }}
                </router-link>
              </td>
              <td>{{ g.mitglieder.length }}</td>
              <td class="text-end">
                <div class="d-inline-flex flex-wrap gap-1 justify-content-end">
                  <router-link
                    class="btn btn-sm btn-outline-primary"
                    :to="'/spielleiter/gruppe/' + g.id">
                    Öffnen
                  </router-link>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    @click="gruppeUmbenennen(g)">
                    Umbenennen
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="gruppeLoeschen(g)">
                    Löschen
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
