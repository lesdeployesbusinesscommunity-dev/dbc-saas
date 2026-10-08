// Import Dependencies
import dayjs from "dayjs";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

// Local Imports
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { useMemberLevel } from "../../context/MemberLevelContext";
import { useReportMatches } from "../../components/searchSummary";
import { getTrainingsInProgress } from "../mockData";

// ----------------------------------------------------------------------

// "Mes Formation en cours" : les formations du niveau actuellement
// consulté (voir MemberLevelContext — un membre peut cotiser à plusieurs
// niveaux, chacun avec son propre catalogue). Contrairement au carrousel
// compact côté admin (qui ne sert qu'à surveiller l'ensemble du
// catalogue), le membre a besoin de voir d'un coup d'œil où il en est
// dans chaque formation : photo, nom, formateur, date de début, et
// pourcentage d'avancement (calculé à partir des vidéos regardées — voir
// getTrainingProgress dans Admin/Formation/mockData.js). Pas de
// navigation au clic ici : chaque formation ouvre sa page de cours (voir
// Formation/CoursePage.jsx) pour reprendre là où le membre s'était arrêté.
export function TrainingsInProgress({ query = "", onMatches }) {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const allInProgress = getTrainingsInProgress(activeLevelKey);
  const trainingsInProgress = allInProgress.filter(
    (training) =>
      searchTextIncludes(training.name, query) || searchTextIncludes(training.trainer, query),
  );
  useReportMatches(onMatches, "trainings", trainingsInProgress.length);

  // Recherche en cours sans correspondance : la section disparaît.
  if (query.trim() !== "" && trainingsInProgress.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-gray-900">{t("membre.dashboard.trainings.title")}</h2>

      <div className="mt-3 space-y-2.5">
        {trainingsInProgress.length === 0 ? (
          <p className="rounded-2xl bg-[#52A2DF]/[0.1] px-3 py-6 text-center text-xs text-gray-500">
            {t("membre.dashboard.trainings.empty")}
          </p>
        ) : (
          trainingsInProgress.map((training) => (
            <Link
              key={training.id}
              to={`/membre/formation/${training.id}`}
              className="flex items-center gap-3 rounded-2xl bg-[#52A2DF]/[0.1] p-2.5 transition-colors hover:bg-[#52A2DF]/[0.18]"
            >
              <img
                src={training.poster}
                alt=""
                aria-hidden="true"
                className="size-14 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{training.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {t("membre.dashboard.trainings.teacher", { name: training.trainer })}
                </p>
                <p className="truncate text-[11px] text-gray-400">
                  {t("membre.dashboard.trainings.startDate", {
                    date: dayjs(training.startDate).format("DD/MM/YYYY"),
                  })}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#EE7115]"
                    style={{ width: `${training.progress}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-[#EE7115]">
                {training.progress}%
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
