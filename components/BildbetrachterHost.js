window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const BB_MIN_BREITE = 220;
const BB_MIN_HOEHE = 160;

window.HTBAH_KOMPONENTEN.BildbetrachterHost = {
  data() {
    return {
      ziehenStatus: null,
      resizeStatus: null,
      pinchNachFensterId: {},
    };
  },
  computed: {
    fenster() {
      return window.HTBAH.bildbetrachter.fenster;
    },
  },
  mounted() {
    window.addEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  methods: {
    schliessen(id) {
      window.HTBAH.bildbetrachterSchliessen(id);
    },
    fokus(f) {
      window.HTBAH.bildbetrachterNachVorne(f.id);
    },
    findeFenster(fensterId) {
      return window.HTBAH.bildbetrachter.fenster.find((x) => x.id === fensterId);
    },
    stelleFensterSichtbar(f) {
      if (!f || f.fullscreen) {
        return;
      }
      const groesse = window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(
        f.w,
        f.h,
        BB_MIN_BREITE,
        BB_MIN_HOEHE,
      );
      f.w = groesse.breite;
      f.h = groesse.hoehe;
      const position = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(f.x, f.y, f.w, f.h);
      f.x = position.x;
      f.y = position.y;
    },
    beiFensterGroesseGeaendert() {
      this.fenster.forEach((f) => this.stelleFensterSichtbar(f));
    },
    fensterStyle(f) {
      if (f.fullscreen) {
        return {
          position: 'fixed',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          zIndex: f.zIndex,
          maxWidth: '100%',
          maxHeight: '100%',
        };
      }
      return {
        position: 'fixed',
        left: `${f.x}px`,
        top: `${f.y}px`,
        width: `${f.w}px`,
        height: `${f.h}px`,
        zIndex: f.zIndex,
        minWidth: '220px',
        minHeight: '160px',
        overflow: 'hidden',
      };
    },
    vollbildToggle(f) {
      f.fullscreen = !f.fullscreen;
      if (!f.fullscreen) {
        this.stelleFensterSichtbar(f);
      }
    },
    rad(f, ev) {
      const step = ev.deltaY > 0 ? -0.1 : 0.1;
      f.zoom = Math.min(8, Math.max(0.15, Math.round((f.zoom + step) * 100) / 100));
    },
    zoomRelativ(f, delta) {
      f.zoom = Math.min(8, Math.max(0.15, Math.round((f.zoom + delta) * 100) / 100));
    },
    touchDistanz(a, b) {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    },
    pinchStart(f, ev) {
      if (!ev.touches || ev.touches.length !== 2) {
        return;
      }
      const a = ev.touches[0];
      const b = ev.touches[1];
      const distanz = this.touchDistanz(a, b);
      if (!distanz) {
        return;
      }
      this.fokus(f);
      this.pinchNachFensterId[f.id] = {
        startDistanz: distanz,
        startZoom: f.zoom,
      };
      ev.preventDefault();
    },
    pinchMove(f, ev) {
      if (!ev.touches || ev.touches.length !== 2) {
        return;
      }
      const zustand = this.pinchNachFensterId[f.id];
      if (!zustand) {
        this.pinchStart(f, ev);
        return;
      }
      const a = ev.touches[0];
      const b = ev.touches[1];
      const distanz = this.touchDistanz(a, b);
      if (!distanz || !zustand.startDistanz) {
        return;
      }
      const faktor = distanz / zustand.startDistanz;
      const neuerZoom = zustand.startZoom * faktor;
      f.zoom = Math.min(8, Math.max(0.15, Math.round(neuerZoom * 100) / 100));
      ev.preventDefault();
    },
    pinchEnd(f, ev) {
      if (ev.touches && ev.touches.length >= 2) {
        return;
      }
      if (this.pinchNachFensterId[f.id]) {
        delete this.pinchNachFensterId[f.id];
      }
    },
    zoomReset(f) {
      f.zoom = 1;
    },
    onImgLoad(f, ev) {
      const im = ev.target;
      if (im && im.naturalWidth) {
        f.naturalW = im.naturalWidth;
        f.naturalH = im.naturalHeight;
      }
    },
    imgStyle(f) {
      const nw = f.naturalW;
      if (!nw) {
        return { maxWidth: '100%', height: 'auto', verticalAlign: 'top' };
      }
      const px = Math.max(1, Math.round(nw * f.zoom));
      return {
        width: `${px}px`,
        height: 'auto',
        maxWidth: 'none',
        verticalAlign: 'top',
        display: 'block',
      };
    },
    kopfPointerRunter(f, ev) {
      if (f.fullscreen) {
        return;
      }
      if (ev.pointerType === 'mouse' && ev.button !== 0) {
        return;
      }
      if (ev.target.closest('button, a, input, select, textarea, label')) {
        return;
      }
      this.fokus(f);
      this.ziehenStatus = {
        id: f.id,
        pointerId: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        originX: f.x,
        originY: f.y,
      };
      window.addEventListener('pointermove', this.beimZiehenPointer);
      window.addEventListener('pointerup', this.beendeZiehenPointer);
      window.addEventListener('pointercancel', this.beendeZiehenPointer);
      ev.preventDefault();
    },
    beimZiehenPointer(ev) {
      const z = this.ziehenStatus;
      if (!z) {
        return;
      }
      if (z.pointerId !== undefined && ev.pointerId !== z.pointerId) {
        return;
      }
      const f = this.findeFenster(z.id);
      if (!f || f.fullscreen) {
        return;
      }
      const neueX = z.originX + (ev.clientX - z.startX);
      const neueY = z.originY + (ev.clientY - z.startY);
      const position = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(neueX, neueY, f.w, f.h);
      f.x = position.x;
      f.y = position.y;
    },
    beendeZiehenPointer(ev) {
      if (!this.ziehenStatus) {
        return;
      }
      if (
        ev &&
        this.ziehenStatus.pointerId !== undefined &&
        ev.pointerId !== this.ziehenStatus.pointerId
      ) {
        return;
      }
      this.ziehenStatus = null;
      window.removeEventListener('pointermove', this.beimZiehenPointer);
      window.removeEventListener('pointerup', this.beendeZiehenPointer);
      window.removeEventListener('pointercancel', this.beendeZiehenPointer);
    },
    resizePointerRunter(f, ev) {
      if (f.fullscreen) {
        return;
      }
      if (ev.pointerType === 'mouse' && ev.button !== 0) {
        return;
      }
      this.fokus(f);
      this.resizeStatus = {
        id: f.id,
        pointerId: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        startBreite: f.w,
        startHoehe: f.h,
      };
      window.addEventListener('pointermove', this.beimResizePointer);
      window.addEventListener('pointerup', this.beendeResizePointer);
      window.addEventListener('pointercancel', this.beendeResizePointer);
      ev.preventDefault();
      ev.stopPropagation();
    },
    beimResizePointer(ev) {
      const r = this.resizeStatus;
      if (!r) {
        return;
      }
      if (r.pointerId !== undefined && ev.pointerId !== r.pointerId) {
        return;
      }
      const f = this.findeFenster(r.id);
      if (!f || f.fullscreen) {
        return;
      }
      const neueBreite = r.startBreite + (ev.clientX - r.startX);
      const neueHoehe = r.startHoehe + (ev.clientY - r.startY);
      const groesse = window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(
        neueBreite,
        neueHoehe,
        BB_MIN_BREITE,
        BB_MIN_HOEHE,
      );
      f.w = groesse.breite;
      f.h = groesse.hoehe;
      const position = window.HTBAH_MODAL_FENSTER.utils.begrenzePosition(f.x, f.y, f.w, f.h);
      f.x = position.x;
      f.y = position.y;
    },
    beendeResizePointer(ev) {
      if (!this.resizeStatus) {
        return;
      }
      if (
        ev &&
        this.resizeStatus.pointerId !== undefined &&
        ev.pointerId !== this.resizeStatus.pointerId
      ) {
        return;
      }
      this.resizeStatus = null;
      window.removeEventListener('pointermove', this.beimResizePointer);
      window.removeEventListener('pointerup', this.beendeResizePointer);
      window.removeEventListener('pointercancel', this.beendeResizePointer);
    },
  },
  beforeUnmount() {
    this.beendeZiehenPointer();
    this.beendeResizePointer();
    window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
  },
  template: `
    <teleport to="body">
      <div class="htbah-bb-host" aria-live="polite">
        <div
          v-for="f in fenster"
          :key="f.id"
          class="htbah-bb-fenster card shadow d-flex flex-column"
          :class="{ 'htbah-bb-fenster-fs': f.fullscreen }"
          :style="fensterStyle(f)"
          @pointerdown="fokus(f)">
          <div
            class="htbah-bb-kopf card-header py-1 px-2 d-flex align-items-center gap-1 flex-wrap"
            @pointerdown.stop="kopfPointerRunter(f, $event)">
            <span class="material-symbols-outlined htbah-bb-griff" aria-hidden="true">drag_pan</span>
            <span class="text-truncate flex-grow-1 small mb-0" :title="f.titel">{{ f.titel }}</span>
            <div class="btn-group btn-group-sm" role="group" aria-label="Zoom">
              <button
                type="button"
                class="btn btn-outline-secondary py-0 px-2"
                title="Verkleinern"
                @click.stop="zoomRelativ(f, -0.2)">
                −
              </button>
              <span class="small text-body-secondary px-1 align-self-center text-nowrap">
                {{ Math.round(f.zoom * 100) }}%
              </span>
              <button
                type="button"
                class="btn btn-outline-secondary py-0 px-2"
                title="Vergrößern"
                @click.stop="zoomRelativ(f, 0.2)">
                +
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary py-0 px-2"
                title="Zoom 100 % (1:1)"
                @click.stop="zoomReset(f)">
                1:1
              </button>
            </div>
            <div class="d-flex gap-2 align-items-center">
              <button
                type="button"
                class="regelwerk-icon-button"
                :title="f.fullscreen ? 'Vollbild beenden' : 'Vollbild'"
                :aria-label="f.fullscreen ? 'Vollbild beenden' : 'Vollbild'"
                @click.stop="vollbildToggle(f)">
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ f.fullscreen ? 'close_fullscreen' : 'open_in_full' }}
                </span>
              </button>
              <button
                type="button"
                class="btn-close"
                aria-label="Schließen"
                title="Schließen"
                @click.stop="schliessen(f.id)"></button>
            </div>
          </div>
          <div class="htbah-bb-rumpf card-body p-0 d-flex flex-column flex-grow-1" style="min-height: 0">
            <div
              class="htbah-bb-viewport"
              @wheel.prevent="rad(f, $event)">
              <img
                :src="f.dataUrl"
                :alt="f.titel"
                draggable="false"
                :style="imgStyle(f)"
                @touchstart="pinchStart(f, $event)"
                @touchmove="pinchMove(f, $event)"
                @touchend="pinchEnd(f, $event)"
                @touchcancel="pinchEnd(f, $event)"
                @load="onImgLoad(f, $event)" />
            </div>
          </div>
          <div
            v-if="!f.fullscreen"
            class="regelwerk-modal-resize-handle htbah-bb-resize-handle"
            role="presentation"
            aria-hidden="true"
            @pointerdown="resizePointerRunter(f, $event)"></div>
        </div>
      </div>
    </teleport>
  `,
};
