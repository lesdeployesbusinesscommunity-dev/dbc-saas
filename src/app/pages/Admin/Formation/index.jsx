// Import Dependencies
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ExclamationCircleIcon, PlusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { LevelFilter } from "./LevelFilter";
import { TrainingCard } from "./TrainingCard";
import { TrainingDetailsModal } from "./TrainingDetailsModal";
import { AddTrainingModal } from "./AddTrainingModal";
import { creerFormation, listerFormationsAdmin, modifierFormation } from "api/formations";
import { groupByLevel, trainingFromApi, trainingToApi } from "./trainingsApi";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------

// Page "Gestion des formations" (/admin/formation) : une carte par
// formation (nom, affiche, formateur, date de début, durée), organisées
// par niveau — on filtre avec la rangée d'onglets en haut (ou "Tous les
// niveaux" pour tout voir d'un coup), et chaque carte se termine par une
// barre qui mesure l'avancement de cette formation (voir TrainingCard.jsx).
// Cliquer une carte ouvre sa fiche détaillée (objectifs généraux, un
// chapitre par carte — chacun avec ses vidéos —, puis ce que le membre
// saura faire à l'issue de la formation — voir TrainingDetailsModal.jsx).
// "Ajouter une formation" (voir AddTrainingModal.jsx) construit une
// nouvelle formation avec exactement cette même structure, pour qu'elle
// s'affiche et s'ouvre ensuite comme les autres. handleAddVideo /
// handleToggleVideoWatched ci-dessous gèrent l'import de vidéos dans un
// chapitre et leur statut "vue" — c'est ce qui fait évoluer l'avancement
// affiché sur chaque carte (voir mockData.getTrainingProgress). Les PDF
// (téléchargeables par les membres), les quiz de validation de chaque
// chapitre et le quiz de pré-requis de la formation s'ajoutent de la même
// façon depuis la fiche (handleAddDocument, handleSaveQuiz...) ; les vidéos
// ne sont, elles, jamais téléchargeables. Le catalogue vient de l'API
// (GET /formations/admin/catalogue) et chaque modification est enregistrée
// aussitôt sur le serveur (PUT /formations/:id) ; les fichiers sont
// téléversés avant d'être ajoutés (voir TrainingDetailsModal.jsx).
export default function Formation() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [trainingsByLevel, setTrainingsByLevel] = useState({});
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saveError, setSaveError] = useState("");
  // Toujours la dernière version, pour enregistrer la formation à jour.
  const trainingsRef = useRef(trainingsByLevel);
  trainingsRef.current = trainingsByLevel;

  useEffect(() => {
    listerFormationsAdmin()
      .then((trainings) => {
        setTrainingsByLevel(groupByLevel(trainings));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);
  const [activeKey, setActiveKey] = useState("all");
  // Recherche pilotée depuis l'en-tête partagé (voir AdminTopBar) : filtre
  // les cartes déjà retenues par l'onglet de niveau (ci-dessous), par nom
  // de formation OU nom du formateur — les deux filtres se cumulent plutôt
  // que de s'exclure.
  const [search, setSearch] = useState("");
  // { trainingId, levelKey } | null — on ne garde que les identifiants
  // (plutôt qu'une copie de la formation/du niveau) pour que la fiche
  // ouverte reste à jour automatiquement après l'ajout d'une vidéo (voir
  // handleAddVideo) sans avoir à la refermer/rouvrir.
  const [viewing, setViewing] = useState(null);
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
        setViewing({ trainingId: training.id, levelKey: level.key });
        break;
      }
    }
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Recalculées à chaque rendu à partir de trainingsByLevel (plutôt qu'une
  // copie figée au clic) : la fiche ouverte reflète donc immédiatement une
  // vidéo tout juste ajoutée ou marquée comme vue.
  const viewingTraining = useMemo(() => {
    if (!viewing) return null;
    return (
      (trainingsByLevel[viewing.levelKey] ?? []).find(
        (candidate) => candidate.id === viewing.trainingId,
      ) ?? null
    );
  }, [trainingsByLevel, viewing]);

  const viewingLevel = useMemo(() => {
    if (!viewing) return null;
    return levels.find((candidate) => candidate.key === viewing.levelKey) ?? null;
  }, [viewing]);

  const cards = useMemo(() => {
    const byLevel =
      activeKey === "all"
        ? levels.flatMap((level) =>
            (trainingsByLevel[level.key] ?? []).map((training) => ({ training, level })),
          )
        : (() => {
            const level = levels.find((candidate) => candidate.key === activeKey);
            return (trainingsByLevel[activeKey] ?? []).map((training) => ({ training, level }));
          })();

    // normalizeSearchText tolère accents/casse/tirets des deux côtés (voir
    // searchUtils.js) — un clavier réglé en anglais retrouve "Aïcha Konaté"
    // en tapant "aicha konate".
    const query = normalizeSearchText(search);
    if (!query) return byLevel;
    return byLevel.filter(
      ({ training }) =>
        normalizeSearchText(training.name).includes(query) ||
        normalizeSearchText(training.trainer).includes(query),
    );
  }, [trainingsByLevel, activeKey, search]);

  const handleAddTraining = async (levelKey, payload) => {
    setSaveError("");
    try {
      const saved = trainingFromApi(await creerFormation(trainingToApi(levelKey, payload)));
      setTrainingsByLevel((prev) => ({
        ...prev,
        [saved.levelKey]: [...(prev[saved.levelKey] ?? []), saved.training],
      }));
      setShowAddModal(false);
    } catch (error) {
      setSaveError(error.detail ?? t(error.message ?? "api.errors.server"));
    }
  };

  // Ajoute une vidéo importée à un chapitre, à la position choisie par
  // l'admin (voir TrainingDetailsModal.jsx) — mise à jour immutable, comme
  // handleAddTraining ci-dessus. "position" est l'index d'insertion dans le
  // tableau "videos" du chapitre (0 = au début, videos.length = à la fin).
  const handleAddVideo = (levelKey, trainingId, chapterIndex, position, video) =>
    updateChapter(levelKey, trainingId, chapterIndex, (chapter) => {
      const videos = [...(chapter.videos ?? [])];
      videos.splice(position, 0, video);
      return { ...chapter, videos };
    });

  // Bascule l'état "vue"/"non vue" d'une vidéo — appelé automatiquement à
  // la fin de sa lecture, ou manuellement via le bouton dédié (voir
  // TrainingDetailsModal.jsx). C'est ce qui fait évoluer l'avancement
  // affiché (voir mockData.getTrainingProgress).
  const handleToggleVideoWatched = (levelKey, trainingId, chapterIndex, videoId) => {
    setTrainingsByLevel((prev) => {
      const list = prev[levelKey] ?? [];
      const updatedList = list.map((training) => {
        if (training.id !== trainingId) return training;
        const chapters = training.objectives.chapters.map((chapter, index) => {
          if (index !== chapterIndex) return chapter;
          const videos = (chapter.videos ?? []).map((video) =>
            video.id === videoId ? { ...video, watched: !video.watched } : video,
          );
          return { ...chapter, videos };
        });
        return { ...training, objectives: { ...training.objectives, chapters } };
      });
      return { ...prev, [levelKey]: updatedList };
    });
  };

  // Modifie UNE formation (immutable) et l'enregistre sur le serveur — sert
  // aux vidéos, aux PDF et aux quiz. L'écran change tout de suite ; la
  // réponse du serveur (avec les identifiants des nouveaux éléments) remplace
  // ensuite la formation, en gardant les repères "vue" de l'admin. En cas
  // d'échec, la formation revient à son état précédent.
  const updateTraining = async (levelKey, trainingId, update) => {
    const previous = (trainingsRef.current[levelKey] ?? []).find((training) => training.id === trainingId);
    if (!previous) return;
    const next = update(previous);
    const replace = (training) =>
      setTrainingsByLevel((prev) => ({
        ...prev,
        [levelKey]: (prev[levelKey] ?? []).map((entry) => (entry.id === trainingId ? training : entry)),
      }));
    replace(next);
    setSaveError("");
    try {
      const saved = trainingFromApi(await modifierFormation(trainingId, trainingToApi(levelKey, next))).training;
      const watchedIds = new Set(
        (next.objectives?.chapters ?? []).flatMap((c) => (c.videos ?? []).filter((v) => v.watched).map((v) => v.id)),
      );
      saved.objectives.chapters.forEach((chapter) =>
        chapter.videos.forEach((video) => {
          video.watched = watchedIds.has(video.id);
        }),
      );
      replace(saved);
    } catch (error) {
      replace(previous);
      setSaveError(error.detail ?? t(error.message ?? "api.errors.server"));
    }
  };

  const updateChapter = (levelKey, trainingId, chapterIndex, update) =>
    updateTraining(levelKey, trainingId, (training) => ({
      ...training,
      objectives: {
        ...training.objectives,
        chapters: training.objectives.chapters.map((chapter, index) =>
          index === chapterIndex ? update(chapter) : chapter,
        ),
      },
    }));

  // Support PDF de TOUTE la formation (un seul, regroupant tous les
  // chapitres) : "coursePdf" null = aucun.
  const handleSetCoursePdf = (levelKey, trainingId, coursePdf) =>
    updateTraining(levelKey, trainingId, (training) => ({ ...training, coursePdf }));

  // Supports PDF d'un chapitre (téléchargeables par les membres).
  const handleAddDocument = (levelKey, trainingId, chapterIndex, document) =>
    updateChapter(levelKey, trainingId, chapterIndex, (chapter) => ({
      ...chapter,
      documents: [...(chapter.documents ?? []), document],
    }));

  const handleRemoveDocument = (levelKey, trainingId, chapterIndex, documentId) =>
    updateChapter(levelKey, trainingId, chapterIndex, (chapter) => ({
      ...chapter,
      documents: (chapter.documents ?? []).filter((document) => document.id !== documentId),
    }));

  // Quiz : "chapterIndex" null = le quiz de PRÉ-REQUIS de la formation (un
  // seul), sinon un quiz de VALIDATION du chapitre (ajouté, ou remplacé s'il
  // porte déjà cet id — c'est ainsi qu'une modification est enregistrée).
  const handleSaveQuiz = (levelKey, trainingId, chapterIndex, quiz) => {
    if (chapterIndex == null) {
      updateTraining(levelKey, trainingId, (training) => ({ ...training, prerequisiteQuiz: quiz }));
      return;
    }
    updateChapter(levelKey, trainingId, chapterIndex, (chapter) => {
      const quizzes = chapter.quizzes ?? [];
      return {
        ...chapter,
        quizzes: quizzes.some((existing) => existing.id === quiz.id)
          ? quizzes.map((existing) => (existing.id === quiz.id ? quiz : existing))
          : [...quizzes, quiz],
      };
    });
  };

  const handleRemoveQuiz = (levelKey, trainingId, chapterIndex, quizId) => {
    if (chapterIndex == null) {
      updateTraining(levelKey, trainingId, (training) => ({ ...training, prerequisiteQuiz: null }));
      return;
    }
    updateChapter(levelKey, trainingId, chapterIndex, (chapter) => ({
      ...chapter,
      quizzes: (chapter.quizzes ?? []).filter((quiz) => quiz.id !== quizId),
    }));
  };

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

        {saveError && (
          <p role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            {saveError}
          </p>
        )}

        {status === "loading" ? (
          <div className="mt-10 flex justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        ) : status === "error" ? (
          <p className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-10 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            {t("api.errors.server")}
          </p>
        ) : cards.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            {search.trim()
              ? t("admin.formation.noSearchResults", { query: search.trim() })
              : t("admin.formation.empty")}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map(({ training, level }) => (
              <TrainingCard
                key={training.id}
                training={training}
                level={level}
                onClick={() => setViewing({ trainingId: training.id, levelKey: level.key })}
              />
            ))}
          </div>
        )}
      </div>

      <TrainingDetailsModal
        training={viewingTraining}
        level={viewingLevel}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onAddVideo={(chapterIndex, position, video) =>
          handleAddVideo(viewing.levelKey, viewing.trainingId, chapterIndex, position, video)
        }
        onToggleWatched={(chapterIndex, videoId) =>
          handleToggleVideoWatched(viewing.levelKey, viewing.trainingId, chapterIndex, videoId)
        }
        onSetCoursePdf={(coursePdf) =>
          handleSetCoursePdf(viewing.levelKey, viewing.trainingId, coursePdf)
        }
        onAddDocument={(chapterIndex, document) =>
          handleAddDocument(viewing.levelKey, viewing.trainingId, chapterIndex, document)
        }
        onRemoveDocument={(chapterIndex, documentId) =>
          handleRemoveDocument(viewing.levelKey, viewing.trainingId, chapterIndex, documentId)
        }
        onSaveQuiz={(chapterIndex, quiz) =>
          handleSaveQuiz(viewing.levelKey, viewing.trainingId, chapterIndex, quiz)
        }
        onRemoveQuiz={(chapterIndex, quizId) =>
          handleRemoveQuiz(viewing.levelKey, viewing.trainingId, chapterIndex, quizId)
        }
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
