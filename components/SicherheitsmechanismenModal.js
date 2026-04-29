window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.SicherheitsmechanismenModal = {
  props: {
    offen: { type: Boolean, default: false },
    wert: { type: Object, default: () => ({}) },
    nurLesen: { type: Boolean, default: false },
  },
  emits: ['update:offen', 'update:wert'],
  data() {
    return {
      modalInstanz: null,
      tabuQuill: null,
      schleierQuill: null,
      tabuMentionController: null,
      schleierMentionController: null,
      lokaleDaten: {
        tabuHtml: '',
        schleierHtml: '',
      },
    };
  },
  watch: {
    offen(istOffen) {
      if (istOffen) {
        this.oeffneModal();
      } else {
        this.schliesseModal();
      }
    },
    wert: {
      deep: true,
      handler(neu) {
        this.lokaleDaten = {
          tabuHtml: typeof neu?.tabuHtml === 'string' ? neu.tabuHtml : '',
          schleierHtml: typeof neu?.schleierHtml === 'string' ? neu.schleierHtml : '',
        };
        this.syncEditorInhalte();
      },
    },
  },
  mounted() {
    this.lokaleDaten = {
      tabuHtml: typeof this.wert?.tabuHtml === 'string' ? this.wert.tabuHtml : '',
      schleierHtml: typeof this.wert?.schleierHtml === 'string' ? this.wert.schleierHtml : '',
    };
    if (this.offen) {
      this.oeffneModal();
    }
  },
  beforeUnmount() {
    if (this.tabuMentionController && typeof this.tabuMentionController.destroy === 'function') {
      this.tabuMentionController.destroy();
    }
    if (this.schleierMentionController && typeof this.schleierMentionController.destroy === 'function') {
      this.schleierMentionController.destroy();
    }
    this.tabuMentionController = null;
    this.schleierMentionController = null;
    this.tabuQuill = null;
    this.schleierQuill = null;
    this.modalInstanz = null;
  },
  methods: {
    oeffneModal() {
      const el = this.$refs.modalElement;
      if (!el) {
        return;
      }
      if (window.bootstrap) {
        this.modalInstanz = window.bootstrap.Modal.getOrCreateInstance(el);
        this.modalInstanz.show();
      }
      this.$nextTick(() => {
        this.editorenInitialisieren();
      });
    },
    schliesseModal() {
      if (this.modalInstanz) {
        this.modalInstanz.hide();
        return;
      }
      this.$emit('update:offen', false);
    },
    onModalHidden() {
      this.modalInstanz = null;
      this.$emit('update:offen', false);
    },
    editorenInitialisieren() {
      if (this.nurLesen || !window.Quill) {
        return;
      }
      if (!this.tabuQuill && this.$refs.tabuEditorElement) {
        this.tabuQuill = new window.Quill(this.$refs.tabuEditorElement, {
          theme: 'snow',
          placeholder: 'Welche Inhalte sollen in diesem Abenteuer gar nicht vorkommen?',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote'],
              ['clean'],
            ],
          },
        });
        this.tabuQuill.on('text-change', () => {
          this.lokaleDaten.tabuHtml = this.tabuQuill.root.innerHTML;
          this.emittiereAenderung();
        });
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.tabuMentionController = mentionApi.installMentions(this.tabuQuill, {
            getItems: (query) => mentionApi.collectMentionItems(query),
            onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
          });
        }
      }
      if (!this.schleierQuill && this.$refs.schleierEditorElement) {
        this.schleierQuill = new window.Quill(this.$refs.schleierEditorElement, {
          theme: 'snow',
          placeholder: 'Welche Inhalte sollen nur angedeutet und dann ausgeblendet werden?',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote'],
              ['clean'],
            ],
          },
        });
        this.schleierQuill.on('text-change', () => {
          this.lokaleDaten.schleierHtml = this.schleierQuill.root.innerHTML;
          this.emittiereAenderung();
        });
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.schleierMentionController = mentionApi.installMentions(this.schleierQuill, {
            getItems: (query) => mentionApi.collectMentionItems(query),
            onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
          });
        }
      }
      this.syncEditorInhalte();
    },
    syncEditorInhalte() {
      if (this.tabuQuill) {
        this.tabuQuill.root.innerHTML = this.lokaleDaten.tabuHtml || '';
      }
      if (this.schleierQuill) {
        this.schleierQuill.root.innerHTML = this.lokaleDaten.schleierHtml || '';
      }
    },
    emittiereAenderung() {
      this.$emit('update:wert', {
        tabuHtml: this.lokaleDaten.tabuHtml || '',
        schleierHtml: this.lokaleDaten.schleierHtml || '',
      });
    },
    exportiereSeparat() {
      const paket = {
        htbahExportVersion: 1,
        typ: 'sicherheitsmechanismen',
        exportiertAm: new Date().toISOString(),
        sicherheitsmechanismen: {
          tabuHtml: this.lokaleDaten.tabuHtml || '',
          schleierHtml: this.lokaleDaten.schleierHtml || '',
        },
      };
      window.HTBAH.dateiHerunterladenJson(paket, 'htbah-sicherheitsmechanismen.json');
    },
  },
  template: `
    <div
      ref="modalElement"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="htbahSicherheitsmechanismenTitel"
      aria-hidden="true"
      @hidden.bs.modal="onModalHidden">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="htbahSicherheitsmechanismenTitel">Sicherheitsmechanismen</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
          </div>
          <div class="modal-body" :class="{ 'htbah-sicherheits-readonly': nurLesen }">
            <div v-if="nurLesen" class="alert alert-danger border-danger mb-3">
              <strong>Hinweis zur X-Karte:</strong> Wenn jemand die rote X-Karte legt, wird die Szene sofort beendet
              oder übersprungen. Es gibt keine Nachfragen und keine Rechtfertigungspflicht.
            </div>
            <div v-if="!nurLesen" class="alert alert-danger border-danger mb-3">
              <strong>Session Zero ist Pflicht:</strong> Grenzen und Schleier gemeinsam festlegen und die X-Karte vereinbaren.
              Wenn eine X-Karte liegt: Szene sofort beenden, keine Nachfragen, keine Rechtfertigung.
              Menschen haben ihre Gründe.
              <div class="mt-2 small">
                Beispiel bei X-Karte: „Danke fürs Signal. Wir schneiden die Szene sofort raus. Nächster Schnitt:
                Ihr steht am Morgen gemeinsam im Speiseraum. Was tut ihr als Nächstes?“
              </div>
            </div>

            <div class="card p-3 mb-3">
              <h6 class="mb-2">Diese Inhalte wollen wir nicht:</h6>
              <p v-if="!nurLesen" class="small text-body-secondary mb-2">
                Formulierungshilfe für die Spielleitung:
                „Ich stoppe die Szene hier und schneide direkt weiter, damit wir bei unserem vereinbarten Rahmen bleiben.“
              </p>
              <div v-if="nurLesen" class="htbah-sicherheits-readonly-card">
                <div class="htbah-pdf-html" v-html="lokaleDaten.tabuHtml || '<p>Keine Einträge.</p>'"></div>
              </div>
              <div v-else ref="tabuEditorElement" class="quill-editor-host htbah-sicherheits-quill"></div>
            </div>

            <div class="card p-3 mb-3">
              <h6 class="mb-2">Diese Inhalte sollen verschleiert werden:</h6>
              <p v-if="!nurLesen" class="small text-body-secondary mb-2">
                Formulierungshilfe für die Spielleitung:
                „Der Schleier senkt sich über diesen Moment. Am nächsten Morgen trefft ihr euch wieder im Speiseraum.“
              </p>
              <div v-if="nurLesen" class="htbah-sicherheits-readonly-card">
                <div class="htbah-pdf-html" v-html="lokaleDaten.schleierHtml || '<p>Keine Einträge.</p>'"></div>
              </div>
              <div v-else ref="schleierEditorElement" class="quill-editor-host htbah-sicherheits-quill"></div>
            </div>

            <div v-if="!nurLesen" class="mb-3">
              <h6 class="mb-2">Export</h6>
              <div class="card p-3">
                <p class="small text-body-secondary mb-3 mb-md-0">
                  Bitte stelle den Spielenden die Export-Datei im Rahmen der Session-Zero für den Import zur Verfügung.
                  So haben alle jederzeit Zugriff auf die vereinbarten Grenzen und Schleier.
                </p>
                <div class="mt-3">
                  <button type="button" class="btn btn-outline-secondary" @click="exportiereSeparat">Export</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-end">
            <icon-text-button
              type="button"
              class="btn btn-outline-success"
              icon="check"
              data-bs-dismiss="modal">
              Schließen
            </icon-text-button>
          </div>
        </div>
      </div>
    </div>
  `,
};
