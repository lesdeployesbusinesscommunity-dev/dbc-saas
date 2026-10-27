// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { useMyAnnouncements } from "app/pages/Annonces/useMyAnnouncements";
import { useNotifications } from "app/pages/Notifications/feeds";
import { summarizeDossiers, useAntenneMembers, useLeaderDossiers, useLeaderProfile } from "../Leader/leaderAccess";
import { SidebarNav } from "components/shared/SidebarNav";
import { memberNavEntries, memberSettingsItem } from "../memberNav";

// ----------------------------------------------------------------------

// Pastille de la ligne "Notifications" : nombre de non lues.
function UnreadBadge({ space }) {
  const { t } = useTranslation();
  const { unreadCount } = useNotifications(space);
  if (unreadCount === 0) return null;
  return (
    <span
      data-testid="nav-badge"
      aria-label={t("notifications.unreadCount", { count: unreadCount })}
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE7115] px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

// Pastille de la ligne "Annonces" : nombre d'annonces non lues.
function AnnouncementsBadge() {
  const { t } = useTranslation();
  const { unreadCount } = useMyAnnouncements();
  if (unreadCount === 0) return null;
  return (
    <span
      data-testid="announcements-badge"
      aria-label={t("announcements.feed.unread", { count: unreadCount })}
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE7115] px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

// Pastille de l'"Espace leader" : dossiers à traiter + membres en retard.
function LeaderBadge() {
  const { t } = useTranslation();
  const dossiers = useLeaderDossiers();
  const roster = useAntenneMembers();
  const count =
    summarizeDossiers(dossiers).open + roster.filter((member) => member.contribution.state === "late").length;
  if (count === 0) return null;
  return (
    <span
      data-testid="leader-badge"
      aria-label={t("membre.leader.badge", { count })}
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE7115] px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Pastille d'une page du menu : non lues, annonces non lues, dossiers du leader.
function renderBadge(item) {
  if (item.key === "notifications") return <UnreadBadge space="membre" />;
  if (item.key === "annonces") return <AnnouncementsBadge />;
  if (item.key === "leader") return <LeaderBadge />;
  return null;
}

// Barre latérale de l'espace membre — même structure que la sidebar
// admin (voir Admin/layout/AdminSidebar.jsx) : liseré doré en haut, logo
// + nom du site, menu de navigation, mêmes couleurs de marque. Pas
// d'entrée "Paramètres" fixée en bas pour l'instant (aucune page réglages
// membre demandée) ; à ajouter de la même façon que côté admin si besoin
// plus tard.
//
// "sticky top-0 h-screen" (plutôt que seulement "h-full" dans le flex
// parent) : le dashboard a beaucoup grandi (activités, graphe, tableau
// comparatif...) et dépasse maintenant la hauteur de l'écran, donc la
// page défile. "sticky" garde la sidebar à l'écran pendant ce défilement
// au lieu de la laisser remonter avec le reste — elle reste à sa place
// quel que soit le conteneur qui finit par défiler. "overflow-y-auto" sur
// la nav elle-même est un filet de sécurité si la liste de pages devient
// un jour trop longue pour la hauteur de l'écran.
export function MembreSidebar() {
  const leader = useLeaderProfile();
  const { unreadCount } = useNotifications("membre");
  const announcements = useMyAnnouncements().unreadCount;
  const entries = memberNavEntries(Boolean(leader));

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#EE7115] via-dbc-gold to-[#EE7115]" />

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        <div className="flex items-center gap-3 px-2">
          <img
            src="/logo-icon.jpg"
            alt="Logo DBC"
            className="h-11 w-auto shrink-0 object-contain"
          />
          <p className="text-sm font-bold leading-tight text-[#EE7115]">
            Les Déployés
            <br />
            Business Community
          </p>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-dbc-gold/60 via-dbc-gold/10 to-transparent" />

        <SidebarNav
          entries={entries}
          storageKey="dbc-member-nav-v1"
          renderBadge={renderBadge}
          badgeCounts={{ notifications: unreadCount, annonces: announcements }}
          className="mt-8 flex-1"
        />

        <div className="mt-auto pt-4">
          <SidebarNav entries={[memberSettingsItem]} storageKey="dbc-member-nav-settings-v1" />
        </div>
      </div>
    </aside>
  );
}
