// Import Dependencies
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router";

// Local Imports
import { QuizPlayer } from "./QuizPlayer";
import { recordPrerequisiteAttempt } from "./progressStore";

// ----------------------------------------------------------------------

// Écran d'entrée d'une formation qui a un QUIZ DE PRÉ-REQUIS (voir
// quizUtils.js) : tant qu'il n'est pas réussi, le contenu de la formation
// (vidéos, PDF, quiz) reste fermé. Le quiz sert à vérifier que le membre a
// les bases pour suivre la formation ; sous le seuil, il peut le repasser
// autant de fois qu'il veut. Une fois réussi, "Commencer la formation"
// (onStart) ouvre le contenu — la page garde cet écran affiché le temps que
// le membre lise son résultat (voir CoursePage.jsx).
export function PrerequisiteGate({ course, onStart }) {
  const { t } = useTranslation();

  return (
    <>
      <Link
        to="/membre/formation"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {t("membre.formation.course.back")}
      </Link>

      <div className="mx-auto mt-4 max-w-3xl">
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <LockClosedIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-amber-900">{course.name}</h1>
            <p className="mt-0.5 text-sm text-amber-800">{t("membre.formation.quiz.prerequisite.intro")}</p>
          </div>
        </div>

        <div className="mt-5">
          <QuizPlayer
            quiz={course.prerequisiteQuiz}
            variant="prerequisite"
            onResult={(percent, passed) => recordPrerequisiteAttempt(course, percent, passed)}
            onContinue={onStart}
          />
        </div>
      </div>
    </>
  );
}
