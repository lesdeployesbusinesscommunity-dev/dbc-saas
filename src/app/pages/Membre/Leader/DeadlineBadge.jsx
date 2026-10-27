// Import Dependencies
import { useTranslation } from "react-i18next";
import { ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Le délai restant pour rendre le compte-rendu : gris tant qu'il y a du
// temps, orange dans les derniers jours, rouge une fois dépassé. Sert dans
// l'espace leader ET dans la page admin "Inscriptions".
export function DeadlineBadge({ deadline, className }) {
  const { t } = useTranslation();
  if (!deadline) return null;

  const { daysLeft, overdue, soon } = deadline;
  const Icon = overdue ? ExclamationTriangleIcon : ClockIcon;
  const label = overdue
    ? t("membre.leader.deadline.overdue", { count: Math.abs(daysLeft) })
    : daysLeft === 0
      ? t("membre.leader.deadline.today")
      : t("membre.leader.deadline.left", { count: daysLeft });

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        overdue
          ? "bg-red-50 text-red-600 ring-red-200"
          : soon
            ? "bg-orange-50 text-[#EE7115] ring-[#EE7115]/25"
            : "bg-gray-50 text-gray-600 ring-gray-200",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

const STAGE_STYLE = {
  todo: "bg-blue-50 text-[#2f78b0] ring-[#52A2DF]/30",
  unreachable: "bg-amber-50 text-amber-700 ring-amber-300/50",
  done: "bg-green-50 text-green-700 ring-green-600/25",
  refused: "bg-gray-100 text-gray-600 ring-gray-400/30",
};

// L'état de l'entretien d'un dossier (voir interviewStage dans
// interviewModel.js) : à mener, injoignable, concluant, non concluant.
export function InterviewStageBadge({ stage }) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        STAGE_STYLE[stage],
      )}
    >
      {t(`membre.leader.stage.${stage}`)}
    </span>
  );
}
