// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Une carte de formation — inspirée des catalogues des plateformes de
// formation en ligne les plus reconnues (Coursera, Udemy, LinkedIn
// Learning...) : affiche en haut, badge du niveau en overlay, titre,
// formateur, date de début + durée, puis une barre d'avancement en bas
// de carte (comme "Continuer" sur Coursera/LinkedIn Learning) plutôt
// qu'une simple liste de texte. La carte entière est cliquable : elle
// ouvre la fiche détaillée de la formation (objectifs + chapitres — voir
// TrainingDetailsModal.jsx).
export function TrainingCard({ training, level, onClick }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  const formattedDate = new Date(training.startDate).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isComplete = training.progress >= 100;
  const barColorClass = isComplete
    ? "bg-[#16A34A]"
    : training.progress > 0
      ? "bg-[#52A2DF]"
      : "bg-gray-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF]"
    >
      <div className="relative h-36 w-full">
        <img src={training.poster} alt="" aria-hidden="true" className="size-full object-cover" />
        <span
          className={clsx(
            "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold shadow-sm",
            level.borderClass,
            level.textClass,
          )}
        >
          <level.Icon aria-hidden="true" className="size-3" />
          {t(`simulateur.levels.${level.key}.name`)}
        </span>
        {isComplete && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#16A34A] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            <CheckCircleIcon aria-hidden="true" className="size-3" />
            {t("admin.formation.completed")}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-gray-900">{training.name}</h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <AcademicCapIcon aria-hidden="true" className="size-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{training.trainer}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon aria-hidden="true" className="size-3.5 text-gray-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon aria-hidden="true" className="size-3.5 text-gray-400" />
            {training.duration}
          </span>
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span>{t("admin.formation.progress")}</span>
            <span className={isComplete ? "text-[#16A34A]" : "text-gray-700"}>
              {training.progress}%
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={clsx("h-full rounded-full transition-all", barColorClass)}
              style={{ width: `${training.progress}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
