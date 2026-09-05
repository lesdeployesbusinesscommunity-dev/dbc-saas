// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  StarIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  SparklesIcon,
  GlobeAltIcon,
  EyeIcon,
  FlagIcon,
} from "@heroicons/react/24/solid";
import { FaHandshake } from "react-icons/fa";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Les 6 valeurs fondatrices. Chaque couleur a sa classe Tailwind écrite en
// toutes lettres (pas de couleur "construite" à partir d'une variable) :
// Tailwind ne peut détecter/générer une classe que s'il la voit écrite
// telle quelle quelque part dans le fichier, sinon elle ne s'affiche pas
// (c'est exactement le bug qu'on a eu avec les boutons du hero). Le
// "key" pointe vers la clé de traduction (visiteur.about.values.<key>).
const values = [
  {
    key: "excellence",
    Icon: StarIcon,
    circleClass: "bg-[#EE7115]/[0.32]",
    textClass: "text-[#EE7115]",
    hoverBorderClass: "hover:border-[#EE7115]",
  },
  {
    key: "solidarity",
    Icon: FaHandshake,
    circleClass: "bg-[#52A2DF]/[0.32]",
    textClass: "text-[#52A2DF]",
    hoverBorderClass: "hover:border-[#52A2DF]",
  },
  {
    key: "transparency",
    Icon: MagnifyingGlassIcon,
    circleClass: "bg-[#E11D48]/[0.32]",
    textClass: "text-[#E11D48]",
    hoverBorderClass: "hover:border-[#E11D48]",
  },
  {
    key: "progressivity",
    Icon: ChartBarIcon,
    circleClass: "bg-[#16A34A]/[0.32]",
    textClass: "text-[#16A34A]",
    hoverBorderClass: "hover:border-[#16A34A]",
  },
  {
    key: "impact",
    Icon: SparklesIcon,
    circleClass: "bg-[#CA8A04]/[0.32]",
    textClass: "text-[#CA8A04]",
    hoverBorderClass: "hover:border-[#CA8A04]",
  },
  {
    key: "faith",
    Icon: GlobeAltIcon,
    circleClass: "bg-[#7C3AED]/[0.32]",
    textClass: "text-[#7C3AED]",
    hoverBorderClass: "hover:border-[#7C3AED]",
  },
];

// Une carte "valeur" : apparition en fondu + glissement en cascade (après
// le titre "Nos 6 Valeurs Fondatrices"), et au survol elle se soulève
// avec une ombre plus marquée, une bordure qui prend la couleur de la
// valeur, et son icône zoome doucement dans son cercle.
function ValueCard({ value, isInView, delay }) {
  const { t } = useTranslation();
  const transitionDelay = useStaggerDelay(isInView, delay, 800);

  return (
    <div
      className={clsx(
        "group rounded-xl border-2 border-transparent bg-white p-6 shadow-soft transition-all duration-700 ease-out",
        "hover:-translate-y-1 hover:shadow-lg",
        value.hoverBorderClass,
        isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      )}
      style={{ transitionDelay }}
    >
      <div
        className={clsx(
          "flex size-14 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-110",
          value.circleClass,
        )}
      >
        <value.Icon className={clsx("size-7", value.textClass)} />
      </div>
      <h3 className={clsx("mt-4 text-base font-bold", value.textClass)}>
        {t(`visiteur.about.values.${value.key}.title`)}
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        {t(`visiteur.about.values.${value.key}.description`)}
      </p>
    </div>
  );
}

// Section "La DBC". Ordre d'apparition, à chaque scroll (pas seulement la
// première fois) : titre "La DBC" → sous-titre → bloc Vision → bloc
// Mission → titre "Nos 6 Valeurs Fondatrices" → sous-titre → cartes en
// cascade.
export function AboutDbc() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Encart Vision / Mission, fond bleu à 32% d'opacité */}
      <div className="rounded-xl bg-[#52A2DF]/[0.32] p-6 sm:p-8">
        <Reveal as="h2" show={isInView} delay={0} className="text-lg font-bold text-gray-900">
          {t("visiteur.about.title")}
        </Reveal>
        <Reveal as="p" show={isInView} delay={150} className="text-sm text-gray-600">
          {t("visiteur.about.subtitle")}
        </Reveal>

        <Reveal show={isInView} delay={320}>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#EE7115]">
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-[#EE7115]/[0.1]"
            >
              <EyeIcon className="size-3.5" />
            </span>
            {t("visiteur.about.visionLabel")}
          </p>
          <p className="mt-1 text-sm text-gray-800">
            {t("visiteur.about.visionText")}
          </p>
        </Reveal>

        <Reveal show={isInView} delay={480}>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#EE7115]">
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-[#EE7115]/[0.1]"
            >
              <FlagIcon className="size-3.5" />
            </span>
            {t("visiteur.about.missionLabel")}
          </p>
          <p className="mt-1 text-sm text-gray-800">
            {t("visiteur.about.missionText")}
          </p>
        </Reveal>
      </div>

      {/* Grille des 6 valeurs */}
      <div className="mt-10">
        <Reveal as="h2" show={isInView} delay={650} className="text-lg font-bold text-gray-900">
          {t("visiteur.about.valuesTitle")}
        </Reveal>
        <Reveal as="p" show={isInView} delay={780} className="text-sm text-gray-500">
          {t("visiteur.about.valuesSubtitle")}
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, i) => (
            <ValueCard
              key={value.key}
              value={value}
              isInView={isInView}
              delay={950 + i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
