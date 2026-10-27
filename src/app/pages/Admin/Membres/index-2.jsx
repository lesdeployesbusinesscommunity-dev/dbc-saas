// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { LevelTabs } from "./LevelTabs";
import { MembersFolder } from "./MembersFolder";
import { MembersToolbar } from "./MembersToolbar";
import { MembersTable } from "./MembersTable";
import { Pagination } from "./Pagination";
import { AddMemberModal } from "./AddMemberModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { MemberDetailsCard } from "./MemberDetailsCard";
import { TopMembers } from "./TopMembers";
import { MembersSummary } from "./MembersSummary";
import { MembersViewTabs } from "./MembersViewTabs";
import { LeadersPanel } from "./LeadersPanel";
import { LeaderFormModal } from "./LeaderFormModal";
import { DismissLeaderModal } from "./DismissLeaderModal";
import { ActivityJournal } from "./ActivityJournal";
import { MemberFollowUp } from "./MemberFollowUp";
import { levelNumbers } from "./mockData";
import { useLeaderLabels } from "./leaderData";
import {
  activeTerms as selectActiveTerms,
  appointLeader,
  createMember,
  deleteMember,
  dismissLeader,
  eventsOf,
  listMembers,
  pastTerms as selectPastTerms,
  setMemberStatus,
  suggestMatricule,
  termsOf,
  updateLeader,
  updateMember,
  useMembersStore,
} from "./membersStore";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------

const PAGE_SIZE = 6;

