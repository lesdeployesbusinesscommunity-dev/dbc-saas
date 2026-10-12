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
import { COUNTRY_MAPS, getPresenceRegions } from "./countryMaps";
import {
  countSubtreeStats,
  createNetworkNode,
  flattenTree,
  getMember,
  getTreeSearchMatches,
  initialLevelTitlesByCountry,
  insertNodeAbove,
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
  // ici, avec leur vrai responsable — pas une liste séparée. "allCountries"
  // et "addCountry" viennent du même contexte : la liste de pays figée
  // (mockData.networkCountries) complétée par ceux ajoutés à la volée
  // depuis le sélecteur (voir CountrySwitcher.jsx) — un pays qui n'est pas
  // dans les 22 options de départ peut être tapé directement là.
  const { networksByCountry, setNetworksByCountry, allCountries, addCountry } = useNetworkData();
  // Titre de rôle de chaque échelon (ex: "Le Visionnaire", "Responsable
  // Régional"), par pays et par profondeur — distinct du nom propre de
  // chaque branche (voir mockData.resolveLevelLabel). Renommable en
  // cliquant sur le badge d'une carte (voir NodeCard.jsx).
  const [levelTitlesByCountry, setLevelTitlesByCountry] = useState(initialLevelTitlesByCountry);
  const [activeCountry, setActiveCountry] = useState(DEFAULT_COUNTRY);
  // Recherche pilotée depuis l'en-tête partagé (voir AdminTopBar) : compare
  // au nom de branche ET au nom du responsable, dans l'arbre du pays actif
  // uniquement (voir getTreeSearchMatches, mockData.js) — changer de pays
  // vide la recherche, une requête qui datait d'un autre pays n'aurait plus
  // de sens ici.
  const [searchQuery, setSearchQuery] = useState("");
  const changeCountry = (country) => {
    setActiveCountry(country);
    setSearchQuery("");
  };
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

  // Carte régionale du pays actif (voir countryMaps.js) : absente pour la
  // plupart des pays (l'arbre reste alors en pleine largeur, comme avant).
  // "presenceRegions" repère les régions où la DBC a réellement quelqu'un
  // en poste (pas juste une branche créée mais vacante — voir
  // getPresenceRegions, qui vérifie tout le sous-arbre de la branche, pas
  // seulement elle-même) — c'est ce qui détermine où poser un pin sur la
  // carte (voir CameroonMap.jsx). Entièrement dérivé de l'arbre à chaque
  // rendu (comparaison tolérante aux accents/majuscules/tirets) : jamais
  // codé en dur, assigner un responsable ou ajouter une branche met la
  // carte à jour sans aucun changement de code.
  const countryMap = COUNTRY_MAPS[activeCountry];
  const presenceRegions = useMemo(
    () => getPresenceRegions(countryMap, root),
    [countryMap, root],
  );

  // Résultats de la recherche en cours dans l'arbre affiché (voir OrgTree/
  // NodeCard pour la mise en évidence) — null tant que le champ est vide,
  // donc aucun changement visuel par défaut.
  const searchMatches = useMemo(() => getTreeSearchMatches(root, searchQuery), [root, searchQuery]);
  const isSearching = searchQuery.trim().length > 0;
  const hasNoSearchResults = isSearching && searchMatches?.matchIds.size === 0;

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

  // Libellés des branches déjà présentes juste à l'endroit où la nouvelle
  // branche va atterrir (voir "insertMode" plus haut) — sert uniquement à
  // avertir l'admin d'un doublon probable dans le popover (voir
  // MemberPickerModal.jsx, "existingSiblingLabels"), jamais à bloquer :
  // "en dessous" -> les enfants actuels de la branche de référence ; "au-
  // dessus" -> les AUTRES enfants du parent de la référence (la nouvelle
  // branche prend la place exacte de la référence parmi eux).
  const siblingLabelsForPicker = useMemo(() => {
    if (!picker || picker.mode !== "create" || !root) return [];

    if (picker.insertMode === "above") {
      let parentOfReference = null;
      const findParent = (node) => {
        node.children.forEach((child) => {
          if (child.id === picker.referenceNodeId) parentOfReference = node;
          else findParent(child);
        });
      };
      findParent(root);
      return (parentOfReference?.children ?? [])
        .filter((child) => child.id !== picker.referenceNodeId)
        .map((child) => child.label)
        .filter(Boolean);
    }

    const referenceNode = flatNodes.find((entry) => entry.node.id === picker.referenceNodeId)?.node;
    return (referenceNode?.children ?? []).map((child) => child.label).filter(Boolean);
  }, [picker, root, flatNodes]);

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
        <AdminTopBar
          title={t("admin.reseau.title")}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t("admin.reseau.searchPlaceholder")}
        />

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
            <CountrySwitcher
              countries={allCountries}
              value={activeCountry}
              onChange={changeCountry}
              hasNetwork={(country) => Boolean(networksByCountry[country])}
              onAddCountry={addCountry}
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

          {root ? (
            <div className="flex flex-col lg:flex-row">
              {countryMap && (
                <div className="shrink-0 border-b border-gray-100 p-5 sm:p-6 lg:w-72 lg:border-b-0 lg:border-r">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("admin.reseau.map.title")}
                  </p>
                  <countryMap.Component presenceRegions={presenceRegions} className="mt-3 w-full" />
                  <p className="mt-3 text-xs text-gray-500">{t("admin.reseau.map.hint")}</p>
                </div>
              )}
              <div className="min-w-0 flex-1 overflow-x-auto">
                {hasNoSearchResults && (
                  <p className="px-5 pt-5 text-sm text-gray-500 sm:px-6">
                    {t("admin.reseau.search.noResults", { query: searchQuery.trim() })}
                  </p>
                )}
                <OrgTree
                  root={root}
                  levelTitles={levelTitles}
                  onAssign={openAssign}
                  onAddChild={(node) => openAddChild(node)}
                  onRenameLevel={renameLevel}
                  onViewMember={openMemberDetails}
                  searchMatches={searchMatches}
                />
              </div>
            </div>
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
        existingSiblingLabels={siblingLabelsForPicker}
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
