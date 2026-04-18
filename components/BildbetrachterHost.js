window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

const BB_RESIZE_OBS = new Map();

window.HTBAH_KOMPONENTEN.BildbetrachterHost = {
  data() {
    return {
      kopfZiehen: null,
    };
  },
  computed: {
    fenster() {
      return window.HTBAH.bildbetrachter.fenster;
    },
  },
  methods: {
    schliessen(id) {
      window.HTBAH.bildbetrachterSchliessen(id);
    },
    fokus(f) {
      window.HTBAH.bildbetrachterNachVorne(f.id);
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
        resize: 'both',
        overflow: 'hidden',
      };
    },
    fensterElRef(el, f) {
      if (!el) {
        const ro = BB_RESIZE_OBS.get(f.id);
        if (ro) {
          ro.disconnect();
          BB_RESIZE_OBS.delete(f.id);
        }
        return;
      }
      if (BB_RESIZE_OBS.has(f.id)) {
        return;
      }
      const ro = new ResizeObserver(() => {
        if (f.fullscreen) {
          return;
        }
        f.w = Math.round(el.offsetWidth);
        f.h = Math.round(el.offsetHeight);
      });
      ro.observe(el);
      BB_RESIZE_OBS.set(f.id, ro);
    },
    vollbildToggle(f) {
      f.fullscreen = !f.fullscreen;
    },
    rad(f, ev) {
      const step = ev.deltaY > 0 ? -0.1 : 0.1;
      f.zoom = Math.min(8, Math.max(0.15, Math.round((f.zoom + step) * 100) / 100));
    },
    zoomRelativ(f, delta) {
      f.zoom = Math.min(8, Math.max(0.15, Math.round((f.zoom + delta) * 100) / 100));
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
    kopfMausRunter(f, ev) {
      if (f.fullscreen) {
        return;
      }
      this.fokus(f);
      this.kopfZiehen = {
        id: f.id,
        sx: ev.clientX,
        sy: ev.clientY,
        ox: f.x,
        oy: f.y,
      };
      document.addEventListener('mousemove', this.kopfMausBewegen);
      document.addEventListener(
        'mouseup',
        () => {
          document.removeEventListener('mousemove', this.kopfMausBewegen);
          this.kopfZiehen = null;
        },
        { once: true },
      );
    },
    kopfMausBewegen(ev) {
      const z = this.kopfZiehen;
      if (!z) {
        return;
      }
      const f = window.HTBAH.bildbetrachter.fenster.find((x) => x.id === z.id);
      if (!f || f.fullscreen) {
        return;
      }
      f.x = z.ox + (ev.clientX - z.sx);
      f.y = z.oy + (ev.clientY - z.sy);
    },
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.kopfMausBewegen);
  },
  template: `
    <teleport to="body">
      <div class="htbah-bb-host" aria-live="polite">
        <div
          v-for="f in fenster"
          :key="f.id"
          class="htbah-bb-fenster card shadow d-flex flex-column"
          :class="{ 'htbah-bb-fenster-fs': f.fullscreen }"
          :ref="(el) => fensterElRef(el, f)"
          :style="fensterStyle(f)"
          @mousedown="fokus(f)">
          <div
            class="htbah-bb-kopf card-header py-1 px-2 d-flex align-items-center gap-1 flex-wrap"
            @mousedown.stop="kopfMausRunter(f, $event)">
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
                @load="onImgLoad(f, $event)" />
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
