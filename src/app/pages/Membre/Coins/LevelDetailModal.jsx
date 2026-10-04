// Import Dependencies
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { levels, formatMoney, formatRange } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { ConfirmRequestPopover } from "../components/ConfirmRequestPopover";

// ----------------------------------------------------------------------

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-800">{value}</dd>
    </div>
  );
}

// Détail d'UN niveau DBC (cotisation, commission, cagnotte, potentiel,
// avantages) avec le bouton "Solliciter ce niveau" — ouvert depuis le
// badge de niveau d'une ligne du classement (voir CoinsLeaderboard.jsx).
// Réutilise le MÊME composant et les MÊMES clés de traduction que la
// colonne "Solliciter" du tableau comparatif du Dashboard (voir
// Simulateur/ComparisonTable.jsx : ConfirmRequestPopover,
// "membre.dashboard.comparison.*") pour garder une seule formulation de
// cette action dans toute l'app plutôt que d'en réécrire une nouvelle ici.
// "Déjà membre" se vérifie sur currentMember.levelKeys (le membre
// connecté), jamais sur le niveau de la personne du classement qu'on
// vient de regarder — ce sont deux notions différentes.
export function LevelDetailModal({ levelKey, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const level = levels.find((l) => l.key === levelKey);

  if (!level) return null;

  const Icon = level.Icon;
  const alreadyMember = currentMember.levelKeys.includes(level.key);
  const advantages = t(`simulateur.levels.${level.key}.advantages`, { returnObjects: true });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={clsx(
                  "flex size-12 shrink-0 items-center justify-center rounded-full border",
                  level.borderClass,
                  level.textClass,
                  level.bgTintClass,
                )}
              >
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {t(`simulateur.levels.${level.key}.name`)}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("membre.common.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="p-6">
            <dl className="divide-y divide-gray-50 rounded-xl border border-gray-100 p-4">
              <InfoRow label={t("simulateur.tableHeaders.cotisation")} value={formatMoney(level.cotisation, locale)} />
              <InfoRow label={t("simulateur.tableHeaders.commission")} value={formatMoney(level.commission, locale)} />
              <InfoRow label={t("simulateur.tableHeaders.cagnotte")} value={formatMoney(level.cagnotte, locale)} />
              <InfoRow
                label={t("simulateur.tableHeaders.potentiel")}
                value={formatRange(level.potentielMin, level.potentielMax, locale)}
              />
            </dl>

            {Array.isArray(advantages) && advantages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t("membre.coins.leaderboard.levelModal.advantagesTitle")}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {advantages.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span aria-hidden="true" className={clsx("mt-1.5 size-1.5 shrink-0 rounded-full bg-current", level.textClass)} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              {alreadyMember ? (
                <span className="inline-flex w-full items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500">
                  {t("membre.dashboard.comparison.alreadyMember")}
                </span>
              ) : (
                <ConfirmRequestPopover
                  triggerClassName="inline-flex w-full items-center justify-center rounded-lg bg-[#52A2DF] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  question={t("membre.dashboard.comparison.requestQuestion", {
                    level: t(`simulateur.levels.${level.key}.name`),
                  })}
                >
                  {t("membre.dashboard.comparison.requestButton")}
                </ConfirmRequestPopover>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
