// Import Dependencies
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { useInView, useStaggerDelay } from "hooks";
import { Reveal } from "components/shared/Reveal";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_ADDRESS,
  socialLinks,
} from "components/shared/contactInfo";

// ----------------------------------------------------------------------

// Les 4 façons de joindre la DBC. Email/téléphone/adresse (les valeurs)
// viennent de components/shared/contactInfo.js (même source que le
// footer) — ce sont des données, pas du texte à traduire. Les titres et
// le texte "réseaux" viennent en revanche des traductions
// ("contacts.info.*"), ajoutés au rendu (voir ContactInfo() plus bas).
const contactPoints = [
  {
    key: "email",
    Icon: EnvelopeIcon,
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    colorClass: "text-[#52A2DF]",
    iconWrapClass: "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
  },
  {
    key: "telephone",
    Icon: PhoneIcon,
    value: CONTACT_PHONE,
    href: CONTACT_PHONE_HREF,
    colorClass: "text-[#EE7115]",
    iconWrapClass: "bg-[#EE7115]/[0.1] text-[#EE7115]",
  },
  {
    key: "adresse",
    Icon: MapPinIcon,
    value: CONTACT_ADDRESS,
    colorClass: "text-[#52A2DF]",
    iconWrapClass: "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
  },
  {
    key: "reseaux",
    Icon: ChatBubbleLeftRightIcon,
    colorClass: "text-[#EE7115]",
    iconWrapClass: "bg-[#EE7115]/[0.1] text-[#EE7115]",
    isSocial: true,
  },
];

// key -> clé de traduction du titre de la carte ("contacts.info.<...>Title")
const titleKeys = {
  email: "emailTitle",
  telephone: "phoneTitle",
  adresse: "addressTitle",
  reseaux: "socialTitle",
};

// Carte "coordonnée" : même style que les cartes "mécanismes" de la
// section Écosystème (A propos), pour rester cohérent sur tout le site.
function ContactCard({ item, isInView, delay }) {
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
      <span
        aria-hidden="true"
        className={clsx(
          "flex size-10 items-center justify-center rounded-full",
          item.iconWrapClass,
        )}
      >
        <item.Icon className="size-5" />
      </span>
      <p className={clsx("mt-3 font-bold", item.colorClass)}>{item.title}</p>

      {item.isSocial ? (
        <>
          <p className="mt-2 text-sm text-gray-600">{item.value}</p>
          <div className="mt-3 flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.key}
                href={social.href}
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-[#EE7115]/[0.1] hover:text-[#EE7115]"
              >
                <social.Icon className="size-4" />
              </a>
            ))}
          </div>
        </>
      ) : item.href ? (
        <a
          href={item.href}
          className="mt-2 block text-sm text-gray-600 transition-colors hover:text-[#EE7115]"
        >
          {item.value}
        </a>
      ) : (
        <p className="mt-2 text-sm text-gray-600">{item.value}</p>
      )}
    </div>
  );
}

// Section "Nos coordonnées" : même bandeau orange (10%) que les sections
// de la page A propos, avec le même filigrane "afr" en fond pour garder
// la signature Afrique du site sans ajouter une nouvelle image.
export function ContactInfo() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#EE7115]/[0.1] py-14"
    >
      <img
        src="/afr.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-auto max-w-none translate-x-1/3 opacity-[0.07] mix-blend-multiply sm:opacity-[0.08]"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal
          as="h2"
          show={isInView}
          delay={0}
          className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl"
        >
          {t("contacts.info.titleLead")}{" "}
          <span className="text-[#EE7115]">
            {t("contacts.info.titleHighlight")}
          </span>
        </Reveal>
        <Reveal
          show={isInView}
          delay={120}
          className="mt-2 text-center text-sm text-gray-600"
        >
          {t("contacts.info.subtitle")}
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactPoints.map((item, i) => (
            <ContactCard
              key={item.key}
              item={{
                ...item,
                title: t(`contacts.info.${titleKeys[item.key]}`),
                value: item.isSocial
                  ? t("contacts.info.socialText")
                  : item.value,
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
