// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { ConfirmDialog } from "../Membres/ConfirmDialog";

// ----------------------------------------------------------------------

// Confirmation avant de destituer le responsable d'une branche : le poste
// redevient vacant (la branche, son nom et sa localisation restent), et on
// peut y assigner quelqu'un d'autre ensuite en cliquant sur le poste.
export function DismissMemberDialog({ target, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <ConfirmDialog
      open={Boolean(target)}
      title={t("admin.reseau.dismiss.title", { name: target?.memberName ?? "" })}
      description={t("admin.reseau.dismiss.description", {
        branch: target?.branchName || target?.levelName || "",
      })}
      confirmLabel={t("admin.reseau.dismiss.confirm")}
      tone="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// Confirmation avant de supprimer une branche. S'il y a des sous-branches en
// dessous, l'admin choisit : les conserver (elles remontent d'un niveau sous
// la branche parente — choix par défaut, le moins destructeur) ou les
// supprimer avec elle. "target" = { branchName, memberName, directBranches,
// totalDescendants }.
export function DeleteBranchDialog({ target, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [keepChildren, setKeepChildren] = useState(true);

  useEffect(() => {
    if (target) setKeepChildren(true);
  }, [target]);

  const hasChildren = (target?.directBranches ?? 0) > 0;

  return (
    <Dialog open={Boolean(target)} onClose={onCancel} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
            >
              <TrashIcon className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-sm font-bold text-gray-900">
                {t("admin.reseau.delete.title", { name: target?.branchName ?? "" })}
              </DialogTitle>
              <p className="mt-1 text-sm text-gray-500">
                {target?.memberName
                  ? t("admin.reseau.delete.descriptionMember", { member: target.memberName })
                  : t("admin.reseau.delete.description")}
              </p>
            </div>
          </div>

          {hasChildren && (
            <fieldset className="mt-5 space-y-2">
              <legend className="text-xs font-semibold text-gray-500">
                {t("admin.reseau.delete.childrenLegend", { count: target.directBranches })}
              </legend>
              {[
                { value: true, key: "keepChildren" },
                { value: false, key: "deleteChildren" },
              ].map((option) => (
                <label
                  key={option.key}
                  className={clsx(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition-colors",
                    keepChildren === option.value
                      ? option.value
                        ? "border-[#52A2DF] bg-[#52A2DF]/[0.06]"
                        : "border-red-300 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <input
                    type="radio"
                    name="delete-children"
                    checked={keepChildren === option.value}
                    onChange={() => setKeepChildren(option.value)}
                    className="mt-0.5 accent-[#EE7115]"
                  />
                  <span>
                    <span className="block font-semibold text-gray-900">
                      {t(`admin.reseau.delete.${option.key}`)}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {option.value
                        ? t("admin.reseau.delete.keepChildrenHint")
                        : t("admin.reseau.delete.deleteChildrenHint", {
                            count: target.totalDescendants,
                          })}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

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
              onClick={() => onConfirm({ keepChildren })}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("admin.reseau.delete.confirm")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
