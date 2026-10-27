// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { InformationCircleIcon, XMarkIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { MonthPicker } from "../components/MonthPicker";
import { isMonthValue } from "../components/monthUtils";
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
  tontineStartMonth: "",
  email: "",
  whatsapp: "",
};

const INPUT =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50 disabled:text-gray-500";

function formFromMember(member) {
  if (!member) return EMPTY_FORM;
  const { name, role, domain, city, country, sponsorName, sponsorMatricule, coins, status } = member;
  return {
    tontineStartMonth: member.tontineStartMonth ?? "",
    email: member.email ?? "",
    whatsapp: member.whatsapp ?? "",
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

// Titre de section du formulaire : découpe le formulaire en blocs courts
// (identité, niveau, activité, localisation, parrainage) pour qu'on sache
// toujours où on en est.
function FormSection({ title, children }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-gray-100 p-4">
      <legend className="px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

// Formulaire d'un membre, en 3 modes :
// - "add" : "Créer un membre". Le niveau est fixe ("lockLevel") ou
//   proposé ("defaultLevel", celui du dossier ouvert) mais modifiable.
// - "edit" : "Mettre à jour" depuis le menu "..." d'une ligne.
// - "view" : lecture seule (champs grisés).
//
// Le matricule est ATTRIBUÉ ici à la création : le champ est pré-rempli
// avec le prochain numéro libre du niveau choisi (proposé par la page, voir
// "suggestMatricule"), que l'admin peut garder ou remplacer à la main. Tant
// qu'il ne l'a pas modifié lui-même, il suit le niveau choisi ; une fois
// modifié à la main, on n'y touche plus. Un matricule déjà attribué est
// refusé (c'est ce que le membre donne pour parrainer, il doit être
// unique). Après la création, le matricule n'est plus modifiable.
//
// Le parrain se CHOISIT dans la liste des membres existants (nom et
// matricule se remplissent ensemble) au lieu d'être retapé à la main.
// Le "mois de début de la tontine" est obligatoire : c'est lui qui permet de
// regrouper les membres qui démarrent ensemble (voir Tontines > Choix des
// mois). L'e-mail et le numéro WhatsApp servent aux rappels envoyés par
// l'administration.
// "Coins" n'est demandé qu'en modification : un nouveau membre démarre à 0.
//
// "initialValues" (mode "add" seulement) pré-remplit le formulaire avec des
// valeurs connues d'avance — c'est ce qu'utilise "Demandes d'inscription"
// pour reprendre les informations saisies par le candidat (voir
// Inscriptions/registrationUtils.js) ; "prefillNote" est le bandeau qui le
// dit à l'administration. Passer un objet STABLE (state/useMemo) : le
// formulaire est réinitialisé quand il change.
//
// "onSubmit" ne fait que transmettre le niveau et le formulaire à la page
// (voir Membres/index.jsx), qui les enregistre dans le registre local.
export function AddMemberModal({
  open,
  mode = "add",
  member,
  lockLevel,
  defaultLevel,
  onClose,
  onSubmit,
  suggestMatricule,
  existingMembers = [],
  initialValues = null,
  prefillNote = "",
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
    setForm(member ? formFromMember(member) : { ...EMPTY_FORM, ...initialValues });
    setLevel(initialLevel);
    setMatricule(member ? member.matricule : (suggestMatricule?.(initialLevel) ?? ""));
    setMatriculeEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member, lockLevel, defaultLevel, initialValues]);

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

  const handleSponsorChange = (event) => {
    const picked = existingMembers.find((entry) => entry.matricule === event.target.value);
    setForm((prev) => ({
      ...prev,
      sponsorMatricule: picked?.matricule ?? "",
      sponsorName: picked?.name ?? "",
    }));
  };

  const cleanMatricule = matricule.trim().toUpperCase();
  const matriculeTaken =
    mode === "add" &&
    cleanMatricule !== "" &&
    existingMembers.some((existing) => existing.matricule?.toUpperCase() === cleanMatricule);

  // Un membre ne se parraine pas lui-même ; en modification, on garde
  // quand même l'ancien parrain même s'il n'est plus dans la liste.
  const sponsorOptions = existingMembers.filter((entry) => entry.matricule !== member?.matricule);
  const sponsorMissing =
    form.sponsorMatricule && !sponsorOptions.some((entry) => entry.matricule === form.sponsorMatricule);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (readOnly || matriculeTaken || !isMonthValue(form.tontineStartMonth)) return;
    // À la création, le matricule saisi fait partie du membre créé ; en
    // modification il reste celui d'origine (champ grisé).
    onSubmit(level, mode === "add" ? { ...form, matricule: cleanMatricule } : form);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {mode === "add" && (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#52A2DF]">
                  <UserPlusIcon aria-hidden="true" className="size-5" />
                </span>
              )}
              <div>
                <DialogTitle className="text-base font-bold text-gray-900">{title}</DialogTitle>
                {mode === "add" && (
                  <p className="text-xs text-gray-500">{t("admin.membres.modal.addHint")}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          {mode === "add" && prefillNote && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-medium text-[#2f78b0]">
              <InformationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {prefillNote}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <FormSection title={t("admin.membres.modal.sections.identity")}>
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
                  <input type="text" value={member.matricule} disabled className={INPUT} />
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
                  className={INPUT}
                />
              </label>
            </FormSection>

            <FormSection title={t("admin.membres.modal.sections.levelStatus")}>
              <div>
                <p className="text-xs font-semibold text-gray-500">{t("admin.membres.modal.level")}</p>
                {lockLevel || readOnly ? (
                  <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {levelLabel(level)}
                  </p>
                ) : (
                  <select value={level} onChange={handleLevelChange} className={INPUT}>
                    {levels.map((lvl) => (
                      <option key={lvl.key} value={lvl.key}>
                        {levelLabel(lvl.key)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.status")}
                <select disabled={readOnly} value={form.status} onChange={updateField("status")} className={INPUT}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] font-normal text-gray-400">
                  {t(`admin.membres.statusHelp.${form.status}`, { defaultValue: "" })}
                </span>
              </label>
            </FormSection>

            <FormSection title={t("admin.membres.modal.sections.tontine")}>
              <div className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.tontineStart")}
                <MonthPicker
                  required
                  disabled={readOnly}
                  value={form.tontineStartMonth}
                  onChange={(value) => setForm((prev) => ({ ...prev, tontineStartMonth: value }))}
                />
                <span className="mt-1 block text-[11px] font-normal text-gray-400">
                  {t("admin.membres.modal.tontineStartHint")}
                </span>
              </div>
            </FormSection>

            <FormSection title={t("admin.membres.modal.sections.activity")}>
              <div className={mode === "add" ? "" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.membres.modal.role")}
                  <input
                    type="text"
                    disabled={readOnly}
                    value={form.role}
                    onChange={updateField("role")}
                    placeholder={t("admin.membres.modal.rolePlaceholder")}
                    className={INPUT}
                  />
                </label>
                {mode !== "add" && (
                  <label className="block text-xs font-semibold text-gray-500">
                    {t("admin.membres.modal.coins")}
                    <input
                      type="number"
                      min="0"
                      disabled={readOnly}
                      value={form.coins}
                      onChange={updateField("coins")}
                      className={INPUT}
                    />
                  </label>
                )}
              </div>

              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.domain")}
                <input
                  type="text"
                  disabled={readOnly}
                  value={form.domain}
                  onChange={updateField("domain")}
                  placeholder={t("admin.membres.modal.domainPlaceholder")}
                  className={INPUT}
                />
              </label>
            </FormSection>

            <FormSection title={t("admin.membres.modal.sections.location")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.membres.modal.city")}
                  <input type="text" disabled={readOnly} value={form.city} onChange={updateField("city")} className={INPUT} />
                </label>
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.membres.modal.country")}
                  <input type="text" disabled={readOnly} value={form.country} onChange={updateField("country")} className={INPUT} />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.membres.modal.email")}
                  <input
                    type="email"
                    disabled={readOnly}
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder={t("admin.membres.modal.emailPlaceholder")}
                    className={INPUT}
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.membres.modal.whatsapp")}
                  <input
                    type="tel"
                    disabled={readOnly}
                    value={form.whatsapp}
                    onChange={updateField("whatsapp")}
                    placeholder={t("admin.membres.modal.whatsappPlaceholder")}
                    className={INPUT}
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-400">{t("admin.membres.modal.contactHint")}</p>
            </FormSection>

            <FormSection title={t("admin.membres.modal.sections.sponsorship")}>
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.membres.modal.sponsor")}
                <select
                  disabled={readOnly}
                  value={form.sponsorMatricule}
                  onChange={handleSponsorChange}
                  className={INPUT}
                >
                  <option value="">{t("admin.membres.modal.noSponsor")}</option>
                  {sponsorMissing && (
                    <option value={form.sponsorMatricule}>
                      {form.sponsorName} — {form.sponsorMatricule}
                    </option>
                  )}
                  {sponsorOptions.map((entry) => (
                    <option key={entry.matricule} value={entry.matricule}>
                      {entry.name} — {entry.matricule}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] font-normal text-gray-400">
                  {t("admin.membres.modal.sponsorHint")}
                </span>
              </label>
            </FormSection>

            <div className="flex justify-end gap-3 pt-1">
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
                  disabled={matriculeTaken}
                  className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {mode === "add" ? t("admin.membres.modal.create") : t("admin.membres.modal.save")}
                </button>
              )}
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
