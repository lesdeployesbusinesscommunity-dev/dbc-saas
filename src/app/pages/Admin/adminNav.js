// Import Dependencies
import {
  Squares2X2Icon,
  UserGroupIcon,
  ArrowPathRoundedSquareIcon,
  ShareIcon,
  BoltIcon,
  BanknotesIcon,
  AcademicCapIcon,
  BellIcon,
  BuildingLibraryIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Menu de la barre latérale admin. "Paramètres" est traité à part (voir
// AdminSidebar) car il est toujours affiché en bas, séparé du reste.
// "labelKey" (plutôt que du texte brut) est lu via t() dans AdminSidebar,
// pour rester FR/EN comme le reste du site.
export const adminNavItems = [
  { key: "dashboard", labelKey: "admin.nav.dashboard", to: "/admin/dashboard", Icon: Squares2X2Icon },
  {
    key: "membres",
    labelKey: "admin.nav.membres",
    to: "/admin/membres",
    Icon: UserGroupIcon,
  },
  // Pastille du nombre de nouvelles demandes à attribuer (voir AdminSidebar).
  {
    key: "inscriptions",
    labelKey: "admin.nav.inscriptions",
    to: "/admin/inscriptions",
    Icon: ClipboardDocumentListIcon,
  },
  {
    key: "tontine",
    labelKey: "admin.nav.tontine",
    to: "/admin/tontine",
    Icon: ArrowPathRoundedSquareIcon,
  },
  {
    key: "reseau",
    labelKey: "admin.nav.reseau",
    to: "/admin/reseau",
    Icon: ShareIcon,
  },
  { key: "gouvernance", labelKey: "admin.nav.gouvernance", to: "/admin/gouvernance", Icon: BoltIcon },
  { key: "finance", labelKey: "admin.nav.finance", to: "/admin/finance", Icon: BanknotesIcon },
  { key: "formation", labelKey: "admin.nav.formation", to: "/admin/formation", Icon: AcademicCapIcon },
  // DBC Invest Club : le cercle d'accompagnement des membres investisseurs (4 niveaux).
  { key: "investClub", labelKey: "admin.nav.investClub", to: "/admin/invest-club", Icon: ArrowTrendingUpIcon },
  { key: "piliers", labelKey: "admin.nav.piliers", to: "/admin/piliers", Icon: BuildingLibraryIcon },
  // Annonces : publier un message dans le fil d'actualité des membres (à tous,
  // à un niveau, à un groupe, à une antenne, aux leaders ou à des membres choisis).
  { key: "annonces", labelKey: "admin.nav.annonces", to: "/admin/annonces", Icon: MegaphoneIcon },
  // Pastille du nombre de demandes à traiter et de notifications non lues
  // (voir AdminSidebar).
  { key: "notifications", labelKey: "admin.nav.notifications", to: "/admin/notifications", Icon: BellIcon },
];

// Le même menu, rangé en catégories qui se déplient (voir
// components/shared/SidebarNav.jsx) : Dashboard et Notifications restent seuls,
// les autres pages sont regroupées par thème.
const byKey = Object.fromEntries(adminNavItems.map((item) => [item.key, item]));
export const adminNavEntries = [
  byKey.dashboard,
  {
    key: "groupMembres",
    labelKey: "admin.navGroups.membres",
    Icon: UserGroupIcon,
    items: [byKey.membres, byKey.inscriptions, byKey.reseau, byKey.gouvernance],
  },
  {
    key: "groupFinance",
    labelKey: "admin.navGroups.finance",
    Icon: BanknotesIcon,
    items: [byKey.tontine, byKey.finance, byKey.investClub],
  },
  {
    key: "groupContenu",
    labelKey: "admin.navGroups.contenu",
    Icon: AcademicCapIcon,
    items: [byKey.formation, byKey.piliers, byKey.annonces],
  },
  byKey.notifications,
];

export const adminSettingsItem = {
  key: "parametres",
  labelKey: "admin.nav.parametres",
  to: "/admin/parametres",
  Icon: Cog6ToothIcon,
};
