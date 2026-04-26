window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function normalisierterKampagnenName(name) {
  return String(name || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('de');
}

window.HTBAH_SEITEN.SpielleiterGruppenUebersicht = {
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      neueKampagneNameEntwurf: '',
    };
  },
  methods: {
    kampagnenNameExistiert(name, ausgenommeneId = '') {
      const ziel = normalisierterKampagnenName(name);
      if (!ziel) {
        return false;
      }
      const roh = window.HTBAH.ladeSpielleiterZustand();
      const kampagnen = Array.isArray(roh && roh.kampagnen)
        ? roh.kampagnen
        : Array.isArray(roh && roh.gruppen)
          ? roh.gruppen
          : [];
      return kampagnen.some((k) => {
        if (!k || (ausgenommeneId && k.id === ausgenommeneId)) {
          return false;
        }
        const vorhanden = normalisierterKampagnenName(k.name);
        return vorhanden === ziel;
      });
    },
    persist() {
      window.HTBAH.speichereSpielleiterZustand(this.zustand);
    },
    zeigeStatus(text) {
      window.HTBAH.ui.notify({ text, typ: 'success' });
    },
    neueKampagne() {
      const name =
        (this.neueKampagneNameEntwurf || '').trim() ||
        'Kampagne ' + (this.zustand.kampagnen.length + 1);
      if (this.kampagnenNameExistiert(name)) {
        window.HTBAH.ui.notify({
          text: 'Eine Kampagne mit diesem Namen existiert bereits.',
          typ: 'danger',
        });
        return;
      }
      const id = window.HTBAH.neueEntropieId();
      this.zustand.kampagnen.push({ id, name, mitglieder: [] });
      this.zustand.aktiveKampagneId = id;
      this.neueKampagneNameEntwurf = '';
      this.persist();
      this.zeigeStatus('Kampagne angelegt.');
      this.$router.push(window.HTBAH.kampagnenPfad('gruppe', id));
    },
    kampagneBearbeiten(g) {
      if (!g || !g.id) {
        return;
      }
      this.zustand.aktiveKampagneId = g.id;
      this.persist();
      this.$router.push(window.HTBAH.kampagnenPfad('gruppe', g.id));
    },
    async kampagneUmbenennen(g) {
      if (!g) {
        return;
      }
      const neu = await window.HTBAH.ui.prompt({
        titel: 'Kampagne umbenennen',
        beschreibung: 'Neuer Kampagnenname:',
        label: 'Kampagnenname',
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
      if (this.kampagnenNameExistiert(t, g.id)) {
        window.HTBAH.ui.notify({
          text: 'Eine Kampagne mit diesem Namen existiert bereits.',
          typ: 'danger',
        });
        return;
      }
      g.name = t;
      this.persist();
      this.zeigeStatus('Name gespeichert.');
    },
    async kampagneLoeschen(g) {
      if (!g) {
        return;
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Kampagne löschen?',
        beschreibung: `Kampagne „${g.name}“ inklusive aller importierten Charaktere löschen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }
      const gid = g.id;
      this.zustand.kampagnen = this.zustand.kampagnen.filter((x) => x.id !== gid);
      delete this.zustand.mitgliedWahlProKampagne[gid];
      if (this.zustand.aktiveKampagneId === gid) {
        this.zustand.aktiveKampagneId = this.zustand.kampagnen[0]
          ? this.zustand.kampagnen[0].id
          : null;
      }
      this.persist();
      this.zeigeStatus('Kampagne gelöscht.');
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
        <span class="htbah-page-title-emoji" aria-hidden="true">🗂️</span>
        <span>Kampagnen</span>
      </h4>
      <p class="small text-body-secondary text-center mb-3">
        Kampagnen anlegen und verwalten.
      </p>

      <div class="card bg-white p-3 mb-3 text-start">
        <h5 class="mb-2">Kampagne hinzufügen</h5>
        <div class="row g-2 align-items-stretch">
          <div class="col-12 col-sm">
            <div class="form-floating">
              <input
                id="sl-uebersicht-neue-gruppe-name"
                type="text"
                class="form-control"
                v-model="neueKampagneNameEntwurf"
                placeholder=" "
                autocomplete="off" />
              <label for="sl-uebersicht-neue-gruppe-name">Name (optional)</label>
            </div>
          </div>
          <div class="col-12 col-sm-auto d-grid">
            <icon-text-button class="btn-primary w-100" icon="add" @click="neueKampagne">
              Hinzufügen
            </icon-text-button>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-0 text-start">
        <h5 class="mb-2">Kampagnen</h5>

        <div v-if="!zustand.kampagnen.length" class="alert alert-secondary mb-0">
          Noch keine Kampagne — oben „Hinzufügen“ nutzen.
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
              <tr v-for="g in zustand.kampagnen" :key="g.id">
                <td>
                  <button type="button" class="btn btn-link p-0 fw-medium text-decoration-none" @click="kampagneBearbeiten(g)">
                    {{ g.name }}
                  </button>
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
                  <span v-if="!g.mitglieder.length" class="small text-body-secondary">Noch keine Charaktere in der Gruppe</span>
                </div>
              </td>
                <td class="text-end">
                  <div class="d-inline-flex flex-wrap gap-1 justify-content-end">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      @click="kampagneBearbeiten(g)">
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="kampagneUmbenennen(g)">
                      Umbenennen
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="kampagneLoeschen(g)">
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="zustand.kampagnen.length" class="d-md-none mt-2">
          <div
            v-for="g in zustand.kampagnen"
            :key="'grp-card-' + g.id"
            class="card zufallstabellen-mobile-card mb-2 p-3">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
              <button type="button" class="btn btn-link p-0 fw-semibold text-decoration-none" @click="kampagneBearbeiten(g)">
                {{ g.name }}
              </button>
              <div class="dropdown">
                <button
                  type="button"
                  class="btn btn-sm border-0 d-flex align-items-center justify-content-center p-1"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="Aktionen für Kampagne">
                  <span class="material-symbols-outlined" aria-hidden="true">more_vert</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <button type="button" class="dropdown-item" @click="kampagneBearbeiten(g)">
                      Bearbeiten
                    </button>
                  </li>
                  <li>
                    <button type="button" class="dropdown-item" @click="kampagneUmbenennen(g)">
                      Umbenennen
                    </button>
                  </li>
                  <li>
                    <button type="button" class="dropdown-item text-danger" @click="kampagneLoeschen(g)">
                      Löschen
                    </button>
                  </li>
                </ul>
              </div>
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
              <span v-if="!g.mitglieder.length" class="small text-body-secondary">Noch keine Charaktere in der Gruppe</span>
            </div>
          </div>
        </div>
      </div>

      <div class="abstandshalter" aria-hidden="true"></div>

    </div>
  `,
};
