// Import Dependencies
import { useTranslation } from "react-i18next";
import { BellAlertIcon, ExclamationTriangleIcon, ClockIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { LEVEL_HEX, getInitials } from "../communityMembers";
import { getNetworkActivity } from "./mockData";
import { whatsappLink } from "./contactLinks";

// ----------------------------------------------------------------------

// "Activité du réseau" : ce qui demande une action du membre, plutôt que
// de la lui laisser deviner dans l'arbre. Chaque ligne a un bouton
// "Relancer" qui ouvre WhatsApp avec un message déjà rédigé (jamais envoyé
// automatiquement). Quand il n'y a rien à relancer, un message le dit au
// lieu de laisser un bloc vide. Données de démonstration, voir
// mockData.js : "getNetworkActivity".
const ALERT_ICONS = { latePayment: ExclamationTriangleIcon, pending: ClockIcon };
const ALERT_TONES = { latePayment: "text-amber-500", pending: "text-gray-400" };

export function NetworkActivity() {
  const { t } = useTranslation();
  const { alerts, total, upToDate } = getNetworkActivity();
  const percent = Math.round((upToDate / total) * 100);

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <BellAlertIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
          {t("membre.reseau.activity.title")}
        </h2>
        {alerts.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            {t("membre.reseau.activity.toRemind", { count: alerts.length })}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          {t("membre.reseau.activity.upToDate", { ok: upToDate, total })}
        </p>
      </div>

      {alerts.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CheckCircleIcon aria-hidden="true" className="size-5 text-green-600" />
          {t("membre.reseau.activity.none")}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {alerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.kind];
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: LEVEL_HEX[alert.member.levelKey] }}
                >
                  {getInitials(alert.member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{alert.member.name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Icon aria-hidden="true" className={`size-3.5 shrink-0 ${ALERT_TONES[alert.kind]}`} />
                    {t(`membre.reseau.activity.${alert.kind}`, { days: alert.days })}
                  </p>
                </div>
                <a
                  href={whatsappLink(
                    alert.member.phone,
                    t(`membre.reseau.activity.remindMessage.${alert.kind}`, { name: alert.member.name }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-[#52A2DF] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t("membre.reseau.activity.remind")}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
