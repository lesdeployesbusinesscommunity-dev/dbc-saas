// Local Imports
import { getMemberStore, memberLevelKeys, subscribeMemberStore } from "./memberStore";

// ----------------------------------------------------------------------
// Identité du membre connecté, partagée par toutes les pages de l'espace
// membre (dashboard, ma tontine, etc.) — même principe que
// Admin/currentAdmin.js. Elle reflète le profil renvoyé par le serveur
// (GET /espace-membre, voir memberStore.js) ; les champs gardent les noms que
// les pages lisent déjà ("name", "city", "domain", "levelKeys"...).
//
// "levelKeys" (et non un "levelKey" unique) : un membre peut cotiser à
// plusieurs niveaux DBC en même temps (jamais au-dessus de son niveau
// d'adhésion) — voir memberStore.js : "memberLevelKeys". Le niveau
// actuellement affiché ("activeLevelKey") est géré par
// context/MemberLevelContext.jsx, pas ici.
//
// Le profil est en lecture seule pour le membre (voir
// Parametres/ProfileSection.jsx) : une correction passe par l'équipe DBC.

// "currentMember" reste UN SEUL objet, partagé par toutes les pages : on
// change son CONTENU quand les données arrivent ou changent, plutôt que de le
// remplacer, pour que chaque import existant lise toujours le bon profil.
export const currentMember = {};

const memberListeners = new Set();

// Notifie ceux qui gardent des données PAR COMPTE (préférences...) quand le
// compte affiché change : ils relisent alors les leurs.
export function subscribeMember(listener) {
  memberListeners.add(listener);
  return () => memberListeners.delete(listener);
}

// Clé de stockage navigateur d'une donnée propre à un compte : deux comptes
// connectés tour à tour sur le même navigateur ne mélangent jamais leurs
// préférences ni leurs notifications lues.
export function accountStorageKey(base) {
  return `${base}:${currentMember.matricule ?? "anonyme"}`;
}

function sync() {
  const profile = getMemberStore().space?.profile;
  const previousMatricule = currentMember.matricule;
  Object.keys(currentMember).forEach((key) => delete currentMember[key]);
  if (profile) {
    const firstName = profile.firstName ?? "";
    const lastName = profile.lastName ?? "";
    Object.assign(currentMember, {
      id: profile.id,
      name: `${firstName} ${lastName}`.trim() || profile.membershipNumber,
      role: profile.role === "admin" ? "Administrateur" : "Membre",
      levelKeys: memberLevelKeys(),
      city: [profile.city, profile.country].filter(Boolean).join(", "),
      domain: profile.profession ? `${profile.profession} · Membre actif` : "Membre actif",
      photo: profile.photoUrl ?? null,
      coins: profile.coins ?? 0,
      sponsoredCount: profile.sponsoredCount ?? 0,
      referralEarnings: profile.referralEarnings ?? 0,
      matricule: profile.membershipNumber,
      firstName,
      lastName,
      email: profile.email ?? "",
      whatsapp: profile.phoneNumber ?? "",
      town: profile.city ?? "",
      country: profile.country ?? "",
      profession: profile.profession ?? "",
      joinedAt: profile.joinedAt,
    });
  } else {
    currentMember.levelKeys = [];
  }
  if (currentMember.matricule !== previousMatricule) {
    memberListeners.forEach((listener) => listener());
  }
}

sync();
subscribeMemberStore(sync);
