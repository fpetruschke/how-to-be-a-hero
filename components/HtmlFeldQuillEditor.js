window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.HtmlFeldQuillEditor = {
  name: 'HtmlFeldQuillEditor',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    editorKey: { type: String, required: true },
    minHeight: { type: String, default: '5rem' },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      quill: null,
      mentionController: null,
      textChangeHandler: null,
      externSyncAktiv: false,
    };
  },
  watch: {
    modelValue(neu) {
      if (!this.quill || this.externSyncAktiv) {
        return;
      }
      const html = typeof neu === 'string' ? neu : '';
      if (this.quill.root.innerHTML !== html) {
        this.quill.root.innerHTML = html;
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.hostElement) {
        this.initialisieren(this.$refs.hostElement);
      }
    });
  },
  beforeUnmount() {
    this.aufraeumen();
  },
  methods: {
    initialisieren(hostEl) {
      const el = hostEl || this.$refs.hostElement;
      if (!el || !window.Quill || this.quill) {
        return;
      }
      const quill = new window.Quill(el, {
        theme: 'snow',
        placeholder: this.placeholder || '',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean'],
          ],
        },
      });
      quill.root.innerHTML = this.modelValue || '';
      this.textChangeHandler = () => {
        this.externSyncAktiv = true;
        this.$emit('update:modelValue', quill.root.innerHTML);
        this.$nextTick(() => {
          this.externSyncAktiv = false;
        });
      };
      quill.on('text-change', this.textChangeHandler);
      const mentionApi = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillEntityMentions;
      if (mentionApi && typeof mentionApi.installMentions === 'function') {
        this.mentionController = mentionApi.installMentions(quill, {
          getItems: (query) => mentionApi.collectMentionItems(query),
          onEntityClick: (target) => mentionApi.oeffneEntitaetGlobal(target),
        });
      }
      const mobil =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(max-width: 767.98px)').matches;
      if (mobil) {
        el.classList.add('html-feld-quill--mobil');
      } else {
        el.classList.add('html-feld-quill-toolbar--hidden');
      }
      const showToolbar = () => el.classList.remove('html-feld-quill-toolbar--hidden');
      const hideToolbar = () => {
        if (!mobil) {
          el.classList.add('html-feld-quill-toolbar--hidden');
        }
      };
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
      if (!mobil) {
        quill.on('selection-change', onSelectionChange);
        el.addEventListener('focusin', onFocusIn);
        el.addEventListener('focusout', onFocusOut);
      }
      this.quill = quill;
      this._toolbarCleanup = () => {
        if (!mobil) {
          quill.off('selection-change', onSelectionChange);
          el.removeEventListener('focusin', onFocusIn);
          el.removeEventListener('focusout', onFocusOut);
        }
      };
    },
    aufraeumen() {
      const lifecycle = window.HTBAH_SHARED && window.HTBAH_SHARED.QuillLifecycle;
      if (lifecycle && typeof lifecycle.zerstoereQuillInstanz === 'function') {
        lifecycle.zerstoereQuillInstanz({
          quill: this.quill,
          hostElement: this.$refs.hostElement || null,
          mentionController: this.mentionController,
          handler: this.textChangeHandler
            ? [{ event: 'text-change', fn: this.textChangeHandler }]
            : [],
        });
      } else if (this.mentionController && typeof this.mentionController.destroy === 'function') {
        this.mentionController.destroy();
      }
      if (typeof this._toolbarCleanup === 'function') {
        this._toolbarCleanup();
        this._toolbarCleanup = null;
      }
      this.mentionController = null;
      this.quill = null;
      this.textChangeHandler = null;
    },
    syncInhalt() {
      if (this.quill) {
        this.$emit('update:modelValue', this.quill.root.innerHTML);
      }
    },
  },
  template: `
    <div class="html-feld-quill-wrap" :style="{ '--html-feld-quill-min-h': minHeight }">
      <div
        :key="'html-feld-quill-' + editorKey"
        ref="hostElement"
        class="quill-editor-host html-feld-quill-host inventar-beschreibung-quill"></div>
    </div>
  `,
};
