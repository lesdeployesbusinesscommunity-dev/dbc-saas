// ----------------------------------------------------------------------
// Annuaire de démonstration des membres de la communauté, partagé par
// toutes les pages de l'espace membre qui parlent des MÊMES personnes :
// "Classement DBC Coins" (Coins/CoinsLeaderboard.jsx) et "Mon Réseau"
// (Reseau/). Une seule source pour leur niveau, leurs Coins et leur
// statut, pour qu'un chiffre ne diffère jamais d'une page à l'autre.
// Placeholder en attendant le backend : remplacé par les vrais membres
// une fois l'API branchée.
//
// "role", "sector", "coins", "status" et "levelKey" viennent de la liste
// "Membres de la communauté" fournie telle quelle ("status" reprend les
// valeurs de l'admin : "actif" / "attente", voir Admin/Membres/mockData.js
// : "statusOptions"). "city" et "memberSinceYear" sont des champs de
// démonstration inventés pour la fiche "CV" (aucune donnée fournie), tout
// comme "coinsThisMonth" (Coins gagnés ce mois-ci, pour le classement
// "Ce mois") et "phone" (numéros VOLONTAIREMENT invalides, +237 000...,
// pour qu'un clic sur "Appeler"/"WhatsApp" pendant la démonstration ne
// joigne jamais une vraie personne) — à remplacer par de vraies données
// membre une fois le backend branché.
export const communityMembers = [
  { id: "hubert", name: "Hubert Wakap", role: "Fondateur & CEO", levelKey: "elite", sector: "Coach · Consultant · Conférencier", coins: 840, status: "actif", city: "Douala", memberSinceYear: 2022, coinsThisMonth: 120, phone: "+237000000001" },
  { id: "marie", name: "Marie Atangana", role: "Membre Active", levelKey: "performerPro", sector: "Commerce & Distribution", coins: 320, status: "actif", city: "Douala", memberSinceYear: 2023, coinsThisMonth: 70, phone: "+237000000002" },
  { id: "jean", name: "Jean Nkodo", role: "Leader Antenne", levelKey: "performer", sector: "Tech & Digital", coins: 210, status: "actif", city: "Bafoussam", memberSinceYear: 2023, coinsThisMonth: 45, phone: "+237000000003" },
  { id: "celeste", name: "Céleste Mbida", role: "Leader Antenne", levelKey: "stratege", sector: "Finance & Investissement", coins: 530, status: "actif", city: "Yaoundé", memberSinceYear: 2022, coinsThisMonth: 95, phone: "+237000000004" },
  { id: "patrick", name: "Patrick Essono", role: "Membre", levelKey: "batisseurPro", sector: "Agriculture & Agro", coins: 130, status: "actif", city: "Garoua", memberSinceYear: 2024, coinsThisMonth: 30, phone: "+237000000005" },
  { id: "diane", name: "Diane Fouda", role: "Membre", levelKey: "batisseur", sector: "Artisanat & Mode", coins: 70, status: "attente", city: "Bamenda", memberSinceYear: 2024, coinsThisMonth: 10, phone: "+237000000006" },
];

// Couleur brute par niveau DBC, en plus des classes Tailwind déjà établies
// (Simulateur/data.js : textClass/borderClass/bgTintClass) : un avatar ou
// une barre dont la largeur est calculée a besoin d'un hex direct en style
// inline, pas d'une classe Tailwind littérale — même raison que
// "CATEGORY_COLORS" dans Dashboard/MonthlyActivityChart.jsx. Valeurs
// recopiées à l'identique de Simulateur/data.js : à garder synchronisées
// si ces couleurs changent là-bas.
export const LEVEL_HEX = {
  starter: "#52A2DF",
  batisseur: "#EE7115",
  batisseurPro: "#7C3AED",
  performer: "#CA8A04",
  performerPro: "#16A34A",
  stratege: "#E11D48",
  elite: "#4F46E5",
  legende: "#B45309",
};

export function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
