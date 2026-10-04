// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { getDomain } from "./domains";

// ----------------------------------------------------------------------

// Filtres du catalogue : par DOMAINE (puces, avec le nombre de formations
// de chaque domaine — seulement ceux présents dans le niveau consulté, donc
// jamais de puce qui mène à une liste vide) et par STATUT (à commencer / en
// cours / terminées). "domainCounts" : [{ key, count }].
const STATUSES = ["all", "notStarted", "inProgress", "completed"];

export function FormationFilters({ domainCounts, total, domain, onDomainChange, status, onStatusChange }) {
  const { t } = useTranslation();

  const chipBase = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div role="group" aria-label={t("membre.formation.filters.domainLabel")} className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={domain === "all"}
          onClick={() => onDomainChange("all")}
          className={clsx(
            chipBase,
            domain === "all" ? "bg-[#EE7115] text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:bg-gray-50",
          )}
        >
          {t("membre.formation.filters.allDomains")}
          <span className="opacity-70">{total}</span>
        </button>
        {domainCounts.map(({ key, count }) => {
          const { Icon } = getDomain(key);
          const active = domain === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onDomainChange(key)}
              className={clsx(
                chipBase,
                active ? "bg-[#EE7115] text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:bg-gray-50",
              )}
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {t(`membre.formation.domains.${key}`)}
              <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div role="group" aria-label={t("membre.formation.filters.statusLabel")} className="inline-flex self-start rounded-full bg-gray-100 p-0.5">
        {STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => onStatusChange(value)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              status === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t(`membre.formation.filters.status.${value}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
