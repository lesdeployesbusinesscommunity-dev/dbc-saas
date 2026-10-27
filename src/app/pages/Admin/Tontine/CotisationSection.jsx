// Import Dependencies
import { ChevronDownIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "./LevelBadge";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

const STATE_ORDER = { late: 0, awaiting: 1, paid: 2 };
const VISIBLE_LATE_NAMES = 3;

// Un groupe en cours (ou les membres sans groupe d'un niveau) : l'en-tête
// résume qui a cotisé, et un clic déplie la liste de tous ses membres avec,
// pour chacun, ses mois payés et son état ce mois-ci. "members" est déjà
// filtré par la page (recherche, état) ; "section.members" reste la liste
// complète, pour les chiffres.
export function CotisationSection({ section, members, open, onToggle, dueDate }) {
  const { t, money, monthShort, day } = useTontineFormat();
  const isWaiting = section.kind === "waiting";
  const progress = section.size ? Math.round((section.paid / section.size) * 100) : 0;
  const lateNames = section.members.filter((member) => member.state === "late").map((member) => member.name);
  const rows = [...members].sort(
    (a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.name.localeCompare(b.name),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 p-5 text-left outline-none transition-colors hover:bg-gray-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#52A2DF]/50 sm:px-6"
      >
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge levelKey={section.levelKey} />
            <span className="text-sm font-bold text-gray-900">
              {isWaiting ? t("admin.tontine.tracking.noGroup") : t("admin.tontine.group", { letter: section.letter })}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {isWaiting
              ? t("admin.tontine.tracking.noGroupHint")
              : t("admin.tontine.tracking.tourOf", { tour: section.tour, total: section.totalTours })}
            {" · "}
            {t("admin.tontine.tracking.perMonth", { amount: money(section.cotisation) })}
          </p>
        </div>

        <div className="w-44 shrink-0">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-gray-700">
              {t("admin.tontine.tracking.paidOf", { paid: section.paid, total: section.size })}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={clsx("h-full rounded-full", section.late > 0 ? "bg-red-500" : "bg-green-500")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {section.late > 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              {t("admin.tontine.tracking.lateCount", { count: section.late })}
            </span>
          )}
          {section.awaiting > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {t("admin.tontine.tracking.awaitingCount", { count: section.awaiting })}
            </span>
          )}
          {section.late === 0 && section.awaiting === 0 && (
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              {t("admin.tontine.tracking.allPaid")}
            </span>
          )}
        </div>

        <ChevronDownIcon
          aria-hidden="true"
          className={clsx("size-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")}
        />

        {!open && lateNames.length > 0 && (
          <p className="basis-full truncate text-xs text-red-600">
            {t("admin.tontine.tracking.lateNames", {
              names:
                lateNames.slice(0, VISIBLE_LATE_NAMES).join(", ") +
                (lateNames.length > VISIBLE_LATE_NAMES
                  ? ` ${t("admin.tontine.tracking.more", { count: lateNames.length - VISIBLE_LATE_NAMES })}`
                  : ""),
            })}
          </p>
        )}
      </button>

      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {rows.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 sm:px-6">
              <div className="flex min-w-0 flex-1 basis-52 items-center gap-3">
                <Avatar name={member.name} size="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="truncate text-xs text-gray-500">{member.city}</p>
                </div>
              </div>

              <div
                className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-1 sm:justify-center"
                role="img"
                aria-label={t("admin.tontine.tracking.monthsPaid", {
                  paid: member.paidCount,
                  total: member.history.length,
                })}
              >
                {member.history.map((paid, index) => {
                  const isCurrent = index === member.history.length - 1;
                  const label = monthShort(member.firstMonth.add(index, "month"));
                  return (
                    <span
                      key={index}
                      title={t(paid ? "admin.tontine.tracking.monthPaid" : "admin.tontine.tracking.monthUnpaid", {
                        month: label,
                      })}
                      className={clsx(
                        "size-3.5 shrink-0 rounded-full",
                        paid && "bg-[#52A2DF]",
                        !paid && !isCurrent && "border-2 border-red-300 bg-red-50",
                        !paid && isCurrent && member.state === "late" && "bg-red-500",
                        !paid && isCurrent && member.state === "awaiting" && "bg-amber-400",
                      )}
                    />
                  );
                })}
              </div>

              <div className="w-full shrink-0 sm:w-64 sm:text-right">
                {member.state === "paid" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.tontine.tracking.row.paid")}
                  </span>
                )}
                {member.state === "late" && (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.tontine.tracking.row.late", { days: member.daysLate })}
                    {member.missed > 1 && ` · ${t("admin.tontine.tracking.row.missed", { count: member.missed })}`}
                  </span>
                )}
                {member.state === "awaiting" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    <ClockIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.tontine.tracking.row.awaiting", { date: day(dueDate) })}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
