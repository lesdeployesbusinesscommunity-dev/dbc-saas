// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  MegaphoneIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { ConfirmRequestPopover } from "../components/ConfirmRequestPopover";
import { NEWS_INTERVAL_MS } from "./newsData";

// ----------------------------------------------------------------------

// Carrousel d'actualités du bandeau d'accueil du membre (à la place de
// l'ancienne illustration "Afrique") : nouvelles formations, rencontres de
// la DBC (date + lieu), nouvelle antenne, niveau à solliciter, annonces. Il
// défile tout seul (voir NEWS_INTERVAL_MS pour la vitesse), comme sur les
// grands sites : les diapositives GLISSENT latéralement (dans le sens du
// geste ou de la flèche), et l'indicateur de la diapositive en cours est une
// barre qui se remplit pendant le temps d'affichage, façon "stories". C'est
// cette barre qui sert de minuteur (voir "ProgressDot") : quand elle est
// pleine, on passe à la suivante.
//
// Il est conçu pour avoir l'air de SORTIR du bandeau blanc plutôt que d'être
// une carte posée dessus : pas de bordure ni de coins arrondis propres (le
// bandeau les fournit), la photo touche les bords du bandeau, et son bord
// côté message de bienvenue se fond dans le blanc par un masque dégradé
// (voir "fadeMask" : vers la gauche sur grand écran, vers le haut quand le
// carrousel passe sous le message). Les photos et le texte sont donc deux
// couches séparées : le masque ne doit estomper que les photos, jamais le
// texte, dont la colonne commence après la zone estompée.
//
// Pour rester agréable à utiliser, le défilement AUTOMATIQUE s'arrête :
// - quand la souris est sur le carrousel, ou que le clavier y a le focus ;
// - tant que la fenêtre de confirmation d'un bouton "Solliciter" / "Je
//   participe" est ouverte (le temps de la lire sans que la diapositive
//   change dessous) ;
// - sur demande, avec le bouton pause (indispensable pour l'accessibilité :
//   un contenu qui bouge seul doit pouvoir être arrêté) ;
// - dès le départ si l'appareil demande moins d'animations
//   (prefers-reduced-motion), qui supprime aussi le glissement.
// Une pause en cours de route GÈLE la barre de progression, et la reprise
// repart de là où elle s'était arrêtée (au lieu de recommencer à zéro).
// Les flèches, les points, les flèches du clavier et le balayage au doigt
// changent de diapositive à la main, et relancent le décompte.

const SWIPE_MIN_PX = 40;

// Le carrousel passe à droite du message à partir de 1800 px de large (voir
// WelcomeBanner.jsx) : les variantes "min-[1800px]:" ci-dessous suivent ce
// seuil. Classes Tailwind écrites en toutes lettres (jamais construites par
// gabarit) : pour le changer, le changer partout dans les deux fichiers.

// Masque dégradé des photos : transparent côté blanc du bandeau, opaque
// ensuite. Les deux écritures (standard + -webkit-) pour tous les
// navigateurs.
const fadeMask = [
  "[mask-image:linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.45)_20%,black_46%)]",
  "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.45)_20%,black_46%)]",
  "min-[1800px]:[mask-image:linear-gradient(to_right,transparent_0%,rgb(0_0_0/0.45)_22%,black_48%)]",
  "min-[1800px]:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,rgb(0_0_0/0.45)_22%,black_48%)]",
].join(" ");

// Glissement d'une diapositive : "transform" pour le mouvement, "opacity" +
// "visibility" pour que celle qui sort reste visible pendant qu'elle part,
// puis disparaisse, et que celle qui arrive soit visible dès le début.
const slideMove =
  "transition-[transform,opacity,visibility] duration-500 ease-in-out motion-reduce:transition-none";

// Image-clé du remplissage de l'indicateur (voir ProgressDot).
const progressKeyframes =
  "@keyframes dbc-news-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}";

// Position d'une diapositive par rapport à celle affichée : 0 = affichée,
// -1 = la précédente (rangée à gauche), +1 = la suivante (rangée à droite),
// calculée en boucle (après la dernière vient la première). Les autres
// restent rangées du côté le plus proche, invisibles : un saut par les
// points glisse donc par le chemin le plus court.
function slidePosition(slideIndex, index, count) {
  let delta = (((slideIndex - index) % count) + count) % count;
  if (delta > count / 2) delta -= count;
  return Math.max(-1, Math.min(1, delta));
}

// Classes Tailwind écrites en toutes lettres (jamais construites par
// gabarit) — même règle que Simulateur/data.js.
const kindStyles = {
  event: { Icon: CalendarDaysIcon, iconClass: "text-[#F59E4B]" },
  formation: { Icon: AcademicCapIcon, iconClass: "text-[#7DBBE9]" },
  antenne: { Icon: BuildingOffice2Icon, iconClass: "text-[#4ADE80]" },
  niveau: { Icon: ArrowTrendingUpIcon, iconClass: "text-[#A78BFA]" },
  general: { Icon: MegaphoneIcon, iconClass: "text-[#FACC15]" },
};

