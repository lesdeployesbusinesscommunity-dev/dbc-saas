// Import Dependencies
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CakeIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  PaperClipIcon,
  PhoneIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { ageOf, fullName } from "app/pages/Admin/Inscriptions/registrationUtils";
import { submitInterviewReport, useRegistrations } from "app/pages/Admin/Inscriptions/registrationsStore";
import { listMembers, useMembersStore } from "app/pages/Admin/Membres/membersStore";
import { useMembersFormat } from "app/pages/Admin/Membres/useMembersFormat";
import { ProofLink } from "app/pages/Admin/Inscriptions/ProofLink";
import { LevelBadge } from "app/pages/Admin/Tontine/LevelBadge";
import { currentMember } from "../currentMember";
import { isDialable, telLink, whatsappLink } from "./contactUtils";
import { DeadlineBadge, InterviewStageBadge } from "./DeadlineBadge";
import { InterviewReportForm } from "./InterviewReportForm";
import { LeaderShell } from "./LeaderShell";
import { deadlineState, interviewStage } from "./interviewModel";
import { useLeaderProfile } from "./leaderAccess";
import { ReportSummary } from "./ReportSummary";

// ----------------------------------------------------------------------

function Fact({ icon: Icon, label, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-gray-700">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#52A2DF]" />
      <span className="min-w-0 break-words">
        <span className="sr-only">{label} : </span>
        {children}
      </span>
    </li>
  );
}

