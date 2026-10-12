// Import Dependencies
import {
  CheckCircleIcon,
  AcademicCapIcon,
  CircleStackIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { useReportMatches } from "../components/searchSummary";
import { getAccountOverrides } from "../accountData";

// ----------------------------------------------------------------------

// Fil des dernières actions du membre connecté (cotisations payées, Coins
// gagnés...), datées par le serveur (voir accountData.js). Icônes choisies
// pour correspondre au type d'action plutôt qu'aux emojis de la maquette :
// cotisation (✓), formation (diplôme), coins (pile de jetons), parrainage
// (ajout d'un contact).
const KIND_STYLE = {
  cotisation: { Icon: CheckCircleIcon, color: "#52A2DF" },
  formation: { Icon: AcademicCapIcon, color: "#EE7115" },
  coins: { Icon: CircleStackIcon, color: "#EE7115" },
  parrainage: { Icon: UserPlusIcon, color: "#52A2DF" },
};

export function RecentActivity({ query = "", onMatches }) {
  const { t } = useTranslation();
  const source = getAccountOverrides().activity.recent.map((item) => ({ ...item, ...KIND_STYLE[item.kind] }));
  // Texte d'une activité : certaines citent une personne ou une formation.
  const labelOf = (item) => {
    if (item.kind === "cotisation") {
      return t("membre.dashboard.activity.items.cotisationOf", item.params);
    }
    if (item.params?.name) {
      return t(`membre.dashboard.activity.items.${item.kind === "parrainage" ? "parrainageOf" : "formationNamed"}`, item.params);
    }
    return t("membre.dashboard.activity.items.coinsGained");
  };
  const items = source.filter((item) => searchTextIncludes(labelOf(item), query));
  useReportMatches(onMatches, "activity", items.length);

  // Recherche en cours sans correspondance : la section disparaît.
  if (query.trim() !== "" && items.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-gray-900">{t("membre.dashboard.activity.title")}</h2>

      <div className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white px-4 shadow-sm sm:px-5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${item.color}1A`, color: item.color }}
            >
              <item.Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {labelOf(item)}
              </p>
            </div>
            <p className="shrink-0 text-xs text-gray-400">
              {t(`membre.dashboard.activity.time.${item.timeUnit}`, { count: item.timeCount })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
