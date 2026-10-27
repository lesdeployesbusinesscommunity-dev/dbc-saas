// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MapPinIcon,
  UserCircleIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "../Tontine/LevelBadge";
import { DeadlineBadge } from "app/pages/Membre/Leader/DeadlineBadge";
import { deadlineState, interviewStage } from "app/pages/Membre/Leader/interviewModel";
import { useMembersFormat } from "../Membres/useMembersFormat";
import { assignmentPlace, fullName } from "./registrationUtils";
import { STATUS_STYLE } from "./statusStyle";

// ----------------------------------------------------------------------

export function RegistrationStatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        STATUS_STYLE[status].badge,
      )}
    >
      <span aria-hidden="true" className={clsx("size-1.5 rounded-full", STATUS_STYLE[status].dot)} />
      {t(`admin.inscriptions.status.${status}`)}
    </span>
  );
}

// Une candidature = un DOSSIER : un onglet en haut à gauche avec son numéro
// (comme une chemise de classeur), puis la carte. Un clic n'importe où ouvre
// le dossier en grand (voir DossierCV.jsx) ; les boutons "Attribuer" /
// "Ajouter" agissent directement, sans l'ouvrir. "Ajouter" reste VERROUILLÉ
// (la carte dit "Entretien à mener") tant que le leader n'a pas rendu son
// compte-rendu avec la décision "concluant".
export function DossierCard({ registration, onOpen, onAssign, onAdd }) {
  const { t } = useTranslation();
  const { fullDate } = useMembersFormat();
  const { status, assignment } = registration;
  const name = fullName(registration);
  const stage = interviewStage(registration);
  const deadline = deadlineState(assignment);
  const canAdd = stage === "done";

  return (
    <div className="relative pt-7">
      <span
        className={clsx(
          "absolute left-0 top-0 flex h-7 items-center rounded-t-xl px-4 text-[11px] font-bold tracking-wider text-white",
          STATUS_STYLE[status].tab,
        )}
      >
        {t("admin.inscriptions.card.folder", { ref: registration.ref })}
      </span>

      <article
        className={clsx(
          "relative flex h-full flex-col rounded-2xl rounded-tl-none border border-t-[3px] border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
          STATUS_STYLE[status].border,
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar name={name} size="size-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{registration.travail}</p>
          </div>
          <RegistrationStatusBadge status={status} />
        </div>

        <dl className="mt-4 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <GlobeAltIcon aria-hidden="true" className="size-4 shrink-0 text-[#52A2DF]" />
            <dt className="sr-only">{t("admin.inscriptions.cv.country")}</dt>
            <dd>{[registration.ville, registration.pays].filter(Boolean).join(", ")}</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDaysIcon aria-hidden="true" className="size-4 shrink-0 text-[#52A2DF]" />
            <dt className="sr-only">{t("admin.inscriptions.cv.received")}</dt>
            <dd>{t("admin.inscriptions.card.received", { date: fullDate(registration.createdAt) })}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">{t("admin.inscriptions.cv.tontineChoice")}</dt>
            <dd>
              <LevelBadge levelKey={registration.tontine} />
            </dd>
          </div>
        </dl>

        {status === "entretien" && assignment && (
          <div className="mt-4 rounded-xl bg-blue-50/70 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-[#2f78b0]">
              <UserCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              {t("admin.inscriptions.card.interviewWith", { name: assignment.leaderName })}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-gray-600">
              <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
              {assignmentPlace(assignment, t)}
              {assignment.interviewDate &&
                ` · ${t("admin.inscriptions.card.interviewOn", { date: fullDate(assignment.interviewDate) })}`}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {stage === "done" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-600/25">
                  <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                  {t("admin.inscriptions.card.interviewDone")}
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-inset ring-gray-200">
                    {stage === "unreachable"
                      ? t("admin.inscriptions.card.interviewUnreachable")
                      : t("admin.inscriptions.card.interviewTodo")}
                  </span>
                  <DeadlineBadge deadline={deadline} />
                </>
              )}
            </div>
          </div>
        )}

        {status === "acceptee" && (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-700">
            <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            {t("admin.inscriptions.card.memberCreated", { matricule: registration.matricule })}
          </p>
        )}

        {status === "refusee" && (
          <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            <XCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gray-400" />
            <span className="line-clamp-2">
              {registration.refusal ||
                (registration.interview?.decision === "nonConcluant"
                  ? t("admin.inscriptions.card.refusedInterview", {
                      reasons: registration.interview.reasons
                        .map((reason) => t(`membre.leader.report.reasons.items.${reason}`))
                        .join(", "),
                    })
                  : t("admin.inscriptions.card.refused"))}
            </span>
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {status === "nouvelle" && (
            <button
              type="button"
              onClick={onAssign}
              className="relative z-10 flex items-center gap-1.5 rounded-lg border border-[#52A2DF] px-3 py-2 text-xs font-bold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.08]"
            >
              <UserCircleIcon aria-hidden="true" className="size-4" />
              {t("admin.inscriptions.card.assign")}
            </button>
          )}
          {status === "entretien" &&
            (canAdd ? (
              <button
                type="button"
                onClick={onAdd}
                className="relative z-10 flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                <UserPlusIcon aria-hidden="true" className="size-4" />
                {t("admin.inscriptions.card.add")}
              </button>
            ) : (
              <button
                type="button"
                disabled
                title={t("admin.inscriptions.card.addLocked")}
                className="relative z-10 flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-bold text-gray-400"
              >
                <LockClosedIcon aria-hidden="true" className="size-4" />
                {t("admin.inscriptions.card.add")}
              </button>
            ))}
          <span className="ml-auto text-xs font-semibold text-[#EE7115]">
            {t("admin.inscriptions.card.openCv")}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          aria-label={t("admin.inscriptions.card.open", { name })}
          className="absolute inset-0 rounded-2xl rounded-tl-none outline-none focus-visible:ring-2 focus-visible:ring-[#EE7115]/50"
        />
      </article>
    </div>
  );
}
