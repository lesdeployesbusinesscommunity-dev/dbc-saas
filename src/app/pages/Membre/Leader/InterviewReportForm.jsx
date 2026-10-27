// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import {
  CheckCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { clearDraft, loadDraft, saveDraft } from "./interviewDraft";
import {
  COMMENT_MAX,
  CRITERIA,
  INTERVIEW_MODES,
  RATINGS,
  REFUSAL_REASONS,
  RED_FLAGS,
  availableDecisions,
  suggestDecision,
} from "./interviewModel";

// ----------------------------------------------------------------------

const RATING_ACTIVE = {
  yes: "border-green-600 bg-green-50 text-green-700",
  medium: "border-amber-500 bg-amber-50 text-amber-700",
  no: "border-red-500 bg-red-50 text-red-600",
};

export function Step({ number, title, hint, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EE7115] text-xs font-bold text-white"
        >
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

// Une case ronde (choix unique) présentée comme une carte.
export function RadioCard({ name, value, checked, onChange, label, hint }) {
  return (
    <label
      className={clsx(
        "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#52A2DF]",
        checked ? "border-[#EE7115] bg-orange-50/70" : "border-gray-200 hover:border-gray-300",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={clsx(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-[#EE7115]" : "border-gray-300",
        )}
      >
        {checked && <span className="size-2 rounded-full bg-[#EE7115]" />}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-gray-900">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

// Une case carrée (choix multiple).
export function CheckCard({ checked, onChange, label, tone = "orange" }) {
  return (
    <label
      className={clsx(
        "relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#52A2DF]",
        checked
          ? tone === "red"
            ? "border-red-400 bg-red-50/70"
            : "border-[#EE7115] bg-orange-50/70"
          : "border-gray-200 hover:border-gray-300",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={clsx(
          "flex size-4 shrink-0 items-center justify-center rounded border-2",
          checked ? (tone === "red" ? "border-red-500 bg-red-500" : "border-[#EE7115] bg-[#EE7115]") : "border-gray-300",
        )}
      >
        {checked && <CheckIcon className="size-3 text-white" />}
      </span>
      <span className="font-medium text-gray-800">{label}</span>
    </label>
  );
}

const toggle = (list, value) => (list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]);

const DECISION_BUTTON = {
  concluant: {
    Icon: CheckCircleIcon,
    enabled: "bg-green-600 text-white hover:bg-green-700",
  },
  nonConcluant: {
    Icon: XCircleIcon,
    enabled: "bg-gray-700 text-white hover:bg-gray-800",
  },
  injoignable: {
    Icon: ExclamationTriangleIcon,
    enabled: "border border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
};

// Le compte-rendu d'entretien, à COCHER (aucun long texte) : comment
// l'échange s'est déroulé, a-t-on joint le candidat, cinq points notés Oui /
// Moyen / Non, les signaux d'alerte, un commentaire d'une ligne facultatif.
// Les trois boutons de décision restent VERROUILLÉS tant que le compte-rendu
// n'est pas assez rempli (voir availableDecisions) : on ne peut pas conclure
// sans l'avoir rempli. L'envoi demande une confirmation, car il ne se défait
// pas. Le brouillon est gardé dans le navigateur (voir interviewDraft.js).
export function InterviewReportForm({ registration, candidateName, onSubmit }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => loadDraft(registration.id));
  const [pending, setPending] = useState(null);

  useEffect(() => {
    saveDraft(registration.id, draft);
  }, [registration.id, draft]);

  const allowed = availableDecisions(draft);
  const suggestion = suggestDecision(draft);
  const set = (changes) => setDraft((current) => ({ ...current, ...changes }));
  const ratedCount = CRITERIA.filter((key) => draft.ratings[key]).length;

  // Ce qu'il reste à faire, pour expliquer pourquoi les boutons sont grisés.
  const missing = [];
  if (!draft.mode) missing.push(t("membre.leader.report.missing.mode"));
  if (draft.reachable === null) missing.push(t("membre.leader.report.missing.reachable"));
  if (draft.reachable === true && ratedCount < CRITERIA.length) {
    missing.push(t("membre.leader.report.missing.criteria", { done: ratedCount, total: CRITERIA.length }));
  }

  const confirm = () => {
    const decision = pending;
    setPending(null);
    onSubmit(draft, decision);
    clearDraft(registration.id);
  };

  return (
    <div className="space-y-4">
      <Step
        number={1}
        title={t("membre.leader.report.mode.title")}
        hint={t("membre.leader.report.mode.hint")}
      >
        <div role="radiogroup" aria-label={t("membre.leader.report.mode.title")} className="grid gap-2.5 sm:grid-cols-3">
          {INTERVIEW_MODES.map((mode) => (
            <RadioCard
              key={mode}
              name="interview-mode"
              value={mode}
              checked={draft.mode === mode}
              onChange={() => set({ mode })}
              label={t(`membre.leader.report.mode.options.${mode}.label`)}
              hint={t(`membre.leader.report.mode.options.${mode}.hint`)}
            />
          ))}
        </div>
      </Step>

      <Step number={2} title={t("membre.leader.report.reachable.title")}>
        <div role="radiogroup" aria-label={t("membre.leader.report.reachable.title")} className="grid gap-2.5 sm:grid-cols-2">
          <RadioCard
            name="interview-reachable"
            value="yes"
            checked={draft.reachable === true}
            onChange={() => set({ reachable: true })}
            label={t("membre.leader.report.reachable.yes")}
          />
          <RadioCard
            name="interview-reachable"
            value="no"
            checked={draft.reachable === false}
            onChange={() => set({ reachable: false })}
            label={t("membre.leader.report.reachable.no")}
          />
        </div>
        {draft.reachable === false && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            {t("membre.leader.report.reachable.noHint")}
          </p>
        )}
      </Step>

      {draft.reachable === true && (
        <>
          <Step
            number={3}
            title={t("membre.leader.report.criteria.title")}
            hint={t("membre.leader.report.criteria.hint")}
          >
            <ul className="space-y-3">
              {CRITERIA.map((key) => (
                <li key={key} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {t(`membre.leader.report.criteria.items.${key}.label`)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t(`membre.leader.report.criteria.items.${key}.hint`)}
                  </p>
                  <div
                    role="radiogroup"
                    aria-label={t(`membre.leader.report.criteria.items.${key}.label`)}
                    className="mt-2.5 flex flex-wrap gap-2"
                  >
                    {RATINGS.map((rating) => {
                      const checked = draft.ratings[key] === rating;
                      return (
                        <label
                          key={rating}
                          className={clsx(
                            "relative flex min-w-20 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-xs font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#52A2DF]",
                            checked ? RATING_ACTIVE[rating] : "border-gray-200 text-gray-500 hover:border-gray-300",
                          )}
                        >
                          <input
                            type="radio"
                            name={`criterion-${key}`}
                            value={rating}
                            checked={checked}
                            onChange={() => set({ ratings: { ...draft.ratings, [key]: rating } })}
                            className="sr-only"
                          />
                          {t(`membre.leader.report.ratings.${rating}`)}
                        </label>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </Step>

          <Step number={4} title={t("membre.leader.report.flags.title")} hint={t("membre.leader.report.flags.hint")}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {RED_FLAGS.map((flag) => (
                <CheckCard
                  key={flag}
                  tone="red"
                  checked={draft.flags.includes(flag)}
                  onChange={() => set({ flags: toggle(draft.flags, flag) })}
                  label={t(`membre.leader.report.flags.items.${flag}`)}
                />
              ))}
            </div>
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
              maxLength={COMMENT_MAX}
              onChange={(event) => set({ comment: event.target.value })}
              placeholder={t("membre.leader.report.comment.placeholder")}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#52A2DF]"
            />
          </label>
          <p className="mt-1 text-right text-[11px] text-gray-400">
            {t("membre.leader.report.comment.counter", { count: draft.comment.length, max: COMMENT_MAX })}
          </p>
        </Step>
      )}

      {allowed.complete && (
        <Step
          number={6}
          title={t("membre.leader.report.reasons.title")}
          hint={t("membre.leader.report.reasons.hint")}
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {REFUSAL_REASONS.map((reason) => (
              <CheckCard
                key={reason}
                checked={draft.reasons.includes(reason)}
                onChange={() => set({ reasons: toggle(draft.reasons, reason) })}
                label={t(`membre.leader.report.reasons.items.${reason}`)}
              />
            ))}
          </div>
        </Step>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900">{t("membre.leader.report.decision.title")}</h3>

        {suggestion && (
          <p data-testid="suggestion" className="mt-2 text-xs text-gray-600">
            {t(`membre.leader.report.suggest.${suggestion}`)}
          </p>
        )}

        {missing.length > 0 && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
            <LockClosedIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
            <span>
              {t("membre.leader.report.missing.title")} {missing.join(" · ")}
            </span>
          </p>
        )}
        {allowed.complete && !allowed.nonConcluant && (
          <p className="mt-2 text-xs text-gray-500">{t("membre.leader.report.missing.reasons")}</p>
        )}

        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
          {Object.entries(DECISION_BUTTON).map(([decision, { Icon, enabled }]) => {
            const ok = allowed[decision];
            return (
              <button
                key={decision}
                type="button"
                disabled={!ok}
                onClick={() => setPending(decision)}
                className={clsx(
                  "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                  ok ? enabled : "cursor-not-allowed bg-gray-100 text-gray-400",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(`membre.leader.report.decision.${decision}`)}
              </button>
            );
          })}
        </div>
      </section>

      <Dialog open={Boolean(pending)} onClose={() => setPending(null)} className="relative z-50">
        <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
          <DialogPanel className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-base font-bold text-gray-900">
              {t("membre.leader.report.confirm.title")}
            </DialogTitle>
            <p className="mt-2 text-sm text-gray-600">
              {pending && t(`membre.leader.report.confirm.${pending}`, { name: candidateName })}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("membre.leader.report.confirm.cancel")}
              </button>
              <button
                type="button"
                onClick={confirm}
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
