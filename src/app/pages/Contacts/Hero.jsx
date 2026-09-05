// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { useInView } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Petit hero centré, sans image (contrairement à la page d'accueil) : le
// vrai contenu de cette page, ce sont les coordonnées et le formulaire
// juste en dessous.
export function Hero() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      className="mx-auto max-w-3xl px-4 pb-8 pt-14 text-center sm:px-6 lg:px-8"
    >
      <Reveal show={isInView} delay={0} className="flex justify-center">
        <img
          src="/deco.png"
          alt=""
          aria-hidden="true"
          className="h-10 w-10"
        />
      </Reveal>
      <Reveal
        as="h1"
        show={isInView}
        delay={100}
        className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl"
      >
        {t("contacts.hero.titleLead")}{" "}
        <span className="text-[#EE7115]">
          {t("contacts.hero.titleHighlight")}
        </span>
      </Reveal>
      <Reveal
        show={isInView}
        delay={200}
        className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base"
      >
        {t("contacts.hero.subtitle")}
      </Reveal>
    </section>
  );
}
