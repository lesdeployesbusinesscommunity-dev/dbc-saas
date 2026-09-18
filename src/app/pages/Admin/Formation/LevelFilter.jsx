// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Rangée d'onglets pilule pour filtrer les formations par niveau — même
// look que les autres filtres de l'admin (voir Membres/LevelTabs.jsx),
// mais avec le vrai nom du niveau (+ son icône) plutôt que "Niveau N",
// plus parlant ici puisque chaque niveau a son propre programme.
export function LevelFilter({ levels, activeKey, onSelect }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-stretch gap-2 rounded-full bg-white p-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={clsx(
          "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
          activeKey === "all"
            ? "bg-[#EE7115] text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
        )}
      >
        {t("admin.formation.filters.allLevels")}
      </button>

      {levels.map((level) => {
        const isActive = level.key === activeKey;
        return (
          <button
            key={level.key}
            type="button"
            onClick={() => onSelect(level.key)}
            className={clsx(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              isActive
                ? "bg-[#EE7115] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
            )}
          >
            <level.Icon aria-hidden="true" className="size-3.5" />
            {t(`simulateur.levels.${level.key}.name`)}
          </button>
        );
      })}
    </div>
  );
}
