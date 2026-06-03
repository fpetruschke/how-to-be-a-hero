window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

window.HTBAH_KOMPONENTEN.ModalMinimizeDock = {
  data() {
    return {
      ziehtIndex: null,
      dropIndex: null,
      ziehenAktiv: false,
      pointerSort: null,
      _pointerSortMoveHandler: null,
      _pointerSortUpHandler: null,
    };
  },
  computed: {
    eintraege() {
      const dock = window.HTBAH_MODAL_FENSTER && window.HTBAH_MODAL_FENSTER.dock;
      return dock && dock.eintraege ? dock.eintraege : [];
    },
  },
  beforeUnmount() {
    this.pointerSortAufraeumen();
  },
  methods: {
    leisteAktivieren(eintrag) {
      if (this.ziehenAktiv || !eintrag || typeof eintrag.wiederherstellen !== 'function') {
        return;
      }
      eintrag.wiederherstellen();
    },
    leisteTastatur(event, eintrag) {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      this.leisteAktivieren(eintrag);
    },
    dragStart(event, index) {
      this.ziehtIndex = index;
      this.ziehenAktiv = false;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
      }
    },
    dragEnd() {
      this.ziehtIndex = null;
      this.dropIndex = null;
      window.setTimeout(() => {
        this.ziehenAktiv = false;
      }, 0);
    },
    dragOver(event, index) {
      event.preventDefault();
      if (this.ziehtIndex === null || this.ziehtIndex === index) {
        return;
      }
      this.ziehenAktiv = true;
      this.dropIndex = index;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    },
    dragLeave(index) {
      if (this.dropIndex === index) {
        this.dropIndex = null;
      }
    },
    drop(event, index) {
      event.preventDefault();
      const von = this.ziehtIndex;
      if (von !== null && von !== index && window.HTBAH_MODAL_FENSTER) {
        window.HTBAH_MODAL_FENSTER.dock.verschiebe(von, index);
      }
      this.dragEnd();
    },
    pointerSortAufraeumen() {
      if (this._pointerSortMoveHandler) {
        document.removeEventListener('pointermove', this._pointerSortMoveHandler);
        this._pointerSortMoveHandler = null;
      }
      if (this._pointerSortUpHandler) {
        document.removeEventListener('pointerup', this._pointerSortUpHandler);
        document.removeEventListener('pointercancel', this._pointerSortUpHandler);
        this._pointerSortUpHandler = null;
      }
      this.pointerSort = null;
    },
    griffPointerDown(event, index) {
      if (event.button != null && event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.pointerSortAufraeumen();
      this.pointerSort = {
        vonIndex: index,
        pointerId: event.pointerId,
        hatBewegt: false,
        captureEl: event.currentTarget,
      };
      this.ziehtIndex = index;
      this._pointerSortMoveHandler = (ev) => this.griffPointerMove(ev);
      this._pointerSortUpHandler = () => this.griffPointerUp();
      document.addEventListener('pointermove', this._pointerSortMoveHandler, { passive: false });
      document.addEventListener('pointerup', this._pointerSortUpHandler);
      document.addEventListener('pointercancel', this._pointerSortUpHandler);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* optional */
      }
    },
    griffPointerMove(event) {
      const sort = this.pointerSort;
      if (!sort) {
        return;
      }
      event.preventDefault();
      sort.hatBewegt = true;
      this.ziehenAktiv = true;
      const ziel = document.elementFromPoint(event.clientX, event.clientY);
      const eintragEl = ziel && ziel.closest ? ziel.closest('[data-dock-index]') : null;
      if (!eintragEl) {
        return;
      }
      const idx = Number(eintragEl.getAttribute('data-dock-index'));
      if (!Number.isNaN(idx)) {
        this.dropIndex = idx;
      }
    },
    griffPointerUp() {
      const sort = this.pointerSort;
      if (
        sort &&
        sort.hatBewegt &&
        this.dropIndex !== null &&
        sort.vonIndex !== this.dropIndex &&
        window.HTBAH_MODAL_FENSTER
      ) {
        window.HTBAH_MODAL_FENSTER.dock.verschiebe(sort.vonIndex, this.dropIndex);
      }
      if (sort && sort.captureEl && sort.pointerId != null) {
        try {
          sort.captureEl.releasePointerCapture(sort.pointerId);
        } catch {
          /* optional */
        }
      }
      this.pointerSortAufraeumen();
      this.ziehtIndex = null;
      this.dropIndex = null;
      window.setTimeout(() => {
        this.ziehenAktiv = false;
      }, 0);
    },
  },
  template: `
    <teleport to="body">
      <div
        v-if="eintraege.length"
        class="htbah-modal-minimize-dock"
        role="list"
        aria-label="Minimierte Fenster">
        <div
          v-for="(eintrag, index) in eintraege"
          :key="eintrag.id"
          class="htbah-modal-minimize-eintrag"
          :class="{
            'htbah-modal-minimize-eintrag--zieht': ziehtIndex === index,
            'htbah-modal-minimize-eintrag--drop-ziel': dropIndex === index,
          }"
          role="listitem"
          :data-dock-index="index"
          @dragover="dragOver($event, index)"
          @dragleave="dragLeave(index)"
          @drop="drop($event, index)">
          <div
            class="htbah-modal-minimize-leiste"
            role="button"
            tabindex="0"
            :aria-label="(eintrag.titel || 'Fenster') + ' wiederherstellen'"
            :title="(eintrag.titel || 'Fenster') + ' wiederherstellen'"
            @click="leisteAktivieren(eintrag)"
            @keydown="leisteTastatur($event, eintrag)">
            <span
              class="htbah-modal-minimize-leiste__griff"
              draggable="true"
              title="Reihenfolge ändern"
              aria-label="Reihenfolge ändern"
              @dragstart.stop="dragStart($event, index)"
              @dragend.stop="dragEnd"
              @pointerdown.stop="griffPointerDown($event, index)"
              @click.stop>⠿</span>
            <span
              v-if="eintrag.emoji"
              class="htbah-modal-minimize-leiste__emoji"
              aria-hidden="true">{{ eintrag.emoji }}</span>
            <span class="htbah-modal-minimize-leiste__titel">{{ eintrag.titel }}</span>
            <span
              class="material-symbols-outlined htbah-modal-minimize-leiste__symbol"
              aria-hidden="true">open_in_full</span>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
