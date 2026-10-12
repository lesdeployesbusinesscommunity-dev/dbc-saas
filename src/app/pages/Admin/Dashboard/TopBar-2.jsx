// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { LanguageToggle } from "components/shared/LanguageToggle";

// ----------------------------------------------------------------------

// Titre de la page + barre de recherche, alignés dans la colonne
// principale — même motif que Admin/Dashboard/TopBar.jsx. Manquait dans
// la première version du dashboard membre (voir la maquette fournie).
//
// "titleKey" : réutilisée telle quelle par les autres pages de l'espace
// membre (voir Tontine/index.jsx) — seul le titre affiché change,
// "membre.dashboard.title" reste la valeur par défaut pour ne rien
// changer à l'appel existant sur le Dashboard. "titleExtra" (optionnel) :
// un nœud affiché juste après le titre — utilisé par "Ma Tontine" pour y
// mettre le badge de niveau cliquable (voir components/
// LevelSwitcherBadge.jsx), absent par défaut pour ne rien changer au
// Dashboard non plus.
export function TopBar({ titleKey = "membre.dashboard.title", titleExtra = null }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold italic text-gray-900">{t(titleKey)}</h1>
        {titleExtra}
      </div>

      <div className="flex flex-1 items-center gap-3 sm:flex-initial">
        <label className="relative w-full max-w-md flex-1 sm:flex-initial">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            placeholder={t("membre.topbar.searchPlaceholder")}
            className="w-full rounded-full border-0 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-[#52A2DF]"
          />
        </label>

        <LanguageToggle />
      </div>
    </div>
  );
}
