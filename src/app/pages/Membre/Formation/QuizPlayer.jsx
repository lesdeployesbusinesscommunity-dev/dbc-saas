// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { DEFAULT_PASSING_SCORE, isMultipleChoice, scoreQuiz } from "./quizUtils";

// ----------------------------------------------------------------------

// Un quiz (voir quizUtils.js pour sa forme), utilisé pour les deux sortes
// de quiz d'une formation :
// - "validation" (dans un chapitre) : le réussir termine l'étape ; le
//   bouton "continuer" mène à la leçon suivante ;
// - "prerequisite" (au tout début) : le réussir ouvre la formation ; le
//   bouton "continuer" la démarre.
//
// Déroulé : le membre répond à toutes les questions (une réponse unique =
// cases rondes, plusieurs bonnes réponses = cases à cocher), valide, et voit
// son score avec la correction : pour chaque réponse fausse, la bonne
// réponse est indiquée. Sous le seuil de réussite, "Réessayer" remet le quiz
// à zéro ; il n'y a pas de limite d'essais. "onResult(percent, passed)" est
// appelé UNE fois à chaque validation, pour que la page enregistre le
// résultat (voir progressStore.js).
//
// "alreadyPassed" : le quiz a déjà été réussi (ou fait partie de
// l'avancement de départ) — on le dit et on propose de le repasser plutôt
// que de redemander toutes les réponses.
export function QuizPlayer({
  quiz,
  variant = "validation",
  alreadyPassed = false,
  bestPercent = null,
  onResult,
  onContinue,
}) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [retaking, setRetaking] = useState(false);

  const passingScore = quiz.passingScore ?? DEFAULT_PASSING_SCORE;
  const allAnswered = quiz.questions.every((question) => (answers[question.id] ?? []).length > 0);

  const toggle = (question, optionId) => {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (!isMultipleChoice(question)) return { ...prev, [question.id]: [optionId] };
      return {
        ...prev,
        [question.id]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const scored = scoreQuiz(quiz, answers);
    setResult(scored);
    onResult?.(scored.percent, scored.passed);
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setRetaking(true);
  };

  if (alreadyPassed && !result && !retaking) {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircleIcon aria-hidden="true" className="mx-auto size-10 text-green-600" />
        <p className="mt-2 text-base font-bold text-green-800">{t("membre.formation.quiz.alreadyPassed")}</p>
        {bestPercent != null && (
          <p className="mt-1 text-sm text-green-700">{t("membre.formation.quiz.bestScore", { percent: bestPercent })}</p>
        )}
        <button
          type="button"
          onClick={() => setRetaking(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100"
        >
          <ArrowPathIcon aria-hidden="true" className="size-4" />
          {t("membre.formation.quiz.retake")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/10 text-[#EE7115]">
          <ClipboardDocumentCheckIcon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{quiz.title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {t("membre.formation.quiz.questionCount", { count: quiz.questions.length })} ·{" "}
            {t("membre.formation.quiz.passingScore", { percent: passingScore })}
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-6">
        {quiz.questions.map((question, index) => {
          const multiple = isMultipleChoice(question);
          const given = answers[question.id] ?? [];
          const correct = result?.results[question.id];

          return (
            <li key={question.id}>
              <fieldset disabled={Boolean(result)}>
                <legend className="text-sm font-semibold text-gray-900">
                  <span className="mr-1.5 text-[#EE7115]">{index + 1}.</span>
                  {question.text}
                </legend>
                {multiple && (
                  <p className="mt-0.5 text-xs text-gray-400">{t("membre.formation.quiz.multipleHint")}</p>
                )}
                <div className="mt-2 space-y-2">
                  {question.options.map((option) => {
                    const checked = given.includes(option.id);
                    const isRight = question.correct.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={clsx(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                          result
                            ? isRight
                              ? "border-green-300 bg-green-50 text-green-800"
                              : checked
                                ? "border-red-300 bg-red-50 text-red-800"
                                : "border-gray-100 text-gray-500"
                            : checked
                              ? "border-[#EE7115] bg-[#EE7115]/[0.06] text-gray-900"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50",
                          result && "cursor-default",
                        )}
                      >
                        <input
                          type={multiple ? "checkbox" : "radio"}
                          name={`${quiz.id}-${question.id}`}
                          checked={checked}
                          onChange={() => toggle(question, option.id)}
                          className="size-4 shrink-0 accent-[#EE7115]"
                        />
                        <span className="min-w-0 flex-1">{option.text}</span>
                        {result && isRight && (
                          <CheckCircleIcon aria-label={t("membre.formation.quiz.goodAnswer")} className="size-5 shrink-0 text-green-600" />
                        )}
                        {result && checked && !isRight && (
                          <XCircleIcon aria-label={t("membre.formation.quiz.wrongAnswer")} className="size-5 shrink-0 text-red-500" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {result && (
                  <p className={clsx("mt-2 text-xs font-bold", correct ? "text-green-700" : "text-red-600")}>
                    {t(correct ? "membre.formation.quiz.questionRight" : "membre.formation.quiz.questionWrong")}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {result ? (
        <div
          role="status"
          className={clsx(
            "mt-8 rounded-2xl p-5",
            result.passed ? "bg-green-50 ring-1 ring-green-200" : "bg-red-50 ring-1 ring-red-200",
          )}
        >
          <p className={clsx("text-base font-bold", result.passed ? "text-green-800" : "text-red-700")}>
            {t("membre.formation.quiz.score", {
              percent: result.percent,
              correct: result.correctCount,
              total: result.total,
            })}
          </p>
          <p className={clsx("mt-1 text-sm", result.passed ? "text-green-700" : "text-red-700")}>
            {t(`membre.formation.quiz.${variant}.${result.passed ? "passed" : "failed"}`, { percent: passingScore })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.passed ? (
              onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t(`membre.formation.quiz.${variant}.continue`)}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <ArrowPathIcon aria-hidden="true" className="size-4" />
                {t("membre.formation.quiz.retry")}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400">{allAnswered ? "" : t("membre.formation.quiz.answerAll")}</p>
          <button
            type="submit"
            disabled={!allAnswered}
            className="rounded-xl bg-[#EE7115] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("membre.formation.quiz.submit")}
          </button>
        </div>
      )}
    </form>
  );
}
