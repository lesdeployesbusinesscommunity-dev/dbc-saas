// Import Dependencies
import { Outlet } from "react-router";

// Local Imports
import { AdminSidebar } from "./AdminSidebar";
import { NetworkDataProvider } from "../context/NetworkDataContext";

// ----------------------------------------------------------------------

// Cadre commun à toutes les pages admin : fond orange très léger, sidebar
// fixe à gauche, contenu scrollable à droite (chaque page définit
// elle-même sa mise en page interne, ex: le Dashboard divise le reste en
// colonne principale + panneau latéral).
//
// Le fond utilise une couleur pleine ("#FCE3D1") plutôt qu'un orange en
// opacité : avec l'opacité, la couleur dépend de ce qu'il y a derrière, et
// le thème sombre du template faisait apparaître un fond presque noir au
// lieu de l'orange clair demandé. Cette teinte est volontairement un peu
// plus soutenue qu'un vrai 10% (qui, sur fond blanc, se voit à peine) pour
// que l'orange reste bien visible, au même titre que le bleu à 10% des
// blocs "Bénéficiaire tontine" / "Formation" (eux restent en opacité, posés
// sur ce fond clair et non sur un fond sombre — donc pas concernés par le bug).
//
// Note : cette section n'est pas encore protégée par AuthGuard — la
// connexion admin n'est pas encore câblée côté backend. À reprendre une
// fois l'authentification intégrée.
export default function AdminLayout() {
  return (
    <NetworkDataProvider>
      <div className="flex h-screen overflow-hidden bg-[#FCE3D1]">
        <AdminSidebar />
        <div className="h-full min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </NetworkDataProvider>
  );
}
