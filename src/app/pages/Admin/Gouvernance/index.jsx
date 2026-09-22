// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  UserIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { listerPoles, assignerSiege } from "api/gouvernance";
import { listerMembres } from "api/membres";
import { listerAntennes } from "api/communaute";

// ----------------------------------------------------------------------

// Page "Gestion de la gouvernance" (/admin/gouvernance) : pôles réels
// (GET /gouvernance/poles, nouveau module backend — il n'existait aucune
// notion de "pôle"/"siège" avant) + réseau des antennes (GET
// /communaute/antennes, qui a déjà leader/coordinateur). Plus simple que
// l'ancienne maquette (pas de création/suppression de pôle, pas de fiche
// détaillée par titulaire) : l'objectif ici est des données réelles.

function SeatRow({ seat, onAssignClick }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
          <UserIcon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800">{seat.title}</p>
          <p className="truncate text-xs text-gray-500">
            {seat.membershipNumber ?? "Poste vacant"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAssignClick(seat)}
        className="shrink-0 rounded-lg border border-[#52A2DF]/[0.32] px-3 py-1.5 text-xs font-semibold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.1]"
      >
        {seat.memberId ? "Changer" : "Assigner"}
      </button>
    </div>
  );
}

function AssignSeatDialog({ seat, membres, onClose, onConfirm, isSubmitting }) {
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    if (seat) setSelectedMemberId(seat.memberId ?? "");
  }, [seat]);

  if (!seat) return null;

  return (
    <Dialog open={Boolean(seat)} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-sm font-bold text-gray-900">{seat.title}</DialogTitle>
          <p className="mt-1 text-sm text-gray-500">
            Choisis un membre pour ce siège, ou laisse vide pour le libérer.
          </p>

          <label className="mt-4 block text-sm font-semibold text-gray-700">
            Membre
            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
            >
              <option value="">— Poste vacant —</option>
              {membres.map((membre) => (
                <option key={membre.id} value={membre.id}>
                  {membre.membershipNumber}
                  {membre.firstName ? ` — ${membre.firstName} ${membre.lastName}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirm(selectedMemberId)}
              className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
              Confirmer
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default function Gouvernance() {
  const [poles, setPoles] = useState([]);
  const [membres, setMembres] = useState([]);
  const [antennes, setAntennes] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [seatToAssign, setSeatToAssign] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charger = useCallback(async () => {
    setStatus("loading");
    try {
      const [polesData, membresData, antennesData] = await Promise.all([
        listerPoles(),
        listerMembres(),
        listerAntennes(),
      ]);
      setPoles(polesData);
      setMembres(membresData);
      setAntennes(antennesData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const handleConfirmAssign = async (memberId) => {
    setIsSubmitting(true);
    try {
      await assignerSiege(seatToAssign.id, memberId);
      setSeatToAssign(null);
      await charger();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page title="Admin – Gouvernance">
      <div className="p-6 lg:p-8">
        <AdminTopBar title="Gouvernance" />

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger la gouvernance pour le moment.
          </div>
        )}

        {status === "ready" && (
          <div className="mt-6 space-y-6">
            {poles.map((pole) => (
              <div key={pole.id} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-base font-bold text-gray-900">{pole.name}</p>
                <p className="mt-1 text-sm text-gray-500">{pole.description}</p>
                <div className="mt-4 space-y-2.5">
                  {pole.seats.map((seat) => (
                    <SeatRow key={seat.id} seat={seat} onAssignClick={setSeatToAssign} />
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-base font-bold text-gray-900">Chapter Leaders Network</p>
              <p className="mt-1 text-sm text-gray-500">
                Legend Leader + Coordinator par antenne locale (lecture seule
                pour l&apos;instant — assignation à venir).
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {antennes.map((antenne) => (
                  <div key={antenne.id} className="rounded-xl border border-black/5 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <MapPinIcon aria-hidden="true" className="size-3.5 text-[#EE7115]" />
                      {antenne.city}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Leader : {antenne.leaderMembreId ?? "vacant"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Coordinateur : {antenne.coordinatorMembreId ?? "vacant"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <AssignSeatDialog
        seat={seatToAssign}
        membres={membres}
        isSubmitting={isSubmitting}
        onClose={() => setSeatToAssign(null)}
        onConfirm={handleConfirmAssign}
      />
    </Page>
  );
}
