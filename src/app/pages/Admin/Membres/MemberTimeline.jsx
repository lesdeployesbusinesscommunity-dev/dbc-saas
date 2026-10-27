// Import Dependencies
import {
  UserPlusIcon,
  PencilSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ScaleIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { useEventDescriber } from "./journalFormat";
import { useMembersFormat } from "./useMembersFormat";

// ----------------------------------------------------------------------

// Icône et couleur par type d'événement.
const EVENT_STYLES = {
  created: { Icon: UserPlusIcon, className: "bg-blue-50 text-[#52A2DF]" },
  updated: { Icon: PencilSquareIcon, className: "bg-gray-100 text-gray-500" },
  levelChanged: { Icon: ArrowsRightLeftIcon, className: "bg-violet-50 text-violet-600" },
  statusChanged: { Icon: CheckCircleIcon, className: "bg-green-50 text-green-600" },
  deleted: { Icon: TrashIcon, className: "bg-red-50 text-red-600" },
  leaderAppointed: { Icon: ShieldCheckIcon, className: "bg-orange-50 text-[#EE7115]" },
  leaderUpdated: { Icon: ShieldCheckIcon, className: "bg-orange-50 text-[#EE7115]" },
  leaderDismissed: { Icon: ShieldExclamationIcon, className: "bg-red-50 text-red-600" },
  priorityRatingRequested: { Icon: ScaleIcon, className: "bg-amber-50 text-amber-600" },
  priorityRated: { Icon: ScaleIcon, className: "bg-green-50 text-green-600" },
  priorityUrgency: { Icon: ScaleIcon, className: "bg-orange-50 text-[#EE7115]" },
  priorityRanked: { Icon: ScaleIcon, className: "bg-violet-50 text-violet-600" },
};

// Une ligne du journal : pastille d'icône, titre, détail, date et auteur.
// "showMember" ajoute le nom et le matricule du membre (journal général) ;
// dans la fiche d'un membre ils sont inutiles.
export function EventItem({ event, showMember = false, onOpenMember }) {
  const { t } = useTranslation();
  const describe = useEventDescriber();
  const { dateTime } = useMembersFormat();
  const { title, detail } = describe(event);
  const style = EVENT_STYLES[event.type] ?? EVENT_STYLES.updated;
  const { Icon } = style;

  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={clsx("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", style.className)}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">
          {showMember && (
            onOpenMember ? (
              <button
                type="button"
                onClick={() => onOpenMember(event.memberId)}
                className="mr-1.5 text-[#52A2DF] hover:underline"
              >
                {event.name}
              </button>
            ) : (
              <span className="mr-1.5">{event.name}</span>
            )
          )}
          <span className={clsx(showMember && "font-medium text-gray-600")}>{title}</span>
        </p>
        {showMember && <p className="text-xs text-gray-400">{event.matricule}</p>}
        {detail && <p className="mt-0.5 text-xs text-gray-500">{detail}</p>}
        <p className="mt-0.5 text-[11px] text-gray-400">
          {dateTime(event.at)}
          {event.by ? ` · ${t("admin.membres.journal.by", { name: event.by })}` : ""}
        </p>
      </div>
    </li>
  );
}

// Chronologie d'un membre (du plus récent au plus ancien).
export function MemberTimeline({ events }) {
  const { t } = useTranslation();
  if (!events.length) {
    return <p className="text-sm text-gray-400">{t("admin.membres.journal.emptyMember")}</p>;
  }
  return (
    <ul className="divide-y divide-gray-50">
      {events.map((event) => (
        <EventItem key={event.id} event={event} />
      ))}
    </ul>
  );
}
