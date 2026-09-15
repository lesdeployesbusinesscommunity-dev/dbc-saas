// Import Dependencies
import Chart from "react-apexcharts";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { levels, formatMoney } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------

// Dégradé de oranges (clair -> foncé) pour visualiser la tendance
// croissante des cagnottes potentielles, niveau par niveau.
const ORANGE_SHADES = [
  "#FFE4C7", "#FFD1A3", "#FFB870", "#FF9F4D",
  "#F97316", "#EA580C", "#C2410C", "#9A3412",
];

// Réutilise les mêmes 8 niveaux/montants que le simulateur de revenus
// (app/pages/Simulateur/data) : une seule source de vérité pour ces
// chiffres sur tout le site. Les noms courts pour l'axe du graphe
// viennent de simulateur.levels.<key>.name (même clés FR/EN que partout
// ailleurs), avec le préfixe "DBC " retiré pour ne pas surcharger les
// libellés.
export function CagnottesChart() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  const categories = levels.map((level) =>
    t(`simulateur.levels.${level.key}.name`).replace(/^DBC\s+/, ""),
  );
  const data = levels.map((level) => level.cagnotte);

  const options = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "55%", distributed: true },
    },
    colors: ORANGE_SHADES,
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: "#F1F5F9", strokeDashArray: 4 },
    xaxis: {
      categories,
      labels: {
        rotate: -35,
        style: { fontSize: "11px", colors: categories.map(() => "#6B7280") },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (value) => formatMoney(value, locale),
        style: { fontSize: "11px", colors: "#6B7280" },
      },
    },
    tooltip: {
      // "intersect: false" : la tooltip apparaît dès que la souris est
      // n'importe où dans la colonne du niveau (pas seulement pile sur la
      // barre). Nécessaire ici car l'écart entre les montants (55 000 F à
      // 22 000 000 F) rend les premières barres minuscules à l'écran — sans
      // ça, seules Elite et Légende (les plus hautes) étaient assez larges
      // pour que le curseur les touche.
      intersect: false,
      shared: false,
      y: { formatter: (value) => formatMoney(value, locale) },
    },
  };

  const series = [{ name: t("admin.dashboard.cagnottesChart.seriesName"), data }];

  return (
    <div className="mt-8 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]"
        >
          <BanknotesIcon className="size-4" />
        </span>
        <h2 className="text-sm font-bold text-gray-900">
          {t("admin.dashboard.cagnottesChart.title")}
        </h2>
      </div>

      <div className="mt-2">
        <Chart options={options} series={series} type="bar" height={320} />
      </div>
    </div>
  );
}
