// Import Dependencies
import { Navigate } from "react-router";

// Local Imports
import AdminSecretGuard from "middleware/AdminSecretGuard";

// ----------------------------------------------------------------------

// Espace admin (/admin/...), protégé par AdminSecretGuard (secret partagé
// x-admin-secret — voir ce fichier pour le détail du mécanisme, interim en
// attendant un vrai système de rôles côté backend). "/admin/connexion" est
// la seule route publique de cet arbre : elle sert à saisir le secret.
const adminRoutes = {
  id: "admin",
  path: "admin",
  children: [
    {
      path: "connexion",
      lazy: async () => ({
        Component: (await import("app/pages/Admin/Connexion")).default,
      }),
    },
    {
      Component: AdminSecretGuard,
      children: [
        {
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
              path: "demandes-inscription",
              lazy: async () => ({
                Component: (await import("app/pages/Admin/DemandesInscription")).default,
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
        },
      ],
    },
  ],
};

export { adminRoutes };
