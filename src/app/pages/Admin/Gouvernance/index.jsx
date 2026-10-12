// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { MemberDetailsCard } from "../Membres/MemberDetailsCard";
import { ConfirmDialog } from "../Membres/ConfirmDialog";
import { useNetworkData } from "../context/NetworkDataContext";
import { PoleSection } from "./PoleSection";
import { PoleFormModal } from "./PoleFormModal";
import { MemberSearchModal } from "./MemberSearchModal";
import { POLE_ICON_MAP } from "./poleIcons";
import { normalizeSearchText } from "../searchUtils";
import {
  allMembers,
  founderQuote,
  getMember,
  getNetworkChapters,
  getPoleTitle,
  getSeatTitle,
  initialGovernanceStructure,
} from "./mockData";

// ----------------------------------------------------------------------

// Page "Gestion de la gouvernance" (/admin/gouvernance) : les pôles qui
// dirigent la DBC dans son ensemble, chacun avec ses postes et qui les
// occupe — pas juste une liste statique, on peut cliquer un poste pourvu
// pour voir la fiche complète de son titulaire (même fiche que "Gestion
// des membres"/"Gestion du réseau"), ou un poste vacant pour l'assigner à
// un membre existant (sauf le Conseil des Légendes, qui se peuple tout
// seul par niveau — voir PoleSection.jsx).
//
// La page ne se limite plus aux 4 pôles fournis avec le site : "Ajouter
// un pôle" crée une nouvelle carte "à postes nommés" (le seul type qu'on
// peut créer soi-même — les 3 autres viennent avec un fonctionnement qui
// leur est propre, voir mockData.js), et chaque carte peut ensuite être
// modifiée, supprimée, ou déplacée (monter/descendre — voir PoleSection/
// PoleHeader) pour changer sa position dans la page. Tout est géré en
// local pour l'instant (voir mockData.js), comme le reste de l'admin.
export default function Gouvernance() {
  const { t, i18n } = useTranslation();
  const { networksByCountry } = useNetworkData();
  const [structure, setStructure] = useState(initialGovernanceStructure);
  // Recherche pilotée depuis l'en-tête partagé (voir AdminTopBar) : compare
  // au titre du pôle, aux titres/titulaires de ses postes, et — pour le
  // pôle "Réseau des Leaders d'Antennes" — aux noms de chapitres et de
  // leurs responsables (voir poleMatchesSearch ci-dessous). Un pôle qui ne
  // correspond pas est estompé plutôt que masqué (voir "dimmed" passé à
  // PoleSection) : on garde le contexte de la page entière visible.
  const [search, setSearch] = useState("");
  // Le "Leader Légende" de chaque chapitre vient directement de Gestion du
  // réseau (voir NetworkDataContext) — seul le "Coordinateur", propre à la
  // gouvernance, se gère ici, par id de branche.
  const [coordinatorsByNodeId, setCoordinatorsByNodeId] = useState({});
  const [viewingMemberId, setViewingMemberId] = useState(null);
  // assigning = { poleId, chapterId, seatId, seatLabel } | null
  const [assigning, setAssigning] = useState(null);
  // poleForm = { mode: "add" } | { mode: "edit", pole } | null
  const [poleForm, setPoleForm] = useState(null);
  const [deletingPole, setDeletingPole] = useState(null);

  const chapters = getNetworkChapters(networksByCountry).map((chapter) => ({
    ...chapter,
    coordinatorMemberId: coordinatorsByNodeId[chapter.nodeId] ?? null,
  }));

  const openView = (memberId) => {
    if (memberId) setViewingMemberId(memberId);
  };
  const closeView = () => setViewingMemberId(null);

  const openAssign = (poleId, chapterId, seatId, seatLabel) =>
    setAssigning({ poleId, chapterId, seatId, seatLabel });
  const closeAssign = () => setAssigning(null);

  const handleConfirmAssign = (memberId) => {
    if (!assigning) return;
    const { poleId, chapterId, seatId } = assigning;

    if (poleId === "antennes") {
      // "chapterId" est ici l'id du nœud de branche (voir
      // getNetworkChapters dans mockData.js) — seul le "Coordinateur" se
      // gère depuis cette page ; le "Leader Légende" se change dans
      // Gestion du réseau.
      setCoordinatorsByNodeId((prev) => ({ ...prev, [chapterId]: memberId }));
      closeAssign();
      return;
    }

    setStructure((prev) =>
      prev.map((pole) => {
        if (pole.id !== poleId) return pole;
        if (pole.kind === "assignable") {
          return {
            ...pole,
            seats: pole.seats.map((seat) => (seat.id === seatId ? { ...seat, memberId } : seat)),
          };
        }
        return pole;
      }),
    );

    closeAssign();
  };

  // Échange le pôle à "index" avec son voisin ("direction" = -1 pour
  // monter, +1 pour descendre) — pas d'effet si déjà en haut/en bas.
  const movePole = (index, direction) => {
    setStructure((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const openAddPole = () => setPoleForm({ mode: "add" });
  const openEditPole = (pole) => setPoleForm({ mode: "edit", pole });
  const closePoleForm = () => setPoleForm(null);

  const handlePoleSubmit = (payload) => {
    if (poleForm?.mode === "edit") {
      const targetId = poleForm.pole.id;
      setStructure((prev) => prev.map((p) => (p.id === targetId ? { ...p, ...payload } : p)));
    } else {
      setStructure((prev) => [...prev, { id: `pole-${Date.now()}`, ...payload }]);
    }
    closePoleForm();
  };

  const confirmDeletePole = () => {
    if (!deletingPole) return;
    setStructure((prev) => prev.filter((p) => p.id !== deletingPole.id));
    setDeletingPole(null);
  };

  const viewingMember = viewingMemberId ? getMember(viewingMemberId) : null;

  // Le titre du poste + son pôle, affiché en pastille dans la fiche
  // (ex: "Directeur Marketing Digital · Comité Exécutif") — recherché
  // dans toute la structure plutôt que suivi à côté, pour rester juste
  // même après une réassignation.
  const viewingSeatBadge = (() => {
    if (!viewingMemberId) return null;
    for (const pole of structure) {
      const poleTitle = getPoleTitle(pole, t);
      if (pole.kind === "fixed" || pole.kind === "assignable") {
        const seat = pole.seats.find((s) => s.memberId === viewingMemberId);
        if (seat) return `${getSeatTitle(seat, t)} · ${poleTitle}`;
      }
      if (pole.kind === "networkChapters") {
        for (const chapter of chapters) {
          if (chapter.leaderMemberId === viewingMemberId) {
            return `${t("admin.gouvernance.seats.leaderLegende")} · ${chapter.name}`;
          }
          if (chapter.coordinatorMemberId === viewingMemberId) {
            return `${t("admin.gouvernance.seats.coordinateur")} · ${chapter.name}`;
          }
          const subBranch = chapter.subBranches.find((b) => b.memberId === viewingMemberId);
          if (subBranch) return `${subBranch.name} · ${chapter.name}`;
        }
      }
      if (pole.kind === "autoLevel") {
        const member = getMember(viewingMemberId);
        if (member?.levelKey === pole.levelKey) return poleTitle;
      }
    }
    return null;
  })();

  const legendesPole = structure.find((pole) => pole.kind === "autoLevel");
  const legendesMembers = legendesPole
    ? allMembers.filter((member) => member.levelKey === legendesPole.levelKey)
    : [];

  // Vrai si "pole" a quelque chose qui correspond à la recherche en cours —
  // son propre titre, ou selon son type : les titres/titulaires de ses
  // postes ("fixed"/"assignable"), les chapitres du réseau et leurs
  // responsables/sous-branches ("networkChapters"), ou ses membres
  // ("autoLevel", le Conseil des Légendes). Toujours vrai quand la
  // recherche est vide (rien n'est alors estompé).
  const poleMatchesSearch = (pole) => {
    // normalizeSearchText tolère accents/casse/tirets des deux côtés (voir
    // searchUtils.js) — un clavier réglé en anglais retrouve "Légendes" en
    // tapant "legendes".
    const query = normalizeSearchText(search);
    if (!query) return true;

    if (normalizeSearchText(getPoleTitle(pole, t)).includes(query)) return true;

    if (pole.kind === "fixed" || pole.kind === "assignable") {
      return pole.seats.some((seat) => {
        if (normalizeSearchText(getSeatTitle(seat, t)).includes(query)) return true;
        const member = seat.memberId ? getMember(seat.memberId) : null;
        return Boolean(member && normalizeSearchText(member.name).includes(query));
      });
    }

    if (pole.kind === "networkChapters") {
      return chapters.some((chapter) => {
        if (normalizeSearchText(chapter.name).includes(query)) return true;
        const leader = chapter.leaderMemberId ? getMember(chapter.leaderMemberId) : null;
        const coordinator = chapter.coordinatorMemberId
          ? getMember(chapter.coordinatorMemberId)
          : null;
        if (leader && normalizeSearchText(leader.name).includes(query)) return true;
        if (coordinator && normalizeSearchText(coordinator.name).includes(query)) return true;
        return chapter.subBranches.some((branch) => {
          if (normalizeSearchText(branch.name).includes(query)) return true;
          const branchMember = branch.memberId ? getMember(branch.memberId) : null;
          return Boolean(branchMember && normalizeSearchText(branchMember.name).includes(query));
        });
      });
    }

    if (pole.kind === "autoLevel") {
      return legendesMembers.some((member) => normalizeSearchText(member.name).includes(query));
    }

    return false;
  };

  const quote = i18n.language?.startsWith("en") ? founderQuote.en : founderQuote.fr;

  return (
    <Page title={`Admin – ${t("admin.gouvernance.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.gouvernance.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.gouvernance.searchPlaceholder")}
        />

        {/* Citation fondatrice — bannière hero, façon page "Leadership" des
            sites d'admin/entreprise reconnus : grande citation centrée sur
            fond dégradé aux couleurs de la marque, guillemet décoratif en
            filigrane. */}
        <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#52A2DF] to-[#3d6fb0] p-8 text-center sm:p-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-4 -top-10 select-none text-[220px] font-black leading-none text-white/10"
          >
            &ldquo;
          </span>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">
            📌 {t("admin.gouvernance.quote.label")}
          </p>
          <blockquote className="relative mx-auto mt-4 max-w-2xl text-lg font-bold italic leading-snug text-white sm:text-xl">
            {quote}
          </blockquote>
          <p className="relative mt-5 text-sm font-semibold text-white/80">— {founderQuote.author}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={openAddPole}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {t("admin.gouvernance.addPole")}
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {structure.map((pole, index) => (
            <PoleSection
              key={pole.id}
              pole={pole}
              number={index + 1}
              Icon={POLE_ICON_MAP[pole.iconKey] ?? SparklesIcon}
              onView={openView}
              onAssign={openAssign}
              autoLevelMembers={pole.kind === "autoLevel" ? legendesMembers : undefined}
              chapters={pole.kind === "networkChapters" ? chapters : undefined}
              onMoveUp={() => movePole(index, -1)}
              onMoveDown={() => movePole(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < structure.length - 1}
              onEdit={() => openEditPole(pole)}
              onDelete={() => setDeletingPole(pole)}
              dimmed={!poleMatchesSearch(pole)}
            />
          ))}
        </div>
      </div>

      <MemberSearchModal
        open={!!assigning}
        seatTitle={assigning?.seatLabel ?? ""}
        onClose={closeAssign}
        onConfirm={handleConfirmAssign}
      />

      <MemberDetailsCard
        member={viewingMember}
        open={!!viewingMemberId}
        onClose={closeView}
        extraBadge={viewingSeatBadge}
      />

      <PoleFormModal
        open={!!poleForm}
        pole={poleForm?.mode === "edit" ? poleForm.pole : null}
        onClose={closePoleForm}
        onSubmit={handlePoleSubmit}
      />

      <ConfirmDialog
        open={!!deletingPole}
        title={t("admin.gouvernance.confirmDelete.title")}
        description={t("admin.gouvernance.confirmDelete.description", {
          title: deletingPole ? getPoleTitle(deletingPole, t) : "",
        })}
        confirmLabel={t("admin.gouvernance.confirmDelete.confirmLabel")}
        tone="danger"
        onConfirm={confirmDeletePole}
        onCancel={() => setDeletingPole(null)}
      />
    </Page>
  );
}
