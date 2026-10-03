// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Field, TextInput } from "app/pages/Admin/Parametres/Field";
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";

// ----------------------------------------------------------------------

const MIN_LENGTH = 8;

// Paramètres > Sécurité : changer son mot de passe. Même règle que la
// politique "Standard" de l'admin (8 caractères minimum), plus une lettre
// et un chiffre. Aucun mot de passe n'est conservé ni envoyé nulle part
// pour l'instant : la connexion membre n'est pas encore branchée au
// backend (voir router/membre.jsx) — c'est à cet endroit qu'on appellera
// l'endpoint de changement de mot de passe, avec "current" et "next".
export function SecuritySection({ onSaved }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setDone(false);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.current) next.current = t("membre.parametres.security.errors.currentRequired");
    if (values.next.length < MIN_LENGTH || !/[A-Za-z]/.test(values.next) || !/[0-9]/.test(values.next)) {
      next.next = t("membre.parametres.security.errors.weak", { min: MIN_LENGTH });
    } else if (values.next === values.current) {
      next.next = t("membre.parametres.security.errors.same");
    }
    if (values.confirm !== values.next) next.confirm = t("membre.parametres.security.errors.mismatch");

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setValues({ current: "", next: "", confirm: "" });
    setDone(true);
    onSaved();
  };

  const type = visible ? "text" : "password";
  const errorText = (field) =>
    errors[field] ? <p className="mt-1 text-xs font-medium text-red-600">{errors[field]}</p> : null;

  return (
    <SettingsSection
      Icon={LockClosedIcon}
      title={t("membre.parametres.security.title")}
      description={t("membre.parametres.security.description")}
    >
      <form onSubmit={onSubmit} noValidate className="max-w-xl">
        <div className="space-y-4">
          <div>
            <Field label={t("membre.parametres.security.current")}>
              <TextInput type={type} autoComplete="current-password" value={values.current} onChange={update("current")} />
            </Field>
            {errorText("current")}
          </div>
          <div>
            <Field label={t("membre.parametres.security.new")}>
              <TextInput type={type} autoComplete="new-password" value={values.next} onChange={update("next")} />
            </Field>
            <p className="mt-1 text-xs text-gray-400">{t("membre.parametres.security.rule", { min: MIN_LENGTH })}</p>
            {errorText("next")}
          </div>
          <div>
            <Field label={t("membre.parametres.security.confirm")}>
              <TextInput type={type} autoComplete="new-password" value={values.confirm} onChange={update("confirm")} />
            </Field>
            {errorText("confirm")}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800"
          >
            {visible ? (
              <EyeSlashIcon aria-hidden="true" className="size-4" />
            ) : (
              <EyeIcon aria-hidden="true" className="size-4" />
            )}
            {t(visible ? "membre.parametres.security.hide" : "membre.parametres.security.show")}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("membre.parametres.security.submit")}
          </button>
        </div>

        {done && (
          <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {t("membre.parametres.security.done")}
          </p>
        )}
      </form>
    </SettingsSection>
  );
}
