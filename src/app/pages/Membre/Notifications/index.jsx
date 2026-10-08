// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClockIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { NotificationsList } from "app/pages/Notifications/NotificationsList";
import { describeMine, formatRelative, styleFor, TONES } from "app/pages/Notifications/describe";
import { isMine, useNotificationState } from "app/pages/Notifications/notificationsStore";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Demandes envoyées par le membre et pas encore traitées par l'admin
// (suppression de compte, niveau, rencontre, Coins, suite de tontine) : il
// voit ainsi ce qui est "en attente de validation". Dès que l'admin décide,
// la demande disparaît d'ici et une notification de décision arrive dans la
// liste du dessous.
function PendingRequests() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const { items } = useNotificationState();
  const pending = items.filter((item) => item.kind === "request" && isMine(item) && item.status === "pending");

  if (pending.length === 0) return null;

  return (
    <section aria-labelledby="pending-requests" className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <h2 id="pending-requests" className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <ClockIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
        {t("notifications.pendingTitle")}
        <span className="rounded-full bg-[#EE7115]/[0.1] px-2 text-[11px] font-bold text-[#EE7115]">{pending.length}</span>
      </h2>
      <ul className="mt-3 divide-y divide-gray-100">
        {pending.map((item) => {
          const { Icon, tone } = styleFor(item);
          return (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <span className={clsx("flex size-9 shrink-0 items-center justify-center rounded-full", TONES[tone])}>
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800">{describeMine(item, t)}</span>
              <span className="shrink-0 text-xs text-gray-400">{formatRelative(item.createdAt, locale)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-gray-500">{t("notifications.pendingHint")}</p>
    </section>
  );
}

// Page "Notifications" de l'espace membre (/membre/notifications) : tout ce
// qui concerne le membre — DBC, formations, rencontres, nouveaux Coins,
// tontine (qui a cotisé ou pas, rappels de cotisation, tour attribué),
// décisions de l'admin sur ses demandes. Les types affichés dépendent de
// ses choix dans Paramètres > Notifications et de la configuration de la
// plateforme côté admin (voir Notifications/feeds.js).
export default function MembreNotifications() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  return (
    <Page title={`${t("membre.nav.notifications")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.notifications"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("notifications.searchPlaceholder")}
        />
        <PendingRequests />
        <div className="mt-6">
          <NotificationsList space="membre" query={query} />
        </div>
      </div>
    </Page>
  );
}
