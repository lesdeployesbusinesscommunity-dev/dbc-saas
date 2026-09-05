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
        {
          // URL: /simulateur-de-revenus -> affiche le simulateur de revenus
          path: "simulateur-de-revenus",
          lazy: async () => ({
            Component: (await import("app/pages/Simulateur")).default,
          }),
        },
        {
          // URL: /a-propos -> affiche la page A propos
          path: "a-propos",
          lazy: async () => ({
            Component: (await import("app/pages/APropos")).default,
          }),
        },
        {
          // URL: /contacts -> affiche la page Contacts
          path: "contacts",
          lazy: async () => ({
            Component: (await import("app/pages/Contacts")).default,
          }),
        },
      ],
    },
    {
      // URL: /inscription -> écran plein "Rejoindre la DBC" (nom +
      // matricule), volontairement en dehors de PublicLayout : pas de
      // header/footer, comme une page de connexion classique.
      path: "inscription",
      lazy: async () => ({
        Component: (await import("app/pages/Inscription")).default,
      }),
    },
  ],
};

export { publicRoutes };
