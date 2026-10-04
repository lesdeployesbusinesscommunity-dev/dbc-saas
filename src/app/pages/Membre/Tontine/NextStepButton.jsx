// Import Dependencies
import { useState } from "react";
import { createPortal } from "react-dom";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ArrowTrendingUpIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { useMemberLevel } from "../context/MemberLevelContext";
import { isCycleComplete } from "./mockData";

// ----------------------------------------------------------------------

// Bouton "Choisir la suite" : actif uniquement une fois le cycle de 12
// tours du niveau consulté entièrement clôturé (voir mockData.js :
// "isCycleComplete" — le niveau Bâtisseur est volontairement calé comme
// déjà terminé pour pouvoir tester ce bouton sans attendre un an réel).
// Au clic, propose 2 choix ("Recommencer cette tontine" ou "Passer au
// niveau supérieur" — masqué si déjà au dernier niveau), chacun demandant
// confirmation avant d'afficher le message "on vous recontacte par
// email" (voir components/ConfirmRequestPopover.jsx pour le même principe
// ailleurs — ici un seul Popover gère les 2 étapes à la suite plutôt que
// d'en imbriquer deux, plus simple et plus net).
//
// Même voile assombrissant que ConfirmRequestPopover, pour la même
// raison (le séparer nettement du reste de la page) — et rendu de la
// même façon, via un portail dans <body> (createPortal) plutôt
// qu'imbriqué dans le panneau : un enfant "position: fixed" à l'intérieur
// du panneau peint par-dessus le fond blanc du panneau lui-même (vérifié
// avec un rendu réel), ce qui grisait toute la carte au lieu de la faire
// ressortir. Voile en z-40, panneau en z-50.
export function NextStepButton() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const [step, setStep] = useState("choices"); // "choices" | "confirm" | "done"
  const [choice, setChoice] = useState(null); // "restart" | "levelUp"

  const cycleComplete = isCycleComplete(activeLevelKey);
  const levelIndex = levels.findIndex((level) => level.key === activeLevelKey);
  const canLevelUp = levelIndex >= 0 && levelIndex < levels.length - 1;
  const nextLevel = canLevelUp ? levels[levelIndex + 1] : null;

  const reset = () => {
    setStep("choices");
    setChoice(null);
  };

  const pick = (value) => {
    setChoice(value);
    setStep("confirm");
  };

  const question =
    choice === "restart"
      ? t("membre.tontine.nextStep.restartQuestion")
      : nextLevel
        ? t("membre.tontine.nextStep.levelUpQuestion", {
            level: t(`simulateur.levels.${nextLevel.key}.name`),
          })
        : "";

  return (
    <div className="mt-8 flex justify-end">
      <Popover className="relative">
        {({ open, close }) => (
          <>
            <PopoverButton
              disabled={!cycleComplete}
              onClick={reset}
              title={!cycleComplete ? t("membre.tontine.nextStep.disabledHint") : undefined}
              className={clsx(
                "flex items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90",
                !cycleComplete && "cursor-not-allowed opacity-40 hover:opacity-40",
              )}
            >
              {t("membre.tontine.nextStep.button")}
            </PopoverButton>

            {open &&
              cycleComplete &&
              createPortal(
                <div
                  aria-hidden="true"
                  onClick={() => close()}
                  className="fixed inset-0 z-40 bg-gray-900/40"
                />,
                document.body,
              )}

            {cycleComplete && (
              <PopoverPanel
                anchor={{ to: "bottom end", gap: 10 }}
                className="z-50 w-96 max-w-[90vw] rounded-2xl border border-black/5 bg-white p-6 shadow-2xl"
              >
                {step === "done" ? (
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon aria-hidden="true" className="size-7 shrink-0 text-green-600" />
                    <p className="text-sm font-semibold leading-snug text-gray-700">
                      {t("membre.common.requestConfirmation")}
                    </p>
                  </div>
                ) : step === "confirm" ? (
                  <>
                    <p className="text-base font-semibold leading-snug text-gray-900">
                      {question}
                    </p>
                    <div className="mt-5 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setStep("choices")}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                      >
                        {t("membre.common.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("done")}
                        className="rounded-lg bg-[#52A2DF] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        {t("membre.common.yes")}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t("membre.tontine.nextStep.title")}
                    </p>
                    <button
                      type="button"
                      onClick={() => pick("restart")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <ArrowPathIcon aria-hidden="true" className="size-5 shrink-0 text-[#52A2DF]" />
                      {t("membre.tontine.nextStep.restart")}
                    </button>
                    {canLevelUp && (
                      <button
                        type="button"
                        onClick={() => pick("levelUp")}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <ArrowTrendingUpIcon aria-hidden="true" className="size-5 shrink-0 text-[#EE7115]" />
                        {t("membre.tontine.nextStep.levelUp")}
                      </button>
                    )}
                  </div>
                )}
              </PopoverPanel>
            )}
          </>
        )}
      </Popover>
    </div>
  );
}
