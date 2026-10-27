// Import Dependencies
import {
  BookOpenIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ScaleIcon,
  MegaphoneIcon,
  BanknotesIcon,
  SparklesIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { pillars } from "app/pages/Admin/Piliers/mockData";

// ----------------------------------------------------------------------
// Les "domaines" servent à classer les formations par thème (Vente,
// Leadership, Finance...) dans la page Formation du membre, en plus du
// classement par niveau. Le catalogue admin (Admin/Formation/mockData.js)
// n'a PAS de champ "domaine" : tant qu'il n'en a pas, la correspondance
// formation -> domaine est tenue ici ("trainingDomains", par id de
// formation). Quand l'admin pourra choisir un domaine à la création d'une
// formation (voir AddTrainingModal.jsx), cette table disparaîtra et
// "domainKey" viendra directement de la formation.
//
// Les libellés sont dans i18n ("membre.formation.domains.<key>"). Les
// classes de couleur sont écrites EN ENTIER (jamais assemblées au
// moment de l'exécution) pour que Tailwind les détecte.
//
export const formationDomains = [
  { key: "fondamentaux", Icon: BookOpenIcon, chipClass: "bg-sky-50 text-sky-700" },
  { key: "vente", Icon: ShoppingBagIcon, chipClass: "bg-orange-50 text-orange-700" },
  { key: "leadership", Icon: UserGroupIcon, chipClass: "bg-violet-50 text-violet-700" },
  { key: "gouvernance", Icon: ScaleIcon, chipClass: "bg-slate-100 text-slate-700" },
  { key: "marketing", Icon: MegaphoneIcon, chipClass: "bg-pink-50 text-pink-700" },
  { key: "finance", Icon: BanknotesIcon, chipClass: "bg-emerald-50 text-emerald-700" },
  { key: "coaching", Icon: SparklesIcon, chipClass: "bg-amber-50 text-amber-700" },
  { key: "diaspora", Icon: GlobeAltIcon, chipClass: "bg-teal-50 text-teal-700" },
];

// Les formations du pilier FORMER : chaque programme du pilier (voir
// Admin/Piliers/mockData.js) est aussi une formation du catalogue, repérée par
// son id. Elles passent EN PREMIER, dans l'ordre des programmes du pilier
// (voir Admin/Formation/mockData.js pour leur contenu).
export const formerTrainings = {
  "p-ecole-affaires": "ecole-affaires",
  "p-leadership-academy": "leadership-academy",
  "p-digital-masters": "digital-masters",
  "p-pitch-school": "pitch-school",
  "p-sales-academy": "sales-academy",
  "p-dbc-challenge": "dbc-challenge",
};

const formerOrder = pillars.filter((pillar) => pillar.group === "former").map((pillar) => pillar.id);

// Rang d'un programme Former (0 = premier) ; hors pilier : après tous les autres.
export const formerRank = (pillarId) => {
  const index = formerOrder.indexOf(pillarId);
  return index === -1 ? formerOrder.length : index;
};

export const trainingDomains = {
  f1: "fondamentaux", // Fondamentaux DBC
  f2: "vente", // Techniques de vente
  f3: "leadership", // Leadership
  f4: "vente", // Vente & Négociation
  f5: "gouvernance", // Gouvernance associative
  f6: "marketing", // Marketing Digital
  f7: "finance", // Gestion financière avancée
  f8: "coaching", // Développement personnel & coaching
  f9: "diaspora", // Stratégie & Expansion Diaspora
  "p-ecole-affaires": "fondamentaux", // École des Affaires DBC
  "p-leadership-academy": "leadership", // Leadership Academy
  "p-digital-masters": "marketing", // Digital Masters
  "p-pitch-school": "vente", // Pitch School
  "p-sales-academy": "vente", // Sales Academy
  "p-dbc-challenge": "coaching", // DBC Challenge
};

// Le programme Former d'une formation (par son id), ou null si elle n'en est pas un.
export const formerProgramOf = (trainingId) => formerTrainings[trainingId] ?? null;

// Trie des formations pour mettre en premier celles du pilier Former ("idOf"
// donne l'id de la formation). Les formations ajoutées par l'admin, sans
// domaine, passent après.
export const formerFirst = (list, idOf = (item) => item.id) =>
  [...list].sort((a, b) => formerRank(formerProgramOf(idOf(a))) - formerRank(formerProgramOf(idOf(b))));

export function getDomain(key) {
  return formationDomains.find((domain) => domain.key === key) ?? formationDomains[0];
}
