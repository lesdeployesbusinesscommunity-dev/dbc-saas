// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { LevelFilter } from "./LevelFilter";
import { TrainingCard } from "./TrainingCard";
import { TrainingDetailsModal } from "./TrainingDetailsModal";
import { AddTrainingModal } from "./AddTrainingModal";
import { initialTrainingsByLevel } from "./mockData";

// ----------------------------------------------------------------------

// Page "Gestion des formations" (/admin/formation) : une carte par
// formation (nom, affiche, formateur, date de début, durée), organisées
// par niveau — on filtre avec la rangée d'onglets en haut (ou "Tous les
// niveaux" pour tout voir d'un coup), et chaque carte se termine par une
// barre qui mesure l'avancement de cette formation (voir TrainingCard.jsx).
// Cliquer une carte ouvre sa fiche détaillée (objectifs généraux, un
// chapitre par carte, puis ce que le membre saura faire à l'issue de la
// formation — voir TrainingDetailsModal.jsx). "Ajouter une formation"
// (voir AddTrainingModal.jsx) construit une nouvelle formation avec
// exactement cette même structure, pour qu'elle s'affiche et s'ouvre
// ensuite comme les autres. Tout est en local pour l'instant (voir
// mockData.js), comme le reste de l'admin, en attendant les vrais
// endpoints.
export default function Formation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [trainingsByLevel, setTrainingsByLevel] = useState(initialTrainingsByLevel);
  const [activeKey, setActiveKey] = useState("all");
  const [viewing, setViewing] = useState(null); // { training, level } | null
  const [showAddModal, setShowAddModal] = useState(false);

  // Arrivée depuis le carrousel "Formations" du Dashboard (voir
  // Dashboard/RightPanel/TrainingsCarousel.jsx) : la carte cliquée passe
  // l'id de sa formation via l'état de navigation, on ouvre alors
  // directement sa fiche détaillée (objectifs, chapitres...) au lieu de
  // laisser l'admin la rechercher dans la grille. L'état est nettoyé
  // aussitôt après pour ne pas rouvrir la même fiche si l'admin revient
  // sur cette page plus tard (retour navigateur, nouvelle visite...).
  useEffect(() => {
    const openTrainingId = location.state?.openTrainingId;
    if (!openTrainingId) return;

    for (const level of levels) {
      const training = (trainingsByLevel[level.key] ?? []).find(
        (candidate) => candidate.id === openTrainingId,
      );
      if (training) {
        setViewing({ training, level });
        break;
      }
    }
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const cards = useMemo(() => {
    if (activeKey === "all") {
      return levels.flatMap((level) =>
        (trainingsByLevel[level.key] ?? []).map((training) => ({ training, level })),
      );
    }
    const level = levels.find((candidate) => candidate.key === activeKey);
    return (trainingsByLevel[activeKey] ?? []).map((training) => ({ training, level }));
  }, [trainingsByLevel, activeKey]);

  const handleAddTraining = (levelKey, payload) => {
    setTrainingsByLevel((prev) => {
      const existing = prev[levelKey] ?? [];
      const newTraining = { id: `f-${Date.now()}`, ...payload };
      return { ...prev, [levelKey]: [...existing, newTraining] };
    });
    setShowAddModal(false);
  };

  return (
    <Page title={`Admin – ${t("admin.formation.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("admin.formation.title")} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <LevelFilter levels={levels} activeKey={activeKey} onSelect={setActiveKey} />

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {t("admin.formation.addButton")}
          </button>
        </div>

        {cards.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            {t("admin.formation.empty")}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map(({ training, level }) => (
              <TrainingCard
                key={training.id}
                training={training}
                level={level}
                onClick={() => setViewing({ training, level })}
              />
            ))}
          </div>
        )}
      </div>

      <TrainingDetailsModal
        training={viewing?.training}
        level={viewing?.level}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />

      <AddTrainingModal
        open={showAddModal}
        defaultLevel={activeKey !== "all" ? activeKey : undefined}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTraining}
      />
    </Page>
  );
}
