// Import Dependencies
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  EyeIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Menu "..." de chaque ligne du tableau : mettre à jour, voir, activer/
// désactiver, supprimer. "Mettre à jour", "Désactiver"/"Réactiver" et
// "Supprimer" ouvrent chacun une confirmation avant de s'exécuter (voir
// Membres/index.jsx) ; "Voir" ouvre directement la fiche du membre, sans
// confirmation puisque c'est juste de la lecture.
export function RowActionsMenu({ status, onUpdate, onView, onToggleStatus, onDelete }) {
  const { t } = useTranslation();
  const isDeactivated = status === "desactive";

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        aria-label={t("admin.membres.rowMenu.actions")}
        className="flex size-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 6 }}
        className="z-20 w-48 rounded-xl bg-white py-1.5 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={onUpdate}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-2 text-gray-700",
                focus && "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
              )}
            >
              <PencilSquareIcon aria-hidden="true" className="size-4" />
              {t("admin.membres.rowMenu.update")}
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={onView}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-2 text-gray-700",
                focus && "bg-[#52A2DF]/[0.1] text-[#52A2DF]",
              )}
            >
              <EyeIcon aria-hidden="true" className="size-4" />
              {t("admin.membres.rowMenu.view")}
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={onToggleStatus}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-2",
                isDeactivated ? "text-green-600" : "text-amber-600",
                focus && (isDeactivated ? "bg-green-50" : "bg-amber-50"),
              )}
            >
              {isDeactivated ? (
                <CheckCircleIcon aria-hidden="true" className="size-4" />
              ) : (
                <NoSymbolIcon aria-hidden="true" className="size-4" />
              )}
              {isDeactivated
                ? t("admin.membres.rowMenu.reactivate")
                : t("admin.membres.rowMenu.deactivate")}
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={onDelete}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-2 text-red-600",
                focus && "bg-red-50",
              )}
            >
              <TrashIcon aria-hidden="true" className="size-4" />
              {t("admin.membres.rowMenu.delete")}
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
