// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { publishAnnouncement } from "app/pages/Annonces/announcementsStore";
import { personKey } from "app/pages/Annonces/audience";
import { currentAdmin } from "../currentAdmin";
import { useNetworkData } from "../context/NetworkDataContext";
import { listMembers, useMembersStore } from "../Membres/membersStore";
import { useTontineFormat } from "./format";
import { CRITERIA, antenneLeaderIds, computeRanking, cycleStartOf, isLeaderCandidate, ratingState } from "./priorityScore";
import { logMemberEvent } from "../Membres/membersStore";
import { CRITERION_STYLES } from "./priorityStyles";
import { PriorityVoteModal } from "./PriorityVoteModal";
import { addSwap, lookupFor, publishRanking, setDraw, setRoles, usePriorityStore } from "./priorityStore";
import { UrgencyRequests } from "./UrgencyRequests";

// ----------------------------------------------------------------------

const SELECT =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

function Badge({ children, className }) {
  return <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold", className)}>{children}</span>;
}

// L'onglet "Classement" de Gestion des tontines : l'ordre de passage d'un
// groupe, calculé par la plateforme avec le Score de Priorité DBC (voir
// priorityScore.js). L'administration ne choisit plus l'ordre : elle valide les
// urgences, suit les notes des parrains, désigne le mentor-parrain et
// le Community Manager Local, place lui-même les membres à égalité de score
// (flèches haut / bas), enregistre les échanges de rang, puis publie le classement (chaque membre est prévenu).
export function PriorityRanking({ groups }) {
  const { t } = useTranslation();
  const { month, money } = useTontineFormat();
  const priority = usePriorityStore();
  const membersSnapshot = useMembersStore();
  const [groupId, setGroupId] = useState(() => (groups.find((g) => g.members.length > 0) ?? groups[0])?.id ?? "");
  const [voteFor, setVoteFor] = useState(null);
  const [allOpen, setAllOpen] = useState(false);
  const [openRows, setOpenRows] = useState([]);

  const group = groups.find((g) => g.id === groupId) ?? groups[0] ?? null;
  const roles = (group && priority.roles[group.id]) || {};
  const swaps = (group && priority.swaps[group.id]) || [];
  const draw = group ? priority.draws[group.id] : null;
  const published = group ? priority.published[group.id] : null;

  const people = useMemo(() => listMembers(membersSnapshot), [membersSnapshot]);
  const { networksByCountry } = useNetworkData();
  const leaderIds = useMemo(() => antenneLeaderIds(networksByCountry), [networksByCountry]);
  const { candidates, ranking, mentorAutoId, cmAutoId } = useMemo(
    () => (group ? computeRanking({ group, people, priority, lookup: lookupFor(priority), leaderIds }) : { candidates: [], ranking: [], mentorAutoId: null, cmAutoId: null }),
    [group, people, priority, leaderIds],
  );

  if (!group) return null;

  const level = levels.find((l) => l.key === group.levelKey);
  const amount = level?.cagnotte ?? 0;
  const ties = ranking.filter((entry) => entry.tie);
  // Les membres d'un même mois reçoivent la cagnotte ensemble : on les regroupe par mois.
  const monthGroups = ranking.reduce((groups, entry) => {
    const key = entry.month.format("YYYY-MM");
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, month: entry.month, entries: [entry] });
    return groups;
  }, []);
  const upToDate =
    published && ranking.every((entry) => published.ranks[entry.candidate.id] === entry.rank) && ranking.length === Object.keys(published.ranks).length;
  const demoCount = candidates.filter((c) => c.demo).length;

  // Égalités de score : c'est l'administration qui choisit la place de chacun.
  // "tieIds" = les membres à égalité avec d'autres au même score, dans l'ordre actuel.
  const tieIds = (total) => ranking.filter((entry) => entry.inTie && entry.candidate.total === total).map((entry) => entry.candidate.id);

  const saveTieOrder = (ids) => {
    const rest = (draw?.order ?? []).filter((id) => !ids.includes(id));
    setDraw(group.id, [...rest, ...ids], currentAdmin.name);
  };

  const moveInTie = (entry, step) => {
    const ids = tieIds(entry.candidate.total);
    const from = ids.indexOf(entry.candidate.id);
    const to = from + step;
    if (from === -1 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    saveTieOrder(ids);
  };

  // Garder l'ordre affiché pour les égalités pas encore placées.
  const handleKeepOrder = () => {
    const ids = ties.map((entry) => entry.candidate.id);
    setDraw(group.id, [...(draw?.order ?? []).filter((id) => !ids.includes(id)), ...ids], currentAdmin.name);
  };

  const handlePublish = () => {
    const ranks = Object.fromEntries(ranking.map((entry) => [entry.candidate.id, entry.rank]));
    publishRanking(group.id, ranks, currentAdmin.name);
    ranking.forEach((entry) => {
      const { candidate } = entry;
      if (candidate.recordId) {
        logMemberEvent(candidate.recordId, "priorityRanked", { rank: entry.rank, total: ranking.length, score: candidate.total });
      }
      publishAnnouncement({
        kind: "reminder",
        title: t("tontinePriority.publish.msgTitle"),
        body: t("tontinePriority.publish.msgBody", {
          rank: entry.rank,
          total: ranking.length,
          group: t("admin.tontine.group", { letter: group.letter }),
          level: t(`simulateur.levels.${group.levelKey}.name`),
          month: month(entry.month),
          amount: money(amount),
          score: candidate.total,
        }),
        importance: "important",
        author: { role: "admin", name: t("tontinePriority.sender"), matricule: "", branchName: "" },
        audience: { type: "members", total: 1, names: [candidate.name] },
        recipients: [personKey({ matricule: candidate.matricule, name: candidate.name })],
      });
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <SparklesIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
              {t("tontinePriority.ranking.title")}
            </h2>
            <p className="mt-1 text-xs text-gray-500">{t("tontinePriority.ranking.hint")}</p>
          </div>
          <label className="w-full text-xs font-semibold text-gray-600 sm:w-72">
            {t("tontinePriority.ranking.group")}
            <select value={group.id} onChange={(event) => setGroupId(event.target.value)} className={SELECT}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {t(`simulateur.levels.${g.levelKey}.name`)} · {t("admin.tontine.group", { letter: g.letter })} ({g.members.length})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-gray-600">
            {t("tontinePriority.ranking.mentor")}
            <span className="block text-[11px] font-normal text-gray-400">{t("tontinePriority.ranking.mentorHint")}</span>
            <select
              value={roles.mentorId ?? ""}
              onChange={(event) => setRoles(group.id, { mentorId: event.target.value || null })}
              className={SELECT}
            >
              <option value="">
                {mentorAutoId
                  ? t("tontinePriority.ranking.mentorAuto", { name: candidates.find((c) => c.id === mentorAutoId)?.name })
                  : t("tontinePriority.ranking.mentorAutoNone")}
              </option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === roles.cmId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-gray-600">
            {t("tontinePriority.ranking.cm")}
            <span className="block text-[11px] font-normal text-gray-400">{t("tontinePriority.ranking.cmHint")}</span>
            <select
              value={roles.cmId ?? ""}
              onChange={(event) => setRoles(group.id, { cmId: event.target.value || null })}
              className={SELECT}
            >
              <option value="">
                {cmAutoId
                  ? t("tontinePriority.ranking.mentorAuto", { name: candidates.find((c) => c.id === cmAutoId)?.name })
                  : t("tontinePriority.ranking.cmAutoNone")}
              </option>
              {[true, false].map((leaders) => {
                const list = candidates.filter((c) => isLeaderCandidate(c, leaderIds) === leaders);
                if (list.length === 0) return null;
                return (
                  <optgroup key={String(leaders)} label={t(leaders ? "tontinePriority.ranking.leaders" : "tontinePriority.ranking.others")}>
                    {list.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === (roles.mentorId ?? mentorAutoId)}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
        </div>

        {demoCount > 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {t("tontinePriority.ranking.demoNotice", { count: demoCount })}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {t("tontinePriority.ranking.tableTitle", { month: month(cycleStartOf(group)) })}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {published
                ? t(upToDate ? "tontinePriority.publish.upToDate" : "tontinePriority.publish.changed", {
                    date: new Date(published.at).toLocaleDateString(),
                    by: published.by,
                  })
                : t("tontinePriority.publish.never")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ties.length > 0 && (
              <button
                type="button"
                onClick={handleKeepOrder}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
                {t("tontinePriority.ranking.draw", { count: ties.length })}
              </button>
            )}
            <button
              type="button"
              onClick={handlePublish}
              disabled={ranking.length === 0 || upToDate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MegaphoneIcon aria-hidden="true" className="size-4" />
              {t(published ? "tontinePriority.publish.republish" : "tontinePriority.publish.publish")}
            </button>
          </div>
        </div>
        {ties.length > 0 && <p className="mt-3 text-xs text-amber-800">{t("tontinePriority.ranking.drawHint")}</p>}

        <p className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-900">{t("tontinePriority.ranking.howTo")}</p>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setAllOpen((value) => !value)}
            aria-pressed={allOpen}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
          >
            {allOpen ? <ChevronUpIcon aria-hidden="true" className="size-3.5" /> : <ChevronDownIcon aria-hidden="true" className="size-3.5" />}
            {t(allOpen ? "tontinePriority.ranking.hideDetail" : "tontinePriority.ranking.showDetail")}
          </button>
        </div>

        <div className="mt-3 space-y-4">
          {monthGroups.map((monthGroup) => (
            <div key={monthGroup.key} className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-2.5">
                <h3 className="text-sm font-bold text-gray-900">{month(monthGroup.month)}</h3>
                <p className="text-xs text-gray-500">
                  {t("tontinePriority.ranking.monthGroup", { count: monthGroup.entries.length, amount: money(amount) })}
                </p>
              </div>
              <ul className="divide-y divide-gray-100">
                {monthGroup.entries.map((entry) => {
                  const c = entry.candidate;
                  const open = allOpen || openRows.includes(c.id);
                  return (
                    <li key={c.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            title={t("tontinePriority.ranking.rankTitle", { rank: entry.rank })}
                            className="inline-flex size-8 items-center justify-center rounded-full bg-[#EE7115]/10 text-sm font-bold text-[#EE7115]"
                          >
                            {entry.rank}
                          </span>
                          {entry.inTie && !entry.role && (
                            <span className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => moveInTie(entry, -1)}
                                aria-label={t("tontinePriority.ranking.moveUp", { name: c.name })}
                                title={t("tontinePriority.ranking.moveUp", { name: c.name })}
                                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <ChevronUpIcon aria-hidden="true" className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveInTie(entry, 1)}
                                aria-label={t("tontinePriority.ranking.moveDown", { name: c.name })}
                                title={t("tontinePriority.ranking.moveDown", { name: c.name })}
                                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <ChevronDownIcon aria-hidden="true" className="size-3.5" />
                              </button>
                            </span>
                          )}
                        </div>

                        <div className="min-w-[11rem] flex-1">
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {entry.role && (
                              <Badge className="bg-violet-50 text-violet-700">{t(`tontinePriority.ranking.role.${entry.role}`)}</Badge>
                            )}
                            {entry.tie && <Badge className="bg-amber-50 text-amber-800">{t("tontinePriority.ranking.tie")}</Badge>}
                            {entry.inTie && !entry.tie && !entry.role && (
                              <Badge className="bg-emerald-50 text-emerald-700">{t("tontinePriority.ranking.tiePlaced")}</Badge>
                            )}
                            {entry.swapped && <Badge className="bg-sky-50 text-sky-700">{t("tontinePriority.ranking.swapped")}</Badge>}
                            {entry.delayed && <Badge className="bg-gray-100 text-gray-600">{t("tontinePriority.ranking.delayed", { months: 6 })}</Badge>}
                            {c.declaration?.status === "pending" && (
                              <Badge className="bg-orange-50 text-orange-700">{t("tontinePriority.ranking.urgencyPending")}</Badge>
                            )}
                            {c.ratingRequest && ratingState(c.ratingRequest) !== "done" && (
                              <Badge className={ratingState(c.ratingRequest) === "pending" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-600"}>
                                {t(`tontinePriority.ranking.rating.${ratingState(c.ratingRequest)}`)}
                              </Badge>
                            )}
                            {c.demo && <Badge className="bg-gray-100 text-gray-500">{t("tontinePriority.ranking.demo")}</Badge>}
                          </div>
                        </div>

                        <div className="w-40 shrink-0">
                          <p className="text-right text-sm text-gray-500">
                            <span className="text-lg font-bold tabular-nums text-gray-900">{c.total}</span> / 100
                          </p>
                          <div
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.max(0, c.total)}
                            aria-label={t("tontinePriority.ranking.scoreOf", { name: c.name })}
                            className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100"
                          >
                            <div className="h-full rounded-full bg-[#EE7115]" style={{ width: `${Math.min(100, Math.max(0, c.total))}%` }} />
                          </div>
                        </div>

                        <div className="flex w-[11rem] items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenRows((rows) => (rows.includes(c.id) ? rows.filter((id) => id !== c.id) : [...rows, c.id]))
                            }
                            aria-expanded={open}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                          >
                            {t(open ? "tontinePriority.ranking.hideRow" : "tontinePriority.ranking.showRow")}
                            {open ? <ChevronUpIcon aria-hidden="true" className="size-3.5" /> : <ChevronDownIcon aria-hidden="true" className="size-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setVoteFor(c)}
                            aria-label={t("tontinePriority.ranking.editVote", { name: c.name })}
                            title={t("tontinePriority.ranking.editVote", { name: c.name })}
                            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          >
                            <PencilSquareIcon aria-hidden="true" className="size-4" />
                          </button>
                        </div>
                      </div>

                      {open && (
                        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          {CRITERIA.map(({ key, max }) => {
                            const part = c.parts[key];
                            const Icon = CRITERION_STYLES[key].Icon;
                            return (
                              <div key={key} className="rounded-xl bg-gray-50 px-3 py-2">
                                <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                  <Icon aria-hidden="true" className="size-3.5 text-gray-400" />
                                  {t(`tontinePriority.criteria.${key}.short`)}
                                </dt>
                                <dd className="mt-1">
                                  <span className={clsx("inline-block rounded-md px-1.5 py-0.5 text-xs font-bold", part.points < 0 ? "bg-red-50 text-red-700" : CRITERION_STYLES[key].chip)}>
                                    {part.empty ? "—" : part.points} / {max}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-gray-500">
                                    {t(`tontinePriority.rows.${key}.${part.key}.label`)}
                                  </span>
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <SwapSection group={group} ranking={ranking} swaps={swaps} />
      <UrgencyRequests />

      {voteFor && <PriorityVoteModal key={voteFor.id} candidate={voteFor} onClose={() => setVoteFor(null)} />}
    </div>
  );
}

// L'échange volontaire de rang entre deux membres (règle d'or 4) : co-signé
// par les deux, validé par le Comité de Gouvernance, enregistré, définitif.
function SwapSection({ group, ranking, swaps }) {
  const { t, i18n } = useTranslation();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [signedA, setSignedA] = useState(false);
  const [signedB, setSignedB] = useState(false);
  const [validated, setValidated] = useState(false);
  const nameOf = (id) => ranking.find((entry) => entry.candidate.id === id)?.candidate.name ?? id;
  const ready = a && b && a !== b && signedA && signedB && validated;

  const submit = (event) => {
    event.preventDefault();
    if (!ready) return;
    addSwap(group.id, { a, b, aName: nameOf(a), bName: nameOf(b) }, currentAdmin.name);
    setA("");
    setB("");
    setSignedA(false);
    setSignedB(false);
    setValidated(false);
  };

  const check = "size-4 rounded border-gray-300 text-[#EE7115] focus:ring-[#EE7115]";

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <ArrowsRightLeftIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
        {t("tontinePriority.swap.title")}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("tontinePriority.swap.hint")}</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { value: a, set: setA, other: b, label: "first" },
            { value: b, set: setB, other: a, label: "second" },
          ].map((field) => (
            <label key={field.label} className="text-xs font-semibold text-gray-600">
              {t(`tontinePriority.swap.${field.label}`)}
              <select value={field.value} onChange={(event) => field.set(event.target.value)} className={SELECT}>
                <option value="">{t("tontinePriority.swap.choose")}</option>
                {ranking.map((entry) => (
                  <option key={entry.candidate.id} value={entry.candidate.id} disabled={entry.candidate.id === field.other}>
                    {entry.rank}. {entry.candidate.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={signedA} onChange={(event) => setSignedA(event.target.checked)} className={check} />
            {t("tontinePriority.swap.signed", { name: a ? nameOf(a) : t("tontinePriority.swap.first").toLowerCase() })}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={signedB} onChange={(event) => setSignedB(event.target.checked)} className={check} />
            {t("tontinePriority.swap.signed", { name: b ? nameOf(b) : t("tontinePriority.swap.second").toLowerCase() })}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={validated} onChange={(event) => setValidated(event.target.checked)} className={check} />
            {t("tontinePriority.swap.validated")}
          </label>
        </div>
        <p className="text-xs font-semibold text-amber-800">{t("tontinePriority.swap.final")}</p>
        <button
          type="submit"
          disabled={!ready}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckBadgeIcon aria-hidden="true" className="size-4" />
          {t("tontinePriority.swap.record")}
        </button>
      </form>

      {swaps.length > 0 && (
        <ul className="mt-5 divide-y divide-gray-100 text-sm">
          {swaps.map((swap, index) => (
            <li key={`${swap.a}-${swap.b}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-semibold text-gray-800">
                {swap.aName} <ArrowsRightLeftIcon aria-hidden="true" className="inline size-3.5 text-gray-400" /> {swap.bName}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(swap.at).toLocaleDateString(i18n.language?.startsWith("fr") ? "fr-FR" : "en-US")} · {swap.by}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
