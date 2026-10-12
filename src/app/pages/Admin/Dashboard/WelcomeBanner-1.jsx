// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { currentMember } from "../currentMember";

// ----------------------------------------------------------------------

// Bandeau de bienvenue du dashboard membre. Remplace la première version
// (photo "afrique_db.jpg" en pleine largeur avec voile sombre, copiée du
// dashboard admin) par le traitement demandé : fond neutre (pas de photo
// en arrière-plan du texte, pour rester lisible et "aéré"), message de
// bienvenue à gauche, et l'illustration déco "Afrique.png" (déjà dans
// /public) à droite, en accent plutôt qu'en fond plein — plus ergonomique
// que l'ancien bandeau, où le texte devait rivaliser avec la photo.
export function WelcomeBanner() {
  const { t } = useTranslation();

  return (
    <div className="mt-6 flex items-center gap-6 overflow-hidden rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t("membre.dashboard.welcome.greeting")}{" "}
          <span className="text-[#EE7115]">{currentMember.name}</span>
        </p>
        <p className="mt-2 max-w-md text-sm italic text-gray-500 sm:text-base">
          {t("membre.dashboard.welcome.subtitle")}
        </p>
      </div>

      <img
        src="/Afrique.png"
        alt=""
        aria-hidden="true"
        className="hidden h-56 w-auto shrink-0 object-contain sm:block sm:h-72"
      />
    </div>
  );
}
