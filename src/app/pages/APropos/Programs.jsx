// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Les 5 familles de programmes de la DBC. On reste sur les 2 couleurs de
// la charte (bleu/orange) en alternance plutôt qu'une couleur différente
// par programme — les "6 valeurs" de la page d'accueil restent le seul
// endroit où chaque item a sa propre couleur. title/description viennent
// des traductions ("apropos.programs.items.<key>"), ajoutés au rendu (voir
// Programs() plus bas).
const programs = [
  {
    key: "ecole",
    Icon: AcademicCapIcon,
    colorClass: "text-[#52A2DF]",
    iconWrapClass: "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
  },
  {
    key: "leadership",
    Icon: UserGroupIcon,
    colorClass: "text-[#EE7115]",
    iconWrapClass: "bg-[#EE7115]/[0.1] text-[#EE7115]",
  },
  {
    key: "digital",
    Icon: ComputerDesktopIcon,
    colorClass: "text-[#52A2DF]",
    iconWrapClass: "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
  },
  {
    key: "sales",
    Icon: ChartBarIcon,
    colorClass: "text-[#EE7115]",
    iconWrapClass: "bg-[#EE7115]/[0.1] text-[#EE7115]",
  },
  {
    key: "challenge",
    Icon: RocketLaunchIcon,
    colorClass: "text-[#52A2DF]",
    iconWrapClass: "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
  },
];

// Une ligne "programme" : icône dans un badge rond, puis titre + texte.
// La bordure de gauche prend la couleur du programme au survol
// (border-current = la couleur du texte), plutôt qu'une carte fermée —
// plus proche de ce que font les pages de programmes/cursus des sites
// reconnus (liste aérée, pas de gros blocs).
function ProgramRow({ program, isInView, delay }) {
  const transitionDelay = useStaggerDelay(isInView, delay, 700);

  return (
    <div
      className={clsx(
        "flex items-start gap-4 border-l-2 border-transparent pl-4 transition-all duration-700 ease-out hover:border-current",
        program.colorClass,
        isInView ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
      )}
      style={{ transitionDelay }}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          program.iconWrapClass,
        )}
      >
        <program.Icon className="size-5" />
      </span>
      <div>
        <p className={clsx("font-bold", program.colorClass)}>
          {program.title}
        </p>
        <p className="mt-1 text-sm text-gray-600">{program.description}</p>
      </div>
    </div>
  );
}

// Section "Les programmes de la DBC" : les 5 familles en grille sur
// toute la largeur (plus d'image à côté — elle n'apportait pas assez
// par rapport au reste de la page, désormais très structurée par
// icônes/couleurs ; autant laisser la liste respirer sur tout l'espace).
export function Programs() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal
        as="h2"
        show={isInView}
        delay={0}
        className="text-2xl font-extrabold text-gray-900 sm:text-3xl"
      >
        {t("apropos.programs.titleLead")}{" "}
        <span className="text-[#EE7115]">
          {t("apropos.programs.titleHighlight")}
        </span>{" "}
        {t("apropos.programs.titleTail")}
      </Reveal>
      <Reveal
        as="p"
        show={isInView}
        delay={100}
        className="mt-1 text-lg font-semibold text-gray-800"
      >
        {t("apropos.programs.subtitle")}
      </Reveal>
      <Reveal
        show={isInView}
        delay={180}
        className="mt-3 text-sm text-gray-600"
      >
        {t("apropos.programs.text")}
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program, i) => (
          <ProgramRow
            key={program.key}
            program={{
              ...program,
              title: t(`apropos.programs.items.${program.key}.title`),
              description: t(
                `apropos.programs.items.${program.key}.description`,
              ),
            }}
            isInView={isInView}
            delay={250 + i * 100}
          />
        ))}
      </div>
    </section>
  );
}
