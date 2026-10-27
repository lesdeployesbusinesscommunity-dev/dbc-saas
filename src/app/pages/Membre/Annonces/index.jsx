// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon, MegaphoneIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { AnnouncementFeedCard } from "app/pages/Annonces/AnnouncementFeedCard";
import { useMyAnnouncements } from "app/pages/Annonces/useMyAnnouncements";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";

// ----------------------------------------------------------------------

const FILTERS = ["all", "unread", "admin", "leader"];

// Page "Annonces" de l'espace membre (/membre/annonces) : toutes les annonces
// adressées à ce membre (à tous, à son niveau, à son groupe de tontine, à son
// antenne, ou à lui seul), les plus récentes en premier. Chacune dit QUI l'a
// publiée : l'administration de la DBC ou un leader d'antenne. Ce sont les
// mêmes annonces que celles qui défilent dans le carrousel de l'accueil et
// qui arrivent dans les notifications ; les lire ici les marque lues aux deux
// endroits (voir Annonces/useMyAnnouncements.js).
export default function MembreAnnonces() {
  const { t } = useTranslation();
  const { items, unreadCount, markRead } = useMyAnnouncements();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: unreadCount,
      admin: items.filter(({ announcement }) => announcement.author.role === "admin").length,
      leader: items.filter(({ announcement }) => announcement.author.role === "leader").length,
    }),
    [items, unreadCount],
  );

  const wanted = query.trim().toLowerCase();
  const visible = items
    .filter(({ announcement, read }) => {
      if (filter === "unread") return !read;
      if (filter === "admin" || filter === "leader") return announcement.author.role === filter;
      return true;
    })
    .filter(({ announcement }) => !wanted || `${announcement.title} ${announcement.body}`.toLowerCase().includes(wanted));

  const markAllRead = () => items.forEach(({ announcement, read }) => !read && markRead(announcement));

  return (
    <Page title={`${t("membre.nav.annonces")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.annonces"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("announcements.manage.search")}
        />

        <p className="mt-6 max-w-2xl text-sm text-gray-600">{t("announcements.page.intro")}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t("announcements.manage.filters")} className="flex flex-wrap gap-2">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  filter === key ? "bg-[#EE7115] text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900",
                )}
              >
                {t(`announcements.page.filter.${key}`)}
                <span className={clsx("rounded-full px-1.5 text-[11px] font-bold", filter === key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500")}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#EE7115] hover:underline"
            >
              <CheckIcon aria-hidden="true" className="size-4" />
              {t("announcements.page.markAllRead")}
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/5">
            <MegaphoneIcon aria-hidden="true" className="size-10 text-gray-300" />
            <p className="mt-3 text-base font-bold text-gray-900">
              {wanted || filter !== "all" ? t("announcements.manage.noResults") : t("announcements.feed.empty")}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
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
        )}
      </div>
    </Page>
  );
}
