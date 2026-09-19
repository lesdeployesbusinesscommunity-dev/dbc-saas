// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BriefcaseIcon,
  GlobeAltIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { MemberDetailsCard } from "../Membres/MemberDetailsCard";
import { useNetworkData } from "../context/NetworkDataContext";
import { PoleSection } from "./PoleSection";
import { MemberSearchModal } from "./MemberSearchModal";
import {
  allMembers,
  founderQuote,
  getMember,
  getNetworkChapters,
  initialGovernanceStructure,
} from "./mockData";

// ----------------------------------------------------------------------

// Icône par pôle — voir mockData.js pour le texte (titre/description).
const POLE_ICONS = {
  fondatrice: SparklesIcon,
  executif: BriefcaseIcon,
  antennes: GlobeAltIcon,
  legendes: TrophyIcon,
};

// Page "Gestion de la gouvernance" (/admin/gouvernance) : les 4 pôles qui
// dirigent la DBC dans son ensemble, chacun avec ses postes et qui les
// occupe — pas juste une liste statique, on peut cliquer un poste pourvu
// pour voir la fiche complète de son titulaire (même fiche que "Gestion
// des membres"/"Gestion du réseau"), ou un poste vacant pour l'assigner à
// un membre existant (sauf le Conseil des Légendes, qui se peuple tout
// seul par niveau — voir PoleSection.jsx). Tout est géré en local pour
// l'instant (voir mockData.js), comme le reste de l'admin.
export default function Gouvernance() {
  const { t, i18n } = useTranslation();
  const { networksByCountry } = useNetworkData();
  const [structure, setStructure] = useState(initialGovernanceStructure);
  // Le "Leader Légende" de chaque chapitre vient directement de Gestion du
  // réseau (voir NetworkDataContext) — seul le "Coordinateur", propre à la
  // gouvernance, se gère ici, par id de branche.
  const [coordinatorsByNodeId, setCoordinatorsByNodeId] = useState({});
  const [viewingMemberId, setViewingMemberId] = useState(null);
  // assigning = { poleId, chapterId, seatId, seatLabel } | null
  const [assigning, setAssigning] = useState(null);

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

  const viewingMember = viewingMemberId ? getMember(viewingMemberId) : null;

  // Le titre du poste + son pôle, affiché en pastille dans la fiche
  // (ex: "Directeur Marketing Digital · Comité Exécutif") — recherché
  // dans toute la structure plutôt que suivi à côté, pour rester juste
  // même après une réassignation.
  const viewingSeatBadge = (() => {
    if (!viewingMemberId) return null;
    for (const pole of structure) {
      const poleTitle = t(pole.titleKey);
      if (pole.kind === "fixed" || pole.kind === "assignable") {
        const seat = pole.seats.find((s) => s.memberId === viewingMemberId);
        if (seat) return `${t(seat.titleKey)} · ${poleTitle}`;
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

  const quote = i18n.language?.startsWith("en") ? founderQuote.en : founderQuote.fr;

  return (
    <Page title={`Admin – ${t("admin.gouvernance.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("admin.gouvernance.title")} />

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

        <div className="mt-6 space-y-6">
          {structure.map((pole) => (
            <PoleSection
              key={pole.id}
              pole={pole}
              Icon={POLE_ICONS[pole.id]}
              onView={openView}
              onAssign={openAssign}
              autoLevelMembers={pole.kind === "autoLevel" ? legendesMembers : undefined}
              chapters={pole.kind === "networkChapters" ? chapters : undefined}
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
    </Page>
  );
}
