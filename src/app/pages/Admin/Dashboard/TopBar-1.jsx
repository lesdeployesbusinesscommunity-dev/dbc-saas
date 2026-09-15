// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { LanguageToggle } from "components/shared/LanguageToggle";

// ----------------------------------------------------------------------

// Titre de la page + barre de recherche, alignés dans la colonne
// principale (le panneau de droite a son propre en-tête, voir ProfileHeader).
export function TopBar() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-lg font-bold italic text-gray-900">{t("admin.dashboard.title")}</h1>

      <div className="flex flex-1 items-center gap-3 sm:flex-initial">
        <label className="relative w-full max-w-md flex-1 sm:flex-initial">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            placeholder={t("admin.topbar.searchPlaceholder")}
            className="w-full rounded-full border-0 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-[#52A2DF]"
          />
        </label>

        <LanguageToggle />
      </div>
    </div>
  );
}
