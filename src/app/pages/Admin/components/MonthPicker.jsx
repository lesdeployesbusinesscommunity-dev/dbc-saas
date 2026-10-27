// Import Dependencies
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

const SELECT =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500";

// Choix d'un mois (liste des mois + liste des années) qui rend "AAAA-MM".
// Deux listes plutôt qu'un champ "month" du navigateur : celui-ci n'existe
// pas sur tous les navigateurs (Firefox, Safari) et ne se traduit pas. Tant
// que les deux listes ne sont pas remplies, la valeur renvoyée est
// incomplète (ex : "2026-") — à tester avec isMonthValue (monthUtils.js).
export function MonthPicker({ value, onChange, required = false, disabled = false, minValue, yearsAhead = 3 }) {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");
  const months = t("admin.common.monthsFull", { returnObjects: true });
  const [year = "", month = ""] = (value ?? "").split("-");

  const firstYear = minValue ? Number(minValue.slice(0, 4)) : dayjs().year();
  const lastYear = Math.max(dayjs().year() + yearsAhead, Number(year) || 0);
  const years = [];
  for (let y = Math.min(firstYear, Number(year) || firstYear); y <= lastYear; y += 1) years.push(String(y));

  return (
    <div className="mt-1 grid grid-cols-2 gap-2">
      <select
        aria-label={t("admin.common.month")}
        required={required}
        disabled={disabled}
        value={month}
        onChange={(event) => onChange(`${year}-${event.target.value}`)}
        className={SELECT}
      >
        <option value="">{t("admin.common.month")}</option>
        {months.map((name, index) => {
          const number = String(index + 1).padStart(2, "0");
          return (
            <option key={number} value={number} disabled={Boolean(minValue && year && `${year}-${number}` < minValue)}>
              {isFrench ? name.toLowerCase() : name}
            </option>
          );
        })}
      </select>
      <select
        aria-label={t("admin.common.year")}
        required={required}
        disabled={disabled}
        value={year}
        onChange={(event) => onChange(`${event.target.value}-${month}`)}
        className={SELECT}
      >
        <option value="">{t("admin.common.year")}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
