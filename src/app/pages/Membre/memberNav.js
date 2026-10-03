// Import Dependencies
import {
  Squares2X2Icon,
  BanknotesIcon,
  Square3Stack3DIcon,
  CircleStackIcon,
  ShareIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Menu de la barre latérale membre. Icônes choisies pour correspondre au
// sens de chaque page plutôt qu'à l'esthétique seule : "Ma Tontine" (des
// billets, l'argent mis en commun), "Mon MLM" (des niveaux empilés, le
// plan de carrière à paliers), "DBC Coins" (une pile de jetons), "Mon
// Réseau" (des nœuds reliés entre eux, le réseau de filleuls), "Formation"
// (même icône que côté admin, pour rester cohérent d'un espace à l'autre).
export const memberNavItems = [
  { key: "dashboard", labelKey: "membre.nav.dashboard", to: "/membre/dashboard", Icon: Squares2X2Icon },
  { key: "tontine", labelKey: "membre.nav.tontine", to: "/membre/tontine", Icon: BanknotesIcon },
  { key: "mlm", labelKey: "membre.nav.mlm", to: "/membre/mlm", Icon: Square3Stack3DIcon },
  { key: "coins", labelKey: "membre.nav.coins", to: "/membre/coins", Icon: CircleStackIcon },
  { key: "reseau", labelKey: "membre.nav.reseau", to: "/membre/reseau", Icon: ShareIcon },
  { key: "formation", labelKey: "membre.nav.formation", to: "/membre/formation", Icon: AcademicCapIcon },
  // "Piliers" (colonnes) : INVESTIR et FINANCER, les deux piliers de la DBC.
  { key: "piliers", labelKey: "membre.nav.piliers", to: "/membre/piliers", Icon: BuildingLibraryIcon },
];

// Traité à part (voir MembreSidebar) : toujours affiché en bas, séparé du
// reste du menu — même traitement que côté admin (voir adminNav.js).
export const memberSettingsItem = {
  key: "parametres",
  labelKey: "membre.nav.parametres",
  to: "/membre/parametres",
  Icon: Cog6ToothIcon,
};
