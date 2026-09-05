// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  BanknotesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Les 4 mécanismes qui différencient la DBC d'une simple communauté.
// title/description viennent des traductions ("apropos.ecosystem.items.<key>"),
// ajoutés au rendu (voir Ecosystem() plus bas).
const mechanisms = [
  { key: "tontine", Icon: BanknotesIcon },
  { key: "parrainage", Icon: UserGroupIcon },
  { key: "formation", Icon: AcademicCapIcon },
  { key: "gamification", Icon: TrophyIcon },
];

// Carte mécanisme : bordure orange, titre bleu. Le survol soulève
// légèrement la carte (comme les cartes piliers) — useStaggerDelay
// annule le délai de la cascade une fois apparue, pour que ce survol
// reste réactif au lieu d'hériter du délai d'entrée.
function MechanismCard({ item, isInView, delay }) {
  const transitionDelay = useStaggerDelay(isInView, delay, 700);

  return (
    <div
      className={clsx(
        "rounded-xl border border-[#EE7115]/[0.4] bg-white p-6 shadow-sm transition-all duration-700 ease-out",
        "hover:-translate-y-1 hover:shadow-md",
        isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
      )}
      style={{ transitionDelay }}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
        <item.Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-3 font-bold text-[#52A2DF]">{item.title}</p>
      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
    </div>
  );
}

// Section "Un écosystème, pas seulement une communauté" — bandeau teinté
// orange (10%) pour rythmer la page, avec les 4 mécanismes en cartes sur
// une seule ligne à partir des grands écrans.
export function Ecosystem() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#EE7115]/[0.1] py-14"
    >
      {/* Filigrane "afr" (empreinte Afrique) en fond, très discret : un
          simple fil visuel qui relie ce bandeau à la section panafricaine
          plus bas, sans ajouter une nouvelle image ni charger la page. */}
      <img
        src="/afr.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-auto max-w-none translate-x-1/4 opacity-[0.07] mix-blend-multiply sm:opacity-[0.08]"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal
          as="h2"
          show={isInView}
          delay={0}
          className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl"
        >
          {t("apropos.ecosystem.titleLead")}{" "}
          <span className="text-[#EE7115]">
            {t("apropos.ecosystem.titleHighlight")}
          </span>
          {t("apropos.ecosystem.titleTail")}
        </Reveal>

        <Reveal
          show={isInView}
          delay={120}
          className="mt-2 text-center text-sm text-gray-600"
        >
          {t("apropos.ecosystem.subtitle")}
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mechanisms.map((item, i) => (
            <MechanismCard
              key={item.key}
              item={{
                ...item,
                title: t(`apropos.ecosystem.items.${item.key}.title`),
                description: t(
                  `apropos.ecosystem.items.${item.key}.description`,
                ),
              }}
              isInView={isInView}
              delay={200 + i * 120}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
