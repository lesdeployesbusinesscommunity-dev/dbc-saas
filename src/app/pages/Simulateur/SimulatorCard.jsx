// Import Dependencies
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronDownIcon, GiftIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { formatMoney } from "./data";

// ----------------------------------------------------------------------

// Carte principale du simulateur : choix du niveau (menu déroulant, la
// flèche bascule bas/haut à l'ouverture) + nombre de filleuls amenés par
// mois (curseur 0-36), puis 4 chiffres recalculés en direct et la liste
// des avantages inclus au niveau choisi. Toutes les teintes de fond de
// cette page sont à 10% d'opacité ("/[0.1]").
export function SimulatorCard({
  levels,
  selectedLevel,
  onSelectLevel,
  filleuls,
  onFilleulsChange,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  const cotisationMensuelle = selectedLevel.cotisation;
  const cagnotteRecue = selectedLevel.cagnotte;
  // Commissions MLM/an = nombre de filleuls amenés × commission du niveau × 12.
  const commissionsAnnuelles = filleuls * selectedLevel.commission * 12;
  const revenuTotal = cagnotteRecue + commissionsAnnuelles;

  const levelName = (level) => t(`simulateur.levels.${level.key}.name`);
  const advantages = t(`simulateur.levels.${selectedLevel.key}.advantages`, {
    returnObjects: true,
  });

  return (
    <div className="rounded-xl border-2 border-[#52A2DF]/[0.1] p-6 sm:p-8">
      <h2 className="text-lg font-bold text-gray-900">
        {t("simulateur.title")}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{t("simulateur.subtitle")}</p>

      {/* Sélecteurs : niveau + filleuls/mois */}
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Menu déroulant du niveau */}
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <label className="shrink-0 text-sm text-gray-600">
            {t("simulateur.levelLabel")}
          </label>
          <Listbox value={selectedLevel} onChange={onSelectLevel}>
            {({ open }) => (
              <div className="relative w-72 max-w-full">
                <ListboxButton className="flex w-full items-center justify-between rounded-lg border border-[#EE7115]/40 bg-[#EE7115]/[0.1] px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors">
                  <span className="flex min-w-0 items-center gap-1.5 truncate">
                    <selectedLevel.Icon
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    {levelName(selectedLevel)} –{" "}
                    {formatMoney(selectedLevel.cotisation, locale)}
                    {t("simulateur.perMonth")}
                  </span>
                  <ChevronDownIcon
                    className={clsx(
                      "size-5 shrink-0 text-[#EE7115] transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </ListboxButton>
                <Transition
                  enter="transition ease-out duration-150"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <ListboxOptions className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg outline-none">
                    {levels.map((level) => (
                      <ListboxOption
                        key={level.key}
                        value={level}
                        className={({ focus, selected }) =>
                          clsx(
                            "cursor-pointer select-none px-4 py-2 text-sm transition-colors",
                            focus && "bg-gray-100",
                            selected
                              ? clsx("font-semibold", level.textClass)
                              : "text-gray-700",
                          )
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          <level.Icon
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          {levelName(level)} –{" "}
                          {formatMoney(level.cotisation, locale)}
                          {t("simulateur.perMonth")}
                        </span>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            )}
          </Listbox>
        </div>

        {/* Curseur filleuls/mois */}
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <label className="shrink-0 text-sm text-gray-600">
            {t("simulateur.filleulsLabel")}
          </label>
          <div className="flex w-56 max-w-full items-center gap-3">
            <input
              type="range"
              min={0}
              max={36}
              step={1}
              value={filleuls}
              onChange={(event) =>
                onFilleulsChange(Number(event.target.value))
              }
              className="w-full accent-[#52A2DF]"
            />
            <span className="w-6 shrink-0 text-sm font-semibold text-gray-800">
              {filleuls}
            </span>
          </div>
        </div>
      </div>

      {/* 4 chiffres calculés */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#52A2DF]/[0.1] bg-[#52A2DF]/[0.1] p-4">
          <p className="text-lg font-bold text-[#16A34A] sm:text-xl">
            {formatMoney(cotisationMensuelle, locale)}
            {t("simulateur.perMonth")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("simulateur.cotisationLabel")}
          </p>
        </div>
        <div className="rounded-lg border border-[#52A2DF]/[0.1] bg-[#52A2DF]/[0.1] p-4">
          <p className="text-lg font-bold text-[#E11D48] sm:text-xl">
            {formatMoney(cagnotteRecue, locale)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("simulateur.cagnotteLabel")}
          </p>
        </div>
        <div className="rounded-lg border border-[#52A2DF]/[0.1] bg-[#52A2DF]/[0.1] p-4">
          <p className="text-lg font-bold text-[#EE7115] sm:text-xl">
            {formatMoney(commissionsAnnuelles, locale)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("simulateur.commissionsLabel", { count: filleuls })}
          </p>
        </div>
        <div className="rounded-lg border border-[#52A2DF]/[0.1] bg-[#52A2DF]/[0.1] p-4">
          <p className="text-lg font-bold text-[#7C3AED] sm:text-xl">
            {formatMoney(revenuTotal, locale)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("simulateur.revenuLabel")}
          </p>
        </div>
      </div>

      {/* Avantages inclus au niveau choisi */}
      <div className="mt-6 rounded-xl border border-[#EE7115]/[0.1] bg-[#EE7115]/[0.1] p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <GiftIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
          {t("simulateur.advantagesTitle")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {advantages.map((advantage) => (
            <span
              key={advantage}
              className={clsx(
                "rounded-full border bg-white px-3 py-1 text-xs font-medium",
                selectedLevel.borderClass,
                selectedLevel.textClass,
              )}
            >
              ✓ {advantage}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
