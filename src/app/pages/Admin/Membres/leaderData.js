// Import Dependencies
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------
// Fonctions de "leader" que l'admin peut confier à un membre, et motifs de
// destitution proposés. Les libellés sont des clés de traduction
// (admin.membres.leaders.*), comme le reste de la page.

// "other" : fonction libre, à nommer à la main (voir "customTitle").
export const leaderTitles = [
  { value: "level", labelKey: "admin.membres.leaders.titles.level", scopeHintKey: "admin.membres.leaders.scopeHints.level" },
  { value: "country", labelKey: "admin.membres.leaders.titles.country", scopeHintKey: "admin.membres.leaders.scopeHints.country" },
  { value: "tontine", labelKey: "admin.membres.leaders.titles.tontine", scopeHintKey: "admin.membres.leaders.scopeHints.tontine" },
  { value: "training", labelKey: "admin.membres.leaders.titles.training", scopeHintKey: "admin.membres.leaders.scopeHints.training" },
  { value: "community", labelKey: "admin.membres.leaders.titles.community", scopeHintKey: "admin.membres.leaders.scopeHints.community" },
  { value: "other", labelKey: "admin.membres.leaders.titles.other", scopeHintKey: "admin.membres.leaders.scopeHints.other" },
];

// Motifs que l'admin peut choisir. "deactivated" et "removed" ne sont pas
// proposés : ils sont posés automatiquement quand un leader est désactivé
// ou supprimé (la fonction ne peut pas rester en poste sans le membre).
export const dismissReasons = [
  { value: "mandateEnd", labelKey: "admin.membres.leaders.reasons.mandateEnd" },
  { value: "inactivity", labelKey: "admin.membres.leaders.reasons.inactivity" },
  { value: "misconduct", labelKey: "admin.membres.leaders.reasons.misconduct" },
  { value: "request", labelKey: "admin.membres.leaders.reasons.request" },
  { value: "other", labelKey: "admin.membres.leaders.reasons.other" },
];

const SYSTEM_REASONS = {
  deactivated: "admin.membres.leaders.reasons.deactivated",
  removed: "admin.membres.leaders.reasons.removed",
};

// Renvoie deux petites fonctions de libellé, dans la langue active :
// - functionLabel(term) : "Leader de niveau", ou le titre libre saisi ;
// - reasonLabel(key)    : motif de destitution lisible.
export function useLeaderLabels() {
  const { t } = useTranslation();

  const functionLabel = (term) => {
    if (!term) return "";
    if (term.title === "other") {
      return term.customTitle?.trim() || t("admin.membres.leaders.titles.other");
    }
    const entry = leaderTitles.find((item) => item.value === term.title);
    return entry ? t(entry.labelKey) : term.title;
  };

  const reasonLabel = (key) => {
    const entry = dismissReasons.find((item) => item.value === key);
    if (entry) return t(entry.labelKey);
    if (SYSTEM_REASONS[key]) return t(SYSTEM_REASONS[key]);
    return key ?? "";
  };

  return { functionLabel, reasonLabel };
}
