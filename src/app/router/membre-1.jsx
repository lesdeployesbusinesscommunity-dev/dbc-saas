// Import Dependencies
import { Navigate } from "react-router";

// ----------------------------------------------------------------------

// Espace membre (/membre/...). Pas encore protégé par AuthGuard : la
// connexion membre n'est pas encore branchée côté backend — même
// situation que l'espace admin (voir admin.jsx). On avance page par page :
// "dashboard", "tontine", "mlm", "coins", "reseau", "formation", "piliers"
// et "parametres" sont construits.
const membreRoutes = {
  id: "membre",
  path: "membre",
  lazy: async () => ({
    Component: (await import("app/pages/Membre/layout/MembreLayout")).default,
  }),
  children: [
    {
      index: true,
      element: <Navigate to="/membre/dashboard" replace />,
    },
    {
      path: "dashboard",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Dashboard")).default,
      }),
    },
    {
      path: "tontine",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Tontine")).default,
      }),
    },
    {
      path: "mlm",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Mlm")).default,
      }),
    },
    {
      path: "coins",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Coins")).default,
      }),
    },
    {
      path: "reseau",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Reseau")).default,
      }),
    },
    {
      path: "formation",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Formation")).default,
      }),
    },
    {
      // Une formation précise : chapitres + vidéos, ouverte par "Commencer
      // la formation" depuis la page Formation (le lien "Formation" du menu
      // reste actif, il correspond aussi à /membre/formation/...).
      path: "formation/:trainingId",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Formation/CoursePage")).default,
      }),
    },
    {
      path: "piliers",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Piliers")).default,
      }),
    },
    {
      // Un des 4 piliers (Financer, Former, Réseauter, Investir) : son
      // catalogue complet, ouvert par "Détail <pilier> →" sur la page Piliers.
      path: "piliers/detail/:group",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Piliers/GroupPage")).default,
      }),
    },
    {
      // Un programme précis (ex : Tontine Royale) : son explication, ouverte
      // depuis le catalogue de son pilier.
      path: "piliers/:pillarId",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Piliers/PillarPage")).default,
      }),
    },
    {
      path: "parametres",
      lazy: async () => ({
        Component: (await import("app/pages/Membre/Parametres")).default,
      }),
    },
  ],
};

export { membreRoutes };
