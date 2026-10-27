// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Avatar } from "../components/Avatar";
import { dismissReasons, useLeaderLabels } from "./leaderData";
import { useMembersFormat } from "./useMembersFormat";

// ----------------------------------------------------------------------

const INPUT =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

const todayDate = () => new Date().toISOString().slice(0, 10);

// Destituer un leader de ses fonctions. Le motif est obligatoire (et un
// commentaire aussi quand le motif est "Autre") : il est gardé dans le
// journal et dans l'historique des leaders.
export function DismissLeaderModal({ open, member, term, onClose, onConfirm }) {
  const { t } = useTranslation();
  const { functionLabel } = useLeaderLabels();
  const { fullDate } = useMembersFormat();
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [endedAt, setEndedAt] = useState(todayDate());

  useEffect(() => {
    if (!open) return;
    setReason("");
    setComment("");
    setEndedAt(todayDate());
  }, [open, term]);

  if (!term || !member) return null;

  const needsComment = reason === "other";
  const canSubmit = reason !== "" && endedAt !== "" && (!needsComment || comment.trim() !== "");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onConfirm({ reason, comment, endedAt });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldExclamationIcon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900">
                {t("admin.membres.leaders.dismiss.title")}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-gray-500">{t("admin.membres.leaders.dismiss.hint")}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
            <Avatar name={member.name} size="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
              <p className="truncate text-xs text-gray-500">
                {functionLabel(term)}
                {term.scope ? ` · ${term.scope}` : ""}
              </p>
              <p className="text-[11px] text-gray-400">
                {t("admin.membres.leaders.since", { date: fullDate(term.startedAt) })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.leaders.dismiss.reason")}
              <select required value={reason} onChange={(event) => setReason(event.target.value)} className={INPUT}>
                <option value="">{t("admin.membres.leaders.dismiss.reasonPlaceholder")}</option>
                {dismissReasons.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-gray-500">
              {needsComment
                ? t("admin.membres.leaders.dismiss.commentRequired")
                : t("admin.membres.leaders.dismiss.comment")}
              <textarea
                rows={3}
                required={needsComment}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className={`${INPUT} resize-none`}
              />
            </label>

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.leaders.dismiss.date")}
              <input
                type="date"
                required
                min={term.startedAt}
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
                className={INPUT}
              />
            </label>

            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {t("admin.membres.leaders.dismiss.notice", { name: member.name })}
            </p>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("admin.membres.modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("admin.membres.leaders.dismiss.confirm")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
