// Import Dependencies
import { useMemo, useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../../components/Avatar";
import { tontineBeneficiariesByLevel } from "../mockData";
import { LevelSelector } from "./LevelSelector";

// ----------------------------------------------------------------------

// Liste des bénéficiaires de la tontine du mois pour le niveau choisi (ou
// tous les niveaux si la case est cochée). Les pastilles ✓/✕ sont un
// statut en lecture seule (l'admin consulte, il ne les clique pas) : la
// vraie valeur viendra du backend (paiement confirmé ou non) une fois
// l'intégration API de cette section faite.
export function TontineBeneficiaries() {
  const { t } = useTranslation();
  const [level, setLevel] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => {
    return showAll
      ? Object.values(tontineBeneficiariesByLevel).flat()
      : (tontineBeneficiariesByLevel[level] ?? []);
  }, [level, showAll]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900">{t("admin.dashboard.beneficiaries.title")}</h2>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
              className="size-3.5 rounded border-gray-300 text-[#52A2DF] focus:ring-[#52A2DF]"
            />
            {t("admin.dashboard.beneficiaries.allLevels")}
          </label>

          <LevelSelector level={level} onChange={setLevel} disabled={showAll} />
        </div>
      </div>

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto rounded-2xl bg-[#52A2DF]/[0.1] p-3">
        {list.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-gray-500">
            {t("admin.dashboard.beneficiaries.empty")}
          </p>
        ) : (
          list.map((beneficiary) => (
            <div
              key={beneficiary.id}
              className="flex items-center gap-3 rounded-xl px-2 py-2"
            >
              <Avatar name={beneficiary.name} size="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {beneficiary.name}
                </p>
                <p className="truncate text-xs italic text-gray-500">
                  {t("admin.dashboard.beneficiaries.residesIn", { city: beneficiary.city })}
                </p>
              </div>
              <div
                className="flex shrink-0 items-center gap-1.5"
                role="status"
                aria-label={
                  beneficiary.status === "paid"
                    ? t("admin.dashboard.beneficiaries.statusPaid", { name: beneficiary.name })
                    : beneficiary.status === "unpaid"
                      ? t("admin.dashboard.beneficiaries.statusUnpaid", { name: beneficiary.name })
                      : t("admin.dashboard.beneficiaries.statusPending", { name: beneficiary.name })
                }
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex size-6 items-center justify-center rounded-full",
                    beneficiary.status === "paid"
                      ? "bg-[#52A2DF] text-white"
                      : "bg-white text-gray-300",
                  )}
                >
                  <CheckIcon className="size-3.5" />
                </span>
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex size-6 items-center justify-center rounded-full",
                    beneficiary.status === "unpaid"
                      ? "bg-[#E11D48] text-white"
                      : "bg-white text-gray-300",
                  )}
                >
                  <XMarkIcon className="size-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
