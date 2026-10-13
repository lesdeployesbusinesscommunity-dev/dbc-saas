// Import Dependencies
import { useEffect, useState } from "react";
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
} from "./mockData";
import { assignerSiege, creerPole, listerPoles, modifierPole, reordonnerPoles, supprimerPole } from "api/gouvernance";
import { levelKeyFromCode } from "utils/levelCodes";

// Pôle du serveur -> forme de la page. Le type du serveur donne le
// fonctionnement de la carte : "fondatrice" -> poste unique en avant,
// "sieges" -> postes nommés à pourvoir, "reseau" -> chapitres de Gestion du
// réseau, "niveau" -> tous les membres d'un niveau.
const KIND_BY_TYPE = { fondatrice: "fixed", sieges: "assignable", reseau: "networkChapters", niveau: "autoLevel" };

function poleFromApi(pole) {
  return {
    id: pole.id,
    iconKey: pole.icon,
    title: pole.name,
    description: pole.description,
    kind: KIND_BY_TYPE[pole.type] ?? "assignable",
    levelKey: pole.levelCode ? levelKeyFromCode(pole.levelCode) : undefined,
    seats: pole.seats.map((seat) => ({ id: seat.id, title: seat.title, memberId: seat.memberId })),
  };
}

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
// PoleHeader) pour changer sa position dans la page. Les pôles et leurs
// postes viennent du serveur (GET /gouvernance/poles) et chaque action y est
// enregistrée ; les chapitres viennent de Gestion du réseau.
export default function Gouvernance() {
  const { t, i18n } = useTranslation();
  const { networksByCountry, coordinatorsByNodeId, setCoordinatorsByNodeId } = useNetworkData();
  const [structure, setStructure] = useState([]);
  const [actionError, setActionError] = useState("");

  // Toutes les réponses du serveur renvoient la liste à jour des pôles.
  const applyPoles = (poles) => setStructure(poles.map(poleFromApi));
  const run = async (action) => {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.detail ?? t(error.message ?? "api.errors.server"));
    }
  };

  useEffect(() => {
    run(async () => applyPoles(await listerPoles()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Recherche pilotée depuis l'en-tête partagé (voir AdminTopBar) : compare
  // au titre du pôle, aux titres/titulaires de ses postes, et — pour le
  // pôle "Réseau des Leaders d'Antennes" — aux noms de chapitres et de
  // leurs responsables (voir poleMatchesSearch ci-dessous). Un pôle qui ne
  // correspond pas est estompé plutôt que masqué (voir "dimmed" passé à
  // PoleSection) : on garde le contexte de la page entière visible.
  const [search, setSearch] = useState("");
  // Le "Leader Légende" de chaque chapitre vient directement de Gestion du
  // réseau (voir NetworkDataContext) — seul le "Coordinateur" se gère ici, par
  // id de branche ; il est enregistré avec l'organisation du pays.
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

    if (structure.find((pole) => pole.id === poleId)?.kind === "networkChapters") {
      // "chapterId" est ici l'id du nœud de branche (voir
      // getNetworkChapters dans mockData.js) — seul le "Coordinateur" se
      // gère depuis cette page ; le "Leader Légende" se change dans
      // Gestion du réseau.
      setCoordinatorsByNodeId((prev) => ({ ...prev, [chapterId]: memberId }));
      closeAssign();
      return;
    }

    closeAssign();
    run(async () => {
      await assignerSiege(seatId, memberId);
      applyPoles(await listerPoles());
    });
  };

  // Échange le pôle à "index" avec son voisin ("direction" = -1 pour
  // monter, +1 pour descendre) — pas d'effet si déjà en haut/en bas.
  const movePole = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= structure.length) return;
    const next = [...structure];
    [next[index], next[target]] = [next[target], next[index]];
    setStructure(next);
    run(async () => applyPoles(await reordonnerPoles(next.map((pole) => pole.id))));
  };

  const openAddPole = () => setPoleForm({ mode: "add" });
  const openEditPole = (pole) => setPoleForm({ mode: "edit", pole });
  const closePoleForm = () => setPoleForm(null);

  const handlePoleSubmit = (payload) => {
    const editing = poleForm?.mode === "edit" ? poleForm.pole : null;
    // Un pôle sans postes modifiables dans le formulaire garde les siens.
    const seats = (payload.seats ?? editing?.seats ?? []).map((seat) => ({ id: seat.id, title: seat.title }));
    const body = { name: payload.title, description: payload.description, icon: payload.iconKey, seats };
    closePoleForm();
    run(async () => applyPoles(editing ? await modifierPole(editing.id, body) : await creerPole(body)));
  };

  const confirmDeletePole = () => {
    if (!deletingPole) return;
    const poleId = deletingPole.id;
    setDeletingPole(null);
    run(async () => applyPoles(await supprimerPole(poleId)));
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

        {actionError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {actionError}
          </p>
        )}

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
