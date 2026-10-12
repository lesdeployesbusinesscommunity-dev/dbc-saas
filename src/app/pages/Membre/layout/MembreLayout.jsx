// Import Dependencies
import { useEffect } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { SplashScreen } from "components/template/SplashScreen";
import { MembreSidebar } from "./MembreSidebar";
import { MemberLevelProvider } from "../context/MemberLevelContext";
import { loadMemberSpace, useMemberData } from "../memberStore";

// ----------------------------------------------------------------------

// Cadre commun à toutes les pages de l'espace membre : même structure que
// l'espace admin (voir Admin/layout/AdminLayout.jsx) — fond neutre,
// sidebar fixe à gauche, contenu scrollable à droite.
//
// Les données du membre (profil, tontine, Coins, réseau...) sont chargées ici
// depuis l'API (voir memberStore.js) ; l'espace ne s'affiche qu'une fois
// qu'elles sont là, pour que chaque page lise directement les vraies
// données (jamais un écran vide ou des chiffres faux le temps du chargement).
//
// "MemberLevelProvider" enveloppe tout l'espace membre (pas seulement le
// Dashboard) : un membre peut cotiser à plusieurs niveaux DBC en même
// temps, et le niveau choisi depuis la carte de profil doit rester le
// même quelle que soit la page visitée (voir
// context/MemberLevelContext.jsx).
//
// L'accès est gardé par MembreSessionGuard (voir router/membre.jsx et
// Auth/SessionGuard.jsx).
//
// Pas de footer ici : essayé puis retiré à la demande — les footers
// restent propres aux pages visiteur (voir PublicLayout.jsx), pas aux
// espaces connectés.
export default function MembreLayout() {
  const { t } = useTranslation();
  const { status } = useMemberData();

  useEffect(() => {
    if (status === "idle") loadMemberSpace();
  }, [status]);

  if (status === "idle" || status === "loading") {
    return <SplashScreen />;
  }

  if (status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#FAF7F4] px-6 text-center">
        <p className="flex items-center gap-2 text-sm font-medium text-red-700">
          <ExclamationCircleIcon aria-hidden="true" className="size-5" />
          {t("api.errors.server")}
        </p>
        <button
          type="button"
          onClick={() => loadMemberSpace()}
          className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <ArrowPathIcon aria-hidden="true" className="size-4" />
          {t("membre.common.retry")}
        </button>
      </div>
    );
  }

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
