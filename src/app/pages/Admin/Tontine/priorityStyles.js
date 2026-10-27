// Import Dependencies
import { BoltIcon, CalendarDaysIcon, ChartBarIcon, CircleStackIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Les classes de couleur sont écrites en entier pour que Tailwind les détecte.
// Icône et couleurs de chacun des 5 critères du Score de Priorité DBC, partagées
// par la feuille de route, le classement admin et la page du membre.
export const CRITERION_STYLES = {
  urgency: { Icon: BoltIcon, bar: "bg-[#EE7115]", chip: "bg-orange-50 text-orange-700", ring: "border-orange-200" },
  regularity: { Icon: CalendarDaysIcon, bar: "bg-[#52A2DF]", chip: "bg-sky-50 text-sky-700", ring: "border-sky-200" },
  coins: { Icon: CircleStackIcon, bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700", ring: "border-amber-200" },
  level: { Icon: ChartBarIcon, bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700", ring: "border-violet-200" },
  recommendation: {
    Icon: HandThumbUpIcon,
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
    ring: "border-emerald-200",
  },
};
