// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { globalStats } from "./mockData";

// ----------------------------------------------------------------------

// "Vue Globale" : une carte par indicateur, icône colorée + gros chiffre +
// libellé. Les emojis de la maquette d'origine sont remplacés par des
// icônes (voir mockData.js).
export function StatsGrid() {
  const { t } = useTranslation();

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-gray-900">{t("admin.dashboard.globalView")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {globalStats.map(({ key, labelKey, value, Icon, color }) => (
          <div
            key={key}
            className="rounded-xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-3 text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs+ text-gray-500">{t(labelKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
