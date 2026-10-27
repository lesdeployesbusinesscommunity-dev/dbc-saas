// Import Dependencies
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { listMembers, useMembersStore } from "app/pages/Admin/Membres/membersStore";
import { submitFollowUpReport, useEscalationLog } from "app/pages/Admin/Tontine/escalationStore";
import { followUpStage } from "app/pages/Admin/Tontine/followUpModel";
import { useTontineFormat } from "app/pages/Admin/Tontine/format";
import { LevelBadge } from "app/pages/Admin/Tontine/LevelBadge";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { communityMembers } from "../communityMembers";
import { currentMember } from "../currentMember";
import { isDialable, telLink, whatsappLink } from "./contactUtils";
import { FollowUpReportForm } from "./FollowUpReportForm";
import { FollowUpStageBadge } from "./FollowUpStageBadge";
import { FollowUpSummary } from "./FollowUpSummary";
import { LeaderShell } from "./LeaderShell";
import { useLeaderProfile } from "./leaderAccess";

// ----------------------------------------------------------------------

// Un dossier de relance vu par le chef d'antenne (/membre/leader/relance/:id) :
// à gauche le membre en retard, ce qu'il doit et les boutons WhatsApp /
// Appeler ; à droite le rapport à cocher — ou, une fois rendu, son résumé.
export default function LeaderRelance() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { money } = useTontineFormat();
  const leader = useLeaderProfile();
  const { entries } = useEscalationLog();
  const membersSnapshot = useMembersStore();
  const [sent, setSent] = useState(null);

  const entry = entries.find((item) => item.id === id && item.step === "cm");
  const mine = Boolean(entry && leader && entry.assignment?.leaderId === leader.memberId);

  const phone = useMemo(() => {
    if (!entry) return "";
    const key = normalizeSearchText(entry.memberName);
    const person = listMembers(membersSnapshot).find((item) => normalizeSearchText(item.name) === key);
    return person?.whatsapp || communityMembers.find((item) => normalizeSearchText(item.name) === key)?.phone || "";
  }, [entry, membersSnapshot]);

  if (!entry || !mine) {
    return (
      <LeaderShell>
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
          <InformationCircleIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">{t("membre.leader.followUp.notFound.title")}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{t("membre.leader.followUp.notFound.description")}</p>
          <Link to="/membre/leader/relances" className="mt-4 text-sm font-bold text-[#EE7115]">
            {t("membre.leader.followUp.back")}
          </Link>
        </div>
      </LeaderShell>
    );
  }

  const stage = followUpStage(entry);
  const active = stage !== "done";
  const canContact = isDialable(phone);
  const message = t("membre.leader.followUp.contact.message", {
    name: entry.memberName,
    leader: currentMember.name,
    branch: leader.branchName,
    amount: money(entry.amount),
  });

  const handleSubmit = (draft) => {
    const report = submitFollowUpReport(entry.id, draft);
    setSent(report?.reachable ? "reached" : "unreachable");
  };

  return (
    <LeaderShell>
      <Link
        to="/membre/leader/relances"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {t("membre.leader.followUp.back")}
      </Link>

      {sent && (
        <div
          role="status"
          data-testid="sent-notice"
          className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 p-3.5 text-sm text-green-800"
        >
          <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t(`membre.leader.followUp.sent.${sent}`, { name: entry.memberName })}
        </div>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3.5">
              <Avatar name={entry.memberName} size="size-14" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-gray-900">{entry.memberName}</p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPinIcon aria-hidden="true" className="size-3.5 text-[#52A2DF]" />
                  {entry.assignment.branchName || entry.assignment.location}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FollowUpStageBadge stage={stage} />
              <LevelBadge levelKey={entry.levelKey} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("membre.leader.followUp.facts.late")}</dt>
                <dd className="font-semibold text-red-600">{t("admin.tontine.late.days", { count: entry.daysLate })}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("membre.leader.followUp.facts.amount")}</dt>
                <dd className="font-semibold text-gray-900">{money(entry.amount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("membre.leader.followUp.facts.penalty")}</dt>
                <dd className="font-semibold text-gray-900">
                  {money(Math.round(entry.amount * entry.penaltyRate))} · {Math.round(entry.penaltyRate * 100)} %
                </dd>
              </div>
            </dl>
          </div>

          {active && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-bold text-gray-900">{t("membre.leader.contact.title")}</p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {canContact ? (
                  <a
                    href={whatsappLink(phone, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-3 py-2.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    {t("membre.leader.contact.whatsapp")}
                  </a>
                ) : (
                  <span className="flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-bold text-gray-400">
                    {t("membre.leader.contact.whatsapp")}
                  </span>
                )}
                {canContact ? (
                  <a
                    href={telLink(phone)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <PhoneIcon aria-hidden="true" className="size-4" />
                    {t("membre.leader.contact.call")}
                  </a>
                ) : (
                  <span className="flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-bold text-gray-400">
                    {t("membre.leader.contact.call")}
                  </span>
                )}
              </div>
              <p className={clsx("mt-3 text-xs", canContact ? "text-gray-500" : "text-amber-700")}>
                {canContact ? t("membre.leader.followUp.contact.hint") : t("membre.leader.contact.invalid")}
              </p>
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">{t("membre.leader.followUp.report.title")}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {active ? t("membre.leader.followUp.report.subtitle") : t("membre.leader.followUp.report.lockedSubtitle")}
            </p>
          </div>

          {active ? (
            <>
              {stage === "unreachable" && entry.report && (
                <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">
                    {t("membre.leader.followUp.retry.title", { count: entry.report.attempts ?? 1 })}
                  </p>
                  <p className="mt-0.5 text-xs">{t("membre.leader.followUp.retry.description")}</p>
                </div>
              )}
              <FollowUpReportForm
                key={entry.report?.at ?? "new"}
                memberName={entry.memberName}
                onSubmit={handleSubmit}
              />
            </>
          ) : (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <FollowUpSummary report={entry.report} />
            </div>
          )}
        </div>
      </div>
    </LeaderShell>
  );
}
