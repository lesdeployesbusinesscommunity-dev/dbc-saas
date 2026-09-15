// Import Dependencies
import {
  UsersIcon,
  TrophyIcon,
  StarIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------
// Données de démonstration pour le dashboard admin. Rien n'est encore
// branché au backend (voir consigne : l'intégration API de la partie
// admin est mise de côté pour l'instant) — chaque export ci-dessous sera
// remplacé par un vrai appel API au moment venu, sans changer la forme
// des composants qui les consomment.

// L'identité admin est partagée par toutes les pages admin (voir
// Admin/currentAdmin.js) — réexportée ici pour ne pas casser les imports
// existants dans ce dossier.
export { currentAdmin } from "../currentAdmin";

// "Vue globale" : chaque emoji de la maquette est remplacé par une icône.
// "labelKey" (plutôt que du texte brut) est lu via t() par StatsGrid, pour
// rester FR/EN comme le reste du site. Les couleurs alternent entre les
// deux teintes de la marque (orange #EE7115 / bleu #52A2DF) plutôt que
// d'utiliser une couleur différente par tuile (violet, sarcelle, indigo,
// vert...) — resserre la palette pour que le Dashboard reste identifiable
// à la marque au lieu de ressembler à un template générique multicolore.
export const globalStats = [
  { key: "membres", labelKey: "admin.dashboard.stats.membres", value: "5", Icon: UsersIcon, color: "#52A2DF" },
  { key: "niveaux", labelKey: "admin.dashboard.stats.niveaux", value: "8", Icon: TrophyIcon, color: "#EE7115" },
  { key: "tontine", labelKey: "admin.dashboard.stats.tontine", value: "6", Icon: StarIcon, color: "#52A2DF" },
  { key: "antennes", labelKey: "admin.dashboard.stats.antennes", value: "5", Icon: MapPinIcon, color: "#EE7115" },
  { key: "piliers", labelKey: "admin.dashboard.stats.piliers", value: "4", Icon: BuildingLibraryIcon, color: "#52A2DF" },
  {
    key: "programmes",
    labelKey: "admin.dashboard.stats.programmes",
    value: "30+",
    Icon: RectangleGroupIcon,
    color: "#EE7115",
  },
];

// Bénéficiaires de la tontine du mois, par niveau (placeholder — noms et
// villes fictifs en attendant les vraies données membres).
export const tontineBeneficiariesByLevel = {
  1: [
    { id: "b1", name: "Awa Traoré", city: "Yaoundé, Cameroun", status: "pending" },
    { id: "b2", name: "Koffi Mensah", city: "Abidjan, Côte d'Ivoire", status: "pending" },
    { id: "b3", name: "Fatou Diallo", city: "Dakar, Sénégal", status: "paid" },
    { id: "b4", name: "Junior Kabongo", city: "Kinshasa, RDC", status: "pending" },
    { id: "b5", name: "Aïcha Konaté", city: "Bamako, Mali", status: "unpaid" },
    { id: "b6", name: "Emmanuel Nsigou", city: "Libreville, Gabon", status: "pending" },
  ],
  2: [
    { id: "b7", name: "Grace Owusu", city: "Accra, Ghana", status: "pending" },
    { id: "b8", name: "Samuel Okafor", city: "Lagos, Nigéria", status: "paid" },
  ],
};

// Formations en cours affichées dans le carrousel. "poster" réutilise en
// attendant de vraies affiches, des visuels déjà présents dans /public
// (thème "Former") — à remplacer dès que les vraies images sont fournies.
export const trainingsByLevel = {
  1: [
    { id: "t1", name: "Leadership", poster: "/former.jpg", trainer: "Aïcha Konaté", country: "Côte d'Ivoire" },
    { id: "t2", name: "Leadership", poster: "/former 2.jpg", trainer: "David Mbeki", country: "Afrique du Sud" },
    { id: "t3", name: "Leadership", poster: "/former.jpg", trainer: "Grace Owusu", country: "Ghana" },
    { id: "t4", name: "Vente & Négociation", poster: "/former 2.jpg", trainer: "Junior Kabongo", country: "RDC" },
  ],
  2: [
    { id: "t5", name: "Gouvernance", poster: "/former.jpg", trainer: "Fatou Diallo", country: "Sénégal" },
  ],
};

export const tontineLevels = [1, 2, 3, 4, 5, 6, 7, 8];
