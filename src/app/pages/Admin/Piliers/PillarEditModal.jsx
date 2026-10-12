// Import Dependencies
import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Field, Select, TextInput } from "../Parametres/Field";
import { Toggle } from "../Parametres/Toggle";
import { pillarGroups, pillarStatuses } from "./mockData";
import { getPillarText } from "./pillarsStore";

// ----------------------------------------------------------------------

const TEXTAREA_CLASS =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

// Fenêtre de modification d'un pilier : statut, visibilité pour les
// membres, résumé et explication. Les deux textes sont pré-remplis avec la
// version actuellement affichée aux membres ; s'ils sont laissés tels
// quels, on garde la version traduite (FR et EN) — seul un texte réellement
// changé est enregistré comme remplacement (voir pillarsStore.js).
// "Rétablir les textes d'origine" efface ce remplacement.
//
// Même fenêtre pour AJOUTER un programme : "pillar" est alors un brouillon
// sans "id" (voir newPillarDraft dans pillarsStore.js). Un programme ajouté (custom) a un nom,
// un résumé et une explication libres (pas de version traduite) et peut
// être supprimé ; "onSave(id, patch)" reçoit id = null pour une création.
export function PillarEditModal({ pillar, open, onClose, onSave, onResetTexts, onDelete }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          {pillar && (
            <EditForm
              // "key" : le formulaire repart des valeurs du pilier à chaque ouverture
              key={pillar.id ?? "new"}
              pillar={pillar}
              t={t}
              onClose={onClose}
              onSave={onSave}
              onResetTexts={onResetTexts}
              onDelete={onDelete}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function EditForm({ pillar, t, onClose, onSave, onResetTexts, onDelete }) {
  const custom = Boolean(pillar.custom);
  const isNew = pillar.id === null;
  const text = getPillarText(pillar, t);
  const defaults = custom ? { summary: "", overview: "" } : getPillarText({ id: pillar.id }, t);
  const [group, setGroup] = useState(pillar.group);
  const [name, setName] = useState(text.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [status, setStatus] = useState(pillar.status);
  const [visible, setVisible] = useState(pillar.visible);
  const [summary, setSummary] = useState(text.summary);
  const [overview, setOverview] = useState(text.overview);
  const customized = !custom && Boolean(pillar.summary || pillar.overview);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (custom) {
      const cleanName = name.trim();
      if (!cleanName) return;
      onSave(pillar.id, {
        ...(isNew ? { group } : {}),
        name: cleanName,
        status,
        visible,
        summary: summary.trim(),
        overview: overview.trim(),
      });
      onClose();
      return;
    }
    const cleanSummary = summary.trim();
    const cleanOverview = overview.trim();
    onSave(pillar.id, {
      status,
      visible,
      summary: cleanSummary && cleanSummary !== defaults.summary ? cleanSummary : "",
      overview: pillar.page && cleanOverview && cleanOverview !== defaults.overview ? cleanOverview : "",
    });
    onClose();
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <DialogTitle className="text-base font-bold text-gray-900">
            {isNew ? t("admin.piliers.modal.createTitle") : text.name}
          </DialogTitle>
          {!isNew && <p className="mt-0.5 text-xs text-gray-500">{t(`admin.piliers.groups.${pillar.group}`)}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("admin.piliers.modal.close")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <XMarkIcon aria-hidden="true" className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {custom && (
          <Field label={t("admin.piliers.modal.name")}>
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("admin.piliers.modal.namePlaceholder")}
              maxLength={80}
              required
              autoFocus={isNew}
            />
          </Field>
        )}

        {isNew && (
          <Field label={t("admin.piliers.modal.group")}>
            <Select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              options={pillarGroups.map((entry) => ({
                value: entry.key,
                label: `${entry.number} · ${t(`membre.piliers.groups.${entry.key}.title`)}`,
              }))}
            />
          </Field>
        )}

        <Field label={t("admin.piliers.modal.status")}>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={pillarStatuses.map((value) => ({ value, label: t(`piliers.status.${value}`) }))}
          />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">{t("admin.piliers.modal.visible")}</p>
            <p className="text-xs text-gray-500">{t("admin.piliers.modal.visibleHint")}</p>
          </div>
          <Toggle checked={visible} onChange={setVisible} label={t("admin.piliers.modal.visible")} />
        </div>

        <label className="block text-xs font-semibold text-gray-500">
          {t("admin.piliers.modal.summary")}
          <textarea
            rows={2}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className={`mt-1 ${TEXTAREA_CLASS}`}
          />
        </label>

        {(pillar.page || custom) && (
          <label className="block text-xs font-semibold text-gray-500">
            {t("admin.piliers.modal.overview")}
            <textarea
              rows={7}
              value={overview}
              onChange={(event) => setOverview(event.target.value)}
              className={`mt-1 ${TEXTAREA_CLASS}`}
            />
          </label>
        )}
        <p className="text-[11px] text-gray-400">
          {t(custom ? "admin.piliers.modal.customHint" : "admin.piliers.modal.textHint")}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {customized ? (
            <button
              type="button"
              onClick={() => {
                onResetTexts(pillar.id);
                onClose();
              }}
              className="text-xs font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-800"
            >
              {t("admin.piliers.modal.resetTexts")}
            </button>
          ) : custom && !isNew ? (
            confirmingDelete ? (
              <span className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onDelete(pillar.id);
                    onClose();
                  }}
                  className="font-semibold text-red-600 underline underline-offset-2 hover:text-red-800"
                >
                  {t("admin.piliers.modal.deleteConfirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="font-semibold text-gray-500 hover:text-gray-800"
                >
                  {t("admin.piliers.modal.cancel")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold text-red-600 underline underline-offset-2 hover:text-red-800"
              >
                {t("admin.piliers.modal.delete")}
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t("admin.piliers.modal.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#52A2DF] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t(isNew ? "admin.piliers.modal.create" : "admin.piliers.modal.save")}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
