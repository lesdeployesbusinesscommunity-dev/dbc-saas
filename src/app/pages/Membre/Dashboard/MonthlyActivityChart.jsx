// Import Dependencies
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ChartPieIcon, CheckBadgeIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Rampe bleue mono-teinte, vérifiée pour un usage "séquentiel" (une seule
// grandeur qui varie — ici le nombre de coins gagnés par catégorie) :
// contraste et écarts de luminosité contrôlés avant utilisation, plutôt
// que choisie à l'œil. Ordre fixe (du plus clair au plus foncé), jamais
// réordonnée selon la valeur — Tontine/Parrainage/Formations/Challenges
// est aussi l'ordre déjà utilisé ailleurs sur le dashboard (stats du
// mois, sidebar), donc une même catégorie garde toujours la même teinte.
const CATEGORY_COLORS = {
  tontine: "#86B4E3",
  parrainage: "#5790D2",
  formations: "#2E70B8",
  challenges: "#154878",
};
const CATEGORY_ORDER = ["tontine", "parrainage", "formations", "challenges"];

// Coins gagnés ce mois-ci, détaillés par action (pas juste un total par
// catégorie) : reflète le fil "Activités récentes" juste au-dessus. Les
// noms des formations correspondent au catalogue "Gestion des
// formations" (voir Admin/Formation/mockData.js). Donnée de démonstration
// en attendant un vrai journal d'activité côté backend.
const CATEGORY_COINS = {
  tontine: [20],
  parrainage: [30],
  formations: [30, 20],
  challenges: [75],
};

// Badges obtenus par le membre ce mois-ci, avec leur raison — mêmes
// définitions que "Top des membres" côté admin (voir
// Admin/Membres/mockData.js : awardDefinitions, et AwardBadge.jsx pour le
// style icône/couleur), repris ici sans dépendre du composant admin
// (celui-ci est couplé à sa propre liste de membres et affiche la raison
// seulement au survol — ici elle doit rester visible).
const EARNED_BADGES = [
  { key: "formation", Icon: AcademicCapIcon, className: "bg-orange-50 text-[#EE7115]" },
  { key: "cotisation", Icon: CheckBadgeIcon, className: "bg-green-50 text-green-700" },
];

// Graphe "ce que vous avez fait le plus ce mois-ci" : un donut (plus
// lisible qu'un histogramme ici, vu l'écart entre les montants) avec le
// total au centre, une légende cliquable à droite plutôt que celle
// d'ApexCharts (pour rester lisible et donner le détail au clic plutôt
// qu'au survol), le détail de la catégorie choisie juste en dessous
// (nombre d'actions, leur nom, et ce que chacune a rapporté en coins), et
// les badges obtenus ce mois-ci avec leur raison.
export function MonthlyActivityChart() {
  const { t } = useTranslation();

  const totalsByCategory = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_ORDER.map((key) => [key, CATEGORY_COINS[key].reduce((sum, c) => sum + c, 0)]),
      ),
    [],
  );
  const grandTotal = Object.values(totalsByCategory).reduce((sum, v) => sum + v, 0);

  // Par défaut, la catégorie qui a le plus rapporté ce mois-ci — c'est
  // littéralement "ce que vous avez fait le plus".
  const defaultCategory = CATEGORY_ORDER.reduce((best, key) =>
    totalsByCategory[key] > totalsByCategory[best] ? key : best,
  );
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  const series = CATEGORY_ORDER.map((key) => totalsByCategory[key]);
  const labels = CATEGORY_ORDER.map((key) => t(`membre.dashboard.activity.categories.${key}`));

  const options = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          setSelectedCategory(CATEGORY_ORDER[config.dataPointIndex]);
        },
      },
    },
    labels,
    colors: CATEGORY_ORDER.map((key) => CATEGORY_COLORS[key]),
    stroke: { show: true, width: 2, colors: ["#fff"] },
    dataLabels: { enabled: false },
    legend: { show: false },
    states: { active: { filter: { type: "none" } } },
    tooltip: {
      y: { formatter: (value) => t("membre.dashboard.activity.coinsValue", { count: value }) },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: { show: true, fontSize: "12px", color: "#9CA3AF", offsetY: 24 },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 700,
              color: "#111827",
              offsetY: -6,
              formatter: (value) => value,
            },
            total: {
              show: true,
              label: t("membre.dashboard.activity.chartTotal"),
              fontSize: "12px",
              color: "#9CA3AF",
              formatter: () => grandTotal,
            },
          },
        },
      },
    },
  };

  const breakdownLabels = t(`membre.dashboard.activity.breakdown.items.${selectedCategory}`, {
    returnObjects: true,
  });
  const breakdownCoins = CATEGORY_COINS[selectedCategory];

  return (
    <div className="mt-8 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-[#52A2DF]/[0.12] text-[#52A2DF]"
        >
          <ChartPieIcon className="size-4" />
        </span>
        <h2 className="text-sm font-bold text-gray-900">
          {t("membre.dashboard.activity.chartTitle")}
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="mx-auto w-full max-w-[240px] shrink-0 sm:mx-0 sm:w-56">
          <Chart options={options} series={series} type="donut" height={240} />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {CATEGORY_ORDER.map((key) => {
            const isSelected = key === selectedCategory;
            const total = totalsByCategory[key];
            const percent = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                aria-pressed={isSelected}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                  isSelected ? "bg-[#52A2DF]/[0.1]" : "hover:bg-gray-50",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[key] }}
                />
                <span className={clsx("flex-1 truncate text-sm", isSelected ? "font-semibold text-gray-900" : "text-gray-700")}>
                  {t(`membre.dashboard.activity.categories.${key}`)}
                </span>
                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {t("membre.dashboard.activity.coinsValue", { count: total })}
                </span>
                <span className="w-9 shrink-0 text-right text-xs text-gray-400">{percent}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-[#52A2DF]/[0.06] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t(`membre.dashboard.activity.categories.${selectedCategory}`)} ·{" "}
          {t("membre.dashboard.activity.breakdown.sectionTitle")}
        </p>
        <ul className="mt-2.5 space-y-2">
          {breakdownLabels.map((label, index) => (
            <li key={label} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-gray-700">{label}</span>
              <span className="shrink-0 font-semibold text-gray-900">
                {t("membre.dashboard.activity.coinsValue", { count: breakdownCoins[index] })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 border-t border-black/5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("membre.dashboard.activity.badges.title")}
        </p>
        <div className="mt-2.5 space-y-3">
          {EARNED_BADGES.map(({ key, Icon, className }) => (
            <div key={key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={clsx("flex size-8 shrink-0 items-center justify-center rounded-full", className)}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {t(`admin.membres.awards.${key}.label`)}
                </p>
                <p className="text-xs text-gray-500">
                  {t("membre.dashboard.activity.badges.why", {
                    description: t(`admin.membres.awards.${key}.description`),
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
