// Import Dependencies
import {
  Squares2X2Icon,
  UserGroupIcon,
  ShareIcon,
  BoltIcon,
  BanknotesIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
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
  {
    key: "reseau",
    labelKey: "admin.nav.reseau",
    to: "/admin/reseau",
    Icon: ShareIcon,
  },
  { key: "gouvernance", labelKey: "admin.nav.gouvernance", to: "/admin/gouvernance", Icon: BoltIcon },
  { key: "finance", labelKey: "admin.nav.finance", to: "/admin/finance", Icon: BanknotesIcon },
  { key: "formation", labelKey: "admin.nav.formation", to: "/admin/formation", Icon: AcademicCapIcon },
];

export const adminSettingsItem = {
  key: "parametres",
  labelKey: "admin.nav.parametres",
  to: "/admin/parametres",
  Icon: Cog6ToothIcon,
};
