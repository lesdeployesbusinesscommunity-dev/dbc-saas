// Import Dependencies
import { useTranslation } from "react-i18next";
import { BanknotesIcon, CheckBadgeIcon } from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { useMemberLevel } from "../context/MemberLevelContext";
import { getCurrentTour, getMonthlyCagnotte, getTontineGroup, isCycleComplete } from "./mockData";

// ----------------------------------------------------------------------

// Bannière "Cagnotte du mois" — même dégradé bleu que la citation
// fondatrice de la page Gouvernance côté admin (voir
// Admin/Gouvernance/index.jsx), repris ici plutôt qu'inventé : l'endroit
// où ce dégradé est déjà utilisé dans le site. Tout dépend du niveau
// actuellement consulté (voir MemberLevelContext) : la cagnotte, le tour,
// le bénéficiaire et le nombre de cotisants changent si le membre a
// plusieurs niveaux et bascule entre eux (voir
// Dashboard/ProfileSummaryCard.jsx).
export function CagnotteHero() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();

  const currentTour = getCurrentTour(activeLevelKey);
  const amount = getMonthlyCagnotte(activeLevelKey);
  const group = getTontineGroup(activeLevelKey);
  const paidCount = group.filter((member) => member.status === "paid").length;
  const progressPercent = group.length > 0 ? (paidCount / group.length) * 100 : 0;
  const cycleComplete = isCycleComplete(activeLevelKey);

  if (!currentTour) return null;

  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#52A2DF] to-[#3d6fb0] p-8 sm:p-10">
      <BanknotesIcon
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 size-48 text-white/10"
      />

      {cycleComplete ? (
        <>
          <p className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70">
            <CheckBadgeIcon aria-hidden="true" className="size-4" />
            {t("membre.tontine.hero.cycleCompleteLabel")}
          </p>
          <p className="relative mt-3 text-2xl font-bold text-white sm:text-3xl">
            {t("membre.tontine.hero.cycleCompleteMessage")}
          </p>
          <p className="relative mt-3 text-sm text-white/80">
            {t("membre.tontine.hero.cycleCompleteLastBeneficiary", {
              name: currentTour.memberName,
              amount: formatMoney(amount),
            })}
          </p>
        </>
      ) : (
        <>
          <p className="relative text-xs font-bold uppercase tracking-widest text-white/70">
            {t("membre.tontine.hero.label", { tour: currentTour.tour })}
          </p>
          <p className="relative mt-3 text-4xl font-black text-white sm:text-5xl">
            {formatMoney(amount)}
          </p>
          <p className="relative mt-4 text-base font-semibold text-white">
            {t("membre.tontine.hero.beneficiary", { name: currentTour.memberName })}
          </p>

          <div className="relative mt-5 max-w-xs">
            <p className="text-xs font-semibold text-white/80">
              {t("membre.tontine.hero.paidProgress", { paid: paidCount, total: group.length })}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
