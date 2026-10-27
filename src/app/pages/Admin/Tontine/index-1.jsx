// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { ConfirmDialog } from "../Membres/ConfirmDialog";
import { useMembersStore } from "../Membres/membersStore";
import { levelNumbers } from "../Membres/mockData";
import { BeneficiariesPanel } from "./BeneficiariesPanel";
import { CampaignDetailModal } from "./CampaignDetailModal";
import { CampaignFormModal } from "./CampaignFormModal";
import { ChoiceCampaigns } from "./ChoiceCampaigns";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupCard } from "./GroupCard";
import { GroupDetailModal } from "./GroupDetailModal";
import { LateContributions } from "./LateContributions";
import { LevelAmounts } from "./LevelAmounts";
import { TontineStats } from "./TontineStats";
import { WaitingMembers } from "./WaitingMembers";
import { YearPlanning } from "./YearPlanning";
import { useTontineFormat } from "./format";
import { getGroupHealth, getGroups, getWaitingByLevel, summarizeGroups } from "./mockData";
import { createCampaign, markValidated, useMonthChoices } from "./monthChoices";
import { addMembersToGroup, createTontineGroup, recordPayout, useTontineLedger } from "./tontineLedger";

// ----------------------------------------------------------------------

const STATUS_FILTERS = ["all", "running", "late", "complete", "pending"];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// Page "Gestion des tontines" (/admin/tontine) : la vue d'ensemble de TOUTES
// les tontines de la plateforme. Un niveau DBC peut avoir plusieurs groupes,
// chacun avec son propre cycle de 12 tours — donc plusieurs bénéficiaires le
// même mois. De haut en bas : les chiffres du mois, qui reçoit la cagnotte,
// qui est en retard, la fiche de chaque groupe, le planning des
// bénéficiaires sur 12 mois, et les membres qui attendent encore un groupe.
// L'admin ne valide jamais la cotisation d'un membre : elle compte dès que le
// membre a payé. Il peut en revanche marquer une cagnotte comme versée et
// créer un groupe avec des membres en attente (voir tontineLedger.js).
// Données de démonstration (voir mockData.js), en attendant le backend.
export default function Tontine() {
  const { t } = useTranslation();
  const { money } = useTontineFormat();
  const ledger = useTontineLedger();
  const choices = useMonthChoices();
  const allGroups = useMemo(() => getGroups(ledger), [ledger]);
  const membersSnapshot = useMembersStore();
  const waitingByLevel = useMemo(() => getWaitingByLevel(ledger, membersSnapshot), [ledger, membersSnapshot]);

  const [activeLevel, setActiveLevel] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openGroupId, setOpenGroupId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  // "null" : fermé ; sinon le niveau proposé d'office dans le formulaire ("" = aucun).
  const [createFor, setCreateFor] = useState(null);
  // Demandes de choix des mois : formulaire d'envoi, et demande ouverte en détail.
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [openCampaignId, setOpenCampaignId] = useState(null);
  // Le groupe dont on demande les choix pour les mois libres ("" : un nouveau groupe).
  const [campaignGroupId, setCampaignGroupId] = useState("");

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

  const askPayout = (group) => setConfirm({ type: "payout", groupId: group.id });

  const confirmGroup = confirm ? allGroups.find((group) => group.id === confirm.groupId) : null;

  const runConfirm = () => {
    if (confirmGroup && confirm.type === "payout") {
      recordPayout(confirmGroup.id, confirmGroup.tour);
    }
    setConfirm(null);
  };

  const handleCreate = (record) => {
    createTontineGroup(record);
    setCreateFor(null);
    setActiveLevel("all");
    setStatusFilter("all");
    setSearch("");
    setOpenGroupId(record.id);
  };

  const handleCampaign = (data) => {
    const campaign = createCampaign(data);
    setCampaignFormOpen(false);
    setCampaignGroupId("");
    setOpenCampaignId(campaign.id);
  };

  // Valider l'ordre d'une demande : un nouveau groupe est créé dans cet ordre,
  // ou les membres sont placés sur les mois libres du groupe visé.
  const handleValidateOrder = (campaign, record) => {
    const groupId = record.groupId ?? record.id;
    if (record.groupId) addMembersToGroup(record.groupId, record.members);
    else createTontineGroup(record);
    markValidated(campaign.id, groupId);
    setOpenCampaignId(null);
    setActiveLevel("all");
    setStatusFilter("all");
    setSearch("");
    setOpenGroupId(groupId);
  };

  // Placer directement un membre en attente sur un mois libre d'un groupe ouvert.
  const handlePlace = (group, member, monthValue) => {
    addMembersToGroup(group.id, [{ id: member.id, name: member.name, city: member.city, month: monthValue }]);
  };

  const askChoices = (group) => {
    setCampaignGroupId(group.id);
    setOpenGroupId(null);
    setCampaignFormOpen(true);
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCampaignGroupId("");
              setCampaignFormOpen(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ChatBubbleLeftRightIcon aria-hidden="true" className="size-4" />
            {t("admin.tontine.choices.decideOrder")}
          </button>
          <button
            type="button"
            onClick={() => setCreateFor(activeLevel === "all" ? "" : activeLevel)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {t("admin.tontine.newGroup")}
          </button>
        </div>
        </div>

        <TontineStats stats={stats} waitingCount={waitingCount} waitingLevels={waitingEntries.length} />

        <div className="mt-6">
          <ChoiceCampaigns
            campaigns={choices.campaigns}
            onCreate={() => {
              setCampaignGroupId("");
              setCampaignFormOpen(true);
            }}
            onOpen={setOpenCampaignId}
          />
        </div>


        <div className="mt-6">
          <LevelAmounts groups={allGroups} activeLevel={activeLevel} onSelect={setActiveLevel} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <BeneficiariesPanel groups={searchedGroups} onOpenGroup={setOpenGroupId} onRequestPayout={askPayout} />
          </div>
          <LateContributions entries={lateEntries} onOpenGroup={setOpenGroupId} />
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-900">{t("admin.tontine.groupsTitle")}</h2>
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
                      isActive
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 shadow-sm hover:bg-gray-50",
                    )}
                  >
                    {t(`admin.tontine.filters.${key}`)} · {statusCounts[key]}
                  </button>
                );
              })}
            </div>
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

        <div className="mt-8">
          <YearPlanning groups={visibleGroups} onOpenGroup={setOpenGroupId} />
        </div>

        <div className="mt-8">
          <WaitingMembers
            entries={waitingEntries}
            openGroups={openGroups}
            onCreateGroup={setCreateFor}
            onOpenGroup={setOpenGroupId}
          />
        </div>
      </div>

      <GroupDetailModal
        group={openGroup}
        locked={Boolean(confirm)}
        waiting={waitingByLevel.find((entry) => entry.levelKey === openGroup?.levelKey)?.members ?? []}
        onClose={() => setOpenGroupId(null)}
        onRequestPayout={askPayout}
        onPlace={handlePlace}
        onAskChoices={askChoices}
      />

      {confirm && confirmGroup && (
        <ConfirmDialog
          open
          title={t("admin.tontine.confirm.payout.title")}
          description={t("admin.tontine.confirm.payout.description", {
            name: confirmGroup.beneficiary?.name,
            amount: money(confirmGroup.payout.amount),
            tour: confirmGroup.tour,
            letter: confirmGroup.letter,
            level: t(`simulateur.levels.${confirmGroup.levelKey}.name`),
          })}
          confirmLabel={t("admin.tontine.confirm.payout.confirmLabel")}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {campaignFormOpen && (
        <CampaignFormModal
          campaigns={choices.campaigns}
          groups={allGroups}
          initialGroupId={campaignGroupId}
          onClose={() => setCampaignFormOpen(false)}
          onCreate={handleCampaign}
        />
      )}

      {openCampaignId && (
        <CampaignDetailModal
          campaignId={openCampaignId}
          groups={allGroups}
          onClose={() => setOpenCampaignId(null)}
          onValidate={handleValidateOrder}
        />
      )}

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
