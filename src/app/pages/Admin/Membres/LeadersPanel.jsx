// Import Dependencies
import { useMemo, useState } from "react";
import { PencilSquareIcon, ShieldCheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Avatar } from "../components/Avatar";
import { leaderTitles, useLeaderLabels } from "./leaderData";
import { useMembersFormat } from "./useMembersFormat";

// ----------------------------------------------------------------------

// Onglet "Leaders" : les leaders en poste (avec modifier / destituer) et,
// en dessous, l'historique des anciens leaders avec la durée du mandat et
// le motif de fin. "membersById" donne le membre derrière chaque mandat
// (absent si le membre a été supprimé depuis : on garde alors le nom du
// journal, voir "fallbackNames").
export function LeadersPanel({
  activeTerms,
  pastTerms,
  membersById,
  fallbackNames,
  onAppoint,
  onEdit,
  onDismiss,
  onOpenMember,
}) {
  const { t } = useTranslation();
  const { functionLabel, reasonLabel } = useLeaderLabels();
  const { fullDate, duration } = useMembersFormat();
  const [filter, setFilter] = useState("all");

  const matches = (term) => filter === "all" || term.title === filter;
  const current = useMemo(
    () => activeTerms.filter(matches).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTerms, filter],
  );
  const past = useMemo(
    () => pastTerms.filter(matches).sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pastTerms, filter],
  );

  const nameOf = (term) => membersById[term.memberId]?.name ?? fallbackNames[term.memberId]?.name ?? "—";
  const matriculeOf = (term) =>
    membersById[term.memberId]?.matricule ?? fallbackNames[term.memberId]?.matricule ?? "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{t("admin.membres.leaders.title")}</h2>
          <p className="text-xs text-gray-400">{t("admin.membres.leaders.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label={t("admin.membres.leaders.filterLabel")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
          >
            <option value="all">{t("admin.membres.leaders.allFunctions")}</option>
            {leaderTitles.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAppoint}
            className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ShieldCheckIcon aria-hidden="true" className="size-4" />
            {t("admin.membres.leaders.appoint")}
          </button>
        </div>
      </div>

      <section className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {t("admin.membres.leaders.currentTitle", { count: current.length })}
        </h3>

        {current.length === 0 ? (
          <p className="mt-3 rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {t("admin.membres.leaders.noneCurrent")}
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {current.map((term) => (
              <article key={term.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => onOpenMember(term.memberId)}
                  className="flex items-center gap-3 text-left"
                >
                  <Avatar name={nameOf(term)} size="size-11" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-900">{nameOf(term)}</span>
                    <span className="block text-xs text-gray-400">{matriculeOf(term)}</span>
                  </span>
                </button>

                <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#EE7115]">
                    <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
                    {functionLabel(term)}
                  </p>
                  {term.scope && <p className="mt-0.5 text-xs text-gray-600">{term.scope}</p>}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  {t("admin.membres.leaders.since", { date: fullDate(term.startedAt) })}
                  {" · "}
                  {duration(term.startedAt)}
                </p>
                {term.note && <p className="mt-1 line-clamp-2 text-xs italic text-gray-400">{term.note}</p>}

                <div className="mt-auto flex items-center gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => onEdit(term)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <PencilSquareIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.membres.leaders.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss(term)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <ShieldExclamationIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.membres.leaders.dismissAction")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {t("admin.membres.leaders.pastTitle", { count: past.length })}
        </h3>

        {past.length === 0 ? (
          <p className="mt-3 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            {t("admin.membres.leaders.nonePast")}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-3 py-3">{t("admin.membres.leaders.columns.member")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.membres.leaders.columns.function")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.membres.leaders.columns.period")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.membres.leaders.columns.reason")}</th>
                </tr>
              </thead>
              <tbody>
                {past.map((term) => (
                  <tr key={term.id} className="border-t border-gray-100 align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={nameOf(term)} size="size-8" />
                        <div className="leading-tight">
                          <p className="font-semibold text-gray-900">{nameOf(term)}</p>
                          <p className="text-xs text-gray-400">{matriculeOf(term)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <p className="font-semibold">{functionLabel(term)}</p>
                      {term.scope && <p className="text-xs text-gray-400">{term.scope}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      <p>{fullDate(term.startedAt)} → {fullDate(term.endedAt)}</p>
                      <p className="text-xs text-gray-400">{duration(term.startedAt, term.endedAt)}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <p className="font-semibold">{reasonLabel(term.endReason)}</p>
                      {term.endComment && <p className="text-xs text-gray-400">{term.endComment}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
