// Import Dependencies
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { useMemberLevel } from "../../context/MemberLevelContext";
import { useReportMatches } from "../../components/searchSummary";
import { getTontineGroup } from "../mockData";

// ----------------------------------------------------------------------

// "Cotisation du mois" : les membres de MON groupe de tontine pour le
// niveau actuellement consulté (voir MemberLevelContext — un membre peut
// cotiser à plusieurs niveaux, chacun avec son propre groupe), et leur
// statut de cotisation pour la date prévue. Repris du même motif que le
// suivi admin (voir Admin/Dashboard/RightPanel/TontineBeneficiaries.jsx)
// mais simplifié à deux statuts seulement ("paid"/"unpaid" — pas de
// "pending") : pas de sélecteur de niveau ici, celui-ci se fait depuis la
// carte de profil (voir Dashboard/ProfileSummaryCard.jsx), une seule fois
// pour toute la page. Le ✓ est actif (bleu) si la cotisation a été faite
// à la date prévue, sinon c'est la ✕ qui est active (rouge) — jamais les
// deux en même temps.
export function TontineStatus({ query = "", onMatches }) {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const tontineGroup = getTontineGroup(activeLevelKey).filter(
    (member) =>
      searchTextIncludes(member.name, query) || searchTextIncludes(member.city, query),
  );
  useReportMatches(onMatches, "tontine", tontineGroup.length);

  // Recherche en cours sans correspondance : la section disparaît.
  if (query.trim() !== "" && tontineGroup.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-gray-900">{t("membre.dashboard.tontine.title")}</h2>

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto rounded-2xl bg-[#52A2DF]/[0.1] p-3">
        {tontineGroup.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={member.name} size="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
              <p className="truncate text-xs italic text-gray-500">
                {t("membre.dashboard.tontine.residesIn", { city: member.city })}
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-1.5"
              role="status"
              aria-label={
                member.status === "paid"
                  ? t("membre.dashboard.tontine.statusPaid", { name: member.name })
                  : t("membre.dashboard.tontine.statusUnpaid", { name: member.name })
              }
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "flex size-6 items-center justify-center rounded-full",
                  member.status === "paid" ? "bg-[#52A2DF] text-white" : "bg-white text-gray-300",
                )}
              >
                <CheckIcon className="size-3.5" />
              </span>
              <span
                aria-hidden="true"
                className={clsx(
                  "flex size-6 items-center justify-center rounded-full",
                  member.status === "unpaid" ? "bg-[#E11D48] text-white" : "bg-white text-gray-300",
                )}
              >
                <XMarkIcon className="size-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
