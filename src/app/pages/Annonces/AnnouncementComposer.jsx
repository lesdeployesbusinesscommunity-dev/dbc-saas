// Import Dependencies
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MegaphoneIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { AnnouncementFeedCard } from "./AnnouncementFeedCard";
import { AnnouncementImagePicker } from "./AnnouncementImagePicker";
import { audienceFacts } from "./audienceDisplay";
import { publishAnnouncement } from "./announcementsStore";

// ----------------------------------------------------------------------

const TITLE_MAX = 80;
const BODY_MAX = 600;

const TYPE_ICONS = {
  all: GlobeAltIcon,
  levels: ChartBarIcon,
  groups: RectangleGroupIcon,
  antenne: MapPinIcon,
  leaders: ShieldCheckIcon,
  members: UserIcon,
};

const FIELD =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#EE7115] focus:ring-2 focus:ring-[#EE7115]/20";

const toggled = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

function CheckRow({ checked, onChange, children, hint }) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2",
        checked ? "border-[#EE7115] bg-[#EE7115]/[0.05]" : "border-gray-100 hover:bg-gray-50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 rounded border-gray-300 text-[#EE7115] focus:ring-[#EE7115]"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{children}</span>
        {hint && <span className="block truncate text-xs text-gray-400">{hint}</span>}
      </span>
    </label>
  );
}

