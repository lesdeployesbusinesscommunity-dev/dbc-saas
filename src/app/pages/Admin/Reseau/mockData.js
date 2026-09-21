// Local Imports
import { initialMembersByLevel } from "app/pages/Admin/Membres/mockData";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------
// Données de démonstration pour "Gestion du réseau". Comme pour les
// membres et le dashboard, l'intégration API est mise de côté pour
// l'instant : l'arbre de chaque pays est géré en local (ajouter une
// branche / assigner un responsable ne survit pas à un rechargement de
// page) en attendant les vrais endpoints.

// Bottin plat de tous les membres (tous niveaux confondus), utilisé par le
// sélecteur de membre du popover "Ajouter une branche" / "Assigner" — même
// source de données que "Gestion des membres", pour que le réseau reste
// cohérent avec le reste de l'admin.
export const allMembers = Object.entries(initialMembersByLevel).flatMap(
  ([levelKey, entries]) => entries.map((member) => ({ ...member, levelKey })),
);

function getMember(id) {
  return allMembers.find((member) => member.id === id) ?? null;
}

// Un seul échelon a un statut particulier : "National" (racine de l'arbre,
// un seul poste par pays, pas de nom de branche propre). Tout le reste de
// l'arbre est une simple "branche" au nom libre (ex: "Centre", "Yaoundé",
// "Quartier Bastos"…), à une profondeur illimitée — l'admin peut empiler
// autant d'échelons qu'il veut, dans l'ordre qu'il veut : ajouter une
// branche sous une branche existante, ou insérer une toute nouvelle
// branche AU-DESSUS d'une branche existante (qui en devient alors une
// sous-branche) pour créer un échelon intermédiaire là où il en manquait
// un. Voir insertNodeAbove ci-dessous.
export const NATIONAL_LABEL_KEY = "admin.reseau.levels.national";
export const BRANCH_LABEL_KEY = "admin.reseau.levels.branche";

// Titre de RÔLE de chaque échelon (ex: National = "Le Visionnaire", le
// niveau juste en dessous = "Responsable Régional"…) — distinct du nom
// PROPRE de chaque branche (ex: "Centre", "Littoral"), qui reste libre à
// la création de la branche (voir MemberPickerModal). Un même titre de
// rôle s'applique à toutes les branches d'un pays situées à la même
// profondeur (ex: tous les "Responsable Régional" du Cameroun) — modifiable
// à tout moment en cliquant sur le badge d'une carte (voir NodeCard.jsx).
// Tant qu'un niveau n'a pas encore été nommé, son badge retombe sur
// NATIONAL_LABEL_KEY / BRANCH_LABEL_KEY ci-dessus.
export const initialLevelTitlesByCountry = {};

export function resolveLevelLabel(depth, levelTitles, t) {
  const custom = levelTitles?.[depth];
  if (custom) return custom;
  return depth === 0 ? t(NATIONAL_LABEL_KEY) : t(BRANCH_LABEL_KEY);
}

// Liste des pays où la DBC est présente ou visée (même liste que le
// sélecteur "Pays" du formulaire d'inscription), triée alphabétiquement —
// tous sélectionnables dans "Gestion du réseau", qu'un arbre existe déjà
// pour eux ou non (voir "Aucun réseau pour ce pays" dans Reseau/index.jsx).
export const networkCountries = [
  "Algérie",
  "Belgique",
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "Canada",
  "Congo",
  "Côte d'Ivoire",
  "États-Unis",
  "France",
  "Gabon",
  "Ghana",
  "Guinée",
  "Mali",
  "Maroc",
  "Niger",
  "Nigéria",
  "RD Congo",
  "Sénégal",
  "Tchad",
  "Togo",
  "Tunisie",
].sort((a, b) => a.localeCompare(b));

let nodeSeq = 0;
// Crée un nœud de l'arbre (id unique auto-incrémenté) — utilisé aussi bien
// pour les données de démo ci-dessous qu'à l'exécution, quand on ajoute
// une nouvelle branche depuis l'UI (voir Reseau/index.jsx).
export function createNetworkNode({ memberId = null, label = null, children = [] } = {}) {
  nodeSeq += 1;
  return { id: `node-${nodeSeq}`, memberId, label, children };
}
const makeNode = createNetworkNode;

