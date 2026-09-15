// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { levelNumbers, statusOptions } from "./mockData";

// ----------------------------------------------------------------------

const EMPTY_FORM = {
  name: "",
  role: "",
  domain: "",
  city: "",
  country: "",
  sponsorName: "",
  sponsorMatricule: "",
  coins: 0,
  status: "attente",
};

function formFromMember(member) {
  if (!member) return EMPTY_FORM;
  const { name, role, domain, city, country, sponsorName, sponsorMatricule, coins, status } = member;
  return {
    name,
    role,
    domain,
    city,
    country,
    sponsorName: sponsorName ?? "",
    sponsorMatricule: sponsorMatricule ?? "",
    coins,
    status,
  };
}

// Formulaire d'un membre, en 3 modes :
// - "add" : nouveau membre. Le niveau est fixe (bouton "Ajouter un membre"
//   à l'intérieur d'un dossier) ou libre (bouton global "Ajouter un
//   nouveau membre", n'importe quel niveau — voir LevelTabs).
// - "edit" : "Mettre à jour" depuis le menu "..." d'une ligne.
// - "view" : "Voir" depuis le même menu, tous les champs en lecture seule.
//
// Rien n'est envoyé au backend pour l'instant : "onSubmit" ne fait que
// mettre à jour l'état local de la page (voir Membres/index.jsx).
export function AddMemberModal({
  open,
  mode = "add",
  member,
  lockLevel,
  defaultLevel,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [level, setLevel] = useState(lockLevel ?? defaultLevel ?? levels[0].key);

  useEffect(() => {
    if (!open) return;
    setForm(formFromMember(member));
    setLevel(member?.levelKey ?? lockLevel ?? defaultLevel ?? levels[0].key);
  }, [open, member, lockLevel, defaultLevel]);

  const readOnly = mode === "view";
  const title =
    mode === "add"
      ? t("admin.membres.modal.addTitle")
      : mode === "edit"
        ? t("admin.membres.modal.editTitle")
        : t("admin.membres.modal.viewTitle");

  const levelLabel = (key) =>
    t("admin.membres.levelWithName", {
      n: levelNumbers[key],
      name: t(`simulateur.levels.${key}.name`),
    });

  const updateField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (readOnly) return;
    onSubmit(level, form);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900">
              {title}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {member && (
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.matricule")}
                <input
                  type="text"
                  value={member.matricule}
                  disabled
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </label>
            )}

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.modal.fullName")}
              <input
                type="text"
                required
                disabled={readOnly}
                value={form.name}
                onChange={updateField("name")}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>

            <div>
              <p className="text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.level")}
              </p>
              {lockLevel || readOnly ? (
                <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {levelLabel(level)}
                </p>
              ) : (
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                >
                  {levels.map((lvl) => (
                    <option key={lvl.key} value={lvl.key}>
                      {levelLabel(lvl.key)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.role")}
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.role}
                  onChange={updateField("role")}
                  placeholder={t("admin.membres.modal.rolePlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.coins")}
                <input
                  type="number"
                  min="0"
                  disabled={readOnly}
                  value={form.coins}
                  onChange={updateField("coins")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.modal.domain")}
              <input
                type="text"
                disabled={readOnly}
                value={form.domain}
                onChange={updateField("domain")}
                placeholder={t("admin.membres.modal.domainPlaceholder")}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.city")}
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.city}
                  onChange={updateField("city")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.country")}
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.country}
                  onChange={updateField("country")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.sponsorName")}
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.sponsorName}
                  onChange={updateField("sponsorName")}
                  placeholder={t("admin.membres.modal.sponsorNamePlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.sponsorMatricule")}
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.sponsorMatricule}
                  onChange={updateField("sponsorMatricule")}
                  placeholder={t("admin.membres.modal.sponsorMatriculePlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.membres.modal.status")}
              <select
                disabled={readOnly}
                value={form.status}
                onChange={updateField("status")}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {readOnly ? t("admin.membres.modal.close") : t("admin.membres.modal.cancel")}
              </button>
              {!readOnly && (
                <button
                  type="submit"
                  className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {mode === "add" ? t("admin.membres.modal.add") : t("admin.membres.modal.save")}
                </button>
              )}
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
