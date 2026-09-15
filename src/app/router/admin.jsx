// Import Dependencies
import { Navigate } from "react-router";

// Local Imports
import { ComingSoon } from "app/pages/Admin/ComingSoon";

// ----------------------------------------------------------------------

// Espace admin (/admin/...). Pas encore protégé par AuthGuard : la
// connexion admin n'est pas encore branchée côté backend (voir le plan
// d'intégration API) — à revoir une fois l'authentification disponible.
// On avance page par page : Dashboard et Gestion des membres sont
// construits, les autres entrées du menu renvoient une page "bientôt
// disponible" pour ne pas laisser de lien mort dans la sidebar.
const adminRoutes = {
  id: "admin",
  path: "admin",
  lazy: async () => ({
    Component: (await import("app/pages/Admin/layout/AdminLayout")).default,
  }),
  children: [
    {
      index: true,
      element: <Navigate to="/admin/dashboard" replace />,
    },
    {
      path: "dashboard",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Dashboard")).default,
      }),
    },
    {
      path: "membres",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Membres")).default,
      }),
    },
    {
      path: "reseau",
      element: <ComingSoon titleKey="admin.nav.reseau" />,
    },
    {
      path: "gouvernance",
      element: <ComingSoon titleKey="admin.nav.gouvernance" />,
    },
    {
      path: "finance",
      element: <ComingSoon titleKey="admin.nav.finance" />,
    },
    {
      path: "formation",
      element: <ComingSoon titleKey="admin.nav.formation" />,
    },
    {
      path: "parametres",
      element: <ComingSoon titleKey="admin.nav.parametres" />,
    },
  ],
};

export { adminRoutes };
