// Import Dependencies
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { ClipboardDocumentCheckIcon, PlusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { useNetworkData } from "../context/NetworkDataContext";
import { listMembers, useMembersStore } from "../Membres/membersStore";
import { levelNumbers } from "../Membres/mockData";
import { BeneficiariesPanel } from "./BeneficiariesPanel";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupCard } from "./GroupCard";
import { EscalationPanel } from "./EscalationPanel";
import { runEscalation } from "./escalationEngine";
import { runRatingEngine } from "./ratingEngine";
import { useTontineFormat } from "./format";
import { GroupDetailModal } from "./GroupDetailModal";
import { LateContributions } from "./LateContributions";
import { LevelAmounts } from "./LevelAmounts";
import { PriorityTab } from "./PriorityTab";
import { pendingDeclarations, usePriorityStore } from "./priorityStore";
import { TontineStats } from "./TontineStats";
import { WaitingMembers } from "./WaitingMembers";
import { YearPlanning } from "./YearPlanning";
import { getGroupHealth, getGroups, getWaitingByLevel, summarizeGroups } from "./mockData";
import { addMembersToGroup, createTontineGroup, useTontineLedger } from "./tontineLedger";
import { TontineGuide } from "./guide/TontineGuide";

// ----------------------------------------------------------------------

