// Import Dependencies
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { useMonthLabels } from "../components/monthUtils";
import { useMembersFormat } from "../Membres/useMembersFormat";
import { answerCounts, isPastDeadline } from "./monthChoices";

// ----------------------------------------------------------------------

const CAMPAIGN_STATUS_STYLE = {
  open: "bg-blue-50 text-[#52A2DF] ring-blue-500/20",
  closed: "bg-amber-50 text-amber-700 ring-amber-600/20",
  validated: "bg-green-50 text-green-700 ring-green-600/20",
};

export function CampaignStatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        CAMPAIGN_STATUS_STYLE[status],
      )}
    >
      {t(`admin.tontine.choices.status.${status}`)}
    </span>
  );
}

// Section "Choix des mois de passage" de la page Tontines : les demandes
// envoyées aux membres d'un futur groupe (chacun choisit 3 mois), avec où
// elles en sont. Le détail (réponses, relances, ordre) s'ouvre au clic.
export function ChoiceCampaigns({ campaigns, onCreate, onOpen }) {
  const { t } = useTranslation();
  const { monthYear } = useMonthLabels();
  const { fullDate } = useMembersFormat();

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <ChatBubbleLeftRightIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
            {t("admin.tontine.choices.title")}
          </h2>
          <p className="mt-0.5 max-w-3xl text-xs text-gray-500">{t("admin.tontine.choices.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          {t("admin.tontine.choices.launch")}
        </button>
      </div>

      {campaigns.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-gray-500">
          {t("admin.tontine.choices.empty")}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => {
            const { answered, total } = answerCounts(campaign);
            const late = campaign.status === "open" && isPastDeadline(campaign);
            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => onOpen(campaign.id)}
                className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-colors hover:border-gray-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {t(`simulateur.levels.${campaign.levelKey}.name`)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("admin.tontine.choices.period", {
                        from: monthYear(campaign.months[0]),
                        to: monthYear(campaign.months[campaign.months.length - 1]),
                      })}
                    </p>
                    <p className="text-xs font-semibold text-violet-600">
                      {campaign.targetGroupId
                        ? t("admin.tontine.choices.forGroup", { letter: campaign.targetGroupId.split("-").pop() })
                        : t("admin.tontine.choices.forNewGroup", { count: campaign.months.length })}
                    </p>
                  </div>
                  <CampaignStatusBadge status={campaign.status} />
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-gray-700">
                      {t("admin.tontine.choices.answered", { answered, total })}
                    </span>
                    <span className={clsx(late ? "font-semibold text-red-600" : "text-gray-400")}>
                      {late
                        ? t("admin.tontine.choices.deadlinePassed", { date: fullDate(campaign.deadline) })
                        : t("admin.tontine.choices.before", { date: fullDate(campaign.deadline) })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#52A2DF]"
                      style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