// Remplace (immuablement) le nœud "nodeId" quelque part dans "root" par le
// résultat de "updater(node)" — sert à assigner un membre à un poste vacant
// ou à ajouter un enfant à un nœud, sans muter l'arbre existant (React).
export function updateNodeInTree(root, nodeId, updater) {
  if (root.id === nodeId) return updater(root);
  return {
    ...root,
    children: root.children.map((child) => updateNodeInTree(child, nodeId, updater)),
  };
}

// Statistiques de la "descendance" administrative d'un nœud (tout ce qui
// est en dessous de lui dans l'arbre, PAS lui-même) : combien de
// sous-branches directes il supervise, combien de postes sont pourvus
// (donc combien de personnes sont, au sens large, "sous sa responsabilité"
// dans le réseau) et combien restent encore vacants dans toute sa
// descendance. Utilisé par la fiche membre ouverte depuis l'arbre (voir
// Reseau/index.jsx) pour donner à l'admin une vraie vue d'ensemble de
// l'étendue de la responsabilité de la personne, pas juste son parrainage
// individuel (qui est une donnée à part, voir member.sponsoredMembers).
export function countSubtreeStats(node) {
  let assignedCount = 0;
  let vacantCount = 0;

  const walk = (current) => {
    current.children.forEach((child) => {
      if (child.memberId) {
        assignedCount += 1;
      } else {
        vacantCount += 1;
      }
      walk(child);
    });
  };
  walk(node);

  return {
    directBranches: node.children.length,
    assignedCount,
    vacantCount,
    totalDescendants: assignedCount + vacantCount,
  };
}

// Aplati l'arbre en une liste [{ node, depth }, ...] (parcours en
// profondeur) — sert à construire la liste "Branche précédente" du
// popover "Ajouter une branche" : n'importe quelle branche existante du
// pays peut être choisie comme point d'attache de la nouvelle, pas
// seulement celle sur laquelle on a cliqué (voir Reseau/index.jsx).
export function flattenTree(root) {
  const result = [];
  const walk = (node, depth) => {
    result.push({ node, depth });
    node.children.forEach((child) => walk(child, depth + 1));
  };
  walk(root, 0);
  return result;
}

// Insère (immuablement) une toute nouvelle branche juste AU-DESSUS de
// "targetNodeId" : la nouvelle branche prend la place exacte de la cible
// dans l'arbre (même parent), et la cible devient son unique enfant — donc
// tout ce qui était déjà en dessous de la cible (ses propres sous-branches)
// suit avec elle. Sert à insérer un échelon intermédiaire manquant entre
// deux niveaux existants (ex: entre "Région" et "Ville"), ou même juste
// au-dessus d'une "Région" — n'importe quelle branche déjà créée peut
// recevoir une nouvelle branche au-dessus d'elle, sauf la racine "National"
// (un seul poste par pays, rien ne peut lui être ajouté par-dessus) : dans
// ce cas la fonction ne fait rien et renvoie l'arbre inchangé.
export function insertNodeAbove(root, targetNodeId, { memberId = null, label = null } = {}) {
  if (root.id === targetNodeId) return root;

  const walk = (node) => {
    const index = node.children.findIndex((child) => child.id === targetNodeId);
    if (index === -1) {
      return { ...node, children: node.children.map(walk) };
    }
    const target = node.children[index];
    const inserted = createNetworkNode({ memberId, label, children: [target] });
    const children = [...node.children];
    children[index] = inserted;
    return { ...node, children };
  };

  return walk(root);
}

