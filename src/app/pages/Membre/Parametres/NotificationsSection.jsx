// Import Dependencies
import { useTranslation } from "react-i18next";
import { BellIcon } from "@heroicons/react/24/solid";

// Local Imports
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";
import { Toggle } from "app/pages/Admin/Parametres/Toggle";
import { notificationChannels, notificationTypes } from "./settingsStore";

// ----------------------------------------------------------------------

// Paramètres > Notifications : un interrupteur général, puis pour chaque
// type d'événement le canal par lequel le membre veut être prévenu (email
// et/ou WhatsApp, les deux canaux déjà demandés à l'inscription — voir
// Inscription/index.jsx). Même grille que la matrice de notifications de
// l'admin (voir Admin/Parametres/NotificationsMatrix.jsx), mais dans
// l'autre sens : ici une personne choisit ses canaux, là-bas l'admin
// choisit qui reçoit quoi.
export function NotificationsSection({ settings, onChange }) {
  const { t } = useTranslation();
  const disabled = !settings.notificationsEnabled;

  const toggleCell = (type, channel, value) =>
    onChange({
      ...settings,
      notifications: {
        ...settings.notifications,
        [type]: { ...settings.notifications[type], [channel]: value },
      },
    });

  return (
    <SettingsSection
      Icon={BellIcon}
      title={t("membre.parametres.notifications.title")}
      description={t("membre.parametres.notifications.description")}
    >
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-gray-800">{t("membre.parametres.notifications.master")}</p>
        <Toggle
          checked={settings.notificationsEnabled}
          onChange={(value) => onChange({ ...settings, notificationsEnabled: value })}
          label={t("membre.parametres.notifications.master")}
        />
      </div>

      <div className={disabled ? "mt-4 opacity-50" : "mt-4"}>
        <div className="hidden items-center gap-6 px-4 pb-2 sm:flex">
          <span className="flex-1" />
          {notificationChannels.map((channel) => (
            <span key={channel} className="w-16 text-center text-[11px] font-bold uppercase tracking-wide text-gray-400">
              {t(`membre.parametres.notifications.channels.${channel}`)}
            </span>
          ))}
        </div>

        <ul className="divide-y divide-black/5">
          {notificationTypes.map((type) => (
            <li key={type} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-semibold text-gray-900">
                  {t(`membre.parametres.notifications.types.${type}.label`)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t(`membre.parametres.notifications.types.${type}.hint`)}
                </p>
              </div>
              <div className="flex gap-6">
                {notificationChannels.map((channel) => (
                  <div key={channel} className="flex w-16 flex-col items-center gap-1">
                    <span className="text-[11px] font-semibold text-gray-400 sm:hidden">
                      {t(`membre.parametres.notifications.channels.${channel}`)}
                    </span>
                    <Toggle
                      checked={settings.notifications[type][channel]}
                      disabled={disabled}
                      onChange={(value) => toggleCell(type, channel, value)}
                      label={`${t(`membre.parametres.notifications.types.${type}.label`)} — ${t(
                        `membre.parametres.notifications.channels.${channel}`,
                      )}`}
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SettingsSection>
  );
}
