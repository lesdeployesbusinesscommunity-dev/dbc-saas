// Import Dependencies
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------
// Petits outils pour les "mois" de la tontine, notés "AAAA-MM" (ex :
// "2026-11" = novembre 2026) — la forme la plus simple à stocker, à
// comparer et à trier.

export const isMonthValue = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "");

// Les "count" mois consécutifs à partir de "start" (inclus).
export function monthsFrom(start, count) {
  const first = dayjs(`${start}-01`);
  return Array.from({ length: count }, (_, index) => first.add(index, "month").format("YYYY-MM"));
}

// Le mois en cours, "AAAA-MM".
export const currentMonthValue = () => dayjs().format("YYYY-MM");

// Libellés d'un mois dans la langue active : "novembre 2026" (en français,
// sans majuscule), "Nov 2026" (abrégé) ou simplement "novembre".
export function useMonthLabels() {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");
  const full = t("admin.common.monthsFull", { returnObjects: true });
  const short = t("admin.common.monthsShort", { returnObjects: true });

  const parts = (value) => {
    const date = dayjs(`${value}-01`);
    return { year: date.year(), index: date.month() };
  };
  const name = (index) => (isFrench ? full[index].toLowerCase() : full[index]);

  return {
    monthYear: (value) => {
      if (!isMonthValue(value)) return "—";
      const { year, index } = parts(value);
      return `${name(index)} ${year}`;
    },
    monthShort: (value) => {
      if (!isMonthValue(value)) return "—";
      const { year, index } = parts(value);
      return `${short[index]} ${year}`;
    },
    monthName: (value) => {
      if (!isMonthValue(value)) return "—";
      return name(parts(value).index);
    },
  };
}
