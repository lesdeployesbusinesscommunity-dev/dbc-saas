// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, ShareIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { CountrySwitcher } from "./CountrySwitcher";
import { OrgTree } from "./OrgTree";
import { MemberPickerModal } from "./MemberPickerModal";
import { MemberDetailsCard } from "../Membres/MemberDetailsCard";
import { useNetworkData } from "../context/NetworkDataContext";
import {
  countSubtreeStats,
  createNetworkNode,
  flattenTree,
  getMember,
  initialLevelTitlesByCountry,
  insertNodeAbove,
  networkCountries,
  resolveLevelLabel,
  updateNodeInTree,
} from "./mockData";

// ----------------------------------------------------------------------

const DEFAULT_COUNTRY = "Cameroun";

// Page "Gestion du réseau" (/admin/reseau) : un arbre généalogique par
// pays (Superviseur National > Superviseur Régional > Gestionnaire de
// ville), construit à partir des membres de "Gestion des membres". Tout
// est géré en local pour l'instant (voir mockData.js) — ajouter une
// branche ou assigner un responsable ne survit pas à un rechargement de
// page, en attendant les vrais endpoints.
export default function Reseau() {
  const { t } = useTranslation();
  // Partagé avec "Gestion de la gouvernance" (voir NetworkDataContext) :
  // "Réseau des Leaders d'Antennes" y reflète les vraies branches créées
  // ici, avec leur vrai responsable — pas une liste séparée.
  const { networksByCountry, setNetworksByCountry } = useNetworkData();
  // Titre de rôle de chaque échelon (ex: "Le Visionnaire", "Responsable
  // Régional"), par pays et par profondeur — distinct du nom propre de
  // chaque branche (voir mockData.resolveLevelLabel). Renommable en
  // cliquant sur le badge d'une carte (voir NodeCard.jsx).
  const [levelTitlesByCountry, setLevelTitlesByCountry] = useState(initialLevelTitlesByCountry);
  const [activeCountry, setActiveCountry] = useState(DEFAULT_COUNTRY);
  // picker = { mode: "assign" | "create" | "createRoot", nodeId?, depth?, referenceNodeId?, insertMode? } | null
  // - "assign" : nodeId pointe vers un poste vacant existant -> on choisit
  //   juste son responsable.
  // - "create" : "referenceNodeId" est la branche de référence — pré-remplie
  //   avec le nœud sur lequel le "+" a été cliqué, mais modifiable dans le
  //   popover (voir parentOptions ci-dessous), pour pouvoir aussi ajouter
  //   une branche n'importe où depuis le bouton global "Ajouter une
  //   branche". "insertMode" décide de l'emplacement par rapport à cette
  //   référence : "child" (en dessous, comportement historique) ou "above"
  //   (juste au-dessus — insère un échelon intermédiaire, la référence
  //   devenant une sous-branche de la nouvelle branche). Il n'y a plus de
  //   dernier échelon fixe : n'importe quelle branche, y compris les plus
  //   profondes, peut servir de référence dans les deux sens.
  // - "createRoot" : le pays n'a encore aucun réseau -> on crée le poste
  //   de Superviseur National, pas de branche de référence.
  const [picker, setPicker] = useState(null);
  // Nœud dont on affiche la fiche complète (poste déjà pourvu, cliqué sur
  // l'avatar/le nom — voir NodeCard.jsx) : { node, depth } | null.
  const [viewingNode, setViewingNode] = useState(null);

  const root = networksByCountry[activeCountry];
  const levelTitles = levelTitlesByCountry[activeCountry] ?? {};

  // Toutes les branches existantes du pays actif, aplaties, pour construire
  // la liste déroulante "Branche de référence" — toutes proposées, quelle
  // que soit leur profondeur (voir insertMode ci-dessus).
  const flatNodes = useMemo(() => (root ? flattenTree(root) : []), [root]);

  const describeNode = ({ node, depth }) => {
    const member = node.memberId ? getMember(node.memberId) : null;
    const memberLabel = member ? member.name : t("admin.reseau.vacant");
    const levelName = resolveLevelLabel(depth, levelTitles, t);
    return node.label
      ? `${levelName} · ${node.label} — ${memberLabel}`
      : `${levelName} — ${memberLabel}`;
  };

  const renameLevel = (depth, title) =>
    setLevelTitlesByCountry((prev) => ({
      ...prev,
      [activeCountry]: { ...(prev[activeCountry] ?? {}), [depth]: title },
    }));

  const parentOptions = useMemo(
    () => flatNodes.map((entry) => ({ id: entry.node.id, description: describeNode(entry) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatNodes, levelTitles],
  );

  const openAssign = (node, depth) => setPicker({ mode: "assign", nodeId: node.id, depth });
  const openMemberDetails = (node, depth) => setViewingNode({ node, depth });
  const closeMemberDetails = () => setViewingNode(null);
  const openAddChild = (node) =>
    setPicker({ mode: "create", referenceNodeId: node.id, insertMode: "child" });
  const openCreateRoot = () => setPicker({ mode: "createRoot" });
  const closePicker = () => setPicker(null);
  const setReferenceNodeId = (referenceNodeId) =>
    setPicker((prev) => {
      if (!prev) return prev;
      // Une référence "National" (racine) ne peut rien recevoir au-dessus
      // d'elle : si on la sélectionne alors que "above" était choisi, on
      // repasse automatiquement sur "en dessous".
      const stillValidAbove = prev.insertMode !== "above" || referenceNodeId !== root?.id;
      return {
        ...prev,
        referenceNodeId,
        insertMode: stillValidAbove ? prev.insertMode : "child",
      };
    });
  const setInsertMode = (insertMode) =>
    setPicker((prev) => (prev ? { ...prev, insertMode } : prev));

  const handleConfirmPicker = ({ memberId, label }) => {
    if (!picker) return;

    if (picker.mode === "createRoot") {
      setNetworksByCountry((prev) => ({
        ...prev,
        [activeCountry]: createNetworkNode({ memberId }),
      }));
    } else if (picker.mode === "assign") {
      setNetworksByCountry((prev) => ({
        ...prev,
        [activeCountry]: updateNodeInTree(prev[activeCountry], picker.nodeId, (node) => ({
          ...node,
          memberId,
        })),
      }));
    } else if (picker.mode === "create" && picker.insertMode === "above") {
      setNetworksByCountry((prev) => ({
        ...prev,
        [activeCountry]: insertNodeAbove(prev[activeCountry], picker.referenceNodeId, {
          memberId,
          label,
        }),
      }));
    } else if (picker.mode === "create") {
      const newNode = createNetworkNode({ memberId, label });
      setNetworksByCountry((prev) => ({
        ...prev,
        [activeCountry]: updateNodeInTree(prev[activeCountry], picker.referenceNodeId, (node) => ({
          ...node,
          children: [...node.children, newNode],
        })),
      }));
    }

    closePicker();
  };

  // Fiche membre ouverte depuis l'arbre (voir NodeCard.jsx) : en plus des
  // infos déjà connues de "Gestion des membres" (voir MemberDetailsCard),
  // on calcule l'étendue de sa responsabilité DANS CET ARBRE administratif
  // — combien de sous-branches il supervise directement, combien de
  // personnes sont en poste dans toute sa descendance, combien de postes y
  // restent vacants (voir countSubtreeStats dans mockData.js).
  const viewingMember = viewingNode?.node.memberId ? getMember(viewingNode.node.memberId) : null;
  const viewingNetworkContext = viewingNode
    ? {
        roleLabel: resolveLevelLabel(viewingNode.depth, levelTitles, t),
        branchLabel: viewingNode.node.label,
        country: activeCountry,
        ...countSubtreeStats(viewingNode.node),
      }
    : null;

  return (
    <Page title={`Admin – ${t("admin.reseau.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("admin.reseau.title")} />

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
            <CountrySwitcher
              countries={networkCountries}
              value={activeCountry}
              onChange={setActiveCountry}
              hasNetwork={(country) => Boolean(networksByCountry[country])}
            />

            {root && (
              <button
                type="button"
                onClick={() => openAddChild(root)}
                className="flex items-center gap-2 rounded-xl border-2 border-[#52A2DF] px-4 py-2.5 text-sm font-bold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.08]"
              >
                <PlusIcon aria-hidden="true" className="size-4" />
                {t("admin.reseau.addBranch")}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {root ? (
              <OrgTree
                root={root}
                levelTitles={levelTitles}
                onAssign={openAssign}
                onAddChild={(node) => openAddChild(node)}
                onRenameLevel={renameLevel}
                onViewMember={openMemberDetails}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
                  <ShareIcon aria-hidden="true" className="size-8" />
                </span>
                <div>
                  <p className="text-base font-bold text-gray-900">
                    {t("admin.reseau.empty.title")}
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    {t("admin.reseau.empty.description", { country: activeCountry })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateRoot}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-[#EE7115] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <PlusIcon aria-hidden="true" className="size-4" />
                  {t("admin.reseau.empty.cta")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MemberPickerModal
        open={!!picker}
        mode={picker?.mode ?? "assign"}
        country={activeCountry}
        parentOptions={parentOptions}
        parentId={picker?.referenceNodeId}
        onParentChange={setReferenceNodeId}
        insertMode={picker?.insertMode ?? "child"}
        onInsertModeChange={setInsertMode}
        canInsertAbove={picker?.referenceNodeId !== root?.id}
        onClose={closePicker}
        onConfirm={handleConfirmPicker}
      />

      <MemberDetailsCard
        member={viewingMember}
        open={!!viewingNode}
        onClose={closeMemberDetails}
        networkContext={viewingNetworkContext}
      />
    </Page>
  );
}
