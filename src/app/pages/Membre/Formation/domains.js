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
};

export function getDomain(key) {
  return formationDomains.find((domain) => domain.key === key) ?? formationDomains[0];
}