// Exporte la liste affichée en CSV, tout en local (pas d'appel réseau) —
// à remplacer par un vrai export serveur si le volume de membres grandit.
// Le niveau est repris par ligne (member.levelKey) plutôt que fixé une
// fois pour toutes, pour rester correct aussi bien pour un dossier que
// pour la vue "Tous les niveaux". "t" et "leaderOf" sont passés par
// l'appelant pour que les en-têtes, les noms de niveau et la fonction de
// leader restent dans la langue active.
function exportToCsv(members, fileLabel, t, leaderOf) {
  const headers = [
    t("admin.membres.table.columns.matricule"),
    t("admin.membres.table.columns.name"),
    t("admin.membres.table.columns.role"),
    t("admin.membres.table.columns.domain"),
    t("admin.membres.table.columns.level"),
    t("admin.membres.table.columns.city"),
    t("admin.membres.table.columns.country"),
    t("admin.membres.table.columns.sponsor"),
    t("admin.membres.modal.sponsorMatricule"),
    t("admin.membres.table.columns.coins"),
    t("admin.membres.table.columns.status"),
    t("admin.membres.leaders.columns.function"),
  ];
  const rows = members.map((m) => [
    m.matricule, m.name, m.role, m.domain,
    m.levelKey ? t(`simulateur.levels.${m.levelKey}.name`) : "",
    m.city, m.country, m.sponsorName ?? "", m.sponsorMatricule ?? "", m.coins, m.status,
    leaderOf(m),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `membres-${fileLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Page "Gestion des membres" (/admin/membres). Trois vues :
//   - Membres : un dossier par niveau DBC (étiquettes en haut), le tableau
//     des membres, et le bouton "Créer un membre" — l'endroit où chaque
//     membre est créé ;
//   - Leaders : les leaders en poste, nommer / modifier / destituer, et
//     l'historique des anciens leaders ;
//   - Journal : tout ce qui a été fait, filtrable et exportable.
// Tout est gardé dans le navigateur pour l'instant (voir membersStore.js)
// en attendant le backend.
export default function Membres() {
  const { t } = useTranslation();
  const { functionLabel } = useLeaderLabels();
  const snap = useMembersStore();

  const [view, setView] = useState("members");
  // "all" affiche tous les niveaux combinés ; sinon c'est une clé de
  // "levels" (app/pages/Simulateur/data).
  const [activeLevel, setActiveLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("aucun");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // { mode, member, lockLevel, defaultLevel } | null
  const [viewMemberId, setViewMemberId] = useState(null); // fiche "Voir"
  const [confirmAction, setConfirmAction] = useState(null); // { type: "update"|"toggle"|"delete", member } | null
  const [leaderForm, setLeaderForm] = useState(null); // { mode, member, term } | null
  const [dismissTarget, setDismissTarget] = useState(null); // mandat à retirer | null
  const [notice, setNotice] = useState(null); // { id, name, matricule } | null

  const allMembers = useMemo(() => listMembers(snap), [snap]);
  const membersById = useMemo(
    () => Object.fromEntries(allMembers.map((member) => [member.id, member])),
    [allMembers],
  );
  const currentTerms = useMemo(() => selectActiveTerms(snap), [snap]);
  const previousTerms = useMemo(() => selectPastTerms(snap), [snap]);
  const termsByMember = useMemo(
    () => Object.fromEntries(currentTerms.map((term) => [term.memberId, term])),
    [currentTerms],
  );
  // Nom et matricule d'un membre depuis le journal : sert aux anciens
  // mandats d'un membre supprimé depuis.
  const fallbackNames = useMemo(() => {
    const map = {};
    snap.journal.forEach((event) => {
      if (!map[event.memberId]) map[event.memberId] = { name: event.name, matricule: event.matricule };
    });
    return map;
  }, [snap.journal]);

  const summaryCounts = useMemo(
    () => ({
      total: allMembers.length,
      actif: allMembers.filter((member) => member.status === "actif").length,
      attente: allMembers.filter((member) => member.status === "attente").length,
      desactive: allMembers.filter((member) => member.status === "desactive").length,
      leaders: currentTerms.length,
    }),
    [allMembers, currentTerms],
  );

  // Membres du niveau ouvert, après la recherche (avant le filtre d'état).
  const scopeList = useMemo(() => {
    let arr = activeLevel === "all" ? allMembers : allMembers.filter((member) => member.levelKey === activeLevel);
    if (search.trim()) {
      // normalizeSearchText tolère accents/casse/tirets des deux côtés
      // (voir searchUtils.js) — un clavier réglé en anglais retrouve
      // "Aïcha" en tapant "aicha".
      const query = normalizeSearchText(search);
      arr = arr.filter(
        (member) =>
          normalizeSearchText(member.name).includes(query) ||
          normalizeSearchText(member.matricule).includes(query),
      );
    }
    return arr;
  }, [allMembers, activeLevel, search]);

  const statusCounts = useMemo(
    () => ({
      all: scopeList.length,
      actif: scopeList.filter((member) => member.status === "actif").length,
      attente: scopeList.filter((member) => member.status === "attente").length,
      desactive: scopeList.filter((member) => member.status === "desactive").length,
      leader: scopeList.filter((member) => termsByMember[member.id]).length,
    }),
    [scopeList, termsByMember],
  );

  const list = useMemo(() => {
    const arr = scopeList.filter((member) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "leader") return !!termsByMember[member.id];
      return member.status === statusFilter;
    });

    switch (filter) {
      case "aucun":
        break;
      case "recent":
        arr.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
        break;
      case "ville":
        arr.sort((a, b) => (a.city ?? "").localeCompare(b.city ?? ""));
        break;
      case "pays":
        arr.sort((a, b) => (a.country ?? "").localeCompare(b.country ?? ""));
        break;
      default:
        arr.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
    }
    return arr;
  }, [scopeList, statusFilter, filter, termsByMember]);

  // Revenir à la première page dès que le contenu affiché change (niveau,
  // recherche ou filtres) pour ne pas rester bloqué sur une page vide.
  useEffect(() => {
    setPage(1);
  }, [activeLevel, search, filter, statusFilter]);

  // Le message de confirmation après une création disparaît tout seul.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 9000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paginatedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // "Créer un membre" reprend le niveau du dossier ouvert (modifiable dans
  // le formulaire) ; en vue "Tous les niveaux", le niveau est libre.
  const openCreate = () => {
    setModal({ mode: "add", defaultLevel: activeLevel === "all" ? undefined : activeLevel });
  };
  const closeModal = () => setModal(null);

  const viewMember = viewMemberId ? (membersById[viewMemberId] ?? null) : null;
  const openView = (member) => setViewMemberId(member.id);
  const openViewById = (memberId) => {
    if (membersById[memberId]) setViewMemberId(memberId);
  };
  const closeView = () => setViewMemberId(null);

  // "Mettre à jour", les changements d'état et "Supprimer" passent par une
  // confirmation avant de s'exécuter (voir ConfirmDialog ci-dessous) —
  // demandé explicitement par l'utilisateur.
  const askUpdate = (member) => setConfirmAction({ type: "update", member });
  const askToggleStatus = (member) => setConfirmAction({ type: "toggle", member });
  const askDelete = (member) => setConfirmAction({ type: "delete", member });
  const cancelConfirm = () => setConfirmAction(null);

  const runConfirmedAction = () => {
    if (!confirmAction) return;
    const { type, member } = confirmAction;

    if (type === "update") {
      setModal({ mode: "edit", member, defaultLevel: member.levelKey });
    } else if (type === "toggle") {
      // en attente -> actif (activation), actif -> désactivé, désactivé -> actif
      setMemberStatus(member.id, member.status === "actif" ? "desactive" : "actif");
    } else if (type === "delete") {
      deleteMember(member.id);
      if (viewMemberId === member.id) setViewMemberId(null);
    }

    setConfirmAction(null);
  };

  const handleSubmit = (levelKey, form) => {
    if (modal?.mode === "edit" && modal.member) {
      updateMember(modal.member.id, levelKey, form);
    } else {
      const created = createMember(levelKey, form);
      setNotice({ id: created.id, name: created.name, matricule: created.matricule });
      // On montre le membre créé : niveau et filtres remis à plat.
      setView("members");
      setSearch("");
      setStatusFilter("all");
      setActiveLevel(levelKey);
    }
    closeModal();
  };

  // Leaders ------------------------------------------------------------

  const openAppoint = (member = null) => setLeaderForm({ mode: "appoint", member, term: null });
  const openEditLeader = (term) =>
    setLeaderForm({ mode: "edit", member: membersById[term.memberId] ?? null, term });
  const handleLeaderSubmit = (data) => {
    if (leaderForm?.mode === "edit" && leaderForm.term) {
      updateLeader(leaderForm.term.id, data);
    } else {
      appointLeader(data.memberId, data);
    }
    setLeaderForm(null);
  };
  const handleDismiss = (data) => {
    if (dismissTarget) dismissLeader(dismissTarget.id, data);
    setDismissTarget(null);
  };
  const candidates = allMembers.filter((member) => member.status === "actif" && !termsByMember[member.id]);

  // Résumé cliquable : filtre la liste (ou ouvre l'onglet Leaders).
  const handleSummarySelect = (key) => {
    if (key === "leader") {
      setView("leaders");
      return;
    }
    setView("members");
    setActiveLevel("all");
    setSearch("");
    setStatusFilter(key);
  };

  // Recherche déclenchée depuis l'en-tête partagé (voir AdminTopBar) : même
  // état "search" que la barre d'outils du tableau (une seule recherche,
  // pas deux qui s'ignorent), mais on bascule aussi sur la liste de tous
  // les niveaux — sinon un membre trouvé dans un autre niveau resterait
  // invisible, on aurait l'air de dire "aucun résultat" à tort.
  const handleTopBarSearch = (value) => {
    setSearch(value);
    if (value.trim()) {
      if (view !== "members") setView("members");
      if (activeLevel !== "all") setActiveLevel("all");
    }
  };

  const activeLevelName = activeLevel === "all" ? null : t(`simulateur.levels.${activeLevel}.name`);

  const existingMembers = allMembers.map((member) => ({ name: member.name, matricule: member.matricule }));

  const confirmKey = confirmAction
    ? confirmAction.type === "update"
      ? "update"
      : confirmAction.type === "delete"
        ? "delete"
        : confirmAction.member.status === "actif"
          ? "deactivate"
          : confirmAction.member.status === "attente"
            ? "activate"
            : "reactivate"
    : null;
  const confirmIsLeader =
    confirmAction &&
    termsByMember[confirmAction.member.id] &&
    (confirmKey === "delete" || confirmKey === "deactivate");

  return (
    <Page title={`Admin – ${t("admin.membres.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.membres.title")}
          searchValue={search}
          onSearchChange={handleTopBarSearch}
          searchPlaceholder={t("admin.membres.searchPlaceholder")}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-gray-500">{t("admin.membres.subtitle")}</p>
          <button
            type="button"
            onClick={openCreate}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#52A2DF] px-5 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <UserPlusIcon aria-hidden="true" className="size-5" />
            {t("admin.membres.createMember")}
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800 ring-1 ring-inset ring-green-600/20"
          >
            <CheckCircleIcon aria-hidden="true" className="size-5 shrink-0 text-green-600" />
            <p className="min-w-0 flex-1">
              {t("admin.membres.notice.created", { name: notice.name, matricule: notice.matricule })}
            </p>
            <button
              type="button"
              onClick={() => {
                openViewById(notice.id);
                setNotice(null);
              }}
              className="font-semibold underline"
            >
              {t("admin.membres.notice.openCard")}
            </button>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-6 items-center justify-center rounded-full text-green-700 hover:bg-green-100"
            >
              <XMarkIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}

        <MembersSummary
          counts={summaryCounts}
          activeKey={view === "leaders" ? "leader" : view === "members" ? statusFilter : null}
          onSelect={handleSummarySelect}
        />

        <MembersViewTabs
          view={view}
          onChange={setView}
          counts={{ members: summaryCounts.total, leaders: summaryCounts.leaders, journal: snap.journal.length }}
        />

        <div className="mt-6">
          {view === "members" && (
            <>
              <LevelTabs activeLevel={activeLevel} onSelect={setActiveLevel} />

              <MembersFolder
                label={
                  activeLevel === "all"
                    ? t("admin.membres.allLevels")
                    : `${t("admin.membres.level", { n: levelNumbers[activeLevel] })} : ${activeLevelName}`
                }
              >
                <MembersToolbar
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  statusCounts={statusCounts}
                  filter={filter}
                  onFilterChange={setFilter}
                  onExport={() =>
                    exportToCsv(
                      list,
                      activeLevel === "all" ? t("admin.membres.allLevels") : activeLevelName,
                      t,
                      (member) => (termsByMember[member.id] ? functionLabel(termsByMember[member.id]) : ""),
                    )
                  }
                />

                <MembersTable
                  members={paginatedList}
                  termsByMember={termsByMember}
                  onUpdate={askUpdate}
                  onView={openView}
                  onToggleStatus={askToggleStatus}
                  onDelete={askDelete}
                  onAppoint={openAppoint}
                  onEditLeader={openEditLeader}
                  onDismissLeader={setDismissTarget}
                />

                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </MembersFolder>

              <TopMembers members={allMembers} />
            </>
          )}

          {view === "leaders" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <LeadersPanel
                activeTerms={currentTerms}
                pastTerms={previousTerms}
                membersById={membersById}
                fallbackNames={fallbackNames}
                onAppoint={() => openAppoint(null)}
                onEdit={openEditLeader}
                onDismiss={setDismissTarget}
                onOpenMember={openViewById}
              />
            </div>
          )}

          {view === "journal" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <ActivityJournal
                events={snap.journal}
                onOpenMember={openViewById}
                existingIds={new Set(allMembers.map((member) => member.id))}
              />
            </div>
          )}
        </div>
      </div>

      <AddMemberModal
        open={!!modal}
        mode={modal?.mode ?? "add"}
        member={modal?.member}
        lockLevel={modal?.lockLevel}
        defaultLevel={modal?.defaultLevel}
        onClose={closeModal}
        onSubmit={handleSubmit}
        suggestMatricule={(levelKey) => suggestMatricule(snap, levelNumbers[levelKey])}
        existingMembers={existingMembers}
      />

      <MemberDetailsCard
        member={viewMember}
        open={!!viewMember}
        onClose={closeView}
        extraBadge={viewMember && termsByMember[viewMember.id] ? functionLabel(termsByMember[viewMember.id]) : undefined}
        followUp={
          viewMember ? (
            <MemberFollowUp
              member={viewMember}
              activeTerm={termsByMember[viewMember.id] ?? null}
              pastTerms={termsOf(snap, viewMember.id).filter((term) => term.endedAt)}
              events={eventsOf(snap, viewMember.id)}
              onAppoint={() => openAppoint(viewMember)}
              onEdit={openEditLeader}
              onDismiss={setDismissTarget}
            />
          ) : null
        }
      />

      <LeaderFormModal
        open={!!leaderForm}
        mode={leaderForm?.mode}
        member={leaderForm?.member}
        term={leaderForm?.term}
        candidates={candidates}
        onClose={() => setLeaderForm(null)}
        onSubmit={handleLeaderSubmit}
      />

      <DismissLeaderModal
        open={!!dismissTarget}
        term={dismissTarget}
        member={dismissTarget ? (membersById[dismissTarget.memberId] ?? null) : null}
        onClose={() => setDismissTarget(null)}
        onConfirm={handleDismiss}
      />

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          title={t(`admin.membres.confirm.${confirmKey}.title`)}
          description={`${t(`admin.membres.confirm.${confirmKey}.description`, {
            name: confirmAction.member.name,
          })}${confirmIsLeader ? ` ${t("admin.membres.confirm.leaderEnds")}` : ""}`}
          confirmLabel={t(`admin.membres.confirm.${confirmKey}.confirmLabel`)}
          tone={confirmKey === "delete" || confirmKey === "deactivate" ? "danger" : "default"}
          onConfirm={runConfirmedAction}
          onCancel={cancelConfirm}
        />
      )}
    </Page>
  );
}
