// Import Dependencies
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { currentAdmin } from "app/pages/Admin/currentAdmin";
import { getAnnouncements, publishAnnouncement, removeAnnouncement } from "./announcementsStore";

// ----------------------------------------------------------------------

// Les anciennes diapositives de démonstration du carrousel de l'accueil
// (rencontre à Douala, nouvelle antenne, atelier à Yaoundé, nouveaux programmes)
// deviennent de VRAIES annonces de l'administration, adressées à tous les
// membres, avec leur flyer. Elles sont créées une seule fois par navigateur
// (le drapeau ci-dessous) : si l'administration les retire ensuite, elles ne
// reviennent pas. Le texte vient des fichiers de traduction
// ("membre.dashboard.news.items.<id>"). Une rencontre passée expire d'elle-même
// à sa date, comme n'importe quelle annonce.
const SEEDED_KEY = "dbc-announcements-seeded-v1";
const NEWS_KEY = "membre.dashboard.news";

// Du plus récent (en haut du fil) au plus ancien.
const DEMO = [
  { id: "nouveauxProgrammes", image: "/investir 4.jpg", importance: "normal" },
  { id: "atelierYaounde", image: "/investir.jpg", date: "2026-11-07", hasPlace: true, importance: "important" },
  { id: "antenneBafoussam", image: "/resauter 3.jpg", date: "2026-10-24", hasPlace: true, importance: "normal" },
  { id: "rencontreDouala", image: "/resauter.jpg", date: "2026-10-18", hasPlace: true, importance: "important" },
];

function alreadySeeded() {
  try {
    return window.localStorage.getItem(SEEDED_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeeded() {
  try {
    window.localStorage.setItem(SEEDED_KEY, "1");
  } catch {
    // sans stockage, on ne pourrait pas retenir : alreadySeeded() renvoie true
  }
}

export function seedDemoAnnouncements(t, locale) {
  // Traductions pas encore chargées (t() renvoie la clé) : on réessaiera au
  // prochain affichage, sans retenir que c'est fait.
  if (t("announcements.seed.when", { date: "x" }) === "announcements.seed.when") return;

  // Réparation : des annonces créées alors que les traductions manquaient
  // contiennent des clés brutes à la place du texte ; on les retire pour les
  // recréer proprement.
  const broken = getAnnouncements().filter((item) => item.body.includes("announcements.seed."));
  broken.forEach((item) => removeAnnouncement(item.id));

  if (alreadySeeded() && broken.length === 0) return;
  markSeeded();
  // Des annonces existent déjà (publiées par l'administration) : rien à ajouter.
  if (getAnnouncements().some((item) => item.kind !== "reminder")) return;

  const now = Date.now();
  // De la plus ancienne à la plus récente : chaque publication passe en tête de liste.
  [...DEMO].reverse().forEach((item, position) => {
    const index = DEMO.length - 1 - position;
    const lines = [t(`${NEWS_KEY}.items.${item.id}.text`)];
    if (item.date) {
      const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${item.date}T00:00:00Z`),
      );
      lines.push(t("announcements.seed.when", { date }));
    }
    if (item.hasPlace) lines.push(t("announcements.seed.where", { place: t(`${NEWS_KEY}.items.${item.id}.place`) }));
    publishAnnouncement({
      title: t(`${NEWS_KEY}.items.${item.id}.title`),
      body: lines.join("\n"),
      importance: item.importance,
      expiresAt: item.date ?? null,
      createdAt: now - index * 3600 * 1000,
      images: [item.image],
      author: { role: "admin", name: currentAdmin.name, matricule: "", branchName: "" },
      audience: { type: "all" },
      recipients: "all",
    });
  });
}

// À appeler depuis les pages qui lisent les annonces : au premier affichage dans
// ce navigateur, les annonces de démonstration sont créées.
export function useSeedAnnouncements() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    seedDemoAnnouncements(t, i18n.language?.startsWith("fr") ? "fr-FR" : "en-US");
    // une seule fois au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
