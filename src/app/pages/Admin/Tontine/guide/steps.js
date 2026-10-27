// Import Dependencies
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { AutoScene, CycleScene, JournalScene, LedgerScene, MoneyScene, StatementScene } from "./scenes";

// ----------------------------------------------------------------------

const SCENES = {
  cycle: CycleScene,
  money: MoneyScene,
  auto: AutoScene,
  ledger: LedgerScene,
  journal: JournalScene,
  statement: StatementScene,
};

// Les étapes de chaque parcours. L'administration voit les 6 ; le membre les 3
// premières (son propre relevé de compte n'existe pas encore côté membre : on
// ne le décrit pas avant qu'il soit là).
export const GUIDE_STEPS = {
  admin: ["cycle", "money", "auto", "ledger", "journal", "statement"],
  member: ["cycle", "money", "auto"],
};

// Les étapes d'un parcours, textes dans la langue courante.
export function useGuideSteps(voice) {
  const { t } = useTranslation();
  return useMemo(
    () =>
      (GUIDE_STEPS[voice] ?? GUIDE_STEPS.admin).map((key) => ({
        key,
        voice,
        short: t(`guideJourney.${voice}.steps.${key}.short`),
        title: t(`guideJourney.${voice}.steps.${key}.title`),
        text: t(`guideJourney.${voice}.steps.${key}.text`),
        hint: t(`guideJourney.${voice}.steps.${key}.hint`),
        Scene: SCENES[key],
      })),
    [t, voice],
  );
}
