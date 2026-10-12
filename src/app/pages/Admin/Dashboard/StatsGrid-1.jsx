// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { useMemberLevel } from "../context/MemberLevelContext";
import { getMonthlyStats } from "./mockData";

// ----------------------------------------------------------------------

// "Actualité de ce mois" : une carte par indicateur, icône colorée + gros
// chiffre + libellé — même motif que la "Vue Globale" admin (voir
// Admin/Dashboard/StatsGrid.jsx), avec des indicateurs propres au membre
// connecté (4 tuiles : filleuls, formations en cours, cotisations à jour,
// commission de parrainage — "DBC Coins" n'est pas répété ici, déjà
// affiché dans la carte de profil juste au-dessus). "formations" et
// "cotisation" dépendent du niveau actuellement consulté (voir
// MemberLevelContext) : elles changent avec lui quand on bascule de
// tontine depuis la carte de profil.
export function StatsGrid() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const monthlyStats = getMonthlyStats(activeLevelKey);

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-gray-900">{t("membre.dashboard.actualite")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {monthlyStats.map(({ key, labelKey, value, Icon, color }) => (
          <div key={key} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-3 text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs+ text-gray-500">{t(labelKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
