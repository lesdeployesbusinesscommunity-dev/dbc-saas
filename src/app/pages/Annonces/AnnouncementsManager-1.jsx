// Import Dependencies
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExclamationTriangleIcon, MegaphoneIcon, PlusIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { ConfirmDialog } from "app/pages/Admin/Membres/ConfirmDialog";
import { currentMember } from "app/pages/Membre/currentMember";
import { formatDate, formatRelative } from "app/pages/Notifications/describe";
import { AnnouncementComposer } from "./AnnouncementComposer";
import { AnnouncementImages } from "./AnnouncementImages";
import { audienceLabel } from "./audienceDisplay";
import { isActive, removeAnnouncement, useAnnouncements } from "./announcementsStore";
import { useSeedAnnouncements } from "./seedAnnouncements";

// ----------------------------------------------------------------------

const ADMIN_FILTERS = ["all", "mine", "leaders"];

// Une annonce publiée, vue par son auteur : à qui elle s'adresse et combien de
// personnes l'ont reçue, sa période d'affichage, et "Retirer" (elle disparaît
// alors du fil de tous ses destinataires).
function PublishedCard({ announcement, canRemove, showAuthor, onRemove }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const active = isActive(announcement);
  const { author, audience, recipients, recipientCount } = announcement;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">{announcement.title}</h3>
            {announcement.importance === "important" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EE7115]/[0.1] px-2 py-0.5 text-[11px] font-bold text-[#EE7115]">
                <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
                {t("announcements.important")}
              </span>
            )}
            {!active && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                {t("announcements.manage.expired")}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-gray-600">{announcement.body}</p>
          {announcement.images?.length > 0 && (
            <div className="mt-2.5">
              <AnnouncementImages images={announcement.images} title={announcement.title} compact />
            </div>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(announcement)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
            {t("announcements.manage.remove")}
          </button>
        )}
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t("announcements.manage.audience")}</dt>
          <UsersIcon aria-hidden="true" className="size-4 text-[#52A2DF]" />
          <dd className="font-semibold text-gray-700">
            {audienceLabel(audience, t)}
            {recipients !== "all" && (
              <span className="font-normal text-gray-400">
                {" · "}
                {t("announcements.manage.people", { count: recipientCount })}
              </span>
            )}
          </dd>
        </div>
        {showAuthor && (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("announcements.manage.author")}</dt>
            <Avatar name={author.name} size="size-5" />
            <dd className="flex flex-wrap items-center gap-1.5">
              <span>{author.name}</span>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  author.role === "admin" ? "bg-[#EE7115]/[0.1] text-[#EE7115]" : "bg-[#52A2DF]/[0.12] text-[#2f7fbd]",
                )}
              >
                {author.role === "admin"
                  ? t("announcements.manage.byAdmin")
                  : t("announcements.manage.byLeader", { branch: author.branchName })}
              </span>
            </dd>
          </div>
        )}
        <div>
          <dt className="sr-only">{t("announcements.manage.published")}</dt>
          <dd>{formatRelative(announcement.createdAt, locale)}</dd>
        </div>
        {announcement.expiresAt && (
          <div>
            <dt className="sr-only">{t("announcements.manage.until")}</dt>
            <dd>{t("announcements.manage.untilDate", { date: formatDate(announcement.expiresAt, locale) })}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

// La liste des annonces publiées et le bouton "Nouvelle annonce", communs à
// l'administration (qui voit toutes les annonces, y compris celles des
// leaders, et peut les retirer) et à l'Espace leader (qui ne voit et ne retire
// que les siennes). "context" : voir useAudience.js.
export function AnnouncementsManager({ context, query = "" }) {
  const { t } = useTranslation();
  useSeedAnnouncements();
  // les relances de cotisation (kind "reminder") sont des messages privés : elles ne figurent pas ici
  const stored = useAnnouncements();
  const all = useMemo(() => stored.filter((item) => item.kind !== "reminder"), [stored]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [filter, setFilter] = useState("all");
  const isAdmin = context.scope === "admin";

  const mineOnly = (item) => item.author.role === "leader" && item.author.matricule === currentMember.matricule;
  const scoped = useMemo(() => (isAdmin ? all : all.filter(mineOnly)), [all, isAdmin]);
  const counts = {
    all: scoped.length,
    mine: scoped.filter((item) => item.author.role === "admin").length,
    leaders: scoped.filter((item) => item.author.role === "leader").length,
  };
  const wanted = query.trim().toLowerCase();
  const visible = scoped
    .filter((item) => !isAdmin || filter === "all" || (filter === "mine" ? item.author.role === "admin" : item.author.role === "leader"))
    .filter((item) => !wanted || `${item.title} ${item.body}`.toLowerCase().includes(wanted));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <div role="tablist" aria-label={t("announcements.manage.filters")} className="flex flex-wrap gap-2">
            {ADMIN_FILTERS.map((key) => (
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
                {t(`announcements.manage.filter.${key}`)}
                <span className={clsx("rounded-full px-1.5 text-[11px] font-bold", filter === key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500")}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">{t("announcements.manage.leaderIntro", { branch: context.branchName })}</p>
        )}
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          {t("announcements.manage.new")}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/5">
          <MegaphoneIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-base font-bold text-gray-900">
            {wanted ? t("announcements.manage.noResults") : t("announcements.manage.empty")}
          </p>
          {!wanted && <p className="mt-1 max-w-sm text-sm text-gray-500">{t(`announcements.manage.emptyHint.${context.scope}`)}</p>}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((announcement) => (
            <li key={announcement.id}>
              <PublishedCard
                announcement={announcement}
                showAuthor={isAdmin}
                canRemove
                onRemove={setRemoving}
              />
            </li>
          ))}
        </ul>
      )}

      {composerOpen && (
        <AnnouncementComposer context={context} onClose={() => setComposerOpen(false)} onPublished={() => setComposerOpen(false)} />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title={t("announcements.manage.removeTitle")}
        description={t("announcements.manage.removeText", { title: removing?.title ?? "" })}
        confirmLabel={t("announcements.manage.remove")}
        tone="danger"
        onConfirm={() => {
          removeAnnouncement(removing.id);
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

