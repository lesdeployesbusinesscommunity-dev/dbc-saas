// Import Dependencies
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { switchSessionRole } from "./session";

// ----------------------------------------------------------------------

const itemClass = (active) =>
  clsx(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
    active ? "bg-gray-50 text-gray-900" : "text-gray-600",
  );

// Menu du profil, au bout de l'en-tête des espaces membre et admin : un
// clic sur la photo / le nom ouvre la carte du compte avec
// - un lien vers les Paramètres,
// - "Passer en mode admin" (côté membre) ou "Passer en mode membre" (côté
//   admin) : un administrateur est d'abord un membre, donc il passe d'un
//   espace à l'autre sans se reconnecter (voir switchSessionRole). Côté
//   membre, l'entrée n'apparaît que si le compte a ce droit ("canSwitch") ;
// - "Se déconnecter", qui demande d'abord confirmation (voir
//   LogoutConfirmDialog.jsx).
//
// "ns" : "membre" ou "admin" (textes sous "<ns>.profileMenu"). "switchTo" :
// { role, to } de l'espace vers lequel basculer, ou null pour ne pas
// proposer le changement.
export function ProfileMenu({ ns, name, subtitle, detail, photo, settingsTo, switchTo = null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleSwitch = () => {
    switchSessionRole(switchTo.role);
    navigate(switchTo.to);
  };

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton
          aria-label={t(`${ns}.profileMenu.open`)}
          className="group flex items-center gap-3 rounded-full bg-white py-1 pl-1 pr-2.5 shadow-sm outline-none ring-1 ring-black/5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#52A2DF] sm:pl-1.5 sm:pr-3"
        >
          <Avatar name={name} src={photo} size="size-9" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[10rem] truncate text-sm font-bold text-gray-900">{name}</span>
            <span className="block text-xs text-gray-500">{subtitle}</span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 text-gray-400 transition-transform group-data-[open]:rotate-180"
          />
        </MenuButton>

        <MenuItems
          anchor="bottom end"
          className="z-50 w-72 origin-top-right rounded-2xl bg-white p-2 shadow-xl outline-none ring-1 ring-black/5 [--anchor-gap:8px]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={name} src={photo} size="size-11" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{subtitle}</p>
              {detail && <p className="mt-0.5 truncate text-[11px] font-semibold text-[#EE7115]">{detail}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-gray-100" />

          <MenuItem>
            {({ focus }) => (
              <Link to={settingsTo} className={itemClass(focus)}>
                <Cog6ToothIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                {t(`${ns}.profileMenu.settings`)}
              </Link>
            )}
          </MenuItem>

          {switchTo && (
            <MenuItem>
              {({ focus }) => (
                <button type="button" onClick={handleSwitch} className={itemClass(focus)}>
                  <ArrowsRightLeftIcon aria-hidden="true" className="size-5 shrink-0 text-[#52A2DF]" />
                  <span className="min-w-0">
                    <span className="block">{t(`${ns}.profileMenu.switch`)}</span>
                    <span className="block text-xs font-normal text-gray-400">
                      {t(`${ns}.profileMenu.switchHint`)}
                    </span>
                  </span>
                </button>
              )}
            </MenuItem>
          )}

          <div className="my-1 h-px bg-gray-100" />
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={() => setConfirmingLogout(true)}
                className={clsx(itemClass(focus), focus ? "!bg-red-50 text-red-700" : "text-red-600")}
              >
                <ArrowRightOnRectangleIcon aria-hidden="true" className="size-5 shrink-0" />
                {t(`${ns}.profileMenu.logout`)}
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      <LogoutConfirmDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} ns={ns} />
    </>
  );
}
