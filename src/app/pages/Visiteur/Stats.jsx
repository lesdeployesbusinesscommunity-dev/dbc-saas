// Import Dependencies
import clsx from "clsx";
import { useInView, useCountUp, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Chaque stat a une valeur numérique ("target") qu'on anime, plus un
// préfixe/suffixe pour l'affichage (ex: "+" avant, "%/an" après).
const stats = [
  {
    target: 1.6,
    decimals: 1,
    suffix: " Md",
    label: "Habitants en Afrique Subsaherienne",
  },
  { target: 60, decimals: 0, suffix: "%", label: "de la pop. africaine < 25 ans" },
  { target: 50, decimals: 0, suffix: " Md $", label: "transferts diaspora/an" },
  {
    target: 15,
    decimals: 0,
    prefix: "+",
    suffix: "%/an",
    label: "marché coaching & formation",
  },
];

// Une carte de statistique :
// - le chiffre s'anime de 0 jusqu'à sa valeur finale (useCountUp),
//   rejoué à chaque fois que la section redevient visible ;
// - la carte apparaît en fondu + glissement, en cascade, après le titre ;
// - au survol : elle se soulève, l'ombre s'accentue, la bordure devient
//   orange.
function StatCard({ stat, isInView, delay }) {
  const value = useCountUp(stat.target, { start: isInView, duration: 1800 });
  const transitionDelay = useStaggerDelay(isInView, delay, 800);
  const formatted = value.toFixed(stat.decimals ?? 0).replace(".", ",");

  return (
    <div
      className={clsx(
        "rounded-lg border-2 border-[#52A2DF]/40 p-4 transition-all duration-700 ease-out",
        "hover:-translate-y-1 hover:border-[#EE7115] hover:shadow-lg",
        isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      )}
      style={{ transitionDelay }}
    >
      <p className="text-xl font-bold text-[#EE7115] sm:text-2xl">
        {stat.prefix}
        {formatted}
        {stat.suffix}
      </p>
      <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
    </div>
  );
}

// Section "Statistiques". Ordre d'apparition, à chaque scroll (pas
// seulement la première fois) : titre → sous-titre → cartes en cascade.
export function Stats() {
  const [ref, isInView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <Reveal as="h2" show={isInView} delay={0} className="text-lg font-bold text-gray-900">
        Statistiques
      </Reveal>
      <Reveal as="p" show={isInView} delay={150} className="text-sm text-gray-500">
        Statistiques des affaires en Afrique
      </Reveal>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            stat={stat}
            isInView={isInView}
            delay={400 + i * 180}
          />
        ))}
      </div>
    </section>
  );
}
