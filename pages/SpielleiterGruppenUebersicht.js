window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.SpielleiterGruppenUebersicht = {
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      neueGruppeNameEntwurf: '',
    };
  },
  methods: {
    persist() {
      window.HTBAH.speichereSpielleiterZustand(this.zustand);
    },
    zeigeStatus(text) {
      window.HTBAH.ui.notify({ text, typ: 'success' });
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
    async gruppeUmbenennen(g) {
      if (!g) {
        return;
      }
      const neu = await window.HTBAH.ui.prompt({
        titel: 'Gruppe umbenennen',
        beschreibung: 'Neuer Gruppenname:',
        label: 'Gruppenname',
        startwert: g.name || '',
        bestaetigenText: 'Speichern',
        trim: false,
      });
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
    async gruppeLoeschen(g) {
      if (!g) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Gruppe löschen?',
        beschreibung: `Gruppe „${g.name}“ inklusive aller importierten Charaktere löschen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
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
    mitgliedName(mitglied) {
      const name =
        mitglied && mitglied.charakter && typeof mitglied.charakter.name === 'string'
          ? mitglied.charakter.name.trim()
          : '';
      return name || 'Ohne Namen';
    },
    mitgliedBild(mitglied) {
      return mitglied && typeof mitglied.charakterBild === 'string' ? mitglied.charakterBild : '';
    },
  },
  template: `
    <div class="container content py-3">
      <h4 class="text-center mb-1 htbah-page-title">
        <span class="htbah-page-title-emoji" aria-hidden="true">👥</span>
        <span>Gruppen</span>
      </h4>
      <p class="small text-body-secondary text-center mb-3">
        Gruppen anlegen und verwalten.
      </p>

      <div class="card bg-white p-3 mb-3 text-start">
        <h5 class="mb-2">Gruppe hinzufügen</h5>
        <div class="row g-2 align-items-stretch">
          <div class="col-12 col-sm">
            <div class="form-floating">
              <input
                id="sl-uebersicht-neue-gruppe-name"
                type="text"
                class="form-control"
                v-model="neueGruppeNameEntwurf"
                placeholder=" "
                autocomplete="off" />
              <label for="sl-uebersicht-neue-gruppe-name">Name (optional)</label>
            </div>
          </div>
          <div class="col-12 col-sm-auto d-grid">
            <icon-text-button class="btn-primary w-100" icon="add" @click="neueGruppe">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-0 text-start">
        <h5 class="mb-2">Gruppen</h5>

        <div v-if="!zustand.gruppen.length" class="alert alert-secondary mb-0">
          Noch keine Gruppe — oben „Hinzufügen“ nutzen.
        </div>

        <div v-else class="table-responsive rounded border d-none d-md-block">
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
              <td>
                <div class="d-flex flex-wrap gap-1">
                  <span
                    v-for="(m, index) in g.mitglieder"
                    :key="'g-member-badge-' + g.id + '-' + (m.id || index)"
                    class="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                    <img
                      v-if="mitgliedBild(m)"
                      :src="mitgliedBild(m)"
                      :alt="'Profilbild ' + mitgliedName(m)"
                      class="rounded-circle border"
                      style="width: 1rem; height: 1rem; object-fit: cover;" />
                    <span>{{ mitgliedName(m) }}</span>
                  </span>
                  <span v-if="!g.mitglieder.length" class="small text-body-secondary">Keine</span>
                </div>
              </td>
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
        <div v-if="zustand.gruppen.length" class="d-md-none mt-2">
          <div
            v-for="g in zustand.gruppen"
            :key="'grp-card-' + g.id"
            class="card zufallstabellen-mobile-card mb-2 p-3">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
              <router-link :to="'/spielleiter/gruppe/' + g.id" class="fw-semibold text-decoration-none">
                {{ g.name }}
              </router-link>
            </div>
            <div class="d-flex flex-wrap gap-1 mb-2">
              <span
                v-for="(m, index) in g.mitglieder"
                :key="'g-mobile-member-badge-' + g.id + '-' + (m.id || index)"
                class="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                <img
                  v-if="mitgliedBild(m)"
                  :src="mitgliedBild(m)"
                  :alt="'Profilbild ' + mitgliedName(m)"
                  class="rounded-circle border"
                  style="width: 1rem; height: 1rem; object-fit: cover;" />
                <span>{{ mitgliedName(m) }}</span>
              </span>
              <span v-if="!g.mitglieder.length" class="small text-body-secondary">Keine Mitglieder</span>
            </div>
            <div class="d-grid gap-2">
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
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>

    </div>
  `,
};
