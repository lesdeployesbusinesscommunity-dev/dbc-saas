// Import Dependencies
import { levels } from "app/pages/Simulateur/data";
import { getCourseCatalog } from "../Formation/mockData";

// ----------------------------------------------------------------------
// Diapositives du carrousel d'actualités du bandeau d'accueil (voir
// NewsCarousel.jsx). Comme le reste du dashboard, rien n'est encore branché
// au backend : cette liste sera remplacée par un appel API (actualités
// publiées par l'admin) sans changer le composant qui l'affiche.
//
// Deux sortes de contenu :
// - tiré des VRAIES données du site : les formations les plus récentes du
//   catalogue (même source que la page Formation) et le prochain niveau DBC
//   que le membre n'a pas encore (même source que le tableau comparatif) ;
// - des actualités DE DÉMONSTRATION (rencontres, antenne, programmes) dont
//   les textes sont dans les fichiers de traduction, sous
//   "membre.dashboard.news.items.<id>" : à remplacer par les vraies
//   annonces (dates, lieux, photos) quand l'admin pourra les publier.
//
// "image" : photo du dossier /public. Pour mettre une vraie photo d'une
// rencontre, déposer le fichier dans /public (ex: /public/rencontre-douala.jpg)
// et changer le chemin ici.
//
// Types ("kind") : "event" (rencontre / atelier, avec date et lieu),
// "formation", "antenne", "niveau" (inviter à solliciter un niveau),
// "general" (annonce de la DBC).

// Durée d'affichage de chaque diapositive, en millisecondes. 6 secondes est
// le rythme des grands sites : assez long pour lire le titre, la date et le
// bouton (c'était 1 seconde au départ). Le survol, la pause, le focus
// clavier et la fenêtre de confirmation arrêtent aussi le défilement. Pour
// changer le rythme, changer cette seule valeur.
export const NEWS_INTERVAL_MS = 6000;

const NEWS_KEY = "membre.dashboard.news";

// Nombre de formations récentes mises en avant dans le carrousel.
const FORMATIONS_SHOWN = 2;

// Les formations les plus récentes (date de début la plus proche de
// maintenant), tous niveaux confondus. Le bouton diffère selon que le
// membre cotise déjà à ce niveau ou non.
function formationSlides(ownedLevelKeys) {
  return levels
    .flatMap((level) => getCourseCatalog(level.key))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, FORMATIONS_SHOWN)
    .map((course) => ({
      id: `formation-${course.id}`,
      kind: "formation",
      image: course.poster,
      title: course.name,
      trainer: course.trainer,
      duration: course.duration,
      levelKey: course.levelKey,
      date: course.startDate,
      cta: ownedLevelKeys.includes(course.levelKey)
        ? {
            type: "link",
            to: `/membre/formation/${course.id}`,
            labelKey: `${NEWS_KEY}.cta.openFormation`,
          }
        : {
            type: "request",
            labelKey: `${NEWS_KEY}.cta.requestLevel`,
            questionKey: "membre.dashboard.comparison.requestQuestion",
            levelKey: course.levelKey,
          },
    }));
}

// Le premier niveau (dans l'ordre des niveaux) auquel le membre ne cotise
// pas encore ; pas de diapositive s'il les a tous.
function levelSlide(ownedLevelKeys) {
  const next = levels.find((level) => !ownedLevelKeys.includes(level.key));
  if (!next) return null;
  return {
    id: `niveau-${next.key}`,
    kind: "niveau",
    image: "/Finance.jpg",
    levelKey: next.key,
    cotisation: next.cotisation,
    cagnotte: next.cagnotte,
    cta: {
      type: "request",
      labelKey: `${NEWS_KEY}.cta.requestLevel`,
      questionKey: "membre.dashboard.comparison.requestQuestion",
      levelKey: next.key,
    },
  };
}

export function getNewsSlides(ownedLevelKeys) {
  const [firstFormation, secondFormation] = formationSlides(ownedLevelKeys);

  // Ordre voulu : on alterne les types pour que le défilement reste varié.
  return [
    {
      id: "rencontreDouala",
      kind: "event",
      image: "/resauter.jpg",
      date: "2026-10-18",
      hasPlace: true,
      cta: {
        type: "request",
        labelKey: `${NEWS_KEY}.cta.participate`,
        questionKey: `${NEWS_KEY}.items.rencontreDouala.question`,
      },
    },
    firstFormation,
    {
      id: "antenneBafoussam",
      kind: "antenne",
      image: "/resauter 3.jpg",
      date: "2026-10-24",
      hasPlace: true,
      cta: { type: "link", to: "/membre/reseau", labelKey: `${NEWS_KEY}.cta.seeNetwork` },
    },
    levelSlide(ownedLevelKeys),
    secondFormation,
    {
      id: "atelierYaounde",
      kind: "event",
      image: "/investir.jpg",
      date: "2026-11-07",
      hasPlace: true,
      cta: {
        type: "request",
        labelKey: `${NEWS_KEY}.cta.participate`,
        questionKey: `${NEWS_KEY}.items.atelierYaounde.question`,
      },
    },
    {
      id: "nouveauxProgrammes",
      kind: "general",
      image: "/investir 4.jpg",
      cta: { type: "link", to: "/membre/piliers", labelKey: `${NEWS_KEY}.cta.discover` },
    },
  ].filter(Boolean);
}
