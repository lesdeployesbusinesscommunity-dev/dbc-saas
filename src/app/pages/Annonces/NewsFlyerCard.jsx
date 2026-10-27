// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  MapPinIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { ConfirmRequestPopover } from "app/pages/Membre/components/ConfirmRequestPopover";

// ----------------------------------------------------------------------

const KIND_ICONS = {
  event: CalendarDaysIcon,
  formation: AcademicCapIcon,
  antenne: BuildingOffice2Icon,
  niveau: ArrowTrendingUpIcon,
  general: MegaphoneIcon,
};

const BASE = "membre.dashboard.news";

const ctaClass =
  "inline-flex items-center rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EE7115]";

function formatDate(iso, locale) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

// Une actualité de la DBC sous forme de "flyer" : la même que celle qui défile
// dans le carrousel de l'accueil du membre (voir Membre/Dashboard/newsData.js),
// avec sa photo, son type, sa date et son lieu, son texte et son bouton. Elle
// est toujours signée « Administration DBC » : c'est l'administration qui
// publie ces actualités. "interactive" : côté membre, le bouton agit ("Je
// participe", "Solliciter ce niveau"...) ; côté admin, il n'y a pas de bouton.
export function NewsFlyerCard({ slide, interactive = false }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const Icon = KIND_ICONS[slide.kind] ?? MegaphoneIcon;
  const levelName = slide.levelKey ? t(`simulateur.levels.${slide.levelKey}.name`) : "";

  let title;
  let text;
  let dateLabel = null;
  let place = null;
  if (slide.kind === "formation") {
    title = slide.title;
    text = t(`${BASE}.formationText`, { trainer: slide.trainer, duration: slide.duration });
    dateLabel = t(`${BASE}.dateStarts`, { date: formatDate(slide.date, locale) });
  } else if (slide.kind === "niveau") {
    title = t(`${BASE}.levelTitle`, { level: levelName });
    text = t(`${BASE}.levelText`, {
      cotisation: formatMoney(slide.cotisation, locale),
      cagnotte: formatMoney(slide.cagnotte, locale),
    });
  } else {
    title = t(`${BASE}.items.${slide.id}.title`);
    text = t(`${BASE}.items.${slide.id}.text`);
    if (slide.date) {
      dateLabel = slide.kind === "antenne" ? t(`${BASE}.dateOpens`, { date: formatDate(slide.date, locale) }) : formatDate(slide.date, locale);
    }
    if (slide.hasPlace) place = t(`${BASE}.items.${slide.id}.place`);
  }

  const { cta } = slide;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative h-44 shrink-0 bg-gray-100">
        <img src={slide.image} alt="" loading="lazy" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gray-950/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <Icon aria-hidden="true" className="size-3.5 shrink-0 text-[#F59E4B]" />
          {t(`${BASE}.kind.${slide.kind}`)}
          {slide.kind === "formation" && levelName ? <span className="font-medium text-white/75"> · {levelName}</span> : null}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#EE7115]/[0.1] px-2 py-0.5 text-[11px] font-semibold text-[#EE7115]">
            {t("announcements.news.byAdmin")}
          </span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug text-gray-900">{title}</h3>
        {(dateLabel || place) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-600">
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon aria-hidden="true" className="size-4 shrink-0 text-[#EE7115]" />
                {dateLabel}
              </span>
            )}
            {place && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-[#EE7115]" />
                {place}
              </span>
            )}
          </p>
        )}
        <p className={clsx("mt-2 text-sm leading-relaxed text-gray-600", interactive && "flex-1")}>{text}</p>

        {interactive && cta && (
          <div className="mt-4 flex">
            {cta.type === "link" ? (
              <Link to={cta.to} className={ctaClass}>
                {t(cta.labelKey)}
              </Link>
            ) : (
              <ConfirmRequestPopover
                triggerClassName={ctaClass}
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
        )}
      </div>
    </article>
  );
}
