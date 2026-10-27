// Import Dependencies
import { useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { BoltIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { publishAnnouncement } from "app/pages/Annonces/announcementsStore";
import { currentAdmin } from "../currentAdmin";
import { ProofLink } from "../Inscriptions/ProofLink";
import { listMembers, logMemberEvent, useMembersStore } from "../Membres/membersStore";
import { normalizeSearchText } from "../searchUtils";
import { URGENCY_REVIEW_HOURS, URGENCY_ROWS, urgencyPoints } from "./priorityScore";
import { decideDeclaration, decidedDeclarations, pendingDeclarations, usePriorityStore } from "./priorityStore";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

const SELECT =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

// Le message privé envoyé au membre une fois la décision prise (« vous »).
function notify(t, record, key, status, category, note) {
  const keys = [key];
  publishAnnouncement({
    kind: "reminder",
    title: t(`tontinePriority.urgencyReview.msg.${status}.title`),
    body: t(`tontinePriority.urgencyReview.msg.${status}.body`, {
      category: t(`tontinePriority.rows.urgency.${category}.label`),
      points: urgencyPoints(category),
      note: note || t("tontinePriority.urgencyReview.msg.noNote"),
    }),
    importance: "important",
    author: { role: "admin", name: t("tontinePriority.sender"), matricule: "", branchName: "" },
    audience: { type: "members", total: 1, names: [record.name] },
    recipients: keys,
  });
}

function RequestCard({ record }) {
  const { t } = useTranslation();
  const membersSnapshot = useMembersStore();
  const { day } = useTontineFormat();
  const [category, setCategory] = useState(record.category);
  const [note, setNote] = useState("");
  const deadline = dayjs(record.submittedAt).add(URGENCY_REVIEW_HOURS, "hour");
  const overdue = deadline.isBefore(dayjs());

  const decide = (status) => {
    decideDeclaration(record.key, { status, category, note, by: currentAdmin.name });
    notify(t, record, record.key, status, category, note.trim());
    const member = listMembers(membersSnapshot).find((m) => normalizeSearchText(m.name) === normalizeSearchText(record.name));
    if (member) logMemberEvent(member.id, "priorityUrgency", { status, category });
  };

  return (
    <li className="rounded-2xl border border-gray-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{record.name}</p>
          <p className="text-xs text-gray-500">
            {t("tontinePriority.urgencyReview.declared", {
              category: t(`tontinePriority.rows.urgency.${record.category}.label`),
              points: urgencyPoints(record.category),
            })}
          </p>
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            overdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
          )}
        >
          <ClockIcon aria-hidden="true" className="size-3.5" />
          {t(overdue ? "tontinePriority.urgencyReview.overdue" : "tontinePriority.urgencyReview.before", {
            date: `${day(deadline)} ${deadline.format("HH:mm")}`,
          })}
        </span>
      </div>

      {record.description && <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{record.description}</p>}
      <div className="mt-3 text-sm">
        {record.proof ? <ProofLink proof={record.proof} /> : <span className="text-xs text-gray-500">{t("tontinePriority.urgencyReview.noProof")}</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-gray-600">
          {t("tontinePriority.urgencyReview.retained")}
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={clsx(SELECT, "mt-1 block")}>
            {URGENCY_ROWS.map((row) => (
              <option key={row.key} value={row.key}>
                {t(`tontinePriority.rows.urgency.${row.key}.label`)} · {t("tontinePriority.points", { count: row.points })}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[10rem] flex-1 text-xs font-semibold text-gray-600">
          {t("tontinePriority.urgencyReview.note")}
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className={clsx(SELECT, "mt-1 block w-full")}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => decide("validated")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <CheckCircleIcon aria-hidden="true" className="size-4" />
            {t("tontinePriority.urgencyReview.validate")}
          </button>
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <XCircleIcon aria-hidden="true" className="size-4" />
            {t("tontinePriority.urgencyReview.reject")}
          </button>
        </div>
      </div>
    </li>
  );
}

// Les demandes d'urgence à valider par le Comité de Gouvernance (critère 1),
// sous 72 h. Chaque décision est gardée avec sa date et son auteur, et le
// membre en est prévenu par un message privé.
export function UrgencyRequests() {
  const { t } = useTranslation();
  const { day } = useTontineFormat();
  const snapshot = usePriorityStore();
  const pending = pendingDeclarations(snapshot);
  const decided = decidedDeclarations(snapshot).slice(0, 5);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <BoltIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
        {t("tontinePriority.urgencyReview.title")}
        {pending.length > 0 && (
          <span className="rounded-full bg-[#EE7115]/10 px-2 py-0.5 text-[11px] font-bold text-[#EE7115]">{pending.length}</span>
        )}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("tontinePriority.urgencyReview.hint", { hours: URGENCY_REVIEW_HOURS })}</p>

      {pending.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
          {t("tontinePriority.urgencyReview.empty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((record) => (
            <RequestCard key={`${record.key}-${record.submittedAt}`} record={record} />
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("tontinePriority.urgencyReview.recent")}</h3>
          <ul className="mt-2 divide-y divide-gray-100 text-sm">
            {decided.map((record) => (
              <li key={`${record.key}-${record.decidedAt}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-semibold text-gray-800">{record.name}</span>
                <span className="text-xs text-gray-500">
                  {t(`tontinePriority.rows.urgency.${record.category}.label`)} · {day(dayjs(record.decidedAt))} · {record.decidedBy}
                </span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    record.status === "validated" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                  )}
                >
                  {t(`tontinePriority.status.${record.status}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
