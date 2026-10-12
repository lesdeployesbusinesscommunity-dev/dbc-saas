// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  PlayCircleIcon,
  RectangleStackIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { obtenirFormation } from "api/formations";

// ----------------------------------------------------------------------

// Fiche détaillée d'une formation, ouverte au clic sur sa carte (voir
// TrainingCard.jsx) : les vrais modules et leçons du LMS (GET
// /formations/:id, module 7 — remplace le contenu narratif inventé
// (objectifs/chapitres/formateur) qu'affichait l'ancienne maquette, voir
// mémoire "project_frontend_backend_ecart_admin"). Chargée à l'ouverture
// plutôt qu'avec le catalogue : potentiellement volumineux, et inutile
// tant que l'admin n'a pas cliqué une formation précise.
export function TrainingDetailsModal({ training, level, pillarName, open, onClose }) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error

  useEffect(() => {
    if (!open || !training) {
      setDetail(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    obtenirFormation(training.id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [open, training]);

  if (!training) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-orange-50 p-6">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">{training.name}</DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 shadow-sm">
                  {training.code}
                </span>
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
                {pillarName && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    {pillarName}
                  </span>
                )}
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
            {status === "loading" && (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                Impossible de charger le contenu de cette formation.
              </div>
            )}

            {status === "ready" && detail.modules.length === 0 && (
              <p className="rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
                {t("admin.formation.modal.noModules")}
              </p>
            )}

            {status === "ready" && detail.modules.length > 0 && (
              <div className="space-y-4">
                {detail.modules.map((module, index) => (
                  <section key={module.id} className="rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <RectangleStackIcon aria-hidden="true" className="size-4 text-[#52A2DF]" />
                        {index + 1}. {module.title}
                      </h3>
                      {module.hasQuiz && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                          <CheckBadgeIcon aria-hidden="true" className="size-3.5" />
                          {t("admin.formation.modal.hasQuiz")}
                        </span>
                      )}
                    </div>

                    {module.lessons.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {module.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600"
                          >
                            <PlayCircleIcon aria-hidden="true" className="size-4 shrink-0 text-gray-400" />
                            {lesson.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">{t("admin.formation.modal.noLessons")}</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
