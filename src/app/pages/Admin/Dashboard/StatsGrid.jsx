// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  UsersIcon,
  TrophyIcon,
  StarIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Couleurs alternées entre les deux teintes de la marque (orange #EE7115 /
// bleu #52A2DF), comme dans l'ancienne version en mockData.js.
const TILES = [
  { key: "membres", labelKey: "admin.dashboard.stats.membres", Icon: UsersIcon, color: "#52A2DF" },
  { key: "niveaux", labelKey: "admin.dashboard.stats.niveaux", Icon: TrophyIcon, color: "#EE7115" },
  { key: "tontine", labelKey: "admin.dashboard.stats.tontine", Icon: StarIcon, color: "#52A2DF" },
  { key: "antennes", labelKey: "admin.dashboard.stats.antennes", Icon: MapPinIcon, color: "#EE7115" },
  { key: "piliers", labelKey: "admin.dashboard.stats.piliers", Icon: BuildingLibraryIcon, color: "#52A2DF" },
  { key: "programmes", labelKey: "admin.dashboard.stats.programmes", Icon: RectangleGroupIcon, color: "#EE7115" },
];

// "Vue Globale" : une carte par indicateur, icône colorée + gros chiffre +
// libellé. "data" vient de GET /gouvernance/tableau-de-bord (voir
// api/gouvernance.js et Dashboard/index.jsx) ; "tontine" reste "—" tant que
// le module Tontine n'est pas implémenté côté backend (valeur null).
export function StatsGrid({ data }) {
  const { t } = useTranslation();

  const values = {
    membres: data.activeMembers,
    niveaux: data.totalLevels,
    tontine: data.totalTontineMembers ?? "—",
    antennes: data.totalAntennas,
    piliers: data.totalPillars,
    programmes: data.totalPrograms,
  };

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-gray-900">{t("admin.dashboard.globalView")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map(({ key, labelKey, Icon, color }) => (
          <div
            key={key}
            className="rounded-xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-3 text-xl font-bold text-gray-900">{values[key]}</p>
            <p className="text-xs+ text-gray-500">{t(labelKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
