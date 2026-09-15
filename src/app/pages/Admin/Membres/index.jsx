// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { initialMembersByLevel, levelNumbers } from "./mockData";

// ----------------------------------------------------------------------

const PAGE_SIZE = 6;

function nextMatricule(levelKey, countForLevel) {
  return `DBC-${levelNumbers[levelKey]}-${String(countForLevel + 1).padStart(4, "0")}`;
}

// Exporte la liste affichée en CSV, tout en local (pas d'appel réseau) —
// à remplacer par un vrai export serveur si le volume de membres grandit.
// Le niveau est repris par ligne (member.levelKey) plutôt que fixé une
// fois pour toutes, pour rester correct aussi bien pour un dossier que
// pour la vue "Tous les niveaux". "t" est passé par l'appelant pour que
// les en-têtes et les noms de niveau restent dans la langue active.
function exportToCsv(members, fileLabel, t) {
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
  ];
  const rows = members.map((m) => [
    m.matricule, m.name, m.role, m.domain,
    m.levelKey ? t(`simulateur.levels.${m.levelKey}.name`) : "",
    m.city, m.country, m.sponsorName ?? "", m.sponsorMatricule ?? "", m.coins, m.status,
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

// Page "Gestion des membres" (/admin/membres) : un dossier par niveau DBC
// (étiquettes en haut, comme des onglets de classeur), chacun contenant le
// tableau des membres de ce niveau. Tout est géré en local pour l'instant
// (ajout / mise à jour / désactivation) — voir mockData.js pour le détail
// de ce qui reste à brancher au backend.
export default function Membres() {
  const { t } = useTranslation();
  const [membersByLevel, setMembersByLevel] = useState(initialMembersByLevel);
  // "all" affiche tous les niveaux combinés ; sinon c'est une clé de
  // "levels" (app/pages/Simulateur/data). On démarre sur "all" — c'est la
  // vue la plus utile par défaut sur un tableau d'administration standard.
  const [activeLevel, setActiveLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("aucun");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // { mode, member, lockLevel, defaultLevel } | null
  const [viewMember, setViewMember] = useState(null); // membre affiché dans la fiche "Voir"
  const [confirmAction, setConfirmAction] = useState(null); // { type: "update"|"toggle"|"delete", member } | null

  const list = useMemo(() => {
    // "levelKey" est rattaché ici (plutôt que stocké sur chaque membre) car
    // la liste vient du dictionnaire "membersByLevel" indexé par niveau —
    // utile pour pré-remplir le formulaire de modification, et pour
    // afficher le bon niveau par ligne dans la vue "Tous les niveaux".
    let arr =
      activeLevel === "all"
        ? Object.entries(membersByLevel).flatMap(([levelKey, entries]) =>
            entries.map((member) => ({ ...member, levelKey })),
          )
        : (membersByLevel[activeLevel] ?? []).map((member) => ({
            ...member,
            levelKey: activeLevel,
          }));

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      arr = arr.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.matricule.toLowerCase().includes(query),
      );
    }

    switch (filter) {
      case "aucun":
        break;
      case "recent":
        arr.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
        break;
      case "ville":
        arr.sort((a, b) => a.city.localeCompare(b.city));
        break;
      case "pays":
        arr.sort((a, b) => a.country.localeCompare(b.country));
        break;
      default:
        arr.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
    }

    return arr;
  }, [membersByLevel, activeLevel, search, filter]);

  // Tous les membres, tous niveaux confondus, indépendamment du filtre/
  // niveau ouvert dans le tableau — sert au "Top des membres" affiché en
  // dessous, qui doit rester stable même quand on change de dossier.
  const allMembers = useMemo(
    () =>
      Object.entries(membersByLevel).flatMap(([levelKey, entries]) =>
        entries.map((member) => ({ ...member, levelKey })),
      ),
    [membersByLevel],
  );

  // Revenir à la première page dès que le contenu affiché change (niveau,
  // recherche ou filtre) pour ne pas rester bloqué sur une page vide.
  useEffect(() => {
    setPage(1);
  }, [activeLevel, search, filter]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paginatedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // "Ajouter un membre" (dans la barre d'outils) se verrouille sur le
  // niveau du dossier ouvert — sauf en vue "Tous les niveaux", où il se
  // comporte comme le bouton global (niveau libre).
  const openAddForLevel = () =>
    setModal(
      activeLevel === "all" ? { mode: "add" } : { mode: "add", lockLevel: activeLevel },
    );
  const openAddAnyLevel = () =>
    setModal({ mode: "add", defaultLevel: activeLevel === "all" ? undefined : activeLevel });
  const closeModal = () => setModal(null);

  // "Voir" ouvre directement la fiche détaillée du membre — pas besoin de
  // confirmation puisque c'est juste de la lecture (voir MemberDetailsCard).
  const openView = (member) => setViewMember(member);
  const closeView = () => setViewMember(null);

  // "Mettre à jour", "Désactiver"/"Réactiver" et "Supprimer" passent tous
  // par une confirmation avant de s'exécuter (voir ConfirmDialog ci-dessous
  // et son rendu dans le JSX) — demandé explicitement par l'utilisateur.
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
      setMembersByLevel((prev) => ({
        ...prev,
        [member.levelKey]: prev[member.levelKey].map((entry) =>
          entry.id === member.id
            ? { ...entry, status: entry.status === "desactive" ? "actif" : "desactive" }
            : entry,
        ),
      }));
    } else if (type === "delete") {
      setMembersByLevel((prev) => ({
        ...prev,
        [member.levelKey]: prev[member.levelKey].filter((entry) => entry.id !== member.id),
      }));
    }

    setConfirmAction(null);
  };

  const handleSubmit = (levelKey, form) => {
    if (modal?.mode === "edit" && modal.member) {
      const memberId = modal.member.id;
      // Le niveau a pu changer dans le formulaire : on retire le membre de
      // son ancien niveau si besoin, puis on le place dans le nouveau.
      setMembersByLevel((prev) => {
        const withoutMember = Object.fromEntries(
          Object.entries(prev).map(([key, entries]) => [
            key,
            entries.filter((entry) => entry.id !== memberId),
          ]),
        );
        const updated = { ...modal.member, ...form, levelKey };
        return {
          ...withoutMember,
          [levelKey]: [...(withoutMember[levelKey] ?? []), updated],
        };
      });
    } else {
      setMembersByLevel((prev) => {
        const existing = prev[levelKey] ?? [];
        const newMember = {
          id: `m-${Date.now()}`,
          matricule: nextMatricule(levelKey, existing.length),
          levelKey,
          ...form,
          joinedAt: new Date().toISOString().slice(0, 10),
        };
        return { ...prev, [levelKey]: [...existing, newMember] };
      });
    }
    closeModal();
  };

  const activeLevelName = activeLevel === "all" ? null : t(`simulateur.levels.${activeLevel}.name`);

  return (
    <Page title={`Admin – ${t("admin.membres.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("admin.membres.title")} />

        <LevelTabs
          activeLevel={activeLevel}
          onSelect={setActiveLevel}
          onAddAnyLevel={openAddAnyLevel}
        />

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
            filter={filter}
            onFilterChange={setFilter}
            onAddMember={openAddForLevel}
            onExport={() =>
              exportToCsv(
                list,
                activeLevel === "all" ? t("admin.membres.allLevels") : activeLevelName,
                t,
              )
            }
          />

          <MembersTable
            members={paginatedList}
            onUpdate={askUpdate}
            onView={openView}
            onToggleStatus={askToggleStatus}
            onDelete={askDelete}
          />

          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </MembersFolder>

        <TopMembers members={allMembers} />
      </div>

      <AddMemberModal
        open={!!modal}
        mode={modal?.mode ?? "add"}
        member={modal?.member}
        lockLevel={modal?.lockLevel}
        defaultLevel={modal?.defaultLevel}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <MemberDetailsCard member={viewMember} open={!!viewMember} onClose={closeView} />

      {confirmAction &&
        (() => {
          // Clé de traduction (admin.membres.confirm.*) selon le type
          // d'action et, pour "toggle", l'état actuel du membre.
          const confirmKey =
            confirmAction.type === "update"
              ? "update"
              : confirmAction.type === "delete"
                ? "delete"
                : confirmAction.member.status === "desactive"
                  ? "reactivate"
                  : "deactivate";

          return (
            <ConfirmDialog
              open={!!confirmAction}
              title={t(`admin.membres.confirm.${confirmKey}.title`)}
              description={t(`admin.membres.confirm.${confirmKey}.description`, {
                name: confirmAction.member.name,
              })}
              confirmLabel={t(`admin.membres.confirm.${confirmKey}.confirmLabel`)}
              tone={
                confirmAction.type === "delete" ||
                (confirmAction.type === "toggle" && confirmAction.member.status !== "desactive")
                  ? "danger"
                  : "default"
              }
              onConfirm={runConfirmedAction}
              onCancel={cancelConfirm}
            />
          );
        })()}
    </Page>
  );
}
