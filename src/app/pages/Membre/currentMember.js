// ----------------------------------------------------------------------
// Identité du membre connecté, partagée par toutes les pages de l'espace
// membre (dashboard, ma tontine, etc.) — même principe que
// Admin/currentAdmin.js. Placeholder en attendant que la connexion
// membre soit branchée au backend : remplacera cet objet par la réponse
// de l'endpoint "/me" une fois disponible.
//
// "levelKeys" (et non un "levelKey" unique) : un membre peut cotiser à
// plusieurs niveaux DBC en même temps (ex: 5 000 F/mois au niveau
// Starter ET 10 000 F/mois au niveau Bâtisseur — montants déjà définis
// dans Simulateur/data.js : "cotisation"). Le niveau actuellement
// affiché ("activeLevelKey") est géré par context/MemberLevelContext.jsx,
// pas ici : ce fichier ne garde que la liste des niveaux auxquels le
// membre appartient, pas celui qu'il regarde en ce moment.
//
// "batisseurPro" ajouté comme 3e niveau : c'est le premier palier qui
// donne accès au MLM Longrich (voir Membre/Mlm/mockData.js :
// "getLongrichPacks" — "batisseurPro" est le premier pack de la liste),
// pour que ce membre de démonstration puisse voir la page "Mon MLM" dans
// son état éligible, pas seulement le message d'invitation à y entrer.
// Conséquence à connaître : ce niveau n'a pas (encore) de groupe de
// tontine dans Tontine/mockData.js ("tontineMembersByLevel"), donc Ma
// Tontine et les stats du Dashboard afficheront des états vides pour ce
// niveau tant que cette donnée n'est pas ajoutée — pas une erreur, juste
// pas encore rempli.
//
// "coins" et "referralEarnings" alimentent les tuiles "Actualité de ce
// mois" du dashboard (communes à tous les niveaux) ; "domain" est la
// ligne de profession affichée sous le nom, même format que
// Admin/Membres/mockData.js ("X · Y").
export const currentMember = {
  name: "Thierry Mbida",
  role: "Membre",
  levelKeys: ["starter", "batisseur", "batisseurPro"],
  city: "Douala, Cameroun",
  domain: "Entrepreneur · Membre actif",
  photo: null, // pas de photo -> Avatar affiche "TM" sur fond de couleur
  coins: 320,
  sponsoredCount: 3,
  referralEarnings: 45000,
  // Matricule unique du membre, même format que côté admin ("DBC-<niveau>-<n°>",
  // voir Admin/Membres/mockData.js). C'est AUSSI ce qu'il donne pour parrainer :
  // la personne parrainée l'indique comme "Parrain (matricule)" à son
  // inscription (voir Reseau/InviteCard.jsx). Valeur de démonstration.
  matricule: "DBC-1-0042",
  // Champs MODIFIABLES depuis Paramètres > Profil (voir
  // Parametres/ProfileSection.jsx). "name", "city" et "domain" ci-dessus
  // en sont déduits (voir "applyProfile" plus bas) : les autres pages
  // continuent de lire "name", "city" et "domain" sans rien changer.
  // Coordonnées de démonstration (le numéro est volontairement invalide,
  // comme ceux de communityMembers.js).
  firstName: "Thierry",
  lastName: "Mbida",
  email: "thierry.mbida@example.com",
  whatsapp: "+237000000042",
  town: "Douala",
  country: "Cameroun",
  profession: "Entrepreneur",
};

// Modifications du profil faites dans Paramètres : gardées dans le
// navigateur (localStorage, protégé par try/catch) et réappliquées à
// l'ouverture du site, en attendant l'endpoint "/me" du backend (qui
// remplacera cet objet ET ce stockage). Ne s'applique qu'aux champs
// listés dans "EDITABLE_FIELDS" : le matricule, le niveau, les Coins... ne
// sont jamais modifiables par le membre lui-même.
const PROFILE_KEY = "dbc-membre-profile-v1";
const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "whatsapp",
  "town",
  "country",
  "profession",
  "photo",
];

function deriveFields(member) {
  member.name = `${member.firstName} ${member.lastName}`.trim();
  member.city = [member.town, member.country].filter(Boolean).join(", ");
  member.domain = `${member.profession} · Membre actif`;
}

export function applyProfile(patch) {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([key]) => EDITABLE_FIELDS.includes(key)),
  );
  Object.assign(currentMember, clean);
  deriveFields(currentMember);
  try {
    const stored = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? "{}");
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...stored, ...clean }));
  } catch {
    // stockage indisponible : le profil reste modifié pour cette session
  }
}

try {
  const stored = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? "{}");
  applyProfile(stored);
} catch {
  deriveFields(currentMember);
}