const ctaClass =
  "inline-flex items-center rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const controlClass =
  "flex size-8 items-center justify-center rounded-full bg-gray-950/55 text-white backdrop-blur-sm transition-colors hover:bg-gray-950/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function formatDate(iso, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

// Photo d'une diapositive (couche du dessous, estompée par "fadeMask") + un
// voile sombre en bas pour que le texte blanc reste lisible.
function NewsSlideImage({ slide, position, eager }) {
  const active = position === 0;
  return (
    <div
      className={clsx(
        "absolute inset-0",
        slideMove,
        active ? "visible opacity-100" : "invisible opacity-0",
      )}
      style={{ transform: `translateX(${position * 100}%)` }}
    >
      <img
        src={slide.image}
        alt=""
        loading={eager ? "eager" : "lazy"}
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/45 to-transparent"
      />
    </div>
  );
}

function NewsSlide({ slide, position, onPopoverOpenChange }) {
  const active = position === 0;
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const base = "membre.dashboard.news";
  const { Icon, iconClass } = kindStyles[slide.kind];
  const levelName = slide.levelKey ? t(`simulateur.levels.${slide.levelKey}.name`) : "";

  let title;
  let text;
  let dateLabel = null;
  let place = null;

  if (slide.kind === "formation") {
    title = slide.title;
    text = t(`${base}.formationText`, { trainer: slide.trainer, duration: slide.duration });
    dateLabel = t(`${base}.dateStarts`, { date: formatDate(slide.date, locale) });
  } else if (slide.kind === "niveau") {
    title = t(`${base}.levelTitle`, { level: levelName });
    text = t(`${base}.levelText`, {
      cotisation: formatMoney(slide.cotisation, locale),
      cagnotte: formatMoney(slide.cagnotte, locale),
    });
  } else {
    title = t(`${base}.items.${slide.id}.title`);
    text = t(`${base}.items.${slide.id}.text`);
    if (slide.date) {
      dateLabel =
        slide.kind === "antenne"
          ? t(`${base}.dateOpens`, { date: formatDate(slide.date, locale) })
          : formatDate(slide.date, locale);
    }
    if (slide.hasPlace) place = t(`${base}.items.${slide.id}.place`);
  }

  const { cta } = slide;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-hidden={!active}
      className={clsx(
        "absolute inset-0",
        slideMove,
        active ? "visible opacity-100" : "invisible opacity-0",
      )}
      style={{ transform: `translateX(${position * 100}%)` }}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-5 pb-10 pl-6 sm:pl-8 min-[1800px]:pl-[15rem]">
        <span className="inline-flex w-fit max-w-[calc(100%-7.5rem)] items-center gap-1.5 rounded-full bg-gray-950/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Icon aria-hidden="true" className={clsx("size-3.5 shrink-0", iconClass)} />
          <span className="truncate">
            {t(`${base}.kind.${slide.kind}`)}
            {slide.kind === "formation" && levelName ? (
              <span className="font-medium text-white/75"> · {levelName}</span>
            ) : null}
          </span>
        </span>

        <div className="min-w-0 pr-1">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white sm:text-xl">
            {title}
          </h3>

          {(dateLabel || place) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/90 sm:text-sm">
              {dateLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDaysIcon aria-hidden="true" className="size-4 shrink-0" />
                  {dateLabel}
                </span>
              )}
              {place && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon aria-hidden="true" className="size-4 shrink-0" />
                  {place}
                </span>
              )}
            </p>
          )}

          <p className="mt-1.5 line-clamp-2 text-xs text-white/80 sm:text-sm">{text}</p>

          <div className="mt-3 flex">
            {cta.type === "link" ? (
              <Link to={cta.to} tabIndex={active ? 0 : -1} className={ctaClass}>
                {t(cta.labelKey)}
              </Link>
            ) : (
              <ConfirmRequestPopover
                triggerClassName={ctaClass}
                onOpenChange={onPopoverOpenChange}
                question={t(cta.questionKey, { level: levelName })}
                request={
                  slide.kind === "event"
                    ? { type: "event", eventId: slide.id, date: slide.date }
                    : { type: "level", levelKey: slide.levelKey }
                }
              >
                {t(cta.labelKey)}
              </ConfirmRequestPopover>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Indicateur d'une diapositive : un point, ou — pour celle en cours — une
// pastille allongée qui se REMPLIT pendant le temps d'affichage. C'est ce
// remplissage (animation CSS) qui sert de minuteur : à sa fin ("onDone"), on
// passe à la suivante. "paused" (survol, focus, fenêtre ouverte) fige
// l'animation là où elle en est ; sans défilement automatique ("autoplay"
// faux : pause demandée ou animations réduites), la pastille reste pleine,
// sans animation, pour repérer quand même la diapositive en cours.
function ProgressDot({ active, autoplay, paused, onDone, onSelect, label }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-current={active ? "true" : undefined}
      className="group p-1.5 focus-visible:outline-none"
    >
      <span
        className={clsx(
          "relative block h-2 overflow-hidden rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white motion-reduce:transition-none",
          active ? "w-10 bg-white/40" : "w-2 bg-white/50 group-hover:bg-white/80",
        )}
      >
        {active && (
          <span
            key={autoplay ? "run" : "still"}
            aria-hidden="true"
            className="absolute inset-0 origin-left rounded-full bg-white"
            style={
              autoplay
                ? {
                    animation: `dbc-news-progress ${NEWS_INTERVAL_MS}ms linear forwards`,
                    animationPlayState: paused ? "paused" : "running",
                  }
                : undefined
            }
            onAnimationEnd={
              autoplay
                ? (event) => {
                    if (event.animationName === "dbc-news-progress") onDone();
                  }
                : undefined
            }
          />
        )}
      </span>
    </button>
  );
}

export function NewsCarousel({ slides, className }) {
  const { t } = useTranslation();
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const touchStartX = useRef(null);
  const lastInputWasKeyboard = useRef(false);
  const sectionRef = useRef(null);

  const hold = hovered || focused || popoverOpen;

  // Défilement automatique actif : pas de minuteur ici, c'est le remplissage
  // de l'indicateur (voir ProgressDot) qui déclenche le passage à la suivante.
  const autoplay = playing && count > 1;

  const goTo = (target) => setIndex(((target % count) + count) % count);
  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  // Seul le focus CLAVIER met le défilement en pause : un clic sur une
  // flèche, ou la fenêtre "Solliciter" qui prend puis rend le focus au
  // bouton, ne doivent pas l'arrêter pour de bon. On retient donc si la
  // dernière action de l'utilisateur était une touche ou un clic/toucher
  // (":focus-visible" seul ne suffit pas : testé, Chrome le déclare vrai
  // quand le popover redonne le focus au bouton après un clic souris).
  useEffect(() => {
    const onKey = () => {
      lastInputWasKeyboard.current = true;
    };
    const onPointer = () => {
      lastInputWasKeyboard.current = false;
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, []);

  // Survol SOURIS, suivi au niveau du document plutôt qu'avec
  // onPointerEnter/Leave : quand la fenêtre "Solliciter" (affichée dans un
  // portail) se ferme sous le curseur, l'événement "leave" du carrousel
  // n'arrive jamais et le défilement resterait bloqué (testé). Au doigt, pas
  // de "survol" : il resterait collé après un appui.
  useEffect(() => {
    const onMove = (event) => {
      if (event.pointerType !== "mouse") return;
      setHovered(Boolean(sectionRef.current?.contains(event.target)));
    };
    const onLeaveWindow = () => setHovered(false);
    document.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, []);

  const handleFocus = () => {
    if (lastInputWasKeyboard.current) setFocused(true);
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_MIN_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  if (count === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label={t("membre.dashboard.news.label")}
      onPointerDown={() => setFocused(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
      className={clsx("relative overflow-hidden", className)}
    >
      <div aria-hidden="true" className={clsx("absolute inset-0", fadeMask)}>
        {slides.map((slide, slideIndex) => (
          <NewsSlideImage
            key={slide.id}
            slide={slide}
            position={slidePosition(slideIndex, index, count)}
            eager={slideIndex === 0}
          />
        ))}
      </div>

      <div aria-live={playing && !hold ? "off" : "polite"} className="absolute inset-0">
        {slides.map((slide, slideIndex) => (
          <NewsSlide
            key={slide.id}
            slide={slide}
            position={slidePosition(slideIndex, index, count)}
            onPopoverOpenChange={setPopoverOpen}
          />
        ))}
      </div>

      <div className="absolute right-4 top-4 flex gap-1.5">
        <button
          type="button"
          onClick={goPrev}
          aria-label={t("membre.dashboard.news.prev")}
          className={controlClass}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={t("membre.dashboard.news.next")}
          className={controlClass}
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={t(playing ? "membre.dashboard.news.pause" : "membre.dashboard.news.play")}
          className={controlClass}
        >
          {playing ? (
            <PauseIcon aria-hidden="true" className="size-4" />
          ) : (
            <PlayIcon aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      <div className="absolute bottom-1.5 right-4 flex items-center">
        {slides.map((slide, slideIndex) => (
          <ProgressDot
            key={slide.id}
            active={slideIndex === index}
            autoplay={autoplay}
            paused={hold}
            onDone={goNext}
            onSelect={() => goTo(slideIndex)}
            label={t("membre.dashboard.news.goTo", { n: slideIndex + 1, total: count })}
          />
        ))}
      </div>

      <style>{progressKeyframes}</style>
    </section>
  );
}
