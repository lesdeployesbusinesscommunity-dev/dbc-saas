// Import Dependencies
import { useTranslation } from "react-i18next";
import { FlagIcon, TrophyIcon } from "@heroicons/react/24/solid";

// Local Imports
import { getNextRankTarget } from "./mockData";

// ----------------------------------------------------------------------

// "Prochain objectif" : combien de Coins il manque au membre pour
// rattraper la personne juste au-dessus de lui dans le classement (voir
// mockData.js : "getNextRankTarget"), avec un ordre de grandeur concret
// (combien de "Challenge mensuel" cela représente) plutôt qu'un simple
// écart abstrait. Une barre de progression (mes Coins / ses Coins) donne
// l'écart en un coup d'œil. Si le membre est déjà premier, un message
// d'encouragement remplace la barre.
export function CoinsProgress() {
  const { t } = useTranslation();
  const progress = getNextRankTarget();

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <FlagIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
          {t("membre.coins.progress.title")}
        </h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {t("membre.coins.progress.rank", { rank: progress.rank, total: progress.total })}
        </span>
      </div>

      {progress.target ? (
        <>
          <p className="mt-4 text-sm font-semibold text-gray-900">
            {t("membre.coins.progress.missing", { missing: progress.missing, name: progress.target.name })}
          </p>

          <div className="mt-3">
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#52A2DF] to-[#3d6fb0]"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-gray-500">
              <span>{t("membre.coins.progress.you", { coins: progress.myCoins })}</span>
              <span>{t("membre.coins.progress.target", { name: progress.target.name, coins: progress.target.coins })}</span>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-[#52A2DF]/[0.08] px-3 py-2 text-xs font-medium text-[#2f78b4]">
            {t("membre.coins.progress.hint", { count: progress.challengeCount, amount: progress.challengeAmount })}
          </p>
        </>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <TrophyIcon aria-hidden="true" className="size-5 text-amber-500" />
          {t("membre.coins.progress.top")}
        </p>
      )}
    </div>
  );
}
