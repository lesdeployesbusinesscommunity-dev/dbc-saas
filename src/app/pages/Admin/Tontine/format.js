// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------

// Petits outils d'affichage partagés par les blocs de "Gestion des
// tontines" : montants dans la langue courante, nom du mois (complet ou
// abrégé) pour une date dayjs.
export function useTontineFormat() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const months = t("membre.common.months", { returnObjects: true });
  const monthsShort = t("admin.common.monthsShort", { returnObjects: true });

  return {
    t,
    locale,
    money: (value) => formatMoney(value, locale),
    month: (date) => `${months[date.month()]} ${date.year()}`,
    monthName: (date) => months[date.month()],
    monthShort: (date) => monthsShort[date.month()],
    // "5 octobre" en français, "October 5" en anglais.
    day: (date) =>
      locale === "fr-FR"
        ? `${date.date()} ${months[date.month()].toLowerCase()}`
        : `${months[date.month()]} ${date.date()}`,
  };
}
