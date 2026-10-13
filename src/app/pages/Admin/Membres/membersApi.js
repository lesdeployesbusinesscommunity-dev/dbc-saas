// Local Imports
import { LEVEL_CODE_BY_KEY, levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Passage entre la forme d'un membre dans "Gestion des membres" (celle que
// les composants de cette page lisent depuis le début : name, role, domain,
// city, country, sponsorName, sponsorMatricule, coins, status...) et celle de
// l'API (GET/POST/PATCH /membres).

// Membre de l'API -> forme de la page (avec son niveau).
export function memberFromApi(member) {
  return {
    id: member.id,
    levelKey: levelKeyFromCode(member.levelCode),
    matricule: member.membershipNumber,
    name: member.name,
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    role: member.title || (member.isAdmin ? "Administrateur" : "Membre"),
    domain: member.profession ?? "",
    coins: member.coins,
    status: member.status,
    city: member.city ?? "",
    country: member.country ?? "",
    phone: member.phoneNumber ?? "",
    email: member.email ?? "",
    photo: member.photoUrl ?? null,
    sponsorName: member.sponsor?.name ?? null,
    sponsorMatricule: member.sponsor?.membershipNumber ?? null,
    nextTontineDate: member.nextTontineDate,
    contributed: member.contributed,
    trainingsCompleted: member.trainingsCompleted,
    trainingInProgress: member.trainingInProgress,
    sponsoredMembers: member.sponsoredMembers.map((sponsored) => ({
      name: sponsored.name,
      matricule: sponsored.membershipNumber,
      city: sponsored.city ?? "",
    })),
    referralEarnings: member.referralEarnings,
    awards: member.awards,
    joinedAt: member.joinedAt ? String(member.joinedAt).slice(0, 10) : "",
  };
}

// Membres de l'API -> { [cléNiveau]: [membres] } (forme de la page).
export function groupMembersByLevel(members) {
  return members.map(memberFromApi).reduce((byLevel, { levelKey, ...member }) => {
    byLevel[levelKey] = [...(byLevel[levelKey] ?? []), member];
    return byLevel;
  }, {});
}

// "Nom complet" du formulaire -> prénom + nom (le premier mot est le prénom).
function splitName(fullName) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName: firstName ?? "", lastName: rest.join(" ") };
}

const profileFields = (form) => ({
  ...splitName(form.name),
  title: form.role?.trim() || undefined,
  profession: form.domain?.trim() || undefined,
  city: form.city?.trim() || undefined,
  country: form.country?.trim() || undefined,
});

// Formulaire "Ajouter un membre" -> corps de POST /membres.
export function createPayload(levelKey, form) {
  return {
    ...profileFields(form),
    phoneNumber: form.phone.trim(),
    email: form.email?.trim() || undefined,
    temporaryPassword: form.temporaryPassword,
    levelCode: LEVEL_CODE_BY_KEY[levelKey] ?? levelKey,
    sponsorMembershipNumber: form.sponsorMatricule?.trim() || undefined,
  };
}

// Formulaire "Mettre à jour" -> corps de PATCH /membres/:id.
export function updatePayload(levelKey, form) {
  return {
    ...profileFields(form),
    levelCode: LEVEL_CODE_BY_KEY[levelKey] ?? levelKey,
    coins: Number(form.coins) || 0,
    ...(form.status === "actif" || form.status === "desactive" ? { status: form.status } : {}),
  };
}
