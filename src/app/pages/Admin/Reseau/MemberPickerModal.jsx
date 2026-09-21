// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { levels } from "app/pages/Simulateur/data";
import { allMembers } from "./mockData";
import { COUNTRY_MAPS, normalizeRegionKey } from "./countryMaps";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------

// Popover (modale) utilisé pour trois actions de "Gestion du réseau" :
// - mode "assign" : un poste existe déjà mais est vacant -> on choisit
//   juste le membre qui l'occupe.
// - mode "create" : on crée une toute nouvelle branche -> on choisit une
//   branche de référence (modifiable, pas figée sur celle dont le "+" a été
//   cliqué) et son EMPLACEMENT par rapport à elle : "insertMode" = "child"
//   (en dessous, comportement historique) ou "above" (juste au-dessus —
//   insère un échelon intermédiaire, la référence devenant une sous-branche
//   de la nouvelle branche). On choisit ensuite son nom puis le membre qui
//   l'occupe, en une seule étape (annuler ne laisse donc jamais de branche
//   fantôme sans responsable ni de branche orpheline).
// - mode "createRoot" : premier poste (Superviseur National) d'un pays qui
//   n'a pas encore de réseau -> pas de branche de référence, juste le membre.
// Dans tous les cas, le choix du membre se fait dans le bottin de "Gestion
// des membres" (même source de données), avec recherche + filtres pays/niveau.
export function MemberPickerModal({
  open,
  mode,
  country,
  parentOptions,
  parentId,
  onParentChange,
  insertMode,
  onInsertModeChange,
  canInsertAbove,
  existingSiblingLabels = [],
  onClose,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [branchLabel, setBranchLabel] = useState("");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setBranchLabel("");
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
    // normalizeSearchText tolère accents/casse/tirets des deux côtés (voir
    // searchUtils.js) — un clavier réglé en anglais retrouve "Aïcha" en
    // tapant "aicha".
    const query = normalizeSearchText(search);
    return allMembers.filter((member) => {
      if (countryFilter !== "all" && member.country !== countryFilter) return false;
      if (levelFilter !== "all" && member.levelKey !== levelFilter) return false;
      if (
        query &&
        !(
          normalizeSearchText(member.name).includes(query) ||
          normalizeSearchText(member.matricule).includes(query)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [search, countryFilter, levelFilter]);

  const needsBranchLabel = mode === "create";
  const canConfirm = Boolean(selectedId) && (!needsBranchLabel || branchLabel.trim());
  const referenceDescription = parentOptions?.find((option) => option.id === parentId)?.description ?? "";

  // Suggestions de nom de branche : les régions connues du pays actif (si
  // sa carte existe, voir countryMaps.js) — un texte libre reste toujours
  // possible (ville, regroupement personnalisé...), ces noms n'apparaissent
  // qu'en suggestion, jamais en choix imposé. "isDuplicateLabel" avertit
  // (sans jamais bloquer, voir "canConfirm" ci-dessus, qui ne dépend pas de
  // ce calcul) si une branche du même nom existe déjà juste à cet endroit
  // de l'arbre (voir "existingSiblingLabels", calculé dans Reseau/index.jsx).
  const regionSuggestions = COUNTRY_MAPS[country]?.regionNames ?? [];
  const trimmedBranchLabel = branchLabel.trim();
  const isDuplicateLabel =
    trimmedBranchLabel.length > 0 &&
    existingSiblingLabels.some(
      (label) => normalizeRegionKey(label) === normalizeRegionKey(trimmedBranchLabel),
    );

  const title =
    mode === "createRoot"
      ? t("admin.reseau.picker.createRootTitle", { country })
      : needsBranchLabel
        ? t("admin.reseau.picker.createTitle")
        : t("admin.reseau.picker.assignTitle");

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      memberId: selectedId,
      label: needsBranchLabel ? branchLabel.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900">{title}</DialogTitle>
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
            {needsBranchLabel && parentOptions && parentOptions.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.reseau.picker.parentBranch")}
                  <select
                    value={parentId}
                    onChange={(event) => onParentChange(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                  >
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.description}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Emplacement : "en dessous" (comportement historique, la
                    nouvelle branche devient un enfant de la référence) ou
                    "au-dessus" (insère un échelon intermédiaire — la
                    référence devient une sous-branche de la nouvelle
                    branche). "Au-dessus" est désactivé sur la racine
                    National, qui ne peut rien recevoir par-dessus elle. */}
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("admin.reseau.picker.placement")}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={insertMode === "child"}
                    onClick={() => onInsertModeChange("child")}
                    className={clsx(
                      "flex-1 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      insertMode === "child"
                        ? "border-[#52A2DF] bg-[#52A2DF]/[0.08] text-[#52A2DF]"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50",
                    )}
                  >
                    {t("admin.reseau.picker.placementBelow")}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={insertMode === "above"}
                    disabled={!canInsertAbove}
                    onClick={() => onInsertModeChange("above")}
                    className={clsx(
                      "flex-1 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      !canInsertAbove
                        ? "cursor-not-allowed border-gray-100 text-gray-300"
                        : insertMode === "above"
                          ? "border-[#52A2DF] bg-[#52A2DF]/[0.08] text-[#52A2DF]"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50",
                    )}
                  >
                    {t("admin.reseau.picker.placementAbove")}
                  </button>
                </div>

                {/* Rappel explicite du résultat, qui change selon
                    l'emplacement choisi ci-dessus — une confusion facile à
                    faire sinon (choisir "en dessous" d'une Région crée une
                    Ville sous elle, pas une autre Région à côté). */}
                <span className="flex items-start gap-1.5 text-xs font-normal text-gray-500">
                  <ArrowRightIcon aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-[#52A2DF]" />
                  {insertMode === "above"
                    ? t("admin.reseau.picker.aboveHint", { target: referenceDescription })
                    : t("admin.reseau.picker.childHint", { parent: referenceDescription })}
                </span>
              </div>
            )}

            {needsBranchLabel && (
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.reseau.picker.branchName")}
                <input
                  type="text"
                  list={regionSuggestions.length > 0 ? "reseau-region-suggestions" : undefined}
                  value={branchLabel}
                  onChange={(event) => setBranchLabel(event.target.value)}
                  placeholder={t("admin.reseau.picker.branchNamePlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                />
                {regionSuggestions.length > 0 && (
                  <datalist id="reseau-region-suggestions">
                    {regionSuggestions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                )}
                {isDuplicateLabel && (
                  <span className="mt-1.5 flex items-start gap-1.5 text-xs font-normal text-amber-600">
                    <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    {t("admin.reseau.picker.duplicateWarning", { name: trimmedBranchLabel })}
                  </span>
                )}
              </label>
            )}

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
              disabled={!canConfirm}
              className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mode === "assign"
                ? t("admin.reseau.picker.confirmAssign")
                : t("admin.reseau.picker.confirmCreate")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
