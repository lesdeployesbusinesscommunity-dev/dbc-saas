// Import Dependencies
import { useState } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDownIcon, GlobeAltIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Sélecteur de pays de "Gestion du réseau" : tous les pays de la liste
// sont sélectionnables (voir mockData.networkCountries, complétée par les
// pays ajoutés à la volée — voir "countries", passé par Reseau/index.jsx
// depuis useNetworkData().allCountries) — le petit point vert/gris à
// droite de chacun indique juste si son réseau a déjà été démarré ou non,
// pour que l'admin sache où concentrer ses efforts sans avoir à cliquer
// sur chacun.
//
// En bas de la liste, un champ libre permet d'ajouter un pays qui n'y
// figure pas encore : "onAddCountry" (voir NetworkDataContext.addCountry)
// l'ajoute à la liste et renvoie le nom à sélectionner — s'il correspondait
// déjà à un pays existant (accents/casse/tirets tolérés), c'est ce pays
// existant qui est sélectionné plutôt qu'un doublon créé.
export function CountrySwitcher({ countries, value, onChange, hasNetwork, onAddCountry }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState(null); // { type: "existing" | "added", name } | null

  const submitDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const result = onAddCountry(trimmed);
    if (!result) return;
    onChange(result.name);
    setDraft("");
    setFeedback({ type: result.isNew ? "added" : "existing", name: result.name });
  };

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
          className="z-20 mt-2 flex w-64 flex-col overflow-hidden rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 [--anchor-gap:6px]"
        >
          <div className="max-h-64 overflow-y-auto">
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
          </div>

          {/* Pas des ListboxOption : un champ libre, pas un choix parmi la
              liste — on bloque la propagation des clics/touches pour que le
              clavier de Headless UI (navigation par flèches, etc.) ne
              vienne pas interférer avec la saisie. */}
          <div
            className="mt-1.5 shrink-0 border-t border-gray-100 p-1.5"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setFeedback(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitDraft();
                  }
                }}
                placeholder={t("admin.reseau.countrySwitcher.addPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#52A2DF]"
              />
              <button
                type="button"
                onClick={submitDraft}
                aria-label={t("admin.reseau.countrySwitcher.addButton")}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#52A2DF]/[0.1] text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.18]"
              >
                <PlusIcon aria-hidden="true" className="size-4" />
              </button>
            </div>

            {feedback ? (
              <p className="mt-1.5 px-0.5 text-xs text-gray-500">
                {feedback.type === "existing"
                  ? t("admin.reseau.countrySwitcher.alreadyExists", { country: feedback.name })
                  : t("admin.reseau.countrySwitcher.addHint")}
              </p>
            ) : null}
          </div>
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
