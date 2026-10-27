// Import Dependencies
import { useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowUpTrayIcon, BoltIcon, DocumentTextIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import {
  PROOF_ACCEPT,
  PROOF_MAX_IMAGE_MB,
  PROOF_MAX_PDF_MB,
  formatFileSize,
  isImageProof,
  prepareProof,
} from "app/pages/Admin/Inscriptions/proofUtils";
import { URGENCY_REVIEW_HOURS, URGENCY_ROWS } from "app/pages/Admin/Tontine/priorityScore";
import { submitDeclaration } from "app/pages/Admin/Tontine/priorityStore";
import { currentMember } from "../currentMember";

// ----------------------------------------------------------------------

// "Déclarer mon urgence" (critère 1 du Score de Priorité DBC) : le membre
// choisit la situation qui lui correspond, la décrit et joint le justificatif
// demandé. Le Comité de Gouvernance a 72 h pour la valider ; tant qu'elle ne
// l'est pas, elle ne rapporte aucun point. Seule la catégorie « besoin futur »
// se passe de justificatif. Une nouvelle déclaration remplace la précédente.
export function UrgencyDeclareModal({ initial, onClose }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [category, setCategory] = useState(initial?.category && initial.category !== "none" ? initial.category : "productive");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [proof, setProof] = useState(initial?.proof ?? null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  const row = URGENCY_ROWS.find((r) => r.key === category);
  const missingProof = row.proof && !proof;
  const canSubmit = !busy && !missingProof && description.trim().length >= 10;

  const choose = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setProblem("");
    try {
      setProof(await prepareProof(file));
    } catch (failure) {
      if (failure?.code === "type") setProblem(t("tontinePriority.declare.errType"));
      else if (failure?.code === "size")
        setProblem(
          file.type === "application/pdf"
            ? t("tontinePriority.declare.errPdf", { mb: String(PROOF_MAX_PDF_MB).replace(".", ",") })
            : t("tontinePriority.declare.errImage", { mb: PROOF_MAX_IMAGE_MB }),
        );
      else setProblem(t("tontinePriority.declare.errRead"));
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    submitDeclaration(
      { matricule: currentMember.matricule, name: currentMember.name },
      { category, description, proof: row.proof ? proof : null },
    );
    onClose();
  };

  const ProofIcon = isImageProof(proof) ? PhotoIcon : DocumentTextIcon;

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                <BoltIcon aria-hidden="true" className="size-5 text-[#EE7115]" />
                {t("tontinePriority.declare.title")}
              </DialogTitle>
              <p className="mt-1 text-sm text-gray-500">{t("tontinePriority.declare.intro", { hours: URGENCY_REVIEW_HOURS })}</p>
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

          <form onSubmit={submit} className="mt-5 space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700">{t("tontinePriority.declare.category")}</legend>
              <div className="mt-2 space-y-2">
                {URGENCY_ROWS.filter((r) => r.key !== "none").map((r) => (
                  <label
                    key={r.key}
                    className={clsx(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      category === r.key ? "border-[#EE7115] bg-[#EE7115]/5" : "border-gray-200 hover:bg-gray-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="urgency-category"
                      value={r.key}
                      checked={category === r.key}
                      onChange={() => setCategory(r.key)}
                      className="mt-1 size-4 border-gray-300 text-[#EE7115] focus:ring-[#EE7115]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">{t(`tontinePriority.rows.urgency.${r.key}.label`)}</span>
                        <span className="text-xs font-bold text-[#EE7115]">{t("tontinePriority.points", { count: r.points })}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">{t(`tontinePriority.rows.urgency.${r.key}.detail`)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-semibold text-gray-700">
              {t("tontinePriority.declare.description")}
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("tontinePriority.declare.descriptionPlaceholder")}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-[#52A2DF]"
              />
            </label>

            {row.proof ? (
              <div>
                <p className="text-sm font-semibold text-gray-700">{t("tontinePriority.declare.proof")}</p>
                <p className="mt-0.5 text-xs text-gray-500">{t(`tontinePriority.rows.urgency.${category}.proof`)}</p>
                {proof ? (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#52A2DF]/30 bg-[#52A2DF]/5 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-[#EE7115] ring-1 ring-black/5">
                      <ProofIcon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{proof.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(proof.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProof(null)}
                      aria-label={t("tontinePriority.declare.removeProof")}
                      className="rounded-full p-2 text-gray-400 hover:bg-white hover:text-gray-700"
                    >
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                ) : (
                  <label className="relative mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[#52A2DF]/40 px-4 py-5 text-center transition-colors hover:bg-[#52A2DF]/5">
                    <input
                      ref={inputRef}
                      type="file"
                      accept={PROOF_ACCEPT}
                      disabled={busy}
                      onChange={(event) => choose(event.target.files)}
                      className="sr-only"
                    />
                    <ArrowUpTrayIcon aria-hidden="true" className="size-6 text-[#52A2DF]" />
                    <span className="text-sm font-semibold text-gray-800">
                      {busy ? t("tontinePriority.declare.preparing") : t("tontinePriority.declare.upload")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t("tontinePriority.declare.formats", { mb: String(PROOF_MAX_PDF_MB).replace(".", ",") })}
                    </span>
                  </label>
                )}
                {problem && <p className="mt-2 text-xs font-semibold text-red-600">{problem}</p>}
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">{t("tontinePriority.declare.noProofNeeded")}</p>
            )}

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
                disabled={!canSubmit}
                className="rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("tontinePriority.declare.submit")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
