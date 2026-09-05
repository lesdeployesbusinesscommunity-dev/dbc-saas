// Import Dependencies
import { Trans, useTranslation } from "react-i18next";

// Local Imports
import { JoinDbcButton } from "components/shared/JoinDbcButton";
import { useInView } from "hooks";
import { Reveal } from "components/shared/Reveal";

// ----------------------------------------------------------------------

// Section "Qu'est ce que la DBC ?" : texte + bouton à gauche, image
// "qui sommes nous" à droite (fichier réel : /qui somme nous.png).
// <Trans> pour le paragraphe : les <strong> sont écrits directement dans
// la valeur de traduction ("apropos.whatIsDbc.description"), ce qui
// permet de garder les mots mis en avant en gras dans les deux langues.
export function WhatIsDbc() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pt-14 pb-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        <div>
          <Reveal
            as="h1"
            show={isInView}
            delay={0}
            className="text-3xl font-extrabold text-gray-900 sm:text-4xl"
          >
            {t("apropos.whatIsDbc.titleLead")}{" "}
            <span className="text-[#EE7115] transition-all duration-300 ease-out hover:scale-105">
              {t("apropos.whatIsDbc.titleHighlight")}
            </span>
          </Reveal>

          <Reveal
            show={isInView}
            delay={200}
            className="mt-5 mb-5 max-w-lg text-sm leading-relaxed text-gray-700 sm:text-base"
          >
            <p>
              <Trans
                i18nKey="apropos.whatIsDbc.description"
                components={{ strong: <strong /> }}
              />
            </p>
          </Reveal>

          <Reveal show={isInView} delay={380}>
            <JoinDbcButton className="mt-6" />
          </Reveal>
        </div>

        <Reveal show={isInView} delay={250}>
          <img
            src="/qui somme nous.png"
            alt={t("apropos.whatIsDbc.imageAlt")}
            // max-h + object-contain : sans ça, sur un grand écran l'image
            // (plus haute que le bloc de texte) forçait toute la section à
            // être très haute, ce qui créait un grand vide avant la
            // section suivante ("Nos 4 piliers").
            className="mx-auto max-h-[420px] w-auto rounded-xl object-contain"
          />
        </Reveal>
      </div>
    </section>
  );
}
