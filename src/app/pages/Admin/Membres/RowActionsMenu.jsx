// Import Dependencies
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  EyeIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

function Item({ icon: Icon, label, onClick, tone = "default", disabled = false, title }) {
  const tones = {
    default: { text: "text-gray-700", focus: "bg-[#52A2DF]/[0.1] text-[#52A2DF]" },
    leader: { text: "text-[#EE7115]", focus: "bg-orange-50" },
    green: { text: "text-green-600", focus: "bg-green-50" },
    amber: { text: "text-amber-600", focus: "bg-amber-50" },
    red: { text: "text-red-600", focus: "bg-red-50" },
  };
  const style = tones[tone];
  return (
    <MenuItem disabled={disabled}>
      {({ focus }) => (
        <button
          type="button"
          onClick={onClick}
          title={title}
          className={clsx(
            "flex w-full items-center gap-2 px-3 py-2 text-left",
            style.text,
            focus && style.focus,
            disabled && "cursor-not-allowed opacity-40",
          )}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {label}
        </button>
      )}
    </MenuItem>
  );
}

// Menu "..." de chaque ligne, rangé en trois blocs : consulter / modifier,
// fonction de leader (nommer, modifier, destituer — "Nommer" n'est possible
// que pour un membre actif), puis état du compte et suppression. "Mettre à
// jour", les changements d'état et "Supprimer" ouvrent une confirmation
// avant de s'exécuter (voir Membres/index.jsx) ; "Voir" ouvre directement
// la fiche, sans confirmation puisque c'est de la lecture.
export function RowActionsMenu({
  status,
  isLeader,
  onUpdate,
  onView,
  onToggleStatus,
  onDelete,
  onAppoint,
  onEditLeader,
  onDismissLeader,
}) {
  const { t } = useTranslation();
  const isDeactivated = status === "desactive";
  const isPending = status === "attente";

  const toggle = isPending
    ? { icon: CheckCircleIcon, label: t("admin.membres.rowMenu.activate"), tone: "green" }
    : isDeactivated
      ? { icon: CheckCircleIcon, label: t("admin.membres.rowMenu.reactivate"), tone: "green" }
      : { icon: NoSymbolIcon, label: t("admin.membres.rowMenu.deactivate"), tone: "amber" };

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
        className="z-20 w-60 divide-y divide-gray-100 rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        <div className="py-1">
          <Item icon={EyeIcon} label={t("admin.membres.rowMenu.view")} onClick={onView} />
          <Item icon={PencilSquareIcon} label={t("admin.membres.rowMenu.update")} onClick={onUpdate} />
        </div>

        <div className="py-1">
          {isLeader ? (
            <>
              <Item
                icon={ShieldCheckIcon}
                label={t("admin.membres.rowMenu.editLeader")}
                onClick={onEditLeader}
                tone="leader"
              />
              <Item
                icon={ShieldExclamationIcon}
                label={t("admin.membres.rowMenu.dismissLeader")}
                onClick={onDismissLeader}
                tone="red"
              />
            </>
          ) : (
            <Item
              icon={ShieldCheckIcon}
              label={t("admin.membres.rowMenu.appointLeader")}
              onClick={onAppoint}
              tone="leader"
              disabled={status !== "actif"}
              title={status !== "actif" ? t("admin.membres.rowMenu.mustBeActive") : undefined}
            />
          )}
        </div>

        <div className="py-1">
          <Item icon={toggle.icon} label={toggle.label} onClick={onToggleStatus} tone={toggle.tone} />
          <Item icon={TrashIcon} label={t("admin.membres.rowMenu.delete")} onClick={onDelete} tone="red" />
        </div>
      </MenuItems>
    </Menu>
  );
}
