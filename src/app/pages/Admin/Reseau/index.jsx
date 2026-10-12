// Import Dependencies
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ExclamationCircleIcon, ShareIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { CountrySwitcher } from "./CountrySwitcher";
import { OrgTree } from "./OrgTree";
import { MemberDetailsCard } from "../Membres/MemberDetailsCard";
import { toViewMember } from "../Membres/viewModel";
import { normalizeSearchText } from "../searchUtils";
import { reseauGlobal } from "api/reseauMlm";
import { listerMembres } from "api/membres";

// ----------------------------------------------------------------------

// Page "Gestion du réseau" (/admin/reseau) : l'arbre RÉEL de parrainage MLM
// (qui a recruté qui — GET /reseau-mlm/reseau-global, module 5), pas un
// organigramme éditable par l'admin comme dans l'ancienne maquette (voir
// mémoire "project_frontend_backend_ecart_admin") : rien ne se crée, ne se
// renomme ni ne s'assigne ici, c'est une vue de lecture sur les vraies
// relations de parrainage.
//
// L'arbre backend est plat (chaque membre + son parrain direct) et ignore
// le pays. Pour l'afficher par pays comme la maquette d'origine, chaque
// membre est relié à son plus proche ANCÊTRE DU MÊME PAYS (voir
// buildCountryForest) : un membre dont aucun ancêtre n'est du même pays
// devient une racine — il peut donc y avoir plusieurs racines par pays
// (plusieurs chaînes de recrutement indépendantes), d'où "forêt" plutôt
// que "arbre" (voir OrgTree.jsx).
export default function Reseau() {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [activeCountry, setActiveCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingNode, setViewingNode] = useState(null); // { node, depth } | null

  const charger = useCallback(async () => {
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      const [nodesData, membresData] = await Promise.all([reseauGlobal(), listerMembres()]);
      setNodes(nodesData);
      setMembers(membresData.map(toViewMember));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const nodeByMemberId = useMemo(() => new Map(nodes.map((node) => [node.memberId, node])), [nodes]);

  const countries = useMemo(
    () =>
      Array.from(new Set(members.map((member) => member.country).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [members],
  );

  // Choisit un pays par défaut (le premier, alphabétique) dès que la liste
  // est connue — une fois pour toutes, pas à chaque changement de "members"
  // (sinon impossible de rester sur le pays choisi après une action).
  useEffect(() => {
    if (activeCountry === null && countries.length > 0) {
      setActiveCountry(countries[0]);
    }
  }, [activeCountry, countries]);

  const changeCountry = (country) => {
    setActiveCountry(country);
    setSearchQuery("");
  };

  // Remonte le chemin de parrainage de "memberId" jusqu'au premier ancêtre
  // du pays "country" — null si aucun (le membre devient alors racine).
  const findLocalParentId = (memberId, country) => {
    let current = nodeByMemberId.get(memberId);
    while (current?.parentMemberId) {
      const parentId = current.parentMemberId;
      if (memberById.get(parentId)?.country === country) return parentId;
      current = nodeByMemberId.get(parentId);
    }
    return null;
  };

  // Construit la forêt de parrainage du pays actif : un nœud par membre de
  // ce pays, relié à son plus proche ancêtre du même pays (voir
  // findLocalParentId). Racines et enfants triés par nom pour un ordre
  // stable d'un rendu à l'autre.
  const roots = useMemo(() => {
    if (!activeCountry) return [];
    const membresDuPays = nodes.filter((node) => memberById.get(node.memberId)?.country === activeCountry);

    const treeNodeById = new Map(
      membresDuPays.map((node) => {
        const member = memberById.get(node.memberId);
        return [
          node.memberId,
          { id: node.memberId, member: { ...member, levelName: node.levelName }, children: [] },
        ];
      }),
    );

    const forestRoots = [];
    membresDuPays.forEach((node) => {
      const localParentId = findLocalParentId(node.memberId, activeCountry);
      const treeNode = treeNodeById.get(node.memberId);
      if (localParentId && treeNodeById.has(localParentId)) {
        treeNodeById.get(localParentId).children.push(treeNode);
      } else {
        forestRoots.push(treeNode);
      }
    });

    const byName = (a, b) => a.member.name.localeCompare(b.member.name);
    const sortRecursively = (node) => {
      node.children.sort(byName);
      node.children.forEach(sortRecursively);
    };
    forestRoots.sort(byName);
    forestRoots.forEach(sortRecursively);
    return forestRoots;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, members, activeCountry]);

  // Résultats de la recherche en cours (nom ou matricule) dans la forêt
  // affichée — null tant que le champ est vide (aucun changement visuel
  // par défaut), sinon { matchIds, keepIds } pour la mise en évidence/
  // l'estompage dans OrgTree/NodeCard.
  const searchMatches = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return null;

    const byId = new Map();
    const indexTree = (node, parent) => {
      byId.set(node.id, { node, parentId: parent?.id ?? null });
      node.children.forEach((child) => indexTree(child, node));
    };
    roots.forEach((root) => indexTree(root, null));

    const matchIds = new Set();
    byId.forEach(({ node }) => {
      if (
        normalizeSearchText(node.member.name).includes(query) ||
        normalizeSearchText(node.member.matricule).includes(query)
      ) {
        matchIds.add(node.id);
      }
    });

    const keepIds = new Set();
    const addDescendants = (node) => {
      node.children.forEach((child) => {
        keepIds.add(child.id);
        addDescendants(child);
      });
    };
    matchIds.forEach((id) => {
      let entry = byId.get(id);
      while (entry?.parentId) {
        keepIds.add(entry.parentId);
        entry = byId.get(entry.parentId);
      }
      addDescendants(byId.get(id).node);
    });

    return { matchIds, keepIds };
  }, [roots, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const hasNoSearchResults = isSearching && searchMatches?.matchIds.size === 0;

  const openMemberDetails = (node, depth) => setViewingNode({ node, depth });
  const closeMemberDetails = () => setViewingNode(null);

  // Étendue de la responsabilité du membre DANS CETTE FORÊT (filleuls
  // directs, taille totale de sa descendance) — jamais de poste vacant,
  // contrairement à l'ancien organigramme : chaque nœud est un membre réel.
  const countSubtreeStats = (node) => {
    let total = 0;
    const walk = (current) => {
      current.children.forEach((child) => {
        total += 1;
        walk(child);
      });
    };
    walk(node);
    return { assignedCount: total, directBranches: node.children.length, vacantCount: 0 };
  };

  const viewingNetworkContext = viewingNode
    ? {
        roleLabel: viewingNode.node.member.levelName,
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
          {status === "ready" && activeCountry && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 sm:p-6">
              <CountrySwitcher countries={countries} value={activeCountry} onChange={changeCountry} />
            </div>
          )}

          {status === "loading" && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 px-6 py-10 text-sm font-medium text-red-700">
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              Impossible de charger le réseau pour le moment.
            </div>
          )}

          {status === "ready" &&
            (roots.length > 0 ? (
              <div className="min-w-0 flex-1 overflow-x-auto">
                {hasNoSearchResults && (
                  <p className="px-5 pt-5 text-sm text-gray-500 sm:px-6">
                    {t("admin.reseau.search.noResults", { query: searchQuery.trim() })}
                  </p>
                )}
                <OrgTree roots={roots} onViewMember={openMemberDetails} searchMatches={searchMatches} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
                  <ShareIcon aria-hidden="true" className="size-8" />
                </span>
                <div>
                  <p className="text-base font-bold text-gray-900">{t("admin.reseau.empty.title")}</p>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    {t("admin.reseau.empty.description", { country: activeCountry })}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <MemberDetailsCard
        member={viewingNode?.node.member ?? null}
        open={!!viewingNode}
        onClose={closeMemberDetails}
        networkContext={viewingNetworkContext}
      />
    </Page>
  );
}
