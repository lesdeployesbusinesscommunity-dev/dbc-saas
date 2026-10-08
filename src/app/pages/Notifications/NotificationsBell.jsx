// Import Dependencies
import { CloseButton, Popover, PopoverButton, PopoverPanel, useClose } from "@headlessui/react";
import { BellIcon, CheckIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

// Local Imports
import { NotificationRow } from "./NotificationRow";
import { useNotifications } from "./feeds";

// ----------------------------------------------------------------------

const PREVIEW_COUNT = 6;

// Une ligne du panneau : un clic la marque comme lue, mène à sa page et
// referme le panneau. La demande d'un membre (côté admin) se traite sur la
// page Notifications ; les autres mènent à leur propre page.
function BellItem({ item, to, onRead }) {
  const close = useClose();
  return (
    <NotificationRow
      item={item}
      compact
      to={to}
      onOpen={() => {
        onRead(item.id);
        close();
      }}
    />
  );
}

// Cloche de l'en-tête, commune à l'espace membre et à l'espace admin
// ("space" : "membre" | "admin"). Une pastille orange indique le nombre de
// notifications non lues (et, côté admin, les demandes encore à traiter) ;
// le panneau montre les plus récentes, "Tout marquer comme lu" et un lien
// vers la page complète (/<espace>/notifications).
export function NotificationsBell({ space }) {
  const { t } = useTranslation();
  const { items, unreadCount, markRead, markAllRead } = useNotifications(space);
  const pagePath = `/${space}/notifications`;
  const label = t(`${space === "admin" ? "admin" : "membre"}.topbar.notifications`);
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Popover className="relative">
      <PopoverButton
        aria-label={unreadCount > 0 ? `${label} (${t("notifications.unreadCount", { count: unreadCount })})` : label}
        className="relative flex size-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm outline-none ring-1 ring-black/5 transition-colors hover:text-[#EE7115] focus-visible:ring-2 focus-visible:ring-[#52A2DF] data-[open]:text-[#EE7115]"
      >
        <BellIcon aria-hidden="true" className="size-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            data-testid="bell-badge"
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EE7115] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
          >
            {badge}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="z-50 w-[22rem] max-w-[92vw] rounded-2xl bg-white p-3 shadow-xl outline-none ring-1 ring-black/5 [--anchor-gap:8px]"
      >
        <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
          <p className="text-sm font-bold text-gray-900">{label}</p>
          {unreadCount > 0 && items.some((item) => !item.read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.08]"
            >
              <CheckIcon aria-hidden="true" className="size-3.5" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl bg-gray-50 px-4 py-6 text-center">
            <BellIcon aria-hidden="true" className="size-8 text-gray-300" />
            <p className="mt-2 text-xs text-gray-500">{t("notifications.emptyBell")}</p>
          </div>
        ) : (
          <ul className="max-h-[26rem] space-y-0.5 overflow-y-auto">
            {items.slice(0, PREVIEW_COUNT).map((item) => (
              <li key={item.id}>
                <BellItem
                  item={item}
                  to={item.kind === "request" ? pagePath : item.to}
                  onRead={markRead}
                />
              </li>
            ))}
          </ul>
        )}

        <CloseButton
          as={Link}
          to={pagePath}
          className="mt-2 block rounded-xl bg-gray-50 px-3 py-2.5 text-center text-sm font-semibold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.08]"
        >
          {t("notifications.seeAll")}
        </CloseButton>
      </PopoverPanel>
    </Popover>
  );
}
