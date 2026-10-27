// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "components/shared/Page";
import { GuideJourney } from "components/shared/GuideJourney";
import { useGuideSteps } from "app/pages/Admin/Tontine/guide/steps";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";

// ----------------------------------------------------------------------

// Page "Guide" du membre (/membre/tontine/guide) : comprendre sa tontine en
// suivant une route, étape par étape (tutoiement, 3 étapes).
export default function MembreTontineGuide() {
  const { t } = useTranslation();
  const steps = useGuideSteps("member");

  return (
    <Page title={`${t("guideJourney.member.title")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar titleKey="guideJourney.member.title" />
        <Link
          to="/membre/tontine"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
          {t("membre.nav.tontine")}
        </Link>
        <p className="mt-2 max-w-3xl text-sm text-gray-500">{t("guideJourney.member.intro")}</p>

        <div className="mt-6">
          <GuideJourney
            steps={steps}
            doneTitle={t("guideJourney.member.doneTitle")}
            doneText={t("guideJourney.member.doneText")}
            backTo="/membre/tontine"
            backLabel={t("membre.nav.tontine")}
          />
        </div>
      </div>
    </Page>
  );
}
