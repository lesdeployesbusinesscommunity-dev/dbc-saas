// Import Dependencies
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  PencilSquareIcon,
  ClockIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { MemberTimeline } from "./MemberTimeline";
import { useLeaderLabels } from "./leaderData";
import { useMonthLabels } from "../components/monthUtils";
import { choiceRank } from "../Tontine/monthChoices";
import { useMembersFormat } from "./useMembersFormat";

// ----------------------------------------------------------------------

function Section({ Icon, title, children }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
        <Icon aria-hidden="true" className="size-3.5" />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Bas de la fiche d'un membre : sa fonction de leader (avec les boutons
// pour la confier, la modifier ou la retirer), ses anciens mandats et sa
// chronologie complète. En tête : son début de tontine et, s'il a reçu une
// demande de choix (voir Tontines), ses 3 mois et le mois attribué. Affiché dans MemberDetailsCard via "followUp".
export function MemberFollowUp({ member, activeTerm, pastTerms, events, campaigns = [], onAppoint, onEdit, onDismiss }) {
  const { t } = useTranslation();
  const { monthYear, monthShort } = useMonthLabels();
  const { functionLabel, reasonLabel } = useLeaderLabels();
  const { fullDate, duration } = useMembersFormat();
  const canAppoint = member.status === "actif";

  return (
    <div className="mt-4 space-y-4">
      <Section Icon={ArrowPathRoundedSquareIcon} title={t("admin.membres.followUp.tontineTitle")}>
        <dl className="divide-y divide-gray-50 text-sm">
          <div className="flex items-baseline justify-between gap-3 py-1">
            <dt className="text-gray-500">{t("admin.membres.followUp.tontineStart")}</dt>
            <dd className="font-semibold text-gray-800">{monthYear(member.tontineStartMonth)}</dd>
          </div>
        </dl>
        {campaigns.map((campaign) => {
          const response = campaign.responses[member.matricule];
          const assigned = campaign.order[member.matricule];
          const rank = choiceRank(campaign, member.matricule);
          return (
            <div key={campaign.id} className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">
                {t("admin.membres.followUp.campaign", {
                  level: t(`simulateur.levels.${campaign.levelKey}.name`),
                  month: monthYear(campaign.startMonth),
                })}
              </p>
              <p className="mt-0.5">
                {response
                  ? t("admin.membres.followUp.choices", { months: response.months.map(monthShort).join(" · ") })
                  : t("admin.membres.followUp.noAnswer")}
              </p>
              {assigned && (
                <p className="mt-0.5 font-semibold text-[#EE7115]">
                  {t(campaign.status === "validated" ? "admin.membres.followUp.turnFinal" : "admin.membres.followUp.turnPlanned", {
                    month: monthYear(assigned),
                  })}
                  {rank !== null && ` (${rank > 0 ? t("admin.membres.followUp.rank", { n: rank }) : t("admin.membres.followUp.outOfChoices")})`}
                </p>
              )}
            </div>
          );
        })}
      </Section>

      <Section Icon={ShieldCheckIcon} title={t("admin.membres.followUp.leaderTitle")}>
        {activeTerm ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#EE7115]">{functionLabel(activeTerm)}</p>
              {activeTerm.scope && <p className="text-xs text-gray-600">{activeTerm.scope}</p>}
              <p className="mt-0.5 text-xs text-gray-400">
                {t("admin.membres.leaders.since", { date: fullDate(activeTerm.startedAt) })} · {duration(activeTerm.startedAt)}
              </p>
              {activeTerm.note && <p className="mt-1 text-xs italic text-gray-400">{activeTerm.note}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(activeTerm)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <PencilSquareIcon aria-hidden="true" className="size-3.5" />
                {t("admin.membres.leaders.edit")}
              </button>
              <button
                type="button"
                onClick={() => onDismiss(activeTerm)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <ShieldExclamationIcon aria-hidden="true" className="size-3.5" />
                {t("admin.membres.leaders.dismissAction")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {canAppoint ? t("admin.membres.followUp.notLeader") : t("admin.membres.followUp.mustBeActive")}
            </p>
            {canAppoint && (
              <button
                type="button"
                onClick={onAppoint}
                className="flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
                {t("admin.membres.leaders.appointShort")}
              </button>
            )}
          </div>
        )}

        {pastTerms.length > 0 && (
          <div className="mt-4 border-t border-gray-50 pt-3">
            <p className="text-xs font-semibold text-gray-500">{t("admin.membres.followUp.pastTerms")}</p>
            <ul className="mt-2 space-y-2">
              {pastTerms.map((term) => (
                <li key={term.id} className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800">
                    {functionLabel(term)}
                    {term.scope ? ` · ${term.scope}` : ""}
                  </p>
                  <p>
                    {fullDate(term.startedAt)} → {fullDate(term.endedAt)} ({duration(term.startedAt, term.endedAt)})
                  </p>
                  <p className="text-gray-400">
                    {t("admin.membres.leaders.reasonLabel")} : {reasonLabel(term.endReason)}
                    {term.endComment ? ` — ${term.endComment}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section Icon={ClockIcon} title={t("admin.membres.followUp.timelineTitle")}>
        <MemberTimeline events={events} />
      </Section>
    </div>
  );
}
