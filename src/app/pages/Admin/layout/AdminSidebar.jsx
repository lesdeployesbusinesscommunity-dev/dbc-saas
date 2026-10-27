// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { useNotifications } from "app/pages/Notifications/feeds";
import { useRegistrations } from "../Inscriptions/registrationsStore";
import { SidebarNav } from "components/shared/SidebarNav";
import { adminNavEntries, adminSettingsItem } from "../adminNav";

// ----------------------------------------------------------------------

// Pastille de la ligne "Notifications" : demandes à traiter + non lues.
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

// Pastille de la ligne "Demandes d'inscription" : les nouvelles demandes qui
// attendent encore d'être attribuées à un leader.
function NewRequestsBadge() {
  const { t } = useTranslation();
  const count = useRegistrations().filter((item) => item.status === "nouvelle").length;
  if (count === 0) return null;
  return (
    <span
      aria-label={t("admin.inscriptions.navBadge", { count })}
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE7115] px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Pastille d'une page du menu : non lues (Notifications), nouvelles demandes
// (Inscriptions).
function renderBadge(item) {
  if (item.key === "notifications") return <UnreadBadge space="admin" />;
  if (item.key === "inscriptions") return <NewRequestsBadge />;
  return null;
}

// Barre latérale de l'espace admin : logo + nom du site en haut, menu de
// navigation au centre, "Paramètres" toujours affiché en bas (séparé du
// reste par "mt-auto"). Visible à partir de "lg" ; sur petit écran, la
// priorité a été donnée à la fidélité de la maquette (desktop) — un mode
// mobile dédié (sidebar en tiroir) pourra être ajouté dans un second temps.
//
// Le liseré dégradé orange → or tout en haut, et le trait doré sous le
// bloc logo, sont la touche d'identité : discrets, en une seule teinte
// continue plutôt qu'un motif à motifs multiples (un vrai motif textile a
// besoin de plus d'espace pour se lire correctement — réservé à une
// bannière plus large, voir PatternStrip.jsx, plutôt qu'à une bordure de
// quelques pixels de haut).
export function AdminSidebar() {
  const { unreadCount } = useNotifications("admin");
  const newRequests = useRegistrations().filter((item) => item.status === "nouvelle").length;
  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#EE7115] via-dbc-gold to-[#EE7115]" />

      <div className="flex flex-1 flex-col px-5 py-6">
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
          entries={adminNavEntries}
          storageKey="dbc-admin-nav-v1"
          renderBadge={renderBadge}
          badgeCounts={{ notifications: unreadCount, inscriptions: newRequests }}
          className="mt-8 flex-1 overflow-y-auto"
        />

        <div className="mt-auto pt-4">
          <SidebarNav entries={[adminSettingsItem]} storageKey="dbc-admin-nav-settings-v1" />
        </div>
      </div>
    </aside>
  );
}
