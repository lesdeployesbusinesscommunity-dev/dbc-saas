// Import Dependencies
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { MemberDetailsCard } from "./MemberDetailsCard";
import { TopMembers } from "./TopMembers";
import { levelNumbers } from "./mockData";
import { toViewMember } from "./viewModel";
import { normalizeSearchText } from "../searchUtils";
import { listerMembres } from "api/membres";

// ----------------------------------------------------------------------

const PAGE_SIZE = 6;

// Exporte la liste affichée en CSV, tout en local (pas d'appel réseau) — à
// remplacer par un vrai export serveur si le volume de membres grandit. Le
// niveau est repris par ligne (member.levelKey) plutôt que fixé une fois
// pour toutes, pour rester correct aussi bien pour un dossier que pour la
// vue "Tous les niveaux". "t" est passé par l'appelant pour que les
// en-têtes et les noms de niveau restent dans la langue active.
function exportToCsv(members, fileLabel, t) {
  const headers = [
    t("admin.membres.table.columns.matricule"),
    t("admin.membres.table.columns.name"),
    t("admin.membres.table.columns.domain"),
    t("admin.membres.table.columns.level"),
    t("admin.membres.table.columns.city"),
    t("admin.membres.table.columns.country"),
    t("admin.membres.table.columns.sponsor"),
    t("admin.membres.modal.sponsorMatricule"),
    t("admin.membres.table.columns.status"),
  ];
  const rows = members.map((m) => [
    m.matricule, m.name, m.domain,
    m.levelKey ? t(`simulateur.levels.${m.levelKey}.name`) : "",
    m.city, m.country, m.sponsorName ?? "", m.sponsorMatricule ?? "", m.status,
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
// tableau des membres validés (GET /membres, admin). Lecture seule pour
// l'instant : créer/modifier un membre doit passer par une demande
// d'inscription validée (voir Admin/Membres — page "Demandes"), pas par une
// création directe ici, et désactiver/supprimer n'a pas de contrepartie
// dans le domaine Membre (un seul statut possible : "actif") — voir
// RowActionsMenu, LevelTabs et MembersToolbar pour le masquage de ces
// actions plutôt que de les simuler.
export default function Membres() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [activeLevel, setActiveLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("aucun");
  const [page, setPage] = useState(1);
  const [viewMember, setViewMember] = useState(null);

  const charger = useCallback(async () => {
    setStatus("loading");
    try {
      const donnees = await listerMembres();
      setMembers(donnees.map(toViewMember));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const list = useMemo(() => {
    let arr = activeLevel === "all" ? members : members.filter((m) => m.levelKey === activeLevel);

    if (search.trim()) {
      // normalizeSearchText tolère accents/casse/tirets des deux côtés (voir
      // searchUtils.js) — un clavier réglé en anglais retrouve "Aïcha" en
      // tapant "aicha".
      const query = normalizeSearchText(search);
      arr = arr.filter(
        (member) =>
          normalizeSearchText(member.name).includes(query) ||
          normalizeSearchText(member.matricule).includes(query),
      );
    }

    arr = [...arr];
    switch (filter) {
      case "aucun":
        break;
      case "recent":
        arr.sort((a, b) => new Date(b.joinedAt ?? 0) - new Date(a.joinedAt ?? 0));
        break;
      case "ville":
        arr.sort((a, b) => (a.city ?? "").localeCompare(b.city ?? ""));
        break;
      case "pays":
        arr.sort((a, b) => (a.country ?? "").localeCompare(b.country ?? ""));
        break;
      default:
        arr.sort((a, b) => new Date(a.joinedAt ?? 0) - new Date(b.joinedAt ?? 0));
    }

    return arr;
  }, [members, activeLevel, search, filter]);

  // Revenir à la première page dès que le contenu affiché change (niveau,
  // recherche ou filtre) pour ne pas rester bloqué sur une page vide.
  useEffect(() => {
    setPage(1);
  }, [activeLevel, search, filter]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paginatedList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openView = (member) => setViewMember(member);
  const closeView = () => setViewMember(null);

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
            filter={filter}
            onFilterChange={setFilter}
            onExport={() =>
              exportToCsv(
                list,
                activeLevel === "all" ? t("admin.membres.allLevels") : activeLevelName,
                t,
              )
            }
          />

          {status === "loading" && (
            <div className="mt-10 flex items-center justify-center text-gray-400">
              <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
            </div>
          )}

          {status === "error" && (
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              Impossible de charger les membres pour le moment.
            </div>
          )}

          {status === "ready" && (
            <>
              <MembersTable members={paginatedList} onView={openView} />
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </MembersFolder>

        {status === "ready" && <TopMembers members={members} />}
      </div>

      <MemberDetailsCard member={viewMember} open={!!viewMember} onClose={closeView} />
    </Page>
  );
}
