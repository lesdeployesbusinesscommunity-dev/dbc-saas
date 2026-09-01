// Import Dependencies
import clsx from "clsx";
import {
  StarIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  SparklesIcon,
  GlobeAltIcon,
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
// (c'est exactement le bug qu'on a eu avec les boutons du hero).
const values = [
  {
    title: "Excellence",
    description: "L'exigence comme standard, jamais comme exception",
    Icon: StarIcon,
    circleClass: "bg-[#EE7115]/[0.32]",
    textClass: "text-[#EE7115]",
    hoverBorderClass: "hover:border-[#EE7115]",
  },
  {
    title: "Solidarité",
    description: "La force du collectif au service de chaque membre",
    Icon: FaHandshake,
    circleClass: "bg-[#52A2DF]/[0.32]",
    textClass: "text-[#52A2DF]",
    hoverBorderClass: "hover:border-[#52A2DF]",
  },
  {
    title: "Transparence",
    description: "La force du collectif au service de chaque membre",
    Icon: MagnifyingGlassIcon,
    circleClass: "bg-[#E11D48]/[0.32]",
    textClass: "text-[#E11D48]",
    hoverBorderClass: "hover:border-[#E11D48]",
  },
  {
    title: "Progressivité",
    description: "Une croissance par paliers, accessible à tous",
    Icon: ChartBarIcon,
    circleClass: "bg-[#16A34A]/[0.32]",
    textClass: "text-[#16A34A]",
    hoverBorderClass: "hover:border-[#16A34A]",
  },
  {
    title: "Impact",
    description: "Des résultats concrets, mesurables, durables",
    Icon: SparklesIcon,
    circleClass: "bg-[#CA8A04]/[0.32]",
    textClass: "text-[#CA8A04]",
    hoverBorderClass: "hover:border-[#CA8A04]",
  },
  {
    title: "Foi en l'avenir",
    description: "La conviction profonde d'un continent qui se lève.",
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
        {value.title}
      </h3>
      <p className="mt-1 text-sm text-gray-600">{value.description}</p>
    </div>
  );
}

// Section "La DBC". Ordre d'apparition, à chaque scroll (pas seulement la
// première fois) : titre "La DBC" → sous-titre → bloc Vision → bloc
// Mission → titre "Nos 6 Valeurs Fondatrices" → sous-titre → cartes en
// cascade.
export function AboutDbc() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Encart Vision / Mission, fond bleu à 32% d'opacité */}
      <div className="rounded-xl bg-[#52A2DF]/[0.32] p-6 sm:p-8">
        <Reveal as="h2" show={isInView} delay={0} className="text-lg font-bold text-gray-900">
          La DBC
        </Reveal>
        <Reveal as="p" show={isInView} delay={150} className="text-sm text-gray-600">
          Notre vision et notre mission
        </Reveal>

        <Reveal show={isInView} delay={320}>
          <p className="mt-4 text-sm font-bold text-[#EE7115]">* Vision</p>
          <p className="mt-1 text-sm text-gray-800">
            Être le tout 1er écosystème Business panafricain créant des
            millionnaires ordinaires grâce à la force de la communauté.
          </p>
        </Reveal>

        <Reveal show={isInView} delay={480}>
          <p className="mt-4 text-sm font-bold text-[#EE7115]">* Mission</p>
          <p className="mt-1 text-sm text-gray-800">
            Équiper, connecter et financer les entrepreneurs africains de
            toutes catégories pour qu&apos;ils créent une richesse durable.
          </p>
        </Reveal>
      </div>

      {/* Grille des 6 valeurs */}
      <div className="mt-10">
        <Reveal as="h2" show={isInView} delay={650} className="text-lg font-bold text-gray-900">
          Nos 6 Valeurs Fondatrices
        </Reveal>
        <Reveal as="p" show={isInView} delay={780} className="text-sm text-gray-500">
          Découvrez les valeurs de la DBC
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, i) => (
            <ValueCard
              key={value.title}
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
