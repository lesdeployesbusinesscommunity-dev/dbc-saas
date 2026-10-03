// Import Dependencies
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

// Page provisoire pour les sections membre pas encore construites — même
// motif que ComingSoon.jsx côté admin (voir Admin/ComingSoon.jsx) : on
// avance page par page, pas de lien mort dans la sidebar tant que la
// page définitive n'a pas été spécifiée.
export function ComingSoon({ titleKey }) {
  const { t } = useTranslation();
  const title = t(titleKey);

  return (
    <Page title={title}>
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]">
          <SparklesIcon aria-hidden="true" className="size-8" />
        </span>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="max-w-sm text-sm text-gray-500">
          {t("membre.comingSoon.message")}
        </p>
      </div>
    </Page>
  );
}
