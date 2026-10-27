// Import Dependencies
import { useMemo, useState } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import {
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  RectangleGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { LevelBadge } from "app/pages/Admin/Tontine/LevelBadge";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { formatMoney } from "app/pages/Simulateur/data";
import { LeaderShell } from "./LeaderShell";
import { useAntenneTontine } from "./tontineData";

// ----------------------------------------------------------------------

function StatCard({ Icon, color, value, label, detail, progress }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-3 text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      {typeof progress === "number" && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={label}
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
        >
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>
      )}
      {detail && <p className="mt-2 text-xs text-gray-400">{detail}</p>}
    </div>
  );
}

// Une rangée de barres, une par mois : le mois en cours en orange, les autres
// en bleu. La valeur est écrite au-dessus de chaque barre (pas besoin de
// légende : une seule série, le titre de la carte dit ce qu'elle mesure).
function MonthBars({ columns, max }) {
  return (
    <ol className="mt-4 flex items-end gap-1.5 sm:gap-2">
      {columns.map((column) => {
        const height = column.value > 0 ? Math.max(6, Math.round((column.value / max) * 100)) : 0;
        return (
          <li key={column.key} className="flex min-w-0 flex-1 flex-col items-center" aria-label={column.aria}>
            <span className="h-4 text-[11px] font-bold leading-4 text-gray-700">{column.label}</span>
            <div className="mt-1 flex h-24 w-full items-end justify-center" title={column.aria}>
              {height > 0 ? (
                <div
                  className={clsx("w-full max-w-9 rounded-t-md", column.isCurrent ? "bg-[#EE7115]" : "bg-[#52A2DF]")}
                  style={{ height: `${height}%` }}
                />
              ) : (
                <div className="h-px w-full max-w-9 bg-gray-200" />
              )}
            </div>
            <span
              className={clsx(
                "mt-1.5 text-[10px] font-semibold sm:text-[11px]",
                column.isCurrent ? "text-[#EE7115]" : "text-gray-400",
              )}
            >
              {column.month}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function MemberStatus({ member, groupStatus }) {
  const { t } = useTranslation();
  if (groupStatus === "pending") {
    return <Chip tone="sky">{t("membre.leader.tontine.status.pending")}</Chip>;
  }
  if (groupStatus === "complete") {
    return <Chip tone="gray">{t("membre.leader.tontine.status.complete")}</Chip>;
  }
  if (member.isLate || (member.paidThisMonth === false && member.overdue > 0)) {
    return (
      <Chip tone="red" Icon={ExclamationTriangleIcon}>
        {t("membre.leader.tontine.status.late", { count: member.overdue || 1 })}
      </Chip>
    );
  }
  if (member.paidThisMonth) {
    return (
      <Chip tone="green" Icon={CheckCircleIcon}>
        {t("membre.leader.tontine.status.paid")}
      </Chip>
    );
  }
  return <Chip tone="amber">{t("membre.leader.tontine.status.awaiting")}</Chip>;
}

const CHIP_TONES = {
  red: "bg-red-50 text-red-600 ring-red-200",
  green: "bg-green-50 text-green-700 ring-green-600/25",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  gray: "bg-gray-100 text-gray-600 ring-gray-300/60",
};

function Chip({ tone, Icon, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        CHIP_TONES[tone],
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {children}
    </span>
  );
}

function GroupCard({ row, monthLabel }) {
  const { t } = useTranslation();
  const { group, members } = row;
  const paid = members.filter((member) => member.paidThisMonth === true).length;
  const statusLabel = {
    running: t("membre.leader.tontine.group.running"),
    pending: t("membre.leader.tontine.group.pending", { month: monthLabel(group.startMonth) }),
    complete: t("membre.leader.tontine.group.complete"),
  }[group.status];

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge levelKey={group.levelKey} />
          <span className="text-sm font-bold text-gray-900">{t("membre.leader.tontine.group.name", { letter: group.letter })}</span>
        </div>
        <span className="text-xs font-semibold text-gray-500">{statusLabel}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>{t("membre.leader.tontine.group.cycle")}</span>
          <span>{t("membre.leader.tontine.group.tour", { tour: group.tour, total: group.totalTours })}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#52A2DF]"
            style={{ width: `${(group.tour / group.totalTours) * 100}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {t("membre.leader.tontine.group.antenneShare", { count: members.length, size: group.size })}
        {group.status === "running" && (
          <>
            {" · "}
            <span className="font-semibold text-gray-700">
              {t("membre.leader.tontine.group.paidCount", { paid, total: members.length })}
            </span>
          </>
        )}
      </p>

      <ul className="mt-3 divide-y divide-gray-100">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={member.name} size="size-9" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                <p className={clsx("truncate text-xs", member.isBeneficiary ? "font-semibold text-[#EE7115]" : "text-gray-500")}>
                  {member.isBeneficiary
                    ? member.payoutDate
                      ? t("membre.leader.tontine.turn.paidOut")
                      : t("membre.leader.tontine.turn.thisMonth")
                    : member.turn?.status === "closed"
                      ? t("membre.leader.tontine.turn.received", { month: monthLabel(member.turn.month) })
                      : member.turn
                        ? t("membre.leader.tontine.turn.upcoming", { month: monthLabel(member.turn.month) })
                        : t("membre.leader.tontine.turn.none")}
                </p>
              </div>
            </div>
            <MemberStatus member={member} groupStatus={group.status} />
          </li>
        ))}
      </ul>
    </li>
  );
}

// "Tontine" (/membre/leader/tontine) : l'évolution des tontines de l'antenne.
// On part des groupes de la plateforme et on ne garde que les membres qui
// habitent dans les villes de l'antenne. Un groupe réunit 36 personnes sur 12
// mois, avec 3 bénéficiaires par mois : le leader voit, pour son antenne, où en
// sont les cotisations mois après mois, qui reçoit la cagnotte ce mois-ci et
// ce qui l'attend dans chaque groupe. Il ne valide rien ici : les paiements
// viennent des membres eux-mêmes, et la relance d'un retard se fait depuis
// « Mon antenne ».
export default function LeaderTontine() {
  const { t, i18n } = useTranslation();
  const data = useAntenneTontine();
  const [query, setQuery] = useState("");
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const monthsFull = t("admin.common.monthsFull", { returnObjects: true });
  const monthsShort = t("admin.common.monthsShort", { returnObjects: true });

  const monthLabel = (date) => {
    const name = monthsFull[date.month()];
    return `${i18n.language?.startsWith("fr") ? name.toLowerCase() : name} ${date.year()}`;
  };

  const rows = useMemo(() => {
    const text = normalizeSearchText(query);
    if (!data) return [];
    if (!text) return data.rows;
    return data.rows
      .map((row) => ({
        ...row,
        members: row.members.filter((member) => normalizeSearchText(`${member.name} ${member.city}`).includes(text)),
      }))
      .filter((row) => row.members.length > 0);
  }, [data, query]);

  if (!data) return <LeaderShell />;
  const { totals, timeline } = data;

  const paidColumns = timeline
    .filter((entry) => entry.isPast || entry.isCurrent)
    .slice(-6)
    .map((entry) => ({
      key: entry.key,
      value: entry.percent ?? 0,
      label: entry.percent === null ? "—" : `${entry.percent}%`,
      month: monthsShort[entry.month.month()],
      isCurrent: entry.isCurrent,
      aria: t("membre.leader.tontine.evolution.paidAria", {
        month: monthLabel(entry.month),
        paid: entry.paid,
        total: entry.due,
      }),
    }));

  const turnColumns = timeline.map((entry) => ({
    key: entry.key,
    value: entry.receiving,
    label: String(entry.receiving),
    month: monthsShort[entry.month.month()],
    isCurrent: entry.isCurrent,
    aria: t("membre.leader.tontine.evolution.turnAria", {
      month: monthLabel(entry.month),
      count: entry.receiving,
      amount: formatMoney(entry.receivingAmount, locale),
    }),
  }));
  const maxTurns = Math.max(1, ...turnColumns.map((column) => column.value));

  return (
    <LeaderShell
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("membre.leader.tontine.searchPlaceholder")}
    >
      <p className="max-w-3xl text-sm text-gray-600">{t("membre.leader.tontine.subtitle")}</p>

      {data.rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
          <RectangleGroupIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">{t("membre.leader.tontine.empty.title")}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{t("membre.leader.tontine.empty.description")}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              Icon={UsersIcon}
              color="#52A2DF"
              value={totals.people}
              label={t("membre.leader.tontine.stats.members.label")}
              detail={t("membre.leader.tontine.stats.members.detail", {
                count: totals.groups,
                running: totals.groupsRunning,
              })}
            />
            <StatCard
              Icon={CheckCircleIcon}
              color="#16A34A"
              value={`${totals.paid}/${totals.expected}`}
              label={t("membre.leader.tontine.stats.paid.label")}
              progress={totals.percent}
              detail={t("membre.leader.tontine.stats.paid.detail", { percent: totals.percent })}
            />
            <StatCard
              Icon={ExclamationTriangleIcon}
              color={totals.late > 0 ? "#E11D48" : "#16A34A"}
              value={totals.late}
              label={t("membre.leader.tontine.stats.late.label")}
              detail={
                totals.late > 0
                  ? t("membre.leader.tontine.stats.late.detail", { amount: formatMoney(totals.lateAmount, locale) })
                  : t("membre.leader.tontine.stats.late.none")
              }
            />
            <StatCard
              Icon={GiftIcon}
              color="#EE7115"
              value={totals.beneficiaries.length}
              label={t("membre.leader.tontine.stats.receiving.label")}
              detail={t("membre.leader.tontine.stats.receiving.detail", {
                amount: formatMoney(totals.beneficiariesAmount, locale),
                done: totals.paidOut,
              })}
            />
          </div>

          {totals.late > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <ExclamationTriangleIcon aria-hidden="true" className="size-4 shrink-0" />
              <span>{t("membre.leader.tontine.lateNotice", { count: totals.late })}</span>
              <NavLink to="/membre/leader/antenne" className="font-bold underline underline-offset-2">
                {t("membre.leader.tontine.lateLink")}
              </NavLink>
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <BanknotesIcon aria-hidden="true" className="size-4 text-[#52A2DF]" />
                {t("membre.leader.tontine.evolution.paidTitle")}
              </h2>
              <p className="mt-1 text-xs text-gray-500">{t("membre.leader.tontine.evolution.paidHint")}</p>
              <MonthBars columns={paidColumns} max={100} />
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <GiftIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
                {t("membre.leader.tontine.evolution.turnTitle")}
              </h2>
              <p className="mt-1 text-xs text-gray-500">{t("membre.leader.tontine.evolution.turnHint")}</p>
              <MonthBars columns={turnColumns} max={maxTurns} />
            </section>
          </div>

          <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <GiftIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
              {t("membre.leader.tontine.receiving.title")}
            </h2>
            {totals.beneficiaries.length === 0 ? (
              <p className="mt-4 py-4 text-center text-sm text-gray-500">{t("membre.leader.tontine.receiving.empty")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {totals.beneficiaries.map(({ member, group, amount }) => (
                  <li key={`${group.id}-${member.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={member.name} size="size-10" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                          <LevelBadge levelKey={group.levelKey} />
                          {t("membre.leader.tontine.group.name", { letter: group.letter })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatMoney(amount, locale)}</p>
                    {member.payoutDate ? (
                      <Chip tone="green" Icon={CheckCircleIcon}>
                        {t("membre.leader.tontine.receiving.paidOut")}
                      </Chip>
                    ) : (
                      <Chip tone="amber">{t("membre.leader.tontine.receiving.pending")}</Chip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <h2 className="mt-8 text-sm font-bold text-gray-900">{t("membre.leader.tontine.groupsTitle")}</h2>
          {rows.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center text-sm text-gray-500">
              {t("membre.leader.tontine.noMatch")}
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {rows.map((row) => (
                <GroupCard key={row.group.id} row={row} monthLabel={monthLabel} />
              ))}
            </ul>
          )}
        </>
      )}
    </LeaderShell>
  );
}
