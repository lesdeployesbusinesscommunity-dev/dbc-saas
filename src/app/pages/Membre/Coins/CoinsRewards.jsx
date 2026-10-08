// Import Dependencies
import { useTranslation } from "react-i18next";
import {
  GiftIcon,
  ReceiptPercentIcon,
  AcademicCapIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { currentMember } from "../currentMember";
import { useReportMatches } from "../components/searchSummary";
import { ConfirmRequestPopover } from "../components/ConfirmRequestPopover";
import { getCoinsRewards } from "./mockData";

// ----------------------------------------------------------------------

const REWARD_ICONS = {
  goodies: GiftIcon,
  discount: ReceiptPercentIcon,
  training: AcademicCapIcon,
  club: TicketIcon,
  coaching: ChatBubbleLeftRightIcon,
};

// "Utiliser mes Coins" : ce que le solde permet d'obtenir. Un échange est
// une DEMANDE (rien d'automatique derrière, un humain la traite), donc on
// réutilise le même popover de confirmation que "Solliciter" un niveau
// (voir components/ConfirmRequestPopover.jsx) — mêmes textes "Oui /
// Annuler / on vous recontacte". Une récompense trop chère pour le solde
// actuel n'a pas de bouton : on y lit exactement combien de Coins il
// manque, plutôt que de disparaître. Catalogue de démonstration (voir
// mockData.js : "getCoinsRewards").
export function CoinsRewards({ query = "", onMatches }) {
  const { t } = useTranslation();
  // Recherche de l'en-tête : sur le titre ou la description de la récompense.
  const rewards = getCoinsRewards().filter(
    (reward) =>
      searchTextIncludes(t(`membre.coins.rewards.items.${reward.id}.title`), query) ||
      searchTextIncludes(t(`membre.coins.rewards.items.${reward.id}.description`), query),
  );
  const balance = currentMember.coins;
  useReportMatches(onMatches, "rewards", rewards.length);

  if (query.trim() !== "" && rewards.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <GiftIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
        {t("membre.coins.rewards.title")}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("membre.coins.rewards.subtitle", { balance })}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rewards.map((reward) => {
          const Icon = REWARD_ICONS[reward.id];
          const missing = Math.max(0, reward.cost - balance);
          const title = t(`membre.coins.rewards.items.${reward.id}.title`);

          return (
            <div key={reward.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.12] text-[#52A2DF]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t(`membre.coins.rewards.items.${reward.id}.description`)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-gray-900">
                  <CircleStackIcon aria-hidden="true" className="size-3.5 text-amber-500" />
                  {t("membre.coins.rewards.cost", { cost: reward.cost })}
                </span>

                {missing === 0 ? (
                  <ConfirmRequestPopover
                    triggerClassName="rounded-lg bg-[#52A2DF] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    question={t("membre.coins.rewards.question", { cost: reward.cost, reward: title })}
                    request={{ type: "reward", rewardId: reward.id, cost: reward.cost }}
                  >
                    {t("membre.coins.rewards.exchange")}
                  </ConfirmRequestPopover>
                ) : (
                  <span className="text-xs font-semibold text-gray-400">
                    {t("membre.coins.rewards.missing", { missing })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
