// Import Dependencies
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { VideoCameraSlashIcon } from "@heroicons/react/24/solid";

// Local Imports
import { markLessonWatched, saveLessonPosition } from "./progressStore";

// ----------------------------------------------------------------------

// Les vidéos ne sont PAS téléchargeables : elles se regardent uniquement
// dans la plateforme. Le lecteur n'offre donc ni bouton "télécharger" (
// controlsList="nodownload"), ni menu clic droit "Enregistrer la vidéo
// sous", ni lecture à distance / en fenêtre flottante. ATTENTION : ce n'est
// qu'une barrière d'interface — tant que la vidéo est un fichier servi tel
// quel (comme ce fichier de démonstration), quelqu'un de déterminé peut
// encore retrouver son adresse dans les outils du navigateur. Une vraie
// protection se fait côté serveur : diffusion en flux (HLS/DASH) avec des
// liens signés à durée limitée, jamais de lien direct vers le fichier.
//
// Lecteur d'une leçon. C'est lui qui fait monter le pourcentage : une
// leçon est comptée comme TERMINÉE dès que 90 % de la vidéo ont été lus
// (ou à la fin) — voir progressStore.js : "markLessonWatched". Il retient
// aussi où le membre s'est arrêté (toutes les ~3 secondes) pour reprendre
// au même endroit à son retour, et prévient la page quand la vidéo se
// termine ("onEnded") pour enchaîner sur la leçon suivante.
//
// "key={lesson.id}" côté appelant : changer de leçon recrée le lecteur
// (sinon la vidéo précédente continuerait dans le même élément).
const WATCHED_THRESHOLD = 0.9;
const SAVE_EVERY_SECONDS = 3;

export function VideoPlayer({ course, lesson, startAt, autoPlay, onEnded }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const lastSavedRef = useRef(0);
  const resumeAtRef = useRef(startAt);

  if (!lesson.url) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white/70">
        <VideoCameraSlashIcon aria-hidden="true" className="size-10" />
        <p className="text-sm font-medium">{t("membre.formation.course.noVideo")}</p>
      </div>
    );
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const resumeAt = resumeAtRef.current;
    if (video && resumeAt > 0 && resumeAt < video.duration - 3) video.currentTime = resumeAt;
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (video.currentTime / video.duration >= WATCHED_THRESHOLD) {
      markLessonWatched(course, lesson.id);
    }
    if (Math.abs(video.currentTime - lastSavedRef.current) >= SAVE_EVERY_SECONDS) {
      lastSavedRef.current = video.currentTime;
      saveLessonPosition(course, lesson.id, video.currentTime);
    }
  };

  const handleEnded = () => {
    markLessonWatched(course, lesson.id);
    saveLessonPosition(course, lesson.id, 0);
    onEnded?.();
  };

  return (
    <video
      ref={videoRef}
      src={lesson.url}
      poster={course.poster}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      disableRemotePlayback
      onContextMenu={(event) => event.preventDefault()}
      playsInline
      preload="metadata"
      autoPlay={autoPlay}
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      aria-label={lesson.title}
      className="aspect-video w-full rounded-2xl bg-black"
    />
  );
}
