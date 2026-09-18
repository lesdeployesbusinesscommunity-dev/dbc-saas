// Import Dependencies
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDownIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Sélecteur de pays de "Gestion du réseau" : tous les pays de la liste
// sont sélectionnables (voir mockData.networkCountries) — le petit point
// vert/gris à droite de chacun indique juste si son réseau a déjà été
// démarré ou non, pour que l'admin sache où concentrer ses efforts sans
// avoir à cliquer sur chacun.
export function CountrySwitcher({ countries, value, onChange, hasNetwork }) {
  const { t } = useTranslation();

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className="flex items-center gap-2.5 rounded-xl bg-[#52A2DF]/[0.1] px-4 py-2.5 text-base font-extrabold italic text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.16]">
          <GlobeAltIcon aria-hidden="true" className="size-5 not-italic" />
          {value}
          <ChevronDownIcon aria-hidden="true" className="size-4 not-italic" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom start"
          className="z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 [--anchor-gap:6px]"
        >
          {countries.map((country) => {
            const active = hasNetwork(country);
            return (
              <ListboxOption
                key={country}
                value={country}
                className={({ focus, selected }) =>
                  clsx(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    focus && "bg-gray-50",
                    selected ? "font-bold text-[#52A2DF]" : "text-gray-700",
                  )
                }
              >
                <span className="truncate">{country}</span>
                <span
                  aria-hidden="true"
                  title={active ? t("admin.reseau.hasNetwork") : t("admin.reseau.noNetworkYet")}
                  className={clsx(
                    "size-1.5 shrink-0 rounded-full",
                    active ? "bg-[#16A34A]" : "bg-gray-300",
                  )}
                />
              </ListboxOption>
            );
          })}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
