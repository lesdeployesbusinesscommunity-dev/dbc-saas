// Import Dependencies
import { BanknotesIcon, GiftIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { LevelBadge } from "./LevelBadge";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

// Les montants de chaque niveau, d'un coup d'œil : ce que chaque membre
// cotise par mois, et la cagnotte que reçoit le bénéficiaire d'un tour (les
// mêmes valeurs que la page Simulateur et "Gestion financière"). Un clic sur
// un niveau filtre toute la page sur lui.
export function LevelAmounts({ groups, activeLevel, onSelect }) {
  const { t, money } = useTontineFormat();

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <BanknotesIcon aria-hidden="true" className="size-4 text-gray-400" />
        {t("admin.tontine.amounts.title")}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.amounts.hint")}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {levels.map((level) => {
          const levelGroups = groups.filter((group) => group.levelKey === level.key);
          const isActive = activeLevel === level.key;
          return (
            <button
              key={level.key}
              type="button"
              onClick={() => onSelect(isActive ? "all" : level.key)}
              aria-pressed={isActive}
              className={clsx(
                "rounded-xl border p-4 text-left outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#EE7115]/40",
                isActive ? "border-[#EE7115] bg-[#EE7115]/[0.04]" : "border-gray-100 bg-white",
              )}
            >
              <LevelBadge levelKey={level.key} />
              <dl className="mt-3 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                    <BanknotesIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                    {t("admin.tontine.amounts.monthly")}
                  </dt>
                  <dd className="whitespace-nowrap text-sm font-bold text-gray-900">{money(level.cotisation)}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                    <GiftIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                    {t("admin.tontine.amounts.pot")}
                  </dt>
                  <dd className="whitespace-nowrap text-sm font-bold text-[#EE7115]">{money(level.cagnotte)}</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-400">
                {t("admin.tontine.groupsCount", { count: levelGroups.length })} ·{" "}
                {t("admin.tontine.membersCount", { count: levelGroups.reduce((sum, group) => sum + group.size, 0) })}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
