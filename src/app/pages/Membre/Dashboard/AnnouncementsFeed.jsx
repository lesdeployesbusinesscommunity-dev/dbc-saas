// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MegaphoneIcon } from "@heroicons/react/24/solid";

// Local Imports
import { AnnouncementFeedCard } from "app/pages/Annonces/AnnouncementFeedCard";
import { useMyAnnouncements } from "app/pages/Annonces/useMyAnnouncements";

// ----------------------------------------------------------------------

// Nombre d'annonces montrées avant "Voir les autres".
const SHOWN = 3;

// Le fil d'actualité de l'accueil membre : les annonces que l'administration
// ou un leader d'antenne ont adressées à ce membre (à tous, à son niveau, à son
// groupe de tontine, à son antenne, ou à lui seul), les plus récentes en
// premier. La section est toujours là : sans annonce, elle le dit, pour que le
// membre sache où elles apparaîtront. Les mêmes annonces arrivent dans ses
// notifications (voir Notifications/feeds.js).
export function AnnouncementsFeed() {
  const { t } = useTranslation();
  const { items, unreadCount, markRead } = useMyAnnouncements();
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState(null);

  const visible = showAll ? items : items.slice(0, SHOWN);

  return (
    <section aria-labelledby="announcements-feed" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="announcements-feed" className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <MegaphoneIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
          {t("announcements.feed.title")}
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#EE7115] px-2 py-0.5 text-[11px] font-bold leading-none text-white">
              {t("announcements.feed.unread", { count: unreadCount })}
            </span>
          )}
        </h2>
        {items.length > SHOWN && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="text-xs font-semibold text-[#EE7115] hover:underline"
          >
            {showAll ? t("announcements.feed.showLess") : t("announcements.feed.showAll", { count: items.length - SHOWN })}
          </button>
        )}
      </div>

      {items.length === 0 && (
        <p className="mt-3 rounded-2xl bg-white px-4 py-5 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          {t("announcements.feed.empty")}
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {visible.map(({ announcement, read }) => (
          <li key={announcement.id}>
            <AnnouncementFeedCard
              announcement={announcement}
              read={read}
              expanded={openId === announcement.id}
              onToggle={() => {
                setOpenId((current) => (current === announcement.id ? null : announcement.id));
                if (!read) markRead(announcement);
              }}
              onRead={() => markRead(announcement)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
