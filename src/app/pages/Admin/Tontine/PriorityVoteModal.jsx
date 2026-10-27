// Import Dependencies
import { useState } from "react";
import dayjs from "dayjs";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { HandThumbUpIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { currentAdmin } from "../currentAdmin";
import { useTontineFormat } from "./format";
import { RATING_ASPECTS, ratingState } from "./priorityScore";
import { extendRating, keyOf, setVeto, usePriorityStore } from "./priorityStore";

// ----------------------------------------------------------------------

const INPUT =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

// La recommandation d'un membre (critère 5) : la note que son mentor-parrain lui
// a donnée (en lecture seule : c'est le parrain qui la remplit, voir
// Membre/Tontine/RatingForm.jsx), le délai de 72 h — que l'administration peut
// renouveler —, et un éventuel veto, qui ne compte que s'il est motivé par écrit
// et reconnu valide par le Comité de Gouvernance.
export function PriorityVoteModal({ candidate, onClose }) {
  const { t } = useTranslation();
  const { day } = useTontineFormat();
  const priority = usePriorityStore();
  const key = keyOf({ matricule: candidate.matricule, name: candidate.name });
  const request = priority.ratings[key] ?? null;
  const state = ratingState(request);

  const [veto, setVetoOn] = useState(Boolean(candidate.veto));
  const [reason, setReason] = useState(candidate.veto?.reason ?? "");
  const [valid, setValid] = useState(Boolean(candidate.veto?.valid));

  const save = (event) => {
    event.preventDefault();
    setVeto({ matricule: candidate.matricule, name: candidate.name }, veto ? { reason, valid } : null, currentAdmin.name);
    onClose();
  };

  const when = (iso) => `${day(dayjs(iso))} ${dayjs(iso).format("HH:mm")}`;

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                <HandThumbUpIcon aria-hidden="true" className="size-5 text-emerald-600" />
                {t("tontinePriority.vote.title")}
              </DialogTitle>
              <p className="mt-0.5 text-sm text-gray-500">{candidate.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("tontinePriority.common.close")}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">
              {candidate.sponsorName
                ? t("tontinePriority.vote.sponsor", { name: candidate.sponsorName })
                : t("tontinePriority.vote.noSponsor")}
            </p>
            {request ? (
              <>
                <p className="mt-1 text-xs text-gray-500">
                  {t(`tontinePriority.vote.state.${state}`, {
                    date: when(request.dueAt),
                    ratedAt: request.ratedAt ? when(request.ratedAt) : "",
                    average: request.average,
                  })}
                </p>
                {state === "done" && (
                  <ul className="mt-3 space-y-1">
                    {RATING_ASPECTS.map((aspect) => (
                      <li key={aspect} className="flex justify-between text-xs">
                        <span>{t(`tontinePriority.rating.aspects.${aspect}.label`)}</span>
                        <span className="font-bold tabular-nums">{request.aspects[aspect]} / 10</span>
                      </li>
                    ))}
                  </ul>
                )}
                {state !== "done" && (
                  <button
                    type="button"
                    onClick={() => extendRating(key)}
                    className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    {t("tontinePriority.vote.extend")}
                  </button>
                )}
              </>
            ) : (
              <p className="mt-1 text-xs text-gray-500">{t("tontinePriority.vote.state.none")}</p>
            )}
          </div>

          <form onSubmit={save} className="mt-5 space-y-4">
            <div className="rounded-xl border border-gray-100 p-3">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={veto}
                  onChange={(event) => setVetoOn(event.target.checked)}
                  className="mt-0.5 size-4 rounded border-gray-300 text-[#EE7115] focus:ring-[#EE7115]"
                />
                <span className="font-semibold">{t("tontinePriority.vote.veto")}</span>
              </label>
              {veto && (
                <div className="mt-3 space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("tontinePriority.vote.reason")}
                    <textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} className={INPUT} />
                  </label>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={valid}
                      onChange={(event) => setValid(event.target.checked)}
                      className="mt-0.5 size-4 rounded border-gray-300 text-[#EE7115] focus:ring-[#EE7115]"
                    />
                    <span>{t("tontinePriority.vote.valid")}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t("tontinePriority.common.cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("tontinePriority.common.save")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
