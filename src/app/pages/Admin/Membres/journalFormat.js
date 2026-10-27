// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { statusOptions } from "./mockData";
import { useLeaderLabels } from "./leaderData";

// ----------------------------------------------------------------------
// Texte d'une ligne du journal : un titre court et, si besoin, un détail.
// Partagé par le journal général et la chronologie d'une fiche membre.
export function useEventDescriber() {
  const { t } = useTranslation();
  const { functionLabel, reasonLabel } = useLeaderLabels();

  const levelName = (key) => (key ? t(`simulateur.levels.${key}.name`) : "");
  const statusName = (value) => {
    const option = statusOptions.find((item) => item.value === value);
    return option ? t(option.labelKey) : value;
  };
  const withScope = (data) => {
    const label = functionLabel(data);
    return data.scope ? `${label} · ${data.scope}` : label;
  };

  return (event) => {
    const data = event.data ?? {};
    switch (event.type) {
      case "created":
        return {
          title: t("admin.membres.journal.events.created"),
          detail: data.levelKey ? levelName(data.levelKey) : "",
        };
      case "updated":
        return {
          title: t("admin.membres.journal.events.updated"),
          detail: (data.fields ?? [])
            .map((field) => t(`admin.membres.journal.fields.${field}`))
            .join(", "),
        };
      case "levelChanged":
        return {
          title: t("admin.membres.journal.events.levelChanged"),
          detail: `${levelName(data.from)} → ${levelName(data.to)}`,
        };
      case "statusChanged":
        return {
          title: t("admin.membres.journal.events.statusChanged", { status: statusName(data.to) }),
          detail: `${statusName(data.from)} → ${statusName(data.to)}`,
        };
      case "deleted":
        return { title: t("admin.membres.journal.events.deleted"), detail: "" };
      case "leaderAppointed":
        return {
          title: t("admin.membres.journal.events.leaderAppointed"),
          detail: withScope(data),
        };
      case "leaderUpdated":
        return {
          title: t("admin.membres.journal.events.leaderUpdated"),
          detail: withScope(data),
        };
      case "leaderDismissed": {
        const reason = reasonLabel(data.reason);
        return {
          title: t("admin.membres.journal.events.leaderDismissed"),
          detail: [
            withScope(data),
            `${t("admin.membres.leaders.reasonLabel")} : ${reason}${data.comment ? ` — ${data.comment}` : ""}`,
          ].join(" · "),
        };
      }
      case "priorityRatingRequested":
        return {
          title: t("admin.membres.journal.events.priorityRatingRequested"),
          detail: t("admin.membres.journal.events.priorityRatingRequestedDetail", { name: data.sponsorName }),
        };
      case "priorityRated":
        return {
          title: t("admin.membres.journal.events.priorityRated"),
          detail: t("admin.membres.journal.events.priorityRatedDetail", { average: data.average }),
        };
      case "priorityUrgency":
        return {
          title: t(`admin.membres.journal.events.priorityUrgency_${data.status}`),
          detail: t(`tontinePriority.rows.urgency.${data.category}.label`),
        };
      case "priorityRanked":
        return {
          title: t("admin.membres.journal.events.priorityRanked"),
          detail: t("admin.membres.journal.events.priorityRankedDetail", { rank: data.rank, total: data.total, score: data.score }),
        };
      default:
        return { title: event.type, detail: "" };
    }
  };
}
