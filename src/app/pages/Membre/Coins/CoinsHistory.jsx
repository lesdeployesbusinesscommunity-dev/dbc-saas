// Import Dependencies
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, UserPlusIcon, AcademicCapIcon, CircleStackIcon, ClockIcon } from "@heroicons/react/24/solid";

// Local Imports
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { useReportMatches } from "../components/searchSummary";
import { getCoinsHistory, getCoinsStats } from "./mockData";

// ----------------------------------------------------------------------

// "Comment tu as obtenu tes Coins" : l'historique complet, groupé par
// mois, dont la somme des montants est égale au solde affiché dans la
// bannière (CoinsHero.jsx) et sur le Dashboard (voir mockData.js :
// "getCoinsHistory" pour le détail de ce rapprochement). Mêmes couleurs/
// icônes par catégorie que EarnCoinsTable.jsx juste au-dessus et le donut
// du Dashboard (voir Dashboard/MonthlyActivityChart.jsx), pour rester
// cohérent entre les trois endroits qui parlent des mêmes Coins.
const CATEGORY_COLORS = {
  tontine: "#86B4E3",
  parrainage: "#5790D2",
  formations: "#2E70B8",
  challenges: "#154878",
};
const CATEGORY_ICONS = {
  tontine: CheckCircleIcon,
  parrainage: UserPlusIcon,
  formations: AcademicCapIcon,
  challenges: CircleStackIcon,
};

export function CoinsHistory({ query = "", onMatches }) {
  const { t } = useTranslation();
  const stats = getCoinsStats();
  // Recherche de l'en-tête : on garde le TOTAL du mois calculé sur toutes
  // ses lignes (il doit rester égal à la réalité), et on ne retire que les
  // lignes qui ne correspondent pas — puis les mois devenus vides.
  const history = getCoinsHistory()
    .map((group) => ({
      ...group,
      monthTotal: group.entries.reduce((sum, entry) => sum + entry.amount, 0),
      entries: group.entries.filter((entry) => searchTextIncludes(entry.label, query)),
    }))
    .filter((group) => group.entries.length > 0);
  const rowCount = history.reduce((sum, group) => sum + group.entries.length, 0);
  useReportMatches(onMatches, "history", rowCount);

  if (query.trim() !== "" && rowCount === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <ClockIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
        {t("membre.coins.history.title", { total: stats.balance })}
      </h2>

      <div className="mt-5 flex flex-col gap-6">
        {history.map((group) => {
          const { monthTotal } = group;

          return (
            <div key={group.month}>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                {t("membre.coins.history.monthTotal", { month: group.month, total: monthTotal })}
              </p>

              <div className="mt-2 flex flex-col gap-2">
                {group.entries.map((entry) => {
                  const Icon = CATEGORY_ICONS[entry.category];
                  const color = CATEGORY_COLORS[entry.category];

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${color}1A`, color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                        {entry.label}
                      </p>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-gray-900"
                        style={{ backgroundColor: `${color}1A` }}
                      >
                        {t("membre.coins.earn.amount", { amount: entry.amount })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
