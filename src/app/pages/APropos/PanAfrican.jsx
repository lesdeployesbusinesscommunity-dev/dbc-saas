// Import Dependencies
import { useTranslation } from "react-i18next";
import { GlobeAltIcon } from "@heroicons/react/24/solid";

// Local Imports
import { useInView } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Section "Présence panafricaine" : texte à gauche, une seule image (une
// empreinte digitale en forme d'Afrique, /afr.png) à droite — volontairement
// une image unique et sobre plutôt que plusieurs visuels d'Afrique, pour ne
// pas surcharger la section.
export function PanAfrican() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.2 });

  const todayList = t("apropos.panAfrican.todayList", { returnObjects: true });
  const deploymentList = t("apropos.panAfrican.deploymentList", {
    returnObjects: true,
  });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <Reveal
            as="h2"
            show={isInView}
            delay={0}
            className="text-2xl font-extrabold text-[#EE7115] sm:text-3xl"
          >
            {t("apropos.panAfrican.title")}
          </Reveal>

          <Reveal
            show={isInView}
            delay={120}
            className="mt-3 flex items-center gap-2 font-semibold text-[#52A2DF]"
          >
            <GlobeAltIcon aria-hidden="true" className="size-5" />
            {t("apropos.panAfrican.subtitle")}
          </Reveal>

          <Reveal
            show={isInView}
            delay={220}
            className="mt-6 grid grid-cols-2 gap-6 text-sm text-gray-700"
          >
            <div>
              <p className="font-bold text-gray-900">
                {t("apropos.panAfrican.todayLabel")}
              </p>
              <ul className="mt-2 space-y-1">
                {todayList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {t("apropos.panAfrican.deploymentLabel")}
              </p>
              <ul className="mt-2 space-y-1">
                {deploymentList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal show={isInView} delay={200} className="flex justify-center">
          <img
            src="/afr.png"
            alt={t("apropos.panAfrican.imageAlt")}
            className="max-h-80 w-auto object-contain"
          />
        </Reveal>
      </div>
    </section>
  );
}
