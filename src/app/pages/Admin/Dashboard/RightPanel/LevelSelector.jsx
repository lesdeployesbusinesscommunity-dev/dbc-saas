// Import Dependencies
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { tontineLevels } from "../mockData";

// ----------------------------------------------------------------------

// Sélecteur "Niveau X" en pilule, réutilisé par la liste des bénéficiaires
// de la tontine et par le carrousel des formations.
export function LevelSelector({ level, onChange, disabled }) {
  const { t } = useTranslation();

  return (
    <Listbox value={level} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          className={clsx(
            "flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-black/5",
            disabled && "opacity-50",
          )}
        >
          {t("admin.dashboard.level", { n: level })}
          <ChevronUpDownIcon aria-hidden="true" className="size-3.5 text-gray-400" />
        </ListboxButton>
        <ListboxOptions
          anchor={{ to: "bottom end", gap: 6 }}
          className="z-20 max-h-56 w-32 overflow-auto rounded-lg bg-white py-1 text-xs shadow-lg ring-1 ring-black/5"
        >
          {tontineLevels.map((lvl) => (
            <ListboxOption
              key={lvl}
              value={lvl}
              className={({ focus, selected }) =>
                clsx(
                  "cursor-pointer px-3 py-1.5",
                  selected && "font-semibold text-[#52A2DF]",
                  focus && !selected && "bg-[#52A2DF]/[0.1]",
                )
              }
            >
              {t("admin.dashboard.level", { n: lvl })}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
