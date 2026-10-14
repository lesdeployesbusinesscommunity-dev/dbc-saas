// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { listerNiveaux } from "api/adhesion";
import { listerAnnonces } from "api/gouvernance";
import { levels } from "app/pages/Simulateur/data";
import { levelKeyFromCode } from "utils/levelCodes";
import { getCourseCatalog } from "../Formation/formationData";

// ----------------------------------------------------------------------
// Diapositives du carrousel d'actualités du bandeau d'accueil (voir
// NewsCarousel.jsx). Tout vient des VRAIES données du site :
// - les annonces publiées par la DBC (GET /gouvernance/annonces), celles
//   réservées à un niveau n'apparaissant qu'aux membres de ce niveau ou
//   au-dessus ;
// - les formations les plus récentes du catalogue (même source que la page
//   Formation) et le prochain niveau DBC que le membre n'a pas encore (même
//   source que le tableau comparatif) ;
// - la présentation des programmes (texte dans les traductions, sous
//   "membre.dashboard.news.items.nouveauxProgrammes").
// Les rencontres (date, lieu, inscription) reviendront ici quand le serveur
// saura les gérer.
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

// Annonces de la DBC, chargées une fois depuis le serveur (la première fois
// que le carrousel ou les notifications en ont besoin).
const ANNOUNCEMENT_IMAGES = ["/investir 4.jpg", "/resauter.jpg", "/resauter 3.jpg", "/investir.jpg"];
let announcements = [];
let newsVersion = 0;
let newsRequested = false;
const newsListeners = new Set();

function loadAnnouncements() {
  newsRequested = true;
  Promise.all([listerAnnonces(), listerNiveaux()])
    .then(([items, niveaux]) => {
      const levelKeyById = new Map(niveaux.map((niveau) => [niveau.id, levelKeyFromCode(niveau.code)]));
      announcements = items.map((item) => ({
        ...item,
        targetLevelKey: item.targetLevelId ? levelKeyById.get(item.targetLevelId) ?? null : null,
      }));
      newsVersion += 1;
      newsListeners.forEach((listener) => listener());
    })
    .catch(() => {
      // serveur injoignable : pas d'annonces
    });
}

function subscribeNews(listener) {
  newsListeners.add(listener);
  return () => newsListeners.delete(listener);
}

const getNewsVersion = () => newsVersion;

// Se redessiner quand les annonces arrivent.
export function useNewsVersion() {
  return useSyncExternalStore(subscribeNews, getNewsVersion, getNewsVersion);
}

// Une annonce réservée à un niveau s'adresse aux membres de ce niveau ou au-dessus.
function isForMember(announcement, ownedLevelKeys) {
  if (!announcement.targetLevelKey) return true;
  const target = levels.findIndex((level) => level.key === announcement.targetLevelKey);
  return ownedLevelKeys.some((key) => levels.findIndex((level) => level.key === key) >= target);
}

function announcementSlides(ownedLevelKeys) {
  if (!newsRequested) loadAnnouncements();
  return announcements
    .filter((announcement) => isForMember(announcement, ownedLevelKeys))
    .map((announcement, index) => ({
      id: `annonce-${announcement.id}`,
      kind: "general",
      image: ANNOUNCEMENT_IMAGES[index % ANNOUNCEMENT_IMAGES.length],
      title: announcement.title,
      text: announcement.content,
      date: announcement.publishedAt?.slice(0, 10),
      cta: { type: "link", to: "/membre/notifications", labelKey: `${NEWS_KEY}.cta.discover` },
    }));
}

export function getNewsSlides(ownedLevelKeys) {
  const [firstFormation, secondFormation] = formationSlides(ownedLevelKeys);

  // Ordre voulu : on alterne les types pour que le défilement reste varié.
  return [
    ...announcementSlides(ownedLevelKeys),
    firstFormation,
    levelSlide(ownedLevelKeys),
    secondFormation,
    {
      id: "nouveauxProgrammes",
      kind: "general",
      image: "/investir 4.jpg",
      cta: { type: "link", to: "/membre/piliers", labelKey: `${NEWS_KEY}.cta.discover` },
    },
  ].filter(Boolean);
}
