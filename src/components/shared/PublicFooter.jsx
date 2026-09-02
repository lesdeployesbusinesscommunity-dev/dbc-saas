// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

// Local Imports
import { JoinDbcButton } from "components/shared/JoinDbcButton";

// ----------------------------------------------------------------------

// Mêmes liens de menu que le header (voir PublicHeader.jsx), le
// "labelKey" pointe vers la clé de traduction.
const navLinks = [
  { labelKey: "home", to: "/accueil" },
  { labelKey: "about", to: "/a-propos" },
  { labelKey: "simulator", to: "/simulateur-de-revenus" },
  { labelKey: "pricing", to: "/revenus-et-tarif" },
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
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
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

          {/* Appel à l'action */}
          <div className="flex flex-col items-start sm:items-end">
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
      </div>
    </footer>
  );
}
