// Import Dependencies
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapIcon,
  ScaleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { listMembers, useMembersStore } from "app/pages/Admin/Membres/membersStore";
import { initialNetworksByCountry } from "app/pages/Admin/Reseau/mockData";
import { useTontineFormat } from "app/pages/Admin/Tontine/format";
import { getGroups } from "app/pages/Admin/Tontine/mockData";
import { useTontineLedger } from "app/pages/Admin/Tontine/tontineLedger";
import { PriorityRoadmap } from "app/pages/Admin/Tontine/PriorityRoadmap";
import { CRITERION_STYLES } from "app/pages/Admin/Tontine/priorityStyles";
import {
  CRITERIA,
  antenneLeaderIds,
  MIN_MONTHS_BEFORE_BENEFIT,
  URGENCY_REVIEW_HOURS,
  computeRanking,
  ratingState,
} from "app/pages/Admin/Tontine/priorityScore";
import { lookupFor, usePriorityStore } from "app/pages/Admin/Tontine/priorityStore";
import { runRatingEngine } from "app/pages/Admin/Tontine/ratingEngine";
import { currentMember } from "../currentMember";
import { useMemberLevel } from "../context/MemberLevelContext";
import { RatingRequests } from "./RatingForm";
import { UrgencyDeclareModal } from "./UrgencyDeclareModal";

// ----------------------------------------------------------------------

const TABS = ["score", "roadmap"];
const VISIBLE_RANKS = 6;

