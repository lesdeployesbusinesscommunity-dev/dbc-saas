// Import Dependencies
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { PlusIcon, ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { levelKeyFromCode } from "../Membres/viewModel";
import { AdminTopBar } from "../components/AdminTopBar";
import { LevelFilter } from "./LevelFilter";
import { TrainingCard } from "./TrainingCard";
import { TrainingDetailsModal } from "./TrainingDetailsModal";
import { AddTrainingModal } from "./AddTrainingModal";
import { normalizeSearchText } from "../searchUtils";
import { listerFormations } from "api/formations";
import { listerNiveaux } from "api/adhesion";
import { listerPiliers } from "api/programmes";

// ----------------------------------------------------------------------

// Page "Gestion des formations" (/admin/formation) : le vrai catalogue
// (GET /formations) — une carte par formation, organisées par niveau requis
// (filtrable avec la rangée d'onglets, ou "Tous les niveaux"). Cliquer une
// carte ouvre sa fiche détaillée avec les vrais modules/leçons du LMS déjà
// codé (GET /formations/:id — voir TrainingDetailsModal.jsx). Plus simple
// que l'ancienne maquette (pas de formateur/date/durée/avancement/objectifs
// narratifs, qui n'ont pas d'équivalent côté backend) : voir mémoire
// "project_frontend_backend_ecart_admin".
export default function Formation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [piliers, setPiliers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [activeKey, setActiveKey] = useState("all");
  // Recherche pilotée depuis l'en-tête partagé (voir AdminTopBar) : filtre
  // les cartes déjà retenues par l'onglet de niveau.
  const [search, setSearch] = useState("");
  const [viewingId, setViewingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const charger = useCallback(async () => {
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      const [formationsData, niveauxData, piliersData] = await Promise.all([
        listerFormations(),
        listerNiveaux(),
        listerPiliers(),
      ]);
      setFormations(formationsData);
      setNiveaux(niveauxData);
      setPiliers(piliersData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // "Niveau requis" (requiredLevelId, id numérique du niveau) -> "level"
  // Simulateur/data.js (icône/couleurs), pour rester cohérent avec le
  // reste de l'admin. Même écart snake_case/camelCase que Gestion des
  // membres — voir levelKeyFromCode.
  const levelByNiveauId = useMemo(() => {
    const map = new Map();
    for (const niveau of niveaux) {
      const level = levels.find((candidate) => candidate.key === levelKeyFromCode(niveau.code));
      if (level) map.set(niveau.id, level);
    }
    return map;
  }, [niveaux]);

  const pillarNameByCode = useMemo(
    () => new Map(piliers.map((pilier) => [pilier.code, pilier.name])),
    [piliers],
  );

  // Arrivée depuis le carrousel "Formations" du Dashboard (voir
  // Dashboard/RightPanel/TrainingsCarousel.jsx) : la carte cliquée passe
  // l'id de sa formation via l'état de navigation, on ouvre alors
  // directement sa fiche détaillée au lieu de laisser l'admin la
  // rechercher dans la grille. L'état est nettoyé aussitôt après pour ne
  // pas rouvrir la même fiche si l'admin revient sur cette page plus tard.
  useEffect(() => {
    if (status !== "ready") return;
    const openTrainingId = location.state?.openTrainingId;
    if (!openTrainingId) return;
    if (formations.some((formation) => formation.id === openTrainingId)) {
      setViewingId(openTrainingId);
    }
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, location.state]);

  const cards = useMemo(() => {
    const byLevel =
      activeKey === "all"
        ? formations
        : formations.filter((formation) => levelByNiveauId.get(formation.requiredLevelId)?.key === activeKey);

    // normalizeSearchText tolère accents/casse/tirets des deux côtés (voir
    // searchUtils.js).
    const query = normalizeSearchText(search);
    if (!query) return byLevel;
    return byLevel.filter((formation) => normalizeSearchText(formation.name).includes(query));
  }, [formations, activeKey, search, levelByNiveauId]);

  const viewingTraining = viewingId ? formations.find((formation) => formation.id === viewingId) : null;
  const viewingLevel = viewingTraining ? levelByNiveauId.get(viewingTraining.requiredLevelId) : null;
  const viewingPillarName = viewingTraining ? pillarNameByCode.get(viewingTraining.pillarCode) : null;

  return (
    <Page title={`Admin – ${t("admin.formation.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.formation.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.formation.searchPlaceholder")}
        />

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

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger les formations pour le moment.
          </div>
        )}

        {status === "ready" &&
          (cards.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
              {search.trim()
                ? t("admin.formation.noSearchResults", { query: search.trim() })
                : t("admin.formation.empty")}
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((formation) => (
                <TrainingCard
                  key={formation.id}
                  training={formation}
                  level={levelByNiveauId.get(formation.requiredLevelId)}
                  pillarName={pillarNameByCode.get(formation.pillarCode)}
                  onClick={() => setViewingId(formation.id)}
                />
              ))}
            </div>
          ))}
      </div>

      <TrainingDetailsModal
        training={viewingTraining}
        level={viewingLevel}
        pillarName={viewingPillarName}
        open={!!viewingId}
        onClose={() => setViewingId(null)}
      />

      <AddTrainingModal
        open={showAddModal}
        niveaux={niveaux}
        piliers={piliers}
        defaultLevelId={
          activeKey !== "all" ? niveaux.find((n) => levelKeyFromCode(n.code) === activeKey)?.id : undefined
        }
        onClose={() => setShowAddModal(false)}
        onCreated={() => {
          setShowAddModal(false);
          charger();
        }}
      />
    </Page>
  );
}
