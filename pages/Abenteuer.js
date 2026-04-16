window.HTBAH_SEITEN = window.HTBAH_SEITEN || {};

window.HTBAH_SEITEN.Abenteuer = {
  data() {
    return {
      charakter: window.HTBAH.ladeCharakter(),
      protokoll: [],
      gegnerLp: 100,
      initiative: null,
    };
  },
  created() {
    if (!this.charakter) this.$router.push('/charakter-erstellung');
  },
  methods: {
    initiativeWuerfeln() {
      this.initiative =
        window.HTBAH.wuerfelW10() +
        Math.round(this.charakter.handeln.reduce((summe, eintrag) => summe + eintrag.value, 0) / 10);
      this.protokoll.unshift('Initiative: ' + this.initiative);
    },
    angreifen() {
      const wurf = window.HTBAH.wuerfelW100();
      const faehigkeit = this.charakter.handeln[0];

      if (!faehigkeit) return;

      const wert =
        faehigkeit.value +
        Math.round(this.charakter.handeln.reduce((summe, eintrag) => summe + eintrag.value, 0) / 10);

      if (wurf <= wert) {
        const schaden = window.HTBAH.wuerfelW10() * 5;
        this.gegnerLp -= schaden;
        this.protokoll.unshift('Treffer! Schaden: ' + schaden);
      } else {
        this.protokoll.unshift('Verfehlt (' + wurf + ')');
      }
    },
    geistesblitzNutzen() {
      this.protokoll.unshift('Geistesblitz genutzt!');
    },
    kampfZuruecksetzen() {
      this.gegnerLp = 100;
      this.protokoll = [];
    },
  },
  template: `
    <div class="container content py-3" v-if="charakter">
      <h4>{{charakter.name}}</h4>

      <div class="card p-2 mb-2">
        <p>Gegner LP: {{gegnerLp}}</p>
      </div>

      <button class="btn btn-warning w-100 mb-2" @click="initiativeWuerfeln">
        Initiative würfeln
      </button>

      <button class="btn btn-danger w-100 mb-2" @click="angreifen">
        Angriff
      </button>

      <button class="btn btn-secondary w-100 mb-2" @click="geistesblitzNutzen">
        Geistesblitz
      </button>

      <button class="btn btn-outline-light w-100 mb-2" @click="kampfZuruecksetzen">
        Kampf zurücksetzen
      </button>

      <div class="card p-2">
        <h5>Protokoll</h5>
        <div v-for="eintrag in protokoll">{{eintrag}}</div>
      </div>
    </div>
  `,
};
