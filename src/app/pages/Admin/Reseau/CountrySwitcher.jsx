// Import Dependencies
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDownIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Sélecteur de pays de "Gestion du réseau" : la liste ne contient que les
// pays où des membres réels existent (voir Reseau/index.jsx, dérivée de
// GET /membres) — pas de pays ajouté "à la volée" par l'admin, ça n'aurait
// aucune donnée à afficher derrière.
export function CountrySwitcher({ countries, value, onChange }) {
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
          className="z-20 mt-2 flex max-h-64 w-64 flex-col overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 [--anchor-gap:6px]"
        >
          {countries.map((country) => (
            <ListboxOption
              key={country}
              value={country}
              className={({ focus, selected }) =>
                clsx(
                  "cursor-pointer truncate rounded-lg px-3 py-2 text-sm transition-colors",
                  focus && "bg-gray-50",
                  selected ? "font-bold text-[#52A2DF]" : "text-gray-700",
                )
              }
            >
              {country}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
