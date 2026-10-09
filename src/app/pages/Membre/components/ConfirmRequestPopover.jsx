// Import Dependencies
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { submitRequest } from "app/pages/Notifications/notificationsStore";

// ----------------------------------------------------------------------

// Popover de confirmation réutilisable pour toute action qui ne fait
// qu'ENVOYER UNE DEMANDE (rien d'automatique derrière — un humain doit
// traiter la demande) : "Solliciter" un niveau depuis le tableau
// comparatif du Dashboard (voir Dashboard/index.jsx), ou "Recommencer"/
// "Passer au niveau supérieur" une fois un cycle de tontine terminé (voir
// Tontine/NextStepButton.jsx). Même déroulé partout : un clic ouvre le
// popover avec la question, "Oui" bascule le panneau sur un message de
// confirmation ("on vous recontacte par email"), "Annuler" ferme sans
// rien faire. Pas de vrai appel API pour l'instant (rien n'est branché au
// backend) — seul le texte de confirmation est affiché.
//
// Panneau volontairement large (w-96) et texte en taille normale (pas
// "text-xs") plutôt qu'une petite bulle d'aide : affiché au-dessus d'un
// tableau dense (colonne "Solliciter"), il doit rester facile à lire du
// premier coup d'œil.
//
// Un voile semi-transparent assombrit tout le reste de la page pendant que
// le popover est ouvert, pour bien le détacher du tableau derrière. Ce
// voile est rendu via un portail dans <body> (createPortal), PAS imbriqué
// à l'intérieur du panneau : testé avec un rendu réel, le mettre à
// l'intérieur du panneau (même avec un z-index plus bas) le faisait
// peindre par-dessus le fond blanc du panneau lui-même (un enfant
// "position: fixed" couvre tout l'écran, y compris le rectangle du
// panneau, et passe donc aussi au-dessus de SON fond blanc) — résultat :
// toute la carte paraissait grisée au lieu de ressortir en blanc net.
// En sortant le voile du panneau (vrai frère dans le DOM, pas un enfant)
// et en lui donnant un z-index (z-40) inférieur à celui du panneau (z-50),
// le panneau reste bien blanc et net au-dessus du voile. Clic sur le
// voile = referme le popover.
//
// "request" (facultatif) : { type, ...détails } — la demande qui part
// réellement quand le membre répond "Oui" (voir Notifications/
// notificationsStore.js : "submitRequest"). L'admin la reçoit alors dans sa
// page Notifications, avec le profil du membre, et peut la valider, la
// refuser ou écrire au membre. Types utilisés ici : "level" ({ levelKey })
// et "event" ({ eventId, date }). Sans "request", le popover reste une
// simple confirmation d'affichage.
//
// "onOpenChange" (facultatif) : appelé avec true/false quand le popover
// s'ouvre/se ferme — pour qu'un parent qui bouge tout seul (le carrousel
// d'actualités du Dashboard, voir Dashboard/NewsCarousel.jsx) se mette en
// pause tant que la fenêtre est ouverte. Doit être une fonction stable
// (ex: un setState).
function OpenWatcher({ open, onChange }) {
  useEffect(() => {
    onChange(open);
    return () => onChange(false);
  }, [open, onChange]);
  return null;
}

export function ConfirmRequestPopover({
  children,
  triggerClassName,
  question,
  disabled = false,
  panelClassName,
  onOpenChange,
  request,
}) {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          {onOpenChange && <OpenWatcher open={open} onChange={onOpenChange} />}
          <PopoverButton
            disabled={disabled}
            onClick={() => setConfirmed(false)}
            className={clsx(triggerClassName, disabled && "cursor-not-allowed opacity-40")}
          >
            {children}
          </PopoverButton>

          {open &&
            !disabled &&
            createPortal(
              <div
                aria-hidden="true"
                onClick={() => close()}
                className="fixed inset-0 z-40 bg-gray-900/40"
              />,
              document.body,
            )}

          {!disabled && (
            <PopoverPanel
              anchor={{ to: "bottom end", gap: 10 }}
              className={clsx(
                "z-50 w-96 max-w-[90vw] rounded-2xl border border-black/5 bg-white p-6 shadow-2xl",
                panelClassName,
              )}
            >
              {!confirmed ? (
                <>
                  <p className="text-base font-semibold leading-snug text-gray-900">
                    {question}
                  </p>
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => close()}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      {t("membre.common.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (request) submitRequest(request);
                        setConfirmed(true);
                      }}
                      className="rounded-lg bg-[#52A2DF] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {t("membre.common.yes")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <CheckCircleIcon aria-hidden="true" className="size-7 shrink-0 text-green-600" />
                  <p className="text-sm font-semibold leading-snug text-gray-700">
                    {t("membre.common.requestConfirmation")}
                  </p>
                </div>
              )}
            </PopoverPanel>
          )}
        </>
      )}
    </Popover>
  );
}
