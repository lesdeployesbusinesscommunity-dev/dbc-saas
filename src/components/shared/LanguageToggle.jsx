// Import Dependencies
import { LanguageIcon } from "@heroicons/react/24/outline";

// Local Imports
import { useLocaleContext } from "app/contexts/locale/context";

// ----------------------------------------------------------------------

// Petit bouton "traduire" pour le site public : bascule entre français et
// anglais (les deux seules langues utilisées sur les pages visiteur). Le
// changement passe par le LocaleProvider global du template (persisté en
// localStorage), donc il reste actif même si l'utilisateur navigue
// ensuite vers le dashboard.
export function LanguageToggle() {
  const { locale, updateLocale } = useLocaleContext();
  const isFrench = locale === "fr";
  const nextLocale = isFrench ? "en" : "fr";

  return (
    <button
      type="button"
      onClick={() => updateLocale(nextLocale)}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-[#52A2DF] hover:text-[#52A2DF]"
      aria-label={isFrench ? "Switch to English" : "Passer en français"}
    >
      <LanguageIcon className="size-5" />
      {nextLocale.toUpperCase()}
    </button>
  );
}
