// Import Dependencies
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRightIcon, BellAlertIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { useTontineFormat } from "app/pages/Admin/Tontine/format";
import { LevelBadge } from "app/pages/Admin/Tontine/LevelBadge";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { FollowUpStageBadge } from "./FollowUpStageBadge";
import { LeaderShell } from "./LeaderShell";
import { countOpenFollowUps, useLeaderFollowUps } from "./leaderAccess";

// ----------------------------------------------------------------------

function StatTile({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className={clsx("mt-1 text-2xl font-extrabold", tone)}>{value}</p>
    </div>
  );
}

// Les dossiers de RELANCE de l'Espace leader (/membre/leader/relances) : les
// membres de l'antenne dont la cotisation est en retard et que la relance
// automatique a confiés au chef d'antenne (niveau 2, le "Community Manager
// Financier"). Il les contacte, comprend leur situation, propose une solution et
// rend son rapport — comme l'entretien d'une inscription.
export default function LeaderRelances() {
  const { t } = useTranslation();
  const { money } = useTontineFormat();
  const followUps = useLeaderFollowUps();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("open");

  const open = countOpenFollowUps(followUps);
  const closed = followUps.length - open;

  const visible = useMemo(() => {
    const text = normalizeSearchText(query);
    return followUps
      .filter(({ stage }) =>
        filter === "open" ? stage !== "done" : filter === "closed" ? stage === "done" : true,
      )
      .filter(({ entry }) => !text || normalizeSearchText(entry.memberName).includes(text));
  }, [followUps, filter, query]);

  const filters = [
    { key: "open", label: t("membre.leader.interviews.filter.open"), count: open },
    { key: "closed", label: t("membre.leader.interviews.filter.closed"), count: closed },
    { key: "all", label: t("membre.leader.interviews.filter.all"), count: followUps.length },
  ];

  return (
    <LeaderShell
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("membre.leader.followUp.searchPlaceholder")}
    >
      <p className="max-w-3xl text-sm text-gray-600">{t("membre.leader.followUp.subtitle")}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label={t("membre.leader.followUp.stats.open")} value={open} tone="text-[#2f78b0]" />
        <StatTile label={t("membre.leader.followUp.stats.closed")} value={closed} tone="text-green-700" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("membre.leader.interviews.filter.label")}>
        {filters.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === key ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900",
            )}
          >
            {label} · {count}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
          <BellAlertIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">{t(`membre.leader.followUp.empty.${query ? "search" : filter}.title`)}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{t(`membre.leader.followUp.empty.${query ? "search" : filter}.description`)}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map(({ entry, stage }) => (
            <li key={entry.id}>
              <Link
                to={`/membre/leader/relance/${encodeURIComponent(entry.id)}`}
                className="group flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <Avatar name={entry.memberName} size="size-12" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{entry.memberName}</p>
                    <p className="truncate text-xs text-gray-500">
                      {t("membre.leader.followUp.owes", { amount: money(entry.amount) })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <LevelBadge levelKey={entry.levelKey} />
                  <span className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-200">
                    {t("admin.tontine.late.days", { count: entry.daysLate })}
                  </span>
                  <FollowUpStageBadge stage={stage} />
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#EE7115]">
                  {stage === "done" ? t("membre.leader.interviews.card.view") : t("membre.leader.interviews.card.open")}
                  <ArrowRightIcon aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </LeaderShell>
  );
}
