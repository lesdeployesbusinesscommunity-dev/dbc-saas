// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { levels } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------

const EMPTY_CHAPTER = () => ({ title: "", objectives: [""] });

// Unités disponibles pour la durée — l'admin choisit une valeur + une
// unité (plutôt qu'un texte libre), composées ensuite en une chaîne
// grammaticalement correcte (ex: "1 semaine" / "4 semaines") au moment
// de l'enregistrement — voir formatDuration ci-dessous.
const DURATION_UNITS = ["jours", "semaines", "mois", "annees"];

const EMPTY_FORM = () => ({
  name: "",
  trainer: "",
  durationValue: "",
  durationUnit: "semaines",
  startDate: "",
  posterPreview: "",
  globalObjectives: [""],
  chapters: [EMPTY_CHAPTER()],
  outcomes: [""],
});

function formatDuration(value, unit, t) {
  const count = Number(value) || 0;
  return `${count} ${t(`admin.formation.modal.durationUnits.${unit}`, { count })}`;
}

// Une "objectif" = une ligne de texte parmi d'autres, qu'on peut ajouter
// ou retirer librement — réutilisé pour les objectifs globaux, les
// objectifs d'un chapitre, et "le membre sera capable de".
function DynamicListField({ label, items, onChange, placeholder, addLabel, t }) {
  const updateItem = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => onChange([...items, ""]);

  return (
    <div>
      {label && <p className="text-xs font-semibold text-gray-500">{label}</p>}
      <div className="mt-1.5 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder={placeholder}
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={t("admin.formation.modal.removeObjective")}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
              >
                <XMarkIcon aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#52A2DF] hover:underline"
      >
        <PlusIcon aria-hidden="true" className="size-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

// Formulaire "Ajouter une formation" : nom, image, durée, date de début,
// niveau, puis la structure complète de la fiche détaillée qui s'ouvrira
// au clic sur la carte (voir TrainingDetailsModal.jsx) — objectifs
// globaux, un nombre libre de chapitres (chacun avec son titre et ses
// propres objectifs), et ce que le membre saura faire à l'issue de la
// formation. Rien n'est envoyé au backend pour l'instant : "onSubmit" ne
// fait que mettre à jour l'état local de la page (voir Formation/index.jsx).
export function AddTrainingModal({ open, defaultLevel, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [level, setLevel] = useState(defaultLevel ?? levels[0].key);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM());
    setLevel(defaultLevel ?? levels[0].key);
  }, [open, defaultLevel]);

  const updateField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => {
      if (prev.posterPreview) URL.revokeObjectURL(prev.posterPreview);
      return { ...prev, posterPreview: URL.createObjectURL(file) };
    });
  };

  const updateChapterTitle = (index, value) =>
    setForm((prev) => {
      const chapters = [...prev.chapters];
      chapters[index] = { ...chapters[index], title: value };
      return { ...prev, chapters };
    });

  const updateChapterObjectives = (index, objectives) =>
    setForm((prev) => {
      const chapters = [...prev.chapters];
      chapters[index] = { ...chapters[index], objectives };
      return { ...prev, chapters };
    });

  const addChapter = () =>
    setForm((prev) => ({ ...prev, chapters: [...prev.chapters, EMPTY_CHAPTER()] }));

  const removeChapter = (index) =>
    setForm((prev) => ({ ...prev, chapters: prev.chapters.filter((_, i) => i !== index) }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanList = (list) => list.map((item) => item.trim()).filter(Boolean);

    onSubmit(level, {
      name: form.name.trim(),
      trainer: form.trainer.trim(),
      duration: formatDuration(form.durationValue, form.durationUnit, t),
      startDate: form.startDate,
      poster: form.posterPreview || "/former.jpg",
      progress: 0,
      objectives: {
        global: cleanList(form.globalObjectives),
        chapters: form.chapters
          .map((chapter) => ({
            title: chapter.title.trim(),
            objectives: cleanList(chapter.objectives),
          }))
          .filter((chapter) => chapter.title || chapter.objectives.length > 0),
        outcomes: cleanList(form.outcomes),
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <DialogTitle className="text-base font-bold text-gray-900">
              {t("admin.formation.modal.addTitle")}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.formation.modal.close")}
              className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.formation.modal.name")}
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={updateField("name")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.formation.modal.trainer")}
                  <input
                    type="text"
                    required
                    value={form.trainer}
                    onChange={updateField("trainer")}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                  />
                </label>
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    {t("admin.formation.modal.level")}
                  </p>
                  <select
                    value={level}
                    onChange={(event) => setLevel(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.key} value={lvl.key}>
                        {t(`simulateur.levels.${lvl.key}.name`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    {t("admin.formation.modal.duration")}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.durationValue}
                      onChange={updateField("durationValue")}
                      className="block w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                    />
                    <select
                      value={form.durationUnit}
                      onChange={updateField("durationUnit")}
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                    >
                      {DURATION_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {t(`admin.formation.modal.durationUnits.${unit}`, { count: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.formation.modal.startDate")}
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={updateField("startDate")}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                  />
                </label>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">
                  {t("admin.formation.modal.image")}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    {form.posterPreview && (
                      <img
                        src={form.posterPreview}
                        alt=""
                        aria-hidden="true"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  {t("admin.formation.modal.imageHint")}
                </p>
              </div>

              <div className="rounded-2xl bg-[#52A2DF]/[0.06] p-4">
                <DynamicListField
                  label={t("admin.formation.modal.globalObjectives")}
                  items={form.globalObjectives}
                  onChange={(items) => setForm((prev) => ({ ...prev, globalObjectives: items }))}
                  placeholder={t("admin.formation.modal.objectivePlaceholder")}
                  addLabel={t("admin.formation.modal.addObjective")}
                  t={t}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">
                  {t("admin.formation.modal.chaptersSection")}
                </p>
                <div className="mt-2 space-y-3">
                  {form.chapters.map((chapter, index) => (
                    <div key={index} className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start gap-2">
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(event) => updateChapterTitle(index, event.target.value)}
                          placeholder={t("admin.formation.modal.chapterTitlePlaceholder")}
                          className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-[#EE7115]"
                        />
                        {form.chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChapter(index)}
                            aria-label={t("admin.formation.modal.removeChapter")}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500"
                          >
                            <XMarkIcon aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-3">
                        <DynamicListField
                          label={t("admin.formation.modal.chapterObjectives")}
                          items={chapter.objectives}
                          onChange={(items) => updateChapterObjectives(index, items)}
                          placeholder={t("admin.formation.modal.objectivePlaceholder")}
                          addLabel={t("admin.formation.modal.addObjective")}
                          t={t}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addChapter}
                  className="mt-3 flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  <PlusIcon aria-hidden="true" className="size-3.5" />
                  {t("admin.formation.modal.addChapter")}
                </button>
              </div>

              <div className="rounded-2xl bg-green-50 p-4">
                <DynamicListField
                  label={t("admin.formation.modal.outcomes")}
                  items={form.outcomes}
                  onChange={(items) => setForm((prev) => ({ ...prev, outcomes: items }))}
                  placeholder={t("admin.formation.modal.objectivePlaceholder")}
                  addLabel={t("admin.formation.modal.addObjective")}
                  t={t}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("admin.formation.modal.cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("admin.formation.modal.add")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
