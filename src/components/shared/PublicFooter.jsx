// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { JoinDbcButton } from "components/shared/JoinDbcButton";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_ADDRESS,
  socialLinks,
} from "components/shared/contactInfo";

// ----------------------------------------------------------------------

// Mêmes liens de menu que le header (voir PublicHeader.jsx) — "Revenus et
// tarif" retiré, la page Simulateur contient déjà ce tableau. Le
// "labelKey" pointe vers la clé de traduction.
const navLinks = [
  { labelKey: "home", to: "/accueil" },
  { labelKey: "about", to: "/a-propos" },
  { labelKey: "simulator", to: "/simulateur-de-revenus" },
  { labelKey: "contact", to: "/contacts" },
];

// Footer classique du site public : fond bleu foncé, texte blanc, présent
// sur toutes les pages publiques (via PublicLayout, comme le header) —
// logo + accroche, menu de navigation, appel à l'action, puis une barre
// de copyright.
export function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#0B2540] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo + accroche */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                <img
                  src="/logo-icon.jpg"
                  alt="Logo DBC"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-sm font-bold text-white">
                {t("visiteur.header.brandLine1")}
                <br />
                {t("visiteur.header.brandLine2")}
              </p>
            </div>
            <p className="mt-4 max-w-xs text-sm font-light text-white/70">
              {t("visiteur.footer.tagline")}
            </p>
          </div>

          {/* Menu */}
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">
              {t("visiteur.footer.navTitle")}
            </p>
            <nav className="mt-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="w-fit text-sm text-white/80 transition-colors hover:text-[#EE7115]"
                >
                  {t(`visiteur.header.nav.${link.labelKey}`)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Coordonnées : même source que ContactInfo.jsx sur la page
              Contacts (components/shared/contactInfo.js), pour ne mettre
              ces informations à jour qu'à un seul endroit. */}
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">
              {t("visiteur.footer.contactTitle")}
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/80">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2 transition-colors hover:text-[#EE7115]"
              >
                <EnvelopeIcon aria-hidden="true" className="size-4 shrink-0" />
                {CONTACT_EMAIL}
              </a>
              <a
                href={CONTACT_PHONE_HREF}
                className="flex items-center gap-2 transition-colors hover:text-[#EE7115]"
              >
                <PhoneIcon aria-hidden="true" className="size-4 shrink-0" />
                {CONTACT_PHONE}
              </a>
              <p className="flex items-center gap-2 text-white/70">
                <MapPinIcon aria-hidden="true" className="size-4 shrink-0" />
                {CONTACT_ADDRESS}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.key}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-[#EE7115] hover:text-white"
                >
                  <social.Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Appel à l'action */}
          <div className="flex flex-col items-start lg:items-end">
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">
              {t("visiteur.footer.ctaTitle")}
            </p>
            <p className="mt-4 max-w-xs text-sm text-white/70 sm:text-right">
              {t("visiteur.footer.ctaText")}
            </p>
            <JoinDbcButton className="mt-4" />
          </div>
        </div>

        {/* Barre de copyright */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {t("visiteur.footer.copyright")}
        </div>

        {/* Avertissement sur les revenus : présent sur la plupart des sites
            présentant un simulateur/plan de revenus, pour ne jamais laisser
            penser que les chiffres affichés sont garantis. */}
        <p className="mt-3 text-center text-[11px] text-white/30">
          {t("visiteur.footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
