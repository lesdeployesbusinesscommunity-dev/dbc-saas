// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { useMemberLevel } from "../context/MemberLevelContext";
import { getTontineCycle } from "./mockData";
import { STATUS_STYLES } from "./statusStyles";

// ----------------------------------------------------------------------

// Les 12 tours du cycle annuel : qui reçoit la cagnotte, quel mois, et où
// ce tour en est (voir statusStyles.js pour la légende juste au-dessus).
// Présenté en liste de cartes (comme le reste du site) plutôt qu'un
// <table> HTML : plus lisible sur mobile, et cohérent avec le motif déjà
// utilisé ailleurs (Activités récentes, Cotisation du mois...). Le tour
// "en cours" est mis en évidence (fond teinté + liseré orange) — sans
// quoi, dans une liste de 12 lignes, rien n'indique "où on en est" d'un
// coup d'œil.
export function TontineCycle() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const cycle = getTontineCycle(activeLevelKey);
  const months = t("membre.common.months", { returnObjects: true });

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-gray-900">{t("membre.tontine.cycle.title")}</h2>

      <div className="mt-3 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {cycle.map((tour) => {
          const { Icon, className } = STATUS_STYLES[tour.status];
          const isCurrent = tour.status === "current";

          return (
            <div
              key={tour.tour}
              className={clsx(
                "relative flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0 sm:px-5",
                isCurrent && "bg-[#EE7115]/[0.05]",
              )}
            >
              {isCurrent && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-1 bg-[#EE7115]"
                />
              )}

              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                {tour.tour}
              </span>

              <Avatar name={tour.memberName} size="size-9" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{tour.memberName}</p>
                <p className="truncate text-xs text-gray-500">
                  {months[tour.month.month()]} {tour.month.year()}
                </p>
              </div>

              <span
                className={clsx(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                  className,
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">{t(`membre.tontine.legend.${tour.status}.label`)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
