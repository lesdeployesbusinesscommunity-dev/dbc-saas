// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { creerFormation } from "api/formations";

// ----------------------------------------------------------------------

// Formulaire d'ajout d'une formation — code, titre, niveau requis et
// pilier : exactement ce que POST /formations accepte (voir
// api/formations.js). Pas de formateur/date/durée/objectifs : le backend
// n'a pas cette notion pour l'instant (voir mémoire
// "project_frontend_backend_ecart_admin") — pour ajouter du contenu à une
// formation (modules, leçons, quiz), voir le module 7 (LMS) côté backend,
// pas encore exposé dans cet écran admin.
export function AddTrainingModal({ open, niveaux, piliers, defaultLevelId, onClose, onCreated }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ code: "", title: "", requiredLevelId: "", pillarCode: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        code: "",
        title: "",
        requiredLevelId: defaultLevelId ?? niveaux[0]?.id ?? "",
        pillarCode: piliers[0]?.code ?? "",
      });
      setError("");
    }
  }, [open, niveaux, piliers, defaultLevelId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.title.trim()) {
      setError("Le code et le titre sont requis");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await creerFormation({
        code: form.code.trim(),
        title: form.title.trim(),
        requiredLevelId: Number(form.requiredLevelId),
        pillarCode: form.pillarCode,
      });
      onCreated();
    } catch (err) {
      setError(
        err.message === "api.errors.validation" ? "Informations invalides" : "Impossible de créer la formation",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-sm font-bold text-gray-900">{t("admin.formation.modal.addTitle")}</DialogTitle>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Code
              <input
                type="text"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="ex : ecole-des-affaires"
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Titre
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Niveau requis
              <select
                value={form.requiredLevelId}
                onChange={(event) => setForm((prev) => ({ ...prev, requiredLevelId: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              >
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Pilier
              <select
                value={form.pillarCode}
                onChange={(event) => setForm((prev) => ({ ...prev, pillarCode: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
              >
                {piliers.map((pilier) => (
                  <option key={pilier.code} value={pilier.code}>
                    {pilier.name}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                {error}
              </span>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("admin.formation.modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
                {t("admin.formation.modal.add")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
