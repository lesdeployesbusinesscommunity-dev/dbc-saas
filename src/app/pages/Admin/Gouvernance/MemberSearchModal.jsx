// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { levels } from "app/pages/Simulateur/data";
import { allMembers } from "./mockData";

// ----------------------------------------------------------------------

// Popover d'assignation d'un poste de gouvernance (Comité Exécutif, ou
// binôme d'un chapitre/antenne) : recherche + filtres pays/niveau dans le
// même bottin que "Gestion des membres", puis on choisit un membre
// existant — pas de création ici, contrairement à "Ajouter une branche"
// dans Gestion du réseau, un poste de gouvernance n'a pas de nom propre à
// saisir, juste un titulaire à choisir.
export function MemberSearchModal({ open, seatTitle, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setCountryFilter("all");
    setLevelFilter("all");
    setSelectedId(null);
  }, [open]);

  const countryOptions = useMemo(
    () =>
      Array.from(new Set(allMembers.map((member) => member.country))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allMembers.filter((member) => {
      if (countryFilter !== "all" && member.country !== countryFilter) return false;
      if (levelFilter !== "all" && member.levelKey !== levelFilter) return false;
      if (
        query &&
        !(
          member.name.toLowerCase().includes(query) ||
          member.matricule.toLowerCase().includes(query)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [search, countryFilter, levelFilter]);

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(selectedId);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900">
              {t("admin.gouvernance.assignModal.title", { seat: seatTitle })}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-5 flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[160px] flex-1">
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("admin.reseau.picker.searchPlaceholder")}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#52A2DF]"
                />
              </div>
              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
              >
                <option value="all">{t("admin.reseau.picker.allCountries")}</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
              >
                <option value="all">{t("admin.reseau.picker.allLevels")}</option>
                {levels.map((level) => (
                  <option key={level.key} value={level.key}>
                    {t(`simulateur.levels.${level.key}.name`)}
                  </option>
                ))}
              </select>
            </div>

            <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
              {results.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-400">
                  {t("admin.reseau.picker.noResults")}
                </li>
              )}
              {results.map((member) => {
                const selected = member.id === selectedId;
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(member.id)}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                        selected ? "bg-[#52A2DF]/[0.12] ring-1 ring-[#52A2DF]" : "hover:bg-gray-50",
                      )}
                    >
                      <Avatar name={member.name} src={member.photo} size="size-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-900">
                          {member.name}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {member.matricule} · {member.city}, {member.country}
                        </span>
                      </span>
                      {selected && (
                        <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-[#52A2DF]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("admin.membres.modal.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedId}
              className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("admin.reseau.picker.confirmAssign")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
