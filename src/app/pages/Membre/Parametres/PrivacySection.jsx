// Import Dependencies
import { useTranslation } from "react-i18next";
import { EyeIcon } from "@heroicons/react/24/solid";

// Local Imports
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";
import { Toggle } from "app/pages/Admin/Parametres/Toggle";

// ----------------------------------------------------------------------

const PRIVACY_KEYS = ["showInLeaderboard", "showCv", "showWhatsapp", "showCity"];

// Paramètres > Confidentialité : ce que les AUTRES membres voient de toi
// — ta place dans le classement DBC Coins, ta fiche "CV" (Coins/
// MemberCvModal.jsx), ton numéro WhatsApp sur cette fiche et ta ville. Les
// choix sont enregistrés (voir settingsStore.js) ; ils s'appliqueront aux
// autres membres quand les vrais membres seront branchés au backend.
export function PrivacySection({ settings, onChange }) {
  const { t } = useTranslation();

  return (
    <SettingsSection
      Icon={EyeIcon}
      title={t("membre.parametres.privacy.title")}
      description={t("membre.parametres.privacy.description")}
    >
      <ul className="divide-y divide-black/5">
        {PRIVACY_KEYS.map((key) => (
          <li key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{t(`membre.parametres.privacy.items.${key}.label`)}</p>
              <p className="mt-0.5 text-xs text-gray-500">{t(`membre.parametres.privacy.items.${key}.hint`)}</p>
            </div>
            <Toggle
              checked={settings.privacy[key]}
              onChange={(value) => onChange({ ...settings, privacy: { ...settings.privacy, [key]: value } })}
              label={t(`membre.parametres.privacy.items.${key}.label`)}
            />
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}
