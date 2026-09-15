// Import Dependencies
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Boîte de confirmation générique, utilisée avant "Mettre à jour",
// "Désactiver"/"Réactiver" et "Supprimer" dans le menu "..." d'une ligne
// (voir Membres/index.jsx pour le détail de chaque action, y compris le
// texte de "title"/"description"/"confirmLabel", déjà traduit côté
// appelant). "tone=danger" (suppression, désactivation) passe le bouton
// de confirmation en rouge.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={clsx(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                tone === "danger" ? "bg-red-50 text-red-600" : "bg-orange-50 text-[#EE7115]",
              )}
            >
              <ExclamationTriangleIcon className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-sm font-bold text-gray-900">{title}</DialogTitle>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("admin.membres.confirm.cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={clsx(
                "rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90",
                tone === "danger" ? "bg-red-600" : "bg-[#EE7115]",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
