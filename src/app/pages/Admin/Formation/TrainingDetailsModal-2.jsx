// Import Dependencies
import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  FilmIcon,
  PlayCircleIcon,
  PlusIcon,
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

// Vidéos d'un chapitre : liste avec statut "vue"/"non vue" (mis à jour
// automatiquement à la fin de la lecture, ou à la main via le bouton
// dédié — utile pour un admin qui connaît déjà le contenu), et un petit
// formulaire pour importer une vidéo supplémentaire à la position de son
// choix dans le chapitre (voir Formation/index.jsx — handleAddVideo). La
// lecture elle-même s'ouvre dans une fenêtre dédiée, bien plus grande que
// la ligne de la liste (voir "onPlay" et le lecteur partagé rendu par
// TrainingDetailsModal) — un petit lecteur coincé dans la carte du
// chapitre était peu confortable pour visionner une vidéo en entier.
// Tant qu'il n'existe aucun endpoint d'upload, la vidéo importée reste
// locale à la session (URL.createObjectURL) — l'admin en est informé par
// un message sous le formulaire plutôt que de lui laisser croire à un
// envoi réel.
function ChapterVideos({ chapter, chapterIndex, onAddVideo, onToggleWatched, onPlay }) {
  const { t } = useTranslation();
  const videos = chapter.videos ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState(videos.length);

  const toggleWatched = (videoId) => onToggleWatched(chapterIndex, videoId);

  // "Au début" (0), puis une option "Après « <titre> »" pour chaque vidéo
  // existante — choisir la dernière revient donc à ajouter à la fin, sans
  // avoir besoin d'une option "À la fin" séparée.
  const positionOptions = [
    { value: 0, label: t("admin.formation.modal.videoPositionStart") },
    ...videos.map((video, index) => ({
      value: index + 1,
      label: t("admin.formation.modal.videoPositionAfter", { title: video.title }),
    })),
  ];

  const openAddForm = () => {
    setPosition(videos.length);
    setShowAdd(true);
  };

  const closeAddForm = () => {
    setShowAdd(false);
    setFile(null);
    setTitle("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) return;
    onAddVideo(chapterIndex, position, {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim() || file.name,
      url: URL.createObjectURL(file),
      watched: false,
    });
    closeAddForm();
  };

  return (
    <div className="mt-4">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
        <FilmIcon aria-hidden="true" className="size-3.5" />
        {t("admin.formation.modal.videosSection")}
      </h4>

      {videos.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {videos.map((video) => (
            <li
              key={video.id}
              className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50/60"
            >
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  onClick={() => onPlay(chapterIndex, video.id)}
                  aria-label={t("admin.formation.modal.playVideo")}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#52A2DF] hover:bg-white"
                >
                  <PlayCircleIcon aria-hidden="true" className="size-6" />
                </button>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
                  {video.title}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWatched(video.id)}
                  className={clsx(
                    "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-colors",
                    video.watched
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                  )}
                >
                  <CheckCircleIcon aria-hidden="true" className="size-3" />
                  {t(
                    video.watched
                      ? "admin.formation.modal.watched"
                      : "admin.formation.modal.notWatched",
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-gray-400">{t("admin.formation.modal.noVideos")}</p>
      )}

      {showAdd ? (
        <form
          onSubmit={handleSubmit}
          className="mt-2 space-y-2 rounded-xl border border-dashed border-gray-200 p-3"
        >
          <input
            type="file"
            accept="video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-xs text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-[#52A2DF]/[0.1] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-[#52A2DF]"
          />
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("admin.formation.modal.videoTitlePlaceholder")}
            className="block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#52A2DF]"
          />
          {positionOptions.length > 1 && (
            <select
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              className="block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#52A2DF]"
            >
              {positionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-gray-400">
            {t("admin.formation.modal.videoSessionOnlyHint")}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeAddForm}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("admin.formation.modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={!file}
              className="rounded-lg bg-[#52A2DF] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("admin.formation.modal.confirmAddVideo")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openAddForm}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#52A2DF] hover:underline"
        >
          <PlusIcon aria-hidden="true" className="size-3.5" />
          {t("admin.formation.modal.addVideo")}
        </button>
      )}
    </div>
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
export function TrainingDetailsModal({
  training,
  level,
  open,
  onClose,
  onAddVideo,
  onToggleWatched,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  // Vidéo actuellement ouverte dans le grand lecteur (voir plus bas) :
  // seuls les identifiants sont gardés en état, la vidéo elle-même est
  // relue à chaque rendu depuis "training" (prop toujours à jour, voir
  // Formation/index.jsx) — pour que, par exemple, le badge "vue" du
  // lecteur reste juste si l'admin le bascule pendant la lecture.
  const [playing, setPlaying] = useState(null); // { chapterIndex, videoId } | null

  if (!training) return null;

  const formattedDate = new Date(training.startDate).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const playingVideo = playing
    ? (training.objectives.chapters[playing.chapterIndex]?.videos ?? []).find(
        (video) => video.id === playing.videoId,
      ) ?? null
    : null;

  const handlePlay = (chapterIndex, videoId) => setPlaying({ chapterIndex, videoId });

  const handlePlayingEnded = () => {
    if (playing && playingVideo && !playingVideo.watched) {
      onToggleWatched(playing.chapterIndex, playingVideo.id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
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
              {training.objectives.chapters.map((chapter, chapterIndex) => (
                <section
                  key={chapter.title}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-bold text-[#EE7115]">{chapter.title}</h3>
                  <ObjectiveList
                    items={chapter.objectives}
                    Icon={StarIcon}
                    iconClassName="text-amber-400"
                  />
                  <ChapterVideos
                    chapter={chapter}
                    chapterIndex={chapterIndex}
                    onAddVideo={onAddVideo}
                    onToggleWatched={onToggleWatched}
                    onPlay={handlePlay}
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

      {/* Lecteur vidéo, dans sa propre fenêtre par-dessus la fiche —
          plutôt qu'un petit lecteur coincé dans la carte du chapitre, peu
          confortable pour regarder une vidéo en entier. z-[60] pour
          passer au-dessus du Dialog principal (z-50) ci-dessus. */}
      <Dialog open={!!playingVideo} onClose={() => setPlaying(null)} className="relative z-[60]">
        <div aria-hidden="true" className="fixed inset-0 bg-black/70" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-xl">
            {playingVideo && (
              <>
                <div className="flex items-center justify-between gap-4 p-4">
                  <DialogTitle className="truncate text-sm font-bold text-white">
                    {playingVideo.title}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={() => setPlaying(null)}
                    aria-label={t("admin.formation.modal.close")}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    <XMarkIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
                <video
                  key={playingVideo.id}
                  src={playingVideo.url}
                  controls
                  autoPlay
                  className="aspect-video w-full bg-black"
                  onEnded={handlePlayingEnded}
                />
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </Dialog>
  );
}