// "Mon ordre de passage" sur la page Ma Tontine : c'est la plateforme qui décide
// dans quel ordre le groupe reçoit la cagnotte, avec le Score de Priorité DBC
// (voir Admin/Tontine/priorityScore.js). Deux vues : « Mon score » (ma note sur
// 100, mon rang, ce qui me rapporte des points et ce que je peux faire pour en
// gagner, le classement du groupe une fois publié) et « Comment ça marche »
// (la feuille de route complète : critères, tableaux de points, 7 règles d'or,
// exemple). Les données de démonstration sont celles de l'administration.
export function PrioritySection() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("score");

  // Demandes de note aux mentors-parrains et rappels automatiques (ratingEngine.js).
  const ledger = useTontineLedger();
  const membersSnapshot = useMembersStore();
  const format = useTontineFormat();
  const formatRef = useRef(format);
  formatRef.current = format;
  const membersRef = useRef(membersSnapshot);
  membersRef.current = membersSnapshot;
  useEffect(() => {
    const { t: translate, day } = formatRef.current;
    runRatingEngine({ groups: getGroups(ledger), people: listMembers(membersRef.current), t: translate, day });
  }, [ledger]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <ScaleIcon aria-hidden="true" className="size-5 text-[#EE7115]" />
          {t("tontinePriority.member.title")}
        </h2>
        <div role="tablist" aria-label={t("tontinePriority.member.tabs.label")} className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                tab === key ? "bg-[#EE7115] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
            >
              {key === "roadmap" && <MapIcon aria-hidden="true" className="size-3.5" />}
              {t(`tontinePriority.member.tabs.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <RatingRequests />
        {tab === "score" ? <MyScore onRoadmap={() => setTab("roadmap")} /> : <PriorityRoadmap />}
      </div>
    </section>
  );
}

function MyScore({ onRoadmap }) {
  const { t } = useTranslation();
  const { month, money, day } = useTontineFormat();
  const { activeLevelKey } = useMemberLevel();
  const ledger = useTontineLedger();
  const priority = usePriorityStore();
  const membersSnapshot = useMembersStore();
  const [declaring, setDeclaring] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const group = useMemo(
    () => getGroups(ledger).find((g) => g.fromMemberSpace && g.levelKey === activeLevelKey) ?? null,
    [ledger, activeLevelKey],
  );
  const people = useMemo(() => listMembers(membersSnapshot), [membersSnapshot]);
  const { ranking } = useMemo(
    () => {
      // L'espace membre n'a pas accès à l'arbre du réseau modifié par l'admin : il lit celui de départ.
      const leaderIds = antenneLeaderIds(initialNetworksByCountry);
      return group ? computeRanking({ group, people, priority, lookup: lookupFor(priority), leaderIds }) : { ranking: [] };
    },
    [group, people, priority],
  );

  const me = ranking.find((entry) => entry.candidate.name === currentMember.name) ?? null;
  const declaration = lookupFor(priority).declarationOf({ matricule: currentMember.matricule, name: currentMember.name });

  if (!group || !me) {
    return (
      <p className="rounded-3xl border border-black/5 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        {t("tontinePriority.member.noGroup")}
      </p>
    );
  }

  const c = me.candidate;
  const level = levels.find((l) => l.key === group.levelKey);
  const published = priority.published[group.id];
  const isPublished = Boolean(published && published.ranks[c.id] === me.rank);
  const eligibleFrom = dayjs().startOf("month").add(Math.max(0, MIN_MONTHS_BEFORE_BENEFIT - c.months), "month");
  const newcomer = c.months < MIN_MONTHS_BEFORE_BENEFIT;
  const shown = showAll ? ranking : ranking.slice(0, VISIBLE_RANKS);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#52A2DF] to-[#3d6fb0] p-6 text-white sm:p-8">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">{t("tontinePriority.member.myScore")}</p>
            <p className="mt-2 text-5xl font-extrabold tabular-nums">
              {c.total}
              <span className="text-xl font-bold text-white/70"> / 100</span>
            </p>
          </div>
          <div className="text-sm text-white/90">
            <p className="text-lg font-bold text-white">{t("tontinePriority.member.rank", { rank: me.rank, total: ranking.length })}</p>
            <p className="mt-1">
              {t("tontinePriority.member.expected", { month: month(me.month), amount: money(level?.cagnotte ?? 0) })}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
              {isPublished ? (
                <>
                  <CheckBadgeIcon aria-hidden="true" className="size-4" />
                  {t("tontinePriority.member.published", { date: day(dayjs(published.at)) })}
                </>
              ) : (
                <>
                  <ClockIcon aria-hidden="true" className="size-4" />
                  {t("tontinePriority.member.provisional")}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {newcomer && (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <span>{t("tontinePriority.member.newcomer", { months: MIN_MONTHS_BEFORE_BENEFIT, month: month(eligibleFrom) })}</span>
        </p>
      )}
      {me.role && (
        <p className="rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
          {t(`tontinePriority.member.role.${me.role}`)}
        </p>
      )}
      {me.tie && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{t("tontinePriority.member.tie")}</p>}

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {CRITERIA.map(({ key, max }) => {
          const part = c.parts[key];
          const style = CRITERION_STYLES[key];
          const { Icon } = style;
          const width = Math.max(0, Math.min(100, (part.points / max) * 100));
          return (
            <li key={key} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={clsx("flex size-9 shrink-0 items-center justify-center rounded-xl", style.chip)}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">{t(`tontinePriority.criteria.${key}.name`)}</p>
                  <p className="truncate text-xs text-gray-500">
                    {part.empty ? t("tontinePriority.member.notYet") : t(`tontinePriority.rows.${key}.${part.key}.label`)}
                  </p>
                </div>
                <p className={clsx("text-lg font-extrabold tabular-nums", part.points < 0 ? "text-red-600" : "text-gray-900")}>
                  {part.empty ? "—" : part.points}
                  <span className="text-xs font-semibold text-gray-400"> / {max}</span>
                </p>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.max(0, part.points)}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={t(`tontinePriority.criteria.${key}.name`)}
                className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
              >
                <div className={clsx("h-full rounded-full", style.bar)} style={{ width: `${width}%` }} />
              </div>
              <p className="mt-3 text-xs text-gray-500">{t(`tontinePriority.member.tips.${key}`)}</p>
              {key === "urgency" && <UrgencyState declaration={declaration} onDeclare={() => setDeclaring(true)} />}
              {key === "recommendation" && <MyRatingState request={c.ratingRequest} />}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onRoadmap}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#EE7115] hover:underline"
      >
        <MapIcon aria-hidden="true" className="size-4" />
        {t("tontinePriority.member.seeRoadmap")}
      </button>

      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-bold text-gray-900">{t("tontinePriority.member.groupRanking")}</h3>
        {published ? (
          <>
            <ol className="mt-3 divide-y divide-gray-100">
              {shown.map((entry) => (
                <li
                  key={entry.candidate.id}
                  className={clsx(
                    "flex items-center gap-3 py-2.5 text-sm",
                    entry.candidate.id === c.id && "-mx-2 rounded-xl bg-[#EE7115]/5 px-2",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {entry.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-gray-800">{entry.candidate.name}</span>
                  <span className="hidden text-xs text-gray-500 sm:inline">{month(entry.month)}</span>
                  <span className="w-10 text-right font-bold tabular-nums text-gray-900">{entry.candidate.total}</span>
                </li>
              ))}
            </ol>
            {ranking.length > VISIBLE_RANKS && (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="mt-3 text-xs font-semibold text-[#EE7115] hover:underline"
              >
                {showAll ? t("tontinePriority.member.showLess") : t("tontinePriority.member.showAll", { count: ranking.length - VISIBLE_RANKS })}
              </button>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{t("tontinePriority.member.notPublished")}</p>
        )}
      </div>

      {declaring && <UrgencyDeclareModal initial={declaration} onClose={() => setDeclaring(false)} />}
    </div>
  );
}

// L'état de ma déclaration d'urgence, et le bouton pour la faire ou la refaire.
function UrgencyState({ declaration, onDeclare }) {
  const { t } = useTranslation();
  const status = declaration?.status ?? "none";
  const Icon = status === "validated" ? CheckBadgeIcon : status === "rejected" ? XCircleIcon : status === "pending" ? ClockIcon : BoltIcon;
  const tone =
    status === "validated"
      ? "bg-green-50 text-green-800"
      : status === "rejected"
        ? "bg-red-50 text-red-800"
        : status === "pending"
          ? "bg-amber-50 text-amber-900"
          : "bg-gray-50 text-gray-700";

  return (
    <div className={clsx("mt-3 rounded-2xl p-3 text-xs", tone)}>
      <p className="flex items-start gap-2 font-semibold">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{t(`tontinePriority.member.urgencyState.${status}`, { hours: URGENCY_REVIEW_HOURS })}</span>
      </p>
      {status === "rejected" && declaration.note && <p className="mt-1 pl-6">{declaration.note}</p>}
      {status !== "validated" && (
        <button
          type="button"
          onClick={onDeclare}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <BoltIcon aria-hidden="true" className="size-3.5" />
          {t(status === "none" ? "tontinePriority.member.declare" : "tontinePriority.member.redeclare")}
        </button>
      )}
    </div>
  );
}

// Où en est la note de mon mentor-parrain.
function MyRatingState({ request }) {
  const { t } = useTranslation();
  const { day } = useTontineFormat();
  const state = ratingState(request);
  if (state === "none") return null;
  const due = dayjs(request.dueAt);
  const tone =
    state === "done" ? "bg-green-50 text-green-800" : state === "pending" ? "bg-amber-50 text-amber-900" : "bg-gray-50 text-gray-700";
  return (
    <p className={clsx("mt-3 rounded-2xl p-3 text-xs font-semibold", tone)}>
      {t(`tontinePriority.member.ratingState.${state}`, {
        name: request.sponsorName,
        date: `${day(due)} ${due.format("HH:mm")}`,
        average: String(request.average ?? "").replace(".", ","),
      })}
    </p>
  );
}
