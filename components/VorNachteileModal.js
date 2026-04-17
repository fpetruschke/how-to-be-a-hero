window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

function neueVorNachteilPaarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `vn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

window.HTBAH_KOMPONENTEN.VorNachteileModal = {
  props: {
    charakter: { type: Object, required: true },
  },
  data() {
    return {
      modalInstanz: null,
      editId: null,
      backup: null,
      quillNachPaarId: {},
      quillRefFnCache: Object.create(null),
      quillToolbarCleanup: {},
    };
  },
  methods: {
    oeffnen() {
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
      this.modalInstanz.show();
    },
    paarFinden(id) {
      return this.charakter.vorNachteilePaare.find((p) => p.id === id);
    },
    quillCleanupKey(id, feld) {
      return `${id}::${feld}`;
    },
    quillTeilZerstoeren(id, feld) {
      const key = this.quillCleanupKey(id, feld);
      const cleanup = this.quillToolbarCleanup[key];
      if (typeof cleanup === 'function') {
        cleanup();
        delete this.quillToolbarCleanup[key];
      }
      const bucket = this.quillNachPaarId[id];
      if (bucket) {
        bucket[feld] = null;
      }
    },
    quillZerstoeren(id) {
      this.quillTeilZerstoeren(id, 'vorteil');
      this.quillTeilZerstoeren(id, 'nachteil');
      delete this.quillNachPaarId[id];
      this.$nextTick(() => {
        if (this.editId) {
          return;
        }
        const modal = this.$refs.modalElement;
        if (!modal) {
          return;
        }
        modal.querySelectorAll('.ql-toolbar.ql-snow').forEach((node) => {
          node.remove();
        });
      });
    },
    quillHostRef(id, feld, el) {
      if (!el) {
        this.quillTeilZerstoeren(id, feld);
        return;
      }
      if (this.editId !== id || !window.Quill) {
        return;
      }
      this.$nextTick(() => {
        const bucket = this.quillNachPaarId[id];
        if (!bucket || bucket[feld] || this.editId !== id) {
          return;
        }
        const paar = this.paarFinden(id);
        if (!paar) {
          return;
        }
        const htmlKey = feld === 'vorteil' ? 'vorteilHtml' : 'nachteilHtml';
        const quill = new window.Quill(el, {
          theme: 'snow',
          placeholder: feld === 'vorteil' ? 'Vorteil…' : 'Nachteil…',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              ['clean'],
            ],
          },
        });
        quill.root.innerHTML = paar[htmlKey] || '';
        bucket[feld] = quill;

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

        const cleanupTeil = () => {
          quill.off('selection-change', onSelectionChange);
          el.removeEventListener('focusin', onFocusIn);
          el.removeEventListener('focusout', onFocusOut);
          if (el && el.parentNode) {
            el.innerHTML = '';
            el.classList.add('inventar-quill-toolbar--hidden');
          }
        };

        this.quillToolbarCleanup[this.quillCleanupKey(id, feld)] = cleanupTeil;
      });
    },
    vorteilRefFn(eintrag) {
      const id = eintrag.id;
      const key = `${id}-v`;
      if (!this.quillRefFnCache[key]) {
        this.quillRefFnCache[key] = (el) => {
          if (!el) {
            this.quillHostRef(id, 'vorteil', null);
            return;
          }
          if (!this.quillNachPaarId[id]) {
            this.quillNachPaarId[id] = { vorteil: null, nachteil: null };
          }
          this.quillHostRef(id, 'vorteil', el);
        };
      }
      return this.quillRefFnCache[key];
    },
    nachteilRefFn(eintrag) {
      const id = eintrag.id;
      const key = `${id}-n`;
      if (!this.quillRefFnCache[key]) {
        this.quillRefFnCache[key] = (el) => {
          if (!el) {
            this.quillHostRef(id, 'nachteil', null);
            return;
          }
          if (!this.quillNachPaarId[id]) {
            this.quillNachPaarId[id] = { vorteil: null, nachteil: null };
          }
          this.quillHostRef(id, 'nachteil', el);
        };
      }
      return this.quillRefFnCache[key];
    },
    quillRefFnEntfernen(id) {
      delete this.quillRefFnCache[`${id}-v`];
      delete this.quillRefFnCache[`${id}-n`];
    },
    bearbeiten(eintrag) {
      if (this.editId && this.editId !== eintrag.id) {
        alert('Bitte die laufende Bearbeitung zuerst speichern oder abbrechen.');
        return;
      }
      this.backup = {
        vorteilHtml: eintrag.vorteilHtml,
        nachteilHtml: eintrag.nachteilHtml,
      };
      this.quillNachPaarId[eintrag.id] = { vorteil: null, nachteil: null };
      this.editId = eintrag.id;
    },
    speichernZeile() {
      const id = this.editId;
      if (!id) {
        return;
      }
      const paar = this.paarFinden(id);
      const bucket = this.quillNachPaarId[id];
      if (paar && bucket) {
        if (bucket.vorteil) {
          paar.vorteilHtml = bucket.vorteil.root.innerHTML;
        }
        if (bucket.nachteil) {
          paar.nachteilHtml = bucket.nachteil.root.innerHTML;
        }
      }
      this.quillZerstoeren(id);
      this.quillRefFnEntfernen(id);
      this.editId = null;
      this.backup = null;
    },
    istInhaltLeer(eintrag) {
      const leer = (html) => {
        const t = String(html || '')
          .replace(/<[^>]*>/g, '')
          .trim();
        return !t;
      };
      return leer(eintrag.vorteilHtml) && leer(eintrag.nachteilHtml);
    },
    abbrechenZeile() {
      const id = this.editId;
      if (!id) {
        return;
      }
      const paar = this.paarFinden(id);
      if (paar && this.backup) {
        paar.vorteilHtml = this.backup.vorteilHtml;
        paar.nachteilHtml = this.backup.nachteilHtml;
      }
      if (paar && this.istInhaltLeer(paar)) {
        const index = this.charakter.vorNachteilePaare.indexOf(paar);
        if (index !== -1) {
          this.charakter.vorNachteilePaare.splice(index, 1);
        }
      }
      this.quillZerstoeren(id);
      this.quillRefFnEntfernen(id);
      this.editId = null;
      this.backup = null;
    },
    paarHinzufuegen() {
      if (this.editId) {
        alert('Bitte die laufende Bearbeitung zuerst speichern oder abbrechen.');
        return;
      }
      const neu = {
        id: neueVorNachteilPaarId(),
        vorteilHtml: '',
        nachteilHtml: '',
      };
      this.charakter.vorNachteilePaare.push(neu);
      this.backup = { vorteilHtml: '', nachteilHtml: '' };
      this.quillNachPaarId[neu.id] = { vorteil: null, nachteil: null };
      this.editId = neu.id;
    },
    paarLoeschen(eintrag) {
      if (!confirm('Dieses Paar wirklich löschen?')) {
        return;
      }
      if (this.editId === eintrag.id) {
        this.quillZerstoeren(eintrag.id);
        this.quillRefFnEntfernen(eintrag.id);
        this.editId = null;
        this.backup = null;
      } else {
        this.quillRefFnEntfernen(eintrag.id);
      }
      const index = this.charakter.vorNachteilePaare.indexOf(eintrag);
      if (index !== -1) {
        this.charakter.vorNachteilePaare.splice(index, 1);
      }
    },
    modalGeschlossen() {
      if (this.editId) {
        this.speichernZeile();
      }
    },
  },
  mounted() {
    const modalElement = this.$refs.modalElement;
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', this.modalGeschlossen);
    }
  },
  beforeUnmount() {
    const modalElement = this.$refs.modalElement;
    if (modalElement) {
      modalElement.removeEventListener('hidden.bs.modal', this.modalGeschlossen);
    }
    const ids = Object.keys(this.quillNachPaarId);
    ids.forEach((id) => this.quillZerstoeren(id));
  },
  template: `
    <div
      class="modal fade"
      id="vorNachteileEditorModal"
      ref="modalElement"
      tabindex="-1"
      aria-labelledby="vorNachteileEditorLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="vorNachteileEditorLabel">Vor- & Nachteile</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body inventar-modal-body">
            <p class="small text-body-secondary mb-2">
              Pro Zeile ein Paar: <strong>Vorteil</strong> (kostet Fähigkeitspunkte) und
              <strong>Nachteil</strong> (gewährt Fähigkeitspunkte) — die Punkte eines Paares
              müssen sich ausgleichen. Text mit Formatierung wie im Inventar.
            </p>
            <div class="d-flex align-items-center justify-content-end gap-2 mb-2">
              <icon-text-button
                type="button"
                class="btn btn-sm btn-outline-primary flex-shrink-0"
                icon="add"
                @click="paarHinzufuegen"
                aria-label="Paar hinzufügen">
                Paar hinzufügen
              </icon-text-button>
            </div>
            <div class="table-responsive inventar-tabelle-wrap">
              <table class="table table-sm align-middle mb-0 inventar-tabelle vor-nachteile-tabelle">
                <thead>
                  <tr>
                    <th scope="col" class="vn-col-vorteil">Vorteil</th>
                    <th scope="col" class="vn-col-nachteil">Nachteil</th>
                    <th scope="col" class="inventar-col-aktion text-end">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!charakter.vorNachteilePaare.length">
                    <td colspan="3" class="text-body-secondary small py-2">
                      Noch keine Paare — „Paar hinzufügen“ nutzen.
                    </td>
                  </tr>
                  <tr v-for="eintrag in charakter.vorNachteilePaare" :key="eintrag.id">
                    <td class="vn-col-vorteil">
                      <div
                        v-if="editId !== eintrag.id"
                        class="inventar-beschreibung-vorschau small"
                        v-html="eintrag.vorteilHtml"></div>
                      <div
                        v-else
                        :ref="vorteilRefFn(eintrag)"
                        class="quill-editor-host inventar-beschreibung-quill"></div>
                    </td>
                    <td class="vn-col-nachteil">
                      <div
                        v-if="editId !== eintrag.id"
                        class="inventar-beschreibung-vorschau small"
                        v-html="eintrag.nachteilHtml"></div>
                      <div
                        v-else
                        :ref="nachteilRefFn(eintrag)"
                        class="quill-editor-host inventar-beschreibung-quill"></div>
                    </td>
                    <td class="inventar-col-aktion text-end text-nowrap">
                      <template v-if="editId !== eintrag.id">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center py-0 px-2"
                          @click="bearbeiten(eintrag)"
                          aria-label="Bearbeiten">
                          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center py-0 px-2 ms-1"
                          @click="paarLoeschen(eintrag)"
                          aria-label="Löschen">
                          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </template>
                      <template v-else>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center py-0 px-2"
                          @click="speichernZeile"
                          aria-label="Speichern">
                          <span class="material-symbols-outlined" aria-hidden="true">save</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary py-0 px-2 ms-1"
                          @click="abbrechenZeile">
                          Abbrechen
                        </button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
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
