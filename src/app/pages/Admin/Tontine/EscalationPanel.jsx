// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { FollowUpStageBadge } from "app/pages/Membre/Leader/FollowUpStageBadge";
import { FollowUpSummary } from "app/pages/Membre/Leader/FollowUpSummary";
import { Avatar } from "../components/Avatar";
import { useNetworkData } from "../context/NetworkDataContext";
import { listLeaders } from "../Inscriptions/registrationUtils";
import { listMembers, useMembersStore } from "../Membres/membersStore";
import { assignFollowUp } from "./escalationEngine";
import { followUpStage } from "./followUpModel";
import { useTontineFormat } from "./format";
import { completeTask, updateEntry, useEscalationLog } from "./escalationStore";
import {
  PENALTY_BANDS,
  REPEAT_FROM,
  REPEAT_RATE,
  STAGES,
  isStillTimely,
  penaltyOf,
  stageOf,
  stepsFor,
} from "./escalation";

// ----------------------------------------------------------------------

// Couleurs des 5 niveaux (classes écrites en entier pour Tailwind).
const LEVEL_STYLES = {
  1: { dot: "bg-[#52A2DF]", chip: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  2: { dot: "bg-[#16A34A]", chip: "bg-green-50 text-green-700 ring-green-600/20" },
  3: { dot: "bg-[#7C3AED]", chip: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  4: { dot: "bg-[#EE7115]", chip: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  5: { dot: "bg-[#DC2626]", chip: "bg-red-50 text-red-700 ring-red-600/20" },
};

const STEP_ORDER = ["reminder1", "reminder2", "cm", "mentor", "caution", "reserve", "formal", "governance"];

const range = (from, to, t) =>
  to === null ? t("admin.tontine.reminders.rangeFrom", { from }) : t("admin.tontine.reminders.range", { from, to });

function Section({ title, hint, children }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// L'onglet "Relances" de Gestion des tontines : le règlement des retards (les 5
// niveaux et la grille de pénalités), les membres en retard avec l'étape où ils
// en sont, et le journal de ce que le système a déclenché (voir
// escalationEngine.js). "lateEntries" : tous les membres en retard, voir
// mockData.summarizeGroups.
export function EscalationPanel({ lateEntries }) {
  const { t, money } = useTontineFormat();
  const { i18n } = useTranslation();
  const { entries } = useEscalationLog();
  const { networksByCountry } = useNetworkData();
  const membersSnapshot = useMembersStore();
  const [openReport, setOpenReport] = useState(null);
  const leaders = listLeaders(networksByCountry).filter((leader) => !leader.isNational);

  // Désigner à la main le chef d'antenne d'un dossier de relance qu'aucune antenne
  // ne couvrait.
  const assignManually = (entry, leaderKey) => {
    const leader = leaders.find((item) => `${item.country}:${item.nodeId}` === leaderKey);
    if (!leader) return;
    updateEntry(entry.id, {
      assignment: assignFollowUp(
        entry,
        leader,
        { t, members: listMembers(membersSnapshot) },
        {
          name: entry.memberName,
          group: `${t(`simulateur.levels.${entry.levelKey}.name`)} · ${t("admin.tontine.group", { letter: entry.letter })}`,
          amount: money(entry.amount),
          days: entry.daysLate,
        },
      ),
    });
  };

  const rows = lateEntries
    .map(({ group, member }) => {
      const occurrences = Math.max(1, member.missedCount ?? 1);
      const penalty = penaltyOf(member.daysLate, occurrences);
      return { group, member, penalty, stage: stageOf(member.daysLate), occurrences };
    })
    .sort((a, b) => b.member.daysLate - a.member.daysLate || a.member.name.localeCompare(b.member.name));

  const countAt = (level) => rows.filter((row) => row.stage === level).length;
  const todo = entries.filter((entry) => entry.status === "todo");
  const dateTime = (iso) =>
    new Date(iso).toLocaleString(i18n.language?.startsWith("fr") ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl bg-[#52A2DF]/[0.08] p-4 text-sm text-gray-700">
        <BellAlertIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#52A2DF]" />
        <p>{t("admin.tontine.reminders.intro")}</p>
      </div>

      {/* Les 5 niveaux. */}
      <Section title={t("admin.tontine.reminders.ladderTitle")} hint={t("admin.tontine.reminders.ladderHint")}>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {STAGES.map(({ level, from, to }) => (
            <li key={level} className="rounded-xl border border-gray-100 p-4">
              <div>
                <span className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-gray-500">
                  <span className={clsx("size-2.5 rounded-full", LEVEL_STYLES[level].dot)} />
                  {t("admin.tontine.reminders.level", { level })}
                </span>
                <span className="mt-0.5 block pl-4 text-xs font-semibold text-gray-400">{range(from, to, t)}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-gray-900">{t(`admin.tontine.reminders.stages.${level}.title`)}</p>
              <p className="mt-1 text-xs text-gray-500">{t(`admin.tontine.reminders.stages.${level}.body`)}</p>
              <p className="mt-3 text-xs font-semibold text-gray-700">
                {t("admin.tontine.reminders.membersAtLevel", { count: countAt(level) })}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* La grille de pénalités. */}
      <Section title={t("admin.tontine.reminders.penaltiesTitle")} hint={t("admin.tontine.reminders.penaltiesHint")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-400">
                <th className="py-2 pr-3">{t("admin.tontine.reminders.col.delay")}</th>
                <th className="py-2 pr-3">{t("admin.tontine.reminders.col.situation")}</th>
                <th className="py-2 pr-3">{t("admin.tontine.reminders.col.penalty")}</th>
                <th className="py-2">{t("admin.tontine.reminders.col.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...PENALTY_BANDS, { key: "repeat", from: REPEAT_FROM, to: null, rate: REPEAT_RATE }].map((band) => (
                <tr key={band.key}>
                  <td className="py-2.5 pr-3 font-semibold text-gray-900">
                    {band.key === "repeat"
                      ? t("admin.tontine.reminders.repeatDelay", { count: REPEAT_FROM })
                      : range(band.from, band.to, t)}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{t(`admin.tontine.reminders.bands.${band.key}.situation`)}</td>
                  <td className="py-2.5 pr-3 font-bold text-gray-900">{t(`admin.tontine.reminders.bands.${band.key}.penalty`)}</td>
                  <td className="py-2.5 text-gray-600">{t(`admin.tontine.reminders.bands.${band.key}.action`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Les membres en retard. */}
      <Section
        title={t("admin.tontine.reminders.lateTitle", { count: rows.length })}
        hint={t("admin.tontine.reminders.lateHint")}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircleIcon aria-hidden="true" className="size-8 text-green-600" />
            <p className="text-sm text-gray-500">{t("admin.tontine.late.empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map(({ group, member, penalty, stage, occurrences }) => {
              const cycleKey = `${group.id}|${member.id}`;
              const mine = entries.filter((entry) => entry.groupId === group.id && entry.memberId === member.id);
              const reached = stepsFor(member.daysLate, occurrences).map((step) => step.id);
              return (
                <li key={cycleKey} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Avatar name={member.name} size="size-10" />
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-bold text-gray-900">{member.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {t(`simulateur.levels.${group.levelKey}.name`)} · {t("admin.tontine.group", { letter: group.letter })}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-red-600">
                      {t("admin.tontine.late.days", { count: member.daysLate })}
                    </span>
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                        LEVEL_STYLES[stage].chip,
                      )}
                    >
                      {t("admin.tontine.reminders.level", { level: stage })}
                    </span>
                    <div className="text-right text-xs">
                      <p className="text-sm font-bold text-gray-900">
                        {money(Math.round(group.cotisation * penalty.rate))}
                      </p>
                      <p className="text-gray-400">
                        {t("admin.tontine.reminders.penaltyOf", { rate: Math.round(penalty.rate * 100), amount: money(group.cotisation) })}
                      </p>
                    </div>
                  </div>

                  {(penalty.suspension || penalty.exclusion || penalty.governance) && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 pl-14 text-xs font-semibold text-red-600">
                      <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
                      {[
                        penalty.suspension && t("admin.tontine.reminders.flags.suspension"),
                        penalty.exclusion && t("admin.tontine.reminders.flags.exclusion"),
                        penalty.governance && t("admin.tontine.reminders.flags.governance"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  <ul className="mt-3 flex flex-wrap gap-2 pl-14">
                    {STEP_ORDER.filter(
                      (id) =>
                        reached.includes(id) &&
                        (mine.some((item) => item.step === id) || isStillTimely(id, member.daysLate)),
                    ).map((id) => {
                      const entry = mine.find((item) => item.step === id);
                      const done = entry?.status === "done";
                      const open = entry?.status === "todo";
                      const isCm = id === "cm";
                      return (
                        <li
                          key={id}
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            entry
                              ? open
                                ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                                : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200",
                          )}
                        >
                          {entry && !open ? (
                            <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                          ) : (
                            <ClockIcon aria-hidden="true" className="size-3.5" />
                          )}
                          {t(`admin.tontine.reminders.steps.${id}`)}
                          {done && ` · ${t("admin.tontine.reminders.done")}`}
                          {open && !isCm && (
                            <button
                              type="button"
                              onClick={() => completeTask(entry.id)}
                              className="ml-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white hover:opacity-90"
                            >
                              {t("admin.tontine.reminders.markDone")}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {(() => {
                    const cm = mine.find((item) => item.step === "cm");
                    if (!cm) return null;
                    const cmStage = followUpStage(cm);
                    return (
                      <div className="mt-3 pl-14">
                        {cmStage === "unassigned" ? (
                          <label className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700">
                            {t("admin.tontine.reminders.cm.noLeader")}
                            <select
                              defaultValue=""
                              onChange={(event) => assignManually(cm, event.target.value)}
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#52A2DF]"
                            >
                              <option value="" disabled>
                                {t("admin.tontine.reminders.cm.pick")}
                              </option>
                              {leaders.map((leader) => (
                                <option key={`${leader.country}:${leader.nodeId}`} value={`${leader.country}:${leader.nodeId}`}>
                                  {leader.leaderName} · {leader.branchName || leader.location} ({leader.country})
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span>
                              {t("admin.tontine.reminders.cm.assigned", {
                                name: cm.assignment.leaderName,
                                branch: cm.assignment.branchName || cm.assignment.location,
                              })}
                            </span>
                            <FollowUpStageBadge stage={cmStage} />
                            {cm.report && (
                              <button
                                type="button"
                                onClick={() => setOpenReport(openReport === cm.id ? null : cm.id)}
                                className="font-semibold text-[#52A2DF] hover:underline"
                              >
                                {openReport === cm.id
                                  ? t("admin.tontine.reminders.cm.hideReport")
                                  : t("admin.tontine.reminders.cm.showReport")}
                              </button>
                            )}
                          </div>
                        )}
                        {openReport === cm.id && cm.report && (
                          <div className="mt-3 max-w-xl rounded-2xl bg-gray-50 p-4">
                            <FollowUpSummary report={cm.report} />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Le journal : tout ce que la relance a déclenché. */}
      <Section
        title={t("admin.tontine.reminders.journalTitle")}
        hint={t("admin.tontine.reminders.journalHint", { count: todo.length })}
      >
        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">{t("admin.tontine.reminders.journalEmpty")}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.slice(0, 30).map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-xs">
                <span className="w-24 shrink-0 text-gray-400">{dateTime(entry.at)}</span>
                <span className="min-w-0 flex-1 basis-56 text-gray-700">
                  <span className="font-semibold text-gray-900">{t(`admin.tontine.reminders.steps.${entry.step}`)}</span>
                  {" — "}
                  {entry.memberName} · {t(`simulateur.levels.${entry.levelKey}.name`, { defaultValue: "" })}
                  {entry.recipients > 1 && ` · ${t("admin.tontine.reminders.recipients", { count: entry.recipients })}`}
                  {entry.step === "cm" && entry.assignment && ` · ${entry.assignment.leaderName}`}
                  {entry.step === "mentor" && entry.note && ` · ${entry.note}`}
                  {entry.step === "caution" && entry.note && ` · ${t("admin.tontine.reminders.sharePer", { amount: entry.note })}`}
                </span>
                <span className="flex flex-wrap gap-1">
                  {entry.deliveries.map((delivery) => (
                    <span
                      key={delivery.channel}
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        delivery.status === "sent" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {t(`admin.tontine.reminders.channels.${delivery.channel}`)} ·{" "}
                      {t(`admin.tontine.reminders.delivery.${delivery.status}`)}
                    </span>
                  ))}
                  {entry.status !== "sent" && (
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        entry.status === "todo" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700",
                      )}
                    >
                      {t(`admin.tontine.reminders.task.${entry.status}`)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
