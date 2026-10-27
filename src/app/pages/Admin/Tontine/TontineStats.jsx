// Import Dependencies
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  RectangleGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

// Même langage visuel que les cartes de "Gestion financière" (pastille
// d'icône colorée + gros chiffre + libellé), avec en plus une ligne de
// détail et, pour les cotisations, une barre d'avancement.
function StatCard({ Icon, color, value, label, detail, progress }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm+ text-gray-500">{label}</p>

      {typeof progress === "number" && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={label}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"
        >
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">{detail}</p>
    </div>
  );
}

// Les 5 chiffres qui disent où en est la tontine ce mois-ci, pour le niveau
// choisi (ou tous). "waiting" : membres qui attendent encore un groupe.
export function TontineStats({ stats, waitingCount, waitingLevels }) {
  const { t, money } = useTontineFormat();
  const percent =
    stats.contributionsExpected > 0
      ? Math.round((stats.contributionsPaid / stats.contributionsExpected) * 100)
      : 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        Icon={RectangleGroupIcon}
        color="#52A2DF"
        value={stats.groupsRunning}
        label={t("admin.tontine.stats.groups.label")}
        detail={t("admin.tontine.stats.groups.detail", {
          total: stats.groupsTotal,
          complete: stats.groupsComplete,
          pending: stats.groupsPending,
        })}
      />
      <StatCard
        Icon={CheckBadgeIcon}
        color="#16A34A"
        value={`${stats.contributionsPaid}/${stats.contributionsExpected}`}
        label={t("admin.tontine.stats.contributions.label")}
        progress={percent}
        detail={t("admin.tontine.stats.contributions.detail", {
          collected: money(stats.amountCollected),
          expected: money(stats.amountExpected),
        })}
      />
      <StatCard
        Icon={GiftIcon}
        color="#EE7115"
        value={stats.beneficiariesCount}
        label={t("admin.tontine.stats.beneficiaries.label")}
        detail={t("admin.tontine.stats.beneficiaries.detail", {
          amount: money(stats.payoutsTotal),
          done: stats.payoutsDone,
        })}
      />
      <StatCard
        Icon={ExclamationTriangleIcon}
        color={stats.lateCount > 0 ? "#E11D48" : "#16A34A"}
        value={stats.lateCount}
        label={t("admin.tontine.stats.late.label")}
        detail={
          stats.lateCount > 0
            ? t("admin.tontine.stats.late.detail", {
                amount: money(stats.lateAmount),
                count: stats.lateGroups,
              })
            : t("admin.tontine.stats.late.none")
        }
      />
      <StatCard
        Icon={UserPlusIcon}
        color="#7C3AED"
        value={waitingCount}
        label={t("admin.tontine.stats.waiting.label")}
        detail={
          waitingCount > 0
            ? t("admin.tontine.stats.waiting.detail", { count: waitingLevels })
            : t("admin.tontine.stats.waiting.none")
        }
      />
    </div>
  );
}
