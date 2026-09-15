// ----------------------------------------------------------------------
// Identité de l'admin connecté, partagée par toutes les pages admin
// (dashboard, gestion des membres, etc.). Placeholder en attendant que la
// connexion admin soit branchée au backend — remplacera cet objet par la
// réponse de l'endpoint "/me" (ou équivalent) une fois disponible.
export const currentAdmin = {
  name: "Amaka Donald",
  role: "Admin",
  photo: null, // pas de photo -> Avatar affiche "AD" sur fond de couleur
};
