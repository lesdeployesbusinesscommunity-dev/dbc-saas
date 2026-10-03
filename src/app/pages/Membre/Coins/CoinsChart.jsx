// Import Dependencies
import { useTranslation } from "react-i18next";
import { ChartBarIcon } from "@heroicons/react/24/solid";

// Local Imports
import { getCoinsMonthly } from "./mockData";

// ----------------------------------------------------------------------

// "Mes Coins mois par mois" : un seul indicateur (Coins gagnés dans le
// mois), donc des barres d'une seule teinte — même bleu foncé que le
// reste des Coins (#2E70B8, voir CoinsHistory.jsx), assez contrasté sur
// fond blanc. Chaque barre porte directement son chiffre (jamais seulement
// suggéré par la hauteur), le mois en cours est désigné en toutes lettres
// ("Ce mois") plutôt que par une couleur, et le détail ligne par ligne de
// chaque mois est juste en dessous (CoinsHistory.jsx) : c'est la "vue
// tableau" du graphique. Les mois viennent de l'historique, pas d'une
// liste à part : le graphique s'allonge tout seul avec lui.
const BAR_COLOR = "#2E70B8";
const CHART_HEIGHT = 128;

export function CoinsChart() {
  const { t } = useTranslation();
  const months = getCoinsMonthly();
  const max = Math.max(...months.map((m) => m.total));
  const last = months[months.length - 1];

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <ChartBarIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
          {t("membre.coins.chart.title")}
        </h2>
        <span className="text-xs font-semibold text-gray-500">
          {t("membre.coins.chart.cumulative", { total: last.cumulative })}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-center gap-6 sm:gap-10" role="list">
        {months.map((month, index) => {
          const isCurrent = index === months.length - 1;
          const barHeight = Math.max(8, Math.round((month.total / max) * CHART_HEIGHT));
          return (
            <div
              key={month.month}
              role="listitem"
              title={t("membre.coins.chart.tooltip", { month: month.month, total: month.total, cumulative: month.cumulative })}
              className="flex w-20 flex-col items-center"
            >
              <span className="text-sm font-bold text-gray-900">+{month.total}</span>
              <div
                className="mt-1.5 w-full rounded-t-[4px]"
                style={{ height: barHeight, backgroundColor: BAR_COLOR }}
              />
              <div className="h-px w-full bg-gray-200" />
              <span className="mt-2 text-xs font-semibold text-gray-600">{month.month}</span>
              {isCurrent && (
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("membre.coins.chart.thisMonth")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
