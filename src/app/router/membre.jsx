// Import Dependencies
import { Navigate } from "react-router";

// Local Imports
import { MembreSessionGuard } from "app/pages/Auth/SessionGuard";

// ----------------------------------------------------------------------

// Espace membre (/membre/...). Protégé par MembreSessionGuard : sans
// session (connexion sur /login, gardée en mémoire — donc perdue à chaque
// actualisation) on est renvoyé vers /login, et la session se ferme après
// quelques minutes d'inactivité (voir Auth/SessionGuard.jsx). Pas encore
// AuthGuard : la connexion membre n'est pas branchée côté backend — même
// situation que l'espace admin (voir admin.jsx). On avance page par page :
// "dashboard", "tontine", "mlm", "coins", "reseau", "formation", "piliers"
// et "parametres" sont construits.
const membreRoutes = {
  id: "membre",
  path: "membre",
  Component: MembreSessionGuard,
  children: [
    {
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
          path: "tontine/guide",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Tontine/Guide")).default,
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
          // Espace leader (réservé aux leaders d'antenne, voir
          // Membre/Leader/LeaderShell.jsx) : entretiens à mener, dossier d'un
          // candidat + compte-rendu, membres de l'antenne, guide, rôle.
          path: "leader",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader")).default,
          }),
        },
        {
          path: "leader/dossier/:id",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/DossierPage")).default,
          }),
        },
        {
          path: "leader/antenne",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/Antenne")).default,
          }),
        },
        {
          path: "leader/relances",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/Relances")).default,
          }),
        },
        {
          path: "leader/relance/:id",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/RelancePage")).default,
          }),
        },
        {
          path: "leader/tontine",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/Tontine")).default,
          }),
        },
        {
          path: "leader/annonces",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/Annonces")).default,
          }),
        },
        {
          path: "leader/guide",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/Guide")).default,
          }),
        },
        {
          path: "leader/role",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Leader/Role")).default,
          }),
        },
        {
          path: "annonces",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Annonces")).default,
          }),
        },
        {
          path: "notifications",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Notifications")).default,
          }),
        },
        {
          path: "parametres",
          lazy: async () => ({
            Component: (await import("app/pages/Membre/Parametres")).default,
          }),
        },
      ],
    },
  ],
};

export { membreRoutes };
