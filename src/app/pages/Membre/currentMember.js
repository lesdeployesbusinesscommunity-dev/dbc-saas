// Local Imports
import { initialMembersByLevel } from "app/pages/Admin/Membres/mockData";
import { getSessionSnapshot, subscribeSession } from "app/pages/Auth/session";

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

const thierryProfile = {
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

// Profil MEMBRE de l'administrateur. Un admin est d'abord un membre : quand il
// passe en "mode membre" (menu du profil), il retrouve SA page membre, avec
// son nom, son matricule et ses chiffres — pas ceux d'un autre. Ses données
// viennent de sa fiche dans Gestion des membres (voir
// Admin/Membres/mockData.js : même matricule, mêmes Coins, mêmes filleuls),
// pour qu'une seule source dise qui il est. Seules les coordonnées (email,
// WhatsApp) et la profession affichée sont de démonstration : elles ne sont
// pas dans cette fiche. Il cotise au niveau Starter seulement (voir son
// groupe de tontine, Tontine/mockData.js).
const adminRecord = initialMembersByLevel.starter.find((member) => member.matricule === "DBC-1-0001");

const adminMemberProfile = {
  name: "Hubert Wakap",
  role: "Membre",
  levelKeys: ["starter"],
  city: "Douala, Cameroun",
  domain: "Fondateur & CEO · Membre actif",
  photo: null,
  coins: adminRecord?.coins ?? 0,
  sponsoredCount: adminRecord?.sponsoredMembers?.length ?? 0,
  referralEarnings: adminRecord?.referralEarnings ?? 0,
  matricule: "DBC-1-0001",
  firstName: "Hubert",
  lastName: "Wakap",
  email: "hubert.wakap@example.com",
  whatsapp: "+237000000001",
  town: "Douala",
  country: "Cameroun",
  profession: "Fondateur & CEO",
};

// Le profil affiché dépend de la SESSION (voir Auth/session.js) : chaque
// compte a le sien, choisi par le nom de la session (celui du compte connecté
// — le serveur le fournira plus tard). Un compte inconnu retombe sur le
// membre de démonstration.
const PROFILES = {
  "Thierry Mbida": { key: "thierry", data: thierryProfile, storageKey: "dbc-membre-profile-v1" },
  "Hubert Wakap": { key: "admin", data: adminMemberProfile, storageKey: "dbc-membre-profile-admin-v1" },
};
const DEFAULT_PROFILE = PROFILES["Thierry Mbida"];

// "currentMember" reste UN SEUL objet, partagé par toutes les pages : on
// change son CONTENU quand un autre compte se connecte, plutôt que de le
// remplacer, pour que chaque import existant continue de lire le bon profil.
export const currentMember = {};
let activeProfile = null;

// Modifications du profil faites dans Paramètres : gardées dans le
// navigateur (localStorage, protégé par try/catch) et réappliquées à
// l'ouverture du site, en attendant l'endpoint "/me" du backend (qui
// remplacera cet objet ET ce stockage). Une clé de stockage PAR profil : le
// profil de l'admin et celui du membre de démonstration ne se mélangent pas.
// Ne s'applique qu'aux champs listés dans "EDITABLE_FIELDS" : le matricule,
// le niveau, les Coins... ne sont jamais modifiables par le membre lui-même.
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

// Notifie ceux qui gardent des données PAR COMPTE (progression des formations,
// préférences...) quand le compte affiché change : ils relisent alors les leurs.
const memberListeners = new Set();

export function subscribeMember(listener) {
  memberListeners.add(listener);
  return () => memberListeners.delete(listener);
}

// Clé de stockage d'une donnée propre à un compte : le membre de démonstration
// garde les clés d'origine (rien ne se perd chez lui), les autres comptes (ex :
// l'administrateur en mode membre) ont chacun la leur — leurs formations, leurs
// préférences et leurs notifications lues ne se mélangent pas avec celles d'un
// autre.
export function accountStorageKey(base) {
  return currentMember.matricule === thierryProfile.matricule ? base : `${base}:${currentMember.matricule}`;
}

// Le compte affiché : "thierry" (membre de démonstration) ou "admin" (le
// profil membre de l'administrateur). Sert à choisir les données de
// démonstration de chaque page (voir accountData.js).
export function getAccountKey() {
  return (activeProfile ?? DEFAULT_PROFILE).key;
}

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
    const stored = JSON.parse(window.localStorage.getItem(activeProfile.storageKey) ?? "{}");
    window.localStorage.setItem(activeProfile.storageKey, JSON.stringify({ ...stored, ...clean }));
  } catch {
    // stockage indisponible : le profil reste modifié pour cette session
  }
}

// Remplace le contenu de "currentMember" par celui du profil demandé, puis
// réapplique les modifications gardées pour CE profil.
function activate(profile) {
  if (activeProfile === profile) return;
  activeProfile = profile;
  Object.keys(currentMember).forEach((key) => delete currentMember[key]);
  Object.assign(currentMember, { ...profile.data, levelKeys: [...profile.data.levelKeys] });
  deriveFields(currentMember);
  try {
    const stored = JSON.parse(window.localStorage.getItem(profile.storageKey) ?? "{}");
    applyProfile(stored);
  } catch {
    // rien de gardé : le profil d'origine reste en place
  }
  memberListeners.forEach((listener) => listener());
}

activate(PROFILES[getSessionSnapshot().session?.name] ?? DEFAULT_PROFILE);

// Un compte qui se connecte (ou un admin qui change d'espace) : le profil
// suit le compte. À la déconnexion on ne change rien — les pages encore à
// l'écran ne doivent pas afficher un autre nom pendant la redirection.
subscribeSession(() => {
  const session = getSessionSnapshot().session;
  if (session) activate(PROFILES[session.name] ?? DEFAULT_PROFILE);
});
