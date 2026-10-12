// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { getContributionDay, getPlatformSettings, getReminderDays, usePlatformSettings } from "app/pages/Admin/Parametres/platformSettings";
import { initialMembersByLevel } from "app/pages/Admin/Membres/mockData";
import { currentMember } from "app/pages/Membre/currentMember";
import { getCoinsHistory } from "app/pages/Membre/Coins/mockData";
import { getNewsSlides } from "app/pages/Membre/Dashboard/newsData";
import { getCourseCatalog } from "app/pages/Membre/Formation/mockData";
import { getCourseProgress } from "app/pages/Membre/Formation/progressStore";
import { loadSettings } from "app/pages/Membre/Parametres/settingsStore";
import {
  getCurrentTour,
  getMonthlyCagnotte,
  getMyNextPayment,
  getMyNextTurn,
  getTontineGroup,
  isCycleComplete,
} from "app/pages/Membre/Tontine/mockData";
import { isMine, isRead, markAllRead, markRead, useNotificationState } from "./notificationsStore";

// ----------------------------------------------------------------------
// Le FIL de notifications de chaque espace : les notifications enregistrées
// (demandes et décisions, voir notificationsStore.js) + celles qu'on DÉDUIT
// des données du site — pas de stockage pour celles-ci, elles se recalculent
// (donc un rappel de cotisation disparaît tout seul une fois la cotisation
// payée). Données de démonstration comme le reste du site : les rappels et
// les nouveautés sont datés par rapport à AUJOURD'HUI, faute de vrais
// événements horodatés côté serveur.
//
// Deux filtres s'appliquent au fil MEMBRE :
// - côté ADMIN : la matrice de Paramètres > Notifications (colonne
//   "Membres" pour le fil membre, "Administrateurs" pour le fil admin) et
//   l'interrupteur général de la plateforme ;
// - côté MEMBRE : ses propres choix dans Paramètres > Notifications
//   (l'interrupteur général et, par type, au moins un canal activé).
// Les DÉCISIONS sur les demandes du membre et les DEMANDES reçues par
// l'admin ne sont jamais filtrées : ce sont des actions à suivre.
//
// "group" range chaque notification pour les filtres de la page ; "at" est
// l'heure (en millisecondes) utilisée pour le tri ; "to" un lien éventuel.
// "matrixKey" / "prefKey" disent par quel réglage elle est filtrée.

// Une notification déduite n'a pas de vraie heure d'arrivée : on la date sur
// la journée (rappel du matin, suivi...) et, si cette heure n'est pas encore
// passée, on la ramène à la veille pour ne jamais afficher une notification
// "du futur".
const make = (audience, kind, id, at, group, extra = {}) => ({
  id: `${audience}-${id}`,
  audience,
  kind,
  at: at.valueOf() > Date.now() ? at.subtract(1, "day").valueOf() : at.valueOf(),
  group,
  ...extra,
});

