// Import Dependencies
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon, RectangleStackIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { levelKeyFromCode } from "app/pages/Admin/Membres/viewModel";
import { listerFormations } from "api/formations";
import { listerNiveaux } from "api/adhesion";
import { LevelSelector } from "./LevelSelector";

// ----------------------------------------------------------------------

// Formations du niveau choisi, en carrousel horizontal (flèches gauche/
// droite qui font défiler la liste) — même catalogue réel que "Gestion des
// formations" (GET /formations) plutôt qu'une copie locale, pour que le
// clic sur une carte ouvre la vraie fiche détaillée de cette formation
// (modules/leçons — voir Admin/Formation/TrainingDetailsModal.jsx) au lieu
// de simplement renvoyer vers la page Formation en général. Le sélecteur
// de niveau ici reste numérique (1-8, voir LevelSelector) comme pour les
// bénéficiaires de tontine juste au-dessus — on ne convertit vers le
// niveau requis d'une formation qu'au moment de filtrer (voir
// levelByNiveauId).
export function TrainingsCarousel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [formations, setFormations] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listerFormations(), listerNiveaux()])
      .then(([formationsData, niveauxData]) => {
        if (cancelled) return;
        setFormations(
          formationsData.map((formation) => {
            const niveau = niveauxData.find((n) => n.id === formation.requiredLevelId);
            return { ...formation, levelKey: niveau ? levelKeyFromCode(niveau.code) : undefined };
          }),
        );
      })
      .catch(() => setFormations([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    if (showAll) return formations;
    const levelKey = levels[level - 1]?.key;
    return levelKey ? formations.filter((formation) => formation.levelKey === levelKey) : [];
  }, [formations, level, showAll]);

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
                    trainer: training.code,
                  })}
                  className="w-32 shrink-0 overflow-hidden rounded-xl bg-white text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF]"
                >
                  <div className="flex h-20 w-full items-center justify-center bg-[#52A2DF]/[0.12]">
                    <RectangleStackIcon aria-hidden="true" className="size-8 text-[#52A2DF]" />
                  </div>
                  <div className="px-2 py-2">
                    <p className="truncate text-[11px] font-semibold text-gray-800">{training.name}</p>
                    <p className="truncate text-[10px] text-gray-500">{training.code}</p>
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
