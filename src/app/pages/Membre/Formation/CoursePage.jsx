// Import Dependencies
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BackwardIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ForwardIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TrophyIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { getDomain } from "./domains";
import { getCourseById } from "./mockData";
import {
  getCourseProgress,
  isCourseRewarded,
  isPrerequisitePassed,
  markLessonWatched,
  recordQuizAttempt,
  resetCourse,
  useProgressState,
  useRewards,
} from "./progressStore";
import { VideoPlayer } from "./VideoPlayer";
import { PdfViewer } from "./PdfViewer";
import { QuizPlayer } from "./QuizPlayer";
import { PrerequisiteGate } from "./PrerequisiteGate";
import { ChapterList } from "./ChapterList";
import { CoursePdfCard } from "./CoursePdfCard";

// ----------------------------------------------------------------------

// Page d'une formation (/membre/formation/:trainingId), ouverte par le
// bouton "Commencer la formation" du catalogue (voir TrainingCard.jsx) :
// la leçon en cours à gauche, et à droite les chapitres avec leurs leçons.
// Une leçon est une VIDÉO (lecteur sans téléchargement, voir
// VideoPlayer.jsx), un support PDF (téléchargeable, voir PdfViewer.jsx) ou
// un QUIZ de validation (voir QuizPlayer.jsx) — un quiz réussi termine la
// leçon. Le pourcentage en haut monte au fur et à mesure que le membre
// termine ses leçons (voir progressStore.js) ; à la fin d'une vidéo on
// enchaîne sur la suivante. À l'ouverture, on reprend là où il s'était
// arrêté.
//
// À droite, au-dessus des chapitres, le SUPPORT DE COURS COMPLET : un PDF
// téléchargeable qui regroupe tous les chapitres (voir CoursePdfCard.jsx), en
// plus des vidéos.
//
// Si la formation a un QUIZ DE PRÉ-REQUIS (voir PrerequisiteGate.jsx), il
// s'affiche d'abord et le contenu reste fermé tant qu'il n'est pas réussi.
//
// Un membre ne peut ouvrir que les formations des niveaux auxquels il
// cotise (currentMember.levelKeys) — comme le catalogue, qui ne montre que
// celles du niveau consulté.
function Notice({ Icon, title, text }) {
  const { t } = useTranslation();
  return (
    <div className="mt-8 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm">
      <Icon aria-hidden="true" className="mx-auto size-10 text-gray-300" />
      <h2 className="mt-3 text-base font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
      <Link
        to="/membre/formation"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {t("membre.formation.course.back")}
      </Link>
    </div>
  );
}

