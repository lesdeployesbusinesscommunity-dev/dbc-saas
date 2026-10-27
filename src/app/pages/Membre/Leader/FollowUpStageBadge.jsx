// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

const STYLE = {
  todo: "bg-blue-50 text-[#2f78b0] ring-[#52A2DF]/30",
  unreachable: "bg-amber-50 text-amber-700 ring-amber-300/50",
  done: "bg-green-50 text-green-700 ring-green-600/25",
  unassigned: "bg-gray-100 text-gray-600 ring-gray-400/30",
};

// L'état d'un dossier de relance (voir followUpStage dans followUpModel.js).
export function FollowUpStageBadge({ stage }) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        STYLE[stage],
      )}
    >
      {t(`membre.leader.followUp.stage.${stage}`)}
    </span>
  );
}
