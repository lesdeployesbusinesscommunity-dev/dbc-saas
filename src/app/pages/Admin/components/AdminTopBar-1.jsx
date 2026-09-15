// Import Dependencies
import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { LanguageToggle } from "components/shared/LanguageToggle";
import { currentAdmin } from "../currentAdmin";
import { Avatar } from "./Avatar";

// ----------------------------------------------------------------------

// En-tête réutilisable des pages admin qui n'ont pas de panneau latéral
// dédié (contrairement au Dashboard) : titre de la page, recherche,
// notifications et identité admin sur une seule ligne.
export function AdminTopBar({ title }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-lg font-bold italic text-gray-900">{title}</h1>

      <label className="relative w-full max-w-md flex-1 sm:flex-initial">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          placeholder={t("admin.topbar.searchPlaceholder")}
          className="w-full rounded-full border-0 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-[#52A2DF]"
        />
      </label>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <button
          type="button"
          aria-label={t("admin.topbar.notifications")}
          className="flex size-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-[#EE7115]"
        >
          <BellIcon aria-hidden="true" className="size-5" />
        </button>
        <div className="text-right leading-tight">
          <p className="text-sm font-bold text-gray-900">{currentAdmin.name}</p>
          <p className="text-xs text-gray-500">{currentAdmin.role}</p>
        </div>
        <Avatar name={currentAdmin.name} src={currentAdmin.photo} size="size-11" />
      </div>
    </div>
  );
}