function CourseView({ course }) {
  const { t } = useTranslation();
  const progressState = useProgressState();
  const progress = getCourseProgress(course, progressState);
  const rewards = useRewards();
  const rewarded = isCourseRewarded(course, rewards);
  const [currentId, setCurrentId] = useState(
    () => getCourseProgress(course).resumeLesson?.id ?? course.lessons[0]?.id,
  );
  const [autoPlay, setAutoPlay] = useState(false);
  // Écran du quiz de pré-requis : ouvert à l'arrivée si le quiz n'est pas
  // réussi, puis refermé par "Commencer la formation" (pas dès la réussite,
  // pour laisser le membre lire son résultat).
  const [gateOpen, setGateOpen] = useState(() => !isPrerequisitePassed(course));

  const lessons = course.lessons;
  const index = Math.max(0, lessons.findIndex((lesson) => lesson.id === currentId));
  const lesson = lessons[index];
  const chapter = course.chapters.find((entry) => entry.lessons.some((l) => l.id === lesson?.id));
  const domain = getDomain(course.domainKey);
  const DomainIcon = domain.Icon;
  const completed = progress.status === "completed";

  const select = (lessonId, shouldAutoPlay = false) => {
    setCurrentId(lessonId);
    setAutoPlay(shouldAutoPlay);
  };

  if (gateOpen) {
    return <PrerequisiteGate course={course} onStart={() => setGateOpen(false)} />;
  }

  if (!lesson) {
    return <Notice Icon={LockClosedIcon} title={course.name} text={t("membre.formation.course.noVideo")} />;
  }

  return (
    <>
      <Link
        to="/membre/formation"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {t("membre.formation.course.back")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", domain.chipClass)}>
            <DomainIcon aria-hidden="true" className="size-3.5" />
            {t(`membre.formation.domains.${course.domainKey}`)}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{course.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <UserIcon aria-hidden="true" className="size-4" />
            {t("membre.formation.card.trainer", { name: course.trainer })} · {course.duration}
          </p>
        </div>

        <div className="w-full max-w-xs rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t("membre.formation.card.progress")}</span>
            <span className={clsx("text-xl font-bold", completed ? "text-green-600" : "text-[#EE7115]")}>
              {progress.percent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("membre.formation.card.progress")}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100"
          >
            <div
              className={clsx("h-full rounded-full transition-all duration-500", completed ? "bg-green-500" : "bg-[#EE7115]")}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {t("membre.formation.course.progressDetail", { count: progress.watched, total: progress.total })}
          </p>
          <p
            className={clsx(
              "mt-3 flex items-center gap-1.5 text-xs font-bold",
              rewarded ? "text-green-700" : "text-[#EE7115]",
            )}
          >
            <CircleStackIcon aria-hidden="true" className="size-4 shrink-0" />
            {t(rewarded ? "membre.formation.course.coinsEarned" : "membre.formation.course.coinsToEarn", {
              coins: course.coinsReward,
            })}
          </p>
        </div>
      </div>

      {completed && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
          <div className="flex items-center gap-3">
            <TrophyIcon aria-hidden="true" className="size-8 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-800">{t("membre.formation.course.completedTitle")}</p>
              <p className="text-xs text-green-700">{t("membre.formation.course.completedText", { name: course.name })}</p>
              {rewards[course.id] && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-green-800">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-green-200">
                    <CircleStackIcon aria-hidden="true" className="size-3.5" />
                    {t("membre.coins.earn.amount", { amount: rewards[course.id].coins })}
                  </span>
                  <Link to="/membre/coins" className="underline underline-offset-2 hover:text-green-900">
                    {t("membre.formation.course.seeCoins")}
                  </Link>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetCourse(course);
              select(course.lessons[0].id);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100"
          >
            <ArrowPathIcon aria-hidden="true" className="size-4" />
            {t("membre.formation.course.restart")}
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {lesson.type === "pdf" ? (
            <PdfViewer
              key={lesson.id}
              lesson={lesson}
              onOpened={() => markLessonWatched(course, lesson.id)}
            />
          ) : lesson.type === "quiz" ? (
            <QuizPlayer
              key={lesson.id}
              quiz={lesson.quiz}
              alreadyPassed={progress.watchedIds.has(lesson.id)}
              bestPercent={progress.quizzes[lesson.id]?.best ?? null}
              onResult={(percent, passed) => recordQuizAttempt(course, lesson.id, percent, passed)}
              onContinue={index < lessons.length - 1 ? () => select(lessons[index + 1].id) : undefined}
            />
          ) : (
            <>
              <VideoPlayer
                key={lesson.id}
                course={course}
                lesson={lesson}
                startAt={progress.positions[lesson.id] ?? 0}
                autoPlay={autoPlay}
                onEnded={() => {
                  const next = lessons[index + 1];
                  if (next) select(next.id, true);
                }}
              />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheckIcon aria-hidden="true" className="size-4 shrink-0" />
                {t("membre.formation.course.videoOnlyHint")}
              </p>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400">
                {chapter?.title} · {t("membre.formation.course.lessonOf", { n: index + 1, total: lessons.length })}
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-gray-900">{lesson.title}</h2>
            </div>

            {progress.watchedIds.has(lesson.id) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                <CheckCircleIcon aria-hidden="true" className="size-4" />
                {t(lesson.type === "quiz" ? "membre.formation.course.quizDone" : "membre.formation.course.done")}
              </span>
            ) : lesson.type === "quiz" ? null : (
              <button
                type="button"
                onClick={() => markLessonWatched(course, lesson.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                <CheckCircleIcon aria-hidden="true" className="size-4" />
                {t("membre.formation.course.markDone")}
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => select(lessons[index - 1].id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BackwardIcon aria-hidden="true" className="size-4" />
              {t("membre.formation.course.prev")}
            </button>
            <button
              type="button"
              disabled={index === lessons.length - 1}
              onClick={() => select(lessons[index + 1].id, true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("membre.formation.course.next")}
              <ForwardIcon aria-hidden="true" className="size-4" />
            </button>
          </div>

          <section className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("membre.formation.course.about")}</h2>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">
              {t("membre.formation.course.objectives")}
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
              {course.objectives.map((objective) => (
                <li key={objective} className="flex gap-2">
                  <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#52A2DF]" />
                  {objective}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
              {t("membre.formation.course.outcomes")}
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#EE7115]" />
                  {outcome}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside>
          {course.coursePdf && <CoursePdfCard coursePdf={course.coursePdf} />}
          <h2 className="mb-3 text-base font-bold text-gray-900">{t("membre.formation.course.contentTitle")}</h2>
          <ChapterList
            course={course}
            progress={progress}
            currentLessonId={lesson.id}
            onSelect={(lessonId) => select(lessonId, true)}
          />
        </aside>
      </div>
    </>
  );
}

export default function MembreCoursePage() {
  const { t } = useTranslation();
  const { trainingId } = useParams();
  const course = getCourseById(trainingId);
  const hasLevel = course && currentMember.levelKeys.includes(course.levelKey);

  return (
    <Page title={`${course?.name ?? t("membre.nav.formation")} – ${currentMember.name}`}>
      <div className="p-6 pb-12 lg:p-8">
        {!course ? (
          <Notice Icon={LockClosedIcon} title={t("membre.formation.course.notFound.title")} text={t("membre.formation.course.notFound.text")} />
        ) : !hasLevel ? (
          <Notice Icon={LockClosedIcon} title={t("membre.formation.course.locked.title")} text={t("membre.formation.course.locked.text")} />
        ) : (
          <CourseView key={course.id} course={course} />
        )}
      </div>
    </Page>
  );
}
