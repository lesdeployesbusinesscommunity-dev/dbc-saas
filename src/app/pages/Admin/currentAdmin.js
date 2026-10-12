// ----------------------------------------------------------------------
// Identité de l'admin connecté, partagée par toutes les pages admin
// (dashboard, gestion des membres, etc.). Placeholder en attendant que la
// connexion admin soit branchée au backend — remplacera cet objet par la
// réponse de l'endpoint "/me" (ou équivalent) une fois disponible.
//
// C'est le compte administrateur de démonstration de la page de connexion
// (voir Auth/index.jsx : Hubert Wakap, matricule DBC-1-0001) — le même nom
// que sa fiche dans Gestion des membres et que son profil côté membre (voir
// Membre/currentMember.js).
export const currentAdmin = {
  name: "Hubert Wakap",
  role: "Admin",
  photo: null, // pas de photo -> Avatar affiche "HW" sur fond de couleur
};
