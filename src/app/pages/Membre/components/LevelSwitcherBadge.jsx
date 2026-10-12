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
import { levels, formatMoney } from "app/pages/Simulateur/data";
import { useMemberLevel } from "../context/MemberLevelContext";

// ----------------------------------------------------------------------

// Badge de niveau cliquable, extrait de Dashboard/ProfileSummaryCard.jsx
// pour être réutilisé ailleurs (voir Tontine/index.jsx) — même bouton,
// même comportement, une seule définition. Un membre peut cotiser à
// plusieurs niveaux en même temps (ex: Starter ET Bâtisseur — voir
// currentMember.js : "levelKeys") : cliquer dessus propose les autres
// niveaux DU MEMBRE (pas les 8 niveaux DBC en entier, contrairement au
// sélecteur admin, voir LevelSelector.jsx). Changer la sélection met à
// jour "activeLevelKey" dans MemberLevelContext, donc toutes les pages de
// l'espace membre qui en dépendent.
export function LevelSwitcherBadge({ className }) {
  const { t } = useTranslation();
  const { activeLevelKey, setActiveLevelKey, levelKeys } = useMemberLevel();

  const myLevels = levelKeys.map((key) => levels.find((level) => level.key === key)).filter(Boolean);
  const level = levels.find((l) => l.key === activeLevelKey) ?? levels[0];
  const LevelIcon = level.Icon;

  return (
    <Listbox value={activeLevelKey} onChange={setActiveLevelKey}>
      <div className="relative">
        <ListboxButton
          aria-label={t("membre.dashboard.profile.switchLevel")}
          className={clsx(
            "flex items-center gap-1 rounded-full bg-[#52A2DF]/[0.12] px-2.5 py-1 text-xs font-semibold text-[#52A2DF]",
            className,
          )}
        >
          <LevelIcon aria-hidden="true" className="size-3.5" />
          {t(`simulateur.levels.${level.key}.name`)}
          {myLevels.length > 1 && <ChevronUpDownIcon aria-hidden="true" className="size-3.5" />}
        </ListboxButton>
        {myLevels.length > 1 && (
          <ListboxOptions
            anchor={{ to: "bottom start", gap: 6 }}
            className="z-20 w-56 rounded-lg bg-white py-1 text-xs shadow-lg ring-1 ring-black/5"
          >
            {myLevels.map((myLevel) => (
              <ListboxOption
                key={myLevel.key}
                value={myLevel.key}
                className={({ focus, selected }) =>
                  clsx(
                    "flex cursor-pointer items-center justify-between gap-3 px-3 py-2",
                    selected && "font-semibold text-[#52A2DF]",
                    focus && !selected && "bg-[#52A2DF]/[0.1]",
                  )
                }
              >
                <span>{t(`simulateur.levels.${myLevel.key}.name`)}</span>
                <span className="text-gray-400">
                  {t("membre.dashboard.profile.perMonth", { amount: formatMoney(myLevel.cotisation) })}
                </span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        )}
      </div>
    </Listbox>
  );
}
