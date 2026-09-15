// Import Dependencies
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { filterOptions } from "./mockData";

// ----------------------------------------------------------------------

// Barre d'outils du dossier ouvert : recherche (filtrage au fil de la
// frappe, pas besoin d'un bouton "Rechercher" séparé — comme sur les
// tableaux d'administration standards) + tri/filtre, puis "Exporter" et
// "Ajouter un membre" (celui-ci ajoute directement dans le niveau ouvert,
// ou n'importe quel niveau si "Tous les niveaux" est sélectionné — pour
// ajouter à un niveau précis depuis n'importe où, voir le bouton global à
// côté des étiquettes, LevelTabs).
export function MembersToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onAddMember,
  onExport,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("admin.membres.searchPlaceholder")}
          className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#52A2DF]"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
        {t("admin.membres.sortBy")}
        <select
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
          {t("admin.membres.export")}
        </button>

        <button
          type="button"
          onClick={onAddMember}
          className="flex items-center gap-2 rounded-lg bg-[#52A2DF] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <UserPlusIcon aria-hidden="true" className="size-4" />
          {t("admin.membres.addMember")}
        </button>
      </div>
    </div>
  );
}
