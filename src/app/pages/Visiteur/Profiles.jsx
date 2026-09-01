// Import Dependencies
import clsx from "clsx";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Les 3 profils de membres proposés par la DBC.
const profiles = [
  {
    age: "18-35 ans",
    title: "Entrepreneur en Démarrage",
    level: "Niv. 1 à 3 recommandé",
    description: "Idée business, peu de capital, beaucoup d'ambition.",
  },
  {
    age: "30-50 ans",
    title: "Entrepreneur Établi",
    level: "Niv. 4 à 6 recommandé",
    description: "PME cherchant à scaler et accéder aux investisseurs.",
  },
  {
    age: "Tout âge",
    title: "Africain de la Diaspora",
    level: "Niv. 5 à 8 recommandé",
    description: "Professionnel établi à l'étranger, souhaite investir.",
  },
];

// Une carte "profil" : apparition en fondu + glissement en cascade, et au
// survol elle se soulève avec une ombre plus marquée et sa bordure passe
// du gris au bleu de la marque.
function ProfileCard({ profile, isInView, delay }) {
  const transitionDelay = useStaggerDelay(isInView, delay, 800);

  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 bg-white p-5 transition-all duration-700 ease-out",
        "hover:-translate-y-1 hover:border-[#52A2DF] hover:shadow-lg",
        isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      )}
      style={{ transitionDelay }}
    >
      <p className="text-xs text-gray-500">{profile.age}</p>
      <h3 className="mt-1 text-base font-bold text-gray-900">
        {profile.title}
      </h3>
      <p className="mt-1 text-sm font-medium text-[#52A2DF]">
        {profile.level}
      </p>
      <p className="mt-2 text-xs text-gray-500">{profile.description}</p>
    </div>
  );
}

// Section "3 Profils de Membres". Ordre d'apparition, à chaque scroll (pas
// seulement la première fois) : titre → sous-titre → cartes en cascade.
export function Profiles() {
  const [ref, isInView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="rounded-xl border-2 border-[#52A2DF]/[0.32] p-6 sm:p-8">
        <Reveal as="h2" show={isInView} delay={0} className="text-lg font-bold text-gray-900">
          3 Profils de Membres
        </Reveal>
        <Reveal as="p" show={isInView} delay={150} className="text-sm text-gray-500">
          Découvrez les différents profils
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {profiles.map((profile, i) => (
            <ProfileCard
              key={profile.title}
              profile={profile}
              isInView={isInView}
              delay={400 + i * 180}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
