// Import Dependencies
import { useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { ACCOUNTS } from "./bankData";
import { CSV_TEMPLATE, readBankCsv } from "./bankImport";
import { addImportedRows } from "./bankStore";

// ----------------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024;

function downloadTemplate() {
  const blob = new Blob([`\uFEFF${CSV_TEMPLATE}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modele-historique-bancaire.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// Fenêtre d'import : on choisit un fichier CSV, on voit ce qui sera ajouté (et ce
// qui sera ignoré) AVANT de confirmer.
export function ImportDialog({ open, onClose, importedRows }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState("");

  const reset = () => {
    setFileName("");
    setResult(null);
    setFailure("");
  };
  const close = () => {
    reset();
    onClose();
  };

  const pick = async (file) => {
    reset();
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_BYTES) {
      setFailure("size");
      return;
    }
    try {
      const parsed = readBankCsv(await file.text(), importedRows);
      if (parsed.fatal) setFailure(parsed.fatal);
      else setResult(parsed);
    } catch {
      setFailure("read");
    }
  };

  const confirm = () => {
    if (!result?.rows.length) return;
    addImportedRows(result.rows);
    close();
  };

  const unsigned = result
    ? result.rows.filter((row) => ACCOUNTS.find((item) => item.id === row.account)?.locked && row.amount < 0 && row.signers.length < 2).length
    : 0;

  return (
    <Dialog open={open} onClose={close} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto flex w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-bold text-gray-900">{t("admin.finance.bank.import.title")}</DialogTitle>
            <button
              type="button"
              onClick={close}
              aria-label={t("admin.finance.bank.import.close")}
              className="flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <p className="mt-2 text-sm text-gray-600">{t("admin.finance.bank.import.intro")}</p>
          <p className="mt-2 text-xs text-gray-500">{t("admin.finance.bank.import.columns")}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt,text/csv"
              className="sr-only"
              onChange={(event) => {
                pick(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d9650f]"
            >
              <DocumentArrowUpIcon aria-hidden="true" className="size-4" />
              {t("admin.finance.bank.import.choose")}
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
            >
              <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
              {t("admin.finance.bank.import.template")}
            </button>
            {fileName && <span className="truncate text-sm text-gray-500">{fileName}</span>}
          </div>

          {failure && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {t(`admin.finance.bank.import.fail.${failure}`)}
            </p>
          )}

          {result && (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-green-50 px-3 py-2">
                  <p className="text-xs font-semibold text-green-700">{t("admin.finance.bank.import.toAdd")}</p>
                  <p className="text-lg font-bold tabular-nums text-green-800">{result.rows.length}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-xs font-semibold text-gray-600">{t("admin.finance.bank.import.duplicates")}</p>
                  <p className="text-lg font-bold tabular-nums text-gray-900">{result.duplicates}</p>
                </div>
                <div className={clsx("rounded-xl px-3 py-2", result.errors.length ? "bg-red-50" : "bg-gray-50")}>
                  <p className={clsx("text-xs font-semibold", result.errors.length ? "text-red-700" : "text-gray-600")}>
                    {t("admin.finance.bank.import.errors")}
                  </p>
                  <p className={clsx("text-lg font-bold tabular-nums", result.errors.length ? "text-red-800" : "text-gray-900")}>
                    {result.errors.length}
                  </p>
                </div>
              </div>

              {unsigned > 0 && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  {t("admin.finance.bank.import.unsigned", { count: unsigned })}
                </p>
              )}

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-100 p-3 text-xs text-red-800">
                  <p className="font-semibold">{t("admin.finance.bank.import.errorList")}</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.slice(0, 5).map((item) => (
                      <li key={item.line}>{t("admin.finance.bank.import.errorLine", { line: item.line, reason: t(`admin.finance.bank.import.reason.${item.error}`) })}</li>
                    ))}
                  </ul>
                  {result.errors.length > 5 && <p className="mt-1">{t("admin.finance.bank.import.moreErrors", { count: result.errors.length - 5 })}</p>}
                </div>
              )}

              {result.rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 font-bold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th scope="col" className="px-3 py-2">{t("admin.finance.bank.history.col.date")}</th>
                        <th scope="col" className="px-2 py-2">{t("admin.finance.bank.history.col.account")}</th>
                        <th scope="col" className="px-2 py-2">{t("admin.finance.bank.history.col.label")}</th>
                        <th scope="col" className="px-2 py-2 text-right">{t("admin.finance.bank.history.col.amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.rows.slice(0, 5).map((row, index) => (
                        <tr key={`${row.date}-${index}`}>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-600">{row.date}</td>
                          <td className="px-2 py-2 font-bold text-gray-700">{row.account}</td>
                          <td className="px-2 py-2 text-gray-900">{row.label}</td>
                          <td className={clsx("whitespace-nowrap px-2 py-2 text-right font-bold tabular-nums", row.amount > 0 ? "text-green-700" : "text-red-700")}>
                            {row.amount > 0 ? "+" : "−"}
                            {formatMoney(Math.abs(row.amount), locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result.rows.length > 5 && (
                <p className="text-xs text-gray-400">{t("admin.finance.bank.import.previewMore", { count: result.rows.length - 5 })}</p>
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">{t("admin.finance.bank.import.replaces")}</p>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              {t("admin.finance.bank.import.cancel")}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!result?.rows.length}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#12873e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircleIcon aria-hidden="true" className="size-4" />
              {t("admin.finance.bank.import.confirm", { count: result?.rows.length ?? 0 })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
