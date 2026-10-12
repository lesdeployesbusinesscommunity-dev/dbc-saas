// Import Dependencies
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, UserPlusIcon, AcademicCapIcon, CircleStackIcon } from "@heroicons/react/24/solid";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { useReportMatches } from "../components/searchSummary";
import { getCoinsWays } from "./mockData";

// ----------------------------------------------------------------------

// "Comment gagner des Coins" : un tableau (demandé explicitement, à
// l'inverse de l'escalier des packs Longrich — voir Mlm/PacksLadder.jsx —
// qui lui ne devait PAS en être un), construit en lignes plutôt qu'avec
// un <table> classique (même technique que Simulateur/ComparisonTable.jsx,
// pour un contrôle fiable du style). Mêmes couleurs/icônes que le donut
// "Ce que vous avez fait le plus ce mois-ci" du Dashboard (voir
// Dashboard/MonthlyActivityChart.jsx : "CATEGORY_COLORS") pour que les
// deux pages parlent le même langage visuel plutôt que d'inventer une
// nouvelle palette pour la même notion de catégorie. Les pastilles de
// montant gardent un texte gris foncé fixe plutôt que la couleur de la
// catégorie : "tontine" (#86B4E3) est la plus claire de la rampe et
// manque de contraste en texte à cette taille — vérifié à l'écran avant
// ce choix — alors que la couleur reste lisible en fond de pastille à
// 10% d'opacité et sur l'icône, plus grande.
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

export function EarnCoinsTable({ query = "", onMatches }) {
  const { t } = useTranslation();
  // Le texte affiché de chaque ligne ("Cotisation Starter", "Parrainage"...)
  // est calculé ICI, avant le rendu, pour que la recherche de l'en-tête
  // cherche exactement ce que le membre lit.
  const ways = getCoinsWays()
    .map((way) => {
      const level = way.levelKey ? levels.find((l) => l.key === way.levelKey) : null;
      const label =
        way.category === "tontine"
          ? t("membre.coins.earn.cotisationLabel", {
              level: level ? t(`simulateur.levels.${level.key}.name`) : way.levelKey,
            })
          : t(`membre.coins.earn.${way.category}Label`);
      return { way, label };
    })
    .filter(({ label }) => searchTextIncludes(label, query));
  useReportMatches(onMatches, "earn", ways.length);

  if (query.trim() !== "" && ways.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-base font-bold text-gray-900">{t("membre.coins.earn.title")}</h2>

      <div className="mt-4 flex flex-col gap-2">
        {ways.map(({ way, label }) => {
          const Icon = CATEGORY_ICONS[way.category];
          const color = CATEGORY_COLORS[way.category];

          return (
            <div
              key={way.id}
              className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                <Icon className="size-5" />
              </span>

              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{label}</p>

              {way.amount === 0 ? (
                <span className="shrink-0 text-xs font-semibold text-gray-400">
                  {t("membre.coins.earn.noCoins")}
                </span>
              ) : way.amountMin != null ? (
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-gray-900"
                  style={{ backgroundColor: `${color}1A` }}
                >
                  {t("membre.coins.earn.amountRange", { min: way.amountMin, max: way.amountMax })}
                </span>
              ) : (
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-gray-900"
                  style={{ backgroundColor: `${color}1A` }}
                >
                  {way.category === "tontine"
                    ? t("membre.coins.earn.perMonth", { amount: way.amount })
                    : t("membre.coins.earn.amount", { amount: way.amount })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
