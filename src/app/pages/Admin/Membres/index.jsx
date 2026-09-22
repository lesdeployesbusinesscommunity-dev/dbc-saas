// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ArrowPathIcon,
  CheckIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { listerEnAttente, valider } from "api/demandesInscription";
import { listerMembres } from "api/membres";

// ----------------------------------------------------------------------

// Espace admin "Membres" : demandes d'adhésion en attente de validation
// (POST /demandes-inscription, soumises via /inscription) + liste des
// membres déjà validés. Remplace l'ancienne version en mockData.js — voir
// le plan d'intégration API pour le détail des endpoints utilisés.
// Version volontairement simple (pas encore de recherche/filtre/pagination
// comme l'ancienne maquette) : l'objectif ici est des données réelles
// plutôt qu'une UI complète, qui pourra être enrichie ensuite.

function SectionCard({ title, icon: Icon, count, children }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-[#EE7115]/[0.1] text-[#EE7115]">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <p className="text-base font-bold text-gray-900">
          {title} <span className="font-normal text-gray-400">({count})</span>
        </p>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ValiderDialog({ demande, onCancel, onConfirm, isSubmitting, error }) {
  const [temporaryPassword, setTemporaryPassword] = useState("");

  if (!demande) return null;

  return (
    <Dialog open={Boolean(demande)} onClose={onCancel} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-sm font-bold text-gray-900">
            Valider la demande de {demande.firstName} {demande.lastName}
          </DialogTitle>
          <p className="mt-1 text-sm text-gray-500">
            Choisis un mot de passe temporaire : le compte sera créé
            immédiatement avec ce mot de passe.
          </p>

          <label className="mt-4 block text-sm font-semibold text-gray-700">
            Mot de passe temporaire
            <input
              type="text"
              autoFocus
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
            />
            <span className="mt-1 block text-xs font-normal text-gray-400">
              8 caractères minimum.
            </span>
          </label>

          {error && (
            <span className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              {error}
            </span>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting || temporaryPassword.trim().length < 8}
              onClick={() => onConfirm(temporaryPassword.trim())}
              className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
              Valider
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default function Membres() {
  const [demandes, setDemandes] = useState([]);
  const [membres, setMembres] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [demandeAValider, setDemandeAValider] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const charger = useCallback(async () => {
    setStatus("loading");
    try {
      const [demandesData, membresData] = await Promise.all([listerEnAttente(), listerMembres()]);
      setDemandes(demandesData);
      setMembres(membresData);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const handleConfirmValider = async (temporaryPassword) => {
    setIsValidating(true);
    setValidationError("");
    try {
      await valider(demandeAValider.id, { temporaryPassword });
      setDemandeAValider(null);
      await charger();
    } catch (err) {
      setValidationError(
        err.message === "api.errors.validation"
          ? "Mot de passe temporaire invalide"
          : "Impossible de valider cette demande pour le moment",
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Page title="Membres">
      <div className="p-4 sm:p-6">
        <p className="text-xl font-extrabold text-gray-900">Membres</p>
        <p className="mt-1 text-sm text-gray-500">
          Demandes d&apos;adhésion en attente et membres déjà validés.
        </p>

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger les données. Vérifie que le secret admin est
            correct et que le backend tourne.
          </div>
        )}

        {status === "ready" && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="En attente de validation" icon={ClockIcon} count={demandes.length}>
              {demandes.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune demande en attente.</p>
              ) : (
                <ul className="space-y-3">
                  {demandes.map((demande) => (
                    <li
                      key={demande.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {demande.firstName} {demande.lastName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {demande.phoneNumber} · {demande.country} · niveau {demande.desiredLevelCode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValidationError("");
                          setDemandeAValider(demande);
                        }}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#EE7115] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <CheckIcon aria-hidden="true" className="size-3.5" />
                        Valider
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Membres validés" icon={UserGroupIcon} count={membres.length}>
              {membres.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun membre validé pour l&apos;instant.</p>
              ) : (
                <ul className="space-y-3">
                  {membres.map((membre) => (
                    <li
                      key={membre.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {membre.firstName} {membre.lastName}
                          {!membre.firstName && !membre.lastName && membre.membershipNumber}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {membre.membershipNumber} · {membre.phoneNumber}
                          {membre.level ? ` · ${membre.level.name}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        {membre.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        )}
      </div>

      <ValiderDialog
        demande={demandeAValider}
        isSubmitting={isValidating}
        error={validationError}
        onCancel={() => setDemandeAValider(null)}
        onConfirm={handleConfirmValider}
      />
    </Page>
  );
}
