// Import Dependencies
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CameraIcon, IdentificationIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { Field, TextInput } from "app/pages/Admin/Parametres/Field";
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";
import { applyProfile, currentMember } from "../currentMember";

// ----------------------------------------------------------------------

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ]{8,16}$/;

function pickFields(member) {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    whatsapp: member.whatsapp,
    town: member.town,
    country: member.country,
    profession: member.profession,
    photo: member.photo,
  };
}

// Recadre la photo choisie en carré 256 x 256 (JPEG) : légère, donc
// raisonnable à garder dans le navigateur, et jamais déformée.
function toAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(image.width, image.height);
      canvas
        .getContext("2d")
        .drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

// Paramètres > Profil : ce que le membre peut modifier lui-même (photo,
// nom, coordonnées, ville, profession). Le matricule est affiché mais pas
// modifiable : c'est lui que les filleuls indiquent à l'inscription (voir
// Reseau/InviteCard.jsx). Les changements passent par "applyProfile"
// (currentMember.js) : le Dashboard, Mon Réseau, Ma Tontine... les
// reprennent dès la prochaine page ouverte.
export function ProfileSection({ onSaved }) {
  const { t } = useTranslation();
  const fileInput = useRef(null);
  const [form, setForm] = useState(() => pickFields(currentMember));
  const [saved, setSaved] = useState(() => pickFields(currentMember));
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState("");

  const dirty = Object.keys(form).some((key) => form[key] !== saved[key]);
  const fullName = `${form.firstName} ${form.lastName}`.trim();

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onPickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError(t("membre.parametres.profile.photoNotImage"));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t("membre.parametres.profile.photoTooBig"));
      return;
    }
    try {
      const photo = await toAvatarDataUrl(file);
      setForm((prev) => ({ ...prev, photo }));
      setPhotoError("");
    } catch {
      setPhotoError(t("membre.parametres.profile.photoNotImage"));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = t("membre.parametres.profile.errors.required");
    if (!form.lastName.trim()) next.lastName = t("membre.parametres.profile.errors.required");
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = t("membre.parametres.profile.errors.email");
    if (!PHONE_PATTERN.test(form.whatsapp.trim())) next.whatsapp = t("membre.parametres.profile.errors.phone");
    if (!form.profession.trim()) next.profession = t("membre.parametres.profile.errors.required");
    return next;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const clean = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      town: form.town.trim(),
      country: form.country.trim(),
      profession: form.profession.trim(),
    };
    applyProfile(clean);
    setForm(clean);
    setSaved(clean);
    onSaved();
  };

  const onCancel = () => {
    setForm(saved);
    setErrors({});
    setPhotoError("");
  };

  const errorText = (field) =>
    errors[field] ? <p className="mt-1 text-xs font-medium text-red-600">{errors[field]}</p> : null;

  return (
    <SettingsSection
      Icon={UserCircleIcon}
      title={t("membre.parametres.profile.title")}
      description={t("membre.parametres.profile.description")}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={fullName || currentMember.name} src={form.photo} size="size-20" />
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <CameraIcon aria-hidden="true" className="size-4" />
                {t("membre.parametres.profile.changePhoto")}
              </button>
              {form.photo && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, photo: null }))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-600"
                >
                  <TrashIcon aria-hidden="true" className="size-4" />
                  {t("membre.parametres.profile.removePhoto")}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{t("membre.parametres.profile.photoHint")}</p>
            {photoError && <p className="mt-1 text-xs font-medium text-red-600">{photoError}</p>}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="sr-only"
              tabIndex={-1}
              aria-label={t("membre.parametres.profile.changePhoto")}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Field label={t("membre.parametres.profile.firstName")}>
              <TextInput type="text" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} />
            </Field>
            {errorText("firstName")}
          </div>
          <div>
            <Field label={t("membre.parametres.profile.lastName")}>
              <TextInput type="text" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} />
            </Field>
            {errorText("lastName")}
          </div>
          <div>
            <Field label={t("membre.parametres.profile.email")}>
              <TextInput type="email" autoComplete="email" value={form.email} onChange={update("email")} />
            </Field>
            {errorText("email")}
          </div>
          <div>
            <Field label={t("membre.parametres.profile.whatsapp")}>
              <TextInput type="tel" autoComplete="tel" value={form.whatsapp} onChange={update("whatsapp")} />
            </Field>
            {errorText("whatsapp")}
          </div>
          <Field label={t("membre.parametres.profile.town")}>
            <TextInput type="text" autoComplete="address-level2" value={form.town} onChange={update("town")} />
          </Field>
          <Field label={t("membre.parametres.profile.country")}>
            <TextInput type="text" autoComplete="country-name" value={form.country} onChange={update("country")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("membre.parametres.profile.profession")}>
              <TextInput type="text" value={form.profession} onChange={update("profession")} />
            </Field>
            {errorText("profession")}
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
          <IdentificationIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#EE7115]" />
          <div className="min-w-0 text-xs text-gray-500">
            <p className="text-sm font-bold text-gray-900">
              {t("membre.parametres.profile.matricule", { matricule: currentMember.matricule })}
            </p>
            <p className="mt-0.5">{t("membre.parametres.profile.matriculeHint")}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={!dirty}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("membre.common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!dirty}
            className="rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("membre.parametres.profile.save")}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
