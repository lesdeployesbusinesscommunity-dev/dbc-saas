// Import Dependencies
import { useTranslation } from "react-i18next";
import { ArrowDownTrayIcon, DocumentTextIcon, EyeIcon, PhotoIcon } from "@heroicons/react/24/solid";

// Local Imports
import { formatFileSize, isImageProof, downloadProof, openProof } from "./proofUtils";

// ----------------------------------------------------------------------

// Le justificatif d'activité d'une demande d'inscription, tel que
// l'administration et le leader d'antenne le consultent : nom et poids du
// fichier, "Voir" (nouvel onglet) et "Télécharger". Les demandes déposées
// avant l'ajout du justificatif n'en ont pas : on le dit.
export function ProofLink({ proof }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  if (!proof) {
    return <span className="font-normal text-amber-600">{t("registrationProof.missing")}</span>;
  }

  const Icon = isImageProof(proof) ? PhotoIcon : DocumentTextIcon;
  const button =
    "inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50";

  return (
    <span className="block">
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-gray-900">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-[#EE7115]" />
        <span className="min-w-0 truncate">{proof.name}</span>
        <span className="shrink-0 text-xs font-normal text-gray-400">{formatFileSize(proof.size, locale)}</span>
      </span>
      <span className="mt-1.5 flex flex-wrap gap-2">
        <button type="button" onClick={() => openProof(proof)} className={button}>
          <EyeIcon aria-hidden="true" className="size-3.5" />
          {t("registrationProof.view")}
        </button>
        <button type="button" onClick={() => downloadProof(proof)} className={button}>
          <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />
          {t("registrationProof.download")}
        </button>
      </span>
    </span>
  );
}
