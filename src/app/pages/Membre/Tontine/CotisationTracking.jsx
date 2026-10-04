// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { formatMoney } from "app/pages/Simulateur/data";
import { useMemberLevel } from "../context/MemberLevelContext";
import { getCotisationTracking, getCurrentTour } from "./mockData";

// ----------------------------------------------------------------------

// "Suivi des cotisations" : l'état de paiement de CHAQUE membre du
// groupe, tour par tour — pas juste "a cotisé ce mois-ci" (déjà affiché
// ailleurs, voir RightPanel/TontineStatus.jsx), mais tout l'historique
// depuis le début du cycle affiché, pour repérer d'un coup d'œil qui est
// à jour et qui a des tours manqués. La frise de puces numérotées (une
// par tour déjà entamé) sert cet objectif précis : un membre "à jour"
// montre une ligne pleine, un membre en retard montre tout de suite
// lesquels de ses tours posent problème, plutôt qu'une simple fraction
// qui cacherait où est le trou.
export function CotisationTracking() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const tracking = getCotisationTracking(activeLevelKey);
  const currentTour = getCurrentTour(activeLevelKey);
  const months = t("membre.common.months", { returnObjects: true });

  if (!currentTour) return null;

  const monthLabel = `${months[currentTour.month.month()]} ${currentTour.month.year()}`;

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-gray-900">
        {t("membre.tontine.tracking.title", { tour: currentTour.tour, month: monthLabel })}
      </h2>

      <div className="mt-3 space-y-3">
        {tracking.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:flex sm:items-center sm:gap-5 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <Avatar name={member.name} size="size-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {t("membre.tontine.tracking.perMonth", { amount: formatMoney(member.cotisation) })}
                  {" · "}
                  {t("membre.tontine.tracking.toursCount", {
                    paid: member.paidCount,
                    total: member.totalTours,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-3 flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:mt-0 sm:justify-center">
              {member.history.map((paid, index) => (
                <span
                  key={index}
                  title={t(
                    paid ? "membre.tontine.tracking.tourPaid" : "membre.tontine.tracking.tourUnpaid",
                    { tour: index + 1 },
                  )}
                  className={clsx(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    paid ? "bg-[#52A2DF] text-white" : "border-2 border-dashed border-gray-300 text-gray-400",
                  )}
                >
                  {index + 1}
                </span>
              ))}
            </div>

            <div className="mt-3 sm:mt-0">
              <span
                className={clsx(
                  "flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                  member.isUpToDate ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700",
                )}
              >
                {member.isUpToDate ? (
                  <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                ) : (
                  <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
                )}
                {t(
                  member.isUpToDate
                    ? "membre.tontine.tracking.upToDate"
                    : "membre.tontine.tracking.pending",
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
