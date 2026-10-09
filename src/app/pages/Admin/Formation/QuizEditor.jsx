// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import {
  cleanQuiz,
  isQuizValid,
  newQuestion,
  newQuiz,
} from "app/pages/Membre/Formation/quizUtils";

// ----------------------------------------------------------------------

const MAX_OPTIONS = 6;
const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];

// Éditeur de quiz, dans sa propre fenêtre par-dessus la fiche de la
// formation (voir TrainingDetailsModal.jsx). Sert aux deux sortes de quiz :
// le quiz de PRÉ-REQUIS (début de formation) et les quiz de VALIDATION (dans
// un chapitre) — voir Membre/Formation/quizUtils.js pour leur forme, qui est
// exactement ce que l'éditeur produit et ce que le membre voit ensuite
// (Membre/Formation/QuizPlayer.jsx).
//
// Pour chaque question : l'énoncé, 2 à 6 réponses, et une case "bonne
// réponse" à cocher devant chacune. Une seule case cochée = question à
// réponse unique (cases rondes côté membre) ; plusieurs = question à choix
// multiples (le membre doit cocher EXACTEMENT les bonnes). Le quiz n'est
// enregistrable que s'il est complet (voir isQuizValid).
//
// "initial" : le quiz à modifier, ou null pour en créer un nouveau.
export function QuizEditorDialog({ open, initial, heading, onSave, onClose }) {
  const { t } = useTranslation();
  const [quiz, setQuiz] = useState(newQuiz);

  useEffect(() => {
    if (open) setQuiz(initial ? structuredClone(initial) : newQuiz());
  }, [open, initial]);

  const updateQuestion = (index, patch) =>
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) => (i === index ? { ...question, ...patch } : question)),
    }));

  const updateOption = (qIndex, oIndex, text) =>
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((question, i) =>
        i === qIndex
          ? {
              ...question,
              options: question.options.map((option, j) => (j === oIndex ? { ...option, text } : option)),
            }
          : question,
      ),
    }));

  const toggleCorrect = (qIndex, optionId) => {
    const question = quiz.questions[qIndex];
    const correct = question.correct.includes(optionId)
      ? question.correct.filter((id) => id !== optionId)
      : [...question.correct, optionId];
    updateQuestion(qIndex, { correct });
  };

  const addOption = (qIndex) => {
    const question = quiz.questions[qIndex];
    if (question.options.length >= MAX_OPTIONS) return;
    const id = OPTION_IDS.find((candidate) => !question.options.some((option) => option.id === candidate));
    updateQuestion(qIndex, { options: [...question.options, { id, text: "" }] });
  };

  const removeOption = (qIndex, optionId) => {
    const question = quiz.questions[qIndex];
    if (question.options.length <= 2) return;
    updateQuestion(qIndex, {
      options: question.options.filter((option) => option.id !== optionId),
      correct: question.correct.filter((id) => id !== optionId),
    });
  };

  const addQuestion = () => setQuiz((prev) => ({ ...prev, questions: [...prev.questions, newQuestion()] }));

  const removeQuestion = (index) =>
    setQuiz((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));

  const valid = isQuizValid(quiz);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!valid) return;
    onSave(cleanQuiz(quiz));
  };

  const inputClass =
    "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <div aria-hidden="true" className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <DialogTitle className="text-base font-bold text-gray-900">{heading}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.formation.modal.close")}
              className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.formation.quizEditor.title")}
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(event) => setQuiz((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder={t("admin.formation.quizEditor.titlePlaceholder")}
                    className={clsx("mt-1", inputClass)}
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.formation.quizEditor.passingScore")}
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quiz.passingScore}
                    onChange={(event) => setQuiz((prev) => ({ ...prev, passingScore: event.target.value }))}
                    className={clsx("mt-1", inputClass)}
                  />
                </label>
              </div>

              <p className="text-[11px] text-gray-400">{t("admin.formation.quizEditor.correctHint")}</p>

              <div className="space-y-4">
                {quiz.questions.map((question, qIndex) => (
                  <div key={question.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/10 text-xs font-bold text-[#EE7115]">
                        {qIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(event) => updateQuestion(qIndex, { text: event.target.value })}
                        placeholder={t("admin.formation.quizEditor.questionPlaceholder")}
                        aria-label={t("admin.formation.quizEditor.questionLabel", { n: qIndex + 1 })}
                        className={clsx(inputClass, "font-semibold")}
                      />
                      {quiz.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          aria-label={t("admin.formation.quizEditor.removeQuestion")}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        >
                          <XMarkIcon aria-hidden="true" className="size-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 space-y-2 pl-8">
                      {question.options.map((option, oIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={question.correct.includes(option.id)}
                            onChange={() => toggleCorrect(qIndex, option.id)}
                            aria-label={t("admin.formation.quizEditor.correctAnswer", { letter: option.id.toUpperCase() })}
                            title={t("admin.formation.quizEditor.correctAnswer", { letter: option.id.toUpperCase() })}
                            className="size-4 shrink-0 accent-[#16A34A]"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(event) => updateOption(qIndex, oIndex, event.target.value)}
                            placeholder={t("admin.formation.quizEditor.optionPlaceholder", { letter: option.id.toUpperCase() })}
                            className={inputClass}
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, option.id)}
                              aria-label={t("admin.formation.quizEditor.removeOption")}
                              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
                            >
                              <XMarkIcon aria-hidden="true" className="size-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {question.options.length < MAX_OPTIONS && (
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#52A2DF] hover:underline"
                        >
                          <PlusIcon aria-hidden="true" className="size-3.5" />
                          {t("admin.formation.quizEditor.addOption")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                <PlusIcon aria-hidden="true" className="size-3.5" />
                {t("admin.formation.quizEditor.addQuestion")}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-5">
              <p className={clsx("max-w-sm text-[11px]", valid ? "text-transparent" : "text-amber-600")}>
                {t("admin.formation.quizEditor.invalid")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  {t("admin.formation.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!valid}
                  className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("admin.formation.quizEditor.save")}
                </button>
              </div>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
