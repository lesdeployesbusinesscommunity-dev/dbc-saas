// Import Dependencies
import { useTranslation } from "react-i18next";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { formatRelative } from "app/pages/Notifications/describe";
import { AnnouncementImages } from "./AnnouncementImages";
import { audienceForMember } from "./audienceDisplay";

// ----------------------------------------------------------------------

// Au-delà de cette longueur, le texte est replié sur 3 lignes avec "Lire la
// suite".
const LONG_TEXT = 170;

// Une annonce telle que le MEMBRE la voit dans son fil : qui l'a écrite
// (l'administration ou un leader d'antenne), quand, pourquoi il la reçoit
// ("Pour votre niveau"...), le titre et le texte. Les annonces "importantes" ont
// un liseré orange. Non lue : un point orange ; la lire (ouvrir le texte
// complet ou cocher "J'ai lu") la marque lue, aussi dans les notifications.
// "preview" : l'aperçu du formulaire de publication — mêmes couleurs, rien de
// cliquable.
export function AnnouncementFeedCard({ announcement, read = true, expanded = false, onToggle, onRead, preview = false }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const { title, body, author, importance, audience, createdAt, images } = announcement;
  const isLong = body.length > LONG_TEXT || body.split("\n").length > 3;
  const open = preview || expanded;
  const important = importance === "important";

  return (
    <article
      className={clsx(
        "relative rounded-2xl bg-white p-4 shadow-sm ring-1 sm:p-5",
        important ? "ring-[#EE7115]/30" : "ring-black/5",
        !read && !preview && "ring-[#EE7115]/40",
      )}
    >
      {important && <span aria-hidden="true" className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[#EE7115]" />}
      <div className="flex items-start gap-3">
        <Avatar name={author.name} size="size-10" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold text-gray-900">{author.name}</span>
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                author.role === "admin" ? "bg-[#EE7115]/[0.1] text-[#EE7115]" : "bg-[#52A2DF]/[0.12] text-[#2f7fbd]",
              )}
            >
              {author.role === "admin"
                ? t("announcements.author.admin")
                : t("announcements.author.leader", { branch: author.branchName })}
            </span>
            <span className="text-xs text-gray-400">{formatRelative(createdAt, locale)}</span>
          </div>

          <h3 className="mt-1.5 text-base font-bold leading-snug text-gray-900">{title}</h3>
          <p className={clsx("mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600", !open && "line-clamp-3")}>{body}</p>

          {images?.length > 0 && (
            <div className="mt-3">
              <AnnouncementImages images={images} title={title} interactive={!preview} />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {important && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EE7115]/[0.1] px-2.5 py-1 text-[11px] font-bold text-[#EE7115]">
                <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
                {t("announcements.important")}
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
              {audienceForMember(audience, t)}
            </span>
            {!preview && isLong && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#EE7115] hover:underline"
              >
                {expanded ? t("announcements.feed.less") : t("announcements.feed.more")}
                {expanded ? (
                  <ChevronUpIcon aria-hidden="true" className="size-3.5" />
                ) : (
                  <ChevronDownIcon aria-hidden="true" className="size-3.5" />
                )}
              </button>
            )}
            {!preview && !read && (
              <button
                type="button"
                onClick={onRead}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                <CheckIcon aria-hidden="true" className="size-3.5" />
                {t("announcements.feed.markRead")}
              </button>
            )}
          </div>
        </div>
        {!read && !preview && (
          <span className="mt-1.5 flex shrink-0 items-center" title={t("notifications.unread")}>
            <span className="size-2.5 rounded-full bg-[#EE7115]" />
            <span className="sr-only">{t("notifications.unread")}</span>
          </span>
        )}
      </div>
    </article>
  );
}
