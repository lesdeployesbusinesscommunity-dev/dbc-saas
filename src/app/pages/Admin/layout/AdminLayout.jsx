// Import Dependencies
import { Outlet } from "react-router";

// Local Imports
import { AdminSidebar } from "./AdminSidebar";
import { NetworkDataProvider } from "../context/NetworkDataContext";

// ----------------------------------------------------------------------

// Cadre commun à toutes les pages admin : fond neutre, sidebar fixe à
// gauche, contenu scrollable à droite (chaque page définit elle-même sa
// mise en page interne, ex: le Dashboard divise le reste en colonne
// principale + panneau latéral).
//
// Le fond utilise un blanc cassé très légèrement chaud ("#FAF7F4") plutôt
// que l'ancien orange pastel plein ("#FCE3D1") : une teinte aussi soutenue
// sur toute la surface de l'écran donnait un rendu criard plutôt que "haut
// standing" — les interfaces admin premium réservent la couleur de marque
// aux accents (sidebar, boutons, badges) et gardent un fond neutre en
// arrière-plan. Couleur pleine plutôt qu'en opacité : avec l'opacité, le
// rendu dépend de ce qu'il y a derrière, et le thème sombre du template
// faisait apparaître un fond presque noir au lieu du blanc cassé voulu.
//
// Note : cette section n'est pas encore protégée par AuthGuard — la
// connexion admin n'est pas encore câblée côté backend. À reprendre une
// fois l'authentification intégrée.
export default function AdminLayout() {
  return (
    <NetworkDataProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAF7F4]">
        <AdminSidebar />
        <div className="h-full min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </NetworkDataProvider>
  );
}
