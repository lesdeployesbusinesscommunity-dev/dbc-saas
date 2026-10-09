// Import Dependencies
import { searchTextIncludes } from "app/pages/Admin/searchUtils";

// ----------------------------------------------------------------------

// Une formation correspond à la recherche de l'en-tête (voir
// Formation/index.jsx) si son nom, son formateur, son domaine ou son niveau
// contient le texte tapé (accents et majuscules ignorés, comme partout
// côté admin — voir Admin/searchUtils.js). Sans texte, tout correspond.
// Même règle pour les formations du catalogue et pour les formations
// verrouillées (LockedTrainings.jsx), pour qu'une même recherche les
// traite pareil.
export function courseMatches(course, query, t) {
  if (query.trim() === "") return true;
  return [
    course.name,
    course.trainer,
    t(`membre.formation.domains.${course.domainKey}`),
    t(`simulateur.levels.${course.levelKey}.name`),
  ].some((value) => searchTextIncludes(value, query));
}