// ----------------------------------------------------------------------
// Fil MEMBRE
function memberDerived(platform) {
  const items = [];
  const today = dayjs().startOf("day");
  const ownedLevelKeys = currentMember.levelKeys ?? [];
  const reminderDays = getReminderDays(platform);

  ownedLevelKeys.forEach((levelKey) => {
    const group = getTontineGroup(levelKey);
    if (group.length === 0) return;

    // Cotisation : alerte si le membre n'a pas réglé alors que l'échéance de
    // ce mois est passée, sinon rappel dans les jours qui précèdent l'échéance.
    const payment = getMyNextPayment(levelKey);
    const dueThisMonth = today.date(getContributionDay(platform));
    const overdue = payment.isLate && dueThisMonth.isBefore(today);
    const nextDue = payment.isLate ? dueThisMonth : payment.dueDate;
    const daysLeft = nextDue.startOf("day").diff(today, "day");
    if (overdue) {
      items.push(
        make("membre", "cotisationRetard", `retard-${levelKey}`, today.add(9, "hour"), "tontine", {
          params: { levelKey, amount: payment.amount, due: dueThisMonth.toISOString() },
          to: "/membre/tontine",
          matrixKey: "rappelEcheance",
          prefKey: "cotisation",
        }),
      );
    } else if (daysLeft <= reminderDays) {
      items.push(
        make("membre", "cotisationRappel", `rappel-${levelKey}`, today.add(8, "hour"), "tontine", {
          params: { levelKey, amount: payment.amount, due: nextDue.toISOString(), days: daysLeft },
          to: "/membre/tontine",
          matrixKey: "rappelEcheance",
          prefKey: "cotisation",
        }),
      );
    }

    // Qui a cotisé ce tour, qui ne l'a pas encore fait.
    const paid = group.filter((member) => member.status === "paid").length;
    const unpaidNames = group.filter((member) => member.status !== "paid").map((member) => member.name);
    items.push(
      make("membre", "cotisationSuivi", `suivi-${levelKey}`, today.add(7, "hour"), "tontine", {
        params: { levelKey, paid, total: group.length, names: unpaidNames.slice(0, 3) },
        to: "/membre/tontine",
        matrixKey: "cotisationRecue",
        prefKey: "cotisation",
      }),
    );

    // Tour de tontine : à qui revient la cagnotte, et quand c'est mon tour.
    if (!isCycleComplete(levelKey)) {
      const tour = getCurrentTour(levelKey);
      if (tour) {
        items.push(
          make("membre", "tourAttribue", `tour-${levelKey}`, today.subtract(1, "day").add(18, "hour"), "tontine", {
            params: { levelKey, tour: tour.tour, name: tour.memberName, amount: getMonthlyCagnotte(levelKey) },
            to: "/membre/tontine",
            matrixKey: "tourAttribue",
            prefKey: "tontineTurn",
          }),
        );
      }
      const mine = getMyNextTurn(levelKey);
      if (mine && mine.status !== "closed" && mine.monthsAway <= 1) {
        items.push(
          make("membre", "tourProche", `proche-${levelKey}`, today.add(6, "hour"), "tontine", {
            params: { levelKey, monthsAway: mine.monthsAway, tour: mine.tour },
            to: "/membre/tontine",
            matrixKey: "tourAttribue",
            prefKey: "tontineTurn",
          }),
        );
      }
    }
  });

  // Coins obtenus (les plus récents du journal), dont le parrainage.
  const latestMonth = getCoinsHistory()[0];
  (latestMonth?.entries ?? []).slice(0, 4).forEach((entry, index) => {
    const referral = entry.category === "parrainage";
    items.push(
      make("membre", referral ? "filleul" : "coins", `coins-${entry.id}`, today.subtract(index + 1, "day").add(12, "hour"), "coins", {
        params: { amount: entry.amount, label: entry.label },
        to: "/membre/coins",
        matrixKey: referral ? "nouveauFilleul" : "coinsGagnes",
        prefKey: referral ? "referral" : "coins",
      }),
    );
  });

  // Formations : les plus récentes des niveaux du membre, et celles à reprendre.
  const courses = ownedLevelKeys.flatMap((levelKey) => getCourseCatalog(levelKey));
  [...courses]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 2)
    .forEach((course, index) => {
      items.push(
        make("membre", "formationNouvelle", `form-${course.id}`, today.subtract(index + 2, "day").add(10, "hour"), "formation", {
          params: { name: course.name, levelKey: course.levelKey, date: course.startDate },
          to: `/membre/formation/${course.id}`,
          matrixKey: "nouvelleFormation",
          prefKey: "formation",
        }),
      );
    });
  courses
    .map((course) => ({ course, percent: getCourseProgress(course).percent }))
    .filter(({ percent }) => percent > 0 && percent < 100)
    .slice(0, 2)
    .forEach(({ course, percent }, index) => {
      items.push(
        make("membre", "formationRappel", `reprise-${course.id}`, today.subtract(index, "day").add(9, "hour"), "formation", {
          params: { name: course.name, percent },
          to: `/membre/formation/${course.id}`,
          matrixKey: "rappelFormation",
          prefKey: "formation",
        }),
      );
    });

  // Rencontres et annonces de la DBC (les mêmes que le carrousel du Dashboard).
  getNewsSlides(ownedLevelKeys).forEach((slide, index) => {
    if (slide.kind === "event") {
      const date = dayjs(slide.date);
      if (date.isBefore(today)) return;
      items.push(
        make("membre", "rencontre", `event-${slide.id}`, today.subtract(index, "day").add(11, "hour"), "community", {
          params: { eventId: slide.id, date: slide.date, soon: date.diff(today, "day") <= 7 },
          to: "/membre/dashboard",
          matrixKey: "rencontre",
          prefKey: "community",
        }),
      );
    } else if (slide.kind === "antenne" || slide.kind === "general") {
      items.push(
        make("membre", "dbc", `dbc-${slide.id}`, today.subtract(index + 1, "day").add(15, "hour"), "community", {
          params: { itemId: slide.id, date: slide.date ?? null },
          to: slide.kind === "antenne" ? "/membre/reseau" : "/membre/piliers",
          matrixKey: "annonceGouvernance",
          prefKey: "community",
        }),
      );
    }
  });

  return items;
}

