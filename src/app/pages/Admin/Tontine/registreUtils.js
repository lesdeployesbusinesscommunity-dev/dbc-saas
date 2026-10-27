// Import Dependencies
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------
// Petits outils partagés par les vues du registre (grand livre, journal,
// fiche de compte) : le nom d'un registre, le libellé d'une opération et
// l'export CSV.

// "Starter · Groupe A" ou "Starter · Sans groupe".
export function useLedgerTitle() {
  const { t } = useTranslation();
  return (ledger) =>
    [
      t(`simulateur.levels.${ledger.levelKey}.name`),
      ledger.kind === "waiting" ? t("admin.tontine.registre.noGroup") : t("admin.tontine.group", { letter: ledger.letter }),
    ].join(" · ");
}

// Le libellé d'une ligne du journal ou d'une fiche de compte :
// "Cotisation de septembre · tour 9", "Cagnotte du tour 4", etc.
export function operationLabel(t, operation, monthName) {
  const name = monthName(operation.dueMonth);
  // "de mars" mais "d'avril" : l'élision se règle ici, la langue du libellé dans les traductions.
  const monthLabel = t(
    /^[aeiouyhàâéèêîôû]/i.test(name) ? "admin.tontine.registre.labels.monthOfVowel" : "admin.tontine.registre.labels.monthOf",
    { month: name },
  );
  if (operation.kind === "out") {
    return t("admin.tontine.registre.labels.out", { tour: operation.tour });
  }
  const key = operation.kind === "due" ? "admin.tontine.registre.labels.due" : "admin.tontine.registre.labels.in";
  return operation.tour
    ? t(`${key}Tour`, { month: monthLabel, tour: operation.tour })
    : t(key, { month: monthLabel });
}

// Télécharge un tableau de lignes en CSV. Séparateur ";" et BOM UTF-8 pour que
// Excel (en français) ouvre le fichier directement, accents compris.
export function downloadCsv(filename, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const body = rows.map((row) => row.map(escape).join(";")).join("\r\n");
  const blob = new Blob([`\ufeff${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const slugify = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const JOURNAL_TYPES = ["all", "in", "out", "due"];

// Les opérations à afficher selon les filtres : type, groupe, période (le mois
// choisi ou tous les mois) et recherche. "matches" reçoit l'opération.
export function filterOperations(operations, { type, ledgerKey, scope, monthValue, matches }) {
  return operations.filter(
    (operation) =>
      (type === "all" || operation.kind === type) &&
      (ledgerKey === "all" || operation.ledgerKey === ledgerKey) &&
      (scope === "all" || operation.month === monthValue) &&
      (!matches || matches(operation)),
  );
}

export function totalsOf(operations) {
  return operations.reduce(
    (sum, operation) => ({
      in: sum.in + (operation.kind === "in" ? operation.amount : 0),
      out: sum.out + (operation.kind === "out" ? operation.amount : 0),
      due: sum.due + (operation.kind === "due" ? operation.amount : 0),
    }),
    { in: 0, out: 0, due: 0 },
  );
}
