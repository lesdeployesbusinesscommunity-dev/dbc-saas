// Import Dependencies
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowPathIcon,
  CheckIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { ConfirmDialog } from "../Membres/ConfirmDialog";
import { ValidateModal } from "./ValidateModal";
import { normalizeSearchText } from "../searchUtils";
import { listerEnAttente, rejeter } from "api/demandesInscription";

// ----------------------------------------------------------------------

// Page "Demandes d'inscription" (/admin/demandes-inscription) : les
// demandes soumises via le formulaire public (/inscription), en attente
// qu'un admin vérifie l'identité du visiteur hors-ligne (WhatsApp — voir
// mémoire "project_flux_onboarding_reel", il n'y a pas d'auto-inscription
// en libre-service) puis "Valide" (choisit un mot de passe temporaire,
// crée le compte + membre en un geste — voir ValidateModal.jsx) ou
// "Rejette" une demande.
export default function DemandesInscription() {
  const { t } = useTranslation();
  const [demandes, setDemandes] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [search, setSearch] = useState("");
  const [validating, setValidating] = useState(null); // demande | null
  const [rejecting, setRejecting] = useState(null); // demande | null
  const [isRejecting, setIsRejecting] = useState(false);

  const charger = useCallback(async () => {
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    try {
      const donnees = await listerEnAttente();
      setDemandes(donnees);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const list = demandes.filter((demande) => {
    const query = normalizeSearchText(search);
    if (!query) return true;
    return (
      normalizeSearchText(`${demande.firstName} ${demande.lastName}`).includes(query) ||
      normalizeSearchText(demande.phoneNumber).includes(query)
    );
  });

  const confirmReject = async () => {
    if (!rejecting) return;
    setIsRejecting(true);
    try {
      await rejeter(rejecting.id);
      setRejecting(null);
      await charger();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Page title={`Admin – ${t("admin.demandesInscription.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.demandesInscription.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.demandesInscription.searchPlaceholder")}
        />

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger les demandes pour le moment.
          </div>
        )}

        {status === "ready" &&
          (list.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
              {t("admin.demandesInscription.empty")}
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="whitespace-nowrap px-4 py-3">{t("admin.demandesInscription.columns.name")}</th>
                    <th className="whitespace-nowrap px-4 py-3">{t("admin.demandesInscription.columns.phone")}</th>
                    <th className="whitespace-nowrap px-4 py-3">{t("admin.demandesInscription.columns.location")}</th>
                    <th className="whitespace-nowrap px-4 py-3">{t("admin.demandesInscription.columns.level")}</th>
                    <th className="whitespace-nowrap px-4 py-3">{t("admin.demandesInscription.columns.sponsor")}</th>
                    <th className="whitespace-nowrap px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((demande) => (
                    <tr key={demande.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          {demande.firstName} {demande.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{demande.profession}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{demande.phoneNumber}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {[demande.city, demande.country].filter(Boolean).join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{demande.desiredLevelCode}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {demande.sponsorCode || t("admin.membres.table.noSponsor")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRejecting(demande)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            <XMarkIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.demandesInscription.reject")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setValidating(demande)}
                            className="flex items-center gap-1 rounded-lg bg-[#52A2DF] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                          >
                            <CheckIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.demandesInscription.validate")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      <ValidateModal
        open={!!validating}
        demande={validating}
        onClose={() => {
          setValidating(null);
          charger();
        }}
        onValidated={charger}
      />

      <ConfirmDialog
        open={!!rejecting}
        title={t("admin.demandesInscription.confirmReject.title")}
        description={t("admin.demandesInscription.confirmReject.description", {
          name: rejecting ? `${rejecting.firstName} ${rejecting.lastName}` : "",
        })}
        confirmLabel={isRejecting ? "…" : t("admin.demandesInscription.confirmReject.confirmLabel")}
        tone="danger"
        onConfirm={confirmReject}
        onCancel={() => setRejecting(null)}
      />
    </Page>
  );
}
