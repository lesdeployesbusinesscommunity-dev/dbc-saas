// Import Dependencies
import { useState } from "react";
import dayjs from "dayjs";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  GiftIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "./LevelBadge";
import { GroupStatusBadge } from "./GroupStatusBadge";
import { useTontineFormat } from "./format";
import { shortName } from "./mockData";

// ----------------------------------------------------------------------

const SLOT_STYLES = {
  closed: "border-gray-100 bg-gray-50 text-gray-500",
  current: "border-[#EE7115] bg-[#EE7115]/[0.08] text-gray-900",
  upcoming: "border-[#52A2DF]/30 bg-[#52A2DF]/[0.06] text-gray-700",
};

function Tile({ Icon, color, value, label, detail }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <p className="mt-3 text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {detail && <p className="mt-1 text-xs text-gray-400">{detail}</p>}
    </div>
  );
}

// Fiche détaillée d'un groupe : ses chiffres du mois, l'état du versement de
// la cagnotte, chaque membre dans son ordre de passage (qui a cotisé ce mois-ci,
// qui est en retard, tout l'historique tour par tour) et le calendrier
// complet du cycle.
export function GroupDetailModal({ group, waiting = [], onClose, onPlace }) {
  const { t, money, month, monthShort, day } = useTontineFormat();
  // Le membre choisi pour chaque mois libre ("AAAA-MM" -> id du membre).
  const [picks, setPicks] = useState({});
  if (!group) return null;

  const isRunning = group.status === "running";
  const { payout } = group;
  // Une ligne par place encore libre : un mois peut en avoir jusqu'à 3.
  const places = group.freeSlots.flatMap((slot) =>
    Array.from({ length: slot.openSlots }, (_unused, index) => ({
      key: `${slot.month.format("YYYY-MM")}#${index}`,
      slotKey: slot.month.format("YYYY-MM"),
      slot,
    })),
  );
  const openPlaces = places.length;

  // Les mêmes morceaux servent au tableau (grand écran) et aux cartes (tablette,
  // téléphone) : les passages du membre, son état ce mois-ci, ses mois payés.
  const turnsOf = (member) => group.schedule.filter((slot) => slot.members.some((entry) => entry.id === member.id));
  const renderTurns = (member) => (
    <div className="flex flex-wrap gap-1.5">
      {turnsOf(member).map((slot) => (
        <span
          key={slot.tour}
          className={clsx(
            "whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            SLOT_STYLES[slot.status],
          )}
          title={month(slot.month)}
        >
          {t("admin.tontine.detail.turnChip", { tour: slot.tour, month: monthShort(slot.month) })}
        </span>
      ))}
    </div>
  );
  const renderThisMonth = (member) =>
    member.paidThisMonth ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
        <CheckCircleIcon aria-hidden="true" className="size-3.5" />
        {t("admin.tontine.detail.paid")}
      </span>
    ) : (
      <span
        className={clsx(
          "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
          member.isLate ? "bg-red-50 text-red-600 ring-red-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20",
        )}
      >
        {member.isLate ? t("admin.tontine.late.days", { count: member.daysLate }) : t("admin.tontine.detail.awaiting")}
      </span>
    );
  const renderHistory = (member) =>
    member.toursElapsed === 0 ? (
      <span className="text-xs text-gray-400">{t("admin.tontine.detail.noHistory")}</span>
    ) : (
      <div>
        <div className="flex flex-wrap gap-1" aria-hidden="true">
          {member.history.map((paid, index) => (
            <span
              key={index}
              title={t("admin.tontine.detail.historyTitle", {
                tour: index + 1,
                state: paid ? t("admin.tontine.detail.paid") : t("admin.tontine.detail.unpaid"),
              })}
              className={clsx("size-2.5 rounded-sm", paid ? "bg-green-500" : "bg-red-400")}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {t("admin.tontine.detail.paidCount", { paid: member.paidCount, total: member.toursElapsed })}
        </p>
      </div>
    );

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-4xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge levelKey={group.levelKey} />
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {t("admin.tontine.group", { letter: group.letter })}
                </DialogTitle>
                <GroupStatusBadge group={group} />
              </div>
              <p className="mt-1.5 text-sm text-gray-500">
                {t("admin.tontine.detail.period", { start: month(group.startMonth), end: month(group.endMonth) })}
                {isRunning && ` · ${t("admin.tontine.tourOf", { tour: group.tour, total: group.totalTours })}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.tontine.detail.close")}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile
              Icon={BanknotesIcon}
              color="#52A2DF"
              value={money(group.cotisation)}
              label={t("admin.tontine.detail.tiles.cotisation")}
              detail={t("admin.tontine.detail.tiles.dueDay", { day: group.dueDate.date() })}
            />
            <Tile
              Icon={CheckBadgeIcon}
              color="#16A34A"
              value={isRunning ? `${group.paidCount}/${group.size}` : "—"}
              label={t("admin.tontine.detail.tiles.received")}
              detail={
                isRunning
                  ? t("admin.tontine.collectedOf", {
                      collected: money(group.collected),
                      expected: money(group.expected),
                    })
                  : null
              }
            />
            <Tile
              Icon={GiftIcon}
              color="#EE7115"
              value={money(payout.amount)}
              label={t("admin.tontine.detail.tiles.pot")}
              detail={group.beneficiaries.length > 0 ? group.beneficiaries.map((b) => shortName(b.name)).join(", ") : null}
            />
            <Tile
              Icon={CalendarDaysIcon}
              color="#7C3AED"
              value={t("admin.tontine.tourOf", { tour: group.tour, total: group.totalTours })}
              label={t("admin.tontine.detail.tiles.cycle")}
              detail={`${monthShort(group.startMonth)} ${group.startMonth.year()} → ${monthShort(group.endMonth)} ${group.endMonth.year()}`}
            />
          </div>

          {isRunning && group.beneficiaries.length > 0 && (
            <section className="mt-4 rounded-xl bg-[#EE7115]/[0.06] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#EE7115]">
                {t("admin.tontine.receivesThisMonth", { count: group.beneficiaries.length })}
              </p>
              <ul className="mt-2 divide-y divide-[#EE7115]/10">
                {group.beneficiaries.map((beneficiary) => (
                  <li key={beneficiary.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-1 last:pb-0">
                    <Avatar name={beneficiary.name} size="size-11" />
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-bold text-gray-900">{beneficiary.name}</p>
                      <p className="text-xs text-gray-500">{beneficiary.city}</p>
                    </div>
                    {beneficiary.payoutDate ? (
                      <p className="flex basis-full items-center gap-1.5 pl-14 text-sm font-semibold text-green-700 sm:basis-auto sm:pl-0">
                        <CheckCircleIcon aria-hidden="true" className="size-5" />
                        {t("admin.tontine.detail.paidOutOn", { date: day(dayjs(beneficiary.payoutDate)) })}
                      </p>
                    ) : beneficiary.payoutReady ? (
                      <p className="basis-full pl-14 text-sm font-semibold text-green-700 sm:basis-auto sm:pl-0">
                        {t("admin.tontine.beneficiaries.ready")}
                      </p>
                    ) : (
                      <p className="basis-full pl-14 text-sm font-semibold text-amber-700 sm:basis-auto sm:pl-0">
                        {t("admin.tontine.beneficiaries.missing", { count: payout.missing })}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {group.capacity && group.freeSlots.length > 0 && (
            <section className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <UserPlusIcon aria-hidden="true" className="size-4 text-violet-600" />
                    {t("admin.tontine.detail.free.title", { count: openPlaces })}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.detail.free.hint", { perTour: group.perTour })}</p>
                </div>
              </div>
              {waiting.length === 0 ? (
                <p className="mt-3 text-xs font-medium text-gray-500">{t("admin.tontine.detail.free.noWaiting")}</p>
              ) : (
                <ul className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
                  {places.map(({ key, slotKey, slot }) => {
                    const picked = waiting.find((member) => member.id === picks[key]);
                    return (
                      <li key={key} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                        <span className="shrink-0 basis-full text-xs font-bold text-gray-700 sm:w-28 sm:basis-auto">{month(slot.month)}</span>
                        <select
                          aria-label={t("admin.tontine.detail.free.pickFor", { month: month(slot.month) })}
                          value={picks[key] ?? ""}
                          onChange={(event) => setPicks((current) => ({ ...current, [key]: event.target.value }))}
                          className="min-w-0 flex-1 basis-40 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-[#52A2DF]"
                        >
                          <option value="">{t("admin.tontine.detail.free.pick")}</option>
                          {waiting
                            .filter((member) => member.id === picks[key] || !Object.values(picks).includes(member.id))
                            .map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          disabled={!picked}
                          onClick={() => {
                            onPlace(group, picked, slotKey);
                            setPicks((current) => ({ ...current, [key]: "" }));
                          }}
                          className="shrink-0 rounded-lg bg-[#EE7115] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t("admin.tontine.detail.free.place")}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          <h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-gray-400">
            {t("admin.tontine.detail.members")}
          </h3>
          <div className="mt-2 hidden overflow-x-auto rounded-xl border border-gray-100 lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.detail.columns.order")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.detail.columns.member")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.detail.columns.turns")}</th>
                  {isRunning && <th scope="col" className="px-3 py-3">{t("admin.tontine.detail.columns.thisMonth")}</th>}
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.detail.columns.history")}</th>
                </tr>
              </thead>
              <tbody>
                {group.members.map((member) => (
                  <tr
                    key={member.id}
                    className={clsx("border-t border-gray-100", member.isBeneficiary && "bg-[#EE7115]/[0.04]")}
                  >
                    <td className="px-3 py-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {member.position}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size="size-9" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{member.name}</p>
                          <p className="truncate text-xs text-gray-500">{member.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{renderTurns(member)}</td>
                    {isRunning && <td className="px-3 py-3">{renderThisMonth(member)}</td>}
                    <td className="px-3 py-3">{renderHistory(member)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 lg:hidden">
            {group.members.map((member) => (
              <li key={member.id} className={clsx("space-y-3 p-3", member.isBeneficiary && "bg-[#EE7115]/[0.04]")}>
                <div className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {member.position}
                  </span>
                  <Avatar name={member.name} size="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                    <p className="truncate text-xs text-gray-500">{member.city}</p>
                  </div>
                  {isRunning && <div className="shrink-0">{renderThisMonth(member)}</div>}
                </div>
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 pl-10">
                  {renderHistory(member)}
                  {renderTurns(member)}
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-gray-400">
            {t("admin.tontine.detail.calendar")}
          </h3>
          <ol className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {group.schedule.map((slot) => (
              <li
                key={slot.tour}
                className={clsx("rounded-xl border px-3 py-2.5", SLOT_STYLES[slot.status])}
                aria-current={slot.status === "current" ? "step" : undefined}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                  {t("admin.tontine.detail.turnChip", { tour: slot.tour, month: month(slot.month) })}
                </p>
                {slot.free ? (
                  <p className="mt-0.5 truncate text-sm font-semibold text-violet-600">{t("admin.tontine.free")}</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {slot.members.map((entry) => (
                      <li key={entry.id} className="truncate text-sm font-semibold">
                        {shortName(entry.name)}
                      </li>
                    ))}
                    {slot.openSlots > 0 && (
                      <li className="truncate text-xs font-semibold text-violet-600">
                        {t("admin.tontine.openSlots", { count: slot.openSlots })}
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