// La fenêtre de publication d'une annonce, commune à l'administration et aux
// leaders d'antenne ("context" : voir useAudience.js, qui dit qui l'auteur peut
// viser). Trois choses : le message (titre, texte, importance, date de fin
// facultative), la cible (tous, un niveau, un groupe de tontine, une antenne,
// les leaders, ou des membres choisis un par un), puis un aperçu de ce que les
// membres verront et le nombre de personnes qui la recevront. Rien n'est publié
// avant le bouton "Publier". Le composant est monté à chaque ouverture : il
// repart toujours d'un formulaire vide.
export function AnnouncementComposer({ context, onClose, onPublished }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [importance, setImportance] = useState("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [images, setImages] = useState([]);
  const [storageFull, setStorageFull] = useState(false);

  const [type, setType] = useState(context.types[0]);
  const [levelKeys, setLevelKeys] = useState([]);
  const [groupIds, setGroupIds] = useState([]);
  const [leaderId, setLeaderId] = useState(context.antenneOptions.find((item) => item.count > 0)?.leaderId ?? context.antenneOptions[0]?.leaderId ?? "");
  const [allLeaders, setAllLeaders] = useState(true);
  const [leaderIds, setLeaderIds] = useState([]);
  const [memberKeys, setMemberKeys] = useState([]);
  const [query, setQuery] = useState("");

  const form = { type, levelKeys, groupIds, leaderId, allLeaders, leaderIds, memberKeys };
  const resolved = useMemo(
    () => context.resolve({ type, levelKeys, groupIds, leaderId, all: allLeaders, leaderIds, memberKeys }),
    [context, type, levelKeys, groupIds, leaderId, allLeaders, leaderIds, memberKeys],
  );

  const today = dayjs().format("YYYY-MM-DD");
  const dateInPast = Boolean(expiresAt) && expiresAt < today;
  const canPublish = title.trim() && body.trim() && resolved.people.length > 0 && !dateInPast;

  const facts = audienceFacts(form, context, resolved);
  const preview = {
    title: title.trim() || t("announcements.composer.previewTitle"),
    body: body.trim() || t("announcements.composer.previewBody"),
    importance,
    images,
    author: context.author,
    audience: facts,
    createdAt: Date.now(),
  };

  const people = useMemo(() => {
    const wanted = normalizeSearchText(query);
    return context.people
      .filter((person) => !wanted || normalizeSearchText(`${person.name} ${person.matricule} ${person.city}`).includes(wanted))
      .slice(0, 80);
  }, [context.people, query]);

  const submit = () => {
    if (!canPublish) return;
    const id = publishAnnouncement({
      title,
      body,
      importance,
      expiresAt,
      images,
      author: context.author,
      audience: facts,
      recipients: resolved.all ? "all" : resolved.people.map((person) => person.key),
    });
    // null : le navigateur n'a plus la place de garder les images
    if (id === null) {
      setStorageFull(true);
      return;
    }
    onPublished?.(id);
  };

  const typeLabel = (key) =>
    t(`announcements.composer.types.${key === "antenne" && context.scope === "leader" ? "myAntenne" : key}.label`);
  const typeHint = (key) =>
    t(`announcements.composer.types.${key === "antenne" && context.scope === "leader" ? "myAntenne" : key}.hint`);

  const sample = resolved.people.slice(0, 3).map((person) => person.name);

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-5xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/[0.12] text-[#EE7115]">
                <MegaphoneIcon className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">{t("announcements.composer.title")}</DialogTitle>
                <p className="mt-1 text-sm text-gray-500">{t(`announcements.composer.subtitle.${context.scope}`)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("announcements.composer.close")}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              {/* Le message */}
              <section aria-labelledby="ann-message" className="space-y-4">
                <h3 id="ann-message" className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t("announcements.composer.message")}
                </h3>
                <label className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-baseline justify-between gap-2">
                    {t("announcements.composer.titleLabel")}
                    <span className="text-xs font-medium text-gray-400">{title.length}/{TITLE_MAX}</span>
                  </span>
                  <input
                    type="text"
                    value={title}
                    maxLength={TITLE_MAX}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("announcements.composer.titlePlaceholder")}
                    className={FIELD}
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-baseline justify-between gap-2">
                    {t("announcements.composer.bodyLabel")}
                    <span className="text-xs font-medium text-gray-400">{body.length}/{BODY_MAX}</span>
                  </span>
                  <textarea
                    value={body}
                    maxLength={BODY_MAX}
                    rows={5}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={t("announcements.composer.bodyPlaceholder")}
                    className={clsx(FIELD, "resize-y")}
                  />
                </label>

                <AnnouncementImagePicker
                  images={images}
                  onChange={(next) => {
                    setImages(next);
                    setStorageFull(false);
                  }}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <fieldset>
                    <legend className="text-sm font-semibold text-gray-700">{t("announcements.composer.importanceLabel")}</legend>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {["normal", "important"].map((value) => (
                        <label
                          key={value}
                          className={clsx(
                            "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold",
                            importance === value
                              ? value === "important"
                                ? "border-[#EE7115] bg-[#EE7115]/[0.08] text-[#EE7115]"
                                : "border-[#52A2DF] bg-[#52A2DF]/[0.08] text-[#2f7fbd]"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50",
                          )}
                        >
                          <input
                            type="radio"
                            name="ann-importance"
                            value={value}
                            checked={importance === value}
                            onChange={() => setImportance(value)}
                            className="sr-only"
                          />
                          {value === "important" && <ExclamationTriangleIcon aria-hidden="true" className="size-4" />}
                          {t(`announcements.composer.importance.${value}`)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("announcements.composer.expiresLabel")}
                    <input
                      type="date"
                      value={expiresAt}
                      min={today}
                      onChange={(event) => setExpiresAt(event.target.value)}
                      className={FIELD}
                    />
                    <span className={clsx("mt-1 block text-xs font-normal", dateInPast ? "text-red-600" : "text-gray-400")}>
                      {dateInPast ? t("announcements.composer.dateInPast") : t("announcements.composer.expiresHint")}
                    </span>
                  </label>
                </div>
              </section>

              {/* La cible */}
              <section aria-labelledby="ann-audience" className="space-y-3">
                <h3 id="ann-audience" className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t("announcements.composer.audienceLabel")}
                </h3>
                <div role="radiogroup" aria-labelledby="ann-audience" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {context.types.map((key) => {
                    const Icon = TYPE_ICONS[key];
                    const active = type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setType(key)}
                        className={clsx(
                          "flex items-start gap-3 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#EE7115]/40",
                          active ? "border-[#EE7115] bg-[#EE7115]/[0.05]" : "border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={clsx(
                            "flex size-8 shrink-0 items-center justify-center rounded-full",
                            active ? "bg-[#EE7115] text-white" : "bg-gray-100 text-gray-500",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-gray-900">{typeLabel(key)}</span>
                          <span className="block text-xs text-gray-500">{typeHint(key)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {type === "levels" && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">{t("announcements.composer.pickLevels")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {context.levelOptions.map((option) => {
                        const active = levelKeys.includes(option.key);
                        return (
                          <button
                            key={option.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setLevelKeys((current) => toggled(current, option.key))}
                            className={clsx(
                              "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors",
                              active ? "bg-[#EE7115] text-white ring-[#EE7115]" : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-100",
                            )}
                          >
                            {t(`simulateur.levels.${option.key}.name`)} · {option.count}
                          </button>
                        );
                      })}
                      {context.levelOptions.length === 0 && (
                        <p className="text-sm text-gray-500">{t("announcements.composer.noLevels")}</p>
                      )}
                    </div>
                  </div>
                )}

                {type === "groups" && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">{t("announcements.composer.pickGroups")}</p>
                    <ul className="mt-2 grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                      {context.groupOptions.map((group) => (
                        <li key={group.id}>
                          <CheckRow
                            checked={groupIds.includes(group.id)}
                            onChange={() => setGroupIds((current) => toggled(current, group.id))}
                            hint={t("announcements.composer.groupCount", { count: group.count })}
                          >
                            {t(`simulateur.levels.${group.levelKey}.name`)} · {t("admin.tontine.group", { letter: group.letter })}
                          </CheckRow>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {type === "antenne" && context.scope === "admin" && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <label className="block text-xs font-semibold text-gray-500">
                      {t("announcements.composer.pickAntenne")}
                      <select
                        value={leaderId}
                        onChange={(event) => setLeaderId(event.target.value)}
                        className={clsx(FIELD, "mt-1.5 font-medium")}
                      >
                        {context.antenneOptions.map((option) => (
                          <option key={option.leaderId} value={option.leaderId}>
                            {option.branchName || option.country} — {option.leaderName} ({t("announcements.composer.memberCount", { count: option.count })})
                          </option>
                        ))}
                      </select>
                    </label>
                    {context.antenneOptions.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">{t("announcements.composer.noAntenne")}</p>
                    )}
                  </div>
                )}

                {type === "leaders" && (
                  <div className="space-y-2 rounded-xl bg-gray-50 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[true, false].map((value) => (
                        <label
                          key={String(value)}
                          className={clsx(
                            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                            allLeaders === value ? "border-[#EE7115] bg-white text-[#EE7115]" : "border-gray-200 bg-white text-gray-600",
                          )}
                        >
                          <input
                            type="radio"
                            name="ann-leaders"
                            checked={allLeaders === value}
                            onChange={() => setAllLeaders(value)}
                            className="size-4 border-gray-300 text-[#EE7115] focus:ring-[#EE7115]"
                          />
                          {value ? t("announcements.composer.leadersAll") : t("announcements.composer.leadersSome")}
                        </label>
                      ))}
                    </div>
                    {!allLeaders && (
                      <ul className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                        {context.leaderOptions.map((leader) => (
                          <li key={leader.leaderId}>
                            <CheckRow
                              checked={leaderIds.includes(leader.leaderId)}
                              onChange={() => setLeaderIds((current) => toggled(current, leader.leaderId))}
                              hint={leader.branchName || leader.country}
                            >
                              {leader.leaderName}
                            </CheckRow>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {type === "antenne" && context.scope === "leader" && (
                  <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                    {t("announcements.composer.myAntenneInfo", { branch: context.branchName, count: context.people.length })}
                  </p>
                )}

                {type === "members" && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <label className="relative block">
                      <span className="sr-only">{t("announcements.composer.searchMembers")}</span>
                      <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("announcements.composer.searchMembers")}
                        className={clsx(FIELD, "mt-0 pl-9")}
                      />
                    </label>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-gray-500">{t("announcements.composer.selected", { count: memberKeys.length })}</span>
                      {memberKeys.length > 0 && (
                        <button type="button" onClick={() => setMemberKeys([])} className="font-semibold text-[#EE7115] hover:underline">
                          {t("announcements.composer.clear")}
                        </button>
                      )}
                    </div>
                    <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {people.map((person) => (
                        <li key={person.key}>
                          <CheckRow
                            checked={memberKeys.includes(person.key)}
                            onChange={() => setMemberKeys((current) => toggled(current, person.key))}
                            hint={[person.matricule, person.city].filter(Boolean).join(" · ")}
                          >
                            {person.name}
                          </CheckRow>
                        </li>
                      ))}
                      {people.length === 0 && (
                        <li className="py-4 text-center text-sm text-gray-500">{t("announcements.composer.noMember")}</li>
                      )}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            {/* Aperçu et nombre de destinataires */}
            <aside className="space-y-4 lg:col-span-2">
              <div className="lg:sticky lg:top-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("announcements.composer.preview")}</h3>
                <div className="mt-2">
                  <AnnouncementFeedCard announcement={preview} preview />
                </div>

                <div
                  className={clsx(
                    "mt-4 rounded-xl px-4 py-3 text-sm",
                    resolved.people.length > 0 ? "bg-[#52A2DF]/[0.08] text-gray-700" : "bg-amber-50 text-amber-800",
                  )}
                  aria-live="polite"
                >
                  {resolved.people.length === 0 ? (
                    t("announcements.composer.recipients.none")
                  ) : (
                    <>
                      <p className="font-bold text-gray-900">
                        {resolved.all
                          ? t("announcements.composer.recipients.all", { count: resolved.people.length })
                          : t("announcements.composer.recipients.count", { count: resolved.people.length })}
                      </p>
                      {!resolved.all && sample.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {t("announcements.composer.recipients.example", { names: sample.join(", ") })}
                          {resolved.people.length > sample.length ? "…" : ""}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {storageFull && (
            <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {t("announcements.composer.storageFull")}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("announcements.composer.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canPublish}
              className="inline-flex items-center gap-2 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MegaphoneIcon aria-hidden="true" className="size-4" />
              {t("announcements.composer.publish")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
