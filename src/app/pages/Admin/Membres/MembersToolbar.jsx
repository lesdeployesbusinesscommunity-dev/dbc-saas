// Import Dependencies
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { filterOptions } from "./mockData";

// ----------------------------------------------------------------------

const STATUS_CHIPS = ["all", "actif", "attente", "desactive", "leader"];

// Barre d'outils du dossier ouvert : recherche (filtrage au fil de la
// frappe), pastilles d'état avec leur nombre (Tous / Actifs / En attente /
// Désactivés / Leaders), tri, puis "Exporter". L'ajout d'un membre n'est
// plus ici : il se fait par le bouton "Créer un membre" en haut de la
// page, qui reprend le niveau du dossier ouvert.
export function MembersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  filter,
  onFilterChange,
  onExport,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
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
            className="w-72 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#52A2DF]"
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

        <button
          type="button"
          onClick={onExport}
          className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
          {t("admin.membres.export")}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_CHIPS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onStatusFilterChange(key)}
            aria-pressed={statusFilter === key}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              statusFilter === key
                ? "bg-[#52A2DF] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
            )}
          >
            {t(`admin.membres.statusFilter.${key}`)} · {statusCounts[key] ?? 0}
          </button>
        ))}
      </div>
    </div>
  );
}
