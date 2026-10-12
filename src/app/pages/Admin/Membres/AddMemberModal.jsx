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

// Le matricule est ATTRIBUÉ ici à l'ajout d'un membre : le champ est
// pré-rempli avec le prochain numéro libre du niveau choisi (proposé par
// la page, voir Membres/index.jsx : "suggestMatricule"), que l'admin peut
// garder ou remplacer à la main (ex: pour reprendre le matricule déjà
// donné à un membre existant). Tant qu'il ne l'a pas modifié lui-même, il
// suit le niveau choisi ; une fois modifié à la main, on n'y touche plus.
// Un matricule déjà attribué à un autre membre est refusé (c'est ce que le
// membre donne pour parrainer, il doit être unique). Après l'ajout, le
// matricule n'est plus modifiable (champ grisé en "edit"/"view").
//
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
  suggestMatricule,
  existingMatricules = [],
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [level, setLevel] = useState(lockLevel ?? defaultLevel ?? levels[0].key);
  const [matricule, setMatricule] = useState("");
  const [matriculeEdited, setMatriculeEdited] = useState(false);

  // "suggestMatricule" est volontairement hors des dépendances : la page
  // en recrée une nouvelle à chaque rendu, ce qui réinitialiserait le
  // formulaire en pleine saisie. On ne la lit qu'à l'ouverture.
  useEffect(() => {
    if (!open) return;
    const initialLevel = member?.levelKey ?? lockLevel ?? defaultLevel ?? levels[0].key;
    setForm(formFromMember(member));
    setLevel(initialLevel);
    setMatricule(member ? member.matricule : (suggestMatricule?.(initialLevel) ?? ""));
    setMatriculeEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleLevelChange = (event) => {
    const nextLevel = event.target.value;
    setLevel(nextLevel);
    if (mode === "add" && !matriculeEdited) setMatricule(suggestMatricule?.(nextLevel) ?? "");
  };

  const cleanMatricule = matricule.trim().toUpperCase();
  const matriculeTaken =
    mode === "add" &&
    cleanMatricule !== "" &&
    existingMatricules.some((existing) => existing?.toUpperCase() === cleanMatricule);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (readOnly || matriculeTaken) return;
    // En ajout, le matricule saisi fait partie du membre créé ; en
    // modification il reste celui d'origine (champ grisé).
    onSubmit(level, mode === "add" ? { ...form, matricule: cleanMatricule } : form);
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
            {mode === "add" && (
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.matricule")}
                <input
                  type="text"
                  required
                  value={matricule}
                  onChange={(event) => {
                    setMatricule(event.target.value);
                    setMatriculeEdited(true);
                  }}
                  placeholder={t("admin.membres.modal.matriculePlaceholder")}
                  aria-invalid={matriculeTaken}
                  className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm font-semibold uppercase tracking-wide text-gray-800 outline-none ${
                    matriculeTaken ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-[#52A2DF]"
                  }`}
                />
                <span className={`mt-1 block text-[11px] font-normal ${matriculeTaken ? "text-red-600" : "text-gray-400"}`}>
                  {matriculeTaken ? t("admin.membres.modal.matriculeTaken") : t("admin.membres.modal.matriculeHint")}
                </span>
              </label>
            )}

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
                  onChange={handleLevelChange}
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
