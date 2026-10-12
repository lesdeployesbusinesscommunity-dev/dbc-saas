// Import Dependencies
import { useTranslation } from "react-i18next";
import { ArrowUpCircleIcon, UserPlusIcon, UsersIcon } from "@heroicons/react/24/solid";

// Local Imports
import { getNetworkSummary } from "./mockData";

// ----------------------------------------------------------------------

// Les trois chiffres à lire avant de regarder l'arbre : qui est mon
// parrain, combien de personnes j'ai parrainées directement, et la taille
// totale de mon réseau (même 12 que "Mon MLM", voir Mlm/mockData.js).
export function NetworkStats() {
  const { t } = useTranslation();
  const summary = getNetworkSummary();

  const tiles = [
    { key: "sponsor", Icon: ArrowUpCircleIcon, tone: "bg-amber-50 text-amber-500", value: summary.sponsor?.name ?? t("membre.reseau.stats.noSponsor") },
    { key: "direct", Icon: UserPlusIcon, tone: "bg-[#52A2DF]/[0.12] text-[#52A2DF]", value: summary.directReferrals },
    { key: "total", Icon: UsersIcon, tone: "bg-indigo-50 text-indigo-500", value: summary.totalNetwork },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map(({ key, Icon, tone, value }) => (
        <div key={key} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{t(`membre.reseau.stats.${key}`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
