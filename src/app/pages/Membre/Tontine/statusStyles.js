// Import Dependencies
import { CheckCircleIcon, FireIcon, ClockIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Les 3 statuts d'un tour du cycle de tontine, partagés entre la légende
// (StatusLegend.jsx) et la liste des tours (TontineCycle.jsx) — une seule
// définition pour que les deux restent toujours cohortes. "closed" =
// gris neutre (tour passé, plus rien à faire) ; "current" = orange plein
// (le tour de ce mois-ci, doit sauter aux yeux) ; "upcoming" = bleu clair
// (pas encore d'actualité, discret).
export const STATUS_ORDER = ["closed", "current", "upcoming"];

export const STATUS_STYLES = {
  closed: { Icon: CheckCircleIcon, className: "bg-gray-100 text-gray-500" },
  current: { Icon: FireIcon, className: "bg-[#EE7115] text-white" },
  upcoming: { Icon: ClockIcon, className: "bg-[#52A2DF]/[0.1] text-[#52A2DF]" },
};
