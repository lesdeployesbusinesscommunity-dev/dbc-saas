// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";
import { JoinDbcButton } from "components/shared/JoinDbcButton";

// ----------------------------------------------------------------------

// Les 4 piliers de la DBC. "image" doit exister dans le dossier public.
// title/description viennent des traductions ("apropos.pillars.items.<key>")
// et sont ajoutés à chaque objet au moment du rendu (voir Pillars() plus
// bas), puisque le tableau lui-même est défini hors composant et n'a donc
// pas accès à useTranslation(). imagePosition : point de recadrage propre
// à chaque photo — le sujet (flèche, pièces, immeubles...) n'est pas
// toujours au même endroit dans le cadre. "object-bottom" garde le bas de
// la photo (rogne le ciel vide en haut), "object-top" fait l'inverse,
// "object-center" ne privilégie aucun des deux. "Icon" remplace l'emoji
// d'origine par une vraie icône (même logique que les "6 valeurs" de la
// page d'accueil).
const pillars = [
  {
    key: "financer",
    Icon: CurrencyDollarIcon,
    image: "/finance 1.jpg",
    imagePosition: "object-center",
  },
  {
    key: "former",
    Icon: AcademicCapIcon,
    image: "/former 2.jpg",
    imagePosition: "object-bottom",
  },
  {
    key: "reseauter",
    Icon: UserGroupIcon,
    image: "/resauter 3.jpg",
    imagePosition: "object-center",
  },
  {
    key: "investir",
    Icon: ArrowTrendingUpIcon,
    image: "/investir 4.jpg",
    imagePosition: "object-bottom",
  },
];

// Une carte "pilier" : photo en haut, puis emoji + titre + description.
// Apparition en fondu + glissement en cascade, et au survol elle se
// soulève avec une ombre plus marquée et sa bordure passe au bleu.
function PillarCard({ pillar, isInView, delay }) {
  const transitionDelay = useStaggerDelay(isInView, delay, 800);

  return (
    // "group relative z-0 hover:z-30" : le survol applique aussi
    // "hover:-translate-y-1" (un transform), et un transform actif crée
    // un nouveau contexte d'empilement CSS. Sans z-index explicite ici,
    // la carte survolée (avec son popover qui déborde) pouvait se
    // retrouver peinte SOUS la carte suivante de la grille (qui vient
    // après dans le DOM). "hover:z-30" fait passer toute la carte
    // au-dessus de ses voisines pendant le survol.
    <div
      className={clsx(
        "group relative z-0 rounded-xl border border-[#52A2DF]/[0.32] bg-white transition-all duration-700 ease-out hover:z-30",
        "hover:-translate-y-1 hover:border-[#52A2DF] hover:shadow-lg",
        isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      )}
      style={{ transitionDelay }}
    >
      <div className="overflow-hidden rounded-xl">
        {/* Léger dégradé bleu marine en bas de la photo (mix-blend-multiply) :
            les 4 photos viennent de sources différentes et n'ont pas le
            même rendu de couleurs — ce voile unifie leur ambiance sans
            les rendre méconnaissables. */}
        <div className="relative">
          <img
            src={pillar.image}
            alt={pillar.title}
            className={clsx(
              "h-52 w-full object-cover sm:h-60",
              pillar.imagePosition,
            )}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B2540]/[0.45] via-[#0B2540]/[0.05] to-transparent mix-blend-multiply"
          />
        </div>
        <div className="p-5">
          <p className="flex items-center gap-2 text-base font-bold text-gray-900">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]"
            >
              <pillar.Icon className="size-4" />
            </span>
            {pillar.title}
          </p>
          <p className="mt-2 text-sm text-gray-600">{pillar.description}</p>
        </div>
      </div>

      {/* Popover au survol : reprend le même titre/texte que la carte,
          mais avec l'image complète (object-contain = rien n'est coupé),
          sur un fond dégradé pour que ça reste soigné même si l'image ne
          remplit pas tout le cadre. pointer-events-none/auto : invisible
          et inerte tant qu'on ne survole pas, pour ne pas gêner le
          survol des cartes voisines. */}
      <div
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-0 z-30 origin-top -translate-y-1 scale-95 overflow-hidden rounded-2xl",
          "bg-white opacity-0 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] ring-1 ring-black/5",
          "transition-all duration-300 ease-out",
          "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100",
        )}
      >
        <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={pillar.image}
            alt={pillar.title}
            className="max-h-80 w-full object-contain"
          />
        </div>
        <div className="border-t-2 border-[#52A2DF] p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]"
            >
              <pillar.Icon className="size-4" />
            </span>
            {pillar.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {pillar.description}
          </p>
          <JoinDbcButton className="mt-4 inline-block" />
        </div>
      </div>
    </div>
  );
}

// Section "Nos 4 piliers". Ordre d'apparition, à chaque scroll : titre →
// cartes en cascade.
export function Pillars() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <Reveal
        as="h2"
        show={isInView}
        delay={0}
        className="text-center text-2xl font-extrabold text-gray-900"
      >
        {t("apropos.pillars.titleLead")}{" "}
        <span className="text-[#EE7115]">
          {t("apropos.pillars.titleHighlight")}
        </span>{" "}
        {t("apropos.pillars.titleTail")}
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {pillars.map((pillar, i) => (
          <PillarCard
            key={pillar.key}
            pillar={{
              ...pillar,
              title: t(`apropos.pillars.items.${pillar.key}.title`),
              description: t(
                `apropos.pillars.items.${pillar.key}.description`,
              ),
            }}
            isInView={isInView}
            delay={200 + i * 180}
          />
        ))}
      </div>
    </section>
  );
}