// Arbres de démonstration pour quelques pays déjà "actifs" — construits à
// partir de membres réels de mockData (même ville/pays qu'eux, pour que
// l'arbre reste crédible). Un memberId à "null" représente une branche
// créée mais dont le poste est encore vacant (ex: Littoral, Yaoundé
// ci-dessous) : sert aussi à montrer l'état "à assigner" dans l'UI.
export const initialNetworksByCountry = {
  Cameroun: makeNode({
    memberId: "m1", // Hubert Wakap, Douala
    children: [
      makeNode({
        memberId: "m5", // Nadège Mbarga, Yaoundé
        label: "Centre",
        children: [makeNode({ memberId: null, label: "Yaoundé", children: [] })],
      }),
      makeNode({ memberId: null, label: "Littoral", children: [] }),
    ],
  }),
  Nigéria: makeNode({
    memberId: "m3", // Samuel Okafor, Lagos
    children: [
      // Libellé "Federal Capital Territory" (et non "Abuja (FCT)") : c'est
      // le nom de la région tel qu'utilisé par la carte de présence (voir
      // countryMaps.js) — un admin qui recrée cette branche verra la liste
      // de suggestions du champ "Nom de la branche" (voir MemberPickerModal)
      // et n'a pas besoin de connaître ce nom officiel par cœur.
      makeNode({ memberId: "m8", label: "Federal Capital Territory", children: [] }), // Chidi Eze
      makeNode({ memberId: null, label: "Lagos", children: [] }),
    ],
  }),
  Ghana: makeNode({
    memberId: "m2", // Grace Owusu, Accra
    children: [makeNode({ memberId: "m6", label: "Ashanti", children: [] })], // Kwame Asante
  }),
  Sénégal: makeNode({
    memberId: "m7", // Fatou Ndiaye, Dakar
    children: [],
  }),
  Mali: makeNode({
    memberId: "m4", // Aïcha Konaté, Bamako
    children: [makeNode({ memberId: "m9", label: "Bamako", children: [] })], // Awa Traoré
  }),
};

// Recherche dans l'arbre du pays actif (voir la barre de recherche
// partagée dans AdminTopBar, pilotée par Reseau/index.jsx) : "query" est
// comparé (insensible à la casse ET aux accents, voir normalizeSearchText —
// un clavier réglé en anglais retrouve "Extrême-Nord" en tapant "extreme
// nord") au nom de la branche (node.label) ET au nom de son responsable
// s'il en a un. Renvoie null si "query" est vide (pas de recherche en
// cours, l'arbre s'affiche normalement) ; sinon { matchIds, keepIds } —
// "matchIds" les nœuds qui correspondent directement (à mettre en
// évidence), "keepIds" ces mêmes nœuds PLUS leurs ancêtres (pour garder le
// fil qui y mène visible) et leurs descendants (une branche trouvée reste
// normalement visible en dessous) : tout nœud hors de "keepIds" doit être
// estompé par l'appelant (voir OrgTree.jsx / NodeCard.jsx) pour que les
// résultats ressortent dans un arbre qui peut être profond.
export function getTreeSearchMatches(root, query) {
  const trimmed = normalizeSearchText(query);
  if (!trimmed) return null;

  const allNodes = new Map();
  const parentOf = new Map();
  const indexNode = (node, parent) => {
    allNodes.set(node.id, node);
    if (parent) parentOf.set(node.id, parent);
    node.children.forEach((child) => indexNode(child, node));
  };
  indexNode(root, null);

  const matchIds = new Set();
  allNodes.forEach((node) => {
    const member = node.memberId ? getMember(node.memberId) : null;
    const labelMatches = node.label && normalizeSearchText(node.label).includes(trimmed);
    const memberMatches = member && normalizeSearchText(member.name).includes(trimmed);
    if (labelMatches || memberMatches) matchIds.add(node.id);
  });

  const keepIds = new Set(matchIds);
  matchIds.forEach((id) => {
    let ancestor = parentOf.get(id);
    while (ancestor) {
      keepIds.add(ancestor.id);
      ancestor = parentOf.get(ancestor.id);
    }
  });
  const addDescendants = (node) => {
    node.children.forEach((child) => {
      keepIds.add(child.id);
      addDescendants(child);
    });
  };
  matchIds.forEach((id) => addDescendants(allNodes.get(id)));

  return { matchIds, keepIds };
}

export { getMember };
