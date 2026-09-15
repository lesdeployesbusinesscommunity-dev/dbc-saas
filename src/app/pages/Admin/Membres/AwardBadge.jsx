// Import Dependencies
import { CheckBadgeIcon, UserGroupIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { awardDefinitions } from "./mockData";

// ----------------------------------------------------------------------

// Icône + couleur par award — utilisé partout où les awards s'affichent
// (fiche "Voir" et "Top des membres").
const AWARD_STYLES = {
  cotisation: { Icon: CheckBadgeIcon, className: "bg-green-50 text-green-700" },
  parrainage: { Icon: UserGroupIcon, className: "bg-blue-50 text-blue-700" },
  formation: { Icon: AcademicCapIcon, className: "bg-orange-50 text-[#EE7115]" },
};

// Petit rond avec l'icône d'un award ; au survol, un popover s'ouvre
// au-dessus avec l'icône et le nom de l'award (pas juste l'infobulle native
// du navigateur) — demandé explicitement par l'utilisateur.
export function AwardBadge({ awardKey }) {
  const { t } = useTranslation();
  const def = awardDefinitions[awardKey];
  const style = AWARD_STYLES[awardKey];
  if (!def || !style) return null;

  const { Icon } = style;
  const label = t(def.labelKey);

  return (
    <div className="group relative">
      <span
        className={clsx(
          "flex size-7 items-center justify-center rounded-full",
          style.className,
        )}
      >
        <Icon aria-hidden="true" className="size-3.5" />
      </span>

      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:flex group-focus-within:flex"
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"
        />
      </div>
    </div>
  );
}
