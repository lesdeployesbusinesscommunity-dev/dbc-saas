// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  PlayIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { getDomain } from "./domains";
import { isPrerequisitePassed } from "./progressStore";

// ----------------------------------------------------------------------

// Carte d'une formation dans le catalogue du membre. Contrairement à la
// carte côté admin (informative, voir Admin/Formation/TrainingCard.jsx),
// elle mène à la formation elle-même : le bouton ("Commencer la
// formation", puis "Continuer" une fois commencée, "Revoir" une fois
// terminée) ouvre la page de cours (CoursePage.jsx), avec les chapitres et
// les vidéos. La barre et le pourcentage viennent de "progress" (voir
// progressStore.js : "getCourseProgress"). La pastille de Coins montre ce
// que rapporte la formation une fois terminée ("rewarded" : déjà gagnés).
export function TrainingCard({ course, progress, rewarded }) {
  const { t } = useTranslation();
  const domain = getDomain(course.domainKey);
  const DomainIcon = domain.Icon;
  const ctaKey = progress.status === "notStarted" ? "start" : progress.status === "completed" ? "review" : "continue";
  const CtaIcon = progress.status === "completed" ? ArrowPathIcon : PlayIcon;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
      <div className="relative">
        <img src={course.poster} alt="" aria-hidden="true" className="h-36 w-full bg-[#52A2DF]/10 object-cover" />
        <span
          className={clsx(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm",
            domain.chipClass,
          )}
        >
          <DomainIcon aria-hidden="true" className="size-3.5" />
          {t(`membre.formation.domains.${course.domainKey}`)}
        </span>
        <span
          className={clsx(
            "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm",
            progress.status === "completed" ? "bg-green-100 text-green-700" : "bg-white text-gray-600",
            progress.status === "inProgress" && "text-[#EE7115]",
          )}
        >
          {progress.status === "completed" && <CheckCircleIcon aria-hidden="true" className="size-3.5" />}
          {t(`membre.formation.card.status.${progress.status}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-gray-900">{course.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
          <UserIcon aria-hidden="true" className="size-3.5" />
          {t("membre.formation.card.trainer", { name: course.trainer })}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          <ClockIcon aria-hidden="true" className="size-3.5" />
          {course.duration} · {t("membre.formation.card.chapters", { count: course.chapters.length })} ·{" "}
          {t("membre.formation.card.lessons", { count: course.lessons.length })}
        </p>

        <p
          className={clsx(
            "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
            rewarded ? "bg-green-50 text-green-700" : "bg-[#EE7115]/10 text-[#EE7115]",
          )}
        >
          <CircleStackIcon aria-hidden="true" className="size-3.5" />
          {t(rewarded ? "membre.formation.card.coinsEarned" : "membre.formation.card.coinsToEarn", {
            coins: course.coinsReward,
          })}
        </p>

        {course.prerequisiteQuiz && !isPrerequisitePassed(course) && (
          <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <ClipboardDocumentCheckIcon aria-hidden="true" className="size-3.5" />
            {t("membre.formation.card.prerequisite")}
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-500">{t("membre.formation.card.progress")}</span>
            <span className={progress.status === "completed" ? "text-green-600" : "text-[#EE7115]"}>
              {progress.percent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${course.name} — ${t("membre.formation.card.progress")}`}
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100"
          >
            <div
              className={clsx("h-full rounded-full", progress.status === "completed" ? "bg-green-500" : "bg-[#EE7115]")}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <Link
          to={`/membre/formation/${course.id}`}
          className={clsx(
            "mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90",
            progress.status === "completed"
              ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              : "bg-[#EE7115] text-white",
          )}
        >
          <CtaIcon aria-hidden="true" className="size-4" />
          {t(`membre.formation.card.${ctaKey}`)}
        </Link>
      </div>
    </article>
  );
}
