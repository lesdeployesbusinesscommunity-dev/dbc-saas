// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { ArrowUpRightIcon } from "@heroicons/react/24/solid";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";
import { JoinDbcButton } from "components/shared/JoinDbcButton";

// ----------------------------------------------------------------------

// Les 3 profils de membres proposés par la DBC. Le "key" pointe vers la
// clé de traduction (visiteur.profiles.<key>).
const profiles = [
  { key: "starter" },
  { key: "established" },
  { key: "diaspora" },
];

// Une carte "profil" : apparition en fondu + glissement en cascade, et au
// survol elle se soulève avec une ombre plus marquée et sa bordure passe
// du gris au bleu de la marque.
function ProfileCard({ profileKey, isInView, delay }) {
  const { t } = useTranslation();
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
      <p className="text-xs text-gray-500">
        {t(`visiteur.profiles.${profileKey}.age`)}
      </p>
      <h3 className="mt-1 text-base font-bold text-gray-900">
        {t(`visiteur.profiles.${profileKey}.title`)}
      </h3>
      <p className="mt-1 text-sm font-medium text-[#52A2DF]">
        {t(`visiteur.profiles.${profileKey}.level`)}
      </p>
      <p className="mt-2 text-xs text-gray-500">
        {t(`visiteur.profiles.${profileKey}.description`)}
      </p>
    </div>
  );
}

// Section "3 Profils de Membres". Ordre d'apparition, à chaque scroll (pas
// seulement la première fois) : titre → sous-titre → cartes en cascade.
export function Profiles() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="relative rounded-xl border-2 border-[#52A2DF]/[0.32] p-6 sm:p-8">
        <Reveal as="h2" show={isInView} delay={0} className="text-lg font-bold text-gray-900">
          {t("visiteur.profiles.title")}
        </Reveal>
        <Reveal as="p" show={isInView} delay={150} className="text-sm text-gray-500">
          {t("visiteur.profiles.subtitle")}
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {profiles.map((profile, i) => (
            <ProfileCard
              key={profile.key}
              profileKey={profile.key}
              isInView={isInView}
              delay={400 + i * 180}
            />
          ))}
        </div>

        {/* Widget flottant, à l'extrême opposé du titre (coin bas-droit) :
            une flèche oblique qui, au survol, ouvre une bulle de "chat"
            contenant le bouton "Rejoins la DBC". */}
        <div className="group absolute -bottom-5 -right-5 z-10">
          {/* Zone de survol : englobe la bulle ET comble l'espace jusqu'à
              la flèche avec un padding (pas une margin) — un "mb-3"
              laissait un vide sans élément en dessous, donc le survol se
              coupait juste avant d'atteindre le bouton dans la bulle. */}
          <div className="pointer-events-none absolute bottom-full right-0 w-56 pb-3 opacity-0 transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100">
            <div className="origin-bottom-right scale-95 rounded-xl border border-gray-200 bg-white p-4 shadow-xl transition-transform duration-200 ease-out group-hover:scale-100">
              <p className="mb-3 text-xs text-gray-500">
                {t("visiteur.profiles.widgetPrompt")}
              </p>
              <JoinDbcButton className="block text-center" />
              {/* Petite pointe triangulaire de la bulle */}
              <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-gray-200 bg-white" />
            </div>
          </div>

          {/* Bouton flèche */}
          <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#52A2DF] bg-white text-[#52A2DF] shadow-md transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-[#52A2DF] group-hover:text-white">
            <ArrowUpRightIcon className="size-6" />
          </div>
        </div>
      </div>
    </section>
  );
}
