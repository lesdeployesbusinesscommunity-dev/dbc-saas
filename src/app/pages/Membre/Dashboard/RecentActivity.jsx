// Import Dependencies
import {
  CheckCircleIcon,
  AcademicCapIcon,
  CircleStackIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

// Fil des dernières actions du membre connecté — placeholder en attendant
// un vrai journal d'activité côté backend (chaque événement aurait alors
// un horodatage réel ; "timeUnit"/"timeCount" resteront le format attendu
// par la tuile, seul le calcul du "il y a..." changera). Icônes choisies
// pour correspondre au type d'action plutôt qu'aux emojis de la maquette :
// cotisation (✓), formation (diplôme), coins (pile de jetons), parrainage
// (ajout d'un contact).
const recentActivity = [
  { id: "a1", kind: "cotisation", Icon: CheckCircleIcon, color: "#52A2DF", timeUnit: "days", timeCount: 2 },
  { id: "a2", kind: "formation", Icon: AcademicCapIcon, color: "#EE7115", timeUnit: "days", timeCount: 5 },
  { id: "a3", kind: "coins", Icon: CircleStackIcon, color: "#EE7115", timeUnit: "weeks", timeCount: 1 },
  { id: "a4", kind: "parrainage", Icon: UserPlusIcon, color: "#52A2DF", timeUnit: "weeks", timeCount: 2 },
];

export function RecentActivity() {
  const { t } = useTranslation();

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-gray-900">{t("membre.dashboard.activity.title")}</h2>

      <div className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white px-4 shadow-sm sm:px-5">
        {recentActivity.map((item) => (
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
                {t(`membre.dashboard.activity.items.${item.kind}`)}
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
