// Import Dependencies
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Une liste à puces façon "syllabus" de plateforme de formation en ligne
// reconnue (Coursera, Udemy, LinkedIn Learning...) — une icône par ligne
// plutôt qu'un simple tiret, pour rester dans le même langage visuel que
// la carte modèle fournie par l'utilisateur.
function ObjectiveList({ items, Icon, iconClassName }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
          <Icon aria-hidden="true" className={clsx("mt-0.5 size-3.5 shrink-0", iconClassName)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Fiche détaillée d'une formation, ouverte au clic sur sa carte (voir
// TrainingCard.jsx) : reprend l'esprit de la maquette "Sprint" fournie
// par l'utilisateur (un bloc d'objectifs généraux en tête, puis une
// grille de cartes — une par chapitre, chacune avec ses propres
// objectifs), adaptée au langage visuel clair déjà utilisé partout
// ailleurs dans l'admin plutôt qu'au thème sombre de la maquette. Une
// dernière carte, mise en avant en vert, résume ce que le membre saura
// faire à l'issue de la formation.
export function TrainingDetailsModal({ training, level, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  if (!training) return null;

  const formattedDate = new Date(training.startDate).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-orange-50 p-6">
            <div className="flex items-center gap-4">
              <img
                src={training.poster}
                alt=""
                aria-hidden="true"
                className="size-14 shrink-0 rounded-xl object-cover shadow-sm"
              />
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {training.name}
                </DialogTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {level && (
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-bold",
                        level.borderClass,
                        level.textClass,
                      )}
                    >
                      <level.Icon aria-hidden="true" className="size-3" />
                      {t(`simulateur.levels.${level.key}.name`)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    <AcademicCapIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                    {training.trainer}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    <CalendarDaysIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    <ClockIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                    {training.duration}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.formation.modal.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            {/* Objectifs globaux — un seul bloc, mis en avant, avant le
                détail par chapitre. */}
            <section className="rounded-2xl bg-[#52A2DF]/[0.06] p-5">
              <h3 className="text-sm font-bold text-[#52A2DF]">
                {t("admin.formation.modal.globalObjectives")}
              </h3>
              <ObjectiveList
                items={training.objectives.global}
                Icon={StarIcon}
                iconClassName="text-[#52A2DF]"
              />
            </section>

            {/* Un chapitre = une carte, avec ses propres objectifs —
                même logique de grille que la maquette de référence. */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {training.objectives.chapters.map((chapter) => (
                <section
                  key={chapter.title}
                  className="rounded-2xl border border-gray-100 p-5"
                >
                  <h3 className="text-sm font-bold text-[#EE7115]">{chapter.title}</h3>
                  <ObjectiveList
                    items={chapter.objectives}
                    Icon={StarIcon}
                    iconClassName="text-amber-400"
                  />
                </section>
              ))}
            </div>

            {/* Ce que le membre saura faire à l'issue de la formation —
                dernière carte, distincte (vert + coche) pour marquer que
                c'est l'aboutissement des chapitres précédents. */}
            <section className="mt-4 rounded-2xl bg-green-50 p-5">
              <h3 className="text-sm font-bold text-[#16A34A]">
                {t("admin.formation.modal.outcomes")}
              </h3>
              <ObjectiveList
                items={training.objectives.outcomes}
                Icon={CheckCircleIcon}
                iconClassName="text-[#16A34A]"
              />
            </section>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
