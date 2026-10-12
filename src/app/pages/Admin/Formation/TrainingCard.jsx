// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { RectangleStackIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Une carte de formation — catalogue réel (voir Formation/index.jsx,
// GET /formations) : code, niveau requis et pilier, seuls champs que le
// backend expose pour l'instant (pas de formateur/date/durée/avancement,
// voir mémoire "project_frontend_backend_ecart_admin"). La carte entière
// est cliquable : elle ouvre la fiche détaillée avec les vrais modules et
// leçons de la formation (GET /formations/:id — voir
// TrainingDetailsModal.jsx).
export function TrainingCard({ training, level, pillarName, onClick }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start overflow-hidden rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF]"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
        <RectangleStackIcon aria-hidden="true" className="size-5" />
      </span>

      <h3 className="mt-3 line-clamp-2 text-sm font-bold text-gray-900">{training.name}</h3>
      <p className="mt-0.5 text-xs text-gray-400">{training.code}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {level && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-0.5 text-[10px] font-semibold",
              level.borderClass,
              level.textClass,
            )}
          >
            <level.Icon aria-hidden="true" className="size-3" />
            {t(`simulateur.levels.${level.key}.name`)}
          </span>
        )}
        {pillarName && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600">
            {pillarName}
          </span>
        )}
      </div>
    </button>
  );
}
