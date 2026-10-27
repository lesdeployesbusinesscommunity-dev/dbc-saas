// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Avatar } from "../components/Avatar";
import { leaderTitles } from "./leaderData";

// ----------------------------------------------------------------------

const INPUT =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

const todayDate = () => new Date().toISOString().slice(0, 10);

// Nommer un membre leader ("appoint") ou modifier sa fonction en cours
// ("edit"). Le membre peut être imposé (action depuis sa ligne ou sa
// fiche) ou choisi dans la liste des candidats : seuls les membres ACTIFS
// qui n'ont pas déjà une fonction de leader sont proposés.
export function LeaderFormModal({ open, mode = "appoint", member, term, candidates = [], onClose, onSubmit }) {
  const { t } = useTranslation();
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("level");
  const [customTitle, setCustomTitle] = useState("");
  const [scope, setScope] = useState("");
  const [startedAt, setStartedAt] = useState(todayDate());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setMemberId(member?.id ?? "");
    setTitle(term?.title ?? "level");
    setCustomTitle(term?.customTitle ?? "");
    setScope(term?.scope ?? "");
    setStartedAt(term?.startedAt ?? todayDate());
    setNote(term?.note ?? "");
  }, [open, member, term]);

  const isEdit = mode === "edit";
  const chosenMember = member ?? candidates.find((candidate) => candidate.id === memberId) ?? null;
  const titleEntry = leaderTitles.find((item) => item.value === title);
  const noCandidate = !member && candidates.length === 0;
  const canSubmit =
    !!chosenMember &&
    scope.trim() !== "" &&
    startedAt !== "" &&
    (title !== "other" || customTitle.trim() !== "");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      memberId: chosenMember.id,
      title,
      customTitle,
      scope,
      startedAt,
      note,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]">
                <ShieldCheckIcon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900">
                  {isEdit ? t("admin.membres.leaders.form.editTitle") : t("admin.membres.leaders.form.appointTitle")}
                </DialogTitle>
                <p className="text-xs text-gray-500">
                  {isEdit ? t("admin.membres.leaders.form.editHint") : t("admin.membres.leaders.form.appointHint")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {member ? (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                <Avatar name={member.name} size="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.matricule}</p>
                </div>
              </div>
            ) : noCandidate ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                {t("admin.membres.leaders.form.noCandidate")}
              </p>
            ) : (
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.leaders.form.member")}
                <select
                  required
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                  className={INPUT}
                >
                  <option value="">{t("admin.membres.leaders.form.memberPlaceholder")}</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} — {candidate.matricule}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] font-normal text-gray-400">
                  {t("admin.membres.leaders.form.memberHint")}
                </span>
              </label>
            )}

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.leaders.form.function")}
              <select value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT}>
                {leaderTitles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            {title === "other" && (
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.leaders.form.customTitle")}
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                  className={INPUT}
                />
              </label>
            )}

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.leaders.form.scope")}
              <input
                type="text"
                required
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                placeholder={titleEntry ? t(titleEntry.scopeHintKey) : ""}
                className={INPUT}
              />
            </label>

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.leaders.form.startedAt")}
              <input
                type="date"
                required
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                className={INPUT}
              />
            </label>

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.leaders.form.note")}
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("admin.membres.leaders.form.notePlaceholder")}
                className={`${INPUT} resize-none`}
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
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
                className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isEdit ? t("admin.membres.modal.save") : t("admin.membres.leaders.form.appoint")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
