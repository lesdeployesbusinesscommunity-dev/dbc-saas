// Import Dependencies
import { Navigate } from "react-router";

// ----------------------------------------------------------------------

// Espace admin (/admin/...). Pas encore protégé par AuthGuard : la
// connexion admin n'est pas encore branchée côté backend (voir le plan
// d'intégration API) — à revoir une fois l'authentification disponible.
// Toutes les pages du menu admin sont désormais construites (voir
// app/pages/Admin/*) — "ComingSoon" ne sert donc plus ici, mais reste
// disponible pour une future entrée de menu qui n'aurait pas encore sa
// page.
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
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Reseau")).default,
      }),
    },
    {
      path: "gouvernance",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Gouvernance")).default,
      }),
    },
    {
      path: "finance",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Finance")).default,
      }),
    },
    {
      path: "formation",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Formation")).default,
      }),
    },
    {
      path: "parametres",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Parametres")).default,
      }),
    },
  ],
};

export { adminRoutes };
