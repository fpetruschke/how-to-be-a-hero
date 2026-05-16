window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

function normalisierterKampagnenName(name) {
  return String(name || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('de');
}

const SL_BEISPIEL_KAMPAGNEN_VERZEICHNIS = 'assets/beispiel-kampagnen';
const SL_BEISPIEL_KAMPAGNEN_INDEX_URL = `${SL_BEISPIEL_KAMPAGNEN_VERZEICHNIS}/index.json`;

function normalisiereBeispielManifestEintrag(roh) {
  if (!roh || typeof roh !== 'object') {
    return null;
  }
  const datei = typeof roh.datei === 'string' ? roh.datei.trim() : '';
  if (!datei || !/\.json$/i.test(datei)) {
    return null;
  }
  const titel =
    typeof roh.titel === 'string' && roh.titel.trim()
      ? roh.titel.trim()
      : datei.replace(/\.json$/i, '');
  const eintrag = { datei, titel };
  ['untertitel', 'beschreibung', 'quelleUrl', 'quelleLabel', 'autoren', 'kontext', 'lizenz'].forEach(
    (schluessel) => {
      const wert = roh[schluessel];
      if (typeof wert === 'string' && wert.trim()) {
        eintrag[schluessel] = wert.trim();
      }
    },
  );
  return eintrag;
}

window.HTBAH_SEITEN.SpielleiterGruppenUebersicht = {
  data() {
    return {
      zustand: window.HTBAH.ladeSpielleiterZustand(),
      neueKampagneNameEntwurf: '',
      beispielManifest: [],
      beispielManifestLaedt: false,
      beispielManifestFehler: '',
      ausgewaehltesBeispielDatei: '',
      beispielLaeuftDatei: '',
      beispielKampagnenInhaltOffen: false,
    };
  },
  computed: {
    aktuellesBeispiel() {
      if (!this.ausgewaehltesBeispielDatei) {
        return null;
      }
      return (
        this.beispielManifest.find((b) => b.datei === this.ausgewaehltesBeispielDatei) || null
      );
    },
    beispielLaedtGerade() {
      return Boolean(this.beispielLaeuftDatei);
    },
  },
  mounted() {
    this.ladeBeispielManifest();
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
      const ergebnis = window.HTBAH.loescheSpielleiterKampagneKomplett(gid);
      if (!ergebnis || !ergebnis.ok) {
        window.HTBAH.ui.notify({
          text: 'Die Kampagne konnte nicht gelöscht werden.',
          typ: 'danger',
        });
        return;
      }
      this.zustand = window.HTBAH.ladeSpielleiterZustand();
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
    async ladeBeispielManifest() {
      this.beispielManifestLaedt = true;
      this.beispielManifestFehler = '';
      try {
        const response = await fetch(SL_BEISPIEL_KAMPAGNEN_INDEX_URL, { cache: 'no-cache' });
        if (response.status === 404) {
          this.beispielManifest = [];
          return;
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const roh = await response.json();
        if (!Array.isArray(roh)) {
          throw new Error('Manifest muss ein Array sein.');
        }
        this.beispielManifest = roh.map(normalisiereBeispielManifestEintrag).filter(Boolean);
      } catch (err) {
        this.beispielManifest = [];
        this.beispielManifestFehler = err && err.message ? err.message : String(err);
      } finally {
        this.beispielManifestLaedt = false;
      }
    },
    beispielQuellenZeile(beispiel) {
      if (!beispiel) {
        return '';
      }
      const teile = [];
      if (beispiel.quelleUrl) {
        const label = beispiel.quelleLabel || beispiel.quelleUrl;
        teile.push(
          `Quelle: <a href="${beispiel.quelleUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`,
        );
      } else if (beispiel.quelleLabel) {
        teile.push(`Quelle: ${beispiel.quelleLabel}`);
      }
      if (beispiel.autoren) {
        teile.push(`Verfasst von ${beispiel.autoren}`);
      }
      if (beispiel.kontext) {
        teile.push(beispiel.kontext);
      }
      if (beispiel.lizenz) {
        teile.push(`Lizenz: ${beispiel.lizenz}`);
      }
      return teile.join(' · ');
    },
    async beispielKampagneLaden() {
      const beispiel = this.aktuellesBeispiel;
      if (!beispiel || this.beispielLaeuftDatei) {
        return;
      }
      const quellenZeile = this.beispielQuellenZeile(beispiel);
      const beschreibungTeile = [
        `<p>Die Kampagne <strong>„${beispiel.titel}“</strong> wird <em>additiv</em> hinzugefügt — ` +
          'vorhandene Kampagnen und Zufallstabellen-Einträge bleiben unverändert. Bereits ' +
          'vorhandene Beispiel-Einträge (gleiche ID) werden übersprungen.</p>',
      ];
      if (quellenZeile) {
        beschreibungTeile.push(`<p class="mb-0 small text-body-secondary">${quellenZeile}.</p>`);
      }
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: `„${beispiel.titel}“ laden?`,
        beschreibung: beschreibungTeile.join(''),
        bestaetigenText: 'Hinzufügen',
        bestaetigenButtonClass: 'btn-primary',
      });
      if (!bestaetigt) {
        return;
      }

      this.beispielLaeuftDatei = beispiel.datei;
      try {
        const url = `${SL_BEISPIEL_KAMPAGNEN_VERZEICHNIS}/${beispiel.datei}`;
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`Datei nicht erreichbar (HTTP ${response.status}).`);
        }
        const paket = await response.json();
        if (!paket || paket.typ !== 'lokaler-speicher' || !Array.isArray(paket.daten)) {
          throw new Error('Ungültiges Paketformat (erwartet typ: "lokaler-speicher").');
        }
        const ergebnis = this.beispielPaketAdditivAnwenden(paket);
        if (!ergebnis.kampagneId) {
          throw new Error('Im Paket wurde keine Kampagne gefunden.');
        }

        const zusammenfassung = [];
        if (ergebnis.kampagneStatus === 'neu') {
          zusammenfassung.push('Kampagne hinzugefügt');
        } else if (ergebnis.kampagneStatus === 'vorhanden') {
          zusammenfassung.push('Kampagne war bereits vorhanden');
        }
        if (ergebnis.zufallNeu > 0) {
          zusammenfassung.push(`${ergebnis.zufallNeu} Zufallstabellen-Einträge hinzugefügt`);
        }
        if (ergebnis.zufallVorhanden > 0) {
          zusammenfassung.push(`${ergebnis.zufallVorhanden} bereits vorhanden (übersprungen)`);
        }
        window.HTBAH.ui.notify({
          text: `„${beispiel.titel}“: ${zusammenfassung.join(', ') || 'nichts geändert'}.`,
          typ: 'success',
        });

        this.$router.push(window.HTBAH.kampagnenPfad('gruppe', ergebnis.kampagneId));
      } catch (err) {
        await window.HTBAH.ui.alert({
          titel: 'Laden fehlgeschlagen',
          beschreibung: `Das Beispiel „${beispiel.titel}“ konnte nicht geladen werden: ${
            err && err.message ? err.message : err
          }`,
          bestaetigenButtonClass: 'btn-danger',
        });
      } finally {
        this.beispielLaeuftDatei = '';
      }
    },
    beispielPaketAdditivAnwenden(paket) {
      const ergebnis = window.HTBAH.wendeBeispielLokalerSpeicherPaketAdditivAn(paket);
      this.zustand = window.HTBAH.ladeSpielleiterZustand();
      return ergebnis;
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

      <div class="card p-3 mb-3 text-start">
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

      <div v-if="beispielManifest.length" class="card p-3 mb-0 text-start htbah-beispiel-kampagnen-card">
        <button
            type="button"
            class="btn w-100 d-flex align-items-center justify-content-between gap-2 mb-2 p-0 border-0 bg-transparent text-start text-body cursor-pointer"
            :aria-expanded="beispielKampagnenInhaltOffen ? 'true' : 'false'"
            aria-controls="sl-uebersicht-beispiel-inhalt"
            :aria-label="beispielKampagnenInhaltOffen ? 'Beispiel-Kampagne-Bereich einklappen' : 'Beispiel-Kampagne-Bereich ausklappen'"
            @click="beispielKampagnenInhaltOffen = !beispielKampagnenInhaltOffen">
          <h5 class="mb-0 d-flex align-items-center gap-2">
            <span aria-hidden="true">📖</span>
            <span>Beispiel-Kampagne laden</span>
          </h5>
          <span class="material-symbols-outlined flex-shrink-0" aria-hidden="true">
            {{ beispielKampagnenInhaltOffen ? 'expand_less' : 'expand_more' }}
          </span>
        </button>
        <div
            v-show="beispielKampagnenInhaltOffen"
            id="sl-uebersicht-beispiel-inhalt">
        <div
            class="alert alert-danger border-danger mb-3"
            role="alert">
          <strong>Nur für Spielleitung — nicht zum Testen als Spielende!</strong>
          <p class="mb-0 mt-2 small">
            Wenn du als spielende Person unterwegs bist: hier nicht weiter testen. Bereits die Auswahl einer
            Demo-Kampagne kann Spoiler offenbaren und das Spielerlebnis zerstören. Diese Funktion ist
            ausschließlich gedacht, wenn du die Beispiel-Kampagne(n) in der Rolle der Spielleitung spielen
            möchtest.
          </p>
        </div>
        <p class="small text-body-secondary mb-2">
          Wähle eine Kampagne aus und füge sie <strong>additiv</strong> zu deinen Daten hinzu.
          Vorhandene Kampagnen und Zufallstabellen-Einträge bleiben unverändert; gleiche IDs werden übersprungen.
        </p>
        <div class="row g-2 align-items-stretch mb-2">
          <div class="col-12 col-sm">
            <div class="form-floating">
              <select
                  id="sl-uebersicht-beispiel-auswahl"
                  class="form-select"
                  v-model="ausgewaehltesBeispielDatei"
                  :disabled="beispielLaedtGerade">
                <option value="">— Beispiel-Kampagne wählen —</option>
                <option
                    v-for="b in beispielManifest"
                    :key="'sl-bsp-opt-' + b.datei"
                    :value="b.datei">
                  {{ b.titel }}
                </option>
              </select>
              <label for="sl-uebersicht-beispiel-auswahl">Beispiel-Kampagne</label>
            </div>
          </div>
          <div class="col-12 col-sm-auto d-grid">
            <icon-text-button
                class="btn-primary w-100"
                icon="auto_stories"
                :disabled="!ausgewaehltesBeispielDatei || beispielLaedtGerade"
                :aria-label="aktuellesBeispiel ? 'Beispiel-Kampagne „' + aktuellesBeispiel.titel + '“ laden' : 'Beispiel-Kampagne laden'"
                @click="beispielKampagneLaden">
              {{ beispielLaedtGerade ? 'Lade …' : 'Laden' }}
            </icon-text-button>
          </div>
        </div>
        <div v-if="aktuellesBeispiel" class="border rounded p-2 small text-body-secondary">
          <p v-if="aktuellesBeispiel.untertitel" class="mb-1">{{ aktuellesBeispiel.untertitel }}</p>
          <p v-if="aktuellesBeispiel.beschreibung" class="mb-2">{{ aktuellesBeispiel.beschreibung }}</p>
          <p v-if="aktuellesBeispiel.quelleUrl || aktuellesBeispiel.quelleLabel" class="mb-1">
            <strong>Quelle:</strong>
            <a
                v-if="aktuellesBeispiel.quelleUrl"
                :href="aktuellesBeispiel.quelleUrl"
                target="_blank"
                rel="noopener noreferrer">{{ aktuellesBeispiel.quelleLabel || aktuellesBeispiel.quelleUrl }}</a>
            <span v-else>{{ aktuellesBeispiel.quelleLabel }}</span>
          </p>
          <p v-if="aktuellesBeispiel.autoren || aktuellesBeispiel.kontext" class="mb-1">
            <template v-if="aktuellesBeispiel.autoren">
              <strong>Verfasst von:</strong> {{ aktuellesBeispiel.autoren }}
            </template>
            <template v-if="aktuellesBeispiel.kontext">
              <span v-if="aktuellesBeispiel.autoren"> · </span>{{ aktuellesBeispiel.kontext }}
            </template>
          </p>
          <p v-if="aktuellesBeispiel.lizenz" class="mb-0">
            <strong>Lizenz:</strong> {{ aktuellesBeispiel.lizenz }}
          </p>
        </div>
        </div>
      </div>
      <div
          v-else-if="beispielManifestFehler"
          class="alert alert-warning small mb-3 text-start"
          role="status">
        Beispiel-Kampagnen konnten nicht geladen werden: {{ beispielManifestFehler }}
      </div>
      
      <div class="abstandshalter" aria-hidden="true"></div>

    </div>
  `,
};