// Le dossier d'un candidat vu par le leader (/membre/leader/dossier/:id) :
// à gauche la fiche (SANS le numéro de CNI, qui reste réservé à
// l'administration), les boutons WhatsApp / Appeler et le mot de
// l'administration ; à droite le compte-rendu à cocher — ou, une fois
// rendu, son résumé.
export default function LeaderDossier() {
  const { t } = useTranslation();
  const { id } = useParams();
  const leader = useLeaderProfile();
  const registrations = useRegistrations();
  const membersSnapshot = useMembersStore();
  const { fullDate } = useMembersFormat();
  const [sent, setSent] = useState(null);

  const registration = registrations.find((item) => item.id === id);
  const mine = Boolean(registration && leader && registration.assignment?.leaderId === leader.memberId);
  const sponsor = useMemo(() => {
    if (!registration?.parrain) return null;
    return (
      listMembers(membersSnapshot).find(
        (member) => member.matricule?.toUpperCase() === registration.parrain.toUpperCase(),
      ) ?? null
    );
  }, [membersSnapshot, registration]);

  if (!registration || !mine) {
    return (
      <LeaderShell>
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
          <InformationCircleIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">{t("membre.leader.dossier.notFound.title")}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{t("membre.leader.dossier.notFound.description")}</p>
          <Link to="/membre/leader" className="mt-4 text-sm font-bold text-[#EE7115]">
            {t("membre.leader.dossier.back")}
          </Link>
        </div>
      </LeaderShell>
    );
  }

  const name = fullName(registration);
  const stage = interviewStage(registration);
  const deadline = deadlineState(registration.assignment);
  const active = stage === "todo" || stage === "unreachable";
  const age = ageOf(registration.dateNaissance);
  const canContact = isDialable(registration.whatsapp);
  const message = t("membre.leader.contact.message", {
    name: registration.prenom,
    leader: currentMember.name,
    branch: leader.branchName,
    ref: registration.ref,
  });

  const handleSubmit = (draft, decision) => {
    submitInterviewReport(registration.id, draft, decision);
    setSent(decision);
  };

  return (
    <LeaderShell>
      <Link
        to="/membre/leader"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {t("membre.leader.dossier.back")}
      </Link>

      {sent && (
        <div
          role="status"
          data-testid="sent-notice"
          className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 p-3.5 text-sm text-green-800"
        >
          <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t(`membre.leader.report.sent.${sent}`, { name })}
        </div>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3.5">
              <Avatar name={name} size="size-14" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-gray-900">{name}</p>
                <p className="text-xs font-semibold text-gray-400">
                  {t("membre.leader.dossier.folder", { ref: registration.ref })}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <InterviewStageBadge stage={stage} />
              {active && <DeadlineBadge deadline={deadline} />}
            </div>

            <ul className="mt-4 space-y-2.5">
              <Fact icon={GlobeAltIcon} label={t("membre.leader.dossier.place")}>
                {[registration.ville, registration.pays].filter(Boolean).join(", ")}
              </Fact>
              {age !== null && (
                <Fact icon={CakeIcon} label={t("membre.leader.dossier.age")}>
                  {t("admin.inscriptions.cv.age", { count: age })}
                </Fact>
              )}
              <Fact icon={BriefcaseIcon} label={t("membre.leader.dossier.job")}>
                {registration.travail}
              </Fact>
              <Fact icon={PaperClipIcon} label={t("registrationProof.label")}>
                <ProofLink proof={registration.justificatif} />
              </Fact>
              <Fact icon={UserGroupIcon} label={t("membre.leader.dossier.sponsor")}>
                {registration.parrain
                  ? sponsor
                    ? `${sponsor.name} · ${registration.parrain}`
                    : registration.parrain
                  : t("admin.inscriptions.cv.noSponsor")}
              </Fact>
              {registration.email && (
                <Fact icon={EnvelopeIcon} label="E-mail">
                  {registration.email}
                </Fact>
              )}
              {registration.whatsapp && (
                <Fact icon={PhoneIcon} label="WhatsApp">
                  {registration.whatsapp}
                </Fact>
              )}
            </ul>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <span>{t("membre.leader.dossier.tontine")} :</span>
              <LevelBadge levelKey={registration.tontine} />
            </div>

            <p className="mt-3 text-xs text-gray-400">
              {t("membre.leader.dossier.assignedOn", { date: fullDate(registration.assignment.assignedAt) })}
            </p>
            <p className="mt-1 text-xs text-gray-400">{t("membre.leader.dossier.cniHidden")}</p>
          </div>

          {registration.assignment.note && (
            <div className="rounded-3xl bg-blue-50/70 p-5 ring-1 ring-[#52A2DF]/20">
              <p className="text-xs font-bold uppercase tracking-wide text-[#2f78b0]">
                {t("membre.leader.dossier.adminNote")}
              </p>
              <p className="mt-1.5 text-sm text-gray-700">{registration.assignment.note}</p>
            </div>
          )}

          {active && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-bold text-gray-900">{t("membre.leader.contact.title")}</p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {canContact ? (
                  <a
                    href={whatsappLink(registration.whatsapp, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#16A34A] px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    {t("membre.leader.contact.whatsapp")}
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-bold text-gray-400"
                  >
                    {t("membre.leader.contact.whatsapp")}
                  </span>
                )}
                {canContact ? (
                  <a
                    href={telLink(registration.whatsapp)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <PhoneIcon aria-hidden="true" className="size-4" />
                    {t("membre.leader.contact.call")}
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-bold text-gray-400"
                  >
                    {t("membre.leader.contact.call")}
                  </span>
                )}
              </div>
              <p className={clsx("mt-3 text-xs", canContact ? "text-gray-500" : "text-amber-700")}>
                {canContact ? t("membre.leader.contact.hint") : t("membre.leader.contact.invalid")}
              </p>
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">{t("membre.leader.report.title")}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {active ? t("membre.leader.report.subtitle") : t("membre.leader.report.lockedSubtitle")}
            </p>
          </div>

          {active ? (
            <>
              {stage === "unreachable" && registration.interview && (
                <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">
                    {t("membre.leader.report.retry.title", { count: registration.interview.attempts ?? 1 })}
                  </p>
                  <p className="mt-0.5 text-xs">{t("membre.leader.report.retry.description")}</p>
                </div>
              )}
              <InterviewReportForm
                key={registration.interview?.at ?? "new"}
                registration={registration}
                candidateName={name}
                onSubmit={handleSubmit}
              />
            </>
          ) : (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <ReportSummary report={registration.interview} />
            </div>
          )}
        </div>
      </div>
    </LeaderShell>
  );
}
