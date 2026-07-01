/**
 * Zentrale Theme-Registry für thematische Settings (Fantasy, Gegenwart, Sci-Fi, …).
 *
 * Neues Theme hinzufügen:
 * 1. Eintrag unten ergänzen (id muss mit data-theme-setting und CSS-Dateiname übereinstimmen)
 * 2. themes/settings/<id>.css anlegen (Vorlage: themes/settings/_template.css)
 * 3. @import in themes/index.css ergänzen
 * 4. Optional: Hintergrundbilder assets/img/bg-desktop-<id>.png und
 *    assets/img/bg-mobile-device-portrait-<id>.png
 */
window.HTBAH_THEME_REGISTRY = Object.freeze([
  {
    id: 'fantasy',
    label: 'Fantasy',
    emoji: '🏰',
    zufallEpoche: 'mittelalter',
    charakterEpoche: 'mittelalter-fantasy',
    pdfStil: 'fantasy-mittelalter',
  },
  {
    id: 'gegenwart',
    label: 'Gegenwart',
    emoji: '🏙️',
    zufallEpoche: 'gegenwart',
    charakterEpoche: 'gegenwart',
    pdfStil: 'gegenwart',
    /** Standard-Setting für neue Nutzer */
    istStandard: true,
  },
  {
    id: 'scifi',
    label: 'Sci-Fi',
    emoji: '🚀',
    zufallEpoche: 'zukunft',
    charakterEpoche: 'scifi',
    pdfStil: 'modern-futuristisch',
  },
]);
