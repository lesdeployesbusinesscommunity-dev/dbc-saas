// Import Dependencies
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { initialTrainingsByLevel } from "app/pages/Admin/Formation/mockData";
import { LevelSelector } from "./LevelSelector";

// ----------------------------------------------------------------------

// Formations en cours du niveau choisi, en carrousel horizontal (flèches
// gauche/droite qui font défiler la liste). Utilise le même catalogue que
// "Gestion des formations" (voir Admin/Formation/mockData.js) plutôt
// qu'une copie locale, pour que le clic sur une carte ouvre la vraie
// fiche détaillée de cette formation (objectifs, chapitres...) au lieu de
// simplement renvoyer vers la page Formation en général. Le sélecteur de
// niveau ici reste numérique (1-8, voir LevelSelector) comme pour les
// bénéficiaires de tontine juste au-dessus — on ne convertit vers la
// "key" de niveau (starter, batisseur...) qu'au moment de lire les
// données, avec `levels[level - 1]`.
export function TrainingsCarousel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef(null);

  const list = useMemo(() => {
    if (showAll) return Object.values(initialTrainingsByLevel).flat();
    const levelKey = levels[level - 1]?.key;
    return levelKey ? (initialTrainingsByLevel[levelKey] ?? []) : [];
  }, [level, showAll]);

  const scrollBy = (amount) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900">{t("admin.dashboard.trainings.title")}</h2>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
              className="size-3.5 rounded border-gray-300 text-[#52A2DF] focus:ring-[#52A2DF]"
            />
            {t("admin.dashboard.beneficiaries.allLevels")}
          </label>

          <LevelSelector level={level} onChange={setLevel} disabled={showAll} />
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-[#52A2DF]/[0.1] p-3">
        {list.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-gray-500">
            {t("admin.dashboard.trainings.empty")}
          </p>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {list.map((training) => (
                <button
                  key={training.id}
                  type="button"
                  onClick={() => navigate("/admin/formation", { state: { openTrainingId: training.id } })}
                  aria-label={t("admin.dashboard.trainings.viewAria", {
                    name: training.name,
                    trainer: training.trainer,
                  })}
                  className="w-32 shrink-0 overflow-hidden rounded-xl bg-white text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF]"
                >
                  <div className="relative h-20 w-full">
                    <img
                      src={training.poster}
                      alt=""
                      aria-hidden="true"
                      className="size-full object-cover"
                    />
                    <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-md bg-[#52A2DF] px-2 py-0.5 text-center text-[10px] font-semibold text-white">
                      {training.name}
                    </span>
                  </div>
                  <div className="px-2 py-2">
                    <p className="truncate text-[11px] font-semibold text-gray-800">
                      {training.trainer}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">
                      {training.duration}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => scrollBy(-140)}
                aria-label={t("admin.dashboard.trainings.prev")}
                className="flex size-6 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-[#52A2DF]"
              >
                <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(140)}
                aria-label={t("admin.dashboard.trainings.next")}
                className="flex size-6 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-[#52A2DF]"
              >
                <ChevronRightIcon aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
