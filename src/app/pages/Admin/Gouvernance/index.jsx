// Import Dependencies
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { MemberDetailsCard } from "../Membres/MemberDetailsCard";
import { ConfirmDialog } from "../Membres/ConfirmDialog";
import { toViewMember } from "../Membres/viewModel";
import { PoleSection } from "./PoleSection";
import { PoleFormModal } from "./PoleFormModal";
import { MemberSearchModal } from "./MemberSearchModal";
import { POLE_ICON_MAP } from "./poleIcons";
import { normalizeSearchText } from "../searchUtils";
import { founderQuote, getPoleTitle } from "./mockData";
import {
  listerPoles,
  creerPole,
  modifierPole,
  supprimerPole,
  reordonnerPoles,
  assignerSiege,
} from "api/gouvernance";
import { listerMembres } from "api/membres";
import { listerAntennes, listerZones, assignerCoordinateurAntenne } from "api/communaute";

// ----------------------------------------------------------------------

// Les 2 cartes qui ne viennent pas de GET /gouvernance/poles : "Réseau des
// Leaders d'Antennes" est dérivé des vraies antennes (module Communauté &
// diaspora, GET /communaute/antennes — "leader" = qui a créé/rejoint
// l'antenne en premier, en lecture seule ici ; "coordinateur" s'assigne
// depuis cette page) et "Conseil des Légendes" des vrais membres de niveau
// "legende" (GET /membres). Ni l'une ni l'autre n'a de ligne "pôle" en
// base : rien à créer/modifier/supprimer/réordonner pour elles, voir
// PoleSection (boutons masqués quand aucun handler n'est fourni).
const ANTENNES_CARD_ID = "antennes";
const LEGENDES_CARD_ID = "legendes";
const LEGENDES_LEVEL_KEY = "legende";

