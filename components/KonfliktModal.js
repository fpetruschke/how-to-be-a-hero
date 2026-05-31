window.HTBAH_KOMPONENTEN = window.HTBAH_KOMPONENTEN || {};

(function () {
  const KM =
    window.HTBAH_SHARED && window.HTBAH_SHARED.KonfliktModel
      ? window.HTBAH_SHARED.KonfliktModel
      : null;

  function textWert(v, fallback) {
    const t = typeof v === 'string' ? v.trim() : '';
    return t || (fallback != null ? fallback : '—');
  }

  function entitaetName(payload, typ) {
    const api =
      window.HTBAH_SHARED && window.HTBAH_SHARED.EntityKartenIcon
        ? window.HTBAH_SHARED.EntityKartenIcon
        : null;
    if (api && typeof api.entitaetAnzeigeName === 'function') {
      return textWert(api.entitaetAnzeigeName(payload, typ), 'Ohne Namen');
    }
    return textWert(payload && payload.name, 'Ohne Namen');
  }

  window.HTBAH_KOMPONENTEN.KonfliktModal = {
    components: {
      WuerfelbecherWurf: window.HTBAH_KOMPONENTEN.WuerfelbecherWurf,
      EntitaetAnzeigeIcon: window.HTBAH_KOMPONENTEN.EntitaetAnzeigeIcon,
      ProbeWurfModal: window.HTBAH_KOMPONENTEN.ProbeWurfModal,
      SchadenModal: window.HTBAH_KOMPONENTEN.SchadenModal,
      ParadeModal: window.HTBAH_KOMPONENTEN.ParadeModal,
    },
    props: {
      offen: { type: Boolean, default: false },
      kampagneId: { type: String, default: '' },
    },
    emits: ['update:offen', 'schliessen'],
    data() {
      return {
        ...window.HTBAH_MODAL_FENSTER.erstelleBasisDaten(),
        konflikt: KM ? KM.leererKonfliktZustand() : { teilnehmer: [], aktiverTab: 'auswahl' },
        zufallstabellenTick: 0,
        spielleitungTick: 0,
        suchText: '',
        filterTyp: 'alle',
        speichernTimer: null,
        fokusVorModal: null,
        initiativeWurfZielRef: null,
        parteiOffen: { helden: true, gegner: true },
      };
    },
    computed: {
      fensterStil() {
        return window.HTBAH_MODAL_FENSTER.berechneFensterStil.call(this);
      },
      vollbildIcon() {
        return this.istVollbild ? 'close_fullscreen' : 'open_in_full';
      },
      kampagneName() {
        const id = this.kampagneIdEffektiv;
        if (!id) {
          return '';
        }
        const sl = window.HTBAH.ladeSpielleitungZustand();
        const k = (sl.kampagnen || []).find((x) => x && x.id === id);
        return k ? String(k.name || '') : '';
      },
      kampagneIdEffektiv() {
        return typeof this.kampagneId === 'string' && this.kampagneId.trim()
          ? this.kampagneId.trim()
          : '';
      },
      zustandZufall() {
        void this.zufallstabellenTick;
        return window.HTBAH.ladeZufallstabellenZustand(this.kampagneIdEffektiv);
      },
      kampagneGruppe() {
        void this.spielleitungTick;
        const sl = window.HTBAH.ladeSpielleitungZustand();
        return (sl.kampagnen || []).find((g) => g && g.id === this.kampagneIdEffektiv) || null;
      },
      katalog() {
        const liste = [];
        const g = this.kampagneGruppe;
        if (g && Array.isArray(g.mitglieder)) {
          g.mitglieder.forEach((m) => {
            if (!m || !m.id) {
              return;
            }
            const char = m.charakter || {};
            liste.push({
              typ: 'charakter',
              entityId: m.id,
              label: entitaetName(char, 'charakter'),
              payload: char,
              charakterBild: typeof m.charakterBild === 'string' ? m.charakterBild : '',
              seiteVorschlag: KM ? KM.standardSeiteFuerTyp('charakter') : 'helden',
            });
          });
        }
        (this.zustandZufall.npcs || []).forEach((row) => {
          if (!row || !row.id) {
            return;
          }
          liste.push({
            typ: 'npc',
            entityId: row.id,
            label: entitaetName(row, 'npc'),
            payload: row,
            charakterBild: '',
            seiteVorschlag: KM ? KM.standardSeiteFuerTyp('npc') : 'gegner',
          });
        });
        (this.zustandZufall.bestien || []).forEach((row) => {
          if (!row || !row.id) {
            return;
          }
          liste.push({
            typ: 'bestie',
            entityId: row.id,
            label: entitaetName(row, 'bestie'),
            payload: row,
            charakterBild: '',
            seiteVorschlag: KM ? KM.standardSeiteFuerTyp('bestie') : 'gegner',
          });
        });
        return liste;
      },
      teilnehmerRefSet() {
        const set = new Set();
        (this.konflikt.teilnehmer || []).forEach((t) => {
          if (!KM) {
            return;
          }
          const key = KM.teilnehmerRef(t.typ, t.entityId);
          if (key) {
            set.add(key);
          }
        });
        return set;
      },
      gefilterterKatalog() {
        const q = String(this.suchText || '')
          .trim()
          .toLocaleLowerCase('de');
        return this.katalog.filter((e) => {
          if (this.filterTyp !== 'alle' && e.typ !== this.filterTyp) {
            return false;
          }
          if (!q) {
            return true;
          }
          return String(e.label || '')
            .toLocaleLowerCase('de')
            .includes(q);
        });
      },
      aufgeloesteTeilnehmer() {
        const katalogByRef = new Map();
        this.katalog.forEach((e) => {
          if (!KM) {
            return;
          }
          const key = KM.teilnehmerRef(e.typ, e.entityId);
          if (key) {
            katalogByRef.set(key, e);
          }
        });
        return (this.konflikt.teilnehmer || [])
          .map((t) => {
            const key = KM ? KM.teilnehmerRef(t.typ, t.entityId) : '';
            const basis = key ? katalogByRef.get(key) : null;
            if (!basis) {
              return {
                ...t,
                refKey: key,
                fehlt: true,
                label: 'Nicht gefunden',
                payload: null,
                charakterBild: '',
              };
            }
            const payload = basis.payload;
            const begabung = KM ? KM.begabungHandelnFuerEntitaet(t.typ, payload) : 0;
            const initiative =
              payload && typeof payload.initiative === 'string' ? payload.initiative : '';
            const lp =
              payload && payload.lebenspunkte != null ? String(payload.lebenspunkte) : '';
            const kampfZustand =
              window.HTBAH && typeof window.HTBAH.normalisiereKampfZustand === 'function'
                ? window.HTBAH.normalisiereKampfZustand(payload && payload.kampfZustand) ||
                  (t.typ === 'charakter'
                    ? window.HTBAH.ermittleKampfZustandFuerCharakter(payload)
                    : window.HTBAH.ermittleKampfZustandFuerNpcBestie(payload))
                : 'vital';
            return {
              ...t,
              refKey: key,
              fehlt: false,
              label: basis.label,
              payload,
              charakterBild: basis.charakterBild,
              begabungHandeln: begabung,
              initiative,
              lebenspunkte: lp,
              kampfZustand,
              iniZahl: KM ? KM.initiativeAlsZahl(initiative) : null,
            };
          })
          .filter(Boolean);
      },
      heldenTeilnehmer() {
        return this.sortiereNachInitiative(
          this.aufgeloesteTeilnehmer.filter((t) => t.seite === 'helden'),
        );
      },
      gegnerTeilnehmer() {
        return this.sortiereNachInitiative(
          this.aufgeloesteTeilnehmer.filter((t) => t.seite === 'gegner'),
        );
      },
      initiativeTeilnehmer() {
        return this.sortiereNachInitiative(this.aufgeloesteTeilnehmer);
      },
      hatTeilnehmer() {
        return this.aufgeloesteTeilnehmer.length > 0;
      },
      kampfZustandOptionen() {
        return [
          { id: 'vital', label: 'Vital', emoji: '💚' },
          { id: 'bewusstlos', label: 'Bewusstlos', emoji: '😵' },
          { id: 'tot', label: 'Tot', emoji: '💀' },
        ];
      },
      modalTitel() {
        const t = this.konflikt.titel ? this.konflikt.titel.trim() : '';
        if (t) {
          return t;
        }
        return this.kampagneName ? `Konflikt — ${this.kampagneName}` : 'Konflikt';
      },
    },
    watch: {
      offen(istOffen) {
        if (istOffen) {
          this.ladeKonflikt();
          this.fokusVorModal =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          this.$nextTick(() => {
            this.initialisierePosition();
            this.fokussiereFenster();
          });
          return;
        }
        this.beendeZiehen();
        this.beendeResize();
        this.istVollbild = false;
        this.speichernFlushen();
        this.stelleFokusWiederHer();
      },
      kampagneIdEffektiv(neu, alt) {
        if (this.offen && neu && neu !== alt) {
          this.ladeKonflikt();
        }
      },
    },
    mounted() {
      window.addEventListener('resize', this.beiFensterGroesseGeaendert);
      window.addEventListener('pagehide', this.beichernFlushen);
      window.addEventListener('htbah:kampagne-daten-geaendert', this.onKampagneDatenGeaendert);
    },
    beforeUnmount() {
      this.beichernFlushen();
      this.beendeZiehen();
      this.beendeResize();
      if (this.speichernTimer) {
        window.clearTimeout(this.speichernTimer);
      }
      window.removeEventListener('resize', this.beiFensterGroesseGeaendert);
      window.removeEventListener('pagehide', this.beichernFlushen);
      window.removeEventListener('htbah:kampagne-daten-geaendert', this.onKampagneDatenGeaendert);
    },
    methods: {
      ...window.HTBAH_MODAL_FENSTER.methoden,
      parteiToggle(seite) {
        const key = seite === 'gegner' ? 'gegner' : 'helden';
        this.parteiOffen = {
          ...this.parteiOffen,
          [key]: !this.parteiOffen[key],
        };
      },
      fokussiereFenster() {
        const fenster = this.$refs.fensterElement;
        if (fenster && typeof fenster.focus === 'function') {
          fenster.focus();
        }
      },
      stelleFokusWiederHer() {
        if (this.fokusVorModal && this.fokusVorModal.isConnected) {
          this.fokusVorModal.focus();
        }
        this.fokusVorModal = null;
      },
      schliessen() {
        this.speichernFlushen();
        this.$emit('update:offen', false);
        this.$emit('schliessen');
      },
      onFensterEscape() {
        this.schliessen();
      },
      ladeKonflikt() {
        if (!this.kampagneIdEffektiv || !window.HTBAH.ladeKampagnenKonfliktZustand) {
          this.konflikt = KM ? KM.leererKonfliktZustand() : { teilnehmer: [] };
          return;
        }
        this.konflikt = window.HTBAH.ladeKampagnenKonfliktZustand(this.kampagneIdEffektiv);
      },
      speichernKonflikt() {
        if (!this.kampagneIdEffektiv || !window.HTBAH.speichereKampagnenKonfliktZustand) {
          return;
        }
        window.HTBAH.speichereKampagnenKonfliktZustand(this.kampagneIdEffektiv, this.konflikt);
      },
      speichernKonfliktDebounced() {
        if (this.speichernTimer) {
          window.clearTimeout(this.speichernTimer);
        }
        this.speichernTimer = window.setTimeout(() => {
          this.speichernTimer = null;
          this.speichernKonflikt();
        }, 180);
      },
      speichernFlushen() {
        if (this.speichernTimer) {
          window.clearTimeout(this.speichernTimer);
          this.speichernTimer = null;
        }
        if (this.offen) {
          this.speichernKonflikt();
        }
      },
      beichernFlushen() {
        this.speichernFlushen();
      },
      onKampagneDatenGeaendert(ev) {
        const d = ev && ev.detail ? ev.detail : {};
        if (d.kampagneId && d.kampagneId !== this.kampagneIdEffektiv) {
          return;
        }
        if (d.art === 'zufallstabellen') {
          this.zufallstabellenTick += 1;
        } else if (d.art === 'spielleitung' || d.art === 'konflikt') {
          if (d.art === 'konflikt' && this.offen) {
            this.ladeKonflikt();
          }
          this.spielleitungTick += 1;
        }
      },
      setzeTab(tab) {
        if (!KM || !KM.TABS.includes(tab)) {
          return;
        }
        this.konflikt.aktiverTab = tab;
        this.speichernKonfliktDebounced();
      },
      istImKonflikt(eintrag) {
        if (!KM || !eintrag) {
          return false;
        }
        return this.teilnehmerRefSet.has(KM.teilnehmerRef(eintrag.typ, eintrag.entityId));
      },
      toggleTeilnehmer(eintrag) {
        if (!KM || !eintrag) {
          return;
        }
        const key = KM.teilnehmerRef(eintrag.typ, eintrag.entityId);
        if (!key) {
          return;
        }
        const idx = (this.konflikt.teilnehmer || []).findIndex(
          (t) => KM.teilnehmerRef(t.typ, t.entityId) === key,
        );
        if (idx >= 0) {
          this.konflikt.teilnehmer.splice(idx, 1);
        } else {
          this.konflikt.teilnehmer.push({
            typ: eintrag.typ,
            entityId: eintrag.entityId,
            seite: eintrag.seiteVorschlag || KM.standardSeiteFuerTyp(eintrag.typ),
          });
        }
        this.speichernKonflikt();
      },
      async entferneTeilnehmer(teilnehmer) {
        if (!KM || !teilnehmer) {
          return;
        }
        const name = teilnehmer.label || 'Figur';
        const ok = await window.HTBAH.ui.confirm({
          titel: 'Aus Konflikt entfernen?',
          beschreibung: `„${name}“ aus diesem Konflikt entfernen? Die Figur bleibt in der Kampagne gespeichert.`,
          bestaetigenText: 'Entfernen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: false,
        });
        if (!ok) {
          return;
        }
        const key = KM.teilnehmerRef(teilnehmer.typ, teilnehmer.entityId);
        this.konflikt.teilnehmer = (this.konflikt.teilnehmer || []).filter(
          (t) => KM.teilnehmerRef(t.typ, t.entityId) !== key,
        );
        this.speichernKonflikt();
      },
      setzeSeite(teilnehmer, seite) {
        if (!KM || !teilnehmer) {
          return;
        }
        const key = KM.teilnehmerRef(teilnehmer.typ, teilnehmer.entityId);
        const t = (this.konflikt.teilnehmer || []).find(
          (x) => KM.teilnehmerRef(x.typ, x.entityId) === key,
        );
        if (!t) {
          return;
        }
        t.seite = KM.normalisiereSeite(seite);
        this.speichernKonflikt();
      },
      sortiereNachInitiative(liste) {
        return liste.slice().sort((a, b) => {
          const za = a.iniZahl;
          const zb = b.iniZahl;
          if (za == null && zb == null) {
            return String(a.label).localeCompare(String(b.label), 'de');
          }
          if (za == null) {
            return 1;
          }
          if (zb == null) {
            return -1;
          }
          if (zb !== za) {
            return zb - za;
          }
          return String(a.label).localeCompare(String(b.label), 'de');
        });
      },
      persistEntityPatch(teilnehmer, patch) {
        if (!teilnehmer || !patch || typeof patch !== 'object') {
          return;
        }
        if (teilnehmer.typ === 'charakter') {
          const sl = window.HTBAH.ladeSpielleitungZustand();
          const g = (sl.kampagnen || []).find((gr) => gr && gr.id === this.kampagneIdEffektiv);
          if (!g || !Array.isArray(g.mitglieder)) {
            return;
          }
          const idx = g.mitglieder.findIndex((m) => m && m.id === teilnehmer.entityId);
          if (idx < 0) {
            return;
          }
          const char = { ...(g.mitglieder[idx].charakter || {}), ...patch };
          if (patch.kampfZustand && typeof window.HTBAH.setzeCharakterKampfZustand === 'function') {
            window.HTBAH.setzeCharakterKampfZustand(char, patch.kampfZustand);
          }
          g.mitglieder[idx] = { ...g.mitglieder[idx], charakter: char };
          window.HTBAH.speichereSpielleitungZustand(sl);
          this.spielleitungTick += 1;
          return;
        }
        const z = window.HTBAH.ladeZufallstabellenZustand(this.kampagneIdEffektiv);
        const listeKey = teilnehmer.typ === 'npc' ? 'npcs' : 'bestien';
        const arr = Array.isArray(z[listeKey]) ? z[listeKey] : [];
        const idx = arr.findIndex((row) => row && row.id === teilnehmer.entityId);
        if (idx < 0) {
          return;
        }
        const row = { ...arr[idx], ...patch };
        if (patch.kampfZustand) {
          row.kampfZustand = patch.kampfZustand;
        }
        arr[idx] = row;
        z[listeKey] = arr;
        window.HTBAH.speichereZufallstabellenZustand(z, this.kampagneIdEffektiv);
        this.zufallstabellenTick += 1;
      },
      onInitiativeInput(teilnehmer, wert) {
        if (!KM) {
          return;
        }
        const ini = KM.normalisiereInitiativeWert(wert, teilnehmer.begabungHandeln);
        this.persistEntityPatch(teilnehmer, { initiative: ini });
      },
      initiativeWuerfeln(teilnehmer) {
        if (!KM || !teilnehmer) {
          return;
        }
        this.initiativeWurfZielRef = teilnehmer.refKey;
        const promise = this.$refs.konfliktInitiativeWuerfelbecher?.wuerfeln('1W10');
        if (!promise || typeof promise.then !== 'function') {
          return;
        }
        promise.then((werte) => {
          if (this.initiativeWurfZielRef !== teilnehmer.refKey) {
            return;
          }
          const wurf = Array.isArray(werte) && werte.length ? Number(werte[0]) || 1 : 1;
          const gesamt = wurf + (teilnehmer.begabungHandeln || 0);
          const ini = KM.normalisiereInitiativeWert(gesamt, teilnehmer.begabungHandeln);
          this.persistEntityPatch(teilnehmer, { initiative: ini });
          this.initiativeWurfZielRef = null;
        });
      },
      alleInitiativeWuerfeln(seite) {
        const liste =
          seite === 'helden'
            ? this.heldenTeilnehmer
            : seite === 'gegner'
              ? this.gegnerTeilnehmer
              : this.aufgeloesteTeilnehmer;
        const gueltig = liste.filter((t) => !t.fehlt);
        let kette = Promise.resolve();
        gueltig.forEach((t) => {
          kette = kette.then(() => {
            this.initiativeWurfZielRef = t.refKey;
            const promise = this.$refs.konfliktInitiativeWuerfelbecher?.wuerfeln('1W10');
            if (!promise || typeof promise.then !== 'function') {
              return;
            }
            return promise.then((werte) => {
              const wurf = Array.isArray(werte) && werte.length ? Number(werte[0]) || 1 : 1;
              const gesamt = wurf + (t.begabungHandeln || 0);
              const ini = KM.normalisiereInitiativeWert(gesamt, t.begabungHandeln);
              this.persistEntityPatch(t, { initiative: ini });
            });
          });
        });
        kette.finally(() => {
          this.initiativeWurfZielRef = null;
        });
      },
      onLpInput(teilnehmer, wert) {
        this.persistEntityPatch(teilnehmer, { lebenspunkte: String(wert == null ? '' : wert) });
        if (teilnehmer.typ === 'charakter' && typeof window.HTBAH.aktualisiereCharakterKampfZustandAusLp === 'function') {
          const sl = window.HTBAH.ladeSpielleitungZustand();
          const g = (sl.kampagnen || []).find((gr) => gr && gr.id === this.kampagneIdEffektiv);
          const m =
            g && Array.isArray(g.mitglieder)
              ? g.mitglieder.find((x) => x && x.id === teilnehmer.entityId)
              : null;
          const char = m && m.charakter ? m.charakter : null;
          if (char) {
            const vorher = char.lebenspunkte;
            char.lebenspunkte = String(wert == null ? '' : wert);
            window.HTBAH.aktualisiereCharakterKampfZustandAusLp(char, vorher, char.lebenspunkte);
            this.persistEntityPatch(teilnehmer, {
              lebenspunkte: char.lebenspunkte,
              kampfZustand: char.kampfZustand,
            });
          }
        }
        if (
          (teilnehmer.typ === 'npc' || teilnehmer.typ === 'bestie') &&
          window.HTBAH &&
          typeof window.HTBAH.berechneKampfZustandAusLp === 'function'
        ) {
          const vorher = teilnehmer.payload ? teilnehmer.payload.lebenspunkte : '';
          const nach = String(wert == null ? '' : wert);
          const kz = window.HTBAH.berechneKampfZustandAusLp(nach, vorher);
          this.persistEntityPatch(teilnehmer, { lebenspunkte: nach, kampfZustand: kz });
        }
      },
      setzeKampfZustand(teilnehmer, zustand) {
        if (!window.HTBAH || typeof window.HTBAH.normalisiereKampfZustand !== 'function') {
          return;
        }
        const kz = window.HTBAH.normalisiereKampfZustand(zustand);
        if (!kz) {
          return;
        }
        this.persistEntityPatch(teilnehmer, { kampfZustand: kz });
      },
      karteStatusKlasse(kampfZustand) {
        const kz = typeof kampfZustand === 'string' ? kampfZustand : 'vital';
        if (kz === 'tot') {
          return 'htbah-konflikt-karte--tot';
        }
        if (kz === 'bewusstlos') {
          return 'htbah-konflikt-karte--bewusstlos';
        }
        return 'htbah-konflikt-karte--vital';
      },
      typBadge(typ) {
        if (typ === 'charakter') {
          return { text: 'Charakter', klasse: 'text-bg-success' };
        }
        if (typ === 'npc') {
          return { text: 'NPC', klasse: 'text-bg-primary' };
        }
        return { text: 'Bestie', klasse: 'text-bg-warning text-dark' };
      },
      async konfliktZuruecksetzen() {
        const ok = await window.HTBAH.ui.confirm({
          titel: 'Konflikt zurücksetzen?',
          beschreibung:
            'Alle Teilnehmer werden aus dem Konflikt entfernt. Initiative und LP der Figuren bleiben in den Kampagnendaten erhalten.',
          bestaetigenText: 'Zurücksetzen',
          bestaetigenButtonClass: 'btn-danger',
          warnhinweisAnzeigen: false,
        });
        if (!ok) {
          return;
        }
        this.konflikt.teilnehmer = [];
        this.konflikt.aktiverTab = 'auswahl';
        this.speichernKonflikt();
      },
      inWeltOeffnen(teilnehmer) {
        if (!teilnehmer || teilnehmer.fehlt) {
          return;
        }
        const fn = window.HTBAH && typeof window.HTBAH.oeffneInteraktiveWeltModal === 'function'
          ? window.HTBAH.oeffneInteraktiveWeltModal
          : null;
        if (fn) {
          fn({
            kampagneId: this.kampagneIdEffektiv,
            entityType: teilnehmer.typ,
            entityId: teilnehmer.entityId,
          });
          return;
        }
        window.dispatchEvent(
          new CustomEvent('htbah:open-entity-request', {
            detail: {
              entityType: teilnehmer.typ,
              entityId: teilnehmer.entityId,
              kampagneId: this.kampagneIdEffektiv,
            },
          }),
        );
      },
      probeOeffnen(payload) {
        const t = payload && payload.teilnehmer ? payload.teilnehmer : null;
        if (!t || t.fehlt) {
          return;
        }
        const kategorieNamen = { handeln: 'Handeln', wissen: 'Wissen', soziales: 'Soziales' };
        const kat = payload.kategorie;
        const katLabel = kategorieNamen[kat] || String(kat || '');
        if (payload.modus === 'begabung') {
          const zielwert = Math.max(0, Math.min(40, Math.round(Number(payload.zielwert) || 0)));
          this.$refs.konfliktProbeWurfModal?.oeffnen?.({
            modus: 'begabung',
            basiswert: zielwert,
            zielwert,
            zeigtModifikator: false,
            basisLabel: `Begabung ${katLabel}`,
            titel: `Probe: Begabung ${katLabel}`,
            untertitel:
              'Nur der Begabungswert — ohne einzelne Fähigkeit. Keine kritischen Erfolge (Regelwerk).',
          });
          return;
        }
        const f = payload.faehigkeit;
        const zielwert = Number(f && f.effektiv) || 0;
        const basiswert = Number(f && f.basis) || 0;
        const name = typeof f?.name === 'string' ? f.name : 'Probe';
        const untertitel = `Effektivwert ${zielwert} (${basiswert} + Begabung, ${katLabel})`;
        this.$refs.konfliktProbeWurfModal?.oeffnen?.({
          modus: 'faehigkeit',
          basiswert: zielwert,
          zielwert,
          zeigtModifikator: false,
          basisLabel: `Effektivwert ${name}`,
          titel: `Probe: ${name}`,
          untertitel,
        });
      },
      schadenOeffnen(teilnehmer) {
        if (!teilnehmer || teilnehmer.fehlt) {
          return;
        }
        this.$refs.konfliktSchadenModal?.oeffnen?.({
          titel: `Schaden erwürfeln (${teilnehmer.label || 'Figur'})`,
          charakter: teilnehmer.payload,
        });
      },
      paradeOeffnen(teilnehmer) {
        if (!teilnehmer || teilnehmer.fehlt) {
          return;
        }
        const inventar = Array.isArray(teilnehmer?.payload?.inventar) ? teilnehmer.payload.inventar : [];
        const ruestungen = inventar
          .filter((eintrag) => eintrag && eintrag.typ === 'rustung')
          .map((eintrag) => ({
            name: typeof eintrag.name === 'string' ? eintrag.name : '',
            rustwert: eintrag.rustwert,
          }));
        this.$refs.konfliktParadeModal?.oeffnen?.({
          titel: `Parade-Probe (${teilnehmer.label || 'Figur'})`,
          basiswert: teilnehmer.begabungHandeln || 0,
          ruestungen,
          waffenlosParade: !ruestungen.length,
        });
      },
      ladeFensterAusSpeicher() {
        try {
          const key =
            window.HTBAH?.speicherKeys?.konfliktFenster || 'htbah_konflikt_fenster';
          const o = window.HTBAH?.speicher?.leseJson(key, null);
          if (!o || typeof o !== 'object') {
            return;
          }
          const br = Number(o.breite);
          const ho = Number(o.hoehe);
          if (Number.isFinite(br) && Number.isFinite(ho) && br > 0 && ho > 0) {
            const g = window.HTBAH_MODAL_FENSTER.utils.begrenzeGroesse(br, ho, 360, 320);
            this.breite = g.breite;
            this.hoehe = g.hoehe;
          }
          const px = Number(o.positionX);
          const py = Number(o.positionY);
          if (Number.isFinite(px) && Number.isFinite(py)) {
            this.positionX = px;
            this.positionY = py;
          }
        } catch {
          /* ignorieren */
        }
      },
      speichereFensterInSpeicher() {
        try {
          const key =
            window.HTBAH?.speicherKeys?.konfliktFenster || 'htbah_konflikt_fenster';
          window.HTBAH?.speicher?.schreibeJson(key, {
            breite: this.breite,
            hoehe: this.hoehe,
            positionX: this.positionX,
            positionY: this.positionY,
          });
        } catch {
          /* ignorieren */
        }
      },
    },
    created() {
      this.ladeFensterAusSpeicher();
      if (this.breite == null) {
        this.breite = 920;
        this.hoehe = 640;
      }
    },
    template: `
      <teleport to="body">
        <div
          v-if="offen"
          class="regelwerk-modal-layer htbah-konflikt-modal-layer"
          role="presentation">
          <div
            ref="fensterElement"
            class="regelwerk-modal-window card shadow htbah-konflikt-modal-window"
            :class="{ 'regelwerk-modal-window-fullscreen': istVollbild }"
            :style="fensterStil"
            role="dialog"
            aria-modal="true"
            aria-labelledby="konfliktModalLabel"
            tabindex="-1"
            @keydown.esc.prevent="onFensterEscape">
            <div
              class="regelwerk-modal-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
              @pointerdown="starteZiehen($event)">
              <h5 class="modal-title d-flex align-items-center gap-2 mb-0" id="konfliktModalLabel">
                <span class="material-symbols-outlined htbah-konflikt-titel-icon" aria-hidden="true">swords</span>
                <span class="text-truncate d-sm-none">Konflikt</span>
                <span class="text-truncate d-none d-sm-inline">{{ modalTitel }}</span>
              </h5>
              <div class="d-flex align-items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  class="regelwerk-icon-button"
                  :aria-label="istVollbild ? 'Vollbild beenden' : 'Vollbild'"
                  :title="istVollbild ? 'Vollbild beenden' : 'Vollbild'"
                  @click="vollbildUmschalten">
                  <span class="material-symbols-outlined">{{ vollbildIcon }}</span>
                </button>
                <button type="button" class="btn-close" aria-label="Schließen" @click="schliessen"></button>
              </div>
            </div>

            <div class="px-3 pt-2 pb-0 border-bottom bg-body-tertiary">
              <div class="row g-2 align-items-end mb-2">
                <div class="col-md-6">
                  <label class="form-label small text-secondary mb-1" for="konflikt-titel">Bezeichnung (optional)</label>
                  <input
                    id="konflikt-titel"
                    type="text"
                    class="form-control form-control-sm"
                    v-model.trim="konflikt.titel"
                    placeholder="z. B. Hinterhalt am Fluss"
                    @change="speichernKonfliktDebounced" />
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label small text-secondary mb-1" for="konflikt-helden-label">Bezeichnung Gruppe</label>
                  <input
                    id="konflikt-helden-label"
                    type="text"
                    class="form-control form-control-sm"
                    v-model.trim="konflikt.heldenLabel"
                    @change="speichernKonfliktDebounced" />
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label small text-secondary mb-1" for="konflikt-gegner-label">Bezeichnung Gegner</label>
                  <input
                    id="konflikt-gegner-label"
                    type="text"
                    class="form-control form-control-sm"
                    v-model.trim="konflikt.gegnerLabel"
                    @change="speichernKonfliktDebounced" />
                </div>
              </div>
              <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: konflikt.aktiverTab === 'auswahl' }"
                    @click="setzeTab('auswahl')">
                    Teilnehmer
                    <span v-if="aufgeloesteTeilnehmer.length" class="badge rounded-pill text-bg-secondary ms-1">
                      {{ aufgeloesteTeilnehmer.length }}
                    </span>
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: konflikt.aktiverTab === 'initiative', disabled: !hatTeilnehmer }"
                    :disabled="!hatTeilnehmer"
                    @click="setzeTab('initiative')">
                    Initiative
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: konflikt.aktiverTab === 'kampf', disabled: !hatTeilnehmer }"
                    :disabled="!hatTeilnehmer"
                    @click="setzeTab('kampf')">
                    Übersicht
                  </button>
                </li>
              </ul>
            </div>

            <div class="flex-grow-1 min-h-0 overflow-auto px-3 py-3">
              <div v-show="konflikt.aktiverTab === 'auswahl'">
                <p class="small text-body-secondary mb-2">
                  Wähle alle am Konflikt beteiligten Figuren. Charaktere starten bei „{{ konflikt.heldenLabel }}“,
                  NPCs und Bestien bei „{{ konflikt.gegnerLabel }}“ — die Zuordnung lässt sich später ändern.
                </p>
                <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
                  <input
                    type="search"
                    class="form-control form-control-sm htbah-konflikt-suche"
                    v-model.trim="suchText"
                    placeholder="🔎 Suchen …" />
                  <div class="btn-group btn-group-sm" role="group" aria-label="Typ filtern">
                    <button
                      type="button"
                      class="btn"
                      :class="filterTyp === 'alle' ? 'btn-primary' : 'btn-outline-primary'"
                      @click="filterTyp = 'alle'">
                      Alle
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="filterTyp === 'charakter' ? 'btn-primary' : 'btn-outline-primary'"
                      @click="filterTyp = 'charakter'">
                      Charaktere
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="filterTyp === 'npc' ? 'btn-primary' : 'btn-outline-primary'"
                      @click="filterTyp = 'npc'">
                      NPCs
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="filterTyp === 'bestie' ? 'btn-primary' : 'btn-outline-primary'"
                      @click="filterTyp = 'bestie'">
                      Bestien
                    </button>
                  </div>
                </div>
                <div v-if="!gefilterterKatalog.length" class="alert alert-info py-2 small mb-0">
                  Keine passenden Einträge — lege zuerst Charaktere in der Gruppe oder NPCs/Bestien in den
                  Zufallstabellen an.
                </div>
                <div v-else class="row g-2">
                  <div
                    v-for="e in gefilterterKatalog"
                    :key="e.typ + '-' + e.entityId"
                    class="col-12 col-md-6 col-xl-4">
                    <button
                      type="button"
                      class="htbah-konflikt-auswahl-karte w-100 text-start"
                      :class="{ 'htbah-konflikt-auswahl-karte--aktiv': istImKonflikt(e) }"
                      @click="toggleTeilnehmer(e)">
                      <entitaet-anzeige-icon
                        :entity-typ="e.typ"
                        :zeile="e.payload"
                        :charakter-bild="e.charakterBild"
                        groesse="sm" />
                      <span class="flex-grow-1 min-w-0">
                        <span class="d-block text-truncate fw-semibold">{{ e.label }}</span>
                        <span class="badge rounded-pill" :class="typBadge(e.typ).klasse">{{ typBadge(e.typ).text }}</span>
                      </span>
                      <span class="htbah-konflikt-auswahl-check" aria-hidden="true">{{ istImKonflikt(e) ? '✓' : '+' }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div v-show="konflikt.aktiverTab === 'initiative'">
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <button type="button" class="btn btn-sm btn-primary" @click="alleInitiativeWuerfeln()">
                    Alle würfeln
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="alleInitiativeWuerfeln('helden')">
                    {{ konflikt.heldenLabel }} würfeln
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="alleInitiativeWuerfeln('gegner')">
                    {{ konflikt.gegnerLabel }} würfeln
                  </button>
                </div>
                <p class="small text-body-secondary mb-2">
                  Regel: 1W10 + Begabung Handeln (bei Charakteren: Summe der Handeln-Fähigkeiten ÷ 10).
                </p>
                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0 htbah-konflikt-ini-tabelle">
                    <thead>
                      <tr>
                        <th>Figur</th>
                        <th>Partei</th>
                        <th class="text-end">Begabung H</th>
                        <th style="min-width: 11rem">Initiative</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="t in initiativeTeilnehmer" :key="t.refKey">
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <entitaet-anzeige-icon
                              :entity-typ="t.typ"
                              :zeile="t.payload"
                              :charakter-bild="t.charakterBild"
                              groesse="sm" />
                            <span class="text-truncate">{{ t.label }}</span>
                          </div>
                        </td>
                        <td>
                          <select
                            class="form-select form-select-sm"
                            :value="t.seite"
                            @change="setzeSeite(t, $event.target.value)">
                            <option value="helden">{{ konflikt.heldenLabel }}</option>
                            <option value="gegner">{{ konflikt.gegnerLabel }}</option>
                          </select>
                        </td>
                        <td class="text-end tabular-nums">{{ t.begabungHandeln }}</td>
                        <td>
                          <div class="input-group input-group-sm">
                            <input
                              type="number"
                              class="form-control"
                              min="1"
                              :max="10 + t.begabungHandeln"
                              :value="t.initiative"
                              placeholder="INI"
                              inputmode="numeric"
                              @change="onInitiativeInput(t, $event.target.value)" />
                            <button
                              type="button"
                              class="btn btn-outline-primary"
                              title="1W10 würfeln"
                              @click="initiativeWuerfeln(t)">
                              🎲
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div v-show="konflikt.aktiverTab === 'kampf'">
                <div class="row g-3 htbah-konflikt-kampf-spalten">
                  <div class="col-12 col-lg-6">
                    <div class="card htbah-konflikt-partei-card shadow-sm h-100">
                      <button
                        type="button"
                        class="card-header htbah-konflikt-partei-kopf-btn d-flex align-items-center justify-content-between gap-2"
                        :aria-expanded="parteiOffen.helden ? 'true' : 'false'"
                        @click="parteiToggle('helden')">
                        <span class="d-flex align-items-center gap-2 min-w-0">
                          <h6 class="mb-0 text-truncate">{{ konflikt.heldenLabel }}</h6>
                          <span class="badge rounded-pill text-bg-secondary flex-shrink-0">
                            {{ heldenTeilnehmer.length }}
                          </span>
                        </span>
                        <span
                          class="material-symbols-outlined htbah-konflikt-collapse-ico flex-shrink-0"
                          aria-hidden="true">
                          {{ parteiOffen.helden ? 'expand_less' : 'expand_more' }}
                        </span>
                      </button>
                      <div v-show="parteiOffen.helden" class="card-body py-2 px-2">
                        <p v-if="!heldenTeilnehmer.length" class="small text-body-secondary mb-0">
                          Noch niemand zugeordnet.
                        </p>
                        <div v-else class="d-flex flex-column gap-2">
                          <article
                            v-for="t in heldenTeilnehmer"
                            :key="'h-' + t.refKey"
                            class="htbah-konflikt-karte card shadow-sm mb-0"
                            :class="karteStatusKlasse(t.kampfZustand)">
                            <konflikt-teilnehmer-karte-inhalt
                              :teilnehmer="t"
                              :konflikt="konflikt"
                              :kampf-zustand-optionen="kampfZustandOptionen"
                              @entfernen="entferneTeilnehmer(t)"
                              @seite="setzeSeite(t, $event)"
                              @initiative="onInitiativeInput(t, $event)"
                              @initiative-wuerfeln="initiativeWuerfeln(t)"
                              @lp="onLpInput(t, $event)"
                              @kampf-zustand="setzeKampfZustand(t, $event)"
                              @welt="inWeltOeffnen(t)"
                              @probe="probeOeffnen"
                              @schaden="schadenOeffnen(t)"
                              @parade="paradeOeffnen(t)" />
                          </article>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-12 col-lg-6">
                    <div class="card htbah-konflikt-partei-card shadow-sm htbah-konflikt-partei-card--gegner h-100">
                      <button
                        type="button"
                        class="card-header htbah-konflikt-partei-kopf-btn d-flex align-items-center justify-content-between gap-2"
                        :aria-expanded="parteiOffen.gegner ? 'true' : 'false'"
                        @click="parteiToggle('gegner')">
                        <span class="d-flex align-items-center gap-2 min-w-0">
                          <h6 class="mb-0 text-truncate">{{ konflikt.gegnerLabel }}</h6>
                          <span class="badge rounded-pill text-bg-secondary flex-shrink-0">
                            {{ gegnerTeilnehmer.length }}
                          </span>
                        </span>
                        <span
                          class="material-symbols-outlined htbah-konflikt-collapse-ico flex-shrink-0"
                          aria-hidden="true">
                          {{ parteiOffen.gegner ? 'expand_less' : 'expand_more' }}
                        </span>
                      </button>
                      <div v-show="parteiOffen.gegner" class="card-body py-2 px-2">
                        <p v-if="!gegnerTeilnehmer.length" class="small text-body-secondary mb-0">
                          Noch niemand zugeordnet.
                        </p>
                        <div v-else class="d-flex flex-column gap-2">
                          <article
                            v-for="t in gegnerTeilnehmer"
                            :key="'g-' + t.refKey"
                            class="htbah-konflikt-karte card shadow-sm mb-0"
                            :class="karteStatusKlasse(t.kampfZustand)">
                            <konflikt-teilnehmer-karte-inhalt
                              :teilnehmer="t"
                              :konflikt="konflikt"
                              :kampf-zustand-optionen="kampfZustandOptionen"
                              @entfernen="entferneTeilnehmer(t)"
                              @seite="setzeSeite(t, $event)"
                              @initiative="onInitiativeInput(t, $event)"
                              @initiative-wuerfeln="initiativeWuerfeln(t)"
                              @lp="onLpInput(t, $event)"
                              @kampf-zustand="setzeKampfZustand(t, $event)"
                              @welt="inWeltOeffnen(t)"
                              @probe="probeOeffnen"
                              @schaden="schadenOeffnen(t)"
                              @parade="paradeOeffnen(t)" />
                          </article>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-top px-3 py-2 d-flex flex-wrap justify-content-between align-items-center gap-2 bg-body-tertiary">
              <button type="button" class="btn btn-sm btn-outline-danger" @click="konfliktZuruecksetzen">
                Konflikt leeren
              </button>
              <div class="d-flex gap-2 ms-auto">
                <button
                  v-if="hatTeilnehmer && konflikt.aktiverTab === 'auswahl'"
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="setzeTab('initiative')">
                  Weiter: Initiative →
                </button>
                <button
                  v-if="hatTeilnehmer && konflikt.aktiverTab === 'initiative'"
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="setzeTab('kampf')">
                  Weiter: Übersicht →
                </button>
                <button type="button" class="btn btn-secondary btn-sm" @click="schliessen">
                  Schließen
                </button>
              </div>
            </div>

            <div
              v-if="!istVollbild"
              class="regelwerk-modal-resize-handle"
              @pointerdown="starteResize($event)"></div>
          </div>
        </div>
        <probe-wurf-modal ref="konfliktProbeWurfModal" modal-dom-id="konfliktProbeWurfModal" />
        <schaden-modal ref="konfliktSchadenModal" modal-dom-id="konfliktSchadenModal" />
        <parade-modal ref="konfliktParadeModal" modal-dom-id="konfliktParadeModal" />
        <div class="d-none" aria-hidden="true">
          <wuerfelbecher-wurf ref="konfliktInitiativeWuerfelbecher" modus="w10" :auto-init="false" :ohne3d="true" />
        </div>
      </teleport>
    `,
  };

  /** Inline-Subkomponente für Kampfübersicht-Karten (vermeidet Template-Duplikat) */
  window.HTBAH_KOMPONENTEN.KonfliktTeilnehmerKarteInhalt = {
    components: {
      EntitaetAnzeigeIcon: window.HTBAH_KOMPONENTEN.EntitaetAnzeigeIcon,
    },
    props: {
      teilnehmer: { type: Object, required: true },
      konflikt: { type: Object, required: true },
      kampfZustandOptionen: { type: Array, default: () => [] },
    },
    emits: [
      'entfernen',
      'seite',
      'initiative',
      'initiative-wuerfeln',
      'lp',
      'kampf-zustand',
      'welt',
      'probe',
      'schaden',
      'parade',
    ],
    data() {
      return {
        teilnehmerOffen: false,
        kategorieOffen: {
          handeln: false,
          wissen: false,
          soziales: false,
        },
        kampfBlockOffen: false,
        inventarBlockOffen: false,
      };
    },
    computed: {
      statusEmoji() {
        const kz = this.teilnehmer.kampfZustand;
        if (kz === 'tot') {
          return '💀';
        }
        if (kz === 'bewusstlos') {
          return '😵';
        }
        return '';
      },
      typBadge() {
        const typ = this.teilnehmer.typ;
        if (typ === 'charakter') {
          return { text: 'Charakter', klasse: 'text-bg-success' };
        }
        if (typ === 'npc') {
          return { text: 'NPC', klasse: 'text-bg-primary' };
        }
        return { text: 'Bestie', klasse: 'text-bg-warning text-dark' };
      },
      slUebersicht() {
        const KM = window.HTBAH_SHARED && window.HTBAH_SHARED.KonfliktModel;
        if (!KM || typeof KM.baueKonfliktKampfHandelnUebersicht !== 'function') {
          return { kategorien: [], kampfZeilen: [], inventarZeilen: [] };
        }
        return KM.baueKonfliktKampfHandelnUebersicht(
          this.teilnehmer.typ,
          this.teilnehmer.payload,
        );
      },
      hatSlUebersicht() {
        const u = this.slUebersicht;
        return !!(
          (u.kategorien && u.kategorien.length) ||
          (u.kampfZeilen && u.kampfZeilen.length) ||
          (u.inventarZeilen && u.inventarZeilen.length)
        );
      },
      faehigkeitKategorien() {
        return (this.slUebersicht.kategorien || []).filter((k) => !k.begabungenKompakt);
      },
      begabungSpalten() {
        const kat = (this.slUebersicht.kategorien || []).find((k) => k.begabungenKompakt);
        if (!kat || !kat.begabungenKompakt) {
          return [];
        }
        const b = kat.begabungenKompakt;
        return [
          { id: 'handeln', label: 'Handeln', wert: b.handeln },
          { id: 'wissen', label: 'Wissen', wert: b.wissen },
          { id: 'soziales', label: 'Soziales', wert: b.soziales },
        ];
      },
      zeigtBegabungSpalten() {
        return this.begabungSpalten.length > 0;
      },
      zeigtFaehigkeitSpalten() {
        return this.faehigkeitKategorien.length > 0 || this.zeigtBegabungSpalten;
      },
    },
    methods: {
      toggleTeilnehmer() {
        this.teilnehmerOffen = !this.teilnehmerOffen;
      },
      toggleKategorie(id) {
        this.kategorieOffen = {
          ...this.kategorieOffen,
          [id]: !this.kategorieOffen[id],
        };
      },
      kategorieIstOffen(id) {
        return !!this.kategorieOffen[id];
      },
      toggleKampfBlock() {
        this.kampfBlockOffen = !this.kampfBlockOffen;
      },
      toggleInventarBlock() {
        this.inventarBlockOffen = !this.inventarBlockOffen;
      },
      stopPropagation(event) {
        event.stopPropagation();
      },
      faehigkeitsProbeWuerfeln(kategorieId, faehigkeit) {
        this.$emit('probe', { teilnehmer: this.teilnehmer, kategorie: kategorieId, faehigkeit });
      },
      begabungProbeWuerfeln(spalte) {
        if (!spalte || !spalte.id) {
          return;
        }
        this.$emit('probe', {
          teilnehmer: this.teilnehmer,
          modus: 'begabung',
          kategorie: spalte.id,
          zielwert: spalte.wert,
        });
      },
    },
    template: `
      <div class="htbah-konflikt-teilnehmer-wrap">
        <button
          type="button"
          class="htbah-konflikt-teilnehmer-kopf w-100 border-0 text-start"
          :aria-expanded="teilnehmerOffen ? 'true' : 'false'"
          @click="toggleTeilnehmer">
          <entitaet-anzeige-icon
            :entity-typ="teilnehmer.typ"
            :zeile="teilnehmer.payload"
            :charakter-bild="teilnehmer.charakterBild"
            groesse="md" />
          <span class="flex-grow-1 min-w-0">
            <span class="d-flex flex-wrap align-items-center gap-1">
              <span class="fw-semibold text-truncate">{{ teilnehmer.label }}</span>
              <span v-if="statusEmoji" class="flex-shrink-0" aria-hidden="true">{{ statusEmoji }}</span>
              <span class="badge rounded-pill" :class="typBadge.klasse">{{ typBadge.text }}</span>
            </span>
            <span
              class="htbah-map-node-kampf-stats mt-1 d-inline-flex"
              role="group"
              :aria-label="'Kurz: Initiative und LP'">
              <span class="htbah-map-node-kampf-stats-zeile" title="Initiative">
                <span class="material-symbols-outlined htbah-map-node-kampf-stats-ico" aria-hidden="true">swords</span>
                <span class="tabular-nums">{{ teilnehmer.initiative || '—' }}</span>
              </span>
              <span class="htbah-map-node-kampf-stats-zeile" title="Lebenspunkte">
                <span class="material-symbols-outlined htbah-map-node-kampf-stats-ico" aria-hidden="true">favorite</span>
                <span class="tabular-nums">{{ teilnehmer.lebenspunkte || '—' }}</span>
              </span>
            </span>
          </span>
          <span class="d-flex align-items-center gap-1 flex-shrink-0">
            <span class="d-flex align-items-center gap-1 flex-shrink-0">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary htbah-konflikt-teilnehmer-aktion-btn"
                title="Aus Konflikt entfernen"
                aria-label="Aus Konflikt entfernen"
                @click.stop="$emit('entfernen')">
                <span class="material-symbols-outlined" aria-hidden="true">person_remove</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary htbah-konflikt-teilnehmer-aktion-btn"
                title="In Kampagne / Welt öffnen"
                aria-label="Auf Welt anzeigen"
                @click.stop="$emit('welt')">
                <span aria-hidden="true">🌍</span>
              </button>
            </span>
            <span class="material-symbols-outlined htbah-konflikt-collapse-ico" aria-hidden="true">
              {{ teilnehmerOffen ? 'expand_less' : 'expand_more' }}
            </span>
          </span>
        </button>
        <div v-show="teilnehmerOffen" class="htbah-konflikt-teilnehmer-body px-2 pb-2">
          <div class="row g-2 mb-2 pt-2">
            <div class="col-6">
              <label class="form-label small text-secondary mb-0">Initiative</label>
              <div class="input-group input-group-sm">
                <input
                  type="number"
                  class="form-control"
                  min="1"
                  :max="10 + teilnehmer.begabungHandeln"
                  :value="teilnehmer.initiative"
                  @change="$emit('initiative', $event.target.value)" />
                <button type="button" class="btn btn-outline-primary" @click="$emit('initiative-wuerfeln')">🎲</button>
              </div>
            </div>
            <div class="col-6">
              <label class="form-label small text-secondary mb-0">Lebenspunkte</label>
              <input
                type="text"
                class="form-control form-control-sm"
                :value="teilnehmer.lebenspunkte"
                inputmode="numeric"
                @change="$emit('lp', $event.target.value)" />
            </div>
          </div>
          <div class="btn-group btn-group-sm w-100 htbah-kampf-zustand-toggle mb-2" role="group">
            <button
              v-for="opt in kampfZustandOptionen"
              :key="teilnehmer.refKey + '-kz-' + opt.id"
              type="button"
              class="btn"
              :class="teilnehmer.kampfZustand === opt.id ? 'btn-primary' : 'btn-outline-secondary'"
              @click="$emit('kampf-zustand', opt.id)">
              <span aria-hidden="true">{{ opt.emoji }}</span>
              <span class="ms-1 d-none d-sm-inline">{{ opt.label }}</span>
            </button>
          </div>
          <div class="d-flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="$emit('seite', teilnehmer.seite === 'helden' ? 'gegner' : 'helden')">
              Seite wechseln
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="$emit('schaden')">
              💥 Schaden
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="$emit('parade')">
              🛡️ Parade
            </button>
          </div>
          <div
            v-if="hatSlUebersicht"
            class="htbah-konflikt-sl-uebersicht border-top pt-2"
            role="region"
            aria-label="Kampf- und Handelnwerte">
            <div v-if="zeigtFaehigkeitSpalten" class="row g-2 mb-2 htbah-konflikt-kat-spalten">
              <template v-if="zeigtBegabungSpalten">
                <div
                  v-for="spalte in begabungSpalten"
                  :key="teilnehmer.refKey + '-bsp-' + spalte.id"
                  class="col-12 col-md-4">
                  <div class="card htbah-konflikt-kat-card h-100 shadow-sm">
                    <button
                      type="button"
                      class="card-header py-1 px-2 htbah-konflikt-kat-kopf-btn d-flex align-items-center justify-content-between gap-1"
                      :aria-expanded="kategorieIstOffen(spalte.id) ? 'true' : 'false'"
                      @click="toggleKategorie(spalte.id)">
                      <span class="fw-semibold small">{{ spalte.label }}</span>
                      <span class="d-flex align-items-center gap-1 flex-shrink-0">
                        <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-begabung">
                          B {{ spalte.wert }}
                        </span>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary py-0 px-2"
                          :aria-label="'Probe würfeln: Begabung ' + spalte.label"
                          @click.stop="begabungProbeWuerfeln(spalte)">
                          🎲
                        </button>
                        <span class="material-symbols-outlined htbah-konflikt-collapse-ico" aria-hidden="true">
                          {{ kategorieIstOffen(spalte.id) ? 'expand_less' : 'expand_more' }}
                        </span>
                      </span>
                    </button>
                    <div v-show="kategorieIstOffen(spalte.id)" class="card-body py-2 px-2">
                      <p class="small mb-0 text-body-secondary">
                        Begabungswert (0–40)
                      </p>
                    </div>
                  </div>
                </div>
              </template>
              <div
                v-for="kat in faehigkeitKategorien"
                :key="teilnehmer.refKey + '-kat-' + kat.id"
                class="col-12 col-md-4">
                <div class="card htbah-konflikt-kat-card h-100 shadow-sm">
                  <button
                    type="button"
                    class="card-header py-1 px-2 htbah-konflikt-kat-kopf-btn d-flex align-items-center justify-content-between gap-1"
                    :aria-expanded="kategorieIstOffen(kat.id) ? 'true' : 'false'"
                    @click="toggleKategorie(kat.id)">
                    <span class="fw-semibold small text-truncate">{{ kat.label }}</span>
                    <span class="d-flex align-items-center gap-1 flex-shrink-0 flex-wrap justify-content-end">
                      <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-summe">
                        Σ {{ kat.summe }}
                      </span>
                      <span class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-begabung">
                        B {{ kat.begabung }}
                      </span>
                      <span
                        v-if="kat.gbVerbleibend != null"
                        class="badge rounded-pill faehigkeiten-stat-badge faehigkeiten-stat-badge-geistesblitz">
                        GB {{ kat.gbVerbleibend }}/{{ kat.gbMax }}
                      </span>
                      <span class="material-symbols-outlined htbah-konflikt-collapse-ico" aria-hidden="true">
                        {{ kategorieIstOffen(kat.id) ? 'expand_less' : 'expand_more' }}
                      </span>
                    </span>
                  </button>
                  <div v-show="kategorieIstOffen(kat.id)" class="card-body py-1 px-2">
                    <ul
                      v-if="kat.faehigkeiten && kat.faehigkeiten.length"
                      class="list-unstyled mb-0 htbah-konflikt-sl-faehigkeiten">
                      <li
                        v-for="f in kat.faehigkeiten"
                        :key="teilnehmer.refKey + '-f-' + kat.id + '-' + f.name"
                        class="htbah-konflikt-sl-faehigkeit-zeile">
                        <span class="htbah-konflikt-sl-faehigkeit-name" :title="f.name">{{ f.name }}</span>
                        <span class="d-inline-flex align-items-center gap-2 flex-shrink-0">
                          <span class="tabular-nums">
                            <span class="text-muted">{{ f.basis }}</span>
                            <span class="text-body-secondary mx-1" aria-hidden="true">→</span>
                            <span>{{ f.effektiv }}</span>
                          </span>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-primary py-0 px-2"
                            :aria-label="'Probe würfeln: ' + f.name"
                            @click="faehigkeitsProbeWuerfeln(kat.id, f)">
                            🎲
                          </button>
                        </span>
                      </li>
                    </ul>
                    <p v-else class="small text-body-secondary mb-0">Keine Fähigkeiten mit Punkten.</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="slUebersicht.kampfZeilen.length" class="card htbah-konflikt-kat-card shadow-sm mb-2">
              <button
                type="button"
                class="card-header py-1 px-2 htbah-konflikt-kat-kopf-btn d-flex align-items-center justify-content-between"
                :aria-expanded="kampfBlockOffen ? 'true' : 'false'"
                @click="toggleKampfBlock">
                <span class="fw-semibold small">Kampf</span>
                <span class="material-symbols-outlined htbah-konflikt-collapse-ico" aria-hidden="true">
                  {{ kampfBlockOffen ? 'expand_less' : 'expand_more' }}
                </span>
              </button>
              <div v-show="kampfBlockOffen" class="card-body py-2 px-2">
                <dl class="htbah-konflikt-sl-dl mb-0">
                  <template v-for="(z, ki) in slUebersicht.kampfZeilen" :key="teilnehmer.refKey + '-kz-' + ki">
                    <dt>{{ z.label }}</dt>
                    <dd>{{ z.wert }}</dd>
                  </template>
                </dl>
              </div>
            </div>
            <div v-if="slUebersicht.inventarZeilen.length" class="card htbah-konflikt-kat-card shadow-sm mb-0">
              <button
                type="button"
                class="card-header py-1 px-2 htbah-konflikt-kat-kopf-btn d-flex align-items-center justify-content-between"
                :aria-expanded="inventarBlockOffen ? 'true' : 'false'"
                @click="toggleInventarBlock">
                <span class="fw-semibold small">Inventar</span>
                <span class="d-flex align-items-center gap-1">
                  <span class="badge rounded-pill text-bg-secondary">{{ slUebersicht.inventarZeilen.length }}</span>
                  <span class="material-symbols-outlined htbah-konflikt-collapse-ico" aria-hidden="true">
                    {{ inventarBlockOffen ? 'expand_less' : 'expand_more' }}
                  </span>
                </span>
              </button>
              <div v-show="inventarBlockOffen" class="card-body py-1 px-2">
                <ul class="list-unstyled mb-0 htbah-konflikt-sl-inventar">
                  <li
                    v-for="(inv, ii) in slUebersicht.inventarZeilen"
                    :key="teilnehmer.refKey + '-inv-' + ii"
                    class="htbah-konflikt-sl-inventar-zeile">
                    <span class="badge rounded-pill me-1" :class="inv.badgeClass || 'text-bg-secondary'">{{ inv.typ }}</span>
                    <span class="fw-medium">{{ inv.name }}</span>
                    <span v-if="inv.werte && inv.werte !== '—'" class="text-body-secondary ms-1">· {{ inv.werte }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p v-else class="small text-body-secondary border-top pt-2 mb-0">
            Keine Kampf- oder Fähigkeitswerte hinterlegt.
          </p>
        </div>
      </div>
    `,
  };

  window.HTBAH_KOMPONENTEN.KonfliktModal.components.KonfliktTeilnehmerKarteInhalt =
    window.HTBAH_KOMPONENTEN.KonfliktTeilnehmerKarteInhalt;
})();