function memberFeed(platform, stored) {
  const prefs = loadSettings();
  const wantsKind = (item) => {
    if (!platform.notificationsEnabled) return false;
    if (item.matrixKey && platform.notificationMatrix[item.matrixKey]?.membres === false) return false;
    if (!prefs.notificationsEnabled) return false;
    if (item.prefKey) {
      const channels = prefs.notifications[item.prefKey];
      if (channels && !Object.values(channels).some(Boolean)) return false;
    }
    return true;
  };

  const decisions = stored.items
    .filter((item) => item.audience === "membre" && isMine(item))
    .map((item) => ({
      ...item,
      at: item.createdAt,
      group: "requests",
      to: decisionLink(item.type),
    }));

  return [...memberDerived(platform).filter(wantsKind), ...decisions];
}

function decisionLink(type) {
  switch (type) {
    case "deleteAccount":
      return "/membre/parametres";
    case "reward":
      return "/membre/coins";
    case "tontineNext":
      return "/membre/tontine";
    default:
      return "/membre/dashboard";
  }
}

// ----------------------------------------------------------------------
// Fil ADMIN
function adminDerived(platform) {
  const items = [];
  const today = dayjs().startOf("day");
  const wants = (key) => platform.notificationMatrix[key]?.admins !== false;

  // Nouveaux membres en attente de validation (Gestion des membres).
  if (wants("nouveauMembre")) {
    Object.values(initialMembersByLevel)
      .flat()
      .filter((member) => member.status === "attente")
      .forEach((member) => {
        items.push(
          make("admin", "adminNouveauMembre", `membre-${member.id}`, dayjs(member.joinedAt).add(9, "hour"), "system", {
            params: { name: member.name, city: member.city, country: member.country },
            to: "/admin/membres",
          }),
        );
      });
  }

  // Cotisations du mois, par niveau (qui a payé, qui est en retard).
  Object.keys(initialMembersByLevel).forEach((levelKey) => {
    const group = getTontineGroup(levelKey);
    if (group.length === 0) return;
    const paid = group.filter((member) => member.status === "paid").length;
    const unpaidNames = group.filter((member) => member.status !== "paid").map((member) => member.name);
    if (wants("cotisationRecue")) {
      items.push(
        make("admin", "adminCotisations", `cotis-${levelKey}`, today.add(7, "hour"), "system", {
          params: { levelKey, paid, total: group.length },
          to: "/admin/finance",
        }),
      );
    }
    if (wants("rappelEcheance") && unpaidNames.length > 0) {
      items.push(
        make("admin", "adminRetards", `retards-${levelKey}`, today.add(8, "hour"), "system", {
          params: { levelKey, count: unpaidNames.length, names: unpaidNames.slice(0, 3) },
          to: "/admin/finance",
        }),
      );
    }
    if (wants("tourAttribue") && !isCycleComplete(levelKey)) {
      const tour = getCurrentTour(levelKey);
      if (tour) {
        items.push(
          make("admin", "adminTour", `tour-${levelKey}`, today.subtract(1, "day").add(18, "hour"), "system", {
            params: { levelKey, tour: tour.tour, name: tour.memberName },
            to: "/admin/finance",
          }),
        );
      }
    }
  });

  return items;
}

function adminFeed(platform, stored) {
  const requests = stored.items
    .filter((item) => item.audience === "admin")
    .map((item) => ({ ...item, at: item.createdAt, group: "requests" }));
  const derived = platform.notificationsEnabled ? adminDerived(platform) : [];
  return [...requests, ...derived];
}

// ----------------------------------------------------------------------
// Hook : le fil d'un espace ("membre" | "admin"), trié du plus récent au
// plus ancien, avec l'état lu / non lu, et les actions pour le changer.
// "unreadCount" compte les non lues ET, côté admin, les demandes encore à
// traiter (une demande reste "à faire" tant qu'on ne l'a pas validée ou
// refusée, même si on l'a déjà ouverte).
export function useNotifications(space) {
  const platform = usePlatformSettings();
  const stored = useNotificationState();

  const feed = space === "admin" ? adminFeed(platform, stored) : memberFeed(platform, stored);
  const items = feed
    .map((item) => ({ ...item, read: isRead(item, stored) }))
    .sort((a, b) => b.at - a.at);

  const pending = items.filter((item) => item.kind === "request" && item.status === "pending").length;
  const unreadCount = items.filter((item) => !item.read || (item.kind === "request" && item.status === "pending")).length;

  return {
    items,
    unreadCount,
    pendingCount: pending,
    markRead: (id) => markRead(space, id),
    markAllRead: () => markAllRead(space, items.filter((item) => !item.read).map((item) => item.id)),
  };
}

// Pour le calcul hors composant (tests, scripts).
export { getPlatformSettings };