// Page "Gestion de la gouvernance" (/admin/gouvernance) : les pôles qui
// dirigent la DBC, chacun avec ses postes et qui les occupe — on peut
// cliquer un poste pourvu pour voir la fiche complète de son titulaire
// (même fiche que "Gestion des membres"/"Gestion du réseau"), ou un poste
// vacant pour l'assigner à un membre existant (sauf le Conseil des
// Légendes, qui se peuple tout seul par niveau).
//
// "Ajouter un pôle" crée une nouvelle carte "à postes nommés" (POST
// /gouvernance/poles) ; chaque pôle réel peut ensuite être modifié,
// supprimé, ou déplacé (monter/descendre, PATCH /gouvernance/poles/
// reordonner) — Antennes/Légendes restent fixes en fin de page, elles ne
// sont pas des pôles.
export default function Gouvernance() {
  const { t, i18n } = useTranslation();
  const [poles, setPoles] = useState([]);
  const [members, setMembers] = useState([]);
  const [antennes, setAntennes] = useState([]);
  const [zones, setZones] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [search, setSearch] = useState("");
  const [viewingMemberId, setViewingMemberId] = useState(null);
  // assigning = { kind: "pole", seatId, seatLabel } | { kind: "antenne", antenneId, seatLabel } | null
  const [assigning, setAssigning] = useState(null);
  // poleForm = { mode: "add" } | { mode: "edit", pole } | null
  const [poleForm, setPoleForm] = useState(null);
  const [deletingPole, setDeletingPole] = useState(null);

  const charger = useCallback(async () => {
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      const [polesData, membresData, antennesData, zonesData] = await Promise.all([
        listerPoles(),
        listerMembres(),
        listerAntennes(),
        listerZones(),
      ]);
      setPoles(polesData);
      setMembers(membresData.map(toViewMember));
      setAntennes(antennesData);
      setZones(zonesData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const getMember = (id) => members.find((member) => member.id === id) ?? null;

  const zoneNameById = useMemo(() => new Map(zones.map((zone) => [zone.id, zone.name])), [zones]);

  // Une "antenne" (entité réelle) devient une carte de chapitre — plus de
  // hiérarchie de branches sous elle (ça n'existe pas côté backend), donc
  // "subBranches" reste toujours vide.
  const chapters = useMemo(
    () =>
      antennes.map((antenne) => ({
        nodeId: antenne.id,
        name: antenne.city,
        country: zoneNameById.get(antenne.zoneId) ?? "",
        leaderMemberId: antenne.leaderMembreId,
        coordinatorMemberId: antenne.coordinatorMembreId,
        subBranches: [],
      })),
    [antennes, zoneNameById],
  );

  const legendesMembers = useMemo(
    () => members.filter((member) => member.levelKey === LEGENDES_LEVEL_KEY),
    [members],
  );

  // Pôles réels (triés par "order") suivis des 2 cartes synthétiques,
  // toujours en dernière position — c'est ce tableau qui est affiché.
  const structure = useMemo(() => {
    const polesTries = [...poles]
      .sort((a, b) => a.order - b.order)
      .map((pole) => ({
        id: pole.id,
        kind: "assignable",
        iconKey: pole.icon,
        title: pole.name,
        description: pole.description,
        seats: pole.seats,
      }));

    return [
      ...polesTries,
      {
        id: ANTENNES_CARD_ID,
        kind: "networkChapters",
        iconKey: "globe",
        titleKey: "admin.gouvernance.poles.antennes.title",
        descriptionKey: "admin.gouvernance.poles.antennes.description",
      },
      {
        id: LEGENDES_CARD_ID,
        kind: "autoLevel",
        iconKey: "trophy",
        titleKey: "admin.gouvernance.poles.legendes.title",
        descriptionKey: "admin.gouvernance.poles.legendes.description",
        levelKey: LEGENDES_LEVEL_KEY,
      },
    ];
  }, [poles]);

  const openView = (memberId) => {
    if (memberId) setViewingMemberId(memberId);
  };
  const closeView = () => setViewingMemberId(null);

  const openAssign = (poleId, chapterId, seatId, seatLabel) => {
    if (poleId === ANTENNES_CARD_ID) {
      setAssigning({ kind: "antenne", antenneId: chapterId, seatLabel });
    } else {
      setAssigning({ kind: "pole", seatId, seatLabel });
    }
  };
  const closeAssign = () => setAssigning(null);

  const handleConfirmAssign = async (memberId) => {
    if (!assigning) return;
    if (assigning.kind === "antenne") {
      await assignerCoordinateurAntenne(assigning.antenneId, memberId);
    } else {
      await assignerSiege(assigning.seatId, memberId);
    }
    closeAssign();
    await charger();
  };

  // Échange le pôle à "index" avec son voisin ("direction" = -1 pour
  // monter, +1 pour descendre) — seuls les pôles réels (préfixe de
  // "structure", voir ci-dessus) sont concernés, "index" y correspond
  // directement à leur position dans "poles" trié.
  const movePole = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= poles.length) return;
    const idsTries = [...poles].sort((a, b) => a.order - b.order).map((pole) => pole.id);
    [idsTries[index], idsTries[target]] = [idsTries[target], idsTries[index]];
    await reordonnerPoles(idsTries);
    await charger();
  };

  const openAddPole = () => setPoleForm({ mode: "add" });
  const openEditPole = (pole) => setPoleForm({ mode: "edit", pole });
  const closePoleForm = () => setPoleForm(null);

  const handlePoleSubmit = async (payload) => {
    const apiPayload = {
      name: payload.title,
      description: payload.description,
      icon: payload.iconKey,
      // Un id "seat-..." est généré côté client pour un nouveau siège (voir
      // PoleFormModal) — jamais un vrai id backend (uuid) : on l'omet pour
      // que le backend le traite comme une création.
      seats: payload.seats.map((seat) => ({
        id: seat.id?.startsWith("seat-") ? undefined : seat.id,
        title: seat.title,
      })),
    };

    if (poleForm?.mode === "edit") {
      await modifierPole(poleForm.pole.id, apiPayload);
    } else {
      await creerPole(apiPayload);
    }
    closePoleForm();
    await charger();
  };

  const confirmDeletePole = async () => {
    if (!deletingPole) return;
    await supprimerPole(deletingPole.id);
    setDeletingPole(null);
    await charger();
  };

  const viewingMember = viewingMemberId ? getMember(viewingMemberId) : null;

  // Le titre du poste + son pôle, affiché en pastille dans la fiche
  // (ex: "Directeur Marketing Digital · Comité Exécutif") — recherché dans
  // toute la structure plutôt que suivi à côté, pour rester juste même
  // après une réassignation.
  const viewingSeatBadge = useMemo(() => {
    if (!viewingMemberId) return null;

    for (const pole of poles) {
      const seat = pole.seats.find((s) => s.memberId === viewingMemberId);
      if (seat) return `${seat.title} · ${pole.name}`;
    }
    for (const chapter of chapters) {
      if (chapter.leaderMemberId === viewingMemberId) {
        return `${t("admin.gouvernance.seats.leaderLegende")} · ${chapter.name}`;
      }
      if (chapter.coordinatorMemberId === viewingMemberId) {
        return `${t("admin.gouvernance.seats.coordinateur")} · ${chapter.name}`;
      }
    }
    if (legendesMembers.some((member) => member.id === viewingMemberId)) {
      return t(`simulateur.levels.${LEGENDES_LEVEL_KEY}.name`);
    }
    return null;
  }, [viewingMemberId, poles, chapters, legendesMembers, t]);

  // Vrai si "item" a quelque chose qui correspond à la recherche en cours —
  // son propre titre, ou selon son type : les titres/titulaires de ses
  // sièges ("assignable"), les antennes et leurs responsables
  // ("networkChapters"), ou ses membres ("autoLevel", le Conseil des
  // Légendes). Toujours vrai quand la recherche est vide.
  const itemMatchesSearch = (item) => {
    // normalizeSearchText tolère accents/casse/tirets des deux côtés (voir
    // searchUtils.js).
    const query = normalizeSearchText(search);
    if (!query) return true;

    if (normalizeSearchText(getPoleTitle(item, t)).includes(query)) return true;

    if (item.kind === "assignable") {
      return item.seats.some((seat) => {
        if (normalizeSearchText(seat.title).includes(query)) return true;
        const member = seat.memberId ? getMember(seat.memberId) : null;
        return Boolean(member && normalizeSearchText(member.name).includes(query));
      });
    }

    if (item.kind === "networkChapters") {
      return chapters.some((chapter) => {
        if (normalizeSearchText(chapter.name).includes(query)) return true;
        const leader = chapter.leaderMemberId ? getMember(chapter.leaderMemberId) : null;
        const coordinator = chapter.coordinatorMemberId
          ? getMember(chapter.coordinatorMemberId)
          : null;
        if (leader && normalizeSearchText(leader.name).includes(query)) return true;
        return Boolean(coordinator && normalizeSearchText(coordinator.name).includes(query));
      });
    }

    if (item.kind === "autoLevel") {
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

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger la gouvernance pour le moment.
          </div>
        )}

        {status === "ready" && (
          <div className="mt-4 space-y-6">
            {structure.map((item, index) => {
              const isRealPole = item.kind === "assignable";
              return (
                <PoleSection
                  key={item.id}
                  pole={item}
                  number={index + 1}
                  Icon={POLE_ICON_MAP[item.iconKey] ?? SparklesIcon}
                  onView={openView}
                  onAssign={openAssign}
                  autoLevelMembers={item.kind === "autoLevel" ? legendesMembers : undefined}
                  chapters={item.kind === "networkChapters" ? chapters : undefined}
                  onMoveUp={isRealPole ? () => movePole(index, -1) : undefined}
                  onMoveDown={isRealPole ? () => movePole(index, 1) : undefined}
                  canMoveUp={index > 0}
                  canMoveDown={index < poles.length - 1}
                  onEdit={isRealPole ? () => openEditPole(item) : undefined}
                  onDelete={isRealPole ? () => setDeletingPole(item) : undefined}
                  dimmed={!itemMatchesSearch(item)}
                />
              );
            })}
          </div>
        )}
      </div>

      <MemberSearchModal
        open={!!assigning}
        seatTitle={assigning?.seatLabel ?? ""}
        members={members}
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
