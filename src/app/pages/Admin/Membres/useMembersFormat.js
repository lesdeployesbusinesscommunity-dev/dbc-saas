// Import Dependencies
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------
// Dates et durées de "Gestion des membres", dans la langue active.
export function useMembersFormat() {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");
  // Les mois s'écrivent en minuscules en français ("5 septembre 2026").
  const months = t("admin.common.monthsFull", { returnObjects: true }).map((month) =>
    isFrench ? month.toLowerCase() : month,
  );

  // "5 septembre 2026"
  const fullDate = (value) => {
    if (!value) return "—";
    const date = dayjs(value);
    return `${date.date()} ${months[date.month()]} ${date.year()}`;
  };

  // "5 septembre 2026 · 14:32"
  const dateTime = (value) => {
    if (!value) return "—";
    return `${fullDate(value)} · ${dayjs(value).format("HH:mm")}`;
  };

  // Durée entre deux dates (la seconde par défaut : aujourd'hui), arrondie
  // à l'unité la plus parlante : jours, mois ou années.
  const duration = (from, to) => {
    const start = dayjs(from);
    const end = to ? dayjs(to) : dayjs();
    const days = Math.max(0, end.diff(start, "day"));
    if (days < 30) return t("admin.membres.duration.days", { count: days });
    const monthsCount = end.diff(start, "month");
    if (monthsCount < 12) return t("admin.membres.duration.months", { count: monthsCount });
    return t("admin.membres.duration.years", { count: end.diff(start, "year") });
  };

  return { fullDate, dateTime, duration };
}