const STATUS_FILTERS = ["all", "running", "late", "complete", "pending"];
const TABS = ["overview", "groups", "planning", "priority", "waiting", "reminders"];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// Page "Gestion des tontines" (/admin/tontine) : la vue d'ensemble de TOUTES
// les tontines de la plateforme. Un niveau DBC peut avoir plusieurs groupes,
// chacun avec son propre cycle de 12 tours ; un groupe réunit 36 personnes, donc
// 3 bénéficiaires par mois et par groupe. De haut en bas : les chiffres du mois, qui reçoit la cagnotte,
// qui est en retard, la fiche de chaque groupe, le planning des
// bénéficiaires sur 12 mois, et les membres qui attendent encore un groupe.
// Pour ne pas tout empiler sur une seule page, ces blocs sont rangés en
// onglets (l'onglet ouvert reste dans l'adresse : "?vue=groupes"). Le suivi
// des cotisations, lui, a sa propre page (voir Cotisations.jsx).
// L'admin ne valide jamais la cotisation d'un membre : elle compte dès que le
// membre a payé, et il ne marque pas non plus une cagnotte comme versée. Il
// peut en revanche créer un groupe avec des membres en attente (voir
// tontineLedger.js).
// Données de démonstration (voir mockData.js), en attendant le backend.
export default function Tontine() {
  const { t } = useTranslation();
  const ledger = useTontineLedger();
  const priority = usePriorityStore();
  const allGroups = useMemo(() => getGroups(ledger), [ledger]);
  const membersSnapshot = useMembersStore();
  const waitingByLevel = useMemo(() => getWaitingByLevel(ledger, membersSnapshot), [ledger, membersSnapshot]);

  // Relance automatique : à chaque ouverture de la page, les étapes que le retard
  // de chaque membre a atteintes se déclenchent (voir escalationEngine.js).
  const { networksByCountry } = useNetworkData();
  const networksRef = useRef(networksByCountry);
  networksRef.current = networksByCountry;
  const format = useTontineFormat();
  const formatRef = useRef(format);
  formatRef.current = format;
  const allLateEntries = useMemo(() => summarizeGroups(allGroups).lateMembers, [allGroups]);
  const membersRef = useRef(membersSnapshot);
  membersRef.current = membersSnapshot;
  useEffect(() => {
    const { t: translate, money, day } = formatRef.current;
    runEscalation({
      lateEntries: allLateEntries,
      members: listMembers(membersRef.current),
      networks: networksRef.current,
      today: dayjs(),
      t: translate,
      money,
      day,
    });
  }, [allLateEntries]);

  // Notes des mentors-parrains : demandes et rappels automatiques (voir ratingEngine.js).
  const groupsRef = useRef(allGroups);
  groupsRef.current = allGroups;
  useEffect(() => {
    const { t: translate, day } = formatRef.current;
    runRatingEngine({ groups: groupsRef.current, people: listMembers(membersRef.current), t: translate, day });
  }, [allGroups]);

  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("vue")) ? params.get("vue") : "overview";
  const setTab = (key) => setParams(key === "overview" ? {} : { vue: key }, { replace: true });

  const [activeLevel, setActiveLevel] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openGroupId, setOpenGroupId] = useState(null);
  // "null" : fermé ; sinon le niveau proposé d'office dans le formulaire ("" = aucun).
  const [createFor, setCreateFor] = useState(null);
  // Demandes de choix des mois : formulaire d'envoi, et demande ouverte en détail.
  // Le groupe dont on demande les choix pour les mois libres ("" : un nouveau groupe).

  const levelGroups = allGroups.filter((group) => activeLevel === "all" || group.levelKey === activeLevel);

  // La recherche porte sur le niveau, le groupe et le nom de ses membres.
  const query = normalize(search.trim());
  const searchedGroups = query
    ? levelGroups.filter((group) =>
        [
          t(`simulateur.levels.${group.levelKey}.name`),
          t("admin.tontine.group", { letter: group.letter }),
          ...group.members.map((member) => member.name),
        ].some((text) => normalize(text).includes(query)),
      )
    : levelGroups;

  const statusCounts = Object.fromEntries(
    STATUS_FILTERS.map((key) => [
      key,
      searchedGroups.filter((group) => matchesStatus(group, key)).length,
    ]),
  );
  const visibleGroups = searchedGroups.filter((group) => matchesStatus(group, statusFilter));

  const stats = summarizeGroups(levelGroups);
  const waitingEntries = waitingByLevel.filter((entry) => activeLevel === "all" || entry.levelKey === activeLevel);
  const waitingCount = waitingEntries.reduce((sum, entry) => sum + entry.members.length, 0);

  const openGroup = allGroups.find((group) => group.id === openGroupId) ?? null;

  const lateEntries = summarizeGroups(searchedGroups).lateMembers;

  const handleCreate = (record) => {
    createTontineGroup(record);
    setCreateFor(null);
    setActiveLevel("all");
    setStatusFilter("all");
    setSearch("");
    setOpenGroupId(record.id);
  };

  // Placer directement un membre en attente sur un mois libre d'un groupe ouvert (3 par mois au plus).
  const handlePlace = (group, member, monthValue) => {
    addMembersToGroup(group.id, [{ id: member.id, name: member.name, city: member.city, month: monthValue }]);
  };

  // Les groupes qui ont encore des mois libres : on y place des membres sans attendre.
  const openGroups = allGroups.filter((group) => group.capacity && group.freeSlots.length > 0);

  return (
    <Page title={`Admin – ${t("admin.tontine.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.tontine.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.tontine.searchPlaceholder")}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-stretch gap-2 rounded-2xl bg-white p-1.5 shadow-sm sm:rounded-full">
          {["all", ...levels.map((level) => level.key)].map((key) => {
            const count = key === "all" ? allGroups.length : allGroups.filter((g) => g.levelKey === key).length;
            const hasWaiting = waitingByLevel.some((entry) => entry.levelKey === key);
            if (key !== "all" && count === 0 && !hasWaiting) return null;
            const isActive = key === activeLevel;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveLevel(key)}
                aria-pressed={isActive}
                className={clsx(
                  "flex flex-col items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                  isActive
                    ? "bg-[#EE7115] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                )}
              >
                <span>
                  {key === "all" ? t("admin.tontine.allLevels") : t("admin.membres.level", { n: levelNumbers[key] })}
                </span>
                <span className={clsx("text-[10px] font-semibold", isActive ? "text-white/80" : "text-gray-400")}>
                  {t("admin.tontine.groupsCount", { count })}
                </span>
              </button>
            );
          })}
        </div>

        <nav aria-label={t("admin.tontine.quickLinks")} className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to="/admin/tontine/cotisations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-[#EE7115]"
          >
            <ClipboardDocumentCheckIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
            {t("admin.tontine.trackingLink")}
          </Link>
          <TontineGuide voice="admin" />
        </nav>

        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-black/10">
        <div role="tablist" aria-label={t("admin.tontine.tabs.label")} className="flex gap-1 overflow-x-auto">
          {TABS.map((key) => {
            const isActive = key === tab;
            const count =
              key === "groups"
                ? levelGroups.length
                : key === "priority"
                  ? pendingDeclarations(priority).length
                  : key === "waiting"
                    ? waitingCount
                    : key === "reminders"
                      ? allLateEntries.length
                      : 0;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tontine-tab-${key}`}
                aria-selected={isActive}
                aria-controls="tontine-tab-panel"
                onClick={() => setTab(key)}
                className={clsx(
                  "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold outline-none transition-colors focus-visible:bg-gray-50",
                  isActive
                    ? "border-[#EE7115] text-[#EE7115]"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
              >
                {t(`admin.tontine.tabs.${key}`)}
                {count > 0 && (
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      isActive ? "bg-[#EE7115]/10 text-[#EE7115]" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <button
            type="button"
            onClick={() => setCreateFor(activeLevel === "all" ? "" : activeLevel)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {t("admin.tontine.newGroup")}
          </button>
        </div>
        </div>

        <div id="tontine-tab-panel" role="tabpanel" aria-labelledby={`tontine-tab-${tab}`} className="mt-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <TontineStats stats={stats} waitingCount={waitingCount} waitingLevels={waitingEntries.length} />
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <BeneficiariesPanel groups={searchedGroups} onOpenGroup={setOpenGroupId} />
                </div>
                <LateContributions entries={lateEntries} onOpenGroup={setOpenGroupId} />
              </div>
              <LevelAmounts groups={allGroups} activeLevel={activeLevel} onSelect={setActiveLevel} />
            </div>
          )}

          {tab === "groups" && (
            <section>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("admin.tontine.filters.label")}>
                {STATUS_FILTERS.map((key) => {
                  const isActive = key === statusFilter;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      aria-pressed={isActive}
                      className={clsx(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        isActive ? "bg-gray-900 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-gray-50",
                      )}
                    >
                      {t(`admin.tontine.filters.${key}`)} · {statusCounts[key]}
                    </button>
                  );
                })}
              </div>

              {visibleGroups.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-gray-500">
                  {t("admin.tontine.noGroups")}
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleGroups.map((group) => (
                    <GroupCard key={group.id} group={group} onOpen={setOpenGroupId} />
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "planning" && <YearPlanning groups={searchedGroups} onOpenGroup={setOpenGroupId} />}

          {tab === "priority" && <PriorityTab groups={allGroups} />}

          {tab === "reminders" && <EscalationPanel lateEntries={allLateEntries} />}

          {tab === "waiting" && (
            <WaitingMembers
              entries={waitingEntries}
              openGroups={openGroups}
              onCreateGroup={setCreateFor}
              onOpenGroup={setOpenGroupId}
            />
          )}
        </div>
      </div>

      <GroupDetailModal
        group={openGroup}
        waiting={waitingByLevel.find((entry) => entry.levelKey === openGroup?.levelKey)?.members ?? []}
        onClose={() => setOpenGroupId(null)}
        onPlace={handlePlace}
      />

      {createFor !== null && (
        <CreateGroupModal
          waitingByLevel={waitingByLevel}
          groups={allGroups}
          initialLevelKey={createFor}
          onClose={() => setCreateFor(null)}
          onCreate={handleCreate}
        />
      )}
    </Page>
  );
}

function matchesStatus(group, key) {
  if (key === "all") return true;
  if (key === "late") return getGroupHealth(group) === "late";
  return group.status === key;
}
