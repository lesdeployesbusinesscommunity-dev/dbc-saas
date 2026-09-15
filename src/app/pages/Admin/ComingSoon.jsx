// Import Dependencies
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

// Page provisoire pour les sections admin pas encore construites (on avance
// page par page, comme convenu). Évite un lien mort dans la sidebar tant
// que la page définitive n'a pas été spécifiée. "titleKey" est une clé de
// traduction (admin.nav.*) plutôt que du texte brut, pour rester FR/EN.
export function ComingSoon({ titleKey }) {
  const { t } = useTranslation();
  const title = t(titleKey);

  return (
    <Page title={`Admin – ${title}`}>
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]">
          <SparklesIcon aria-hidden="true" className="size-8" />
        </span>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="max-w-sm text-sm text-gray-500">
          {t("admin.comingSoon.message")}
        </p>
      </div>
    </Page>
  );
}
