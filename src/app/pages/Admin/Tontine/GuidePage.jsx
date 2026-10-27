// Import Dependencies
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "components/shared/Page";
import { GuideJourney } from "components/shared/GuideJourney";
import { AdminTopBar } from "../components/AdminTopBar";
import { GUIDE_STEPS, useGuideSteps } from "./guide/steps";

// ----------------------------------------------------------------------

// Page "Guide" de l'administration (/admin/tontine/guide) : comprendre la
// tontine et le registre en suivant une route, étape par étape. "?etape=ledger"
// ouvre directement sur une étape (utilisé par le bouton du registre).
export default function TontineGuidePage() {
  const { t } = useTranslation();
  const steps = useGuideSteps("admin");
  const [params] = useSearchParams();
  const initialStep = Math.max(0, GUIDE_STEPS.admin.indexOf(params.get("etape")));

  return (
    <Page title={`Admin – ${t("guideJourney.admin.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("guideJourney.admin.title")} />
        <Link
          to="/admin/tontine"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
          {t("admin.tontine.registre.back")}
        </Link>
        <p className="mt-2 max-w-3xl text-sm text-gray-500">{t("guideJourney.admin.intro")}</p>

        <div className="mt-6">
          <GuideJourney
            steps={steps}
            initialStep={initialStep}
            doneTitle={t("guideJourney.admin.doneTitle")}
            doneText={t("guideJourney.admin.doneText")}
            backTo="/admin/tontine"
            backLabel={t("admin.tontine.registre.back")}
          />
        </div>
      </div>
    </Page>
  );
}
