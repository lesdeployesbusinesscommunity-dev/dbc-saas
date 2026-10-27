// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { MapIcon, TrophyIcon } from "@heroicons/react/24/solid";

// Local Imports
import { PriorityRanking } from "./PriorityRanking";
import { PriorityRoadmap } from "./PriorityRoadmap";

// ----------------------------------------------------------------------

const VIEWS = [
  { key: "ranking", Icon: TrophyIcon },
  { key: "roadmap", Icon: MapIcon },
];

// L'onglet "Classement" de Gestion des tontines : le classement de chaque
// groupe (PriorityRanking.jsx) et, à côté, la feuille de route du Score de
// Priorité DBC (PriorityRoadmap.jsx), la même que celle des membres.
export function PriorityTab({ groups }) {
  const { t } = useTranslation();
  const [view, setView] = useState("ranking");

  return (
    <div>
      <div role="group" aria-label={t("tontinePriority.admin.views.label")} className="flex w-fit gap-1 rounded-full bg-white p-1 shadow-sm">
        {VIEWS.map(({ key, Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
              view === key ? "bg-[#EE7115] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            {t(`tontinePriority.admin.views.${key}`)}
          </button>
        ))}
      </div>
      <div className="mt-5">{view === "ranking" ? <PriorityRanking groups={groups} /> : <PriorityRoadmap />}</div>
    </div>
  );
}
