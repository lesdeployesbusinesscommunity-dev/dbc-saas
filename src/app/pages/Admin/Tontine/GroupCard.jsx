// Import Dependencies
import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "./LevelBadge";
import { GroupStatusBadge } from "./GroupStatusBadge";
import { getGroupHealth } from "./mockData";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

const BAR_COLORS = {
  late: "bg-red-500",
  awaiting: "bg-amber-500",
  ok: "bg-green-600",
};

// Une carte par groupe : son niveau, où il en est dans son cycle, qui reçoit la cagnotte ce mois-ci (3 personnes) et combien de
// cotisations sont rentrées. Un clic ouvre la fiche détaillée du groupe.
export function GroupCard({ group, onOpen }) {
  const { t, money, month, monthName } = useTontineFormat();
  const health = getGroupHealth(group);
  const isRunning = group.status === "running";
  const percent = isRunning && group.size > 0 ? Math.round((group.paidCount / group.size) * 100) : 0;
  // Le premier mois qui a un membre (un groupe à places peut avoir des mois libres).
  const first = group.schedule.find((entry) => !entry.free) ?? group.schedule[0];

  return (
    <button
      type="button"
      onClick={() => onOpen(group.id)}
      className="group flex h-full w-full flex-col rounded-2xl border border-black/5 bg-white p-5 text-left shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#EE7115]/40"
      aria-label={t("admin.tontine.openGroup", {
        letter: group.letter,
        level: t(`simulateur.levels.${group.levelKey}.name`),
      })}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LevelBadge levelKey={group.levelKey} />
          <span className="text-sm font-bold text-gray-900">{t("admin.tontine.group", { letter: group.letter })}</span>
        </div>
        <GroupStatusBadge group={group} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>{t("admin.tontine.cycle")}</span>
          <span>
            {group.status === "pending"
              ? t("admin.tontine.startsIn", { month: month(group.startMonth) })
              : t("admin.tontine.tourOf", { tour: group.tour, total: group.totalTours })}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#52A2DF]"
            style={{ width: `${(group.tour / group.totalTours) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#EE7115]/[0.06] p-3">
        {isRunning && group.beneficiaries.length > 0 ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#EE7115]">
                {t("admin.tontine.receivesThisMonth", { count: group.beneficiaries.length })}
              </p>
              <p className="shrink-0 text-xs font-bold text-gray-900">
                {t("admin.tontine.potEach", { amount: money(group.payout.amount) })}
              </p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {group.beneficiaries.map((beneficiary) => (
                <li key={beneficiary.id} className="flex items-center gap-2.5">
                  <Avatar name={beneficiary.name} size="size-7" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{beneficiary.name}</span>
                  {beneficiary.payoutDate && (
                    <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0 text-green-600" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : isRunning ? (
          <p className="text-sm font-medium text-gray-600">{t("admin.tontine.freeThisMonth")}</p>
        ) : group.status === "pending" && first.free ? (
          <p className="text-sm font-medium text-gray-600">{t("admin.tontine.noMemberYet")}</p>
        ) : group.status === "pending" ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
              {t("admin.tontine.firstTour", { month: monthName(first.month) })}
            </p>
            <ul className="mt-2 space-y-1.5">
              {first.members.map((member) => (
                <li key={member.id} className="flex items-center gap-2.5">
                  <Avatar name={member.name} size="size-7" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{member.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-600">
            {t("admin.tontine.cycleEnded", { month: month(group.endMonth) })}
          </p>
        )}
      </div>

      {isRunning && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-500">{t("admin.tontine.contributionsThisMonth")}</span>
            <span className="text-gray-900">
              {group.paidCount}/{group.size}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={t("admin.tontine.contributionsThisMonth")}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
          >
            <div className={clsx("h-full rounded-full", BAR_COLORS[health])} style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {t("admin.tontine.collectedOf", { collected: money(group.collected), expected: money(group.expected) })}
          </p>
        </div>
      )}

      {group.capacity && (
        <p
          className={clsx(
            "mt-3 text-xs font-semibold",
            group.members.length < group.capacity ? "text-violet-700" : "text-gray-500",
          )}
        >
          {t("admin.tontine.places", { filled: group.members.length, total: group.capacity })}
          {group.members.length < group.capacity &&
            ` · ${t("admin.tontine.freePlaces", { count: group.capacity - group.members.length })}`}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs">
        <span className="font-medium text-gray-500">
          {t("admin.tontine.cotisationPerMonth", { amount: money(group.cotisation) })}
        </span>
        <span className="flex items-center gap-1 font-semibold text-[#EE7115]">
          {t("admin.tontine.seeDetails")}
          <ChevronRightIcon aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
