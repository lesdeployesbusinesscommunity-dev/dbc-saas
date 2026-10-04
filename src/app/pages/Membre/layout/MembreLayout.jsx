// Import Dependencies
import { Outlet } from "react-router";

// Local Imports
import { MembreSidebar } from "./MembreSidebar";
import { MemberLevelProvider } from "../context/MemberLevelContext";

// ----------------------------------------------------------------------

// Cadre commun à toutes les pages de l'espace membre : même structure que
// l'espace admin (voir Admin/layout/AdminLayout.jsx) — fond neutre,
// sidebar fixe à gauche, contenu scrollable à droite.
//
// "MemberLevelProvider" enveloppe tout l'espace membre (pas seulement le
// Dashboard) : un membre peut cotiser à plusieurs niveaux DBC en même
// temps, et le niveau choisi depuis la carte de profil doit rester le
// même quelle que soit la page visitée (voir
// context/MemberLevelContext.jsx) — à utiliser dans toute future page
// ("Ma Tontine", "Mon MLM"...) dont le contenu dépend du niveau.
//
// Note : cette section n'est pas encore protégée par AuthGuard — la
// connexion membre n'est pas encore branchée au backend, comme pour
// l'admin (voir Admin/layout/AdminLayout.jsx). À reprendre une fois
// l'authentification intégrée.
//
// Pas de footer ici : essayé puis retiré à la demande — les footers
// restent propres aux pages visiteur (voir PublicLayout.jsx), pas aux
// espaces connectés.
export default function MembreLayout() {
  return (
    <MemberLevelProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAF7F4]">
        <MembreSidebar />
        <div className="h-full min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </MemberLevelProvider>
  );
}
