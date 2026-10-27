// Import Dependencies
import { useMemo } from "react";

// Local Imports
import { currentMember } from "app/pages/Membre/currentMember";
import { isRead, markRead, useNotificationState } from "app/pages/Notifications/notificationsStore";
import { isForMe } from "./audience";
import { isActive, useAnnouncements } from "./announcementsStore";
import { useSeedAnnouncements } from "./seedAnnouncements";

// ----------------------------------------------------------------------

// L'identifiant sous lequel l'annonce figure dans les notifications du membre
// (voir Notifications/feeds.js) : le même sert à retenir qu'elle est lue, donc
// l'ouvrir dans le fil la marque lue dans les notifications, et l'inverse.
export const noticeId = (announcement) => `membre-annonce-${announcement.id}`;

// Les annonces affichées au membre connecté : celles qui le visent et ne sont
// pas expirées, les plus récentes en premier, avec leur état lu / non lu.
export function useMyAnnouncements() {
  useSeedAnnouncements();
  const items = useAnnouncements();
  const stored = useNotificationState();

  return useMemo(() => {
    const mine = items
      .filter((announcement) => isActive(announcement) && isForMe(announcement, currentMember))
      .map((announcement) => ({
        announcement,
        read: isRead({ audience: "membre", id: noticeId(announcement) }, stored),
      }))
      .sort((a, b) => b.announcement.createdAt - a.announcement.createdAt);
    return {
      items: mine,
      unreadCount: mine.filter((entry) => !entry.read).length,
      markRead: (announcement) => markRead("membre", noticeId(announcement)),
    };
  }, [items, stored]);
}
