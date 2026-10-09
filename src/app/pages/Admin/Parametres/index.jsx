// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  BellIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { SettingsSection } from "./SettingsSection";
import { Field, Select, TextInput } from "./Field";
import { Toggle } from "./Toggle";
import { NotificationsMatrix } from "./NotificationsMatrix";
import {
  MEMBER_IDLE_MINUTES_OPTIONS,
  PASSWORD_LENGTH_BOUNDS,
  updatePlatformSettings,
  usePlatformSettings,
} from "./platformSettings";
import {
  currencyOptions,
  dateFormatOptions,
  exportFrequencyOptions,
  languageOptions,
  notificationAudiences,
  notificationTypes,
  sessionTimeoutOptions,
  timezoneOptions,
} from "./mockData";

// ----------------------------------------------------------------------

// Page "Paramètres" (/admin/parametres) : la configuration système
// générale (identité de la plateforme, cycle de tontine, sécurité,
// sauvegarde) qu'on retrouve dans la quasi-totalité des back-offices,
// plus une matrice de notifications qui décide qui (membres, directeurs,
// leaders d'antennes, administrateurs) reçoit quoi (nouvelle cotisation,
// rappel d'échéance, nouvelle formation...) — voir NotificationsMatrix.jsx.
//
// Tout s'applique immédiatement, sans bouton "Enregistrer" : une pastille
// de confirmation discrète s'affiche à chaque changement. Les réglages sont
// gardés dans le navigateur (voir platformSettings.js) et LUS par le reste
// du site. Les sections marquées "Concerne les membres" agissent vraiment
// sur l'espace membre :
// - Tontine : le jour de cotisation et le délai de rappel alimentent
//   "Mon prochain versement" et les rappels de cotisation ;
// - Comptes des membres : la règle de mot de passe (Paramètres > Sécurité
//   du membre) et la déconnexion automatique après inactivité ;
// - Notifications : la colonne "Membres" de la matrice décide de ce qui
//   apparaît dans les notifications du membre, la colonne "Administrateurs"
//   de ce qui apparaît dans les vôtres.
// Le reste (identité de la plateforme, langue, devise, durée du cycle,
// 2FA, sauvegarde) est enregistré mais pas encore lu ailleurs : à brancher
// avec le backend.
export default function Parametres() {
  const { t } = useTranslation();
  const settings = usePlatformSettings();
  const { general, tontine, security, backup, notificationsEnabled, notificationMatrix } = settings;
  const [justSaved, setJustSaved] = useState(false);

  // Pastille "Enregistré ✓" — s'affiche brièvement à chaque changement.
  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  const save = (update) => {
    updatePlatformSettings(update);
    setJustSaved(true);
  };

  const updateGeneral = (field) => (event) =>
    save((prev) => ({ ...prev, general: { ...prev.general, [field]: event.target.value } }));
  const updateTontine = (field) => (event) =>
    save((prev) => ({ ...prev, tontine: { ...prev.tontine, [field]: Number(event.target.value) } }));
  const updateSecurityField = (field) => (event) =>
    save((prev) => ({ ...prev, security: { ...prev.security, [field]: event.target.value } }));
  const updateSecurityValue = (field, value) =>
    save((prev) => ({ ...prev, security: { ...prev.security, [field]: value } }));
  // Longueur minimale du mot de passe. On garde la saisie en brouillon tant
  // que le champ a le focus (taper "12" passe d'abord par "1", qui est sous
  // le minimum) : le réglage n'est enregistré que lorsqu'il est dans les
  // bornes, et ramené dans les bornes quand on quitte le champ.
  const [lengthDraft, setLengthDraft] = useState(null);
  const clampLength = (value) =>
    Math.min(PASSWORD_LENGTH_BOUNDS.max, Math.max(PASSWORD_LENGTH_BOUNDS.min, Math.round(value)));
  const updatePasswordLength = (event) => {
    const raw = event.target.value;
    setLengthDraft(raw);
    const value = Number(raw);
    if (raw !== "" && Number.isFinite(value) && value >= PASSWORD_LENGTH_BOUNDS.min && value <= PASSWORD_LENGTH_BOUNDS.max) {
      updateSecurityValue("passwordMinLength", Math.round(value));
    }
  };
  const settlePasswordLength = () => {
    const value = Number(lengthDraft);
    if (lengthDraft !== null && lengthDraft !== "" && Number.isFinite(value)) {
      updateSecurityValue("passwordMinLength", clampLength(value));
    }
    setLengthDraft(null);
  };
  const toggleTwoFactor = (value) => updateSecurityValue("twoFactorEnabled", value);
  const toggleAutoExport = (value) =>
    save((prev) => ({ ...prev, backup: { ...prev.backup, autoExportEnabled: value } }));
  const updateExportFrequency = (event) =>
    save((prev) => ({ ...prev, backup: { ...prev.backup, exportFrequency: event.target.value } }));
  const toggleNotificationsEnabled = (value) => save({ notificationsEnabled: value });
  const toggleNotificationCell = (typeKey, audienceKey, value) =>
    save((prev) => ({
      ...prev,
      notificationMatrix: {
        ...prev.notificationMatrix,
        [typeKey]: { ...prev.notificationMatrix[typeKey], [audienceKey]: value },
      },
    }));

  const withLabels = (options) => options.map((option) => ({ value: option.value, label: t(option.labelKey) }));

  const exportSettings = () => {
    const payload = settings;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parametres-dbc.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Page title={`Admin – ${t("admin.parametres.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("admin.parametres.title")} />

        {justSaved && (
          <div className="mt-4 flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-[#16A34A]">
            <CheckCircleIcon aria-hidden="true" className="size-4" />
            {t("admin.parametres.saved")}
          </div>
        )}

        <div className="mt-6 space-y-6">
          <SettingsSection
            Icon={Cog6ToothIcon}
            title={t("admin.parametres.general.title")}
            description={t("admin.parametres.general.description")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.parametres.general.platformName")}>
                <TextInput type="text" value={general.platformName} onChange={updateGeneral("platformName")} />
              </Field>
              <Field label={t("admin.parametres.general.supportEmail")}>
                <TextInput type="email" value={general.supportEmail} onChange={updateGeneral("supportEmail")} />
              </Field>
              <Field label={t("admin.parametres.general.supportPhone")}>
                <TextInput type="text" value={general.supportPhone} onChange={updateGeneral("supportPhone")} />
              </Field>
              <Field label={t("admin.parametres.general.timezone")}>
                <Select
                  value={general.timezone}
                  onChange={updateGeneral("timezone")}
                  options={withLabels(timezoneOptions)}
                />
              </Field>
              <Field label={t("admin.parametres.general.defaultLanguage")}>
                <Select
                  value={general.defaultLanguage}
                  onChange={updateGeneral("defaultLanguage")}
                  options={withLabels(languageOptions)}
                />
              </Field>
              <Field label={t("admin.parametres.general.currency")}>
                <Select
                  value={general.currency}
                  onChange={updateGeneral("currency")}
                  options={withLabels(currencyOptions)}
                />
              </Field>
              <Field label={t("admin.parametres.general.dateFormat")}>
                <Select
                  value={general.dateFormat}
                  onChange={updateGeneral("dateFormat")}
                  options={withLabels(dateFormatOptions)}
                />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection
            Icon={BanknotesIcon}
            title={t("admin.parametres.tontine.title")}
            description={t("admin.parametres.tontine.description")}
            badge={t("admin.parametres.memberBadge")}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("admin.parametres.tontine.cycleDurationMonths")}>
                <TextInput
                  type="number"
                  min="1"
                  value={tontine.cycleDurationMonths}
                  onChange={updateTontine("cycleDurationMonths")}
                />
              </Field>
              <Field label={t("admin.parametres.tontine.contributionDay")}>
                <TextInput
                  type="number"
                  min="1"
                  max="28"
                  value={tontine.contributionDay}
                  onChange={updateTontine("contributionDay")}
                />
              </Field>
              <Field label={t("admin.parametres.tontine.reminderDaysBefore")}>
                <TextInput
                  type="number"
                  min="0"
                  value={tontine.reminderDaysBefore}
                  onChange={updateTontine("reminderDaysBefore")}
                />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection
            Icon={ShieldCheckIcon}
            title={t("admin.parametres.security.title")}
            description={t("admin.parametres.security.description")}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {t("admin.parametres.security.twoFactorEnabled")}
                  </p>
                  <p className="text-xs text-gray-500">{t("admin.parametres.security.twoFactorHint")}</p>
                </div>
                <Toggle
                  checked={security.twoFactorEnabled}
                  onChange={toggleTwoFactor}
                  label={t("admin.parametres.security.twoFactorEnabled")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("admin.parametres.security.sessionTimeout")}>
                  <Select
                    value={security.sessionTimeout}
                    onChange={updateSecurityField("sessionTimeout")}
                    options={withLabels(sessionTimeoutOptions)}
                  />
                </Field>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            Icon={KeyIcon}
            title={t("admin.parametres.memberAccounts.title")}
            description={t("admin.parametres.memberAccounts.description")}
            badge={t("admin.parametres.memberBadge")}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("admin.parametres.memberAccounts.passwordMinLength")}>
                  <TextInput
                    type="number"
                    min={PASSWORD_LENGTH_BOUNDS.min}
                    max={PASSWORD_LENGTH_BOUNDS.max}
                    value={lengthDraft ?? security.passwordMinLength}
                    onChange={updatePasswordLength}
                    onBlur={settlePasswordLength}
                  />
                </Field>
                <Field label={t("admin.parametres.memberAccounts.idleMinutes")}>
                  <Select
                    value={String(security.memberIdleMinutes)}
                    onChange={(event) => updateSecurityValue("memberIdleMinutes", Number(event.target.value))}
                    options={MEMBER_IDLE_MINUTES_OPTIONS.map((minutes) => ({
                      value: String(minutes),
                      label: t("admin.parametres.memberAccounts.idleOption", { count: minutes }),
                    }))}
                  />
                </Field>
              </div>
              <p className="-mt-2 text-xs text-gray-400">
                {t("admin.parametres.memberAccounts.passwordHint", { min: PASSWORD_LENGTH_BOUNDS.min, max: PASSWORD_LENGTH_BOUNDS.max })}
              </p>

              {[
                ["passwordRequireUpper", "requireUpper"],
                ["passwordRequireDigit", "requireDigit"],
                ["passwordRequireSymbol", "requireSymbol"],
              ].map(([field, labelKey]) => (
                <div key={field} className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {t(`admin.parametres.memberAccounts.${labelKey}`)}
                  </p>
                  <Toggle
                    checked={security[field]}
                    onChange={(value) => updateSecurityValue(field, value)}
                    label={t(`admin.parametres.memberAccounts.${labelKey}`)}
                  />
                </div>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            Icon={BellIcon}
            title={t("admin.parametres.notifications.title")}
            description={t("admin.parametres.notifications.description")}
            badge={t("admin.parametres.memberBadge")}
          >
            <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">
                {t("admin.parametres.notifications.masterToggle")}
              </p>
              <Toggle
                checked={notificationsEnabled}
                onChange={toggleNotificationsEnabled}
                label={t("admin.parametres.notifications.masterToggle")}
              />
            </div>

            <div className="mt-4">
              <NotificationsMatrix
                audiences={notificationAudiences}
                types={notificationTypes}
                matrix={notificationMatrix}
                enabled={notificationsEnabled}
                onToggleCell={toggleNotificationCell}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            Icon={ArrowDownTrayIcon}
            title={t("admin.parametres.backup.title")}
            description={t("admin.parametres.backup.description")}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">
                  {t("admin.parametres.backup.autoExportEnabled")}
                </p>
                <Toggle
                  checked={backup.autoExportEnabled}
                  onChange={toggleAutoExport}
                  label={t("admin.parametres.backup.autoExportEnabled")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                <Field label={t("admin.parametres.backup.exportFrequency")}>
                  <Select
                    value={backup.exportFrequency}
                    onChange={updateExportFrequency}
                    disabled={!backup.autoExportEnabled}
                    options={withLabels(exportFrequencyOptions)}
                  />
                </Field>
                <button
                  type="button"
                  onClick={exportSettings}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
                  {t("admin.parametres.backup.exportNow")}
                </button>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </Page>
  );
}
