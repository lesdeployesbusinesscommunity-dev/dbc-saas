// Import Dependencies
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

// Local Imports
import { valider } from "api/demandesInscription";

// ----------------------------------------------------------------------

// Genere un mot de passe temporaire lisible (10 caracteres, lettres +
// chiffres) — assez long pour passer la contrainte backend (8 caracteres
// minimum), simple a relire/retaper depuis WhatsApp.
function genererMotDePasse() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let mot = "";
  for (let i = 0; i < 10; i += 1) {
    mot += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return mot;
}

// Popover "Valider" d'une demande d'inscription : l'admin a deja verifie
// l'identite du visiteur hors-ligne (WhatsApp) — voir DemandesInscription/
// index.jsx — ce popover choisit juste le mot de passe temporaire (genere
// par defaut, modifiable) que POST /demandes-inscription/:id/valider crée
// en compte + membre. Une fois validee, affiche le matricule + le mot de
// passe pour que l'admin les transmette au membre (WhatsApp) — copiables
// en un clic, la fenetre ne se ferme pas toute seule pour laisser le temps
// de les transmettre.
export function ValidateModal({ open, demande, onClose, onValidated }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { membershipNumber, phoneNumber } | null
  const [copiedField, setCopiedField] = useState(null); // "membershipNumber" | "password" | null

  useEffect(() => {
    if (open) {
      setPassword(genererMotDePasse());
      setError("");
      setResult(null);
      setCopiedField(null);
    }
  }, [open]);

  if (!demande) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const reponse = await valider(demande.id, { temporaryPassword: password });
      setResult({ membershipNumber: reponse.membershipNumber, phoneNumber: reponse.phoneNumber });
      onValidated();
    } catch (err) {
      setError(err.message === "api.errors.validation" ? "Informations invalides" : "Impossible de valider cette demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  // navigator.clipboard peut echouer silencieusement (contexte non securise,
  // permission refusee...) : on retombe alors sur un <textarea> temporaire +
  // document.execCommand("copy") plutot que de laisser croire que ca a
  // marche. "copiedField" affiche une coche verte 1.5s pour confirmer.
  const copier = async (texte, field) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texte);
      } else {
        throw new Error("clipboard API indisponible");
      }
    } catch {
      const zoneTemporaire = document.createElement("textarea");
      zoneTemporaire.value = texte;
      zoneTemporaire.style.position = "fixed";
      zoneTemporaire.style.opacity = "0";
      document.body.appendChild(zoneTemporaire);
      zoneTemporaire.select();
      try {
        document.execCommand("copy");
      } catch {
        // Rien de plus a faire : le mot de passe reste visible a l'ecran,
        // copiable a la main en dernier recours.
      }
      document.body.removeChild(zoneTemporaire);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          {result ? (
            <>
              <div className="flex flex-col items-center text-center">
                <CheckCircleIcon aria-hidden="true" className="size-10 text-[#16A34A]" />
                <DialogTitle className="mt-2 text-sm font-bold text-gray-900">
                  {t("admin.demandesInscription.validateModal.successTitle")}
                </DialogTitle>
                <p className="mt-1 text-xs text-gray-500">
                  {t("admin.demandesInscription.validateModal.successHint")}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    {t("admin.demandesInscription.validateModal.membershipNumber")}
                  </p>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                    <span className="flex-1 font-mono text-sm text-gray-800">{result.membershipNumber}</span>
                    <button
                      type="button"
                      onClick={() => copier(result.membershipNumber, "membershipNumber")}
                      className={clsx(
                        "flex items-center gap-1 text-xs font-semibold",
                        copiedField === "membershipNumber" ? "text-[#16A34A]" : "text-gray-400 hover:text-[#52A2DF]",
                      )}
                    >
                      {copiedField === "membershipNumber" ? (
                        <>
                          <CheckIcon aria-hidden="true" className="size-4" />
                          {t("admin.demandesInscription.validateModal.copied")}
                        </>
                      ) : (
                        <ClipboardDocumentIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    {t("admin.demandesInscription.validateModal.temporaryPassword")}
                  </p>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                    <span className="flex-1 font-mono text-sm text-gray-800">{password}</span>
                    <button
                      type="button"
                      onClick={() => copier(password, "password")}
                      className={clsx(
                        "flex items-center gap-1 text-xs font-semibold",
                        copiedField === "password" ? "text-[#16A34A]" : "text-gray-400 hover:text-[#52A2DF]",
                      )}
                    >
                      {copiedField === "password" ? (
                        <>
                          <CheckIcon aria-hidden="true" className="size-4" />
                          {t("admin.demandesInscription.validateModal.copied")}
                        </>
                      ) : (
                        <ClipboardDocumentIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-lg bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("admin.demandesInscription.validateModal.close")}
              </button>
            </>
          ) : (
            <>
              <DialogTitle className="text-sm font-bold text-gray-900">
                {t("admin.demandesInscription.validateModal.title", {
                  name: `${demande.firstName} ${demande.lastName}`,
                })}
              </DialogTitle>
              <p className="mt-1 text-xs text-gray-500">
                {t("admin.demandesInscription.validateModal.hint")}
              </p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  {t("admin.demandesInscription.validateModal.temporaryPassword")}
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 font-mono text-sm text-gray-800 outline-none focus:border-[#52A2DF]"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(genererMotDePasse())}
                      title={t("admin.demandesInscription.validateModal.regenerate")}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                      <ArrowPathIcon aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </label>

                {error && (
                  <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                    {error}
                  </span>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    {t("admin.membres.confirm.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isSubmitting && <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />}
                    {t("admin.demandesInscription.validateModal.confirm")}
                  </button>
                </div>
              </form>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
