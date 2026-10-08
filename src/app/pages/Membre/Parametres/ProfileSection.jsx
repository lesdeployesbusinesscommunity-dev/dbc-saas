// Import Dependencies
import { useTranslation } from "react-i18next";
import { IdentificationIcon, LockClosedIcon, UserCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";
import { currentMember } from "../currentMember";

// ----------------------------------------------------------------------

// Paramètres > Profil : les informations personnelles du membre, en LECTURE
// SEULE. Pour des raisons de sécurité, un membre ne peut pas les modifier
// lui-même (nom, photo, email, WhatsApp, ville, pays, profession,
// matricule) : seul son mot de passe est modifiable (voir
// SecuritySection.jsx). Une correction passe par l'équipe DBC. Quand le
// backend sera branché, ces valeurs viendront du compte du membre et la
// modification sera une action de l'équipe DBC côté admin.
const FIELDS = [
  { key: "firstName", labelKey: "firstName" },
  { key: "lastName", labelKey: "lastName" },
  { key: "email", labelKey: "email" },
  { key: "whatsapp", labelKey: "whatsapp" },
  { key: "town", labelKey: "town" },
  { key: "country", labelKey: "country" },
  { key: "profession", labelKey: "profession", wide: true },
];

export function ProfileSection() {
  const { t } = useTranslation();

  return (
    <SettingsSection
      Icon={UserCircleIcon}
      title={t("membre.parametres.profile.title")}
      description={t("membre.parametres.profile.description")}
    >
      <div className="flex items-center gap-4">
        <Avatar name={currentMember.name} src={currentMember.photo} size="size-20" />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-gray-900">{currentMember.name}</p>
          <p className="truncate text-sm text-gray-500">{currentMember.profession}</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, labelKey, wide }) => (
          <div key={key} className={wide ? "sm:col-span-2" : undefined}>
            <dt className="text-xs font-semibold text-gray-500">{t(`membre.parametres.profile.${labelKey}`)}</dt>
            <dd className="mt-1 truncate rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800">
              {currentMember[key]?.trim() || t("membre.parametres.profile.notProvided")}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
        <IdentificationIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#EE7115]" />
        <div className="min-w-0 text-xs text-gray-500">
          <p className="text-sm font-bold text-gray-900">
            {t("membre.parametres.profile.matricule", { matricule: currentMember.matricule })}
          </p>
          <p className="mt-0.5">{t("membre.parametres.profile.matriculeHint")}</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#52A2DF]/30 bg-[#52A2DF]/[0.06] p-4">
        <LockClosedIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#52A2DF]" />
        <div className="min-w-0 text-xs text-gray-600">
          <p className="text-sm font-bold text-gray-900">{t("membre.parametres.profile.lockedTitle")}</p>
          <p className="mt-0.5">{t("membre.parametres.profile.lockedHint")}</p>
        </div>
      </div>
    </SettingsSection>
  );
}
