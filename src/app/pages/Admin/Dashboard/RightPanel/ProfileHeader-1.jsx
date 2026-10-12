// Import Dependencies
import { BellIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";

// ----------------------------------------------------------------------

// En-tête du panneau de droite : notification + identité du membre
// connecté (photo si disponible, sinon initiales sur fond de couleur) —
// même motif que ProfileHeader.jsx côté admin.
export function ProfileHeader({ member }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        aria-label={t("membre.topbar.notifications")}
        className="flex size-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:text-[#EE7115]"
      >
        <BellIcon aria-hidden="true" className="size-5" />
      </button>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-bold text-gray-900">{member.name}</p>
          <p className="text-xs text-gray-500">{member.role}</p>
        </div>
        <Avatar name={member.name} src={member.photo} size="size-11" />
      </div>
    </div>
  );
}
