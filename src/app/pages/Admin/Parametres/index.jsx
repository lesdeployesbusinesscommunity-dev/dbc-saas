// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  BellIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
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
  currencyOptions,
  dateFormatOptions,
  exportFrequencyOptions,
  initialBackupSettings,
  initialGeneralSettings,
  initialNotificationMatrix,
  initialNotificationsEnabled,
  initialSecuritySettings,
  initialTontineSettings,
  languageOptions,
  notificationAudiences,
  notificationTypes,
  passwordPolicyOptions,
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
// Tout s'applique immédiatement en local, comme le reste de l'admin (voir
// mockData.js) : pas de bouton "Enregistrer" séparé, juste une pastille
// de confirmation discrète à chaque changement, en attendant les vrais
// endpoints.
export default function Parametres() {
  const { t } = useTranslation();
  const [general, setGeneral] = useState(initialGeneralSettings);
  const [tontine, setTontine] = useState(initialTontineSettings);
  const [security, setSecurity] = useState(initialSecuritySettings);
  const [backup, setBackup] = useState(initialBackupSettings);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [notificationMatrix, setNotificationMatrix] = useState(initialNotificationMatrix);
  const [justSaved, setJustSaved] = useState(false);

  // Pastille "Enregistré ✓" — s'affiche brièvement à chaque changement,
  // pour que la page continue à ressembler à un vrai écran de paramètres
  // (avec confirmation) même si, comme le reste de l'admin, tout
  // s'applique déjà instantanément en local.
  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  const flashSaved = () => setJustSaved(true);

  const updateGeneral = (field) => (event) => {
    setGeneral((prev) => ({ ...prev, [field]: event.target.value }));
    flashSaved();
  };
  const updateTontine = (field) => (event) => {
    setTontine((prev) => ({ ...prev, [field]: Number(event.target.value) }));
    flashSaved();
  };
  const updateSecurityField = (field) => (event) => {
    setSecurity((prev) => ({ ...prev, [field]: event.target.value }));
    flashSaved();
  };
  const toggleTwoFactor = (value) => {
    setSecurity((prev) => ({ ...prev, twoFactorEnabled: value }));
    flashSaved();
  };
  const toggleAutoExport = (value) => {
    setBackup((prev) => ({ ...prev, autoExportEnabled: value }));
    flashSaved();
  };
  const updateExportFrequency = (event) => {
    setBackup((prev) => ({ ...prev, exportFrequency: event.target.value }));
    flashSaved();
  };
  const toggleNotificationsEnabled = (value) => {
    setNotificationsEnabled(value);
    flashSaved();
  };
  const toggleNotificationCell = (typeKey, audienceKey, value) => {
    setNotificationMatrix((prev) => ({
      ...prev,
      [typeKey]: { ...prev[typeKey], [audienceKey]: value },
    }));
    flashSaved();
  };

  const withLabels = (options) => options.map((option) => ({ value: option.value, label: t(option.labelKey) }));

  const exportSettings = () => {
    const payload = { general, tontine, security, backup, notificationsEnabled, notificationMatrix };
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
                <Field label={t("admin.parametres.security.passwordPolicy")}>
                  <Select
                    value={security.passwordPolicy}
                    onChange={updateSecurityField("passwordPolicy")}
                    options={withLabels(passwordPolicyOptions)}
                  />
                </Field>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            Icon={BellIcon}
            title={t("admin.parametres.notifications.title")}
            description={t("admin.parametres.notifications.description")}
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
