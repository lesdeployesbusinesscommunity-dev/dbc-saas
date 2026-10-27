// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { flattenTree, getMember } from "../Reseau/mockData";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------

export const fullName = (registration) =>
  `${registration.prenom} ${registration.nom}`.replace(/\s+/g, " ").trim();

// Âge en années à partir de la date de naissance ("YYYY-MM-DD"), ou null.
export function ageOf(dateNaissance) {
  if (!dateNaissance) return null;
  const birth = dayjs(dateNaissance);
  if (!birth.isValid()) return null;
  return dayjs().diff(birth, "year");
}

// Où se tient l'entretien : le nom de la branche du leader, sinon sa
// localisation, sinon son pays (un Superviseur National n'a pas de branche).
export const assignmentPlace = (assignment, t) =>
  assignment.branchName ||
  assignment.location ||
  (assignment.isNational ? t("admin.reseau.levels.national") : assignment.country);

export const sameCountry = (a, b) => normalizeSearchText(a) === normalizeSearchText(b);

// Les leaders à qui confier l'entretien d'une demande, tirés du réseau
// (voir Gestion du réseau) : toute branche qui a un responsable en poste,
// avec son pays. "country" restreint à un pays ; sans lui, tous les pays.
// Les leaders d'antenne (branches) passent avant le Superviseur National du
// pays (la racine de l'arbre), qui reste proposé en dernier recours.
export function listLeaders(networksByCountry, country = null) {
  const leaders = [];
  Object.entries(networksByCountry).forEach(([networkCountry, root]) => {
    if (!root) return;
    if (country && !sameCountry(networkCountry, country)) return;
    flattenTree(root).forEach(({ node, depth }) => {
      if (!node.memberId) return;
      const member = getMember(node.memberId);
      if (!member) return;
      leaders.push({
        leaderId: member.id,
        leaderName: member.name,
        photo: member.photo ?? null,
        nodeId: node.id,
        branchName: node.name ?? "",
        location: node.label ?? "",
        country: networkCountry,
        isNational: depth === 0,
        depth,
      });
    });
  });
  return leaders.sort(
    (a, b) =>
      Number(a.isNational) - Number(b.isNational) ||
      a.country.localeCompare(b.country) ||
      a.depth - b.depth,
  );
}

// Valeurs de départ du formulaire "Créer un membre" (voir
// Membres/AddMemberModal.jsx, prop "initialValues") à partir de la demande :
// l'administration n'a plus qu'à valider le niveau. "members" = les membres
// existants, pour retrouver le parrain par son matricule. Le mois de début
// de la tontine, obligatoire mais absent du formulaire public, est proposé
// pour le mois prochain (modifiable).
export function memberPrefillFrom(registration, members = []) {
  const sponsor = registration.parrain
    ? members.find(
        (member) => member.matricule?.toUpperCase() === registration.parrain.toUpperCase(),
      )
    : null;
  return {
    name: fullName(registration),
    domain: registration.travail ?? "",
    city: registration.ville ?? "",
    country: registration.pays === "Autre" ? "" : (registration.pays ?? ""),
    email: registration.email ?? "",
    whatsapp: registration.whatsapp ?? "",
    sponsorMatricule: sponsor?.matricule ?? "",
    sponsorName: sponsor?.name ?? "",
    tontineStartMonth: dayjs().add(1, "month").format("YYYY-MM"),
  };
}
