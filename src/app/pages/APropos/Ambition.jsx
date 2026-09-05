// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { useInView } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// La feuille de route 2026 → 2030, en 3 phases. "range" reste tel quel
// (des années, pas besoin de traduction) ; "label" et "items" viennent des
// traductions ("apropos.ambition.phases.<key>"), résolus au rendu (voir
// Ambition() plus bas) avec returnObjects: true pour la liste "items".
const phases = [
  { key: "lancement", Icon: RocketLaunchIcon, range: "2026-2027" },
  { key: "expansion", Icon: ArrowTrendingUpIcon, range: "2027-2028" },
  { key: "rayonnement", Icon: SparklesIcon, range: "2029-2030" },
];

// Section "Notre ambition 2026 → 2030" : même bandeau orange (10%) que
// "Un écosystème", pour créer un rythme clair/orange/clair/orange sur la
// page.
export function Ambition() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#EE7115]/[0.1] py-14"
    >
      {/* Même filigrane "afr" que la section Écosystème, positionné à
          gauche cette fois (pour ne pas répéter exactement la même
          composition) — un fil visuel discret, pas une illustration. */}
      <img
        src="/afr.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-auto max-w-none -translate-x-1/4 opacity-[0.07] mix-blend-multiply sm:opacity-[0.08]"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal
          as="h2"
          show={isInView}
          delay={0}
          className="text-2xl font-extrabold text-gray-900 sm:text-3xl"
        >
          {t("apropos.ambition.titleLead")}{" "}
          <span className="text-[#EE7115]">
            {t("apropos.ambition.titleHighlight")}
          </span>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {phases.map((phase, i) => {
            const label = t(`apropos.ambition.phases.${phase.key}.label`);
            const items = t(`apropos.ambition.phases.${phase.key}.items`, {
              returnObjects: true,
            });

            return (
              <Reveal key={phase.key} show={isInView} delay={150 + i * 150}>
                <span className="flex size-10 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
                  <phase.Icon aria-hidden="true" className="size-5" />
                </span>
                <p className="mt-3 text-lg font-bold text-gray-900">
                  <span className="text-[#52A2DF]">{phase.range}</span> :{" "}
                  {label}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
