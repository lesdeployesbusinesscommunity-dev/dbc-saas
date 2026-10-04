// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { STATUS_ORDER, STATUS_STYLES } from "./statusStyles";

// ----------------------------------------------------------------------

// Légende des statuts, affichée AVANT le cycle des 12 mois : demandé
// explicitement, car cette page touche au cœur du fonctionnement de la
// tontine — mieux vaut expliquer "Clôturé"/"En cours"/"À venir" une fois,
// clairement, plutôt que de laisser deviner ce qu'ils veulent dire.
export function StatusLegend() {
  const { t } = useTranslation();

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-gray-900">{t("membre.tontine.legend.title")}</h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STATUS_ORDER.map((key) => {
          const { Icon, className } = STATUS_STYLES[key];
          return (
            <div
              key={key}
              className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${className}`}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {t(`membre.tontine.legend.${key}.label`)}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">
                  {t(`membre.tontine.legend.${key}.description`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
