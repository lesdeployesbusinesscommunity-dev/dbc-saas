// Local Imports
import { PublicLayout } from "app/layouts/PublicLayout";

// ----------------------------------------------------------------------

// publicRoutes = les routes accessibles à tout le monde, sans être connecté
// (contrairement à protectedRoutes qui exige d'être authentifié).
const publicRoutes = {
  id: "public",
  children: [
    {
      // Toutes les pages publiques passent par PublicLayout (header, pas de sidebar)
      Component: PublicLayout,
      children: [
        {
          // URL: /accueil -> affiche la page Visiteur
          path: "accueil",
          lazy: async () => ({
            Component: (await import("app/pages/Visiteur")).default,
          }),
        },
      ],
    },
  ],
};

export { publicRoutes };
