// Local Imports
import { initialMembersByLevel } from "app/pages/Admin/Membres/mockData";
import { flattenTree } from "app/pages/Admin/Reseau/mockData";

// ----------------------------------------------------------------------
// Données de démonstration pour "Gestion de la gouvernance". Comme pour
// les autres sections admin, l'intégration API est mise de côté pour
// l'instant : tout est géré en local (voir Gouvernance/index.jsx) —
// nommer/vacanter un poste ne survit pas à un rechargement de page, en
// attendant les vrais endpoints.

// Bottin plat de tous les membres, même source de données que "Gestion
// des membres" et "Gestion du réseau", pour que la gouvernance reste
// cohérente avec le reste de l'admin.
export const allMembers = Object.entries(initialMembersByLevel).flatMap(
  ([levelKey, entries]) => entries.map((member) => ({ ...member, levelKey })),
);

export function getMember(id) {
  return allMembers.find((member) => member.id === id) ?? null;
}

// Les 4 pôles de la gouvernance DBC, dans l'ordre affiché. "kind" décide
// comment le pôle se comporte :
// - "fixed"      : un seul poste, purement informatif (le Fondateur &
//                  CEO ne se "réassigne" pas depuis un menu déroulant).
// - "assignable" : une liste de postes nommés et fixes (les 5 Directeurs
//                  du Comité Exécutif) — chaque poste peut être vacant ou
//                  pourvu, et réassigné par l'admin.
// - "networkChapters" : pas de postes fixes non plus — un binôme "Leader
//                  Légende" (le VRAI responsable de la branche, tel
//                  qu'assigné dans Gestion du réseau — lecture seule ici,
//                  ça se change là-bas) + "Coordinateur" (propre à la
//                  gouvernance, assignable ici) pour chaque "région"
//                  (branche juste sous National) déjà créée dans Gestion
//                  du réseau, tous pays confondus. Tout ce qui est encore
//                  plus profond (ex: une ville sous une région) reste
//                  dans la même carte, en "autre branche" — voir
//                  getNetworkChapters ci-dessous et Gouvernance/index.jsx.
// - "autoLevel"   : pas de postes fixes — la liste se déduit simplement
//                  de tous les membres ayant atteint "levelKey" (aucune
//                  action d'admin : on y entre automatiquement en
//                  atteignant ce niveau).
export const initialGovernanceStructure = [
  {
    id: "fondatrice",
    iconKey: "sparkles",
    titleKey: "admin.gouvernance.poles.fondatrice.title",
    descriptionKey: "admin.gouvernance.poles.fondatrice.description",
    kind: "fixed",
    seats: [{ id: "ceo", titleKey: "admin.gouvernance.seats.ceo", memberId: "m1" }],
  },
  {
    id: "executif",
    iconKey: "briefcase",
    titleKey: "admin.gouvernance.poles.executif.title",
    descriptionKey: "admin.gouvernance.poles.executif.description",
    kind: "assignable",
    seats: [
      { id: "dir-operations", titleKey: "admin.gouvernance.seats.directorOperations", memberId: "m7" },
      { id: "dir-financier", titleKey: "admin.gouvernance.seats.directorFinance", memberId: "m9" },
      { id: "dir-formations", titleKey: "admin.gouvernance.seats.directorTrainings", memberId: "m3" },
      { id: "dir-marketing", titleKey: "admin.gouvernance.seats.directorMarketing", memberId: "m2" },
      { id: "dir-diaspora", titleKey: "admin.gouvernance.seats.directorDiaspora", memberId: "m8" },
    ],
  },
  {
    id: "antennes",
    iconKey: "globe",
    titleKey: "admin.gouvernance.poles.antennes.title",
    descriptionKey: "admin.gouvernance.poles.antennes.description",
    kind: "networkChapters",
  },
  {
    id: "legendes",
    iconKey: "trophy",
    titleKey: "admin.gouvernance.poles.legendes.title",
    descriptionKey: "admin.gouvernance.poles.legendes.description",
    kind: "autoLevel",
    levelKey: "legende",
  },
];

// "number" n'est plus stocké sur le pôle : sa position dans "structure"
// (donc son rang affiché) peut changer librement (monter/descendre —
// voir Gouvernance/index.jsx), la pastille numérotée se recalcule donc à
// l'affichage à partir de l'index du tableau plutôt que d'un champ figé.
//
// "titleKey"/"descriptionKey" restent la source pour les 4 pôles fournis
// avec le site (texte déjà traduit FR/EN) ; un pôle ajouté ou renommé
// par l'admin (voir "Ajouter un pôle" / crayon "Modifier") n'a pas de
// traduction : il porte alors "title"/"description" en texte brut, qui
// prend le dessus s'il est présent. Même logique pour le titre d'un
// poste ("seat.title" prime sur "seat.titleKey"). Ces trois fonctions
// sont le point de passage unique pour afficher un titre de pôle/poste,
// pour ne jamais avoir à dupliquer ce choix ailleurs.
export function getPoleTitle(pole, t) {
  return pole.title ?? (pole.titleKey ? t(pole.titleKey) : "");
}

export function getPoleDescription(pole, t) {
  return pole.description ?? (pole.descriptionKey ? t(pole.descriptionKey) : "");
}

export function getSeatTitle(seat, t) {
  return seat.title ?? (seat.titleKey ? t(seat.titleKey) : "");
}

// Dérive la liste des "chapitres locaux / antennes diaspora" DIRECTEMENT
// des branches déjà créées dans Gestion du réseau (voir NetworkDataContext
// et Reseau/mockData.js), tous pays confondus — mais UN SEUL niveau de
// chapitre : seules les branches juste sous "National" (les "régions",
// ex: Centre, Littoral) deviennent une carte de chapitre à part, avec leur
// vrai responsable ("leaderMemberId"). Tout ce qui est encore plus profond
// (ex: Yaoundé sous Centre) n'a pas sa propre carte — ça reste dans la
// même carte que sa région, listé comme "autre branche" ("subBranches"),
// aussi loin que l'arbre descende. Un pays sans réseau, ou dont le réseau
// n'a encore aucune branche, ne produit simplement aucun chapitre — pas
// d'invention de données.
export function getNetworkChapters(networksByCountry) {
  const chapters = [];
  Object.entries(networksByCountry).forEach(([country, root]) => {
    if (!root) return;
    root.children.forEach((regionNode) => {
      const subBranches = flattenTree(regionNode)
        .filter(({ depth }) => depth > 0) // tout sauf regionNode lui-même
        .map(({ node }) => ({ nodeId: node.id, name: node.label, memberId: node.memberId }));

      chapters.push({
        nodeId: regionNode.id,
        name: regionNode.label,
        country,
        leaderMemberId: regionNode.memberId,
        subBranches,
      });
    });
  });
  return chapters;
}

// Citation fondatrice affichée en tête de page (voir Gouvernance/index.jsx).
export const founderQuote = {
  fr: "« L'Afrique ne manque pas de ressources. Elle manque d'Africains qui décident de se déployer. Soyez donc l'un d'eux, ou soutenez ceux qui le font. »",
  en: "“Africa doesn't lack resources. It lacks Africans who decide to step up. So be one of them, or support those who do.”",
  author: "Coach Hubert WAKAP, Fondateur DBC",
};
