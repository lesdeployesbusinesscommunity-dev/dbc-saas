// Import Dependencies
import { Navigate } from "react-router";

// Local Imports
import { AdminSessionGuard } from "app/pages/Auth/SessionGuard";

// ----------------------------------------------------------------------

// Espace admin (/admin/...). Protégé par AdminSessionGuard : il faut s'être
// connecté sur /login avec un compte que le backend reconnaît comme
// administrateur (rôle "admin" porté par le jeton) — voir Auth/session.js.
// Le backend revérifie ce rôle sur chaque endpoint admin : ce garde ne fait
// qu'éviter d'afficher l'interface à un visiteur non autorisé.
const adminRoutes = {
  id: "admin",
  path: "admin",
  Component: AdminSessionGuard,
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
          path: "piliers",
          lazy: async () => ({
            Component: (await import("app/pages/Admin/Piliers")).default,
          }),
        },
        {
          path: "notifications",
          lazy: async () => ({
            Component: (await import("app/pages/Admin/Notifications")).default,
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
};

export { adminRoutes };
