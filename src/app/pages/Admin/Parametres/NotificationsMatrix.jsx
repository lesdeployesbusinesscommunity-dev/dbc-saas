// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Toggle } from "./Toggle";

// ----------------------------------------------------------------------

// Matrice "qui reçoit quoi" : une ligne par type de notification (à
// propos de quoi), une colonne par audience (qui — membres, directeurs,
// leaders d'antennes, administrateurs), un interrupteur à chaque
// intersection. Toute la matrice se grise (sans se vider) quand
// "enabled" est faux — le bouton principal juste au-dessus désactive les
// notifications sans perdre la configuration déjà faite.
export function NotificationsMatrix({ audiences, types, matrix, enabled, onToggleCell }) {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        "overflow-x-auto transition-opacity",
        !enabled && "pointer-events-none opacity-40",
      )}
    >
      <div className="min-w-[600px]">
        <div className="grid grid-cols-[1.7fr_repeat(4,1fr)] gap-2 px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
          <div />
          {audiences.map((audience) => (
            <div key={audience.key} className="text-center">
              {t(audience.labelKey)}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {types.map((type, index) => (
            <div
              key={type.key}
              className={clsx(
                "grid grid-cols-[1.7fr_repeat(4,1fr)] items-center gap-2 rounded-xl px-2 py-2.5",
                index % 2 === 1 && "bg-gray-50",
              )}
            >
              <p className="pr-2 text-sm text-gray-700">{t(type.labelKey)}</p>
              {audiences.map((audience) => (
                <div key={audience.key} className="flex justify-center">
                  <Toggle
                    checked={!!matrix[type.key]?.[audience.key]}
                    onChange={(value) => onToggleCell(type.key, audience.key, value)}
                    label={`${t(type.labelKey)} — ${t(audience.labelKey)}`}
                    disabled={!enabled}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
