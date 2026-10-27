// Import Dependencies
import {
  Squares2X2Icon,
  BanknotesIcon,
  Square3Stack3DIcon,
  CircleStackIcon,
  ShareIcon,
  AcademicCapIcon,
  BellIcon,
  MegaphoneIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
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
  // Annonces de l'administration et des leaders ; pastille des non lues (voir MembreSidebar).
  { key: "annonces", labelKey: "membre.nav.annonces", to: "/membre/annonces", Icon: MegaphoneIcon },
  // Pastille du nombre de notifications non lues (voir MembreSidebar).
  { key: "notifications", labelKey: "membre.nav.notifications", to: "/membre/notifications", Icon: BellIcon },
];

// "Espace leader" : réservé aux leaders d'antenne (voir Leader/leaderAccess.js).
// La barre latérale l'insère avant "Notifications" seulement pour eux (voir
// MembreSidebar) ; pastille du nombre de dossiers à traiter / membres en retard.
export const memberLeaderItem = {
  key: "leader",
  labelKey: "membre.nav.leader",
  to: "/membre/leader",
  Icon: ShieldCheckIcon,
};

// Le même menu rangé en catégories qui se déplient (voir
// components/shared/SidebarNav.jsx). Dashboard et l'Espace leader restent seuls ;
// l'Espace leader (réservé aux leaders) s'insère avant "Communication".
const byKey = Object.fromEntries(memberNavItems.map((item) => [item.key, item]));
export const memberNavEntries = (isLeader) => [
  byKey.dashboard,
  {
    key: "groupArgent",
    labelKey: "membre.navGroups.argent",
    Icon: BanknotesIcon,
    items: [byKey.tontine, byKey.mlm, byKey.coins],
  },
  {
    key: "groupDevelopper",
    labelKey: "membre.navGroups.developper",
    Icon: AcademicCapIcon,
    items: [byKey.reseau, byKey.formation, byKey.piliers],
  },
  ...(isLeader ? [memberLeaderItem] : []),
  {
    key: "groupCommunication",
    labelKey: "membre.navGroups.communication",
    Icon: BellIcon,
    items: [byKey.annonces, byKey.notifications],
  },
];

// Traité à part (voir MembreSidebar) : toujours affiché en bas, séparé du
// reste du menu — même traitement que côté admin (voir adminNav.js).
export const memberSettingsItem = {
  key: "parametres",
  labelKey: "membre.nav.parametres",
  to: "/membre/parametres",
  Icon: Cog6ToothIcon,
};
