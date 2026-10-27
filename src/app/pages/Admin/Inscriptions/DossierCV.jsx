// Import Dependencies
import { useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  LockClosedIcon,
  MapPinIcon,
  PaperClipIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "../Tontine/LevelBadge";
import { levels, formatMoney } from "app/pages/Simulateur/data";
import { useMembersFormat } from "../Membres/useMembersFormat";
import { listMembers, useMembersStore } from "../Membres/membersStore";
import { DeadlineBadge } from "app/pages/Membre/Leader/DeadlineBadge";
import { ReportSummary } from "app/pages/Membre/Leader/ReportSummary";
import { deadlineState, interviewStage } from "app/pages/Membre/Leader/interviewModel";
import { RegistrationStatusBadge } from "./DossierCard";
import { ProofLink } from "./ProofLink";
import { ageOf, assignmentPlace, fullName } from "./registrationUtils";
import { STATUS_STYLE } from "./statusStyle";

// ----------------------------------------------------------------------

function CvSection({ title, children }) {
  return (
    <section>
      <h3 className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#EE7115]">
        {title}
        <span aria-hidden="true" className="h-px flex-1 bg-gray-200" />
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#52A2DF]/[0.1] text-[#52A2DF]">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="break-words text-sm font-semibold text-gray-900">{children}</dd>
      </div>
    </div>
  );
}

function SideRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-gray-700">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#52A2DF]" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

// Le déroulé de la candidature, comme les étapes d'un recrutement.
function Timeline({ registration }) {
  const { t } = useTranslation();
  const { fullDate } = useMembersFormat();
  const { assignment } = registration;

  const steps = [
    {
      key: "received",
      done: true,
      label: t("admin.inscriptions.cv.steps.received"),
      detail: fullDate(registration.createdAt),
    },
    {
      key: "assigned",
      done: Boolean(assignment),
      label: t("admin.inscriptions.cv.steps.assigned"),
      detail: assignment
        ? `${assignment.leaderName} · ${assignmentPlace(assignment, t)}`
        : t("admin.inscriptions.cv.steps.assignedPending"),
    },
    {
      key: "interview",
      done: ["concluant", "nonConcluant"].includes(registration.interview?.decision),
      label: t("admin.inscriptions.cv.steps.interview"),
      detail: ["concluant", "nonConcluant"].includes(registration.interview?.decision)
        ? t("admin.inscriptions.cv.steps.reportReceived", { date: fullDate(registration.interview.at) })
        : registration.interview?.decision === "injoignable"
          ? t("admin.inscriptions.cv.steps.unreachable", { date: fullDate(registration.interview.at) })
          : assignment?.dueDate
            ? t("admin.inscriptions.cv.steps.reportDue", { date: fullDate(assignment.dueDate) })
            : t("admin.inscriptions.cv.steps.interviewPending"),
    },
    {
      key: "decision",
      done: registration.status === "acceptee" || registration.status === "refusee",
      label:
        registration.status === "refusee"
          ? t("admin.inscriptions.cv.steps.refused")
          : t("admin.inscriptions.cv.steps.accepted"),
      detail: registration.decidedAt
        ? fullDate(registration.decidedAt)
        : t("admin.inscriptions.cv.steps.decisionPending"),
      tone: registration.status === "refusee" ? "refused" : "ok",
    },
  ];

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
          {index < steps.length - 1 && (
            <span aria-hidden="true" className="absolute left-[9px] top-5 h-full w-px bg-gray-200" />
          )}
          <span
            aria-hidden="true"
            className={clsx(
              "relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
              step.done
                ? step.tone === "refused"
                  ? "bg-gray-400 text-white"
                  : "bg-green-600 text-white"
                : "border-2 border-gray-200 bg-white",
            )}
          >
            {step.done &&
              (step.tone === "refused" ? (
                <XCircleIcon className="size-4" />
              ) : (
                <CheckCircleIcon className="size-4" />
              ))}
          </span>
          <div className="min-w-0">
            <p className={clsx("text-sm font-semibold", step.done ? "text-gray-900" : "text-gray-400")}>
              {step.label}
            </p>
            <p className="text-xs text-gray-500">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Le dossier ouvert en grand, présenté comme un CV : une colonne d'identité
// et de contact à gauche, puis les rubriques classées (profil, activité,
// choix de tontine, parrainage, entretien) — tout ce que la personne a
// renseigné à l'inscription. Les actions de l'administration sont en bas :
// attribuer à un leader pour l'entretien, refuser, ou — une fois
// l'entretien concluant — ajouter le membre (voir Inscriptions/index.jsx).
export function DossierCV({ registration, onClose, onAssign, onAdd, onRefuse }) {
  const { t } = useTranslation();
  const { fullDate } = useMembersFormat();
  const snapshot = useMembersStore();

  const sponsor = useMemo(() => {
    if (!registration?.parrain) return null;
    return (
      listMembers(snapshot).find(
        (member) => member.matricule?.toUpperCase() === registration.parrain.toUpperCase(),
      ) ?? null
    );
  }, [snapshot, registration]);

  if (!registration) return null;

  const name = fullName(registration);
  const age = ageOf(registration.dateNaissance);
  const level = levels.find((item) => item.key === registration.tontine);
  const { status, assignment } = registration;
  const open = status === "nouvelle" || status === "entretien";
  const stage = interviewStage(registration);
  const deadline = deadlineState(assignment);
  const canAdd = stage === "done";

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className={clsx("flex items-center justify-between gap-3 px-5 py-3 text-white", STATUS_STYLE[status].tab)}>
            <DialogTitle className="text-xs font-bold uppercase tracking-[0.18em]">
              {t("admin.inscriptions.cv.title")} · {registration.ref}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[18.5rem_1fr]">
            {/* Colonne gauche : l'identité et les moyens de contact. */}
            <aside className="bg-sky-50/70 p-6 md:border-r md:border-gray-100">
              <div className="flex flex-col items-center text-center">
                <Avatar name={name} size="size-24" className="ring-4 ring-white" />
                <p className="mt-4 text-lg font-extrabold leading-tight text-gray-900">{name}</p>
                <p className="mt-1 text-sm text-gray-600">{registration.travail}</p>
                <div className="mt-3">
                  <RegistrationStatusBadge status={status} />
                </div>
              </div>

              <h3 className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {t("admin.inscriptions.cv.contact")}
              </h3>
              <ul className="mt-3 space-y-3">
                <SideRow icon={EnvelopeIcon}>{registration.email}</SideRow>
                <SideRow icon={DevicePhoneMobileIcon}>{registration.whatsapp}</SideRow>
                <SideRow icon={GlobeAltIcon}>
                  {[registration.ville, registration.pays].filter(Boolean).join(", ")}
                </SideRow>
              </ul>

              <p className="mt-7 text-xs text-gray-500">
                {t("admin.inscriptions.cv.receivedOn", { date: fullDate(registration.createdAt) })}
              </p>
            </aside>

            {/* Colonne droite : les rubriques du CV. */}
            <div className="space-y-7 p-6 sm:p-8">
              <CvSection title={t("admin.inscriptions.cv.profile")}>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Fact icon={CalendarDaysIcon} label={t("admin.inscriptions.cv.birth")}>
                    {registration.dateNaissance ? fullDate(registration.dateNaissance) : "—"}
                    {age !== null && (
                      <span className="font-normal text-gray-500">
                        {" "}
                        · {t("admin.inscriptions.cv.age", { count: age })}
                      </span>
                    )}
                  </Fact>
                  <Fact icon={IdentificationIcon} label={t("admin.inscriptions.cv.cni")}>
                    {registration.cni}
                  </Fact>
                  <Fact icon={GlobeAltIcon} label={t("admin.inscriptions.cv.country")}>
                    {registration.pays}
                  </Fact>
                  <Fact icon={MapPinIcon} label={t("admin.inscriptions.cv.city")}>
                    {registration.ville || "—"}
                  </Fact>
                </dl>
              </CvSection>

              <CvSection title={t("admin.inscriptions.cv.activity")}>
                <dl>
                  <Fact icon={BriefcaseIcon} label={t("admin.inscriptions.cv.profession")}>
                    {registration.travail}
                  </Fact>
                  <div className="mt-4">
                    <Fact icon={PaperClipIcon} label={t("registrationProof.label")}>
                      <ProofLink proof={registration.justificatif} />
                    </Fact>
                  </div>
                </dl>
              </CvSection>

              <CvSection title={t("admin.inscriptions.cv.tontineChoice")}>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Fact icon={BanknotesIcon} label={t("admin.inscriptions.cv.level")}>
                    <LevelBadge levelKey={registration.tontine} />
                  </Fact>
                  {level && (
                    <Fact icon={BanknotesIcon} label={t("admin.inscriptions.cv.contribution")}>
                      {formatMoney(level.cotisation)}
                      {t("simulateur.perMonth")}
                    </Fact>
                  )}
                </dl>
              </CvSection>

              <CvSection title={t("admin.inscriptions.cv.sponsorship")}>
                <dl>
                  <Fact icon={UserGroupIcon} label={t("admin.inscriptions.cv.sponsor")}>
                    {!registration.parrain ? (
                      <span className="font-normal text-gray-500">
                        {t("admin.inscriptions.cv.noSponsor")}
                      </span>
                    ) : sponsor ? (
                      <>
                        {sponsor.name}
                        <span className="font-normal text-gray-500"> · {registration.parrain}</span>
                        {registration.parrainParDefaut && (
                          <span className="font-normal text-gray-500"> · {t("admin.inscriptions.cv.sponsorDefault")}</span>
                        )}
                      </>
                    ) : (
                      <>
                        {registration.parrain}
                        <span className="font-normal text-amber-600">
                          {" "}
                          · {t("admin.inscriptions.cv.sponsorUnknown")}
                        </span>
                      </>
                    )}
                  </Fact>
                </dl>
              </CvSection>

              <CvSection title={t("admin.inscriptions.cv.interview")}>
                {assignment && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#52A2DF]/25 bg-blue-50/60 p-3.5">
                    <Avatar name={assignment.leaderName} src={assignment.photo} size="size-10" />
                    <div className="min-w-0 text-sm">
                      <p className="font-bold text-gray-900">{assignment.leaderName}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0 text-[#52A2DF]" />
                        {assignmentPlace(assignment, t)} · {assignment.country}
                      </p>
                      {assignment.note && (
                        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600">
                          {assignment.note}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {status === "entretien" && stage !== "done" && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <DeadlineBadge deadline={deadline} />
                    <span className="text-xs text-gray-500">
                      {stage === "unreachable"
                        ? t("admin.inscriptions.cv.reportUnreachable")
                        : t("admin.inscriptions.cv.reportPending")}
                    </span>
                  </div>
                )}
                <Timeline registration={registration} />
                {registration.interview && (
                  <div className="mt-5 rounded-xl border border-gray-100 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t("admin.inscriptions.cv.report")}
                    </p>
                    <ReportSummary report={registration.interview} />
                  </div>
                )}
                {status === "refusee" && registration.refusal && (
                  <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                    {registration.refusal}
                  </p>
                )}
                {status === "acceptee" && (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                    <CheckCircleIcon aria-hidden="true" className="size-5 shrink-0" />
                    {t("admin.inscriptions.card.memberCreated", { matricule: registration.matricule })}
                  </p>
                )}
              </CvSection>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("admin.membres.modal.close")}
            </button>
            {open && (
              <button
                type="button"
                onClick={onRefuse}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                {t("admin.inscriptions.cv.refuse")}
              </button>
            )}
            {open && (
              <button
                type="button"
                onClick={onAssign}
                className="flex items-center gap-1.5 rounded-lg border border-[#52A2DF] px-4 py-2 text-sm font-bold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.08]"
              >
                <UserCircleIcon aria-hidden="true" className="size-4" />
                {status === "entretien"
                  ? t("admin.inscriptions.cv.reassign")
                  : t("admin.inscriptions.card.assign")}
              </button>
            )}
            {status === "entretien" &&
              (canAdd ? (
                <button
                  type="button"
                  onClick={onAdd}
                  className="flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <UserPlusIcon aria-hidden="true" className="size-4" />
                  {t("admin.inscriptions.card.add")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title={t("admin.inscriptions.card.addLocked")}
                  className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-100 px-5 py-2 text-sm font-bold text-gray-400"
                >
                  <LockClosedIcon aria-hidden="true" className="size-4" />
                  {t("admin.inscriptions.card.add")}
                </button>
              ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
