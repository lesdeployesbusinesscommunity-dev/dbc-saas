// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

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
import { levelNumbers } from "./mockData";
import { creerMembre, listerMembres, modifierMembre, supprimerMembre } from "api/membres";
import { createPayload, groupMembersByLevel, updatePayload } from "./membersApi";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------

const PAGE_SIZE = 6;

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
  const [membersByLevel, setMembersByLevel] = useState({});
  // "all" affiche tous les niveaux combinés ; sinon c'est une clé de
  // "levels" (app/pages/Simulateur/data). On démarre sur "all" — c'est la
  // vue la plus utile par défaut sur un tableau d'administration standard.
  const [activeLevel, setActiveLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("aucun");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // { mode, member, lockLevel, defaultLevel } | null
  const [loadStatus, setLoadStatus] = useState("loading"); // loading | ready | error
  const [actionError, setActionError] = useState("");

  // Membres réels (GET /membres) ; rechargés après chaque action pour que la
  // page reflète exactement ce que le serveur a enregistré.
  const reload = () =>
    listerMembres()
      .then((members) => {
        setMembersByLevel(groupMembersByLevel(members));
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus((current) => (current === "ready" ? current : "error")));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failWith = (error) => setActionError(error.detail ?? t(error.message ?? "api.errors.server"));
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

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, member } = confirmAction;
    setConfirmAction(null);
    setActionError("");

    if (type === "update") {
      setModal({ mode: "edit", member, defaultLevel: member.levelKey });
      return;
    }
    try {
      if (type === "toggle") {
        await modifierMembre(member.id, { status: member.status === "desactive" ? "actif" : "desactive" });
      } else if (type === "delete") {
        await supprimerMembre(member.id);
      }
      await reload();
    } catch (error) {
      failWith(error);
    }
  };

  // Enregistre le formulaire sur le serveur ; en cas de refus (numéro déjà
  // utilisé, parrain inconnu...), le formulaire reste ouvert avec le message.
  const handleSubmit = async (levelKey, form) => {
    setActionError("");
    if (modal?.mode === "edit" && modal.member) {
      await modifierMembre(modal.member.id, updatePayload(levelKey, form));
    } else {
      await creerMembre(createPayload(levelKey, form));
    }
    await reload();
    closeModal();
  };

  const activeLevelName = activeLevel === "all" ? null : t(`simulateur.levels.${activeLevel}.name`);

  // Recherche déclenchée depuis l'en-tête partagé (voir AdminTopBar) : même
  // état "search" que la barre d'outils du tableau ci-dessous (une seule
  // recherche, pas deux qui s'ignorent), mais on bascule aussi sur "Tous
  // les niveaux" si un dossier précis était ouvert — sinon un membre trouvé
  // dans un autre niveau resterait invisible, on aurait l'air de dire
  // "aucun résultat" à tort. La recherche depuis la barre d'outils elle-
  // même (déjà dans le dossier voulu) ne change pas de dossier, comme
  // avant.
  const handleTopBarSearch = (value) => {
    setSearch(value);
    if (value.trim() && activeLevel !== "all") setActiveLevel("all");
  };

  return (
    <Page title={`Admin – ${t("admin.membres.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.membres.title")}
          searchValue={search}
          onSearchChange={handleTopBarSearch}
          searchPlaceholder={t("admin.membres.searchPlaceholder")}
        />

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

          {actionError && (
            <p role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              {actionError}
            </p>
          )}

          {loadStatus === "loading" ? (
            <div className="mt-10 flex justify-center text-gray-400">
              <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
            </div>
          ) : loadStatus === "error" ? (
            <p className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              {t("api.errors.server")}
            </p>
          ) : (
            <>
              <MembersTable
                members={paginatedList}
                onUpdate={askUpdate}
                onView={openView}
                onToggleStatus={askToggleStatus}
                onDelete={askDelete}
              />

              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          )}
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
