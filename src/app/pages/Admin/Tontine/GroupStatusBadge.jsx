// Import Dependencies
import clsx from "clsx";

// Local Imports
import { useTontineFormat } from "./format";
import { getGroupHealth } from "./mockData";

// ----------------------------------------------------------------------

const STYLES = {
  late: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/20",
  awaiting: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  ok: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  complete: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
  pending: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
};

export function GroupStatusBadge({ group }) {
  const { t, monthName } = useTontineFormat();
  const health = getGroupHealth(group);

  const label = {
    late: t("admin.tontine.health.late", { count: group.lateMembers.length }),
    awaiting: t("admin.tontine.health.awaiting", { count: group.awaitingMembers.length }),
    ok: t("admin.tontine.health.ok"),
    complete: t("admin.tontine.health.complete"),
    pending: t("admin.tontine.health.pending", { month: monthName(group.startMonth) }),
  }[health];

  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[health],
      )}
    >
      {label}
    </span>
  );
}
