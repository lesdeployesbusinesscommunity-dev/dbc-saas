// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { ClockIcon, ScaleIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

// Local Imports
import {
  COINS_ROWS,
  CRITERIA,
  EXAMPLE_ROWS,
  GOLDEN_RULES,
  LEVEL_ROWS,
  MIN_MONTHS_BEFORE_BENEFIT,
  RECOMMENDATION_ROWS,
  REGULARITY_ROWS,
  URGENCY_ROWS,
} from "./priorityScore";
import { CRITERION_STYLES } from "./priorityStyles";

// ----------------------------------------------------------------------

// Critères dont le tableau est suivi d'une note.
const FOOTNOTES = ["urgency", "regularity", "coins", "level", "recommendation"];

const ROWS = {
  urgency: URGENCY_ROWS,
  regularity: REGULARITY_ROWS,
  coins: COINS_ROWS,
  level: LEVEL_ROWS,
  recommendation: RECOMMENDATION_ROWS,
};

function PointsChip({ points, className }) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        "inline-flex min-w-[3.5rem] shrink-0 justify-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
        points < 0 ? "bg-red-50 text-red-700" : points === 0 ? "bg-gray-100 text-gray-500" : className,
      )}
    >
      {t("tontinePriority.points", { count: points })}
    </span>
  );
}

// "Comment l'ordre de passage est décidé" : le tableau de bord de la règle, lu
// de la même façon par les membres et par l'administration. De haut en bas :
// les 100 points et leur répartition, les 5 critères avec leur tableau de
// points, les 7 règles d'or, puis l'exemple d'un groupe de 10 membres.
export function PriorityRoadmap() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <ScaleIcon aria-hidden="true" className="size-5 text-[#EE7115]" />
          {t("tontinePriority.title")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">{t("tontinePriority.intro")}</p>

        <div
          role="img"
          aria-label={CRITERIA.map(({ key, max }) => `${t(`tontinePriority.criteria.${key}.name`)} ${max}`).join(", ")}
          className="mt-5 flex h-3 overflow-hidden rounded-full bg-gray-100"
        >
          {CRITERIA.map(({ key, max }) => (
            <div key={key} className={clsx("h-full border-r-2 border-white last:border-r-0", CRITERION_STYLES[key].bar)} style={{ width: `${max}%` }} />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 lg:grid-cols-5">
          {CRITERIA.map(({ key, max }, index) => (
            <li key={key} className="flex items-start gap-2 text-gray-600">
              <span className={clsx("mt-0.5 size-2.5 shrink-0 rounded-full", CRITERION_STYLES[key].bar)} />
              <span>
                <span className="font-bold text-gray-800">{max}</span> · {index + 1}. {t(`tontinePriority.criteria.${key}.name`)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-orange-50 p-4 text-sm text-orange-900">
          <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#EE7115]" />
          <span>{t("tontinePriority.sixMonths", { months: MIN_MONTHS_BEFORE_BENEFIT })}</span>
        </p>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <ClockIcon aria-hidden="true" className="size-5 text-[#EE7115]" />
          {t("tontinePriority.evaluation.title")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">{t("tontinePriority.evaluation.intro")}</p>
        <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
          {CRITERIA.map(({ key }, index) => (
            <li key={key} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.6fr)] sm:gap-4">
              <p className="text-sm font-semibold text-gray-900">
                {index + 1}. {t(`tontinePriority.criteria.${key}.short`)}
              </p>
              <p className="text-sm text-gray-700">{t(`tontinePriority.evaluation.rows.${key}.who`)}</p>
              <p className="text-sm text-gray-500">{t(`tontinePriority.evaluation.rows.${key}.delay`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <ol className="space-y-4">
        {CRITERIA.map(({ key, max }, index) => {
          const style = CRITERION_STYLES[key];
          const { Icon } = style;
          return (
            <li key={key} id={`spd-${key}`} className={clsx("rounded-3xl border bg-white p-5 shadow-sm sm:p-6", style.ring)}>
              <div className="flex items-start gap-3">
                <span className={clsx("flex size-10 shrink-0 items-center justify-center rounded-2xl", style.chip)}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="text-base font-bold text-gray-900">
                      {t("tontinePriority.step", { n: index + 1 })} · {t(`tontinePriority.criteria.${key}.name`)}
                    </h3>
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-bold", style.chip)}>
                      {t("tontinePriority.maxPoints", { count: max })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{t(`tontinePriority.criteria.${key}.how`)}</p>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
                {ROWS[key].map((row) => (
                  <li key={row.key} className="flex items-start gap-3 px-4 py-3">
                    <PointsChip points={row.points} className={style.chip} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{t(`tontinePriority.rows.${key}.${row.key}.label`)}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{t(`tontinePriority.rows.${key}.${row.key}.detail`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {FOOTNOTES.includes(key) && (
                <p className="mt-3 text-xs text-gray-500">{t(`tontinePriority.criteria.${key}.footnote`)}</p>
              )}
            </li>
          );
        })}
      </ol>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-gray-900">{t("tontinePriority.rules.title")}</h2>
        <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {GOLDEN_RULES.map((key, index) => (
            <li key={key} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EE7115] text-xs font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">{t(`tontinePriority.rules.items.${key}.title`)}</p>
                <p className="mt-1 text-sm text-gray-600">{t(`tontinePriority.rules.items.${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ExampleTable />
    </div>
  );
}

// Le tableau XXVI du règlement : un groupe de 10 membres.
function ExampleTable() {
  const { t } = useTranslation();
  const cols = ["urgency", "regularity", "coins", "levelMentor"];
  const maxes = { urgency: 30, regularity: 25, coins: 20, levelMentor: 25 };

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-bold text-gray-900">{t("tontinePriority.example.title")}</h2>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">{t("tontinePriority.example.intro")}</p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">{t("tontinePriority.example.cols.rank")}</th>
              <th scope="col" className="px-4 py-3">{t("tontinePriority.example.cols.member")}</th>
              {cols.map((col) => (
                <th key={col} scope="col" className="px-3 py-3 text-right">
                  {t(`tontinePriority.example.cols.${col}`)} <span className="text-gray-400">({maxes[col]})</span>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right">{t("tontinePriority.example.cols.total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {EXAMPLE_ROWS.map((row, index) => (
              <ExampleRow key={row.rank} row={row} cols={cols} gap={index > 0 && row.rank - EXAMPLE_ROWS[index - 1].rank > 1} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">{t("tontinePriority.example.footnote")}</p>
    </section>
  );
}

function ExampleRow({ row, cols, gap }) {
  const { t } = useTranslation();
  return (
    <>
      {gap && (
        <tr>
          <td colSpan={cols.length + 3} className="bg-gray-50/60 px-4 py-2 text-center text-xs font-semibold text-gray-400">
            {t("tontinePriority.example.ellipsis")}
          </td>
        </tr>
      )}
      <tr className={row.star ? "bg-amber-50/50" : undefined}>
        <td className="px-4 py-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#EE7115]/10 text-xs font-bold text-[#EE7115]">
            {row.rank}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="font-semibold text-gray-900">
            {row.name}
            {row.star && <span className="text-[#EE7115]"> *</span>}
          </p>
          <p className="text-xs text-gray-500">{t(`tontinePriority.example.notes.${row.note}`)}</p>
        </td>
        {cols.map((col) => (
          <td key={col} className="px-3 py-3 text-right tabular-nums text-gray-700">
            {row[col]}
          </td>
        ))}
        <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-gray-900">{row.total}</td>
      </tr>
    </>
  );
}
