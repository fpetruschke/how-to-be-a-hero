window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.NotizenModal = {
  props: {
    journalHtml: { type: String, default: '' },
  },
  emits: ['update:journalHtml'],
  data() {
    return {
      notizenModal: null,
      notizenQuill: null,
      mentionController: null,
    };
  },
  methods: {
    oeffnen() {
      const modalElement = this.$refs.notizenModalElement;
      if (!modalElement) {
        return;
      }

      this.notizenModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
      this.notizenModal.show();
      this.$nextTick(() => this.notizenEditorInitialisieren());
    },
    notizenEditorInitialisieren() {
      if (!window.Quill || !this.$refs.notizenEditorElement) {
        return;
      }

      if (!this.notizenQuill) {
        this.notizenQuill = new window.Quill(this.$refs.notizenEditorElement, {
          theme: 'snow',
          placeholder: 'Halte Ereignisse und Gedanken fest...',
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              [{ header: [1, 2, false] }],
              ['clean'],
            ],
          },
        });
        const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
        if (mentionApi && typeof mentionApi.installMentions === 'function') {
          this.mentionController = mentionApi.installMentions(this.notizenQuill, {
            getItems: (query) => mentionApi.collectMentionItems(query),
            onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
          });
        }
      }

      this.notizenQuill.root.innerHTML = this.journalHtml || '';
    },
    notizenSpeichern() {
      if (this.notizenQuill) {
        this.$emit('update:journalHtml', this.notizenQuill.root.innerHTML);
      }
      if (this.notizenModal) {
        this.notizenModal.hide();
      }
    },
  },
  beforeUnmount() {
    if (this.mentionController && typeof this.mentionController.destroy === 'function') {
      this.mentionController.destroy();
    }
    this.mentionController = null;
    if (this.notizenQuill) {
      this.notizenQuill = null;
    }
  },
  template: `
    <div
      class="modal fade"
      id="notizenEditorModal"
      ref="notizenModalElement"
      tabindex="-1"
      aria-labelledby="notizenEditorLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="notizenEditorLabel">Notizen</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            <div ref="notizenEditorElement" class="quill-editor-host"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Abbrechen
            </button>
            <button type="button" class="btn btn-primary" @click="notizenSpeichern">
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
