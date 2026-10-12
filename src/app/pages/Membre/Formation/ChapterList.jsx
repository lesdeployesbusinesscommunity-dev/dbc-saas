// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  FilmIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Une leçon est une vidéo, un support PDF ou un quiz (voir mockData.js) :
// une petite icône à droite de chaque ligne dit laquelle.
const TYPE_ICONS = { video: FilmIcon, pdf: DocumentTextIcon, quiz: ClipboardDocumentCheckIcon };

// Le contenu de la formation : les chapitres (repliables) et leurs leçons.
// Chaque leçon montre où le membre en est — terminée (coche verte), en
// cours de lecture (lecteur orange), pas encore vue (cercle vide) — et un
// clic dessus la lance. Le chapitre de la leçon en cours est toujours
// ouvert (y compris quand la lecture enchaîne sur le chapitre suivant).
function TypeBadge({ type }) {
  const { t } = useTranslation();
  const Icon = TYPE_ICONS[type] ?? FilmIcon;
  return (
    <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gray-400">
      <Icon aria-hidden="true" className="size-3.5" />
      {t(`membre.formation.course.type.${type}`)}
    </span>
  );
}

export function ChapterList({ course, progress, currentLessonId, onSelect }) {
  const { t } = useTranslation();
  const currentChapterId = course.chapters.find((chapter) =>
    chapter.lessons.some((lesson) => lesson.id === currentLessonId),
  )?.id;
  const [openIds, setOpenIds] = useState(() => new Set(currentChapterId ? [currentChapterId] : []));

  useEffect(() => {
    if (!currentChapterId) return;
    setOpenIds((prev) => (prev.has(currentChapterId) ? prev : new Set(prev).add(currentChapterId)));
  }, [currentChapterId]);

  const toggle = (chapterId) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      {course.chapters.map((chapter) => {
        const done = chapter.lessons.filter((lesson) => progress.watchedIds.has(lesson.id)).length;
        const isOpen = openIds.has(chapter.id);
        const complete = done === chapter.lessons.length && chapter.lessons.length > 0;

        return (
          <div key={chapter.id} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(chapter.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{chapter.title}</span>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                  complete ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
                )}
              >
                {t("membre.formation.course.chapterCount", { done, total: chapter.lessons.length })}
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className={clsx("size-4 shrink-0 text-gray-400 transition-transform", isOpen && "rotate-180")}
              />
            </button>

            {isOpen && (
              <ul className="border-t border-gray-100 py-1">
                {chapter.lessons.map((lesson) => {
                  const watched = progress.watchedIds.has(lesson.id);
                  const current = lesson.id === currentLessonId;
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        aria-current={current ? "true" : undefined}
                        onClick={() => onSelect(lesson.id)}
                        className={clsx(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          current ? "bg-[#EE7115]/[0.08] font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        {watched ? (
                          <CheckCircleIcon aria-label={t("membre.formation.course.lessonWatched")} className="size-5 shrink-0 text-green-500" />
                        ) : current ? (
                          <PlayCircleIcon aria-label={t("membre.formation.course.lessonCurrent")} className="size-5 shrink-0 text-[#EE7115]" />
                        ) : (
                          <span aria-hidden="true" className="size-5 shrink-0 rounded-full border-2 border-gray-300" />
                        )}
                        <span className="min-w-0 flex-1">{lesson.title}</span>
                        <TypeBadge type={lesson.type} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
