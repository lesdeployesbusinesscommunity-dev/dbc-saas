// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, LanguageIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { useLocaleContext } from "app/contexts/locale/context";
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { NotificationsSection } from "./NotificationsSection";
import { PrivacySection } from "./PrivacySection";
import { AccountSection } from "./AccountSection";
import { loadSettings, saveSettings } from "./settingsStore";

// ----------------------------------------------------------------------

const LANGUAGES = ["fr", "en"];

// Page "Paramètres" de l'espace membre (/membre/parametres) : profil,
// sécurité, notifications, confidentialité, langue et compte — même
// gabarit de cartes que les Paramètres de l'admin (voir
// Admin/Parametres/index.jsx), dont elle réutilise SettingsSection, Field
// et Toggle. Même principe aussi : les interrupteurs et la langue
// s'appliquent tout de suite, avec une pastille "Enregistré" discrète ;
// seul le mot de passe a un bouton, parce qu'on y saisit du texte qu'on
// veut pouvoir relire avant de valider. Le profil (nom, photo, coordonnées)
// est en lecture seule, pour des raisons de sécurité : voir
// ProfileSection.jsx.
//
// La langue passe par le même LocaleProvider que le bouton FR/EN de la
// barre du haut (voir components/shared/LanguageToggle.jsx) : les deux
// restent donc toujours d'accord.
export default function MembreParametres() {
  const { t } = useTranslation();
  const { locale, updateLocale } = useLocaleContext();
  const [settings, setSettings] = useState(loadSettings);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  const change = (next) => {
    setSettings(next);
    saveSettings(next);
    setJustSaved(true);
  };

  return (
    <Page title={`${t("membre.nav.parametres")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar titleKey="membre.nav.parametres" />

        <div aria-live="polite" className="mt-4 h-8">
          {justSaved && (
            <div className="flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-[#16A34A]">
              <CheckCircleIcon aria-hidden="true" className="size-4" />
              {t("membre.parametres.saved")}
            </div>
          )}
        </div>

        <div className="mt-2 space-y-6">
          <ProfileSection />
          <SecuritySection onSaved={() => setJustSaved(true)} />
          <NotificationsSection settings={settings} onChange={change} />
          <PrivacySection settings={settings} onChange={change} />

          <SettingsSection
            Icon={LanguageIcon}
            title={t("membre.parametres.language.title")}
            description={t("membre.parametres.language.description")}
          >
            <div role="group" aria-label={t("membre.parametres.language.title")} className="inline-flex rounded-full bg-gray-100 p-0.5">
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={locale === code}
                  onClick={() => {
                    updateLocale(code);
                    setJustSaved(true);
                  }}
                  className={clsx(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                    locale === code ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
                  )}
                >
                  {t(`membre.parametres.language.options.${code}`)}
                </button>
              ))}
            </div>
          </SettingsSection>

          <AccountSection />
        </div>
      </div>
    </Page>
  );
}
