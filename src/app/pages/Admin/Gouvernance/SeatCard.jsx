// Import Dependencies
import { PlusIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";

// ----------------------------------------------------------------------

// Un poste de la gouvernance : soit pourvu (photo/initiales, nom, le
// titre du poste juste en dessous — cliquer ouvre la fiche complète du
// responsable), soit vacant (cliquer l'assigne à un membre existant, si
// "assignable" — voir Gouvernance/index.jsx). "size" permet une variante
// plus grande pour le poste unique du Fondateur (voir PoleSection.jsx).
export function SeatCard({ seatTitle, member, assignable, onView, onAssign, size = "md" }) {
  const { t } = useTranslation();
  const avatarSize = size === "lg" ? "size-20" : "size-14";

  if (member) {
    return (
      <button
        type="button"
        onClick={onView}
        title={t("admin.reseau.viewMember")}
        className="group flex w-32 flex-col items-center text-center"
      >
        <Avatar
          name={member.name}
          src={member.photo}
          size={avatarSize}
          className="ring-4 ring-offset-2 ring-[#52A2DF]/30 transition-transform group-hover:scale-105"
        />
        <p
          className={clsx(
            "mt-2.5 font-bold leading-tight text-gray-900 group-hover:text-[#52A2DF]",
            size === "lg" ? "text-base" : "text-sm",
          )}
        >
          {member.name}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-gray-500">{seatTitle}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={assignable ? onAssign : undefined}
      disabled={!assignable}
      className={clsx(
        "group flex w-32 flex-col items-center text-center",
        !assignable && "cursor-default",
      )}
    >
      <span
        className={clsx(
          avatarSize,
          "flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors",
          assignable && "group-hover:border-[#52A2DF] group-hover:text-[#52A2DF]",
        )}
      >
        <PlusIcon aria-hidden="true" className="size-6" />
      </span>
      <p
        className={clsx(
          "mt-2.5 font-semibold text-gray-400",
          size === "lg" ? "text-base" : "text-sm",
          assignable && "group-hover:text-[#52A2DF]",
        )}
      >
        {t("admin.reseau.vacant")}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-gray-400">{seatTitle}</p>
    </button>
  );
}
