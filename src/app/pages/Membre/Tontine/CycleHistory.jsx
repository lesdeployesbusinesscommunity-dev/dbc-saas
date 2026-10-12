// Import Dependencies
import { useTranslation } from "react-i18next";
import { ArchiveBoxIcon, TrophyIcon } from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { useMemberLevel } from "../context/MemberLevelContext";
import { getCycleHistory } from "./mockData";

// ----------------------------------------------------------------------

// "Historique des cycles précédents" : les cycles DÉJÀ clôturés avant
// celui affiché plus haut (voir mockData.js : "getCycleHistory") — pas le
// cycle en cours, qui a déjà sa propre section (TontineCycle.jsx). Un
// membre qui vient de rejoindre un niveau n'a encore aucun cycle
// antérieur (voir "starter" dans mockData.js) : état vide plutôt que de
// cacher la section, pour que ce soit clair que "c'est normal, c'est
// votre première tontine à ce niveau" plutôt qu'un oubli d'affichage.
export function CycleHistory() {
  const { t, i18n } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const history = getCycleHistory(activeLevelKey);

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-gray-900">{t("membre.tontine.history.title")}</h2>

      {history.length === 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white/60 p-5 text-sm text-gray-500">
          <ArchiveBoxIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
          {t("membre.tontine.history.empty")}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {history.map((cycle) => (
            <div
              key={cycle.cycleLabel}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
                <TrophyIcon aria-hidden="true" className="size-5" />
              </span>
              <p className="text-sm text-gray-700">
                {t("membre.tontine.history.entry", {
                  year: cycle.cycleLabel,
                  tour: cycle.myTour,
                  amount: formatMoney(cycle.amountReceived, locale),
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
