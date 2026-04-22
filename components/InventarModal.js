window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

function neueInventarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

window.HTBAH_KOMPONENTEN.InventarModal = {
  props: {
    charakter: { type: Object, required: true },
  },
  data() {
    return {
      inventarModal: null,
      inventarEditId: null,
      inventarBackup: null,
      inventarQuillNachId: {},
      inventarQuillRefFnCache: Object.create(null),
      inventarQuillToolbarCleanup: {},
    };
  },
  methods: {
    inventarModel() {
      return window.HTBAH_CHARAKTER_MODEL;
    },
    inventarTypLabel(typ) {
      if (typ === 'rustung') {
        return 'Rüstung';
      }
      if (typ === 'waffe') {
        return 'Waffe';
      }
      return 'Gegenstand';
    },
    inventarTypBadgeClass(typ) {
      if (typ === 'rustung') {
        return 'text-bg-info';
      }
      if (typ === 'waffe') {
        return 'text-bg-warning';
      }
      return 'text-bg-secondary';
    },
    inventarWerteText(eintrag) {
      const t = eintrag.typ || 'gegenstand';
      if (t === 'gegenstand') {
        return '—';
      }
      if (t === 'rustung') {
        const rw = String(eintrag.rustwert != null ? eintrag.rustwert : '').trim();
        return rw ? `Rüstwert ${rw}` : '—';
      }
      if (t === 'waffe') {
        const sd = String(eintrag.schadenswert != null ? eintrag.schadenswert : '').trim();
        const fern = eintrag.kampfart === 'fernkampf';
        const teile = [];
        if (sd) {
          teile.push(`Schaden ${sd}`);
        }
        teile.push(fern ? 'Fernkampf' : 'Nahkampf');
        return teile.join(' · ');
      }
      return '—';
    },
    inventarTypNachAuswahlAnwenden(eintrag) {
      const M = this.inventarModel();
      if (M && typeof M.inventarEintragNachTypBereinigen === 'function') {
        M.inventarEintragNachTypBereinigen(eintrag);
      }
    },
    oeffnen() {
      const modalElement = this.$refs.inventarModalElement;
      if (!modalElement) {
        return;
      }

      this.inventarModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.inventarModal.show();
    },
    inventarEintragFinden(id) {
      return this.charakter.inventar.find((e) => e.id === id);
    },
    inventarQuillZerstoeren(id) {
      const cleanup = this.inventarQuillToolbarCleanup[id];
      if (typeof cleanup === 'function') {
        cleanup();
        delete this.inventarQuillToolbarCleanup[id];
      }
      delete this.inventarQuillNachId[id];
      this.$nextTick(() => {
        if (this.inventarEditId) {
          return;
        }
        const modal = this.$refs.inventarModalElement;
        if (!modal) {
          return;
        }
        modal.querySelectorAll('.ql-toolbar.ql-snow').forEach((node) => {
          node.remove();
        });
      });
    },
    inventarQuillHostRef(id, el) {
      if (!el) {
        this.inventarQuillZerstoeren(id);
        return;
      }
      if (this.inventarEditId !== id || !window.Quill) {
        return;
      }
      this.$nextTick(() => {
        if (this.inventarQuillNachId[id] || this.inventarEditId !== id) {
          return;
        }
        const eintrag = this.inventarEintragFinden(id);
        if (!eintrag) {
          return;
        }
        const quill = new window.Quill(el, {
          theme: 'snow',
          placeholder: 'Beschreibung…',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              ['clean'],
            ],
          },
        });
        quill.root.innerHTML = eintrag.beschreibungHtml || '';
        this.inventarQuillNachId[id] = quill;

        el.classList.add('inventar-quill-toolbar--hidden');
        const showToolbar = () => el.classList.remove('inventar-quill-toolbar--hidden');
        const hideToolbar = () => el.classList.add('inventar-quill-toolbar--hidden');

        const onFocusIn = (e) => {
          if (
            el.contains(e.target) &&
            (e.target.closest('.ql-editor') || e.target.closest('.ql-toolbar'))
          ) {
            showToolbar();
          }
        };
        const onFocusOut = (e) => {
          const related = e.relatedTarget;
          if (!related || !el.contains(related)) {
            hideToolbar();
          }
        };
        const onSelectionChange = (range) => {
          if (range) {
            showToolbar();
          }
        };

        quill.on('selection-change', onSelectionChange);
        el.addEventListener('focusin', onFocusIn);
        el.addEventListener('focusout', onFocusOut);

        this.inventarQuillToolbarCleanup[id] = () => {
          quill.off('selection-change', onSelectionChange);
          el.removeEventListener('focusin', onFocusIn);
          el.removeEventListener('focusout', onFocusOut);
          if (el && el.parentNode) {
            el.innerHTML = '';
            el.classList.add('inventar-quill-toolbar--hidden');
          }
        };
      });
    },
    inventarBeschreibungRefFn(eintrag) {
      const id = eintrag.id;
      if (!this.inventarQuillRefFnCache[id]) {
        this.inventarQuillRefFnCache[id] = (el) => {
          this.inventarQuillHostRef(id, el);
        };
      }
      return this.inventarQuillRefFnCache[id];
    },
    inventarQuillRefFnEntfernen(id) {
      delete this.inventarQuillRefFnCache[id];
    },
    async inventarBearbeiten(eintrag) {
      if (this.inventarEditId && this.inventarEditId !== eintrag.id) {
        await window.HTBAH.ui.alert({
          titel: 'Bearbeitung läuft',
          beschreibung: 'Bitte die laufende Bearbeitung zuerst speichern oder abbrechen.',
        });
        return;
      }
      this.inventarTypNachAuswahlAnwenden(eintrag);
      this.inventarBackup = {
        name: eintrag.name,
        beschreibungHtml: eintrag.beschreibungHtml,
        typ: eintrag.typ,
        rustwert: eintrag.rustwert,
        schadenswert: eintrag.schadenswert,
        kampfart: eintrag.kampfart,
      };
      this.inventarEditId = eintrag.id;
    },
    inventarSpeichernZeile() {
      const id = this.inventarEditId;
      if (!id) {
        return;
      }
      const eintrag = this.inventarEintragFinden(id);
      const quill = this.inventarQuillNachId[id];
      if (eintrag && quill) {
        eintrag.beschreibungHtml = quill.root.innerHTML;
      }
      const M = this.inventarModel();
      if (eintrag && M && typeof M.inventarEintragNachTypBereinigen === 'function') {
        M.inventarEintragNachTypBereinigen(eintrag);
      }
      this.inventarQuillZerstoeren(id);
      this.inventarQuillRefFnEntfernen(id);
      this.inventarEditId = null;
      this.inventarBackup = null;
    },
    inventarIstInhaltLeer(eintrag) {
      const html = eintrag.beschreibungHtml || '';
      const text = html.replace(/<[^>]*>/g, '').trim();
      return !String(eintrag.name || '').trim() && !text;
    },
    inventarAbbrechenZeile() {
      const id = this.inventarEditId;
      if (!id) {
        return;
      }
      const eintrag = this.inventarEintragFinden(id);
      if (eintrag && this.inventarBackup) {
        Object.assign(eintrag, {
          name: this.inventarBackup.name,
          beschreibungHtml: this.inventarBackup.beschreibungHtml,
          typ: this.inventarBackup.typ,
          rustwert: this.inventarBackup.rustwert,
          schadenswert: this.inventarBackup.schadenswert,
          kampfart: this.inventarBackup.kampfart,
        });
        this.inventarTypNachAuswahlAnwenden(eintrag);
      }
      if (eintrag && this.inventarIstInhaltLeer(eintrag)) {
        const index = this.charakter.inventar.indexOf(eintrag);
        if (index !== -1) {
          this.charakter.inventar.splice(index, 1);
        }
      }
      this.inventarQuillZerstoeren(id);
      this.inventarQuillRefFnEntfernen(id);
      this.inventarEditId = null;
      this.inventarBackup = null;
    },
    async inventarZeileHinzufuegen() {
      if (this.inventarEditId) {
        await window.HTBAH.ui.alert({
          titel: 'Bearbeitung läuft',
          beschreibung: 'Bitte die laufende Bearbeitung zuerst speichern oder abbrechen.',
        });
        return;
      }
      const neu = {
        id: neueInventarId(),
        typ: 'gegenstand',
        name: '',
        beschreibungHtml: '',
      };
      const M = this.inventarModel();
      if (M && typeof M.inventarEintragNachTypBereinigen === 'function') {
        M.inventarEintragNachTypBereinigen(neu);
      }
      this.charakter.inventar.push(neu);
      this.inventarBackup = {
        name: '',
        beschreibungHtml: '',
        typ: 'gegenstand',
        rustwert: undefined,
        schadenswert: undefined,
        kampfart: undefined,
      };
      this.inventarEditId = neu.id;
    },
    async inventarZeileLoeschen(eintrag) {
      const label = eintrag.name || 'diesen Eintrag';
      const bestaetigt = await window.HTBAH.ui.confirm({
        titel: 'Inventar-Eintrag löschen?',
        beschreibung: `„${label}“ wirklich löschen?`,
        bestaetigenText: 'Löschen',
        bestaetigenButtonClass: 'btn-danger',
        warnhinweisAnzeigen: true,
      });
      if (!bestaetigt) {
        return;
      }
      if (this.inventarEditId === eintrag.id) {
        this.inventarQuillZerstoeren(eintrag.id);
        this.inventarQuillRefFnEntfernen(eintrag.id);
        this.inventarEditId = null;
        this.inventarBackup = null;
      } else {
        this.inventarQuillRefFnEntfernen(eintrag.id);
      }
      const index = this.charakter.inventar.indexOf(eintrag);
      if (index !== -1) {
        this.charakter.inventar.splice(index, 1);
      }
    },
    inventarModalGeschlossen() {
      if (this.inventarEditId) {
        this.inventarSpeichernZeile();
      }
    },
  },
  mounted() {
    const inventarModalElement = this.$refs.inventarModalElement;
    if (inventarModalElement) {
      inventarModalElement.addEventListener('hidden.bs.modal', this.inventarModalGeschlossen);
    }
  },
  beforeUnmount() {
    const inventarModalElement = this.$refs.inventarModalElement;
    if (inventarModalElement) {
      inventarModalElement.removeEventListener(
        'hidden.bs.modal',
        this.inventarModalGeschlossen,
      );
    }

    Object.keys(this.inventarQuillNachId).forEach((id) => this.inventarQuillZerstoeren(id));
  },
  template: `
    <div
      class="modal fade"
      id="inventarEditorModal"
      ref="inventarModalElement"
      tabindex="-1"
      aria-labelledby="inventarEditorLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="inventarEditorLabel">Inventar</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body inventar-modal-body">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
              <p class="small text-body-secondary mb-0">
                Pro Zeile ein Eintrag (Gegenstand, Rüstung oder Waffe); Beschreibung mit Formatierung
                (inkl. Farben).
              </p>
              <icon-text-button
                type="button"
                class="btn btn-sm btn-outline-primary flex-shrink-0"
                icon="add"
                @click="inventarZeileHinzufuegen"
                aria-label="Eintrag hinzufügen">
                Hinzufügen
              </icon-text-button>
            </div>
            <div class="table-responsive inventar-tabelle-wrap d-none d-md-block">
              <table class="table table-sm align-middle mb-0 inventar-tabelle">
                <thead>
                  <tr>
                    <th scope="col" class="inventar-col-art">Art</th>
                    <th scope="col" class="inventar-col-name">Name</th>
                    <th scope="col" class="inventar-col-werte">Werte</th>
                    <th scope="col" class="inventar-col-beschreibung">Beschreibung</th>
                    <th scope="col" class="inventar-col-aktion text-end">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!charakter.inventar.length">
                    <td colspan="5" class="text-body-secondary small py-2">
                      Noch keine Gegenstände — „Hinzufügen“ nutzen.
                    </td>
                  </tr>
                  <tr v-for="eintrag in charakter.inventar" :key="eintrag.id">
                    <td class="inventar-col-art">
                      <span
                        v-if="inventarEditId !== eintrag.id"
                        class="badge inventar-typ-badge"
                        :class="inventarTypBadgeClass(eintrag.typ || 'gegenstand')">
                        {{ inventarTypLabel(eintrag.typ || 'gegenstand') }}
                      </span>
                      <select
                        v-else
                        class="form-select form-select-sm"
                        v-model="eintrag.typ"
                        @change="inventarTypNachAuswahlAnwenden(eintrag)"
                        aria-label="Art des Eintrags">
                        <option value="gegenstand">Gegenstand</option>
                        <option value="rustung">Rüstung</option>
                        <option value="waffe">Waffe</option>
                      </select>
                    </td>
                    <td class="inventar-col-name">
                      <span v-if="inventarEditId !== eintrag.id" class="small fw-bold">{{ eintrag.name || '—' }}</span>
                      <input
                        v-else
                        class="form-control form-control-sm"
                        v-model="eintrag.name"
                        placeholder="Name"
                        autocomplete="off" />
                    </td>
                    <td class="inventar-col-werte small">
                      <template v-if="inventarEditId !== eintrag.id">
                        <span class="text-body-secondary">{{ inventarWerteText(eintrag) }}</span>
                      </template>
                      <template v-else>
                        <span v-if="eintrag.typ === 'gegenstand'" class="text-body-secondary">—</span>
                        <input
                          v-else-if="eintrag.typ === 'rustung'"
                          class="form-control form-control-sm"
                          v-model="eintrag.rustwert"
                          placeholder="Rüstwert"
                          inputmode="decimal"
                          autocomplete="off" />
                        <div v-else-if="eintrag.typ === 'waffe'" class="d-flex flex-column gap-1">
                          <input
                            class="form-control form-control-sm"
                            v-model="eintrag.schadenswert"
                            placeholder="Schadenswert"
                            autocomplete="off" />
                          <div class="btn-group btn-group-sm" role="group" aria-label="Nah- oder Fernkampf">
                            <button
                              type="button"
                              class="btn"
                              :class="
                                eintrag.kampfart === 'nahkampf'
                                  ? 'btn-primary'
                                  : 'btn-outline-secondary'
                              "
                              @click="eintrag.kampfart = 'nahkampf'">
                              Nahkampf
                            </button>
                            <button
                              type="button"
                              class="btn"
                              :class="
                                eintrag.kampfart === 'fernkampf'
                                  ? 'btn-primary'
                                  : 'btn-outline-secondary'
                              "
                              @click="eintrag.kampfart = 'fernkampf'">
                              Fernkampf
                            </button>
                          </div>
                        </div>
                      </template>
                    </td>
                    <td class="inventar-col-beschreibung">
                      <div
                        v-if="inventarEditId !== eintrag.id"
                        class="inventar-beschreibung-vorschau small"
                        v-html="eintrag.beschreibungHtml"></div>
                      <div
                        v-else
                        :ref="inventarBeschreibungRefFn(eintrag)"
                        class="quill-editor-host inventar-beschreibung-quill"></div>
                    </td>
                    <td class="inventar-col-aktion text-end text-nowrap">
                      <template v-if="inventarEditId !== eintrag.id">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center py-0 px-2"
                          @click="inventarBearbeiten(eintrag)"
                          aria-label="Bearbeiten">
                          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center py-0 px-2 ms-1"
                          @click="inventarZeileLoeschen(eintrag)"
                          aria-label="Löschen">
                          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </template>
                      <template v-else>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center py-0 px-2"
                          @click="inventarSpeichernZeile"
                          aria-label="Speichern">
                          <span class="material-symbols-outlined" aria-hidden="true">save</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary py-0 px-2 ms-1"
                          @click="inventarAbbrechenZeile">
                          Abbrechen
                        </button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="d-md-none inventar-mobile-list">
              <div v-if="!charakter.inventar.length" class="text-body-secondary small py-2">
                Noch keine Gegenstände — „Hinzufügen“ nutzen.
              </div>
              <div
                v-for="eintrag in charakter.inventar"
                :key="'inventar-card-' + eintrag.id"
                class="card inventar-mobile-card mb-2">
                <div class="card-body p-2">
                  <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div class="flex-grow-1">
                      <span
                        v-if="inventarEditId !== eintrag.id"
                        class="badge inventar-typ-badge mb-1"
                        :class="inventarTypBadgeClass(eintrag.typ || 'gegenstand')">
                        {{ inventarTypLabel(eintrag.typ || 'gegenstand') }}
                      </span>
                      <select
                        v-else
                        class="form-select form-select-sm mb-1"
                        v-model="eintrag.typ"
                        @change="inventarTypNachAuswahlAnwenden(eintrag)"
                        aria-label="Art des Eintrags">
                        <option value="gegenstand">Gegenstand</option>
                        <option value="rustung">Rüstung</option>
                        <option value="waffe">Waffe</option>
                      </select>
                      <div v-if="inventarEditId !== eintrag.id" class="small fw-bold">
                        {{ eintrag.name || '—' }}
                      </div>
                      <input
                        v-else
                        class="form-control form-control-sm"
                        v-model="eintrag.name"
                        placeholder="Name"
                        autocomplete="off" />
                    </div>
                    <div class="dropdown">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center py-0 px-1"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        aria-label="Aktionen für Eintrag"
                        @click.stop>
                        <span class="material-symbols-outlined" aria-hidden="true">more_vert</span>
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li v-if="inventarEditId !== eintrag.id">
                          <button type="button" class="dropdown-item" @click="inventarBearbeiten(eintrag)">
                            Bearbeiten
                          </button>
                        </li>
                        <li v-if="inventarEditId === eintrag.id">
                          <button type="button" class="dropdown-item" @click="inventarSpeichernZeile">
                            Speichern
                          </button>
                        </li>
                        <li v-if="inventarEditId === eintrag.id">
                          <button type="button" class="dropdown-item" @click="inventarAbbrechenZeile">
                            Abbrechen
                          </button>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                          <button type="button" class="dropdown-item text-danger" @click="inventarZeileLoeschen(eintrag)">
                            Löschen
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="small mb-2">
                    <span class="text-body-secondary">Werte:</span>
                    <template v-if="inventarEditId !== eintrag.id">
                      <span class="text-body-secondary">{{ inventarWerteText(eintrag) }}</span>
                    </template>
                    <template v-else>
                      <span v-if="eintrag.typ === 'gegenstand'" class="text-body-secondary">—</span>
                      <input
                        v-else-if="eintrag.typ === 'rustung'"
                        class="form-control form-control-sm mt-1"
                        v-model="eintrag.rustwert"
                        placeholder="Rüstwert"
                        inputmode="decimal"
                        autocomplete="off" />
                      <div v-else-if="eintrag.typ === 'waffe'" class="d-flex flex-column gap-1 mt-1">
                        <input
                          class="form-control form-control-sm"
                          v-model="eintrag.schadenswert"
                          placeholder="Schadenswert"
                          autocomplete="off" />
                        <div class="btn-group btn-group-sm" role="group" aria-label="Nah- oder Fernkampf">
                          <button
                            type="button"
                            class="btn"
                            :class="
                              eintrag.kampfart === 'nahkampf'
                                ? 'btn-primary'
                                : 'btn-outline-secondary'
                            "
                            @click="eintrag.kampfart = 'nahkampf'">
                            Nahkampf
                          </button>
                          <button
                            type="button"
                            class="btn"
                            :class="
                              eintrag.kampfart === 'fernkampf'
                                ? 'btn-primary'
                                : 'btn-outline-secondary'
                            "
                            @click="eintrag.kampfart = 'fernkampf'">
                            Fernkampf
                          </button>
                        </div>
                      </div>
                    </template>
                  </div>
                  <div
                    v-if="inventarEditId !== eintrag.id"
                    class="inventar-beschreibung-vorschau small"
                    v-html="eintrag.beschreibungHtml"></div>
                  <div
                    v-else
                    :ref="inventarBeschreibungRefFn(eintrag)"
                    class="quill-editor-host inventar-beschreibung-quill"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
