// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellSlashIcon, CheckIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { NotificationRow } from "./NotificationRow";
import { useNotifications } from "./feeds";
import { describe } from "./describe";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";

// ----------------------------------------------------------------------

// Le corps de la page Notifications, commun aux deux espaces ("space" :
// "membre" | "admin") : des filtres (Toutes, Non lues, puis un par
// catégorie présente, avec leur nombre), "Tout marquer comme lu", et la
// liste. Chaque espace peut rendre ses propres lignes avec "renderItem"
// (l'admin y affiche des cartes de demande avec Valider / Refuser / Écrire
// un mail, voir Admin/Notifications/RequestCard.jsx) ; sinon la ligne
// standard (NotificationRow) est utilisée. "query" : le texte de la
// recherche de l'en-tête, appliqué au titre et au texte des notifications.
export function NotificationsList({ space, query = "", renderItem }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const { items, unreadCount, markRead, markAllRead } = useNotifications(space);
  const [filter, setFilter] = useState("all");

  const groups = useMemo(() => {
    const order = [];
    items.forEach((item) => {
      if (!order.includes(item.group)) order.push(item.group);
    });
    return order;
  }, [items]);

  const unread = items.filter((item) => !item.read).length;
  const countFor = (key) =>
    key === "all" ? items.length : key === "unread" ? unread : items.filter((item) => item.group === key).length;

  const filters = ["all", "unread", ...groups];
  const active = filters.includes(filter) ? filter : "all";

  const visible = items
    .filter((item) => (active === "all" ? true : active === "unread" ? !item.read : item.group === active))
    .filter((item) => {
      if (!query.trim()) return true;
      const { title, text } = describe(item, t, locale);
      return searchTextIncludes(title, query) || searchTextIncludes(text, query);
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("notifications.filters")} className="flex flex-wrap gap-2">
          {filters.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => setFilter(key)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active === key ? "bg-[#EE7115] text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900",
              )}
            >
              {t(`notifications.filter.${key}`, { defaultValue: t(`notifications.groups.${key}`) })}
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[11px] font-bold",
                  active === key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500",
                )}
              >
                {countFor(key)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={unread === 0 && unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckIcon aria-hidden="true" className="size-4" />
          {t("notifications.markAllRead")}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/5">
          <BellSlashIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-base font-bold text-gray-900">
            {query.trim() ? t("notifications.noResults") : active === "unread" ? t("notifications.allRead") : t("notifications.empty")}
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {query.trim() ? t("notifications.noResultsHint") : t(`notifications.emptyHint.${space}`)}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((item) => (
            <li key={item.id}>
              {renderItem?.(item) ?? <NotificationRow item={item} onOpen={() => markRead(item.id)} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
