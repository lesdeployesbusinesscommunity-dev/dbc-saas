// Import Dependencies
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  EyeIcon,
  TrashIcon,
  UserMinusIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

function Item({ icon: Icon, label, onClick, tone = "default" }) {
  const tones = {
    default: { text: "text-gray-700", focus: "bg-[#52A2DF]/[0.1] text-[#52A2DF]" },
    amber: { text: "text-amber-600", focus: "bg-amber-50" },
    red: { text: "text-red-600", focus: "bg-red-50" },
  };
  const style = tones[tone];
  return (
    <MenuItem>
      {({ focus }) => (
        <button
          type="button"
          onClick={onClick}
          className={clsx(
            "flex w-full items-center gap-2 px-3 py-2 text-left",
            style.text,
            focus && style.focus,
          )}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {label}
        </button>
      )}
    </MenuItem>
  );
}

// Menu "..." en haut à droite de chaque carte de l'arbre : consulter la fiche
// du responsable, le DESTITUER (le poste redevient vacant, la branche reste),
// ou SUPPRIMER la branche. Les deux dernières actions ouvrent une confirmation
// (voir BranchActionDialogs.jsx). La racine "National" ne peut pas être
// supprimée ; un poste vacant n'a personne à destituer — s'il n'y a aucune
// action possible, le menu n'est pas affiché.
export function NodeActionsMenu({ hasMember, canDelete, onView, onDismiss, onDelete }) {
  const { t } = useTranslation();
  if (!hasMember && !canDelete) return null;

  return (
    <Menu as="div" className="absolute right-0.5 top-0.5">
      <MenuButton
        aria-label={t("admin.reseau.actions.menu")}
        title={t("admin.reseau.actions.menu")}
        className="flex size-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 4 }}
        className="z-30 w-56 divide-y divide-gray-100 rounded-xl bg-white py-1 text-left text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        {hasMember && (
          <div className="py-1">
            <Item icon={EyeIcon} label={t("admin.reseau.viewMember")} onClick={onView} />
            <Item
              icon={UserMinusIcon}
              label={t("admin.reseau.actions.dismiss")}
              onClick={onDismiss}
              tone="amber"
            />
          </div>
        )}
        {canDelete && (
          <div className="py-1">
            <Item
              icon={TrashIcon}
              label={t("admin.reseau.actions.delete")}
              onClick={onDelete}
              tone="red"
            />
          </div>
        )}
      </MenuItems>
    </Menu>
  );
}
