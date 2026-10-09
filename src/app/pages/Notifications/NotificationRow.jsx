// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { TONES, describe, formatRelative, styleFor } from "./describe";

// ----------------------------------------------------------------------

// Une notification (hors demandes de l'admin, qui ont leur propre carte, voir
// Admin/Notifications/RequestCard.jsx) : icône colorée selon le sujet, titre
// en gras tant qu'elle n'est pas lue, texte, heure relative, et un point
// orange quand elle est non lue. Un clic la marque comme lue ; si elle
// renvoie vers une page (la tontine, les Coins...), le clic y mène.
//
// "compact" : version de la cloche (sans texte long ni bordure).
export function NotificationRow({ item, onOpen, compact = false, to = item.to }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const { title, text } = describe(item, t, locale);
  const { Icon, tone } = styleFor(item);

  const content = (
    <>
      <span className={clsx("flex shrink-0 items-center justify-center rounded-full", TONES[tone], compact ? "size-9" : "size-11")}>
        <Icon aria-hidden="true" className={compact ? "size-4" : "size-5"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx("block text-sm leading-snug", item.read ? "font-semibold text-gray-700" : "font-bold text-gray-900")}>
          {title}
        </span>
        {!compact && <span className="mt-0.5 block text-sm text-gray-500">{text}</span>}
        <span className="mt-1 block text-xs text-gray-400">{formatRelative(item.at, locale)}</span>
      </span>
      {!item.read && (
        <span className="mt-1.5 flex shrink-0 items-center" title={t("notifications.unread")}>
          <span className="size-2.5 rounded-full bg-[#EE7115]" />
          <span className="sr-only">{t("notifications.unread")}</span>
        </span>
      )}
    </>
  );

  const className = clsx(
    "flex items-start gap-3 text-left transition-colors",
    compact ? "rounded-xl px-2 py-2.5 hover:bg-gray-50" : "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:ring-[#52A2DF]/40 sm:p-5",
    !item.read && !compact && "ring-[#EE7115]/25",
  );

  if (to) {
    return (
      <Link to={to} onClick={() => onOpen?.(item)} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onOpen?.(item)} className={clsx(className, "w-full")}>
      {content}
    </button>
  );
}
