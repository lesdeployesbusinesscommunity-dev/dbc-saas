// Import Dependencies
import {
  ShareIcon,
  AcademicCapIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { currentMember } from "../currentMember";
import { formatMoney } from "app/pages/Simulateur/data";
import { getTontineGroup } from "../Tontine/mockData";
import { getCourseCatalog } from "../Formation/mockData";
import { getCourseProgress } from "../Formation/progressStore";

// ----------------------------------------------------------------------
// Données de démonstration pour le dashboard membre. Comme pour l'admin,
// rien n'est encore branché au backend : chaque export ci-dessous sera
// remplacé par un vrai appel API (groupe de tontine, formations en
// cours...) une fois l'intégration faite, sans changer la forme des
// composants qui les consomment.
//
// Un membre peut cotiser à plusieurs niveaux en même temps (voir
// currentMember.js : "levelKeys"), et chaque niveau a son propre groupe
// de tontine et son propre catalogue de formations. "myTontineGroup" et
// "myTrainingsInProgress" sont donc des FONCTIONS du niveau actuellement
// consulté ("activeLevelKey", voir context/MemberLevelContext.jsx) plutôt
// que des constantes figées — pour que changer de niveau depuis la carte
// de profil mette bien à jour ces deux widgets.

// Le groupe de tontine (qui a cotisé ce mois-ci, voir
// RightPanel/TontineStatus.jsx) vient maintenant de "Ma Tontine" (voir
// Tontine/mockData.js, qui garde le cycle annuel complet — qui reçoit la
// cagnotte à quel tour) plutôt que d'une liste séparée ici : une seule
// source pour le même groupe, consultée depuis deux pages différentes.
// Ré-exporté ici (plutôt que de changer l'import dans TontineStatus.jsx)
// pour ne pas toucher à un composant qui marche déjà.
export { getTontineGroup } from "../Tontine/mockData";

// Formations du niveau consulté, commencées mais pas encore terminées —
// même catalogue que la page "Formation" du membre (voir
// Formation/mockData.js, lui-même tiré de "Gestion des formations" côté
// admin) et même progression (leçons vues, voir
// Formation/progressStore.js) : le pourcentage affiché ici est toujours
// celui de la page Formation. Une formation jamais commencée (0 %) n'est
// pas "en cours".
export function getTrainingsInProgress(levelKey) {
  return getCourseCatalog(levelKey)
    .map((course) => ({ ...course, progress: getCourseProgress(course).percent }))
    .filter((course) => course.progress > 0 && course.progress < 100);
}

// "Actualité de ce mois" : mêmes icônes/couleurs de marque que le
// dashboard admin (orange #EE7115 / bleu #52A2DF en alternance). "coins"
// n'a pas de tuile ici : ce chiffre est déjà affiché dans la carte de
// profil juste au-dessus (voir ProfileSummaryCard.jsx). "filleuls" et
// "commission" sont propres au membre (pas à un niveau précis) ;
// "formations" et "cotisation" dépendent du niveau consulté.
export function getMonthlyStats(levelKey) {
  const trainingsInProgress = getTrainingsInProgress(levelKey);
  const tontineGroup = getTontineGroup(levelKey);

  return [
    {
      key: "filleuls",
      labelKey: "membre.dashboard.stats.filleuls",
      value: String(currentMember.sponsoredCount),
      Icon: ShareIcon,
      color: "#52A2DF",
    },
    {
      key: "formations",
      labelKey: "membre.dashboard.stats.formations",
      value: String(trainingsInProgress.length),
      Icon: AcademicCapIcon,
      color: "#EE7115",
    },
    {
      key: "cotisation",
      labelKey: "membre.dashboard.stats.cotisation",
      value: `${tontineGroup.filter((m) => m.status === "paid").length}/${tontineGroup.length}`,
      Icon: BanknotesIcon,
      color: "#52A2DF",
    },
    {
      key: "commission",
      labelKey: "membre.dashboard.stats.commission",
      value: formatMoney(currentMember.referralEarnings),
      Icon: CurrencyDollarIcon,
      color: "#EE7115",
    },
  ];
}
