// Import Dependencies
import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

// Local Imports
import {
  FOLLOW_UP_CAUSES,
  FOLLOW_UP_COMMENT_MAX,
  FOLLOW_UP_MODES,
  FOLLOW_UP_SOLUTIONS,
  emptyFollowUpDraft,
  followUpReady,
} from "app/pages/Admin/Tontine/followUpModel";
import { RadioCard, Step } from "./InterviewReportForm";

// ----------------------------------------------------------------------

// Le rapport de relance, à COCHER (comme le compte-rendu d'entretien d'une
// inscription : voir InterviewReportForm.jsx) : comment on a contacté le
// membre, l'a-t-on joint, pourquoi il est en retard, la solution convenue, un
// commentaire d'une ligne. Le bouton d'envoi reste verrouillé tant que ce
// n'est pas assez rempli, et l'envoi demande une confirmation.
export function FollowUpReportForm({ memberName, onSubmit }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(emptyFollowUpDraft);
  const [confirming, setConfirming] = useState(false);
  const set = (changes) => setDraft((current) => ({ ...current, ...changes }));
  const ready = followUpReady(draft);

  const send = () => {
    setConfirming(false);
    onSubmit(draft);
  };

  return (
    <div className="space-y-4">
      <Step number={1} title={t("membre.leader.report.mode.title")} hint={t("membre.leader.followUp.form.modeHint")}>
        <div role="radiogroup" aria-label={t("membre.leader.report.mode.title")} className="grid gap-2.5 sm:grid-cols-3">
          {FOLLOW_UP_MODES.map((mode) => (
            <RadioCard
              key={mode}
              name="followup-mode"
              value={mode}
              checked={draft.mode === mode}
              onChange={() => set({ mode })}
              label={t(`membre.leader.report.mode.options.${mode}.label`)}
              hint={t(`membre.leader.report.mode.options.${mode}.hint`)}
            />
          ))}
        </div>
      </Step>

      <Step number={2} title={t("membre.leader.followUp.form.reachableTitle")}>
        <div role="radiogroup" aria-label={t("membre.leader.followUp.form.reachableTitle")} className="grid gap-2.5 sm:grid-cols-2">
          <RadioCard
            name="followup-reachable"
            value="yes"
            checked={draft.reachable === true}
            onChange={() => set({ reachable: true })}
            label={t("membre.leader.report.reachable.yes")}
          />
          <RadioCard
            name="followup-reachable"
            value="no"
            checked={draft.reachable === false}
            onChange={() => set({ reachable: false })}
            label={t("membre.leader.report.reachable.no")}
          />
        </div>
        {draft.reachable === false && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            {t("membre.leader.followUp.form.unreachableHint")}
          </p>
        )}
      </Step>

      {draft.reachable === true && (
        <>
          <Step number={3} title={t("membre.leader.followUp.form.causeTitle")} hint={t("membre.leader.followUp.form.causeHint")}>
            <div role="radiogroup" aria-label={t("membre.leader.followUp.form.causeTitle")} className="grid gap-2.5 sm:grid-cols-2">
              {FOLLOW_UP_CAUSES.map((cause) => (
                <RadioCard
                  key={cause}
                  name="followup-cause"
                  value={cause}
                  checked={draft.cause === cause}
                  onChange={() => set({ cause })}
                  label={t(`membre.leader.followUp.causes.${cause}`)}
                />
              ))}
            </div>
          </Step>

          <Step number={4} title={t("membre.leader.followUp.form.solutionTitle")} hint={t("membre.leader.followUp.form.solutionHint")}>
            <div role="radiogroup" aria-label={t("membre.leader.followUp.form.solutionTitle")} className="grid gap-2.5 sm:grid-cols-2">
              {FOLLOW_UP_SOLUTIONS.map((solution) => (
                <RadioCard
                  key={solution}
                  name="followup-solution"
                  value={solution}
                  checked={draft.solution === solution}
                  onChange={() => set({ solution })}
                  label={t(`membre.leader.followUp.solutions.${solution}.label`)}
                  hint={t(`membre.leader.followUp.solutions.${solution}.hint`)}
                />
              ))}
            </div>
            {draft.solution && draft.solution !== "none" && (
              <label className="mt-3.5 block text-xs font-semibold text-gray-500">
                {t("membre.leader.followUp.form.promiseDate")}
                <input
                  type="date"
                  value={draft.promiseDate}
                  onChange={(event) => set({ promiseDate: event.target.value })}
                  className="mt-1 block w-full max-w-xs rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                />
              </label>
            )}
          </Step>
        </>
      )}

      {draft.mode && draft.reachable !== null && (
        <Step number={draft.reachable ? 5 : 3} title={t("membre.leader.report.comment.title")}>
          <label className="block">
            <span className="sr-only">{t("membre.leader.report.comment.title")}</span>
            <input
              type="text"
              value={draft.comment}
              maxLength={FOLLOW_UP_COMMENT_MAX}
              onChange={(event) => set({ comment: event.target.value })}
              placeholder={t("membre.leader.report.comment.placeholder")}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#52A2DF]"
            />
          </label>
          <p className="mt-1 text-right text-[11px] text-gray-400">
            {t("membre.leader.report.comment.counter", { count: draft.comment.length, max: FOLLOW_UP_COMMENT_MAX })}
          </p>
        </Step>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        <p className="text-xs text-gray-500">
          {ready ? t("membre.leader.followUp.form.readyHint") : t("membre.leader.followUp.form.missing")}
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#EE7115] px-5 py-3 text-sm font-bold text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          <PaperAirplaneIcon aria-hidden="true" className="size-4" />
          {t("membre.leader.followUp.form.send")}
        </button>
      </div>

      <Dialog open={confirming} onClose={() => setConfirming(false)} className="relative z-50">
        <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
          <DialogPanel className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-base font-bold text-gray-900">
              {t("membre.leader.followUp.confirm.title")}
            </DialogTitle>
            <p className="mt-2 text-sm text-gray-600">
              {t(`membre.leader.followUp.confirm.${draft.reachable ? "reached" : "unreachable"}`, { name: memberName })}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("membre.leader.report.confirm.cancel")}
              </button>
              <button
                type="button"
                onClick={send}
                className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                {t("membre.leader.report.confirm.send")}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
