// Import Dependencies
import dayjs from "dayjs";
import { CheckCircleIcon, GiftIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "./LevelBadge";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

// "Qui bouffe ce mois" : les 3 bénéficiaires de chaque groupe en cours (donc
// plusieurs groupes par niveau quand un niveau en a plusieurs). Chaque
// bénéficiaire a sa propre ligne : sa cagnotte est prête à être versée
// seulement quand toutes les cotisations du groupe sont rentrées. Le panneau
// n'affiche que l'état (versée, prête, cotisations manquantes) : l'admin ne
// marque aucun versement.
export function BeneficiariesPanel({ groups, onOpenGroup }) {
  const { t, money, month } = useTontineFormat();
  const running = groups.filter((group) => group.status === "running" && group.beneficiaries.length > 0);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <GiftIcon aria-hidden="true" className="size-4 text-gray-400" />
          {t("admin.tontine.beneficiaries.title")}
        </h2>
        <p className="text-xs font-semibold text-gray-400">{month(dayjs())}</p>
      </div>

      {running.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-gray-500">{t("admin.tontine.beneficiaries.empty")}</p>
      ) : (
        <div className="mt-4 max-h-[34rem] space-y-4 overflow-y-auto pr-1">
          {running.map((group) => (
            <div key={group.id} className="rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => onOpenGroup(group.id)}
                className="flex w-full flex-wrap items-center gap-2 rounded-t-xl bg-gray-50 px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#EE7115]/40"
                aria-label={t("admin.tontine.openGroup", {
                  letter: group.letter,
                  level: t(`simulateur.levels.${group.levelKey}.name`),
                })}
              >
                <LevelBadge levelKey={group.levelKey} />
                <span className="text-xs font-bold text-gray-800">
                  {t("admin.tontine.group", { letter: group.letter })}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {t("admin.tontine.tourOf", { tour: group.tour, total: group.totalTours })} ·{" "}
                  {t("admin.tontine.beneficiaries.count", { count: group.beneficiaries.length })}
                </span>
              </button>

              <ul className="divide-y divide-gray-100 px-3">
                {group.beneficiaries.map((beneficiary) => (
                  <li key={beneficiary.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={beneficiary.name} size="size-10" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900">{beneficiary.name}</span>
                        <span className="block truncate text-xs text-gray-500">{beneficiary.city}</span>
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{money(group.payout.amount)}</p>
                        {beneficiary.payoutDate ? (
                          <p className="flex items-center justify-end gap-1 text-xs font-semibold text-green-700">
                            <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.tontine.beneficiaries.paidOut")}
                          </p>
                        ) : beneficiary.payoutReady ? (
                          <p className="text-xs font-semibold text-green-700">{t("admin.tontine.beneficiaries.ready")}</p>
                        ) : (
                          <p className="text-xs font-semibold text-amber-700">
                            {t("admin.tontine.beneficiaries.missing", { count: group.payout.missing })}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
