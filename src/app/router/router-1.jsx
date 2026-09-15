// Import Dependencies
import { createBrowserRouter } from "react-router";

// Local Imports
import Root from "app/layouts/Root";
import RootErrorBoundary from "app/pages/errors/RootErrorBoundary";
import { SplashScreen } from "components/template/SplashScreen";
import { protectedRoutes } from "./protected";
import { publicRoutes } from "./public";
import { adminRoutes } from "./admin";

// ----------------------------------------------------------------------

// Note : "ghostRoutes" (./ghost.jsx, qui faisait passer /login par
// GhostGuard pour rediriger un visiteur déjà connecté) n'est plus utilisé
// ici : /login est maintenant une route publique simple, enregistrée dans
// public.jsx au même titre que /inscription. Les fichiers ghost.jsx et
// middleware/GhostGuard.jsx restent en place mais ne sont plus référencés.
const router = createBrowserRouter([
  {
    id: "root",
    Component: Root,
    hydrateFallbackElement: <SplashScreen />,
    ErrorBoundary: RootErrorBoundary,
    children: [protectedRoutes, publicRoutes, adminRoutes],
  },
]);

export default router;
