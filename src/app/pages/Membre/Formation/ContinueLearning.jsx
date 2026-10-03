// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { PlayIcon, TrophyIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Bandeau du haut de la page Formation : où reprendre. Il propose la
// formation en cours la plus récemment suivie (même pourcentage que sur
// la carte et sur le Dashboard), sinon d'en commencer une, sinon félicite
// le membre quand tout le niveau est terminé. À côté : 3 compteurs
// (formations du niveau, en cours, terminées).
//
// "items" : [{ course, progress }] pour le niveau consulté.
export function ContinueLearning({ items }) {
  const { t } = useTranslation();

  const inProgress = items
    .filter((item) => item.progress.status === "inProgress")
    .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt);
  const completedCount = items.filter((item) => item.progress.status === "completed").length;
  const featured = inProgress[0];
  const toStart = items.find((item) => item.progress.status === "notStarted");

  const counters = [
    { key: "total", value: items.length },
    { key: "inProgress", value: inProgress.length },
    { key: "completed", value: completedCount },
  ];

  let body;
  if (featured) {
    body = (
      <>
        <p className="text-xs font-bold uppercase tracking-wide text-white/70">{t("membre.formation.continue.title")}</p>
        <p className="mt-1 text-xl font-bold">{featured.course.name}</p>
        <p className="mt-1 text-sm text-white/80">
          {t("membre.formation.continue.next", { title: featured.progress.resumeLesson?.title })}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${featured.progress.percent}%` }} />
          </div>
          <span className="text-sm font-bold">{featured.progress.percent}%</span>
        </div>
        <Link
          to={`/membre/formation/${featured.course.id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2f78b4] transition-opacity hover:opacity-90"
        >
          <PlayIcon aria-hidden="true" className="size-4" />
          {t("membre.formation.continue.resume")}
        </Link>
      </>
    );
  } else if (toStart) {
    body = (
      <>
        <p className="flex items-center gap-2 text-xl font-bold">
          <RocketLaunchIcon aria-hidden="true" className="size-6" />
          {t("membre.formation.continue.none")}
        </p>
        <p className="mt-1 text-sm text-white/80">{t("membre.formation.continue.noneHint")}</p>
        <Link
          to={`/membre/formation/${toStart.course.id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2f78b4] transition-opacity hover:opacity-90"
        >
          <PlayIcon aria-hidden="true" className="size-4" />
          {toStart.course.name}
        </Link>
      </>
    );
  } else if (items.length > 0) {
    body = (
      <>
        <p className="flex items-center gap-2 text-xl font-bold">
          <TrophyIcon aria-hidden="true" className="size-6" />
          {t("membre.formation.continue.allDone")}
        </p>
        <p className="mt-1 text-sm text-white/80">{t("membre.formation.continue.allDoneHint")}</p>
      </>
    );
  } else {
    body = <p className="text-base font-semibold">{t("membre.formation.empty")}</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-[#52A2DF] to-[#3d6fb0] p-6 text-white shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">{body}</div>
      <dl className="grid shrink-0 grid-cols-3 gap-3">
        {counters.map(({ key, value }) => (
          <div key={key} className="min-w-24 rounded-2xl bg-white/15 px-4 py-3 text-center">
            <dd className="text-2xl font-bold">{value}</dd>
            <dt className="text-[11px] font-medium text-white/80">{t(`membre.formation.stats.${key}`)}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
